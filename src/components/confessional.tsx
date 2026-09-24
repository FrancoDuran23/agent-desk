"use client";

import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/agents";
import type { PublicRun } from "@/lib/types";
import { Portrait } from "./portrait";

export function ConfessionalOverlay({ run }: { run: PublicRun }) {
  const clips = run.revealed.filter((b) => b.kind === "confession");
  const latest = clips.at(-1);
  const [visible, setVisible] = useState(false);
  const [clipId, setClipId] = useState<string | null>(null);

  useEffect(() => {
    if (!latest || latest.kind !== "confession") return;
    if (latest.id === clipId) return;
    setClipId(latest.id);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5200);
    return () => clearTimeout(t);
  }, [latest, clipId]);

  if (!visible || !latest || latest.kind !== "confession") return null;
  const agent = AGENTS[latest.agent];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-label="Confesionario"
      onClick={() => setVisible(false)}
    >
      <article
        className="confessional-enter relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#ff2d6a]/60 bg-[#12081c] p-5 shadow-[0_0_60px_#ff2d6a55]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex items-center gap-2">
          <span className="rec" aria-hidden />
          <p className="text-[11px] font-black tracking-[0.25em] text-[#ff2d6a] uppercase">Confesionario</p>
          <button
            type="button"
            className="ml-auto text-xs font-bold text-[#a89bb8] underline"
            onClick={() => setVisible(false)}
          >
            Cerrar
          </button>
        </div>
        <div className="relative mt-4 flex items-start gap-4">
          <Portrait agent={latest.agent} size={96} live />
          <div className="min-w-0 flex-1">
            <p className="display text-3xl leading-none" style={{ color: agent.color }}>
              {agent.aka}
            </p>
            <p className="text-sm font-semibold text-[#cbbfe0]">{agent.name} · a cámara</p>
            <p className="drama mt-3 text-xl leading-snug text-white">“{latest.text}”</p>
          </div>
        </div>
      </article>
    </div>
  );
}

export function ConfessionalRail({ run }: { run: PublicRun }) {
  const clips = run.revealed.filter((b) => b.kind === "confession");
  return (
    <section className="broadcast-card p-3" aria-label="Últimos confesionarios">
      <header className="mb-2 flex items-center gap-2">
        <span className="rec" aria-hidden />
        <h2 className="display text-xl leading-none">Confesionario</h2>
      </header>
      {clips.length === 0 ? (
        <p className="text-sm text-[#a89bb8]">Todavía nadie se escondió a hablar a cámara.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...clips].reverse().slice(0, 3).map((clip) => {
            if (clip.kind !== "confession") return null;
            const agent = AGENTS[clip.agent];
            return (
              <article key={clip.id} className="rounded-xl border border-[#3a3158] bg-[#0a0612]/70 p-2.5">
                <p className="text-[10px] font-bold tracking-widest" style={{ color: agent.color }}>
                  REC · {agent.aka}
                </p>
                <p className="drama mt-1 text-sm leading-snug text-[#f6f0ff]">“{clip.text}”</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
