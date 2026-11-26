"use client";

import { useEffect, useRef } from "react";
import { useConsent } from "@/components/tracking/consent-store";
import { trackEvent } from "@/lib/meta/fbq";

/**
 * Sends one pixel event for this page view as soon as tracking is allowed:
 * at once for a visitor who accepted earlier, or right after "Kabul et".
 * MetaPixel sits after the page in the layout and may mount in a later
 * commit, so this waits (up to 5 s) for its fbq queue instead of dropping
 * the event.
 */
export function TrackOnce({ event, params }: { event: string; params?: Record<string, unknown> }) {
  const { trackingAllowed } = useConsent();
  const sent = useRef(false);

  useEffect(() => {
    if (!trackingAllowed || sent.current) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      if (typeof window.fbq !== "function" && ++tries < 50) return;
      window.clearInterval(timer);
      if (typeof window.fbq !== "function") return;
      sent.current = true;
      trackEvent(event, params);
    }, 100);
    return () => window.clearInterval(timer);
  }, [trackingAllowed, event, params]);

  return null;
}
