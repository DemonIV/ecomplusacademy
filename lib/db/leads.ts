import "server-only";
import { getDb, type Queryable } from "@/lib/db";
import type { Touch } from "@/lib/attribution";

export type LeadStatus =
  | "disqualified"
  | "qualified"
  | "booked"
  | "attended"
  | "no_show"
  | "won"
  | "lost"
  | "cancelled";

export type Lead = {
  id: string;
  created_at: Date;
  updated_at: Date;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string;
  instagram: string | null;
  answers: Record<string, string>;
  score: number;
  tier: "A" | "B" | "C" | null;
  qualified: boolean;
  disqualify_reason: string | null;
  status: LeadStatus;
  apply_count: number;
  last_applied_at: Date;
  kvkk_consent_at: Date;
  marketing_consent: boolean;
  first_touch: Touch | null;
  last_touch: Touch | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  landing_url: string | null;
  referrer: string | null;
  ip: string | null;
  user_agent: string | null;
  owner_id: string | null;
  deal_value: number | null;
  currency: string;
  closed_at: Date | null;
  lost_reason: string | null;
  notes: string | null;
};

const LEAD_COLUMNS = `
  id, created_at, updated_at, full_name, first_name, last_name, email, phone, instagram,
  answers, score, tier, qualified, disqualify_reason, status, apply_count, last_applied_at,
  kvkk_consent_at, marketing_consent, first_touch, last_touch, fbclid, fbc, fbp,
  landing_url, referrer, ip, user_agent, owner_id, deal_value::float8 as deal_value,
  currency, closed_at, lost_reason, notes`;

export async function getLead(id: string, q?: Queryable): Promise<Lead | null> {
  if (!isUuid(id)) return null;
  const db = q ?? (await getDb());
  const rows = await db.query<Lead>(`select ${LEAD_COLUMNS} from leads where id = $1`, [id]);
  return rows[0] ?? null;
}

/** Latest lead matching either contact detail (one person = one lead). */
export async function findLeadByContact(email: string, phone: string): Promise<Lead | null> {
  const db = await getDb();
  const rows = await db.query<Lead>(
    `select ${LEAD_COLUMNS} from leads where email = $1 or phone = $2 order by created_at desc limit 1`,
    [email, phone],
  );
  return rows[0] ?? null;
}

export type LeadInsert = {
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string;
  instagram: string | null;
  answers: Record<string, string>;
  score: number;
  tier: string | null;
  qualified: boolean;
  disqualifyReason: string | null;
  status: LeadStatus;
  marketingConsent: boolean;
  firstTouch: Touch | null;
  lastTouch: Touch | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  landingUrl: string | null;
  referrer: string | null;
  ip: string | null;
  userAgent: string | null;
};

export async function insertLead(data: LeadInsert): Promise<Lead> {
  const db = await getDb();
  const rows = await db.query<Lead>(
    `insert into leads (
       full_name, first_name, last_name, email, phone, instagram, answers, score, tier,
       qualified, disqualify_reason, status, kvkk_consent_at, marketing_consent,
       first_touch, last_touch, fbclid, fbc, fbp, landing_url, referrer, ip, user_agent
     ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,now(),$13,$14::jsonb,$15::jsonb,$16,$17,$18,$19,$20,$21,$22)
     returning ${LEAD_COLUMNS}`,
    [
      data.fullName,
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.instagram,
      JSON.stringify(data.answers),
      data.score,
      data.tier,
      data.qualified,
      data.disqualifyReason,
      data.status,
      data.marketingConsent,
      data.firstTouch ? JSON.stringify(data.firstTouch) : null,
      data.lastTouch ? JSON.stringify(data.lastTouch) : null,
      data.fbclid,
      data.fbc,
      data.fbp,
      data.landingUrl,
      data.referrer,
      data.ip,
      data.userAgent,
    ],
  );
  return rows[0];
}

/** Re-application by a known person: new answers, keep first-touch data. */
export async function updateLeadOnReapply(id: string, data: LeadInsert): Promise<Lead> {
  const db = await getDb();
  const rows = await db.query<Lead>(
    `update leads set
       full_name = $2, first_name = $3, last_name = $4, email = $5, phone = $6,
       instagram = coalesce($7, instagram), answers = $8::jsonb, score = $9, tier = $10,
       qualified = $11, disqualify_reason = $12, status = $13,
       marketing_consent = $14, kvkk_consent_at = now(),
       first_touch = coalesce(first_touch, $15::jsonb), last_touch = coalesce($16::jsonb, last_touch),
       fbclid = coalesce($17, fbclid), fbc = coalesce($18, fbc), fbp = coalesce($19, fbp),
       ip = $20, user_agent = $21, apply_count = apply_count + 1, last_applied_at = now(), updated_at = now()
     where id = $1
     returning ${LEAD_COLUMNS}`,
    [
      id,
      data.fullName,
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.instagram,
      JSON.stringify(data.answers),
      data.score,
      data.tier,
      data.qualified,
      data.disqualifyReason,
      data.status,
      data.marketingConsent,
      data.firstTouch ? JSON.stringify(data.firstTouch) : null,
      data.lastTouch ? JSON.stringify(data.lastTouch) : null,
      data.fbclid,
      data.fbc,
      data.fbp,
      data.ip,
      data.userAgent,
    ],
  );
  return rows[0];
}

