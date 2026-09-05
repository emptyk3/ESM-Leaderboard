import { readFileSync } from "node:fs";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { qrParticipationUrl } from "./participation";

const read = (path: string) => readFileSync(path, "utf8");

describe("QR- und Scan-Sicherheitsgrenzen", () => {
  it("rendert denselben stabilen Link wiederholt als identischen QR-Code", async () => {
    const url = qrParticipationUrl("https://esm.example", "x".repeat(43));
    const options = {
      width: 400,
      margin: 4,
      errorCorrectionLevel: "H" as const,
    };
    expect(await QRCode.toDataURL(url, options)).toBe(
      await QRCode.toDataURL(url, options),
    );
  });

  it("hält die öffentliche Eventauswahl tokenfrei", () => {
    const source = read("src/server/event-service.ts");
    const publicSelect = source.slice(
      source.indexOf("function publicEventSelect"),
      source.indexOf("export async function getEventAdminData"),
    );
    expect(publicSelect).not.toContain("participationToken");
  });

  it("hält die Vorlaufkonfiguration aus öffentlichen DTOs fern", () => {
    const publicService = read("src/server/public-service.ts");
    expect(publicService).not.toContain("earlyScanMinutes");
  });

  it("gibt die vorgezogene Zeit in geschützter Ansicht und PNG aus", () => {
    const page = read("src/app/events/[eventId]/qr/page.tsx");
    const service = read("src/server/participation-service.ts");
    expect(page).toContain("QR-Code scanbar ab");
    expect(service).toContain("QR-Code scanbar ab");
    expect(service).toContain("margin: 4");
  });

  it("trennt GET-Anzeige und bestätigte Mutation", () => {
    const scanPage = read("src/app/teilnehmen/[token]/page.tsx");
    const action = read("src/app/actions/participation.ts");
    expect(scanPage).not.toContain("recordQrParticipation");
    expect(action).toContain("recordQrParticipation");
    expect(action).toContain("getRequiredUser");
    expect(scanPage).toContain('event.window === "BEFORE"');
    expect(scanPage).toContain('event.window === "AFTER"');
    expect(scanPage).toContain("<ParticipationForm token={token} />");
  });

  it("prüft das Zeitfenster in der Transaktion erneut mit Serverzeit", () => {
    const service = read("src/server/participation-service.ts");
    const transaction = service.slice(
      service.indexOf("getPrisma().$transaction"),
    );
    expect(transaction).toContain("fixedNow ?? new Date()");
    expect(transaction.indexOf("fixedNow ?? new Date()")).toBeLessThan(
      transaction.indexOf("eventParticipation.create"),
    );
  });

  it("schützt QR-Seite und PNG serverseitig und verhindert Caching", () => {
    const page = read("src/app/events/[eventId]/qr/page.tsx");
    const png = read("src/app/events/[eventId]/qr/png/route.ts");
    const proxy = read("src/proxy.ts");
    expect(page).toContain("getRequiredUser");
    expect(page).toContain("getQrEvent");
    expect(png).toContain("getRequiredUser");
    expect(png).toContain("qrPngForEvent");
    expect(proxy).toContain('"Cache-Control", "private, no-store, max-age=0"');
    expect(proxy).toContain('"Referrer-Policy", "no-referrer"');
  });

  it("erzwingt die Eindeutigkeit paralleler Scans in PostgreSQL", () => {
    const migration = read(
      "prisma/migrations/20260904000000_initial/migration.sql",
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "EventParticipation_eventId_userId_key"',
    );
  });

  it("protokolliert weder QR-Token noch Teilnahme-Token im Audit", () => {
    const eventService = read("src/server/event-service.ts");
    const participationService = read("src/server/participation-service.ts");
    expect(eventService).not.toMatch(
      /metadata:[\s\S]{0,250}participationToken/,
    );
    expect(participationService).not.toContain("auditEntry");
  });
});
