"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROOMMATES } from "@/lib/agents";
import { withBase } from "@/lib/paths";
import { Portrait } from "./portrait";

const EXAMPLES = [
  "Landing para un after de verano: wifi, facturas y charlas que se van de horario",
  "Meetup en un patio. Gente que labura con mate y vista al atardecer",
  "Una app que todavía no sé qué hace, pero el viernes tiene que parecer un producto",
];

export function Landing() {
  const router = useRouter();
  const [goal, setGoal] = useState(EXAMPLES[0]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("goal");
    if (preset) setGoal(preset);
  }, []);

  async function enter(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch(withBase("/api/runs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error || "La casa no abrió.");
      router.push(`/casa/${data.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No entramos.");
      setPending(false);
    }
  }

  return (
    <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute top-4 right-4 hidden items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 sm:flex" aria-hidden>
        <span className="display text-sm text-white/90">CDA</span>
        <span className="text-[10px] font-bold tracking-widest text-[#2de2e6]">HD</span>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-sm bg-[#ff1a3c] px-2 py-0.5 text-[11px] font-black tracking-wider text-white">
            <span className="rec" /> EN VIVO
          </div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#2de2e6] uppercase">Temporada 1 · Reality show</p>
          <h1 className="display text-6xl leading-none text-white sm:text-8xl">Casa de agentes</h1>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-[#cbbfe0]">
          Cuatro roommates. Una prueba semanal. Vos sos la producción: salvás, nominás o tirás una bomba de caos.
        </p>
      </header>

      <section className="broadcast-card-glow grid gap-6 p-5 sm:grid-cols-[1.25fr_0.75fr] sm:p-7">
        <div>
          <p className="drama text-2xl leading-snug text-white sm:text-3xl">
            Tienen que entregar el sitio del cliente antes de la gala de eliminación.
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[#cbbfe0]">
            Pelean el nombre, la copy y el look del sitio. Hay confesionario, alianzas y drama en la cocina.
            Cuando suena el timbre del casero, alguien se va — o entregan la prueba.
          </p>
          <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            {[
              ["01", "Soltás la brief"],
              ["02", "Ellos pelean en vivo"],
              ["03", "Gala: ¿quién queda?"],
            ].map(([n, label]) => (
              <li key={n} className="rounded-xl border border-[#3a3158] bg-[#0a0612]/60 px-3 py-2">
                <span className="display text-2xl text-[#ff2d6a]">{n}</span>
                <span className="mt-1 block font-semibold text-[#f0e8ff]">{label}</span>
              </li>
            ))}
          </ol>
        </div>
        <form onSubmit={enter} className="flex flex-col gap-3">
          <label className="text-sm font-bold text-[#f5c542]" htmlFor="goal">
            Brief de la prueba semanal
          </label>
          <textarea
            id="goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={5}
            maxLength={400}
            className="min-h-32 resize-y rounded-xl border border-[#3a3158] bg-[#0a0612] px-3 py-2 text-[#f6f0ff] outline-none focus:border-[#ff2d6a]"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setGoal(example)}
                className="rounded-full border border-[#3a3158] bg-[#1a1528] px-2 py-1 text-left text-xs text-[#cbbfe0]"
              >
                {example.slice(0, 42)}…
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={pending || goal.trim().length < 3}
            className="display rounded-xl bg-[#ff2d6a] px-4 py-3 text-2xl text-white shadow-[0_0_30px_#ff2d6a55] disabled:opacity-60"
          >
            {pending ? "Entrando a la casa…" : "Entrar al vivo"}
          </button>
          {error ? <p className="text-sm font-semibold text-[#ff6b6b]">{error}</p> : null}
          <p className="text-xs leading-relaxed text-[#8f84a8]">
            Sin clave de IA corre igual en simulacro, con temporada completa. Con Webflow, la producción puede publicar el resultado.
          </p>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROOMMATES.map((agent) => (
          <article key={agent.id} className="broadcast-card flex flex-col items-center gap-2 p-4 text-center" style={{ borderTop: `4px solid ${agent.color}` }}>
            <Portrait agent={agent.id} size={88} />
            <h2 className="display text-2xl leading-none" style={{ color: agent.color }}>{agent.aka}</h2>
            <p className="text-sm font-semibold text-[#e8e0ff]">{agent.name}</p>
            <p className="text-xs text-[#a89bb8]">{agent.tagline}</p>
            <p className="mt-1 text-sm text-[#cbbfe0]">{agent.wants}</p>
          </article>
        ))}
      </section>

      <section className="broadcast-card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <h2 className="display text-2xl text-[#f5c542]">Prueba semanal</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#cbbfe0]">
            Construyen el sitio del cliente en el living. Ves el preview, no el código.
          </p>
        </div>
        <div>
          <h2 className="display text-2xl text-[#ff2d6a]">Confesionario</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#cbbfe0]">
            Cortes a cámara, alianzas y traiciones. El drama meter no miente.
          </p>
        </div>
        <div>
          <h2 className="display text-2xl text-[#2de2e6]">Gala en vivo</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#cbbfe0]">
            Votá a quién salvar, tirales una bomba de caos y mirá quién sobrevive al timbre.
          </p>
        </div>
      </section>
    </main>
  );
}
