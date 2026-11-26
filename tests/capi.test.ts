import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPayload, buildUserData, sendCapiEvent } from "@/lib/meta/capi";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

describe("CAPI payload", () => {
  it("hashes PII with Meta's normalization", () => {
    const data = buildUserData({
      email: "  Ayse.Yilmaz@Example.COM ",
      phone: "+90 532 123 45 67",
      firstName: "Işıl",
      lastName: "Öztürk-Kaya",
      externalId: "lead-1",
      fbc: "fb.1.1.abc",
      ip: "1.2.3.4",
      userAgent: "UA",
    });
    expect(data.em).toEqual([sha("ayse.yilmaz@example.com")]);
    expect(data.ph).toEqual([sha("905321234567")]);
    // Meta's casing (what the pixel sends) first, Turkish casing second.
    expect(data.fn).toEqual([sha("işıl"), sha("ışıl")]);
    expect(data.ln).toEqual([sha("öztürkkaya")]);
    expect(data.external_id).toEqual([sha("lead-1")]);
    expect(data.country).toEqual([sha("tr")]);
    expect(data.fbc).toBe("fb.1.1.abc"); // click id is never hashed
    expect(data.client_ip_address).toBe("1.2.3.4");
  });

  it("hashes names exactly like Meta's pixel does in the browser", () => {
    const data = buildUserData({ firstName: "İbrahim", lastName: "Işık" });
    // Prefixes of ud[fn] / ud[ln] that fbevents.js sent for "İbrahim Işık" in a real browser run.
    expect((data.fn as string[])[0].slice(0, 16)).toBe("f918b8fe06e37aa7");
    expect((data.ln as string[])[0].slice(0, 16)).toBe("ac996a8b611b0403");
    // Locale-free lower case turns İ into i + U+0307; Turkish casing is the second candidate.
    expect(data.fn).toEqual([sha("i̇brahim"), sha("ibrahim")]);
    expect(data.ln).toEqual([sha("işık"), sha("ışık")]);
  });

  it("sends one name hash when both casings agree", () => {
    const data = buildUserData({ firstName: "Ayşe Nur", lastName: "O'Brien" });
    expect(data.fn).toEqual([sha("ayşenur")]);
    expect(data.ln).toEqual([sha("obrien")]);
  });

  it("takes the country from a Turkish phone only", () => {
    expect(buildUserData({ phone: "905321234567" }).country).toEqual([sha("tr")]);
    expect(buildUserData({ phone: "4915112345678" })).not.toHaveProperty("country");
    expect(buildUserData({ phone: "4915112345678", country: "DE" }).country).toEqual([sha("de")]);
  });

  it("omits empty fields entirely", () => {
    const data = buildUserData({ email: "a@b.co" });
    expect(Object.keys(data).sort()).toEqual(["em"]);
  });

  it("offline sale uses phone_call and drops the page URL", () => {
    const now = Date.UTC(2026, 9, 28, 12);
    const payload = buildPayload(
      {
        eventName: "Purchase",
        eventId: "purchase_x",
        actionSource: "phone_call",
        eventSourceUrl: "https://site.test/",
        user: { email: "a@b.co" },
        customData: { value: 45000, currency: "TRY" },
      },
      now,
    );
    expect(payload).toMatchObject({
      event_name: "Purchase",
      action_source: "phone_call",
      event_id: "purchase_x",
      event_time: now / 1000,
      custom_data: { value: 45000, currency: "TRY" },
    });
    expect(payload).not.toHaveProperty("event_source_url");
  });

  it("clamps event_time into Meta's 7-day window", () => {
    const now = Date.UTC(2026, 9, 28, 12);
    const tenDaysAgo = new Date(now - 10 * 86_400_000);
    const payload = buildPayload(
      { eventName: "Purchase", eventId: "p", actionSource: "phone_call", eventTime: tenDaysAgo, user: {} },
      now,
    );
    expect(now / 1000 - payload.event_time).toBeLessThan(7 * 86_400);
    const future = buildPayload(
      { eventName: "Lead", eventId: "l", actionSource: "website", eventTime: new Date(now + 3600_000), user: {} },
      now,
    );
    expect(future.event_time).toBe(now / 1000);
  });
});

describe("CAPI request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_TEST_EVENT_CODE;
  });

  it("sends the access token in a header, never in the URL", async () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "1494967489149960";
    process.env.META_CAPI_ACCESS_TOKEN = "EAAtest";
    process.env.META_TEST_EVENT_CODE = "TEST123";
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () =>
      Response.json({ events_received: 1, fbtrace_id: "trace" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendCapiEvent({
      eventName: "Lead",
      eventId: "lead_x",
      actionSource: "website",
      eventSourceUrl: "https://site.test/",
      user: { email: "a@b.co", phone: "905321234567" },
    });

    expect(result).toMatchObject({ status: "sent", eventsReceived: 1, testEventCode: "TEST123" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v26.0/1494967489149960/events");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer EAAtest");
    const body = JSON.parse(String(init?.body));
    expect(body.test_event_code).toBe("TEST123");
    expect(body.data[0]).toMatchObject({ event_name: "Lead", event_id: "lead_x", action_source: "website" });
  });
});
