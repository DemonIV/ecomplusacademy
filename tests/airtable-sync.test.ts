import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ after: (task: () => unknown) => void task() }));
vi.mock("@/lib/db/leads", () => ({
  getLead: vi.fn(),
  leadsMissingAirtable: vi.fn(async () => []),
  setAirtableRecordId: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db/bookings", () => ({ getActiveBookingForLead: vi.fn(async () => null) }));

import { AIRTABLE } from "@/config/airtable";
import { factsFromInvitee, newRowFields } from "@/lib/airtable/map";
import { syncInviteeToAirtable, syncLeadToAirtable } from "@/lib/airtable/sync";
import type { CalendlyEvent, CalendlyInvitee } from "@/lib/calendly/types";
import { getActiveBookingForLead } from "@/lib/db/bookings";
import { getLead, setAirtableRecordId } from "@/lib/db/leads";

/** The Airtable requests the sync makes, against a fake API. */

const F = AIRTABLE.fields;
const EVENT_URI = "https://api.calendly.com/scheduled_events/EVT123";
const NOW = new Date("2026-11-15T09:00:00.000Z");

type Call = { method: string; url: URL; body: { records?: Array<{ id?: string; fields: Record<string, unknown> }>; typecast?: boolean } | null };
let calls: Call[] = [];
let respond: (call: Call) => { status?: number; body: unknown } = () => ({ body: { records: [] } });

beforeAll(() => {
  process.env.AIRTABLE_TOKEN = "patTEST";
  process.env.AIRTABLE_BASE_ID = "appTEST";
  process.env.SITE_URL = "https://site.test";
});

beforeEach(() => {
  calls = [];
  vi.mocked(setAirtableRecordId).mockClear();
  vi.mocked(getActiveBookingForLead).mockResolvedValue(null);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const call: Call = { method: init?.method ?? "GET", url: new URL(input), body: init?.body ? JSON.parse(String(init.body)) : null };
      calls.push(call);
      const { status = 200, body } = respond(call);
      return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

const invitee = (overrides: Partial<CalendlyInvitee> = {}): CalendlyInvitee => ({
  uri: `${EVENT_URI}/invitees/INV1`,
  email: "mehmet@example.com",
  name: "Mehmet Demir",
  status: "active",
  created_at: "2026-11-14T09:00:00.000000Z",
  updated_at: "2026-11-14T09:00:00.000000Z",
  event: EVENT_URI,
  questions_and_answers: [
    { question: "Telefon numaran (WhatsApp)", answer: "0532 765 43 21" },
    { question: "Instagram kullanıcı adın", answer: "mehmet.dmr" },
  ],
  ...overrides,
});

const event = (overrides: Partial<CalendlyEvent> = {}): CalendlyEvent => ({
  uri: EVENT_URI,
  name: "Ecom Plus Academy | Ücretsiz Ön Görüşme",
  status: "active",
  start_time: "2026-11-18T11:00:00.000000Z",
  end_time: "2026-11-18T11:30:00.000000Z",
  event_memberships: [{ user_name: "Onur Yeşil" }],
  ...overrides,
});

const created = (id: string) => ({ body: { records: [{ id, fields: {} }] } });

describe("Calendly bookings without an application", () => {
  it("leave event types that are not sales calls alone", async () => {
    const result = await syncInviteeToAirtable(invitee(), event({ name: "Ecom Plus Academy | Eğitim Görüşmesi (H)" }), NOW);
    expect(result).toEqual({ ok: true, data: null });
    expect(calls).toHaveLength(0);
  });

  it("open a row when nobody matches", async () => {
    respond = (call) => (call.method === "POST" ? created("recNEW00000000001") : { body: { records: [] } });
    const result = await syncInviteeToAirtable(invitee(), event(), NOW);
    expect(result).toEqual({ ok: true, data: { recordId: "recNEW00000000001", action: "created" } });
    expect(calls.map((c) => c.method)).toEqual(["GET", "POST"]);
    expect(calls[0].url.pathname).toBe("/v0/appTEST/Leadler");
    expect(calls[0].url.searchParams.get("filterByFormula")).toContain(`{Calendly Event ID} = "EVT123"`);
    expect(calls[1].body?.typecast).toBe(true);
    expect(calls[1].body?.records?.[0].fields).toMatchObject({
      [F.name]: "Mehmet Demir",
      [F.stage]: "Randevu alındı",
      [F.closer]: "Onur",
      [F.phone]: "+90 532 765 43 21",
      [F.instagram]: "@mehmet.dmr",
    });
  });

  it("write only the difference on the team's row, and nothing when it is up to date", async () => {
    const dmRow = { id: "recDM000000000001", fields: { [F.name]: "mehmet.dmr", [F.stage]: "Randevu linki gönderildi", [F.instagram]: "@mehmet.dmr" } };
    respond = (call) => (call.method === "PATCH" ? { body: { records: [dmRow] } } : { body: { records: [dmRow] } });
    const result = await syncInviteeToAirtable(invitee(), event(), NOW);
    expect(result).toEqual({ ok: true, data: { recordId: "recDM000000000001", action: "updated" } });
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.body?.records?.[0].id).toBe("recDM000000000001");
    expect(patch?.body?.records?.[0].fields).toMatchObject({ [F.stage]: "Randevu alındı", [F.calendlyEvent]: "EVT123" });
    expect(patch?.body?.records?.[0].fields).not.toHaveProperty(F.name);

    calls = [];
    const upToDate = { id: "recDM000000000001", fields: newRowFields(factsFromInvitee(invitee(), event(), NOW)) };
    respond = () => ({ body: { records: [upToDate] } });
    expect(await syncInviteeToAirtable(invitee(), event(), NOW)).toEqual({
      ok: true,
      data: { recordId: "recDM000000000001", action: "unchanged" },
    });
    expect(calls.map((c) => c.method)).toEqual(["GET"]);
  });

  it("apply a cancellation only to the row showing that call", async () => {
    respond = () => ({ body: { records: [{ id: "recDM000000000001", fields: { [F.email]: "mehmet@example.com", [F.calendlyEvent]: "NEWER" } }] } });
    expect(await syncInviteeToAirtable(invitee({ status: "canceled" }), event(), NOW)).toEqual({ ok: true, data: null });
    expect(calls.map((c) => c.method)).toEqual(["GET"]);

    calls = [];
    respond = () => ({ body: { records: [] } });
    expect(await syncInviteeToAirtable(invitee({ status: "canceled" }), event(), NOW)).toEqual({ ok: true, data: null });
    expect(calls.map((c) => c.method)).toEqual(["GET"]); // never opens a row

    calls = [];
    expect(await syncInviteeToAirtable(invitee({ status: "canceled", rescheduled: true }), event(), NOW)).toEqual({ ok: true, data: null });
    expect(calls).toHaveLength(0); // the new invitee brings the new time
  });
});

describe("site applicants", () => {
  const lead = (overrides: Record<string, unknown> = {}) =>
    ({
      id: "6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11",
      full_name: "Ayşe Yılmaz",
      email: "ayse@example.com",
      phone: "905321234567",
      instagram: null,
      tier: "B",
      qualified: true,
      status: "qualified",
      answers: { budget: "500_1000" },
      last_applied_at: NOW,
      first_touch: null,
      last_touch: null,
      fbclid: null,
      fbc: null,
      fbp: null,
      deal_value: null,
      closed_at: null,
      lost_reason: null,
      airtable_record_id: null,
      ...overrides,
    }) as never;

  it("open a row and remember it", async () => {
    vi.mocked(getLead).mockResolvedValue(lead());
    respond = (call) => (call.method === "POST" ? created("recNEW00000000002") : { body: { records: [] } });
    const result = await syncLeadToAirtable("6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11", "applied", NOW);
    expect(result).toEqual({ ok: true, data: { recordId: "recNEW00000000002", action: "created" } });
    expect(calls[1].body?.records?.[0].fields).toMatchObject({
      [F.stage]: "Yeni lead",
      [F.interest]: "Ilık",
      [F.notes]: expect.stringContaining("Panel: https://site.test/admin/leadler/6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11"),
    });
    expect(setAirtableRecordId).toHaveBeenCalledWith("6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11", "recNEW00000000002");
  });

  it("do not bring back a row the team deleted", async () => {
    vi.mocked(getLead).mockResolvedValue(lead({ status: "booked", airtable_record_id: "recGONE0000000001" }));
    respond = (call) =>
      call.url.pathname.endsWith("/recGONE0000000001")
        ? { status: 404, body: { error: { type: "MODEL_ID_NOT_FOUND", message: "Could not find record" } } }
        : { body: { records: [] } };
    expect(await syncLeadToAirtable("6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11", "booking", NOW)).toEqual({ ok: true, data: null });
    expect(calls.map((c) => c.method)).toEqual(["GET", "GET"]);
  });

  it("leave applicants the questions filtered out, unless the team booked them", async () => {
    vi.mocked(getLead).mockResolvedValue(lead({ qualified: false, status: "disqualified" }));
    expect(await syncLeadToAirtable("6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11", "booking", NOW)).toEqual({ ok: true, data: null });
    expect(calls).toHaveLength(0);

    vi.mocked(getActiveBookingForLead).mockResolvedValue({
      start_at: new Date("2026-11-18T11:00:00.000Z"),
      host_name: "Onur Yeşil",
      calendly_event_uri: EVENT_URI,
    } as never);
    respond = (call) => (call.method === "POST" ? created("recNEW00000000003") : { body: { records: [] } });
    const result = await syncLeadToAirtable("6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11", "booking", NOW);
    expect(result.ok && result.data?.action).toBe("created");
    expect(calls[1].body?.records?.[0].fields).toMatchObject({ [F.stage]: "Randevu alındı", [F.appointment]: "2026-11-18T11:00:00.000Z" });
  });
});
