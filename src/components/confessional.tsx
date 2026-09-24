"use client";

import { AGENTS } from "@/lib/agents";
import type { PublicRun } from "@/lib/types";

export function Confessional({ run }: { run: PublicRun }) {
  const clips = run.revealed.filter((beat) => beat.kind === "confession");
  return (
    <section className="flex flex-col gap-3" aria-label="Confesionario">
      <header className="flex items-center gap-2">
        <span className="rec" aria-hidden />
        <h2 className="display text-xl">Confesionario</h2>
      </header>
      {clips.length === 0 ? <p className="text-sm text-[#6d5c52]">Todavía nadie se escondió a hablar a cámara.</p> : null}
      <div className="flex flex-col gap-3">
        {[...clips].reverse().slice(0, 3).map((clip) => {
          if (clip.kind !== "confession") return null;
          const agent = AGENTS[clip.agent];
          return (
            <article key={clip.id} className="pop border-[3px] border-[#1c140f] bg-[#1c140f] p-3 text-[#fff8ef]" style={{ boxShadow: `6px 6px 0 ${agent.color}` }}>
              <p className="text-[11px] font-bold tracking-widest" style={{ color: agent.color }}>REC · {agent.aka}</p>
              <p className="drama mt-2 text-lg leading-snug">“{clip.text}”</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
