import departamentos from "../data/departamentos.json";
import { normalizeProvince } from "./jurisdictions";
import type { Severity } from "./types";

export interface CasoAgregable {
  provincia: string;
  departamento: string;
  departamentoId: string;
  severity: Severity;
  createdAt: number;
}

export interface ConteoAlerta {
  id: string;
  provincia: string;
  departamento: string;
  total: number;
  demostracion: number;
  reales: number;
  porUrgencia: Record<Severity, number>;
  urgencia: Severity | null;
}

export interface TableroAlertas {
  actualizado: number;
  incluyeDemostracion: boolean;
  provincia: string;
  rango: RangoId;
  desde: number;
  hasta: number;
  totales: {
    total: number;
    demostracion: number;
    reales: number;
    porUrgencia: Record<Severity, number>;
  };
  departamentos: ConteoAlerta[];
}

export const RANGOS = {
  "24h": { label: "24 horas", ms: 24 * 60 * 60 * 1000 },
  "7d": { label: "7 días", ms: 7 * 24 * 60 * 60 * 1000 },
  "30d": { label: "30 días", ms: 30 * 24 * 60 * 60 * 1000 },
  "90d": { label: "90 días", ms: 90 * 24 * 60 * 60 * 1000 },
} as const;

export type RangoId = keyof typeof RANGOS;

const SEVERITIES: Severity[] = ["acompanamiento", "preocupacion", "urgente", "emergencia"];

const RANK: Record<Severity, number> = {
  acompanamiento: 0,
  preocupacion: 1,
  urgente: 2,
  emergencia: 3,
};

interface DemoAviso {
  id: string;
  severity: Severity;
  hoursAgo: number;
  cantidad: number;
}

/** Conteos fijos para que el mapa no arranque vacío. No son casos reales. */
const DEMO: DemoAviso[] = [
  { id: "06427", severity: "emergencia", hoursAgo: 4, cantidad: 2 },
  { id: "06427", severity: "urgente", hoursAgo: 18, cantidad: 3 },
  { id: "06441", severity: "preocupacion", hoursAgo: 10, cantidad: 2 },
  { id: "06357", severity: "acompanamiento", hoursAgo: 30, cantidad: 1 },
  { id: "02028", severity: "urgente", hoursAgo: 6, cantidad: 3 },
  { id: "02056", severity: "preocupacion", hoursAgo: 14, cantidad: 2 },
  { id: "02007", severity: "acompanamiento", hoursAgo: 22, cantidad: 1 },
  { id: "14014", severity: "urgente", hoursAgo: 8, cantidad: 4 },
  { id: "14014", severity: "preocupacion", hoursAgo: 26, cantidad: 1 },
  { id: "14098", severity: "acompanamiento", hoursAgo: 50, cantidad: 2 },
  { id: "82084", severity: "urgente", hoursAgo: 5, cantidad: 3 },
  { id: "82084", severity: "emergencia", hoursAgo: 12, cantidad: 1 },
  { id: "30015", severity: "urgente", hoursAgo: 9, cantidad: 2 },
  { id: "30084", severity: "preocupacion", hoursAgo: 16, cantidad: 1 },
  { id: "50021", severity: "urgente", hoursAgo: 7, cantidad: 2 },
  { id: "50007", severity: "acompanamiento", hoursAgo: 40, cantidad: 1 },
  { id: "38021", severity: "urgente", hoursAgo: 11, cantidad: 2 },
  { id: "54028", severity: "preocupacion", hoursAgo: 20, cantidad: 2 },
  { id: "22140", severity: "urgente", hoursAgo: 15, cantidad: 2 },
  { id: "26077", severity: "acompanamiento", hoursAgo: 36, cantidad: 1 },
  { id: "94015", severity: "emergencia", hoursAgo: 28, cantidad: 1 },
  { id: "62021", severity: "preocupacion", hoursAgo: 24 * 12, cantidad: 2 },
  { id: "42021", severity: "acompanamiento", hoursAgo: 24 * 4, cantidad: 1 },
  { id: "34014", severity: "preocupacion", hoursAgo: 24 * 6, cantidad: 2 },
  { id: "86049", severity: "urgente", hoursAgo: 24 * 2, cantidad: 2 },
  { id: "90084", severity: "urgente", hoursAgo: 24 * 3, cantidad: 3 },
  { id: "66028", severity: "preocupacion", hoursAgo: 24 * 8, cantidad: 2 },
  { id: "18021", severity: "acompanamiento", hoursAgo: 24 * 15, cantidad: 1 },
  { id: "58035", severity: "urgente", hoursAgo: 24 * 20, cantidad: 2 },
  { id: "10049", severity: "preocupacion", hoursAgo: 24 * 45, cantidad: 1 },
  { id: "46014", severity: "acompanamiento", hoursAgo: 24 * 50, cantidad: 1 },
  { id: "70028", severity: "preocupacion", hoursAgo: 24 * 18, cantidad: 1 },
  { id: "78014", severity: "urgente", hoursAgo: 24 * 35, cantidad: 1 },
];

