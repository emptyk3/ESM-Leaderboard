import { readFileSync } from "node:fs";
import jsQR from "jsqr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { qrApplicationOrigin, qrRegistrationUrl } from "./participation";
import {
  registrationQrDataUrlFor,
  registrationQrPngFor,
} from "./registration-qr";

const read = (path: string) => readFileSync(path, "utf8");

describe("permanenter Registrierungs-QR-Code", () => {
  it("verwendet exakt die kanonische absolute Registrierungsadresse", () => {
    expect(
      qrRegistrationUrl(
        qrApplicationOrigin({ APP_URL: "https://esm.example/app" }),
      ),
    ).toBe("https://esm.example/registrieren");
    expect(
      qrRegistrationUrl(
        qrApplicationOrigin({ APP_URL: "https://verein.example" }),
      ),
    ).toBe("https://verein.example/registrieren");
  });

  it("erzeugt bei unveränderter Konfiguration denselben QR-Inhalt", async () => {
    const target = "https://esm.example/registrieren";
    expect(await registrationQrDataUrlFor(target)).toBe(
      await registrationQrDataUrlFor(target),
    );
  });

  it("bricht bei fehlender oder unsicherer Produktionsadresse sicher ab", () => {
    expect(() => qrApplicationOrigin({ NODE_ENV: "production" })).toThrow(
      "nicht konfiguriert",
    );
    expect(() =>
      qrApplicationOrigin({
        NODE_ENV: "production",
        APP_URL: "http://esm.example",
      }),
    ).toThrow("HTTPS");
    expect(() => qrApplicationOrigin({ APP_URL: "not a url" })).toThrow(
      "ungültig",
    );
  });

  it("erzeugt ein tatsächlich dekodierbares beschriftetes PNG", async () => {
    const target = "https://esm.example/registrieren";
    const png = await registrationQrPngFor(target);
    const { data, info } = await sharp(png)
      .extract({ left: 200, top: 350, width: 1200, height: 1200 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(
      jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data,
    ).toBe(target);
  });

  it("schützt alle Ausgaben serverseitig und legt sie öffentlich nicht offen", () => {
    const overview = read("src/app/veranstalter/events/page.tsx");
    const page = read("src/app/admin/qr/registrierung/page.tsx");
    const png = read("src/app/admin/qr/registrierung/png/route.ts");
    const service = read("src/server/registration-qr-service.ts");
    expect(overview).toContain("user.isMainAdmin");
    expect(page).toContain("getRequiredUser");
    expect(png).toContain("getRequiredUser");
    expect(service).toContain("!user.isMainAdmin");
    expect(page).toContain("Bei eSports Mostviertel registrieren");
    expect(page).toContain("<PrintButton />");
    expect(png).toContain('filename="esm-registrierung-qr.png"');
    for (const publicFile of [
      "src/components/site-nav.tsx",
      "src/server/public-service.ts",
      "src/app/layout.tsx",
    ]) {
      expect(read(publicFile)).not.toContain("/admin/qr/registrierung");
    }
  });

  it("belässt die öffentliche Registrierung erreichbar", () => {
    const page = read("src/app/registrieren/page.tsx");
    expect(page).toContain("RegistrationForm");
    expect(page).not.toContain("getRequiredUser");
  });
});
