import { describe, expect, it } from "vitest";
import { AIRTABLE } from "@/config/airtable";
import { checkTable } from "@/lib/airtable/check";
import {
  calendlyEventId,
  closerName,
  factsFromInvitee,
  factsFromLead,
  isSalesEvent,
  lostReasonOption,
  matchFormula,
  newRowFields,
  pickRow,
  rowChanges,
  stageFor,
  trDate,
  type AirtableFields,
  type AirtableLead,
} from "@/lib/airtable/map";
import { instagramFromInvitee } from "@/lib/calendly/map";
import type { CalendlyEvent, CalendlyInvitee } from "@/lib/calendly/types";
import { instagramHandle } from "@/lib/instagram";

const F = AIRTABLE.fields;
const NOW = new Date("2026-11-15T21:30:00.000Z"); // 16 Kasım 00:30 in Türkiye
const PANEL = "https://site.test/admin/leadler/L1";
const EVENT_URI = "https://api.calendly.com/scheduled_events/EVT123";

const lead = (overrides: Partial<AirtableLead> = {}): AirtableLead => ({
  id: "L1",
  full_name: "Ayşe Yılmaz",
  email: "ayse@example.com",
  phone: "905321234567",
  instagram: "ayse.yilmaz",
  tier: "A",
  qualified: true,
  status: "qualified",
  answers: { stage: "selling", budget: "500_1000", readiness: "now", hours: "10_20", gender: "female" },
  last_applied_at: new Date("2026-11-15T10:00:00.000Z"),
  first_touch: { ts: 1, utm_source: "facebook", utm_campaign: "Kasım", utm_term: "Set 1", utm_content: "Video 2" },
  last_touch: null,
  fbclid: "IwAR123abc",
  fbc: "fb.1.1.IwAR123abc",
  fbp: "fb.1.1.999",
  deal_value: null,
  closed_at: null,
  lost_reason: null,
  ...overrides,
});

const booking = { start_at: new Date("2026-11-18T11:00:00.000Z"), host_name: "Onur Yeşil", calendly_event_uri: EVENT_URI };

const ctx = (reason: "applied" | "booking" | "outcome" | "retry") => ({ now: NOW, reason, panelUrl: PANEL });

const NOTE = [
  "Site başvurusu – 15.11.2026",
  "Durum: Satış yapıyorum",
  "Bütçe (3 ay): 500 – 1.000 dolar",
  "Başlama: Hemen",
  "Haftalık süre: 10 – 20 saat",
  "Cinsiyet: Kadın",
  `Panel: ${PANEL}`,
].join("\n");

describe("airtable basics", () => {
  it("maps panel statuses to the team's stages", () => {
    expect(stageFor("qualified")).toBe("Yeni lead");
    expect(stageFor("booked")).toBe("Randevu alındı");
    expect(stageFor("cancelled")).toBe("Randevu almadı");
    expect(stageFor("attended")).toBe("Görüşme yapıldı – takipte");
    expect(stageFor("no_show")).toBe("Görüşmeye gelmedi");
    expect(stageFor("won")).toBe("Satış");
    expect(stageFor("lost")).toBe("Satış değil");
    expect(stageFor("disqualified")).toBeNull();
  });

  it("uses the Türkiye calendar day, first names and Calendly ids", () => {
    expect(trDate(NOW)).toBe("2026-11-16");
    expect(closerName(" Tarık Buğra Varol ")).toBe("Tarık");
    expect(closerName(null)).toBeNull();
    expect(calendlyEventId(`${EVENT_URI}/`)).toBe("EVT123");
    expect(calendlyEventId(null)).toBeNull();
  });

  it("knows the sales calls among Calendly event types", () => {
    expect(isSalesEvent({ name: "Ecom Plus Academy | Ücretsiz Ön Görüşme" })).toBe(true);
    expect(isSalesEvent({ name: "ECOM PLUS ACADEMY | ÜCRETSİZ ÖN GÖRÜŞME" })).toBe(true);
    expect(isSalesEvent({ name: "Ecom Plus Academy | Eğitim Görüşmesi (H)" })).toBe(false);
    expect(isSalesEvent({ name: "30 Minute Meeting" })).toBe(false);
    expect(isSalesEvent(null)).toBe(false);
  });

  it("maps a loss reason only to an existing option", () => {
    expect(lostReasonOption(" fiyat ")).toBe("Fiyat");
    expect(lostReasonOption("Zamanı yok")).toBe("Zamanı yok");
    expect(lostReasonOption("bütçe yetmedi")).toBeNull();
    expect(lostReasonOption(null)).toBeNull();
  });

  it("reads Instagram handles as people type them", () => {
    expect(instagramHandle("@ayse.yilmaz")).toBe("ayse.yilmaz");
    expect(instagramHandle("https://www.instagram.com/ayse.yilmaz/?hl=tr")).toBe("ayse.yilmaz");
    expect(instagramHandle("instagram.com/ayse_y")).toBe("ayse_y");
    expect(instagramHandle("Yok")).toBeNull();
    expect(instagramHandle("ayşe yılmaz")).toBeNull();
    expect(instagramHandle("1234")).toBeNull();
  });
});

