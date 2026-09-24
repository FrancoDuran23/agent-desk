import { House } from "@/components/house";

export default async function CasaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <House id={id} />;
}
