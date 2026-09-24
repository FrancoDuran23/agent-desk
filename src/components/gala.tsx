"use client";

import { AGENTS, ROOMMATES } from "@/lib/agents";
import type { PublicRun } from "@/lib/types";
import { Portrait } from "./portrait";
import { SitePreview } from "./site-preview";

export function GalaScreen({
  run,
  onPublish,
}: {
  run: PublicRun;
  onPublish: (confirm: boolean) => Promise<void>;
}) {
  const finale = [...run.revealed].reverse().find((b) => b.kind === "finale");
  const evicted = run.status === "evicted";
  const line =
    finale && finale.kind === "finale"
      ? finale.line
      : evicted
        ? "Sonó el timbre. Se llevan lo que haya: es un desalojo con entrega, no con las manos vacías."
        : "La casa entregó la prueba. Esta noche hay sobrevivientes.";

  return (
    <section className="broadcast-card-glow space-y-4 p-4 sm:p-6" aria-label="Gala de eliminación">
      <header className="text-center">
        <p className="text-[11px] font-black tracking-[0.3em] text-[#f5c542] uppercase">Gala en vivo</p>
        <h2 className="display mt-1 text-5xl text-white sm:text-6xl">
          {evicted ? "Eliminación" : "Sobreviven"}
        </h2>
        <p className="drama mx-auto mt-3 max-w-2xl text-lg text-[#e8e0ff]">“{line}”</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {ROOMMATES.map((agent) => {
          const out = evicted && agent.id === "ansioso";
          return (
            <article
              key={agent.id}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${
                out ? "border-[#ff1a3c] bg-[#ff1a3c22] opacity-70" : "border-[#3a3158] bg-[#0a0612]/60"
              }`}
            >
              <Portrait agent={agent.id} size={80} />
              <p className="display text-xl leading-none" style={{ color: agent.color }}>
                {agent.aka}
              </p>
              <p className="text-xs font-bold tracking-wider uppercase">
                {out ? "Nominado / afuera" : "Sigue en casa"}
              </p>
            </article>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-center text-[11px] font-bold tracking-[0.2em] text-[#2de2e6] uppercase">
          El sitio que entregaron
        </p>
        <div className="max-h-[28rem] overflow-auto rounded-xl">
          <SitePreview run={run} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onPublish(false)}
          className="rounded-full border border-[#f5c542] bg-[#f5c54222] px-4 py-2 text-sm font-bold text-[#ffe566]"
        >
          Ensayo de publicación
        </button>
        <button
          type="button"
          disabled={!run.webflow.configured}
          onClick={() => onPublish(true)}
          className="rounded-full bg-[#ff2d6a] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          La producción publica el resultado
        </button>
      </div>
      {run.publishResult ? (
        <p className="text-center text-sm text-[#cbbfe0]">
          {run.publishResult.mode === "live" ? "Al aire" : "Ensayo"} · {run.publishResult.note}
        </p>
      ) : null}
      {run.highlight.length ? (
        <p className="text-center text-xs text-[#a89bb8]">
          Destacados:{" "}
          {run.highlight
            .slice(0, 2)
            .map((h) => (h.agent === "casa" ? "La casa" : AGENTS[h.agent].aka))
            .join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
