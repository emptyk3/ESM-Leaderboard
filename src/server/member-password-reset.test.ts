import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn(async () => "argon2-hash"),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./password", () => ({ hashPassword: mocks.hashPassword }));
vi.mock("./prisma", () => ({
  getPrisma: () => ({ $transaction: mocks.transaction }),
}));

import { resetMemberPassword } from "./member-service";

describe("administrativer Passwort-Reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        mainAdmin: {
          findUnique: vi.fn(async () => ({ user: { isBlocked: false } })),
        },
        user: {
          findUnique: vi.fn(async () => ({
            id: "member",
            aliasId: "alias",
            mainAdmin: null,
          })),
          update: vi.fn(async () => ({})),
        },
        session: { deleteMany: vi.fn(async () => ({})) },
        auditEntry: { create: vi.fn(async () => ({})) },
      }),
    );
  });

  it("lehnt drei Zeichen vor Hashing und Datenbankzugriff ab", async () => {
    await expect(
      resetMemberPassword("admin", "member", "123"),
    ).resolves.toEqual({
      ok: false,
      message: expect.stringContaining("mindestens 4 Zeichen"),
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("akzeptiert 1234 und übergibt es unverändert an Argon2id", async () => {
    await expect(
      resetMemberPassword("admin", "member", "1234"),
    ).resolves.toEqual({ ok: true });
    expect(mocks.hashPassword).toHaveBeenCalledWith("1234");
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});
