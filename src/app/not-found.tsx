import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <p className="display text-5xl">404</p>
      <p className="text-lg">Esa habitación no existe. El casero ya la alquiló.</p>
      <Link href="/" className="hard-sm w-fit bg-[#ffb703] px-4 py-2 font-semibold">
        Volver a la casa
      </Link>
    </main>
  );
}
