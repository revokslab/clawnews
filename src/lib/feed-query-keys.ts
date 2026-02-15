export type FeedType = "ask" | "show" | "all";

/**
 * Query key for the infinite feed. Use the same key on server (prefetch) and client (useInfiniteQuery).
 */
export function feedInfiniteKey(
  sort: "top" | "new" | "discussed",
  type: FeedType,
): [string, string, string, string] {
  return ["posts", "infinite", sort, type];
}
