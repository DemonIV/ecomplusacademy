#!/usr/bin/env node
// Sets a new password for a panel account, straight in the database.
// Run it in your own terminal window (the password is typed hidden and never
// leaves this machine except as a hash):
//   npm run admin:password
// It reads the production database address from .vercel/.env.production; get it with
//   vercel env pull .vercel/.env.production --environment=production --yes

import { createInterface } from "node:readline/promises";
import postgres from "postgres";
import { hashPassword, passwordProblem } from "./lib/password-hash.mjs";

const url = (
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL
)?.trim();

if (!url) {
  console.error("Veritabanı adresi bulunamadı. Önce şunu çalıştır:");
  console.error("  vercel env pull .vercel/.env.production --environment=production --yes");
  process.exit(1);
}
if (!process.stdin.isTTY) {
  console.error("Bu komut şifreyi gizli sorar; kendi terminal pencerende çalıştır (PowerShell / Windows Terminal).");
  process.exit(1);
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Reads a line without echoing it (shows * per character). */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    let value = "";
    const finish = (error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish();
        if (ch === "\u0003") return finish(new Error("İptal edildi."));
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = [...value].slice(0, -1).join("");
            stdout.write("\b \b");
          }
          continue;
        }
        if (ch < " ") continue;
        value += ch;
        stdout.write("*");
      }
    };
    stdout.write(question);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return "?";
  }
})();
const sql = postgres(url.split("?")[0], { prepare: false, max: 1, ssl: local ? false : "require", onnotice: () => {} });

try {
  console.log(`Veritabanı: ${host}\n`);
  const members = await sql`select email, name, role, active from team_members order by created_at`;
  if (!members.length) {
    console.log("Hiç panel hesabı yok. İlk hesabı /admin/giris ekranından kurulum koduyla aç.");
    process.exit(0);
  }
  console.log("Hesaplar:");
  for (const m of members) console.log(`  - ${m.email}  (${m.name}, ${m.role}${m.active ? "" : ", pasif"})`);
  console.log("");

  const fallback = members.length === 1 ? members[0].email : "";
  const email = ((await ask(fallback ? `E-posta [${fallback}]: ` : "E-posta: ")) || fallback).toLowerCase();
  const member = members.find((m) => m.email === email);
  if (!member) throw new Error(`"${email}" adlı hesap yok.`);

  const password = await askHidden("Yeni şifre (en az 10 karakter): ");
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  if ((await askHidden("Yeni şifre (tekrar): ")) !== password) throw new Error("Şifreler aynı değil.");

  let activate = false;
  if (!member.active) {
    activate = /^e(vet)?$/i.test(await ask("Bu hesap pasif. Aktif edilsin mi? (e/H): "));
  }

  const hash = await hashPassword(password);
  await sql.begin(async (tx) => {
    // session_version + 1 signs out every open session of this account (same as setPassword()).
    await tx`update team_members
             set password_hash = ${hash}, session_version = session_version + 1,
                 active = ${activate ? true : member.active}, updated_at = now()
             where email = ${email}`;
    // Lift "too many attempts" lockouts so the new password works right away.
    await tx`delete from rate_limits where key like 'login:%'`;
  });

  const site = process.env.SITE_URL?.trim() || "https://ecomplusacademy.com";
  console.log(`\n✓ Şifre güncellendi (${email}). Açık oturumlar kapatıldı.`);
  if (activate) console.log("✓ Hesap aktif edildi.");
  console.log(`Giriş: ${site.replace(/\/$/, "")}/admin/giris`);
} catch (error) {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
