"use client";

import { useEffect, useRef } from "react";
import { AGENTS } from "@/lib/agents";
import type { Beat, PublicRun } from "@/lib/types";

export function ChatPanel({ run }: { run: PublicRun }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [run.revealed.length, run.awaiting?.id]);

  return (
    <section className="flex h-full min-h-[24rem] flex-col bg-white" aria-label="Chat de la casa">
      <header className="flex items-center justify-between border-b-[3px] border-[#1c140f] px-3 py-2">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase">Chat de la casa</p>
          <h2 className="display text-xl">Pasillo</h2>
        </div>
        <p className="text-xs font-semibold">{run.revealed.length}/{run.totalBeats}</p>
      </header>
      <div className="scroll-thin flex flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
        {run.revealed.map((beat) => (
          <BeatView key={beat.id} beat={beat} />
        ))}
        <div ref={end} />
      </div>
    </section>
  );
}

function BeatView({ beat }: { beat: Beat }) {
  if (beat.kind === "confession") return null;
  if (beat.kind === "chat") {
    const agent = AGENTS[beat.agent];
    return (
      <article className="pop max-w-full" style={{ borderLeft: `5px solid ${agent.color}` }}>
        <p className="px-2 pt-1 text-[11px] font-bold">
          <span aria-hidden>{agent.emoji} </span>
          {agent.aka}
        </p>
        <p className="px-2 pb-2 text-sm leading-snug">{beat.text}</p>
      </article>
    );
  }
  if (beat.kind === "aside") return <p className="text-center text-xs font-semibold text-[#7a6558]">{beat.text}</p>;
  if (beat.kind === "round") {
    return (
      <p className="tape px-2 py-1 text-center text-xs font-bold">
        {beat.title} · {beat.subtitle}
      </p>
    );
  }
  if (beat.kind === "vote") {
    return (
      <article className="hard-sm bg-[#fff7ea] p-2">
        <p className="text-[11px] font-bold uppercase">Votación · {beat.topic}</p>
        <ul className="mt-1 space-y-1 text-xs">
          {beat.tally.map((row) => (
            <li key={row.agent} className="flex justify-between gap-2">
              <span>{AGENTS[row.agent].aka}</span>
              <span className="text-right font-semibold">{row.choice}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-bold">{beat.winner}</p>
      </article>
    );
  }
  if (beat.kind === "canvas") {
    return (
      <p className="text-xs font-semibold" style={{ color: AGENTS[beat.agent].color }}>
        {AGENTS[beat.agent].name} tocó el canvas: {beat.caption}
      </p>
    );
  }
  if (beat.kind === "human") return <p className="hard-sm bg-[#ff3d8a] px-2 py-1 text-sm font-bold text-white">{beat.prompt.title}</p>;
  if (beat.kind === "finale") {
    return <p className="hard-sm bg-[#1c140f] px-2 py-2 text-sm text-[#fff3e4]">{beat.line}</p>;
  }
  return null;
}
