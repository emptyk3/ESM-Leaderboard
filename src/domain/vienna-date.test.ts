import { describe, expect, it } from "vitest";
import { viennaEndOfDay, viennaStartOfDay } from "./vienna-date";

describe("Vereinsjahresgrenzen in Europe/Vienna", () => {
  it("setzt frei gewählte Winter- und Sommerdaten auf lokale Tagesgrenzen", () => {
    expect(viennaStartOfDay("2026-01-15").toISOString()).toBe(
      "2026-01-14T23:00:00.000Z",
    );
    expect(viennaStartOfDay("2026-07-15").toISOString()).toBe(
      "2026-07-14T22:00:00.000Z",
    );
    expect(viennaEndOfDay("2026-07-15").toISOString()).toBe(
      "2026-07-15T21:59:59.999Z",
    );
  });

  it("berücksichtigt 23- und 25-Stunden-Tage bei der Zeitumstellung", () => {
    const spring =
      viennaEndOfDay("2026-03-29").getTime() -
      viennaStartOfDay("2026-03-29").getTime() +
      1;
    const autumn =
      viennaEndOfDay("2026-10-25").getTime() -
      viennaStartOfDay("2026-10-25").getTime() +
      1;
    expect(spring).toBe(23 * 60 * 60 * 1000);
    expect(autumn).toBe(25 * 60 * 60 * 1000);
  });
});
