-- Stable opaque public identifiers keep database/account IDs out of public routes.
ALTER TABLE "AliasIdentity" ADD COLUMN "publicId" UUID;
UPDATE "AliasIdentity" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "AliasIdentity" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "AliasIdentity" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "AliasIdentity_publicId_key" ON "AliasIdentity"("publicId");

ALTER TABLE "Event" ADD COLUMN "publicId" UUID;
UPDATE "Event" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Event" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX "Event_publicId_key" ON "Event"("publicId");

-- Scalar copy without a foreign key: archived profile references survive deletion.
ALTER TABLE "SeasonSnapshotEntry" ADD COLUMN "aliasPublicId" UUID;
UPDATE "SeasonSnapshotEntry" entry
SET "aliasPublicId" = alias."publicId"
FROM "User" member
JOIN "AliasIdentity" alias ON alias."id" = member."aliasId"
WHERE entry."userId" = member."id";
CREATE INDEX "SeasonSnapshotEntry_aliasPublicId_idx" ON "SeasonSnapshotEntry"("aliasPublicId");

DROP TRIGGER "SeasonSnapshotEntry_content_immutable" ON "SeasonSnapshotEntry";
CREATE TRIGGER "SeasonSnapshotEntry_content_immutable"
  BEFORE UPDATE OF "snapshotId", "alias", "aliasPublicId", "points", "rank" OR DELETE ON "SeasonSnapshotEntry"
  FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_mutation();
