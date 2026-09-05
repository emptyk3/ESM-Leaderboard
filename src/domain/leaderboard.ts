export type PointCredit = { eventId: string; points: number };

export type LeaderboardMember = {
  identityId: string;
  userId: string | null;
  alias: string;
  normalizedAlias: string;
  identityType: "MEMBER" | "RESERVED";
  isMainAdmin: boolean;
  isApproved: boolean;
  isBlocked: boolean;
  participations: PointCredit[];
  organizerCredits: PointCredit[];
  manualCredits?: number[];
};

export type PublicLeaderboardEntry = {
  rank: number;
  alias: string;
  points: number;
  profileId?: string;
};

export type RankedMember = PublicLeaderboardEntry & {
  identityId: string;
  userId: string | null;
};

export function calculateLeaderboard(
  members: LeaderboardMember[],
): RankedMember[] {
  const scored = members
    .filter(
      (member) =>
        !member.isMainAdmin &&
        (member.identityType === "RESERVED" || member.isApproved),
    )
    .map((member) => {
      const organizerEvents = new Set(
        member.organizerCredits.map((credit) => credit.eventId),
      );
      const participantPoints = (
        member.identityType === "RESERVED" ? [] : member.participations
      )
        .filter((credit) => !organizerEvents.has(credit.eventId))
        .reduce((sum, credit) => sum + credit.points, 0);
      const organizerPoints = member.organizerCredits.reduce(
        (sum, credit) => sum + credit.points,
        0,
      );
      return {
        identityId: member.identityId,
        userId: member.userId,
        alias: member.alias,
        normalizedAlias: member.normalizedAlias,
        points:
          participantPoints +
          organizerPoints +
          (member.manualCredits ?? []).reduce((sum, points) => sum + points, 0),
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
      identityId: member.identityId,
      userId: member.userId,
      alias: member.alias,
      points: member.points,
      rank,
    };
  });
}

export function toPublicEntry(
  entry: RankedMember,
  profileId?: string,
): PublicLeaderboardEntry {
  return {
    rank: entry.rank,
    alias: entry.alias,
    points: entry.points,
    ...(profileId ? { profileId } : {}),
  };
}
