import { resolveBindings } from "./bindings";
import { artifactFiles } from "./deliverables";
import { toPublic } from "./engine";
import { SCHEMA_SQL } from "./schema";
import type { Beat, PersistenceInfo, PublicRun, Run } from "./types";

async function applySchema(db: D1Database): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

const memory = () => {
  const g = globalThis as unknown as { __casaRuns?: Map<string, Run> };
  g.__casaRuns ??= new Map();
  return g.__casaRuns;
};

const chains = new Map<string, Promise<unknown>>();
const localLocks = new Map<string, number>();
let schemaTask: Promise<void> | null = null;
let schemaError = "";

export function withRunLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(id) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  chains.set(
    id,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

async function database(): Promise<D1Database | undefined> {
  const resolved = await resolveBindings();
  if (!resolved?.db) return undefined;
  try {
    schemaTask ??= applySchema(resolved.db).catch((error: unknown) => {
      schemaTask = null;
      schemaError = error instanceof Error ? error.message : "D1 schema";
      throw error;
    });
    await schemaTask;
    return resolved.db;
  } catch {
    return undefined;
  }
}

export async function saveRun(run: Run): Promise<void> {
  memory().set(run.id, run);
  const resolved = await resolveBindings();
  if (resolved?.kv) {
    await resolved.kv.put(`run:${run.id}`, JSON.stringify(run), { expirationTtl: 60 * 60 * 24 * 14 });
  }
  const db = await database();
  if (!db) return;
  await db
    .prepare(
      `INSERT INTO runs (id, goal, mode, status, created_at, updated_at, timer_ms, snapshot_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         mode = excluded.mode,
         status = excluded.status,
         updated_at = excluded.updated_at,
         timer_ms = excluded.timer_ms,
         snapshot_json = excluded.snapshot_json`,
    )
    .bind(run.id, run.goal, run.mode, run.status, run.createdAt, run.updatedAt, run.timerMs, JSON.stringify(run))
    .run();

  try {
  const statements: D1PreparedStatement[] = [
    db.prepare("DELETE FROM beats WHERE run_id = ?").bind(run.id),
    db.prepare("DELETE FROM votes WHERE run_id = ?").bind(run.id),
    db.prepare("DELETE FROM ops WHERE run_id = ?").bind(run.id),
  ];
  run.beats.forEach((beat, seq) => {
    if (seq >= run.revealedCount) return;
    statements.push(
      db
        .prepare(
          `INSERT INTO beats (id, run_id, seq, kind, agent, text, highlight, revealed, payload_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          `${run.id}:${beat.id}`,
          run.id,
          seq,
          beat.kind,
          "agent" in beat ? beat.agent : null,
          beatText(beat),
          beat.highlight ? 1 : 0,
          seq < run.revealedCount ? 1 : 0,
          JSON.stringify(beat),
        ),
    );
    if (beat.kind === "vote") {
      statements.push(
        db
          .prepare(`INSERT INTO votes (id, run_id, seq, topic, winner, tally_json) VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(`${run.id}:vote:${seq}`, run.id, seq, beat.topic, beat.winner, JSON.stringify(beat.tally)),
      );
    }
  });
  run.ops.forEach((op, seq) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO ops (id, run_id, seq, tool, action, agent, status, summary, payload_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(`${run.id}:op:${seq}`, run.id, seq, op.tool, op.action, op.agent, op.status, op.summary, JSON.stringify(op)),
    );
  });
  if (statements.length) await db.batch(statements);
  } catch {
    // The snapshot row is the source of truth. Normalized tables are a projection.
  }
}

function beatText(beat: Beat): string | null {
  if ("text" in beat && beat.text) return beat.text;
  if (beat.kind === "finale") return beat.line;
  if (beat.kind === "round") return `${beat.title} — ${beat.subtitle}`;
  if (beat.kind === "vote") return beat.winner;
  if (beat.kind === "canvas") return beat.caption;
  if (beat.kind === "human") return beat.prompt.title;
  return null;
}

export async function loadRun(id: string): Promise<Run | null> {
  const db = await database();
  if (db) {
    try {
      const row = await db
        .prepare("SELECT snapshot_json FROM runs WHERE id = ?")
        .bind(id)
        .first<{ snapshot_json: string }>();
      if (row?.snapshot_json) return JSON.parse(row.snapshot_json) as Run;
    } catch {
      // snapshot read failed; try KV and memory
    }
  }
  const resolved = await resolveBindings();
  if (resolved?.kv) {
    const raw = await resolved.kv.get(`run:${id}`);
    if (raw) return JSON.parse(raw) as Run;
  }
  return memory().get(id) ?? null;
}

