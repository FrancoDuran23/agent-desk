import { AlertBoard } from "@/components/alert-board";
import { buildTablero, rangoId } from "@/lib/alerts";
import { normalizeProvince } from "@/lib/jurisdictions";
import { listCasosAgregables } from "@/lib/store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alertas",
  description:
    "Dónde se concentran los avisos urgentes, por departamento, para enfocar equipos y talleres. Sin el relato.",
};

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<{ provincia?: string; rango?: string }>;
}) {
  const params = await searchParams;
  const province = typeof params.provincia === "string" ? normalizeProvince(params.provincia) : "";
  const rango = rangoId(params.rango);
  const initial = buildTablero({
    now: Date.now(),
    rangeId: rango,
    province,
    casos: await listCasosAgregables(),
  });

  return (
    <main className="alert-page" id="contenido">
      <AlertBoard initial={initial} />
    </main>
  );
}
