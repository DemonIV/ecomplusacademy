"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BOOKING } from "@/config/booking";
import { COPY } from "@/content/copy";
import { CALENDLY_ORIGIN, calendlyUrl, type CalendlyPrefill } from "@/lib/calendly/link";

/**
 * Calendly inline embed as a plain iframe (what Calendly's widget.js and
 * react-calendly render), so no third-party script runs on our page.
 * Calendly reports progress to the parent window with postMessage; only
 * messages from calendly.com are trusted, and the server re-reads the
 * booking from Calendly's API before acting on it.
 */

export type ScheduledPayload = { inviteeUri: string; eventUri: string | null };

type CalendlyMessage = {
  event?: unknown;
  payload?: { height?: unknown; invitee?: { uri?: unknown }; event?: { uri?: unknown } };
};

const T = COPY.booking;
const MIN_HEIGHT = 700;
const noopSubscribe = () => () => {};

export function CalendlyEmbed({
  prefill,
  onScheduled,
  whatsappHref,
}: {
  prefill: CalendlyPrefill;
  onScheduled: (payload: ScheduledPayload) => void;
  whatsappHref: string;
}) {
  const domain = useSyncExternalStore(noopSubscribe, () => window.location.host, () => "");
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [scheduled, setScheduled] = useState(false);
  const handler = useRef(onScheduled);
  useEffect(() => {
    handler.current = onScheduled;
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent<CalendlyMessage>) => {
      if (e.origin !== CALENDLY_ORIGIN) return;
      const data = e.data;
      if (!data || typeof data.event !== "string" || !data.event.startsWith("calendly.")) return;
      if (data.event === "calendly.page_height") {
        const next = Number.parseInt(String(data.payload?.height ?? ""), 10);
        if (Number.isFinite(next)) setHeight(Math.min(Math.max(next, MIN_HEIGHT), 2000));
      }
      if (data.event === "calendly.event_scheduled") {
        const inviteeUri = data.payload?.invitee?.uri;
        const eventUri = data.payload?.event?.uri;
        if (typeof inviteeUri !== "string") return;
        setScheduled(true);
        handler.current({ inviteeUri, eventUri: typeof eventUri === "string" ? eventUri : null });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const options = { phoneAnswer: BOOKING.calendly.phoneAnswer, instagramAnswer: BOOKING.calendly.instagramAnswer };
  const src = domain
    ? calendlyUrl(BOOKING.calendly.url, prefill, { ...options, embed: { domain, colors: BOOKING.calendly.colors } })
    : null;
  const directHref = calendlyUrl(BOOKING.calendly.url, prefill, options);

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-panel"
        style={{ height }}
        data-lenis-prevent
      >
        {!loaded && (
          <div className="absolute inset-0 grid content-start gap-3 p-6" aria-busy="true" aria-live="polite">
            <div className="h-6 w-2/3 animate-pulse rounded-lg bg-panel-2" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 21 }, (_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-full bg-panel-2/70" />
              ))}
            </div>
            <p className="text-sm text-muted">{T.loading}</p>
          </div>
        )}
        {src && (
          <iframe
            src={src}
            title={T.frameTitle}
            className={`size-full transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
        )}
        {scheduled && (
          <div className="absolute inset-0 grid place-items-center bg-night/80 backdrop-blur-sm" role="status">
            <p className="t-h3 text-center">{T.saving}</p>
          </div>
        )}
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        <a className="underline underline-offset-4 hover:text-paper" href={directHref} target="_blank" rel="noopener noreferrer">
          {T.openDirect}
        </a>
        <a className="underline underline-offset-4 hover:text-paper" href={whatsappHref} target="_blank" rel="noopener">
          {T.noSlot}
        </a>
      </p>
    </div>
  );
}
