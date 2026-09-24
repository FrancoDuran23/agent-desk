"use client";

import { withBase } from "@/lib/paths";
import type { PublicCase, PublicStep } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CaseRoom({ id }: { id: string }) {
  const [data, setData] = useState<PublicCase | null>(null);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let closed = false;
    const source = new EventSource(withBase(`/api/casos/${id}/stream`));
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; case?: PublicCase };
        if (payload.type === "missing") {
          setMissing(true);
          source.close();
          return;
        }
        if (!payload.case) return;
        setData(payload.case);
        if (payload.case.done) source.close();
      } catch {
        if (!closed) setMissing(true);
      }
    };
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        void fetch(withBase(`/api/casos/${id}`))
          .then(async (response) => {
            if (response.status === 404) {
              setMissing(true);
              return;
            }
            if (!response.ok) return;
            const body = (await response.json()) as PublicCase;
            setData(body);
          })
          .catch(() => {
            setMissing(true);
          });
      }
    };
    return () => {
      closed = true;
      source.close();
    };
  }, [id]);

  if (missing && !data) {
    return (
      <main className="case-page" id="contenido">
        <h1>No encontramos ese caso</h1>
        <p className="lede">
          Puede haber quedado en la memoria de otro proceso. Si lo preparaste recién, volvé a empezar desde el relato.
        </p>
        <Link className="text-link" href="/">
          Nuevo relato
        </Link>
      </main>
    );
  }

  const heard = data?.steps.some((step) => step.id === "escucha" && step.status === "listo");
  const privateDone = data?.steps.some((step) => step.id === "privacidad" && step.status === "listo");
  const routed = data?.steps.some((step) => step.id === "ruta" && step.status === "listo");
  const drafted = data?.steps.some((step) => step.id === "aviso" && step.status === "listo");
  const province = data?.province ? `Argentina · ${data.province}` : "Argentina";

  return (
    <main className="case-page" id="contenido">
      <header className="case-head">
        <div>
          <p className="eyebrow">Recorrido del aviso</p>
          <h1>Cuatro agentes, a la vista</h1>
          <p className="lede">
            {province}
            {data ? ` · ${data.mode === "simulacro" ? "Simulacro" : "Con modelo"}` : " · Abriendo el caso"}
          </p>
        </div>
        {data?.severityLabel ? (
          <p className={`badge badge-${data.severity}`} data-severity={data.severity ?? undefined}>
            {data.severityLabel}
          </p>
        ) : (
          <p className="badge badge-wait">En curso</p>
        )}
      </header>
      {data?.modeNote ? <p className="mode-note">{data.modeNote}</p> : null}
      {data?.severity === "emergencia" ? (
        <aside className="callout callout-emergency">
          Si el peligro sigue en curso, llamá ahora al 911 y a la línea 102. El texto puede esperar.
        </aside>
      ) : null}
      {data?.severity === "urgente" && !drafted ? (
        <aside className="callout">Esta lectura pide comunicación hoy. El aviso no reemplaza la denuncia formal.</aside>
      ) : null}
      <div className="case-grid">
        <ol className="agent-index" aria-label="Agentes">
          {(data?.steps ?? PLACEHOLDER).map((step, index) => (
            <li key={step.id} data-status={step.status}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <small>{statusLabel(step.status)}</small>
              </div>
            </li>
          ))}
        </ol>
        <div className="thread" aria-live="polite">
          {(data?.steps ?? PLACEHOLDER).map((step) => (
            <article key={step.id} className="agent-card" data-status={step.status}>
              <header>
                <h2>{step.title}</h2>
                <p>{step.role}</p>
                <span>{statusLabel(step.status)}</span>
              </header>
              {step.text ? <p className="agent-text">{step.text}</p> : null}
              {step.id === "escucha" && heard && data?.narrative ? (
                <blockquote>
                  <p>{data.narrative}</p>
                  {data.whoAtRisk ? <footer>En riesgo, por el rol: {data.whoAtRisk}.</footer> : null}
                </blockquote>
              ) : null}
              {step.id === "privacidad" && privateDone && data ? (
                <div className="redaction-log">
                  <h3>Qué se redujo</h3>
                  {data.redactions.length === 0 ? (
                    <p>No quedó un dato reconocible para listar. Revisá igual el texto antes de reenviarlo.</p>
                  ) : (
                    <ul>
                      {data.redactions.map((item) => (
                        <li key={item.id}>
                          <p>
                            <strong>{item.label}</strong>
                            <span> → {item.replacement}</span>
                          </p>
                          <p>{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
              {step.id === "ruta" && routed && data?.route ? (
                <div className="route">
                  <ul>
                    {data.route.channels.map((channel) => (
                      <li key={channel.name}>
                        <p>
                          <strong>{channel.name}</strong>
                          <span>{channel.when}</span>
                        </p>
                        <p>{channel.detail}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="duty">{data.route.dutyNote}</p>
                  <p className="duty">
                    Texto de la ley:{" "}
                    <a href="https://servicios.infoleg.gob.ar/infolegInternet/anexos/110000-114999/110778/norma.htm">
                      Ley 26.061 en Infoleg
                    </a>
                    .
                  </p>
                </div>
              ) : null}
              {step.id === "aviso" && drafted && data?.aviso ? (
                <div className="letter-wrap">
                  <div className="letter-actions">
                    <h3>Borrador para copiar</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const text = `${data.aviso?.subject}\n\n${data.aviso?.body}`;
                        void navigator.clipboard.writeText(text).then(
                          () => {
                            setCopied(true);
                            window.setTimeout(() => setCopied(false), 2000);
                          },
                          () => setCopied(false),
                        );
                      }}
                    >
                      {copied ? "Texto copiado" : "Copiar aviso"}
                    </button>
                  </div>
                  <ol className="steps">
                    {data.aviso.nextSteps.map((stepText) => (
                      <li key={stepText}>{stepText}</li>
                    ))}
                  </ol>
                  <article className="letter">
                    <h3>{data.aviso.subject}</h3>
                    <div className="letter-body">{data.aviso.body}</div>
                  </article>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
      {data?.attachment ? (
        <p className="attachment-note">
          Quedó registrado un adjunto
          {data.attachment.extension ? ` .${data.attachment.extension}` : ""} ({formatBytes(data.attachment.bytes)}). No
          guardamos el contenido.
        </p>
      ) : null}
      {data?.persistence ? <p className="binding-note">{data.persistence.note}</p> : null}
      <p className="case-footer">
        <Link href="/">Nuevo relato</Link>
      </p>
    </main>
  );
}

const PLACEHOLDER: PublicStep[] = [
  { id: "escucha", agent: "escucha", title: "Escucha", role: "Ordena hechos, urgencia y quién está en riesgo", status: "trabajando", text: "Estoy ordenando el relato." },
  { id: "privacidad", agent: "privacidad", title: "Privacidad", role: "Reduce datos personales para el aviso", status: "espera", text: "" },
  { id: "ruta", agent: "ruta", title: "Ruta", role: "Indica a qué institución avisar", status: "espera", text: "" },
  { id: "aviso", agent: "aviso", title: "Aviso", role: "Redacta el mensaje y los pasos", status: "espera", text: "" },
];

function statusLabel(status: PublicStep["status"]): string {
  if (status === "listo") return "Listo";
  if (status === "trabajando") return "Trabajando";
  return "En espera";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
