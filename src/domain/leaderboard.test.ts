import { describe, expect, it } from "vitest";
import {
  calculateLeaderboard,
  toPublicEntry,
  type LeaderboardMember,
} from "./leaderboard";

function member(
  overrides: Partial<LeaderboardMember> &
    Pick<LeaderboardMember, "userId" | "alias">,
): LeaderboardMember {
  return {
    normalizedAlias: overrides.alias.toLocaleLowerCase("de-AT"),
    isApproved: true,
    isBlocked: false,
    participations: [],
    organizerCredits: [],
    ...overrides,
  };
}

describe("Leaderboard-Berechnung", () => {
  it("vergibt Standard-Wettkampfränge und sortiert Gleichstände nach normalisiertem Alias", () => {
    const result = calculateLeaderboard([
      member({
        userId: "d",
        alias: "Delta",
        participations: [{ eventId: "1", points: 10 }],
      }),
      member({
        userId: "c",
        alias: "Charlie",
        participations: [{ eventId: "1", points: 20 }],
      }),
      member({
        userId: "a",
        alias: "Äpfel",
        normalizedAlias: "äpfel",
        participations: [{ eventId: "1", points: 20 }],
      }),
      member({
        userId: "b",
        alias: "Bravo",
        participations: [{ eventId: "1", points: 30 }],
      }),
    ]);
    expect(result.map(({ rank, alias }) => [rank, alias])).toEqual([
      [1, "Bravo"],
      [2, "Äpfel"],
      [2, "Charlie"],
      [4, "Delta"],
    ]);
  });

  it("addiert Teilnehmer- und Veranstalterpunkte, ohne einen Veranstalter im selben Event doppelt zu werten", () => {
    const [result] = calculateLeaderboard([
      member({
        userId: "1",
        alias: "Michi",
        participations: [
          { eventId: "event-a", points: 5 },
          { eventId: "event-b", points: 5 },
        ],
        organizerCredits: [
          { eventId: "event-b", points: 12 },
          { eventId: "event-c", points: 10 },
        ],
      }),
    ]);
    expect(result.points).toBe(27);
  });

  it("zeigt freigegebene gesperrte und Null-Punkte-Mitglieder, aber keine nicht freigegebenen", () => {
    const result = calculateLeaderboard([
      member({
        userId: "blocked",
        alias: "Blocked",
        isBlocked: true,
        participations: [{ eventId: "1", points: 5 }],
      }),
      member({ userId: "zero", alias: "Zero" }),
      member({
        userId: "pending",
        alias: "Pending",
        isApproved: false,
        participations: [{ eventId: "1", points: 99 }],
      }),
    ]);
    expect(result.map(({ alias, points }) => [alias, points])).toEqual([
      ["Blocked", 5],
      ["Zero", 0],
    ]);
  });

  it("liefert öffentlich ausschließlich Rang, Alias und Punkte", () => {
    expect(
      Object.keys(
        toPublicEntry({
          userId: "secret-id",
          rank: 1,
          alias: "Public",
          points: 4,
        }),
      ),
    ).toEqual(["rank", "alias", "points"]);
  });
});
