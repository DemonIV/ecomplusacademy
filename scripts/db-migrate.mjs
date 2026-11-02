#!/usr/bin/env node
// Applies db/migrations/*.sql to the production Postgres (Neon) once each.
// Usage: DATABASE_URL=postgres://… npm run db:migrate
// Locally without DATABASE_URL the app migrates its PGlite database itself.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadEnvFile() {
  // Minimal .env.local reader so the script works without extra packages.
  for (const name of [".env.local", ".env"]) {
    try {
      const text = await readFile(path.join(root, name), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      // file is optional
    }
  }
}

await loadEnvFile();
// DDL goes over the direct connection when one is given (Neon via Vercel Marketplace:
// DATABASE_URL_UNPOOLED); DATABASE_URL is the pooled one the app uses.
// Production values: `vercel env pull .vercel/.env.production --environment=production --yes`, then
// `node --env-file=.vercel/.env.production scripts/db-migrate.mjs`.
const url = (
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL
)?.trim();
if (!url) {
  console.error("DATABASE_URL tanımlı değil. Veritabanı bağlantı adresini ortam değişkenine ekleyin.");
  process.exit(1);
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
// Unknown URL parameters (sslmode, channel_binding, pgbouncer…) would reach the server as startup parameters; SSL is set here.
const sql = postgres(url.split("?")[0], { prepare: false, max: 1, ssl: local ? false : "require", onnotice: () => {} });

try {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const applied = new Set((await sql`select name from schema_migrations`).map((r) => r.name));
  const dir = path.join(root, "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const text = await readFile(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(text).simple();
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`✓ ${file}`);
    count++;
  }
  console.log(count ? `${count} migration uygulandı.` : "Veritabanı güncel.");
} catch (error) {
  console.error("Migration başarısız:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
