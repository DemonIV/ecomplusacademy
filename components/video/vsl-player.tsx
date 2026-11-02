"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/meta/fbq";
import { META_EVENTS } from "@/lib/meta/events";
import { useInView, useScrollProgress } from "@/lib/client/use-scroll-progress";
import type { VideoSource } from "@/content/media";

/**
 * Sales video in a glass frame that starts tilted back and flattens as it
 * scrolls into view.
 * - File source: plays muted in view as a preview; "Sesi aç" restarts it
 *   from the beginning with sound and native controls.
 * - YouTube source: click-to-load facade (no 1 MB player until asked),
 *   served from youtube-nocookie.com.
 * Watch milestones (25/50/75/95 %, ViewContent at 50 %) are only counted
 * for real viewing with sound, never for the muted preview.
 */

const MILESTONES = [25, 50, 75, 95] as const;

type Labels = { unmute: string; restart: string; play: string; ended: string; cta: string };

export function VslPlayer({
  source,
  title,
  labels,
  ctaHref = "#basvuru",
}: {
  source: VideoSource;
  title: string;
  labels: Labels;
  ctaHref?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);

  useScrollProgress(frame, (rect, vh) => 1 - (vh - rect.top) / (vh * 0.62), { cssVar: "--tilt" });

  return (
    <div className="vsl-stage">
      <div ref={frame} className="vsl-frame relative overflow-hidden bg-deep">
        <div className="relative aspect-video">
          {source.kind === "file" ? (
            <FileVideo source={source} title={title} labels={labels} ctaHref={ctaHref} />
          ) : (
            <YouTubeVideo source={source} title={title} labels={labels} ctaHref={ctaHref} />
          )}
        </div>
        {source.sample && <span className="sample-badge absolute left-3 top-3 z-10">Örnek video</span>}
      </div>
    </div>
  );
}

function useMilestones(name: string) {
  const fired = useRef(new Set<number>());
  return useCallback(
    (percent: number) => {
      for (const milestone of MILESTONES) {
        if (percent >= milestone && !fired.current.has(milestone)) {
          fired.current.add(milestone);
          trackEvent(META_EVENTS.videoProgress, { percent: milestone, video: name });
          if (milestone === 50) trackEvent(META_EVENTS.viewContent, { content_name: name, content_type: "video" });
        }
      }
    },
    [name],
  );
}

function EndCard({ labels, ctaHref, onReplay }: { labels: Labels; ctaHref: string; onReplay: () => void }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-night/80 p-6 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-start gap-4">
        <p className="t-h3">{labels.ended}</p>
        <div className="flex flex-wrap gap-3">
          <a href={ctaHref} className="btn btn-gold">
            {labels.cta}
          </a>
          <button type="button" className="btn btn-ghost" onClick={onReplay}>
            {labels.restart}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

function SoundGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="none" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" strokeLinecap="round" />
    </svg>
  );
}

