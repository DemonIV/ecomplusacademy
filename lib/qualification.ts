import "server-only";
import type { Answers, QuestionId } from "@/config/qualification";

/**
 * Server-side scoring. Edit thresholds here — never in client code.
 *
 * Hard rules decide WHO sees the calendar. The score only ranks qualified
 * leads into tiers, and the tier sets the `Lead` event value sent to Meta so
 * the algorithm learns that tier-A applicants are worth more.
 */

export const QUALIFICATION_RULES = {
  /**
   * Budget answers that end the application, unless the exact amount the
   * applicant then types reaches `minBudgetUsd` (the "0 – 500 dolar" option
   * asks for it). Empty the list to let everyone reach the calendar.
   */
  disqualifyingBudgets: ["lt500"] as string[],
  /** Dollars. 400 and above still gets a call; below it, or no amount, does not. */
  minBudgetUsd: 400,
  /**
   * Readiness answers that end the application. Empty on purpose: "Önce
   * bilgi almak istiyorum" is a cold visitor worth a call, it only ranks
   * lower. Add "info_first" here to send them to /sonuc instead.
   */
  disqualifyingReadiness: [] as string[],
  /** Days a disqualified phone/e-mail stays disqualified on re-apply. */
  reapplyLockDays: 30,
  tiers: [
    { tier: "A", minScore: 75 },
    { tier: "B", minScore: 55 },
    { tier: "C", minScore: 0 },
  ],
  /**
   * Expected value per qualified lead (TRY) for value-based optimization.
   * Rough guide: program price × historical close rate of that tier.
   */
  leadValue: { A: 4000, B: 2000, C: 800 },
} as const;

const SCORES: Record<QuestionId, Record<string, number>> = {
  stage: { none: 10, tried: 15, selling: 25, established: 30 },
  budget: { lt500: 0, "500_1000": 20, gt1000: 40 },
  readiness: { now: 20, this_month: 12, info_first: 0 },
  hours: { lt5: 0, "5_10": 5, "10_20": 10, gt20: 10 },
};

export type Tier = "A" | "B" | "C";
export type DisqualifyReason = "budget" | "readiness" | "reapply_lock";

export type QualificationResult =
  | { qualified: true; score: number; tier: Tier; leadValue: number }
  | { qualified: false; score: number; reason: DisqualifyReason };

export function scoreAnswers(answers: Answers): number {
  return (Object.keys(SCORES) as QuestionId[]).reduce(
    (total, id) => total + (SCORES[id][answers[id]] ?? 0),
    0,
  );
}

export function qualify(
  answers: Answers,
  options: { reapplyLocked?: boolean; budgetUsd?: number | null } = {},
): QualificationResult {
  const score = scoreAnswers(answers);
  if (options.reapplyLocked) return { qualified: false, score, reason: "reapply_lock" };
  if ((QUALIFICATION_RULES.disqualifyingBudgets as readonly string[]).includes(answers.budget)) {
    const stated = options.budgetUsd;
    if (typeof stated !== "number" || stated < QUALIFICATION_RULES.minBudgetUsd) {
      return { qualified: false, score, reason: "budget" };
    }
  }
  if ((QUALIFICATION_RULES.disqualifyingReadiness as readonly string[]).includes(answers.readiness)) {
    return { qualified: false, score, reason: "readiness" };
  }
  const tier = (QUALIFICATION_RULES.tiers.find((t) => score >= t.minScore)?.tier ?? "C") as Tier;
  return { qualified: true, score, tier, leadValue: QUALIFICATION_RULES.leadValue[tier] };
}
