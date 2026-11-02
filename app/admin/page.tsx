import Link from "next/link";
import { AdminShell, Card, money, PageTitle, when } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { callsAwaitingOutcome } from "@/lib/db/bookings";
import { eventHealth } from "@/lib/db/events";
import { campaignStats, funnelStats, type FunnelStats } from "@/lib/db/stats";
import { env } from "@/lib/env";

export const instant = false;

const RANGES = [7, 30, 90] as const;

function rate(part: number, whole: number) {
  return whole ? `%${Math.round((part / whole) * 100)}` : "–";
}

function Funnel({ stats }: { stats: FunnelStats }) {
  const steps = [
    { label: "Başvuru", value: stats.leads },
    { label: "Nitelikli", value: stats.qualified },
    { label: "Randevu", value: stats.booked },
    { label: "Görüşmeye geldi", value: stats.attended },
    { label: "Satış", value: stats.won },
  ];
  const max = Math.max(1, stats.leads);
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span>{step.label}</span>
            <span className="t-num">
              {step.value}
              {i > 0 && <span className="ml-2 text-faint">{rate(step.value, steps[i - 1].value)}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-night">
            <div
              className={`h-full rounded-full ${i === steps.length - 1 ? "bg-gold" : "bg-silver/60"}`}
              style={{ width: `${(step.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const params = await searchParams;
  const days = RANGES.find((d) => String(d) === params.d) ?? 30;

  const [stats, campaigns, awaiting, health] = await Promise.all([
    funnelStats(days),
    campaignStats(days, params.by === "ad"),
    callsAwaitingOutcome(user.role === "admin" ? undefined : user.id),
    eventHealth(24 * days),
  ]);
  const failedEvents = health.reduce((sum, row) => sum + row.failed, 0);

  return (
    <AdminShell user={user} active="/admin">
      <PageTitle
        aside={
          <div className="flex gap-1 rounded-xl border border-line p-1 text-sm">
            {RANGES.map((d) => (
              <Link
                key={d}
                href={`/admin?d=${d}${params.by === "ad" ? "&by=ad" : ""}`}
                className={`rounded-lg px-3 py-1 ${d === days ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"}`}
              >
                Son {d} gün
              </Link>
            ))}
          </div>
        }
      >
        Özet
      </PageTitle>

      {env.metaTestEventCode() && (
        <p className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          META_TEST_EVENT_CODE tanımlı: olaylar Meta&apos;da yalnızca Test Events sekmesine düşer. Canlıya çıkmadan önce sil.
        </p>
      )}

      {awaiting.length > 0 && (
        <Card
          className="mb-6 border-gold/40"
          title={`Sonucu girilmemiş ${awaiting.length} görüşme var`}
        >
          <p className="-mt-2 mb-4 text-sm text-muted">
            Meta&apos;nın satışları öğrenebilmesi için her görüşmeden sonra sonucu işaretle.
          </p>
          <ul className="divide-y divide-line">
            {awaiting.slice(0, 8).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span>
                  <span className="font-semibold">{item.lead_full_name}</span>
                  <span className="ml-3 text-sm text-muted">{when(item.start_at)}</span>
                </span>
                <Link href={`/admin/leadler/${item.lead_id}`} className="btn btn-gold btn-sm">
                  Sonucu gir
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Başvuru", value: String(stats.leads), note: `${rate(stats.qualified, stats.leads)} nitelikli` },
          { label: "Randevu", value: String(stats.booked), note: `${rate(stats.booked, stats.qualified)} nitelikliden` },
          { label: "Satış", value: String(stats.won), note: `${rate(stats.won, stats.attended)} görüşmeden` },
          { label: "Ciro", value: money(stats.revenue), note: `${stats.noShow} gelmeyen` },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-muted">{kpi.label}</p>
            <p className="t-num mt-2 text-3xl">{kpi.value}</p>
            <p className="mt-1 text-sm text-faint">{kpi.note}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card title="Huni">
          <Funnel stats={stats} />
          {env.capiRequiresMarketingConsent() && stats.leads > 0 && (
            <p className="mt-5 text-sm text-faint">
              Ölçüm onayı: {rate(stats.consented, stats.leads)}. Meta&apos;ya yalnızca onay verenlerin olayları gider; oran
              düştükçe reklamın öğrendiği satış sayısı azalır.
            </p>
          )}
          <p className="mt-3 text-sm text-faint">
            Meta olayları (son {days} gün):{" "}
            {failedEvents && user.role === "admin" ? (
              <Link href="/admin/durum" className="text-danger underline">
                {failedEvents} başarısız gönderim
              </Link>
            ) : failedEvents ? (
              <span className="text-danger">{failedEvents} başarısız gönderim, yöneticine haber ver</span>
            ) : (
              "sorun yok"
            )}
          </p>
        </Card>

        <Card
          title={
            <span className="flex flex-wrap items-center justify-between gap-3">
              Reklam bazında sonuç
              <span className="flex gap-1 text-sm font-normal">
                <Link
                  href={`/admin?d=${days}`}
                  className={`rounded-lg px-2.5 py-1 ${params.by !== "ad" ? "bg-panel-2" : "text-muted"}`}
                >
                  Kampanya
                </Link>
                <Link
                  href={`/admin?d=${days}&by=ad`}
                  className={`rounded-lg px-2.5 py-1 ${params.by === "ad" ? "bg-panel-2" : "text-muted"}`}
                >
                  Reklam
                </Link>
              </span>
            </span>
          }
        >
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-faint">
                <tr>
                  <th className="pb-2 font-medium">{params.by === "ad" ? "Kampanya / reklam" : "Kampanya"}</th>
                  <th className="pb-2 text-right font-medium">Başvuru</th>
                  <th className="pb-2 text-right font-medium">Nitelikli</th>
                  <th className="pb-2 text-right font-medium">Randevu</th>
                  <th className="pb-2 text-right font-medium">Satış</th>
                  <th className="pb-2 text-right font-medium">Ciro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted">
                      Bu dönemde başvuru yok.
                    </td>
                  </tr>
                )}
                {campaigns.map((row) => (
                  <tr key={`${row.campaign}-${row.ad ?? ""}`}>
                    <td className="py-2.5 pr-3">
                      <span className="font-semibold">{row.campaign}</span>
                      {row.ad && <span className="block text-xs text-muted">{row.ad}</span>}
                    </td>
                    <td className="t-num py-2.5 text-right">{row.leads}</td>
                    <td className="t-num py-2.5 text-right">{row.qualified}</td>
                    <td className="t-num py-2.5 text-right">{row.booked}</td>
                    <td className="t-num py-2.5 text-right">{row.won}</td>
                    <td className="t-num py-2.5 text-right text-gold">{money(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-faint">
            Kaynak: reklam linkindeki utm_campaign / utm_content (ilk temas). Reklam URL&apos;lerine UTM parametrelerini eklemeyi unutma.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
