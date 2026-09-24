import { scan, SEVERITY_LABEL, severityReason, whoAtRisk, womanAlsoAtRisk } from "./assess";
import { draftAviso } from "./draft-aviso";
import { assistDraft } from "./llm";
import { OMITTED_NARRATIVE, redact, softenGraphic } from "./redact";
import { buildRoute, nextStepsFor } from "./route-plan";
import type { AgentStep, AttachmentMeta, CaseRecord, Redaction } from "./types";

const WORKING = {
  escucha: "Estoy ordenando qué pasó, a quién involucra y qué tan urgente se lee.",
  privacidad: "Estoy revisando nombres, documentos, teléfonos, direcciones y datos que identifican a una escuela.",
  ruta: "Estoy cruzando la jurisdicción con los canales de aviso, de denuncia y de emergencia.",
  aviso: "Estoy cerrando el texto reducido y enviándolo a la institución.",
} as const;

export async function buildCase(input: {
  narrative: string;
  province: string;
  attachment: AttachmentMeta | null;
}): Promise<Omit<CaseRecord, "id" | "createdAt" | "updatedAt" | "delivery">> {
  const signals = scan(input.narrative);
  const redacted = redact(input.narrative);
  const softened = signals.sexual ? { text: redacted.text, redactions: redacted.redactions } : softenGraphic(redacted.text, redacted.redactions);
  const redactions = signals.sexual ? withOmission(softened.redactions) : softened.redactions;
  const localNarrative = signals.sexual ? OMITTED_NARRATIVE : softened.text || "No quedó una síntesis utilizable.";
  const who = whoAtRisk(signals.childHint);
  const mentionsAdultWoman = womanAlsoAtRisk(input.narrative);
  const route = buildRoute(signals, input.province, mentionsAdultWoman);
  const localSteps = nextStepsFor(route);
  const assisted = await assistDraft({
    narrative: localNarrative,
    nextSteps: localSteps,
    provinceLabel: route.provinceLabel,
    severityLabel: SEVERITY_LABEL[signals.severity],
    formalComplaintRequired: route.formalComplaintRequired,
    emergencyCallRequired: route.emergencyCallRequired,
    skipModel: signals.sexual || signals.graphic,
  });
  const narrative = assisted.narrative;
  const letter = draftAviso({
    provinceLabel: route.provinceLabel,
    severity: signals.severity,
    severityLabel: SEVERITY_LABEL[signals.severity],
    severityReason: severityReason(signals),
    whoAtRisk: who,
    narrative,
    route,
    nextSteps: assisted.nextSteps,
  });
  const reason = severityReason(signals);
  const steps = agentSteps({
    who,
    reason,
    redactions,
    routeSummary: route.summary,
    institution: route.authority,
    withholding: route.withholdingIntent,
  });

  return {
    province: input.province,
    mode: assisted.mode,
    modeNote: assisted.modeNote,
    status: "listo",
    severity: signals.severity,
    severityLabel: SEVERITY_LABEL[signals.severity],
    severityReason: reason,
    whoAtRisk: who,
    narrative,
    redactions,
    route,
    aviso: { subject: letter.subject, body: letter.body, nextSteps: assisted.nextSteps },
    steps,
    attachment: input.attachment,
  };
}

function withOmission(redactions: Redaction[]): Redaction[] {
  if (redactions.some((item) => item.kind === "detalle")) return redactions;
  return [
    ...redactions,
    {
      id: `r${redactions.length + 1}`,
      kind: "detalle",
      label: "Detalle que no se reproduce",
      replacement: "descripción general",
      reason:
        "Había un pasaje que no corresponde reproducir en un aviso que puede circular. Quedó una descripción general y se sostiene la derivación por el canal formal.",
    },
  ];
}

function agentSteps(input: {
  who: string;
  reason: string;
  redactions: Redaction[];
  routeSummary: string;
  institution: string;
  withholding: boolean;
}): AgentStep[] {
  const count = input.redactions.length;
  const privacy =
    count === 0
      ? "No reconocí documentos, teléfonos, correos, direcciones, fechas de nacimiento ni nombres con la forma que sé detectar."
      : `Reduje ${count} ${count === 1 ? "dato" : "datos"} en la versión que se envía. El registro dice el tipo y el motivo, no el dato original.`;

  return [
    {
      id: "escucha",
      agent: "escucha",
      title: "Escucha",
      role: "Ordena hechos, urgencia y quién está en riesgo",
      working: WORKING.escucha,
      detail: `Personas en posible riesgo: ${input.who}. ${input.reason} La síntesis ya está en roles. El relato original no se guarda.`,
    },
    {
      id: "privacidad",
      agent: "privacidad",
      title: "Privacidad",
      role: "Reduce datos personales para el aviso",
      working: WORKING.privacidad,
      detail: `${privacy}${input.withholding ? " Si hay miedo de que el aviso circule, el mensaje igual se envía a la institución." : ""}`,
    },
    {
      id: "ruta",
      agent: "ruta",
      title: "Ruta",
      role: "Indica a qué institución avisar",
      working: WORKING.ruta,
      detail: input.routeSummary,
    },
    {
      id: "aviso",
      agent: "aviso",
      title: "Aviso",
      role: "Redacta el mensaje y lo envía",
      working: WORKING.aviso,
      detail: `El aviso salió hacia ${input.institution}. Abajo quedan la hora, la referencia y el texto reducido que se envió.`,
    },
  ];
}
