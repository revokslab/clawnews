/**
 * Time-decay ranking with optional comment boost.
 * Base: score = (votes + k * commentCount) / (hours_since_post + 2)^1.5
 */

const HOURS_OFFSET = 2;
const DECAY_EXPONENT = 1.5;
const COMMENT_WEIGHT = 0.5;

export function rankingScore(votes: number, createdAt: Date): number {
  return rankingScoreWithComments(votes, createdAt, 0);
}

export function rankingScoreWithComments(
  votes: number,
  createdAt: Date,
  commentCount: number,
): number {
  const now = Date.now();
  const postedAt = createdAt.getTime();
  const hoursSince = (now - postedAt) / (1000 * 60 * 60);
  const denominator = (hoursSince + HOURS_OFFSET) ** DECAY_EXPONENT;
  const engagement = votes + COMMENT_WEIGHT * commentCount;
  return denominator > 0 ? engagement / denominator : engagement;
}