export async function persistenceFor(run: Run): Promise<PersistenceInfo> {
  const resolved = await resolveBindings();
  const dbOk = Boolean(resolved?.db) && !schemaError;
  const kvOk = Boolean(resolved?.kv);
  const mediaOk = Boolean(resolved?.media);
  let driver: PersistenceInfo["driver"] = "memory";
  if (dbOk && kvOk && mediaOk) driver = "d1+kv+r2";
  else if (dbOk) driver = "d1";
  else if (kvOk) driver = "kv";

  let beats = run.revealedCount;
  let votes = run.beats.slice(0, run.revealedCount).filter((beat) => beat.kind === "vote").length;
  let ops = run.ops.length;
  let note =
    driver === "memory"
      ? "Memoria local. En Webflow Cloud esto vive en D1 (DB), KV (HOUSE) y R2 (MEDIA). Con wrangler: npm run dev:cf."
      : "Temporada persistida en los bindings de Webflow Cloud.";
  if (schemaError) {
    note = `D1 no aplicó el schema (${schemaError}). ${kvOk ? "El snapshot sigue en KV HOUSE." : "Sigo en memoria."}`;
  }

  if (resolved?.db && !schemaError) {
    try {
      const beatRow = await resolved.db
        .prepare("SELECT COUNT(*) AS n FROM beats WHERE run_id = ?")
        .bind(run.id)
        .first<{ n: number }>();
      const voteRow = await resolved.db
        .prepare("SELECT COUNT(*) AS n FROM votes WHERE run_id = ?")
        .bind(run.id)
        .first<{ n: number }>();
      const opRow = await resolved.db
        .prepare("SELECT COUNT(*) AS n FROM ops WHERE run_id = ?")
        .bind(run.id)
        .first<{ n: number }>();
      beats = Number(beatRow?.n ?? beats);
      votes = Number(voteRow?.n ?? votes);
      ops = Number(opRow?.n ?? ops);
    } catch (error) {
      note = `Snapshot guardado, pero el conteo D1 falló: ${error instanceof Error ? error.message : "error"}.`;
    }
  }

  return {
    driver,
    bindings: { db: dbOk, kv: kvOk, media: mediaOk },
    bindingNames: resolved?.names ?? [],
    beats,
    votes,
    ops,
    note,
  };
}

export async function publicRun(id: string): Promise<PublicRun | null> {
  const run = await loadRun(id);
  if (!run) return null;
  return toPublic(run, await persistenceFor(run));
}

export async function writeArtifacts(run: Run): Promise<void> {
  const resolved = await resolveBindings();
  if (!resolved?.media) return;
  const pub = toPublic(run, await persistenceFor(run));
  await Promise.all(
    artifactFiles(pub).map((file) =>
      resolved.media?.put(`runs/${run.id}/${file.name}`, file.body, {
        httpMetadata: { contentType: file.contentType },
      }),
    ),
  );
}

export async function readArtifact(runId: string, name: string): Promise<string | null> {
  const resolved = await resolveBindings();
  if (!resolved?.media) return null;
  const object = await resolved.media.get(`runs/${runId}/${name}`);
  if (!object) return null;
  return object.text();
}

export async function acquireProducer(id: string): Promise<boolean> {
  const now = Date.now();
  if ((localLocks.get(id) ?? 0) > now) return false;
  localLocks.set(id, now + 25000);
  const resolved = await resolveBindings();
  if (resolved?.kv) {
    const current = await resolved.kv.get(`lock:${id}`);
    if (current && Number(current) > now) {
      localLocks.delete(id);
      return false;
    }
    await resolved.kv.put(`lock:${id}`, String(now + 25000), { expirationTtl: 60 });
  }
  return true;
}

export async function refreshProducer(id: string): Promise<void> {
  const resolved = await resolveBindings();
  const until = Date.now() + 25000;
  if (resolved?.kv) {
    await resolved.kv.put(`lock:${id}`, String(until), { expirationTtl: 60 });
    return;
  }
  if (localLocks.has(id)) localLocks.set(id, until);
}

export async function releaseProducer(id: string): Promise<void> {
  const resolved = await resolveBindings();
  if (resolved?.kv) await resolved.kv.delete(`lock:${id}`);
  localLocks.delete(id);
}
