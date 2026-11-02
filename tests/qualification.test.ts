import { describe, expect, it } from "vitest";
import { qualify, scoreAnswers } from "@/lib/qualification";
import { QUESTIONS, answerLabel, type Answers } from "@/config/qualification";

const strong: Answers = { stage: "selling", budget: "50_100", readiness: "now", hours: "10_20" };

describe("qualification", () => {
  it("every configured option has a score", () => {
    for (const q of QUESTIONS) {
      for (const o of q.options) {
        const answers = { ...strong, [q.id]: o.id } as Answers;
        expect(typeof scoreAnswers(answers)).toBe("number");
      }
    }
  });

  it("qualifies a strong applicant as tier A with a lead value", () => {
    const result = qualify(strong);
    expect(result).toMatchObject({ qualified: true, tier: "A" });
    if (result.qualified) expect(result.leadValue).toBeGreaterThan(0);
  });

  it("disqualifies budgets under ₺25.000", () => {
    expect(qualify({ ...strong, budget: "lt10" })).toMatchObject({ qualified: false, reason: "budget" });
    expect(qualify({ ...strong, budget: "10_25" })).toMatchObject({ qualified: false, reason: "budget" });
    expect(qualify({ ...strong, budget: "25_50" }).qualified).toBe(true);
  });

  it("start time only ranks: wanting information first still gets a call, scored lower", () => {
    const now = qualify(strong);
    const later = qualify({ ...strong, readiness: "info_first" });
    expect(later.qualified).toBe(true);
    expect(qualify({ ...strong, readiness: "this_month" }).qualified).toBe(true);
    expect(later.score).toBeLessThan(now.score);
  });

  it("a re-apply lock wins over good answers", () => {
    expect(qualify(strong, { reapplyLocked: true })).toMatchObject({ qualified: false, reason: "reapply_lock" });
  });

  it("weaker qualified applicants land in lower tiers", () => {
    const weak = qualify({ stage: "none", budget: "25_50", readiness: "this_month", hours: "lt5" });
    expect(weak).toMatchObject({ qualified: true, tier: "C" });
  });

  it("labels answers to the retired 48-hour question for older leads", () => {
    expect(answerLabel("readiness", "yes")).toContain("eski soru");
    expect(answerLabel("readiness", "now")).toBe("Hemen");
    expect(answerLabel("readiness", "unknown-id")).toBe("unknown-id");
  });
});
