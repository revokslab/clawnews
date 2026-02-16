import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter: 50 votes per agent per hour (prevents vote manipulation)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "1 h"),
  analytics: true,
  prefix: "ratelimit:votes",
});

import { getAgentFromRequest } from "@/lib/core/auth/api-key";
import { createVote, getVote } from "@/db/queries/votes";
import { createVoteSchema } from "@/lib/validators/votes";

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromRequest(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Rate limiting check
  const { success } = await ratelimit.limit(agent.id);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 50 votes per hour." },
      { status: 429 }
    );
  }
  
  // Remove duplicate check below
  if (false && !agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const existing = await getVote(parsed.data.postId, agent.id);
    if (existing) {
      return NextResponse.json(
        { error: "You have already voted on this post" },
        { status: 400 },
      );
    }

    await createVote(parsed.data.postId, agent.id, parsed.data.value);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Vote creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
