import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const service = readFileSync("src/server/public-service.ts", "utf8");
const eventPage = readFileSync("src/app/events/[eventId]/page.tsx", "utf8");
const profilePage = readFileSync("src/app/profil/[publicId]/page.tsx", "utf8");

describe("öffentliche Datengrenzen", () => {
  it("liefert Eventübersichten und Details über explizite Projektionen ohne Secrets", () => {
    expect(service).toContain("select:");
    expect(service).not.toContain("participationToken");
    expect(service).not.toContain("organizerPoints");
    expect(eventPage).not.toMatch(/qr|token|participationToken/i);
  });
  it("liefert Profilen keine personenbezogenen Konto- oder Sitzungsfelder", () => {
    expect(service).not.toMatch(/\bemail\b/i);
    expect(service).not.toMatch(/\bname:\s*true/);
    expect(service).not.toContain("passwordHash");
    expect(service).not.toContain("sessions");
    expect(profilePage).not.toMatch(
      /email|isBlocked|isApproved|session|admin/i,
    );
  });
  it("verlinkt Leaderboard und Veranstalter über stabile öffentliche IDs", () => {
    expect(readFileSync("src/components/leaderboard.tsx", "utf8")).toContain(
      "/profil/${entry.profileId}",
    );
    expect(eventPage).toContain("/profil/${item.alias.publicId}");
  });
  it("nutzt für Archivprofile ausschließlich eingefrorene Snapshotwerte", () => {
    expect(service).toContain("seasonSnapshotEntry.findMany");
    expect(service).toContain("aliasPublicId");
    expect(profilePage).toContain("historische Eventaufschlüsselung");
  });
  it("erlaubt freigegebene, gesperrt sichtbare und reservierte Identitäten, aber keine offenen normalen Konten", () => {
    expect(service).toContain("{ isReserved: true }");
    expect(service).toContain("isApproved: true, mainAdmin: null");
    expect(service).not.toContain("isBlocked:");
  });
  it("liefert neutrale 404-Zustände", () => {
    expect(eventPage).toContain("notFound()");
    expect(profilePage).toContain("notFound()");
  });
  it("schließt Hauptadminprofile einschließlich Archivansichten serverseitig aus", () => {
    expect(service).toContain("isMainAdminProfile(publicId)");
    expect(service.match(/await isMainAdminProfile\(publicId\)/g)).toHaveLength(
      3,
    );
    expect(service).toContain("mainAdmin: null");
  });
});
