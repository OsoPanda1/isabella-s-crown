/**
 * MAGPIE-X v3 — ejecución por 4 planos (crítico, verificación, consenso, evidencia).
 * Clasificación honesta: BLUEPRINT + simulación. No declara PRODUCTION ni ZERO_LATENCY.
 * Invariante: la aceleración nunca elude autoridad, seguridad ni evidencia.
 */
export type PlaneName = "CRITICO" | "VERIFICACION" | "CONSENSO" | "EVIDENCIA";
export type EpistemicState = "PRELIMINAR" | "VERIFICADO" | "DISENSO" | "BLOQUEADO";

export interface PlaneResult { plane: PlaneName; ok: boolean; ms: number; note: string }
export interface MagpieRun {
  planes: PlaneResult[];
  state: EpistemicState;
  cacheHit: boolean;
}

export interface MagpieDeps {
  authorize: (input: string) => boolean;
  infer: (input: string) => Promise<string>;
  verify: (output: string) => boolean;
  votes?: ((input: string) => Promise<string>)[];
  record: (entry: { input: string; output: string; state: EpistemicState }) => void;
}

export class MagpieFabric {
  private cache = new Map<string, string>();
  constructor(private readonly deps: MagpieDeps, private readonly quorum = 2) {}

  async run(input: string): Promise<MagpieRun & { output: string }> {
    const planes: PlaneResult[] = [];
    const t = () => performance.now();
    // Autoridad primero, siempre — también antes del caché.
    if (!this.deps.authorize(input)) {
      planes.push({ plane: "CRITICO", ok: false, ms: 0, note: "autoridad denegada" });
      this.deps.record({ input, output: "", state: "BLOQUEADO" });
      return { planes, state: "BLOQUEADO", cacheHit: false, output: "" };
    }
    let s = t();
    const key = input.trim().toLowerCase();
    const cached = this.cache.get(key);
    const output = cached ?? (await this.deps.infer(input));
    if (!cached) this.cache.set(key, output);
    planes.push({ plane: "CRITICO", ok: true, ms: t() - s, note: cached ? "caché semántico" : "inferencia primaria" });

    s = t();
    const verified = this.deps.verify(output);
    planes.push({ plane: "VERIFICACION", ok: verified, ms: t() - s, note: verified ? "VERITAS ok" : "VERITAS rechaza" });

    let state: EpistemicState = verified ? "VERIFICADO" : "PRELIMINAR";
    if (this.deps.votes?.length) {
      s = t();
      const results = await Promise.all(this.deps.votes.map((v) => v(input)));
      const agree = results.filter((r) => r === output).length + 1;
      const ok = agree >= this.quorum;
      if (!ok) state = "DISENSO";
      planes.push({ plane: "CONSENSO", ok, ms: t() - s, note: `${agree}/${results.length + 1} votos` });
    }

    s = t();
    this.deps.record({ input, output, state });
    planes.push({ plane: "EVIDENCIA", ok: true, ms: t() - s, note: "registro BookPI" });
    return { planes, state, cacheHit: Boolean(cached), output };
  }
}
