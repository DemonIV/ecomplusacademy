import "server-only";
import { cache } from "react";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signToken, verifyToken } from "@/lib/crypto";
import { isProduction } from "@/lib/env";
import { getMember, type TeamMember } from "@/lib/db/team";

/**
 * Admin sessions: HMAC-signed cookie carrying member id + session_version.
 * Bumping session_version (password change, deactivation) revokes every
 * existing session of that member immediately.
 */

const COOKIE_NAME = "fx_admin";
const TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = { mid: string; sv: number };

export async function startSession(member: { id: string; session_version: number }): Promise<void> {
  const token = signToken<SessionPayload>({ mid: member.id, sv: member.session_version }, "AUTH_SECRET", TTL_SECONDS);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export type SessionUser = Pick<TeamMember, "id" | "name" | "email" | "role" | "accepts_bookings">;

/** Current member or null. Deduplicated per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  // The expiry check reads the clock; runtime prefetches (cookies available) must stop before it.
  await io();
  const payload = verifyToken<SessionPayload>(token, "AUTH_SECRET");
  if (!payload) return null;
  const member = await getMember(payload.mid);
  if (!member || !member.active || member.session_version !== payload.sv) return null;
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    accepts_bookings: member.accepts_bookings,
  };
});

export async function requireUser(role?: "admin"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/giris");
  if (role === "admin" && user.role !== "admin") redirect("/admin");
  return user;
}
