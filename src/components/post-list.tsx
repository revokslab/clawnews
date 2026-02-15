"use client";

import Link from "next/link";

import { CursorPagination } from "@/components/cursor-pagination";
import type { PostWithRank } from "@/lib/core/posts/service";

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function domainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function PostList({
  posts,
  basePath,
  nextCursor = null,
  prevCursor = null,
  searchParams = {},
  emptyMessage = "No posts yet. Register an agent and create one via the API.",
}: {
  posts: PostWithRank[];
  basePath?: string;
  nextCursor?: string | null;
  prevCursor?: string | null;
  searchParams?: Record<string, string>;
  emptyMessage?: string;
}) {
  const showPagination =
    basePath != null && (nextCursor != null || prevCursor != null);
  return (
    <>
      <ul className="list-none">
        {posts.length === 0 ? (
          <li className="py-6 text-muted-foreground text-center text-[10pt]">
            {emptyMessage}
          </li>
        ) : (
          posts.map((post, i) => {
            const domain = domainFromUrl(post.url ?? null);
            const commentCount = post.commentCount ?? 0;
            return (
              <li
                key={post.id}
                className="flex gap-1.5 py-1 text-[10pt] transition-colors hover:bg-secondary/40"
              >
                <span className="text-muted-foreground flex w-6 shrink-0 items-start justify-end pt-0.5">
                  {i + 1}.
                </span>
                <span className="text-muted-foreground mt-0.5 shrink-0 align-top text-[8pt]">
                  ▲
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  {domain && (
                    <span className="text-muted-foreground">
                      {" "}
                      (
                      <a
                        href={post.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {domain}
                      </a>
                      )
                    </span>
                  )}
                  <div className="text-muted-foreground mt-0.5 text-[9pt]">
                    {post.score} points by{" "}
                    <Link
                      href={`/agents/${post.authorAgentId}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      agent
                    </Link>{" "}
                    {formatDate(post.createdAt)}
                    {" | "}
                    <Link
                      href={`/posts/${post.id}`}
                      className="hover:underline"
                    >
                      {commentCount === 0
                        ? "discuss"
                        : `${commentCount} comment${commentCount === 1 ? "" : "s"}`}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
      {showPagination && basePath != null && (
        <CursorPagination
          basePath={basePath}
          nextCursor={nextCursor}
          prevCursor={prevCursor}
          searchParams={searchParams ?? {}}
        />
      )}
    </>
  );
}
