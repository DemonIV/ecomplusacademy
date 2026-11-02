"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { endSession, requireUser, startSession } from "@/lib/auth/session";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { createWebhook, listWebhooks, me } from "@/lib/calendly/api";
import { refreshInvitee, syncCalendly } from "@/lib/calendly/sync";
import { randomToken, safeEqual } from "@/lib/crypto";
import { listBookingsForLead } from "@/lib/db/bookings";
import { addActivity, updateLeadNotes } from "@/lib/db/leads";
import { countMembers, createMember, getMemberCredentials, setPassword, touchLogin, updateMember } from "@/lib/db/team";
import { sendEmail } from "@/lib/email/send";
import { env, integrations, siteUrl } from "@/lib/env";
import { clientIp } from "@/lib/http";
import { sendCapiEvent } from "@/lib/meta/capi";
import { applyOutcome, retryEvent, sendOutcomeEvents, type Outcome } from "@/lib/outcomes";
import { rateLimit } from "@/lib/rate-limit";

/** Result shown next to the form that triggered the action. */
export type ActionState = { ok: boolean; message: string } | null;

const fail = (message: string): ActionState => ({ ok: false, message });
const done = (message: string): ActionState => ({ ok: true, message });

/* ── Sign-in ──────────────────────────────────────────────────────────── */

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const ip = clientIp(await headers()) ?? "unknown";
  const limited = await rateLimit(`login:${ip}`, 10, 900);
  if (!limited.ok) return fail("Çok fazla deneme. 15 dakika sonra tekrar dene.");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const member = email ? await getMemberCredentials(email) : null;
  const valid = await verifyPassword(password, member?.password_hash ?? null);
  if (!member || !valid || !member.active) return fail("E-posta veya şifre hatalı.");

  await startSession(member);
  await touchLogin(member.id);
  redirect("/admin");
}

/** One-time creation of the first admin, gated by ADMIN_SETUP_TOKEN. */
export async function setupAdmin(_: ActionState, formData: FormData): Promise<ActionState> {
  const ip = clientIp(await headers()) ?? "unknown";
  const limited = await rateLimit(`setup:${ip}`, 5, 900);
  if (!limited.ok) return fail("Çok fazla deneme. 15 dakika sonra tekrar dene.");
  if ((await countMembers()) > 0) return fail("Kurulum zaten tamamlanmış. Giriş yap.");

  const expected = env.adminSetupToken();
  const token = String(formData.get("token") ?? "");
  if (!expected || !safeEqual(token, expected)) return fail("Kurulum kodu hatalı.");

  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), email: z.email().max(160), password: z.string() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Ad, e-posta ve şifreyi kontrol et.");
  const problem = passwordProblem(parsed.data.password);
  if (problem) return fail(problem);

  const member = await createMember({
    email: parsed.data.email,
    name: parsed.data.name,
    role: "admin",
    passwordHash: await hashPassword(parsed.data.password),
    acceptsBookings: true,
  });
  await startSession(member);
  redirect("/admin/ekip");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/giris");
}

/* ── Leads ────────────────────────────────────────────────────────────── */

const outcomeSchema = z.object({
  leadId: z.uuid(),
  outcome: z.enum(["attended", "no_show", "won", "lost"]),
  amount: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) : null)),
  reason: z.string().max(300).optional(),
});

export async function saveOutcome(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = outcomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Geçersiz istek.");
  const { leadId, outcome, amount, reason } = parsed.data;
  if (outcome === "won" && (!amount || !Number.isFinite(amount) || amount <= 0)) return fail("Satış tutarını gir.");

  const result = await applyOutcome({ leadId, outcome: outcome as Outcome, amount, lostReason: reason, actorId: user.id });
  if (!result.ok) return fail(result.error);

  after(() => sendOutcomeEvents(result.lead, outcome as Outcome, amount));
  refresh();
  return done("Kaydedildi. Meta'ya gönderim birkaç saniye içinde aşağıdaki listede görünür.");
}

export async function saveNotes(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const leadId = z.uuid().safeParse(formData.get("leadId"));
  if (!leadId.success) return fail("Geçersiz istek.");
  const notes = String(formData.get("notes") ?? "").slice(0, 5000);
  await updateLeadNotes(leadId.data, notes);
  await addActivity(leadId.data, "notes_updated", null, user.id);
  refresh();
  return done("Not kaydedildi.");
}

