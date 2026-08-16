import { PRESETS, type PresetId, type RoutingDecision } from "@/lib/crown-ui";
import { useI18n } from "@/lib/i18n";
import { ModuleRail } from "./ModuleRail";

const POLICY_COLOR: Record<string, string> = {
  allowed: "var(--argus)",
  requires_approval: "var(--orion)",
  denied: "var(--destructive)",
};

export function TelemetryPanel({
  presetId,
  setPresetId,
  decision,
  tokens,
  turns,
  isProcessing,
}: {
  presetId: PresetId;
  setPresetId: (id: PresetId) => void;
  decision: RoutingDecision | null;
  tokens: number;
  turns: number;
  isProcessing: boolean;
}) {
  const { t } = useI18n();
  const policy = decision?.policy ?? "allowed";

  return (
    <aside className="flex flex-col gap-4">
      <section className="glass rounded-2xl p-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("panel.preset")}
        </h2>
        <div className="mt-3 space-y-1.5">
          {PRESETS.map((p) => {
            const on = p.id === presetId;
            return (
              <button
                key={p.id}
                onClick={() => setPresetId(p.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-all duration-300 ${
                  on
                    ? "glow-ring border-primary/60 bg-secondary/50"
                    : "border-border/50 hover:bg-secondary/25"
                }`}
              >
                <span
                  className={`block text-[12.5px] ${on ? "text-platinum" : "text-foreground/80"}`}
                >
                  {t(`preset.${p.id}`)}
                </span>
                <span className="block text-[10.5px] leading-snug text-muted-foreground">
                  {t(`preset.${p.id}.tag`)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("panel.policyGate")}
        </h2>
        <p
          className="mt-2.5 font-mono text-[12px] tracking-[0.16em]"
          style={{ color: POLICY_COLOR[policy] }}
        >
          {t(`policy.${policy}`)}
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          {decision?.policyReason ?? t("panel.noCycle")}
        </p>
        <div className="mt-3 space-y-1">
          {(decision?.rulesChecked ?? []).map((r: string) => (
            <p key={r} className="font-mono text-[9.5px] tracking-[0.08em] text-muted-foreground/80">
              ✓ {r}
            </p>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("panel.modules")}
        </h2>
        <ModuleRail decision={decision} active={isProcessing} />
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("panel.metrics")}
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2.5">
          {[
            [t("panel.cycles"), String(turns)],
            [t("panel.fragments"), String(tokens)],
            [
              t("panel.governance"),
              decision ? `${(decision.governanceScore * 100).toFixed(0)}%` : "—",
            ],
            [
              t("panel.certainty"),
              decision ? `${(decision.epistemicCertainty * 100).toFixed(0)}%` : "—",
            ],
            [t("panel.latency"), decision ? `${decision.latencyMs} ms` : "—"],
            [t("panel.risk"), decision ? decision.risk.toUpperCase() : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                {k}
              </dt>
              <dd className="font-mono text-[13px] text-platinum">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 border-t border-border/40 pt-2.5 font-mono text-[9.5px] leading-relaxed tracking-[0.12em] text-muted-foreground">
          {t("panel.scopes")}: {(decision?.memoryScopes ?? ["turn"]).join(" · ").toUpperCase()}
        </p>
      </section>
    </aside>
  );
}
