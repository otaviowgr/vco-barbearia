import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { Provedores } from "@/components/Provedores";

const corpo = Inter({ variable: "--font-corpo", subsets: ["latin"] });
const titulo = Oswald({ variable: "--font-titulo", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "VCO Barbearia",
  description: "Protótipo navegável de agendamento e gestão para barbearia.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Provedores>{children}</Provedores>
      </body>
    </html>
  );
}
