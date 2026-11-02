"use client";

import Link from "next/link";
import { setConsent, useConsent } from "@/components/tracking/consent-store";

export function ConsentBanner() {
  const { choice, mode } = useConsent();
  if (choice !== "pending") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihi"
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:max-w-md"
    >
      {/* Opaque on purpose: legibility must not depend on backdrop-filter support. */}
      <div className="rounded-[var(--radius-card)] border border-line-strong bg-panel p-4 shadow-2xl shadow-black/70 sm:p-5">
        <p className="font-display text-[0.95rem] font-medium">Çerez tercihin</p>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted sm:mt-2 sm:text-[0.9rem]">
          {mode === "notice"
            ? "Reklamlarımızın performansını ölçmek için Meta Pixel kullanıyoruz. İstemiyorsan reddedebilirsin; zorunlu çerezler her zaman açıktır."
            : "Reklamlarımızın performansını ölçmek için Meta Pixel ve benzeri çerezleri kullanmak istiyoruz. Zorunlu çerezler her zaman açıktır."}{" "}
          <Link href="/cerez" className="text-paper underline underline-offset-4">
            Çerez politikası
          </Link>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConsent("denied")}>
            Reddet
          </button>
          <button type="button" className="btn btn-gold btn-sm" onClick={() => setConsent("granted")}>
            Kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
