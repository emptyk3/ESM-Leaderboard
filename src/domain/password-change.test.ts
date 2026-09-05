import { describe, expect, it } from "vitest";
import {
  mayChangeMainAdminPassword,
  validatePasswordChange,
} from "./password-change";

describe("Hauptadmin-Passwortänderung", () => {
  it.each([
    null,
    { isMainAdmin: false, isApproved: true, isBlocked: false },
    { isMainAdmin: true, isApproved: false, isBlocked: false },
    { isMainAdmin: true, isApproved: true, isBlocked: true },
  ])("verweigert unberechtigten Sitzungen den Zugriff", (user) => {
    expect(mayChangeMainAdminPassword(user)).toBe(false);
  });

  it("erlaubt ausschließlich den aktiven, freigegebenen Hauptadmin", () => {
    expect(
      mayChangeMainAdminPassword({
        isMainAdmin: true,
        isApproved: true,
        isBlocked: false,
      }),
    ).toBe(true);
  });

  it("lehnt drei Zeichen ab und akzeptiert den einfachen exakten Wert 1234", () => {
    expect(
      validatePasswordChange({
        currentPassword: "alt",
        newPassword: "123",
        newPasswordConfirmation: "123",
      }),
    ).toMatchObject({ newPassword: expect.stringContaining("4 Zeichen") });
    expect(
      validatePasswordChange({
        currentPassword: " alt ",
        newPassword: "1234",
        newPasswordConfirmation: "1234",
      }),
    ).toBeNull();
  });

  it("verlangt eine exakt übereinstimmende Wiederholung", () => {
    expect(
      validatePasswordChange({
        currentPassword: "alt",
        newPassword: "päss",
        newPasswordConfirmation: "Päss",
      }),
    ).toMatchObject({
      newPasswordConfirmation: expect.stringContaining("exakt übereinstimmen"),
    });
  });
});
