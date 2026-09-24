import type { RoutePlan, Severity } from "./types";

const SUBJECT: Record<Severity, string> = {
  emergencia: "Comunicación urgente por posible peligro que involucra a una niña, niño o adolescente",
  urgente: "Comunicación por posible vulneración de derechos de una niña, niño o adolescente",
  preocupacion: "Aviso por una situación de cuidado que involucra a una niña, niño o adolescente",
  acompanamiento: "Nota por una situación observada que podría involucrar a una niña, niño o adolescente",
};

export function draftAviso(input: {
  provinceLabel: string;
  severity: Severity;
  severityLabel: string;
  severityReason: string;
  whoAtRisk: string;
  narrative: string;
  route: RoutePlan;
  nextSteps: string[];
}): { subject: string; body: string } {
  const date = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

  const paragraphs = [
    `Para: ${input.route.authority}`,
    `Lugar de referencia: ${input.provinceLabel}`,
    `Fecha: ${date}`,
    "Por este medio se comunica una situación observada por personal de una institución o por una persona adulta a cargo. Podría afectar derechos de una niña, un niño o un adolescente.",
    `Síntesis, con datos identificatorios reducidos:\n${input.narrative}`,
    `A quién involucra, en términos de rol: ${input.whoAtRisk}.`,
    `Lectura de urgencia: ${input.severityLabel}. ${input.severityReason}`,
    `Canal: ${input.route.summary}`,
    input.route.dutyNote,
    "Pasos que acompañan este aviso:",
    input.nextSteps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
  ];

  return { subject: SUBJECT[input.severity], body: paragraphs.join("\n\n") };
}
