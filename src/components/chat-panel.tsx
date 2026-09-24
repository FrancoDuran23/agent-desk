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
    <section className="flex h-full min-h-[16rem] flex-col" aria-label="Audio del living">
      <header className="flex items-center justify-between border-b border-[#3a3158] px-3 py-2">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#2de2e6] uppercase">Micrófono</p>
          <h2 className="display text-xl text-white">Audio del living</h2>
        </div>
        <p className="text-xs font-semibold text-[#a89bb8]">
          {run.revealed.length}/{run.totalBeats}
        </p>
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
      <article className="max-w-full rounded-lg bg-[#0a0612]/50" style={{ borderLeft: `4px solid ${agent.color}` }}>
        <p className="px-2 pt-1 text-[11px] font-bold" style={{ color: agent.color }}>
          <span aria-hidden>{agent.emoji} </span>
          {agent.aka}
        </p>
        <p className="px-2 pb-2 text-sm leading-snug text-[#f0e8ff]">{beat.text}</p>
      </article>
    );
  }
  if (beat.kind === "aside") {
    return <p className="text-center text-xs font-semibold text-[#8f84a8]">{beat.text}</p>;
  }
  if (beat.kind === "round") {
    return (
      <p className="rounded-lg bg-[#f5c54222] px-2 py-1 text-center text-xs font-bold text-[#f5c542]">
        {beat.title} · {beat.subtitle}
      </p>
    );
  }
  if (beat.kind === "vote") {
    return (
      <article className="rounded-xl border border-[#3a3158] bg-[#1a1228] p-2">
        <p className="text-[11px] font-bold tracking-wider text-[#ff2d6a] uppercase">Placa · {beat.topic}</p>
        <ul className="mt-1 space-y-1 text-xs text-[#cbbfe0]">
          {beat.tally.map((row) => (
            <li key={row.agent} className="flex justify-between gap-2">
              <span>{AGENTS[row.agent].aka}</span>
              <span className="text-right font-semibold text-white">{row.choice}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm font-bold text-[#f5c542]">{beat.winner}</p>
      </article>
    );
  }
  if (beat.kind === "canvas") {
    return (
      <p className="text-xs font-semibold" style={{ color: AGENTS[beat.agent].color }}>
        {AGENTS[beat.agent].name} avanzó la prueba: {beat.caption}
      </p>
    );
  }
  if (beat.kind === "human") {
    return (
      <p className="rounded-lg bg-[#ff2d6a] px-2 py-1 text-sm font-bold text-white">{beat.prompt.title}</p>
    );
  }
  if (beat.kind === "finale") {
    return <p className="rounded-lg bg-[#0a0612] px-2 py-2 text-sm text-[#f5c542]">{beat.line}</p>;
  }
  return null;
}
