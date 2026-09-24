import { buildPlaybook, itemsBody } from "./playbook";
import { slugify } from "./slug";
import type { PublishCallResult, PublishResult, Run, WfCollection, WfField } from "./types";

interface HttpResult {
  ok: boolean;
  status: number;
  json: unknown;
}

export async function publishRun(run: Run, publishItems: boolean, execute = true): Promise<PublishResult> {
  const token = process.env.WEBFLOW_TOKEN?.trim() ?? "";
  const siteId = process.env.WEBFLOW_SITE_ID?.trim() || "{WEBFLOW_SITE_ID}";
  const pageId = process.env.WEBFLOW_PAGE_ID?.trim() || "{WEBFLOW_PAGE_ID}";
  const presetCollection = process.env.WEBFLOW_COLLECTION_ID?.trim() || "";
  const playbook = buildPlaybook(run.canvas, {
    siteId,
    pageId,
    collectionId: presetCollection || undefined,
    runId: run.id,
  });
  const configured = Boolean(token && process.env.WEBFLOW_SITE_ID?.trim());

  if (!execute || !configured) {
    return {
      at: Date.now(),
      mode: "dry-run",
      note: !configured
        ? "Sin WEBFLOW_TOKEN + WEBFLOW_SITE_ID. Estos son los payloads que saldrían hacia api.webflow.com. Los marcados MCP no tienen Data API pública."
        : "Dry-run: no pegué a api.webflow.com. Si confirmás, las llamadas Data API salen de verdad y las MCP quedan como playbook.",
      calls: playbook.map((op) => ({
        method: op.dataApi?.method ?? "MCP",
        path: op.dataApi?.path ?? `${op.tool}.${op.action}`,
        ok: true,
        status: 0,
        note: op.execution === "mcp-only" ? `MCP only · ${op.summary}` : `dry-run · ${op.summary}`,
        body: op.dataApi?.body ?? op.arguments,
      })),
    };
  }

  const calls: PublishCallResult[] = [];
  const site = await request(`/v2/sites/${siteId}`, "GET", token);
  calls.push(result("GET", `/v2/sites/${siteId}`, site, "get_site"));
  if (!site.ok) {
    return finish(run, "live", "El token no pudo leer el sitio. Revisá WEBFLOW_SITE_ID y el scope sites:read.", calls);
  }

  let collectionId = presetCollection;
  let remoteFields: { slug?: string; displayName?: string }[] = [];

  for (const collection of run.canvas.collections) {
    if (!collectionId) {
      const body = collectionRequest(collection, run.id);
      const created = await request(`/v2/sites/${siteId}/collections`, "POST", token, body);
      calls.push(result("POST", `/v2/sites/${siteId}/collections`, created, `create_collection ${collection.displayName}`, body));
      const createdId = readId(created.json);
      if (!created.ok || !createdId) {
        return finish(run, "live", "La colección no se pudo crear. El resto del playbook queda abajo.", calls);
      }
      collectionId = createdId;
      remoteFields = readFields(created.json);
    } else if (remoteFields.length === 0) {
      const remote = await request(`/v2/collections/${collectionId}`, "GET", token);
      calls.push(result("GET", `/v2/collections/${collectionId}`, remote, "get_collection_details"));
      remoteFields = readFields(remote.json);
    }

    const items = alignItems(collection, remoteFields);
    const bulk = await request(`/v2/collections/${collectionId}/items/bulk`, "POST", token, items);
    if (bulk.ok) {
      calls.push(result("POST", `/v2/collections/${collectionId}/items/bulk`, bulk, "create_collection_items", items));
    } else {
      calls.push(result("POST", `/v2/collections/${collectionId}/items/bulk`, bulk, "bulk no aceptado, voy de a uno", items));
      for (const item of items.items) {
        const single = await request(`/v2/collections/${collectionId}/items`, "POST", token, item);
        calls.push(result("POST", `/v2/collections/${collectionId}/items`, single, `item ${String(item.fieldData.name ?? "")}`, item));
      }
    }

    if (publishItems) {
      const itemIds = collectIds(calls);
      if (itemIds.length) {
        const body = { itemIds };
        const published = await request(`/v2/collections/${collectionId}/items/publish`, "POST", token, body);
        calls.push(result("POST", `/v2/collections/${collectionId}/items/publish`, published, "publish_collection_items", body));
      }
    }
  }

  if (!pageId.includes("{")) {
    const page = run.canvas.pages[0];
    const body = page
      ? {
          title: page.title,
          slug: page.slug,
          seo: page.seo,
          openGraph: {
            title: page.openGraph.title,
            description: page.openGraph.description,
            titleCopied: false,
            descriptionCopied: false,
          },
        }
      : undefined;
    const updated = await request(`/v2/pages/${pageId}`, "POST", token, body);
    calls.push(result("POST", `/v2/pages/${pageId}`, updated, "update_page_settings", body));
  } else {
    calls.push({
      method: "POST",
      path: "/v2/pages/{WEBFLOW_PAGE_ID}",
      ok: true,
      status: 0,
      note: "Sin WEBFLOW_PAGE_ID no toco metadata de páginas. El payload igual está en el playbook.",
    });
  }

  for (const op of playbook.filter((item) => item.execution === "mcp-only")) {
    calls.push({
      method: "MCP",
      path: `${op.tool}.${op.action}`,
      ok: true,
      status: 0,
      note: `No se ejecuta por Data API. ${op.summary}`,
      body: op.arguments,
    });
  }

  const failed = calls.filter((call) => call.status >= 400);
  return finish(
    run,
    "live",
    failed.length
      ? `Publiqué con ${failed.length} llamada(s) en rojo. La colección ${collectionId || "—"} es el ancla.`
      : `Listo. Colección ${collectionId || "—"}. Los ítems ${publishItems ? "se mandaron a publicar" : "quedaron en staging"}.`,
    calls,
    collectionId,
  );
}

