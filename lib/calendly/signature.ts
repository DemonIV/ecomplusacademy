import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Calendly webhook signature: header `Calendly-Webhook-Signature: t=<unix s>,v1=<hex>`
 * where v1 = HMAC-SHA256(signing key, `${t}.${raw body}`). The timestamp
 * check (3 minutes, Calendly's own suggestion) stops replays.
 */
export function verifyCalendlySignature(
  header: string | null | undefined,
  rawBody: string,
  signingKey: string,
  nowMs = Date.now(),
  toleranceMs = 3 * 60_000,
): boolean {
  if (!header || !signingKey) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!Number.isFinite(t) || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;
  if (Math.abs(nowMs - t * 1000) > toleranceMs) return false;
  const expected = createHmac("sha256", signingKey).update(`${parts.t}.${rawBody}`).digest();
  const given = Buffer.from(v1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Builds a header the way Calendly does (tests and local webhook checks). */
export function signCalendlyBody(rawBody: string, signingKey: string, nowMs = Date.now()): string {
  const t = Math.floor(nowMs / 1000);
  const v1 = createHmac("sha256", signingKey).update(`${t}.${rawBody}`).digest("hex");
  return `t=${t},v1=${v1}`;
}
