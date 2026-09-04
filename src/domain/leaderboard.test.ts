import { describe, expect, it } from "vitest";
import {
  calculateLeaderboard,
  toPublicEntry,
  type LeaderboardMember,
} from "./leaderboard";

function member(
  overrides: Partial<LeaderboardMember> & Pick<LeaderboardMember, "alias">,
): LeaderboardMember {
  return {
    identityId: `alias-${overrides.userId ?? overrides.alias}`,
    userId: `user-${overrides.alias}`,
    normalizedAlias: overrides.alias.toLocaleLowerCase("de-AT"),
    identityType: "MEMBER",
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
          identityId: "alias-secret",
          userId: "secret-id",
          rank: 1,
          alias: "Public",
          points: 4,
        }),
      ),
    ).toEqual(["rank", "alias", "points"]);
  });

  it("zeigt einen reservierten Alias mit summierten Veranstalterpunkten genau einmal", () => {
    const result = calculateLeaderboard([
      member({
        identityId: "reserved-1",
        userId: null,
        alias: "Orga Nova",
        identityType: "RESERVED",
        isApproved: false,
        organizerCredits: [
          { eventId: "event-a", points: 8 },
          { eventId: "event-b", points: 12 },
        ],
      }),
    ]);
    expect(result).toEqual([
      {
        identityId: "reserved-1",
        userId: null,
        rank: 1,
        alias: "Orga Nova",
        points: 20,
      },
    ]);
  });

  it("rankt Mitglieder und reservierte Aliasse gemeinsam", () => {
    const result = calculateLeaderboard([
      member({
        userId: "high",
        alias: "Mitglied Hoch",
        participations: [{ eventId: "one", points: 30 }],
      }),
      member({
        identityId: "reserved-middle",
        userId: null,
        alias: "Reserviert Mitte",
        identityType: "RESERVED",
        isApproved: false,
        organizerCredits: [{ eventId: "two", points: 20 }],
      }),
      member({
        userId: "low",
        alias: "Mitglied Niedrig",
        participations: [{ eventId: "three", points: 10 }],
      }),
    ]);
    expect(
      result.map(({ rank, alias, points }) => [rank, alias, points]),
    ).toEqual([
      [1, "Mitglied Hoch", 30],
      [2, "Reserviert Mitte", 20],
      [3, "Mitglied Niedrig", 10],
    ]);
  });

  it("sortiert Gleichstände über beide Identitätstypen alphabetisch", () => {
    const result = calculateLeaderboard([
      member({
        alias: "Zeta",
        participations: [{ eventId: "one", points: 10 }],
      }),
      member({
        identityId: "reserved-alpha",
        userId: null,
        alias: "Ähre",
        normalizedAlias: "ähre",
        identityType: "RESERVED",
        isApproved: false,
        organizerCredits: [{ eventId: "two", points: 10 }],
      }),
    ]);
    expect(result.map(({ rank, alias }) => [rank, alias])).toEqual([
      [1, "Ähre"],
      [1, "Zeta"],
    ]);
  });

  it("zeigt einen reservierten Alias auch mit null Punkten", () => {
    const result = calculateLeaderboard([
      member({
        identityId: "reserved-zero",
        userId: null,
        alias: "Zero Orga",
        identityType: "RESERVED",
        isApproved: false,
      }),
    ]);
    expect(result.map(({ alias, points }) => [alias, points])).toEqual([
      ["Zero Orga", 0],
    ]);
  });

  it("überträgt bei einer vorgemerkten Registrierung noch keine Teilnehmerpunkte", () => {
    const result = calculateLeaderboard([
      member({
        identityId: "shared-alias",
        userId: "pending-user",
        alias: "Claim Kandidat",
        identityType: "RESERVED",
        isApproved: false,
        participations: [{ eventId: "participant-event", points: 100 }],
        organizerCredits: [{ eventId: "organizer-event", points: 15 }],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({ alias: "Claim Kandidat", points: 15 }),
    );
  });

  it("führt dieselbe Identität nach bestätigtem Claim ohne parallelen Eintrag fort", () => {
    const result = calculateLeaderboard([
      member({
        identityId: "shared-alias",
        userId: "approved-user",
        alias: "Claim Fertig",
        identityType: "MEMBER",
        isApproved: true,
        participations: [{ eventId: "participant-event", points: 5 }],
        organizerCredits: [{ eventId: "organizer-event", points: 15 }],
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].points).toBe(20);
  });
});
