import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import type { Queryable } from "@/lib/db";
import { supersedeOtherBookings, upsertCalendlyBooking, type BookingUpsert } from "@/lib/db/bookings";
import { applyMigrations } from "@/lib/db/migrate";

/**
 * Runs the real migrations on an in-memory Postgres and checks the booking
 * rules the database enforces on its own, plus the Calendly upsert SQL.
 */

let pg: PGlite;
let q: Queryable;
let hostId: string;
const leadIds: string[] = [];

const migrate = () =>
  applyMigrations(
    (sql) => pg.exec(sql).then(() => undefined),
    async (sql, params) => (await pg.query(sql, params)).rows as Record<string, unknown>[],
  );

async function insertLead(email: string): Promise<string> {
  const { rows } = await pg.query<{ id: string }>(
    `insert into leads (full_name, email, phone, answers, score, qualified, status, kvkk_consent_at)
     values ('Test Kişi', $1, '905321234567', '{}'::jsonb, 80, true, 'qualified', now()) returning id`,
    [email],
  );
  return rows[0].id;
}

const eventUri = (n: number) => `https://api.calendly.com/scheduled_events/EVT${n}`;
const inviteeUri = (n: number) => `${eventUri(n)}/invitees/INV${n}`;

function invitee(leadId: string, n: number, overrides: Partial<BookingUpsert> = {}): BookingUpsert {
  return {
    leadId,
    hostId: null,
    hostName: "Mert Kaya",
    hostEmail: "closer@site.test",
    start: new Date(Date.UTC(2026, 10, n, 8, 0)),
    end: new Date(Date.UTC(2026, 10, n, 8, 30)),
    status: "confirmed",
    source: "webhook",
    location: "Biz arıyoruz: +905321234567",
    joinUrl: null,
    cancelUrl: `https://calendly.com/cancellations/INV${n}`,
    rescheduleUrl: `https://calendly.com/reschedulings/INV${n}`,
    eventUri: eventUri(n),
    inviteeUri: inviteeUri(n),
    updatedAt: new Date("2026-11-01T09:00:00Z"),
    cancelReason: null,
    ...overrides,
  };
}

beforeAll(async () => {
  pg = await PGlite.create({ extensions: { btree_gist } });
  q = { query: async <T>(text: string, params?: unknown[]) => (await pg.query(text, params)).rows as T[] };
  const ran = await migrate();
  expect(ran).toEqual(["0001_init.sql", "0002_calendly.sql"]);
  const { rows } = await pg.query<{ id: string }>(
    "insert into team_members (email, name, role, accepts_bookings) values ('closer@site.test', 'Closer', 'closer', true) returning id",
  );
  hostId = rows[0].id;
  for (const n of [1, 2, 3, 4, 5]) leadIds.push(await insertLead(`lead${n}@site.test`));
});

