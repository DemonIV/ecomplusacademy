"use client";

import { useEffect, useState } from "react";
import { useConsent } from "@/components/tracking/consent-store";

/**
 * Mobile bottom bar with the main CTA. Appears once the hero CTA has
 * scrolled away; hidden while the cookie banner needs an answer and while
 * the application section itself is on screen.
 */
export function StickyCta({ label, href = "#basvuru" }: { label: string; href?: string }) {
  const { choice } = useConsent();
  const [pastHero, setPastHero] = useState(false);
  const [atForm, setAtForm] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-hero-cta]");
    const form = document.getElementById("basvuru");
    const observers: IntersectionObserver[] = [];
    if (hero) {
      const o = new IntersectionObserver(([e]) =>
        setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0),
      );
      o.observe(hero);
      observers.push(o);
    }
    if (form) {
      const o = new IntersectionObserver(([e]) => setAtForm(e.isIntersecting), { rootMargin: "0px 0px -20% 0px" });
      o.observe(form);
      observers.push(o);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const show = pastHero && !atForm && choice !== "pending" && choice !== "unknown";

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
