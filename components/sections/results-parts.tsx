"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Scene3D } from "@/components/three/scene-3d";
import { useInView } from "@/lib/client/use-scroll-progress";

const RevenueCanvas = dynamic(() => import("@/components/three/bars/revenue-canvas"), { ssr: false });

/* ── Counters ──────────────────────────────────────────────────────────── */

export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) =>
    n.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  const done = useRef(false);

  useInView(
    ref,
    (visible) => {
      const el = ref.current;
      if (!visible || !el || done.current) return;
      done.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const startedAt = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - startedAt) / 1400);
        el.textContent = format(value * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { threshold: 0.6 },
  );

  // Server and no-JS render the final number; the animation replays it from 0.
  return (
    <span ref={ref} className="t-num">
      {format(value)}
    </span>
  );
}

/* ── Curved gallery ────────────────────────────────────────────────────── */

export type DashboardItem = {
  store: string;
  period: string;
  total: string;
  orders: number;
  trend: readonly number[];
  sample?: boolean;
};

function Sparkline({ points }: { points: readonly number[] }) {
  const id = useId();
  const max = Math.max(...points);
  const coords = points.map((p, i) => [(i / (points.length - 1)) * 100, 38 - (p / max) * 32] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d8b06f" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d8b06f" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L100 40L0 40Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="#ecd3a5" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Dashboard({ item }: { item: DashboardItem }) {
  return (
    <div className="relative size-full overflow-hidden rounded-[18px] border border-line-strong bg-gradient-to-b from-[#faf8f4] to-[#ece8e1] p-4 text-[#16151a] shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between gap-2 text-[0.78rem]">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="size-2 rounded-full bg-success" />
          {item.store}
        </span>
        <span className="rounded-md bg-[#16151a]/[0.06] px-2 py-0.5 text-[#5d5850]">{item.period}</span>
      </div>
      <p className="mt-4 text-[0.78rem] text-[#5d5850]">Toplam satış</p>
      <div className="flex items-end justify-between gap-2">
        <p className="t-num text-[1.65rem] font-semibold leading-tight">{item.total}</p>
        <p className="pb-1 text-[0.8rem] text-[#5d5850]">{item.orders} sipariş</p>
      </div>
      <div className="mt-2 rounded-lg bg-[#16151a] p-2">
        <Sparkline points={item.trend} />
      </div>
      {item.sample && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[16deg] font-display text-[3.2rem] font-semibold text-[#c99a62]/25"
          aria-hidden="true"
        >
          Örnek
        </span>
      )}
    </div>
  );
}

/**
 * Store dashboards on a slowly turning 3D cylinder. Drag to spin (with
 * inertia and snapping); it turns on its own only while on screen.
 */
export function RingGallery({ items }: { items: readonly DashboardItem[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const motion = useRef({ angle: 0, velocity: 0, dragging: false, lastX: 0, touched: false, visible: false });
  const n = items.length;
  const step = 360 / n;
  const [current, setCurrent] = useState(0);

  useInView(stage, (visible) => {
    motion.current.visible = visible;
  }, { threshold: 0.2 });

  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      const width = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 300;
      const radius = (width / 2 / Math.tan(Math.PI / n)) * 1.1;
      el.style.setProperty("--r", `${radius}px`);
    };
    measure();
    window.addEventListener("resize", measure);

    let frame = 0;
    let lastIndex = 0;
    const loop = () => {
      const m = motion.current;
      if (!m.dragging) {
        if (!m.touched && m.visible && !reduce) m.angle -= 0.045;
        else if (Math.abs(m.velocity) > 0.02) {
          m.angle += m.velocity;
          m.velocity *= 0.93;
        } else if (m.touched) {
          const snapped = Math.round(m.angle / step) * step;
          m.angle += (snapped - m.angle) * 0.12;
        }
      }
      el.style.transform = `translateZ(calc(var(--r) * -1)) rotateY(${m.angle}deg)`;
      const index = (((Math.round(-m.angle / step) % n) + n) % n);
      if (index !== lastIndex) {
        lastIndex = index;
        setCurrent(index);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [n, step]);

  return (
    <div>
      <div
        ref={stage}
        className="cyl-stage relative mx-auto h-[calc(min(66vw,330px)*0.82+3rem)] w-full cursor-grab overflow-hidden active:cursor-grabbing"
        role="region"
        aria-roledescription="carousel"
        aria-label="Öğrenci mağaza panelleri"
        onPointerDown={(event) => {
          const m = motion.current;
          m.dragging = true;
          m.touched = true;
          m.lastX = event.clientX;
          m.velocity = 0;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const m = motion.current;
          if (!m.dragging) return;
          const dx = event.clientX - m.lastX;
          m.lastX = event.clientX;
          m.angle += dx * 0.22;
          m.velocity = dx * 0.22;
        }}
        onPointerUp={() => {
          motion.current.dragging = false;
        }}
        onPointerCancel={() => {
          motion.current.dragging = false;
        }}
      >
        <div ref={ring} className="cyl absolute inset-0" style={{ "--r": "400px" } as CSSProperties}>
          {items.map((item, i) => (
            <div
              key={i}
              className="cyl-item h-[calc(min(66vw,330px)*0.82)] w-[min(66vw,330px)]"
              style={{ transform: `rotateY(${i * step}deg) translateZ(var(--r))` }}
              aria-hidden={i !== current}
            >
              <Dashboard item={item} />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-faint" aria-live="polite">
        {current + 1} / {n}
      </p>
    </div>
  );
}

/* ── 3D revenue chart ──────────────────────────────────────────────────── */

function BarsFallback({ months, values }: { months: readonly string[]; values: readonly number[] }) {
  const max = Math.max(...values);
  return (
    <div className="flex size-full items-end gap-[3%] px-[4%] pb-8 pt-10">
      {values.map((value, i) => (
        <div key={months[i]} className="relative flex h-full flex-1 flex-col justify-end">
          <div
            className={`w-full rounded-t-md ${i === values.length - 1 ? "bg-gold" : "bg-silver/45"}`}
            style={{ height: `${(value / max) * 100}%` }}
          />
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-faint">
            {months[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ months, values }: { months: readonly string[]; values: readonly number[] }) {
  return (
    <Scene3D
      fallback={<BarsFallback months={months} values={values} />}
      className="relative aspect-[4/3] w-full sm:aspect-[16/10]"
      rootMargin="20% 0px"
    >
      <RevenueCanvas months={months} values={values} />
    </Scene3D>
  );
}
