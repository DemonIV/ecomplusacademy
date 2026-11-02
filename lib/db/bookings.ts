import "server-only";
import { getDb, type Queryable } from "@/lib/db";
import type { BookingSource, BookingStatus } from "@/lib/calendly/types";

export type { BookingSource, BookingStatus };

/** Mirror of one Calendly invitee. Time and host are null until Calendly confirms them. */
export type Booking = {
  id: string;
  lead_id: string;
  host_id: string | null;
  host_name: string | null;
  host_email: string | null;
  start_at: Date | null;
  end_at: Date | null;
  status: BookingStatus;
  source: BookingSource;
  location: string | null;
  join_url: string | null;
  cancel_url: string | null;
  reschedule_url: string | null;
  calendly_event_uri: string | null;
  calendly_invitee_uri: string | null;
  calendly_updated_at: Date | null;
  cancelled_at: Date | null;
  cancel_reason: string | null;
  created_at: Date;
};

const BOOKING_COLUMNS = `
  id, lead_id, host_id, host_name, host_email, start_at, end_at, status, source, location, join_url,
  cancel_url, reschedule_url, calendly_event_uri, calendly_invitee_uri, calendly_updated_at,
  cancelled_at, cancel_reason, created_at`;

const prefixed = (alias: string) => BOOKING_COLUMNS.replace(/(\w+)/g, `${alias}.$1`);

export async function getLatestBookingForLead(leadId: string): Promise<Booking | null> {
  const db = await getDb();
  const rows = await db.query<Booking>(
    `select ${BOOKING_COLUMNS} from bookings where lead_id = $1
      order by (status = 'confirmed') desc, created_at desc limit 1`,
    [leadId],
  );
  return rows[0] ?? null;
}

export async function getActiveBookingForLead(leadId: string, q?: Queryable): Promise<Booking | null> {
  const db = q ?? (await getDb());
  const rows = await db.query<Booking>(
    `select ${BOOKING_COLUMNS} from bookings where lead_id = $1 and status = 'confirmed' limit 1`,
    [leadId],
  );
  return rows[0] ?? null;
}

export async function getBookingByInvitee(inviteeUri: string, q?: Queryable): Promise<Booking | null> {
  const db = q ?? (await getDb());
  const rows = await db.query<Booking>(`select ${BOOKING_COLUMNS} from bookings where calendly_invitee_uri = $1`, [
    inviteeUri,
  ]);
  return rows[0] ?? null;
}

export type BookingWithHost = Booking & { host_label: string | null };

export async function listBookingsForLead(leadId: string): Promise<BookingWithHost[]> {
  const db = await getDb();
  return db.query<BookingWithHost>(
    `select ${prefixed("b")}, coalesce(m.name, b.host_name) as host_label
       from bookings b left join team_members m on m.id = b.host_id
      where b.lead_id = $1 order by b.created_at desc`,
    [leadId],
  );
}

export type BookingUpsert = {
  leadId: string;
  hostId: string | null;
  hostName: string | null;
  hostEmail: string | null;
  start: Date | null;
  end: Date | null;
  status: BookingStatus;
  source: BookingSource;
  location: string | null;
  joinUrl: string | null;
  cancelUrl: string | null;
  rescheduleUrl: string | null;
  eventUri: string | null;
  inviteeUri: string;
  updatedAt: Date | null;
  cancelReason: string | null;
};

/**
 * Inserts or refreshes the row for one Calendly invitee. Known values are
 * never wiped by a sparser update (e.g. a funnel record without API data);
 * `source` keeps where the booking was first seen.
 */
export async function upsertCalendlyBooking(
  q: Queryable,
  data: BookingUpsert,
): Promise<{ booking: Booking; inserted: boolean }> {
  const rows = await q.query<Booking & { inserted: boolean }>(
    `insert into bookings (
       lead_id, host_id, host_name, host_email, start_at, end_at, status, source, location, join_url,
       cancel_url, reschedule_url, calendly_event_uri, calendly_invitee_uri, calendly_updated_at,
       cancelled_at, cancel_reason
     ) values (
       $1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9, $10, $11, $12, $13, $14, $15::timestamptz,
       case when $7 = 'confirmed' then null else now() end, $16
     )
     on conflict (calendly_invitee_uri) do update set
       lead_id = excluded.lead_id,
       host_id = coalesce(excluded.host_id, bookings.host_id),
       host_name = coalesce(excluded.host_name, bookings.host_name),
       host_email = coalesce(excluded.host_email, bookings.host_email),
       start_at = coalesce(excluded.start_at, bookings.start_at),
       end_at = coalesce(excluded.end_at, bookings.end_at),
       status = excluded.status,
       location = coalesce(excluded.location, bookings.location),
       join_url = coalesce(excluded.join_url, bookings.join_url),
       cancel_url = coalesce(excluded.cancel_url, bookings.cancel_url),
       reschedule_url = coalesce(excluded.reschedule_url, bookings.reschedule_url),
       calendly_event_uri = coalesce(excluded.calendly_event_uri, bookings.calendly_event_uri),
       calendly_updated_at = coalesce(excluded.calendly_updated_at, bookings.calendly_updated_at),
       cancelled_at = case when excluded.status = 'confirmed' then null else coalesce(bookings.cancelled_at, now()) end,
       cancel_reason = excluded.cancel_reason,
       updated_at = now()
     returning ${BOOKING_COLUMNS}, (xmax = 0) as inserted`,
    [
      data.leadId,
      data.hostId,
      data.hostName,
      data.hostEmail,
      data.start?.toISOString() ?? null,
      data.end?.toISOString() ?? null,
      data.status,
      data.source,
      data.location,
      data.joinUrl,
      data.cancelUrl,
      data.rescheduleUrl,
      data.eventUri,
      data.inviteeUri,
      data.updatedAt?.toISOString() ?? null,
      data.cancelReason,
    ],
  );
  const { inserted, ...booking } = rows[0];
  return { booking, inserted: Boolean(inserted) };
}

