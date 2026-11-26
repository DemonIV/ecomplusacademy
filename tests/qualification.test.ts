import { describe, expect, it } from "vitest";
import { qualify, scoreAnswers } from "@/lib/qualification";
import {
  BUDGET_DETAIL,
  QUESTIONS,
  answerLabel,
  budgetAmountLabel,
  currentOptionId,
  genderLabel,
  isGender,
  isValidAnswer,
  parseBudgetAmount,
  type Answers,
} from "@/config/qualification";

const strong: Answers = { stage: "selling", budget: "gt1000", readiness: "now", hours: "10_20" };

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

  it("disqualifies budgets under 500 dollars", () => {
    expect(qualify({ ...strong, budget: "lt500" })).toMatchObject({ qualified: false, reason: "budget" });
    expect(qualify({ ...strong, budget: "500_1000" }).qualified).toBe(true);
    expect(qualify({ ...strong, budget: "gt1000" }).qualified).toBe(true);
  });

  it("lets the lowest budget option through from 400 dollars, by the exact amount", () => {
    const low = { ...strong, budget: BUDGET_DETAIL.option };
    expect(qualify(low, { budgetUsd: 400 }).qualified).toBe(true);
    expect(qualify(low, { budgetUsd: 450 }).qualified).toBe(true);
    expect(qualify(low, { budgetUsd: 399 })).toMatchObject({ qualified: false, reason: "budget" });
    expect(qualify(low, { budgetUsd: 0 })).toMatchObject({ qualified: false, reason: "budget" });
    expect(qualify(low, { budgetUsd: null })).toMatchObject({ qualified: false, reason: "budget" });
    // The amount never lowers a higher option.
    expect(qualify({ ...strong, budget: "500_1000" }, { budgetUsd: 10 }).qualified).toBe(true);
  });

  it("reads the typed amount as whole dollars", () => {
    expect(parseBudgetAmount("450")).toBe(450);
    expect(parseBudgetAmount(" 400 ")).toBe(400);
    expect(parseBudgetAmount(425)).toBe(425);
    expect(parseBudgetAmount("")).toBeNull();
    expect(parseBudgetAmount("450$")).toBeNull();
    expect(parseBudgetAmount("4,5")).toBeNull();
    expect(parseBudgetAmount(undefined)).toBeNull();
    expect(budgetAmountLabel({ budget_usd: "450" })).toBe("450 dolar");
    expect(budgetAmountLabel({})).toBeNull();
  });

  it("asks the budget in dollars, in three steps", () => {
    const budget = QUESTIONS.find((q) => q.id === "budget");
    expect(budget?.options.map((o) => o.label)).toEqual(["0 – 500 dolar", "500 – 1.000 dolar", "1.000 dolar ve üzeri"]);
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
    const weak = qualify({ stage: "none", budget: "500_1000", readiness: "this_month", hours: "lt5" });
    expect(weak).toMatchObject({ qualified: true, tier: "C" });
  });

  it("labels answers to retired questions for older leads", () => {
    expect(answerLabel("readiness", "yes")).toContain("eski soru");
    expect(answerLabel("budget", "25_50")).toBe("₺25.000 – ₺50.000 (eski soru)");
    expect(answerLabel("budget", "gt1000")).toBe("1.000 dolar ve üzeri");
    expect(answerLabel("readiness", "now")).toBe("Hemen");
    expect(answerLabel("readiness", "unknown-id")).toBe("unknown-id");
  });

  it("maps budget answers from a tab opened before the dollar options", () => {
    expect(currentOptionId("budget", "10_25")).toBe("lt500");
    expect(currentOptionId("budget", "25_50")).toBe("500_1000");
    expect(currentOptionId("budget", "gt100")).toBe("gt1000");
    expect(currentOptionId("budget", "gt1000")).toBe("gt1000");
    expect(currentOptionId("stage", "none")).toBe("none");
    for (const old of ["lt10", "10_25", "25_50", "50_100", "gt100"]) {
      expect(isValidAnswer("budget", currentOptionId("budget", old))).toBe(true);
    }
  });

  it("knows the two gender options of the contact step", () => {
    expect(isGender("female")).toBe(true);
    expect(isGender("other")).toBe(false);
    expect(genderLabel("male")).toBe("Erkek");
    expect(genderLabel(undefined)).toBeNull();
  });
});
