-- Additive state for a later admin-confirmed reserved-alias claim.
ALTER TABLE "AliasIdentity"
  ADD COLUMN "claimRequestedAt" TIMESTAMPTZ(6),
  ADD COLUMN "claimedAt" TIMESTAMPTZ(6);

ALTER TABLE "AliasIdentity"
  ADD CONSTRAINT "AliasIdentity_claim_state_check" CHECK (
    "claimedAt" IS NULL OR ("isReserved" = false AND "claimRequestedAt" IS NOT NULL)
  );

-- Events may only live inside a mutable season and within its exact bounds.
CREATE FUNCTION enforce_event_season_bounds() RETURNS trigger AS $$
DECLARE
  parent "Season"%ROWTYPE;
BEGIN
  SELECT * INTO parent FROM "Season" WHERE "id" = NEW."seasonId" FOR SHARE;
  IF NOT FOUND OR parent."archivedAt" IS NOT NULL THEN
    RAISE EXCEPTION 'Events require a non-archived season';
  END IF;
  IF NEW."startsAt" < parent."startsAt" OR NEW."endsAt" > parent."endsAt" THEN
    RAISE EXCEPTION 'Event period must be inside its season';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Event_enforce_season_bounds"
  BEFORE INSERT OR UPDATE OF "seasonId", "startsAt", "endsAt" ON "Event"
  FOR EACH ROW EXECUTE FUNCTION enforce_event_season_bounds();

CREATE FUNCTION prevent_archived_event_mutation() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Season" WHERE "id" = OLD."seasonId" AND "archivedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Events in archived seasons are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Event_prevent_archived_update_delete"
  BEFORE UPDATE OR DELETE ON "Event"
  FOR EACH ROW EXECUTE FUNCTION prevent_archived_event_mutation();

-- A registered user cannot be participant and organizer of the same event.
CREATE FUNCTION prevent_participant_organizer_overlap() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "EventOrganizer" eo
    JOIN "User" u ON u."aliasId" = eo."aliasId"
    WHERE eo."eventId" = NEW."eventId" AND u."id" = NEW."userId"
  ) THEN
    RAISE EXCEPTION 'A user cannot participate in an event they organize';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "EventParticipation_prevent_organizer_overlap"
  BEFORE INSERT OR UPDATE OF "eventId", "userId" ON "EventParticipation"
  FOR EACH ROW EXECUTE FUNCTION prevent_participant_organizer_overlap();

CREATE FUNCTION prevent_organizer_participant_overlap() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User" u
    JOIN "EventParticipation" ep ON ep."userId" = u."id"
    WHERE u."aliasId" = NEW."aliasId" AND ep."eventId" = NEW."eventId"
  ) THEN
    RAISE EXCEPTION 'A participant cannot be assigned as organizer of the same event';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "EventOrganizer_prevent_participant_overlap"
  BEFORE INSERT OR UPDATE OF "eventId", "aliasId" ON "EventOrganizer"
  FOR EACH ROW EXECUTE FUNCTION prevent_organizer_participant_overlap();
