import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";
import { normalizeAlias, validateAlias } from "@/domain/identity";
import {
  isWithinSeason,
  validateEventInput,
  type EventFormInput,
} from "@/domain/event";
import { getPrisma } from "./prisma";

export class EventAuthorizationError extends Error {}
export class EventConflictError extends Error {}

async function assertMainAdmin(tx: Prisma.TransactionClient, actorId: string) {
  const admin = await tx.mainAdmin.findUnique({
    where: { userId: actorId },
    select: { user: { select: { isBlocked: true } } },
  });
  if (!admin || admin.user.isBlocked)
    throw new EventAuthorizationError(
      "Nur der Hauptadmin darf Events verwalten.",
    );
}

async function activeSeason(tx: Prisma.TransactionClient) {
  const season = await tx.season.findFirst({
    where: { isActive: true, archivedAt: null },
    select: { id: true, name: true, startsAt: true, endsAt: true },
  });
  if (!season)
    throw new EventConflictError("Es gibt derzeit keine aktive Saison.");
  return season;
}

async function validateOrganizers(
  tx: Prisma.TransactionClient,
  aliasIds: string[],
  existing: string[] = [],
) {
  if (!aliasIds.length) return;
  const aliases = await tx.aliasIdentity.findMany({
    where: { id: { in: aliasIds } },
    select: {
      id: true,
      isReserved: true,
      user: { select: { isApproved: true, isBlocked: true } },
    },
  });
  const existingSet = new Set(existing);
  const valid = aliases.filter(
    (alias) =>
      alias.isReserved ||
      (alias.user?.isApproved && !alias.user.isBlocked) ||
      existingSet.has(alias.id),
  );
  if (valid.length !== aliasIds.length)
    throw new EventConflictError(
      "Mindestens ein Veranstalter ist nicht freigegeben, gesperrt oder nicht mehr verfügbar.",
    );
}

