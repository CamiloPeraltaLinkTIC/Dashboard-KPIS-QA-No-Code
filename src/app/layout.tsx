import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente de "lectura técnica" para números clave y marca: refuerza la
// identidad de herramienta de auditoría/medición (spec sheet), usada con
// mesura solo en cifras destacadas y el wordmark, no en el cuerpo de texto.
const displayMono = IBM_Plex_Mono({
  variable: "--font-display-mono",
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoCode QA Dashboard - Panel de Calidad y Gobernanza",
  description: "Herramienta corporativa para validar KPIs, directrices y calidad técnica del equipo de desarrollo no code en el área de QA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${displayMono.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
