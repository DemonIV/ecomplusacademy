import type { ReactNode } from "react";

/** 24 × 24 line icons for the promise cards and the "Nasıl işliyor?" steps. */
const PATHS: Record<string, ReactNode> = {
  // Promise cards
  support: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="m6 6 3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18" />
    </>
  ),
  mentor: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.5 14.6A4.6 4.6 0 0 1 21 19" />
    </>
  ),
  chat: (
    <>
      <path d="M5 6.5h14a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 19 16.5h-8l-4.5 3.5v-3.5H5A2.5 2.5 0 0 1 2.5 14V9A2.5 2.5 0 0 1 5 6.5Z" />
      <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeWidth="2.6" />
    </>
  ),
  homework: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
      <path d="M9 3.5h6v3H9Z" />
      <path d="m8.5 13 2.3 2.3 4.7-4.8" />
    </>
  ),
  software: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5" />
      <path d="M8 12.5v-1.5M10.5 12.5v-4M13 12.5v-2.5" />
    </>
  ),
  lifetime: (
    <path d="M7.2 8.5C4.9 8.5 3 10.1 3 12s1.9 3.5 4.2 3.5c3.6 0 6-7 9.6-7 2.3 0 4.2 1.6 4.2 3.5s-1.9 3.5-4.2 3.5c-3.6 0-6-7-9.6-7Z" />
  ),
  // How it works
  product: (
    <>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.6 6.6a1.5 1.5 0 0 1-2.1 0Z" />
      <circle cx="8" cy="8" r="1.4" />
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
  shipping: (
    <>
      <path d="M2.5 6.5h11v9h-11Z" />
      <path d="M13.5 9.5h4l3 3.5v2.5h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  system: (
    <>
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3M4.5 12a7.5 7.5 0 0 1 12.8-5.3" />
      <path d="M17.5 3.5V7H14M6.5 20.5V17H10" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
};

export function LineIcon({ id, className = "size-6" }: { id: string; className?: string }) {
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
      {PATHS[id] ?? PATHS.check}
    </svg>
  );
}
