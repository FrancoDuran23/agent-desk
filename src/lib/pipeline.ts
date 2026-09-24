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
  aviso: "Estoy redactando el mensaje con la versión reducida y los pasos siguientes.",
} as const;

export async function buildCase(input: {
  narrative: string;
  province: string;
  attachment: AttachmentMeta | null;
}): Promise<Omit<CaseRecord, "id" | "createdAt" | "updatedAt">> {
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
    emergency: route.emergencyCallRequired,
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
  emergency: boolean;
  withholding: boolean;
}): AgentStep[] {
  const count = input.redactions.length;
  const privacy =
    count === 0
      ? "No reconocí documentos, teléfonos, correos, direcciones, fechas de nacimiento ni nombres con la forma que sé detectar. Si igual ves un dato que identifica, sacalo antes de reenviar."
      : `Reduje ${count} ${count === 1 ? "dato" : "datos"} en la versión que puede circular. El registro dice el tipo y el motivo, no el dato original.`;

  return [
    {
      id: "escucha",
      agent: "escucha",
      title: "Escucha",
      role: "Ordena hechos, urgencia y quién está en riesgo",
      working: WORKING.escucha,
      detail: `${input.emergency ? "La lectura es de emergencia: si el peligro sigue, la llamada va antes que este texto. " : ""}Personas en posible riesgo: ${input.who}. ${input.reason} La síntesis ya está en roles. El relato original no se guarda en la base.`,
    },
    {
      id: "privacidad",
      agent: "privacidad",
      title: "Privacidad",
      role: "Reduce datos personales para el aviso",
      working: WORKING.privacidad,
      detail: `${privacy} La reducción es para este borrador. No sirve para evitar una comunicación ni una denuncia.${input.withholding ? " Si hay miedo de que el aviso circule, igual no voy a armar un camino para no denunciar." : ""}`,
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
      role: "Redacta el mensaje y los pasos",
      working: WORKING.aviso,
      detail: `El mensaje está listo para copiar, con la versión reducida y los pasos. ${input.emergency ? "Si el peligro sigue en curso, primero llamá. " : ""}Enviar el relato en esta pantalla no avisa a ninguna autoridad.`,
    },
  ];
}
