import "server-only";
import { io } from "next/cache";
import { env, isProduction } from "@/lib/env";

/**
 * One tiny query interface over two drivers:
 * - production: Neon Postgres via postgres.js (pooled DATABASE_URL,
 *   `prepare: false` as required by PgBouncer-style poolers)
 * - development: embedded PGlite in ./.data/pglite, migrated automatically,
 *   so the whole funnel runs with zero setup.
 * Queries are plain SQL with $1… placeholders; repositories live next to this.
 */

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface Db extends Queryable {
  kind: "postgres" | "pglite";
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}

const globalForDb = globalThis as unknown as { __funnelDb?: Promise<Db> };

/**
 * Every database access is IO: `io()` keeps it out of prerenders and resolves
 * immediately during real requests. PGlite runs Postgres in-process and reads
 * the clock synchronously, which Cache Components rejects while prerendering.
 */
export async function getDb(): Promise<Db> {
  await io();
  globalForDb.__funnelDb ??= createDb().catch((error) => {
    globalForDb.__funnelDb = undefined;
    throw error;
  });
  return globalForDb.__funnelDb;
}

function clean(params: unknown[] = []): unknown[] {
  return params.map((p) => (p === undefined ? null : p));
}

async function createDb(): Promise<Db> {
  const url = env.databaseUrl();
  if (url) return createPostgres(url);
  if (isProduction && !env.allowLocalDb()) {
    throw new Error("DATABASE_URL tanımlı değil (yerel test için ALLOW_LOCAL_DB=true).");
  }
  return createPglite();
}

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  // postgres.js forwards unknown URL parameters (`channel_binding=…`, `pgbouncer=…`)
  // to the server as startup parameters, which the server rejects; SSL is set below.
  const sql = postgres(url.split("?")[0], {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: local ? false : "require",
  });
  type Unsafe = { unsafe: (query: string, params?: never[]) => PromiseLike<unknown> };
  const run =
    (client: Unsafe) =>
    async <T>(text: string, params?: unknown[]) =>
      (await client.unsafe(text, clean(params) as never[])) as T[];
  return {
    kind: "postgres",
    query: run(sql as unknown as Unsafe),
    tx: (fn) => sql.begin((tx) => fn({ query: run(tx as unknown as Unsafe) })) as never,
  };
}

async function createPglite(): Promise<Db> {
  const path = await import("node:path");
  const { mkdir } = await import("node:fs/promises");
  const { PGlite } = await import(/* turbopackIgnore: true */ "@electric-sql/pglite");
  const { btree_gist } = await import(
    /* turbopackIgnore: true */ "@electric-sql/pglite/contrib/btree_gist"
  );
  const dataDir = path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "pglite");
  // PGlite creates only the last path segment itself.
  await mkdir(dataDir, { recursive: true });
  const pg = await PGlite.create(dataDir, { extensions: { btree_gist } });
  const { applyMigrations } = await import("@/lib/db/migrate");
  await applyMigrations((text) => pg.exec(text).then(() => undefined), async (text, params) =>
    (await pg.query(text, params)).rows as Row[],
  );
  return {
    kind: "pglite",
    query: async <T>(text: string, params?: unknown[]) =>
      (await pg.query(text, clean(params))).rows as T[],
    tx: (fn) =>
      pg.transaction((tx) =>
        fn({ query: async <T>(text: string, params?: unknown[]) => (await tx.query(text, clean(params))).rows as T[] }),
      ),
  };
}

/** Postgres error helpers (both drivers expose the SQLSTATE as `code`). */
export function pgErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : undefined;
}

export const PG = {
  uniqueViolation: "23505",
  exclusionViolation: "23P01",
} as const;
