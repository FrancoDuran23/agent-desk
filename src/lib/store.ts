import { resolveBindings } from "./bindings";
import { toPublic } from "./present";
import { SCHEMA_SQL } from "./schema";
import type { CaseRecord, PersistenceInfo, PublicCase } from "./types";

async function applySchema(db: D1Database): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

const memory = () => {
  const g = globalThis as unknown as { __cuidadoCases?: Map<string, CaseRecord> };
  g.__cuidadoCases ??= new Map();
  return g.__cuidadoCases;
};

let schemaTask: Promise<void> | null = null;
let schemaError = "";

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

export async function saveCase(record: CaseRecord): Promise<void> {
  memory().set(record.id, record);
  const resolved = await resolveBindings();
  if (resolved?.kv) {
    await resolved.kv.put(`session:${record.id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 14,
    });
  }
  const db = await database();
  if (db) {
    await db
      .prepare(
        `INSERT INTO cases (id, province, mode, status, severity, created_at, updated_at, snapshot_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           mode = excluded.mode,
           status = excluded.status,
           severity = excluded.severity,
           updated_at = excluded.updated_at,
           snapshot_json = excluded.snapshot_json`,
      )
      .bind(
        record.id,
        record.province || "Argentina",
        record.mode,
        record.status,
        record.severity,
        record.createdAt,
        record.updatedAt,
        JSON.stringify(record),
      )
      .run();

    try {
      const statements: D1PreparedStatement[] = [
        db.prepare("DELETE FROM redactions WHERE case_id = ?").bind(record.id),
        db.prepare("DELETE FROM agent_steps WHERE case_id = ?").bind(record.id),
      ];
      record.redactions.forEach((item, seq) => {
        statements.push(
          db
            .prepare(
              `INSERT INTO redactions (id, case_id, kind, label, replacement, reason)
               VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .bind(`${record.id}:red:${seq}`, record.id, item.kind, item.label, item.replacement, item.reason),
        );
      });
      record.steps.forEach((step, seq) => {
        statements.push(
          db
            .prepare(
              `INSERT INTO agent_steps (id, case_id, seq, agent, detail)
               VALUES (?, ?, ?, ?, ?)`,
            )
            .bind(`${record.id}:step:${seq}`, record.id, seq, step.agent, step.detail),
        );
      });
      if (statements.length) await db.batch(statements);
    } catch {
      // The snapshot row is the source of truth. The other tables are a projection.
    }
  }

  if (record.attachment && resolved?.media) {
    await resolved.media.put(
      `cases/${record.id}/adjunto.json`,
      JSON.stringify({
        caseId: record.id,
        bytes: record.attachment.bytes,
        contentType: record.attachment.contentType,
        extension: record.attachment.extension,
        storedAt: record.createdAt,
        note: "Solo metadatos. El archivo no se guardó.",
      }),
      { httpMetadata: { contentType: "application/json" } },
    );
  }
}

export async function loadCase(id: string): Promise<CaseRecord | null> {
  const cached = memory().get(id);
  if (cached) return cached;
  const db = await database();
  if (db) {
    try {
      const row = await db
        .prepare("SELECT snapshot_json FROM cases WHERE id = ?")
        .bind(id)
        .first<{ snapshot_json: string }>();
      if (row?.snapshot_json) {
        const parsed = JSON.parse(row.snapshot_json) as CaseRecord;
        memory().set(id, parsed);
        return parsed;
      }
    } catch {
      // Try the session copy.
    }
  }
  const resolved = await resolveBindings();
  if (resolved?.kv) {
    const raw = await resolved.kv.get(`session:${id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CaseRecord;
        memory().set(id, parsed);
        return parsed;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function persistenceFor(): Promise<PersistenceInfo> {
  const resolved = await resolveBindings();
  const dbOk = Boolean(resolved?.db) && !schemaError;
  const kvOk = Boolean(resolved?.kv);
  const mediaOk = Boolean(resolved?.media);
  let driver: PersistenceInfo["driver"] = "memory";
  if (dbOk && kvOk && mediaOk) driver = "d1+kv+r2";
  else if (dbOk) driver = "d1";
  else if (kvOk) driver = "kv";

  let note =
    driver === "memory"
      ? "En este proceso el caso queda en memoria. En Webflow Cloud la versión reducida va a D1 (DB), la sesión a KV (HOUSE) y, si hubo un adjunto, solo sus metadatos a R2 (MEDIA)."
      : "La versión reducida quedó en D1, la sesión en KV y los metadatos de adjunto, si los hay, en R2.";
  if (schemaError) {
    note = `D1 no aplicó el esquema (${schemaError}). ${kvOk ? "La sesión sigue en KV." : "Sigo en memoria."}`;
  }

  return {
    driver,
    bindings: { db: dbOk, kv: kvOk, media: mediaOk },
    bindingNames: resolved?.names ?? [],
    note,
  };
}

export async function publicCase(id: string, now = Date.now()): Promise<PublicCase | null> {
  const record = await loadCase(id);
  if (!record) return null;
  return toPublic(record, await persistenceFor(), now);
}
