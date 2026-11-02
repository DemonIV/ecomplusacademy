import { after } from "next/server";
import { checkBotId } from "botid/server";
import { z } from "zod";
import { getEvent, getInvitee } from "@/lib/calendly/api";
import { INVITEE_URI } from "@/lib/calendly/link";
import { recordInvitee, recordPendingInvitee, sendScheduleEvent, type RecordResult } from "@/lib/calendly/sync";
import { getLead } from "@/lib/db/leads";
import { integrations } from "@/lib/env";
import { clientIp, errorJson, json, readJson, sameOrigin } from "@/lib/http";
import { readLeadToken } from "@/lib/lead-token";
import { eventIds } from "@/lib/meta/events";
import { rateLimit } from "@/lib/rate-limit";

/**
 * The Calendly embed reported a booking (postMessage → browser → here).
 * The lead token says who booked; the invitee is re-read from Calendly's
 * API so the browser cannot invent a time or claim someone else's booking.
 * Without an API key yet, a placeholder is stored and the sync completes it.
 */

const bodySchema = z.object({
  leadToken: z.string().min(10).max(2048),
  inviteeUri: z.string().max(300).regex(INVITEE_URI),
  pageUrl: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("forbidden", "İzin verilmeyen istek.", 403);

  const verdict = await checkBotId();
  if (verdict.isBot && !verdict.isVerifiedBot) return errorJson("bot", "Otomatik istek algılandı.", 403);

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson("invalid", "Geçersiz istek.", 422);

  const leadId = readLeadToken(parsed.data.leadToken);
  if (!leadId) return errorJson("unauthorized", "Oturumun zaman aşımına uğradı.", 401);

  const limited = await rateLimit(`booked:${clientIp(request.headers) ?? leadId}`, 10, 600);
  if (!limited.ok) return errorJson("rate_limited", "Çok fazla deneme. Biraz sonra tekrar dene.", 429);

  const lead = await getLead(leadId);
  if (!lead || !lead.qualified) return errorJson("not_qualified", "Başvuru bulunamadı.", 404);

  const { inviteeUri, pageUrl } = parsed.data;
  let result: RecordResult;
  let eventTime: Date | undefined;

  const invitee = integrations.calendly() ? await getInvitee(inviteeUri) : null;
  if (invitee?.ok) {
    const mine =
      invitee.data.tracking?.salesforce_uuid?.toLowerCase() === lead.id ||
      invitee.data.email.trim().toLowerCase() === lead.email;
    if (!mine) return errorJson("forbidden", "Bu randevu başvurunla eşleşmiyor.", 403);
    const event = await getEvent(invitee.data.event);
    result = await recordInvitee(invitee.data, event.ok ? event.data : null, "funnel", lead);
    eventTime = new Date(invitee.data.created_at);
  } else if (invitee && invitee.status === 404) {
    return errorJson("not_found", "Randevu Calendly'de bulunamadı.", 422);
  } else {
    // No API key yet, or Calendly is unreachable right now: keep the booking, details follow.
    result = await recordPendingInvitee(lead, inviteeUri);
  }

  if (result.matched && result.scheduleDue) {
    const matchedLead = result.lead;
    after(() => sendScheduleEvent(matchedLead, { eventTime, eventSourceUrl: pageUrl?.startsWith("http") ? pageUrl : null }));
  }

  const booking = result.matched ? result.booking : null;
  return json({
    status: "booked",
    events: { schedule: eventIds.schedule(lead.id) },
    booking:
      booking?.start_at && booking.end_at
        ? {
            start: booking.start_at.toISOString(),
            end: booking.end_at.toISOString(),
            hostName: booking.host_name,
            location: booking.location,
            rescheduleUrl: booking.reschedule_url,
            cancelUrl: booking.cancel_url,
          }
        : null,
  });
}
