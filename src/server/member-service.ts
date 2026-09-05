import "server-only";
import { Prisma } from "../../generated/prisma/client";
import {
  validateMemberUpdate,
  type MemberUpdateInput,
} from "../domain/member-management";
import { validatePassword } from "../domain/password";
import { getPrisma } from "./prisma";
import { hashPassword } from "./password";

class MemberAuthorizationError extends Error {}
class MemberConflictError extends Error {}

async function assertAdmin(tx: Prisma.TransactionClient, actorId: string) {
  const admin = await tx.mainAdmin.findUnique({
    where: { userId: actorId },
    select: { user: { select: { isBlocked: true } } },
  });
  if (!admin || admin.user.isBlocked)
    throw new MemberAuthorizationError(
      "Nur der Hauptadmin darf Mitglieder verwalten.",
    );
}

async function mutableTarget(
  tx: Prisma.TransactionClient,
  actorId: string,
  userId: string,
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: { alias: true, mainAdmin: { select: { id: true } } },
  });
  if (!user)
    throw new MemberConflictError("Das Mitglied wurde nicht gefunden.");
  if (user.id === actorId || user.mainAdmin)
    throw new MemberConflictError(
      "Das Hauptadmin-Konto kann hier nicht verändert werden.",
    );
  return user;
}

type Result = { ok: true } | { ok: false; message: string };
function handled(error: unknown): Result {
  if (
    error instanceof MemberAuthorizationError ||
    error instanceof MemberConflictError
  )
    return { ok: false, message: error.message };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2034"].includes(error.code)
  )
    return {
      ok: false,
      message:
        "Die Änderung kollidiert mit einer bestehenden oder gleichzeitigen Eingabe.",
    };
  throw error;
}

export async function getMemberAdminData(actorId: string, query = "") {
  return getPrisma().$transaction(async (tx) => {
    await assertAdmin(tx, actorId);
    const search = query.trim();
    return tx.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              {
                alias: {
                  displayAlias: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        isApproved: true,
        isBlocked: true,
        createdAt: true,
        mainAdmin: { select: { id: true } },
        alias: {
          select: {
            id: true,
            displayAlias: true,
            isReserved: true,
            claimRequestedAt: true,
            organizerAssignments: {
              where: {
                event: { season: { isActive: true, archivedAt: null } },
              },
              select: {
                eventId: true,
                event: { select: { title: true, organizerPoints: true } },
              },
            },
          },
        },
        _count: { select: { participations: true, sessions: true } },
      },
      orderBy: [{ isApproved: "asc" }, { createdAt: "asc" }],
    });
  });
}

