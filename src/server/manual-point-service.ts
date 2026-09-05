import "server-only";
import { Prisma } from "../../generated/prisma/client";
import { validateManualPointInput } from "../domain/manual-points";
import { getPrisma } from "./prisma";

class ManualPointError extends Error {}
type Result =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function assertAdmin(tx: Prisma.TransactionClient, actorId: string) {
  const admin = await tx.mainAdmin.findUnique({
    where: { userId: actorId },
    select: { user: { select: { isBlocked: true } } },
  });
  if (!admin || admin.user.isBlocked)
    throw new ManualPointError("Kein Zugriff.");
}

async function activeSeason(tx: Prisma.TransactionClient) {
  const season = await tx.season.findFirst({
    where: { isActive: true, archivedAt: null },
    select: { id: true },
  });
  if (!season) throw new ManualPointError("Es gibt keine aktive Saison.");
  return season;
}

async function eligibleAlias(tx: Prisma.TransactionClient, aliasId: string) {
  const alias = await tx.aliasIdentity.findFirst({
    where: {
      id: aliasId,
      OR: [
        { isReserved: true },
        {
          isReserved: false,
          user: { is: { isApproved: true, mainAdmin: null } },
        },
      ],
    },
    select: { id: true },
  });
  if (!alias)
    throw new ManualPointError("Dieser Empfänger ist nicht zulässig.");
  return alias;
}

function handled(error: unknown): Result {
  if (error instanceof ManualPointError)
    return { ok: false, message: error.message };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return { ok: true };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  )
    return {
      ok: false,
      message:
        "Die Buchung wurde gleichzeitig verändert. Bitte erneut versuchen.",
    };
  throw error;
}

export async function getManualPointAdminData(actorId: string) {
  return getPrisma().$transaction(async (tx) => {
    await assertAdmin(tx, actorId);
    const season = await activeSeason(tx);
    const [recipients, entries] = await Promise.all([
      tx.aliasIdentity.findMany({
        where: {
          OR: [
            { isReserved: true },
            {
              isReserved: false,
              user: { is: { isApproved: true, mainAdmin: null } },
            },
          ],
        },
        select: {
          id: true,
          displayAlias: true,
          isReserved: true,
          user: { select: { isBlocked: true } },
        },
        orderBy: { normalizedAlias: "asc" },
      }),
      tx.manualPointEntry.findMany({
        where: { seasonId: season.id },
        select: {
          id: true,
          points: true,
          reason: true,
          bookedAt: true,
          alias: { select: { displayAlias: true } },
        },
        orderBy: [{ bookedAt: "desc" }, { id: "desc" }],
        take: 200,
      }),
    ]);
    return { seasonId: season.id, recipients, entries };
  });
}

export async function createManualPoint(
  actorId: string,
  input: { aliasId: string; points: string; reason: string; requestId: string },
): Promise<Result> {
  const validated = validateManualPointInput(input);
  if (!validated.ok)
    return {
      ok: false,
      message: "Bitte prüfe die Eingaben.",
      fieldErrors: validated.errors,
    };
  if (!/^[0-9a-f-]{36}$/i.test(input.requestId))
    return { ok: false, message: "Ungültige Übermittlung." };
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertAdmin(tx, actorId);
        const season = await activeSeason(tx);
        await eligibleAlias(tx, input.aliasId);
        const entry = await tx.manualPointEntry.create({
          data: {
            requestId: input.requestId,
            seasonId: season.id,
            aliasId: input.aliasId,
            ...validated.value,
          },
        });
        await tx.auditEntry.create({
          data: {
            action: "MANUAL_POINTS_CREATED",
            actorId,
            subjectType: "ManualPointEntry",
            subjectId: entry.id,
            metadata: {
              aliasId: input.aliasId,
              seasonId: season.id,
              points: validated.value.points,
              reason: validated.value.reason,
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

export async function updateManualPoint(
  actorId: string,
  entryId: string,
  input: { points: string; reason: string },
): Promise<Result> {
  const validated = validateManualPointInput(input);
  if (!validated.ok)
    return {
      ok: false,
      message: "Bitte prüfe die Eingaben.",
      fieldErrors: validated.errors,
    };
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertAdmin(tx, actorId);
        const season = await activeSeason(tx);
        const before = await tx.manualPointEntry.findFirst({
          where: { id: entryId, seasonId: season.id },
          select: { id: true, aliasId: true, points: true, reason: true },
        });
        if (!before)
          throw new ManualPointError("Die Buchung ist nicht mehr bearbeitbar.");
        await tx.manualPointEntry.update({
          where: { id: entryId },
          data: validated.value,
        });
        await tx.auditEntry.create({
          data: {
            action: "MANUAL_POINTS_UPDATED",
            actorId,
            subjectType: "ManualPointEntry",
            subjectId: entryId,
            metadata: {
              aliasId: before.aliasId,
              seasonId: season.id,
              before: { points: before.points, reason: before.reason },
              after: validated.value,
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

export async function deleteManualPoint(
  actorId: string,
  entryId: string,
): Promise<Result> {
  try {
    await getPrisma().$transaction(
      async (tx) => {
        await assertAdmin(tx, actorId);
        const season = await activeSeason(tx);
        const before = await tx.manualPointEntry.findFirst({
          where: { id: entryId, seasonId: season.id },
          select: { id: true, aliasId: true, points: true, reason: true },
        });
        if (!before)
          throw new ManualPointError("Die Buchung ist nicht mehr löschbar.");
        await tx.manualPointEntry.delete({ where: { id: entryId } });
        await tx.auditEntry.create({
          data: {
            action: "MANUAL_POINTS_DELETED",
            actorId,
            subjectType: "ManualPointEntry",
            subjectId: entryId,
            metadata: {
              aliasId: before.aliasId,
              seasonId: season.id,
              points: before.points,
              reason: before.reason,
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
