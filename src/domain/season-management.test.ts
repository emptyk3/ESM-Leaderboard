import { describe, expect, it } from "vitest";
import {
  isExpectedActiveSeason,
  mayManageSeasons,
  validateSeasonInput,
} from "./season-management";

describe("Saisonverwaltung", () => {
  it("akzeptiert manuell gesetzte Vereinsjahresgrenzen", () => {
    const result = validateSeasonInput({
      name: "2026/27",
      startsOn: "2026-09-04",
      endsOn: "2027-08-28",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.startsAt.toISOString()).toBe(
        "2026-09-03T22:00:00.000Z",
      );
      expect(result.value.endsAt.toISOString()).toBe(
        "2027-08-28T21:59:59.999Z",
      );
    }
  });

  it("weist fehlerhafte Namen und Zeiträume zurück", () => {
    expect(
      validateSeasonInput({
        name: "2026/28",
        startsOn: "2026-01-01",
        endsOn: "2027-01-01",
      }).ok,
    ).toBe(false);
    expect(
      validateSeasonInput({
        name: "2026/27",
        startsOn: "2027-01-01",
        endsOn: "2026-01-01",
      }).ok,
    ).toBe(false);
  });

  it("autorisiert ausschließlich ungesperrte Hauptadmins", () => {
    expect(mayManageSeasons({ isMainAdmin: true, isBlocked: false })).toBe(
      true,
    );
    expect(mayManageSeasons({ isMainAdmin: false, isBlocked: false })).toBe(
      false,
    );
    expect(mayManageSeasons({ isMainAdmin: true, isBlocked: true })).toBe(
      false,
    );
    expect(mayManageSeasons(null)).toBe(false);
  });

  it("weist einen doppelten Abschluss anhand der erwarteten aktiven Saison zurück", () => {
    const oldSeason = { id: "old", isActive: true, archivedAt: null };
    expect(isExpectedActiveSeason(oldSeason, "old")).toBe(true);
    expect(
      isExpectedActiveSeason(
        { id: "next", isActive: true, archivedAt: null },
        "old",
      ),
    ).toBe(false);
    expect(
      isExpectedActiveSeason(
        { ...oldSeason, isActive: false, archivedAt: new Date() },
        "old",
      ),
    ).toBe(false);
  });
});
