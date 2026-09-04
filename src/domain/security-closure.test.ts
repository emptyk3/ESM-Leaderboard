import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUDIT_ACTION_LABELS, auditDescription, parseAuditPage } from "./audit";
import {
  isRateLimitAllowed,
  rateLimitKey,
  RATE_LIMIT_POLICIES,
  windowExpiresAt,
} from "./rate-limit";

const read = (path: string) => readFileSync(path, "utf8");

describe("Audit-Protokoll", () => {
  it("sichert Route und Abfrage unabhängig auf den Hauptadmin ab", () => {
    const page = read("src/app/admin/audit/page.tsx");
    const service = read("src/server/audit-service.ts");
    expect(page).toContain("getRequiredUser");
    expect(page).toContain("!user?.isMainAdmin");
    expect(service).toContain("mainAdmin.findUnique");
    expect(service).toContain("AuditAuthorizationError");
  });
  it("paginiert und filtert serverseitig", () => {
    const service = read("src/server/audit-service.ts");
    expect(parseAuditPage("0")).toBe(1);
    expect(parseAuditPage("2")).toBe(2);
    expect(service).toContain("AUDIT_PAGE_SIZE = 25");
    expect(service).toContain("skip: (page - 1) * AUDIT_PAGE_SIZE");
    expect(service).toContain("take: AUDIT_PAGE_SIZE");
    expect(service).toContain("createdAt:");
    expect(service).toContain("subjectType");
  });
  it("gibt keine freien Metadaten oder internen Objekt-IDs aus", () => {
    const service = read("src/server/audit-service.ts");
    expect(service).not.toContain("metadata: true");
    expect(service).not.toContain("subjectId: true");
    for (const action of Object.keys(AUDIT_ACTION_LABELS))
      expect(
        auditDescription(action as keyof typeof AUDIT_ACTION_LABELS),
      ).not.toMatch(/hash|token|secret|verbindungsdaten/i);
  });
});

describe("verteilter Missbrauchsschutz", () => {
  it("trennt Zwecke und verbirgt Merkmale hinter einem HMAC", () => {
    const secret = "x".repeat(32);
    const fingerprint = "203.0.113.7";
    const login = rateLimitKey("LOGIN", fingerprint, secret);
    expect(login).not.toBe(rateLimitKey("INVALID_QR", fingerprint, secret));
    expect(login).toHaveLength(64);
    expect(login).not.toContain(fingerprint);
  });
  it("behandelt Grenzwert und Zeitfenster exakt", () => {
    const now = new Date("2026-09-04T12:00:00.000Z");
    const policy = RATE_LIMIT_POLICIES.LOGIN;
    expect(isRateLimitAllowed(policy.limit, policy.limit)).toBe(true);
    expect(isRateLimitAllowed(policy.limit + 1, policy.limit)).toBe(false);
    expect(windowExpiresAt(now, policy.windowMs).getTime()).toBe(
      now.getTime() + 15 * 60_000,
    );
    expect(RATE_LIMIT_POLICIES.INVALID_QR).not.toEqual(policy);
  });
  it("persistiert und erhöht parallele Versuche atomar", () => {
    const schema = read("prisma/schema.prisma");
    const service = read("src/server/rate-limit-service.ts");
    expect(schema).toContain("model RateLimitBucket");
    expect(service).toContain('ON CONFLICT ("key") DO UPDATE');
    expect(service).toContain('"RateLimitBucket"."attempts" + 1');
    expect(service).toContain("RETURNING");
    expect(service).toContain("deleteMany");
  });
});

describe("Sicherheitsabschluss", () => {
  it("verwendet generische Login- und QR-Fehler", () => {
    const auth = read("src/app/actions/auth.ts");
    const participation = read("src/app/actions/participation.ts");
    expect(auth).not.toContain("Dieses Konto ist gesperrt");
    expect(participation).toContain(
      "Die Teilnahme konnte nicht erfasst werden.",
    );
  });
  it("setzt alle geforderten Sicherheitsheader", () => {
    const config = read("next.config.ts");
    for (const header of [
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "X-Frame-Options",
      "Permissions-Policy",
    ])
      expect(config).toContain(header);
    expect(config).toContain("frame-ancestors 'none'");
    expect(config).toContain("form-action 'self'");
  });
  it("hält Sitzungscookies und Server Actions same-site", () => {
    const cookie = read("src/server/session-cookie.ts");
    const config = read("next.config.ts");
    expect(cookie).toContain('sameSite: "lax"');
    expect(cookie).toContain("httpOnly: true");
    expect(cookie).toContain('secure: process.env.NODE_ENV === "production"');
    expect(config).not.toContain("allowedOrigins");
  });
});