function publicEventSelect() {
  return {
    id: true,
    title: true,
    description: true,
    location: true,
    startsAt: true,
    endsAt: true,
    participantPoints: true,
    organizerPoints: true,
    seasonId: true,
    organizers: {
      select: {
        aliasId: true,
        alias: {
          select: {
            displayAlias: true,
            isReserved: true,
            claimRequestedAt: true,
            user: { select: { id: true, isApproved: true, isBlocked: true } },
          },
        },
      },
    },
    participations: {
      select: {
        id: true,
        source: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            isApproved: true,
            alias: { select: { displayAlias: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    },
  } satisfies Prisma.EventSelect;
}

export async function getEventAdminData(actorId: string) {
  return getPrisma().$transaction(async (tx) => {
    await assertMainAdmin(tx, actorId);
    const [season, events, aliases, participantCandidates] = await Promise.all([
      tx.season.findFirst({
        where: { isActive: true, archivedAt: null },
        select: { id: true, name: true, startsAt: true, endsAt: true },
      }),
      tx.event.findMany({
        where: { season: { isActive: true, archivedAt: null } },
        select: publicEventSelect(),
        orderBy: { startsAt: "asc" },
      }),
      tx.aliasIdentity.findMany({
        where: {
          OR: [
            { isReserved: true },
            { user: { is: { isApproved: true, isBlocked: false } } },
          ],
        },
        select: {
          id: true,
          displayAlias: true,
          isReserved: true,
          claimRequestedAt: true,
          user: { select: { isApproved: true, isBlocked: true } },
        },
        orderBy: { normalizedAlias: "asc" },
      }),
      tx.user.findMany({
        where: { isBlocked: false },
        select: {
          id: true,
          name: true,
          isApproved: true,
          alias: { select: { displayAlias: true } },
        },
        orderBy: { alias: { normalizedAlias: "asc" } },
      }),
    ]);
    return { season, events, aliases, participantCandidates };
  });
}

type Result = { ok: true; eventId?: string } | { ok: false; message: string };

function handled(error: unknown): Result {
  if (
    error instanceof EventAuthorizationError ||
    error instanceof EventConflictError
  )
    return { ok: false, message: error.message };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2034"].includes(error.code)
  )
    return {
      ok: false,
      message:
        "Die Änderung kollidiert mit einer gleichzeitigen Eingabe. Bitte versuche es erneut.",
    };
  throw error;
}

export async function createEvent(
  actorId: string,
  input: EventFormInput,
): Promise<Result> {
  const validated = validateEventInput(input);
  if (!validated.ok) return validated;
  try {
    return await getPrisma().$transaction(
      async (tx) => {
        await assertMainAdmin(tx, actorId);
        const season = await activeSeason(tx);
        if (!isWithinSeason(validated.value, season))
          throw new EventConflictError(
            `Das Event muss vollständig innerhalb der aktiven Saison ${season.name} liegen.`,
          );
        await validateOrganizers(tx, validated.value.organizerAliasIds);
        const { organizerAliasIds, ...eventData } = validated.value;
        const event = await tx.event.create({
          data: {
            ...eventData,
            seasonId: season.id,
            participationToken: randomBytes(32).toString("base64url"),
            organizers: {
              create: organizerAliasIds.map((aliasId) => ({ aliasId })),
            },
          },
          select: { id: true },
        });
        await tx.auditEntry.create({
          data: {
            action: "EVENT_CREATED",
            actorId,
            subjectType: "Event",
            subjectId: event.id,
            metadata: {
              participantPoints: eventData.participantPoints,
              organizerPoints: eventData.organizerPoints,
              organizerCount: organizerAliasIds.length,
            },
          },
        });
        return { ok: true as const, eventId: event.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    return handled(error);
  }
}

export async function updateEvent(
  actorId: string,
  eventId: string,
  input: EventFormInput,
): Promise<Result> {
  const validated = validateEventInput(input);
  if (!validated.ok) return validated;
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertMainAdmin(tx, actorId);
        const season = await activeSeason(tx);
        const previous = await tx.event.findFirst({
          where: { id: eventId, seasonId: season.id },
          select: {
            participantPoints: true,
            organizerPoints: true,
            organizers: { select: { aliasId: true } },
          },
        });
        if (!previous)
          throw new EventConflictError(
            "Das Event gehört nicht zur aktiven Saison oder existiert nicht mehr.",
          );
        if (!isWithinSeason(validated.value, season))
          throw new EventConflictError(
            `Das Event muss vollständig innerhalb der aktiven Saison ${season.name} liegen.`,
          );
        const oldIds = previous.organizers.map((item) => item.aliasId);
        await validateOrganizers(tx, validated.value.organizerAliasIds, oldIds);
        const { organizerAliasIds, ...eventData } = validated.value;
        await tx.event.update({
          where: { id: eventId },
          data: {
            ...eventData,
            organizers: {
              deleteMany: {},
              create: organizerAliasIds.map((aliasId) => ({ aliasId })),
            },
          },
        });
        const pointsChanged =
          previous.participantPoints !== eventData.participantPoints ||
          previous.organizerPoints !== eventData.organizerPoints;
        const organizersChanged =
          oldIds.slice().sort().join() !==
          organizerAliasIds.slice().sort().join();
        await tx.auditEntry.createMany({
          data: [
            {
              action: "EVENT_UPDATED",
              actorId,
              subjectType: "Event",
              subjectId: eventId,
              metadata: {
                organizersChanged,
                organizerCount: organizerAliasIds.length,
              },
            },
            ...(pointsChanged
              ? [
                  {
                    action: "EVENT_POINTS_CHANGED" as const,
                    actorId,
                    subjectType: "Event",
                    subjectId: eventId,
                    metadata: {
                      participantPoints: eventData.participantPoints,
                      organizerPoints: eventData.organizerPoints,
                    },
                  },
                ]
              : []),
          ],
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { ok: true };
  } catch (error) {
    return handled(error);
  }
}

export async function deleteEvent(
  actorId: string,
  eventId: string,
): Promise<Result> {
  try {
    await getPrisma().$transaction(async (tx) => {
      await assertMainAdmin(tx, actorId);
      const season = await activeSeason(tx);
      const event = await tx.event.findFirst({
        where: { id: eventId, seasonId: season.id },
        select: {
          id: true,
          participantPoints: true,
          organizerPoints: true,
          _count: { select: { participations: true, organizers: true } },
        },
      });
      if (!event)
        throw new EventConflictError(
          "Das Event gehört nicht zur aktiven Saison oder existiert nicht mehr.",
        );
      await tx.auditEntry.create({
        data: {
          action: "EVENT_DELETED",
          actorId,
          subjectType: "Event",
          subjectId: event.id,
          metadata: {
            participationCount: event._count.participations,
            organizerCount: event._count.organizers,
          },
        },
      });
      await tx.event.delete({ where: { id: event.id } });
    });
    return { ok: true };
  } catch (error) {
    return handled(error);
  }
}

export async function reserveOrganizerAlias(
  actorId: string,
  alias: string,
): Promise<Result> {
  const validationError = validateAlias(alias);
  if (validationError) return { ok: false, message: validationError };
  try {
    const id = await getPrisma().$transaction(async (tx) => {
      await assertMainAdmin(tx, actorId);
      const created = await tx.aliasIdentity.create({
        data: {
          displayAlias: alias.normalize("NFKC"),
          normalizedAlias: normalizeAlias(alias),
          isReserved: true,
        },
        select: { id: true },
      });
      await tx.auditEntry.create({
        data: {
          action: "ORGANIZER_ALIAS_RESERVED",
          actorId,
          subjectType: "AliasIdentity",
          subjectId: created.id,
          metadata: { purpose: "event-organizer" },
        },
      });
      return created.id;
    });
    return { ok: true, eventId: id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return {
        ok: false,
        message: "Dieser Alias ist bereits vergeben oder reserviert.",
      };
    return handled(error);
  }
}
