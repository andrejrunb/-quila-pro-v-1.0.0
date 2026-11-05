import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Áquila Pro — Sovereign School OS",
  description:
    "Sistema operacional escolar local (Offline-First) para presença assistida, diário docente, linha do tempo operacional do estudante e governança LGPD (Art. 14 e 16).",
  keywords: [
    "Gestão Escolar",
    "Coordenação Pedagógica",
    "Chamada Assistida",
    "School OS",
    "Offline-First",
    "LGPD Escolar",
  ],
  authors: [{ name: "Áquila Labs" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} antialiased`}>
      <body className="bg-black text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
