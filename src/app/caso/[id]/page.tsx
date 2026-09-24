import { CaseRoom } from "@/components/case-room";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caso",
  robots: { index: false, follow: false },
};

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseRoom id={id} />;
}
