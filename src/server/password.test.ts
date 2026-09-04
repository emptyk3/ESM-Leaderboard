import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Passworthashing", () => {
  it("speichert Argon2id statt Klartext und prüft korrekt", async () => {
    const password = "ein-langes-testpasswort";
    const encoded = await hashPassword(password);
    expect(encoded).toMatch(/^\$argon2id\$/);
    expect(encoded).not.toContain(password);
    await expect(verifyPassword(encoded, password)).resolves.toBe(true);
    await expect(verifyPassword(encoded, "falsch")).resolves.toBe(false);
  });

  it("behandelt fehlende oder beschädigte Hashes ohne Ausnahme", async () => {
    await expect(verifyPassword(null, "beliebig")).resolves.toBe(false);
    await expect(verifyPassword("kein-hash", "beliebig")).resolves.toBe(false);
  });
});
