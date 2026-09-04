import { describe, expect, it } from "vitest";
import { mayManageMember, validateMemberUpdate } from "./member-management";

describe("Mitgliederverwaltung", () => {
  it("normalisiert Unicode-Alias und E-Mail wie die Registrierung", () => {
    expect(
      validateMemberUpdate({
        name: "  Mária  ",
        alias: "Ähre_7",
        email: " Test@Example.AT ",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Mária",
        alias: "Ähre_7",
        email: "Test@Example.AT",
        normalizedAlias: "ähre_7",
        normalizedEmail: "test@example.at",
      },
    });
  });
  it("weist ungültige Korrekturen zurück", () => {
    expect(
      validateMemberUpdate({ name: "", alias: "x", email: "falsch" }).ok,
    ).toBe(false);
  });
  it("schützt den einzigen Hauptadmin", () => {
    const actor = { id: "admin", isMainAdmin: true, isBlocked: false };
    expect(mayManageMember(actor, { id: "member", isMainAdmin: false })).toBe(
      true,
    );
    expect(mayManageMember(actor, { id: "admin", isMainAdmin: true })).toBe(
      false,
    );
    expect(
      mayManageMember(
        { ...actor, isBlocked: true },
        { id: "member", isMainAdmin: false },
      ),
    ).toBe(false);
  });
});
