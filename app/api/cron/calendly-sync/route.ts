import { retryMissingAirtable } from "@/lib/airtable/sync";
import { syncCalendly } from "@/lib/calendly/sync";
import { isCronRequest } from "@/lib/cron";
import { errorJson, json } from "@/lib/http";

/**
 * Daily (hourly on Vercel Pro): brings Calendly bookings, cancellations and
 * reschedules into the panel even without a webhook or when one was missed,
 * picks up bookings made through links the team sent on WhatsApp, then
 * re-sends recent applicants that did not reach Airtable.
 */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return errorJson("unauthorized", "unauthorized", 401);
  const report = await syncCalendly();
  if (report.errors.length) console.error("[calendly-sync]", report.errors.slice(0, 5));
  const airtable = await retryMissingAirtable();
  if (airtable.failed) console.error(`[airtable] retry: ${airtable.failed} failed`);
  return json({ ok: report.errors.length === 0 && !airtable.failed, ...report, errors: report.errors.length, airtable });
}
