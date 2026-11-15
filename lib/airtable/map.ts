import { AIRTABLE, type AirtableStageStatus } from "@/config/airtable";
import { answerLabel, QUESTIONS, type QuestionId } from "@/config/qualification";
import { bookingStatusOf, instagramFromInvitee, phoneFromInvitee } from "@/lib/calendly/map";
import type { CalendlyEvent, CalendlyInvitee } from "@/lib/calendly/types";
import { formatPhone } from "@/lib/phone";

/**
 * Pure mapping between our data and the team's Airtable rows. No I/O, so the
 * rules are unit-tested. Two sources describe a person:
 *  - a site application (our lead and its active Calendly booking),
 *  - a Calendly booking by someone who never applied (link sent over DM/WhatsApp).
 * Both become `RowFacts`; `newRowFields` and `rowChanges` turn them into fields.
 */

const F = AIRTABLE.fields;

export type AirtableValue = string | number | null;
export type AirtableFields = Record<string, AirtableValue>;

/** Why we write; the rules for an existing row differ (see `rowChanges`). */
export type SyncReason = "applied" | "booking" | "outcome" | "retry" | "calendly";

export type RowFacts = {
  name: string;
  email: string | null;
  /** Digits with country code: "905321234567". */
  phone: string | null;
  /** Without "@". */
  instagram: string | null;
  channel: string;
  interest: string | null;
  stage: string | null;
  /** The call that is on (or was held); "cancelled": the call is off. */
  call: { start: Date | null; closer: string | null; eventId: string | null } | "cancelled" | null;
  utmSource: string | null;
  campaign: string | null;
  adSet: string | null;
  ad: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  /** Added under what "Notlar" already says. */
  note: string | null;
  sale: { amount: number; date: string } | null;
  lostReason: string | null;
  /** "Son İletişim": a calendar day in Türkiye. */
  contactDate: string;
};

type TouchValues = { readonly [key: string]: unknown } | null;

export type AirtableLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  instagram: string | null;
  tier: "A" | "B" | "C" | null;
  qualified: boolean;
  status: string;
  answers: Record<string, string>;
  last_applied_at: Date;
  first_touch: TouchValues;
  last_touch: TouchValues;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  deal_value: number | string | null;
  closed_at: Date | null;
  lost_reason: string | null;
};

export type AirtableBooking = {
  start_at: Date | null;
  host_name: string | null;
  calendly_event_uri: string | null;
} | null;

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

