import { describe, expect, it } from "vitest";
import { IsaxVerifier, signRequest, sha256, type IsaxCredential } from "@/lib/isabella/isax/protocol";

const cred: IsaxCredential = { keyId: "k1", secret: "s3cr3t", tenantId: "rdm", scopes: ["chat:write"], revoked: false, expiresAt: Date.now() + 60_000 };
const verifier = () => new IsaxVerifier((id) => (id === "k1" ? cred : undefined));
const req = async (nonce: string, scope = "chat:write") =>
  signRequest(cred, { method: "POST", path: "/api/isabella", bodyHash: await sha256("{}"), timestamp: Date.now(), nonce, scope });

describe("ISA-X", () => {
  it("acepta una petición firmada válida", async () => {
    expect((await verifier().verify(await req("n1"))).ok).toBe(true);
  });
  it("rechaza replay del mismo nonce", async () => {
    const v = verifier(); const r = await req("n2");
    await v.verify(r);
    expect(await v.verify(r)).toEqual({ ok: false, code: "REPLAY" });
  });
  it("rechaza firma alterada", async () => {
    const r = await req("n3");
    expect(await verifier().verify({ ...r, path: "/api/otro" })).toEqual({ ok: false, code: "BAD_SIGNATURE" });
  });
  it("rechaza scope no concedido", async () => {
    expect(await verifier().verify(await req("n4", "admin"))).toEqual({ ok: false, code: "SCOPE_DENIED" });
  });
  it("rechaza fuera de la ventana de 5 minutos", async () => {
    const r = await req("n5");
    expect(await verifier().verify(r, Date.now() + 6 * 60_000)).toEqual({ ok: false, code: "EXPIRED" });
  });
});
