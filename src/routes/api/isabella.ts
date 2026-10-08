import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  system: z.string().min(1).max(8000),
  temperature: z.number().min(0).max(2).default(0.8),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(12000),
      }),
    )
    .min(1)
    .max(40),
});

export const Route = createFileRoute("/api/isabella")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "El núcleo de inferencia no está configurado." }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Percepción inválida." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const { system, messages, temperature } = parsed.data;

        // Genesis Policy Gate: AEGIS (inyección/seguridad) + Companion Safety sobre la última entrada humana.
        const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const { inspectAegis } = await import("@/lib/isabella/genesis/security/aegis");
        const { evaluateCompanionSafety } = await import("@/lib/isabella/genesis/companion/safety");
        const aegis = inspectAegis(lastUser);
        const companion = evaluateCompanionSafety(lastUser);
        if (aegis.decision === "BLOCK" || companion.action === "BLOCK") {
          const reasons = [
            ...aegis.findings.map((f) => f.kind),
            ...companion.findings.map((f) => f.domain),
          ].join(", ");
          return new Response(
            JSON.stringify({
              error: `Policy Gate (AEGIS/Genesis) denegó la entrada: ${reasons || "riesgo alto"}.`,
            }),
            { status: 403, headers: { "content-type": "application/json" } },
          );
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            stream: true,
            temperature,
            messages: [{ role: "system", content: system }, ...messages],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text();
          console.error(`Isabella gateway error [${upstream.status}]: ${detail}`);
          const message =
            upstream.status === 429
              ? "Límite de inferencia alcanzado. Reintenta en unos instantes."
              : upstream.status === 402
                ? "Créditos de IA agotados en el espacio de trabajo."
                : `Fallo del núcleo de inferencia [${upstream.status}].`;
          return new Response(JSON.stringify({ error: message }), {
            status: upstream.status,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
