"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Scene3D } from "@/components/three/scene-3d";
import { ProgramIcon } from "@/components/sections/program-icons";
import { useInView } from "@/lib/client/use-scroll-progress";

const ShelfCanvas = dynamic(() => import("@/components/three/shelf/shelf-canvas"), { ssr: false });

type Item = { id: string; title: string; text: string };

function ShelfFallback({ items, active }: { items: readonly Item[]; active: number }) {
  return (
    <div className="relative size-full">
      {items.map((item, i) => {
        const angle = ((i - active) / items.length) * Math.PI * 2;
        // Rounded: server (Node) and browser trig can differ in the last digit and break hydration.
        const x = Math.round((50 + Math.sin(angle) * 34) * 100) / 100;
        const y = Math.round((50 + Math.cos(angle) * 22) * 100) / 100;
        const front = i === active;
        return (
          <span
            key={item.id}
            className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border transition-all duration-500 ${
              front ? "size-24 border-gold bg-gold/15 text-gold" : "size-14 border-line-strong bg-panel text-silver/70"
            }`}
            style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y) }}
          >
            <ProgramIcon id={item.id} className={front ? "size-10" : "size-6"} />
          </span>
        );
      })}
    </div>
  );
}

/**
 * Six programme items beside a 3D turntable. Desktop: hover, focus or tap
 * an item (it also cycles on its own until touched). Phones: swipe the
 * cards; the centred one drives the turntable.
 */
export function ProgramList({ items, intro }: { items: readonly Item[]; intro: ReactNode }) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const touched = useRef(false);
  const list = useRef<HTMLOListElement>(null);
  const section = useRef<HTMLDivElement>(null);

  useInView(section, setInView, { threshold: 0.25 });

  useEffect(() => {
    if (!inView || window.matchMedia("(max-width: 1023px)").matches) return;
    const timer = window.setInterval(() => {
      if (!touched.current && !document.hidden) setActive((i) => (i + 1) % items.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [inView, items.length]);

  // Phones: whichever card is centred in the swipe row is active.
  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (window.matchMedia("(min-width: 1024px)").matches) return;
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root, threshold: 0.7 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const select = (index: number) => {
    touched.current = true;
    setActive(index);
  };

  const selectFromCanvas = (index: number) => {
    select(index);
    const card = list.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (card && window.matchMedia("(max-width: 1023px)").matches) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  return (
    <div ref={section} className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-16">
      <div>{intro}</div>

      <div className="relative -mx-[var(--gutter)] mt-8 aspect-[5/4] self-start lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-0 lg:aspect-square">
        <Scene3D fallback={<ShelfFallback items={items} active={active} />} className="relative size-full">
          <ShelfCanvas ids={items.map((item) => item.id)} active={active} onSelect={selectFromCanvas} />
        </Scene3D>
      </div>

      <ol
        ref={list}
        className="scrollbar-none -mx-[var(--gutter)] mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 lg:mx-0 lg:mt-12 lg:block lg:space-y-1 lg:overflow-visible lg:px-0"
        data-lenis-prevent-touch
      >
        {items.map((item, i) => {
          const isActive = i === active;
          return (
            <li key={item.id} data-index={i} className="w-[80vw] max-w-[22rem] flex-none snap-center lg:w-auto lg:max-w-none">
              <button
                type="button"
                onMouseEnter={() => select(i)}
                onFocus={() => select(i)}
                onClick={() => selectFromCanvas(i)}
                aria-pressed={isActive}
                className={`flex h-full w-full items-start gap-4 rounded-[var(--radius-card)] border p-5 text-left transition-colors duration-300 ${
                  isActive ? "border-gold/50 bg-gold/[0.07]" : "border-line bg-panel/40 lg:border-transparent lg:bg-transparent"
                }`}
              >
                <span
                  className={`grid size-11 flex-none place-items-center rounded-xl transition-colors duration-300 ${
                    isActive ? "bg-gold text-[#1d1404]" : "bg-panel-2 text-silver"
                  }`}
                >
                  <ProgramIcon id={item.id} />
                </span>
                <span>
                  <span className="t-h3 block">{item.title}</span>
                  <span className="mt-1.5 block text-muted">{item.text}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