export async function bumpApplyCount(id: string, answers: Record<string, string>): Promise<void> {
  const db = await getDb();
  await db.query(
    "update leads set apply_count = apply_count + 1, last_applied_at = now(), updated_at = now() where id = $1",
    [id],
  );
  await addActivity(id, "reapplied_locked", { answers });
}

export async function setLeadStatus(id: string, status: LeadStatus, q?: Queryable): Promise<void> {
  const db = q ?? (await getDb());
  await db.query("update leads set status = $2, updated_at = now() where id = $1", [id, status]);
}

export async function recordOutcome(
  id: string,
  outcome: { status: LeadStatus; dealValue?: number | null; lostReason?: string | null; ownerId?: string | null },
): Promise<void> {
  const db = await getDb();
  await db.query(
    `update leads set status = $2,
       deal_value = case when $2 = 'won' then $3::numeric else deal_value end,
       closed_at = case when $2 in ('won', 'lost') then now() else closed_at end,
       lost_reason = case when $2 = 'lost' then $4 else lost_reason end,
       owner_id = coalesce(owner_id, $5::uuid),
       updated_at = now()
     where id = $1`,
    [id, outcome.status, outcome.dealValue ?? null, outcome.lostReason ?? null, outcome.ownerId ?? null],
  );
}

export async function updateLeadNotes(id: string, notes: string): Promise<void> {
  const db = await getDb();
  await db.query("update leads set notes = $2, updated_at = now() where id = $1", [id, notes]);
}

export async function addActivity(
  leadId: string,
  kind: string,
  detail?: Record<string, unknown> | null,
  actorId?: string | null,
  q?: Queryable,
): Promise<void> {
  const db = q ?? (await getDb());
  await db.query(
    "insert into lead_activity (lead_id, actor_id, kind, detail) values ($1, $2, $3, $4::jsonb)",
    [leadId, actorId ?? null, kind, detail ? JSON.stringify(detail) : null],
  );
}

export type LeadActivity = {
  id: string;
  kind: string;
  detail: Record<string, unknown> | null;
  created_at: Date;
  actor_name: string | null;
};

export async function listActivity(leadId: string): Promise<LeadActivity[]> {
  const db = await getDb();
  return db.query<LeadActivity>(
    `select a.id::text as id, a.kind, a.detail, a.created_at, m.name as actor_name
       from lead_activity a left join team_members m on m.id = a.actor_id
      where a.lead_id = $1 order by a.created_at desc limit 200`,
    [leadId],
  );
}

export type LeadListFilters = {
  status?: string;
  search?: string;
  qualified?: "yes" | "no";
  limit?: number;
  offset?: number;
};

export type LeadListItem = Pick<
  Lead,
  "id" | "created_at" | "full_name" | "email" | "phone" | "tier" | "score" | "status" | "qualified" | "deal_value"
> & {
  utm_campaign: string | null;
  utm_content: string | null;
  next_call_at: Date | null;
  host_name: string | null;
};

export async function listLeads(filters: LeadListFilters): Promise<{ rows: LeadListItem[]; total: number }> {
  const db = await getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    params.push(filters.status);
    where.push(`l.status = $${params.length}`);
  }
  if (filters.qualified) {
    params.push(filters.qualified === "yes");
    where.push(`l.qualified = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    where.push(
      `(lower(l.full_name) like $${params.length} or l.email like $${params.length} or l.phone like $${params.length})`,
    );
  }
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const countRows = await db.query<{ total: number }>(
    `select count(*)::int as total from leads l ${whereSql}`,
    params,
  );
  params.push(Math.min(filters.limit ?? 50, 200), filters.offset ?? 0);
  const rows = await db.query<LeadListItem>(
    `select l.id, l.created_at, l.full_name, l.email, l.phone, l.tier, l.score, l.status, l.qualified,
            l.deal_value::float8 as deal_value,
            coalesce(l.first_touch->>'utm_campaign', l.last_touch->>'utm_campaign') as utm_campaign,
            coalesce(l.first_touch->>'utm_content', l.last_touch->>'utm_content') as utm_content,
            b.start_at as next_call_at, coalesce(m.name, b.host_name) as host_name
       from leads l
       left join bookings b on b.lead_id = l.id and b.status = 'confirmed'
       left join team_members m on m.id = b.host_id
       ${whereSql}
      order by l.created_at desc
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return { rows, total: countRows[0]?.total ?? 0 };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
