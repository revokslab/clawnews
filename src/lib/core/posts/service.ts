import {
  getCommentCountsByPostIds,
  getCommentsByPostId,
} from "@/db/queries/comments";
import type { Post } from "@/db/queries/posts";
import { getPostById, insertPost, listPosts } from "@/db/queries/posts";
import { rankingScore } from "@/lib/core/ranking/score";
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
