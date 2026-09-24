import { applyIntervention, toPublic } from "@/lib/engine";
import { loadRun, persistenceFor, saveRun, withRunLock } from "@/lib/store";
import type { Intervention } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Intervention | null;
  if (!body || typeof body !== "object" || !("type" in body)) {
    return NextResponse.json({ error: "No entendí la intervención." }, { status: 400 });
  }
  const action = normalize(body);
  if (!action) return NextResponse.json({ error: "Esa intervención no existe en la casa." }, { status: 400 });

  const run = await withRunLock(id, async () => {
    const current = await loadRun(id);
    if (!current) return null;
    applyIntervention(current, action);
    await saveRun(current);
    return toPublic(current, await persistenceFor(current));
  });
  if (!run) return NextResponse.json({ error: "Esta temporada no está en la casa." }, { status: 404 });
  return NextResponse.json(run);
}

function normalize(body: Intervention): Intervention | null {
  if (body.type === "salvar" && ["ansioso", "dramatica", "tryhard", "meme"].includes(body.agent)) return body;
  if (body.type === "vetar") return { type: "vetar", note: typeof body.note === "string" ? body.note.slice(0, 140) : undefined };
  if (body.type === "caos" || body.type === "timeout" || body.type === "pausar" || body.type === "seguir") return { type: body.type };
  if (body.type === "pace" && (body.pace === "normal" || body.pace === "rapido")) return body;
  return null;
}
