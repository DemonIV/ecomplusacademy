"use client";

import { useEffect, useRef } from "react";

/** Full-screen player on a native <dialog> (focus trap, Esc and back button for free). */
export function VideoModal({
  src,
  poster,
  title,
  onClose,
}: {
  src: string;
  poster?: string;
  title: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    d.showModal();
    video.current?.play().catch(() => {});
    return () => {
      if (d.open) d.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      // The close an effect cleanup queues (Strict Mode remount) arrives after the reopen: ignore it.
      onClose={() => !dialog.current?.open && onClose()}
      onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
      className="m-auto w-[min(92vw,440px)] overflow-visible bg-transparent p-0 text-paper backdrop:bg-night/85 backdrop:backdrop-blur-sm"
      data-lenis-prevent
    >
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-deep">
        <video
          ref={video}
          src={src}
          poster={poster}
          controls
          playsInline
          className="aspect-[9/16] max-h-[82vh] w-full bg-night object-cover"
        />
      </div>
      <button
        type="button"
        onClick={() => dialog.current?.close()}
        className="btn btn-ghost btn-sm mx-auto mt-4 flex w-fit"
        autoFocus
      >
        Kapat
      </button>
    </dialog>
  );
}
