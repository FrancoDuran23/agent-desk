import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cuidado",
  description:
    "Para maestros, directivos y cuidadores. Cuidado escucha lo que viste, reduce los datos personales y envía un aviso a la institución que corresponde.",
};

const AGENTS = [
  {
    n: "01",
    title: "Escucha",
    text: "Ordena qué pasó, quién está en riesgo y qué tan urgente se lee. El relato queda en roles, no en nombres.",
  },
  {
    n: "02",
    title: "Privacidad",
    text: "Saca nombres, iniciales, documentos, teléfonos y direcciones. Una dirección queda como [domicilio omitido].",
  },
  {
    n: "03",
    title: "Ruta",
    text: "Elige la institución según la provincia y lo que se observó: la escuela, el organismo de niñez o el canal que corresponda.",
  },
  {
    n: "04",
    title: "Aviso",
    text: "Redacta el mensaje y lo envía. Ves la institución, la hora, una referencia y el texto que salió.",
  },
];

export default function HomePage() {
  return (
    <main className="home" id="contenido">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Para maestros, directivos y cuidadores</p>
          <h1>Un aviso a la institución, cuando viste algo que involucra a una niña, un niño o un adolescente.</h1>
          <p className="hero-lede">
            Cuidado escucha el relato, quita lo que identifica y envía el mensaje al organismo que corresponde. Al
            final ves qué salió, a qué hora y con qué referencia.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/probar">
              Probar Cuidado
            </Link>
            <Link className="btn btn-ghost" href="/#como-funciona">
              Cómo funciona
            </Link>
          </div>
          <ol className="hero-path" aria-label="Recorrido">
            <li>Escucha</li>
            <li>Privacidad</li>
            <li>Ruta</li>
            <li>Aviso</li>
          </ol>
        </div>
        <aside className="folio" aria-hidden="true">
          <p className="folio-kicker">Recorrido</p>
          <ol className="folio-steps">
            <li>
              <span>01</span>
              <strong>Escucha</strong>
              <small>Listo</small>
            </li>
            <li>
              <span>02</span>
              <strong>Privacidad</strong>
              <small>Listo</small>
            </li>
            <li>
              <span>03</span>
              <strong>Ruta</strong>
              <small>Listo</small>
            </li>
            <li className="is-current">
              <span>04</span>
              <strong>Aviso</strong>
              <small>Enviado</small>
            </li>
          </ol>
          <div className="folio-card">
            <p className="folio-kicker">Enviado</p>
            <p className="folio-title">Aviso enviado al organismo de niñez</p>
            <dl>
              <div>
                <dt>Estado</dt>
                <dd>Entregado</dd>
              </div>
              <div>
                <dt>Referencia</dt>
                <dd>AV-240924-7F3A91</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      <section className="band" id="como-funciona" aria-labelledby="como-titulo">
        <div className="section-intro">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="como-titulo">Cuatro agentes, en orden, hasta que el aviso sale.</h2>
          <p>Cada uno hace una sola cosa. El recorrido se ve mientras trabaja.</p>
        </div>
        <ol className="process">
          {AGENTS.map((agent) => (
            <li key={agent.title}>
              <span>{agent.n}</span>
              <h3>{agent.title}</h3>
              <p>{agent.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="band-preview" aria-labelledby="vista-titulo">
        <div className="preview-layout">
          <div className="section-intro">
            <p className="eyebrow">El resultado</p>
            <h2 id="vista-titulo">El aviso sale. Se ve exactamente qué se envió.</h2>
            <p>
              Cuando Aviso termina, el mensaje figura enviado a la institución, con hora y referencia. El texto es la
              versión reducida.
            </p>
            <ul className="preview-points">
              <li>Los nombres pasan a ser el rol.</li>
              <li>El domicilio queda como [domicilio omitido].</li>
              <li>El teléfono no entra en el aviso.</li>
            </ul>
          </div>
          <article className="preview-doc">
            <p className="folio-kicker on-paper">Ejemplo</p>
            <h3>Aviso enviado al organismo de protección de derechos</h3>
            <dl className="preview-meta">
              <div>
                <dt>Hora</dt>
                <dd>24 de septiembre de 2026, 18:42</dd>
              </div>
              <div>
                <dt>Referencia</dt>
                <dd>AV-240924-7F3A91</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <span className="pill-ok">Entregado</span>
                </dd>
              </div>
            </dl>
            <div className="preview-sent">
              <h4>Lo que se envió</h4>
              <p>
                Una alumna contó que en su casa le pegan cuando se porta mal y que tiene miedo de volver. En el aviso
                no figuran nombres, documentos ni un domicilio.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="band" id="privacidad" aria-labelledby="privacidad-titulo">
        <div className="section-intro">
          <p className="eyebrow">Privacidad</p>
          <h2 id="privacidad-titulo">Lo que identifica a una persona no viaja en el aviso.</h2>
          <p>La reducción ocurre antes del envío. El registro explica el tipo de dato y el motivo, no el dato original.</p>
        </div>
        <ul className="trust-grid">
          <li>
            <h3>El relato original no se guarda</h3>
            <p>Queda la versión reducida. El texto tal como se escribió no entra en la base.</p>
          </li>
          <li>
            <h3>Sin nombres ni iniciales</h3>
            <p>Un nombre pasa a ser el rol: una alumna, el hijo de una vecina, un adulto del hogar.</p>
          </li>
          <li>
            <h3>Sin domicilio ni teléfono</h3>
            <p>Una dirección se escribe [domicilio omitido]. El teléfono no aparece en el mensaje.</p>
          </li>
          <li>
            <h3>El archivo se queda en el navegador</h3>
            <p>Si se adjunta algo, no se sube. Solo se anota el tipo y el tamaño.</p>
          </li>
        </ul>
      </section>

      <section className="close-band" aria-labelledby="cierre-titulo">
        <div className="close-inner">
          <p className="eyebrow light">Para usar ahora</p>
          <h2 id="cierre-titulo">Si viste algo, el aviso puede salir ahora.</h2>
          <p>Contás lo que observaste. Cuidado recorre los cuatro agentes y muestra el envío.</p>
          <Link className="btn btn-light" href="/probar">
            Probar Cuidado
          </Link>
        </div>
      </section>
    </main>
  );
}