describe("migrations", () => {
  it("are idempotent", async () => {
    expect(await migrate()).toEqual([]);
  });

  it("removed the in-house calendar columns", async () => {
    const { rows } = await pg.query<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_name in ('bookings', 'team_members')
          and (column_name like 'google%' or column_name in ('weekly_hours', 'max_per_day', 'meet_url', 'meeting_mode'))`,
    );
    expect(rows).toEqual([]);
  });
});

describe("Calendly bookings", () => {
  it("upserting the same invitee is idempotent and never wipes known values", async () => {
    const first = await upsertCalendlyBooking(q, invitee(leadIds[0], 3));
    expect(first.inserted).toBe(true);
    expect(first.booking.start_at?.toISOString()).toBe("2026-11-03T08:00:00.000Z");

    const again = await upsertCalendlyBooking(q, invitee(leadIds[0], 3, { source: "sync" }));
    expect(again.inserted).toBe(false);
    expect(again.booking.id).toBe(first.booking.id);
    expect(again.booking.source).toBe("webhook"); // where it was first seen

    // A sparser record (funnel, before the API key) keeps time, host and links.
    const sparse = await upsertCalendlyBooking(
      q,
      invitee(leadIds[0], 3, { start: null, end: null, hostName: null, hostEmail: null, location: null, cancelUrl: null }),
    );
    expect(sparse.booking).toMatchObject({ id: first.booking.id, host_name: "Mert Kaya", location: "Biz arıyoruz: +905321234567" });
    expect(sparse.booking.start_at?.toISOString()).toBe("2026-11-03T08:00:00.000Z");
    expect(sparse.booking.cancel_url).toBe("https://calendly.com/cancellations/INV3");

    const { rows } = await pg.query("select id from bookings where calendly_invitee_uri = $1", [inviteeUri(3)]);
    expect(rows).toHaveLength(1);
  });

  it("cancelling stamps cancelled_at; the same invitee can come back", async () => {
    const cancelled = await upsertCalendlyBooking(
      q,
      invitee(leadIds[0], 3, { status: "cancelled", cancelReason: "lead_cancelled" }),
    );
    expect(cancelled.booking).toMatchObject({ status: "cancelled", cancel_reason: "lead_cancelled" });
    expect(cancelled.booking.cancelled_at).toBeInstanceOf(Date);

    const back = await upsertCalendlyBooking(q, invitee(leadIds[0], 3));
    expect(back.booking).toMatchObject({ status: "confirmed", cancel_reason: null, cancelled_at: null });
  });

  it("a lead holds one confirmed booking; a newer one supersedes the old", async () => {
    await upsertCalendlyBooking(q, invitee(leadIds[1], 4));
    await expect(upsertCalendlyBooking(q, invitee(leadIds[1], 5))).rejects.toMatchObject({ code: "23505" });

    expect(await supersedeOtherBookings(q, leadIds[1], inviteeUri(5))).toBe(1);
    const newer = await upsertCalendlyBooking(q, invitee(leadIds[1], 5));
    expect(newer.inserted).toBe(true);

    const { rows } = await pg.query<{ status: string; cancel_reason: string | null }>(
      "select status, cancel_reason from bookings where calendly_invitee_uri = $1",
      [inviteeUri(4)],
    );
    expect(rows[0]).toEqual({ status: "rescheduled", cancel_reason: "superseded" });
    // Superseding again is a no-op for the booking it keeps.
    expect(await supersedeOtherBookings(q, leadIds[1], inviteeUri(5))).toBe(0);
  });

  it("double booking is Calendly's job now: one host may appear twice at a time", async () => {
    await upsertCalendlyBooking(q, invitee(leadIds[2], 6, { hostId, inviteeUri: `${eventUri(6)}/invitees/A` }));
    await upsertCalendlyBooking(q, invitee(leadIds[3], 6, { hostId, inviteeUri: `${eventUri(6)}/invitees/B` }));
  });

  it("allows an unknown time but rejects end before start", async () => {
    const pending = await upsertCalendlyBooking(q, invitee(leadIds[4], 7, { start: null, end: null, hostName: null }));
    expect(pending.booking.start_at).toBeNull();
    await expect(
      upsertCalendlyBooking(
        q,
        invitee(leadIds[4], 8, { status: "cancelled", start: new Date("2026-11-08T09:00:00Z"), end: new Date("2026-11-08T08:00:00Z") }),
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("deleting a team member keeps their bookings", async () => {
    const { rows } = await pg.query<{ id: string }>(
      "insert into team_members (email, name, role) values ('gone@site.test', 'Gone', 'closer') returning id",
    );
    const { booking } = await upsertCalendlyBooking(
      q,
      invitee(leadIds[4], 9, { hostId: rows[0].id, status: "cancelled", cancelReason: "team_cancelled" }),
    );
    await pg.query("delete from team_members where id = $1", [rows[0].id]);
    const after = await pg.query<{ host_id: string | null; host_name: string }>(
      "select host_id, host_name from bookings where id = $1",
      [booking.id],
    );
    expect(after.rows[0]).toEqual({ host_id: null, host_name: "Mert Kaya" });
  });

  it("rejects unknown sources", async () => {
    await expect(
      upsertCalendlyBooking(q, invitee(leadIds[4], 10, { status: "cancelled", source: "email" as never })),
    ).rejects.toMatchObject({ code: "23514" });
  });
});

describe("rate limit counter", () => {
  it("counts within a window and resets after it", async () => {
    const sql = `insert into rate_limits (key, window_start, count) values ($1, now(), 1)
      on conflict (key) do update set
        count = case when rate_limits.window_start < now() - ($2::int * interval '1 second') then 1 else rate_limits.count + 1 end,
        window_start = case when rate_limits.window_start < now() - ($2::int * interval '1 second') then now() else rate_limits.window_start end
      returning count`;
    const counts = [];
    for (let i = 0; i < 3; i++) counts.push((await pg.query<{ count: number }>(sql, ["k", 600])).rows[0].count);
    expect(counts).toEqual([1, 2, 3]);
    await pg.query("update rate_limits set window_start = now() - interval '1 hour' where key = 'k'");
    expect((await pg.query<{ count: number }>(sql, ["k", 600])).rows[0].count).toBe(1);
  });
});
