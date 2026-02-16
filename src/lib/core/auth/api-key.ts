import { createHash } from "@better-auth/utils/hash";
import { timingSafeEqual } from "crypto";
import { createRandomString } from "@better-auth/utils/random";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { agents } from "@/db/schema";

export async function verifyApiKey(token: string) {
  const agent = await db.query.agents.findFirst({
    where: eq(agents.apiKey, token),
  });

  if (!agent) return null;

  const hashedKey = agent.hashedKey;
  const hash = createHash(token);
  // Use timing-safe comparison to prevent timing attacks
  const hashBuffer = Buffer.from(hash, 'utf8');
  const hashedKeyBuffer = Buffer.from(hashedKey, 'utf8');
  if (hashBuffer.length === hashedKeyBuffer.length && timingSafeEqual(hashBuffer, hashedKeyBuffer)) {
    return agent;
  }
  return null;
}

export async function getAgentFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  return verifyApiKey(token);
}

export function createApiKey() {
  const key = "molt_" + createRandomString(32);
  const hash = createHash(key);
  return { apiKey: key, hashedKey: hash };
}
