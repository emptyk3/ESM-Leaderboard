import { describe, expect, it, vi } from "vitest";
import {
  bootstrapMainAdmin,
  type AdminBootstrapRepository,
} from "./admin-bootstrap";

const validConfig = {
  name: "Hauptadmin",
  alias: "Admin_1",
  email: "admin@example.at",
  password: "1234",
};

describe("Hauptadmin-Bootstrap", () => {
  it("legt genau einmal an und ist bei Wiederholung idempotent", async () => {
    let exists = false;
    let creations = 0;
    const repository: AdminBootstrapRepository = {
      hasMainAdmin: async () => exists,
      createMainAdmin: async () => {
        creations += 1;
        exists = true;
        return "created";
      },
    };
    const hash = vi.fn(async () => "argon2-hash");
    await expect(
      bootstrapMainAdmin(validConfig, repository, hash),
    ).resolves.toBe("created");
    await expect(
      bootstrapMainAdmin(validConfig, repository, hash),
    ).resolves.toBe("already-exists");
    expect(creations).toBe(1);
    expect(hash).toHaveBeenCalledTimes(1);
  });

  it("lehnt drei Zeichen auch in Produktion vor dem Hashen ab", async () => {
    const repository: AdminBootstrapRepository = {
      hasMainAdmin: async () => false,
      createMainAdmin: async () => "created",
    };
    const hash = vi.fn(async () => "hash");
    await expect(
      bootstrapMainAdmin({ ...validConfig, password: "123" }, repository, hash),
    ).rejects.toThrow(/mindestens 4 Zeichen/);
    expect(hash).not.toHaveBeenCalled();
  });

  it("akzeptiert ein einfaches Passwort mit vier Zeichen in Produktion unverändert", async () => {
    const repository: AdminBootstrapRepository = {
      hasMainAdmin: async () => false,
      createMainAdmin: async () => "created",
    };
    const hash = vi.fn(async () => "hash");
    await expect(
      bootstrapMainAdmin(validConfig, repository, hash),
    ).resolves.toBe("created");
    expect(hash).toHaveBeenCalledWith("1234");
  });

  it("behandelt einen konkurrierend angelegten Singleton als Erfolg", async () => {
    const repository: AdminBootstrapRepository = {
      hasMainAdmin: async () => false,
      createMainAdmin: async () => "already-exists",
    };
    await expect(
      bootstrapMainAdmin(validConfig, repository, async () => "hash"),
    ).resolves.toBe("already-exists");
  });
});