export async function retryLeadEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const leadId = z.uuid().safeParse(formData.get("leadId"));
  const eventId = String(formData.get("eventId") ?? "");
  if (!leadId.success || !eventId) return fail("Geçersiz istek.");
  const result = await retryEvent(leadId.data, eventId);
  refresh();
  return result.ok ? done(result.message) : fail(result.message);
}

/** Re-reads this lead's Calendly bookings (cancellations, new times) right now. */
export async function syncLeadCalendly(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const leadId = z.uuid().safeParse(formData.get("leadId"));
  if (!leadId.success) return fail("Geçersiz istek.");
  if (!integrations.calendly()) return fail("CALENDLY_API_TOKEN tanımlı değil.");
  const uris = (await listBookingsForLead(leadId.data))
    .map((b) => b.calendly_invitee_uri)
    .filter((uri): uri is string => Boolean(uri));
  if (!uris.length) return fail("Bu lead için Calendly kaydı yok. Saatlik eşitleme yeni randevuları kendisi bulur.");
  const results = await Promise.all(uris.map((uri) => refreshInvitee(uri)));
  refresh();
  const failed = results.filter((r) => !r.ok);
  return failed.length ? fail(`Bazı kayıtlar okunamadı: ${failed[0].error}`) : done("Calendly'den güncellendi.");
}

/* ── Team ─────────────────────────────────────────────────────────────── */

export async function addMember(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("admin");
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      email: z.email().max(160),
      role: z.enum(["admin", "closer"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Ad, e-posta ve rolü kontrol et.");
  // A readable one-time password the admin hands over; the member changes it.
  const password = `${randomToken(9)}-${randomToken(3)}`;
  try {
    await createMember({
      ...parsed.data,
      passwordHash: await hashPassword(password),
      acceptsBookings: parsed.data.role === "closer",
    });
  } catch {
    return fail("Bu e-posta ile bir ekip üyesi zaten var.");
  }
  refresh();
  return done(`Eklendi. Geçici şifre: ${password} (yalnızca şimdi görünür, üyeye güvenli bir kanaldan ilet).`);
}

export async function saveMemberSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("admin");
  const memberId = z.uuid().safeParse(formData.get("memberId"));
  if (!memberId.success) return fail("Geçersiz istek.");
  const role = formData.get("role") === "admin" ? "admin" : "closer";
  const active = formData.get("active") === "on";
  if (memberId.data === user.id && (!active || role !== "admin")) {
    return fail("Kendi yönetici yetkini veya hesabını buradan kapatamazsın.");
  }
  await updateMember(memberId.data, {
    name: String(formData.get("name") ?? "").trim() || undefined,
    role,
    active,
    acceptsBookings: formData.get("acceptsBookings") === "on",
  });
  refresh();
  return done("Ayarlar kaydedildi.");
}

export async function resetMemberPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("admin");
  const memberId = z.uuid().safeParse(formData.get("memberId"));
  if (!memberId.success) return fail("Geçersiz istek.");
  const password = `${randomToken(9)}-${randomToken(3)}`;
  await setPassword(memberId.data, await hashPassword(password));
  return done(`Yeni geçici şifre: ${password} (eski oturumlar kapatıldı).`);
}

export async function changeOwnPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const credentials = await getMemberCredentials(user.email);
  if (!credentials || !(await verifyPassword(current, credentials.password_hash))) return fail("Mevcut şifre hatalı.");
  const problem = passwordProblem(next);
  if (problem) return fail(problem);
  await setPassword(user.id, await hashPassword(next));
  // session_version changed: start a fresh session for this device.
  await startSession({ id: user.id, session_version: credentials.session_version + 1 });
  return done("Şifren değişti. Diğer cihazlardaki oturumlar kapatıldı.");
}

/* ── Integration checks ───────────────────────────────────────────────── */

