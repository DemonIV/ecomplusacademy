import { describe, expect, it } from "vitest";
import { calendlyUrl, INVITEE_URI, isCalendlyEventUrl, toE164 } from "@/lib/calendly/link";
import { bookingFields, bookingStatusOf, leadRefFromInvitee, locationLabel, phoneFromInvitee } from "@/lib/calendly/map";
import { signCalendlyBody, verifyCalendlySignature } from "@/lib/calendly/signature";
import type { CalendlyEvent, CalendlyInvitee } from "@/lib/calendly/types";

const LEAD = "6f1c2f1e-8d1b-4a51-9b7e-2f6b7c9d0a11";
const EVENT_URI = "https://api.calendly.com/scheduled_events/EVT123";
const INVITEE = `${EVENT_URI}/invitees/INV456`;

function invitee(overrides: Partial<CalendlyInvitee> = {}): CalendlyInvitee {
  return {
    uri: INVITEE,
    email: "Ayse@Example.com ",
    name: "Ayşe Yılmaz",
    status: "active",
    created_at: "2026-11-01T09:00:00.000000Z",
    event: EVENT_URI,
    cancel_url: "https://calendly.com/cancellations/INV456",
    reschedule_url: "https://calendly.com/reschedulings/INV456",
    tracking: { salesforce_uuid: LEAD, utm_source: "facebook" },
    ...overrides,
  };
}

function event(overrides: Partial<CalendlyEvent> = {}): CalendlyEvent {
  return {
    uri: EVENT_URI,
    status: "active",
    start_time: "2026-11-03T11:00:00.000000Z",
    end_time: "2026-11-03T11:30:00.000000Z",
    updated_at: "2026-11-01T09:00:01.000000Z",
    location: { type: "outbound_call", location: "+90 532 123 45 67" },
    event_memberships: [{ user: "https://api.calendly.com/users/U1", user_email: "Closer@Ekip.com", user_name: "Mert Kaya" }],
    ...overrides,
  };
}

describe("webhook signature", () => {
  const key = "test-signing-key-0123456789abcdef0123";
  const body = JSON.stringify({ event: "invitee.created", payload: { uri: INVITEE } });
  const now = Date.parse("2026-11-01T09:00:00Z");

  it("accepts Calendly's format", () => {
    const header = signCalendlyBody(body, key, now);
    expect(header).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/);
    expect(verifyCalendlySignature(header, body, key, now + 30_000)).toBe(true);
  });

  it("rejects a tampered body, a wrong key and malformed headers", () => {
    const header = signCalendlyBody(body, key, now);
    expect(verifyCalendlySignature(header, body.replace("created", "canceled"), key, now)).toBe(false);
    expect(verifyCalendlySignature(header, body, "another-key", now)).toBe(false);
    expect(verifyCalendlySignature(null, body, key, now)).toBe(false);
    expect(verifyCalendlySignature("t=abc,v1=00", body, key, now)).toBe(false);
    expect(verifyCalendlySignature(header, body, "", now)).toBe(false);
  });

  it("rejects replays older than the tolerance", () => {
    const header = signCalendlyBody(body, key, now);
    expect(verifyCalendlySignature(header, body, key, now + 4 * 60_000)).toBe(false);
    expect(verifyCalendlySignature(header, body, key, now - 4 * 60_000)).toBe(false);
  });
});

describe("scheduling link", () => {
  const base = "https://calendly.com/ecomplus/strateji-gorusmesi";

  it("pre-fills contact details and ties the booking to the lead", () => {
    const url = new URL(
      calendlyUrl(base, {
        name: "Ayşe Yılmaz",
        email: "ayse@example.com",
        phone: toE164("905321234567"),
        leadId: LEAD,
        utm: { utm_source: "facebook", utm_campaign: "kasim lansman", utm_content: null },
      }),
    );
    expect(url.origin + url.pathname).toBe(base);
    expect(url.searchParams.get("name")).toBe("Ayşe Yılmaz");
    expect(url.searchParams.get("email")).toBe("ayse@example.com");
    // Zoom location: Calendly must not receive the phone as a location.
    expect(url.searchParams.has("location")).toBe(false);
    expect(url.searchParams.get("salesforce_uuid")).toBe(LEAD);
    expect(url.searchParams.get("utm_campaign")).toBe("kasim lansman");
    expect(url.searchParams.has("utm_content")).toBe(false);
    expect(url.searchParams.has("embed_domain")).toBe(false);
  });

  it("encodes spaces as %20, as Calendly documents", () => {
    const url = calendlyUrl(base, { name: "Ayşe Yılmaz" });
    expect(url).toContain("name=Ay%C5%9Fe%20Y%C4%B1lmaz");
    expect(url).not.toContain("+");
  });

  it("adds embed and colour parameters only for the inline embed", () => {
    const url = new URL(
      calendlyUrl(base, {}, { embed: { domain: "ecomplus.com", colors: { background: "131316", text: "f2efe9", primary: "d8b06f" } } }),
    );
    expect(url.searchParams.get("embed_domain")).toBe("ecomplus.com");
    expect(url.searchParams.get("embed_type")).toBe("Inline");
    expect(url.searchParams.get("primary_color")).toBe("d8b06f");
  });

  it("also fills a custom phone question when configured", () => {
    const url = new URL(calendlyUrl(base, { phone: "+905321234567" }, { phoneAnswer: "a2" }));
    expect(url.searchParams.get("a2")).toBe("+905321234567");
    const ignored = new URL(calendlyUrl(base, { phone: "+905321234567" }, { phoneAnswer: "x; drop" }));
    expect([...ignored.searchParams.keys()]).toEqual([]);
  });

  it("drops an existing query string from the base link", () => {
    expect(calendlyUrl(`${base}?month=2026-11`, {})).toBe(base);
  });

  it("validates event links, invitee URIs and phone digits", () => {
    expect(isCalendlyEventUrl(base)).toBe(true);
    expect(isCalendlyEventUrl("https://calendly.com/ecomplus")).toBe(true);
    expect(isCalendlyEventUrl("https://calendly.com.evil.io/x")).toBe(false);
    expect(isCalendlyEventUrl("http://calendly.com/x")).toBe(false);
    expect(INVITEE_URI.test(INVITEE)).toBe(true);
    expect(INVITEE_URI.test(`${INVITEE}/../../users/me`)).toBe(false);
    expect(INVITEE_URI.test("https://api.calendly.com.evil.io/scheduled_events/E/invitees/I")).toBe(false);
    expect(toE164("905321234567")).toBe("+905321234567");
    expect(toE164("")).toBeNull();
    expect(toE164("+90532")).toBeNull();
  });
});

