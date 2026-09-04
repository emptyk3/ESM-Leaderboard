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
        isApproved: true,
        isBlocked: false,
        participations: [{ eventId: "event", points: 10 }],
        organizerCredits: [],
      },
    ];
    const snapshot = calculateLeaderboard(live).map(toPublicEntry);
    live[0].alias = "Heute";
    live[0].participations[0].points = 99;
    live.splice(0, 1);
    expect(snapshot).toEqual([{ rank: 1, alias: "Damals", points: 10 }]);
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
});
