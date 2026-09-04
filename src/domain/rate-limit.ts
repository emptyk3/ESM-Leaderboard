export type RateLimitPurpose = "LOGIN" | "INVALID_QR";

export const RATE_LIMIT_POLICIES = {
  LOGIN: { limit: 10, windowMs: 15 * 60_000 },
  INVALID_QR: { limit: 30, windowMs: 10 * 60_000 },
} as const satisfies Record<
  RateLimitPurpose,
  { limit: number; windowMs: number }
>;

export function isRateLimitAllowed(attempts: number, limit: number) {
  return attempts <= limit;
}

export function windowExpiresAt(now: Date, windowMs: number) {
  return new Date(now.getTime() + windowMs);
}

export function rateLimitKey(
  purpose: RateLimitPurpose,
  fingerprint: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(`${purpose}\0${fingerprint}`)
    .digest("hex");
}
import { createHmac } from "node:crypto";
