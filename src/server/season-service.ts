import "server-only";
import { Prisma } from "../../generated/prisma/client";
import {
  calculateLeaderboard,
  toPublicEntry,
  type LeaderboardMember,
  type PublicLeaderboardEntry,
} from "@/domain/leaderboard";
import {
  isExpectedActiveSeason,
  validateSeasonInput,
  type SeasonFormInput,
} from "@/domain/season-management";
import { getPrisma } from "./prisma";

export type PublicSeason = {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
};
export type PublicLeaderboard = {
  season: PublicSeason;
  entries: PublicLeaderboardEntry[];
};
export type SeasonOverview = PublicSeason & {
  isActive: boolean;
  archivedAt: Date | null;
  memberCount?: number;
};

export class SeasonConflictError extends Error {}
export class SeasonAuthorizationError extends Error {}

async function assertMainAdmin(tx: Prisma.TransactionClient, actorId: string) {
  const admin = await tx.mainAdmin.findUnique({
    where: { userId: actorId },
    select: { id: true, user: { select: { isBlocked: true } } },
  });
  if (!admin || admin.user.isBlocked)
    throw new SeasonAuthorizationError(
      "Nur der Hauptadmin darf Saisonen verwalten.",
    );
}

async function loadLeaderboardIdentities(
  tx: Prisma.TransactionClient,
  seasonId: string,
): Promise<LeaderboardMember[]> {
  const aliases = await tx.aliasIdentity.findMany({
    where: {
      OR: [{ isReserved: true }, { user: { is: { isApproved: true } } }],
    },
    select: {
      id: true,
      displayAlias: true,
      normalizedAlias: true,
      isReserved: true,
      organizerAssignments: {
        where: { event: { seasonId } },
        select: {
          eventId: true,
          event: { select: { organizerPoints: true } },
        },
      },
      user: {
        select: {
          id: true,
          isApproved: true,
          isBlocked: true,
          participations: {
            where: { event: { seasonId } },
            select: {
              eventId: true,
              event: { select: { participantPoints: true } },
            },
          },
        },
      },
    },
  });
  return aliases.map((alias) => ({
    identityId: alias.id,
    userId: alias.user?.id ?? null,
    alias: alias.displayAlias,
    normalizedAlias: alias.normalizedAlias,
    identityType: alias.isReserved ? "RESERVED" : "MEMBER",
    isApproved: alias.user?.isApproved ?? false,
    isBlocked: alias.user?.isBlocked ?? false,
    participations: (alias.user?.participations ?? []).map((item) => ({
      eventId: item.eventId,
      points: item.event.participantPoints,
    })),
    organizerCredits: alias.organizerAssignments.map((item) => ({
      eventId: item.eventId,
      points: item.event.organizerPoints ?? 0,
    })),
  }));
}

export async function getActiveLeaderboard(): Promise<PublicLeaderboard | null> {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const season = await tx.season.findFirst({
      where: { isActive: true, archivedAt: null },
      select: { id: true, name: true, startsAt: true, endsAt: true },
    });
    if (!season) return null;
    const identities = await loadLeaderboardIdentities(tx, season.id);
    const profileIds = new Map(
      (
        await tx.aliasIdentity.findMany({
          where: { id: { in: identities.map((item) => item.identityId) } },
          select: { id: true, publicId: true },
        })
      ).map((item) => [item.id, item.publicId]),
    );
    const entries = calculateLeaderboard(identities).map((entry) =>
      toPublicEntry(entry, profileIds.get(entry.identityId)),
    );
    return { season, entries };
  });
}

export async function getActiveRankForUser(
  userId: string,
): Promise<number | null> {
  return getPrisma().$transaction(async (tx) => {
    const season = await tx.season.findFirst({
      where: { isActive: true, archivedAt: null },
      select: { id: true },
    });
    if (!season) return null;
    return (
      calculateLeaderboard(await loadLeaderboardIdentities(tx, season.id)).find(
        (entry) => entry.userId === userId,
      )?.rank ?? null
    );
  });
}

