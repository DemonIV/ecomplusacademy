import { syncCalendly } from "@/lib/calendly/sync";
import { isCronRequest } from "@/lib/cron";
import { errorJson, json } from "@/lib/http";

/**
 * Hourly: brings Calendly bookings, cancellations and reschedules into the
 * panel even without a webhook (free Calendly plan) or when one was missed,
 * and picks up bookings made through links the team sent on WhatsApp.
 */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return errorJson("unauthorized", "unauthorized", 401);
  const report = await syncCalendly();
  if (report.errors.length) console.error("[calendly-sync]", report.errors.slice(0, 5));
  return json({ ok: report.errors.length === 0, ...report, errors: report.errors.length });
}
