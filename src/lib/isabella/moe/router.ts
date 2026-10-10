/**
 * Isabella Genesis Engine — router MoE simulado (12 cabezas, 24 expertos, Top-K).
 * Simulación determinística: no ejecuta vLLM; decide qué expertos se activarían y deja huella auditable.
 */
export const MOE_HEADS = 12;
export const MOE_EXPERTS = [
  "territorio", "historia_rdm", "turismo", "gastronomia", "mineria", "cultura",
  "etica", "privacidad", "seguridad", "legal", "economia", "comercio",
  "educacion", "salud_bienestar", "xr", "ui", "codigo", "datos",
  "memoria", "empatia", "razonamiento", "matematicas", "idiomas", "gobernanza",
] as const;
export type MoeExpert = (typeof MOE_EXPERTS)[number];

const KEYWORDS: Partial<Record<MoeExpert, string[]>> = {
  territorio: ["real del monte", "hidalgo", "mapa", "lugar"],
  historia_rdm: ["historia", "cornish", "pasado"],
  turismo: ["visitar", "turismo", "hotel", "ruta"],
  gastronomia: ["paste", "comida", "restaurante"],
  mineria: ["mina", "minería", "plata"],
  etica: ["ético", "ética", "moral"],
  privacidad: ["privacidad", "datos personales", "consentimiento"],
  seguridad: ["seguridad", "ataque", "contraseña"],
  legal: ["ley", "contrato", "legal"],
  economia: ["precio", "ingreso", "dinero", "costo"],
  codigo: ["código", "typescript", "api", "bug"],
  empatia: ["triste", "ayuda", "siento", "ansiedad"],
  matematicas: ["calcula", "ecuación", "número"],
  gobernanza: ["política", "aprobación", "auditoría"],
};

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export interface MoeRoute {
  topK: { expert: MoeExpert; weight: number }[];
  headVotes: MoeExpert[];
  guardians: MoeExpert[];
  fingerprint: string;
}

export function routeMoe(input: string, k = 3): MoeRoute {
  const text = input.toLowerCase();
  const score = new Map<MoeExpert, number>(MOE_EXPERTS.map((e) => [e, 0]));
  for (const [e, kws] of Object.entries(KEYWORDS) as [MoeExpert, string[]][]) {
    for (const kw of kws) if (text.includes(kw)) score.set(e, (score.get(e) ?? 0) + 3);
  }
  const headVotes: MoeExpert[] = [];
  for (let h = 0; h < MOE_HEADS; h++) {
    const e = MOE_EXPERTS[hash32(`${h}:${text}`) % MOE_EXPERTS.length] as MoeExpert;
    headVotes.push(e);
    score.set(e, (score.get(e) ?? 0) + 1);
  }
  score.set("razonamiento", (score.get("razonamiento") ?? 0) + 0.5);
  const kk = Math.max(1, Math.min(4, k));
  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, kk);
  const total = ranked.reduce((s, [, v]) => s + Math.exp(v), 0);
  const topK = ranked.map(([expert, v]) => ({ expert, weight: Math.round((Math.exp(v) / total) * 1000) / 1000 }));
  const guardians: MoeExpert[] = ["etica", "gobernanza"];
  if ((score.get("privacidad") ?? 0) >= 3) guardians.push("privacidad");
  if ((score.get("seguridad") ?? 0) >= 3) guardians.push("seguridad");
  const fingerprint = hash32(topK.map((t) => t.expert).join("|") + "#" + guardians.join("|")).toString(16).padStart(8, "0");
  return { topK, headVotes, guardians, fingerprint };
}
