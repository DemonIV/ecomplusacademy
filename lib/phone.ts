/**
 * Phone normalization. Shared by client (instant validation) and server
 * (source of truth). Output is digits only with country code, e.g.
 * "905321234567" — the format wa.me links and Meta's `ph` hashing both expect.
 */

export type NormalizedPhone = {
  digits: string;
  isTurkishMobile: boolean;
};

export function normalizePhone(input: string): NormalizedPhone | null {
  const raw = input.trim();
  if (!raw) return null;
  const hasPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);

  // Turkish formats: 05xx…, 5xx…, 905xx…, +905xx…
  if (!hasPlus && digits.length === 11 && digits.startsWith("05")) digits = `9${digits}`;
  if (!hasPlus && digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;

  if (digits.startsWith("90")) {
    return /^905\d{9}$/.test(digits) ? { digits, isTurkishMobile: true } : null;
  }

  // Other countries (diaspora applicants): accept plausible E.164 lengths
  // only when the user typed an explicit international prefix.
  if ((hasPlus || raw.startsWith("00")) && digits.length >= 8 && digits.length <= 15) {
    return { digits, isTurkishMobile: false };
  }
  return null;
}

export function formatPhone(digits: string): string {
  if (/^905\d{9}$/.test(digits)) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return `+${digits}`;
}

export function whatsappLink(digits: string, text?: string): string {
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
