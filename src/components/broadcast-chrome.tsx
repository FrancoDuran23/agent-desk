"use client";

import { dayInHouse, episodeTitle, tickerHeadlines } from "@/lib/show-state";
import { formatTimer } from "@/lib/paths";
import type { PublicRun } from "@/lib/types";

export function BroadcastBar({
  run,
  visual,
}: {
  run: PublicRun;
  visual: number;
}) {
  const urgent = visual < 45000;
  const day = dayInHouse(run);
  const episode = episodeTitle(run);

  return (
    <header className="broadcast-card relative z-30 flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff1a3c] text-xs font-black tracking-wide text-white shadow-[0_0_20px_#ff1a3c66]"
          aria-hidden
        >
          CDA
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="live-badge inline-flex items-center gap-1.5 rounded-sm bg-[#ff1a3c] px-2 py-0.5 text-[11px] font-black tracking-wider text-white">
              <span className="rec" /> EN VIVO
            </span>
            <span className="hidden text-[11px] font-semibold tracking-[0.2em] text-[#a89bb8] uppercase sm:inline">
              Canal Casa
            </span>
          </div>
          <p className="display mt-0.5 truncate text-lg leading-none text-white sm:text-xl">{episode}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="rounded-full border border-[#3a3158] bg-[#0a0612]/80 px-3 py-1 text-center">
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#2de2e6] uppercase">Día {day}</p>
          <p className="text-xs font-semibold text-[#f6f0ff]">en la casa</p>
        </div>
        <div
          className={`min-w-[5.5rem] rounded-lg px-3 py-1 text-center ${
            urgent
              ? "bg-[#ff1a3c] text-white shadow-[0_0_24px_#ff1a3c66]"
              : "border border-[#f5c54255] bg-[#f5c54222] text-[#ffe566]"
          }`}
        >
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase">Gala en</p>
          <p className="display text-3xl leading-none" aria-label={`Quedan ${formatTimer(visual)}`}>
            {formatTimer(visual)}
          </p>
        </div>
        <span className="rounded-full border border-[#3a3158] px-2.5 py-1 text-[11px] font-bold text-[#a89bb8]">
          {run.mode === "en-vivo" ? "SEÑAL HD" : "REPETICIÓN"}
        </span>
      </div>
    </header>
  );
}

export function Ticker({ run }: { run: PublicRun }) {
  const headlines = tickerHeadlines(run);
  const loop = [...headlines, ...headlines];
  return (
    <div
      className="relative z-20 overflow-hidden border-y border-[#3a3158] bg-[#ff1a3c] py-1.5 text-white"
      aria-label="Zócalo de noticias"
    >
      <div className="ticker-track gap-10 px-4 text-sm font-bold tracking-wide">
        {loop.map((line, i) => (
          <span key={`${line}-${i}`} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
            <span className="rounded-sm bg-black/25 px-1.5 py-0.5 text-[10px] tracking-widest">ÚLTIMO MOMENTO</span>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ChannelBug() {
  return (
    <div
      className="pointer-events-none absolute top-3 right-3 z-40 hidden items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm sm:flex"
      aria-hidden
    >
      <span className="display text-sm text-white/90">CDA</span>
      <span className="text-[10px] font-bold tracking-widest text-[#2de2e6]">HD</span>
    </div>
  );
}
