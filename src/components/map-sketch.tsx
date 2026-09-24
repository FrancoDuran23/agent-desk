import { buildTablero, fillFor } from "@/lib/alerts";
import { DeptShapes, MAP_VIEW } from "./dept-shapes";

const LABELS = [
  ["Acompañamiento", fillFor("acompanamiento")],
  ["Preocupación", fillFor("preocupacion")],
  ["Urgente", fillFor("urgente")],
  ["Emergencia", fillFor("emergencia")],
] as const;

export function MapSketch() {
  const tablero = buildTablero({ now: Date.now(), rangeId: "30d", province: "", casos: [] });
  return (
    <figure className="map-sketch">
      <svg viewBox={`0 0 ${MAP_VIEW[0]} ${MAP_VIEW[1]}`} role="img" aria-label="Mapa de demostración: departamentos coloreados por urgencia de avisos">
        <DeptShapes cells={tablero.departamentos} />
      </svg>
      <figcaption>
        <span className="demo-badge">Datos de demostración</span>
        <ul>
          {LABELS.map(([label, color]) => (
            <li key={label}>
              <i style={{ background: color }} />
              {label}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
