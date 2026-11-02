#!/usr/bin/env node
/**
 * Pre-launch gate: `npm run prelaunch` (exit code 1 while anything blocks).
 *
 * 1. Placeholder content: every `sample: true` in content/ and config/,
 *    stock-media hotlinks and template brand values.
 * 2. Production environment: required variables, unsafe flags, the Meta
 *    test code. Reads process.env plus the .env files Next.js loads in
 *    production. To check Vercel's values:
 *      vercel env pull .env.production.local --environment=production
 *      npm run prelaunch
 *    Secret values are never printed, only variable names.
 *
 * `--content-only` skips the environment part.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const contentOnly = process.argv.includes("--content-only");

const blockers = [];
const warnings = [];
const passed = [];

/* ── 1. Content ─────────────────────────────────────────────────────────── */

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx|mjs|js|json)$/.test(name) ? [path] : [];
  });
}

const isComment = (line) => /^\s*(\/\/|\/\*|\*)/.test(line);

/** Lines (1-based) matching `pattern` outside comments. */
function matches(file, pattern) {
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .flatMap((line, index) => (!isComment(line) && pattern.test(line) ? [index + 1] : []));
}

const lineList = (lines) => (lines.length > 8 ? `${lines.slice(0, 8).join(", ")}…` : lines.join(", "));

const contentFiles = [...walk(join(root, "content")), ...walk(join(root, "config"))];

const samples = contentFiles
  .map((file) => ({ file, lines: matches(file, /\bsample:\s*true\b/) }))
  .filter((entry) => entry.lines.length);
if (samples.length) {
  blockers.push({
    title: "Örnek içerik duruyor (sample: true)",
    details: samples.map(
      ({ file, lines }) => `${relative(root, file)}: ${lines.length} yer (satır ${lineList(lines)})`,
    ),
    fix: "Gerçek metin, referans ve rakamları girip ilgili satırlardaki sample: true işaretini kaldır. KVKK metinleri hukukçudan gelmeli.",
  });
} else {
  passed.push("Örnek içerik işareti yok");
}

const STOCK_HOSTS = /assets\.mixkit\.co|videos\.pexels\.com|images\.pexels\.com|pixabay\.com|images\.unsplash\.com/;
const scanForMedia = [...contentFiles, ...walk(join(root, "components")), ...walk(join(root, "app"))];
const stock = scanForMedia
  .map((file) => ({ file, lines: matches(file, STOCK_HOSTS) }))
  .filter((entry) => entry.lines.length);
if (stock.length) {
  blockers.push({
    title: "Geçici stok medya kullanılıyor",
    details: stock.map(({ file, lines }) => `${relative(root, file)}: satır ${lineList(lines)}`),
    fix: "Gerçek video ve görselleri content/media.ts'e gir (videolar Vercel Blob'da; nasıl yükleneceği dosyanın başında).",
  });
} else {
  passed.push("Stok medya bağlantısı yok");
}

const PLACEHOLDERS =
  /markaniz|ornek-hesap|905000000000|0000000000000000|Kurucu Adı|Şirket Ünvanı|Öğrenci Adı|\[İş türü\]|\[…\]/;
const placeholders = contentFiles
  .map((file) => ({ file, lines: matches(file, PLACEHOLDERS) }))
  .filter((entry) => entry.lines.length);
if (placeholders.length) {
  blockers.push({
    title: "Yer tutucu marka bilgisi",
    details: placeholders.map(({ file, lines }) => `${relative(root, file)}: satır ${lineList(lines)}`),
    fix: "content/brand.ts'teki ünvan, MERSİS, iletişim ve sosyal medya bilgilerini, config/booking.ts'teki Calendly etkinlik linkini müşterinin gerçek bilgileriyle değiştir.",
  });
} else {
  passed.push("Yer tutucu marka bilgisi yok");
}

/* ── 2. Environment ─────────────────────────────────────────────────────── */

function parseEnvFile(path) {
  const values = {};
  if (!existsSync(path)) return values;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    values[match[1]] = value;
  }
  return values;
}

