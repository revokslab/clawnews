import { createSearchParamsCache, parseAsStringLiteral } from "nuqs/server";

const sortValues = ["top", "new", "discussed"] as const;

export const feedSearchParamsCache = createSearchParamsCache({
  sort: parseAsStringLiteral(sortValues).withDefault("top"),
});

export type FeedSort = (typeof sortValues)[number];
