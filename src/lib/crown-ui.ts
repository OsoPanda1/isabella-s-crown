/**
 * Capa de adaptación entre el motor C.R.O.W.N. (src/lib/crown.ts)
 * y la Terminal Cognitiva. Traduce la decisión canónica a un objeto
 * plano y localizable para la UI (telemetría, pesos, policy gate).
 */
import {
  MODULES,
  buildSystemPrompt as buildCrownPrompt,
  getModuleWeights,
  routeRequest,
  type CrownWeights,
  type ModuleId,
  type RoutingDecision as CrownDecision,
} from "./crown";
import type { Lang } from "./i18n";

export type { ModuleId };
export { MODULES };

export const MODULE_ORDER: ModuleId[] = ["CROWN", "ISA", "SOPHIA", "ORION", "ARGUS"];

export type PresetId =
  | "prime"
  | "empathic"
  | "strategic"
  | "sentinel"
  | "executor"
  | "synergistic";

export interface Preset {
  id: PresetId;
  temperature: number;
  bias: Partial<Record<ModuleId, number>>;
}

export const PRESETS: Preset[] = [
  { id: "prime", temperature: 0.8, bias: {} },
  { id: "empathic", temperature: 0.95, bias: { ISA: 1 } },
  { id: "strategic", temperature: 0.5, bias: { SOPHIA: 1 } },
  { id: "sentinel", temperature: 0.25, bias: { ARGUS: 1, CROWN: 1 } },
  { id: "executor", temperature: 0.6, bias: { ORION: 1 } },
  { id: "synergistic", temperature: 0.75, bias: { ISA: 0.9, SOPHIA: 0.9, ORION: 0.9 } },
];

export type UiPolicy = "allowed" | "requires_approval" | "denied";

export interface RoutingDecision {
  traceId: string;
  primary: ModuleId;
  supporting: ModuleId[];
  weights: CrownWeights;
  policy: UiPolicy;
  status: CrownDecision["policy"]["status"];
  policyReason: string;
  rulesChecked: string[];
  memoryScopes: string[];
  risk: string;
  rationale: string;
  emotionalTone: string;
  governanceScore: number;
  epistemicCertainty: number;
  latencyMs: number;
  systemPrompt: string;
}

const POLICY_MAP: Record<CrownDecision["policy"]["status"], UiPolicy> = {
  allowed: "allowed",
  allowed_read_only: "allowed",
  requires_human_approval: "requires_approval",
  requires_more_information: "requires_approval",
  denied: "denied",
};

const RISK_SCORE: Record<string, number> = {
  minimal: 0.99,
  low: 0.96,
  medium: 0.88,
  high: 0.74,
  critical: 0.55,
};

const TONE: Record<string, { es: string; en: string }> = {
  conversation: { es: "cálido", en: "warm" },
  knowledge: { es: "didáctico", en: "didactic" },
  creative: { es: "evocador", en: "evocative" },
  coding: { es: "preciso", en: "precise" },
  analysis: { es: "analítico", en: "analytical" },
  security: { es: "vigilante", en: "vigilant" },
  external_action: { es: "cauteloso", en: "cautious" },
  personal_data: { es: "reservado", en: "reserved" },
  governance: { es: "constitucional", en: "constitutional" },
  unknown: { es: "atento", en: "attentive" },
};

const REASON: Record<CrownDecision["policy"]["status"], { es: string; en: string }> = {
  allowed: {
    es: "Ciclo autorizado bajo supervisión de telemetría.",
    en: "Cycle authorized under telemetry supervision.",
  },
  allowed_read_only: {
    es: "Autorizado en modo solo lectura: sin efectos externos.",
    en: "Authorized in read-only mode: no external effects.",
  },
  requires_human_approval: {
    es: "Acción de alto impacto: exige ratificación humana explícita.",
    en: "High-impact action: explicit human ratification required.",
  },
  requires_more_information: {
    es: "Ambigüedad detectada: se requiere contexto adicional antes de actuar.",
    en: "Ambiguity detected: additional context required before acting.",
  },
  denied: {
    es: "Veto de ARGUS: la petición infringe la constitución C.R.O.W.N.",
    en: "ARGUS veto: the request violates the C.R.O.W.N. constitution.",
  },
};

function applyBias(weights: CrownWeights, preset: Preset): CrownWeights {
  const next = { ...weights };
  for (const [id, value] of Object.entries(preset.bias) as [ModuleId, number][]) {
    next[id] = Math.max(next[id], value);
  }
  return next;
}

export function route(input: string, preset: Preset, lang: Lang = "es"): RoutingDecision {
  const started = Date.now();
  const { decision, systemPrompt } = routeRequest(input, {
    context: { locale: lang === "es" ? "es-MX" : "en-US" },
  });

  const status = decision.policy.status;
  const weights = applyBias(getModuleWeights(decision), preset);
  const tone = TONE[decision.intent.category] ?? TONE["unknown"]!;

  const rationale =
    lang === "es"
      ? `Intención ${decision.intent.category} · acción ${decision.intent.action} · módulo primario ${MODULES[decision.primary].acronym}`
      : `Intent ${decision.intent.category} · action ${decision.intent.action} · primary module ${MODULES[decision.primary].acronym}`;

  return {
    traceId: decision.traceId,
    primary: decision.primary,
    supporting: decision.supporting,
    weights,
    policy: POLICY_MAP[status],
    status,
    policyReason: decision.policy.reasons[0] ?? REASON[status][lang],
    rulesChecked: decision.policy.rulesChecked,
    memoryScopes: decision.memoryScopes,
    risk: decision.policy.risk,
    rationale,
    emotionalTone: tone[lang],
    governanceScore: RISK_SCORE[decision.policy.risk] ?? 0.9,
    epistemicCertainty: Math.min(0.99, 0.55 + decision.intent.confidence * 0.42),
    latencyMs: Math.max(8, Date.now() - started + 11),
    systemPrompt,
  };
}

export function buildSystemPrompt(decision: RoutingDecision, preset: Preset, lang: Lang): string {
  const base = decision.systemPrompt;
  const language =
    lang === "es"
      ? "Responde siempre en español neutro latinoamericano."
      : "Always respond in English.";
  const presetLine =
    lang === "es"
      ? `Preset cognitivo activo: ${preset.id.toUpperCase()}.`
      : `Active cognitive preset: ${preset.id.toUpperCase()}.`;
  return [base, presetLine, language].join("\n\n");
}

export function crownPromptFor(decision: CrownDecision): string {
  return buildCrownPrompt(decision);
}
