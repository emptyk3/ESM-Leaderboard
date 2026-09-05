import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Betriebsgrenzen", () => {
  it("liefert nur einen minimalen, ungecachten Status", () => {
    const route = read("src/app/status/route.ts");
    expect(route).toContain('{ status: "ok" }');
    expect(route).toContain('"Cache-Control": "no-store, max-age=0"');
    expect(route).not.toMatch(/database|version|secret|user|member/i);
  });

  it("zeigt unerwartete Fehler und unbekannte Seiten ohne Interna auf Deutsch", () => {
    const error = read("src/app/error.tsx");
    const missing = read("src/app/not-found.tsx");
    expect(error).toContain("Das hat leider nicht funktioniert");
    expect(error).not.toMatch(/error\.message|stack|digest/);
    expect(missing).toContain("Diese Seite gibt es nicht");
  });

  it("trennt Produktionsmigration und Preview weiterhin", () => {
    const build = read("scripts/vercel-build.mjs");
    expect(build).toContain('VERCEL_ENV === "production"');
    expect(build).toContain("DIRECT_URL fehlt");
    expect(build).toContain("migrate");
    expect(build).toContain("deploy");
  });
});