describe("site applicants", () => {
  it("fill a new row with everything the site knows", () => {
    expect(newRowFields(factsFromLead(lead(), null, ctx("applied")))).toEqual({
      [F.name]: "Ayşe Yılmaz",
      [F.channel]: "Site (Calendly)",
      [F.stage]: "Yeni lead",
      [F.interest]: "Sıcak",
      [F.instagram]: "@ayse.yilmaz",
      [F.phone]: "+90 532 123 45 67",
      [F.email]: "ayse@example.com",
      [F.utmSource]: "facebook",
      [F.campaign]: "Kasım",
      [F.adSet]: "Set 1",
      [F.ad]: "Video 2",
      [F.fbclid]: "IwAR123abc",
      [F.fbc]: "fb.1.1.IwAR123abc",
      [F.fbp]: "fb.1.1.999",
      [F.notes]: NOTE,
      [F.lastContact]: "2026-11-16",
    });
  });

  it("carry the call once booked", () => {
    const fields = newRowFields(factsFromLead(lead({ status: "booked", tier: "C", instagram: null }), booking, ctx("booking")));
    expect(fields).toMatchObject({
      [F.stage]: "Randevu alındı",
      [F.appointment]: "2026-11-18T11:00:00.000Z",
      [F.closer]: "Onur",
      [F.calendlyEvent]: "EVT123",
      [F.interest]: "Soğuk",
    });
    expect(fields).not.toHaveProperty(F.instagram);
  });

  it("join the team's own row without overriding its stage, and add the application once", () => {
    const teamRow = { [F.name]: "Ayşe (DM)", [F.stage]: "Yazışılıyor", [F.instagram]: "@ayse.yilmaz", [F.notes]: "Reels'e yorum yazdı." };
    const changes = rowChanges(factsFromLead(lead(), null, ctx("applied")), teamRow, "applied");
    expect(changes).toEqual({
      [F.channel]: "Site (Calendly)",
      [F.interest]: "Sıcak",
      [F.email]: "ayse@example.com",
      [F.phone]: "+90 532 123 45 67",
      [F.utmSource]: "facebook",
      [F.campaign]: "Kasım",
      [F.adSet]: "Set 1",
      [F.ad]: "Video 2",
      [F.fbclid]: "IwAR123abc",
      [F.fbc]: "fb.1.1.IwAR123abc",
      [F.fbp]: "fb.1.1.999",
      [F.notes]: `Reels'e yorum yazdı.\n\n${NOTE}`,
      [F.lastContact]: "2026-11-16",
    });
    // The same sync again: nothing to write.
    expect(rowChanges(factsFromLead(lead(), null, ctx("applied")), { ...teamRow, ...changes }, "applied")).toEqual({});
  });

  it("follow bookings, but leave a stage the team decided after the call", () => {
    const facts = factsFromLead(lead({ status: "booked" }), booking, ctx("booking"));
    expect(rowChanges(facts, { [F.stage]: "Randevu linki gönderildi", [F.email]: "ayse@example.com" }, "booking")).toMatchObject({
      [F.stage]: "Randevu alındı",
      [F.appointment]: "2026-11-18T11:00:00.000Z",
      [F.closer]: "Onur",
      [F.calendlyEvent]: "EVT123",
      [F.lastContact]: "2026-11-16",
    });
    const decided = rowChanges(facts, { [F.stage]: "Satış değil", [F.appointment]: "2026-11-01T08:00:00.000Z" }, "booking");
    expect(decided).not.toHaveProperty(F.stage);
    expect(decided[F.appointment]).toBe("2026-11-18T11:00:00.000Z");
  });

  it("write nothing when the row already shows the booking (no Son İletişim-only updates)", () => {
    const facts = factsFromLead(lead({ status: "booked" }), booking, ctx("booking"));
    const row = { ...newRowFields(facts), [F.appointment]: "2026-11-18T11:00:00.000Z", [F.lastContact]: "2026-11-10" };
    expect(rowChanges(facts, row, "booking")).toEqual({});
  });

  it("clear the call when it is cancelled", () => {
    const facts = factsFromLead(lead({ status: "cancelled" }), null, ctx("booking"));
    expect(
      rowChanges(facts, { [F.stage]: "Randevu alındı", [F.appointment]: "2026-11-18T11:00:00.000Z", [F.calendlyEvent]: "EVT123" }, "booking"),
    ).toEqual({
      [F.stage]: "Randevu almadı",
      [F.appointment]: null,
      [F.calendlyEvent]: null,
      [F.name]: "Ayşe Yılmaz",
      [F.channel]: "Site (Calendly)",
      [F.interest]: "Sıcak",
      [F.email]: "ayse@example.com",
      [F.phone]: "+90 532 123 45 67",
      [F.instagram]: "@ayse.yilmaz",
      [F.utmSource]: "facebook",
      [F.campaign]: "Kasım",
      [F.adSet]: "Set 1",
      [F.ad]: "Video 2",
      [F.fbclid]: "IwAR123abc",
      [F.fbc]: "fb.1.1.IwAR123abc",
      [F.fbp]: "fb.1.1.999",
      [F.lastContact]: "2026-11-16",
    });
  });

  it("take a result from the panel over the team's stage, with amount or reason", () => {
    const won = factsFromLead(
      lead({ status: "won", deal_value: "45000", closed_at: new Date("2026-11-15T12:00:00.000Z") }),
      booking,
      ctx("outcome"),
    );
    const row: AirtableFields = { ...newRowFields(won), [F.stage]: "Görüşme yapıldı – takipte", [F.closer]: "Yusuf" };
    delete row[F.saleAmount];
    delete row[F.saleDate];
    expect(rowChanges(won, row, "outcome")).toEqual({
      [F.stage]: "Satış",
      [F.saleAmount]: 45000,
      [F.saleDate]: "2026-11-15",
    });
    const lost = factsFromLead(lead({ status: "lost", lost_reason: "Düşünecek" }), booking, ctx("outcome"));
    const lostRow: AirtableFields = { ...newRowFields(lost), [F.stage]: "Randevu alındı" };
    delete lostRow[F.lostReason];
    expect(rowChanges(lost, lostRow, "outcome")).toEqual({
      [F.stage]: "Satış değil",
      [F.lostReason]: "Düşünecek",
    });
  });

  it("never move Son İletişim backwards", () => {
    const facts = factsFromLead(lead({ status: "booked" }), booking, ctx("booking"));
    const changes = rowChanges(facts, { [F.stage]: "Yeni lead", [F.lastContact]: "2026-11-20" }, "booking");
    expect(changes[F.stage]).toBe("Randevu alındı");
    expect(changes).not.toHaveProperty(F.lastContact);
  });
});

