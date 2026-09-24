import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cuidado",
    template: "%s · Cuidado",
  },
  description:
    "Para maestros, directivos y cuidadores. Cuidado escucha lo que viste, reduce los datos personales y envía un aviso a la institución que corresponde.",
  openGraph: {
    title: "Cuidado",
    description: "Escucha el relato, quita lo que identifica y envía un aviso a la institución que corresponde.",
    type: "website",
    locale: "es_AR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#163832",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,600;7..72,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="skip" href="#contenido">
          Ir al contenido
        </a>
        <header className="topbar">
          <Link className="wordmark" href="/">
            Cuidado
          </Link>
          <nav className="topnav" aria-label="Principal">
            <Link className="nav-quiet" href="/#como-funciona">
              Cómo funciona
            </Link>
            <Link className="nav-quiet" href="/#privacidad">
              Privacidad
            </Link>
            <Link className="nav-cta" href="/probar">
              Probar
            </Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <p>Emergencias: 911 · Línea 102</p>
        </footer>
      </body>
    </html>
  );
}