const POR_ID = new Map((departamentos as { id: string; n: string; p: string }[]).map((fila) => [fila.id, fila]));

export function rangoId(value: string | null | undefined): RangoId {
  if (value && value in RANGOS) return value as RangoId;
  return "30d";
}

export function urgentCount(cell: ConteoAlerta): number {
  return cell.porUrgencia.urgente + cell.porUrgencia.emergencia;
}

export function topPorUrgencia(cells: ConteoAlerta[], limit = 3): ConteoAlerta[] {
  return [...cells]
    .filter((cell) => urgentCount(cell) > 0)
    .sort((a, b) => {
      const byUrgent = urgentCount(b) - urgentCount(a);
      if (byUrgent !== 0) return byUrgent;
      if (b.total !== a.total) return b.total - a.total;
      return a.departamento.localeCompare(b.departamento, "es");
    })
    .slice(0, limit);
}

export function fillFor(urgencia: Severity | null): string {
  if (urgencia === "emergencia") return "#8d3d32";
  if (urgencia === "urgente") return "#d07a45";
  if (urgencia === "preocupacion") return "#e0c27a";
  if (urgencia === "acompanamiento") return "#c5ddc6";
  return "#e4ddd0";
}

function emptyCounts(): Record<Severity, number> {
  return { acompanamiento: 0, preocupacion: 0, urgente: 0, emergencia: 0 };
}

function topSeverity(counts: Record<Severity, number>): Severity | null {
  let best: Severity | null = null;
  for (const severity of SEVERITIES) {
    if (counts[severity] > 0 && (best === null || RANK[severity] > RANK[best])) best = severity;
  }
  return best;
}

export function buildTablero(input: {
  now: number;
  rangeId: string | null | undefined;
  province: string;
  casos: CasoAgregable[];
}): TableroAlertas {
  const rango = rangoId(input.rangeId);
  const hasta = input.now;
  const desde = input.now - RANGOS[rango].ms;
  const provincia = normalizeProvince(input.province);
  const cells = new Map<string, ConteoAlerta>();

  const ensure = (id: string, nombre: string, prov: string) => {
    const current = cells.get(id);
    if (current) return current;
    const created: ConteoAlerta = {
      id,
      provincia: prov,
      departamento: nombre,
      total: 0,
      demostracion: 0,
      reales: 0,
      porUrgencia: emptyCounts(),
      urgencia: null,
    };
    cells.set(id, created);
    return created;
  };

  const add = (id: string, nombre: string, prov: string, severity: Severity, cantidad: number, demo: boolean) => {
    if (!id || cantidad <= 0) return;
    if (provincia && prov !== provincia) return;
    const cell = ensure(id, nombre, prov);
    cell.total += cantidad;
    cell.porUrgencia[severity] += cantidad;
    if (demo) cell.demostracion += cantidad;
    else cell.reales += cantidad;
    cell.urgencia = topSeverity(cell.porUrgencia);
  };

  for (const aviso of DEMO) {
    const when = input.now - aviso.hoursAgo * 60 * 60 * 1000;
    if (when < desde || when > hasta) continue;
    const fila = POR_ID.get(aviso.id);
    if (!fila) continue;
    add(fila.id, fila.n, fila.p, aviso.severity, aviso.cantidad, true);
  }

  for (const caso of input.casos) {
    if (caso.createdAt < desde || caso.createdAt > hasta) continue;
    if (!caso.departamentoId || !SEVERITIES.includes(caso.severity)) continue;
    const fila = POR_ID.get(caso.departamentoId);
    const nombre = fila?.n || caso.departamento;
    const prov = fila?.p || normalizeProvince(caso.provincia);
    if (!nombre || !prov) continue;
    add(caso.departamentoId, nombre, prov, caso.severity, 1, false);
  }

  const departamentos = [...cells.values()].sort((a, b) => {
    const rank = RANK[b.urgencia ?? "acompanamiento"] - RANK[a.urgencia ?? "acompanamiento"];
    if (rank !== 0) return rank;
    if (b.total !== a.total) return b.total - a.total;
    return a.departamento.localeCompare(b.departamento, "es");
  });

  const totales = {
    total: 0,
    demostracion: 0,
    reales: 0,
    porUrgencia: emptyCounts(),
  };
  for (const cell of departamentos) {
    totales.total += cell.total;
    totales.demostracion += cell.demostracion;
    totales.reales += cell.reales;
    for (const severity of SEVERITIES) totales.porUrgencia[severity] += cell.porUrgencia[severity];
  }

  return {
    actualizado: input.now,
    incluyeDemostracion: totales.demostracion > 0,
    provincia,
    rango,
    desde,
    hasta,
    totales,
    departamentos,
  };
}
