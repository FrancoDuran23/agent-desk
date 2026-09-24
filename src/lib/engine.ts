import { buildDraft } from "./draft";
import { spiceDraft } from "./llm";
import { applyPatch, chaosElement, heroElement, nameFor, navbarElement, vetoCopy } from "./canvas";
import { emptyCanvas } from "./canvas";
import { buildPlaybook, opsForPatch, vetoProposedCollections } from "./playbook";
import { evictionBeat, weaveSeason } from "./season";
import type { AgentId, Beat, Intervention, PersistenceInfo, PublicRun, Run, ShowPatch } from "./types";
import { clip, uid } from "./slug";

const TIMER_START = 4 * 60 * 1000;

export async function createSeason(goal: string): Promise<Run> {
  const clean = clip(goal, 400);
  const base = buildDraft(clean);
  const spiced = await spiceDraft(base, clean);
  const now = Date.now();
  return {
    id: uid("casa"),
    goal: clean,
    mode: spiced.mode,
    modeNote: spiced.modeNote,
    status: "live",
    createdAt: now,
    updatedAt: now,
    timerMs: TIMER_START,
    paused: false,
    pace: "normal",
    revealedCount: 0,
    beats: weaveSeason(spiced.draft, clean),
    canvas: emptyCanvas(),
    draft: spiced.draft,
    awaiting: null,
    handledPromptIds: [],
    locks: { name: false, copy: false },
    ops: [],
    highlight: [],
    round: null,
    opSeq: 0,
  };
}

export interface StepResult {
  kind: "sleep" | "wait" | "done";
  ms: number;
  mutated: boolean;
}

export function advance(run: Run): StepResult {
  if (run.status !== "live") return { kind: "done", ms: 0, mutated: false };
  if (run.paused) return { kind: "sleep", ms: 360, mutated: false };
  if (run.awaiting) return { kind: "wait", ms: 0, mutated: false };

  if (run.timerMs <= 0 && !run.beats.slice(run.revealedCount).some((beat) => beat.kind === "finale")) {
    run.beats = run.beats.slice(0, run.revealedCount);
    run.beats.push(evictionBeat());
    touch(run);
    return { kind: "sleep", ms: 200, mutated: true };
  }

  if (run.revealedCount >= run.beats.length) {
    run.status = run.canvas.pages[0]?.elements.length ? "finale" : "evicted";
    touch(run);
    return { kind: "done", ms: 0, mutated: true };
  }

  const beat = run.beats[run.revealedCount];
  applyBeat(run, beat);
  run.revealedCount += 1;
  if (beat.kind === "finale") run.status = beat.verdict === "desalojo" ? "evicted" : "finale";
  touch(run);
  if (beat.kind === "human") return { kind: "wait", ms: 0, mutated: true };
  if (run.status !== "live") return { kind: "sleep", ms: beat.delay, mutated: true };
  return { kind: "sleep", ms: beat.delay, mutated: true };
}

function touch(run: Run) {
  run.updatedAt = Date.now();
}

function applyBeat(run: Run, beat: Beat) {
  run.timerMs = Math.max(0, run.timerMs - 1500 - (beat.dropMs ?? 0));
  if (beat.highlight) {
    const text = "text" in beat ? beat.text : beat.kind === "finale" ? beat.line : beat.kind === "round" ? beat.title : beat.kind === "vote" ? beat.winner : "";
    const agent: AgentId | "casa" = "agent" in beat ? beat.agent : "casa";
    if (text) run.highlight.push({ id: beat.id, agent, text });
  }
  if (beat.kind === "round") run.round = { title: beat.title, subtitle: beat.subtitle };
  if (beat.kind === "human") run.awaiting = beat.prompt;
  if (beat.kind === "canvas") {
    if (beat.skipIfCopyLocked && run.locks.copy) return;
    commitPatch(run, beat.patch, beat.agent);
  }
}

function commitPatch(run: Run, patch: ShowPatch, agent: AgentId) {
  run.canvas = applyPatch(run.canvas, patch);
  if (patch.cutField) vetoProposedCollections(run.ops, patch.cutField.collectionSlug);
  const fresh = opsForPatch(patch, run.canvas, agent, run.opSeq);
  run.opSeq += fresh.length;
  run.ops.push(...fresh);
}

