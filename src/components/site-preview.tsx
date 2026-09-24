"use client";

import { AGENTS } from "@/lib/agents";
import type { PublicRun, WfElement } from "@/lib/types";

function findOf(el: WfElement, type: WfElement["type"]): WfElement | undefined {
  if (el.type === type) return el;
  for (const child of el.children ?? []) {
    const found = findOf(child, type);
    if (found) return found;
  }
  return undefined;
}

function findAll(el: WfElement, type: WfElement["type"]): WfElement[] {
  const found = el.type === type ? [el] : [];
  for (const child of el.children ?? []) found.push(...findAll(child, type));
  return found;
}

export function SitePreview({ run }: { run: PublicRun }) {
  const page = run.canvas.pages[0];
  const collection = run.canvas.collections[0];
  const last = run.revealed.at(-1);
  const focus = last?.kind === "canvas" ? last.focusId : undefined;
  const progress = Math.min(100, Math.round((run.revealed.length / Math.max(1, run.totalBeats)) * 100));

  return (
    <section className="broadcast-card flex h-full min-h-[22rem] flex-col overflow-hidden" aria-label="Prueba semanal">
      <header className="flex items-center justify-between gap-2 border-b border-[#3a3158] px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#f5c542] uppercase">Prueba semanal</p>
          <h2 className="display truncate text-2xl leading-none text-white">
            {run.canvas.siteName || "El sitio del cliente"}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold tracking-wider text-[#a89bb8] uppercase">Avance</p>
          <p className="display text-2xl leading-none text-[#2de2e6]">{progress}%</p>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-[#3a3158] bg-[#0a0612]/60 px-3 py-1.5 text-[11px] text-[#a89bb8]">
        <span className="font-bold text-[#7dffb3]">Cliente</span>
        <span className="truncate">{run.goal}</span>
      </div>

      <div className="site-preview-shell scroll-thin min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        <div className="mx-auto max-w-lg overflow-hidden rounded-xl border border-[#ddd] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#eee] bg-[#fafafa] px-3 py-2 text-[11px] text-[#666]">
            <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <span className="h-2 w-2 rounded-full bg-[#28c840]" />
            <span className="truncate font-semibold">preview · {page?.slug || "home"}</span>
          </div>

          {!page || page.elements.length === 0 ? (
            <div className="space-y-3 p-8 text-center">
              <p className="display text-3xl text-[#1a1228]">Página en blanco</p>
              <p className="text-sm text-[#666]">
                La prueba semanal recién arranca. Cuando peleen el hero, acá se va a ver el sitio.
              </p>
              <div className="mx-auto h-24 max-w-xs animate-pulse rounded-lg bg-[#f0eaf8]" />
            </div>
          ) : (
            page.elements.map((el) => (
              <SectionView
                key={el.id}
                element={el}
                collectionName={collection?.displayName}
                fresh={focus === el.id}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function SectionView({
  element,
  collectionName,
  fresh,
}: {
  element: WfElement;
  collectionName?: string;
  fresh: boolean;
}) {
  const heading = findOf(element, "Heading");
  const paragraph = findOf(element, "Paragraph");
  const button = findOf(element, "Button");
  const owner = element.owner ? AGENTS[element.owner] : null;
  const ring = fresh ? "ring-2 ring-[#ff2d6a] ring-offset-2" : "";

  if (element.variant === "nav") {
    return (
      <div className={`flex items-center justify-between px-4 py-3 ${ring}`}>
        <strong className="text-[#1a1228]">{element.text}</strong>
        <span className="rounded-full bg-[#1a1228] px-3 py-1 text-xs text-white">{button?.text || "Sumarme"}</span>
      </div>
    );
  }

  return (
    <article className={`border-t border-[#eee] px-4 py-5 ${ring}`}>
      {owner ? (
        <p className="mb-2 text-[10px] font-bold tracking-wide" style={{ color: owner.color }}>
          Lo armó {owner.aka}
        </p>
      ) : null}

      {element.variant === "hero" ? (
        <div className="py-4 text-center">
          <h3 className="text-3xl leading-tight font-bold text-[#1a1228]">{heading?.text}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#444]">{paragraph?.text}</p>
          {button ? (
            <span className="mt-4 inline-block rounded-full bg-[#ff2d6a] px-4 py-2 text-sm font-bold text-white">
              {button.text}
            </span>
          ) : null}
        </div>
      ) : null}

      {element.variant === "agenda" ? (
        <div>
          <h3 className="text-xl font-bold text-[#1a1228]">{heading?.text}</h3>
          <p className="mt-1 text-sm text-[#555]">{paragraph?.text}</p>
          {collectionName ? (
            <p className="mt-2 text-[11px] font-bold tracking-wider text-[#7c3aed] uppercase">
              Lista viva · {collectionName}
            </p>
          ) : null}
        </div>
      ) : null}

      {element.variant === "people" ? (
        <div>
          <h3 className="text-xl font-bold text-[#1a1228]">{heading?.text}</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {findAll(element, "Block").map((block) => (
              <div key={block.id} className="rounded-lg border border-[#eee] p-2">
                <p className="text-sm font-bold">{findOf(block, "Heading")?.text}</p>
                <p className="text-[11px] text-[#666]">{findOf(block, "Paragraph")?.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {element.variant === "faq" ? (
        <div>
          <h3 className="text-xl font-bold text-[#1a1228]">{heading?.text}</h3>
          <div className="mt-2 space-y-2">
            {findAll(element, "RichText").map((faq) => (
              <p key={faq.id} className="text-sm text-[#333]">
                <strong>{faq.text}</strong> {findOf(faq, "Paragraph")?.text}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {element.variant === "chaos" ? (
        <div className="rotate-[-1deg] rounded-lg border-2 border-dashed border-[#ff2d6a] bg-[#fff3f8] p-3">
          <h3 className="text-xl font-bold text-[#1a1228]">{heading?.text}</h3>
          <p className="text-sm">{paragraph?.text}</p>
        </div>
      ) : null}

      {element.variant === "generic" || element.variant === "cta" || !element.variant ? (
        <div>
          <h3 className="text-xl font-bold text-[#1a1228]">{heading?.text || element.name}</h3>
          <p className="mt-1 text-sm text-[#444]">{paragraph?.text || element.text}</p>
          {button ? (
            <span className="mt-3 inline-block text-sm font-bold text-[#ff2d6a] underline">{button.text}</span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