export async function testCalendly(): Promise<ActionState> {
  await requireUser("admin");
  const result = await me();
  if (!result.ok) {
    return fail(result.error === "not_configured" ? "CALENDLY_API_TOKEN tanımlı değil." : `Calendly yanıt vermedi: ${result.error}`);
  }
  return done(`Bağlı: ${result.data.name} (${result.data.email}). Takvim linki: ${result.data.scheduling_url}`);
}

/**
 * Creates the invitee.created/canceled webhook once (organisation scope,
 * falling back to the token owner). Calendly's free plan has no webhooks:
 * then the hourly sync keeps doing the job.
 */
export async function setupCalendlyWebhook(): Promise<ActionState> {
  await requireUser("admin");
  const key = env.calendlyWebhookKey();
  if (!integrations.calendly()) return fail("Önce CALENDLY_API_TOKEN tanımla.");
  if (!key) return fail("Önce CALENDLY_WEBHOOK_SIGNING_KEY tanımla (rastgele, en az 32 karakter).");
  const url = `${siteUrl()}/api/calendly/webhook`;
  if (!url.startsWith("https://")) return fail(`Calendly yalnızca https adreslere gönderir. Şu an: ${url}`);

  for (const scope of ["organization", "user"] as const) {
    const existing = await listWebhooks(scope);
    if (existing.ok && existing.data.some((w) => w.callback_url === url && w.state === "active")) {
      return done(`Webhook zaten kurulu (${scope === "organization" ? "tüm ekip" : "yalnızca bu hesap"}).`);
    }
    const created = await createWebhook({ url, scope, signingKey: key });
    if (created.ok) return done(`Webhook kuruldu (${scope === "organization" ? "tüm ekip" : "yalnızca bu hesap"}): ${url}`);
    if (created.status === 403 && scope === "organization") continue;
    if (created.status === 403 || created.status === 402) {
      return fail("Calendly planın webhook desteklemiyor (Standard ve üstü gerekir). Saatlik eşitleme çalışmaya devam eder.");
    }
    return fail(`Webhook kurulamadı: ${created.error}`);
  }
  return fail("Webhook kurulamadı: yetki yok. Hesap sahibinin anahtarıyla tekrar dene.");
}

export async function runCalendlySync(): Promise<ActionState> {
  await requireUser("admin");
  const report = await syncCalendly();
  refresh();
  if (report.skipped) return fail("CALENDLY_API_TOKEN tanımlı değil.");
  if (report.errors.length) return fail(`Eşitleme hatası: ${report.errors[0]}`);
  return done(
    `${report.events} etkinlik tarandı, ${report.checked} kayıt okundu: ${report.matched} lead'le eşleşti, ${report.unmatched} eşleşmedi.`,
  );
}

export async function sendTestEmail(): Promise<ActionState> {
  const user = await requireUser("admin");
  const result = await sendEmail({
    to: user.email,
    subject: "Test e-postası",
    html: "<p>Bu bir test e-postasıdır. Bu mesaj gelen kutuna düştüyse e-posta altyapısı çalışıyor.</p>",
    text: "Bu bir test e-postasıdır. Bu mesaj gelen kutuna düştüyse e-posta altyapısı çalışıyor.",
    tags: { kind: "test" },
  });
  if (result.status === "sent") return done(`Gönderildi (${user.email}). Gelen kutusunu ve spam klasörünü kontrol et.`);
  if (result.status === "skipped") return fail("RESEND_API_KEY / RESEND_FROM tanımlı değil.");
  return fail(`Gönderilemedi: ${result.error}`);
}

export async function sendTestCapi(): Promise<ActionState> {
  const user = await requireUser("admin");
  if (!env.metaTestEventCode()) {
    return fail("Önce META_TEST_EVENT_CODE tanımla: test olayı canlı veriye karışmasın.");
  }
  const result = await sendCapiEvent({
    eventName: "SubmitApplication",
    eventId: `test_${randomToken(8)}`,
    actionSource: "system_generated",
    user: { email: user.email, externalId: `test_${user.id}` },
    customData: { test: true },
  });
  if (result.status === "sent") {
    return done(`Meta aldı (events_received: ${result.eventsReceived}). Events Manager → Test Events sekmesine bak.`);
  }
  if (result.status === "skipped") return fail("Pixel ID veya CAPI erişim belirteci tanımlı değil.");
  return fail(`Hata: ${result.error}`);
}
