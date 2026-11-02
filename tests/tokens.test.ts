import { describe, expect, it, vi } from "vitest";
import { createLeadToken, readLeadToken } from "@/lib/lead-token";
import { signToken, verifyToken } from "@/lib/crypto";

const LEAD = "6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11";

describe("lead token", () => {
  it("round-trips a lead id", () => {
    expect(readLeadToken(createLeadToken(LEAD))).toBe(LEAD);
  });

  it("rejects tampered and expired tokens", () => {
    const token = createLeadToken(LEAD);
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ lid: "other", v: 1, exp: 9e9 })).toString("base64url");
    expect(readLeadToken(`${forged}.${sig}`)).toBeNull();
    expect(readLeadToken(`${body}.${sig.slice(0, -2)}xx`)).toBeNull();
    expect(readLeadToken("garbage")).toBeNull();

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 2 * 86_400_000);
    expect(readLeadToken(token)).toBeNull();
    vi.useRealTimers();
  });

  it("tokens are bound to their secret purpose", () => {
    const session = signToken({ lid: LEAD, v: 1 }, "AUTH_SECRET", 60);
    expect(readLeadToken(session)).toBeNull();
    expect(verifyToken(session, "AUTH_SECRET")).toMatchObject({ lid: LEAD });
  });
});
