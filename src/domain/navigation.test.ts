import { describe, expect, it } from "vitest";
import { isNavigationActive } from "./navigation";

describe("Navigationszustände", () => {
  it("markiert Startseite und verschachtelte Bereiche korrekt", () => {
    expect(isNavigationActive("/", "/")).toBe(true);
    expect(isNavigationActive("/anmelden", "/")).toBe(false);
    expect(isNavigationActive("/admin/events/neu", "/admin/events")).toBe(true);
  });
  it("markiert Sprunglinks nicht fälschlich auf anderen Seiten", () => {
    expect(isNavigationActive("/anmelden", "/#archiv")).toBe(false);
  });
});
