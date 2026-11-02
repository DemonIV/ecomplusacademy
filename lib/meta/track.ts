import "server-only";
import { env } from "@/lib/env";
import { logLeadEvent, wasEventSent, wasEventSkipped } from "@/lib/db/events";
import type { Lead } from "@/lib/db/leads";
import { sendCapiEvent, type CapiResult } from "@/lib/meta/capi";
import { CURRENCY, type ActionSource } from "@/lib/meta/events";

/**
 * Sends one lead-related event through CAPI with the identity captured at
 * application time (so a sale marked days later still matches the click),
 * then logs the outcome to lead_events for the admin panel.
 */
export async function trackLeadEvent(options: {
  lead: Lead;
  eventName: string;
  eventId: string;
  actionSource: ActionSource;
  value?: number | null;
  customData?: Record<string, unknown>;
  eventSourceUrl?: string | null;
  eventTime?: Date;
  /** Re-send even if a live copy was already delivered (never needed normally). */
  force?: boolean;
}): Promise<CapiResult | { status: "skipped"; reason: "no_consent" | "duplicate" }> {
  const { lead } = options;
  const base = {
    leadId: lead.id,
    eventName: options.eventName,
    eventId: options.eventId,
    actionSource: options.actionSource,
    value: options.value ?? null,
  };

  if (env.capiRequiresMarketingConsent() && !lead.marketing_consent) {
    // Consent is fixed at application time: a reschedule or a re-saved outcome would only repeat this row.
    if (!(await wasEventSkipped(options.eventId, "no_consent"))) {
      await logLeadEvent({ ...base, status: "skipped", skipReason: "no_consent" });
    }
    return { status: "skipped", reason: "no_consent" };
  }
  if (!options.force && (await wasEventSent(options.eventId))) {
    return { status: "skipped", reason: "duplicate" };
  }

  const result = await sendCapiEvent({
    eventName: options.eventName,
    eventId: options.eventId,
    actionSource: options.actionSource,
    eventTime: options.eventTime,
    eventSourceUrl: options.eventSourceUrl ?? lead.landing_url,
    user: {
      email: lead.email,
      phone: lead.phone,
      firstName: lead.first_name,
      lastName: lead.last_name,
      externalId: lead.id,
      ip: lead.ip,
      userAgent: lead.user_agent,
      fbc: lead.fbc,
      fbp: lead.fbp,
    },
    customData: {
      ...(options.value != null ? { value: options.value, currency: CURRENCY } : {}),
      ...(lead.tier ? { lead_tier: lead.tier } : {}),
      ...options.customData,
    },
  });

  await logLeadEvent({
    ...base,
    status: result.status,
    skipReason: result.status === "skipped" ? result.reason : null,
    eventsReceived: result.status === "sent" ? result.eventsReceived : null,
    fbtraceId: result.status !== "skipped" ? result.fbtraceId : null,
    error: result.status === "failed" ? result.error : null,
    testEventCode: result.status !== "skipped" ? result.testEventCode : null,
  });
  if (result.status === "failed") {
    console.error(`[capi] ${options.eventName} ${options.eventId} failed: ${result.error}`);
  }
  return result;
}
