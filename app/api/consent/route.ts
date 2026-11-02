import { cookies } from "next/headers";
import { z } from "zod";
import {
  ATTRIBUTION_MAX_AGE,
  buildFbc,
  buildFbp,
  COOKIE,
  encodeTouch,
  fbclidFromFbc,
  isValidFbCookie,
} from "@/lib/attribution";
import { errorJson, json, readJson, sameOrigin } from "@/lib/http";
import { isProduction } from "@/lib/env";

/**
 * Stores the cookie-banner choice. On "granted" it also writes the
 * attribution cookies from the click data the page kept in sessionStorage
 * (the landing URL's fbclid is gone by the time the visitor accepts).
 */

const bodySchema = z.object({
  choice: z.enum(["granted", "denied"]),
  touch: z
    .object({
      ts: z.number(),
      fbclid: z.string().regex(/^[A-Za-z0-9_-]{8,500}$/).optional(),
      utm_source: z.string().max(200).optional(),
      utm_medium: z.string().max(200).optional(),
      utm_campaign: z.string().max(200).optional(),
      utm_term: z.string().max(200).optional(),
      utm_content: z.string().max(200).optional(),
      utm_id: z.string().max(200).optional(),
      landing: z.string().max(500).optional(),
      referrer: z.string().max(300).optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("forbidden", "İzin verilmeyen istek.", 403);
  const parsed = bodySchema.safeParse(await readJson(request, 4096));
  if (!parsed.success) return errorJson("invalid", "Geçersiz istek.", 422);

  const jar = await cookies();
  const base = { path: "/", sameSite: "lax" as const, secure: isProduction, httpOnly: false };
  jar.set(COOKIE.consent, parsed.data.choice, { ...base, maxAge: 60 * 60 * 24 * 180 });

  if (parsed.data.choice === "denied") {
    for (const name of [COOKIE.fbc, COOKIE.fbp, COOKIE.firstTouch, COOKIE.lastTouch]) jar.delete(name);
    return json({ ok: true });
  }

  const now = Date.now();
  const touch = parsed.data.touch;
  const options = { ...base, maxAge: ATTRIBUTION_MAX_AGE };
  const existingFbc = jar.get(COOKIE.fbc)?.value;
  if (touch?.fbclid && (!isValidFbCookie(existingFbc) || fbclidFromFbc(existingFbc) !== touch.fbclid)) {
    jar.set(COOKIE.fbc, buildFbc(touch.fbclid, Math.min(touch.ts, now)), options);
  }
  if (!isValidFbCookie(jar.get(COOKIE.fbp)?.value)) jar.set(COOKIE.fbp, buildFbp(now), options);
  if (touch) {
    const encoded = encodeTouch({ ...touch, ts: Math.min(touch.ts, now) });
    if (!jar.has(COOKIE.firstTouch)) jar.set(COOKIE.firstTouch, encoded, options);
    jar.set(COOKIE.lastTouch, encoded, options);
  }
  return json({ ok: true });
}
