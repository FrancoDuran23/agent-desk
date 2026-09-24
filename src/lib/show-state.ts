import { AGENTS, type RoomId } from "./agents";
import type { AgentId, Beat, PublicRun } from "./types";

export type Mood = "feliz" | "tenso" | "llorando" | "conspirando" | "eufórico" | "enojado";

const MOOD_LABEL: Record<Mood, string> = {
  feliz: "Feliz",
  tenso: "Tenso",
  llorando: "Al borde",
  conspirando: "Conspirando",
  eufórico: "Eufórico",
  enojado: "Enojado",
};

export function moodLabel(mood: Mood) {
  return MOOD_LABEL[mood];
}

export interface ContestantState {
  id: AgentId;
  room: RoomId;
  mood: Mood;
  popularidad: number;
  alliance?: AgentId;
  rivalry?: AgentId;
}

const DEFAULT_ROOMS: Record<"ansioso" | "dramatica" | "tryhard" | "meme", RoomId> = {
  ansioso: "living",
  dramatica: "habitacion",
  tryhard: "living",
  meme: "cocina",
};

export function deriveContestants(run: PublicRun): ContestantState[] {
  const rooms = { ...DEFAULT_ROOMS };
  const moods: Record<"ansioso" | "dramatica" | "tryhard" | "meme", Mood> = {
    ansioso: "tenso",
    dramatica: "conspirando",
    tryhard: "feliz",
    meme: "feliz",
  };
  const pop: Record<"ansioso" | "dramatica" | "tryhard" | "meme", number> = {
    ansioso: 62,
    dramatica: 71,
    tryhard: 58,
    meme: 77,
  };

  for (const beat of run.revealed) {
    placeFromBeat(beat, rooms, moods, pop);
  }

  if (run.awaiting) {
    moods.ansioso = "tenso";
    moods.dramatica = "llorando";
    pop.dramatica = Math.min(95, pop.dramatica + 4);
  }

  const ids = ["ansioso", "dramatica", "tryhard", "meme"] as const;
  return ids.map((id) => ({
    id,
    room: rooms[id],
    mood: moods[id],
    popularidad: Math.max(18, Math.min(96, Math.round(pop[id]))),
    alliance: id === "ansioso" ? "tryhard" : id === "dramatica" ? "meme" : undefined,
    rivalry: id === "ansioso" ? "dramatica" : id === "tryhard" ? "meme" : id === "meme" ? "tryhard" : "ansioso",
  }));
}

function placeFromBeat(
  beat: Beat,
  rooms: Record<"ansioso" | "dramatica" | "tryhard" | "meme", RoomId>,
  moods: Record<"ansioso" | "dramatica" | "tryhard" | "meme", Mood>,
  pop: Record<"ansioso" | "dramatica" | "tryhard" | "meme", number>,
) {
  if (beat.kind === "confession" && beat.agent in rooms) {
    const id = beat.agent as keyof typeof rooms;
    rooms[id] = "confesionario";
    moods[id] = id === "dramatica" ? "llorando" : "conspirando";
    pop[id] += 3;
  }
  if (beat.kind === "canvas" && beat.agent in rooms) {
    const id = beat.agent as keyof typeof rooms;
    rooms[id] = "living";
    moods[id] = id === "ansioso" ? "tenso" : "eufórico";
    pop[id] += 1;
  }
  if (beat.kind === "chat" && beat.agent in rooms) {
    const id = beat.agent as keyof typeof rooms;
    if (id === "meme") rooms[id] = beat.text.toLowerCase().includes("heladera") ? "cocina" : rooms[id];
    if (id === "dramatica" && /llor|drama|corazón|lágrima/.test(beat.text.toLowerCase())) {
      moods[id] = "llorando";
      rooms[id] = "jardin";
    }
    if (/traidor|alianza|en contra|nomin/.test(beat.text.toLowerCase())) {
      moods[id] = "conspirando";
      rooms[id] = "jardin";
    }
  }
  if (beat.kind === "vote") {
    for (const row of beat.tally) {
      if (row.agent in pop) pop[row.agent as keyof typeof pop] += 2;
    }
  }
}

export function dramaLevel(run: PublicRun): number {
  let score = 25;
  for (const beat of run.revealed) {
    if (beat.kind === "confession") score += 8;
    if (beat.kind === "vote") score += 10;
    if (beat.kind === "human") score += 12;
    if (beat.kind === "chat" && /pelea|nomin|traidor|llor|bomba|caos/.test(beat.text.toLowerCase())) score += 5;
  }
  if (run.awaiting) score += 15;
  if (run.timerMs < 60000) score += 20;
  if (run.status !== "live") score = Math.max(score, 80);
  return Math.max(10, Math.min(100, score));
}

export function episodeTitle(run: PublicRun): string {
  if (run.round?.title) return `${run.round.title}: ${run.round.subtitle}`;
  return "Episodio 1: Bienvenidos a la casa";
}

export function dayInHouse(run: PublicRun): number {
  const rounds = run.revealed.filter((b) => b.kind === "round").length;
  return Math.max(1, Math.min(7, rounds || 1));
}

export function tickerHeadlines(run: PublicRun): string[] {
  const lines: string[] = [];
  const last = [...run.revealed].reverse();
  for (const beat of last) {
    if (beat.kind === "confession") {
      lines.push(`ÚLTIMO MOMENTO: ${AGENTS[beat.agent].aka} entró al confesionario`);
    }
    if (beat.kind === "vote") lines.push(`PLACA: ${beat.topic} — ${beat.winner}`);
    if (beat.kind === "chat" && beat.highlight) {
      lines.push(`${AGENTS[beat.agent].aka}: “${beat.text.slice(0, 72)}${beat.text.length > 72 ? "…" : ""}”`);
    }
    if (beat.kind === "finale") lines.push(`GALA: ${beat.line}`);
    if (lines.length >= 4) break;
  }
  if (run.awaiting) lines.unshift(`URGENTE: ${run.awaiting.title}`);
  if (lines.length === 0) {
    return [
      "EN VIVO: los roommates pelean la prueba semanal",
      "La producción puede salvar, nominar o tirar una bomba de caos",
      "El confesionario está abierto — alguien va a soltar la sopa",
    ];
  }
  while (lines.length < 3) lines.push("Casa de agentes · Temporada en curso");
  return lines;
}

export function narratorLine(run: PublicRun): string {
  if (run.status === "evicted") return "Sonó el timbre. Alguien se queda sin casa esta noche.";
  if (run.status === "finale") return "La gala cierra con la entrega de la prueba. El público decide.";
  if (run.awaiting) return "La producción corta la emisión. Hay que salvar a alguien… o dejar que caigan.";
  const last = run.revealed.at(-1);
  if (!last) return "Las cámaras encienden. Cuatro roommates. Una sola prueba semanal.";
  if (last.kind === "confession") return `${AGENTS[last.agent].name} habla a cámara. Nadie más escucha… o eso cree.`;
  if (last.kind === "round") return `Arranca ${last.title}. ${last.subtitle}.`;
  if (last.kind === "vote") return "Se arma la placa. Miradas asesinas en el living.";
  if (last.kind === "canvas") return `La prueba semanal avanza: ${last.caption}.`;
  if (last.kind === "chat") return `En el living: ${AGENTS[last.agent].aka} no se calla.`;
  return "El drama no para. El reloj tampoco.";
}
