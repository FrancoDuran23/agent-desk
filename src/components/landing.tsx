"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROOMMATES } from "@/lib/agents";
import { withBase } from "@/lib/paths";
import { BindingPills } from "./binding-pills";

const EXAMPLES = [
  "Landing del after de Nerdearla en Jujuy: wifi, facturas y charlas que se van de horario",
  "Meetup de jujuy.dev en un patio. Gente que codea con vista a los cerros",
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
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] uppercase">Webflow Cloud × Nerdearla 2026</p>
          <h1 className="display text-5xl leading-none sm:text-7xl">Casa de agentes</h1>
        </div>
        <BindingPills />
      </header>

      <section className="hard grid gap-6 bg-white p-5 sm:grid-cols-[1.3fr_0.7fr] sm:p-7">
        <div>
          <p className="drama text-2xl leading-snug sm:text-3xl">
            Cuatro roommates tienen que entregar un sitio Webflow antes de que el casero los desaloje.
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed">
            Tirás un objetivo caótico. Ellos pelean el nombre, la copy y el CMS en un living que es el canvas de
            Webflow. Vos entrás como la producción: salvás a alguien, vetás una frase o tirás una bomba.
          </p>
          <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            {[
              ["1", "Soltás la idea"],
              ["2", "El living se arma solo"],
              ["3", "Te llevás CMS, playbook y JSON"],
            ].map(([n, label]) => (
              <li key={n} className="hard-sm bg-[#fff7ea] px-3 py-2">
                <span className="display text-xl">{n}</span> {label}
              </li>
            ))}
          </ol>
        </div>
        <form onSubmit={enter} className="flex flex-col gap-3">
          <label className="text-sm font-bold" htmlFor="goal">
            Objetivo de la temporada
          </label>
          <textarea
            id="goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={5}
            maxLength={400}
            className="hard-sm min-h-32 resize-y bg-[#fffdf8] px-3 py-2 outline-none focus:bg-white"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setGoal(example)}
                className="hard-sm bg-[#ffe08a] px-2 py-1 text-left text-xs"
              >
                {example.slice(0, 42)}…
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={pending || goal.trim().length < 3}
            className="display hard bg-[#ff3d8a] px-4 py-3 text-xl text-white disabled:opacity-60"
          >
            {pending ? "Están peleando el sillón…" : "Entrar a la casa"}
          </button>
          {error ? <p className="text-sm font-semibold text-[#ff4d2e]">{error}</p> : null}
          <p className="text-xs leading-relaxed text-[#5c4d43]">
            Sin OPENAI_API_KEY corre en simulacro, con temporada completa. Con token de Webflow, el final puede crear
            la colección de verdad.
          </p>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROOMMATES.map((agent) => (
          <article key={agent.id} className="hard bg-white p-4" style={{ borderTop: `10px solid ${agent.color}` }}>
            <p className="text-3xl" aria-hidden>{agent.emoji}</p>
            <h2 className="display text-2xl">{agent.aka}</h2>
            <p className="text-sm font-semibold">{agent.name} · {agent.room}</p>
            <p className="mt-2 text-sm">{agent.wants}</p>
          </article>
        ))}
      </section>

      <section className="hard grid gap-4 bg-[#1c140f] p-5 text-[#fff8ef] sm:grid-cols-3">
        <div>
          <h2 className="display text-2xl text-[#ffb703]">Webflow de verdad</h2>
          <p className="mt-2 text-sm leading-relaxed">El living es el Designer: páginas, secciones, clases, Collection List y campos.</p>
        </div>
        <div>
          <h2 className="display text-2xl text-[#ff3d8a]">Cloud + bindings</h2>
          <p className="mt-2 text-sm leading-relaxed">D1 guarda la temporada, KV el estado caliente, R2 los entregables.</p>
        </div>
        <div>
          <h2 className="display text-2xl text-[#7dffe0]">Data API y MCP</h2>
          <p className="mt-2 text-sm leading-relaxed">El Tryhard deja un playbook de tools y, si hay token, pega las llamadas.</p>
        </div>
      </section>
    </main>
  );
}
