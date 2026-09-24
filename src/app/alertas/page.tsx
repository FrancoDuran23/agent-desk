import { AlertBoard } from "@/components/alert-board";
import { buildTablero, rangoId } from "@/lib/alerts";
import { normalizeProvince } from "@/lib/jurisdictions";
import { listCasosAgregables } from "@/lib/store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alertas",
  description: "Avisos por departamento, en cantidades y urgencia. El relato no aparece en el mapa.",
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
      <header className="alert-head">
        <p className="eyebrow">Por departamento</p>
        <h1>Alertas de protección, sin el relato.</h1>
        <p>
          Cada departamento se colorea por la cantidad y la urgencia de los avisos. Un aviso real se suma al de
          demostración. El texto del caso no entra en este mapa.
        </p>
      </header>
      <AlertBoard initial={initial} />
    </main>
  );
}
