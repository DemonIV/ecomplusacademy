import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Applies db/migrations/*.sql in order, once each. Used by the local PGlite
 * database on boot; production runs the same files via `npm run db:migrate`
 * (scripts/db-migrate.mjs) so serverless functions never migrate at runtime.
 */
export async function applyMigrations(
  exec: (sql: string) => Promise<void>,
  query: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
  // Local PGlite only (files are on disk); keep the bundler from tracing the whole project.
  dir = path.join(/* turbopackIgnore: true */ process.cwd(), "db", "migrations"),
): Promise<string[]> {
  await exec(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set((await query("select name from schema_migrations")).map((r) => String(r.name)));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(/* turbopackIgnore: true */ dir, file), "utf8");
    try {
      await exec(`begin;\n${sql}\ninsert into schema_migrations (name) values ('${file.replace(/'/g, "''")}');\ncommit;`);
    } catch (error) {
      await exec("rollback;").catch(() => undefined);
      throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : error}`);
    }
    ran.push(file);
  }
  return ran;
}
