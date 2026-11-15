import { describe, expect, it } from "vitest";
import { AIRTABLE } from "@/config/airtable";
import { checkTable } from "@/lib/airtable/check";
import { closerName, contactFormula, fieldsForExistingRow, fieldsForNewRow, stageFor, trDate } from "@/lib/airtable/map";

const F = AIRTABLE.fields;
const NOW = new Date("2026-11-15T21:30:00.000Z"); // 16 Kasım 00:30 in Türkiye

const lead = (overrides: Partial<Parameters<typeof fieldsForNewRow>[0]> = {}) => ({
  full_name: "Ayşe Yılmaz",
  email: "ayse@example.com",
  phone: "905321234567",
  instagram: "ayse.yilmaz",
  tier: "A" as const,
  qualified: true,
  status: "qualified",
  ...overrides,
});

const booking = { start_at: new Date("2026-11-18T11:00:00.000Z"), host_name: "Onur Yeşil" };

describe("airtable mapping", () => {
  it("maps panel statuses to the team's stages", () => {
    expect(stageFor("qualified")).toBe("Yeni lead");
    expect(stageFor("booked")).toBe("Randevu alındı");
    expect(stageFor("won")).toBe("Satış");
    expect(stageFor("lost")).toBe("Satış değil");
    expect(stageFor("no_show")).toBe("Görüşmeye gelmedi");
    expect(stageFor("disqualified")).toBeNull();
  });

  it("uses the Türkiye calendar day and the closer's first name", () => {
    expect(trDate(NOW)).toBe("2026-11-16");
    expect(closerName(" Tarık Buğra Varol ")).toBe("Tarık");
    expect(closerName(null)).toBeNull();
  });

  it("fills a new row with everything known and leaves empty values out", () => {
    expect(fieldsForNewRow(lead(), null, NOW)).toEqual({
      [F.name]: "Ayşe Yılmaz",
      [F.channel]: "Site (Calendly)",
      [F.stage]: "Yeni lead",
      [F.interest]: "Sıcak",
      [F.instagram]: "@ayse.yilmaz",
      [F.phone]: "+90 532 123 45 67",
      [F.email]: "ayse@example.com",
      [F.lastContact]: "2026-11-16",
    });
    const booked = fieldsForNewRow(lead({ status: "booked", instagram: null, tier: "C" }), booking, NOW);
    expect(booked).toMatchObject({
      [F.stage]: "Randevu alındı",
      [F.appointment]: "2026-11-18T11:00:00.000Z",
      [F.closer]: "Onur",
      [F.interest]: "Soğuk",
    });
    expect(booked).not.toHaveProperty(F.instagram);
  });

  it("updates only what the site knows better on an existing row", () => {
    const fields = fieldsForExistingRow(lead({ status: "booked" }), booking, NOW, {
      [F.email]: "ayse@example.com",
      [F.phone]: "0532 123 45 67",
      [F.instagram]: "",
    });
    expect(fields).toEqual({
      [F.stage]: "Randevu alındı",
      [F.lastContact]: "2026-11-16",
      [F.appointment]: "2026-11-18T11:00:00.000Z",
      [F.closer]: "Onur",
      [F.instagram]: "@ayse.yilmaz",
    });
  });

  it("clears the date of a cancelled call and keeps the team's stage on a new application", () => {
    expect(fieldsForExistingRow(lead({ status: "cancelled", instagram: null }), null, NOW, { [F.email]: "x", [F.phone]: "y" })).toEqual({
      [F.stage]: "Yeni lead",
      [F.lastContact]: "2026-11-16",
      [F.appointment]: null,
    });
    const reapplied = fieldsForExistingRow(lead(), null, NOW, { [F.email]: "x", [F.phone]: "y" }, { keepStage: true });
    expect(reapplied).not.toHaveProperty(F.stage);
  });

  it("finds the person by e-mail or the last 10 phone digits, with quotes escaped", () => {
    expect(contactFormula("Ayse@Example.com", "905321234567")).toBe(
      `OR(LOWER(TRIM({E-posta} & "")) = "ayse@example.com", RIGHT(REGEX_REPLACE({Telefon} & "", "[^0-9]", ""), 10) = "5321234567")`,
    );
    expect(contactFormula('a"b@x.com', "12")).toBe(`LOWER(TRIM({E-posta} & "")) = "a\\"b@x.com"`);
  });

  it("reports columns and options the table does not have", () => {
    const fields = Object.values(F).map((name) => ({ name, type: "singleLineText" }));
    const choices = (names: string[]) => ({ choices: names.map((name) => ({ name })) });
    const table = {
      fields: [
        ...fields.filter((f) => f.name !== F.stage && f.name !== F.instagram),
        { name: F.stage, type: "singleSelect", options: choices(["Yeni lead", "Randevu alındı", "Satış", "Satış değil"]) },
      ],
    };
    const result = checkTable(table);
    expect(result.missingFields).toEqual([F.instagram]);
    expect(result.missingOptions).toEqual(["Aşama: Görüşme yapıldı – takipte", "Aşama: Görüşmeye gelmedi"]);
  });
});
