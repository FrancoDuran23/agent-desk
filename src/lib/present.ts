import type { CaseRecord, PersistenceInfo, PublicCase, PublicStep } from "./types";

export const STEP_MS = 1700;

export function phase(createdAt: number, count: number, now = Date.now()) {
  const elapsed = Math.max(0, now - createdAt);
  let revealed = 0;
  let active: number | null = null;
  for (let index = 0; index < count; index += 1) {
    const start = index * STEP_MS;
    const doneAt = start + Math.round(STEP_MS * 0.72);
    if (elapsed >= doneAt) {
      revealed = index + 1;
      continue;
    }
    if (elapsed >= start) active = index;
    break;
  }
  return { revealed, active, done: revealed >= count };
}

export function toPublic(record: CaseRecord, persistence: PersistenceInfo, now = Date.now()): PublicCase {
  const { revealed, active, done } = phase(record.createdAt, record.steps.length, now);
  const steps: PublicStep[] = record.steps.map((step, index) => {
    const status = index < revealed ? "listo" : index === active ? "trabajando" : "espera";
    return {
      id: step.id,
      agent: step.agent,
      title: step.title,
      role: step.role,
      status,
      text: status === "listo" ? step.detail : status === "trabajando" ? step.working : "",
    };
  });
  const heard = revealed > 0;
  const privateDone = revealed > 1;
  const routed = revealed > 2;
  const drafted = revealed > 3;
  return {
    id: record.id,
    province: record.province,
    mode: record.mode,
    modeNote: record.modeNote,
    severity: heard ? record.severity : null,
    severityLabel: heard ? record.severityLabel : null,
    severityReason: heard ? record.severityReason : null,
    whoAtRisk: heard ? record.whoAtRisk : null,
    narrative: heard ? record.narrative : null,
    redactions: privateDone ? record.redactions : [],
    route: routed ? record.route : null,
    aviso: drafted ? record.aviso : null,
    steps,
    attachment: record.attachment,
    done,
    persistence,
    createdAt: record.createdAt,
  };
}
