-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ParticipationSource" AS ENUM ('QR_SCAN', 'MANUAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_DELETED', 'USER_APPROVED', 'USER_BLOCKED', 'USER_UNBLOCKED', 'USER_UPDATED', 'PASSWORD_RESET', 'EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED', 'EVENT_POINTS_CHANGED', 'PARTICIPATION_ADDED_MANUALLY', 'PARTICIPATION_DELETED', 'SEASON_CREATED', 'SEASON_ARCHIVED', 'ORGANIZER_ALIAS_RESERVED', 'ORGANIZER_ALIAS_CLAIMED');

-- CreateTable
CREATE TABLE "AliasIdentity" (
    "id" TEXT NOT NULL,
    "displayAlias" VARCHAR(120) NOT NULL,
    "normalizedAlias" VARCHAR(120) NOT NULL,
    "isReserved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AliasIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "normalizedEmail" VARCHAR(320) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMPTZ(6),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "aliasId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainAdmin" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MainAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "lastUsedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(7) NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(300) NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "participantPoints" INTEGER NOT NULL,
    "organizerPoints" INTEGER,
    "participationToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOrganizer" (
    "eventId" TEXT NOT NULL,
    "aliasId" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventOrganizer_pkey" PRIMARY KEY ("eventId","aliasId")
);

-- CreateTable
CREATE TABLE "EventParticipation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "ParticipationSource" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonSnapshot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "seasonName" VARCHAR(7) NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonSnapshotEntry" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "userId" TEXT,
    "alias" VARCHAR(120) NOT NULL,
    "points" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "SeasonSnapshotEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonSnapshotEvent" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(300) NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "participantPoints" INTEGER NOT NULL,

    CONSTRAINT "SeasonSnapshotEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonSnapshotOrganizer" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "alias" VARCHAR(120) NOT NULL,
    "aliasIdentityId" TEXT,

    CONSTRAINT "SeasonSnapshotOrganizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT,
    "subjectType" VARCHAR(80) NOT NULL,
    "subjectId" VARCHAR(200),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AliasIdentity_normalizedAlias_key" ON "AliasIdentity"("normalizedAlias");

-- CreateIndex
CREATE INDEX "AliasIdentity_displayAlias_idx" ON "AliasIdentity"("displayAlias");

-- CreateIndex
CREATE UNIQUE INDEX "User_normalizedEmail_key" ON "User"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_aliasId_key" ON "User"("aliasId");

-- CreateIndex
CREATE INDEX "User_isApproved_isBlocked_idx" ON "User"("isApproved", "isBlocked");

-- CreateIndex
CREATE UNIQUE INDEX "MainAdmin_userId_key" ON "MainAdmin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE INDEX "Season_isActive_idx" ON "Season"("isActive");

-- CreateIndex
CREATE INDEX "Season_startsAt_endsAt_idx" ON "Season"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_participationToken_key" ON "Event"("participationToken");

-- CreateIndex
CREATE INDEX "Event_seasonId_startsAt_idx" ON "Event"("seasonId", "startsAt");

-- CreateIndex
CREATE INDEX "Event_startsAt_endsAt_idx" ON "Event"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "EventOrganizer_aliasId_idx" ON "EventOrganizer"("aliasId");

-- CreateIndex
CREATE INDEX "EventParticipation_userId_eventId_idx" ON "EventParticipation"("userId", "eventId");

-- CreateIndex
CREATE INDEX "EventParticipation_eventId_createdAt_idx" ON "EventParticipation"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipation_eventId_userId_key" ON "EventParticipation"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonSnapshot_seasonId_key" ON "SeasonSnapshot"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonSnapshotEntry_snapshotId_points_alias_idx" ON "SeasonSnapshotEntry"("snapshotId", "points", "alias");

-- CreateIndex
CREATE INDEX "SeasonSnapshotEntry_userId_idx" ON "SeasonSnapshotEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonSnapshotEntry_snapshotId_rank_alias_key" ON "SeasonSnapshotEntry"("snapshotId", "rank", "alias");

-- CreateIndex
CREATE INDEX "SeasonSnapshotEvent_snapshotId_startsAt_idx" ON "SeasonSnapshotEvent"("snapshotId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonSnapshotEvent_snapshotId_sourceEventId_key" ON "SeasonSnapshotEvent"("snapshotId", "sourceEventId");

-- CreateIndex
CREATE INDEX "SeasonSnapshotOrganizer_snapshotId_sourceEventId_idx" ON "SeasonSnapshotOrganizer"("snapshotId", "sourceEventId");

-- CreateIndex
CREATE INDEX "SeasonSnapshotOrganizer_aliasIdentityId_idx" ON "SeasonSnapshotOrganizer"("aliasIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonSnapshotOrganizer_snapshotId_sourceEventId_alias_key" ON "SeasonSnapshotOrganizer"("snapshotId", "sourceEventId", "alias");

-- CreateIndex
CREATE INDEX "AuditEntry_createdAt_idx" ON "AuditEntry"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEntry_action_createdAt_idx" ON "AuditEntry"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEntry_subjectType_subjectId_idx" ON "AuditEntry"("subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "AliasIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainAdmin" ADD CONSTRAINT "MainAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "AliasIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSnapshot" ADD CONSTRAINT "SeasonSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSnapshotEntry" ADD CONSTRAINT "SeasonSnapshotEntry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SeasonSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSnapshotEntry" ADD CONSTRAINT "SeasonSnapshotEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSnapshotEvent" ADD CONSTRAINT "SeasonSnapshotEvent_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SeasonSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSnapshotOrganizer" ADD CONSTRAINT "SeasonSnapshotOrganizer_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SeasonSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSnapshotOrganizer" ADD CONSTRAINT "SeasonSnapshotOrganizer_aliasIdentityId_fkey" FOREIGN KEY ("aliasIdentityId") REFERENCES "AliasIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Central business invariants not expressible in the Prisma schema.
ALTER TABLE "MainAdmin"
  ADD CONSTRAINT "MainAdmin_singleton_check" CHECK ("id" = 1);

CREATE UNIQUE INDEX "Season_only_one_active_key"
  ON "Season" ((true)) WHERE "isActive" = true;

ALTER TABLE "Season"
  ADD CONSTRAINT "Season_valid_period_check" CHECK ("startsAt" < "endsAt"),
  ADD CONSTRAINT "Season_name_format_check" CHECK (
    "name" ~ '^[0-9]{4}/[0-9]{2}$' AND
    substring("name" from 6 for 2)::integer = (substring("name" from 1 for 4)::integer + 1) % 100
  ),
  ADD CONSTRAINT "Season_archived_not_active_check" CHECK ("archivedAt" IS NULL OR "isActive" = false);

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_valid_period_check" CHECK ("startsAt" < "endsAt"),
  ADD CONSTRAINT "Event_participant_points_check" CHECK ("participantPoints" >= 0),
  ADD CONSTRAINT "Event_organizer_points_check" CHECK ("organizerPoints" IS NULL OR "organizerPoints" >= 0),
  ADD CONSTRAINT "Event_token_not_empty_check" CHECK (length("participationToken") >= 32);

ALTER TABLE "AliasIdentity"
  ADD CONSTRAINT "AliasIdentity_display_length_check" CHECK (char_length("displayAlias") BETWEEN 3 AND 30),
  ADD CONSTRAINT "AliasIdentity_trimmed_check" CHECK ("displayAlias" = btrim("displayAlias")),
  ADD CONSTRAINT "AliasIdentity_normalized_not_empty_check" CHECK (length("normalizedAlias") > 0);

ALTER TABLE "SeasonSnapshotEntry"
  ADD CONSTRAINT "SeasonSnapshotEntry_points_check" CHECK ("points" >= 0),
  ADD CONSTRAINT "SeasonSnapshotEntry_rank_check" CHECK ("rank" > 0);

CREATE FUNCTION prevent_archived_season_reopening() RETURNS trigger AS $$
BEGIN
  IF OLD."archivedAt" IS NOT NULL AND (
    NEW."archivedAt" IS DISTINCT FROM OLD."archivedAt" OR
    NEW."name" IS DISTINCT FROM OLD."name" OR
    NEW."startsAt" IS DISTINCT FROM OLD."startsAt" OR
    NEW."endsAt" IS DISTINCT FROM OLD."endsAt"
  ) THEN
    RAISE EXCEPTION 'An archived season cannot be changed or reopened';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Season_prevent_archived_changes"
  BEFORE UPDATE ON "Season"
  FOR EACH ROW EXECUTE FUNCTION prevent_archived_season_reopening();

CREATE FUNCTION prevent_snapshot_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Season snapshots are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SeasonSnapshot_immutable"
  BEFORE UPDATE OR DELETE ON "SeasonSnapshot"
  FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_mutation();
CREATE TRIGGER "SeasonSnapshotEntry_content_immutable"
  BEFORE UPDATE OF "snapshotId", "alias", "points", "rank" OR DELETE ON "SeasonSnapshotEntry"
  FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_mutation();
CREATE TRIGGER "SeasonSnapshotEvent_immutable"
  BEFORE UPDATE OR DELETE ON "SeasonSnapshotEvent"
  FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_mutation();
CREATE TRIGGER "SeasonSnapshotOrganizer_content_immutable"
  BEFORE UPDATE OF "snapshotId", "sourceEventId", "alias" OR DELETE ON "SeasonSnapshotOrganizer"
  FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_mutation();
