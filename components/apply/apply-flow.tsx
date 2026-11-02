"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import { CalendlyEmbed, type ScheduledPayload } from "@/components/booking/calendly-embed";
import type { StoredBooking } from "@/components/thanks/booking-summary";
import { QUESTIONS, type Answers, type QuestionId } from "@/config/qualification";
import { COPY } from "@/content/copy";
import { BRAND } from "@/content/brand";
import { toE164 } from "@/lib/calendly/link";
import { readSession, removeSession, STORAGE_KEYS, writeSession } from "@/lib/client/storage";
import { setUserData, trackEvent } from "@/lib/meta/fbq";
import { eventIds, META_EVENTS } from "@/lib/meta/events";
import { normalizePhone, whatsappLink } from "@/lib/phone";
import type { Touch } from "@/lib/attribution";

/**
 * Application → qualification → Calendly, one decision per screen.
 * Progress is kept in sessionStorage so a reload or an Instagram in-app
 * browser hiccup does not lose answers. Every Meta event fired here reuses
 * the event id the server sends through CAPI, so the pair deduplicates.
 */

const T = COPY.apply;
const QUESTION_COUNT = QUESTIONS.length;
const CONTACT_STEP = QUESTION_COUNT;
const CALENDAR_STEP = QUESTION_COUNT + 1;
const NOTICE_STEP = QUESTION_COUNT + 2;

type Contact = { fullName: string; phone: string; email: string; instagram: string };
type Qualified = {
  leadToken: string;
  leadId: string;
  firstName: string;
  events: { submit: string; lead: string; value: number; currency: string };
};
type NoticeKind = keyof typeof T.notices;
type Saved = {
  step: number;
  answers: Partial<Answers>;
  contact: Contact;
  startedAt: number | null;
  qualified?: Qualified;
  notice?: NoticeKind;
};

const INITIAL: Saved = {
  step: 0,
  answers: {},
  contact: { fullName: "", phone: "", email: "", instagram: "" },
  startedAt: null,
};

type FieldError = Partial<Record<keyof Contact | "kvkk" | "form", string>>;

const noopSubscribe = () => () => {};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { first: parts.slice(0, -1).join(" ") || parts[0], last: parts.length > 1 ? parts[parts.length - 1] : undefined };
}

