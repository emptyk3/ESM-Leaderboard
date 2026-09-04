export type PointCredit = { eventId: string; points: number };

export type LeaderboardMember = {
  userId: string;
  alias: string;
  normalizedAlias: string;
  isApproved: boolean;
  isBlocked: boolean;
  participations: PointCredit[];
  organizerCredits: PointCredit[];
};

export type PublicLeaderboardEntry = {
  rank: number;
  alias: string;
  points: number;
};

export type RankedMember = PublicLeaderboardEntry & { userId: string };

export function calculateLeaderboard(
  members: LeaderboardMember[],
): RankedMember[] {
  const scored = members
    .filter((member) => member.isApproved)
    .map((member) => {
      const organizerEvents = new Set(
        member.organizerCredits.map((credit) => credit.eventId),
      );
      const participantPoints = member.participations
        .filter((credit) => !organizerEvents.has(credit.eventId))
        .reduce((sum, credit) => sum + credit.points, 0);
      const organizerPoints = member.organizerCredits.reduce(
        (sum, credit) => sum + credit.points,
        0,
      );
      return {
        userId: member.userId,
        alias: member.alias,
        normalizedAlias: member.normalizedAlias,
        points: participantPoints + organizerPoints,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.normalizedAlias.localeCompare(b.normalizedAlias, "de-AT"),
    );

  let previousPoints: number | undefined;
  let previousRank = 0;
  return scored.map((member, index) => {
    const rank = member.points === previousPoints ? previousRank : index + 1;
    previousPoints = member.points;
    previousRank = rank;
    return {
      userId: member.userId,
      alias: member.alias,
      points: member.points,
      rank,
    };
  });
}

export function toPublicEntry(entry: RankedMember): PublicLeaderboardEntry {
  return { rank: entry.rank, alias: entry.alias, points: entry.points };
}
