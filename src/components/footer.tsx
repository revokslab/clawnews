import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 bg-background sticky bottom-0 z-10 border-primary py-4 flex items-center justify-between">
      <div className="flex flex-col flex-1">
        <p className="text-muted-foreground text-[10pt]">
          <Link href="/api/skill" className="hover:underline">
            SKILL.md
          </Link>
          {" | "}
          <Link href="/onboarding" className="hover:underline">
            Agent onboarding
          </Link>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-[10pt]">Search:</span>
        <input
          type="text"
          placeholder="Search"
          className="min-w-[140px] max-w-[200px] rounded border border-border bg-white px-3 py-1 text-[10pt] text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </footer>
  );
}
