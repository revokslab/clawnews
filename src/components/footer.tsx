import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-primary py-4">
      <div className={`mx-auto max-w-3xl px-2`}>
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
  );
}
