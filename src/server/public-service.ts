import "server-only";
import { getPrisma } from "./prisma";
import { getActiveLeaderboard } from "./season-service";

async function isMainAdminProfile(publicId: string): Promise<boolean> {
  return (
    (await getPrisma().mainAdmin.findFirst({
      where: { user: { alias: { publicId } } },
      select: { id: true },
    })) !== null
  );
}

export async function getPublicEvents() {
  return getPrisma().event.findMany({
    where: { season: { isActive: true, archivedAt: null } },
    select: {
      publicId: true,
      title: true,
      location: true,
      startsAt: true,
      endsAt: true,
      participantPoints: true,
    },
  });
}

export async function getPublicEvent(publicId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) return null;
  return getPrisma().event.findFirst({
    where: { publicId, season: { isActive: true, archivedAt: null } },
    select: {
      publicId: true,
      title: true,
      description: true,
      location: true,
      startsAt: true,
      endsAt: true,
      participantPoints: true,
      organizers: {
        select: { alias: { select: { publicId: true, displayAlias: true } } },
        orderBy: { alias: { normalizedAlias: "asc" } },
      },
    },
  });
}

export async function getPublicProfile(publicId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) return null;
  if (await isMainAdminProfile(publicId)) return null;
  const identity = await getPrisma().aliasIdentity.findUnique({
    where: {
      publicId,
      OR: [
        { isReserved: true },
        { user: { is: { isApproved: true, mainAdmin: null } } },
      ],
    },
    select: {
      displayAlias: true,
      user: {
        select: {
          participations: {
            where: { event: { season: { isActive: true, archivedAt: null } } },
            select: {
              event: {
                select: {
                  publicId: true,
                  title: true,
                  startsAt: true,
                  participantPoints: true,
                },
              },
            },
          },
        },
      },
      organizerAssignments: {
        where: { event: { season: { isActive: true, archivedAt: null } } },
        select: {
          event: { select: { publicId: true, title: true, startsAt: true } },
        },
      },
      manualPointEntries: {
        where: { season: { isActive: true, archivedAt: null } },
        select: { id: true, points: true, reason: true, bookedAt: true },
        orderBy: [{ bookedAt: "desc" }, { id: "desc" }],
      },
    },
  });
  if (!identity) return null;
  const leaderboard = await getActiveLeaderboard();
  const entry = leaderboard?.entries.find(
    (item) => item.alias === identity.displayAlias,
  );
  if (!entry) return null;
  const roles = new Map<
    string,
    {
      publicId: string;
      title: string;
      startsAt: Date;
      role: "Teilnehmer" | "Veranstalter";
      participantPoints?: number;
    }
  >();
  for (const item of identity.user?.participations ?? [])
    roles.set(item.event.publicId, {
      ...item.event,
      role: "Teilnehmer",
      participantPoints: item.event.participantPoints,
    });
  for (const item of identity.organizerAssignments)
    roles.set(item.event.publicId, { ...item.event, role: "Veranstalter" });
  return {
    alias: identity.displayAlias,
    rank: entry.rank,
    points: entry.points,
    events: [...roles.values()].sort(
      (a, b) => b.startsAt.getTime() - a.startsAt.getTime(),
    ),
    manualPoints: identity.manualPointEntries.map((entry) => ({
      points: entry.points,
      reason: entry.reason,
      bookedAt: entry.bookedAt,
    })),
  };
}

export async function getPublicProfileArchives(publicId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) return [];
  if (await isMainAdminProfile(publicId)) return [];
  return getPrisma().seasonSnapshotEntry.findMany({
    where: { aliasPublicId: publicId },
    select: {
      alias: true,
      rank: true,
      points: true,
      snapshot: {
        select: {
          seasonId: true,
          seasonName: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
    orderBy: { snapshot: { startsAt: "desc" } },
  });
}

export async function getPublicArchivedProfile(
  publicId: string,
  seasonId: string,
) {
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) return null;
  if (await isMainAdminProfile(publicId)) return null;
  const entry = await getPrisma().seasonSnapshotEntry.findFirst({
    where: { aliasPublicId: publicId, snapshot: { seasonId } },
    select: {
      alias: true,
      rank: true,
      points: true,
      snapshot: { select: { seasonName: true, startsAt: true, endsAt: true } },
    },
  });
  if (!entry) return null;
  const manualPoints = await getPrisma().seasonSnapshotManualPoint.findMany({
    where: {
      aliasPublicId: publicId,
      snapshot: { seasonId },
    },
    select: { points: true, reason: true, bookedAt: true },
    orderBy: [{ bookedAt: "desc" }, { id: "desc" }],
  });
  return { ...entry, manualPoints };
}
