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
  country?: string | null; // ISO-3166 alpha-2, lower case
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

const normalize = {
  email: (v: string) => v.trim().toLowerCase(),
  phone: (v: string) => v.replace(/\D/g, ""),
  // Meta wants lower-case, no punctuation; keep Turkish letters (UTF-8).
  name: (v: string) => v.trim().toLocaleLowerCase("tr-TR").replace(/[\s'’.,-]+/g, ""),
};

function hashed(value: string | null | undefined, fn: (v: string) => string): string[] | undefined {
  if (!value) return undefined;
  const normalized = fn(value);
  return normalized ? [sha256Hex(normalized)] : undefined;
}

export function buildUserData(user: CapiUser): Record<string, unknown> {
  const data: Record<string, unknown> = {
    em: hashed(user.email, normalize.email),
    ph: hashed(user.phone, normalize.phone),
    fn: hashed(user.firstName, normalize.name),
    ln: hashed(user.lastName, normalize.name),
    external_id: hashed(user.externalId, (v) => v.trim()),
    country: hashed(user.country ?? "tr", (v) => v.trim().toLowerCase()),
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
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      },
    );
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
