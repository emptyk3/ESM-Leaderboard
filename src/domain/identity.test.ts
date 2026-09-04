import { describe, expect, it } from "vitest";
import { normalizeAlias, normalizeEmail, validateAlias } from "./identity";

describe("Aliasregeln", () => {
  it("normalisiert Schreibweise, Unicode-Kompatibilitätszeichen und Randabstände", () => {
    expect(normalizeAlias("  ＭÄX_42  ")).toBe("mäx_42");
  });

  it("akzeptiert internationale Buchstaben und die erlaubten Trennzeichen", () => {
    expect(validateAlias("Éowyn 玩家-42_test")).toBeNull();
  });

  it.each(["Michi", "Äpfel", "João", "Alí_92", "ômega-player"])(
    "akzeptiert den gültigen Alias %s",
    (alias) => {
      expect(validateAlias(alias)).toBeNull();
    },
  );

  it.each([" ab", "ab ", "ab", "abc!", "   "])(
    "weist den ungültigen Alias %j zurück",
    (alias) => {
      expect(validateAlias(alias)).not.toBeNull();
    },
  );

  it("normalisiert E-Mail-Adressen für eindeutige Anmeldung", () => {
    expect(normalizeEmail("  USER@Example.AT ")).toBe("user@example.at");
  });
});
