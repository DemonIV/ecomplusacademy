import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildPayload, buildUserData } from "@/lib/meta/capi";

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
    expect(data.fn).toEqual([sha("ışıl")]);
    expect(data.ln).toEqual([sha("öztürkkaya")]);
    expect(data.external_id).toEqual([sha("lead-1")]);
    expect(data.country).toEqual([sha("tr")]);
    expect(data.fbc).toBe("fb.1.1.abc"); // click id is never hashed
    expect(data.client_ip_address).toBe("1.2.3.4");
  });

  it("omits empty fields entirely", () => {
    const data = buildUserData({ email: "a@b.co" });
    expect(Object.keys(data).sort()).toEqual(["country", "em"]);
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
