// Same format and parameters as lib/auth/password.ts (scrypt$N$r$p$salt$hash,
// base64url); tests/password-hash.test.ts keeps the two in step.
import { randomBytes, scrypt } from "node:crypto";

const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS, (error, key) =>
      error
        ? reject(error)
        : resolve(["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$")),
    ),
  );
}

/** Mirrors passwordProblem() in lib/auth/password.ts. */
export function passwordProblem(password) {
  if (password.length < 10) return "Şifre en az 10 karakter olmalı.";
  if (password.length > 200) return "Şifre çok uzun.";
  return null;
}
