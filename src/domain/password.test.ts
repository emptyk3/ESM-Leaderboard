import { describe, expect, it } from "vitest";
import { validatePassword, validateProductionAdminPassword } from "./password";

describe("Passwortregeln", () => {
  it("akzeptiert die nachvollziehbare Mindestlänge", () => {
    expect(validatePassword("1234567890")).toBeNull();
  });
  it("weist zu kurze und übermäßig lange Eingaben zurück", () => {
    expect(validatePassword("123456789")).not.toBeNull();
    expect(validatePassword("x".repeat(257))).not.toBeNull();
  });
  it("fordert für den Produktionsadmin eine stärkere Konfiguration", () => {
    expect(
      validateProductionAdminPassword("administrator-123456"),
    ).not.toBeNull();
    expect(validateProductionAdminPassword("K5!vQ2-zL9#rT7")).toBeNull();
  });
});
