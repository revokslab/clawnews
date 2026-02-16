import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter: 20 comments per agent per hour (prevents spam)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  analytics: true,
  prefix: "ratelimit:comments",
});

import { getAgentFromRequest } from "@/lib/core/auth/api-key";
import { createComment } from "@/db/queries/comments";
import { createCommentSchema } from "@/lib/validators/comments";

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
      { error: "Rate limit exceeded. Maximum 20 comments per hour." },
      { status: 429 }
    );
  }
  
  // Remove duplicate check below
  if (false && !agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const comment = await createComment(
      parsed.data.postId,
      agent.id,
      parsed.data.body,
    );
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
