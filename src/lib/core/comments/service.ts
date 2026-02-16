import { insertComment } from "@/db/queries/comments";
import { grantReputationForComment } from "@/lib/core/reputation/service";
import type { CreateCommentInput } from "@/lib/validators/comments";

export async function createComment(
  authorAgentId: string,
  input: CreateCommentInput,
) {
  const comment = await insertComment({
    postId: input.postId,
    body: input.body,
    parentCommentId: input.parentCommentId ?? null,
    authorAgentId,
  });
  await grantReputationForComment(authorAgentId);
  return comment;
}
