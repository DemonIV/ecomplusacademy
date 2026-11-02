import { after } from "next/server";
import { recordInvitee, sendScheduleEvent } from "@/lib/calendly/sync";
import { verifyCalendlySignature } from "@/lib/calendly/signature";
import type { CalendlyEvent, CalendlyInvitee } from "@/lib/calendly/types";
import { env } from "@/lib/env";
import { errorJson, json } from "@/lib/http";

/**
 * Calendly webhook (invitee.created / invitee.canceled), created from
 * /admin/durum. Paid Calendly plans only; on the free plan the hourly sync
 * does the same job. Every answer except a bad signature is 200, so
 * Calendly never retries events we deliberately ignore.
 */

const MAX_BODY = 256 * 1024;

type WebhookBody = {
  event?: string;
  payload?: CalendlyInvitee & { scheduled_event?: CalendlyEvent };
};

export async function POST(request: Request) {
  const key = env.calendlyWebhookKey();
  if (!key) return errorJson("not_configured", "Webhook kapalı.", 404);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return errorJson("too_large", "İstek çok büyük.", 413);
  if (!verifyCalendlySignature(request.headers.get("calendly-webhook-signature"), raw, key)) {
    return errorJson("unauthorized", "İmza geçersiz.", 401);
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return json({ ok: true, ignored: "invalid_json" });
  }
  const invitee = body.payload;
  if ((body.event !== "invitee.created" && body.event !== "invitee.canceled") || !invitee?.uri) {
    return json({ ok: true, ignored: body.event ?? "unknown" });
  }

  const result = await recordInvitee(invitee, invitee.scheduled_event ?? null, "webhook");
  if (result.matched && result.scheduleDue) {
    const lead = result.lead;
    after(() => sendScheduleEvent(lead, { eventTime: new Date(invitee.created_at) }));
  }
  return json({ ok: true, matched: result.matched });
}
