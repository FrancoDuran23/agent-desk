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
    <section className={`broadcast-card flex flex-col gap-3 p-3 ${run.awaiting ? "broadcast-card-glow" : ""}`} aria-label="Producción">
      <header>
        <p className="text-[11px] font-bold tracking-[0.16em] text-[#f5c542] uppercase">La producción</p>
        <h2 className="display text-xl text-white">
          {run.awaiting ? run.awaiting.title : "Podés meterte"}
        </h2>
        {run.awaiting ? (
          <p className="text-sm text-[#cbbfe0]">{run.awaiting.body}</p>
        ) : (
          <p className="text-sm text-[#a89bb8]">Salvá, vetá copy o tirales una bomba. Si no, siguen solos.</p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2">
        {ROOMMATES.map((agent) => (
          <button
            key={agent.id}
            type="button"
            disabled={busy || run.status !== "live"}
            onClick={() => go({ type: "salvar", agent: agent.id as "ansioso" | "dramatica" | "tryhard" | "meme" })}
            className="rounded-xl px-2 py-2 text-left text-sm font-bold text-white disabled:opacity-50"
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
        <label className="text-xs font-bold text-[#cbbfe0]" htmlFor="veto">
          Vetar una frase
        </label>
        <input
          id="veto"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="sin sinergias, sin líderes…"
          maxLength={140}
          className="rounded-xl border border-[#3a3158] bg-[#0a0612] px-2 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={busy || run.status !== "live"}
          className="rounded-xl bg-[#1a1228] px-3 py-2 text-sm font-bold text-white ring-1 ring-[#3a3158] disabled:opacity-50"
        >
          Vetar la copy
        </button>
      </form>

      <button
        type="button"
        disabled={busy || run.status !== "live"}
        onClick={() => go({ type: "caos" })}
        className="rounded-xl bg-[#f5c542] px-3 py-3 text-sm font-black text-[#1a1228] disabled:opacity-50"
      >
        Bomba de caos
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => go(run.paused ? { type: "seguir" } : { type: "pausar" })}
          className="rounded-xl border border-[#3a3158] bg-[#120a1c] px-2 py-2 text-sm font-bold text-white"
        >
          {run.paused ? "Seguir" : "Pausar"}
        </button>
        <button
          type="button"
          onClick={() => go({ type: "pace", pace: run.pace === "rapido" ? "normal" : "rapido" })}
          className="rounded-xl border border-[#3a3158] bg-[#120a1c] px-2 py-2 text-sm font-bold text-white"
        >
          {run.pace === "rapido" ? "Velocidad normal" : "Adelantar"}
        </button>
      </div>

      {run.awaiting ? (
        <button type="button" onClick={() => go({ type: "timeout" })} className="text-xs font-bold text-[#a89bb8] underline">
          Que decidan ellos
        </button>
      ) : null}
    </section>
  );
}
