"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BindingPills } from "@/components/binding-pills";
import { ChatPanel } from "@/components/chat-panel";
import { Confessional } from "@/components/confessional";
import { Deliverables } from "@/components/deliverables";
import { Designer } from "@/components/designer";
import { Interventions } from "@/components/interventions";
import { useSeason } from "@/components/use-season";
import { formatTimer } from "@/lib/paths";

const TABS = [
  ["chat", "Chat"],
  ["living", "Living"],
  ["vos", "Vos"],
  ["entrega", "Entrega"],
] as const;

export function House({ id }: { id: string }) {
  const { run, error, booting, act, publish } = useSeason(id);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("living");
  const [visual, setVisual] = useState(0);

  useEffect(() => {
    if (!run) return;
    setVisual(run.timerMs);
  }, [run?.timerMs, run?.updatedAt]);

  useEffect(() => {
    if (!run || run.paused || run.status !== "live") return;
    const timer = setInterval(() => setVisual((value) => Math.max(0, value - 1000)), 1000);
    return () => clearInterval(timer);
  }, [run?.paused, run?.status, run?.updatedAt]);

  if (booting && !run) {
    return <main className="grid min-h-dvh place-items-center px-6 text-center"><p className="display text-4xl">Abriendo la casa…</p></main>;
  }
  if (!run) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 px-6">
        <p className="display text-4xl">No está la temporada</p>
        <p>{error || "Capaz el proceso se reinició y la memoria se fue con él."}</p>
        <Link href="/" className="hard-sm w-fit bg-[#ffb703] px-3 py-2 font-bold">Otra temporada</Link>
      </main>
    );
  }

  const urgent = visual < 45000;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1500px] flex-col gap-3 px-3 py-3 pb-24 lg:pb-3">
      <header className="hard flex flex-wrap items-center justify-between gap-3 bg-white px-3 py-3">
        <div className="min-w-0">
          <Link href="/" className="display text-2xl">Casa de agentes</Link>
          <p className="truncate text-sm">{run.goal}</p>
        </div>
        <div className={`hard-sm px-3 py-1 text-center ${urgent ? "bg-[#ff4d2e] text-white" : "bg-[#ffb703]"}`}>
          <p className="text-[10px] font-bold tracking-widest">EL CASERO</p>
          <p className="display text-3xl leading-none" aria-label={`Quedan ${formatTimer(visual)}`}>{formatTimer(visual)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="hard-sm bg-white px-2 py-1 text-[11px] font-bold">
            {run.mode === "en-vivo" ? "EN VIVO · LLM" : "SIMULACRO"}
          </span>
          <BindingPills />
        </div>
      </header>
      {run.round ? (
        <p className="tape px-3 py-1 text-center text-sm font-bold">{run.round.title} · {run.round.subtitle}</p>
      ) : null}
      {run.awaiting ? (
        <div className="hard bg-[#ff3d8a] px-3 py-3 text-white">
          <p className="display text-2xl">{run.awaiting.title}</p>
          <p className="text-sm">{run.awaiting.body}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["ansioso", "dramatica", "tryhard", "meme"] as const).map((agent) => (
              <button key={agent} type="button" onClick={() => act({ type: "salvar", agent })} className="bg-white px-2 py-2 text-sm font-bold text-[#1c140f]">
                {agent === "ansioso" ? "Mateo" : agent === "dramatica" ? "Lola" : agent === "tryhard" ? "Facu" : "Cami"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="hard-sm bg-white px-3 py-2 text-sm font-semibold text-[#ff4d2e]">{error}</p> : null}
      <p className="text-xs text-[#6d5c52]">{run.modeNote} · {run.persistence.driver} · {run.persistence.beats} beats en el store</p>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_300px] lg:h-[calc(100dvh-11rem)]">
        <div className={`hard min-h-0 overflow-hidden bg-white ${tab === "chat" ? "block" : "hidden lg:block"}`}>
          <ChatPanel run={run} />
        </div>
        <div className={`min-h-0 ${tab === "living" ? "block" : "hidden lg:block"}`}>
          <Designer run={run} />
        </div>
        <div className={`hard scroll-thin min-h-0 space-y-4 overflow-auto bg-[#fffaf3] p-3 ${tab === "vos" ? "block" : "hidden lg:block"}`}>
          <Confessional run={run} />
          <Interventions run={run} onAct={act} />
        </div>
      </div>
      <div id="entregables" className={tab === "entrega" ? "block" : "hidden lg:block"}>
        <div className="hard bg-white p-3">
          <Deliverables run={run} onPublish={publish} />
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t-[3px] border-[#1c140f] bg-[#fff3e4] lg:hidden" aria-label="Secciones">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`px-2 py-3 text-sm font-bold ${tab === id ? "bg-[#1c140f] text-white" : ""}`}>
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
