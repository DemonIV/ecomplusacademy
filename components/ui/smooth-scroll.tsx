"use client";

import { useEffect } from "react";

/**
 * Lenis smooth scrolling for mouse/trackpad only. Touch devices (most Meta
 * ad traffic, inside Instagram's browser) keep native scrolling, and
 * reduced-motion users get no smoothing at all.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || touch) return;

    let lenis: { destroy: () => void } | undefined;
    let cancelled = false;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.11,
        anchors: { offset: -76 },
        allowNestedScroll: true,
      });
    });
    return () => {
      cancelled = true;
      lenis?.destroy();
    };
  }, []);
  return null;
}
