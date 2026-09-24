import { mergeSpice } from "./draft";
import type { SeasonDraft } from "./types";

export async function spiceDraft(
  draft: SeasonDraft,
  goal: string,
): Promise<{ draft: SeasonDraft; mode: "simulacro" | "en-vivo"; modeNote: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return {
      draft,
      mode: "simulacro",
      modeNote: "Sin OPENAI_API_KEY. Temporada escrita por la casa, igual de ruidosa.",
    };
  }

  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const body = {
    model,
    temperature: 0.9,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "Escribís condimentos para un reality de roommates en español rioplatense, tono jujuy.dev / Nerdearla. Nada de copy corporativo, nada de sinergia, nada de líderes. Devolvé solo JSON.",
      },
      {
        role: "user",
        content: JSON.stringify({
          goal,
          template: draft.template,
          need: {
            shipName: "nombre corto para shippear, máx 42",
            poeticName: "nombre con arco, máx 64",
            memeName: "nombre con humor, máx 42",
            slugTitle: "título prolijo, máx 32",
            thesis: "una frase",
            twist: "plot twist en una frase",
            vibe: "paleta en pocas palabras",
            blandHeadline: "un H1 horrible de LinkedIn, para que lo maten",
            goodHeadline: "H1 bueno, concreto",
            goodBody: "bajada que cita la idea del usuario",
            goodCta: "botón de 2 o 3 palabras",
            sectionHeadlines: draft.sections.map((section) => `nuevo título para ${section.name}`),
          },
        }),
      },
    ],
  };

  try {
    const spice = await complete(base, key, body, true);
    return {
      draft: mergeSpice(draft, spice),
      mode: "en-vivo",
      modeNote: `Copy condimentada con ${model}. La casa sigue armando la temporada, los votos y el canvas.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "sin detalle";
    return {
      draft,
      mode: "simulacro",
      modeNote: `La API no respondió (${message}). Modo simulacro.`,
    };
  }
}

async function complete(
  base: string,
  key: string,
  body: Record<string, unknown>,
  withFormat: boolean,
): Promise<Record<string, unknown>> {
  const payload = withFormat ? { ...body, response_format: { type: "json_object" } } : body;
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 400 && withFormat) return complete(base, key, body, false);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;
  if (!parsed || typeof parsed !== "object") throw new Error("JSON vacío");
  return parsed as Record<string, unknown>;
}
