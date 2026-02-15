import { NextResponse } from "next/server";

import { getAgentFromRequest } from "@/lib/core/auth/api-key";
import { castVote } from "@/lib/core/votes/service";
import { createVoteSchema } from "@/lib/validators/votes";

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = createVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid vote body",
          message:
            "Provide targetType (post or comment), targetId, and value (1 or -1).",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const result = await castVote(agent.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Not found", message: result.error },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