/**
 * One upcoming call per lead: a newer Calendly booking replaces the older
 * one in the panel (the lead booked again instead of using the reschedule link).
 */
export async function supersedeOtherBookings(q: Queryable, leadId: string, keepInviteeUri: string): Promise<number> {
  const rows = await q.query(
    `update bookings set status = 'rescheduled', cancelled_at = now(), cancel_reason = 'superseded', updated_at = now()
      where lead_id = $1 and status = 'confirmed' and calendly_invitee_uri is distinct from $2
      returning id`,
    [leadId, keepInviteeUri],
  );
  return rows.length;
}

/** Last Calendly `updated_at` we stored per event, so the sync skips unchanged events. */
export async function knownEventVersions(eventUris: string[]): Promise<Map<string, number>> {
  if (!eventUris.length) return new Map();
  const db = await getDb();
  const rows = await db.query<{ uri: string; updated: Date | null }>(
    `select calendly_event_uri as uri, max(calendly_updated_at) as updated from bookings
      where calendly_event_uri = any(string_to_array($1, ','))
      group by calendly_event_uri`,
    [eventUris.join(",")],
  );
  return new Map(rows.map((r) => [r.uri, r.updated?.getTime() ?? 0]));
}

/**
 * Calendly hosts with no panel account (missing, or a different e-mail):
 * their calls are recorded but belong to nobody in the agenda.
 */
export async function unassignedHosts(): Promise<Array<{ host_email: string; host_name: string | null; calls: number }>> {
  const db = await getDb();
  return db.query(
    `select host_email, max(host_name) as host_name, count(*)::int as calls from bookings
      where host_id is null and host_email is not null and created_at > now() - interval '60 days'
      group by host_email order by calls desc limit 10`,
  );
}

/** Funnel bookings recorded before the API key existed (no time yet). */
export async function bookingsMissingDetails(limit = 50): Promise<Booking[]> {
  const db = await getDb();
  return db.query<Booking>(
    `select ${BOOKING_COLUMNS} from bookings
      where status = 'confirmed' and start_at is null and calendly_invitee_uri is not null
      order by created_at desc limit $1`,
    [limit],
  );
}

export type AgendaItem = Booking & {
  start_at: Date;
  end_at: Date;
  lead_full_name: string;
  lead_first_name: string | null;
  lead_phone: string;
  lead_email: string;
  lead_status: string;
  lead_tier: string | null;
  host_label: string | null;
};

const AGENDA_SELECT = `
  select ${prefixed("b")},
         l.full_name as lead_full_name, l.first_name as lead_first_name, l.phone as lead_phone,
         l.email as lead_email, l.status as lead_status, l.tier as lead_tier,
         coalesce(m.name, b.host_name) as host_label
    from bookings b
    join leads l on l.id = b.lead_id
    left join team_members m on m.id = b.host_id`;

export async function agenda(from: Date, to: Date, hostId?: string): Promise<AgendaItem[]> {
  const db = await getDb();
  return db.query<AgendaItem>(
    `${AGENDA_SELECT}
      where b.status = 'confirmed' and b.start_at >= $1::timestamptz and b.start_at < $2::timestamptz
        and ($3::uuid is null or b.host_id = $3::uuid)
      order by b.start_at asc`,
    [from.toISOString(), to.toISOString(), hostId ?? null],
  );
}

/** Calls whose time has passed but whose lead still has no outcome. */
export async function callsAwaitingOutcome(hostId?: string): Promise<AgendaItem[]> {
  const db = await getDb();
  return db.query<AgendaItem>(
    `${AGENDA_SELECT}
      where b.status = 'confirmed' and b.end_at < now() and l.status = 'booked'
        and ($1::uuid is null or b.host_id = $1::uuid)
      order by b.start_at asc`,
    [hostId ?? null],
  );
}
