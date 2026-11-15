import { AIRTABLE, type AirtableStageStatus } from "@/config/airtable";
import { formatPhone } from "@/lib/phone";

/**
 * Pure mapping from our lead (and its active booking) to Airtable fields.
 * No I/O, so the rules are unit-tested.
 */

export type AirtableFields = Record<string, string | null>;

export type AirtableLead = {
  full_name: string;
  email: string;
  phone: string;
  instagram: string | null;
  tier: "A" | "B" | "C" | null;
  qualified: boolean;
  status: string;
};

export type AirtableBooking = { start_at: Date | null; host_name: string | null } | null;

const F = AIRTABLE.fields;

export function stageFor(status: string): string | null {
  return status in AIRTABLE.stages ? AIRTABLE.stages[status as AirtableStageStatus] : null;
}

/** "Onur Yeşil" → "Onur": the base lists closers by first name. */
export function closerName(hostName: string | null | undefined): string | null {
  return hostName?.trim().split(/\s+/)[0] || null;
}

/** Calendar date in Türkiye, as Airtable date fields take it: "2026-11-15". */
export function trDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(date);
}

function compact(fields: AirtableFields): AirtableFields {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null && value !== ""));
}

/**
 * A new row: everything we know. Empty values are left out so Airtable keeps
 * its own defaults.
 */
export function fieldsForNewRow(lead: AirtableLead, booking: AirtableBooking, now: Date): AirtableFields {
  return compact({
    [F.name]: lead.full_name,
    [F.channel]: AIRTABLE.channel,
    [F.stage]: stageFor(lead.status),
    [F.interest]: lead.tier ? AIRTABLE.interest[lead.tier] : null,
    [F.instagram]: lead.instagram ? `@${lead.instagram}` : null,
    [F.phone]: formatPhone(lead.phone),
    [F.email]: lead.email,
    [F.appointment]: lead.status === "booked" ? (booking?.start_at?.toISOString() ?? null) : null,
    [F.closer]: closerName(booking?.host_name),
    [F.lastContact]: trDate(now),
  });
}

/**
 * An existing row (created by us earlier, or by the team for the same person):
 * only what the site knows better — stage, appointment, closer, last contact.
 * Contact details are filled in only where the row has none; name, channel and
 * interest stay as the team set them. `keepStage`: a (re)application does not
 * override a stage the team set ("Yazışılıyor" says more than "Yeni lead").
 */
export function fieldsForExistingRow(
  lead: AirtableLead,
  booking: AirtableBooking,
  now: Date,
  current: Record<string, unknown> = {},
  options: { keepStage?: boolean } = {},
): AirtableFields {
  const fields: AirtableFields = {
    [F.stage]: options.keepStage ? null : stageFor(lead.status),
    [F.lastContact]: trDate(now),
  };
  if (lead.status === "booked" && booking?.start_at) {
    fields[F.appointment] = booking.start_at.toISOString();
    const closer = closerName(booking.host_name);
    if (closer) fields[F.closer] = closer;
  } else if (lead.status === "cancelled") {
    // The call is off: an old date in the table would mislead the team.
    fields[F.appointment] = null;
  }
  const empty = (name: string) => current[name] === undefined || current[name] === null || current[name] === "";
  if (empty(F.email)) fields[F.email] = lead.email;
  if (empty(F.phone)) fields[F.phone] = formatPhone(lead.phone);
  if (lead.instagram && empty(F.instagram)) fields[F.instagram] = `@${lead.instagram}`;
  if (fields[F.stage] === null) delete fields[F.stage];
  return fields;
}

/** Airtable formula string literal. */
function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Finds the person's row by e-mail or by the last 10 digits of the phone, so
 * "0532…", "+90 532…" and "90532…" all match.
 */
export function contactFormula(email: string, phoneDigits: string): string {
  const tail = phoneDigits.replace(/\D/g, "").slice(-10);
  const byEmail = `LOWER(TRIM({${F.email}} & "")) = ${quote(email.trim().toLowerCase())}`;
  if (tail.length < 7) return byEmail;
  const byPhone = `RIGHT(REGEX_REPLACE({${F.phone}} & "", "[^0-9]", ""), 10) = ${quote(tail)}`;
  return `OR(${byEmail}, ${byPhone})`;
}