export function ApplyFlow() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const restored = useMemo(() => (hydrated ? readSession<Saved>(STORAGE_KEYS.apply) : null), [hydrated]);
  const [saved, setSaved] = useState<Saved | null>(null);
  const state = saved ?? restored ?? INITIAL;

  const [picked, setPicked] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldError>({});
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const update = (next: Saved) => {
    setSaved(next);
    writeSession(STORAGE_KEYS.apply, next);
  };

  const focusPanel = () => {
    // Keep the next screen in view on phones without jumping the page around.
    requestAnimationFrame(() => {
      const el = panel.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 64 || top > window.innerHeight * 0.4) el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.focus({ preventScroll: true });
    });
  };

  const answer = (questionId: QuestionId, optionId: string) => {
    if (picked) return;
    if (state.startedAt === null) trackEvent(META_EVENTS.startApplication);
    setPicked(optionId);
    window.setTimeout(() => {
      setPicked(null);
      update({
        ...state,
        answers: { ...state.answers, [questionId]: optionId },
        step: state.step + 1,
        startedAt: state.startedAt ?? Date.now(),
      });
      focusPanel();
    }, 220);
  };

  const back = () => {
    setErrors({});
    update({ ...state, step: Math.max(0, state.step - 1) });
    focusPanel();
  };

  const setContact = (field: keyof Contact, value: string) => {
    update({ ...state, contact: { ...state.contact, [field]: value } });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const validate = (): FieldError => {
    const c = state.contact;
    const next: FieldError = {};
    if (c.fullName.trim().split(/\s+/).filter(Boolean).length < 2) next.fullName = T.errors.fullName;
    if (!normalizePhone(c.phone)) next.phone = T.errors.phone;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) next.email = T.errors.email;
    if (!kvkk) next.kvkk = T.errors.kvkk;
    return next;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`apply-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    const c = state.contact;
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: state.answers,
          fullName: c.fullName.trim(),
          email: c.email.trim(),
          phone: c.phone.trim(),
          instagram: c.instagram.trim() || undefined,
          kvkk: true,
          marketing,
          website: honeypot.current?.value || undefined,
          // Set on the first answer; 0 (unknown) never trips the server's too-fast check.
          startedAt: state.startedAt ?? 0,
          touch: readSession<Touch>(STORAGE_KEYS.touch),
          pageUrl: window.location.href.slice(0, 500),
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | ({ status?: string; error?: string; message?: string; field?: string } & Partial<Qualified>)
        | null;

      if (!res.ok || !body) {
        if (body?.error === "invalid" && body.field && body.field in INITIAL.contact) {
          setErrors({ [body.field]: T.errors[body.field as keyof typeof T.errors] ?? T.errors.generic });
        } else {
          setErrors({ form: body?.message ?? T.errors.generic });
        }
        return;
      }

      const name = splitName(c.fullName);
      const phone = normalizePhone(c.phone);
      setUserData({
        email: c.email,
        phone: phone?.digits,
        firstName: name.first,
        lastName: name.last,
        externalId: body.leadId,
      });

      if (body.status === "qualified" && body.leadToken && body.leadId && body.events) {
        trackEvent(META_EVENTS.submitApplication, {}, body.events.submit);
        trackEvent(META_EVENTS.lead, { value: body.events.value, currency: body.events.currency }, body.events.lead);
        update({
          ...state,
          step: CALENDAR_STEP,
          qualified: {
            leadToken: body.leadToken,
            leadId: body.leadId,
            firstName: body.firstName ?? name.first,
            events: body.events,
          },
        });
        focusPanel();
        return;
      }

      if (body.status === "disqualified") {
        const events = body.events as { submit?: string } | undefined;
        if (events?.submit) trackEvent(META_EVENTS.submitApplication, {}, events.submit);
        removeSession(STORAGE_KEYS.apply);
        router.push("/sonuc");
        return;
      }

      const notice: NoticeKind =
        body.status === "already_booked" || body.status === "known_customer" ? body.status : "received";
      update({ ...state, step: NOTICE_STEP, notice });
      focusPanel();
    } catch {
      setErrors({ form: T.errors.generic });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Calendly confirmed the booking (and e-mails the lead itself), so the
   * lead always moves on to the thank-you page. If recording it here fails,
   * the hourly sync still ties it to the lead through `salesforce_uuid`.
   */
  const scheduled = async ({ inviteeUri }: ScheduledPayload) => {
    const q = state.qualified;
    if (!q) return;
    trackEvent(META_EVENTS.schedule, {}, eventIds.schedule(q.leadId));
    let booking: StoredBooking["booking"] = null;
    try {
      const res = await fetch("/api/calendly/booked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadToken: q.leadToken, inviteeUri, pageUrl: window.location.href.slice(0, 500) }),
      });
      const body = (await res.json().catch(() => null)) as { booking?: StoredBooking["booking"] } | null;
      if (res.ok && body?.booking) booking = body.booking;
    } catch {
      // network hiccup: see above
    }
    const stored: StoredBooking = {
      firstName: q.firstName,
      phone: normalizePhone(state.contact.phone)?.digits ?? null,
      booking,
    };
    writeSession(STORAGE_KEYS.booking, stored);
    removeSession(STORAGE_KEYS.apply);
    router.push("/tesekkurler");
  };

  const calendlyPrefill = () => {
    const touch = readSession<Touch>(STORAGE_KEYS.touch);
    return {
      name: state.contact.fullName.trim(),
      email: state.contact.email.trim(),
      phone: toE164(normalizePhone(state.contact.phone)?.digits),
      leadId: state.qualified?.leadId,
      utm: {
        utm_source: touch?.utm_source,
        utm_medium: touch?.utm_medium,
        utm_campaign: touch?.utm_campaign,
        utm_content: touch?.utm_content,
        utm_term: touch?.utm_term,
      },
    };
  };

  const step = state.step;
  const question = step < QUESTION_COUNT ? QUESTIONS[step] : null;

  return (
    <div
      ref={panel}
      tabIndex={-1}
      className="panel scroll-mt-[calc(var(--header-h)+1rem)] p-5 outline-none sm:p-8"
      aria-live="polite"
    >
      {step < CALENDAR_STEP && (
        <div className="mb-7 flex items-center gap-4">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {Array.from({ length: QUESTION_COUNT + 1 }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-gold" : "bg-line-strong"}`}
              />
            ))}
          </div>
          <span className="t-num text-sm text-muted">
            {Math.min(step + 1, QUESTION_COUNT + 1)}/{QUESTION_COUNT + 1}
          </span>
        </div>
      )}

      {question && (
        <fieldset key={question.id}>
          <legend className="t-h3">{question.title}</legend>
          {question.helper && <p className="mt-2 text-muted">{question.helper}</p>}
          <div className="mt-6 grid gap-2.5">
            {question.options.map((option) => {
              const chosen = picked ? picked === option.id : state.answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => answer(question.id, option.id)}
                  aria-pressed={chosen}
                  className={`flex min-h-[60px] w-full items-center justify-between gap-4 rounded-[var(--radius-control)] border px-4 py-3.5 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.99] ${
                    chosen ? "border-gold bg-gold/[0.12]" : "border-line-strong bg-night/40 hover:border-silver/50"
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    {option.hint && <span className="mt-0.5 block text-sm text-muted">{option.hint}</span>}
                  </span>
                  <span
                    className={`grid size-6 flex-none place-items-center rounded-full border-2 transition-colors ${
                      chosen ? "border-gold bg-gold" : "border-line-strong"
                    }`}
                    aria-hidden="true"
                  >
                    {chosen && <span className="size-2 rounded-full bg-[#1d1404]" />}
                  </span>
                </button>
              );
            })}
          </div>
          {step > 0 && (
            <button type="button" className="mt-6 text-sm font-semibold text-muted underline-offset-4 hover:text-paper hover:underline" onClick={back}>
              {T.back}
            </button>
          )}
        </fieldset>
      )}

      {step === CONTACT_STEP && (
        <form onSubmit={submit} noValidate>
          <h3 className="t-h3">{T.contactTitle}</h3>
          <p className="mt-2 text-muted">{T.contactLead}</p>
          <div className="mt-6 grid gap-4">
            <Field
              id="apply-fullName"
              label={T.fields.fullName.label}
              placeholder={T.fields.fullName.placeholder}
              autoComplete="name"
              value={state.contact.fullName}
              onChange={(v) => setContact("fullName", v)}
              error={errors.fullName}
            />
            <Field
              id="apply-phone"
              label={T.fields.phone.label}
              placeholder={T.fields.phone.placeholder}
              hint={T.fields.phone.hint}
              autoComplete="tel"
              inputMode="tel"
              type="tel"
              value={state.contact.phone}
              onChange={(v) => setContact("phone", v)}
              error={errors.phone}
            />
            <Field
              id="apply-email"
              label={T.fields.email.label}
              placeholder={T.fields.email.placeholder}
              autoComplete="email"
              inputMode="email"
              type="email"
              value={state.contact.email}
              onChange={(v) => setContact("email", v)}
              error={errors.email}
            />
            <Field
              id="apply-instagram"
              label={T.fields.instagram.label}
              optional={T.fields.instagram.optional}
              placeholder={T.fields.instagram.placeholder}
              autoComplete="off"
              value={state.contact.instagram}
              onChange={(v) => setContact("instagram", v)}
            />
            {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
            <div aria-hidden="true" className="absolute left-[-10000px] top-auto size-px overflow-hidden">
              <label htmlFor="apply-website">Web siteniz</label>
              <input ref={honeypot} id="apply-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="flex gap-3 text-[0.92rem] leading-relaxed text-muted">
              <input
                id="apply-kvkk"
                type="checkbox"
                className="check"
                checked={kvkk}
                onChange={(e) => {
                  setKvkk(e.target.checked);
                  if (errors.kvkk) setErrors({ ...errors, kvkk: undefined });
                }}
                aria-invalid={errors.kvkk ? true : undefined}
                aria-describedby={errors.kvkk ? "apply-kvkk-error" : undefined}
              />
              <span>
                {T.kvkk.before}
                <Link href="/kvkk" target="_blank" className="text-paper underline underline-offset-4">
                  {T.kvkk.link}
                </Link>
                {T.kvkk.after}
              </span>
            </label>
            {errors.kvkk && (
              <p id="apply-kvkk-error" className="-mt-2 pl-9 text-sm text-danger">
                {errors.kvkk}
              </p>
            )}
            <label className="flex gap-3 text-[0.92rem] leading-relaxed text-muted">
              <input type="checkbox" className="check" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              <span>{T.marketing}</span>
            </label>
          </div>

          {errors.form && (
            <p className="mt-5 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm" role="alert">
              {errors.form}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-gold" disabled={submitting}>
              {submitting ? T.submitting : T.submit}
            </button>
            <button type="button" className="text-sm font-semibold text-muted underline-offset-4 hover:text-paper hover:underline" onClick={back}>
              {T.back}
            </button>
          </div>
        </form>
      )}

      {step === CALENDAR_STEP && state.qualified && (
        <div>
          <h3 className="t-h3">{T.calendarTitle(state.qualified.firstName)}</h3>
          <p className="mt-2 text-muted">{T.calendarLead}</p>
          <div className="mt-6">
            <CalendlyEmbed
              prefill={calendlyPrefill()}
              onScheduled={scheduled}
              whatsappHref={whatsappLink(BRAND.contact.whatsapp, T.noSlotWhatsappText(state.qualified.firstName))}
            />
          </div>
        </div>
      )}

      {step === NOTICE_STEP && state.notice && (
        <div>
          <h3 className="t-h3">{T.notices[state.notice].title}</h3>
          <p className="mt-3 text-muted">{T.notices[state.notice].text}</p>
          <a
            href={whatsappLink(BRAND.contact.whatsapp)}
            target="_blank"
            rel="noopener"
            className="btn btn-ghost mt-6"
          >
            WhatsApp&apos;tan yaz
          </a>
        </div>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  value,
  onChange,
  ...input
}: {
  id: string;
  label: string;
  optional?: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-[0.92rem] font-semibold">
        {label}
        {optional && <span className="font-normal text-faint">{optional}</span>}
      </label>
      <input
        id={id}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8rem] text-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
