import type { AgentId, Canvas, DataApiCall, FightOp, McpTool, ShowPatch, WfCollection, WfField } from "./types";
import { uid } from "./slug";

export interface PlaybookIds {
  siteId: string;
  pageId: string;
  collectionId?: string;
  runId: string;
}

export function fieldBody(field: WfField): Record<string, unknown> {
  const body: Record<string, unknown> = {
    type: field.type,
    displayName: field.displayName,
    isRequired: Boolean(field.required),
    helpText: field.helpText,
  };
  if (field.type === "Option") {
    body.metadata = { options: (field.options ?? ["Opción"]).map((name) => ({ name })) };
  }
  return body;
}

export function collectionBody(collection: WfCollection, runId: string): Record<string, unknown> {
  const suffix = runId.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase() || "casa";
  return {
    displayName: `${collection.displayName} ${suffix}`,
    singularName: collection.singularName,
    slug: `${collection.slug}-${suffix}`,
    fields: collection.fields.map(fieldBody),
  };
}

export function itemsBody(collection: WfCollection): Record<string, unknown> {
  const allowed = new Set(["name", "slug", ...collection.fields.map((field) => field.slug)]);
  return {
    items: collection.items.map((item) => {
      const fieldData: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(item.fieldData)) {
        if (allowed.has(key)) fieldData[key] = value;
      }
      fieldData.name = item.name;
      fieldData.slug = item.slug;
      return { isArchived: false, isDraft: false, fieldData };
    }),
  };
}

function op(input: Omit<FightOp, "id"> & { id?: string }): FightOp {
  return { id: input.id ?? uid("op"), ...input };
}

