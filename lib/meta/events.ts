/**
 * Single source of truth for every Meta event this funnel emits.
 * Client (pixel) and server (CAPI) import the same names and event-id
 * builders, so browser + server copies of one event always deduplicate.
 *
 * | Stage                | Event              | Channel        | action_source |
 * |----------------------|--------------------|----------------|---------------|
 * | Page view            | PageView           | pixel          | website       |
 * | VSL 25/50/75/95 %    | VideoProgress (+ViewContent at 50 %) | pixel | website |
 * | /kaynaklar word typed | Search            | pixel          | website       |
 * | Resource opened      | ViewContent (content_category "kaynak") | pixel | website |
 * | Resource → apply CTA | ResourceCta        | pixel          | website       |
 * | First answer         | StartApplication   | pixel          | website       |
 * | Form submitted       | SubmitApplication  | pixel + CAPI   | website       |
 * | Qualified            | Lead (value)       | pixel + CAPI   | website       |
 * | Disqualified         | DisqualifiedLead   | CAPI           | website       |
 * | Booked a call        | Schedule           | pixel + CAPI   | website       |
 * | Showed / no-show     | CallAttended / NoShow | CAPI (panel) | phone_call   |
 * | Sale                 | Purchase (amount)  | CAPI (panel)   | phone_call    |
 */

export const META_EVENTS = {
  pageView: "PageView",
  viewContent: "ViewContent",
  videoProgress: "VideoProgress",
  search: "Search",
  resourceCta: "ResourceCta",
  startApplication: "StartApplication",
  submitApplication: "SubmitApplication",
  lead: "Lead",
  disqualifiedLead: "DisqualifiedLead",
  schedule: "Schedule",
  callAttended: "CallAttended",
  noShow: "NoShow",
  purchase: "Purchase",
} as const;

export type MetaEventName = (typeof META_EVENTS)[keyof typeof META_EVENTS];

/** Standard events use `track`, everything else `trackCustom`. */
export const STANDARD_EVENTS = new Set<string>([
  "PageView",
  "ViewContent",
  "Search",
  "Lead",
  "Schedule",
  "Purchase",
  "SubmitApplication",
]);

export type ActionSource = "website" | "phone_call" | "system_generated" | "chat";

/** Deterministic ids: the same business fact can never be counted twice. */
export const eventIds = {
  submitApplication: (leadId: string, applyCount: number) => `submit_${leadId}_${applyCount}`,
  lead: (leadId: string) => `lead_${leadId}`,
  disqualified: (leadId: string, applyCount: number) => `dq_${leadId}_${applyCount}`,
  schedule: (leadId: string) => `schedule_${leadId}`,
  callAttended: (leadId: string) => `attended_${leadId}`,
  noShow: (bookingId: string) => `noshow_${bookingId}`,
  purchase: (leadId: string) => `purchase_${leadId}`,
};

export const CURRENCY = "TRY";
