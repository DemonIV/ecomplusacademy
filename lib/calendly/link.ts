/**
 * Calendly scheduling links with the applicant's details pre-filled.
 * Client-safe: the funnel embeds the link, the admin panel sends it over
 * WhatsApp. `salesforce_uuid` carries our lead id; Calendly returns it in
 * the invitee's `tracking`, which is how a booking is tied back to the lead
 * (and to the ad click) no matter where it was made.
 */

export const CALENDLY_ORIGIN = "https://calendly.com";

/** API resource URIs as sent by the embed's postMessage and by webhooks. */
export const INVITEE_URI = /^https:\/\/api\.calendly\.com\/scheduled_events\/[A-Za-z0-9-]+\/invitees\/[A-Za-z0-9-]+$/;
export const EVENT_URI = /^https:\/\/api\.calendly\.com\/scheduled_events\/[A-Za-z0-9-]+$/;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
type UtmKey = (typeof UTM_KEYS)[number];

export type CalendlyPrefill = {
  name?: string | null;
  email?: string | null;
  /** E.164, e.g. +905321234567. */
  phone?: string | null;
  leadId?: string | null;
  utm?: Partial<Record<UtmKey, string | null | undefined>>;
};

export type CalendlyLinkOptions = {
  /** Custom question that should also receive the phone number. */
  phoneAnswer?: string | null;
  /** Inline embed: the host page's domain plus optional colours (hex, no #). */
  embed?: { domain: string; colors?: { background: string; text: string; primary: string } };
};

export function isCalendlyEventUrl(value: string): boolean {
  return /^https:\/\/calendly\.com\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)?\/?$/.test(value);
}

/** Digits from our phone normalisation (90532…) → E.164 (+90532…). */
export function toE164(digits: string | null | undefined): string | null {
  return digits && /^\d{8,15}$/.test(digits) ? `+${digits}` : null;
}

export function calendlyUrl(base: string, prefill: CalendlyPrefill, options: CalendlyLinkOptions = {}): string {
  const params: Array<[string, string]> = [];
  const add = (key: string, value: string | null | undefined, max = 200) => {
    const clean = value?.trim();
    if (clean) params.push([key, clean.slice(0, max)]);
  };

  if (options.embed) {
    add("embed_domain", options.embed.domain);
    add("embed_type", "Inline");
    add("hide_event_type_details", "1");
    const colors = options.embed.colors;
    if (colors) {
      add("background_color", colors.background);
      add("text_color", colors.text);
      add("primary_color", colors.primary);
    }
  }
  add("name", prefill.name, 120);
  add("email", prefill.email, 160);
  // The call happens on Zoom (Calendly creates the meeting), so the phone only goes to a custom question, if any.
  if (prefill.phone && options.phoneAnswer && /^a([1-9]|10)$/.test(options.phoneAnswer)) {
    add(options.phoneAnswer, prefill.phone, 20);
  }
  for (const key of UTM_KEYS) add(key, prefill.utm?.[key]);
  add("salesforce_uuid", prefill.leadId, 64);

  // Calendly documents %20 for spaces, so no URLSearchParams ("+").
  const query = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const clean = base.replace(/[?#].*$/, "").replace(/\/+$/, "");
  return query ? `${clean}?${query}` : clean;
}
