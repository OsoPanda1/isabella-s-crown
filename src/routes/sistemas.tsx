import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { runSystemsDemo } from "@/lib/systems.functions";

export const Route = createFileRoute("/sistemas")({
  head: () => ({
    meta: [
      { title: "Sistemas ISA-X, MAGPIE-X y MoE · Isabella" },
      { name: "description", content: "Prueba en vivo de la firma ISA-X, los 4 planos de MAGPIE-X y el router de 24 expertos de Isabella." },
      { property: "og:title", content: "Sistemas de Isabella en vivo" },
      { property: "og:description", content: "ISA-X, MAGPIE-X y router MoE de Isabella Villaseñor AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SystemsPage,
});

type Result = Awaited<ReturnType<typeof runSystemsDemo>>;

function SystemsPage() {
  const [text, setText] = useState("Cuéntame la historia de la mina de plata en Real del Monte");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    setBusy(true); setErr(null);
    try { setRes(await runSystemsDemo({ data: { text } })); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  };
  const card = "rounded border border-border bg-card p-4 space-y-2";
  return (
    <main className="min-h-screen bg-background text-foreground p-6 font-mono">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sistemas en vivo</h1>
          <Link to="/" className="text-sm underline text-primary">← Terminal</Link>
        </header>
        <div className="flex gap-2">
          <input className="flex-1 bg-card border border-border rounded px-3 py-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={run} disabled={busy || !text.trim()} className="rounded bg-primary text-primary-foreground px-4 text-sm disabled:opacity-50">{busy ? "…" : "Ejecutar"}</button>
        </div>
        {err && <p className="text-destructive text-sm">{err}</p>}
        {res && (
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <section className={card}>
              <h2 className="font-semibold">Router MoE · 24 expertos</h2>
              {res.moe.topK.map((t) => <div key={t.expert} className="flex justify-between"><span>{t.expert}</span><span className="text-primary">{(t.weight * 100).toFixed(1)}%</span></div>)}
              <p className="text-xs text-muted-foreground">Guardianes: {res.moe.guardians.join(", ")}</p>
              <p className="text-xs text-muted-foreground">Huella: {res.moe.fingerprint}</p>
            </section>
            <section className={card}>
              <h2 className="font-semibold">ISA-X · firma</h2>
              <p>Primera petición: <span className="text-primary">{res.isax.firstCode}</span></p>
              <p>Repetida (replay): <span className="text-destructive">{res.isax.replayCode}</span></p>
              <p className="text-xs text-muted-foreground">Firma: {res.isax.signature}…</p>
            </section>
            <section className={card}>
              <h2 className="font-semibold">MAGPIE-X · 4 planos</h2>
              <p>Estado: <span className="text-primary">{res.magpie.state}</span></p>
              {res.magpie.planes.map((p) => <div key={p.plane} className="flex justify-between text-xs"><span className={p.ok ? "" : "text-destructive"}>{p.plane}</span><span className="text-muted-foreground">{p.note} · {p.ms}ms</span></div>)}
            </section>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Simulación honesta: no hay vLLM ni GPU; el router decide qué expertos se activarían.</p>
      </div>
    </main>
  );
}
