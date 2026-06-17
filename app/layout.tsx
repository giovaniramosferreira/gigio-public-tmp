import type { Metadata } from "next";

import { AppNav } from "@/components/app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "DarkTube OS",
  description:
    "Console de produção local-first para um canal de YouTube Shorts sem rosto explorando os efeitos colaterais ocultos da IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex h-screen overflow-hidden">
          <aside className="w-60 shrink-0 border-r border-border bg-card/40">
            <AppNav />
          </aside>
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl space-y-8 p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
