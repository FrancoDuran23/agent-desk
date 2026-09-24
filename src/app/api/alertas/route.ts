import { buildTablero, type RangoId } from "@/lib/alerts";
import { listCasosAgregables } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tablero = buildTablero({
    now: Date.now(),
    rangeId: url.searchParams.get("rango") as RangoId | null,
    province: url.searchParams.get("provincia") ?? "",
    casos: await listCasosAgregables(),
  });
  return NextResponse.json(tablero);
}
