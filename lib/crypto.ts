import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { secret, type SecretName } from "@/lib/env";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function hmac(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("base64url");
}

/**
 * Compact signed token: base64url(JSON payload) + "." + HMAC.
 * Payload is readable by the holder, so never put secrets in it.
 */
export function signToken<T extends object>(
  payload: T,
  secretName: SecretName,
  ttlSeconds: number,
): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }),
  ).toString("base64url");
  return `${body}.${hmac(body, secret(secretName))}`;
}

export function verifyToken<T extends object>(
  token: string | null | undefined,
  secretName: SecretName,
): (T & { exp: number }) | null {
  if (!token || token.length > 2048) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, hmac(body, secret(secretName)))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload?.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
