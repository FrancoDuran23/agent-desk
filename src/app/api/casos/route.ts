import { buildDelivery } from "@/lib/delivery";
import { isProvince } from "@/lib/jurisdictions";
import { buildCase } from "@/lib/pipeline";
import { saveCase } from "@/lib/store";
import type { AttachmentMeta, CaseRecord } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    narrative?: unknown;
    province?: unknown;
    attachment?: unknown;
  } | null;
  const narrative = cleanNarrative(body?.narrative);
  if (narrative.status !== "ok") {
    const error =
      narrative.status === "long"
        ? "El relato es demasiado largo. Dejá lo central, sin detalles gráficos, en menos de 6000 caracteres."
        : "Contanos qué viste, con un poco más de contexto. No hace falta dar nombres ni detalles gráficos.";
    return NextResponse.json({ error }, { status: 400 });
  }
  const province = typeof body?.province === "string" && isProvince(body.province) ? body.province : "";
  const built = await buildCase({
    narrative: narrative.text,
    province,
    attachment: cleanAttachment(body?.attachment),
  });
  const now = Date.now();
  const id = crypto.randomUUID();
  const record: CaseRecord = {
    ...built,
    id,
    createdAt: now,
    updatedAt: now,
    delivery: buildDelivery({
      id,
      createdAt: now,
      institution: built.route.authority,
    }),
  };
  await saveCase(record);
  return NextResponse.json({ id: record.id, mode: record.mode, modeNote: record.modeNote });
}

function cleanNarrative(
  value: unknown,
): { status: "ok"; text: string } | { status: "short" | "long" } {
  if (typeof value !== "string") return { status: "short" };
  const text = value.replace(/\u0000/g, "").trim();
  if (text.length < 10) return { status: "short" };
  if (text.length > 6000) return { status: "long" };
  return { status: "ok", text };
}

function cleanAttachment(value: unknown): AttachmentMeta | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.bytes !== "number" || !Number.isFinite(record.bytes) || record.bytes < 0 || record.bytes > 50_000_000) {
    return null;
  }
  const contentType =
    typeof record.contentType === "string"
      ? record.contentType.replace(/[^\w./+-]/g, "").slice(0, 80)
      : "application/octet-stream";
  const extension =
    typeof record.extension === "string" ? record.extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  return {
    bytes: Math.round(record.bytes),
    contentType: contentType || "application/octet-stream",
    extension,
  };
}
