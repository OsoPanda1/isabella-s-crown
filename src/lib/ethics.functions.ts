import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface UiEthicalAudit {
  valid: boolean;
  score: number;
  threshold: number;
  hash: string;
  auditedAt: string;
  flags: { code: string; severity: "info" | "warning" | "critical"; message: string }[];
}

/** ARGUS · auditoría ética con huella SHA-256 de cada síntesis. */
export const auditSynthesis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ content: z.string().min(1).max(50000) }).parse(input),
  )
  .handler(async ({ data }): Promise<UiEthicalAudit> => {
    const { EthicalValidator } = await import("./isabella/pake/EthicalValidator");
    const r = EthicalValidator.auditContent(data.content, { requireEthicalAnchors: false });
    return {
      valid: r.valid,
      score: r.score,
      threshold: r.threshold,
      hash: r.hash,
      auditedAt: r.auditedAt,
      flags: r.flags.map((f) => ({ code: f.code, severity: f.severity, message: f.message })),
    };
  });
