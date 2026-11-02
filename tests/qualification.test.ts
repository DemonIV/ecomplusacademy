import { describe, expect, it } from "vitest";
import { qualify, scoreAnswers } from "@/lib/qualification";
import { QUESTIONS, type Answers } from "@/config/qualification";

const strong: Answers = { stage: "selling", budget: "50_100", readiness: "yes", hours: "10_20" };

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

  it("disqualifies applicants who cannot start", () => {
    expect(qualify({ ...strong, readiness: "no" })).toMatchObject({ qualified: false, reason: "readiness" });
    expect(qualify({ ...strong, readiness: "installments" }).qualified).toBe(true);
  });

  it("a re-apply lock wins over good answers", () => {
    expect(qualify(strong, { reapplyLocked: true })).toMatchObject({ qualified: false, reason: "reapply_lock" });
  });

  it("weaker qualified applicants land in lower tiers", () => {
    const weak = qualify({ stage: "none", budget: "25_50", readiness: "installments", hours: "lt5" });
    expect(weak).toMatchObject({ qualified: true, tier: "C" });
  });
});
