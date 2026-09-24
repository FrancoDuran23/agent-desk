import { outputUnsafe } from "./assess";
import { redact } from "./redact";

export interface AssistInput {
  narrative: string;
  nextSteps: string[];
  provinceLabel: string;
  severityLabel: string;
  formalComplaintRequired: boolean;
  emergencyCallRequired: boolean;
  skipModel: boolean;
}

export interface AssistResult {
  mode: "simulacro" | "asistido";
  modeNote: string;
  narrative: string;
  nextSteps: string[];
}

const DEMO_NOTE =
  "Simulacro. No hay un modelo conectado: los cuatro agentes siguen reglas locales de escucha, reducción de datos y canales. No es una evaluación clínica ni jurídica.";

const SKIP_NOTE =
  "Simulacro de redacción. Este relato no se envió a un modelo externo. El aviso lo arman las reglas locales y no reproduce el detalle.";

const ASSIST_NOTE =
  "Un modelo ayudó a ajustar la redacción a partir del texto ya reducido. No baja la urgencia ni la obligación de avisar.";

const FAIL_NOTE =
  "El modelo no respondió. Quedó el simulacro, con las mismas reglas de reducción y de aviso.";

export async function assistDraft(input: AssistInput): Promise<AssistResult> {
  const local = {
    narrative: input.narrative,
    nextSteps: input.nextSteps,
  };
  if (input.skipModel) {
    return { mode: "simulacro", modeNote: SKIP_NOTE, ...local };
  }
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { mode: "simulacro", modeNote: DEMO_NOTE, ...local };
  }

  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const parsed = await complete(base, key, model, input);
    const narrative = sanitizeNarrative(parsed.summary, input.narrative);
    const nextSteps = sanitizeSteps(parsed.nextSteps, input.nextSteps);
    if (!narrative) return { mode: "simulacro", modeNote: FAIL_NOTE, ...local };
    return { mode: "asistido", modeNote: ASSIST_NOTE, narrative, nextSteps };
  } catch {
    return { mode: "simulacro", modeNote: FAIL_NOTE, ...local };
  }
}

function sanitizeNarrative(value: unknown, fallback: string): string | null {
  if (typeof value !== "string") return null;
  const cleaned = redact(value).text.trim();
  if (!cleaned || cleaned.length > 1200 || outputUnsafe(cleaned)) return null;
  return cleaned || fallback;
}

function sanitizeSteps(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const steps = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => redact(item).text.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 8 && item.length < 220 && !outputUnsafe(item))
    .slice(0, 6);
  return steps.length >= 3 ? steps : fallback;
}

async function complete(
  base: string,
  key: string,
  model: string,
  input: AssistInput,
): Promise<{ summary?: unknown; nextSteps?: unknown }> {
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Redactás una síntesis breve, en español rioplatense, para un aviso institucional preliminar en Argentina. Tono calmo. No inventes hechos. No agregues detalles gráficos ni de integridad sexual. No sugieras demorar, minimizar ni evitar la denuncia, la línea 102, el organismo de niñez ni la policía. Si la urgencia es Urgente o Emergencia, los pasos tienen que decir que corresponde la comunicación formal. Devolvé solo JSON con las claves summary (string) y nextSteps (array de strings).",
        },
        {
          role: "user",
          content: JSON.stringify({
            province: input.provinceLabel,
            severity: input.severityLabel,
            formalComplaintRequired: input.formalComplaintRequired,
            emergencyCallRequired: input.emergencyCallRequired,
            redactedNarrative: input.narrative,
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;
  if (!parsed || typeof parsed !== "object") throw new Error("JSON vacío");
  return parsed as { summary?: unknown; nextSteps?: unknown };
}
