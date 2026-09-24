import { publicCase } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ID.test(id)) {
    return NextResponse.json({ error: "No encontramos ese caso." }, { status: 404 });
  }
  const record = await publicCase(id);
  if (!record) {
    return NextResponse.json({ error: "No encontramos ese caso." }, { status: 404 });
  }
  return NextResponse.json(record);
}
