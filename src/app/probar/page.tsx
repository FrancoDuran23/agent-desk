import { Intake } from "@/components/intake";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Probar",
  description: "Contá lo que viste. Cuidado prepara el aviso y lo envía a la institución que corresponde.",
};

const AGENTS = [
  ["Escucha", "Qué pasó, quién está en riesgo y qué tan urgente se lee."],
  ["Privacidad", "Qué dato sale del aviso, y por qué."],
  ["Ruta", "La institución que tiene que recibirlo."],
  ["Aviso", "El mensaje reducido, con hora y referencia."],
];

export default function ProbarPage() {
  return (
    <main className="landing" id="contenido">
      <section className="intro">
        <p className="eyebrow light">Equipos escolares y personas a cargo</p>
        <h1>Contanos qué viste. El aviso se envía a la institución.</h1>
        <p className="intro-copy">
          Cuatro agentes trabajan en orden: escuchan el relato, reducen los datos, eligen el organismo y envían el
          mensaje.
        </p>
        <ol className="intro-agents">
          {AGENTS.map(([title, copy], index) => (
            <li key={title}>
              <span>0{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="panel">
        <Intake />
      </section>
    </main>
  );
}
