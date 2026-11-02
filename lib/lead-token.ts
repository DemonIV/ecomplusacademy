import "server-only";
import { signToken, verifyToken } from "@/lib/crypto";

/**
 * Lead token: short-lived proof that a lead passed qualification. The
 * booking endpoint refuses to run without it, so a Calendly booking can only
 * be tied to a lead by someone who actually went through the questions.
 */

const TTL_SECONDS = 60 * 60 * 24; // 1 day; re-applying with the same contact re-issues it

type LeadTokenPayload = { lid: string; v: 1 };

export function createLeadToken(leadId: string): string {
  return signToken<LeadTokenPayload>({ lid: leadId, v: 1 }, "LEAD_TOKEN_SECRET", TTL_SECONDS);
}

export function readLeadToken(token: string | null | undefined): string | null {
  const payload = verifyToken<LeadTokenPayload>(token, "LEAD_TOKEN_SECRET");
  return payload?.v === 1 && typeof payload.lid === "string" ? payload.lid : null;
}
