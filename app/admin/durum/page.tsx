import type { Metadata } from "next";
import type { ReactNode } from "react";
import { runCalendlySync, sendTestCapi, sendTestEmail, setupCalendlyWebhook, testCalendly } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { AdminShell, Card, PageTitle, when } from "@/components/admin/ui";
import { BOOKING } from "@/config/booking";
import { requireUser } from "@/lib/auth/session";
import { isCalendlyEventUrl } from "@/lib/calendly/link";
import { getDb } from "@/lib/db";
import { unassignedHosts } from "@/lib/db/bookings";
import { eventHealth } from "@/lib/db/events";
import { listMembers } from "@/lib/db/team";
import { env, integrations, isProduction, missingSecrets, siteUrl } from "@/lib/env";

export const instant = false;

export const metadata: Metadata = { title: "Durum" };

type State = "ok" | "warn" | "off" | "optional";

const STATE_LABEL: Record<State, string> = { ok: "Hazır", warn: "Dikkat", off: "Eksik", optional: "İsteğe bağlı" };
const STATE_TONE: Record<State, string> = {
  ok: "bg-success/15 text-success",
  warn: "bg-gold/20 text-gold",
  off: "bg-danger/15 text-danger",
  optional: "bg-panel-2 text-muted",
};

function Check({ state, label, children }: { state: State; label: string; children: ReactNode }) {
  return (
    <li className="grid gap-1 py-3.5 sm:grid-cols-[13rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
      <span className="font-semibold">{label}</span>
      <span className="text-sm text-muted">{children}</span>
      <span className={`justify-self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE_TONE[state]}`}>
        {STATE_LABEL[state]}
      </span>
    </li>
  );
}

function calendlyLinkCheck(): { state: State; text: ReactNode } {
  const { url, sample } = BOOKING.calendly;
  if (sample) {
    return {
      state: "off",
      text: (
        <>
          <code className="t-num">config/booking.ts</code> içindeki link örnek değer. Müşterinin Calendly etkinlik linkini
          gir ve <code className="t-num">sample</code> işaretini kaldır.
        </>
      ),
    };
  }
  if (!isCalendlyEventUrl(url)) {
    return {
      state: "off",
      text: (
        <>
          Link biçimi tanınmadı: <span className="t-num break-all">{url}</span>. https://calendly.com/hesap/etkinlik
          biçiminde olmalı.
        </>
      ),
    };
  }
  return {
    state: "ok",
    text: (
      <>
        <span className="t-num break-all">{url}</span>. Funnel bu takvimi gösterir; panelden gönderilen WhatsApp linkleri de
        buraya açılır.
      </>
    ),
  };
}

