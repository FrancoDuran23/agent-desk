import Link from "next/link";

export default function NotFound() {
  return (
    <main className="case-page" id="contenido">
      <p className="eyebrow">404</p>
      <h1>Esa página no está</h1>
      <p className="lede">El aviso se empieza desde el inicio.</p>
      <Link className="text-link" href="/">
        Volver al inicio
      </Link>
    </main>
  );
}