export function applyIntervention(run: Run, action: Intervention): boolean {
  if (run.status !== "live" && action.type !== "pausar" && action.type !== "seguir") {
    if (action.type === "pace") {
      run.pace = action.pace;
      touch(run);
      return true;
    }
    return false;
  }
  if (action.type === "pausar") {
    run.paused = true;
    touch(run);
    return true;
  }
  if (action.type === "seguir") {
    run.paused = false;
    touch(run);
    return true;
  }
  if (action.type === "pace") {
    run.pace = action.pace;
    touch(run);
    return true;
  }
  if (action.type === "timeout") return resolveTimeout(run);
  if (action.type === "salvar") return salvar(run, action.agent);
  if (action.type === "vetar") return vetar(run, action.note);
  return caos(run);
}

export function resolveTimeout(run: Run): boolean {
  if (!run.awaiting || run.handledPromptIds.includes(run.awaiting.id)) return false;
  run.handledPromptIds.push(run.awaiting.id);
  run.awaiting = null;
  splice(run, nameBeats(run, "ansioso", "Nadie levantó la mano. Mateo apretó el nombre y siguió."));
  return true;
}

function clearPrompt(run: Run) {
  if (run.awaiting && !run.handledPromptIds.includes(run.awaiting.id)) {
    run.handledPromptIds.push(run.awaiting.id);
  }
  run.awaiting = null;
}

function salvar(run: Run, agent: "ansioso" | "dramatica" | "tryhard" | "meme"): boolean {
  clearPrompt(run);
  run.paused = false;
  const line =
    agent === "dramatica"
      ? "La producción salvó a Lola. El nombre tiene arco."
      : agent === "meme"
        ? "La producción salvó a Cami. El nombre se queda con onda."
        : agent === "tryhard"
          ? "La producción salvó a Facu. El título entra en un slug."
          : "La producción salvó a Mateo. Se shippea con el nombre corto.";
  splice(run, nameBeats(run, agent, line));
  return true;
}

function nameBeats(run: Run, agent: "ansioso" | "dramatica" | "tryhard" | "meme", line: string): Beat[] {
  const title = nameFor(run.draft, agent);
  run.locks.name = true;
  const hero = heroElement(
    run.locks.copy
      ? vetoCopy(run.draft)
      : { headline: title, body: run.draft.good.body, cta: run.draft.good.cta },
    agent,
    "fought",
  );
  return [
    { id: uid("b"), kind: "chat", agent: "vos", text: line, delay: 560, highlight: true },
    {
      id: uid("b"),
      kind: "chat",
      agent,
      text: `Quedó “${title}”. Slug /${run.draft.pageSlug}. Seguimos, que Don Hugo mira el reloj.`,
      delay: 620,
    },
    {
      id: uid("b"),
      kind: "canvas",
      agent,
      caption: "Nombre en el canvas",
      delay: 680,
      focusId: "sec-hero",
      patch: {
        siteName: title,
        slug: run.draft.pageSlug,
        seoTitle: title,
        seoDescription: run.draft.thesis,
        upsertElements: [navbarElement(title), hero],
      },
    },
  ];
}

function vetar(run: Run, note?: string): boolean {
  clearPrompt(run);
  run.paused = false;
  const clean = note?.replace(/\s+/g, " ").trim().slice(0, 140);
  run.locks.copy = true;
  const copy = vetoCopy(run.draft, clean);
  const quote = clean ? `La producción tachó: “${clean}”.` : "La producción vetó la copy. Cami sonríe como si hubiera ganado un premio chico.";
  const beats: Beat[] = [];
  if (!run.locks.name) {
    beats.push(...nameBeats(run, "dramatica", "Nadie había elegido nombre. Lola se queda con el arco."));
  }
  beats.push(
    { id: uid("b"), kind: "chat", agent: "vos", text: quote, delay: 520, highlight: true },
    {
      id: uid("b"),
      kind: "chat",
      agent: "meme",
      text: "Gracias. Si el botón pide que te potencies, no es un botón, es un mail de RRHH.",
      delay: 640,
      highlight: true,
    },
    {
      id: uid("b"),
      kind: "chat",
      agent: "dramatica",
      text: "Bueno. Pero el arco se queda. El hero sigue teniendo pulso.",
      delay: 580,
    },
    {
      id: uid("b"),
      kind: "canvas",
      agent: "meme",
      caption: "Copy vetada",
      delay: 640,
      focusId: "sec-hero-h",
      patch: { upsertElements: [heroElement(copy, "meme", "fought")] },
    },
  );
  splice(run, beats);
  return true;
}

