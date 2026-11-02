/** The parts of Calendly's API v2 resources this app reads. */

/** Our mirror of an invitee: active, cancelled, or replaced by a new time. */
export type BookingStatus = "confirmed" | "cancelled" | "rescheduled";
export type BookingSource = "funnel" | "webhook" | "sync";

export type CalendlyTracking = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  salesforce_uuid?: string | null;
};

export type CalendlyInvitee = {
  uri: string;
  email: string;
  name: string;
  status: "active" | "canceled";
  created_at: string;
  updated_at?: string;
  /** Scheduled event URI. */
  event: string;
  cancel_url?: string | null;
  reschedule_url?: string | null;
  rescheduled?: boolean;
  old_invitee?: string | null;
  new_invitee?: string | null;
  text_reminder_number?: string | null;
  timezone?: string | null;
  questions_and_answers?: Array<{ question: string; answer: string; position?: number }> | null;
  tracking?: CalendlyTracking | null;
  cancellation?: { canceled_by?: string | null; reason?: string | null; canceler_type?: string | null } | null;
};

export type CalendlyLocation = {
  type?: string | null;
  location?: string | null;
  join_url?: string | null;
  additional_info?: string | null;
};

export type CalendlyEvent = {
  uri: string;
  name?: string;
  status: "active" | "canceled";
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
  location?: CalendlyLocation | null;
  event_memberships?: Array<{ user?: string; user_email?: string | null; user_name?: string | null }> | null;
};

export type CalendlyUser = {
  uri: string;
  name: string;
  email: string;
  scheduling_url: string;
  current_organization: string;
};

export type CalendlyWebhook = {
  uri: string;
  callback_url: string;
  state: "active" | "disabled";
  events: string[];
  scope: "user" | "organization";
};
