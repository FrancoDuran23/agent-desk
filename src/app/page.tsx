import { BindingStatus } from "@/components/binding-status";
import { Intake } from "@/components/intake";

const AGENTS = [
  ["Escucha", "Qué pasó, quién está en riesgo y qué tan urgente se lee."],
  ["Privacidad", "Qué dato sale del borrador, y por qué."],
  ["Ruta", "Escuela, organismo de niñez, denuncia o emergencia."],
  ["Aviso", "El mensaje, con la versión reducida y los pasos."],
];

export default function HomePage() {
  return (
    <main className="landing" id="contenido">
      <section className="intro">
        <p className="eyebrow light">Equipos escolares y personas a cargo</p>
        <h1>Ordenar un aviso cuando viste algo que involucra a una niña, un niño o un adolescente.</h1>
        <p className="intro-copy">
          Cuidado no investiga ni juzga. Ayuda a dejar una comunicación preliminar, con menos datos personales, y a ver
          qué canal corresponde. Si hay peligro ahora, la llamada va primero.
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
        <BindingStatus />
      </section>
    </main>
  );
}
