import "server-only";
import { safeEqual } from "@/lib/crypto";
import { secret } from "@/lib/env";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export function isCronRequest(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  return safeEqual(header, `Bearer ${secret("CRON_SECRET")}`);
}
