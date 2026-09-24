import { fillFor, type ConteoAlerta } from "@/lib/alerts";
import mapa from "@/data/mapa.json";

export function DeptShapes({
  cells,
  province,
  selectedId,
  onSelect,
}: {
  cells: ConteoAlerta[];
  province?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const byId = new Map(cells.map((cell) => [cell.id, cell]));
  return (
    <>
      {mapa.features.map((feature) => {
        if (province && feature.p !== province) return null;
        const cell = byId.get(feature.id);
        const selected = selectedId === feature.id;
        return (
          <path
            key={feature.id}
            d={feature.d}
            fill={fillFor(cell?.urgencia ?? null)}
            fillRule="evenodd"
            stroke={selected ? "#163832" : "#fffdf8"}
            strokeWidth={selected ? 0.12 : 0.045}
            style={onSelect ? { cursor: "pointer" } : undefined}
            data-id={feature.id}
            onClick={onSelect ? () => onSelect(feature.id) : undefined}
          >
            {cell ? <title>{`${cell.departamento}, ${cell.provincia}: ${cell.total}`}</title> : <title>{`${feature.n}, ${feature.p}`}</title>}
          </path>
        );
      })}
    </>
  );
}

export const MAP_VIEW = mapa.view;
