"use client";

import { AGENTS, ROOM_META, type RoomId } from "@/lib/agents";
import type { ContestantState } from "@/lib/show-state";

const LAYOUT: { id: RoomId; col: string }[] = [
  { id: "habitacion", col: "col-span-1" },
  { id: "living", col: "col-span-2" },
  { id: "cocina", col: "col-span-1" },
  { id: "confesionario", col: "col-span-2" },
  { id: "jardin", col: "col-span-2" },
];

export function HouseMap({ contestants }: { contestants: ContestantState[] }) {
  const byRoom = (room: RoomId) => contestants.filter((c) => c.room === room);

  return (
    <section className="broadcast-card flex h-full flex-col p-3" aria-label="Mapa de la casa">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#2de2e6] uppercase">Plano</p>
          <h2 className="display text-2xl leading-none">La casa</h2>
        </div>
        <span className="text-[10px] font-semibold text-[#a89bb8]">quién está dónde</span>
      </header>
      <div className="grid flex-1 grid-cols-4 gap-2">
        {LAYOUT.map(({ id, col }) => {
          const meta = ROOM_META[id];
          const here = byRoom(id);
          const hot = id === "confesionario" && here.length > 0;
          return (
            <div
              key={id}
              className={`${col} relative overflow-hidden rounded-xl border p-2 ${
                hot
                  ? "border-[#ff2d6a] bg-[#ff2d6a22] shadow-[0_0_20px_#ff2d6a44]"
                  : "border-[#3a3158] bg-[#0e0a18]/80"
              }`}
            >
              <p className="text-[11px] font-bold text-[#cbbfe0]">
                <span aria-hidden>{meta.emoji} </span>
                {meta.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {here.length === 0 ? (
                  <span className="text-[10px] text-[#6d6280]">vacío</span>
                ) : (
                  here.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                      style={{ background: AGENTS[c.id].color }}
                      title={AGENTS[c.id].aka}
                    >
                      <span aria-hidden>{AGENTS[c.id].emoji}</span>
                      {AGENTS[c.id].name}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
