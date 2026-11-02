import { describe, expect, it } from "vitest";
import {
  addDays,
  formatTrDateTime,
  formatTrTime,
  localDateKey,
  localDateOf,
  parseLocalDateKey,
  zonedTimeToUtc,
  zoneOffsetMs,
} from "@/lib/booking/time";

const TZ = "Europe/Istanbul";
const wed = { year: 2026, month: 10, day: 28 };

describe("time zone helpers", () => {
  it("Istanbul is UTC+3 all year", () => {
    expect(zoneOffsetMs(new Date("2026-01-15T12:00:00Z"), TZ)).toBe(3 * 3600_000);
    expect(zoneOffsetMs(new Date("2026-07-15T12:00:00Z"), TZ)).toBe(3 * 3600_000);
  });

  it("converts local wall time to UTC", () => {
    expect(zonedTimeToUtc({ ...wed, hour: 10, minute: 0 }, TZ).toISOString()).toBe("2026-10-28T07:00:00.000Z");
  });

  it("handles zones with DST (Europe/Berlin)", () => {
    // 25 Oct 2026 is the end of DST in the EU; 10:00 local is UTC+1 then.
    expect(zonedTimeToUtc({ year: 2026, month: 10, day: 26, hour: 10, minute: 0 }, "Europe/Berlin").toISOString()).toBe(
      "2026-10-26T09:00:00.000Z",
    );
    expect(zonedTimeToUtc({ year: 2026, month: 7, day: 1, hour: 10, minute: 0 }, "Europe/Berlin").toISOString()).toBe(
      "2026-07-01T08:00:00.000Z",
    );
  });

  it("finds the local calendar day of an instant", () => {
    // 22:30 UTC on the 31st is already 1 November in Istanbul.
    expect(localDateKey(localDateOf(new Date("2026-10-31T22:30:00Z"), TZ))).toBe("2026-11-01");
  });

  it("adds days across month and year ends", () => {
    expect(localDateKey(addDays({ year: 2026, month: 10, day: 30 }, 3))).toBe("2026-11-02");
    expect(localDateKey(addDays({ year: 2026, month: 12, day: 31 }, 1))).toBe("2027-01-01");
    expect(parseLocalDateKey("2026-11-02")).toEqual({ year: 2026, month: 11, day: 2 });
    expect(parseLocalDateKey("02.11.2026")).toBeNull();
  });

  it("formats in Turkish, in the given zone", () => {
    const start = new Date("2026-11-02T11:30:00Z");
    expect(formatTrTime(start, TZ)).toBe("14:30");
    expect(formatTrDateTime(start, TZ)).toMatch(/2 Kasım Pazartesi.*14:30/);
  });
});
