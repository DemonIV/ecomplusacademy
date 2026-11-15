import "server-only";
import { BRAND } from "@/content/brand";
import { getDb } from "@/lib/db";
import {
  bookingsMissingDetails,
  getActiveBookingForLead,
  getBookingByInvitee,
  knownEventVersions,
  supersedeOtherBookings,
  upsertCalendlyBooking,
  type Booking,
  type BookingSource,
} from "@/lib/db/bookings";
import { addActivity, findLeadByContact, getLead, setLeadStatus, type Lead, type LeadStatus } from "@/lib/db/leads";
import { findMemberByEmail } from "@/lib/db/team";
import { queueAirtableSync } from "@/lib/airtable/sync";
import { getEvent, getInvitee, listEvents, listInvitees } from "@/lib/calendly/api";
import { bookingFields, leadRefFromInvitee } from "@/lib/calendly/map";
import type { CalendlyEvent, CalendlyInvitee } from "@/lib/calendly/types";
import { integrations, siteUrl } from "@/lib/env";
import { trackLeadEvent } from "@/lib/meta/track";
import { eventIds, META_EVENTS } from "@/lib/meta/events";

/**
 * Calendly → our database. Three entry points feed the same function:
 * the funnel (right after the embed reports a booking), the webhook
 * (real time, paid Calendly plans) and the hourly sync (safety net, also
 * catches bookings made through a link the team sent over WhatsApp).
 */

/** A new upcoming call moves the lead to "booked" from these states. */
const BOOKABLE: ReadonlySet<LeadStatus> = new Set(["qualified", "cancelled", "no_show", "booked"]);

export type RecordResult =
  | { matched: false }
  | { matched: true; lead: Lead; booking: Booking; inserted: boolean; scheduleDue: boolean };

async function findLead(invitee: CalendlyInvitee, event: CalendlyEvent | null): Promise<Lead | null> {
  const ref = leadRefFromInvitee(invitee, event);
  if (ref.leadId) {
    const lead = await getLead(ref.leadId);
    if (lead) return lead;
  }
  if (ref.email || ref.phone) return findLeadByContact(ref.email ?? "", ref.phone ?? "");
  return null;
}

export async function recordInvitee(
  invitee: CalendlyInvitee,
  event: CalendlyEvent | null,
  source: BookingSource,
  knownLead?: Lead,
): Promise<RecordResult> {
  const lead = knownLead ?? (await findLead(invitee, event));
  if (!lead) {
    console.info(`[calendly] no lead for invitee ${invitee.uri}`);
    return { matched: false };
  }
  const fields = bookingFields(invitee, event);
  const host = fields.hostEmail ? await findMemberByEmail(fields.hostEmail) : null;
  const db = await getDb();

  const outcome = await db.tx(async (q) => {
    const existing = await getBookingByInvitee(fields.inviteeUri, q);
    let status = fields.status;
    // A booking we replaced by a newer one stays replaced even if Calendly still lists it.
    if (existing?.cancel_reason === "superseded" && status === "confirmed") status = existing.status;
    if (status === "confirmed") await supersedeOtherBookings(q, lead.id, fields.inviteeUri);

    const { booking, inserted } = await upsertCalendlyBooking(q, {
      leadId: lead.id,
      hostId: host?.id ?? null,
      hostName: fields.hostName,
      hostEmail: fields.hostEmail,
      start: fields.start,
      end: fields.end,
      status,
      source,
      location: fields.location,
      joinUrl: fields.joinUrl,
      cancelUrl: fields.cancelUrl,
      rescheduleUrl: fields.rescheduleUrl,
      eventUri: fields.eventUri,
      inviteeUri: fields.inviteeUri,
      updatedAt: fields.updatedAt,
      cancelReason: status === fields.status ? fields.cancelReason : existing?.cancel_reason ?? null,
    });

    const detail = {
      bookingId: booking.id,
      start: booking.start_at?.toISOString() ?? null,
      // Same name the bookings list shows: the team member's, Calendly's only for unmatched hosts.
      host: host?.name ?? booking.host_name,
      source,
    };
    const wasActive = existing?.status === "confirmed";
    let nextStatus: LeadStatus | null = null;
    // Something the team's Airtable should reflect (repeat syncs of an unchanged booking stay quiet).
    let changed = false;

    if (status === "confirmed") {
      if (BOOKABLE.has(lead.status) && lead.status !== "booked") nextStatus = "booked";
      if (inserted) {
        await addActivity(lead.id, invitee.old_invitee ? "rescheduled" : "booked", detail, null, q);
        changed = true;
      } else if (
        existing?.start_at &&
        booking.start_at &&
        existing.start_at.getTime() !== booking.start_at.getTime()
      ) {
        await addActivity(lead.id, "rescheduled", { ...detail, from: existing.start_at.toISOString() }, null, q);
        changed = true;
      } else if (!existing?.start_at && booking.start_at) {
        // A funnel booking saved before the API key: time and host just arrived.
        changed = true;
      }
    } else if (wasActive || inserted) {
      if (status === "cancelled") {
        await addActivity(lead.id, "cancelled", { ...detail, reason: booking.cancel_reason }, null, q);
        // Rescheduling keeps the lead booked: the new invitee arrives on its own.
        if (lead.status === "booked" && !(await getActiveBookingForLead(lead.id, q))) nextStatus = "cancelled";
        changed = true;
      }
    }
    if (nextStatus) await setLeadStatus(lead.id, nextStatus, q);
    return { booking, inserted, nextStatus, wasActive, changed: changed || nextStatus !== null };
  });

  if (outcome.changed) queueAirtableSync(lead.id, "booking");

  return {
    matched: true,
    lead: outcome.nextStatus ? { ...lead, status: outcome.nextStatus } : lead,
    booking: outcome.booking,
    inserted: outcome.inserted,
    // Only when a call newly becomes active (repeat syncs stay quiet). Meta
    // learns from qualified applicants only: a call the team arranged with
    // someone the questions filtered out is recorded but not sent.
    scheduleDue:
      outcome.booking.status === "confirmed" && lead.qualified && (outcome.inserted || !outcome.wasActive),
  };
}