function collectionRequest(collection: WfCollection, runId: string) {
  const suffix = runId.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase() || "casa";
  return {
    displayName: `${collection.displayName} ${suffix}`,
    singularName: collection.singularName,
    slug: `${collection.slug}-${suffix}`,
    fields: collection.fields.map((field) => {
      const body: Record<string, unknown> = {
        type: field.type,
        displayName: field.displayName,
        isRequired: Boolean(field.required),
        helpText: field.helpText,
      };
      if (field.type === "Option") body.metadata = { options: (field.options ?? ["Opción"]).map((name) => ({ name })) };
      return body;
    }),
  };
}

function alignItems(collection: WfCollection, remoteFields: { slug?: string; displayName?: string }[]) {
  const raw = itemsBody(collection) as { items: { isArchived: boolean; isDraft: boolean; fieldData: Record<string, string | number | boolean> }[] };
  if (!remoteFields.length) return raw;
  return {
    items: raw.items.map((item) => ({
      ...item,
      fieldData: alignFieldData(item.fieldData, collection.fields, remoteFields),
    })),
  };
}

function alignFieldData(
  fieldData: Record<string, string | number | boolean>,
  local: WfField[],
  remoteFields: { slug?: string; displayName?: string }[],
) {
  const out: Record<string, string | number | boolean> = {};
  if (fieldData.name !== undefined) out.name = fieldData.name;
  if (fieldData.slug !== undefined) out.slug = fieldData.slug;
  for (const remote of remoteFields) {
    if (!remote.slug || remote.slug === "name" || remote.slug === "slug") continue;
    const match = local.find(
      (field) => field.slug === remote.slug || slugify(field.displayName) === remote.slug || field.displayName === remote.displayName,
    );
    if (match && fieldData[match.slug] !== undefined) out[remote.slug] = fieldData[match.slug];
  }
  return out;
}

async function request(path: string, method: string, token: string, body?: unknown): Promise<HttpResult> {
  const response = await fetch(`https://api.webflow.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  let json: unknown = text;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { ok: response.ok, status: response.status, json };
}

function result(method: string, path: string, http: HttpResult, note: string, body?: unknown): PublishCallResult {
  return {
    method,
    path,
    ok: http.ok,
    status: http.status,
    note: http.ok ? note : `${note} · ${readMessage(http.json)}`,
    body,
    response: http.json,
  };
}

function finish(
  _run: Run,
  mode: "live" | "dry-run",
  note: string,
  calls: PublishCallResult[],
  collectionId?: string,
): PublishResult {
  return {
    at: Date.now(),
    mode,
    note,
    calls,
    collectionId,
    itemIds: collectIds(calls),
  };
}

function readId(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const id = (json as { id?: unknown }).id;
  return typeof id === "string" ? id : undefined;
}

function readFields(json: unknown): { slug?: string; displayName?: string }[] {
  if (!json || typeof json !== "object") return [];
  const fields = (json as { fields?: unknown }).fields;
  return Array.isArray(fields) ? (fields as { slug?: string; displayName?: string }[]) : [];
}

function readMessage(json: unknown): string {
  if (!json || typeof json !== "object") return "error";
  const message = (json as { message?: unknown; msg?: unknown }).message ?? (json as { msg?: unknown }).msg;
  if (typeof message === "string") return message;
  return JSON.stringify(json).slice(0, 240);
}

function collectIds(calls: PublishCallResult[]): string[] {
  const ids: string[] = [];
  for (const call of calls) {
    if (!call.path.includes("/items") || call.method !== "POST" || !call.response) continue;
    const json = call.response;
    if (Array.isArray(json)) {
      for (const item of json) {
        const id = readId(item);
        if (id) ids.push(id);
      }
    } else if (json && typeof json === "object" && Array.isArray((json as { items?: unknown }).items)) {
      for (const item of (json as { items: unknown[] }).items) {
        const id = readId(item);
        if (id) ids.push(id);
      }
    } else {
      const id = readId(json);
      if (id && !call.path.endsWith("/collections")) ids.push(id);
    }
  }
  return ids;
}
