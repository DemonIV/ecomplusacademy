import type { ReactNode } from "react";

/** Line icons matching the six turntable objects (also the no-3D fallback). */

const PATHS: Record<string, ReactNode> = {
  mentor: (
    <>
      <path d="M5 6.5h14a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 19 16.5h-8l-4.5 3.5v-3.5H5A2.5 2.5 0 0 1 2.5 14V9A2.5 2.5 0 0 1 5 6.5Z" />
      <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeWidth="2.6" />
    </>
  ),
  research: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5" />
    </>
  ),
  store: (
    <>
      <path d="M4.5 8.5h15l-1.2 11.5H5.7Z" />
      <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
    </>
  ),
  ads: (
    <>
      <path d="M3.5 10v4h3l7.5 4.5v-13L6.5 10Z" />
      <path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M6.5 14l1 5" />
    </>
  ),
  supply: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </>
  ),
  community: (
    <>
      <circle cx="12" cy="8" r="3" />
      <circle cx="5.5" cy="10" r="2.2" />
      <circle cx="18.5" cy="10" r="2.2" />
      <path d="M6.5 20a5.5 5.5 0 0 1 11 0M2 19a3.8 3.8 0 0 1 5-3.4M22 19a3.8 3.8 0 0 0-5-3.4" />
    </>
  ),
};

export function ProgramIcon({ id, className = "size-6" }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[id] ?? PATHS.supply}
    </svg>
  );
}
