import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const service = readFileSync("src/server/member-service.ts", "utf8");

describe("Mitglieder-Servicegrenzen", () => {
  it("autorisiert persönliche Lese- und Schreibzugriffe serverseitig", () => {
    expect(
      service.match(/await assertAdmin\(tx, actorId\)/g)?.length,
    ).toBeGreaterThanOrEqual(8);
    expect(service).toContain(
      "Das Hauptadmin-Konto kann hier nicht verändert werden",
    );
  });
  it("bestätigt Claims atomar und beseitigt Rollenüberschneidungen", () => {
    expect(service).toContain("FOR UPDATE");
    expect(service).toContain("removedOverlapCount");
    expect(service).toContain("isReserved: false");
    expect(service).toContain('action: "ORGANIZER_ALIAS_CLAIMED"');
  });
  it("widerruft Sitzungen bei Sperre und Passwort-Reset", () => {
    expect(service.match(/session\.deleteMany/g)).toHaveLength(2);
    expect(service).toContain('action: "PASSWORD_RESET"');
  });
  it("protokolliert niemals Passwort oder Hash in Auditmetadaten", () => {
    expect(service).not.toMatch(/metadata:\s*\{[^}]*password/i);
    expect(service).not.toMatch(/metadata:\s*\{[^}]*hash/i);
  });
  it("löscht Live-Daten und lässt Snapshotwerte über SetNull bestehen", () => {
    expect(service).toContain("eventOrganizer.deleteMany");
    expect(service).toContain("user.delete");
    expect(service).toContain("aliasIdentity.delete");
    expect(readFileSync("prisma/schema.prisma", "utf8")).toContain(
      "onDelete: SetNull",
    );
  });
  it("begrenzt manuelle Änderungen auf aktive, nicht archivierte Saisonen", () => {
    expect(
      service.match(/season: \{ isActive: true, archivedAt: null \}/g)?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(service).toContain('source: "MANUAL"');
    expect(service).toContain("Diese Teilnahme ist bereits erfasst");
  });
});
