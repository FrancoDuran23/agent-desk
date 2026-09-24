import departamentos from "../data/departamentos.json";
import { normalizeProvince } from "./jurisdictions";

/**
 * Centroides de los departamentos y partidos de Argentina, tomados de Georef
 * (IGN, datos.gob.ar / infra.datos.gob.ar/georef/departamentos.geojson).
 * La resolución es por centroide más cercano. No se conserva el punto consultado.
 */

export interface LugarResuelto {
  id: string;
  departamento: string;
  provincia: string;
}

interface Fila {
  id: string;
  n: string;
  p: string;
  lat: number;
  lon: number;
}

const FILAS = departamentos as Fila[];
const MAX_KM = 320;

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function departamentosDe(provincia: string): { id: string; nombre: string }[] {
  const canonical = normalizeProvince(provincia);
  if (!canonical) return [];
  return FILAS.filter((fila) => fila.p === canonical).map((fila) => ({ id: fila.id, nombre: fila.n }));
}

export function validarLugar(provincia: string, departamento: string): LugarResuelto | null {
  const canonical = normalizeProvince(provincia);
  const nombre = departamento.trim();
  if (!canonical || !nombre) return null;
  const wanted = slug(nombre);
  const fila = FILAS.find((item) => item.p === canonical && slug(item.n) === wanted);
  if (!fila) return null;
  return { id: fila.id, departamento: fila.n, provincia: fila.p };
}

export function resolveLugar(lat: number, lon: number): LugarResuelto | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > -20 || lon < -76 || lon > -25) return null;
  let best: Fila | null = null;
  let bestKm = Infinity;
  for (const fila of FILAS) {
    const km = haversine(lat, lon, fila.lat, fila.lon);
    if (km < bestKm) {
      bestKm = km;
      best = fila;
    }
  }
  if (!best || bestKm > MAX_KM) return null;
  return { id: best.id, departamento: best.n, provincia: best.p };
}
