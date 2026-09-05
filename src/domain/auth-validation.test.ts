import { describe, expect, it } from "vitest";
import { validateRegistration } from "./auth-validation";

const registration = (password: string) =>
  validateRegistration({
    name: "Testmitglied",
    alias: "Testmitglied",
    email: "test@example.at",
    password,
  });

describe("Passwortvalidierung bei der Registrierung", () => {
  it("lehnt drei Zeichen ab und akzeptiert das einfache Passwort 1234", () => {
    expect(registration("123")).toMatchObject({
      ok: false,
      errors: { password: expect.stringContaining("mindestens 4 Zeichen") },
    });
    expect(registration("1234")).toMatchObject({ ok: true });
  });

  it("reicht das Passwort exakt und ohne Normalisierung weiter", () => {
    const password = " 12 ";
    const result = registration(password);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.value.password).toBe(password);
  });
});
