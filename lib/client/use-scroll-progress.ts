"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Scroll-linked progress without re-renders: `compute` maps the element's
 * rect to 0..1, the value is written to a CSS variable on the element and
 * handed to `onProgress` (for canvases). One rAF per scroll frame.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  compute: (rect: DOMRect, viewportHeight: number) => number,
  options: { cssVar?: string; onProgress?: (value: number) => void } = {},
) {
  const latest = useRef({ compute, options });
  useEffect(() => {
    latest.current = { compute, options };
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { compute: fn, options: opts } = latest.current;
      const value = Math.min(1, Math.max(0, fn(el.getBoundingClientRect(), window.innerHeight)));
      if (opts.cssVar) el.style.setProperty(opts.cssVar, value.toFixed(4));
      opts.onProgress?.(value);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
}

/** Fires once the element is at least `threshold` visible; `true` while it stays. */
export function useInView(
  ref: RefObject<Element | null>,
  onChange: (visible: boolean) => void,
  { threshold = 0.5, rootMargin = "0px" }: { threshold?: number; rootMargin?: string } = {},
) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => callback.current(entry.isIntersecting), {
      threshold,
      rootMargin,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);
}
