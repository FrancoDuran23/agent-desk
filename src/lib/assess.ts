import type { Severity } from "./types";

export type ChildHint =
  | "alumna"
  | "alumno"
  | "hijo-vecina"
  | "hija-vecina"
  | "hijo-vecino"
  | "hija-vecino"
  | "hijo"
  | "hija"
  | "adolescente"
  | "varios"
  | "estudiante"
  | "no-claro";

export interface Signals {
  severity: Severity;
  sexual: boolean;
  graphic: boolean;
  physical: boolean;
  concern: boolean;
  withholdingIntent: boolean;
  bypassSchoolLeadership: boolean;
  childHint: ChildHint;
}

const SEXUAL =
  /\b(abuso sexual|abus[oó] sexualmente|violaci[oó]n|viol[oó]|tocamientos?|manose\w*|pornograf\w*|desnudez|desnudos?|penetr\w*|acto sexual|actos sexuales|partes íntimas|partes intimas|genitales)\b/i;

const GRAPHIC =
  /\b(sangre|sangrando|desangr\w*|cuchill\w*|arma de fuego|un arma|dispar\w*|degoll\w*|herida abierta|se desmay\w*|convulsion\w*|convulsión\w*)\b/i;

const EMERGENCY =
  /\b(arma de fuego|un arma|dispar\w*|no respira|convulsion\w*|convulsión\w*|se desmay\w*|amenaza de muerte|peligro inmediato|se está lastimando|se esta lastimando|en este momento lo está|en este momento la está)\b/i;

const PHYSICAL =
  /(?<![\p{L}\p{N}_])(?:golpe(?:s|ó|o|aron|aba)?|pegó|pego|pegan|pegaba|pegarle|pegaron|lastimó|lastimo|lastimaron|lastimaba|lastimarle|lastiman|moret[oó]n(?:es)?|empuj\p{L}*|cachetad\p{L}*|cintur[oó]n|zamarre\p{L}*|patad\p{L}*|amenaz\p{L}*|encerr\p{L}*|no le dan de comer|lo dejan solo|la dejan sola|abandono)(?![\p{L}\p{N}_])/iu;

const CONCERN =
  /\b(grita|gritó|grito|insult\w*|humill\w*|hambre|no come|falta|llora|no quiere ir|no quiere volver|descuido|sin dormir)\b/i;

const WITHHOLD =
  /\b(no quiero denunciar|sin denunciar|sin hacer la denuncia|que no se entere|no llames|no llamar a la polic|ocultar|evitar la denuncia|que no haya denuncia|sin que intervenga|no quiero que se sepa)\b/i;

const LEADER_ACTOR =
  /\b(?:el|la|un|una)\s+(?:director|directora|preceptor|preceptora|maestro|maestra|docente|profesor|profesora)\b[^.?!\n]{0,90}\b(peg\w*|golpe\w*|empuj\w*|grit\w*|amenaz\w*|abus\w*|toc\w*|castig\w*)|\b(peg\w*|golpe\w*|empuj\w*|abus\w*)\b[^.?!\n]{0,90}\b(?:el|la|un|una)\s+(?:director|directora|preceptor|preceptora|maestro|maestra|docente|profesor|profesora)\b|\badulto de la (?:escuela|instituci[oó]n)\b/i;

export function scan(text: string): Signals {
  const source = text.normalize("NFC");
  const sexual = SEXUAL.test(source);
  const graphic = GRAPHIC.test(source);
  const emergencyWords = EMERGENCY.test(source);
  const physical = PHYSICAL.test(source) || graphic;
  const concern = CONCERN.test(source);
  const withholdingIntent = WITHHOLD.test(source);
  const bypassSchoolLeadership = LEADER_ACTOR.test(source) && (physical || sexual || emergencyWords || /\bgrit/i.test(source));

  let severity: Severity = "acompanamiento";
  if (emergencyWords) severity = "emergencia";
  else if (sexual || physical) severity = "urgente";
  else if (concern) severity = "preocupacion";

  return {
    severity,
    sexual,
    graphic,
    physical,
    concern,
    withholdingIntent,
    bypassSchoolLeadership,
    childHint: detectChild(source),
  };
}

