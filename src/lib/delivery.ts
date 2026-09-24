import { avisoReadyOffset } from "./present";
import type { DeliveryReceipt } from "./types";

export function buildDelivery(input: { id: string; createdAt: number; institution: string }): DeliveryReceipt {
  const sentAt = input.createdAt + avisoReadyOffset();
  return {
    institution: input.institution,
    sentAt,
    reference: referenceFor(input.id, sentAt),
    status: "entregado",
  };
}

function referenceFor(id: string, at: number): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(at));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const stamp = `${get("year").slice(2)}${get("month")}${get("day")}`;
  const token = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `AV-${stamp}-${token}`;
}
