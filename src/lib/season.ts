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
    title: "Episodio 1",
    subtitle: "La pelea por el nombre",
    delay: 500,
    dropMs: 10000,
  });
  chat("casero", "Bienvenidos a la casa. El alquiler se cobra con la prueba semanal. El reloj ya corre.", {
    highlight: true,
  });
  chat("ansioso", `Brief en la mesa: “${goal}”. Yo ya tendría el sitio cerrado y listo.`);
  chat("dramatica", "Pará. Si arrancamos apurados, esta temporada no tiene corazón. Yo quiero lágrimas en el héroe.");
  chat("tryhard", "Corazón después. Primero un nombre limpio y una estructura que no se caiga en la gala.");
  chat("meme", draft.roast, { highlight: true, delay: 780 });
  beats.push({
    id: id(),
    kind: "aside",
    text: "Mateo se escapó al confesionario con el timer en la mano. En el living, silencio raro.",
    delay: 420,
  });
  beats.push({
    id: id(),
    kind: "confession",
    agent: "ansioso",
    text: "No es ansiedad, es supervivencia. Si la prueba no está cuando suene el timbre, Don Hugo nos deja en la vereda. Y yo no vine a ser el eliminado.",
    delay: 900,
    highlight: true,
  });
  chat("ansioso", `Nombre para entregar hoy: “${draft.shipName}”. Corto, claro, listo.`);
  chat("dramatica", `Nombre con arco: “${draft.poeticName}”. Si no emociona, no entra.`);
  chat("tryhard", `Si no queda prolijo en el cartel, no existe. Yo voto “${draft.slugTitle}”.`);
  chat("meme", `“${draft.memeName}”. Si parece discurso de empresa, lo tiro a la heladera.`, { highlight: true });
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
    winner: "Empate. Se arma la placa. La producción tiene que salvar a alguien.",
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
      title: "Placa de nominados",
      body: "El nombre está por cerrarse y hay humo en el pasillo. ¿A quién salvás de la eliminación?",
    },
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Episodio 2",
    subtitle: "Prueba semanal: armar el sitio",
    delay: 500,
    dropMs: 8000,
  });
  chat("tryhard", "Arranca la prueba. Home en blanco. Ahora hay que llenar el living de secciones de verdad.");
  chat("dramatica", "El héroe es el póster de la casa. Si no duele un poquito, no sirve.");
  chat("ansioso", "Cuatro bloques y un botón. Si Facu pide otra cosa más, lo nominamos entre todos.");
  for (const section of draft.sections) {
    chat(
      section.owner,
      section.variant === "agenda"
        ? `Lista viva de ${section.binding}. Si cambia el horario, cambia el cartel — no un PNG mentiroso.`
        : `Suma “${section.name}” al living. ${section.heading}`,
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
    text: "Me acusan de complicar todo y después me piden que la agenda no se rompa. Organizar la casa no es un capricho, es el placard.",
    delay: 860,
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Episodio 3",
    subtitle: "La pelea de la copy",
    delay: 480,
    dropMs: 8000,
  });
  chat("ansioso", `Mateo tira la versión segura: “${draft.bland.headline}”.`, { delay: 560 });
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "ansioso",
    caption: "Héroe corporativo (va a durar poco)",
    delay: 640,
    focusId: "sec-hero",
    skipIfCopyLocked: true,
    patch: { upsertElements: [heroElement(draft.bland, "ansioso", "sketch")] },
  });
  chat("meme", "No. “Potenciar”, “ecosistema” y “líderes” se quedan en el palier. Esto es un reality, no un linkedin.", { highlight: true });
  chat("dramatica", `Entonces el héroe dice la verdad: “${draft.good.headline}”`);
  chat("tryhard", "Un solo título fuerte, una sola bajada, un solo botón. Si hay dos llamadas a la acción, hay drama.");
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "meme",
    caption: "Héroe reescrito",
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
    text: "No odio a nadie. Odio cuando el sitio suena a mail de recursos humanos. Si el botón dice “potenciarme”, lo desenchufo delante de las cámaras.",
    delay: 900,
    highlight: true,
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Episodio 4",
    subtitle: "El placard de la prueba",
    delay: 480,
    dropMs: 8000,
  });
  chat(
    "tryhard",
    `Armamos el placard “${draft.collection.displayName}” con ${draft.bloatedFields.length} casilleros. Algunos van a volar.`,
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
  chat("meme", "¿NFT eligible? ¿Nota interna? Facu, eso no es un placard, es un sótano.");
  chat("dramatica", "El plot twist se queda. Es lo único con pulso en toda la casa.");
  chat("ansioso", "Si no se puede cargar en un minuto, sobra. Punto.");
  const junk = draft.bloatedFields.filter(
    (item) => !draft.collection.fields.some((kept) => kept.slug === item.slug),
  );
  for (const field of junk) {
    chat("meme", `Afuera: ${field.displayName}. ${field.helpText}`, { delay: 480 });
    beats.push({
      id: id(),
      kind: "canvas",
      agent: "meme",
      caption: `Tacha ${field.displayName} en vivo`,
      delay: 520,
      focusId: `cms-${draft.collection.slug}`,
      patch: { cutField: { collectionSlug: draft.collection.slug, fieldSlug: field.slug } },
    });
  }
  beats.push({
    id: id(),
    kind: "vote",
    topic: "¿Qué queda en el placard?",
    tally: [
      { agent: "tryhard", choice: `${draft.bloatedFields.length} casilleros` },
      { agent: "meme", choice: "sin NFT ni sótano" },
      { agent: "dramatica", choice: "plot twist se queda" },
      { agent: "ansioso", choice: "solo lo que se carga ya" },
    ],
    winner: `${draft.collection.fields.length} casilleros. El resto, tachado en gala.`,
    delay: 680,
  });

  beats.push({
    id: id(),
    kind: "round",
    title: "Episodio 5",
    subtitle: "Cierre antes del timbre",
    delay: 480,
    dropMs: 12000,
  });
  chat("tryhard", "Dejamos piezas reutilizables: el póster y la tarjeta del placard. Si no, se copia mal en la gala.");
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "tryhard",
    caption: "Componentes",
    delay: 640,
    patch: { upsertComponents: draft.components },
  });
  chat("dramatica", `Paleta de la casa: ${draft.variables.map((variable) => variable.name).join(", ")}. Nada de gradiente violeta de startup.`);
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "dramatica",
    caption: "Variables",
    delay: 560,
    patch: { upsertVariables: draft.variables },
  });
  chat("meme", `Pie del póster: “${draft.assets[0]?.alt ?? "gente real"}”. Nada de stock apretándose la mano.`);
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
    text: "Yo no entiendo de placares digitales. Entiendo de contrato. Si hay sitio entregado, esta temporada no duerme en la vereda.",
    delay: 860,
    highlight: true,
  });
  chat("ansioso", "Cerramos. La producción se lleva el resultado de la prueba. Si hay señal, se publica.");
  beats.push({
    id: id(),
    kind: "canvas",
    agent: "ansioso",
    caption: "Cierre de temporada",
    delay: 600,
    patch: { lockAll: true },
  });
  beats.push({
    id: id(),
    kind: "finale",
    verdict: "sobreviven",
    line: "Sobreviven al alquiler. La prueba semanal está entregada. Esta noche hay gala… y hay casa.",
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
    line: "Sonó el timbre. Se llevan lo que haya de la prueba: es un desalojo con entrega, no con las manos vacías.",
    delay: 400,
    highlight: true,
  };
}
