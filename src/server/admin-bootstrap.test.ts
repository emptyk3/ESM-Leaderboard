import { describe, expect, it, vi } from "vitest";
import {
  bootstrapMainAdmin,
  type AdminBootstrapRepository,
} from "./admin-bootstrap";

const validConfig = {
  name: "Hauptadmin",
  alias: "Admin_1",
  email: "admin@example.at",
  password: "sicher-genug-123",
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
      bootstrapMainAdmin(validConfig, repository, hash, false),
    ).resolves.toBe("created");
    await expect(
      bootstrapMainAdmin(validConfig, repository, hash, false),
    ).resolves.toBe("already-exists");
    expect(creations).toBe(1);
    expect(hash).toHaveBeenCalledTimes(1);
  });

  it("bricht bei unsicherer Produktionskonfiguration vor dem Hashen ab", async () => {
    const repository: AdminBootstrapRepository = {
      hasMainAdmin: async () => false,
      createMainAdmin: async () => "created",
    };
    const hash = vi.fn(async () => "hash");
    await expect(
      bootstrapMainAdmin(
        { ...validConfig, password: "1234567890" },
        repository,
        hash,
        true,
      ),
    ).rejects.toThrow(/Produktion/);
    expect(hash).not.toHaveBeenCalled();
  });

  it("behandelt einen konkurrierend angelegten Singleton als Erfolg", async () => {
    const repository: AdminBootstrapRepository = {
      hasMainAdmin: async () => false,
      createMainAdmin: async () => "already-exists",
    };
    await expect(
      bootstrapMainAdmin(validConfig, repository, async () => "hash", false),
    ).resolves.toBe("already-exists");
  });
});
