-- Shared counters make abuse protection consistent across serverless instances.
CREATE TYPE "RateLimitPurpose" AS ENUM ('LOGIN', 'INVALID_QR');

CREATE TABLE "RateLimitBucket" (
    "key" VARCHAR(64) NOT NULL,
    "purpose" "RateLimitPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMPTZ(6) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
CREATE INDEX "RateLimitBucket_purpose_expiresAt_idx" ON "RateLimitBucket"("purpose", "expiresAt");
