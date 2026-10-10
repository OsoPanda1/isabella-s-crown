import { describe, expect, it } from "vitest";
import { MagpieFabric } from "@/lib/isabella/magpie/planes";

const base = (authorize = true) => {
  const log: string[] = [];
  let calls = 0;
  const f = new MagpieFabric({
    authorize: () => authorize,
    infer: async () => { calls++; return "respuesta"; },
    verify: (o) => o.length > 0,
    record: (e) => log.push(e.state),
  });
  return { f, log, calls: () => calls };
};

describe("MAGPIE-X", () => {
  it("bloquea sin autoridad, incluso con caché", async () => {
    const { f, log } = base(false);
    expect((await f.run("hola")).state).toBe("BLOQUEADO");
    expect(log).toEqual(["BLOQUEADO"]);
  });
  it("usa caché en la segunda petición", async () => {
    const { f, calls } = base();
    await f.run("hola"); const r = await f.run("Hola ");
    expect(r.cacheHit).toBe(true); expect(calls()).toBe(1);
  });
  it("marca disenso si no hay quórum", async () => {
    const f = new MagpieFabric({ authorize: () => true, infer: async () => "a", verify: () => true, votes: [async () => "b", async () => "c"], record: () => {} });
    expect((await f.run("q")).state).toBe("DISENSO");
  });
});
