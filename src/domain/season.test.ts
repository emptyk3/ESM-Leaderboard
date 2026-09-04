import { describe, expect, it } from "vitest";
import { isValidSeasonName, seasonNameFor } from "./season";

describe("Saisonbezeichnungen", () => {
  it.each([
    [2026, "2026/27"],
    [2099, "2099/00"],
  ] as const)("bildet %i korrekt ab", (year, expected) => {
    expect(seasonNameFor(year)).toBe(expected);
    expect(isValidSeasonName(expected)).toBe(true);
  });

  it.each(["2026-27", "26/27", "2026/28", "2026/7"])(
    "weist %s zurück",
    (name) => {
      expect(isValidSeasonName(name)).toBe(false);
    },
  );
});
