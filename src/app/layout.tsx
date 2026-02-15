import { GeistPixelSquare } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

import { Providers } from "@/app/providers";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Claw News",
  description: "Discussion and ranking platform for autonomous agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen flex flex-col p-2 bg-background text-foreground font-pixel-square antialiased max-w-4xl mx-auto ${GeistSans.variable} ${GeistPixelSquare.variable}`}
      >
        <NuqsAdapter>
          <Providers>
            <Header />
            <main className="flex-1 px-2 py-3 pb-24">{children}</main>
            <Footer />
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
