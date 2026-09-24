import { useCallback, useRef, useState } from "react";
import {
  PRESETS,
  buildSystemPrompt,
  route,
  type Preset,
  type PresetId,
  type RoutingDecision,
} from "./crown-ui";
import { useI18n } from "./i18n";
import { auditSynthesis, type UiEthicalAudit } from "./ethics.functions";

export interface TerminalMessage {
  id: string;
  role: "user" | "isabella" | "system";
  content: string;
  timestamp: string;
  decision?: RoutingDecision;
  streaming?: boolean;
  error?: boolean;
  audit?: UiEthicalAudit;
}

const uid = () => Math.random().toString(36).slice(2, 11);

export function useIsabella() {
  const { lang, t } = useI18n();
  const now = useCallback(
    () =>
      new Date().toLocaleTimeString(lang === "es" ? "es-MX" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [lang],
  );

  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      id: "boot",
      role: "system",
      content: "",
      timestamp: "",
    },
  ]);
  const [presetId, setPresetId] = useState<PresetId>("prime");
  const [isProcessing, setIsProcessing] = useState(false);
  const [decision, setDecision] = useState<RoutingDecision | null>(null);
  const [tokens, setTokens] = useState(0);
  const [audit, setAudit] = useState<UiEthicalAudit | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const preset: Preset = PRESETS.find((p) => p.id === presetId) ?? (PRESETS[0] as Preset);

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text || isProcessing) return;

      const routing = route(text, preset, lang);
      setDecision(routing);

      const userMsg: TerminalMessage = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: now(),
      };
      const replyId = uid();

      const history = [...messages, userMsg]
        .filter((m) => m.role !== "system" && !m.error && m.content)
        .slice(-16)
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: replyId,
          role: "isabella",
          content: "",
          timestamp: now(),
          decision: routing,
          streaming: true,
        },
      ]);
      setIsProcessing(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/isabella", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            system: buildSystemPrompt(routing, preset, lang),
            temperature: preset.temperature,
            messages: history,
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.json().catch(() => ({ error: t("sys.fail") }));
          throw new Error(detail.error ?? t("sys.fail"));
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json.choices?.[0]?.delta?.content;
              if (delta) {
                acc += delta;
                setTokens((tk) => tk + 1);
                setMessages((prev) =>
                  prev.map((m) => (m.id === replyId ? { ...m, content: acc } : m)),
                );
              }
            } catch {
              /* fragmento parcial */
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? { ...m, streaming: false, content: acc || t("sys.silence") }
              : m,
          ),
        );

        if (acc) {
          try {
            const result = await auditSynthesis({ data: { content: acc } });
            setAudit(result);
            setMessages((prev) =>
              prev.map((m) => (m.id === replyId ? { ...m, audit: result } : m)),
            );
          } catch (auditErr) {
            console.error("ARGUS audit failed", auditErr);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t("sys.interrupt");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? { ...m, streaming: false, error: true, content: `ARGUS :: ${message}` }
              : m,
          ),
        );
      } finally {
        setIsProcessing(false);
        abortRef.current = null;
      }
    },
    [isProcessing, messages, preset, lang, now, t],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([
      {
        id: uid(),
        role: "system",
        content: t("sys.purged"),
        timestamp: now(),
      },
    ]);
    setDecision(null);
    setTokens(0);
    setAudit(null);
  }, [now, t]);

  return {
    messages,
    send,
    stop,
    reset,
    isProcessing,
    preset,
    presetId,
    setPresetId,
    decision,
    tokens,
    audit,
  };
}
