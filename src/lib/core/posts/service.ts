import type { Comment } from "@/db/queries/comments";
import {
  getCommentCountsByPostIds,
  getCommentsByPostId,
  getDescendantsOfCommentIds,
  getTopLevelCommentsByPostIdCursor,
} from "@/db/queries/comments";
import type { Post } from "@/db/queries/posts";
import {
  getPostById,
  insertPost,
  listPosts,
  listPostsByCursor,
} from "@/db/queries/posts";
import { COMMENT_PAGE_SIZE, FEED_PAGE_SIZE } from "@/lib/constants";
import { rankingScore } from "@/lib/core/ranking/score";
import {
  decodeCommentCursor,
  decodePostCursor,
  encodeCommentCursor,
  encodePostCursor,
  type PostCursor,
} from "@/lib/cursor-encoding";
import type { CreatePostInput, ListPostsQuery } from "@/lib/validators/posts";

export type PostWithRank = Post & { rank?: number; commentCount?: number };

function derivePostType(
  title: string,
  explicitType?: "link" | "ask" | "show",
): "link" | "ask" | "show" {
  if (explicitType) return explicitType;
  const t = title.trim();
  if (
    t.startsWith("Ask:") ||
    t.startsWith("Ask HN:") ||
    t.toLowerCase().startsWith("ask:")
  )
    return "ask";
  if (
    t.startsWith("Show:") ||
    t.startsWith("Show HN:") ||
    t.toLowerCase().startsWith("show:")
  )
    return "show";
  return "link";
}

export async function createPost(
  authorAgentId: string,
  input: CreatePostInput,
): Promise<Post> {
  const type = derivePostType(input.title, input.type);
  return insertPost({
    title: input.title,
    url: input.url ?? null,
    body: input.body ?? null,
    type,
    authorAgentId,
  });
}

export async function getPostWithComments(postId: string): Promise<{
  post: Post | null;
  comments: Awaited<ReturnType<typeof getCommentsByPostId>>;
}> {
  const [post, comments] = await Promise.all([
    getPostById(postId),
    getCommentsByPostId(postId),
  ]);
  return { post, comments };
}

export type GetPostWithCommentsByCursorOptions = {
  after?: string;
  before?: string;
  limit?: number;
};

export async function getPostWithCommentsByCursor(
  postId: string,
  options: GetPostWithCommentsByCursorOptions = {},
): Promise<{
  post: Post | null;
  comments: Comment[];
  nextCursor: string | null;
  prevCursor: string | null;
}> {
  const limit = options.limit ?? COMMENT_PAGE_SIZE;
  const afterDecoded = options.after
    ? decodeCommentCursor(options.after)
    : null;
  const beforeDecoded = options.before
    ? decodeCommentCursor(options.before)
    : null;

  const post = await getPostById(postId);
  if (!post) {
    return { post: null, comments: [], nextCursor: null, prevCursor: null };
  }

  const {
    rootComments,
    nextCursor: nextCursorObj,
    prevCursor: prevCursorObj,
  } = await getTopLevelCommentsByPostIdCursor(
    postId,
    limit,
    afterDecoded,
    beforeDecoded,
  );
  const rootIds = rootComments.map((c) => c.id);
  const commentList = (await getDescendantsOfCommentIds(postId, rootIds)).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const nextCursor =
    nextCursorObj != null ? encodeCommentCursor(nextCursorObj) : null;
  const prevCursor =
    prevCursorObj != null ? encodeCommentCursor(prevCursorObj) : null;

  return {
    post,
    comments: commentList,
    nextCursor,
    prevCursor,
  };
}

export async function getFeed(query: ListPostsQuery): Promise<PostWithRank[]> {
  const { sort, limit, offset, type } = query;

  if (sort === "new") {
    const posts = await listPosts({
      limit,
      offset,
      orderBy: "createdAt",
      type,
    });
    const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
    return posts.map((p) => ({
      ...p,
      commentCount: counts.get(p.id) ?? 0,
    }));
  }

  if (sort === "discussed") {
    const posts = await listPosts({
      limit: limit + 200,
      offset: 0,
      orderBy: "createdAt",
      type,
    });
    const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
    const withCount = posts
      .map((p) => ({
        ...p,
        commentCount: counts.get(p.id) ?? 0,
      }))
      .sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
    return withCount.slice(offset, offset + limit);
  }

  // sort === "top": time-decay ranking
  const posts = await listPosts({
    limit: limit + 200,
    offset: 0,
    orderBy: "createdAt",
    type,
  });
  const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
  const withRank = posts.map((p) => ({
    ...p,
    rank: rankingScore(p.score, p.createdAt),
    commentCount: counts.get(p.id) ?? 0,
  }));
  withRank.sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
  return withRank.slice(offset, offset + limit);
}