export function buildPlaybook(canvas: Canvas, ids: PlaybookIds): FightOp[] {
  const page = canvas.pages[0];
  const ops: FightOp[] = [
    op({
      tool: "data_sites_tool",
      action: "get_site",
      agent: "tryhard",
      status: "kept",
      execution: "data-api",
      summary: "Facu confirma que el sitio existe antes de tocar el CMS.",
      arguments: { siteId: ids.siteId, action: "get_site" },
      dataApi: { method: "GET", path: `/v2/sites/${ids.siteId}` },
    }),
  ];

  for (const collection of canvas.collections) {
    const createBody = collectionBody(collection, ids.runId);
    ops.push(
      op({
        tool: "data_cms_tool",
        action: "create_collection",
        agent: "tryhard",
        status: "kept",
        execution: "data-api",
        slug: collection.slug,
        summary: `Crear colección ${collection.displayName} con ${collection.fields.length} campos (sin los que Cami tachó).`,
        arguments: {
          action: "create_collection",
          siteId: ids.siteId,
          request: createBody,
        },
        dataApi: ids.collectionId
          ? undefined
          : { method: "POST", path: `/v2/sites/${ids.siteId}/collections`, body: createBody },
      }),
    );
    if (ids.collectionId) {
      ops[ops.length - 1] = {
        ...ops[ops.length - 1],
        summary: `WEBFLOW_COLLECTION_ID está seteado: no se crea otra colección. Los ítems entran en ${ids.collectionId}.`,
        dataApi: { method: "GET", path: `/v2/collections/${ids.collectionId}` },
        action: "get_collection_details",
      };
    }
    const items = itemsBody(collection);
    const collectionPath = ids.collectionId
      ? `/v2/collections/${ids.collectionId}/items/bulk`
      : `/v2/collections/{collectionId}/items/bulk`;
    ops.push(
      op({
        tool: "data_cms_tool",
        action: "create_collection_items",
        agent: "ansioso",
        status: "kept",
        execution: "data-api",
        slug: collection.slug,
        summary: `Cargar ${collection.items.length} ítems en ${collection.displayName}.`,
        arguments: { action: "create_collection_items", collectionId: ids.collectionId ?? "{collectionId}", request: items },
        dataApi: { method: "POST", path: collectionPath, body: items },
      }),
    );
    ops.push(
      op({
        tool: "data_cms_tool",
        action: "publish_collection_items",
        agent: "ansioso",
        status: "kept",
        execution: "data-api",
        slug: collection.slug,
        summary: "Publicar ítems (solo si la producción pide live).",
        arguments: {
          action: "publish_collection_items",
          collectionId: ids.collectionId ?? "{collectionId}",
          request: { itemIds: ["{itemIds}"] },
        },
        dataApi: {
          method: "POST",
          path: `/v2/collections/${ids.collectionId ?? "{collectionId}"}/items/publish`,
          body: { itemIds: ["{itemIds}"] },
        },
      }),
    );
  }

  if (page) {
    const pageBody = {
      title: page.title,
      slug: page.slug,
      seo: page.seo,
      openGraph: {
        title: page.openGraph.title,
        description: page.openGraph.description,
        titleCopied: false,
        descriptionCopied: false,
      },
    };
    ops.push(
      op({
        tool: "data_pages_tool",
        action: "update_page_settings",
        agent: "dramatica",
        status: "kept",
        execution: "data-api",
        summary: "SEO y Open Graph de Home con el nombre que sobrevivió a la pelea.",
        arguments: { action: "update_page_settings", pageId: ids.pageId, request: pageBody },
        dataApi: { method: "POST", path: `/v2/pages/${ids.pageId}`, body: pageBody },
      }),
    );
    const hero = page.elements.find((element) => element.id === "sec-hero");
    const heroHeading = hero?.children?.[0]?.children?.find((child) => child.type === "Heading");
    if (heroHeading?.text) {
      ops.push(
        op({
          tool: "data_element_tool",
          action: "set_text",
          agent: "dramatica",
          status: "mcp-only",
          execution: "mcp-only",
          summary: "Escribir el H1 del hero. Esto lo hace un agente MCP; el Data API no edita el árbol de elementos.",
          arguments: {
            action: "set_text",
            pageId: ids.pageId,
            elementId: heroHeading.id,
            text: heroHeading.text,
          },
        }),
      );
    }
  }

  if (canvas.assets[0]) {
    const folder = canvas.assets[0].folder;
    ops.push(
      op({
        tool: "data_assets_tool",
        action: "create_asset_folder",
        agent: "tryhard",
        status: "mcp-only",
        execution: "mcp-only",
        summary: `Carpeta de assets “${folder}”.`,
        arguments: { action: "create_asset_folder", siteId: ids.siteId, name: folder },
      }),
    );
    for (const asset of canvas.assets) {
      ops.push(
        op({
          tool: "data_assets_tool",
          action: "update_asset",
          agent: "meme",
          status: "mcp-only",
          execution: "mcp-only",
          summary: `Alt de ${asset.name}: nada de “equipo sonriendo en una oficina”.`,
          arguments: {
            action: "update_asset",
            siteId: ids.siteId,
            name: asset.name,
            altText: asset.alt,
            folder: asset.folder,
          },
        }),
      );
    }
  }

  for (const component of canvas.components) {
    ops.push(
      op({
        tool: "data_component_tool",
        action: "create_component",
        agent: "tryhard",
        status: "mcp-only",
        execution: "mcp-only",
        summary: `Componente ${component.name} (${component.props.length} props).`,
        arguments: {
          action: "create_component",
          name: component.name,
          group: component.group,
          description: component.description,
          props: component.props,
        },
      }),
    );
  }

  for (const variable of canvas.variables) {
    ops.push(
      op({
        tool: "data_variable_tool",
        action: "create_variable",
        agent: "dramatica",
        status: "mcp-only",
        execution: "mcp-only",
        summary: `Variable ${variable.name} = ${variable.value}.`,
        arguments: { action: "create_variable", name: variable.name, type: variable.type, value: variable.value },
      }),
    );
  }

  return ops;
}