describe("Calendly bookings without an application", () => {
  const invitee = (overrides: Partial<CalendlyInvitee> = {}): CalendlyInvitee => ({
    uri: `${EVENT_URI}/invitees/INV1`,
    email: "Mehmet@Example.com",
    name: " Mehmet Demir ",
    status: "active",
    created_at: "2026-11-14T09:00:00.000000Z",
    updated_at: "2026-11-14T09:00:00.000000Z",
    event: EVENT_URI,
    questions_and_answers: [
      { question: "Telefon numaran (WhatsApp)", answer: "0532 765 43 21" },
      { question: "Instagram kullanıcı adın", answer: "@mehmet.dmr" },
      { question: "Eklemek istediğin bir şey var mı?", answer: "Akşamları uygunum." },
    ],
    tracking: { utm_source: "whatsapp" },
    ...overrides,
  });
  const event: CalendlyEvent = {
    uri: EVENT_URI,
    name: "Ecom Plus Academy | Ücretsiz Ön Görüşme",
    status: "active",
    start_time: "2026-11-18T11:00:00.000000Z",
    end_time: "2026-11-18T11:30:00.000000Z",
    event_memberships: [{ user_name: "Onur Yeşil", user_email: "onur@ecomplusacademy.com" }],
  };

  it("open a row with the answers of the booking form", () => {
    expect(instagramFromInvitee(invitee())).toBe("mehmet.dmr");
    expect(newRowFields(factsFromInvitee(invitee(), event, NOW))).toEqual({
      [F.name]: "Mehmet Demir",
      [F.channel]: "WhatsApp",
      [F.stage]: "Randevu alındı",
      [F.instagram]: "@mehmet.dmr",
      [F.phone]: "+90 532 765 43 21",
      [F.email]: "mehmet@example.com",
      [F.appointment]: "2026-11-18T11:00:00.000Z",
      [F.closer]: "Onur",
      [F.calendlyEvent]: "EVT123",
      [F.utmSource]: "whatsapp",
      [F.notes]: "Calendly randevusu – Ecom Plus Academy | Ücretsiz Ön Görüşme\nEklemek istediğin bir şey var mı?: Akşamları uygunum.",
      [F.lastContact]: "2026-11-14",
    });
    // Without utm_source the event's name tells the channel: the "(Instagram)" link goes out in DMs.
    const named = (name: string) => factsFromInvitee(invitee({ tracking: null }), { ...event, name }, NOW).channel;
    expect(named("Ecom Plus Academy | Ücretsiz Ön Görüşme (Instagram)")).toBe("Instagram DM");
    expect(named("Ecom Plus Academy | Ücretsiz Ön Görüşme (Onur)")).toBe("Site (Calendly)");
  });

  it("update the team's DM row: stage, call and missing contact details, not the notes", () => {
    const dmRow = { [F.name]: "mehmet.dmr", [F.stage]: "Randevu linki gönderildi", [F.channel]: "Instagram DM", [F.instagram]: "@mehmet.dmr", [F.notes]: "DM'den yazdı." };
    expect(rowChanges(factsFromInvitee(invitee(), event, NOW), dmRow, "calendly")).toEqual({
      [F.stage]: "Randevu alındı",
      [F.appointment]: "2026-11-18T11:00:00.000Z",
      [F.closer]: "Onur",
      [F.calendlyEvent]: "EVT123",
      [F.email]: "mehmet@example.com",
      [F.phone]: "+90 532 765 43 21",
      [F.utmSource]: "whatsapp",
      [F.lastContact]: "2026-11-14",
    });
  });

  it("turn a cancellation into 'Randevu almadı' and clear the call", () => {
    const cancelled = factsFromInvitee(invitee({ status: "canceled", updated_at: "2026-11-16T08:00:00.000000Z" }), event, NOW);
    const row = { [F.stage]: "Randevu alındı", [F.appointment]: "2026-11-18T11:00:00.000Z", [F.calendlyEvent]: "EVT123", [F.email]: "mehmet@example.com" };
    expect(rowChanges(cancelled, row, "calendly")).toMatchObject({
      [F.stage]: "Randevu almadı",
      [F.appointment]: null,
      [F.calendlyEvent]: null,
      [F.lastContact]: "2026-11-16",
    });
  });
});

