import "server-only";
import { env } from "@/lib/env";
import { EVENT_URI, INVITEE_URI } from "@/lib/calendly/link";
import type { CalendlyEvent, CalendlyInvitee, CalendlyUser, CalendlyWebhook } from "@/lib/calendly/types";

/**
 * Minimal Calendly API v2 client (personal access token). Never throws:
 * every call returns `{ ok }`, so a Calendly outage degrades to "the hourly
 * sync will catch up" instead of breaking the funnel.
 */

const API = "https://api.calendly.com";

export type CalendlyResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function call<T>(url: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<CalendlyResult<T>> {
  const token = env.calendlyToken();
  if (!token) return { ok: false, status: 0, error: "not_configured" };
  if (!url.startsWith(`${API}/`)) return { ok: false, status: 0, error: "invalid_uri" };
  try {
    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as (T & { message?: string; title?: string }) | null;
    if (!res.ok || !body) {
      return { ok: false, status: res.status, error: body?.message ?? body?.title ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: body };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

const globalForMe = globalThis as unknown as { __calendlyMe?: { token: string; user: CalendlyUser } };

/** Token owner and organisation (cached per token for the life of the instance). */
export async function me(): Promise<CalendlyResult<CalendlyUser>> {
  const token = env.calendlyToken();
  const cached = globalForMe.__calendlyMe;
  if (token && cached?.token === token) return { ok: true, data: cached.user };
  const result = await call<{ resource: CalendlyUser }>(`${API}/users/me`);
  if (!result.ok) return result;
  if (token) globalForMe.__calendlyMe = { token, user: result.data.resource };
  return { ok: true, data: result.data.resource };
}

export async function getInvitee(uri: string): Promise<CalendlyResult<CalendlyInvitee>> {
  if (!INVITEE_URI.test(uri)) return { ok: false, status: 0, error: "invalid_uri" };
  const result = await call<{ resource: CalendlyInvitee }>(uri);
  return result.ok ? { ok: true, data: result.data.resource } : result;
}

export async function getEvent(uri: string): Promise<CalendlyResult<CalendlyEvent>> {
  if (!EVENT_URI.test(uri)) return { ok: false, status: 0, error: "invalid_uri" };
  const result = await call<{ resource: CalendlyEvent }>(uri);
  return result.ok ? { ok: true, data: result.data.resource } : result;
}

type Page<T> = { collection: T[]; pagination?: { next_page?: string | null } };

/**
 * Scheduled events (active and cancelled) starting in a window. Tries the
 * whole organisation first (team round-robin) and falls back to the token
 * owner's own events when the token is not an organisation admin.
 */
export async function listEvents(window: { from: Date; to: Date }, maxEvents = 500): Promise<CalendlyResult<CalendlyEvent[]>> {
  const owner = await me();
  if (!owner.ok) return owner;
  const query = (scope: string) =>
    `${API}/scheduled_events?${scope}&min_start_time=${encodeURIComponent(window.from.toISOString())}` +
    `&max_start_time=${encodeURIComponent(window.to.toISOString())}&count=100&sort=start_time:asc`;

  let next: string | null = query(`organization=${encodeURIComponent(owner.data.current_organization)}`);
  const events: CalendlyEvent[] = [];
  let triedUser = false;
  while (next && events.length < maxEvents) {
    const page: CalendlyResult<Page<CalendlyEvent>> = await call<Page<CalendlyEvent>>(next);
    if (!page.ok) {
      if ((page.status === 403 || page.status === 401) && !triedUser && events.length === 0) {
        triedUser = true;
        next = query(`user=${encodeURIComponent(owner.data.uri)}`);
        continue;
      }
      return page;
    }
    events.push(...page.data.collection);
    next = page.data.pagination?.next_page ?? null;
  }
  return { ok: true, data: events };
}

export async function listInvitees(eventUri: string): Promise<CalendlyResult<CalendlyInvitee[]>> {
  if (!EVENT_URI.test(eventUri)) return { ok: false, status: 0, error: "invalid_uri" };
  const result = await call<Page<CalendlyInvitee>>(`${eventUri}/invitees?count=100`);
  return result.ok ? { ok: true, data: result.data.collection } : result;
}

export async function listWebhooks(scope: "organization" | "user"): Promise<CalendlyResult<CalendlyWebhook[]>> {
  const owner = await me();
  if (!owner.ok) return owner;
  const params = new URLSearchParams({ organization: owner.data.current_organization, scope, count: "100" });
  if (scope === "user") params.set("user", owner.data.uri);
  const result = await call<Page<CalendlyWebhook>>(`${API}/webhook_subscriptions?${params}`);
  return result.ok ? { ok: true, data: result.data.collection } : result;
}

export async function createWebhook(options: {
  url: string;
  scope: "organization" | "user";
  signingKey: string;
}): Promise<CalendlyResult<CalendlyWebhook>> {
  const owner = await me();
  if (!owner.ok) return owner;
  const result = await call<{ resource: CalendlyWebhook }>(`${API}/webhook_subscriptions`, {
    method: "POST",
    body: {
      url: options.url,
      events: ["invitee.created", "invitee.canceled"],
      organization: owner.data.current_organization,
      ...(options.scope === "user" ? { user: owner.data.uri } : {}),
      scope: options.scope,
      signing_key: options.signingKey,
    },
  });
  return result.ok ? { ok: true, data: result.data.resource } : result;
}
