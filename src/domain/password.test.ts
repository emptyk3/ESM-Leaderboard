import { describe, expect, it } from "vitest";
import { passwordCharacterCount, validatePassword } from "./password";

describe("Passwortregeln", () => {
  it("lehnt drei Zeichen ab und akzeptiert genau vier Zeichen", () => {
    expect(validatePassword("123")).not.toBeNull();
    expect(validatePassword("1234")).toBeNull();
  });

  it("verlangt keine Zeichenklassen oder Komplexität", () => {
    expect(validatePassword("aaaa")).toBeNull();
    expect(validatePassword("passwort")).toBeNull();
    expect(validatePassword("    ")).toBeNull();
  });

  it("zählt sichtbare Unicode-Zeichen statt UTF-16-Codeeinheiten", () => {
    expect(passwordCharacterCount("😀😀😀")).toBe(3);
    expect(validatePassword("😀😀😀")).not.toBeNull();
    expect(validatePassword("😀😀😀😀")).toBeNull();
    expect(passwordCharacterCount("a\u0308a\u0308a\u0308")).toBe(3);
    expect(validatePassword("a\u0308a\u0308a\u0308")).not.toBeNull();
  });

  it("weist übermäßig lange Eingaben zurück", () => {
    expect(validatePassword("x".repeat(257))).not.toBeNull();
  });
});
