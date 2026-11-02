import "server-only";
import { getDb } from "@/lib/db";

export type LeadEvent = {
  id: string;
  event_name: string;
  event_id: string;
  action_source: string;
  value: number | null;
  status: "sent" | "failed" | "skipped";
  skip_reason: string | null;
  events_received: number | null;
  fbtrace_id: string | null;
  error: string | null;
  test_event_code: string | null;
  created_at: Date;
};

export async function logLeadEvent(entry: {
  leadId: string | null;
  eventName: string;
  eventId: string;
  actionSource: string;
  value?: number | null;
  status: LeadEvent["status"];
  skipReason?: string | null;
  eventsReceived?: number | null;
  fbtraceId?: string | null;
  error?: string | null;
  testEventCode?: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.query(
    `insert into lead_events (lead_id, event_name, event_id, action_source, value, status, skip_reason,
       events_received, fbtrace_id, error, test_event_code)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      entry.leadId,
      entry.eventName,
      entry.eventId,
      entry.actionSource,
      entry.value ?? null,
      entry.status,
      entry.skipReason ?? null,
      entry.eventsReceived ?? null,
      entry.fbtraceId ?? null,
      entry.error ?? null,
      entry.testEventCode ?? null,
    ],
  );
}

/** True if this exact event already reached Meta (live, not a test event). */
export async function wasEventSent(eventId: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.query<{ ok: boolean }>(
    "select true as ok from lead_events where event_id = $1 and status = 'sent' and test_event_code is null limit 1",
    [eventId],
  );
  return rows.length > 0;
}

/** True if this event was already logged as skipped for this reason (one row per event, not per retry). */
export async function wasEventSkipped(eventId: string, reason: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.query<{ ok: boolean }>(
    "select true as ok from lead_events where event_id = $1 and status = 'skipped' and skip_reason = $2 limit 1",
    [eventId, reason],
  );
  return rows.length > 0;
}

export async function listLeadEvents(leadId: string): Promise<LeadEvent[]> {
  const db = await getDb();
  return db.query<LeadEvent>(
    `select id::text as id, event_name, event_id, action_source, value::float8 as value, status, skip_reason,
            events_received, fbtrace_id, error, test_event_code, created_at
       from lead_events where lead_id = $1 order by created_at desc`,
    [leadId],
  );
}

/** Per-event delivery counts; `failed` only counts failures no retry has fixed yet. */
export async function eventHealth(sinceHours = 24 * 7) {
  const db = await getDb();
  return db.query<{ event_name: string; sent: number; failed: number; skipped: number; last_at: Date | null }>(
    `select e.event_name,
            count(*) filter (where e.status = 'sent')::int as sent,
            count(*) filter (where e.status = 'failed' and not exists (
              select 1 from lead_events s where s.event_id = e.event_id and s.status = 'sent'))::int as failed,
            count(*) filter (where e.status = 'skipped')::int as skipped,
            max(e.created_at) as last_at
       from lead_events e
      where e.created_at > now() - ($1::int * interval '1 hour')
      group by e.event_name order by e.event_name`,
    [sinceHours],
  );
}
