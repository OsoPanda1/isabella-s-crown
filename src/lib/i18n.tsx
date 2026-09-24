import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

type Dict = Record<string, string>;

const ES: Dict = {
  "header.subtitle": "Nodo Cero · Real del Monte, Hidalgo · C.R.O.W.N.",
  "header.telemetry": "Telemetría",
  "header.close": "Cerrar",
  "header.langLabel": "Idioma",

  "cli.channel": "Canal de percepción · Nodo Cero",
  "cli.synth": "SINTETIZANDO",
  "cli.listening": "EN ESCUCHA",
  "cli.placeholder": "Habla con Isabella… (Enter para enviar · Shift+Enter para nueva línea)",
  "cli.purge": "Purgar memoria",
  "cli.stop": "Detener",
  "cli.send": "Transmitir",

  "stream.operator": "OPERADOR",
  "stream.policy": "POLÍTICA",
  "stream.risk": "RIESGO",
  "stream.tone": "TONO",
  "stream.retry": "Reintentar percepción",

  "panel.preset": "Preset cognitivo",
  "panel.policyGate": "Policy Gate · ARGUS",
  "panel.noCycle": "Sin ciclo evaluado en esta sesión.",
  "panel.modules": "Módulos activos",
  "panel.metrics": "Métricas de sesión",
  "panel.cycles": "Ciclos",
  "panel.fragments": "Fragmentos",
  "panel.governance": "Gobernanza",
  "panel.certainty": "Certeza",
  "panel.latency": "Latencia",
  "panel.risk": "Riesgo",
  "panel.scopes": "SCOPES",
  "panel.ethics": "Auditoría ética · SHA-256",
  "ethics.valid": "ÍNTEGRA",
  "ethics.invalid": "REVISIÓN REQUERIDA",
  "ethics.noFlags": "Sin alertas éticas.",
  "ethics.none": "Aún no hay síntesis auditada.",

  "policy.allowed": "AUTORIZADO",
  "policy.requires_approval": "RATIFICACIÓN HUMANA",
  "policy.denied": "DENEGADO",

  "preset.prime": "Prime",
  "preset.prime.tag": "Equilibrio soberano entre afecto, lógica y gobernanza.",
  "preset.empathic": "Empathic",
  "preset.empathic.tag": "Escucha activa, contención y calidez humana.",
  "preset.strategic": "Strategic",
  "preset.strategic.tag": "Rigor dialéctico y primeros principios.",
  "preset.sentinel": "Sentinel",
  "preset.sentinel.tag": "Salvaguardas máximas y Zero Trust estricto.",
  "preset.executor": "Executor",
  "preset.executor.tag": "Síntesis de código, diagramas y artefactos.",
  "preset.synergistic": "Synergistic",
  "preset.synergistic.tag": "Ancho de banda cognitivo simétrico entre nodos.",

  "module.CROWN": "Gobernanza computacional, arbitraje de políticas y trazabilidad.",
  "module.ISA": "Comunicación empática, claridad conversacional y sensibilidad lingüística.",
  "module.SOPHIA": "Análisis, razonamiento, epistemología y evaluación de evidencia.",
  "module.ORION": "Planificación técnica, código, artefactos y orquestación autorizada.",
  "module.ARGUS": "Seguridad, privacidad, permisos y prevención de abuso.",

  "sys.boot":
    "Núcleo C.R.O.W.N. sincronizado · ISA · SOPHIA · ORION · ARGUS en línea · Nodo Cero, Real del Monte, Hidalgo. Presencia establecida.",
  "sys.purged": "Sesión purgada. Memoria inmediata reiniciada · trazabilidad preservada.",
  "sys.fail": "Fallo de percepción.",
  "sys.silence": "Silencio cognitivo: el núcleo no emitió síntesis para esta percepción.",
  "sys.interrupt": "Interrupción del núcleo.",
};

const EN: Dict = {
  "header.subtitle": "Node Zero · Real del Monte, Hidalgo · C.R.O.W.N.",
  "header.telemetry": "Telemetry",
  "header.close": "Close",
  "header.langLabel": "Language",

  "cli.channel": "Perception channel · Node Zero",
  "cli.synth": "SYNTHESIZING",
  "cli.listening": "LISTENING",
  "cli.placeholder": "Talk to Isabella… (Enter to send · Shift+Enter for a new line)",
  "cli.purge": "Purge memory",
  "cli.stop": "Stop",
  "cli.send": "Transmit",

  "stream.operator": "OPERATOR",
  "stream.policy": "POLICY",
  "stream.risk": "RISK",
  "stream.tone": "TONE",
  "stream.retry": "Retry perception",

  "panel.preset": "Cognitive preset",
  "panel.policyGate": "Policy Gate · ARGUS",
  "panel.noCycle": "No cycle evaluated in this session.",
  "panel.modules": "Active modules",
  "panel.metrics": "Session metrics",
  "panel.cycles": "Cycles",
  "panel.fragments": "Fragments",
  "panel.governance": "Governance",
  "panel.certainty": "Certainty",
  "panel.latency": "Latency",
  "panel.risk": "Risk",
  "panel.scopes": "SCOPES",
  "panel.ethics": "Ethical audit · SHA-256",
  "ethics.valid": "INTACT",
  "ethics.invalid": "REVIEW REQUIRED",
  "ethics.noFlags": "No ethical flags.",
  "ethics.none": "No synthesis audited yet.",

  "policy.allowed": "ALLOWED",
  "policy.requires_approval": "HUMAN RATIFICATION",
  "policy.denied": "DENIED",

  "preset.prime": "Prime",
  "preset.prime.tag": "Sovereign balance of affect, logic and governance.",
  "preset.empathic": "Empathic",
  "preset.empathic.tag": "Active listening, containment and human warmth.",
  "preset.strategic": "Strategic",
  "preset.strategic.tag": "Dialectical rigor and first principles.",
  "preset.sentinel": "Sentinel",
  "preset.sentinel.tag": "Maximum safeguards and strict Zero Trust.",
  "preset.executor": "Executor",
  "preset.executor.tag": "Code, diagrams and artifact synthesis.",
  "preset.synergistic": "Synergistic",
  "preset.synergistic.tag": "Symmetric cognitive bandwidth across nodes.",

  "module.CROWN": "Computational governance, policy arbitration and traceability.",
  "module.ISA": "Empathic communication, conversational clarity and linguistic sensitivity.",
  "module.SOPHIA": "Analysis, reasoning, epistemology and evidence evaluation.",
  "module.ORION": "Technical planning, code, artifacts and authorized orchestration.",
  "module.ARGUS": "Security, privacy, permissions and abuse prevention.",

  "sys.boot":
    "C.R.O.W.N. core synchronized · ISA · SOPHIA · ORION · ARGUS online · Node Zero, Real del Monte, Hidalgo. Presence established.",
  "sys.purged": "Session purged. Immediate memory reset · traceability preserved.",
  "sys.fail": "Perception failure.",
  "sys.silence": "Cognitive silence: the core emitted no synthesis for this perception.",
  "sys.interrupt": "Core interruption.",
};

const DICTS: Record<Lang, Dict> = { es: ES, en: EN };

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "isabella.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") setLangState(stored);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (next: Lang) => {
        setLangState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
      },
      t: (key: string) => DICTS[lang][key] ?? DICTS.es[key] ?? key,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de I18nProvider");
  return ctx;
}
