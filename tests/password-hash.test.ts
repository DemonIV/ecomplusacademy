import { describe, expect, it } from "vitest";
import { passwordProblem, verifyPassword } from "@/lib/auth/password";
// Plain .mjs helper used by scripts/admin-reset-password.mjs.
import { hashPassword as scriptHash, passwordProblem as scriptProblem } from "../scripts/lib/password-hash.mjs";

describe("admin password reset script", () => {
  it("produces hashes the app accepts", async () => {
    const hash: string = await scriptHash("Çok-gizli şifre 2026");
    expect(hash.startsWith("scrypt$32768$8$1$")).toBe(true);
    expect(await verifyPassword("Çok-gizli şifre 2026", hash)).toBe(true);
    expect(await verifyPassword("yanlış şifre 2026", hash)).toBe(false);
  });

  it("applies the same password rules", () => {
    for (const pw of ["kisa", "x".repeat(10), "x".repeat(201)]) {
      expect(scriptProblem(pw)).toBe(passwordProblem(pw));
    }
  });
});