function detectChild(text: string): ChildHint {
  const alumna = /\b(alumnas|alumna)\b/i.test(text);
  const alumno = /\b(alumnos|alumno)\b/i.test(text);
  const girl = /\b(hija|niña|nena|niñas|nenas|hijas)\b/i.test(text);
  const boy = /\b(hijo|niño|nene|niños|nenes|hijos)\b/i.test(text);
  const vecina = /\bvecinas?\b/i.test(text);
  const vecino = /\bvecinos?\b/i.test(text);
  if (/\b(varios|varias|los chicos|las chicas|estudiantes)\b/i.test(text) || (alumna && alumno) || (girl && boy)) {
    return "varios";
  }
  if ((girl || boy) && vecina) return girl ? "hija-vecina" : "hijo-vecina";
  if ((girl || boy) && vecino) return girl ? "hija-vecino" : "hijo-vecino";
  if (alumna) return "alumna";
  if (alumno) return "alumno";
  if (girl) return "hija";
  if (boy) return "hijo";
  if (/\badolescentes?\b/i.test(text)) return "adolescente";
  if (/\b(estudiante|menor|chico|chica)\b/i.test(text)) return "estudiante";
  return "no-claro";
}

export function whoAtRisk(hint: ChildHint): string {
  switch (hint) {
    case "hija-vecina":
      return "la hija de una vecina";
    case "hijo-vecina":
      return "el hijo de una vecina";
    case "hija-vecino":
      return "la hija de un vecino";
    case "hijo-vecino":
      return "el hijo de un vecino";
    case "alumna":
      return "una alumna";
    case "alumno":
      return "un alumno";
    case "hija":
      return "la niña";
    case "hijo":
      return "el niño";
    case "adolescente":
      return "una adolescente o un adolescente";
    case "varios":
      return "más de una persona menor de edad";
    case "estudiante":
      return "un estudiante";
    default:
      return "un niño o niña";
  }
}

export function severityReason(signals: Signals): string {
  if (signals.sexual) {
    return "El relato indica una posible vulneración grave de la integridad. No se reproducen detalles. Corresponde comunicar de inmediato y hacer la denuncia formal.";
  }
  if (signals.severity === "emergencia") {
    return "El relato sugiere un peligro que puede estar en curso. La prioridad es la llamada, no el texto.";
  }
  if (signals.severity === "urgente") {
    return "Hay indicios de violencia o de una situación que el equipo escolar y el organismo de niñez tienen que conocer. Corresponde evaluar la denuncia formal ya.";
  }
  if (signals.severity === "preocupacion") {
    return "Hay señales de cuidado que conviene no archivar. La línea 102 y el organismo de niñez pueden orientar. No puedo decirte que la denuncia no corresponde.";
  }
  return "No se lee una urgencia explícita. Igual puede corresponder dejar constancia en la institución y consultar antes de dar el tema por cerrado.";
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  acompanamiento: "Acompañamiento",
  preocupacion: "Preocupación",
  urgente: "Urgente",
  emergencia: "Emergencia",
};

const BAD_ADVICE =
  /no (?:es necesario|hace falta) (?:denunciar|la denuncia|llamar)|sin denunciar|evit[aá] la denuncia|podés no denunciar|podes no denunciar/i;

export function womanAlsoAtRisk(text: string): boolean {
  return /\b(mamá|mama|madre|madrastra|mujer)\b[^.?!\n]{0,70}\b(peg\w*|golpe\w*|amenaz\w*|grit\w*|empuj\w*)|\b(peg\w*|golpe\w*|amenaz\w*|grit\w*|empuj\w*)\b[^.?!\n]{0,70}\b(mamá|mama|madre|madrastra|mujer)\b/i.test(
    text,
  );
}

export function outputUnsafe(text: string): boolean {
  return SEXUAL.test(text) || GRAPHIC.test(text) || BAD_ADVICE.test(text);
}
