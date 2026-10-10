import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const runSystemsDemo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const { routeMoe } = await import("@/lib/isabella/moe/router");
    const { MagpieFabric } = await import("@/lib/isabella/magpie/planes");
    const { IsaxVerifier, signRequest, sha256 } = await import("@/lib/isabella/isax/protocol");
    const { inspectAegis } = await import("@/lib/isabella/genesis/security/aegis");

    const moe = routeMoe(data.text);
    const cred = { keyId: "demo", secret: crypto.randomUUID(), tenantId: "rdm", scopes: ["chat:write"], revoked: false, expiresAt: Date.now() + 60_000 };
    const verifier = new IsaxVerifier((id) => (id === "demo" ? cred : undefined));
    const signed = await signRequest(cred, { method: "POST", path: "/api/isabella", bodyHash: await sha256(data.text), timestamp: Date.now(), nonce: crypto.randomUUID(), scope: "chat:write" });
    const first = await verifier.verify(signed);
    const replay = await verifier.verify(signed);

    const fabric = new MagpieFabric({
      authorize: (t) => inspectAegis(t).decision === "ALLOW",
      infer: async () => `Expertos: ${moe.topK.map((t) => t.expert).join(", ")}`,
      verify: (o) => o.length > 0,
      record: () => {},
    });
    const magpie = await fabric.run(data.text);
    return {
      moe,
      isax: { firstCode: first.ok ? "OK" : first.code, replayCode: replay.ok ? "OK" : replay.code, signature: signed.signature.slice(0, 16) },
      magpie: { state: magpie.state, planes: magpie.planes.map((p) => ({ ...p, ms: Math.round(p.ms * 100) / 100 })) },
    };
  });
