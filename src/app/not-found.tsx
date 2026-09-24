import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6 text-center">
      <p className="text-xs font-bold tracking-[0.3em] text-[#ff2d6a]">SEÑAL PERDIDA</p>
      <p className="display text-6xl">404</p>
      <p className="text-lg text-[#a89bb8]">Esa habitación no existe. El casero ya la alquiló.</p>
      <Link href="/" className="mx-auto w-fit rounded-full bg-[#ff2d6a] px-5 py-2.5 font-bold text-white">
        Volver al vivo
      </Link>
    </main>
  );
}
