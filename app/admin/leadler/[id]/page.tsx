import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { retryLeadEvent, saveNotes, syncLeadCalendly } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { OutcomeForm } from "@/components/admin/outcome-form";
import { AdminShell, Card, money, StatusBadge, when } from "@/components/admin/ui";
import { BOOKING } from "@/config/booking";
import { QUESTIONS, answerLabel, budgetAmountLabel, genderLabel } from "@/config/qualification";
import { WHATSAPP } from "@/content/whatsapp";
import { requireUser } from "@/lib/auth/session";
import { calendlyUrl, toE164 } from "@/lib/calendly/link";
import { listBookingsForLead, type BookingWithHost } from "@/lib/db/bookings";
import { listLeadEvents } from "@/lib/db/events";
import { getLead, listActivity, type LeadActivity } from "@/lib/db/leads";
import type { LeadEvent } from "@/lib/db/events";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { env } from "@/lib/env";

export const instant = false;

export const metadata: Metadata = { title: "Lead" };

const ACTIVITY_LABELS: Record<string, string> = {
  applied: "Başvurdu",
  reapplied: "Tekrar başvurdu",
  reapplied_locked: "Tekrar başvurdu (30 gün kilidi, yine elendi)",
  booked: "Görüşme planladı",
  rescheduled: "Görüşme saati değişti",
  cancelled: "Görüşme iptal edildi",
  outcome_attended: "Sonuç: görüşmeye geldi",
  outcome_no_show: "Sonuç: gelmedi",
  outcome_won: "Sonuç: satış",
  outcome_lost: "Sonuç: kaybedildi",
  notes_updated: "Not güncellendi",
  notification: "Bildirim gönderildi",
};

const CANCEL_LABELS: Record<string, string> = {
  lead_cancelled: "Görüşmeyi kendisi iptal etti",
  team_cancelled: "Görüşme ekip tarafından iptal edildi",
  calendly_rescheduled: "Calendly'de saati değiştirdi",
  superseded: "Yeni randevu aldı, eskisi kapandı",
};

const REASON_LABELS: Record<string, string> = {
  budget: "Bütçe eşiğin altında",
  readiness: "Şu an başlamaya hazır değil",
  reapply_lock: "30 gün içinde tekrar başvuru",
};

const BOOKING_STATUS: Record<string, string> = {
  confirmed: "Planlandı",
  cancelled: "İptal",
  rescheduled: "Saati değişti",
};

const SOURCE_LABELS: Record<string, string> = {
  funnel: "funnel'dan",
  webhook: "Calendly linkiyle",
  sync: "Calendly linkiyle",
};

function isoDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function activityText(item: LeadActivity): string {
  const detail = item.detail ?? {};
  const label = ACTIVITY_LABELS[item.kind] ?? item.kind;
  const reason = typeof detail.reason === "string" ? detail.reason : "";
  const start = isoDate(detail.start);
  const host = typeof detail.host === "string" ? detail.host : "";
  const source = typeof detail.source === "string" ? SOURCE_LABELS[detail.source] : undefined;

  if (item.kind === "booked" || item.kind === "rescheduled") {
    const parts = [start ? when(start) : null, host || null, item.kind === "booked" ? source : null].filter(Boolean);
    return parts.length ? `${label}: ${parts.join(", ")}` : label;
  }
  if (item.kind === "cancelled") return CANCEL_LABELS[reason] ?? (reason ? `${label}: ${reason}` : label);
  return reason ? `${label}: ${REASON_LABELS[reason] ?? reason}` : label;
}

function EventStatus({ event }: { event: LeadEvent }) {
  if (event.status === "sent") {
    return (
      <span className="font-semibold text-success">{event.test_event_code ? "Test Events'e ulaştı" : "Meta'ya ulaştı"}</span>
    );
  }
  if (event.status === "failed") return <span className="font-semibold text-danger">Başarısız</span>;
  const reason = event.skip_reason;
  const why = reason === "no_consent" ? "ölçüm onayı yok" : reason === "not_configured" ? "CAPI ayarlı değil" : reason;
  return <span className="text-muted">Gönderilmedi ({why})</span>;
}

function BookingRow({ booking: b }: { booking: BookingWithHost }) {
  const status =
    b.cancel_reason === "superseded" ? "Yerine yenisi alındı" : (BOOKING_STATUS[b.status] ?? b.status);
  const meta = [b.location, SOURCE_LABELS[b.source], b.status === "cancelled" ? CANCEL_LABELS[b.cancel_reason ?? ""] : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <span className="font-semibold">{b.start_at ? when(b.start_at) : "Saat bekleniyor"}</span>
          {b.host_label && <span className="ml-3 text-sm text-muted">{b.host_label}</span>}
        </span>
        <span className={`text-sm ${b.status === "confirmed" ? "text-success" : "text-muted"}`}>{status}</span>
      </div>
      {meta && <p className="mt-1 text-xs text-faint">{meta}</p>}
      {!b.start_at && b.status === "confirmed" && (
        <p className="mt-1 text-xs text-faint">
          Saat ve görüşmeci, Calendly anahtarı tanımlanınca ilk eşitlemede gelir.
        </p>
      )}
      {b.join_url && b.status === "confirmed" && (
        <a className="mt-1 inline-block text-sm text-silver underline" href={b.join_url} target="_blank" rel="noopener noreferrer">
          Görüşmeye katıl
        </a>
      )}
    </li>
  );
}

