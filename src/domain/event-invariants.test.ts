import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../prisma/migrations/20260905000000_event_integrity_and_alias_claims/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const service = readFileSync(
  new URL("../server/event-service.ts", import.meta.url),
  "utf8",
);

describe("event persistence invariants", () => {
  it("enforces season bounds and archived immutability in PostgreSQL", () => {
    expect(migration).toContain('CREATE TRIGGER "Event_enforce_season_bounds"');
    expect(migration).toContain('NEW."startsAt" < parent."startsAt"');
    expect(migration).toContain('NEW."endsAt" > parent."endsAt"');
    expect(migration).toContain(
      'CREATE TRIGGER "Event_prevent_archived_update_delete"',
    );
  });
  it("guards participant-organizer overlap from both insertion directions", () => {
    expect(migration).toContain(
      'CREATE TRIGGER "EventParticipation_prevent_organizer_overlap"',
    );
    expect(migration).toContain(
      'CREATE TRIGGER "EventOrganizer_prevent_participant_overlap"',
    );
  });
  it("keeps QR secrets out of selects and audit metadata", () => {
    const tokenMentions = service.match(/participationToken/g) ?? [];
    expect(tokenMentions).toHaveLength(1);
    expect(service).toContain("participationToken: randomBytes(32)");
    expect(service).not.toMatch(/metadata:[\s\S]{0,250}participationToken/);
  });
  it("authorizes every mutation inside its database transaction", () => {
    expect(service.match(/await assertMainAdmin\(tx, actorId\)/g)).toHaveLength(
      5,
    );
  });
  it("deletes through the event cascade and audits only aggregate counts", () => {
    expect(service).toContain("await tx.event.delete");
    expect(service).toContain(
      "participationCount: event._count.participations",
    );
  });
});
