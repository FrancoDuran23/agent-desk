import { pingBindings } from "@/lib/bindings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await pingBindings();
  return NextResponse.json(status);
}
