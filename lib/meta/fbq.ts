import { STANDARD_EVENTS } from "@/lib/meta/events";

/**
 * Browser-side pixel helpers. Every call is a no-op until the pixel is
 * loaded (consent given + NEXT_PUBLIC_META_PIXEL_ID set), so components can
 * call these unconditionally.
 */

type Fbq = ((...args: unknown[]) => void) & { loaded?: boolean; queue?: unknown[] };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function fbq(): Fbq | null {
  return typeof window !== "undefined" && typeof window.fbq === "function" ? window.fbq : null;
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  const f = fbq();
  if (!f) return;
  const method = STANDARD_EVENTS.has(name) ? "track" : "trackCustom";
  if (eventId) f(method, name, params ?? {}, { eventID: eventId });
  else f(method, name, params ?? {});
}

/** Advanced matching after the form: the pixel hashes these itself. */
export function setUserData(user: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
}): void {
  const f = fbq();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!f || !pixelId) return;
  f("init", pixelId, {
    ...(user.email ? { em: user.email.trim().toLowerCase() } : {}),
    ...(user.phone ? { ph: user.phone.replace(/\D/g, "") } : {}),
    ...(user.firstName ? { fn: user.firstName.trim().toLowerCase() } : {}),
    ...(user.lastName ? { ln: user.lastName.trim().toLowerCase() } : {}),
    ...(user.externalId ? { external_id: user.externalId } : {}),
  });
}
