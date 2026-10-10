import { describe, expect, it } from "vitest";
import { routeMoe, MOE_EXPERTS, MOE_HEADS } from "@/lib/isabella/moe/router";

describe("MoE router", () => {
  it("tiene 12 cabezas y 24 expertos", () => {
    expect(MOE_EXPERTS.length).toBe(24);
    expect(routeMoe("hola").headVotes.length).toBe(MOE_HEADS);
  });
  it("activa como máximo 4 expertos", () => {
    expect(routeMoe("x", 10).topK.length).toBe(4);
  });
  it("rutea minería a su experto", () => {
    expect(routeMoe("historia de la mina de plata").topK.map((t) => t.expert)).toContain("mineria");
  });
  it("siempre incluye guardianes ética y gobernanza", () => {
    expect(routeMoe("hola").guardians).toEqual(expect.arrayContaining(["etica", "gobernanza"]));
  });
  it("es determinístico", () => {
    expect(routeMoe("paste en real del monte")).toEqual(routeMoe("paste en real del monte"));
  });
});
