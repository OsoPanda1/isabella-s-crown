import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/evolution")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const domain = url.searchParams.get("domain")?.slice(0, 64) ?? undefined;
        const ev = await import("@/lib/isabella/genesis/evolution");
        const all = ev.generateControls();
        const controls = domain ? all.filter((c) => c.domain === domain) : all;
        return Response.json({
          total: all.length,
          digest: ev.controlMatrixDigest(all),
          summary: ev.controlSummary(controls),
          count: controls.length,
          controls,
        });
      },
    },
  },
});