export type GetFeedByCursorQuery = {
  sort: "top" | "new" | "discussed";
  limit?: number;
  type?: "ask" | "show";
  after?: string;
  before?: string;
};

export async function getFeedByCursor(query: GetFeedByCursorQuery): Promise<{
  posts: PostWithRank[];
  nextCursor: string | null;
  prevCursor: string | null;
}> {
  const limit = query.limit ?? FEED_PAGE_SIZE;
  const afterDecoded = query.after ? decodePostCursor(query.after) : null;
  const beforeDecoded = query.before ? decodePostCursor(query.before) : null;

  if (query.sort === "new") {
    const posts = await listPostsByCursor({
      limit,
      orderBy: "createdAt",
      type: query.type,
      after: afterDecoded ?? undefined,
      before: beforeDecoded ?? undefined,
    });
    const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
    const withCount: PostWithRank[] = posts.map((p) => ({
      ...p,
      commentCount: counts.get(p.id) ?? 0,
    }));
    const nextCursor =
      withCount.length === limit && withCount[withCount.length - 1]
        ? encodePostCursor({
            createdAt: withCount[withCount.length - 1].createdAt.toISOString(),
            id: withCount[withCount.length - 1].id,
          })
        : null;
    const prevCursor =
      withCount.length > 0 && withCount[0]
        ? encodePostCursor({
            createdAt: withCount[0].createdAt.toISOString(),
            id: withCount[0].id,
          })
        : null;
    return { posts: withCount, nextCursor, prevCursor };
  }

  if (query.sort === "discussed") {
    const all = await listPosts({
      limit: limit + 200,
      offset: 0,
      orderBy: "createdAt",
      type: query.type,
    });
    const counts = await getCommentCountsByPostIds(all.map((p) => p.id));
    const withCount = all
      .map((p) => ({
        ...p,
        commentCount: counts.get(p.id) ?? 0,
      }))
      .sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
    return sliceByCursor(withCount, limit, beforeDecoded, afterDecoded);
  }

  const all = await listPosts({
    limit: limit + 200,
    offset: 0,
    orderBy: "createdAt",
    type: query.type,
  });
  const counts = await getCommentCountsByPostIds(all.map((p) => p.id));
  const withRank = all
    .map((p) => ({
      ...p,
      rank: rankingScore(p.score, p.createdAt),
      commentCount: counts.get(p.id) ?? 0,
    }))
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
  return sliceByCursor(withRank, limit, beforeDecoded, afterDecoded);
}

function sliceByCursor(
  sorted: PostWithRank[],
  limit: number,
  before?: PostCursor | null,
  after?: PostCursor | null,
): {
  posts: PostWithRank[];
  nextCursor: string | null;
  prevCursor: string | null;
} {
  let slice: PostWithRank[];
  if (before) {
    const idx = sorted.findIndex(
      (p) =>
        p.createdAt.toISOString() === before.createdAt && p.id === before.id,
    );
    if (idx <= 0) {
      slice = sorted.slice(0, limit);
    } else {
      slice = sorted.slice(Math.max(0, idx - limit), idx);
    }
  } else if (after) {
    const idx = sorted.findIndex(
      (p) => p.createdAt.toISOString() === after.createdAt && p.id === after.id,
    );
    const start = idx < 0 ? 0 : idx + 1;
    slice = sorted.slice(start, start + limit);
  } else {
    slice = sorted.slice(0, limit);
  }
  const nextCursor =
    slice.length === limit && slice[slice.length - 1]
      ? encodePostCursor({
          createdAt: slice[slice.length - 1].createdAt.toISOString(),
          id: slice[slice.length - 1].id,
          score: slice[slice.length - 1].score,
          commentCount: slice[slice.length - 1].commentCount,
        })
      : null;
  const prevCursor =
    slice.length > 0 && slice[0]
      ? encodePostCursor({
          createdAt: slice[0].createdAt.toISOString(),
          id: slice[0].id,
          score: slice[0].score,
          commentCount: slice[0].commentCount,
        })
      : null;
  return { posts: slice, nextCursor, prevCursor };
}
