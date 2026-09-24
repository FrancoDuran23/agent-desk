import type { SeasonDraft, SectionPlan, WfCollection, WfComponent, WfField, WfItem, WfVariable } from "./types";
import { clip, looksCorporate, slugify } from "./slug";

const VARIABLES: WfVariable[] = [
  { name: "casa/ink", type: "color", value: "#1c140f" },
  { name: "casa/mango", type: "color", value: "#ffb703" },
  { name: "casa/pink", type: "color", value: "#ff3d8a" },
  { name: "casa/teal", type: "color", value: "#0f9f6e" },
];

function field(
  displayName: string,
  type: WfField["type"],
  helpText: string,
  extra?: Partial<WfField>,
): WfField {
  return {
    slug: extra?.slug ?? slugify(displayName),
    displayName,
    type,
    helpText,
    required: false,
    ...extra,
  };
}

function item(name: string, data: Record<string, string | number | boolean>): WfItem {
  return {
    name,
    slug: slugify(name),
    fieldData: { name, slug: slugify(name), ...data },
  };
}

export function buildDraft(goal: string): SeasonDraft {
  const clean = clip(goal, 400);
  const lower = clean.toLowerCase();
  const event = /meetup|after|charla|comunidad|evento|patio|wifi|factura|feria|lanzamiento/.test(lower);
  const roast = looksCorporate(clean)
    ? `Leí “${clip(clean, 80)}” y sentí un LinkedIn abriéndose solo. Eso no entra a esta casa.`
    : `Objetivo anotado en la heladera: “${clip(clean, 90)}”. Si se pone solemne, lo tachamos.`;

  if (event) return eventDraft(clean, lower, roast);
  return productDraft(clean, roast);
}

