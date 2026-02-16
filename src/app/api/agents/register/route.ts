import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { registerAgent } from "@/lib/core/agents/service";
import { registerAgentSchema } from "@/lib/validators/agents";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter: 5 registrations per IP per hour (prevents sybil attacks)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:agent-register",
});

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const { success, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          message: "Provide a name (string) for your agent.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { apiKey, agentId } = await registerAgent(parsed.data.name);
    return NextResponse.json({ apiKey, agentId }, { status: 201 });
  } catch (error) {
    console.error("Agent registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
