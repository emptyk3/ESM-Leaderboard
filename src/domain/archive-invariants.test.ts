import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  calculateLeaderboard,
  toPublicEntry,
  type LeaderboardMember,
} from "./leaderboard";

describe("Archiv- und Saisoninvarianten", () => {
  it("behält den Snapshot nach Änderungen oder Löschung der Live-Daten unverändert", () => {
    const live: LeaderboardMember[] = [
      {
        identityId: "alias-1",
        userId: "1",
        alias: "Damals",
        normalizedAlias: "damals",
        identityType: "MEMBER",
        isMainAdmin: false,
        isApproved: true,
        isBlocked: false,
        participations: [{ eventId: "event", points: 10 }],
        organizerCredits: [],
      },
    ];
    const snapshot = calculateLeaderboard(live).map((entry) =>
      toPublicEntry(entry),
    );
    live[0].alias = "Heute";
    live[0].participations[0].points = 99;
    live.splice(0, 1);
    expect(snapshot).toEqual([{ rank: 1, alias: "Damals", points: 10 }]);
  });

  it("übernimmt den Hauptadmin nicht in einen neuen Snapshot", () => {
    const ranked = calculateLeaderboard([
      {
        identityId: "admin-alias",
        userId: "admin-user",
        alias: "Admin",
        normalizedAlias: "admin",
        identityType: "MEMBER",
        isMainAdmin: true,
        isApproved: true,
        isBlocked: false,
        participations: [{ eventId: "event", points: 99 }],
        organizerCredits: [],
      },
    ]);
    expect(ranked).toEqual([]);
  });

  it("sichert aktive Saison, Zeiträume und Snapshot-Inhalte zusätzlich in PostgreSQL ab", () => {
    const migration = readFileSync(
      "prisma/migrations/20260904000000_initial/migration.sql",
      "utf8",
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "Season_only_one_active_key"',
    );
    expect(migration).toContain('CONSTRAINT "Season_valid_period_check"');
    expect(migration).toContain('CREATE TRIGGER "SeasonSnapshot_immutable"');
    expect(migration).toContain(
      'CREATE TRIGGER "SeasonSnapshotEntry_content_immutable"',
    );
  });

  it("friert die stabile öffentliche Profilkennung in neuen Archiven ein", () => {
    const migration = readFileSync(
      "prisma/migrations/20260906000000_public_identifiers/migration.sql",
      "utf8",
    );
    expect(migration).toContain('"aliasPublicId" UUID');
    expect(migration).toContain(
      'UPDATE OF "snapshotId", "alias", "aliasPublicId", "points", "rank"',
    );
    expect(migration).not.toContain('FOREIGN KEY ("aliasPublicId")');
  });

  it("bewahrt manuelle Buchungen getrennt und unveränderlich im Archiv", () => {
    const migration = readFileSync(
      "prisma/migrations/20260908000000_manual_points/migration.sql",
      "utf8",
    );
    expect(migration).toContain('CREATE TABLE "SeasonSnapshotManualPoint"');
    expect(migration).toContain("BEFORE UPDATE OR DELETE");
    expect(migration).not.toContain(
      'FOREIGN KEY ("aliasPublicId") REFERENCES "AliasIdentity"',
    );
  });
});
