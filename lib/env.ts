import "server-only";

/**
 * Typed access to server environment variables.
 *
 * Integrations are optional: when their variables are missing the feature
 * reports `not_configured` instead of throwing, so the funnel keeps working
 * while accounts (Calendly, Meta, Resend) are still being set up.
 * Secrets are the exception — in production a missing secret fails closed.
 */

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const isProduction = process.env.NODE_ENV === "production";

/** True on Vercel production deployments (not previews, not `next start` locally). */
export const isLiveDeployment = process.env.VERCEL_ENV === "production";

const SECRET_NAMES = ["AUTH_SECRET", "LEAD_TOKEN_SECRET", "CRON_SECRET"] as const;
export type SecretName = (typeof SECRET_NAMES)[number];

/**
 * Returns a secret. In development a fixed, clearly-insecure value is used so
 * the app runs without setup; in production a missing secret throws.
 */
export function secret(name: SecretName): string {
  const value = read(name);
  if (value) return value;
  if (isProduction && !read("ALLOW_INSECURE_DEV_SECRETS")) {
    throw new Error(`${name} ortam değişkeni tanımlı değil.`);
  }
  return `dev-insecure-${name.toLowerCase()}`;
}

export function missingSecrets(): SecretName[] {
  return SECRET_NAMES.filter((name) => !read(name));
}

export function siteUrl(): string {
  const explicit = read("SITE_URL");
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = read("VERCEL_PROJECT_PRODUCTION_URL");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const env = {
  /** Pooled connection: DATABASE_URL (Neon via Vercel Marketplace), or POSTGRES_URL as other providers name it. */
  databaseUrl: () => read("DATABASE_URL") ?? read("POSTGRES_URL"),
  allowLocalDb: () => read("ALLOW_LOCAL_DB") === "true",
  /** Search engines index the site only after ALLOW_INDEXING=true (real content in place). */
  allowIndexing: () => read("ALLOW_INDEXING") === "true",
  adminSetupToken: () => read("ADMIN_SETUP_TOKEN"),

  metaPixelId: () => read("NEXT_PUBLIC_META_PIXEL_ID"),
  metaCapiToken: () => read("META_CAPI_ACCESS_TOKEN"),
  metaTestEventCode: () => read("META_TEST_EVENT_CODE"),
  capiRequiresMarketingConsent: () => read("CAPI_REQUIRE_MARKETING_CONSENT") !== "false",

  /** Calendly → Integrations → API & Webhooks → personal access token. */
  calendlyToken: () => read("CALENDLY_API_TOKEN"),
  /** Our own random value; sent to Calendly when the webhook is created from /admin/durum. */
  calendlyWebhookKey: () => read("CALENDLY_WEBHOOK_SIGNING_KEY"),

  /** Optional: only the team's daily digest e-mail uses Resend. */
  resendApiKey: () => read("RESEND_API_KEY"),
  resendFrom: () => read("RESEND_FROM"),
  resendReplyTo: () => read("RESEND_REPLY_TO"),
};

export const integrations = {
  database: () => Boolean(env.databaseUrl()),
  metaPixel: () => Boolean(env.metaPixelId()),
  metaCapi: () => Boolean(env.metaPixelId() && env.metaCapiToken()),
  calendly: () => Boolean(env.calendlyToken()),
  calendlyWebhook: () => Boolean(env.calendlyWebhookKey()),
  email: () => Boolean(env.resendApiKey() && env.resendFrom()),
};
