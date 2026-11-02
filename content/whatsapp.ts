import { BRAND } from "@/content/brand";

/**
 * Ready-made WhatsApp messages the team sends from the panel (wa.me links:
 * WhatsApp opens with the text filled in, nothing is sent automatically).
 * Edit the wording freely; keep the placeholders' meaning.
 */
export const WHATSAPP = {
  hello: (firstName: string) => `Merhaba ${firstName}, ${BRAND.name}'den yazıyorum. Başvurun bize ulaştı.`,
  bookingLink: (firstName: string, url: string) =>
    `Merhaba ${firstName}, ${BRAND.name}'den yazıyorum. ${BRAND.callName} için sana uyan saati buradan seçebilirsin: ${url}\nSeçtiğin saatte seni WhatsApp'tan arayacağız.`,
  reminder: (firstName: string, whenLabel: string) =>
    `Merhaba ${firstName}, ${whenLabel} görüşmemizi hatırlatmak istedim. O saatte seni WhatsApp'tan arayacağız. Saat uymuyorsa yazman yeterli.`,
  rescheduleLink: (firstName: string, url: string) =>
    `Merhaba ${firstName}, görüşme saatini buradan değiştirebilirsin: ${url}`,
  calling: (firstName: string) => `Merhaba ${firstName}, görüşme saatimiz geldi. Birazdan WhatsApp'tan arıyorum.`,
};
