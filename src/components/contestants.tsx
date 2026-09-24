"use client";

import { AGENTS } from "@/lib/agents";
import { moodLabel, type ContestantState } from "@/lib/show-state";
import { Portrait } from "./portrait";

export function ContestantRow({ contestants }: { contestants: ContestantState[] }) {
  return (
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Participantes">
      {contestants.map((c) => {
        const agent = AGENTS[c.id];
        const ally = c.alliance ? AGENTS[c.alliance] : null;
        const rival = c.rivalry ? AGENTS[c.rivalry] : null;
        return (
          <article
            key={c.id}
            className="broadcast-card flex flex-col items-center gap-2 p-3 text-center"
            style={{ borderTop: `3px solid ${agent.color}` }}
          >
            <Portrait agent={c.id} size={72} live={c.room === "confesionario"} />
            <div className="min-w-0 w-full">
              <p className="display text-xl leading-none" style={{ color: agent.color }}>
                {agent.aka}
              </p>
              <p className="text-xs font-semibold text-[#cbbfe0]">{agent.name}</p>
              <p className="mt-1 text-[11px] text-[#a89bb8]">
                {moodLabel(c.mood)} · {agent.emoji}
              </p>
            </div>
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold tracking-wider text-[#a89bb8] uppercase">
                <span>Popularidad</span>
                <span style={{ color: agent.color }}>{c.popularidad}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#2a2438]">
                <div
                  className="meter-fill h-full rounded-full"
                  style={{ width: `${c.popularidad}%`, background: agent.color }}
                />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-[#8f84a8]">
              {ally ? <>Alianza: {ally.name}</> : null}
              {ally && rival ? " · " : null}
              {rival ? <>Rival: {rival.name}</> : null}
            </p>
          </article>
        );
      })}
    </section>
  );
}
