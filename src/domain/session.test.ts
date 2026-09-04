import { describe, expect, it } from "vitest";
import {
  canUseProtectedMemberAction,
  createSessionToken,
  hashSessionToken,
  sessionExpiry,
  shouldRefreshSession,
} from "./session";

describe("Sitzungssicherheit", () => {
  it("erzeugt unabhängige 256-Bit-Token und persistierbare Hashes", () => {
    const first = createSessionToken();
    const second = createSessionToken();
    expect(first).not.toBe(second);
    expect(Buffer.from(first, "base64url")).toHaveLength(32);
    expect(hashSessionToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(first)).not.toContain(first);
  });
  it("setzt die Laufzeit auf 180 Tage", () => {
    const now = new Date("2026-09-04T12:00:00Z");
    expect(sessionExpiry(now).toISOString()).toBe("2027-03-03T12:00:00.000Z");
  });
  it("verlängert erst nach einem sicheren Mindestintervall", () => {
    const now = new Date("2026-09-05T12:00:00Z");
    expect(shouldRefreshSession(new Date("2026-09-04T12:00:01Z"), now)).toBe(
      false,
    );
    expect(shouldRefreshSession(new Date("2026-09-04T12:00:00Z"), now)).toBe(
      true,
    );
  });
  it("verweigert gesperrten Konten geschützte Mitgliedsaktionen", () => {
    expect(canUseProtectedMemberAction({ isBlocked: true })).toBe(false);
    expect(canUseProtectedMemberAction({ isBlocked: false })).toBe(true);
  });
});
