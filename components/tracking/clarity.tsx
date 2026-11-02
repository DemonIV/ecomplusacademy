"use client";

import { useEffect } from "react";
import { useConsent } from "@/components/tracking/consent-store";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

/** Optional Microsoft Clarity heatmaps, loaded under the same consent as the pixel. */
export function Clarity() {
  const { trackingAllowed } = useConsent();
  useEffect(() => {
    if (!CLARITY_ID || !trackingAllowed || document.getElementById("clarity-script")) return;
    const w = window as unknown as { clarity?: ((...args: unknown[]) => void) & { q?: unknown[] } };
    w.clarity =
      w.clarity ||
      Object.assign((...args: unknown[]) => {
        (w.clarity!.q = w.clarity!.q || []).push(args);
      }, {});
    const script = document.createElement("script");
    script.id = "clarity-script";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_ID)}`;
    document.head.appendChild(script);
  }, [trackingAllowed]);
  return null;
}
