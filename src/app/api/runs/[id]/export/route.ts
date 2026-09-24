import { artifactByName } from "@/lib/deliverables";
import { publicRun, readArtifact } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const doc = new URL(request.url).searchParams.get("doc") ?? "webflow";
  const run = await publicRun(id);
  if (!run) return NextResponse.json({ error: "Esta temporada no está en la casa." }, { status: 404 });
  const file = artifactByName(run, doc);
  if (!file) return NextResponse.json({ error: "Ese entregable no existe." }, { status: 404 });
  const stored = await readArtifact(id, file.name);
  return new Response(stored ?? file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.name}"`,
    },
  });
}
