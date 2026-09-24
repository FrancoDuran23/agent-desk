"use client";

import { useState } from "react";
import { AGENTS } from "@/lib/agents";
import { withBase } from "@/lib/paths";
import type { PublicRun } from "@/lib/types";

export function Deliverables({
  run,
  onPublish,
}: {
  run: PublicRun;
  onPublish: (confirm: boolean) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const page = run.canvas.pages[0];

  async function publish(confirm: boolean) {
    setPending(true);
    try {
      await onPublish(confirm);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Resultado de la gala">
      <header>
        <p className="text-[11px] font-bold tracking-[0.16em] text-[#2de2e6] uppercase">Cierre de gala</p>
        <h2 className="display text-2xl text-white">
          {run.status === "live"
            ? "La prueba se está armando"
            : run.status === "evicted"
              ? "Desalojo con entrega"
              : "Temporada cerrada"}
        </h2>
        <p className="text-xs text-[#a89bb8]">
          {run.canvas.siteName || "Sitio del cliente"} · {page?.seo.title || "sin título todavía"}
        </p>
      </header>

      <div className="rounded-xl border border-[#3a3158] bg-[#0a0612]/70 p-3">
        <p className="text-sm font-bold text-white">La producción publica el resultado</p>
        <p className="mt-1 text-xs leading-relaxed text-[#a89bb8]">
          {run.webflow.configured
            ? "Hay señal con Webflow. Publicar deja la colección y los ítems en el aire."
            : "Sin credenciales: el ensayo muestra qué mandaría la producción, sin inventar un OK."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => publish(false)}
            className="rounded-full border border-[#f5c542] bg-[#f5c54222] px-3 py-2 text-sm font-bold text-[#ffe566]"
          >
            {pending ? "Armando…" : "Ensayo"}
          </button>
          <button
            type="button"
            disabled={pending || !run.webflow.configured}
            onClick={() => publish(true)}
            className="rounded-full bg-[#22c55e] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Publicar el resultado
          </button>
        </div>
        {run.publishResult ? (
          <div className="mt-3">
            <p className="text-sm font-bold text-[#cbbfe0]">
              {run.publishResult.mode === "live" ? "Al aire" : "Ensayo"} · {run.publishResult.note}
            </p>
          </div>
        ) : null}
      </div>

      {run.highlight.length ? (
        <div>
          <h3 className="display text-lg text-white">Highlight reel</h3>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {run.highlight.map((moment, index) => {
              const agent = moment.agent === "casa" ? null : AGENTS[moment.agent];
              return (
                <article key={moment.id} className="min-w-[14rem] rounded-xl border border-[#3a3158] bg-[#120a1c] p-3">
                  <p className="text-[10px] font-bold tracking-widest text-[#a89bb8]">
                    MOMENTO {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-xs font-bold" style={{ color: agent?.color }}>
                    {agent?.aka ?? "La casa"}
                  </p>
                  <p className="mt-1 text-sm text-[#f0e8ff]">{moment.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-[11px] text-[#6d6280]">
        Pack técnico disponible para la producción vía export — el público solo ve la gala.
      </p>
    </section>
  );
}
