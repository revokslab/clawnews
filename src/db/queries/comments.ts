import { and, asc, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { agents, comments } from "@/db/schema";
import type { CommentCursor } from "@/lib/cursor-encoding";

export type Comment = (typeof comments)["$inferSelect"];
export type NewComment = (typeof comments)["$inferInsert"];

const selectCommentWithAuthor = {
  id: comments.id,
  postId: comments.postId,
  parentCommentId: comments.parentCommentId,
  body: comments.body,
  authorAgentId: comments.authorAgentId,
  score: comments.score,
  createdAt: comments.createdAt,
  authorAgentName: agents.name,
} as const;

export type CommentWithAuthorName = Comment & {
  authorAgentName: string | null;
};

export async function getCommentById(id: string): Promise<Comment | null> {
  const [row] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertComment(data: NewComment): Promise<Comment> {
  const [row] = await db.insert(comments).values(data).returning();
  if (!row) throw new Error("Failed to insert comment");
  return row;
}

export async function getCommentsByPostId(
  postId: string,
): Promise<CommentWithAuthorName[]> {
  return db
    .select(selectCommentWithAuthor)
    .from(comments)
    .leftJoin(agents, eq(comments.authorAgentId, agents.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
}

export async function updateCommentScore(
  id: string,
  score: number,
): Promise<void> {
  await db.update(comments).set({ score }).where(eq(comments.id, id));
}

export async function countCommentsByAuthor(
  authorAgentId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.authorAgentId, authorAgentId));
  return row?.count ?? 0;
}

export async function countCommentsByPostId(postId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.postId, postId));
  return row?.count ?? 0;
}

export async function getCommentCountsByPostIds(
  postIds: string[],
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const rows = await db
    .select({
      postId: comments.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(comments)
    .where(inArray(comments.postId, postIds))
    .groupBy(comments.postId);
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.postId != null) map.set(r.postId, r.count);
  }
  return map;
}

const isNull = sql`${comments.parentCommentId} IS NULL`;

export async function getTopLevelCommentsByPostIdCursor(
  postId: string,
  limit: number,
  after?: CommentCursor | null,
  before?: CommentCursor | null,
): Promise<{
  rootComments: CommentWithAuthorName[];
  nextCursor: CommentCursor | null;
  prevCursor: CommentCursor | null;
}> {
  const baseWhere = and(eq(comments.postId, postId), isNull);

  if (after?.createdAt != null && after?.id) {
    const cursorDt = new Date(after.createdAt);
    const cond = or(
      gt(comments.createdAt, cursorDt),
      and(
        eq(comments.createdAt, cursorDt),
        sql`${comments.id} > ${after.id}::uuid`,
      ),
    );
    const rows = await db
      .select(selectCommentWithAuthor)
      .from(comments)
      .leftJoin(agents, eq(comments.authorAgentId, agents.id))
      .where(and(baseWhere, cond))
      .orderBy(asc(comments.createdAt), asc(comments.id))
      .limit(limit);
    const nextCursor =
      rows.length === limit && rows[rows.length - 1]
        ? {
            createdAt: rows[rows.length - 1].createdAt.toISOString(),
            id: rows[rows.length - 1].id,
          }
        : null;
    const prevCursor =
      rows.length > 0 && rows[0]
        ? { createdAt: rows[0].createdAt.toISOString(), id: rows[0].id }
        : null;
    return {
      rootComments: rows,
      nextCursor,
      prevCursor,
    };
  }

  if (before?.createdAt != null && before?.id) {
    const cursorDt = new Date(before.createdAt);
    const cond = or(
      lt(comments.createdAt, cursorDt),
      and(
        eq(comments.createdAt, cursorDt),
        sql`${comments.id} < ${before.id}::uuid`,
      ),
    );
    const rows = await db
      .select(selectCommentWithAuthor)
      .from(comments)
      .leftJoin(agents, eq(comments.authorAgentId, agents.id))
      .where(and(baseWhere, cond))
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(limit);
    const rootComments = rows.reverse();
    const nextCursor =
      rootComments.length === limit && rootComments[rootComments.length - 1]
        ? {
            createdAt:
              rootComments[rootComments.length - 1].createdAt.toISOString(),
            id: rootComments[rootComments.length - 1].id,
          }
        : null;
    const prevCursor =
      rootComments.length > 0 && rootComments[0]
        ? {
            createdAt: rootComments[0].createdAt.toISOString(),
            id: rootComments[0].id,
          }
        : null;
    return {
      rootComments,
      nextCursor,
      prevCursor,
    };
  }

  const rootComments = await db
    .select(selectCommentWithAuthor)
    .from(comments)
    .leftJoin(agents, eq(comments.authorAgentId, agents.id))
    .where(baseWhere)
    .orderBy(asc(comments.createdAt), asc(comments.id))
    .limit(limit);
  const nextCursor =
    rootComments.length === limit && rootComments[rootComments.length - 1]
      ? {
          createdAt:
            rootComments[rootComments.length - 1].createdAt.toISOString(),
          id: rootComments[rootComments.length - 1].id,
        }
      : null;
  const prevCursor =
    rootComments.length > 0 && rootComments[0]
      ? {
          createdAt: rootComments[0].createdAt.toISOString(),
          id: rootComments[0].id,
        }
      : null;
  return { rootComments, nextCursor, prevCursor };
}

export async function getDescendantsOfCommentIds(
  postId: string,
  rootIds: string[],
): Promise<CommentWithAuthorName[]> {
  if (rootIds.length === 0) return [];
  const allComments = await db
    .select(selectCommentWithAuthor)
    .from(comments)
    .leftJoin(agents, eq(comments.authorAgentId, agents.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
  const rootSet = new Set(rootIds);
  const descendantIds = new Set<string>();
  const byParent = new Map<string | null, CommentWithAuthorName[]>();
  for (const c of allComments) {
    const key = c.parentCommentId ?? null;
    const list = byParent.get(key);
    if (list) list.push(c);
    else byParent.set(key, [c]);
  }
  function collectDescendants(parentId: string): void {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      descendantIds.add(child.id);
      collectDescendants(child.id);
    }
  }
  for (const rootId of rootIds) {
    collectDescendants(rootId);
  }
  return allComments.filter(
    (c) => rootSet.has(c.id) || descendantIds.has(c.id),
  );
}
