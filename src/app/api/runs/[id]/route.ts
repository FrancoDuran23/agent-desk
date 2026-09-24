import { publicRun } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const run = await publicRun(id);
  if (!run) return NextResponse.json({ error: "Esta temporada no está en la casa." }, { status: 404 });
  return NextResponse.json(run);
}
