import "server-only";
import { sha256Hex } from "@/lib/crypto";
import { env } from "@/lib/env";
import type { ActionSource } from "@/lib/meta/events";

/**
 * Meta Conversions API client (Graph API v26.0).
 * Ported from the Davetiyelistem pattern with three changes: a current API
 * version, explicit `event_time`/`action_source` (offline sales use
 * `phone_call`), and the full response returned so it can be logged.
 */

const GRAPH_VERSION = "v26.0";
const MAX_EVENT_AGE_SECONDS = 7 * 24 * 60 * 60;

export type CapiUser = {
  email?: string | null;
  phone?: string | null; // digits with country code, e.g. 905321234567
  firstName?: string | null;
  lastName?: string | null;
  externalId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  country?: string | null; // ISO-3166 alpha-2, lower case; derived from a +90 phone when missing
};

export type CapiEvent = {
  eventName: string;
  eventId: string;
  actionSource: ActionSource;
  eventTime?: Date;
  eventSourceUrl?: string | null;
  user: CapiUser;
  customData?: Record<string, unknown>;
};

export type CapiResult =
  | { status: "sent"; eventsReceived: number; fbtraceId?: string; testEventCode?: string }
  | { status: "failed"; error: string; fbtraceId?: string; testEventCode?: string }
  | { status: "skipped"; reason: "not_configured" };

/**
 * The same rules Meta's own pixel (fbevents.js) applies before hashing, so a
 * server event hashes exactly like its browser copy: names lose ASCII
 * punctuation and whitespace, then are lower-cased without a locale.
 */
const NAME_PUNCTUATION = /[!"#$%&'()*+,\-./:;<=>?@ [\\\]^_`{|}~\s]+/g;

const normalize = {
  email: (v: string) => v.trim().toLowerCase(),
  phone: (v: string) => v.replace(/\D/g, ""),
  name: (v: string) => v.replace(NAME_PUNCTUATION, "").toLowerCase(),
  // Turkish casing only differs for I/İ: "YILMAZ" → "yılmaz", where the rule above gives "yilmaz".
  nameTurkish: (v: string) => v.replace(NAME_PUNCTUATION, "").toLocaleLowerCase("tr-TR"),
  id: (v: string) => v.replace(/\s+/g, "").toLowerCase(),
  country: (v: string) => v.trim().toLowerCase(),
};

function hashed(value: string | null | undefined, ...fns: ((v: string) => string)[]): string[] | undefined {
  if (!value) return undefined;
  const variants = [...new Set(fns.map((fn) => fn(value)).filter(Boolean))];
  return variants.length ? variants.map(sha256Hex) : undefined;
}

/** Only the calling code we can be sure of; a wrong country hurts matching more than none. */
function countryFromPhone(phone: string | null | undefined): string | null {
  return phone && normalize.phone(phone).startsWith("90") ? "tr" : null;
}

export function buildUserData(user: CapiUser): Record<string, unknown> {
  const data: Record<string, unknown> = {
    em: hashed(user.email, normalize.email),
    ph: hashed(user.phone, normalize.phone),
    // Meta's casing first (it matches what the browser sends), the Turkish one as a second candidate.
    fn: hashed(user.firstName, normalize.name, normalize.nameTurkish),
    ln: hashed(user.lastName, normalize.name, normalize.nameTurkish),
    external_id: hashed(user.externalId, normalize.id),
    country: hashed(user.country ?? countryFromPhone(user.phone), normalize.country),
    client_ip_address: user.ip || undefined,
    client_user_agent: user.userAgent || undefined,
    fbc: user.fbc || undefined,
    fbp: user.fbp || undefined,
  };
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export function buildPayload(event: CapiEvent, now = Date.now()) {
  // Meta rejects events older than 7 days; clamp late-marked sales.
  const nowSeconds = Math.floor(now / 1000);
  const requested = Math.floor((event.eventTime?.getTime() ?? now) / 1000);
  const eventTime = Math.min(nowSeconds, Math.max(requested, nowSeconds - MAX_EVENT_AGE_SECONDS + 3600));

  return {
    event_name: event.eventName,
    event_time: eventTime,
    event_id: event.eventId,
    action_source: event.actionSource,
    ...(event.actionSource === "website" && event.eventSourceUrl
      ? { event_source_url: event.eventSourceUrl }
      : {}),
    user_data: buildUserData(event.user),
    ...(event.customData ? { custom_data: event.customData } : {}),
  };
}

export async function sendCapiEvent(event: CapiEvent): Promise<CapiResult> {
  const pixelId = env.metaPixelId();
  const accessToken = env.metaCapiToken();
  if (!pixelId || !accessToken) return { status: "skipped", reason: "not_configured" };

  const testEventCode = env.metaTestEventCode();
  const body = {
    data: [buildPayload(event)],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    // The token goes in a header, not the URL, so it never ends up in a logged address.
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await response.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string; fbtrace_id?: string; error_user_msg?: string };
    };
    if (!response.ok || json.error) {
      return {
        status: "failed",
        error: json.error?.error_user_msg || json.error?.message || `HTTP ${response.status}`,
        fbtraceId: json.error?.fbtrace_id ?? json.fbtrace_id,
        testEventCode,
      };
    }
    return {
      status: "sent",
      eventsReceived: json.events_received ?? 0,
      fbtraceId: json.fbtrace_id,
      testEventCode,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      testEventCode,
    };
  }
}