describe("invitee → booking mapping", () => {
  it("finds the lead by salesforce_uuid, normalised e-mail and phone", () => {
    expect(leadRefFromInvitee(invitee(), event())).toEqual({
      leadId: LEAD,
      email: "ayse@example.com",
      phone: "905321234567",
    });
    const untracked = leadRefFromInvitee(invitee({ tracking: { salesforce_uuid: "not-a-uuid" } }), event());
    expect(untracked.leadId).toBeNull();
    expect(untracked.email).toBe("ayse@example.com");
  });

  it("reads the phone from the call location, then SMS reminders, then answers", () => {
    expect(phoneFromInvitee(invitee(), event())).toBe("905321234567");
    expect(phoneFromInvitee(invitee({ text_reminder_number: "0532 765 43 21" }), event({ location: { type: "zoom" } }))).toBe(
      "905327654321",
    );
    expect(
      phoneFromInvitee(
        invitee({ questions_and_answers: [{ question: "WhatsApp numaran", answer: "5551112233" }] }),
        event({ location: null }),
      ),
    ).toBe("905551112233");
    expect(
      phoneFromInvitee(invitee({ questions_and_answers: [{ question: "Hedefin ne?", answer: "5551112233" }] }), null),
    ).toBeNull();
  });

  it("maps statuses: active, cancelled, rescheduled", () => {
    expect(bookingStatusOf({ status: "active" })).toBe("confirmed");
    expect(bookingStatusOf({ status: "canceled" })).toBe("cancelled");
    expect(bookingStatusOf({ status: "canceled", rescheduled: true })).toBe("rescheduled");
    expect(bookingStatusOf({ status: "active" }, { status: "canceled" })).toBe("cancelled");
  });

  it("builds the booking row from invitee and event", () => {
    const fields = bookingFields(invitee(), event());
    expect(fields).toMatchObject({
      inviteeUri: INVITEE,
      eventUri: EVENT_URI,
      status: "confirmed",
      hostName: "Mert Kaya",
      hostEmail: "closer@ekip.com",
      location: "Biz arıyoruz: +90 532 123 45 67",
      cancelReason: null,
    });
    expect(fields.start?.toISOString()).toBe("2026-11-03T11:00:00.000Z");
    expect(fields.end?.toISOString()).toBe("2026-11-03T11:30:00.000Z");
  });

  it("records who cancelled", () => {
    const byLead = bookingFields(invitee({ status: "canceled", cancellation: { canceler_type: "invitee" } }), event());
    expect(byLead).toMatchObject({ status: "cancelled", cancelReason: "lead_cancelled" });
    const byTeam = bookingFields(
      invitee({ status: "canceled", cancellation: { canceler_type: "host" } }),
      event({ status: "canceled" }),
    );
    expect(byTeam.cancelReason).toBe("team_cancelled");
    const moved = bookingFields(invitee({ status: "canceled", rescheduled: true }), event());
    expect(moved).toMatchObject({ status: "rescheduled", cancelReason: "calendly_rescheduled" });
  });

  it("keeps the Zoom link Calendly created for the booking", () => {
    const fields = bookingFields(invitee(), event({ location: { type: "zoom", join_url: "https://us06web.zoom.us/j/123" } }));
    expect(fields).toMatchObject({ location: "Zoom", joinUrl: "https://us06web.zoom.us/j/123" });
  });

  it("works without the event (funnel record before the API key)", () => {
    const fields = bookingFields(invitee(), null);
    expect(fields).toMatchObject({ eventUri: EVENT_URI, start: null, end: null, hostEmail: null, location: null });
  });

  it("labels locations for the agenda", () => {
    expect(locationLabel({ type: "outbound_call", location: "+905321234567" })).toBe("Biz arıyoruz: +905321234567");
    expect(locationLabel({ type: "google_conference" })).toBe("Google Meet");
    expect(locationLabel({ type: "zoom", join_url: "https://us06web.zoom.us/j/123" })).toBe("Zoom");
    expect(locationLabel(null)).toBeNull();
  });
});
