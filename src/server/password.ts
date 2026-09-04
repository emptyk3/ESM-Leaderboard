import { hash, hashSync, verify } from "@node-rs/argon2";

const OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
} as const;

const DUMMY_HASH = hashSync("kein-echtes-passwort", OPTIONS);

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(
  passwordHash: string | null,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash ?? DUMMY_HASH, password);
  } catch {
    return false;
  }
}