/**
 * Funnel booking before the Calendly API key exists: the embed told us the
 * invitee URI, the lead token proved who it is. Time and host follow with
 * the first sync after the key is set.
 */
export async function recordPendingInvitee(lead: Lead, inviteeUri: string): Promise<RecordResult> {
  const eventUri = inviteeUri.replace(/\/invitees\/[^/]+$/, "");
  const placeholder: CalendlyInvitee = {
    uri: inviteeUri,
    email: lead.email,
    name: lead.full_name,
    status: "active",
    created_at: new Date().toISOString(),
    event: eventUri,
  };
  return recordInvitee(placeholder, null, "funnel", lead);
}

/** Schedule through CAPI, deduplicated with the browser pixel by the shared event id. */
export async function sendScheduleEvent(lead: Lead, options: { eventTime?: Date; eventSourceUrl?: string | null } = {}) {
  return trackLeadEvent({
    lead,
    eventName: META_EVENTS.schedule,
    eventId: eventIds.schedule(lead.id),
    actionSource: "website",
    eventTime: options.eventTime,
    eventSourceUrl: options.eventSourceUrl ?? `${siteUrl()}/`,
    customData: { content_name: BRAND.callName },
  });
}

async function recordAndNotify(invitee: CalendlyInvitee, event: CalendlyEvent | null, source: BookingSource) {
  const result = await recordInvitee(invitee, event, source);
  if (result.matched && result.scheduleDue) {
    await sendScheduleEvent(result.lead, { eventTime: new Date(invitee.created_at) });
  }
  return result;
}

/** Re-reads one lead's bookings from Calendly ("Calendly'den yenile" in the panel). */
export async function refreshInvitee(inviteeUri: string): Promise<{ ok: boolean; error?: string }> {
  const invitee = await getInvitee(inviteeUri);
  if (!invitee.ok) return { ok: false, error: invitee.error };
  const event = await getEvent(invitee.data.event);
  const result = await recordAndNotify(invitee.data, event.ok ? event.data : null, "sync");
  return result.matched ? { ok: true } : { ok: false, error: "Lead eşleşmedi." };
}

export type SyncReport = { skipped?: string; events: number; checked: number; matched: number; unmatched: number; errors: string[] };

/**
 * Hourly safety net: every event starting from 2 days ago to 60 days ahead;
 * only new or changed ones (by Calendly's `updated_at`) are read in full.
 */
export async function syncCalendly(now = new Date()): Promise<SyncReport> {
  const report: SyncReport = { events: 0, checked: 0, matched: 0, unmatched: 0, errors: [] };
  if (!integrations.calendly()) return { ...report, skipped: "not_configured" };

  const listed = await listEvents({ from: new Date(now.getTime() - 2 * 86_400_000), to: new Date(now.getTime() + 60 * 86_400_000) });
  if (!listed.ok) return { ...report, errors: [listed.error] };
  report.events = listed.data.length;

  const known = await knownEventVersions(listed.data.map((e) => e.uri));
  for (const event of listed.data) {
    const updated = event.updated_at ? new Date(event.updated_at).getTime() : Number.NaN;
    if (known.has(event.uri) && known.get(event.uri) === updated) continue;
    const invitees = await listInvitees(event.uri);
    if (!invitees.ok) {
      report.errors.push(`${event.uri}: ${invitees.error}`);
      continue;
    }
    for (const invitee of invitees.data) {
      report.checked++;
      const result = await recordAndNotify(invitee, event, "sync");
      if (result.matched) report.matched++;
      else report.unmatched++;
    }
  }

  // Funnel bookings saved before the API key existed.
  for (const pending of await bookingsMissingDetails()) {
    if (!pending.calendly_invitee_uri) continue;
    const refreshed = await refreshInvitee(pending.calendly_invitee_uri);
    if (!refreshed.ok && refreshed.error) report.errors.push(`${pending.calendly_invitee_uri}: ${refreshed.error}`);
  }
  return report;
}