export function opsForPatch(patch: ShowPatch, canvas: Canvas, agent: AgentId, seqStart: number): FightOp[] {
  const made: FightOp[] = [];
  let seq = seqStart;
  const push = (partial: Omit<FightOp, "id" | "agent"> & { agent?: AgentId }) => {
    seq += 1;
    made.push(op({ agent, ...partial, id: `fight_${seq}` }));
  };

  if (patch.upsertCollections) {
    for (const collection of patch.upsertCollections) {
      push({
        tool: "data_cms_tool" satisfies McpTool,
        action: "create_collection",
        status: collection.fields.length > 8 ? "proposed" : "kept",
        execution: "data-api",
        slug: collection.slug,
        summary:
          collection.fields.length > 8
            ? `Facu propone ${collection.displayName} con ${collection.fields.length} campos. Cami ya está mirando.`
            : `Quedó ${collection.displayName} con ${collection.fields.length} campos.`,
        arguments: {
          action: "create_collection",
          request: collectionBody(collection, "preview"),
        },
        dataApi: {
          method: "POST",
          path: "/v2/sites/{WEBFLOW_SITE_ID}/collections",
          body: collectionBody(collection, "preview"),
        },
      });
    }
  }

  if (patch.cutField) {
    const collection = canvas.collections.find((item) => item.slug === patch.cutField?.collectionSlug);
    const cut = collection?.cuts.at(-1);
    push({
      tool: "data_cms_tool",
      action: "create_collection",
      agent: "meme",
      status: "kept",
      execution: "data-api",
      slug: patch.cutField.collectionSlug,
      summary: cut
        ? `Cami tacha “${cut.displayName}” (${cut.type}). No entra al esquema final.`
        : "Cami tacha un campo.",
      arguments: {
        action: "create_collection",
        note: "El playbook final reemite create_collection solo con los campos que quedaron.",
        removedField: patch.cutField.fieldSlug,
        remaining: collection?.fields.map((field) => field.slug) ?? [],
      },
    });
  }

  if (patch.seoTitle || patch.slug) {
    const page = canvas.pages[0];
    const body = page
      ? { title: page.title, slug: page.slug, seo: page.seo, openGraph: page.openGraph }
      : undefined;
    push({
      tool: "data_pages_tool",
      action: "update_page_settings",
      status: "kept",
      execution: "data-api",
      summary: `Home pasa a llamarse “${patch.seoTitle ?? page?.title ?? "Home"}”.`,
      arguments: { action: "update_page_settings", pageId: "{WEBFLOW_PAGE_ID}", request: body },
      dataApi: body ? { method: "POST", path: "/v2/pages/{WEBFLOW_PAGE_ID}", body } : undefined,
    });
  }

  if (patch.upsertElements?.length) {
    const names = patch.upsertElements.map((element) => element.name).join(", ");
    push({
      tool: "data_element_tool",
      action: "set_text",
      status: "mcp-only",
      execution: "mcp-only",
      summary: `Entran al canvas: ${names}.`,
      arguments: {
        action: "set_text",
        elements: patch.upsertElements.map((element) => ({
          id: element.id,
          type: element.type,
          className: element.className,
          variant: element.variant,
        })),
      },
    });
  }

  if (patch.upsertComponents) {
    for (const component of patch.upsertComponents) {
      push({
        tool: "data_component_tool",
        action: "create_component",
        status: "mcp-only",
        execution: "mcp-only",
        summary: `Componente ${component.name}.`,
        arguments: { action: "create_component", name: component.name, props: component.props },
      });
    }
  }

  if (patch.upsertAssets) {
    for (const asset of patch.upsertAssets) {
      push({
        tool: "data_assets_tool",
        action: "update_asset",
        status: "mcp-only",
        execution: "mcp-only",
        summary: `Asset ${asset.name} en “${asset.folder}”.`,
        arguments: { action: "update_asset", name: asset.name, altText: asset.alt, folder: asset.folder },
      });
    }
  }

  if (patch.upsertVariables?.length) {
    push({
      tool: "data_variable_tool",
      action: "create_variable",
      status: "mcp-only",
      execution: "mcp-only",
      summary: `Variables de color: ${patch.upsertVariables.map((variable) => variable.name).join(", ")}.`,
      arguments: { action: "create_variable", variables: patch.upsertVariables },
    });
  }

  return made;
}

export function vetoProposedCollections(ops: FightOp[], slug: string): void {
  for (const item of ops) {
    if (item.tool === "data_cms_tool" && item.action === "create_collection" && item.slug === slug && item.status === "proposed") {
      item.status = "vetoed";
    }
  }
}

export function dataApiCalls(ops: FightOp[]): DataApiCall[] {
  return ops.flatMap((item) => (item.execution === "data-api" && item.dataApi && item.status !== "vetoed" && item.status !== "proposed" ? [item.dataApi] : []));
}
