import type { BookingStatus, CalendlyEvent, CalendlyInvitee, CalendlyLocation } from "@/lib/calendly/types";
import { normalizePhone } from "@/lib/phone";

/**
 * Pure mapping from Calendly invitees/events to our booking rows. No I/O,
 * so the rules (status, lead matching, phone extraction) are unit-tested.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How to find the lead behind an invitee, strongest signal first. */
export type LeadRef = { leadId: string | null; email: string | null; phone: string | null };

export function phoneFromInvitee(invitee: CalendlyInvitee, event?: CalendlyEvent | null): string | null {
  const candidates = [
    // "Phone call (host calls invitee)": the number the invitee confirmed.
    event?.location?.type === "outbound_call" ? event.location.location : null,
    invitee.text_reminder_number,
    ...(invitee.questions_and_answers ?? [])
      .filter((qa) => /telefon|whatsapp|numara|phone/i.test(qa.question))
      .map((qa) => qa.answer),
  ];
  for (const candidate of candidates) {
    const phone = candidate ? normalizePhone(candidate) : null;
    if (phone) return phone.digits;
  }
  return null;
}

export function leadRefFromInvitee(invitee: CalendlyInvitee, event?: CalendlyEvent | null): LeadRef {
  const tracked = invitee.tracking?.salesforce_uuid?.trim() ?? "";
  return {
    leadId: UUID.test(tracked) ? tracked.toLowerCase() : null,
    email: invitee.email?.trim().toLowerCase() || null,
    phone: phoneFromInvitee(invitee, event),
  };
}

export function bookingStatusOf(invitee: Pick<CalendlyInvitee, "status" | "rescheduled">, event?: Pick<CalendlyEvent, "status"> | null): BookingStatus {
  if (invitee.status === "canceled" || event?.status === "canceled") return invitee.rescheduled ? "rescheduled" : "cancelled";
  return "confirmed";
}

/** Human label for the agenda: "Telefon: +90…", an address, or the video tool's name. */
export function locationLabel(location?: CalendlyLocation | null): string | null {
  if (!location?.type) return null;
  switch (location.type) {
    case "outbound_call":
      return location.location ? `Biz arıyoruz: ${location.location}` : "Biz arıyoruz";
    case "inbound_call":
      return location.location ? `Lead arayacak: ${location.location}` : "Lead arayacak";
    case "physical":
      return location.location ?? "Yüz yüze";
    case "custom":
    case "ask_invitee":
      return location.location ?? null;
    case "google_conference":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "microsoft_teams_conference":
      return "Microsoft Teams";
    default:
      return location.location ?? location.type;
  }
}

export type BookingFields = {
  inviteeUri: string;
  eventUri: string;
  status: BookingStatus;
  start: Date | null;
  end: Date | null;
  hostName: string | null;
  hostEmail: string | null;
  location: string | null;
  joinUrl: string | null;
  cancelUrl: string | null;
  rescheduleUrl: string | null;
  updatedAt: Date | null;
  cancelReason: string | null;
};

function date(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function bookingFields(invitee: CalendlyInvitee, event?: CalendlyEvent | null): BookingFields {
  const host = event?.event_memberships?.[0];
  const status = bookingStatusOf(invitee, event);
  return {
    inviteeUri: invitee.uri,
    eventUri: event?.uri ?? invitee.event,
    status,
    start: date(event?.start_time),
    end: date(event?.end_time),
    hostName: host?.user_name?.trim() || null,
    hostEmail: host?.user_email?.trim().toLowerCase() || null,
    location: locationLabel(event?.location),
    joinUrl: event?.location?.join_url ?? null,
    cancelUrl: invitee.cancel_url ?? null,
    rescheduleUrl: invitee.reschedule_url ?? null,
    updatedAt: date(event?.updated_at ?? invitee.updated_at),
    cancelReason:
      status === "confirmed"
        ? null
        : status === "rescheduled"
          ? "calendly_rescheduled"
          : invitee.cancellation?.canceler_type === "host"
            ? "team_cancelled"
            : "lead_cancelled",
  };
}
