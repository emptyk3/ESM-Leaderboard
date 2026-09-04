import { createHash, randomBytes } from "node:crypto";

export const SESSION_DURATION_DAYS = 180;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const SESSION_REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function sessionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_DURATION_MS);
}

export function shouldRefreshSession(
  lastUsedAt: Date,
  now = new Date(),
): boolean {
  return now.getTime() - lastUsedAt.getTime() >= SESSION_REFRESH_AFTER_MS;
}

export function canUseProtectedMemberAction(user: {
  isBlocked: boolean;
}): boolean {
  return !user.isBlocked;
}
