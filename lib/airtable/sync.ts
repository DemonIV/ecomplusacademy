import "server-only";
import { after } from "next/server";
import { createRecord, findRecord, updateRecord, type AirtableResult } from "@/lib/airtable/api";
import { contactFormula, fieldsForExistingRow, fieldsForNewRow } from "@/lib/airtable/map";
import { getActiveBookingForLead } from "@/lib/db/bookings";
import { getLead, leadsMissingAirtable, setAirtableRecordId } from "@/lib/db/leads";
import { integrations } from "@/lib/env";

/**
 * Our leads → the team's Airtable table. One row per person: the row the
 * site created, or the one the team already had for the same e-mail/phone
 * (an Instagram DM that later applied on the site). Disqualified applicants
 * stay out. Runs after the response; failures are logged and retried by the
 * daily sync.
 */

export type AirtableSyncReason = "applied" | "booking" | "outcome" | "retry";

export async function syncLeadToAirtable(
  leadId: string,
  reason: AirtableSyncReason,
  now = new Date(),
): Promise<AirtableResult<{ recordId: string; created: boolean } | null>> {
  if (!integrations.airtable()) return { ok: false, status: 0, error: "not_configured" };
  const lead = await getLead(leadId);
  if (!lead?.qualified) return { ok: true, data: null };
  const booking = await getActiveBookingForLead(lead.id);

  let recordId = lead.airtable_record_id;
  let current: Record<string, unknown> | undefined;
  if (!recordId) {
    const found = await findRecord(contactFormula(lead.email, lead.phone));
    if (!found.ok) return found;
    recordId = found.data?.id ?? null;
    current = found.data?.fields;
  }

  const result = recordId
    ? await updateRecord(recordId, fieldsForExistingRow(lead, booking, now, current, { keepStage: reason === "applied" }))
    : await createRecord(fieldsForNewRow(lead, booking, now));
  if (!result.ok) {
    console.error(`[airtable] ${reason} ${lead.id}: ${result.status} ${result.error}`);
    return result;
  }
  if (result.data.id !== lead.airtable_record_id) await setAirtableRecordId(lead.id, result.data.id);
  return { ok: true, data: { recordId: result.data.id, created: !recordId } };
}

/** Fire-and-forget after the response; a no-op until Airtable is configured. */
export function queueAirtableSync(leadId: string, reason: AirtableSyncReason): void {
  if (!integrations.airtable()) return;
  after(async () => {
    await syncLeadToAirtable(leadId, reason).catch((error) => console.error(`[airtable] ${reason} ${leadId}:`, error));
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
