import { createSeason } from "@/lib/engine";
import { publicRun, saveRun } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { goal?: unknown } | null;
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  if (goal.length < 3) {
    return NextResponse.json({ error: "Tirales un objetivo, aunque sea un chisme." }, { status: 400 });
  }
  const run = await createSeason(goal);
  await saveRun(run);
  return NextResponse.json({ id: run.id, mode: run.mode, modeNote: run.modeNote, run: await publicRun(run.id) });
}
