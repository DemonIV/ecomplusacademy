import "server-only";
import { after } from "next/server";
import { AIRTABLE } from "@/config/airtable";
import {
  createRecord,
  findRecords,
  getRecord,
  updateRecord,
  type AirtableRecord,
  type AirtableResult,
} from "@/lib/airtable/api";
import {
  calendlyEventId,
  factsFromInvitee,
  factsFromLead,
  isSalesEvent,
  matchFormula,
  newRowFields,
  pickRow,
  rowChanges,
  type MatchKeys,
  type RowFacts,
  type SyncReason,
} from "@/lib/airtable/map";
import { bookingStatusOf } from "@/lib/calendly/map";
import type { CalendlyEvent, CalendlyInvitee } from "@/lib/calendly/types";
import { getActiveBookingForLead } from "@/lib/db/bookings";
import { getLead, leadsMissingAirtable, setAirtableRecordId } from "@/lib/db/leads";
import { integrations, siteUrl } from "@/lib/env";

/**
 * Our data → the team's Airtable table, one row per person:
 *  - applicants: the row the site created, or the team's own row for the
 *    same person (an Instagram DM that later applied on the site);
 *  - Calendly sales calls of people who never applied (a link the team sent).
 * Runs after the response; failures are logged and the daily sync retries.
 */

export type AirtableSyncReason = Exclude<SyncReason, "calendly">;
export type AirtableWrite = { recordId: string; action: "created" | "updated" | "unchanged" } | null;

const NOT_CONFIGURED = { ok: false, status: 0, error: "not_configured" } as const;

async function findRow(keys: MatchKeys): Promise<AirtableResult<AirtableRecord | null>> {
  const formula = matchFormula(keys);
  if (!formula) return { ok: true, data: null };
  const found = await findRecords(formula);
  return found.ok ? { ok: true, data: pickRow(found.data, keys) } : found;
}

/** Creates the row, or writes only what changed on the existing one. */
async function write(row: AirtableRecord | null, facts: RowFacts, reason: SyncReason): Promise<AirtableResult<AirtableWrite>> {
  if (!row) {
    const created = await createRecord(newRowFields(facts));
    return created.ok ? { ok: true, data: { recordId: created.data.id, action: "created" } } : created;
  }
  const changes = rowChanges(facts, row.fields, reason);
  if (!Object.keys(changes).length) return { ok: true, data: { recordId: row.id, action: "unchanged" } };
  const updated = await updateRecord(row.id, changes);
  return updated.ok ? { ok: true, data: { recordId: row.id, action: "updated" } } : updated;
}

function logged<T>(label: string, result: AirtableResult<T>): AirtableResult<T> {
  if (!result.ok) console.error(`[airtable] ${label}: ${result.status} ${result.error}`);
  return result;
}

export async function syncLeadToAirtable(
  leadId: string,
  reason: AirtableSyncReason,
  now = new Date(),
): Promise<AirtableResult<AirtableWrite>> {
  if (!integrations.airtable()) return NOT_CONFIGURED;
  const lead = await getLead(leadId);
  if (!lead) return { ok: true, data: null };
  const booking = await getActiveBookingForLead(lead.id);
  // Applicants the questions filtered out stay out, unless the team booked a call with them.
  if (!lead.qualified && !booking && !lead.airtable_record_id) return { ok: true, data: null };
  const facts = factsFromLead(lead, booking, { now, reason, panelUrl: `${siteUrl()}/admin/leadler/${lead.id}` });
  const label = `${reason} ${lead.id}`;

  let row: AirtableRecord | null = null;
  if (lead.airtable_record_id) {
    const stored = await getRecord(lead.airtable_record_id);
    if (!stored.ok) return logged(label, stored);
    row = stored.data;
  }
  if (!row) {
    const found = await findRow({
      eventId: facts.call && facts.call !== "cancelled" ? facts.call.eventId : null,
      email: facts.email,
      phone: facts.phone,
      instagram: facts.instagram,
    });
    if (!found.ok) return logged(label, found);
    row = found.data;
    // The team deleted the row and nothing else matches: their decision, not undone.
    if (!row && lead.airtable_record_id) return { ok: true, data: null };
  }

  const result = logged(label, await write(row, facts, reason));
  if (result.ok && result.data && result.data.recordId !== lead.airtable_record_id) {
    await setAirtableRecordId(lead.id, result.data.recordId);
  }
  return result;
}

/** Fire-and-forget after the response; a no-op until Airtable is configured. */
export function queueAirtableSync(leadId: string, reason: AirtableSyncReason): void {
  if (!integrations.airtable()) return;
  after(async () => {
    await syncLeadToAirtable(leadId, reason).catch((error) => console.error(`[airtable] ${reason} ${leadId}:`, error));
  });
}

/**
 * A Calendly booking of someone who never applied on the site. Sales event
 * types only (config/airtable.ts → salesEvents). Safe to repeat: the daily
 * sync reads the same bookings again and writes only differences.
 */
export async function syncInviteeToAirtable(
  invitee: CalendlyInvitee,
  event: CalendlyEvent | null,
  now = new Date(),
): Promise<AirtableResult<AirtableWrite>> {
  if (!integrations.airtable()) return NOT_CONFIGURED;
  if (!event || !isSalesEvent(event)) return { ok: true, data: null };
  const status = bookingStatusOf(invitee, event);
  // A new time: the new invitee brings it.
  if (status === "rescheduled") return { ok: true, data: null };

  const facts = factsFromInvitee(invitee, event, now);
  const eventId = calendlyEventId(event.uri);
  const label = `calendly ${invitee.uri}`;
  const found = await findRow({ eventId, email: facts.email, phone: facts.phone, instagram: facts.instagram });
  if (!found.ok) return logged(label, found);
  const row = found.data;
  // A cancellation only touches the row showing that very call; it never opens a row.
  if (status === "cancelled" && (!row || String(row.fields[AIRTABLE.fields.calendlyEvent] ?? "") !== eventId)) {
    return { ok: true, data: null };
  }
  return logged(label, await write(row, facts, "calendly"));
}

/** Webhook path: after the response, so Calendly gets its 200 right away. */
export function queueInviteeAirtableSync(invitee: CalendlyInvitee, event: CalendlyEvent | null): void {
  if (!integrations.airtable()) return;
  after(async () => {
    await syncInviteeToAirtable(invitee, event).catch((error) => console.error(`[airtable] calendly ${invitee.uri}:`, error));
  });
}

/**
 * Daily safety net: qualified applicants of the last 3 days that never made it
 * (Airtable down, or the key added later). Older leads are left alone, so
 * turning the integration on does not flood the table with test entries.
 */
export async function retryMissingAirtable(): Promise<{ skipped?: string; sent: number; failed: number }> {
  if (!integrations.airtable()) return { skipped: "not_configured", sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  for (const id of await leadsMissingAirtable(3)) {
    const result = await syncLeadToAirtable(id, "retry");
    if (result.ok) sent++;
    else failed++;
  }
  return { sent, failed };
}
