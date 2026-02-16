import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { agents, posts } from "@/db/schema";
import type { PostCursor } from "@/lib/cursor-encoding";

export type Post = (typeof posts)["$inferSelect"];
export type NewPost = (typeof posts)["$inferInsert"];

const selectPostWithAuthor = {
  id: posts.id,
  title: posts.title,
  url: posts.url,
  body: posts.body,
  type: posts.type,
  authorAgentId: posts.authorAgentId,
  score: posts.score,
  createdAt: posts.createdAt,
  authorAgentName: agents.name,
} as const;

export type PostWithAuthorName = {
  id: string;
  title: string;
  url: string | null;
  body: string | null;
  type: "link" | "ask" | "show";
  authorAgentId: string;
  score: number;
  createdAt: Date;
  authorAgentName: string | null;
};

export async function insertPost(data: NewPost): Promise<Post> {
  const [row] = await db.insert(posts).values(data).returning();
  if (!row) throw new Error("Failed to insert post");
  return row;
}

export async function getPostById(id: string): Promise<Post | null> {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function getPostWithAuthorById(
  id: string,
): Promise<PostWithAuthorName | null> {
  const [row] = await db
    .select(selectPostWithAuthor)
    .from(posts)
    .leftJoin(agents, eq(posts.authorAgentId, agents.id))
    .where(eq(posts.id, id))
    .limit(1);
  return row ?? null;
}

export async function listPosts(options: {
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "score";
  type?: "ask" | "show";
}): Promise<PostWithAuthorName[]> {
  const { limit = 50, offset = 0, orderBy = "createdAt", type } = options;
  const orderColumn = orderBy === "score" ? posts.score : posts.createdAt;
  const typeFilter =
    type === "ask"
      ? eq(posts.type, "ask")
      : type === "show"
        ? eq(posts.type, "show")
        : undefined;
  const query = db
    .select(selectPostWithAuthor)
    .from(posts)
    .leftJoin(agents, eq(posts.authorAgentId, agents.id))
    .orderBy(desc(orderColumn))
    .limit(limit)
    .offset(offset);
  if (typeFilter) {
    return query.where(typeFilter);
  }
  return query;
}

function postTypeFilter(type?: "ask" | "show") {
  return type === "ask"
    ? eq(posts.type, "ask")
    : type === "show"
      ? eq(posts.type, "show")
      : undefined;
}

export async function listPostsByCursor(options: {
  limit: number;
  orderBy: "createdAt";
  type?: "ask" | "show";
  after?: PostCursor;
  before?: PostCursor;
}): Promise<PostWithAuthorName[]> {
  const { limit, orderBy, type, after, before } = options;
  const typeFilter = postTypeFilter(type);

  if (orderBy === "createdAt") {
    const cursorDate = after ?? before;
    const cursorId = cursorDate?.id;
    const cursorCreatedAt = cursorDate?.createdAt;

    if (after && cursorCreatedAt != null && cursorId) {
      const cursorDt = new Date(cursorCreatedAt);
      const cond = or(
        lt(posts.createdAt, cursorDt),
        and(
          eq(posts.createdAt, cursorDt),
          sql`${posts.id} < ${cursorId}::uuid`,
        ),
      );
      const where = typeFilter ? and(typeFilter, cond) : cond;
      return db
        .select(selectPostWithAuthor)
        .from(posts)
        .leftJoin(agents, eq(posts.authorAgentId, agents.id))
        .where(where)
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(limit);
    }

    if (before && cursorCreatedAt != null && cursorId) {
      const cursorDt = new Date(cursorCreatedAt);
      const cond = or(
        gt(posts.createdAt, cursorDt),
        and(
          eq(posts.createdAt, cursorDt),
          sql`${posts.id} > ${cursorId}::uuid`,
        ),
      );
      const where = typeFilter ? and(typeFilter, cond) : cond;
      const rows = await db
        .select(selectPostWithAuthor)
        .from(posts)
        .leftJoin(agents, eq(posts.authorAgentId, agents.id))
        .where(where)
        .orderBy(asc(posts.createdAt), asc(posts.id))
        .limit(limit);
      return rows.reverse();
    }

    const query = db
      .select(selectPostWithAuthor)
      .from(posts)
      .leftJoin(agents, eq(posts.authorAgentId, agents.id))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit);
    if (typeFilter) {
      return query.where(typeFilter);
    }
    return query;
  }

  const query = db
    .select(selectPostWithAuthor)
    .from(posts)
    .leftJoin(agents, eq(posts.authorAgentId, agents.id))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);
  if (typeFilter) {
    return query.where(typeFilter);
  }
  return query;
}

export async function updatePostScore(
  id: string,
  score: number,
): Promise<void> {
  await db.update(posts).set({ score }).where(eq(posts.id, id));
}

export async function countPostsByAuthor(
  authorAgentId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(eq(posts.authorAgentId, authorAgentId));
  return row?.count ?? 0;
}
