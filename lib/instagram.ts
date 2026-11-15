/**
 * Instagram handles as people type them: "@ayse.yilmaz", "ayse.yilmaz",
 * "instagram.com/ayse.yilmaz/". Shared by the application form and the
 * Calendly question "Instagram kullanıcı adın". Pure, client-safe.
 */

/** Answers to a required question that mean "none"; they would match other people's placeholders. */
const PLACEHOLDERS = new Set(["yok", "yoktur", "none", "no", "hayir", "bos", "instagram", "test"]);

export function instagramHandle(value?: string | null): string | null {
  if (!value) return null;
  const handle = value
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle) || /^[._\d]+$/.test(handle)) return null;
  return PLACEHOLDERS.has(handle.toLowerCase()) ? null : handle;
}
