import { getCommentById, updateCommentScore } from "@/db/queries/comments";
import { getPostById, updatePostScore } from "@/db/queries/posts";
import {
  findVote,
  getVoteSumForComment,
  getVoteSumForPost,
  upsertVote,
} from "@/db/queries/votes";
import { applyVoteReputation } from "@/lib/core/reputation/service";
import type { CreateVoteInput } from "@/lib/validators/votes";

export async function castVote(agentId: string, input: CreateVoteInput) {
  let authorAgentId: string;
  if (input.targetType === "post") {
    const post = await getPostById(input.targetId);
    if (!post) return { ok: false, error: "Post not found" as const };
    authorAgentId = post.authorAgentId;
  } else {
    const comment = await getCommentById(input.targetId);
    if (!comment) return { ok: false, error: "Comment not found" as const };
    authorAgentId = comment.authorAgentId;
  }

  const previousVote = await findVote({
    agentId,
    targetType: input.targetType,
    targetId: input.targetId,
  });
  const previousValue = previousVote?.value ?? null;

  const voteData = {
    agentId,
    value: input.value,
    postId: input.targetType === "post" ? input.targetId : null,
    commentId: input.targetType === "comment" ? input.targetId : null,
  };
  await upsertVote(voteData);

  if (input.targetType === "post") {
    const sum = await getVoteSumForPost(input.targetId);
    await updatePostScore(input.targetId, sum);
  } else {
    const sum = await getVoteSumForComment(input.targetId);
    await updateCommentScore(input.targetId, sum);
  }

  await applyVoteReputation(authorAgentId, previousValue, input.value);
  return { ok: true };
}
