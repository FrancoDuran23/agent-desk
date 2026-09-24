"use client";

import { useEffect, useMemo, useState } from "react";
import { AGENTS } from "@/lib/agents";
import type { PublicRun, WfCollection, WfElement } from "@/lib/types";

export function Designer({ run }: { run: PublicRun }) {
  const [selected, setSelected] = useState("page-home");
  const last = run.revealed.at(-1);
  const focus = last?.kind === "canvas" ? last.focusId : undefined;

  useEffect(() => {
    if (focus) setSelected(focus);
  }, [focus]);

  const page = run.canvas.pages[0];
  const collection = run.canvas.collections[0];
  const selectedElement = useMemo(() => (page ? findElement(page.elements, selected) : undefined), [page, selected]);

  return (
    <section className="hard flex h-full min-h-[32rem] flex-col overflow-hidden bg-[#d7d7d7]" aria-label="Canvas Webflow">
      <div className="flex items-center justify-between gap-2 bg-[#1c140f] px-3 py-2 text-[#fff8ef]">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#ffb703]">Living · canvas Webflow</p>
          <p className="truncate text-sm font-semibold">{run.canvas.siteName}</p>
        </div>
        <p className="hidden text-[11px] sm:block">Home /{page?.slug}</p>
      </div>
      <div className="designer-shell grid min-h-0 flex-1 lg:grid-cols-[200px_minmax(0,1fr)_210px]">
        <aside className="nav-dark scroll-thin max-h-64 overflow-auto border-b border-black/20 text-xs lg:max-h-none lg:border-r lg:border-b-0">
          <p className="px-3 pt-3 text-[10px] font-bold tracking-widest text-white/50">NAVIGATOR</p>
          <p className="px-3 pt-2 text-[10px] text-white/40">PAGES</p>
          <TreeButton current={selected} id="page-home" depth={0} label="Home" onSelect={setSelected} />
          {page?.elements.map((element) => (
            <ElementNodes key={element.id} element={element} depth={1} selected={selected} onSelect={setSelected} />
          ))}
          <p className="px-3 pt-3 text-[10px] text-white/40">CMS</p>
          {run.canvas.collections.map((item) => (
            <div key={item.slug}>
              <TreeButton current={selected} id={`cms-${item.slug}`} depth={0} label={item.displayName} onSelect={setSelected} />
              {item.fields.map((field) => (
                <TreeButton key={field.slug} current={selected} id={`field-${field.slug}`} depth={1} label={`${field.displayName}`} onSelect={setSelected} />
              ))}
              {item.cuts.map((cut) => (
                <p key={cut.slug} className="px-6 py-1 text-[11px] text-white/35 line-through">{cut.displayName}</p>
              ))}
            </div>
          ))}
          {run.canvas.collections.length === 0 ? <p className="px-3 py-1 text-white/40">Vacío</p> : null}
          <p className="px-3 pt-3 text-[10px] text-white/40">COMPONENTS</p>
          {run.canvas.components.map((component) => (
            <TreeButton key={component.name} current={selected} id={`cmp-${component.name}`} depth={0} label={component.name} onSelect={setSelected} />
          ))}
          <p className="px-3 pt-3 text-[10px] text-white/40">ASSETS / VARIABLES</p>
          {run.canvas.assets.map((asset) => (
            <TreeButton key={asset.name} current={selected} id={`asset-${asset.name}`} depth={0} label={asset.name} onSelect={setSelected} />
          ))}
          {run.canvas.variables.map((variable) => (
            <TreeButton key={variable.name} current={selected} id={`var-${variable.name}`} depth={0} label={variable.name} onSelect={setSelected} />
          ))}
        </aside>
        <div className="scroll-thin min-h-[22rem] overflow-auto bg-[#f7f7f7] p-3 sm:p-5">
          <div className="mx-auto max-w-xl overflow-hidden border border-[#ddd] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#eee] bg-[#fafafa] px-3 py-2 text-[11px] text-[#666]">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              <span className="truncate">webflow / {page?.slug || "home"}</span>
            </div>
            {page && page.elements.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#777]">
                <p className="text-lg">El canvas está en blanco.</p>
                <p className="mt-1">Facu ya abrió el Navigator. Las secciones entran cuando se pelean.</p>
              </div>
            ) : null}
            {page?.elements.map((element) => (
              <Preview key={element.id} element={element} collection={collection} selected={selected} onSelect={setSelected} fresh={focus === element.id} />
            ))}
          </div>
        </div>
        <aside className="scroll-thin max-h-72 overflow-auto border-t border-[#ddd] bg-white p-3 text-xs lg:max-h-none lg:border-t-0 lg:border-l">
          <p className="text-[10px] font-bold tracking-widest text-[#888]">INSPECTOR</p>
          <Inspector selected={selected} element={selectedElement} run={run} />
          <p className="mt-4 text-[10px] font-bold tracking-widest text-[#888]">TERMINAL DEL TRYHARD</p>
          <ul className="mt-2 space-y-2">
            {run.fightLog.slice(-6).map((op) => (
              <li key={op.id} className={op.status === "vetoed" ? "text-[#999] line-through" : ""}>
                <span className="font-bold">{op.tool}.{op.action}</span>
                <span className="mt-0.5 block text-[11px] text-[#444] no-underline" style={{ textDecoration: "none" }}>{op.summary}</span>
              </li>
            ))}
            {run.fightLog.length === 0 ? <li className="text-[#888]">Todavía no hay operaciones.</li> : null}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function ElementNodes({
  element,
  depth,
  selected,
  onSelect,
}: {
  element: WfElement;
  depth: number;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <TreeButton current={selected} id={element.id} depth={depth} label={element.name} onSelect={onSelect} />
      {element.children?.map((child) => (
        <ElementNodes key={child.id} element={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </>
  );
}

function TreeButton({
  id,
  label,
  depth,
  current,
  onSelect,
}: {
  id: string;
  label: string;
  depth: number;
  current: string;
  onSelect: (id: string) => void;
}) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`block w-full truncate py-1 text-left ${active ? "wf-selected" : "hover:bg-white/10"}`}
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      {label}
    </button>
  );
}

function Preview({
  element,
  collection,
  selected,
  onSelect,
  fresh,
}: {
  element: WfElement;
  collection?: WfCollection;
  selected: string;
  onSelect: (id: string) => void;
  fresh: boolean;
}) {
  const heading = findOf(element, "Heading");
  const paragraph = findOf(element, "Paragraph");
  const button = findOf(element, "Button");
  const ring = selected === element.id || element.children?.some((child) => child.id === selected) ? "ring-2 ring-[#0b6bcb]" : "";
  const motion = fresh ? "wiggle" : "";
  const owner = element.owner ? AGENTS[element.owner] : null;

  if (element.variant === "nav") {
    return (
      <div className={`flex items-center justify-between px-4 py-3 ${ring}`} onClick={() => onSelect(element.id)}>
        <strong>{element.text}</strong>
        <span className="rounded-full bg-[#1c140f] px-3 py-1 text-xs text-white">{button?.text || "Sumarme"}</span>
      </div>
    );
  }

  return (
    <article className={`border-t border-[#eee] px-4 py-5 ${ring} ${motion}`} onClick={() => onSelect(element.id)}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-bold tracking-wide text-[#888]">
        <span>{element.type} · .{element.className}</span>
        {owner ? <span style={{ color: owner.color }}>{owner.aka}</span> : null}
      </div>
      {element.variant === "hero" ? (
        <div className="py-4 text-center">
          <h3 className="text-3xl leading-tight font-bold">{heading?.text}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#444]">{paragraph?.text}</p>
          {button ? <span className="mt-4 inline-block rounded-full bg-[#1c140f] px-4 py-2 text-sm text-white">{button.text}</span> : null}
        </div>
      ) : null}
      {element.variant === "agenda" ? (
        <div>
          <h3 className="text-xl font-bold">{heading?.text}</h3>
          <p className="mt-1 text-sm text-[#555]">{paragraph?.text}</p>
          <div className="mt-3 grid gap-2">
            {(collection?.items ?? []).map((item) => (
              <div key={item.slug} className="border border-[#e5e5e5] p-2">
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-xs text-[#555]">{String(Object.values(item.fieldData).find((value) => typeof value === "string" && value !== item.name && value !== item.slug) ?? "")}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {element.variant === "people" ? (
        <div>
          <h3 className="text-xl font-bold">{heading?.text}</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(findAll(element, "Block")).map((block) => (
              <div key={block.id} className="border border-[#eee] p-2">
                <p className="text-sm font-bold">{findOf(block, "Heading")?.text}</p>
                <p className="text-[11px] text-[#666]">{findOf(block, "Paragraph")?.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {element.variant === "faq" ? (
        <div>
          <h3 className="text-xl font-bold">{heading?.text}</h3>
          <div className="mt-2 space-y-2">
            {findAll(element, "RichText").map((faq) => (
              <p key={faq.id} className="text-sm"><strong>{faq.text}</strong> {findOf(faq, "Paragraph")?.text}</p>
            ))}
          </div>
        </div>
      ) : null}
      {element.variant === "chaos" ? (
        <div className="rotate-[-1deg] border-2 border-dashed border-[#ff3d8a] bg-[#fff3f8] p-3">
          <h3 className="text-xl font-bold">{heading?.text}</h3>
          <p className="text-sm">{paragraph?.text}</p>
        </div>
      ) : null}
      {element.variant === "generic" || !element.variant ? (
        <div>
          <h3 className="text-xl font-bold">{heading?.text || element.name}</h3>
          <p className="mt-1 text-sm text-[#444]">{paragraph?.text || element.text}</p>
          {button ? <span className="mt-3 inline-block text-sm font-bold underline">{button.text}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

function Inspector({ selected, element, run }: { selected: string; element?: WfElement; run: PublicRun }) {
  const collection = run.canvas.collections.find((item) => selected === `cms-${item.slug}` || item.fields.some((field) => selected === `field-${field.slug}`));
  const field = collection?.fields.find((item) => selected === `field-${item.slug}`);
  const component = run.canvas.components.find((item) => selected === `cmp-${item.name}`);
  const asset = run.canvas.assets.find((item) => selected === `asset-${item.name}`);
  const variable = run.canvas.variables.find((item) => selected === `var-${item.name}`);
  const payload = field ?? collection ?? component ?? asset ?? variable ?? element ?? { id: "page-home", type: "Page", seo: run.canvas.pages[0]?.seo, slug: run.canvas.pages[0]?.slug };
  return <pre className="mt-2 overflow-auto text-[10px] leading-relaxed whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>;
}

function findElement(elements: WfElement[], id: string): WfElement | undefined {
  for (const element of elements) {
    if (element.id === id) return element;
    const child = element.children ? findElement(element.children, id) : undefined;
    if (child) return child;
  }
  return undefined;
}

function findOf(element: WfElement, type: WfElement["type"]): WfElement | undefined {
  if (element.type === type) return element;
  for (const child of element.children ?? []) {
    const found = findOf(child, type);
    if (found) return found;
  }
  return undefined;
}

function findAll(element: WfElement, type: WfElement["type"]): WfElement[] {
  const found = element.type === type ? [element] : [];
  for (const child of element.children ?? []) found.push(...findAll(child, type));
  return found;
}
