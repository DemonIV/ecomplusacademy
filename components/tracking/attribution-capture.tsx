"use client";

import { useEffect } from "react";
import { touchFromUrl } from "@/lib/attribution";
import { writeSession, STORAGE_KEYS } from "@/lib/client/storage";

/**
 * Keeps the ad click (fbclid + UTMs) for this visit in sessionStorage. It is
 * sent with the application and, if the visitor accepts cookies later, with
 * the consent call — so attribution survives even before consent.
 */
export function AttributionCapture() {
  useEffect(() => {
    const touch = touchFromUrl(new URL(window.location.href), document.referrer || null);
    if (touch) writeSession(STORAGE_KEYS.touch, touch);
  }, []);
  return null;
}
