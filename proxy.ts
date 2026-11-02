import { NextResponse, type NextRequest } from "next/server";
import {
  ATTRIBUTION_MAX_AGE,
  buildFbc,
  buildFbp,
  COOKIE,
  encodeTouch,
  fbclidFromFbc,
  isValidFbCookie,
  touchFromUrl,
  trackingAllowed,
} from "@/lib/attribution";

/**
 * First-touch attribution on landing requests. Writes Meta's `_fbc`/`_fbp`
 * and our UTM touch cookies from the server so they survive Safari's 7-day
 * cap on script-written cookies. Runs only after marketing consent (or in
 * "notice" consent mode); before consent the browser keeps the click data in
 * sessionStorage and `/api/consent` writes these cookies when accepted.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (!trackingAllowed(request.cookies.get(COOKIE.consent)?.value)) return response;

  const secure = request.nextUrl.protocol === "https:";
  const options = { path: "/", maxAge: ATTRIBUTION_MAX_AGE, sameSite: "lax" as const, secure, httpOnly: false };
  const now = Date.now();

  const fbclid = request.nextUrl.searchParams.get("fbclid");
  const currentFbc = request.cookies.get(COOKIE.fbc)?.value;
  if (fbclid && /^[A-Za-z0-9_-]{8,500}$/.test(fbclid)) {
    // A new click replaces the old id; the same click keeps its original timestamp.
    if (!isValidFbCookie(currentFbc) || fbclidFromFbc(currentFbc) !== fbclid) {
      response.cookies.set(COOKIE.fbc, buildFbc(fbclid, now), options);
    }
  }
  if (!isValidFbCookie(request.cookies.get(COOKIE.fbp)?.value)) {
    response.cookies.set(COOKIE.fbp, buildFbp(now), options);
  }

  const touch = touchFromUrl(request.nextUrl, request.headers.get("referer"), now);
  if (touch) {
    const encoded = encodeTouch(touch);
    if (!request.cookies.has(COOKIE.firstTouch)) response.cookies.set(COOKIE.firstTouch, encoded, options);
    response.cookies.set(COOKIE.lastTouch, encoded, options);
  }
  return response;
}

export const config = {
  matcher: [
    {
      // Landing pages only: no APIs, assets or admin.
      source: "/((?!api|admin|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|media|.*\\.[\\w]+$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
