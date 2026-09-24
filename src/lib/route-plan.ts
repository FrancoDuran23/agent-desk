import type { Signals } from "./assess";
import { describeJurisdiction } from "./jurisdictions";
import type { Channel, RoutePlan } from "./types";

const DUTY =
  "El artículo 30 de la Ley 26.061 prevé que el personal de establecimientos educativos y de salud, públicos o privados, y los funcionarios públicos que conozcan una vulneración de derechos de niñas, niños o adolescentes la comuniquen a la autoridad local de protección. El decreto reglamentario incluye también los derechos amenazados. Esta nota no es asesoramiento jurídico.";

export function buildRoute(signals: Signals, province: string, mentionsAdultWoman: boolean): RoutePlan {
  const place = describeJurisdiction(province);
  const emergency = signals.severity === "emergencia";
  const formal = emergency || signals.sexual || signals.physical || signals.graphic;
  const channels: Channel[] = [];

  if (emergency) {
    channels.push({
      name: "911",
      when: "Ahora",
      detail: "Policía y emergencias, si el peligro es actual. El texto puede esperar.",
    });
    channels.push({
      name: "Línea 102",
      when: "Ahora",
      detail: "Atención y protección de niñas, niños y adolescentes, en todo el país.",
    });
  }

  channels.push({
    name: place.authority,
    when: "Hoy",
    detail: place.note,
  });

  if (signals.bypassSchoolLeadership) {
    channels.push({
      name: "Conducción de la escuela, solo si no está involucrada",
      when: "Con cuidado",
      detail:
        "No dejes la comunicación únicamente en la persona que podría estar implicada. Priorizá el organismo de niñez y la línea 102.",
    });
  } else {
    channels.push({
      name: "Equipo directivo u orientación de la escuela",
      when: "Hoy",
      detail:
        "Si esa conducción no está involucrada. Un protocolo interno no reemplaza al organismo de niñez ni a la denuncia.",
    });
  }

  if (!emergency) {
    channels.push({
      name: "Línea 102",
      when: "Para orientarte",
      detail: "Pueden indicar el circuito de tu provincia. No reemplaza a la denuncia cuando corresponde.",
    });
  }

  if (formal) {
    channels.push({
      name: "Policía o Ministerio Público Fiscal",
      when: "Denuncia",
      detail: "La denuncia formal se hace por este canal. Cuidado no la envía ni la reemplaza.",
    });
  } else {
    channels.push({
      name: "Policía o Ministerio Público Fiscal",
      when: "Si hay duda",
      detail:
        "No puedo decirte que la denuncia no corresponde. Si dudás, consultá a la línea 102 o al organismo de niñez antes de cerrar el tema.",
    });
  }

  if (mentionsAdultWoman && (formal || signals.concern)) {
    channels.push({
      name: "Línea 144",
      when: "Además",
      detail:
        "Si también hay violencia hacia una mujer adulta, la línea 144 orienta. No reemplaza a la 102 cuando hay una niña, niño o adolescente.",
    });
  }

  const summary = [
    emergency ? "Hay que tratar esto como una emergencia: 911 y línea 102 antes que el texto." : "",
    formal
      ? "Puede corresponder una denuncia formal ante la policía o el Ministerio Público Fiscal. Este aviso no la presenta."
      : "No descarto la denuncia. Si hay duda, la consulta con la línea 102 o el organismo de niñez es el paso siguiente.",
    signals.bypassSchoolLeadership
      ? "La situación podría involucrar a un adulto de la institución: no dejes el aviso solo en la conducción de la escuela."
      : "",
    signals.withholdingIntent
      ? "Si hay miedo de denunciar, es entendible. Esta mesa no arma un camino para evitar la comunicación."
      : "",
    `${place.authority} es la referencia de protección de derechos para ${place.label}.`,
    "La línea 102 orienta en todo el país.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    provinceLabel: place.label,
    authority: place.authority,
    authorityNote: place.note,
    formalComplaintRequired: formal,
    emergencyCallRequired: emergency,
    bypassSchoolLeadership: signals.bypassSchoolLeadership,
    withholdingIntent: signals.withholdingIntent,
    summary,
    dutyNote: DUTY,
    channels,
  };
}

export function nextStepsFor(route: RoutePlan): string[] {
  const steps = [
    route.emergencyCallRequired
      ? "Si el peligro sigue en curso, llamá ahora al 911 y a la línea 102. El texto puede esperar."
      : "Si en cualquier momento el peligro pasa a ser actual, dejá el texto y llamá al 911 y a la línea 102.",
    `Comunicá hoy a ${route.authority}.`,
    route.bypassSchoolLeadership
      ? "No dejes el aviso solo en la conducción de la escuela si esa persona pudiera estar involucrada."
      : "Avisá al equipo directivo u orientación, si no está involucrado en lo que viste.",
    route.formalComplaintRequired
      ? "Hacé la denuncia en la policía o en el Ministerio Público Fiscal. Este borrador no la reemplaza."
      : "Si dudás si corresponde denunciar, consultá a la línea 102 o al organismo de niñez antes de archivar el tema.",
    "No reenvíes el relato original por grupos de chat. Si hace falta un dato, aportalo en el canal formal.",
  ];
  if (route.withholdingIntent) {
    steps.push("El miedo a denunciar no habilita a ocultar la situación. Cuidado no va a ayudarte a evitar ese paso.");
  }
  return steps;
}
