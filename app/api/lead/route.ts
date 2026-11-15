import { after } from "next/server";
import { cookies } from "next/headers";
import { checkBotId } from "botid/server";
import { z } from "zod";
import {
  QUESTIONS,
  currentOptionId,
  isGender,
  isValidAnswer,
  type Answers,
  type QuestionId,
} from "@/config/qualification";
import {
  buildFbc,
  COOKIE,
  decodeTouch,
  fbclidFromFbc,
  isValidFbCookie,
  type Touch,
} from "@/lib/attribution";
import { clientIp, errorJson, json, readJson, sameOrigin } from "@/lib/http";
import { instagramHandle } from "@/lib/instagram";
import { normalizePhone } from "@/lib/phone";
import { qualify, QUALIFICATION_RULES } from "@/lib/qualification";
import { rateLimit } from "@/lib/rate-limit";
import {
  addActivity,
  bumpApplyCount,
  findLeadByContact,
  insertLead,
  updateLeadOnReapply,
  type LeadInsert,
} from "@/lib/db/leads";
import { queueAirtableSync } from "@/lib/airtable/sync";
import { getActiveBookingForLead } from "@/lib/db/bookings";
import { createLeadToken } from "@/lib/lead-token";
import { trackLeadEvent } from "@/lib/meta/track";
import { CURRENCY, eventIds, META_EVENTS } from "@/lib/meta/events";
import { siteUrl } from "@/lib/env";

const MIN_FILL_MS = 5_000;

const touchSchema = z
  .object({
    ts: z.number(),
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    utm_id: z.string().max(200).optional(),
    fbclid: z.string().regex(/^[A-Za-z0-9_-]{8,500}$/).optional(),
    gclid: z.string().max(200).optional(),
    ttclid: z.string().max(200).optional(),
    landing: z.string().max(500).optional(),
    referrer: z.string().max(300).optional(),
  })
  .nullable()
  .optional();

const bodySchema = z.object({
  answers: z.record(z.string(), z.string()),
  firstName: z.string().trim().min(2).max(40).optional(),
  lastName: z.string().trim().min(2).max(40).optional(),
  /** Browser tabs opened before the name was split into two fields still send this one. */
  fullName: z.string().trim().min(3).max(80).optional(),
  email: z.email().max(160),
  phone: z.string().trim().min(7).max(30),
  /** One of GENDERS' ids. Required by the form; optional here for the same older tabs. */
  gender: z.string().max(20).optional(),
  instagram: z.string().trim().max(80).optional(),
  kvkk: z.literal(true),
  marketing: z.boolean(),
  website: z.string().max(200).optional(), // honeypot — real users never see it
  startedAt: z.number().int(),
  touch: touchSchema,
  pageUrl: z.string().max(500).optional(),
});

const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

