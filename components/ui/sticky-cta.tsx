"use client";

import { useEffect, useState } from "react";
import { useConsent } from "@/components/tracking/consent-store";

/**
 * Mobile bottom bar with the main CTA, on screen for the whole page except:
 * - while the hero's own CTA is visible (no second button on the first screen),
 * - from just before the application section scrolls in until it has left,
 *   so the bar never covers the form,
 * - while a form field has focus (on-screen keyboard),
 * - while the cookie bar, which uses the same spot, waits for an answer.
 */
export function StickyCta({ label, href = "#basvuru" }: { label: string; href?: string }) {
  const { choice } = useConsent();
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  const [nearForm, setNearForm] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const heroCta = document.querySelector("[data-hero-cta]");
    const form = document.getElementById("basvuru");
    const observers: IntersectionObserver[] = [];
    if (heroCta) {
      const o = new IntersectionObserver(([e]) => setHeroCtaVisible(e.isIntersecting));
      o.observe(heroCta);
      observers.push(o);
    }
    if (form) {
      // The root reaches 25% below the screen: the bar slides away before the section's top edge shows.
      const o = new IntersectionObserver(([e]) => setNearForm(e.isIntersecting), { rootMargin: "0px 0px 25% 0px" });
      o.observe(form);
      observers.push(o);
    }
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && el.matches("input:not([type=checkbox]):not([type=radio]), textarea, select");
    const onFocusIn = (e: FocusEvent) => setTyping(isField(e.target));
    const onFocusOut = (e: FocusEvent) => setTyping(isField(e.relatedTarget));
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      observers.forEach((o) => o.disconnect());
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const show = !heroCtaVisible && !nearForm && !typing && choice !== "pending" && choice !== "unknown";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-night/85 px-4 pt-3 backdrop-blur-xl transition-transform duration-300 md:hidden"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        transform: show ? "translateY(0)" : "translateY(110%)",
      }}
      aria-hidden={!show}
    >
      <a href={href} className="btn btn-gold w-full" tabIndex={show ? 0 : -1}>
        {label}
      </a>
    </div>
  );
}
