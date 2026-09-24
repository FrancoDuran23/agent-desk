import { MapSketch } from "@/components/map-sketch";
import { buildTablero, topPorUrgencia, urgentCount } from "@/lib/alerts";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cuidado",
  description:
    "Saber dónde actuar para prevenir la violencia contra la infancia. Docentes y cuidadores avisan en minutos. El mapa muestra el departamento, no el relato.",
};

const AGENTS = [
  {
    title: "Escucha",
    text: "Ordena qué pasó y qué tan urgente es. Le pasa el relato en roles.",
  },
  {
    title: "Privacidad",
    text: "Quita nombres y la dirección. Le pasa un texto que no identifica.",
  },
  {
    title: "Ruta",
    text: "Elige la oficina local de ese departamento y le pasa el destino.",
  },
  {
    title: "Aviso",
    text: "Cierra el mensaje y lo envía a esa oficina.",
  },
];

const VALUES = [
  {
    title: "Ver dónde se concentran",
    text: "Los avisos urgentes se leen por departamento.",
  },
  {
    title: "Priorizar",
    text: "Ese orden dice dónde hace falta un equipo primero.",
  },
  {
    title: "Prevenir",
    text: "Ahí se pueden poner talleres en las escuelas y ver si los avisos bajan.",
  },
];

export default function HomePage() {
  const tablero = buildTablero({ now: Date.now(), rangeId: "30d", province: "", casos: [] });
  const foco = topPorUrgencia(tablero.departamentos, 3);

  return (
    <main className="land" id="contenido">
      <section className="land-hero">
        <div className="land-copy">
          <h1>Saber dónde actuar para prevenir la violencia contra la infancia</h1>
          <p>
            Docentes y cuidadores avisan en minutos. Cada aviso llega anónimo a la oficina local y se suma a un mapa
            por departamento que muestra dónde enfocar la prevención.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/alertas">
              Ver el mapa
            </Link>
            <Link className="btn btn-ghost" href="/probar">
              Hacer un aviso
            </Link>
          </div>
        </div>
        <MapSketch />
      </section>

      <section className="orchestra" id="como-funciona" aria-labelledby="pasos-titulo">
        <div className="orchestra-intro">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="pasos-titulo">Cuatro agentes, en orden.</h2>
          <p>Avisás. Ellos preparan el envío. La oficina lo recibe y el mapa muestra dónde prevenir.</p>
        </div>
        <div className="pipe-track">
          <p className="beat beat-start">Avisás</p>
          <ol className="pipe">
            {AGENTS.map((agent, index) => (
              <li key={agent.title} className="beat">
                <span>0{index + 1}</span>
                <h3>{agent.title}</h3>
                <p>{agent.text}</p>
              </li>
            ))}
          </ol>
          <div className="pipe-result">
            <p className="beat beat-sent">Aviso enviado a la oficina local</p>
            <p className="beat beat-plus">+1 en el mapa</p>
          </div>
        </div>
      </section>

      <section className="land-inst" aria-labelledby="inst-titulo">
        <div className="land-copy">
          <p className="eyebrow">Para instituciones</p>
          <h2 id="inst-titulo">Con estos datos se sabe dónde actuar.</h2>
          <ul>
            {VALUES.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="focus-card" aria-label="Departamentos con más avisos urgentes">
          <p className="eyebrow">Avisos urgentes · 30 días</p>
          <ol>
            {foco.map((cell) => (
              <li key={cell.id}>
                <span>
                  <strong>{cell.departamento}</strong>
                  <small>{cell.provincia}</small>
                </span>
                <span className="focus-count">
                  <b>{urgentCount(cell)}</b>
                  <small>urgentes</small>
                </span>
              </li>
            ))}
          </ol>
          <p className="focus-note">Datos de demostración</p>
        </aside>
      </section>

      <section className="privacy-strip" id="privacidad">
        <p>Sin nombres y sin ubicación exacta. Solo el departamento.</p>
      </section>
    </main>
  );
}
