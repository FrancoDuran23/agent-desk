import type { AgentId } from "./types";

export type RoomId = "living" | "cocina" | "confesionario" | "jardin" | "habitacion";

export interface AgentProfile {
  id: AgentId;
  name: string;
  aka: string;
  room: RoomId | "control" | "timbre";
  color: string;
  ink: string;
  emoji: string;
  wants: string;
  tagline: string;
}

export const ROOM_META: Record<RoomId, { label: string; emoji: string }> = {
  living: { label: "Living", emoji: "🛋️" },
  cocina: { label: "Cocina", emoji: "🍳" },
  confesionario: { label: "Confesionario", emoji: "🎥" },
  jardin: { label: "Jardín", emoji: "🌿" },
  habitacion: { label: "Habitación", emoji: "🛏️" },
};

export const AGENTS: Record<AgentId, AgentProfile> = {
  ansioso: {
    id: "ansioso",
    name: "Mateo",
    aka: "El Ansioso",
    room: "living",
    color: "#ff4d2e",
    ink: "#fff8f4",
    emoji: "⏱️",
    wants: "entregar la prueba antes de que suene el timbre",
    tagline: "El reloj es su mejor amigo y su peor enemigo",
  },
  dramatica: {
    id: "dramatica",
    name: "Lola",
    aka: "La Dramática",
    room: "habitacion",
    color: "#ff3d8a",
    ink: "#fff5fa",
    emoji: "💔",
    wants: "lágrimas, plot twist y un arco digno de gala",
    tagline: "Si no hay drama, ella lo inventa",
  },
  tryhard: {
    id: "tryhard",
    name: "Facu",
    aka: "El Tryhard",
    room: "living",
    color: "#4d8bff",
    ink: "#f4f8ff",
    emoji: "🧠",
    wants: "que la prueba semanal quede impecable",
    tagline: "Duerme con un checklist bajo la almohada",
  },
  meme: {
    id: "meme",
    name: "Cami",
    aka: "El Meme",
    room: "cocina",
    color: "#22c55e",
    ink: "#f3fff9",
    emoji: "🧃",
    wants: "matar el discurso corporativo a palazos",
    tagline: "La heladera es su trono",
  },
  casero: {
    id: "casero",
    name: "Don Hugo",
    aka: "El Casero",
    room: "timbre",
    color: "#f5c542",
    ink: "#1c140f",
    emoji: "🔑",
    wants: "el alquiler: la entrega de la prueba",
    tagline: "Cuando suena el timbre, alguien se va",
  },
  vos: {
    id: "vos",
    name: "Vos",
    aka: "La producción",
    room: "control",
    color: "#e8e0ff",
    ink: "#0a0612",
    emoji: "🎙️",
    wants: "salvar, nominar o tirar una bomba",
    tagline: "Desde la cabina de control",
  },
};

export const ROOMMATES = [AGENTS.ansioso, AGENTS.dramatica, AGENTS.tryhard, AGENTS.meme] as const;

export function portraitGlyph(id: AgentId): string {
  return AGENTS[id]?.emoji ?? "👤";
}