if (!contentOnly) {
  // Same precedence as Next.js in production: process.env first, then these files in order.
  const envFiles = [".env.production.local", ".env.local", ".env.production", ".env"];
  const loaded = envFiles.filter((name) => existsSync(join(root, name)));
  const env = {};
  for (const name of [...envFiles].reverse()) Object.assign(env, parseEnvFile(join(root, name)));
  for (const [key, value] of Object.entries(process.env)) if (value !== undefined) env[key] = value;
  const get = (name) => (env[name] ?? "").trim();

  const REQUIRED = {
    "Veritabanı": ["DATABASE_URL"],
    "Güvenlik": ["AUTH_SECRET", "LEAD_TOKEN_SECRET", "CRON_SECRET"],
    "Meta": ["NEXT_PUBLIC_META_PIXEL_ID", "META_CAPI_ACCESS_TOKEN"],
    "Calendly": ["CALENDLY_API_TOKEN"],
  };
  // Some Marketplace databases provide only POSTGRES_URL; the app accepts either.
  const present = (name) => Boolean(get(name) || (name === "DATABASE_URL" && get("POSTGRES_URL")));
  const missing = Object.entries(REQUIRED).flatMap(([group, names]) =>
    names.filter((name) => !present(name)).map((name) => `${group}: ${name}`),
  );
  if (missing.length) {
    blockers.push({
      title: "Eksik ortam değişkenleri",
      details: missing,
      fix: "Vercel → Project → Settings → Environment Variables (Production) altına ekle. Açıklamalar .env.example içinde.",
    });
  } else {
    passed.push("Zorunlu ortam değişkenleri tanımlı");
  }

  const site = get("SITE_URL");
  if (!site || !/^https:\/\//.test(site) || /localhost|127\.0\.0\.1/.test(site)) {
    blockers.push({
      title: "SITE_URL canlı adres değil",
      details: [site ? `Şu an: ${site}` : "Tanımlı değil"],
      fix: "Canlı domaini https:// ile gir (Calendly webhook adresi ve Meta olaylarındaki sayfa linkleri bu adresi kullanır).",
    });
  } else {
    passed.push(`SITE_URL: ${site}`);
  }

  const secretNames = [...REQUIRED["Güvenlik"], "CALENDLY_WEBHOOK_SIGNING_KEY"].filter((name) => get(name));
  const weak = secretNames.filter((name) => get(name).length < 32 || get(name).startsWith("dev-insecure"));
  const values = secretNames.map(get);
  const reused = new Set(values).size !== values.length;
  if (weak.length || reused) {
    blockers.push({
      title: "Zayıf veya tekrar kullanılan gizli anahtar",
      details: [
        ...weak.map((name) => `${name} en az 32 karakter olmalı`),
        ...(reused ? ["Güvenlik anahtarlarının her biri farklı olmalı"] : []),
      ],
      fix: `Her biri için ayrı değer üret: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`,
    });
  } else if (secretNames.length) {
    passed.push("Gizli anahtarlar yeterince uzun ve birbirinden farklı");
  }

  const unsafe = ["META_TEST_EVENT_CODE", "ALLOW_INSECURE_DEV_SECRETS", "ALLOW_LOCAL_DB"].filter((name) => get(name));
  if (unsafe.length) {
    blockers.push({
      title: "Canlıda olmaması gereken değişkenler",
      details: unsafe.map((name) =>
        name === "META_TEST_EVENT_CODE"
          ? "META_TEST_EVENT_CODE: olaylar yalnızca Test Events'e düşer, optimizasyona girmez"
          : `${name}: yalnızca yerel test içindir`,
      ),
      fix: "Bu değişkenleri Production ortamından sil.",
    });
  } else {
    passed.push("Test ve geliştirme bayrakları kapalı");
  }

  if (get("CALENDLY_API_TOKEN") && !get("CALENDLY_API_TOKEN").startsWith("eyJ")) {
    warnings.push(
      "CALENDLY_API_TOKEN beklenen biçimde değil ('eyJ' ile başlar). Calendly → Integrations → API & Webhooks → Personal access token.",
    );
  }
  if (!get("CALENDLY_WEBHOOK_SIGNING_KEY")) {
    warnings.push(
      "CALENDLY_WEBHOOK_SIGNING_KEY yok: Calendly'deki değişiklikler (WhatsApp linkiyle alınan randevu, iptal) panele yalnızca otomatik eşitlemeyle gelir. Anında güncelleme için Calendly Standard plan + bu anahtar + /admin/durum → Webhook'u kur.",
    );
  }
  const syncCron = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")).crons?.find((c) => c.path === "/api/cron/calendly-sync");
  if (syncCron && /^\d+ \d+ /.test(syncCron.schedule)) {
    warnings.push(
      `Calendly eşitlemesi günde bir kez çalışıyor (${syncCron.schedule} UTC; Vercel Hobby sınırı). Webhook yoksa WhatsApp linkiyle alınan randevular ertesi sabaha kadar panele düşmeyebilir; panelde "Şimdi eşitle" var. Saatlik için Vercel Pro + vercel.json'da "0 * * * *".`,
    );
  }
  if (!get("RESEND_API_KEY") || !get("RESEND_FROM")) {
    warnings.push("RESEND_API_KEY / RESEND_FROM yok: görüşmecilere günlük özet e-postası gitmez (isteğe bağlı).");
  }
  if (get("RESEND_API_KEY") && !get("RESEND_API_KEY").startsWith("re_")) {
    warnings.push("RESEND_API_KEY 're_' ile başlamıyor; doğru anahtarı kopyaladığından emin ol.");
  }
  if (get("NEXT_PUBLIC_META_PIXEL_ID") && !/^\d{10,20}$/.test(get("NEXT_PUBLIC_META_PIXEL_ID"))) {
    warnings.push("NEXT_PUBLIC_META_PIXEL_ID yalnızca rakamlardan oluşmalı (Events Manager'daki veri kümesi kimliği).");
  }
  if (/markaniz|example\.com/i.test(get("RESEND_FROM"))) {
    blockers.push({
      title: "RESEND_FROM örnek adres",
      details: [get("RESEND_FROM")],
      fix: "Resend'de doğrulanmış kendi domaininden bir gönderici gir, örn. ekip@mail.<domain>.",
    });
  }
  if (get("ADMIN_SETUP_TOKEN")) {
    warnings.push("ADMIN_SETUP_TOKEN tanımlı. İlk yönetici hesabı oluşturulduktan sonra sil.");
  }
  if (get("ALLOW_INDEXING") !== "true") {
    warnings.push("Site arama motorlarına kapalı (noindex). Gerçek içerik girilince ALLOW_INDEXING=true yap ve yeniden deploy et.");
  }
  warnings.push(
    get("CAPI_REQUIRE_MARKETING_CONSENT") === "false"
      ? "CAPI_REQUIRE_MARKETING_CONSENT=false: tüm başvuruların olayları Meta'ya gider. Hukuki dayanağı müşterinin danışmanı onaylamalı."
      : "CAPI olayları yalnızca ölçüm onayı verenler için gidiyor (varsayılan). Onay oranını panelden izle; düşükse Meta'ya giden satış sinyali azalır.",
  );
  if (!loaded.length) {
    warnings.push(
      "Yerelde .env dosyası yok; yalnızca process.env okundu. Vercel değerleri için: vercel env pull .vercel/.env.production --environment=production --yes, sonra node --env-file=.vercel/.env.production scripts/prelaunch-check.mjs",
    );
  }
}

/* ── Report ─────────────────────────────────────────────────────────────── */

const out = [];
out.push("", "Canlıya çıkış kontrolü", "");
for (const blocker of blockers) {
  out.push(`  ✗ ${blocker.title}`);
  for (const detail of blocker.details) out.push(`      ${detail}`);
  out.push(`      → ${blocker.fix}`, "");
}
for (const warning of warnings) out.push(`  ! ${warning}`);
if (warnings.length) out.push("");
for (const item of passed) out.push(`  ✓ ${item}`);
out.push(
  "",
  blockers.length
    ? `Sonuç: ${blockers.length} engel, ${warnings.length} not. Engeller giderilmeden canlıya çıkma.`
    : `Sonuç: engel yok, ${warnings.length} not. Elle kontrol listesi: gerçek telefonda uçtan uca Calendly randevusu, Meta Test Events'te Lead ve Schedule, panelde randevunun saat ve görüşmeciyle görünmesi.`,
  "",
);
console.log(out.join("\n"));
process.exit(blockers.length ? 1 : 0);
