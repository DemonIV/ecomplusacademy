"use client";

import { useMemo, useSyncExternalStore } from "react";
import { BOOKING } from "@/config/booking";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { readSession, STORAGE_KEYS } from "@/lib/client/storage";
import { formatPhone } from "@/lib/phone";

/** What the application flow leaves for this page after Calendly confirmed a booking. */
export type StoredBooking = {
  firstName?: string | null;
  /** Digits with country code: the number we will call on WhatsApp. */
  phone?: string | null;
  /** Filled when Calendly's API answered; null before the API key is set up. */
  booking: {
    start: string;
    end: string;
    hostName: string | null;
    location: string | null;
    rescheduleUrl: string | null;
    cancelUrl: string | null;
  } | null;
};

const T = COPY.thanks;
const noopSubscribe = () => () => {};

function fmt(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("tr-TR", { timeZone, ...options }).format(date);
}

/**
 * Reads the booking the application flow stored for this tab. Visiting the
 * page directly (or in a new tab) shows the generic confirmation instead.
 */
export function BookingSummary() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const stored = useMemo(() => (hydrated ? readSession<StoredBooking>(STORAGE_KEYS.booking) : null), [hydrated]);
  const booking = stored?.booking ?? null;

  if (!stored) {
    return (
      <div>
        <h1 className="t-display max-w-[16ch]">{T.title(null)}</h1>
        <p className="t-lead measure mt-6">{T.fallbackLead}</p>
      </div>
    );
  }

  const phone = stored.phone ? formatPhone(stored.phone) : null;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || BOOKING.timeZone;
  const start = booking ? new Date(booking.start) : null;
  const trTime = start ? fmt(start, BOOKING.timeZone, { hour: "2-digit", minute: "2-digit" }) : null;
  const localTime = start ? fmt(start, zone, { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div>
      <h1 className="t-display max-w-[18ch]">{T.title(stored.firstName ?? null)}</h1>
      <p className="t-lead measure mt-6">{T.lead}</p>

      <div className="panel mt-10 max-w-xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-gold">{BRAND.callName}</p>
        {start ? (
          <>
            <p className="t-h3 mt-3 capitalize">{fmt(start, zone, { weekday: "long", day: "numeric", month: "long" })}</p>
            <p className="t-num mt-1 text-4xl">
              {localTime}
              {localTime !== trTime && <span className="ml-3 align-middle text-base text-muted">TR saati {trTime}</span>}
            </p>
          </>
        ) : (
          <p className="t-h3 mt-3">{T.timeInEmail}</p>
        )}
        <p className="mt-3 text-muted">
          {T.callNote(phone, Boolean(start))}
          {booking?.hostName ? ` ${T.host(booking.hostName)}` : ""}
        </p>
        {(booking?.rescheduleUrl || booking?.cancelUrl) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {booking.rescheduleUrl && (
              <a className="btn btn-ghost btn-sm" href={booking.rescheduleUrl} target="_blank" rel="noopener noreferrer">
                {T.reschedule}
              </a>
            )}
            {booking.cancelUrl && (
              <a className="btn btn-ghost btn-sm" href={booking.cancelUrl} target="_blank" rel="noopener noreferrer">
                {T.cancel}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
