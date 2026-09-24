import type { AgentId } from "./types";

export interface AgentProfile {
  id: AgentId;
  name: string;
  aka: string;
  room: string;
  color: string;
  ink: string;
  emoji: string;
  wants: string;
}

export const AGENTS: Record<AgentId, AgentProfile> = {
  ansioso: {
    id: "ansioso",
    name: "Mateo",
    aka: "El Ansioso",
    room: "Pasillo del deploy",
    color: "#ff4d2e",
    ink: "#fff8f4",
    emoji: "⏱️",
    wants: "shippear antes de que suene el timbre",
  },
  dramatica: {
    id: "dramatica",
    name: "Lola",
    aka: "La Dramática",
    room: "Cortina rosa",
    color: "#ff3d8a",
    ink: "#fff5fa",
    emoji: "🎬",
    wants: "un arco, un plot twist y lágrima en el hero",
  },
  tryhard: {
    id: "tryhard",
    name: "Facu",
    aka: "El Tryhard",
    room: "Placard CMS",
    color: "#2f6fed",
    ink: "#f4f8ff",
    emoji: "🧩",
    wants: "colecciones, campos y componentes de verdad",
  },
  meme: {
    id: "meme",
    name: "Cami",
    aka: "El Meme",
    room: "Heladera",
    color: "#0f9f6e",
    ink: "#f3fff9",
    emoji: "🔥",
    wants: "matar el slop corporativo",
  },
  casero: {
    id: "casero",
    name: "Don Hugo",
    aka: "El Casero",
    room: "Timbre",
    color: "#f0a202",
    ink: "#1c140f",
    emoji: "🔑",
    wants: "el alquiler, o sea el entregable",
  },
  vos: {
    id: "vos",
    name: "Vos",
    aka: "La producción",
    room: "Control",
    color: "#241c15",
    ink: "#fff8ef",
    emoji: "🎙️",
    wants: "salvar, vetar o tirar una bomba",
  },
};

export const ROOMMATES = [AGENTS.ansioso, AGENTS.dramatica, AGENTS.tryhard, AGENTS.meme] as const;
