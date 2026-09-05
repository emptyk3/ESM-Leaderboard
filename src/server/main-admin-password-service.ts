import "server-only";
import { Prisma } from "../../generated/prisma/client";
import { validatePasswordChange } from "../domain/password-change";
import { getPrisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";
import {
  clearRateLimit,
  isRateLimited,
  recordFailedAttempt,
} from "./rate-limit-service";

const GENERIC_CONFIRMATION_ERROR =
  "Das aktuelle Passwort ist nicht korrekt oder die Aktion ist vorübergehend nicht verfügbar.";

type Result =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function changeOwnMainAdminPassword(input: {
  userId: string;
  sessionId: string;
  fingerprint: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}): Promise<Result> {
  const fieldErrors = validatePasswordChange(input);
  if (fieldErrors)
    return {
      ok: false,
      message: "Bitte prüfe deine Eingaben.",
      fieldErrors,
    };
  if (await isRateLimited("LOGIN", input.fingerprint))
    return { ok: false, message: GENERIC_CONFIRMATION_ERROR };

  const changed = await getPrisma().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${input.userId} FOR UPDATE`;
      const [admin, session] = await Promise.all([
        tx.mainAdmin.findUnique({
          where: { userId: input.userId },
          select: {
            user: {
              select: {
                passwordHash: true,
                isApproved: true,
                isBlocked: true,
              },
            },
          },
        }),
        tx.session.findFirst({
          where: {
            id: input.sessionId,
            userId: input.userId,
            expiresAt: { gt: new Date() },
          },
          select: { id: true },
        }),
      ]);
      if (!admin || !session || !admin.user.isApproved || admin.user.isBlocked)
        return false;
      if (
        !(await verifyPassword(admin.user.passwordHash, input.currentPassword))
      )
        return false;

      const passwordHash = await hashPassword(input.newPassword);
      await tx.user.update({
        where: { id: input.userId },
        data: { passwordHash },
      });
      await tx.session.deleteMany({ where: { userId: input.userId } });
      await tx.auditEntry.create({
        data: {
          action: "PASSWORD_RESET",
          actorId: input.userId,
          subjectType: "User",
          subjectId: input.userId,
          metadata: { selfInitiated: true, sessionsRevoked: true },
        },
      });
      return true;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (!changed) {
    await recordFailedAttempt("LOGIN", input.fingerprint);
    return { ok: false, message: GENERIC_CONFIRMATION_ERROR };
  }
  await clearRateLimit("LOGIN", input.fingerprint);
  return { ok: true };
}
