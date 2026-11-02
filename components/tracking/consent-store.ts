"use client";

import { useSyncExternalStore } from "react";
import { COOKIE, type ConsentChoice, type Touch } from "@/lib/attribution";
import { readCookie, readSession, STORAGE_KEYS } from "@/lib/client/storage";

/**
 * Cookie-banner state shared by the banner, the pixel and analytics.
 * "pending" = no choice yet; "unknown" = server render / before hydration
 * (renders nothing, so returning visitors never see the banner flash).
 * In NEXT_PUBLIC_CONSENT_MODE=notice tracking is allowed while pending; in
 * strict mode (default) only after "granted".
 */

export type ConsentState = ConsentChoice | "pending" | "unknown";

const MODE = process.env.NEXT_PUBLIC_CONSENT_MODE === "notice" ? "notice" : "strict";

let state: ConsentState | null = null;
const listeners = new Set<() => void>();

function current(): ConsentState {
  if (state === null) {
    const stored = readCookie(COOKIE.consent);
    state = stored === "granted" || stored === "denied" ? stored : "pending";
  }
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConsent(): { choice: ConsentState; trackingAllowed: boolean; mode: typeof MODE } {
  const choice = useSyncExternalStore(subscribe, current, () => "unknown" as ConsentState);
  return {
    choice,
    trackingAllowed: choice === "granted" || (MODE === "notice" && choice === "pending"),
    mode: MODE,
  };
}

export async function setConsent(choice: ConsentChoice): Promise<void> {
  state = choice;
  listeners.forEach((l) => l());
  try {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice, touch: readSession<Touch>(STORAGE_KEYS.touch) }),
      keepalive: true,
    });
  } catch {
    // The choice still applies for this page view; it is re-asked next visit.
  }
}
