"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/components/tracking/consent-store";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type FbqStub = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbqStub;
  loaded: boolean;
  version: string;
};

/** Meta's base snippet, written out so it can run only after consent. */
function installPixel(pixelId: string) {
  if (window.fbq) return;
  const stub = function (...args: unknown[]) {
    if (stub.callMethod) stub.callMethod(...args);
    else stub.queue.push(args);
  } as FbqStub;
  stub.push = stub;
  stub.loaded = true;
  stub.version = "2.0";
  stub.queue = [];
  window.fbq = stub;
  window._fbq = stub;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  // No automatic button/form "events": every event we send is deliberate.
  stub("set", "autoConfig", false, pixelId);
  stub("init", pixelId);
  stub("track", "PageView");
}

/**
 * Loads the pixel once tracking is allowed and sends PageView on every
 * client-side navigation. Not rendered on /randevu/* (private links) or /admin.
 */
export function MetaPixel() {
  const { trackingAllowed, choice } = useConsent();
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!PIXEL_ID) return;
    if (trackingAllowed) {
      const fresh = !window.fbq;
      installPixel(PIXEL_ID);
      if (fresh) {
        lastPath.current = pathname;
        return;
      }
      window.fbq?.("consent", "grant");
      if (lastPath.current !== pathname) {
        lastPath.current = pathname;
        window.fbq?.("track", "PageView");
      }
    } else if (choice === "denied" && window.fbq) {
      window.fbq("consent", "revoke");
    }
  }, [trackingAllowed, choice, pathname]);

  return null;
}
