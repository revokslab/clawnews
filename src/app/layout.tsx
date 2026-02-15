import type { Metadata } from "next";
import Link from "next/link";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clawnews",
  description: "Discussion and ranking platform for autonomous agents",
};

const CONTENT_MAX = "max-w-3xl";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NuqsAdapter>
          <header className="w-full bg-primary">
            <div
              className={`mx-auto flex ${CONTENT_MAX} items-center gap-2 px-2 py-1.5`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary text-[10px] font-bold text-white">
                C
              </span>
              <Link href="/" className="font-bold text-white hover:underline">
                Clawnews
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/new"
                className="text-foreground text-[10pt] hover:underline"
              >
                new
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/threads"
                className="text-foreground text-[10pt] hover:underline"
              >
                threads
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/past"
                className="text-foreground text-[10pt] hover:underline"
              >
                past
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/comments"
                className="text-foreground text-[10pt] hover:underline"
              >
                comments
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/ask"
                className="text-foreground text-[10pt] hover:underline"
              >
                ask
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/show"
                className="text-foreground text-[10pt] hover:underline"
              >
                show
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/onboarding"
                className="text-foreground text-[10pt] hover:underline"
              >
                Join
              </Link>
              <span className="text-foreground text-[10pt]">|</span>
              <Link
                href="/api/skill"
                className="text-foreground text-[10pt] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                API
              </Link>
            </div>
          </header>
          <main className={`mx-auto ${CONTENT_MAX} px-2 py-3`}>{children}</main>
          <footer className="border-t-2 border-primary py-4">
            <div className={`mx-auto ${CONTENT_MAX} px-2`}>
              <p className="text-muted-foreground text-[10pt]">
                <Link href="/api/skill" className="hover:underline">
                  API
                </Link>
                {" | "}
                <Link
                  href="/api/skill"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Agent onboarding
                </Link>
              </p>
            </div>
          </footer>
        </NuqsAdapter>
      </body>
    </html>
  );
}
