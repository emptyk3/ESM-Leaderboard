import "server-only";
import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { Prisma, type RateLimitPurpose } from "../../generated/prisma/client";
import {
  isRateLimitAllowed,
  rateLimitKey as createRateLimitKey,
  RATE_LIMIT_POLICIES,
  windowExpiresAt,
} from "@/domain/rate-limit";
import { getPrisma } from "./prisma";

const GENERIC_LOGIN_ERROR =
  "Alias/E-Mail-Adresse oder Passwort ist nicht korrekt.";
const GENERIC_QR_ERROR =
  "Dieser Teilnahme-Link ist ungültig oder nicht mehr verfügbar.";

export const rateLimitMessages = {
  LOGIN: GENERIC_LOGIN_ERROR,
  INVALID_QR: GENERIC_QR_ERROR,
} as const;

function pepper(): string {
  // A dedicated pepper is preferred. DATABASE_URL is already a protected,
  // server-only high-entropy production secret and provides a safe fallback.
  const value = process.env.RATE_LIMIT_PEPPER ?? process.env.DATABASE_URL;
  if (!value || value.length < 32)
    throw new Error("RATE_LIMIT_PEPPER ist nicht sicher konfiguriert.");
  return value;
}

export function rateLimitKey(
  purpose: RateLimitPurpose,
  fingerprint: string,
  secret = pepper(),
) {
  return createRateLimitKey(purpose, fingerprint, secret);
}

export async function requestFingerprint(): Promise<string> {
  const requestHeaders = await headers();
  // Vercel controls these forwarding headers at its trusted edge. Outside Vercel
  // client-provided forwarding headers are deliberately ignored.
  if (process.env.VERCEL === "1") {
    const forwarded = requestHeaders.get("x-vercel-forwarded-for") ?? "unknown";
    return forwarded.split(",")[0]!.trim() || "unknown";
  }
  return "local-development";
}

export async function isRateLimited(
  purpose: RateLimitPurpose,
  fingerprint: string,
) {
  const key = rateLimitKey(purpose, fingerprint);
  const bucket = await getPrisma().rateLimitBucket.findUnique({
    where: { key },
    select: { attempts: true, expiresAt: true },
  });
  return Boolean(
    bucket &&
    bucket.expiresAt > new Date() &&
    !isRateLimitAllowed(
      bucket.attempts + 1,
      RATE_LIMIT_POLICIES[purpose].limit,
    ),
  );
}

export async function recordFailedAttempt(
  purpose: RateLimitPurpose,
  fingerprint: string,
  now = new Date(),
) {
  const policy = RATE_LIMIT_POLICIES[purpose];
  const key = rateLimitKey(purpose, fingerprint);
  const expiresAt = windowExpiresAt(now, policy.windowMs);
  const rows = await getPrisma().$queryRaw<
    { attempts: number; expiresAt: Date }[]
  >(
    Prisma.sql`
      INSERT INTO "RateLimitBucket"
        ("key", "purpose", "attempts", "windowStart", "expiresAt", "updatedAt")
      VALUES (${key}, ${purpose}::"RateLimitPurpose", 1, ${now}, ${expiresAt}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
          ELSE "RateLimitBucket"."attempts" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now}
          ELSE "RateLimitBucket"."windowStart"
        END,
        "expiresAt" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
          ELSE "RateLimitBucket"."expiresAt"
        END,
        "updatedAt" = ${now}
      RETURNING "attempts", "expiresAt"
    `,
  );
  // Cheap bounded cleanup: only one out of 64 failed requests performs it.
  if (parseInt(key.slice(0, 2), 16) % 64 === 0) {
    await getPrisma().rateLimitBucket.deleteMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } },
    });
  }
  return {
    allowed: isRateLimitAllowed(rows[0]!.attempts, policy.limit),
    retryAt: rows[0]!.expiresAt,
  };
}

export async function clearRateLimit(
  purpose: RateLimitPurpose,
  fingerprint: string,
) {
  await getPrisma().rateLimitBucket.deleteMany({
    where: { key: rateLimitKey(purpose, fingerprint) },
  });
}

export function equalOpaqueKeys(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
