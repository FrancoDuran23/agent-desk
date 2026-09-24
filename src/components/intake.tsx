"use client";

import { PROVINCES } from "@/lib/jurisdictions";
import { withBase } from "@/lib/paths";
import type { AttachmentMeta } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EXAMPLES = [
  {
    title: "Miedo de volver a casa",
    body: "Hoy una alumna de segundo grado me dijo que en su casa le pegan cuando se porta mal y que tiene miedo de volver. No quiero escribir su nombre ni el de la familia.",
  },
  {
    title: "Un adulto de la escuela",
    body: "En el recreo un adulto de la institución empujó a un estudiante contra la pared y le gritó delante de otros chicos. El estudiante lloraba y no quería entrar al aula.",
  },
  {
    title: "Faltas y cuidado",
    body: "Hace dos semanas que un estudiante falta. Una compañera contó que en la casa no hay adultos a la tarde y que a veces no come. No tengo documento ni dirección.",
  },
];

export function Intake() {
  const router = useRouter();
  const [narrative, setNarrative] = useState("");
  const [province, setProvince] = useState("");
  const [attachment, setAttachment] = useState<AttachmentMeta | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch(withBase("/api/casos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative,
          province,
          attachment,
        }),
      });
      const data = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!response.ok || !data?.id) {
        setError(data?.error || "No pude enviar el aviso. Probá de nuevo en un momento.");
        setPending(false);
        return;
      }
      router.push(`/caso/${data.id}`);
    } catch {
      setError("No hubo conexión. El relato no se envió.");
      setPending(false);
    }
  }

  return (
    <form className="intake" onSubmit={onSubmit}>
      <div className="chat-line">
        <p className="who">Cuidado</p>
        <p>
          Contame qué viste, con tus palabras. Podés omitir nombres, DNI y direcciones: si aparecen, los reducimos en
          el aviso. No hace falta detallar lesiones ni hechos íntimos.
        </p>
      </div>
      <label className="field" htmlFor="relato">
        <span>Qué viste</span>
        <textarea
          id="relato"
          name="relato"
          value={narrative}
          maxLength={6000}
          required
          autoComplete="off"
          placeholder="Escribí lo que observaste. Alcanza con el hecho, el rol de quien está en riesgo y si el peligro sigue ahora."
          onChange={(event) => setNarrative(event.target.value)}
        />
      </label>
      <div className="examples">
        <p>Podés empezar con un ejemplo.</p>
        <div>
          {EXAMPLES.map((example) => (
            <button key={example.title} type="button" onClick={() => setNarrative(example.body)}>
              {example.title}
            </button>
          ))}
        </div>
      </div>
      <label className="field" htmlFor="provincia">
        <span>Jurisdicción</span>
        <select id="provincia" name="provincia" value={province} onChange={(event) => setProvince(event.target.value)}>
          <option value="">Argentina, sin provincia</option>
          {PROVINCES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <small>Si elegís provincia, el aviso nombra al organismo de niñez de esa jurisdicción.</small>
      </label>
      <label className="field" htmlFor="adjunto">
        <span>Adjunto, opcional</span>
        <span className="file-row">
          <input
            id="adjunto"
            className="file-input"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setAttachment(null);
                return;
              }
              const extension = file.name.includes(".") ? (file.name.split(".").pop() ?? "") : "";
              setAttachment({
                bytes: file.size,
                contentType: file.type || "application/octet-stream",
                extension: extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8),
              });
            }}
          />
          <span className="file-face">{attachment ? "Archivo elegido" : "Elegir archivo"}</span>
        </span>
        <small>
          {attachment
            ? `Se registrará un adjunto ${attachment.extension ? `.${attachment.extension}` : ""} de ${formatBytes(attachment.bytes)}. El contenido no sale de este navegador.`
            : "No subimos el archivo. Si lo elegís, solo guardamos tipo y tamaño."}
        </small>
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="submit" type="submit" disabled={pending || narrative.trim().length < 10}>
        {pending ? "Preparando el envío…" : "Enviar aviso"}
      </button>
      <p className="fine">
        El relato original no se guarda. En el aviso quedan roles, no nombres, documentos ni direcciones.
      </p>
    </form>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
