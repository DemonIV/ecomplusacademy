import { BRAND } from "@/content/brand";

/**
 * Ready-made WhatsApp messages the team sends from the panel (wa.me links:
 * WhatsApp opens with the text filled in, nothing is sent automatically).
 * Edit the wording freely; keep the placeholders' meaning.
 */
export const WHATSAPP = {
  hello: (firstName: string) => `Merhaba ${firstName}, ${BRAND.name}'den yazıyorum. Başvurun bize ulaştı.`,
  bookingLink: (firstName: string, url: string) =>
    `Merhaba ${firstName}, ${BRAND.name}'den yazıyorum. ${BRAND.callName} için sana uyan saati buradan seçebilirsin: ${url}\nGörüşme Google Meet'ten; saati seçince bağlantı e-postana gelir.`,
  /** `joinUrl`: the booking's meeting link when Calendly has created it. */
  reminder: (firstName: string, whenLabel: string, joinUrl?: string | null) =>
    `Merhaba ${firstName}, ${whenLabel} görüşmemizi hatırlatmak istedim. ${
      joinUrl ? `Bağlantı: ${joinUrl}` : "Bağlantı, Calendly'nin gönderdiği onay e-postasında."
    } Saat uymuyorsa yazman yeterli.`,
  rescheduleLink: (firstName: string, url: string) =>
    `Merhaba ${firstName}, görüşme saatini buradan değiştirebilirsin: ${url}`,
  waiting: (firstName: string, joinUrl?: string | null) =>
    `Merhaba ${firstName}, görüşme saatimiz geldi, Google Meet'te seni bekliyorum.${joinUrl ? ` Bağlantı: ${joinUrl}` : ""}`,
};