function splitName(fullName: string): { first: string; last: string | null } {
  const parts = oneLine(fullName).split(" ");
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("forbidden", "İzin verilmeyen istek.", 403);

  const verdict = await checkBotId();
  if (verdict.isBot && !verdict.isVerifiedBot) {
    return errorJson("bot", "Otomatik istek algılandı. Sayfayı yenileyip tekrar dene.", 403);
  }

  const ip = clientIp(request.headers);
  const limited = await rateLimit(`lead:${ip ?? "unknown"}`, 8, 600);
  if (!limited.ok) return errorJson("rate_limited", "Çok fazla deneme yaptın, birkaç dakika sonra tekrar dene.", 429);

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return json({ error: "invalid", field: typeof field === "string" ? field : null }, 422);
  }
  const body = parsed.data;

  // Honeypot or inhumanly fast submissions: answer like a success, store nothing.
  if (body.website || Date.now() - body.startedAt < MIN_FILL_MS) {
    return json({ status: "received" });
  }

  const answers = {} as Answers;
  for (const question of QUESTIONS) {
    const value = currentOptionId(question.id as QuestionId, body.answers[question.id]);
    if (!isValidAnswer(question.id as QuestionId, value)) return json({ error: "invalid", field: "answers" }, 422);
    answers[question.id] = value;
  }

  // The form sends first and last name; one `fullName` only comes from an older tab.
  const name =
    body.firstName && body.lastName
      ? { first: oneLine(body.firstName), last: oneLine(body.lastName) }
      : body.fullName
        ? splitName(body.fullName)
        : null;
  if (!name) return json({ error: "invalid", field: body.firstName ? "lastName" : "firstName" }, 422);
  if (body.gender !== undefined && !isGender(body.gender)) return json({ error: "invalid", field: "gender" }, 422);
  const fullName = name.last ? `${name.first} ${name.last}` : name.first;

  const phone = normalizePhone(body.phone);
  if (!phone) return json({ error: "invalid", field: "phone" }, 422);
  const email = body.email.trim().toLowerCase();
  // Gender is kept with the answers (jsonb), so it needs no column of its own.
  const storedAnswers: Record<string, string> = body.gender ? { ...answers, gender: body.gender } : answers;

  // Attribution: server cookies (consented) first, then the click data the
  // browser kept in sessionStorage before consent.
  const jar = await cookies();
  const now = Date.now();
  const cookieFbc = jar.get(COOKIE.fbc)?.value;
  const cookieFbp = jar.get(COOKIE.fbp)?.value;
  const firstTouch: Touch | null = decodeTouch(jar.get(COOKIE.firstTouch)?.value) ?? body.touch ?? null;
  const lastTouch: Touch | null = decodeTouch(jar.get(COOKIE.lastTouch)?.value) ?? body.touch ?? null;
  const fbclid =
    (isValidFbCookie(cookieFbc) ? fbclidFromFbc(cookieFbc) : null) ?? body.touch?.fbclid ?? lastTouch?.fbclid ?? null;
  const fbc = isValidFbCookie(cookieFbc)
    ? cookieFbc
    : fbclid
      ? buildFbc(fbclid, Math.min(body.touch?.ts ?? lastTouch?.ts ?? now, now))
      : null;
  const fbp = isValidFbCookie(cookieFbp) ? cookieFbp : null;

  const existing = await findLeadByContact(email, phone.digits);
  if (existing) {
    if (await getActiveBookingForLead(existing.id)) return json({ status: "already_booked" });
    if (existing.status === "won") return json({ status: "known_customer" });
    const lockMs = QUALIFICATION_RULES.reapplyLockDays * 86_400_000;
    if (!existing.qualified && now - existing.last_applied_at.getTime() < lockMs) {
      await bumpApplyCount(existing.id, storedAnswers);
      return json({ status: "disqualified" });
    }
  }

  const result = qualify(answers);
  const data: LeadInsert = {
    fullName,
    firstName: name.first,
    lastName: name.last,
    email,
    phone: phone.digits,
    instagram: instagramHandle(body.instagram),
    answers: storedAnswers,
    score: result.score,
    tier: result.qualified ? result.tier : null,
    qualified: result.qualified,
    disqualifyReason: result.qualified ? null : result.reason,
    status: result.qualified ? "qualified" : "disqualified",
    marketingConsent: body.marketing,
    firstTouch,
    lastTouch,
    fbclid,
    fbc,
    fbp,
    landingUrl: (body.pageUrl ?? firstTouch?.landing ?? null)?.slice(0, 500) ?? null,
    referrer: firstTouch?.referrer ?? null,
    ip,
    userAgent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
  };

  const lead = existing ? await updateLeadOnReapply(existing.id, data) : await insertLead(data);
  await addActivity(lead.id, existing ? "reapplied" : "applied", {
    answers,
    score: result.score,
    qualified: result.qualified,
    tier: result.qualified ? result.tier : null,
    reason: result.qualified ? null : result.reason,
  });

  const submitId = eventIds.submitApplication(lead.id, lead.apply_count);
  const eventSourceUrl = body.pageUrl?.startsWith("http") ? body.pageUrl : `${siteUrl()}/`;

  after(async () => {
    await trackLeadEvent({
      lead,
      eventName: META_EVENTS.submitApplication,
      eventId: submitId,
      actionSource: "website",
      eventSourceUrl,
    });
    if (result.qualified) {
      await trackLeadEvent({
        lead,
        eventName: META_EVENTS.lead,
        eventId: eventIds.lead(lead.id),
        actionSource: "website",
        eventSourceUrl,
        value: result.leadValue,
      });
    } else {
      await trackLeadEvent({
        lead,
        eventName: META_EVENTS.disqualifiedLead,
        eventId: eventIds.disqualified(lead.id, lead.apply_count),
        actionSource: "website",
        eventSourceUrl,
        customData: { reason: result.reason },
      });
    }
  });

  if (!result.qualified) {
    return json({ status: "disqualified", events: { submit: submitId } });
  }
  queueAirtableSync(lead.id, "applied");
  return json({
    status: "qualified",
    leadToken: createLeadToken(lead.id),
    leadId: lead.id,
    firstName: name.first,
    events: {
      submit: submitId,
      lead: eventIds.lead(lead.id),
      value: result.leadValue,
      currency: CURRENCY,
    },
  });
}
