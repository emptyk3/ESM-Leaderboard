import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateLeaderboard, type LeaderboardMember } from "./leaderboard";
import { formatSignedPoints, validateManualPointInput } from "./manual-points";

const identity = (
  alias: string,
  manualCredits: number[] = [],
): LeaderboardMember => ({
  identityId: alias,
  userId: alias,
  alias,
  normalizedAlias: alias.toLowerCase(),
  identityType: "MEMBER",
  isMainAdmin: false,
  isApproved: true,
  isBlocked: false,
  participations: [],
  organizerCredits: [],
  manualCredits,
});

describe("manuelle Punkte", () => {
  it.each(["0", "1.5", "100001", "-100001", "NaN"])(
    "lehnt den ungültigen Punktwert %s ab",
    (points) => {
      expect(validateManualPointInput({ points, reason: "Grund" }).ok).toBe(
        false,
      );
    },
  );
  it.each(["1", "-1", "100000", "-100000"])(
    "akzeptiert den ganzzahligen Grenzwert %s",
    (points) => {
      expect(
        validateManualPointInput({ points, reason: "  Öffentlich  " }),
      ).toEqual({
        ok: true,
        value: { points: Number(points), reason: "Öffentlich" },
      });
    },
  );
  it("verlangt eine begrenzte Begründung", () => {
    expect(validateManualPointInput({ points: "2", reason: "   " }).ok).toBe(
      false,
    );
    expect(
      validateManualPointInput({ points: "2", reason: "ä".repeat(501) }).ok,
    ).toBe(false);
  });
  it("addiert Event-, Veranstalter- und manuelle Punkte und erlaubt negative Gesamtstände", () => {
    const result = calculateLeaderboard([
      {
        ...identity("Minus", [-20]),
        participations: [{ eventId: "a", points: 5 }],
      },
      {
        ...identity("Plus", [3]),
        organizerCredits: [{ eventId: "b", points: 7 }],
      },
    ]);
    expect(result.map(({ alias, points }) => [alias, points])).toEqual([
      ["Plus", 10],
      ["Minus", -15],
    ]);
  });
  it("berechnet Bearbeitung, Löschung, Gleichstand und Claim ohne Doppelwertung direkt neu", () => {
    const reserved = {
      ...identity("Alias", [5]),
      userId: null,
      identityType: "RESERVED" as const,
      isApproved: false,
    };
    expect(
      calculateLeaderboard([reserved, identity("Beta", [5])]).map((x) => [
        x.rank,
        x.alias,
      ]),
    ).toEqual([
      [1, "Alias"],
      [1, "Beta"],
    ]);
    expect(
      calculateLeaderboard([
        {
          ...reserved,
          identityType: "MEMBER",
          userId: "user",
          isApproved: true,
          manualCredits: [-2],
        },
      ])[0].points,
    ).toBe(-2);
    expect(
      calculateLeaderboard([{ ...reserved, manualCredits: [] }])[0].points,
    ).toBe(0);
  });
  it("formatiert negative Werte ausdrücklich und nicht nur über Farbe", () => {
    expect(formatSignedPoints(4)).toBe("+4");
    expect(formatSignedPoints(-4)).toBe("−4");
  });
  it("sichert Grenzen, Idempotenz und unveränderliche Archive in PostgreSQL ab", () => {
    const sql = readFileSync(
      "prisma/migrations/20260908000000_manual_points/migration.sql",
      "utf8",
    );
    expect(sql).toContain('"points" BETWEEN -100000 AND 100000');
    expect(sql).toContain('"ManualPointEntry_requestId_key"');
    expect(sql).toContain('"SeasonSnapshotManualPoint_immutable"');
  });
  it("autorisiert alle Mutationen erneut und veröffentlicht nur explizite Felder", () => {
    const service = readFileSync("src/server/manual-point-service.ts", "utf8");
    expect(service.match(/await assertAdmin/g) ?? []).toHaveLength(4);
    const publicService = readFileSync("src/server/public-service.ts", "utf8");
    expect(publicService).toContain(
      "select: { points: true, reason: true, bookedAt: true }",
    );
    expect(publicService).not.toMatch(
      /manualPointEntries:[\s\S]{0,250}(email|passwordHash|name: true)/,
    );
  });
});