export default async function StatusPage() {
  const user = await requireUser("admin");
  const [db, members, health, strayHosts] = await Promise.all([
    getDb(),
    listMembers(),
    eventHealth(24 * 7),
    unassignedHosts(),
  ]);

  const secrets = missingSecrets();
  const site = siteUrl();
  const webhookUrl = `${site}/api/calendly/webhook`;
  const hosts = members.filter((m) => m.active && m.accepts_bookings);
  const testCode = env.metaTestEventCode();
  const consentGate = env.capiRequiresMarketingConsent();
  const link = calendlyLinkCheck();

  return (
    <AdminShell user={user} active="/admin/durum">
      <PageTitle>Durum</PageTitle>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <Card title="Kurulum">
          <ul className="-my-3.5 divide-y divide-line">
            <Check state={db.kind === "postgres" ? "ok" : isProduction ? "off" : "warn"} label="Veritabanı">
              {db.kind === "postgres"
                ? "Postgres (DATABASE_URL) bağlı."
                : "Yerel gömülü veritabanı (.data/pglite). Yalnızca geliştirme için; canlıda DATABASE_URL gerekir."}
            </Check>
            <Check state={secrets.length ? "off" : "ok"} label="Güvenlik anahtarları">
              {secrets.length
                ? `Eksik: ${secrets.join(", ")}. Canlıda eksik anahtarla ilgili özellik çalışmaz.`
                : "AUTH_SECRET, LEAD_TOKEN_SECRET ve CRON_SECRET tanımlı."}
            </Check>
            <Check state={site.startsWith("https://") ? "ok" : isProduction ? "off" : "warn"} label="Site adresi">
              <span className="t-num break-all">{site}</span>. Calendly webhook adresi ve Meta olaylarındaki sayfa linkleri
              bu adresle üretilir.
            </Check>
            <Check state={env.adminSetupToken() && members.length ? "warn" : "ok"} label="Kurulum kodu">
              {env.adminSetupToken() && members.length
                ? "İlk yönetici oluşturuldu; ADMIN_SETUP_TOKEN değişkenini artık silebilirsin."
                : "Gerek yok."}
            </Check>

            <Check state={link.state} label="Calendly etkinliği">
              {link.text}
            </Check>
            <Check state={integrations.calendly() ? "ok" : "off"} label="Calendly API">
              {integrations.calendly()
                ? "CALENDLY_API_TOKEN tanımlı. Saat, görüşmeci ve iptaller panele bu anahtarla gelir; bağlantıyı yandan test et."
                : "CALENDLY_API_TOKEN yok. Funnel'dan alınan randevular saatsiz kaydedilir; WhatsApp'tan gönderilen linkle alınanlar panele hiç düşmez."}
            </Check>
            <Check state={integrations.calendlyWebhook() ? "ok" : "warn"} label="Calendly webhook">
              {integrations.calendlyWebhook() ? (
                <>
                  İmza anahtarı tanımlı. Calendly&apos;ye bir kez &quot;Webhook&apos;u kur&quot; ile kaydedilir; yeni
                  randevu ve iptaller anında gelir. Adres: <span className="t-num break-all">{webhookUrl}</span>
                </>
              ) : (
                "CALENDLY_WEBHOOK_SIGNING_KEY yok: değişiklikler yalnızca otomatik eşitlemeyle gelir. Anında güncelleme için Calendly Standard plan ve bu anahtar gerekir."
              )}
            </Check>
            <Check state={hosts.length ? (strayHosts.length ? "warn" : "ok") : "warn"} label="Görüşmeciler">
              {hosts.length
                ? `${hosts.map((m) => m.name).join(", ")}. Calendly'deki e-postaları paneldekiyle aynı olmalı.`
                : "Görüşme yapan ekip üyesi yok: randevular kaydedilir ama kimsenin ajandasına düşmez."}
              {strayHosts.length > 0 && (
                <span className="mt-1 block">
                  Panelde hesabı olmayan Calendly görüşmecileri:{" "}
                  {strayHosts.map((h) => `${h.host_name ?? h.host_email} <${h.host_email}> (${h.calls})`).join(", ")}. Bu
                  e-postayla ekip üyesi eklenince görüşmeleri o kişiye bağlanır.
                </span>
              )}
            </Check>

            <Check state={integrations.metaPixel() ? "ok" : "off"} label="Meta Pixel">
              {integrations.metaPixel() ? "NEXT_PUBLIC_META_PIXEL_ID tanımlı." : "NEXT_PUBLIC_META_PIXEL_ID tanımlı değil."}
            </Check>
            <Check state={integrations.metaCapi() ? "ok" : "off"} label="Conversions API">
              {integrations.metaCapi()
                ? "Sunucu olayları gidiyor. Satışlar panelden işaretlendiğinde Purchase olarak ulaşır."
                : "META_CAPI_ACCESS_TOKEN yok: Lead, Schedule ve Purchase sunucudan gönderilemez."}
            </Check>
            <Check state={testCode ? "warn" : "ok"} label="Meta test kodu">
              {testCode
                ? `META_TEST_EVENT_CODE = ${testCode}. Olaylar yalnızca Test Events'e düşer; canlıya çıkmadan sil.`
                : "Tanımlı değil, olaylar canlı veriye gidiyor."}
            </Check>
            <Check state="ok" label="CAPI onay kuralı">
              {consentGate
                ? "Yalnızca formda ölçüm onayı verenlerin olayları Meta'ya gider. Onay vermeyenlerin satışı Meta'ya ulaşmaz."
                : "Tüm başvuruların olayları Meta'ya gider (CAPI_REQUIRE_MARKETING_CONSENT=false). Hukuki dayanak müşteri danışmanınca onaylanmalı."}
            </Check>
            <Check
              state={integrations.email() ? (env.resendReplyTo() ? "ok" : "warn") : "optional"}
              label="Ekip özeti e-postası"
            >
              {integrations.email()
                ? `Görüşmecilere her sabah günün listesi gider. Gönderen: ${env.resendFrom()}. ${env.resendReplyTo() ? `Yanıtlar: ${env.resendReplyTo()}.` : "RESEND_REPLY_TO tanımlı değil; yanıtlar gönderen adrese düşer."}`
                : "Kapalı. Açmak için RESEND_API_KEY ve RESEND_FROM tanımla. Lead'lere e-posta gitmez: onay ve hatırlatmaları Calendly gönderir."}
            </Check>
          </ul>
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Calendly">
            <div className="grid gap-5 text-sm">
              <div>
                <p className="mb-2 text-muted">Anahtarın hangi Calendly hesabına bağlı olduğunu gösterir.</p>
                <ActionForm action={testCalendly}>
                  <SubmitButton className="btn btn-ghost btn-sm" pending="Bağlanılıyor…">
                    Bağlantıyı test et
                  </SubmitButton>
                </ActionForm>
              </div>
              <div className="border-t border-line pt-5">
                <p className="mb-2 text-muted">
                  Son 2 gün ile önümüzdeki 60 günün randevularını şimdi okur. Kendiliğinden her sabah 08:00&apos;de çalışır.
                </p>
                <ActionForm action={runCalendlySync}>
                  <SubmitButton className="btn btn-ghost btn-sm" pending="Eşitleniyor…">
                    Şimdi eşitle
                  </SubmitButton>
                </ActionForm>
              </div>
              <div className="border-t border-line pt-5">
                <p className="mb-2 text-muted">
                  Calendly&apos;ye yeni randevu ve iptalleri anında bildirmesini söyler. Bir kez yeterli; kuruluysa tekrar
                  kurmaz.
                </p>
                <ActionForm action={setupCalendlyWebhook}>
                  <SubmitButton className="btn btn-ghost btn-sm" pending="Kuruluyor…">
                    Webhook&apos;u kur
                  </SubmitButton>
                </ActionForm>
              </div>
            </div>
          </Card>

          <Card title="Test et">
            <div className="grid gap-5 text-sm">
              <div>
                <p className="mb-2 text-muted">
                  Meta&apos;ya test olayı gönderir; yalnızca META_TEST_EVENT_CODE tanımlıyken çalışır.
                </p>
                <ActionForm action={sendTestCapi}>
                  <SubmitButton className="btn btn-ghost btn-sm" pending="Gönderiliyor…">
                    Test CAPI olayı
                  </SubmitButton>
                </ActionForm>
              </div>
              {integrations.email() && (
                <div className="border-t border-line pt-5">
                  <p className="mb-2 text-muted">Kendi adresine ({user.email}) test e-postası gönderir.</p>
                  <ActionForm action={sendTestEmail}>
                    <SubmitButton className="btn btn-ghost btn-sm" pending="Gönderiliyor…">
                      Test e-postası
                    </SubmitButton>
                  </ActionForm>
                </div>
              )}
            </div>
          </Card>

          <Card title="Meta olayları, son 7 gün">
            {health.length === 0 ? (
              <p className="text-sm text-muted">Henüz olay yok.</p>
            ) : (
              <div className="-mx-5 overflow-x-auto px-5">
                <table className="w-full min-w-[360px] text-left text-sm">
                  <thead className="text-faint">
                    <tr>
                      <th className="pb-2 font-medium">Olay</th>
                      <th className="pb-2 text-right font-medium">Ulaştı</th>
                      <th className="pb-2 text-right font-medium">Hata</th>
                      <th className="pb-2 text-right font-medium">Atlandı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {health.map((row) => (
                      <tr key={row.event_name}>
                        <td className="py-2 pr-3">
                          {row.event_name}
                          <span className="block text-xs text-faint">{when(row.last_at)}</span>
                        </td>
                        <td className="t-num py-2 text-right">{row.sent}</td>
                        <td className={`t-num py-2 text-right ${row.failed ? "text-danger" : ""}`}>{row.failed}</td>
                        <td className="t-num py-2 text-right text-muted">{row.skipped}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs text-faint">
              Hata sütunu yalnızca henüz düzeltilmemiş gönderimleri sayar; lead sayfasından tekrar gönderebilirsin. Atlananlar
              ölçüm onayı olmayan veya CAPI kurulmadan önceki olaylardır.
            </p>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
