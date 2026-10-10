import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  domain: z.string().max(64).optional(),
  state: z.enum(["declared", "wired", "verified", "blocked"]).optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const getControlMatrix = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => input.parse(d ?? {}))
  .handler(async ({ data }) => {
    const ev = await import("@/lib/isabella/genesis/evolution");
    const all = ev.generateControls();
    const summary = ev.controlSummary(all);
    const domains = Array.from(new Set(all.map((c) => c.domain)));
    let filtered = all;
    if (data.domain) filtered = filtered.filter((c) => c.domain === data.domain);
    if (data.state) filtered = filtered.filter((c) => c.state === data.state);
    return {
      total: all.length,
      digest: ev.controlMatrixDigest(all),
      summary,
      domains,
      matched: filtered.length,
      controls: filtered.slice(0, data.limit).map((c) => ({
        id: c.id, plane: c.plane.name, domain: c.domain, axis: c.axis, primitive: c.primitive, state: c.state,
      })),
    };
  });
