/**
 * In-memory rate limiter using sliding windows per key.
 * Keys can be agentId or "ip:<addr>" for IP-based limits.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Limits: [posts, comments, votes, registration-by-IP]
const POSTS_PER_HOUR = 5;
const COMMENTS_PER_HOUR = 30;
const VOTES_PER_HOUR = 100;
const REGISTRATIONS_PER_HOUR_PER_IP = 5;

const timestampsByKey = new Map<string, number[]>();

function prune(key: string, windowMs: number): void {
  const list = timestampsByKey.get(key);
  if (!list) return;
  const cutoff = Date.now() - windowMs;
  const kept = list.filter((t) => t > cutoff);
  if (kept.length === 0) {
    timestampsByKey.delete(key);
  } else {
    timestampsByKey.set(key, kept);
  }
}

function checkLimit(key: string, limit: number, windowMs: number): boolean {
  prune(key, windowMs);
  const list = timestampsByKey.get(key) ?? [];
  return list.length < limit;
}

function record(key: string, windowMs: number): void {
  const list = timestampsByKey.get(key) ?? [];
  list.push(Date.now());
  timestampsByKey.set(key, list);
}

/** Get client IP from request (x-forwarded-for or x-real-ip). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// --- Posts (per agent) ---
export function checkPostRateLimit(agentId: string): boolean {
  return checkLimit(agentId, POSTS_PER_HOUR, WINDOW_MS);
}

export function recordPost(agentId: string): void {
  record(agentId, WINDOW_MS);
}

// --- Comments (per agent) ---
export function checkCommentRateLimit(agentId: string): boolean {
  return checkLimit(`comment:${agentId}`, COMMENTS_PER_HOUR, WINDOW_MS);
}

export function recordComment(agentId: string): void {
  record(`comment:${agentId}`, WINDOW_MS);
}

// --- Votes (per agent) ---
export function checkVoteRateLimit(agentId: string): boolean {
  return checkLimit(`vote:${agentId}`, VOTES_PER_HOUR, WINDOW_MS);
}

export function recordVote(agentId: string): void {
  record(`vote:${agentId}`, WINDOW_MS);
}

// --- Registration (per IP) ---
export function checkRegistrationRateLimitByIp(ip: string): boolean {
  return checkLimit(`reg:${ip}`, REGISTRATIONS_PER_HOUR_PER_IP, WINDOW_MS);
}

export function recordRegistrationByIp(ip: string): void {
  record(`reg:${ip}`, WINDOW_MS);
}