describe("finding the person's row", () => {
  it("matches by Calendly event, e-mail, phone tail or Instagram, quotes escaped", () => {
    expect(matchFormula({ eventId: "EVT123", email: "Ayse@Example.com", phone: "905321234567", instagram: "Ayse.Y" })).toBe(
      `OR({Calendly Event ID} = "EVT123", LOWER(TRIM({E-posta} & "")) = "ayse@example.com", ` +
        `RIGHT(REGEX_REPLACE({Telefon} & "", "[^0-9]", ""), 10) = "5321234567", ` +
        `SUBSTITUTE(LOWER(TRIM({Instagram Kullanıcı Adı} & "")), "@", "") = "ayse.y")`,
    );
    expect(matchFormula({ email: 'a"b@x.com', phone: "12", instagram: "ab" })).toBe(`LOWER(TRIM({E-posta} & "")) = "a\\"b@x.com"`);
    expect(matchFormula({})).toBeNull();
  });

  it("prefers the strongest match among duplicates", () => {
    const rows = [
      { id: "byInstagram", fields: { [F.instagram]: "@Ayse.Y" } },
      { id: "byPhone", fields: { [F.phone]: "0532 123 45 67" } },
      { id: "byEmail", fields: { [F.email]: "AYSE@example.com" } },
    ];
    const keys = { eventId: "EVT9", email: "ayse@example.com", phone: "905321234567", instagram: "ayse.y" };
    expect(pickRow(rows, keys)?.id).toBe("byEmail");
    expect(pickRow([...rows, { id: "byEvent", fields: { [F.calendlyEvent]: "EVT9" } }], keys)?.id).toBe("byEvent");
    expect(pickRow(rows.slice(0, 2), { ...keys, email: null })?.id).toBe("byPhone");
    expect(pickRow([{ id: "other", fields: { [F.email]: "x@y.com" } }], keys)).toBeNull();
  });
});

describe("table check", () => {
  it("reports columns and options the table does not have", () => {
    const fields = Object.values(F).map((name) => ({ name, type: "singleLineText" }));
    const choices = (names: string[]) => ({ choices: names.map((name) => ({ name })) });
    const table = {
      fields: [
        ...fields.filter((f) => f.name !== F.stage && f.name !== F.instagram && f.name !== F.lostReason),
        { name: F.stage, type: "singleSelect", options: choices(["Yeni lead", "Randevu alındı", "Randevu almadı", "Satış", "Satış değil"]) },
        { name: F.lostReason, type: "singleSelect", options: choices([...AIRTABLE.lostReasons]) },
      ],
    };
    const result = checkTable(table);
    expect(result.missingFields).toEqual([F.instagram]);
    expect(result.missingOptions).toEqual(["Aşama: Görüşme yapıldı – takipte", "Aşama: Görüşmeye gelmedi"]);
  });
});
