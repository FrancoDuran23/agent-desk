import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface ResolvedBindings {
  db?: D1Database;
  kv?: KVNamespace;
  media?: R2Bucket;
  names: string[];
}

export async function resolveBindings(): Promise<ResolvedBindings | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    if (!env) return null;
    const names = Object.keys(env).filter((key) =>
      ["DB", "HOUSE", "SESSIONS", "MEDIA", "WEBFLOW_CLOUD_MEDIA"].includes(key),
    );
    const db = env.DB as D1Database | undefined;
    const kv = (env.HOUSE ?? env.SESSIONS) as KVNamespace | undefined;
    const media = (env.MEDIA ?? env.WEBFLOW_CLOUD_MEDIA) as R2Bucket | undefined;
    if (!db && !kv && !media && names.length === 0) return null;
    return { db, kv, media, names };
  } catch {
    return null;
  }
}

export async function pingBindings(): Promise<{
  driver: "d1+kv+r2" | "partial" | "memory";
  names: string[];
  services: Record<string, { status: "ok" | "absent" | "error"; latency: number; error?: string }>;
}> {
  const resolved = await resolveBindings();
  if (!resolved) {
    return {
      driver: "memory",
      names: [],
      services: {
        d1: { status: "absent", latency: 0, error: "Sin binding DB en este proceso." },
        kv: { status: "absent", latency: 0 },
        r2: { status: "absent", latency: 0 },
      },
    };
  }

  const services = {
    d1: await ping(resolved.db, async (db) => {
      await db.prepare("SELECT 1 AS ok").first();
    }),
    kv: await ping(resolved.kv, async (kv) => {
      await kv.get("__cuidado_health__");
    }),
    r2: await ping(resolved.media, async (media) => {
      await media.head("__cuidado_health__");
    }),
  };

  const present = [resolved.db, resolved.kv, resolved.media].filter(Boolean).length;
  const healthy = Object.values(services).filter((service) => service.status === "ok").length;
  const driver = healthy === 3 ? "d1+kv+r2" : present > 0 ? "partial" : "memory";
  return { driver, names: resolved.names, services };
}

async function ping<T>(
  resource: T | undefined,
  fn: (resource: T) => Promise<void>,
): Promise<{ status: "ok" | "absent" | "error"; latency: number; error?: string }> {
  if (!resource) return { status: "absent", latency: 0 };
  const start = performance.now();
  try {
    await fn(resource);
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : "error",
    };
  }
}
