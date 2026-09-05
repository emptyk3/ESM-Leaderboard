ALTER TYPE "AuditAction" ADD VALUE 'MANUAL_POINTS_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'MANUAL_POINTS_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'MANUAL_POINTS_DELETED';

CREATE TABLE "ManualPointEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "requestId" UUID NOT NULL,
  "seasonId" TEXT NOT NULL,
  "aliasId" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "bookedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "ManualPointEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ManualPointEntry_points_check" CHECK ("points" BETWEEN -100000 AND 100000 AND "points" <> 0),
  CONSTRAINT "ManualPointEntry_reason_check" CHECK (length(btrim("reason")) BETWEEN 1 AND 500),
  CONSTRAINT "ManualPointEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE,
  CONSTRAINT "ManualPointEntry_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "AliasIdentity"("id") ON DELETE CASCADE
);
CREATE INDEX "ManualPointEntry_seasonId_bookedAt_idx" ON "ManualPointEntry"("seasonId", "bookedAt");
CREATE UNIQUE INDEX "ManualPointEntry_requestId_key" ON "ManualPointEntry"("requestId");
CREATE INDEX "ManualPointEntry_aliasId_seasonId_idx" ON "ManualPointEntry"("aliasId", "seasonId");

CREATE TABLE "SeasonSnapshotManualPoint" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "sourceEntryId" UUID NOT NULL,
  "aliasPublicId" UUID NOT NULL,
  "alias" VARCHAR(120) NOT NULL,
  "points" INTEGER NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "bookedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "SeasonSnapshotManualPoint_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SeasonSnapshotManualPoint_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SeasonSnapshot"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "SeasonSnapshotManualPoint_snapshotId_sourceEntryId_key" ON "SeasonSnapshotManualPoint"("snapshotId", "sourceEntryId");
CREATE INDEX "SeasonSnapshotManualPoint_aliasPublicId_snapshotId_bookedAt_idx" ON "SeasonSnapshotManualPoint"("aliasPublicId", "snapshotId", "bookedAt");

CREATE FUNCTION reject_snapshot_manual_point_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'archived manual points are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "SeasonSnapshotManualPoint_immutable"
BEFORE UPDATE OR DELETE ON "SeasonSnapshotManualPoint"
FOR EACH ROW EXECUTE FUNCTION reject_snapshot_manual_point_mutation();
