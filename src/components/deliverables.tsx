"use client";

import { useState } from "react";
import { AGENTS } from "@/lib/agents";
import { withBase } from "@/lib/paths";
import type { PublicRun } from "@/lib/types";

const DOCS = [
  ["brief", "Brief"],
  ["copy", "Copy"],
  ["webflow", "Webflow JSON"],
  ["playbook", "Playbook MCP"],
  ["fight", "Pelea"],
  ["highlights", "Highlights"],
] as const;

export function Deliverables({
  run,
  onPublish,
}: {
  run: PublicRun;
  onPublish: (confirm: boolean) => Promise<void>;
}) {
  const [tab, setTab] = useState<(typeof DOCS)[number][0]>("playbook");
  const [pending, setPending] = useState(false);
  const page = run.canvas.pages[0];

  async function publish(confirm: boolean) {
    setPending(true);
    try {
      await onPublish(confirm);
    } finally {
      setPending(false);
    }
  }

  async function download(doc: string) {
    const response = await fetch(withBase(`/api/runs/${run.id}/export?doc=${doc}`));
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc;
    link.click();
    URL.revokeObjectURL(url);
  }

  const preview =
    tab === "playbook"
      ? run.playbook
      : tab === "fight"
        ? run.fightLog
        : tab === "highlights"
          ? run.highlight
          : tab === "webflow"
            ? { pages: run.canvas.pages, collections: run.canvas.collections, components: run.canvas.components, assets: run.canvas.assets, variables: run.canvas.variables }
            : tab === "copy"
              ? { seo: page?.seo, openGraph: page?.openGraph, sections: page?.elements.map((element) => ({ name: element.name, className: element.className })) }
              : { goal: run.goal, site: run.canvas.siteName, thesis: page?.seo.description, sections: page?.elements.map((element) => element.name) };

  return (
    <section className="flex flex-col gap-3" aria-label="Entregables">
      <header>
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase">Entregables</p>
        <h2 className="display text-2xl">{run.status === "live" ? "Se está armando" : run.status === "evicted" ? "Desalojo con JSON" : "Temporada cerrada"}</h2>
        <p className="text-xs text-[#6d5c52]">{run.persistence.note}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {DOCS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`hard-sm px-2 py-1 text-xs font-bold ${tab === id ? "bg-[#1c140f] text-white" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      <pre className="scroll-thin max-h-72 overflow-auto bg-[#1c140f] p-3 text-[11px] leading-relaxed text-[#fff3e4]">{JSON.stringify(preview, null, 2)}</pre>
      <div className="flex flex-wrap gap-2">
        {DOCS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => download(id)} className="hard-sm bg-white px-2 py-1 text-xs font-bold">
            Bajar {label}
          </button>
        ))}
      </div>
      <div className="hard-sm bg-white p-3">
        <p className="text-sm font-bold">Publisher · Data API</p>
        <p className="mt-1 text-xs leading-relaxed">
          {run.webflow.configured
            ? "Hay token y sitio. Publicar crea la colección y los ítems."
            : "Sin credenciales: el botón de dry-run muestra los POST/GET que un juez reconocería."}
          {run.webflow.hasPage ? " También actualiza SEO de la página." : " Sin WEBFLOW_PAGE_ID no toca páginas."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => publish(false)} className="hard-sm bg-[#ffe08a] px-3 py-2 text-sm font-bold">
            {pending ? "Armando…" : "Dry-run"}
          </button>
          <button type="button" disabled={pending || !run.webflow.configured} onClick={() => publish(true)} className="hard-sm bg-[#0f9f6e] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
            Publicar en Webflow
          </button>
        </div>
        {run.publishResult ? (
          <div className="mt-3">
            <p className="text-sm font-bold">{run.publishResult.mode === "live" ? "En vivo" : "Dry-run"} · {run.publishResult.note}</p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-[11px]">
              {run.publishResult.calls.map((call, index) => (
                <li key={`${call.path}-${index}`} className={call.status >= 400 ? "text-[#ff4d2e]" : ""}>
                  <span className="font-bold">{call.method}</span> {call.path} {call.status ? `· ${call.status}` : ""} — {call.note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {run.highlight.length ? (
        <div>
          <h3 className="display text-lg">Highlight reel</h3>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {run.highlight.map((moment, index) => {
              const agent = moment.agent === "casa" ? null : AGENTS[moment.agent];
              return (
                <article key={moment.id} className="hard-sm min-w-[14rem] bg-white p-3">
                  <p className="text-[10px] font-bold tracking-widest">MOMENTO {String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-1 text-xs font-bold" style={{ color: agent?.color }}>{agent?.aka ?? "La casa"}</p>
                  <p className="mt-1 text-sm">{moment.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
