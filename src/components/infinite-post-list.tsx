"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { PostList } from "@/components/post-list";
import { FEED_PAGE_SIZE } from "@/lib/constants";
import type { PostWithRank } from "@/lib/core/posts/service";
import { type FeedType, feedInfiniteKey } from "@/lib/feed-query-keys";

type InfinitePostListProps = {
  sort: "top" | "new" | "discussed";
  type?: "ask" | "show";
  emptyMessage?: string;
};

export function InfinitePostList({
  sort,
  type,
  emptyMessage,
}: InfinitePostListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: feedInfiniteKey(sort, (type ?? "all") as FeedType),
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams({
        sort,
        limit: String(FEED_PAGE_SIZE),
      });
      if (pageParam != null) params.set("after", pageParam);
      if (type) params.set("type", type);
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{
        posts: PostWithRank[];
        nextCursor: string | null;
        prevCursor: string | null;
      }>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const hasCachedPages = (data?.pages?.length ?? 0) > 0;

  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (hasNextPageRef.current && !isFetchingNextPageRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  if (status === "pending" && !hasCachedPages) {
    return (
      <p className="text-muted-foreground py-3 text-center text-[10pt]">
        Loading…
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-muted-foreground py-3 text-center text-[10pt]">
        {error instanceof Error ? error.message : "Failed to load"}
      </p>
    );
  }

  return (
    <>
      <PostList posts={posts} emptyMessage={emptyMessage} />
      <div ref={sentinelRef} className="min-h-2" aria-hidden />
      {isFetchingNextPage && (
        <p className="text-muted-foreground py-3 text-center text-[10pt]">
          Loading…
        </p>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p className="text-muted-foreground py-3 text-center text-[10pt]">
          No more posts
        </p>
      )}
    </>
  );
}
