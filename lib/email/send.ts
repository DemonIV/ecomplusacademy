import "server-only";
import { env } from "@/lib/env";

/**
 * Resend REST client, written fresh for this project's own Resend account
 * and sending domain. Without RESEND_API_KEY/RESEND_FROM every send returns
 * `skipped: not_configured` — the booking flow never fails on e-mail.
 */

export type EmailAttachment = { filename: string; content: string; contentType?: string };

export type EmailResult =
  | { status: "sent"; id: string }
  | { status: "failed"; error: string }
  | { status: "skipped"; reason: "not_configured" };

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
  /** Same key within 24 h → Resend sends only once (safe retries). */
  idempotencyKey?: string;
  tags?: Record<string, string>;
}): Promise<EmailResult> {
  const apiKey = env.resendApiKey();
  const from = env.resendFrom();
  if (!apiKey || !from) return { status: "skipped", reason: "not_configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(env.resendReplyTo() ? { reply_to: env.resendReplyTo() } : {}),
        ...(message.attachments?.length
          ? {
              attachments: message.attachments.map((a) => ({
                filename: a.filename,
                content: Buffer.from(a.content, "utf8").toString("base64"),
                ...(a.contentType ? { content_type: a.contentType } : {}),
              })),
            }
          : {}),
        ...(message.tags
          ? { tags: Object.entries(message.tags).map(([name, value]) => ({ name, value })) }
          : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!response.ok || !json.id) {
      return { status: "failed", error: json.message ?? json.name ?? `HTTP ${response.status}` };
    }
    return { status: "sent", id: json.id };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}
