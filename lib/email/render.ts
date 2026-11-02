import "server-only";
import { createElement, type ReactElement } from "react";
import { render, toPlainText } from "react-email";
import { CloserDigestEmail } from "@/emails/closer-digest";

/**
 * Team-internal e-mail only: applicants never get e-mail from us (Calendly
 * sends their confirmation and reminders).
 */
async function renderBoth(element: ReactElement): Promise<{ html: string; text: string }> {
  const html = await render(element);
  return { html, text: toPlainText(html) };
}

export async function renderCloserDigest(props: Parameters<typeof CloserDigestEmail>[0]) {
  return {
    subject: `Günlük özet · ${props.pending.length} sonuç bekliyor, bugün ${props.today.length} görüşme`,
    ...(await renderBoth(createElement(CloserDigestEmail, props))),
  };
}
