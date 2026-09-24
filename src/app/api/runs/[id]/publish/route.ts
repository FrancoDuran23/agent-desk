import { publishRun } from "@/lib/webflow-api";
import { toPublic } from "@/lib/engine";
import { loadRun, persistenceFor, saveRun, withRunLock } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { confirm?: boolean; publishItems?: boolean } | null;
  const confirm = Boolean(body?.confirm);
  const publishItems = body?.publishItems !== false;

  const payload = await withRunLock(id, async () => {
    const run = await loadRun(id);
    if (!run) return null;
    run.publishResult = await publishRun(run, publishItems, confirm);
    run.updatedAt = Date.now();
    await saveRun(run);
    return toPublic(run, await persistenceFor(run));
  });

  if (!payload) return NextResponse.json({ error: "Esta temporada no está en la casa." }, { status: 404 });
  return NextResponse.json(payload);
}