function caos(run: Run): boolean {
  clearPrompt(run);
  run.paused = false;
  const collection = run.canvas.collections[0] ?? run.draft.collection;
  const already = collection.fields.some((field) => field.slug === "acepta-el-caos");
  const beats: Beat[] = [];
  if (!run.locks.name) {
    beats.push(...nameBeats(run, "meme", "La bomba decidió el nombre: gana Cami."));
  }
  beats.push(
    {
      id: uid("b"),
      kind: "chat",
      agent: "vos",
      text: "La producción tiró una bomba de caos.",
      delay: 420,
      highlight: true,
      dropMs: 28000,
    },
    {
      id: uid("b"),
      kind: "chat",
      agent: "casero",
      text: "Cambié una regla porque el pasillo estaba muy ordenado. Hay una sección nueva y el reloj corre más.",
      delay: 640,
      highlight: true,
    },
    { id: uid("b"), kind: "chat", agent: "meme", text: "Por fin. El living estaba demasiado presentable.", delay: 520 },
    {
      id: uid("b"),
      kind: "chat",
      agent: "tryhard",
      text: "Esa sección no está en el componente. La documento igual, pero dejo constancia.",
      delay: 560,
    },
    {
      id: uid("b"),
      kind: "canvas",
      agent: "meme",
      caption: "Rincón del caos",
      delay: 680,
      focusId: "sec-caos",
      patch: {
        upsertElements: [chaosElement()],
        ...(already
          ? {}
          : {
              upsertCollections: [
                {
                  ...collection,
                  fields: [
                    ...collection.fields,
                    {
                      slug: "acepta-el-caos",
                      displayName: "Acepta el caos",
                      type: "Switch" as const,
                      helpText: "Don Hugo lo exigió. Default: sí.",
                    },
                  ],
                },
              ],
            }),
      },
    },
  );
  splice(run, beats);
  return true;
}

function splice(run: Run, beats: Beat[]) {
  run.beats.splice(run.revealedCount, 0, ...beats);
  touch(run);
}

export function toPublic(run: Run, persistence: PersistenceInfo): PublicRun {
  const siteId = process.env.WEBFLOW_SITE_ID?.trim() || "{WEBFLOW_SITE_ID}";
  const pageId = process.env.WEBFLOW_PAGE_ID?.trim() || "{WEBFLOW_PAGE_ID}";
  const collectionId = process.env.WEBFLOW_COLLECTION_ID?.trim() || undefined;
  return {
    id: run.id,
    goal: run.goal,
    mode: run.mode,
    modeNote: run.modeNote,
    status: run.status,
    timerMs: run.timerMs,
    paused: run.paused,
    pace: run.pace,
    revealed: run.beats.slice(0, run.revealedCount),
    totalBeats: run.beats.length,
    canvas: run.canvas,
    awaiting: run.awaiting,
    highlight: run.highlight,
    fightLog: run.ops,
    playbook: buildPlaybook(run.canvas, { siteId, pageId, collectionId, runId: run.id }),
    persistence,
    round: run.round,
    publishResult: run.publishResult,
    webflow: {
      configured: Boolean(process.env.WEBFLOW_TOKEN?.trim() && process.env.WEBFLOW_SITE_ID?.trim()),
      hasPage: Boolean(process.env.WEBFLOW_PAGE_ID?.trim()),
      hasCollection: Boolean(process.env.WEBFLOW_COLLECTION_ID?.trim()),
    },
    updatedAt: run.updatedAt,
  };
}

export function paceDelay(ms: number, pace: Run["pace"]): number {
  return pace === "rapido" ? Math.max(140, Math.round(ms * 0.38)) : ms;
}