function eventDraft(goal: string, lower: string, roast: string): SeasonDraft {
  const shipName = "El after con wifi";
  const poeticName = "Crónica de un meetup que sí arrancó";
  const memeName = "Hay wifi, hay gente";
  const slugTitle = "Meetup Casa";

  const resumen = field("Resumen", "PlainText", "Una frase que se puede leer en voz alta sin vergüenza.");
  const empieza = field("Empieza", "DateTime", "Horario de cartel. El real va 25 minutos después.");
  const donde = field("Dónde", "PlainText", "Patio, bondi o living. Nada de TBD eterno.");
  const link = field("Link", "Link", "Formulario, mapa o grupo. Uno solo.");
  const facturas = field("Hay facturas", "Switch", "Si está apagado, Cami no va.");
  const twist = field("Plot twist", "RichText", "El giro de Lola. Se publica, no se esconde.");
  const asado = field("Restricción alimentaria", "Option", "Data real de una mesa, no un campo decorativo.", {
    options: ["Asado", "Sin TACC", "Solo mate", "Lo que haya"],
  });

  const junk: WfField[] = [
    field("NFT eligible", "Switch", "Por si alguien lo pide en voz alta. No lo van a pedir."),
    field("Latencia presupuesto", "Number", "Milisegundos de una excusa de Facu."),
    field("Nota interna de política", "RichText", "Chisme de pasillo. No va al CMS."),
    field("Override de slug", "PlainText", "Un slug para pisar el slug. Facu, no."),
    field("Tier de sponsor", "Option", "Oro, plata, sticker. Huele a keynote.", {
      options: ["Sticker", "Mate", "Keynote"],
    }),
  ];

  const fields = [resumen, empieza, donde, link, facturas, twist, asado];
  const collection: WfCollection = {
    slug: "encuentros",
    displayName: "Encuentros",
    singularName: "Encuentro",
    fields,
    cuts: [],
    items: [
      item("Apertura en el patio", {
        [resumen.slug]: "Alguien habla. Alguien sirve mate. El micrófono es opcional.",
        [donde.slug]: "El patio / el living / donde haya enchufe",
        [link.slug]: "https://example.com/after",
        [facturas.slug]: true,
        [twist.slug]: "El horario de cartel era mentira y estuvo bien.",
      }),
      item("Mesa de stickers", {
        [resumen.slug]: "La mesa más honesta del evento. Nadie pide QR de sponsor.",
        [donde.slug]: "Al lado del router",
        [link.slug]: "https://example.com/meetup",
        [facturas.slug]: true,
        [twist.slug]: "El sticker más feo fue el que se agotó.",
      }),
      item("El after del after", {
        [resumen.slug]: clip(goal, 140),
        [donde.slug]: "Donde todavía haya wifi",
        [link.slug]: "https://webflow.com",
        [facturas.slug]: false,
        [twist.slug]: "Se quedaron a debuggear un deploy y eso fue la charla.",
      }),
    ],
  };

  const sections: SectionPlan[] = [
    {
      id: "sec-agenda",
      name: "Agenda viva",
      className: "section_agenda",
      variant: "agenda",
      heading: "Lo que va a pasar (más o menos)",
      body: "Collection List contra Encuentros. Si el horario se mueve, se mueve el CMS, no un PNG.",
      cta: "Ver la agenda",
      owner: "tryhard",
      binding: "Encuentros",
    },
    {
      id: "sec-gente",
      name: "Quién aparece",
      className: "section_people",
      variant: "people",
      heading: "Gente, no speakers de stock",
      body: "Nombres reales o roles honestos. Nada de “thought leader”.",
      owner: "meme",
      people: [
        { name: "Quien abre el mic", role: "Habla corto y deja el cable" },
        { name: "Mesa de stickers", role: "Curaduría de la heladera" },
        { name: "El que trae facturas", role: "Infraestructura crítica" },
      ],
    },
    {
      id: "sec-mapa",
      name: "Mapa del caos",
      className: "section_map",
      variant: "generic",
      heading: "Dónde enchufar y dónde charlar",
      body: "Un bloque de texto, un link, cero mapa incrustado que no carga.",
      cta: "Cómo llegar",
      owner: "ansioso",
    },
    {
      id: "sec-faq",
      name: "FAQ honesto",
      className: "section_faq",
      variant: "faq",
      heading: "Preguntas que sí hacen",
      body: "Sin acordeón de 40 ítems. Tres, y se terminó.",
      owner: "dramatica",
      faqs: [
        { q: "¿Hay que saber algo?", a: "No. Si codeás, mejor. Si no, también hay facturas." },
        { q: "¿Empieza a horario?", a: "El cartel dice que sí. La casa dice que traigas margen." },
        { q: "¿Esto es un sponsor deck?", a: "No. Si aparece un QR de lead-gen, Cami lo despega." },
      ],
    },
  ];

  return {
    template: "evento",
    shipName,
    poeticName,
    memeName,
    slugTitle,
    pageSlug: slugify(shipName),
    thesis: clip(`${shipName}: ${goal}`, 180),
    twist: "El plot twist es que el after fue la charla, y la charla fue el grupo yéndose tarde.",
    vibe: "Mate, sticker, tipo grande, cero gradiente de startup",
    bland: {
      headline: "Potenciá tu comunidad con una experiencia innovadora",
      body: "Sumate a un ecosistema de líderes que están transformando el futuro de la tecnología.",
      cta: "Quiero potenciarme",
    },
    good: {
      headline: "Vení. Hay wifi, hay gente, hay después.",
      body: clip(goal, 220),
      cta: "Anotarme sin discurso",
    },
    collection,
    bloatedFields: [...fields, ...junk],
    sections,
    components: [
      {
        name: "HeroPoster",
        group: "Casa",
        description: "Hero con título, bajada y un solo botón. Lola lo defiende, Mateo lo quiere ya.",
        props: [
          { name: "titulo", type: "text" },
          { name: "bajada", type: "richText" },
          { name: "cta", type: "text" },
          { name: "ctaLink", type: "link" },
        ],
      },
      {
        name: "FacturaCard",
        group: "Casa",
        description: "Tarjeta de encuentro bindeada a la colección Encuentros.",
        props: [
          { name: "titulo", type: "text" },
          { name: "resumen", type: "text" },
          { name: "hayFacturas", type: "boolean" },
        ],
      },
    ],
    assets: [
      {
        name: "og-casa.png",
        folder: "Casa de agentes",
        alt: `Póster de ${shipName}. Gente, no stock de apretones de mano.`,
        kind: "image",
      },
    ],
    variables: VARIABLES,
    roast,
  };
}

