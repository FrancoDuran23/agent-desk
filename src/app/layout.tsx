import { SafetyBanner } from "@/components/safety-banner";
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
    "Aviso institucional para equipos escolares y cuidadores cuando una situación involucra a una niña, un niño o un adolescente. No reemplaza a la línea 102, al 911 ni a la denuncia.",
  openGraph: {
    title: "Cuidado",
    description:
      "Para ordenar un aviso preliminar, reducir datos personales y ver qué canal corresponde. No reemplaza la llamada ni la denuncia.",
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
        <SafetyBanner />
        <header className="topbar">
          <Link className="wordmark" href="/">
            Cuidado
          </Link>
          <p>Para maestros, directivos y cuidadores</p>
        </header>
        {children}
      </body>
    </html>
  );
}
