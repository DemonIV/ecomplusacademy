import "server-only";
import { addActivity, getLead, recordOutcome, type Lead } from "@/lib/db/leads";
import { getLatestBookingForLead } from "@/lib/db/bookings";
import { listLeadEvents } from "@/lib/db/events";
import { trackLeadEvent } from "@/lib/meta/track";
import { eventIds, META_EVENTS } from "@/lib/meta/events";
import { QUALIFICATION_RULES } from "@/lib/qualification";

/**
 * What a closer records after the call, and the Meta event it produces.
 * This is where the delayed sale reaches Meta: same identity as the
 * application (email, phone, fbc, fbp, IP, external_id), action_source
 * "phone_call", event_time = when the closer marked it.
 */

export type Outcome = "attended" | "no_show" | "won" | "lost";

export const OUTCOME_LABELS: Record<Outcome, string> = {
  attended: "Görüşmeye geldi",
  no_show: "Gelmedi",
  won: "Satış",
  lost: "Kaybedildi",
};

export async function applyOutcome(input: {
  leadId: string;
  outcome: Outcome;
  amount?: number | null;
  lostReason?: string | null;
  actorId: string;
}): Promise<{ ok: true; lead: Lead } | { ok: false; error: string }> {
  const lead = await getLead(input.leadId);
  if (!lead) return { ok: false, error: "Lead bulunamadı." };
  if (!lead.qualified) return { ok: false, error: "Elenen başvurular için sonuç girilemez." };
  if (input.outcome === "won" && !(input.amount && input.amount > 0)) {
    return { ok: false, error: "Satış tutarını gir." };
  }

  await recordOutcome(lead.id, {
    status: input.outcome,
    dealValue: input.outcome === "won" ? input.amount : null,
    lostReason: input.outcome === "lost" ? input.lostReason?.trim() || null : null,
    ownerId: input.actorId,
  });
  await addActivity(
    lead.id,
    `outcome_${input.outcome}`,
    {
      ...(input.amount ? { amount: input.amount } : {}),
      ...(input.lostReason ? { reason: input.lostReason } : {}),
    },
    input.actorId,
  );
  const updated = (await getLead(lead.id)) ?? lead;
  return { ok: true, lead: updated };
}

/** Sends the CAPI events an outcome implies. Runs after the response (`after`). */
export async function sendOutcomeEvents(lead: Lead, outcome: Outcome, amount?: number | null): Promise<void> {
  const now = new Date();
  // Every outcome except a no-show means the person was on the call.
  if (outcome !== "no_show") {
    await trackLeadEvent({
      lead,
      eventName: META_EVENTS.callAttended,
      eventId: eventIds.callAttended(lead.id),
      actionSource: "phone_call",
      eventTime: now,
    });
  }
  if (outcome === "no_show") {
    const booking = await getLatestBookingForLead(lead.id);
    await trackLeadEvent({
      lead,
      eventName: META_EVENTS.noShow,
      eventId: eventIds.noShow(booking?.id ?? lead.id),
      actionSource: "phone_call",
      eventTime: now,
    });
  }
  if (outcome === "won" && amount) {
    await trackLeadEvent({
      lead,
      eventName: META_EVENTS.purchase,
      eventId: eventIds.purchase(lead.id),
      actionSource: "phone_call",
      eventTime: now,
      value: amount,
    });
  }
}

/**
 * Re-sends one event that failed (network, expired token…). Rebuilt from
 * the lead row with the same deterministic event id, so Meta deduplicates
 * it if the first attempt did arrive after all.
 */
export async function retryEvent(leadId: string, eventId: string): Promise<{ ok: boolean; message: string }> {
  const lead = await getLead(leadId);
  if (!lead) return { ok: false, message: "Lead bulunamadı." };
  const original = (await listLeadEvents(leadId)).find((e) => e.event_id === eventId);
  if (!original) return { ok: false, message: "Olay bulunamadı." };

  const result = await trackLeadEvent({
    lead,
    eventName: original.event_name,
    eventId: original.event_id,
    actionSource: original.action_source as "website" | "phone_call",
    value:
      original.value ??
      (original.event_name === META_EVENTS.lead && lead.tier ? QUALIFICATION_RULES.leadValue[lead.tier] : null),
    // When it actually happened (the first attempt); CAPI clamps it to the 7-day window.
    eventTime: original.created_at,
  });
  if (result.status === "sent") return { ok: true, message: "Meta'ya ulaştı." };
  if (result.status === "skipped") return { ok: false, message: `Gönderilmedi: ${result.reason}` };
  return { ok: false, message: `Hata: ${result.error}` };
}
