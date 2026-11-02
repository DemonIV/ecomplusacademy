import "server-only";
import { getDb } from "@/lib/db";

/**
 * Fixed-window counter in Postgres (works across serverless instances
 * without another service). Returns ok=false once `limit` is exceeded.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; count: number }> {
  try {
    const db = await getDb();
    const rows = await db.query<{ count: number }>(
      `insert into rate_limits (key, window_start, count) values ($1, now(), 1)
       on conflict (key) do update set
         count = case when rate_limits.window_start < now() - ($2::int * interval '1 second')
                      then 1 else rate_limits.count + 1 end,
         window_start = case when rate_limits.window_start < now() - ($2::int * interval '1 second')
                             then now() else rate_limits.window_start end
       returning count`,
      [key, windowSeconds],
    );
    const count = rows[0]?.count ?? 1;
    return { ok: count <= limit, count };
  } catch (error) {
    // Never lock real applicants out because the limiter itself failed.
    console.error("[rate-limit]", error);
    return { ok: true, count: 0 };
  }
}
