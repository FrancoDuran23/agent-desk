"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  dayInHouse,
  deriveContestants,
  dramaLevel,
  narratorLine,
} from "@/lib/show-state";
import { BroadcastBar, ChannelBug, Ticker } from "./broadcast-chrome";
import { ChatPanel } from "./chat-panel";
import { ConfessionalOverlay, ConfessionalRail } from "./confessional";
import { ContestantRow } from "./contestants";
import { Deliverables } from "./deliverables";
import { DramaMeter } from "./drama-meter";
import { GalaScreen } from "./gala";
import { HouseMap } from "./house-map";
import { Interventions } from "./interventions";
import { SitePreview } from "./site-preview";
import { useSeason } from "./use-season";

const TABS = [
  ["casa", "Casa"],
  ["prueba", "Prueba"],
  ["vivo", "En vivo"],
  ["gala", "Gala"],
] as const;

export function House({ id }: { id: string }) {
  const { run, error, booting, act, publish } = useSeason(id);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("casa");
  const [visual, setVisual] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!run) return;
    setVisual(run.timerMs);
  }, [run?.timerMs, run?.updatedAt]);

  useEffect(() => {
    if (!run || run.paused || run.status !== "live") return;
    const timer = setInterval(() => setVisual((v) => Math.max(0, v - 1000)), 1000);
    return () => clearInterval(timer);
  }, [run?.paused, run?.status, run?.updatedAt]);

  const contestants = useMemo(() => (run ? deriveContestants(run) : []), [run]);
  const drama = run ? dramaLevel(run) : 0;
  const narrator = run ? narratorLine(run) : "";
  const day = run ? dayInHouse(run) : 1;

  if (!mounted || (booting && !run)) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <span className="rec mx-auto mb-3 block" />
          <p className="display text-5xl text-white">Abriendo la casa…</p>
          <p className="mt-2 text-sm text-[#a89bb8]">Calentando cámaras y confesionario</p>
        </div>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 px-6">
        <p className="display text-5xl">Temporada no encontrada</p>
        <p className="text-[#cbbfe0]">{error || "Capaz el proceso se reinició y la memoria se fue con él."}</p>
        <Link href="/" className="w-fit rounded-full bg-[#ff2d6a] px-4 py-2 font-bold text-white">
          Otra temporada
        </Link>
      </main>
    );
  }

  const showGala = run.status === "finale" || run.status === "evicted";

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[1500px] flex-col gap-3 px-3 py-3 pb-24 lg:pb-3">
      <ChannelBug />
      <BroadcastBar run={run} visual={visual} />
      <Ticker run={run} />

      {run.awaiting ? (
        <div className="broadcast-card-glow border border-[#ff2d6a]/50 bg-[#ff2d6a22] px-4 py-3">
          <p className="text-[11px] font-black tracking-[0.25em] text-[#ff8fb3] uppercase">Placa de nominados</p>
          <p className="display text-3xl text-white">{run.awaiting.title}</p>
          <p className="text-sm text-[#f0e8ff]">{run.awaiting.body}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["ansioso", "dramatica", "tryhard", "meme"] as const).map((agent) => (
              <button
                key={agent}
                type="button"
                onClick={() => void act({ type: "salvar", agent })}
                className="rounded-xl bg-white px-2 py-2 text-sm font-bold text-[#1a1228]"
              >
                Salvar a {agent === "ansioso" ? "Mateo" : agent === "dramatica" ? "Lola" : agent === "tryhard" ? "Facu" : "Cami"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[#ff4d2e]/40 bg-[#ff4d2e22] px-3 py-2 text-sm font-semibold text-[#ffb4a8]">
          {error}
        </p>
      ) : null}

      <p className="drama text-center text-sm text-[#cbbfe0] lg:text-left">
        Día {day} · “{narrator}”
      </p>

      <ContestantRow contestants={contestants} />

      {showGala ? (
        <GalaScreen run={run} onPublish={publish} />
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 lg:h-[calc(100dvh-16rem)] lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_300px]">
          <div className={`min-h-0 space-y-3 overflow-auto ${tab === "casa" ? "block" : "hidden lg:block"}`}>
            <HouseMap contestants={contestants} />
            <DramaMeter level={drama} narrator={narrator} />
          </div>
          <div className={`min-h-0 ${tab === "prueba" ? "block" : "hidden lg:block"}`}>
            <SitePreview run={run} />
          </div>
          <div className={`scroll-thin min-h-0 space-y-3 overflow-auto ${tab === "vivo" ? "block" : "hidden lg:block"}`}>
            <ConfessionalRail run={run} />
            <Interventions run={run} onAct={act} />
            <div className="broadcast-card max-h-72 overflow-hidden">
              <ChatPanel run={run} />
            </div>
          </div>
        </div>
      )}

      <div id="entrega" className={tab === "gala" ? "block" : "hidden lg:block"}>
        {!showGala ? (
          <div className="broadcast-card p-3">
            <Deliverables run={run} onPublish={publish} />
          </div>
        ) : null}
      </div>

      <ConfessionalOverlay run={run} />

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[#3a3158] bg-[#0a0612]/95 backdrop-blur lg:hidden"
        aria-label="Secciones"
      >
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-2 py-3 text-sm font-bold ${tab === id ? "bg-[#ff2d6a] text-white" : "text-[#cbbfe0]"}`}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
