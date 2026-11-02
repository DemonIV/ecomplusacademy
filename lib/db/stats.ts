import "server-only";
import { getDb } from "@/lib/db";

/**
 * Funnel and revenue numbers for the admin dashboard, attributed to the
 * ad that brought each lead (first touch, so a sale days later still
 * counts for the campaign that created the lead).
 */

export type FunnelStats = {
  leads: number;
  qualified: number;
  booked: number;
  attended: number;
  noShow: number;
  won: number;
  revenue: number;
  /** Leads who opted in to measurement; with the consent gate on, only they reach Meta. */
  consented: number;
};

export type CampaignRow = FunnelStats & { campaign: string; ad: string | null };

const FUNNEL_COLUMNS = `
  count(*)::int as leads,
  count(*) filter (where l.marketing_consent)::int as consented,
  count(*) filter (where l.qualified)::int as qualified,
  count(*) filter (where exists (select 1 from bookings b where b.lead_id = l.id))::int as booked,
  count(*) filter (where l.status in ('attended', 'won', 'lost'))::int as attended,
  count(*) filter (where l.status = 'no_show')::int as "noShow",
  count(*) filter (where l.status = 'won')::int as won,
  coalesce(sum(l.deal_value) filter (where l.status = 'won'), 0)::float8 as revenue`;

export async function funnelStats(sinceDays: number): Promise<FunnelStats> {
  const db = await getDb();
  const rows = await db.query<FunnelStats>(
    `select ${FUNNEL_COLUMNS} from leads l where l.created_at > now() - ($1::int * interval '1 day')`,
    [sinceDays],
  );
  return rows[0] ?? { leads: 0, qualified: 0, booked: 0, attended: 0, noShow: 0, won: 0, revenue: 0, consented: 0 };
}

export async function campaignStats(sinceDays: number, byAd = false): Promise<CampaignRow[]> {
  const db = await getDb();
  const ad = byAd ? "l.first_touch->>'utm_content'" : "null";
  return db.query<CampaignRow>(
    `select coalesce(nullif(l.first_touch->>'utm_campaign', ''), 'Kampanyasız / organik') as campaign,
            ${ad} as ad,
            ${FUNNEL_COLUMNS}
       from leads l
      where l.created_at > now() - ($1::int * interval '1 day')
      group by 1, 2
      order by revenue desc, leads desc
      limit 100`,
    [sinceDays],
  );
}
