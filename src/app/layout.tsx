import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa de agentes · Reality en vivo",
  description:
    "Cuatro roommates, una casa y una prueba semanal: entregar un sitio web antes de la gala de eliminación. Vos sos la producción.",
  openGraph: {
    title: "Casa de agentes · Reality en vivo",
    description:
      "EN VIVO: pelean, conspiran y construyen el sitio del cliente. Votá, nominá y tirales una bomba de caos.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa de agentes · Reality en vivo",
    description: "Un reality de roommates. Prueba semanal, confesionario y gala de eliminación.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0612",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,500;1,9..144,700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
