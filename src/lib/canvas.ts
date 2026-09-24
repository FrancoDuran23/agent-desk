import type { AgentId, Canvas, SectionPlan, SeasonDraft, ShowPatch, WfElement, WfPage } from "./types";

export function emptyCanvas(): Canvas {
  const page: WfPage = {
    id: "page-home",
    title: "Home",
    slug: "home",
    seo: { title: "Sin título", description: "El living todavía no tiene copy." },
    openGraph: { title: "Sin título", description: "Open Graph vacío. Lola lo va a tomar personal." },
    elements: [],
  };
  return {
    siteName: "Casa sin nombre",
    pages: [page],
    collections: [],
    components: [],
    assets: [],
    variables: [],
  };
}

function heading(id: string, text: string, tag: string, className: string): WfElement {
  return { id, type: "Heading", name: "Heading", className, text, tag };
}

function paragraph(id: string, text: string, binding?: string): WfElement {
  return { id, type: "Paragraph", name: "Paragraph", className: "text-body", text, binding };
}

function button(id: string, text: string): WfElement {
  return { id, type: "Button", name: "Button", className: "button-primary", text, tag: "a" };
}

export function navbarElement(title: string): WfElement {
  return {
    id: "el-nav",
    type: "Navbar",
    name: "Navbar",
    className: "navbar_main",
    variant: "nav",
    text: title,
    owner: "ansioso",
    status: "sketch",
    children: [
      heading("el-nav-brand", title, "span", "nav-brand"),
      button("el-nav-cta", "Sumarme"),
    ],
  };
}

export function heroElement(
  copy: { headline: string; body: string; cta: string },
  owner: AgentId,
  status: WfElement["status"] = "fought",
): WfElement {
  return {
    id: "sec-hero",
    type: "Section",
    name: "Hero",
    className: "section_hero",
    variant: "hero",
    owner,
    status,
    children: [
      {
        id: "sec-hero-container",
        type: "Container",
        name: "Container",
        className: "container-large",
        children: [
          heading("sec-hero-h", copy.headline, "h1", "heading-xl"),
          paragraph("sec-hero-p", copy.body),
          button("sec-hero-btn", copy.cta),
        ],
      },
    ],
  };
}

export function sectionElement(plan: SectionPlan, status: WfElement["status"] = "sketch"): WfElement {
  const children: WfElement[] = [
    heading(`${plan.id}-h`, plan.heading, "h2", "heading-lg"),
    paragraph(`${plan.id}-p`, plan.body, plan.binding),
  ];
  if (plan.cta) children.push(button(`${plan.id}-btn`, plan.cta));
  if (plan.binding) {
    children.push({
      id: `${plan.id}-list`,
      type: "CollectionList",
      name: "Collection List",
      className: "w-dyn-list",
      binding: plan.binding,
      text: plan.binding,
    });
  }
  plan.people?.forEach((person, index) => {
    children.push({
      id: `${plan.id}-person-${index}`,
      type: "Block",
      name: "Block",
      className: "person-card",
      children: [
        heading(`${plan.id}-person-${index}-h`, person.name, "h3", "heading-sm"),
        paragraph(`${plan.id}-person-${index}-p`, person.role),
      ],
    });
  });
  plan.faqs?.forEach((faq, index) => {
    children.push({
      id: `${plan.id}-faq-${index}`,
      type: "RichText",
      name: "Rich Text",
      className: "faq-item",
      text: faq.q,
      children: [paragraph(`${plan.id}-faq-${index}-a`, faq.a)],
    });
  });

  return {
    id: plan.id,
    type: "Section",
    name: plan.name,
    className: plan.className,
    variant: plan.variant,
    owner: plan.owner,
    status,
    children: [
      {
        id: `${plan.id}-container`,
        type: "Container",
        name: "Container",
        className: "container-medium",
        children,
      },
    ],
  };
}

export function chaosElement(): WfElement {
  return {
    id: "sec-caos",
    type: "Section",
    name: "Rincón del caos",
    className: "section_chaos",
    variant: "chaos",
    owner: "meme",
    status: "fought",
    text: "El casero cambió una regla",
    children: [
      {
        id: "sec-caos-container",
        type: "Container",
        name: "Container",
        className: "container-medium",
        children: [
          heading("sec-caos-h", "El casero cambió una regla", "h2", "heading-lg"),
          paragraph(
            "sec-caos-p",
            "Apareció una sección que nadie pidió. Queda, porque la casa es así y el timer no negocia.",
          ),
          button("sec-caos-btn", "Aceptar el caos"),
        ],
      },
    ],
  };
}