function FileVideo({
  source,
  title,
  labels,
  ctaHref,
}: {
  source: Extract<VideoSource, { kind: "file" }>;
  title: string;
  labels: Labels;
  ctaHref: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"preview" | "idle" | "playing" | "ended">("preview");
  const [src, setSrc] = useState<string | null>(null);
  const track = useMilestones("vsl");

  // Pick the file for this screen once the frame is near the viewport.
  useInView(
    video,
    (near) => {
      if (!near || src) return;
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (saveData || reduce) setMode("idle");
      setSrc(window.matchMedia("(max-width: 767px)").matches ? source.mobile : source.desktop);
    },
    { threshold: 0, rootMargin: "300px 0px" },
  );

  // Muted preview runs only while at least half visible.
  const visible = useRef(false);
  const playPreview = useCallback((v: HTMLVideoElement) => {
    v.play().catch((error: unknown) => {
      // Autoplay refused (low-power mode, browser policy): fall back to a play button.
      if (error instanceof DOMException && error.name === "NotAllowedError") setMode("idle");
    });
  }, []);
  useInView(
    video,
    (isVisible) => {
      visible.current = isVisible;
      const v = video.current;
      if (!v || !src || mode !== "preview") return;
      if (isVisible) playPreview(v);
      else v.pause();
    },
    { threshold: 0.5 },
  );
  useEffect(() => {
    const v = video.current;
    if (v && src && mode === "preview" && visible.current) playPreview(v);
  }, [src, mode, playPreview]);

  const startWithSound = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.loop = false;
    setMode("playing");
    v.play().catch(() => {
      v.muted = true;
      setMode("idle");
    });
  };

  return (
    <>
      <video
        ref={video}
        className="absolute inset-0 size-full object-cover"
        src={src ?? undefined}
        poster={source.poster}
        muted={mode !== "playing"}
        loop={mode === "preview"}
        playsInline
        preload="none"
        controls={mode === "playing"}
        aria-label={title}
        onTimeUpdate={(event) => {
          if (mode !== "playing") return;
          const v = event.currentTarget;
          if (v.duration > 0) track((v.currentTime / v.duration) * 100);
        }}
        onEnded={() => mode === "playing" && setMode("ended")}
      />
      {(mode === "preview" || mode === "idle") && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-night/70 via-transparent to-transparent">
          <button type="button" onClick={startWithSound} className="btn btn-gold">
            {mode === "preview" ? <SoundGlyph /> : <PlayGlyph />}
            {mode === "preview" ? labels.unmute : labels.play}
          </button>
        </div>
      )}
      {mode === "ended" && <EndCard labels={labels} ctaHref={ctaHref} onReplay={startWithSound} />}
    </>
  );
}

type YTPlayer = { getCurrentTime(): number; getDuration(): number; destroy(): void; playVideo(): void };
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: { onStateChange?: (event: { data: number }) => void };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApi: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  ytApi ??= new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      ytApi = null;
      reject(new Error("youtube api failed"));
    };
    document.head.appendChild(script);
  });
  return ytApi;
}

function YouTubeVideo({
  source,
  title,
  labels,
  ctaHref,
}: {
  source: Extract<VideoSource, { kind: "youtube" }>;
  title: string;
  labels: Labels;
  ctaHref: string;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [state, setState] = useState<"facade" | "loading" | "playing" | "ended">("facade");
  const track = useMilestones("vsl");

  useEffect(() => {
    if (state !== "playing") return;
    const timer = window.setInterval(() => {
      const p = player.current;
      const duration = p?.getDuration() ?? 0;
      if (p && duration > 0) track((p.getCurrentTime() / duration) * 100);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state, track]);

  useEffect(() => () => player.current?.destroy(), []);

  const start = async () => {
    if (player.current) {
      player.current.playVideo();
      setState("playing");
      return;
    }
    setState("loading");
    try {
      const YT = await loadYouTubeApi();
      if (!mount.current) return;
      player.current = new YT.Player(mount.current, {
        host: "https://www.youtube-nocookie.com",
        videoId: source.id,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: ({ data }) => {
            if (data === 1) setState("playing");
            if (data === 0) setState("ended");
          },
        },
      });
    } catch {
      window.open(`https://www.youtube.com/watch?v=${source.id}`, "_blank", "noopener");
      setState("facade");
    }
  };

  const poster = source.poster ?? `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`;

  return (
    <>
      <div className="absolute inset-0 [&>iframe]:size-full">
        <div ref={mount} />
      </div>
      {(state === "facade" || state === "loading") && (
        <button
          type="button"
          onClick={start}
          className="group absolute inset-0 grid place-items-center"
          aria-label={`${labels.play}: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- external poster, sized by the frame */}
          <img src={poster} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
          <span className="btn btn-gold relative">
            <PlayGlyph />
            {state === "loading" ? "Yükleniyor…" : labels.play}
          </span>
        </button>
      )}
      {state === "ended" && <EndCard labels={labels} ctaHref={ctaHref} onReplay={start} />}
    </>
  );
}
