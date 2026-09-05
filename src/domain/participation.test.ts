import { describe, expect, it } from "vitest";
import {
  decideParticipation,
  PARTICIPATION_AFTER_MESSAGE,
  PARTICIPATION_BEFORE_MESSAGE,
  participationWindow,
  qrApplicationOrigin,
  qrParticipationUrl,
  safeScanReturnPath,
} from "./participation";

describe("Teilnahmezeitraum", () => {
  const event = {
    startsAt: new Date("2026-06-10T16:00:00.000Z"),
    endsAt: new Date("2026-06-10T20:00:00.000Z"),
  };
  it("verwendet exakt das halboffene Fenster Beginn ≤ jetzt < Ende", () => {
    expect(
      participationWindow(event, new Date("2026-06-10T15:59:59.999Z")),
    ).toBe("BEFORE");
    expect(participationWindow(event, event.startsAt)).toBe("OPEN");
    expect(
      participationWindow(event, new Date("2026-06-10T19:59:59.999Z")),
    ).toBe("OPEN");
    expect(participationWindow(event, event.endsAt)).toBe("AFTER");
    expect(
      participationWindow(event, new Date("2026-06-10T20:00:00.001Z")),
    ).toBe("AFTER");
  });

  it("liefert die verbindlichen sichtbaren Meldungen exakt", () => {
    expect(PARTICIPATION_BEFORE_MESSAGE).toBe(
      "Das Event hat noch nicht begonnen. Versuche es später erneut.",
    );
    expect(PARTICIPATION_AFTER_MESSAGE).toBe(
      "Tut uns leid, das Event ist leider vorbei.",
    );
  });

  it("entscheidet an Wiener Sommer- und Winterzeitgrenzen anhand eindeutiger Serverinstants", () => {
    const summer = {
      startsAt: new Date("2026-03-29T01:00:00+01:00"),
      endsAt: new Date("2026-03-29T03:00:00+02:00"),
    };
    const winter = {
      startsAt: new Date("2026-10-25T02:00:00+02:00"),
      endsAt: new Date("2026-10-25T02:00:00+01:00"),
    };
    expect(participationWindow(summer, summer.startsAt)).toBe("OPEN");
    expect(participationWindow(summer, summer.endsAt)).toBe("AFTER");
    expect(
      participationWindow(winter, new Date("2026-10-25T02:30:00+02:00")),
    ).toBe("OPEN");
    expect(participationWindow(winter, winter.endsAt)).toBe("AFTER");
  });

  it("erlaubt freigegebene und noch nicht freigegebene aktive Konten", () => {
    const common = {
      isBlocked: false,
      isOrganizer: false,
      alreadyParticipating: false,
      seasonIsActive: true,
      seasonIsArchived: false,
      ...event,
      now: event.startsAt,
    };
    expect(decideParticipation(common)).toBe("ALLOW");
    // Freigabe ist absichtlich kein Eingabefaktor dieser Entscheidung.
    expect(decideParticipation({ ...common })).toBe("ALLOW");
  });

  it.each([
    [{ isBlocked: true }, "BLOCKED"],
    [{ isOrganizer: true }, "ORGANIZER"],
    [{ alreadyParticipating: true }, "ALREADY"],
    [{ now: new Date("2026-06-10T15:59:59.999Z") }, "BEFORE"],
    [{ now: new Date("2026-06-10T20:00:00.000Z") }, "AFTER"],
    [{ seasonIsActive: false }, "AFTER"],
    [{ seasonIsArchived: true }, "AFTER"],
  ])(
    "lehnt gesperrte, doppelte oder zeitlich ungültige Erfassung ab",
    (override, expected) => {
      expect(
        decideParticipation({
          isBlocked: false,
          isOrganizer: false,
          alreadyParticipating: false,
          seasonIsActive: true,
          seasonIsArchived: false,
          ...event,
          now: event.startsAt,
          ...override,
        }),
      ).toBe(expected);
    },
  );
});

describe("QR-URL und Login-Rückkehr", () => {
  const token = "a".repeat(43);
  it("erzeugt für dasselbe Event-Token immer dieselbe absolute HTTPS-URL", () => {
    const origin = qrApplicationOrigin({
      APP_URL: "https://esm.example/path",
      NODE_ENV: "production",
    });
    expect(qrParticipationUrl(origin, token)).toBe(
      `https://esm.example/teilnehmen/${token}`,
    );
    expect(qrParticipationUrl(origin, token)).toBe(
      qrParticipationUrl(origin, token),
    );
  });
  it("nutzt die stabile Vercel-Produktionsdomain ohne neue Pflichtvariable", () => {
    expect(
      qrApplicationOrigin({
        VERCEL_PROJECT_PRODUCTION_URL: "esm.example",
        NODE_ENV: "production",
      }),
    ).toBe("https://esm.example");
  });
  it.each([
    "https://evil.example/",
    "//evil.example/",
    "/konto",
    "/teilnehmen/kurz",
    `/teilnehmen/${token}?next=https://evil.example`,
    `/teilnehmen/${token}#fragment`,
    `/teilnehmen/${"a".repeat(129)}`,
  ])("lehnt unsichere Rücksprungziele ab: %s", (path) => {
    expect(safeScanReturnPath(path)).toBeNull();
  });
  it("erlaubt ausschließlich die interne kanonische Scanroute", () => {
    expect(safeScanReturnPath(`/teilnehmen/${token}`)).toBe(
      `/teilnehmen/${token}`,
    );
  });
});
