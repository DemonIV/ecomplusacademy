/**
 * Booking settings. Client-safe.
 *
 * Availability, buffers, reminders and double-booking protection live in
 * Calendly. Set the event up there as:
 *   - duration 30 minutes, booking window ~5 days (a call close to the ad
 *     click keeps the sale inside Meta's 7-day click window and cuts no-shows)
 *   - location "Phone call → I will call my invitee": Calendly then asks for
 *     the number, and the funnel pre-fills it with the applicant's WhatsApp
 *     number; the description should say the call happens on WhatsApp.
 */
export const BOOKING = {
  timeZone: "Europe/Istanbul",
  /** Shown in copy only; the real length is the Calendly event's. */
  meetingMinutes: 30,
  calendly: {
    sample: true,
    /** Public link of the Calendly event, e.g. https://calendly.com/ecomplus/strateji-gorusmesi */
    url: "https://calendly.com/ornek-hesap/strateji-gorusmesi",
    /**
     * Calendly custom question that also receives the phone number ("a1" =
     * first question), when the number is asked as a question instead of
     * through the "Phone call" location. null = location only.
     */
    phoneAnswer: null as `a${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}` | null,
    /** Embed colours (hex, no #). Calendly applies them on paid plans only. */
    colors: { background: "131316", text: "f2efe9", primary: "d8b06f" },
  },
};