function trDay(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/** "https://api.calendly.com/scheduled_events/ABC" → "ABC". */
export function calendlyEventId(uri: string | null | undefined): string | null {
  return uri?.trim().replace(/\/+$/, "").split("/").pop() || null;
}

export function isSalesEvent(event: Pick<CalendlyEvent, "name"> | null | undefined): boolean {
  const name = event?.name?.toLocaleLowerCase("tr-TR") ?? "";
  return Boolean(name) && AIRTABLE.salesEvents.some((part) => name.includes(part.toLocaleLowerCase("tr-TR")));
}

/** The panel's reason as a "Kayıp Nedeni" option (free text from older records maps to nothing). */
export function lostReasonOption(reason: string | null | undefined): string | null {
  const wanted = reason?.trim().toLocaleLowerCase("tr-TR");
  return AIRTABLE.lostReasons.find((option) => option.toLocaleLowerCase("tr-TR") === wanted) ?? null;
}

/**
 * "Kanal" of a booking without an application: the link's `utm_source`, else
 * the event's name ("Ücretsiz Ön Görüşme (Instagram)" is the link sent in DMs).
 */
function bookingChannel(utmSource: string | null | undefined, eventName: string | null | undefined): string {
  const source = utmSource?.trim().toLowerCase() ?? "";
  if (/whatsapp|^wa$/.test(source)) return AIRTABLE.channels.whatsapp;
  if (/instagram|^ig$/.test(source)) return AIRTABLE.channels.instagram;
  const name = eventName?.toLowerCase() ?? "";
  if (name.includes("whatsapp")) return AIRTABLE.channels.whatsapp;
  if (name.includes("instagram")) return AIRTABLE.channels.instagram;
  return AIRTABLE.channels.site;
}

const NOTE_LABELS: Partial<Record<QuestionId, string>> = {
  stage: "Durum",
  budget: "Bütçe (3 ay)",
  readiness: "Başlama",
  hours: "Haftalık süre",
};

/** The application in the team's words; the date keeps a repeated sync from adding it twice. */
export function applicationNote(lead: Pick<AirtableLead, "answers" | "last_applied_at">, panelUrl: string | null): string {
  const lines = [`Site başvurusu – ${trDay(lead.last_applied_at)}`];
  for (const question of QUESTIONS) {
    const answer = lead.answers[question.id];
    if (answer) lines.push(`${NOTE_LABELS[question.id] ?? question.title}: ${answerLabel(question.id, answer)}`);
  }
  if (panelUrl) lines.push(`Panel: ${panelUrl}`);
  return lines.join("\n");
}

const CONTACT_QUESTION = /telefon|whatsapp|numara|phone|instagram/i;

/** A row the booking opened: which event, and the answers that have no column of their own. */
export function calendlyNote(invitee: Pick<CalendlyInvitee, "questions_and_answers">, event: Pick<CalendlyEvent, "name">): string {
  const lines = [`Calendly randevusu – ${event.name?.trim() || "görüşme"}`];
  for (const qa of invitee.questions_and_answers ?? []) {
    const answer = qa.answer?.trim();
    if (answer && !CONTACT_QUESTION.test(qa.question)) lines.push(`${qa.question.trim()}: ${answer.slice(0, 500)}`);
  }
  return lines.join("\n");
}

/** First touch, else last touch, per value (as the panel's lead list shows them). */
function touch(lead: AirtableLead, key: string): string | null {
  for (const source of [lead.first_touch, lead.last_touch]) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function factsFromLead(
  lead: AirtableLead,
  booking: AirtableBooking,
  context: { now: Date; reason: SyncReason; panelUrl: string | null },
): RowFacts {
  let stage = lead.status === "disqualified" ? null : stageFor(lead.status);
  let call: RowFacts["call"] = null;
  if (booking) {
    call = { start: booking.start_at, closer: closerName(booking.host_name), eventId: calendlyEventId(booking.calendly_event_uri) };
    // Someone the questions filtered out, booked by the team anyway.
    stage ??= AIRTABLE.stages.booked;
  } else if (lead.status === "cancelled" || (lead.status === "disqualified" && context.reason === "booking")) {
    call = "cancelled";
    stage = AIRTABLE.stages.cancelled;
  }
  const amount = lead.status === "won" && lead.deal_value !== null ? Number(lead.deal_value) : Number.NaN;
  return {
    name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    instagram: lead.instagram,
    channel: AIRTABLE.channels.site,
    interest: lead.tier ? AIRTABLE.interest[lead.tier] : null,
    stage,
    call,
    utmSource: touch(lead, "utm_source"),
    // Meta ad links carry utm_campaign={{campaign.name}}, utm_term={{adset.name}}, utm_content={{ad.name}}.
    campaign: touch(lead, "utm_campaign"),
    adSet: touch(lead, "utm_term"),
    ad: touch(lead, "utm_content"),
    fbclid: lead.fbclid ?? touch(lead, "fbclid"),
    fbc: lead.fbc,
    fbp: lead.fbp,
    note: applicationNote(lead, context.panelUrl),
    sale: amount > 0 ? { amount, date: trDate(lead.closed_at ?? context.now) } : null,
    lostReason: lead.status === "lost" ? lostReasonOption(lead.lost_reason) : null,
    contactDate: trDate(context.now),
  };
}

function validDate(value: string | null | undefined): Date | null {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function factsFromInvitee(invitee: CalendlyInvitee, event: CalendlyEvent, now: Date): RowFacts {
  const cancelled = bookingStatusOf(invitee, event) !== "confirmed";
  const tracking = invitee.tracking ?? {};
  const clean = (value: string | null | undefined) => value?.trim() || null;
  const changedAt = validDate(cancelled ? invitee.updated_at : invitee.created_at) ?? now;
  return {
    name: invitee.name?.trim() || invitee.email,
    email: invitee.email?.trim().toLowerCase() || null,
    phone: phoneFromInvitee(invitee, event),
    instagram: instagramFromInvitee(invitee),
    channel: bookingChannel(tracking.utm_source, event.name),
    interest: null,
    stage: cancelled ? AIRTABLE.stages.cancelled : AIRTABLE.stages.booked,
    call: cancelled
      ? "cancelled"
      : {
          start: validDate(event.start_time),
          closer: closerName(event.event_memberships?.[0]?.user_name),
          eventId: calendlyEventId(event.uri),
        },
    utmSource: clean(tracking.utm_source),
    campaign: clean(tracking.utm_campaign),
    adSet: clean(tracking.utm_term),
    ad: clean(tracking.utm_content),
    fbclid: null,
    fbc: null,
    fbp: null,
    note: calendlyNote(invitee, event),
    sale: null,
    lostReason: null,
    contactDate: trDate(changedAt),
  };
}

function compact(fields: AirtableFields): AirtableFields {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null && value !== ""));
}

const handleField = (handle: string | null) => (handle ? `@${handle}` : null);
const phoneField = (digits: string | null) => (digits ? formatPhone(digits) : null);

/** A new row: everything known. Empty values are left out so Airtable keeps its defaults. */
export function newRowFields(facts: RowFacts): AirtableFields {
  const call = facts.call && facts.call !== "cancelled" ? facts.call : null;
  return compact({
    [F.name]: facts.name,
    [F.channel]: facts.channel,
    [F.stage]: facts.stage,
    [F.interest]: facts.interest,
    [F.instagram]: handleField(facts.instagram),
    [F.phone]: phoneField(facts.phone),
    [F.email]: facts.email,
    [F.appointment]: call?.start?.toISOString() ?? null,
    [F.closer]: call?.closer ?? null,
    [F.calendlyEvent]: call?.eventId ?? null,
    [F.utmSource]: facts.utmSource,
    [F.campaign]: facts.campaign,
    [F.adSet]: facts.adSet,
    [F.ad]: facts.ad,
    [F.fbclid]: facts.fbclid,
    [F.fbc]: facts.fbc,
    [F.fbp]: facts.fbp,
    [F.notes]: facts.note,
    [F.saleAmount]: facts.sale?.amount ?? null,
    [F.saleDate]: facts.sale?.date ?? null,
    [F.lostReason]: facts.lostReason,
    [F.lastContact]: facts.contactDate,
  });
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function same(current: unknown, next: AirtableValue): boolean {
  if (next === null || next === "") return isEmpty(current);
  if (typeof next === "number") return Number(current) === next;
  if (typeof current !== "string") return false;
  if (current === next) return true;
  // Date-times come back as "…T11:00:00.000Z": compare the instant.
  return /T\d\d:/.test(next) && Date.parse(current) === Date.parse(next);
}

/**
 * What to write on an existing row (the site's earlier row, or the team's own
 * row for the same person). Only differences, so the daily sync re-reading
 * the same bookings writes nothing:
 *  - Stage moves on, except out of a stage the team set after the call
 *    (`decidedStages`) unless the panel recorded a result; "Yeni lead" only
 *    fills an empty stage ("Yazışılıyor" says more).
 *  - Call date, closer and event id follow Calendly (bookings only, so a
 *    result does not undo a closer the team reassigned).
 *  - Name, channel, contact and ad details only fill empty cells.
 *  - The application note is added under the team's notes, once.
 *  - Sale amount/date and loss reason come with a result from the panel.
 *  - "Son İletişim" moves forward when anything else changed.
 */
export function rowChanges(facts: RowFacts, current: Record<string, unknown>, reason: SyncReason): AirtableFields {
  const changes: AirtableFields = {};
  const set = (name: string, value: AirtableValue) => {
    if (!same(current[name], value)) changes[name] = value;
  };
  const fill = (name: string, value: AirtableValue) => {
    if (value !== null && value !== "" && isEmpty(current[name])) changes[name] = value;
  };

  const decided = (AIRTABLE.decidedStages as readonly string[]).includes(String(current[F.stage] ?? ""));
  const locked = decided && reason !== "outcome";
  if (facts.stage && !locked) {
    if (facts.stage === AIRTABLE.stages.qualified) fill(F.stage, facts.stage);
    else set(F.stage, facts.stage);
  }

  if (reason === "booking" || reason === "calendly" || reason === "retry") {
    if (facts.call === "cancelled") {
      if (!locked) {
        set(F.appointment, null);
        set(F.calendlyEvent, null);
      }
    } else if (facts.call) {
      if (facts.call.start) set(F.appointment, facts.call.start.toISOString());
      if (facts.call.closer) set(F.closer, facts.call.closer);
      if (facts.call.eventId) set(F.calendlyEvent, facts.call.eventId);
    }
  }

  fill(F.name, facts.name);
  fill(F.channel, facts.channel);
  fill(F.interest, facts.interest);
  fill(F.email, facts.email);
  fill(F.phone, phoneField(facts.phone));
  fill(F.instagram, handleField(facts.instagram));
  fill(F.utmSource, facts.utmSource);
  fill(F.campaign, facts.campaign);
  fill(F.adSet, facts.adSet);
  fill(F.ad, facts.ad);
  fill(F.fbclid, facts.fbclid);
  fill(F.fbc, facts.fbc);
  fill(F.fbp, facts.fbp);

  if (facts.note && (reason === "applied" || reason === "retry")) {
    const written = current[F.notes];
    const notes = typeof written === "string" ? written.trim() : "";
    if (!notes.includes(facts.note)) changes[F.notes] = notes ? `${notes}\n\n${facts.note}` : facts.note;
  }

  if (reason === "outcome") {
    if (facts.sale) {
      set(F.saleAmount, facts.sale.amount);
      set(F.saleDate, facts.sale.date);
    }
    if (facts.lostReason) set(F.lostReason, facts.lostReason);
  }

  if (Object.keys(changes).length) {
    const last = current[F.lastContact];
    if (typeof last !== "string" || last < facts.contactDate) changes[F.lastContact] = facts.contactDate;
  }
  return changes;
}

/* ── Finding the person's row ─────────────────────────────────────────── */

export type MatchKeys = {
  eventId?: string | null;
  email?: string | null;
  phone?: string | null;
  instagram?: string | null;
};

/** Airtable formula string literal. */
function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const phoneTail = (digits: string | null | undefined) => {
  const tail = digits?.replace(/\D/g, "").slice(-10) ?? "";
  return tail.length >= 7 ? tail : null;
};
const handleKey = (handle: string | null | undefined) => {
  const key = handle?.trim().replace(/^@/, "").toLowerCase() ?? "";
  return key.length >= 3 ? key : null;
};

/**
 * Rows of the same person: the same Calendly event, e-mail, the last 10 phone
 * digits ("0532…", "+90 532…" and "90532…" all match) or Instagram handle.
 */
export function matchFormula(keys: MatchKeys): string | null {
  const parts: string[] = [];
  if (keys.eventId) parts.push(`{${F.calendlyEvent}} = ${quote(keys.eventId)}`);
  const email = keys.email?.trim().toLowerCase();
  if (email) parts.push(`LOWER(TRIM({${F.email}} & "")) = ${quote(email)}`);
  const tail = phoneTail(keys.phone);
  if (tail) parts.push(`RIGHT(REGEX_REPLACE({${F.phone}} & "", "[^0-9]", ""), 10) = ${quote(tail)}`);
  const handle = handleKey(keys.instagram);
  if (handle) parts.push(`SUBSTITUTE(LOWER(TRIM({${F.instagram}} & "")), "@", "") = ${quote(handle)}`);
  if (parts.length < 2) return parts[0] ?? null;
  return `OR(${parts.join(", ")})`;
}

/** When the team keeps duplicates, the strongest key wins: same call, e-mail, phone, then Instagram. */
export function pickRow<T extends { fields: Record<string, unknown> }>(rows: T[], keys: MatchKeys): T | null {
  const text = (row: T, field: string) => String(row.fields[field] ?? "").trim();
  const email = keys.email?.trim().toLowerCase();
  const tail = phoneTail(keys.phone);
  const handle = handleKey(keys.instagram);
  const score = (row: T) => {
    if (keys.eventId && text(row, F.calendlyEvent) === keys.eventId) return 4;
    if (email && text(row, F.email).toLowerCase() === email) return 3;
    if (tail && phoneTail(text(row, F.phone)) === tail) return 2;
    if (handle && handleKey(text(row, F.instagram)) === handle) return 1;
    return 0;
  };
  let best: T | null = null;
  let bestScore = 0;
  for (const row of rows) {
    const value = score(row);
    if (value > bestScore) {
      best = row;
      bestScore = value;
    }
  }
  return best;
}
