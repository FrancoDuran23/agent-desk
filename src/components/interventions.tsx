"use client";

import { useState } from "react";
import { ROOMMATES } from "@/lib/agents";
import type { Intervention, PublicRun } from "@/lib/types";

export function Interventions({
  run,
  onAct,
}: {
  run: PublicRun;
  onAct: (action: Intervention) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(action: Intervention) {
    setBusy(true);
    try {
      await onAct(action);
      if (action.type === "vetar") setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`flex flex-col gap-3 ${run.awaiting ? "wiggle" : ""}`} aria-label="Intervenciones">
      <header>
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase">La producción</p>
        <h2 className="display text-xl">{run.awaiting ? run.awaiting.title : "Podés meterte"}</h2>
        {run.awaiting ? <p className="text-sm">{run.awaiting.body}</p> : <p className="text-sm text-[#6d5c52]">Salvá, vetá o tirales una bomba. Si no, siguen solos.</p>}
      </header>
      <div className="grid grid-cols-2 gap-2">
        {ROOMMATES.map((agent) => (
          <button
            key={agent.id}
            type="button"
            disabled={busy || run.status !== "live"}
            onClick={() => go({ type: "salvar", agent: agent.id as "ansioso" | "dramatica" | "tryhard" | "meme" })}
            className="hard-sm px-2 py-2 text-left text-sm font-bold text-white disabled:opacity-50"
            style={{ background: agent.color }}
          >
            Salvar a {agent.name}
          </button>
        ))}
      </div>
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void go({ type: "vetar", note });
        }}
      >
        <label className="text-xs font-bold" htmlFor="veto">Vetar una frase</label>
        <input
          id="veto"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="sin sinergias, sin líderes…"
          maxLength={140}
          className="hard-sm bg-white px-2 py-2 text-sm"
        />
        <button type="submit" disabled={busy || run.status !== "live"} className="hard-sm bg-[#1c140f] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
          Vetar la copy
        </button>
      </form>
      <button type="button" disabled={busy || run.status !== "live"} onClick={() => go({ type: "caos" })} className="hard bg-[#ffb703] px-3 py-3 text-sm font-bold disabled:opacity-50">
        Bomba de caos
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => go(run.paused ? { type: "seguir" } : { type: "pausar" })} className="hard-sm bg-white px-2 py-2 text-sm font-bold">
          {run.paused ? "Seguir" : "Pausar"}
        </button>
        <button
          type="button"
          onClick={() => go({ type: "pace", pace: run.pace === "rapido" ? "normal" : "rapido" })}
          className="hard-sm bg-white px-2 py-2 text-sm font-bold"
        >
          {run.pace === "rapido" ? "Velocidad normal" : "Adelantar"}
        </button>
      </div>
      {run.awaiting ? (
        <button type="button" onClick={() => go({ type: "timeout" })} className="text-xs font-bold underline">
          Que decidan ellos
        </button>
      ) : null}
    </section>
  );
}
