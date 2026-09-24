"use client";

import { RANGOS, type RangoId, type TableroAlertas, fillFor, topPorUrgencia, urgentCount } from "@/lib/alerts";
import { PROVINCES } from "@/lib/jurisdictions";
import { withBase } from "@/lib/paths";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DeptShapes, MAP_VIEW } from "./dept-shapes";

const PERIODO: Record<RangoId, string> = {
  "24h": "las últimas 24 horas",
  "7d": "los últimos 7 días",
  "30d": "los últimos 30 días",
  "90d": "los últimos 90 días",
};

const URGENCIA: Record<string, string> = {
  acompanamiento: "Acompañamiento",
  preocupacion: "Preocupación",
  urgente: "Urgente",
  emergencia: "Emergencia",
};

export function AlertBoard({ initial }: { initial: TableroAlertas }) {
  const [tablero, setTablero] = useState(initial);
  const [province, setProvince] = useState(initial.provincia);
  const [rango, setRango] = useState<RangoId>(initial.rango);
  const [selected, setSelected] = useState<string | null>(null);
  const [live, setLive] = useState<"ok" | "error">("ok");
  const groupRef = useRef<SVGGElement>(null);
  const [view, setView] = useState(`0 0 ${MAP_VIEW[0]} ${MAP_VIEW[1]}`);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const params = new URLSearchParams();
        if (province) params.set("provincia", province);
        params.set("rango", rango);
        const response = await fetch(withBase(`/api/alertas?${params.toString()}`), { cache: "no-store" });
        if (!response.ok) throw new Error("alertas");
        const data = (await response.json()) as TableroAlertas;
        if (!cancelled) {
          setTablero(data);
          setLive("ok");
        }
      } catch {
        if (!cancelled) setLive("error");
      }
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void pull();
    }, 8000);
    void pull();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [province, rango]);

  useLayoutEffect(() => {
    const box = groupRef.current?.getBBox();
    if (!box || box.width <= 0 || box.height <= 0) {
      setView(`0 0 ${MAP_VIEW[0]} ${MAP_VIEW[1]}`);
      return;
    }
    const padX = box.width * 0.04;
    const padY = box.height * 0.04;
    setView(`${box.x - padX} ${box.y - padY} ${box.width + padX * 2} ${box.height + padY * 2}`);
  }, [province, tablero.departamentos]);

  const selectedCell = tablero.departamentos.find((cell) => cell.id === selected) ?? null;
  const foco = topPorUrgencia(tablero.departamentos, 3);

  return (
    <div className="alert-board">
      <header className="insight">
        <div>
          <p className="eyebrow">Para instituciones</p>
          <h1>Dónde enfocar la prevención</h1>
          <p>
            En {PERIODO[rango]}, estos departamentos concentran los avisos urgentes. Ahí se puede priorizar equipos y
            talleres en las escuelas.
          </p>
        </div>
        {foco.length > 0 ? (
          <ol className="insight-list">
            {foco.map((cell, index) => (
              <li key={cell.id}>
                <span>0{index + 1}</span>
                <strong>
                  {cell.departamento}
                  <small>{cell.provincia}</small>
                </strong>
                <span className="focus-count">
                  <b>{urgentCount(cell)}</b>
                  <small>urgentes</small>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="insight-empty">Sin avisos urgentes en este período.</p>
        )}
      </header>
      <div className="alert-tools">
        <label>
          <span>Provincia</span>
          <select
            value={province}
            onChange={(event) => {
              setProvince(event.target.value);
              setSelected(null);
            }}
          >
            <option value="">Todas</option>
            {PROVINCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="range-row" role="group" aria-label="Período">
          {(Object.keys(RANGOS) as RangoId[]).map((id) => (
            <button key={id} type="button" aria-pressed={rango === id} onClick={() => setRango(id)}>
              {RANGOS[id].label}
            </button>
          ))}
        </div>
      </div>

      <p className="alert-note">
        {tablero.incluyeDemostracion ? <span className="demo-badge">Datos de demostración</span> : null}
        El mapa suma esos datos y los avisos reales. Solo hay cantidades y urgencia: el relato no aparece.
        {tablero.totales.reales > 0 ? ` Avisos reales en este período: ${tablero.totales.reales}.` : ""}
      </p>

      <div className="alert-shell">
        <div className="alert-map">
          <svg viewBox={view} role="img" aria-label={mapLabel(tablero)}>
            <g ref={groupRef}>
              <DeptShapes
                cells={tablero.departamentos}
                province={province || undefined}
                selectedId={selected ?? undefined}
                onSelect={setSelected}
              />
            </g>
          </svg>
          <ul className="map-legend">
            <li><i style={{ background: fillFor("acompanamiento") }} />Acompañamiento</li>
            <li><i style={{ background: fillFor("preocupacion") }} />Preocupación</li>
            <li><i style={{ background: fillFor("urgente") }} />Urgente</li>
            <li><i style={{ background: fillFor("emergencia") }} />Emergencia</li>
          </ul>
          <p className="live-line" aria-live="polite">
            {live === "ok"
              ? `${tablero.departamentos.length} departamentos con avisos. Se actualiza solo.`
              : "No pude actualizar. Siguen los últimos datos."}
          </p>
        </div>
        <aside className="alert-list" aria-label="Avisos por departamento">
          {selectedCell ? (
            <p className="alert-focus">
              <strong>{selectedCell.departamento}</strong>
              <span>{selectedCell.provincia}</span>
              <span>{selectedCell.total} avisos · {URGENCIA[selectedCell.urgencia ?? ""] ?? ""}</span>
            </p>
          ) : null}
          {tablero.departamentos.length === 0 ? (
            <p className="alert-empty">No hay avisos en este recorte.</p>
          ) : (
            <ol>
              {tablero.departamentos.map((cell) => (
                <li key={cell.id}>
                  <button type="button" aria-pressed={selected === cell.id} onClick={() => setSelected(cell.id)}>
                    <span>
                      <strong>{cell.departamento}</strong>
                      <small>{cell.provincia}</small>
                    </span>
                    <span className="count-col">
                      <b>{cell.total}</b>
                      <small>{URGENCIA[cell.urgencia ?? ""]}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}

function mapLabel(tablero: TableroAlertas): string {
  const where = tablero.provincia || "Argentina";
  return `Mapa de ${where} con ${tablero.totales.total} avisos en ${tablero.departamentos.length} departamentos. Sin relatos.`;
}
