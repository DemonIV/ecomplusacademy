/**
 * Booking settings. Client-safe.
 *
 * Availability, buffers, reminders and double-booking protection live in
 * Calendly. Set the event up there as:
 *   - a team Round Robin event, so applicants are spread over the closers
 *     (each closer is added to the panel with their Calendly e-mail)
 *   - duration 30 minutes, booking window ~5 days (a call close to the ad
 *     click keeps the sale inside Meta's 7-day click window and cuts no-shows)
 *   - location "Zoom": every host connects their own Zoom account in Calendly
 *     (Integrations → Zoom); Calendly then creates a meeting per booking and
 *     puts the link in its e-mails, and the panel shows it with the booking.
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
     * Calendly custom question that receives the applicant's WhatsApp number
     * ("a1" = first question), if the event asks for one. null = not asked.
     */
    phoneAnswer: null as `a${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}` | null,
    /** Embed colours (hex, no #). Calendly applies them on paid plans only. */
    colors: { background: "131316", text: "f2efe9", primary: "d8b06f" },
  },
};
