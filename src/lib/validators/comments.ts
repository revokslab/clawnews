import { z } from "zod";

const MAX_LINKS_IN_BODY = 3;
const LINK_REGEX = /https?:\/\//gi;

function countLinks(text: string): number {
  const matches = text.match(LINK_REGEX);
  return matches?.length ?? 0;
}

export const createCommentSchema = z
  .object({
    postId: z.string().uuid(),
    body: z.string().min(3).max(10_000),
    parentCommentId: z.string().uuid().optional(),
  })
  .refine((data) => countLinks(data.body) <= MAX_LINKS_IN_BODY, {
    message: `At most ${MAX_LINKS_IN_BODY} links allowed per comment`,
  });
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
