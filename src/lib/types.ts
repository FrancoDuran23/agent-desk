export type AgentId = "escucha" | "privacidad" | "ruta" | "aviso";

export type Severity = "acompanamiento" | "preocupacion" | "urgente" | "emergencia";

export type RedactionKind =
  | "nombre"
  | "dni"
  | "telefono"
  | "email"
  | "direccion"
  | "escuela"
  | "fecha"
  | "detalle"
  | "otro";

export interface Redaction {
  id: string;
  kind: RedactionKind;
  label: string;
  replacement: string;
  reason: string;
}

export interface AttachmentMeta {
  extension: string;
  bytes: number;
  contentType: string;
}

export interface Channel {
  name: string;
  when: string;
  detail: string;
}

export interface RoutePlan {
  provinceLabel: string;
  authority: string;
  authorityNote: string;
  formalComplaintRequired: boolean;
  emergencyCallRequired: boolean;
  bypassSchoolLeadership: boolean;
  withholdingIntent: boolean;
  summary: string;
  dutyNote: string;
  channels: Channel[];
}

export interface AvisoDraft {
  subject: string;
  body: string;
  nextSteps: string[];
}

export interface DeliveryReceipt {
  institution: string;
  sentAt: number;
  reference: string;
  status: "entregado";
}

export interface AgentStep {
  id: AgentId;
  agent: AgentId;
  title: string;
  role: string;
  working: string;
  detail: string;
}

export interface CaseRecord {
  id: string;
  province: string;
  departamento: string;
  departamentoId: string;
  mode: "simulacro" | "asistido";
  modeNote: string;
  status: "listo";
  severity: Severity;
  severityLabel: string;
  severityReason: string;
  whoAtRisk: string;
  narrative: string;
  redactions: Redaction[];
  route: RoutePlan;
  aviso: AvisoDraft;
  delivery: DeliveryReceipt;
  steps: AgentStep[];
  attachment: AttachmentMeta | null;
  createdAt: number;
  updatedAt: number;
}

export interface PublicStep {
  id: AgentId;
  agent: AgentId;
  title: string;
  role: string;
  status: "espera" | "trabajando" | "listo";
  text: string;
}

export interface PersistenceInfo {
  driver: "d1+kv+r2" | "d1" | "kv" | "memory";
  bindings: { db: boolean; kv: boolean; media: boolean };
  bindingNames: string[];
  note: string;
}

export interface PublicCase {
  id: string;
  province: string;
  departamento: string;
  mode: CaseRecord["mode"];
  modeNote: string;
  severity: Severity | null;
  severityLabel: string | null;
  severityReason: string | null;
  whoAtRisk: string | null;
  narrative: string | null;
  redactions: Redaction[];
  route: RoutePlan | null;
  aviso: AvisoDraft | null;
  delivery: DeliveryReceipt | null;
  steps: PublicStep[];
  attachment: AttachmentMeta | null;
  done: boolean;
  persistence: PersistenceInfo;
  createdAt: number;
}
