import { heroElement, sectionElement } from "./canvas";
import type { AgentId, Beat, BeatBase, SeasonDraft } from "./types";
import { uid } from "./slug";

export function weaveSeason(draft: SeasonDraft, goal: string): Beat[] {
  const beats: Beat[] = [];
  let n = 0;
  const id = () => `b${++n}`;
  const chat = (agent: AgentId, text: string, extra?: Partial<Pick<BeatBase, "delay" | "highlight" | "dropMs">>) => {
    beats.push({ id: id(), kind: "chat", agent, text, delay: extra?.delay ?? 620, highlight: extra?.highlight, dropMs: extra?.dropMs });
  };

  beats.push({
    id: id(),
    kind: "round",
    title: "Ronda 1",
    subtitle: "¿Cómo se llama esta cosa?",
    delay: 500,
    dropMs: 10000,
  });
  chat("casero", "Bienvenidos. El alquiler se cobra en entregable. El reloj ya está corriendo.", {
    highlight: true,
  });
  chat("ansioso", `Objetivo en la mesa: “${goal}”. Yo ya abriría el deploy.`);
  chat("dramatica", "Pará. Si arrancamos por Publish, esta temporada no tiene corazón.");
  chat("tryhard", "Corazón después. Primero el slug, los campos y un componente que se pueda reusar.");
  chat("meme", draft.roast, { highlight: true, delay: 780 });
  beats.push({
    id: id(),
    kind: "aside",
    text: "Mateo se metió al confesionario con el timer en la mano.",
    delay: 420,
  });
  beats.push({
    id: id(),
    kind: "confession",
    agent: "ansioso",
    text: "No es ansiedad, es fecha. Si el hero no tiene botón cuando suene el timbre, Don Hugo nos deja en la vereda.",
    delay: 900,
    highlight: true,
  });
  chat("ansioso", `Nombre para shippear hoy: “${draft.shipName}”.`);
  chat("dramatica", `Nombre con arco: “${draft.poeticName}”.`);
  chat("tryhard", `Si no entra en un slug decente, no existe. Yo voto “${draft.slugTitle}”.`);
  chat("meme", `“${draft.memeName}”. Si parece keynote, lo saco de la heladera.`, { highlight: true });
  beats.push({
    id: id(),
    kind: "confession",
    agent: "dramatica",
    text: draft.twist,
    delay: 900,
  });
  beats.push({
    id: id(),
    kind: "vote",
    topic: "El nombre de la página",
    tally: [
      { agent: "ansioso", choice: draft.shipName },
      { agent: "dramatica", choice: draft.poeticName },
      { agent: "tryhard", choice: draft.slugTitle },
      { agent: "meme", choice: draft.memeName },
    ],
    winner: "Empate. La producción tiene que salvar a alguien.",
    delay: 700,
    highlight: true,
  });
  beats.push({
    id: id(),
    kind: "human",
    delay: 400,
    prompt: {
      id: uid("prompt"),
      kind: "salvar",
      title: "La producción corta",
      body: "El nombre está por cerrarse y hay lío en el pasillo. ¿A quién salvás?",
    },
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Ronda 2",
    subtitle: "El living es una página Webflow",
    delay: 500,
    dropMs: 8000,
  });
  chat("tryhard", "Navigator abierto. Home existe. Ahora secciones, no un solo div con sombra.");
  chat("dramatica", "El hero es el póster del living. El resto tiene que contar lo que pasa después.");
  chat("ansioso", "Cuatro bloques y un botón. Si Facu pide un componente más, lo miramos feo.");
  for (const section of draft.sections) {
    chat(
      section.owner,
      section.variant === "agenda"
        ? `Collection List contra ${section.binding}. Si el horario cambia, cambia el ítem, no el PNG.`
        : `Entra “${section.name}”. ${section.heading}`,
      { delay: 540 },
    );
    beats.push({
      id: id(),
      kind: "canvas",
      agent: section.owner,
      caption: section.name,
      delay: 700,
      focusId: section.id,
      patch: { upsertElements: [sectionElement(section)] },
    });
  }
  beats.push({
    id: id(),
    kind: "confession",
    agent: "tryhard",
    text: "Me acusan de overengineering y después me piden que la agenda no se rompa. El CMS no es un capricho, es el placard.",
    delay: 860,
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Ronda 3",
    subtitle: "Copy que no parezca LinkedIn",
    delay: 480,
    dropMs: 8000,
  });
  chat("ansioso", `Mateo pega la versión rápida: “${draft.bland.headline}”.`, { delay: 560 });
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "ansioso",
    caption: "Hero corporativo (va a durar poco)",
    delay: 640,
    focusId: "sec-hero",
    skipIfCopyLocked: true,
    patch: { upsertElements: [heroElement(draft.bland, "ansioso", "sketch")] },
  });
  chat("meme", "No. “Potenciar”, “ecosistema” y “líderes” se quedan en el palier.", { highlight: true });
  chat("dramatica", `Entonces el hero dice la verdad: “${draft.good.headline}”`);
  chat("tryhard", "El H1 es un Heading, clase heading-xl, un solo Button. No dos CTAs.");
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "meme",
    caption: "Hero reescrito",
    delay: 720,
    focusId: "sec-hero-h",
    skipIfCopyLocked: true,
    highlight: true,
    patch: { upsertElements: [heroElement(draft.good, "meme", "fought")] },
  });
  beats.push({
    id: id(),
    kind: "confession",
    agent: "meme",
    text: "No odio a la IA. Odio cuando una landing suena a mail de recursos humanos. Si el botón dice “potenciarme”, lo desenchufo.",
    delay: 900,
    highlight: true,
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Ronda 4",
    subtitle: "El placard CMS",
    delay: 480,
    dropMs: 8000,
  });
  chat(
    "tryhard",
    `Colección ${draft.collection.displayName}. ${draft.bloatedFields.length} campos. Incluye cosas que vamos a discutir.`,
    { highlight: true },
  );
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "tryhard",
    caption: draft.collection.displayName,
    delay: 760,
    focusId: `cms-${draft.collection.slug}`,
    patch: {
      upsertCollections: [{ ...draft.collection, fields: draft.bloatedFields, cuts: [] }],
    },
  });
  chat("meme", "NFT eligible, nota interna y override de slug. Facu, eso no es un schema, es un sótano.");
  chat("dramatica", "El plot twist se queda. Es el único campo con pulso.");
  chat("ansioso", "Si el ítem no se puede cargar en un minuto, el campo sobra.");
  const junk = draft.bloatedFields.filter(
    (item) => !draft.collection.fields.some((kept) => kept.slug === item.slug),
  );
  for (const field of junk) {
    chat("meme", `Afuera: ${field.displayName}. ${field.helpText}`, { delay: 480 });
    beats.push({
      id: id(),
      kind: "canvas",
      agent: "meme",
      caption: `Tacha ${field.displayName}`,
      delay: 520,
      focusId: `cms-${draft.collection.slug}`,
      patch: { cutField: { collectionSlug: draft.collection.slug, fieldSlug: field.slug } },
    });
  }
  beats.push({
    id: id(),
    kind: "vote",
    topic: "¿Qué campos sobreviven?",
    tally: [
      { agent: "tryhard", choice: `${draft.bloatedFields.length} campos` },
      { agent: "meme", choice: "sin NFT ni sótano" },
      { agent: "dramatica", choice: "plot twist se queda" },
      { agent: "ansioso", choice: "los que se cargan ya" },
    ],
    winner: `${draft.collection.fields.length} campos. El resto, tachado.`,
    delay: 680,
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Ronda 5",
    subtitle: "Componentes, assets y el timbre",
    delay: 480,
    dropMs: 12000,
  });
  chat("tryhard", "HeroPoster y la card del CMS, con props. Si no es componente, se va a copiar mal.");
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "tryhard",
    caption: "Componentes",
    delay: 640,
    patch: { upsertComponents: draft.components },
  });
  chat("dramatica", `Variables ${draft.variables.map((variable) => variable.name).join(", ")}. La casa tiene paleta, no un gradiente violeta.`);
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "dramatica",
    caption: "Variables",
    delay: 560,
    patch: { upsertVariables: draft.variables },
  });
  chat("meme", `Alt del póster: “${draft.assets[0]?.alt ?? "gente real"}”. Nada de stock apretándose la mano.`);
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "meme",
    caption: "Asset",
    delay: 560,
    patch: { upsertAssets: draft.assets },
  });
  beats.push({
    id: id(),
    kind: "confession",
    agent: "casero",
    text: "Yo no entiendo de colecciones. Entiendo de contrato. Si hay página, campos e ítems, esta temporada no duerme en la vereda.",
    delay: 860,
    highlight: true,
  });
  chat("ansioso", "Lock. Se exporta el JSON, el playbook y, si hay token, se publica.");
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "ansioso",
    caption: "Lock de temporada",
    delay: 600,
    patch: { lockAll: true },
  });
  beats.push({
    id: id(),
    kind: "finale",
    verdict: "sobreviven",
    line: "Sobreviven al alquiler. El living quedó con página, CMS y un playbook que un agente de Webflow puede correr.",
    delay: 700,
    highlight: true,
  });

  return beats;
}

export function evictionBeat(): Beat {
  return {
    id: uid("fin"),
    kind: "finale",
    verdict: "desalojo",
    line: "Sonó el timbre. Se llevan lo que haya en el canvas: es un desalojo con JSON, no con las manos vacías.",
    delay: 400,
    highlight: true,
  };
}
