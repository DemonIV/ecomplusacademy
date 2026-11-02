"use client";

import Link from "next/link";
import { setConsent, useConsent } from "@/components/tracking/consent-store";

/**
 * One thin bar: at most two lines of text with both buttons beside it, so
 * the hero headline and CTA stay visible on phones. Full width at the
 * bottom on phones, a compact floating bar from `sm`.
 */
export function ConsentBanner() {
  const { choice, mode } = useConsent();
  if (choice !== "pending") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihi"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-strong bg-panel px-3 pt-2.5 shadow-[0_-14px_32px_-14px_rgb(0_0_0/0.75)] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[34rem] sm:rounded-2xl sm:border sm:px-4 sm:pt-3"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-[0.8rem] leading-snug text-muted sm:text-[0.86rem]">
          {mode === "notice"
            ? "Meta reklam ölçümü için çerez kullanıyoruz."
            : "Meta reklam ölçümü için çerez kullanalım mı?"}{" "}
          <Link href="/cerez" className="whitespace-nowrap text-paper underline underline-offset-2">
            Ayrıntılar
          </Link>
        </p>
        <div className="flex flex-none gap-2">
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setConsent("denied")}>
            Reddet
          </button>
          <button type="button" className="btn btn-gold btn-xs" onClick={() => setConsent("granted")}>
            Kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
