"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type ReactNode } from "react";
import { Scene3D } from "@/components/three/scene-3d";
import { useScrollProgress } from "@/lib/client/use-scroll-progress";

const FounderCanvas = dynamic(() => import("@/components/three/founder/founder-canvas"), { ssr: false });

type Milestone = { year: string; title: string; text: string };

/** Static stand-in: the same climbing road, drawn as far as the reader has scrolled. */
function RoadFallback({ count }: { count: number }) {
  const nodes = Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1);
    const wobble = i === 0 || i === count - 1 ? 0 : i % 2 ? -20 : 20;
    return [30 + t * 420, 292 - t * 264 + wobble] as const;
  });
  // Catmull-Rom through the nodes, written as cubic Béziers.
  let d = `M${nodes[0][0]} ${nodes[0][1]}`;
  for (let i = 0; i < nodes.length - 1; i++) {
    const p0 = nodes[Math.max(0, i - 1)];
    const p1 = nodes[i];
    const p2 = nodes[i + 1];
    const p3 = nodes[Math.min(nodes.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return (
    <svg viewBox="0 0 480 320" className="size-full" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <path d={d} fill="none" stroke="#3a3833" strokeWidth="6" strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke="#d8b06f"
        strokeWidth="6"
        strokeLinecap="round"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: "calc(1 - var(--road, 0))" }}
      />
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#1b1b1f" stroke="#d8b06f" strokeWidth="3" />
      ))}
    </svg>
  );
}

/**
 * The milestone list drives a scroll-linked 3D road (sticky beside the list
 * on desktop, pinned above it on phones).
 */
export function FounderTimeline({ milestones, intro }: { milestones: Milestone[]; intro: ReactNode }) {
  const list = useRef<HTMLOListElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = milestones.length;

  useScrollProgress(
    list,
    (rect, vh) => {
      const reading = vh * 0.55;
      const p = (reading - rect.top) / rect.height;
      return (p * count - 0.5) / Math.max(1, count - 1);
    },
    {
      onProgress: (value) => {
        progress.current = value;
        root.current?.style.setProperty("--road", value.toFixed(4));
        const index = Math.round(value * (count - 1));
        setActiveIndex((current) => (current === index ? current : index));
      },
    },
  );

  return (
    <div ref={root} className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-16">
      <div className="lg:col-start-2">{intro}</div>

      <div className="sticky top-[var(--header-h)] z-10 -mx-[var(--gutter)] mt-12 h-[230px] self-start bg-night/90 backdrop-blur-sm lg:top-[calc(var(--header-h)+1.5rem)] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-0 lg:h-[calc(100svh-var(--header-h)-3rem)] lg:bg-transparent lg:backdrop-blur-none">
        {/* Soft edges: the camera follows the head, so the road always runs out of frame. */}
        <Scene3D
          fallback={<RoadFallback count={count} />}
          className="relative size-full [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] lg:[mask-image:radial-gradient(closest-side,#000_62%,transparent)]"
        >
          <FounderCanvas progress={progress} milestones={count} />
        </Scene3D>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-night to-transparent lg:hidden" />
      </div>

      <ol ref={list} className="relative mt-6 lg:col-start-2 lg:mt-16">
        {milestones.map((m, i) => (
          <li
            key={m.year}
            data-active={i <= activeIndex ? "true" : undefined}
            className="group relative border-l border-line py-7 pl-7 transition-colors duration-500 data-[active]:border-gold/60"
          >
            <span className="absolute -left-[5px] top-9 size-[9px] rounded-full bg-line-strong transition-colors duration-500 group-data-[active]:bg-gold" />
            <p className="t-num text-[0.95rem] text-faint transition-colors duration-500 group-data-[active]:text-gold">
              {m.year}
            </p>
            <h3 className="t-h3 mt-2">{m.title}</h3>
            <p className="mt-2 max-w-[34rem] text-muted">{m.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
