"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/meta/fbq";

type Props = ComponentProps<typeof Link> & { event: string; params?: Record<string, unknown> };

/** A link that sends one pixel event when clicked (a no-op until the pixel has loaded). */
export function TrackedLink({ event, params, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(event, params);
        onClick?.(e);
      }}
    />
  );
}
