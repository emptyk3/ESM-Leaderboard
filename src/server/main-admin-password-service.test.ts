import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  isRateLimited: vi.fn(async () => false),
  recordFailedAttempt: vi.fn(async () => ({})),
  clearRateLimit: vi.fn(async () => undefined),
}));

vi.mock("server-only", () => ({}));
vi.mock("./prisma", () => ({
  getPrisma: () => ({ $transaction: mocks.transaction }),
}));
vi.mock("./rate-limit-service", () => ({
  isRateLimited: mocks.isRateLimited,
  recordFailedAttempt: mocks.recordFailedAttempt,
  clearRateLimit: mocks.clearRateLimit,
}));

import { changeOwnMainAdminPassword } from "./main-admin-password-service";
import { hashPassword, verifyPassword } from "./password";

let oldPasswordHash = "";

const input = {
  userId: "admin",
  sessionId: "current-session",
  fingerprint: "opaque-request-fingerprint",
  currentPassword: "bisher",
  newPassword: "1234",
  newPasswordConfirmation: "1234",
};

function transactionState(options?: {
  admin?: boolean;
  approved?: boolean;
  blocked?: boolean;
  session?: boolean;
}) {
  const tx = {
    $queryRaw: vi.fn(async () => [{ id: "admin" }]),
    mainAdmin: {
      findUnique: vi.fn(async () =>
        options?.admin === false
          ? null
          : {
              user: {
                passwordHash: oldPasswordHash,
                isApproved: options?.approved ?? true,
                isBlocked: options?.blocked ?? false,
              },
            },
      ),
    },
    session: {
      findFirst: vi.fn(async () =>
        options?.session === false ? null : { id: "current-session" },
      ),
      deleteMany: vi.fn(async () => ({ count: 3 })),
    },
    user: { update: vi.fn(async () => ({})) },
    auditEntry: { create: vi.fn(async () => ({})) },
  };
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
  return tx;
}

describe("Service zur eigenen Hauptadmin-Passwortänderung", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    oldPasswordHash = await hashPassword("bisher");
  });

  it("ändert bei falschem aktuellem Passwort keine Daten und antwortet generisch", async () => {
    const tx = transactionState();
    const result = await changeOwnMainAdminPassword({
      ...input,
      currentPassword: "falsch",
    });
    expect(result).toEqual({
      ok: false,
      message: expect.stringContaining("nicht korrekt"),
    });
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.session.deleteMany).not.toHaveBeenCalled();
    expect(tx.auditEntry.create).not.toHaveBeenCalled();
    expect(mocks.recordFailedAttempt).toHaveBeenCalledWith(
      "LOGIN",
      input.fingerprint,
    );
  });

  it.each([
    [{ admin: false }, "gewöhnlicher Benutzer"],
    [{ approved: false }, "nicht freigegebener Hauptadmin"],
    [{ blocked: true }, "gesperrter Hauptadmin"],
    [{ session: false }, "ausgeloggter Hauptadmin"],
  ])("verweigert die Änderung für $1", async (...args) => {
    const options = args[0];
    const tx = transactionState(options);
    await expect(changeOwnMainAdminPassword(input)).resolves.toMatchObject({
      ok: false,
    });
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("ändert den Hash atomar, widerruft alle Sitzungen und auditiert ohne Secrets", async () => {
    const tx = transactionState();
    await expect(changeOwnMainAdminPassword(input)).resolves.toEqual({
      ok: true,
    });
    const update = (tx.user.update.mock.calls as unknown[][])[0]![0] as {
      data: { passwordHash: string };
    };
    expect(update).toMatchObject({ where: { id: "admin" } });
    expect(update.data.passwordHash).toMatch(/^\$argon2id\$/);
    await expect(
      verifyPassword(update.data.passwordHash, "1234"),
    ).resolves.toBe(true);
    await expect(
      verifyPassword(update.data.passwordHash, "bisher"),
    ).resolves.toBe(false);
    expect(tx.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "admin" },
    });
    const auditData = (tx.auditEntry.create.mock.calls as unknown[][])[0]![0];
    expect(auditData).toEqual({
      data: {
        action: "PASSWORD_RESET",
        actorId: "admin",
        subjectType: "User",
        subjectId: "admin",
        metadata: { selfInitiated: true, sessionsRevoked: true },
      },
    });
    expect(JSON.stringify(auditData)).not.toContain("1234");
    expect(JSON.stringify(auditData)).not.toContain("argon2");
    expect(mocks.clearRateLimit).toHaveBeenCalledWith(
      "LOGIN",
      input.fingerprint,
    );
  });

  it("weist drei Zeichen vor Datenbankzugriff zurück", async () => {
    await expect(
      changeOwnMainAdminPassword({
        ...input,
        newPassword: "123",
        newPasswordConfirmation: "123",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("gibt bei aktivem Limit dieselbe generische Antwort wie bei falscher Bestätigung", async () => {
    mocks.isRateLimited.mockResolvedValueOnce(true);
    const result = await changeOwnMainAdminPassword(input);
    expect(result).toEqual({
      ok: false,
      message: expect.stringContaining("nicht korrekt"),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
