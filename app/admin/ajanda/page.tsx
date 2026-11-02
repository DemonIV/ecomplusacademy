import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AdminShell, Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { BOOKING } from "@/config/booking";
import { WHATSAPP } from "@/content/whatsapp";
import { requireUser } from "@/lib/auth/session";
import {
  addDays,
  formatTrDate,
  formatTrDateTime,
  formatTrTime,
  localDateKey,
  localDateOf,
  zonedTimeToUtc,
} from "@/lib/booking/time";
import { agenda, type AgendaItem } from "@/lib/db/bookings";
import { listMembers } from "@/lib/db/team";
import { formatPhone, whatsappLink } from "@/lib/phone";

export const instant = false;

export const metadata: Metadata = { title: "Ajanda" };

const TZ = BOOKING.timeZone;
const DAYS = 8;

function CallRow({ item, now }: { item: AgendaItem; now: Date }) {
  const live = item.start_at <= now && now < item.end_at;
  const over = item.end_at <= now;
  const needsOutcome = over && item.lead_status === "booked";
  const firstName = item.lead_first_name ?? item.lead_full_name.split(/\s+/)[0];
  return (
    <li className={`grid gap-3 py-3.5 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center ${over && !needsOutcome ? "opacity-60" : ""}`}>
      <span className="t-num text-sm">
        {formatTrTime(item.start_at, TZ)}–{formatTrTime(item.end_at, TZ)}
        {live && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">Şu an</span>}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/leadler/${item.lead_id}`} className="font-semibold hover:text-gold">
            {item.lead_full_name}
          </Link>
          {item.lead_tier && <span className="t-num text-xs text-faint">Segment {item.lead_tier}</span>}
          <StatusBadge status={item.lead_status} />
        </span>
        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>{item.host_label ?? "Görüşmeci atanmamış"}</span>
          <span>{item.location ?? `WhatsApp: ${formatPhone(item.lead_phone)}`}</span>
          {item.join_url && (
            <a className="text-silver underline" href={item.join_url} target="_blank" rel="noopener noreferrer">
              Görüşme bağlantısı
            </a>
          )}
          <a className="underline hover:text-paper" href={whatsappLink(item.lead_phone)} target="_blank" rel="noopener">
            WhatsApp
          </a>
          {!over && !live && (
            <a
              className="underline hover:text-paper"
              href={whatsappLink(item.lead_phone, WHATSAPP.reminder(firstName, formatTrDateTime(item.start_at, TZ)))}
              target="_blank"
              rel="noopener"
            >
              Hatırlat
            </a>
          )}
          {live && (
            <a
              className="underline hover:text-paper"
              href={whatsappLink(item.lead_phone, WHATSAPP.calling(firstName))}
              target="_blank"
              rel="noopener"
            >
              &quot;Arıyorum&quot; yaz
            </a>
          )}
        </span>
      </span>
      {needsOutcome && (
        <Link href={`/admin/leadler/${item.lead_id}`} className="btn btn-gold btn-sm justify-self-start">
          Sonucu gir
        </Link>
      )}
    </li>
  );
}

export default async function AgendaPage({ searchParams }: PageProps<"/admin/ajanda">) {
  const user = await requireUser();
  await connection();
  const params = await searchParams;
  const hosts = (await listMembers()).filter((m) => m.active && m.accepts_bookings);

  // Admins start with the whole team, closers with their own calls.
  const requested = typeof params.host === "string" ? params.host : undefined;
  const scope = requested === "all" || hosts.some((h) => h.id === requested) ? requested : user.role === "admin" ? "all" : user.id;
  const hostId = scope === "all" ? undefined : scope;

  const now = new Date();
  const today = localDateOf(now, TZ);
  const from = zonedTimeToUtc({ ...today, hour: 0, minute: 0 }, TZ);
  const to = zonedTimeToUtc({ ...addDays(today, DAYS), hour: 0, minute: 0 }, TZ);
  const items = await agenda(from, to, hostId);

  const byDay = new Map<string, AgendaItem[]>();
  for (const item of items) {
    const key = localDateKey(localDateOf(item.start_at, TZ));
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, i));
  const chips = [{ id: "all", name: "Tüm ekip" }, ...hosts.map((h) => ({ id: h.id, name: h.name }))];

  return (
    <AdminShell user={user} active="/admin/ajanda">
      <PageTitle aside={<span className="text-sm text-muted">Önümüzdeki {DAYS} gün, {items.length} görüşme</span>}>
        Ajanda
      </PageTitle>

      {hosts.length > 1 && (
        <div className="scrollbar-none -mx-1 mb-6 flex gap-1 overflow-x-auto px-1 text-sm">
          {chips.map((chip) => (
            <Link
              key={chip.id}
              href={`/admin/ajanda?host=${chip.id}`}
              className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${scope === chip.id ? "bg-panel-2" : "text-muted hover:text-paper"}`}
            >
              {chip.id === user.id ? `${chip.name} (sen)` : chip.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {days.map((day, index) => {
          const key = localDateKey(day);
          const calls = byDay.get(key) ?? [];
          const label = formatTrDate(zonedTimeToUtc({ ...day, hour: 12, minute: 0 }, TZ), TZ);
          const prefix = index === 0 ? "Bugün, " : index === 1 ? "Yarın, " : "";
          if (!calls.length) {
            return (
              <p key={key} className="flex justify-between gap-3 rounded-xl border border-line/60 px-5 py-3 text-sm text-faint">
                <span>
                  {prefix}
                  {label}
                </span>
                <span>Görüşme yok</span>
              </p>
            );
          }
          return (
            <Card
              key={key}
              title={
                <span className="flex justify-between gap-3">
                  <span>
                    {prefix}
                    {label}
                  </span>
                  <span className="t-num text-sm font-normal text-muted">{calls.length} görüşme</span>
                </span>
              }
            >
              <ul className="-my-3.5 divide-y divide-line">
                {calls.map((item) => (
                  <CallRow key={item.id} item={item} now={now} />
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-faint">
        Saatler Türkiye saatidir. Randevular Calendly&apos;den gelir: funnel&apos;dan alınanlar hemen, WhatsApp linkiyle
        alınanlar webhook varsa hemen, yoksa her sabahki eşitlemede (ya da Durum → &quot;Şimdi eşitle&quot; ile) görünür.
        Görüşme bitince sonucu işaretle: satışın
        Meta&apos;ya ulaşmasının tek yolu bu.
      </p>
    </AdminShell>
  );
}