export async function approveMember(
  actorId: string,
  userId: string,
  confirmClaim: boolean,
): Promise<Result> {
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertAdmin(tx, actorId);
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
        const user = await mutableTarget(tx, actorId, userId);
        if (user.isApproved)
          throw new MemberConflictError(
            "Dieses Konto ist bereits freigegeben.",
          );
        if (user.alias.isReserved && !confirmClaim)
          throw new MemberConflictError(
            "Bitte bestätige den Claim des reservierten Alias ausdrücklich oder vergib zuerst einen anderen Alias.",
          );
        let removedOverlapCount = 0;
        if (user.alias.isReserved) {
          if (!user.alias.claimRequestedAt)
            throw new MemberConflictError(
              "Für diesen reservierten Alias ist kein Claim vorgemerkt.",
            );
          const removed = await tx.eventParticipation.deleteMany({
            where: {
              userId,
              event: { organizers: { some: { aliasId: user.aliasId } } },
            },
          });
          removedOverlapCount = removed.count;
          await tx.aliasIdentity.update({
            where: { id: user.aliasId },
            data: { isReserved: false, claimedAt: new Date() },
          });
          await tx.auditEntry.create({
            data: {
              action: "ORGANIZER_ALIAS_CLAIMED",
              actorId,
              subjectType: "AliasIdentity",
              subjectId: user.aliasId,
              metadata: { userId, removedOverlapCount },
            },
          });
        }
        await tx.user.update({
          where: { id: userId },
          data: { isApproved: true, approvedAt: new Date() },
        });
        await tx.auditEntry.create({
          data: {
            action: "USER_APPROVED",
            actorId,
            subjectType: "User",
            subjectId: userId,
            metadata: { claimedReservedAlias: user.alias.isReserved },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { ok: true };
  } catch (error) {
    return handled(error);
  }
}

export async function updateMember(
  actorId: string,
  userId: string,
  input: MemberUpdateInput,
): Promise<Result> {
  const validated = validateMemberUpdate(input);
  if (!validated.ok) return validated;
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertAdmin(tx, actorId);
        const user = await mutableTarget(tx, actorId, userId);
        const aliasChanged =
          user.alias.normalizedAlias !== validated.value.normalizedAlias;
        let nextAliasId = user.aliasId;
        if (aliasChanged && user.alias.isReserved) {
          const replacement = await tx.aliasIdentity.create({
            data: {
              displayAlias: validated.value.alias,
              normalizedAlias: validated.value.normalizedAlias,
            },
            select: { id: true },
          });
          nextAliasId = replacement.id;
          await tx.aliasIdentity.update({
            where: { id: user.aliasId },
            data: { claimRequestedAt: null },
          });
        } else if (
          aliasChanged ||
          user.alias.displayAlias !== validated.value.alias
        ) {
          await tx.aliasIdentity.update({
            where: { id: user.aliasId },
            data: {
              displayAlias: validated.value.alias,
              normalizedAlias: validated.value.normalizedAlias,
            },
          });
        }
        await tx.user.update({
          where: { id: userId },
          data: {
            name: validated.value.name,
            email: validated.value.email,
            normalizedEmail: validated.value.normalizedEmail,
            aliasId: nextAliasId,
          },
        });
        await tx.auditEntry.create({
          data: {
            action: "USER_UPDATED",
            actorId,
            subjectType: "User",
            subjectId: userId,
            metadata: {
              changedFields: [
                user.name !== validated.value.name && "name",
                user.email !== validated.value.email && "email",
                aliasChanged && "alias",
              ].filter(Boolean),
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { ok: true };
  } catch (error) {
    return handled(error);
  }
}

export async function setMemberBlocked(
  actorId: string,
  userId: string,
  blocked: boolean,
): Promise<Result> {
  try {
    await getPrisma().$transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await mutableTarget(tx, actorId, userId);
      await tx.user.update({
        where: { id: userId },
        data: { isBlocked: blocked, blockedAt: blocked ? new Date() : null },
      });
      if (blocked) await tx.session.deleteMany({ where: { userId } });
      await tx.auditEntry.create({
        data: {
          action: blocked ? "USER_BLOCKED" : "USER_UNBLOCKED",
          actorId,
          subjectType: "User",
          subjectId: userId,
          metadata: { sessionsRevoked: blocked },
        },
      });
    });
    return { ok: true };
  } catch (error) {
    return handled(error);
  }
}

export async function resetMemberPassword(
  actorId: string,
  userId: string,
  password: string,
): Promise<Result> {
  const error = validatePassword(password);
  if (error) return { ok: false, message: error };
  const passwordHash = await hashPassword(password);
  try {
    await getPrisma().$transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await mutableTarget(tx, actorId, userId);
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.auditEntry.create({
        data: {
          action: "PASSWORD_RESET",
          actorId,
          subjectType: "User",
          subjectId: userId,
          metadata: { sessionsRevoked: true },
        },
      });
    });
    return { ok: true };
  } catch (caught) {
    return handled(caught);
  }
}

export async function deleteMember(
  actorId: string,
  userId: string,
): Promise<Result> {
  try {
    await getPrisma().$transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      const user = await mutableTarget(tx, actorId, userId);
      await tx.auditEntry.create({
        data: {
          action: "USER_DELETED",
          actorId,
          subjectType: "User",
          subjectId: userId,
          metadata: { liveDataRemoved: true },
        },
      });
      await tx.eventOrganizer.deleteMany({ where: { aliasId: user.aliasId } });
      await tx.user.delete({ where: { id: userId } });
      await tx.aliasIdentity.delete({ where: { id: user.aliasId } });
    });
    return { ok: true };
  } catch (error) {
    return handled(error);
  }
}

export async function addManualParticipation(
  actorId: string,
  eventId: string,
  userId: string,
): Promise<Result> {
  try {
    await getPrisma().$transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      const [event, user] = await Promise.all([
        tx.event.findFirst({
          where: { id: eventId, season: { isActive: true, archivedAt: null } },
          select: { id: true, organizers: { select: { aliasId: true } } },
        }),
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, aliasId: true, isBlocked: true },
        }),
      ]);
      if (!event)
        throw new MemberConflictError(
          "Das Event gehört nicht zu einer aktiven Saison.",
        );
      if (!user || user.isBlocked)
        throw new MemberConflictError(
          "Dieses Konto kann nicht als Teilnehmer hinzugefügt werden.",
        );
      if (event.organizers.some((item) => item.aliasId === user.aliasId))
        throw new MemberConflictError(
          "Ein Veranstalter kann nicht zusätzlich als Teilnehmer gewertet werden.",
        );
      const participation = await tx.eventParticipation.create({
        data: { eventId, userId, source: "MANUAL" },
        select: { id: true },
      });
      await tx.auditEntry.create({
        data: {
          action: "PARTICIPATION_ADDED_MANUALLY",
          actorId,
          subjectType: "EventParticipation",
          subjectId: participation.id,
          metadata: { eventId, userId },
        },
      });
    });
    return { ok: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { ok: false, message: "Diese Teilnahme ist bereits erfasst." };
    return handled(error);
  }
}

export async function removeParticipation(
  actorId: string,
  participationId: string,
): Promise<Result> {
  try {
    await getPrisma().$transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      const participation = await tx.eventParticipation.findFirst({
        where: {
          id: participationId,
          event: { season: { isActive: true, archivedAt: null } },
        },
        select: { id: true, eventId: true, userId: true },
      });
      if (!participation)
        throw new MemberConflictError(
          "Die Teilnahme gehört nicht zu einer aktiven Saison oder existiert nicht mehr.",
        );
      await tx.eventParticipation.delete({ where: { id: participation.id } });
      await tx.auditEntry.create({
        data: {
          action: "PARTICIPATION_DELETED",
          actorId,
          subjectType: "EventParticipation",
          subjectId: participation.id,
          metadata: {
            eventId: participation.eventId,
            userId: participation.userId,
          },
        },
      });
    });
    return { ok: true };
  } catch (error) {
    return handled(error);
  }
}
