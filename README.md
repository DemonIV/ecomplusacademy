# Ecom Plus Academy funnel

Here is the flow. A visitor arrives from a Meta ad, answers the qualification questions and leaves their contact details.

- **Qualified applicants** pick a time straight away in the Calendly calendar embedded on the page. The call is a WhatsApp call at the chosen time.
- **Applicants filtered out** are sent to free content: the "İlk 30 Gün Planı" PDF (once it exists) and Instagram.

After the call, the team marks the outcome in the panel. A sale goes to Meta as a Purchase through the Conversions API.

| Step | Pixel (browser) | CAPI (server) | `event_id` |
|---|---|---|---|
| Application | Lead / DisqualifiedLead | same | `lead_<id>` |
| Calendly booking | Schedule | Schedule | `schedule_<id>` |
| Panel: "Satış + tutar" | – | Purchase (`phone_call`) | `purchase_<id>` |

## Local development

```bash
npm install
cp .env.example .env.local   # leaving it empty is fine: embedded DB + dev keys
npm run dev                  # http://localhost:3000, panel: /admin
```

When `DATABASE_URL` is empty, the embedded Postgres in `.data/pglite` is used. Migrations run automatically.

Checks:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

## Where to edit

| File | Contents |
|---|---|
| `content/brand.ts` | Brand name, founder, company legal name, contact details, Instagram |
| `content/copy.ts` | All page copy: hero, promises, Onur's story and timeline, FAQ |
| `content/media.ts` | Intro video (Vercel Blob URLs, upload steps in the file) and founder photos |
| `config/site.ts` | **Monthly**: cohort month and seat count; the /sonuc resources |
| `content/legal.ts` | KVKK / privacy texts (must come from a lawyer) |
| `content/whatsapp.ts` | Ready-made WhatsApp messages the team sends from the panel |
| `config/qualification.ts` | Qualification questions, budget threshold, scoring |
| `config/booking.ts` | Calendly event link and embed colours |

Placeholder values are marked `sample: true`. `npm run prelaunch` will not pass while any of them remain. The page itself never shows a "sample" badge.

Videos are not in the repo: they live in the Vercel Blob store `ecomplusacademy-media` (public, fra1). On Hobby, Blob includes 10 GB of transfer a month and stops serving for 30 days when that runs out, so move to Pro before running ads.

## Calendly setup

1. **Event** (Calendly → Event types → New):
   - 30 minutes, one-on-one.
   - Location: **Phone call → "I will call my invitee"**. The funnel pre-fills the applicant's WhatsApp number in this field.
   - Description: "Seçtiğin saatte seni WhatsApp'tan arayacağız."
2. **Availability**:
   - Working hours
   - Buffer between calls
   - Booking window. Recommended: **5 days**. That way the sale falls inside Meta's 7-day click window and fewer people miss the call.
3. **Confirmation and reminders**: Calendly sends them. Under Workflows, add an e-mail/SMS reminder 24 hours and 1 hour before (paid plan).
4. **Link**: put the event's public link into `config/booking.ts` → `BOOKING.calendly.url` and remove the `sample: true` flag.
5. **API key**:
   - Calendly → Integrations → API & Webhooks → Personal access token → `CALENDLY_API_TOKEN`.
   - The account owner's (organisation admin's) key reads the whole team's bookings.
6. **Webhook** (Standard plan and above):
   - Generate a random value for `CALENDLY_WEBHOOK_SIGNING_KEY`.
   - Once the site is live, press **"Webhook'u kur"** under `/admin/durum`.
   - Without a webhook, changes reach the panel through the hourly sync.
7. **Team**: everyone who takes calls is added to the panel (`/admin/ekip`) **with the same e-mail address as their Calendly account**. Bookings are matched to people by that e-mail.

How a booking reaches the panel:
- **Funnel**: the embed reports the booking. The server reads the details with the API key and moves the lead to "booked".
- **Link sent by the team over WhatsApp**: carries the lead id in the `salesforce_uuid` parameter. It arrives through the webhook, or through the hourly sync if there is no webhook.
- **Cancel / reschedule**: done in Calendly; the panel updates itself.

## Going live

1. **Database**: Neon Postgres via Vercel Marketplace (Frankfurt) sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`. Migrate with `vercel env pull .vercel/.env.production --environment=production --yes`, then `node --env-file=.vercel/.env.production scripts/db-migrate.mjs`.
2. **Vercel Pro**: Hobby plans don't allow commercial use and run crons at most daily; on Pro set the Calendly sync in `vercel.json` back to hourly (`0 * * * *`).
3. **Environment variables**: the descriptions are in `.env.example`. Keys:
   - `AUTH_SECRET`, `LEAD_TOKEN_SECRET`, `CRON_SECRET`: a different random value for each
   - `SITE_URL`: live https address
   - Meta Pixel + CAPI
   - Calendly
4. **First admin**:
   - Define `ADMIN_SETUP_TOKEN` and create the account under `/admin/giris`.
   - **Delete** the variable afterwards.
   - Forgotten password: run `npm run admin:password` in your own terminal (hidden prompt; needs `.vercel/.env.production`).
5. **`npm run prelaunch`**: clean up every blocker it lists.
6. **End-to-end test on a real phone**:
   - application → Calendly booking
   - Meta Events Manager → Test Events: Lead + Schedule (with `META_TEST_EVENT_CODE`, which is deleted afterwards)
   - the booking shows up under `/admin/ajanda` with its time and host

Optional: `RESEND_*` sends each host a daily summary e-mail (outcomes still to be entered, today's calls). Applicants never get e-mail from us.

## Deploys

The Vercel project `ecomplusacademy` is connected to this GitHub repo:

- push to `main` → production (ecomplusacademy.com)
- any other branch or pull request → its own preview URL
- environment variables live in Vercel (`vercel env ls`), never in the repo
- a new migration in `db/migrations/` is not applied by the deploy: run the migrate command above, ideally before pushing the code that needs it

## Structure

- `app/(funnel)`: landing page, thank-you (`/tesekkurler`), result (`/sonuc`) and KVKK pages
- `app/admin`: panel (dashboard, leads, agenda, team, status)
- `app/api/lead`: application; `app/api/consent`: cookie consent record; `app/api/calendly/*`: embed booking and webhook
- `app/api/cron/*`: hourly Calendly sync, daily team summary
- `lib/calendly`: link builder, API client, signature check, sync
- `lib/meta`: Pixel/CAPI events and dedupe
- `db/migrations`: SQL schema (applied in order, idempotent)
- `scripts/brand-assets.mjs`: generates the logo files from the source logo
