import "server-only";
import { AIRTABLE } from "@/config/airtable";
import { env } from "@/lib/env";

/**
 * Minimal Airtable REST client (personal access token). Never throws: every
 * call returns `{ ok }`, so an Airtable outage never breaks an application,
 * a booking or an outcome; the daily sync retries what did not arrive.
 */

const API = "https://api.airtable.com/v0";

export type AirtableResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export type AirtableRecord = { id: string; fields: Record<string, unknown> };

export type AirtableField = {
  id: string;
  name: string;
  type: string;
  options?: { choices?: Array<{ name: string }> };
};

export type AirtableTable = { id: string; name: string; fields: AirtableField[] };

/**
 * Airtable allows 5 requests per second per base and answers a burst with a
 * 30-second ban. The daily sync writes one row after another, so requests of
 * this instance are spaced instead.
 */
const MIN_GAP_MS = 220;
let nextSlot = 0;

async function slot(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
}

async function call<T>(path: string, init: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {}): Promise<AirtableResult<T>> {
  const token = env.airtableToken();
  if (!token || !env.airtableBaseId()) return { ok: false, status: 0, error: "not_configured" };
  await slot();
  try {
    const res = await fetch(`${API}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as (T & { error?: { type?: string; message?: string } | string }) | null;
    if (!res.ok || !body) {
      const error = typeof body?.error === "string" ? body.error : (body?.error?.message ?? body?.error?.type);
      return { ok: false, status: res.status, error: error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: body };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

const tablePath = () => `/${env.airtableBaseId()}/${encodeURIComponent(AIRTABLE.table)}`;
const RECORD_ID = /^rec[A-Za-z0-9]{14}$/;

export async function findRecords(formula: string, maxRecords = 10): Promise<AirtableResult<AirtableRecord[]>> {
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: String(maxRecords) });
  const result = await call<{ records: AirtableRecord[] }>(`${tablePath()}?${params}`);
  return result.ok ? { ok: true, data: result.data.records } : result;
}

/** One row; `null` when the team deleted it. */
export async function getRecord(id: string): Promise<AirtableResult<AirtableRecord | null>> {
  if (!RECORD_ID.test(id)) return { ok: false, status: 0, error: "invalid_record_id" };
  const result = await call<AirtableRecord>(`${tablePath()}/${id}`);
  if (!result.ok) return result.status === 404 ? { ok: true, data: null } : result;
  return { ok: true, data: result.data };
}

/** `typecast`: a closer name that is not an option yet (a new team member) is added to "Satışçı". */
export async function createRecord(fields: Record<string, unknown>): Promise<AirtableResult<AirtableRecord>> {
  const result = await call<{ records: AirtableRecord[] }>(tablePath(), {
    method: "POST",
    body: { records: [{ fields }], typecast: true },
  });
  if (!result.ok) return result;
  const record = result.data.records[0];
  return record ? { ok: true, data: record } : { ok: false, status: 0, error: "empty_response" };
}

export async function updateRecord(id: string, fields: Record<string, unknown>): Promise<AirtableResult<AirtableRecord>> {
  if (!RECORD_ID.test(id)) return { ok: false, status: 0, error: "invalid_record_id" };
  const result = await call<{ records: AirtableRecord[] }>(tablePath(), {
    method: "PATCH",
    body: { records: [{ id, fields }], typecast: true },
  });
  if (!result.ok) return result;
  const record = result.data.records[0];
  return record ? { ok: true, data: record } : { ok: false, status: 0, error: "empty_response" };
}

/** The configured table's fields (needs the token's schema.bases:read scope). */
export async function getTable(): Promise<AirtableResult<AirtableTable | null>> {
  const result = await call<{ tables: AirtableTable[] }>(`/meta/bases/${env.airtableBaseId()}/tables`);
  return result.ok ? { ok: true, data: result.data.tables.find((t) => t.name === AIRTABLE.table) ?? null } : result;
}
