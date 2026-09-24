import { advance, paceDelay, toPublic } from "./engine";
import {
  acquireProducer,
  loadRun,
  persistenceFor,
  publicRun,
  refreshProducer,
  releaseProducer,
  saveRun,
  withRunLock,
  writeArtifacts,
} from "./store";
import { resolveTimeout } from "./engine";
import type { PublicRun } from "./types";

export async function attachSeason(id: string, signal: AbortSignal, send: (payload: unknown) => void): Promise<void> {
  const existing = await publicRun(id);
  if (!existing) {
    send({ type: "error", message: "Esta temporada no está en la casa." });
    return;
  }
  send({ type: "state", run: existing });

  const locked = await acquireProducer(id);
  if (!locked) {
    await tail(id, signal, send, 120000);
    return;
  }

  try {
    await produce(id, signal, send);
    await tail(id, signal, send, 90000);
  } catch (error) {
    send({ type: "error", message: error instanceof Error ? error.message : "La casa se trabó." });
  } finally {
    await releaseProducer(id);
  }
}

async function produce(id: string, signal: AbortSignal, send: (payload: unknown) => void) {
  while (!signal.aborted) {
    await refreshProducer(id);
    const outcome = await withRunLock(id, async () => {
      const run = await loadRun(id);
      if (!run) return { missing: true as const };
      const step = advance(run);
      if (step.mutated) {
        await saveRun(run);
        if (run.status !== "live") await writeArtifacts(run).catch(() => undefined);
      }
      const pub = toPublic(run, await persistenceFor(run));
      return { missing: false as const, step, pub };
    });
    if (outcome.missing) {
      send({ type: "error", message: "Perdí la temporada a mitad de pasillo." });
      return;
    }
    if (outcome.step.mutated) send({ type: "state", run: outcome.pub });
    if (outcome.step.kind === "done" || outcome.pub.status !== "live") return;
    if (outcome.step.kind === "wait") {
      const resolved = await waitClear(id, signal);
      if (signal.aborted) return;
      if (!resolved) {
        const pub = await withRunLock(id, async () => {
          const run = await loadRun(id);
          if (!run) return null;
          const changed = resolveTimeout(run);
          if (changed) await saveRun(run);
          return toPublic(run, await persistenceFor(run));
        });
        if (pub) send({ type: "state", run: pub });
      }
      continue;
    }
    await sleep(paceDelay(outcome.step.ms, outcome.pub.pace), signal);
  }
}

async function waitClear(id: string, signal: AbortSignal): Promise<boolean> {
  const start = Date.now();
  while (!signal.aborted) {
    const run = await loadRun(id);
    if (!run?.awaiting) return true;
    const budget = run.pace === "rapido" ? 2200 : 8000;
    if (Date.now() - start >= budget) return false;
    await refreshProducer(id);
    await sleep(250, signal);
  }
  return true;
}

async function tail(id: string, signal: AbortSignal, send: (payload: unknown) => void, maxMs: number) {
  const until = Date.now() + maxMs;
  let stamp = "";
  while (!signal.aborted && Date.now() < until) {
    const pub = await publicRun(id);
    if (!pub) return;
    const next = `${pub.updatedAt}|${pub.publishResult?.at ?? ""}|${pub.revealed.length}|${pub.paused}|${pub.pace}`;
    if (next !== stamp) {
      send({ type: "state", run: pub });
      stamp = next;
    }
    await sleep(450, signal);
  }
}

function sleep(ms: number, signal: AbortSignal) {
  if (signal.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export type { PublicRun };
