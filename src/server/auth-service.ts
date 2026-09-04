import "server-only";
import { Prisma } from "../../generated/prisma/client";
import {
  validateRegistration,
  type RegistrationInput,
} from "@/domain/auth-validation";
import { parseLoginIdentifier } from "@/domain/login";
import {
  createSessionToken,
  hashSessionToken,
  sessionExpiry,
} from "@/domain/session";
import { getPrisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  alias: string;
  isApproved: boolean;
  isBlocked: boolean;
  isMainAdmin: boolean;
};

export type RegistrationResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string>; message?: string };

class DuplicateIdentityError extends Error {}

export async function registerUser(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const validated = validateRegistration(input);
  if (!validated.ok) return { ok: false, fieldErrors: validated.errors };
  const value = validated.value;
  const passwordHash = await hashPassword(value.password);
  try {
    await getPrisma().$transaction(async (tx) => {
      const reserved = await tx.aliasIdentity.findUnique({
        where: { normalizedAlias: value.normalizedAlias },
        select: { id: true, isReserved: true, user: { select: { id: true } } },
      });
      if (reserved && (!reserved.isReserved || reserved.user)) {
        throw new DuplicateIdentityError();
      }
      await tx.user.create({
        data: {
          name: value.name,
          email: value.email,
          normalizedEmail: value.normalizedEmail,
          passwordHash,
          isApproved: false,
          isBlocked: false,
          alias: reserved
            ? { connect: { id: reserved.id } }
            : {
                create: {
                  displayAlias: value.alias,
                  normalizedAlias: value.normalizedAlias,
                },
              },
        },
      });
      if (reserved) {
        await tx.aliasIdentity.update({
          where: { id: reserved.id },
          data: { claimRequestedAt: new Date() },
        });
      }
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof DuplicateIdentityError)
      return {
        ok: false,
        message: "Alias oder E-Mail-Adresse kann nicht verwendet werden.",
      };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "Alias oder E-Mail-Adresse kann nicht verwendet werden.",
      };
    }
    throw error;
  }
}

export async function loginUser(
  identifier: string,
  password: string,
): Promise<
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; reason: "INVALID" | "BLOCKED" }
> {
  const parsed = parseLoginIdentifier(identifier);
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where:
      parsed.kind === "email"
        ? { normalizedEmail: parsed.normalized }
        : { alias: { normalizedAlias: parsed.normalized } },
    select: { id: true, passwordHash: true, isBlocked: true },
  });
  const passwordMatches = await verifyPassword(
    user?.passwordHash ?? null,
    password,
  );
  if (!user || !passwordMatches) return { ok: false, reason: "INVALID" };
  if (user.isBlocked) return { ok: false, reason: "BLOCKED" };

  const token = createSessionToken();
  const expiresAt = sessionExpiry();
  await prisma.session.create({
    data: { userId: user.id, tokenHash: hashSessionToken(token), expiresAt },
  });
  return { ok: true, token, expiresAt };
}

export async function findSession(token: string): Promise<{
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date;
  user: SafeUser;
} | null> {
  const tokenHash = hashSessionToken(token);
  const session = await getPrisma().session.findUnique({
    where: { tokenHash },
    include: { user: { include: { alias: true, mainAdmin: true } } },
  });
  if (!session || session.expiresAt <= new Date() || session.user.isBlocked)
    return null;
  return {
    sessionId: session.id,
    tokenHash,
    expiresAt: session.expiresAt,
    lastUsedAt: session.lastUsedAt,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      alias: session.user.alias.displayAlias,
      isApproved: session.user.isApproved,
      isBlocked: session.user.isBlocked,
      isMainAdmin: session.user.mainAdmin !== null,
    },
  };
}

export async function refreshSession(sessionId: string, tokenHash: string) {
  const expiresAt = sessionExpiry();
  const updated = await getPrisma().session.updateMany({
    where: {
      id: sessionId,
      tokenHash,
      expiresAt: { gt: new Date() },
      user: { isBlocked: false },
    },
    data: { expiresAt, lastUsedAt: new Date() },
  });
  return updated.count === 1 ? { expiresAt } : null;
}

export async function revokeSession(token: string): Promise<void> {
  await getPrisma().session.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}

export async function updateOwnAlias(
  userId: string,
  alias: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { validateAlias, normalizeAlias } = await import("@/domain/identity");
  const error = validateAlias(alias);
  if (error) return { ok: false, message: error };
  const current = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { isBlocked: true, alias: { select: { isReserved: true } } },
  });
  if (!current || current.isBlocked)
    return {
      ok: false,
      message: "Diese Aktion ist für das Konto nicht verfügbar.",
    };
  if (current.alias.isReserved)
    return {
      ok: false,
      message:
        "Der reservierte Alias wartet auf die Freigabe durch den Hauptadmin.",
    };
  try {
    await getPrisma().user.update({
      where: { id: userId, isBlocked: false },
      data: {
        alias: {
          update: {
            displayAlias: alias.normalize("NFKC"),
            normalizedAlias: normalizeAlias(alias),
          },
        },
      },
    });
    return { ok: true };
  } catch (caught) {
    if (
      caught instanceof Prisma.PrismaClientKnownRequestError &&
      caught.code === "P2002"
    ) {
      return { ok: false, message: "Dieser Alias ist bereits vergeben." };
    }
    if (
      caught instanceof Prisma.PrismaClientKnownRequestError &&
      caught.code === "P2025"
    ) {
      return {
        ok: false,
        message: "Diese Aktion ist für das Konto nicht verfügbar.",
      };
    }
    throw caught;
  }
}
