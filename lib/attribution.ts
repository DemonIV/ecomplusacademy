/**
 * Ad attribution primitives shared by `proxy.ts`, `/api/consent` and the
 * lead API. No `server-only`: proxy runs in its own bundle and the parsing
 * helpers are pure.
 *
 * Why server-set cookies: Safari caps cookies written by JavaScript to 7 days,
 * but our sale closes ~5 days after the click and the Purchase signal is sent
 * from the admin panel. Cookies set in an HTTP response from our own origin
 * are not capped, so `_fbc` survives until the application is submitted.
 */

export const COOKIE = {
  consent: "fx_consent",
  fbc: "_fbc",
  fbp: "_fbp",
  firstTouch: "fx_ft",
  lastTouch: "fx_lt",
} as const;

export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days, Meta's _fbc lifetime

export type ConsentChoice = "granted" | "denied";

export const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "ttclid",
] as const;

export type Touch = Partial<Record<(typeof TRACKED_PARAMS)[number], string>> & {
  landing?: string;
  referrer?: string;
  ts: number;
};

const MAX_VALUE_LENGTH = 200;

export function touchFromUrl(url: URL, referrer?: string | null, now = Date.now()): Touch | null {
  const touch: Touch = { ts: now };
  let found = false;
  for (const key of TRACKED_PARAMS) {
    const value = url.searchParams.get(key);
    if (value) {
      touch[key] = value.slice(0, MAX_VALUE_LENGTH);
      found = true;
    }
  }
  if (!found) return null;
  touch.landing = `${url.pathname}${url.search}`.slice(0, 500);
  if (referrer) touch.referrer = referrer.slice(0, 300);
  return touch;
}

export function encodeTouch(touch: Touch): string {
  return encodeURIComponent(JSON.stringify(touch));
}

export function decodeTouch(value: string | undefined | null): Touch | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!parsed || typeof parsed !== "object" || typeof parsed.ts !== "number") return null;
    const touch: Touch = { ts: parsed.ts };
    for (const key of [...TRACKED_PARAMS, "landing", "referrer"] as const) {
      if (typeof parsed[key] === "string") touch[key] = parsed[key].slice(0, 500);
    }
    return touch;
  } catch {
    return null;
  }
}

/** Meta click id cookie format: fb.<subdomainIndex>.<creationTimeMs>.<fbclid> */
export function buildFbc(fbclid: string, createdAtMs = Date.now()): string {
  return `fb.1.${Math.floor(createdAtMs)}.${fbclid}`;
}

/** Meta browser id cookie format: fb.<subdomainIndex>.<creationTimeMs>.<random> */
export function buildFbp(now = Date.now()): string {
  const random = Math.floor(1_000_000_000 + Math.random() * 8_999_999_999);
  return `fb.1.${now}.${random}`;
}

const FB_COOKIE_PATTERN = /^fb\.\d\.\d{10,16}\.[A-Za-z0-9_.-]{4,500}$/;

export function isValidFbCookie(value: string | undefined | null): value is string {
  return Boolean(value && FB_COOKIE_PATTERN.test(value));
}

/** Extracts the fbclid embedded in an `_fbc` value. */
export function fbclidFromFbc(fbc: string): string | null {
  const parts = fbc.split(".");
  return parts.length >= 4 ? parts.slice(3).join(".") : null;
}

export function consentMode(): "strict" | "notice" {
  return process.env.NEXT_PUBLIC_CONSENT_MODE === "notice" ? "notice" : "strict";
}

/** Whether marketing cookies may be written, given the stored choice. */
export function trackingAllowed(choice: string | undefined | null): boolean {
  if (choice === "granted") return true;
  if (choice === "denied") return false;
  return consentMode() === "notice";
}