export async function getArchivedLeaderboards(): Promise<SeasonOverview[]> {
  return getPrisma().season.findMany({
    where: { archivedAt: { not: null }, snapshot: { isNot: null } },
    select: {
      id: true,
      name: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
      archivedAt: true,
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function getArchivedLeaderboard(
  seasonId: string,
): Promise<PublicLeaderboard | null> {
  const snapshot = await getPrisma().seasonSnapshot.findUnique({
    where: { seasonId },
    select: {
      seasonId: true,
      seasonName: true,
      startsAt: true,
      endsAt: true,
      entries: {
        select: { rank: true, alias: true, points: true, aliasPublicId: true },
      },
    },
  });
  if (!snapshot) return null;
  const entries = snapshot.entries
    .map(({ aliasPublicId, ...entry }) => ({
      ...entry,
      ...(aliasPublicId ? { profileId: aliasPublicId } : {}),
    }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.alias
          .normalize("NFKC")
          .toLocaleLowerCase("de-AT")
          .localeCompare(
            b.alias.normalize("NFKC").toLocaleLowerCase("de-AT"),
            "de-AT",
          ),
    );
  return {
    season: {
      id: snapshot.seasonId,
      name: snapshot.seasonName,
      startsAt: snapshot.startsAt,
      endsAt: snapshot.endsAt,
    },
    entries,
  };
}

export async function getSeasonOverview() {
  return getPrisma().season.findMany({
    select: {
      id: true,
      name: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
      archivedAt: true,
      _count: { select: { events: true } },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function createInitialSeason(
  actorId: string,
  input: SeasonFormInput,
) {
  const validated = validateSeasonInput(input);
  if (!validated.ok) return validated;
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertMainAdmin(tx, actorId);
        if ((await tx.season.count()) !== 0)
          throw new SeasonConflictError(
            "Eine erste Saison kann nur in einem leeren Saisonbestand angelegt werden.",
          );
        const season = await tx.season.create({
          data: { ...validated.value, isActive: true },
        });
        await tx.auditEntry.create({
          data: {
            action: "SEASON_CREATED",
            actorId,
            subjectType: "Season",
            subjectId: season.id,
            metadata: { seasonName: season.name },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { ok: true as const };
  } catch (error) {
    if (
      error instanceof SeasonConflictError ||
      error instanceof SeasonAuthorizationError
    )
      return { ok: false as const, message: error.message };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    )
      return {
        ok: false as const,
        message:
          "Die Saison konnte wegen einer gleichzeitigen Änderung nicht angelegt werden.",
      };
    throw error;
  }
}

export async function closeSeasonAndOpenNext(
  actorId: string,
  activeSeasonId: string,
  input: SeasonFormInput,
) {
  const validated = validateSeasonInput(input);
  if (!validated.ok) return validated;
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertMainAdmin(tx, actorId);
        await tx.$queryRaw`SELECT "id" FROM "Season" WHERE "id" = ${activeSeasonId} FOR UPDATE`;
        const active = await tx.season.findFirst({
          where: { id: activeSeasonId, isActive: true, archivedAt: null },
          include: {
            events: { include: { organizers: { include: { alias: true } } } },
          },
        });
        if (!active || !isExpectedActiveSeason(active, activeSeasonId))
          throw new SeasonConflictError(
            "Die Saison wurde bereits abgeschlossen oder ist nicht mehr aktiv.",
          );
        const ranked = calculateLeaderboard(
          await loadLeaderboardIdentities(tx, active.id),
        );
        const snapshotProfileIds = new Map(
          (
            await tx.aliasIdentity.findMany({
              where: { id: { in: ranked.map((entry) => entry.identityId) } },
              select: { id: true, publicId: true },
            })
          ).map((item) => [item.id, item.publicId]),
        );
        const snapshot = await tx.seasonSnapshot.create({
          data: {
            seasonId: active.id,
            seasonName: active.name,
            startsAt: active.startsAt,
            endsAt: active.endsAt,
            entries: {
              create: ranked.map((entry) => ({
                userId: entry.userId,
                aliasPublicId: snapshotProfileIds.get(entry.identityId),
                rank: entry.rank,
                alias: entry.alias,
                points: entry.points,
              })),
            },
            events: {
              create: active.events.map((event) => ({
                sourceEventId: event.id,
                title: event.title,
                description: event.description,
                location: event.location,
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                participantPoints: event.participantPoints,
              })),
            },
            organizers: {
              create: active.events.flatMap((event) =>
                event.organizers.map((organizer) => ({
                  sourceEventId: event.id,
                  alias: organizer.alias.displayAlias,
                  aliasIdentityId: organizer.aliasId,
                })),
              ),
            },
          },
        });
        const archived = await tx.season.updateMany({
          where: { id: active.id, isActive: true, archivedAt: null },
          data: { isActive: false, archivedAt: new Date() },
        });
        if (archived.count !== 1)
          throw new SeasonConflictError(
            "Die Saison wurde gleichzeitig verändert.",
          );
        const next = await tx.season.create({
          data: { ...validated.value, isActive: true },
        });
        await tx.auditEntry.create({
          data: {
            action: "SEASON_ARCHIVED",
            actorId,
            subjectType: "Season",
            subjectId: active.id,
            metadata: {
              snapshotId: snapshot.id,
              archivedSeasonName: active.name,
              nextSeasonId: next.id,
              nextSeasonName: next.name,
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { ok: true as const };
  } catch (error) {
    if (
      error instanceof SeasonConflictError ||
      error instanceof SeasonAuthorizationError
    )
      return { ok: false as const, message: error.message };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    )
      return {
        ok: false as const,
        message:
          "Der Saisonabschluss wurde bereits ausgeführt oder gleichzeitig verändert.",
      };
    throw error;
  }
}
