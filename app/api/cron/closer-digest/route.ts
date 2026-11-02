import { BOOKING } from "@/config/booking";
import { addDays, formatTrDateTime, localDateOf, zonedTimeToUtc } from "@/lib/booking/time";
import { isCronRequest } from "@/lib/cron";
import { agenda, callsAwaitingOutcome } from "@/lib/db/bookings";
import { listMembers } from "@/lib/db/team";
import { renderCloserDigest } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/send";
import { siteUrl } from "@/lib/env";
import { errorJson, json } from "@/lib/http";
import { formatPhone } from "@/lib/phone";

/**
 * Daily 09:00 (TR): each closer gets their calls still missing an outcome
 * plus today's agenda. The Purchase signal to Meta depends on outcomes
 * being marked, so this nudge is part of the tracking system.
 */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return errorJson("unauthorized", "unauthorized", 401);

  const tz = BOOKING.timeZone;
  const today = localDateOf(new Date(), tz);
  const from = zonedTimeToUtc({ ...today, hour: 0, minute: 0 }, tz);
  const to = zonedTimeToUtc({ ...addDays(today, 1), hour: 0, minute: 0 }, tz);
  const base = siteUrl();

  let sent = 0;
  for (const member of await listMembers()) {
    if (!member.active || !member.accepts_bookings) continue;
    const [pending, todays] = await Promise.all([callsAwaitingOutcome(member.id), agenda(from, to, member.id)]);
    if (!pending.length && !todays.length) continue;

    const toCall = (item: (typeof pending)[number]) => ({
      name: item.lead_full_name,
      whenLabel: formatTrDateTime(item.start_at, tz),
      phone: formatPhone(item.lead_phone),
      url: `${base}/admin/leadler/${item.lead_id}`,
    });
    const email = await renderCloserDigest({
      name: member.name.split(" ")[0],
      pending: pending.map(toCall),
      today: todays.map(toCall),
      adminUrl: `${base}/admin`,
    });
    const result = await sendEmail({
      to: member.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      idempotencyKey: `digest_${member.id}_${from.toISOString().slice(0, 10)}`,
      tags: { type: "closer_digest" },
    });
    if (result.status === "sent") sent++;
  }
  return json({ ok: true, sent });
}
