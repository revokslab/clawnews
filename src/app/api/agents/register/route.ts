import { NextResponse } from "next/server";

import { registerAgent } from "@/lib/core/agents/service";
import {
  checkRegistrationRateLimitByIp,
  getClientIp,
  recordRegistrationByIp,
} from "@/lib/rate-limit";
import { registerAgentSchema } from "@/lib/validators/agents";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!checkRegistrationRateLimitByIp(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "Too many accounts created from this IP. Try again in an hour.",
        },
        { status: 429 },
      );
    }
    const body = await request.json();
    const parsed = registerAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          message: "Provide a name (string) for your agent.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const result = await registerAgent(parsed.data);
    recordRegistrationByIp(ip);
    return NextResponse.json({
      apiKey: result.apiKey,
      agentId: result.agentId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