export function applyPatch(canvas: Canvas, patch: ShowPatch): Canvas {
  const next = structuredClone(canvas);
  const page = next.pages[0];
  if (!page) return next;
  if (patch.siteName) next.siteName = patch.siteName;
  if (patch.slug) page.slug = patch.slug;
  if (patch.seoTitle) {
    page.seo.title = patch.seoTitle;
    page.openGraph.title = patch.seoTitle;
    page.title = patch.seoTitle;
  }
  if (patch.seoDescription) {
    page.seo.description = patch.seoDescription;
    page.openGraph.description = patch.seoDescription;
  }
  if (patch.upsertElements) {
    for (const element of patch.upsertElements) {
      const index = page.elements.findIndex((item) => item.id === element.id);
      if (index >= 0) page.elements[index] = element;
      else page.elements.push(element);
    }
  }
  if (patch.removeElementIds?.length) {
    const drop = new Set(patch.removeElementIds);
    page.elements = page.elements.filter((item) => !drop.has(item.id));
  }
  if (patch.upsertCollections) {
    for (const collection of patch.upsertCollections) {
      const index = next.collections.findIndex((item) => item.slug === collection.slug);
      if (index < 0) {
        next.collections.push(structuredClone(collection));
        continue;
      }
      const prev = next.collections[index];
      const merged = structuredClone(collection);
      const chaos = prev.fields.find((field) => field.slug === "acepta-el-caos");
      if (chaos && !merged.fields.some((field) => field.slug === chaos.slug)) merged.fields.push(chaos);
      merged.cuts = prev.cuts.filter((cut) => !merged.fields.some((field) => field.slug === cut.slug));
      next.collections[index] = merged;
    }
  }
  if (patch.cutField) {
    const collection = next.collections.find((item) => item.slug === patch.cutField?.collectionSlug);
    const field = collection?.fields.find((item) => item.slug === patch.cutField?.fieldSlug);
    if (collection && field) {
      collection.fields = collection.fields.filter((item) => item.slug !== field.slug);
      collection.cuts.push({
        slug: field.slug,
        displayName: field.displayName,
        type: field.type,
        by: "meme",
      });
    }
  }
  if (patch.upsertComponents) {
    for (const component of patch.upsertComponents) {
      const index = next.components.findIndex((item) => item.name === component.name);
      if (index >= 0) next.components[index] = component;
      else next.components.push(component);
    }
  }
  if (patch.upsertAssets) {
    for (const asset of patch.upsertAssets) {
      const index = next.assets.findIndex((item) => item.name === asset.name);
      if (index >= 0) next.assets[index] = asset;
      else next.assets.push(asset);
    }
  }
  if (patch.upsertVariables) {
    for (const variable of patch.upsertVariables) {
      const index = next.variables.findIndex((item) => item.name === variable.name);
      if (index >= 0) next.variables[index] = variable;
      else next.variables.push(variable);
    }
  }
  if (patch.lockAll) {
    page.elements = page.elements.map((element) => ({ ...element, status: "locked" }));
  }
  return next;
}

export function vetoCopy(draft: SeasonDraft, note?: string): { headline: string; body: string; cta: string } {
  const clean = note?.replace(/\s+/g, " ").trim();
  if (!clean) return draft.good;
  return {
    headline: draft.good.headline,
    body: `${draft.good.body} Tachado por producción: “${clean.slice(0, 80)}”.`,
    cta: draft.good.cta,
  };
}

export function nameFor(draft: SeasonDraft, agent: "ansioso" | "dramatica" | "tryhard" | "meme"): string {
  if (agent === "dramatica") return draft.poeticName;
  if (agent === "meme") return draft.memeName;
  if (agent === "tryhard") return draft.slugTitle;
  return draft.shipName;
}

export function ownerFor(agent: "ansioso" | "dramatica" | "tryhard" | "meme"): AgentId {
  return agent;
}
