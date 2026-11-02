"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { VideoModal } from "@/components/video/video-modal";
import { useInView } from "@/lib/client/use-scroll-progress";

export type Story = {
  name: string;
  date: string;
  stage: string;
  result: string;
  sample?: boolean;
  poster: string;
  preview: string;
  full: string;
};

const AUTOPLAY_MS = 5200;

function Chevron({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-5 ${flip ? "rotate-180" : ""}`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m14.5 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 3D coverflow of 9:16 student stories. Swipe or use the arrows; it
 * advances on its own only while on screen and until the visitor touches
 * it. The centre card plays a muted preview; tapping it opens the full
 * video with sound.
 */
export function Coverflow({ stories }: { stories: Story[] }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const n = stories.length;

  useInView(stage, setInView, { threshold: 0.35 });

  useEffect(() => {
    if (!inView || open !== null) return;
    const timer = window.setInterval(() => {
      if (!interacted.current && !document.hidden) setIndex((i) => (i + 1) % n);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [inView, open, n]);

  const go = (next: number) => {
    interacted.current = true;
    setIndex(((next % n) + n) % n);
  };

  return (
    <div>
      <div
        ref={stage}
        role="region"
        aria-roledescription="carousel"
        aria-label="Öğrenci hikâyeleri"
        tabIndex={0}
        className="coverflow relative mx-auto h-[calc(min(68vw,290px)*1.7778)] w-full select-none rounded-[var(--radius-card)]"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") go(index + 1);
          if (event.key === "ArrowLeft") go(index - 1);
        }}
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, moved: false };
        }}
        onPointerMove={(event) => {
          if (drag.current && Math.abs(event.clientX - drag.current.x) > 8) drag.current.moved = true;
        }}
        onPointerUp={(event) => {
          const start = drag.current;
          if (!start) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          if (!start.moved) drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {stories.map((story, i) => {
          let offset = i - index;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;
          const abs = Math.abs(offset);
          const center = offset === 0;
          return (
            <button
              key={i}
              type="button"
              className="coverflow-card block w-[min(68vw,290px)] overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-deep text-left shadow-2xl shadow-black/50"
              style={
                {
                  "--offset": offset,
                  "--abs": Math.min(abs, 3),
                  zIndex: 10 - abs,
                  visibility: abs > 2 ? "hidden" : "visible",
                } as CSSProperties
              }
              tabIndex={center ? 0 : -1}
              aria-label={center ? `${story.name}: hikâyeyi izle` : `${story.name} hikâyesine geç`}
              onClick={() => {
                if (drag.current?.moved) {
                  drag.current = null;
                  return;
                }
                drag.current = null;
                if (center) {
                  interacted.current = true;
                  setOpen(i);
                } else go(i);
              }}
            >
              <div className="relative aspect-[9/16]">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote poster, fixed card size */}
                <img src={story.poster} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" draggable={false} />
                {center && inView && open === null && (
                  <video
                    key={story.preview}
                    src={story.preview}
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="none"
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/25 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[0.75rem] font-bold text-[#1d1404]">
                  {story.result}
                </span>
                {story.sample && <span className="sample-badge absolute right-3 top-3">Örnek</span>}
                {center && (
                  <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper/15 text-paper backdrop-blur-md">
                    <svg viewBox="0 0 24 24" className="ml-0.5 size-6" aria-hidden="true">
                      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                    </svg>
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-[1.05rem] font-medium">{story.name}</p>
                  <p className="mt-1 text-sm text-muted">{story.stage}</p>
                  <p className="mt-0.5 text-[0.8rem] text-faint">{story.date}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button type="button" className="btn btn-ghost btn-sm size-11 px-0" onClick={() => go(index - 1)} aria-label="Önceki hikâye">
          <Chevron />
        </button>
        <div className="flex items-center gap-2">
          {stories.map((story, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}. hikâye`}
              aria-current={i === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-7 bg-gold" : "w-2 bg-line-strong"}`}
            />
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm size-11 px-0" onClick={() => go(index + 1)} aria-label="Sonraki hikâye">
          <Chevron flip />
        </button>
      </div>

      {open !== null && (
        <VideoModal
          src={stories[open].full}
          poster={stories[open].poster}
          title={`${stories[open].name} hikâyesi`}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
