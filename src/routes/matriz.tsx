import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getControlMatrix } from "@/lib/evolution.functions";

export const Route = createFileRoute("/matriz")({
  head: () => ({
    meta: [
      { title: "Matriz de 7,000 controles · Isabella Villaseñor AI" },
      { name: "description", content: "Estado de los controles de evolución V5 de Isabella: declarados, conectados, verificados y bloqueados." },
      { property: "og:title", content: "Matriz de controles · Isabella" },
      { property: "og:description", content: "Controles de ingeniería de Isabella por dominio, eje y primitiva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatrixPage,
});

type Data = Awaited<ReturnType<typeof getControlMatrix>>;
const STATES = ["declared", "wired", "verified", "blocked"] as const;
const LABEL: Record<(typeof STATES)[number], string> = {
  declared: "Declarados", wired: "Conectados", verified: "Verificados", blocked: "Bloqueados",
};

function MatrixPage() {
  const [domain, setDomain] = useState("");
  const [state, setState] = useState<"" | (typeof STATES)[number]>("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getControlMatrix({ data: { ...(domain ? { domain } : {}), ...(state ? { state } : {}), limit: 200 } })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"));
  }, [domain, state]);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 font-mono">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Matriz de evolución V5</h1>
            <p className="text-sm text-muted-foreground">70 dominios × 10 ejes × 10 primitivas</p>
          </div>
          <Link to="/" className="text-sm underline text-primary">← Terminal</Link>
        </header>
        {error && <p className="text-destructive">{error}</p>}
        {data && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Total" value={data.total} />
              {STATES.map((s) => <Stat key={s} label={LABEL[s]} value={data.summary[s]} />)}
            </section>
            <p className="text-xs text-muted-foreground break-all">SHA-256: {data.digest}</p>
            <div className="flex flex-wrap gap-3">
              <select className="bg-card border border-border rounded px-2 py-1" value={domain} onChange={(e) => setDomain(e.target.value)}>
                <option value="">Todos los dominios</option>
                {data.domains.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="bg-card border border-border rounded px-2 py-1" value={state} onChange={(e) => setState(e.target.value as typeof state)}>
                <option value="">Todos los estados</option>
                {STATES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
              </select>
              <span className="text-sm text-muted-foreground self-center">{data.matched} coinciden (mostrando hasta 200)</span>
            </div>
            <div className="overflow-x-auto border border-border rounded">
              <table className="w-full text-xs">
                <thead className="bg-card text-muted-foreground">
                  <tr><th className="p-2 text-left">Plano</th><th className="p-2 text-left">Dominio</th><th className="p-2 text-left">Eje</th><th className="p-2 text-left">Primitiva</th><th className="p-2 text-left">Estado</th></tr>
                </thead>
                <tbody>
                  {data.controls.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="p-2">{c.plane}</td><td className="p-2">{c.domain}</td><td className="p-2">{c.axis}</td><td className="p-2">{c.primitive}</td>
                      <td className="p-2"><span className={c.state === "blocked" ? "text-destructive" : c.state === "declared" ? "text-muted-foreground" : "text-primary"}>{LABEL[c.state]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value.toLocaleString("es-MX")}</div>
    </div>
  );
}