function productDraft(goal: string, roast: string): SeasonDraft {
  const shipName = "La app del viernes";
  const poeticName = "Proyecto sin nombre (con sentimientos)";
  const memeName = "Esto compila, confiá";
  const slugTitle = "App Del Viernes";
  const resumen = field("Promesa en criollo", "PlainText", "Qué hace, en una frase, sin humo.");
  const estado = field("Estado", "Option", "Dónde está de verdad.", {
    options: ["Chisme", "Prototype", "Se puede clickear", "En producción, posta"],
  });
  const prueba = field("Prueba", "PlainText", "Un hecho. No un adjetivo.");
  const link = field("Link", "Link", "Demo, repo o doc. Uno.");
  const twist = field("Plot twist", "RichText", "Por qué esta idea y no la genérica.");
  const fields = [resumen, estado, prueba, link, twist];
  const junk: WfField[] = [
    field("Score de sinergia", "Number", "Un número que no mide nada."),
    field("OKR secreto", "PlainText", "Si el campo se llama así, ya perdimos."),
    field("NFT eligible", "Switch", "No."),
    field("Nota interna de política", "RichText", "Se queda en el chat de la casa."),
  ];
  const collection: WfCollection = {
    slug: "piezas",
    displayName: "Piezas",
    singularName: "Pieza",
    fields,
    cuts: [],
    items: [
      item("La promesa", {
        [resumen.slug]: clip(goal, 140),
        [estado.slug]: "Prototype",
        [prueba.slug]: "Tiene nombre, secciones y un CMS. El viernes eso ya es un producto.",
        [link.slug]: "https://webflow.com",
        [twist.slug]: "Arrancó como idea vaga y la casa la obligó a decir qué es.",
      }),
      item("Lo que no es", {
        [resumen.slug]: "No es una plataforma integral ni un ecosistema.",
        [estado.slug]: "Chisme",
        [prueba.slug]: "Cami tachó tres adjetivos antes de dejar esta frase.",
        [link.slug]: "https://webflow.com",
        [twist.slug]: "El anti-pitch también es contenido.",
      }),
      item("El viernes", {
        [resumen.slug]: "Una página que se puede mostrar sin pedir disculpas.",
        [estado.slug]: "Se puede clickear",
        [prueba.slug]: "Hero, prueba y un botón. Nada de 14 secciones.",
        [link.slug]: "https://webflow.com",
        [twist.slug]: "Llegó a tiempo porque Mateo no dejó filosofar el botón.",
      }),
    ],
  };

  const sections: SectionPlan[] = [
    {
      id: "sec-problema",
      name: "El problema sin humo",
      className: "section_problem",
      variant: "generic",
      heading: "El problema, en criollo",
      body: clip(goal, 200),
      owner: "dramatica",
    },
    {
      id: "sec-pasos",
      name: "Cómo funciona",
      className: "section_steps",
      variant: "people",
      heading: "Tres pasos, no un onboarding",
      body: "Si necesitás un diagrama, todavía no está claro.",
      owner: "ansioso",
      people: [
        { name: "1. Decís qué es", role: "Una frase. La de arriba." },
        { name: "2. Se puede mostrar", role: "Página + CMS, no un slide." },
        { name: "3. Alguien lo usa", role: "Un botón que lleva a un lugar real." },
      ],
    },
    {
      id: "sec-prueba",
      name: "Prueba, no testimonio inventado",
      className: "section_proof",
      variant: "agenda",
      heading: "Piezas con prueba",
      body: "Collection List de Piezas. Cada ítem tiene que traer un hecho.",
      owner: "tryhard",
      binding: "Piezas",
    },
    {
      id: "sec-faq",
      name: "FAQ corto",
      className: "section_faq",
      variant: "faq",
      heading: "Antes de que pregunten",
      body: "Tres respuestas. Después, el botón.",
      owner: "meme",
      faqs: [
        { q: "¿Ya está?", a: "Está para mostrar. Mateo dice que eso cuenta." },
        { q: "¿Por qué Webflow?", a: "Porque la página y el CMS salen del mismo living." },
        { q: "¿Y el pitch de startup?", a: "Se quedó en el palier. No subió." },
      ],
    },
  ];

  return {
    template: "producto",
    shipName,
    poeticName,
    memeName,
    slugTitle,
    pageSlug: slugify(shipName),
    thesis: clip(`Una página honesta para: ${goal}`, 180),
    twist: "El plot twist es que la idea vaga tuvo que elegir una frase y bancársela.",
    vibe: "Producto de viernes, humor de casa, cero mockup flotando",
    bland: {
      headline: "La solución integral para equipos que innovan",
      body: "Desbloqueá sinergias y llevá tu visión al siguiente nivel con nuestra plataforma.",
      cta: "Agendar una demo",
    },
    good: {
      headline: "Esto todavía no es famoso. Ya se puede mirar.",
      body: clip(goal, 220),
      cta: "Ver la pieza",
    },
    collection,
    bloatedFields: [...fields, ...junk],
    sections,
    components: [
      {
        name: "HeroPoster",
        group: "Casa",
        description: "Hero de una sola promesa. Si hay dos CTAs, vuelve al living.",
        props: [
          { name: "titulo", type: "text" },
          { name: "bajada", type: "richText" },
          { name: "cta", type: "text" },
        ],
      },
      {
        name: "PiezaCard",
        group: "Casa",
        description: "Ítem de la colección Piezas: promesa, estado, prueba.",
        props: [
          { name: "promesa", type: "text" },
          { name: "estado", type: "text" },
          { name: "prueba", type: "text" },
        ],
      },
    ],
    assets: [
      {
        name: "og-viernes.png",
        folder: "Casa de agentes",
        alt: "Póster de la app del viernes. Sin mockup genérico de laptop.",
        kind: "image",
      },
    ],
    variables: VARIABLES,
    roast,
  };
}

