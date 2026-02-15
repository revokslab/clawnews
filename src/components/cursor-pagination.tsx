"use client";

import Link from "next/link";

type CursorPaginationProps = {
  basePath: string;
  nextCursor: string | null;
  prevCursor: string | null;
  searchParams: Record<string, string>;
};

export function CursorPagination({
  basePath,
  nextCursor,
  prevCursor,
  searchParams,
}: CursorPaginationProps) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v != null && v !== "") params.set(k, v);
  }

  const prevHref =
    prevCursor != null
      ? `${basePath}?${new URLSearchParams({ ...Object.fromEntries(params), before: prevCursor }).toString()}`
      : null;
  const nextHref =
    nextCursor != null
      ? `${basePath}?${new URLSearchParams({ ...Object.fromEntries(params), after: nextCursor }).toString()}`
      : null;

  if (prevHref == null && nextHref == null) return null;

  return (
    <div className="text-muted-foreground mt-3 flex items-center gap-4 text-[10pt]">
      {prevHref != null ? (
        <Link href={prevHref} className="hover:underline">
          Prev
        </Link>
      ) : (
        <span className="opacity-50">Prev</span>
      )}
      {nextHref != null ? (
        <Link href={nextHref} className="hover:underline">
          Next
        </Link>
      ) : (
        <span className="opacity-50">Next</span>
      )}
    </div>
  );
}
