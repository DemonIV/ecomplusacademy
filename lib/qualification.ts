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
  /** Budget answers that end the application (default: under ₺25.000). */
  disqualifyingBudgets: ["lt10", "10_25"],
  /** Readiness answers that end the application. */
  disqualifyingReadiness: ["no"],
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
  budget: { lt10: 0, "10_25": 5, "25_50": 20, "50_100": 30, gt100: 40 },
  readiness: { yes: 20, installments: 12, no: 0 },
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

export function qualify(answers: Answers, options: { reapplyLocked?: boolean } = {}): QualificationResult {
  const score = scoreAnswers(answers);
  if (options.reapplyLocked) return { qualified: false, score, reason: "reapply_lock" };
  if ((QUALIFICATION_RULES.disqualifyingBudgets as readonly string[]).includes(answers.budget)) {
    return { qualified: false, score, reason: "budget" };
  }
  if ((QUALIFICATION_RULES.disqualifyingReadiness as readonly string[]).includes(answers.readiness)) {
    return { qualified: false, score, reason: "readiness" };
  }
  const tier = (QUALIFICATION_RULES.tiers.find((t) => score >= t.minScore)?.tier ?? "C") as Tier;
  return { qualified: true, score, tier, leadValue: QUALIFICATION_RULES.leadValue[tier] };
}