export default async function LeadPage({ params }: PageProps<"/admin/leadler/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const [bookings, events, activity] = await Promise.all([
    listBookingsForLead(lead.id),
    listLeadEvents(lead.id),
    listActivity(lead.id),
  ]);
  const active = bookings.find((b) => b.status === "confirmed") ?? null;
  // A failed row stays in the log after a successful retry; only offer retry while unresolved.
  const delivered = new Set(events.filter((e) => e.status === "sent").map((e) => e.event_id));
  const touch = lead.first_touch;
  const lastTouch = lead.last_touch;
  const firstName = lead.first_name ?? lead.full_name.split(/\s+/)[0];

  // Personal Calendly link: details pre-filled, `salesforce_uuid` ties the booking back to this lead.
  const bookingLink = calendlyUrl(
    BOOKING.calendly.url,
    {
      name: lead.full_name,
      email: lead.email,
      phone: toE164(lead.phone),
      instagram: lead.instagram,
      leadId: lead.id,
      utm: { utm_source: "whatsapp", utm_medium: "panel", utm_campaign: touch?.utm_campaign },
    },
    { phoneAnswer: BOOKING.calendly.phoneAnswer, instagramAnswer: BOOKING.calendly.instagramAnswer },
  );

  return (
    <AdminShell user={user} active="/admin/leadler">
      <Link href="/admin/leadler" className="text-sm text-muted hover:text-paper">
        Leadler
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{lead.full_name}</h1>
        <StatusBadge status={lead.status} />
        {lead.tier && (
          <span className="t-num rounded-full border border-line px-2.5 py-0.5 text-xs">
            Segment {lead.tier}, puan {lead.score}
          </span>
        )}
        {lead.status === "won" && <span className="t-num text-gold">{money(lead.deal_value)}</span>}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {active?.start_at ? (
          <a
            className="btn btn-gold btn-sm"
            href={whatsappLink(lead.phone, WHATSAPP.reminder(firstName, when(active.start_at), active.join_url))}
            target="_blank"
            rel="noopener"
          >
            WhatsApp: hatırlat
          </a>
        ) : (
          !active && (
            <a
              className="btn btn-gold btn-sm"
              href={whatsappLink(lead.phone, WHATSAPP.bookingLink(firstName, bookingLink))}
              target="_blank"
              rel="noopener"
            >
              WhatsApp: randevu linki
            </a>
          )
        )}
        {active && (
          <a
            className="btn btn-ghost btn-sm"
            href={whatsappLink(lead.phone, WHATSAPP.waiting(firstName, active.join_url))}
            target="_blank"
            rel="noopener"
          >
            &quot;Zoom&apos;dayım&quot; mesajı
          </a>
        )}
        {active?.reschedule_url && (
          <a
            className="btn btn-ghost btn-sm"
            href={whatsappLink(lead.phone, WHATSAPP.rescheduleLink(firstName, active.reschedule_url))}
            target="_blank"
            rel="noopener"
          >
            Saat değiştirme linki
          </a>
        )}
        <a className="btn btn-ghost btn-sm" href={whatsappLink(lead.phone)} target="_blank" rel="noopener">
          WhatsApp {formatPhone(lead.phone)}
        </a>
        <a className="btn btn-ghost btn-sm" href={`tel:+${lead.phone}`}>
          Ara
        </a>
        <a className="btn btn-ghost btn-sm" href={`mailto:${lead.email}`}>
          {lead.email}
        </a>
        {lead.instagram && (
          <a className="btn btn-ghost btn-sm" href={`https://instagram.com/${lead.instagram}`} target="_blank" rel="noopener">
            @{lead.instagram}
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid content-start gap-6">
          {lead.qualified ? (
            <Card title="Görüşme sonucu">
              <OutcomeForm leadId={lead.id} current={lead.status} amount={lead.deal_value} />
              <p className="mt-4 text-xs text-faint">
                Sonuç, başvurudaki kimlik bilgileriyle Meta&apos;ya &quot;phone_call&quot; kaynağıyla gider. Purchase her lead
                için bir kez gönderilir: tutarı sonradan düzeltirsen panel güncellenir, Meta&apos;daki değer değişmez.
              </p>
            </Card>
          ) : (
            <Card title="Elendi">
              <p className="text-muted">
                Neden: {REASON_LABELS[lead.disqualify_reason ?? ""] ?? lead.disqualify_reason ?? "–"}. Takvim bu kişiye
                açılmadı; Meta&apos;ya Lead yerine DisqualifiedLead gitti, reklam optimizasyonuna girmez. Yine de görüşmek
                istersen WhatsApp&apos;tan randevu linki gönderebilirsin; bu randevu Meta&apos;ya Schedule olarak gitmez.
              </p>
            </Card>
          )}

          <Card title="Görüşmeler">
            {bookings.length === 0 ? (
              <p className="text-muted">
                Henüz görüşme planlanmadı. WhatsApp&apos;tan gönderilen linkle alınan randevu da buraya kendiliğinden düşer.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {bookings.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
              {bookings.some((b) => b.calendly_invitee_uri) && (
                <ActionForm action={syncLeadCalendly}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <SubmitButton className="btn btn-ghost btn-sm" pending="Okunuyor…">
                    Calendly&apos;den yenile
                  </SubmitButton>
                </ActionForm>
              )}
              <p className="text-xs text-faint">
                İptal ve saat değişikliği Calendly&apos;den yapılır; panel kendiliğinden güncellenir.
              </p>
            </div>
          </Card>

          <Card title="Notlar">
            <ActionForm action={saveNotes} className="grid gap-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea
                className="field min-h-32"
                name="notes"
                defaultValue={lead.notes ?? ""}
                placeholder="Görüşmede konuşulanlar, itirazlar, takip tarihi…"
                maxLength={5000}
              />
              <div>
                <SubmitButton className="btn btn-ghost btn-sm">Notu kaydet</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Başvuru cevapları">
            <dl className="grid gap-3">
              {QUESTIONS.map((q) => (
                <div key={q.id}>
                  <dt className="text-xs text-faint">{q.title}</dt>
                  <dd>{lead.answers[q.id] ? answerLabel(q.id, lead.answers[q.id]) : "–"}</dd>
                </div>
              ))}
              {budgetAmountLabel(lead.answers) && (
                <div>
                  <dt className="text-xs text-faint">Tam bütçe</dt>
                  <dd>{budgetAmountLabel(lead.answers)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-faint">Cinsiyet</dt>
                <dd>{genderLabel(lead.answers.gender) ?? "–"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-faint">
              {lead.apply_count} başvuru, son: {when(lead.last_applied_at)}
            </p>
          </Card>

          <Card title="Kaynak">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-faint">Kampanya</dt>
              <dd>{touch?.utm_campaign ?? "–"}</dd>
              <dt className="text-faint">Reklam seti</dt>
              <dd>{touch?.utm_term ?? "–"}</dd>
              <dt className="text-faint">Reklam</dt>
              <dd>{touch?.utm_content ?? "–"}</dd>
              <dt className="text-faint">Kaynak</dt>
              <dd>{[touch?.utm_source, touch?.utm_medium].filter(Boolean).join(" / ") || "–"}</dd>
              {lastTouch && lastTouch.utm_campaign !== touch?.utm_campaign && (
                <>
                  <dt className="text-faint">Son temas</dt>
                  <dd>{lastTouch.utm_campaign ?? "–"}</dd>
                </>
              )}
              <dt className="text-faint">Reklam tıklaması</dt>
              <dd>{lead.fbc ? "Var (fbc)" : lead.fbclid ? "Var (fbclid)" : "Yok"}</dd>
              <dt className="text-faint">Ölçüm onayı</dt>
              <dd>
                {lead.marketing_consent ? (
                  "Var"
                ) : (
                  <span className={env.capiRequiresMarketingConsent() ? "text-danger" : ""}>
                    Yok{env.capiRequiresMarketingConsent() ? " (Meta'ya olay gönderilmez)" : ""}
                  </span>
                )}
              </dd>
              <dt className="text-faint">Giriş sayfası</dt>
              <dd className="truncate" title={lead.landing_url ?? undefined}>
                {lead.landing_url ?? "–"}
              </dd>
            </dl>
          </Card>

          <Card title="Meta olayları">
            {events.length === 0 ? (
              <p className="text-muted">Henüz olay yok.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {events.map((event) => (
                  <li key={event.id} className="py-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold">
                        {event.event_name}
                        {event.value != null && <span className="ml-2 font-normal text-gold">{money(event.value)}</span>}
                      </span>
                      <EventStatus event={event} />
                    </div>
                    <p className="mt-0.5 text-xs text-faint">
                      {when(event.created_at)}, {event.action_source}
                      {event.test_event_code ? `, test kodu ${event.test_event_code}` : ""}
                      {event.fbtrace_id ? `, fbtrace ${event.fbtrace_id}` : ""}
                    </p>
                    {event.error && <p className="mt-1 text-xs break-words text-danger">{event.error}</p>}
                    {event.status === "failed" && !delivered.has(event.event_id) && (
                      <ActionForm action={retryLeadEvent} className="mt-2">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input type="hidden" name="eventId" value={event.event_id} />
                        <SubmitButton className="btn btn-ghost btn-sm" pending="Gönderiliyor…">
                          Tekrar gönder
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Geçmiş">
            <ol className="grid gap-2.5 text-sm">
              {activity.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 flex-none rounded-full bg-line-strong" />
                  <span className="min-w-0">
                    {activityText(item)}
                    {item.detail && "amount" in item.detail && (
                      <span className="ml-2 text-gold">{money(Number(item.detail.amount))}</span>
                    )}
                    <span className="block text-xs text-faint">
                      {when(item.created_at)}
                      {item.actor_name ? `, ${item.actor_name}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
