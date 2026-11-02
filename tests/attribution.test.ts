import { describe, expect, it } from "vitest";
import {
  buildFbc,
  buildFbp,
  decodeTouch,
  encodeTouch,
  fbclidFromFbc,
  isValidFbCookie,
  touchFromUrl,
} from "@/lib/attribution";
import { formatPhone, normalizePhone } from "@/lib/phone";

describe("Meta cookies", () => {
  it("builds _fbc in Meta's format", () => {
    const fbc = buildFbc("IwAR2abcDEF_123-xyz", 1761620000123);
    expect(fbc).toBe("fb.1.1761620000123.IwAR2abcDEF_123-xyz");
    expect(isValidFbCookie(fbc)).toBe(true);
    expect(fbclidFromFbc(fbc)).toBe("IwAR2abcDEF_123-xyz");
  });

  it("builds a valid _fbp", () => {
    const fbp = buildFbp(1761620000123);
    expect(fbp).toMatch(/^fb\.1\.1761620000123\.\d{10}$/);
    expect(isValidFbCookie(fbp)).toBe(true);
  });

  it("rejects malformed cookie values", () => {
    expect(isValidFbCookie("fb.1.abc.def")).toBe(false);
    expect(isValidFbCookie("<script>")).toBe(false);
    expect(isValidFbCookie(undefined)).toBe(false);
  });
});

describe("touch cookies", () => {
  it("captures UTMs and click ids from the landing URL", () => {
    const url = new URL("https://site.test/?utm_source=fb&utm_campaign=Kampanya%201&fbclid=IwAR2abc12345&x=1");
    const touch = touchFromUrl(url, "https://l.instagram.com/", 1000);
    expect(touch).toMatchObject({ utm_source: "fb", utm_campaign: "Kampanya 1", fbclid: "IwAR2abc12345", ts: 1000 });
    expect(touch?.landing).toBe("/?utm_source=fb&utm_campaign=Kampanya%201&fbclid=IwAR2abc12345&x=1");
    expect(decodeTouch(encodeTouch(touch!))).toEqual(touch);
  });

  it("returns null without campaign parameters", () => {
    expect(touchFromUrl(new URL("https://site.test/?a=1"))).toBeNull();
  });

  it("ignores garbage cookie content", () => {
    expect(decodeTouch("%7Bbroken")).toBeNull();
    expect(decodeTouch(encodeURIComponent(JSON.stringify({ utm_source: "x" })))).toBeNull();
  });
});

describe("phone normalization", () => {
  it.each([
    ["0532 123 45 67", "905321234567"],
    ["5321234567", "905321234567"],
    ["+90 (532) 123-45-67", "905321234567"],
    ["905321234567", "905321234567"],
    ["0090 532 123 45 67", "905321234567"],
  ])("%s → %s", (input, digits) => {
    expect(normalizePhone(input)).toEqual({ digits, isTurkishMobile: true });
  });

  it("rejects Turkish landlines and short numbers", () => {
    expect(normalizePhone("0212 123 45 67")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
  });

  it("accepts explicit international numbers", () => {
    expect(normalizePhone("+49 151 23456789")).toEqual({ digits: "4915123456789", isTurkishMobile: false });
  });

  it("formats for display", () => {
    expect(formatPhone("905321234567")).toBe("+90 532 123 45 67");
  });
});