export function mergeSpice(draft: SeasonDraft, spice: Partial<Record<string, unknown>>): SeasonDraft {
  const str = (key: string, max: number, fallback: string) => {
    const value = spice[key];
    if (typeof value !== "string") return fallback;
    const clean = clip(value, max);
    return clean.length > 2 ? clean : fallback;
  };
  const next: SeasonDraft = {
    ...draft,
    shipName: str("shipName", 42, draft.shipName),
    poeticName: str("poeticName", 64, draft.poeticName),
    memeName: str("memeName", 42, draft.memeName),
    slugTitle: str("slugTitle", 32, draft.slugTitle),
    thesis: str("thesis", 180, draft.thesis),
    twist: str("twist", 180, draft.twist),
    vibe: str("vibe", 80, draft.vibe),
    bland: {
      headline: str("blandHeadline", 80, draft.bland.headline),
      body: draft.bland.body,
      cta: draft.bland.cta,
    },
    good: {
      headline: str("goodHeadline", 80, draft.good.headline),
      body: str("goodBody", 220, draft.good.body),
      cta: str("goodCta", 32, draft.good.cta),
    },
  };
  next.pageSlug = slugify(next.shipName);
  const headlines = Array.isArray(spice.sectionHeadlines) ? spice.sectionHeadlines : [];
  next.sections = draft.sections.map((section, index) => {
    const headline = headlines[index];
    if (typeof headline !== "string") return section;
    const clean = clip(headline, 72);
    return clean.length > 2 ? { ...section, heading: clean } : section;
  });
  return next;
}
