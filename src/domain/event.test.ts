import { describe, expect, it } from "vitest";
import {
  eventStatus,
  isWithinSeason,
  mayAccessEventQr,
  validateEventInput,
} from "./event";

const base = {
  title: "LAN-Abend",
  description: "",
  location: "Vereinsheim",
  startsAt: "2026-10-10T18:00",
  endsAt: "2026-10-10T23:00",
  participantPoints: "10",
  organizerPoints: "20",
  organizerAliasIds: [],
  earlyScanEnabled: "false",
  earlyScanMinutes: "",
};

describe("event validation", () => {
  it("parses Vienna summer and winter times as UTC instants", () => {
    const summer = validateEventInput(base);
    const winter = validateEventInput({
      ...base,
      startsAt: "2027-01-10T18:00",
      endsAt: "2027-01-10T23:00",
    });
    expect(summer.ok && summer.value.startsAt.toISOString()).toBe(
      "2026-10-10T16:00:00.000Z",
    );
    expect(winter.ok && winter.value.startsAt.toISOString()).toBe(
      "2027-01-10T17:00:00.000Z",
    );
  });
  it.each([
    [{ ...base, title: "" }, "Titel"],
    [{ ...base, location: "" }, "Ort"],
    [{ ...base, endsAt: base.startsAt }, "vor dem Ende"],
    [{ ...base, participantPoints: "-1" }, "nicht negative ganze Zahl"],
    [{ ...base, organizerPoints: "1.5" }, "nicht negative ganze Zahl"],
    [{ ...base, organizerAliasIds: ["a", "a"] }, "nur einmal"],
  ])("rejects invalid data", (input, message) => {
    const result = validateEventInput(input);
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        message: expect.stringContaining(message),
      }),
    );
  });
  it("supports zero, one and several organizers", () => {
    for (const organizerAliasIds of [[], ["one"], ["one", "two", "reserved"]]) {
      const result = validateEventInput({
        ...base,
        organizerAliasIds,
        organizerPoints: "",
      });
      expect(result.ok && result.value.organizerAliasIds).toEqual(
        organizerAliasIds,
      );
      expect(result.ok && result.value.organizerPoints).toBeNull();
    }
  });
  it("validiert eine optionale positive ganze Vorlaufzeit ohne fachliches Maximum", () => {
    expect(
      validateEventInput({
        ...base,
        earlyScanEnabled: "true",
        earlyScanMinutes: "10",
      }),
    ).toMatchObject({ ok: true, value: { earlyScanMinutes: 10 } });
    for (const earlyScanMinutes of ["", "0", "-1", "1.5", "x"]) {
      expect(
        validateEventInput({
          ...base,
          earlyScanEnabled: "true",
          earlyScanMinutes,
        }),
      ).toMatchObject({ ok: false });
    }
    expect(
      validateEventInput({
        ...base,
        earlyScanEnabled: "true",
        earlyScanMinutes: "2147483648",
      }),
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("technisch"),
    });
    expect(
      validateEventInput({
        ...base,
        earlyScanEnabled: "false",
        earlyScanMinutes: "10",
      }),
    ).toMatchObject({ ok: true, value: { earlyScanMinutes: null } });
  });
  it("checks exact season boundaries", () => {
    const event = validateEventInput(base);
    expect(
      event.ok &&
        isWithinSeason(event.value, {
          startsAt: new Date("2026-09-01T22:00:00Z"),
          endsAt: new Date("2027-09-01T21:59:59.999Z"),
        }),
    ).toBe(true);
    expect(
      event.ok &&
        isWithinSeason(event.value, {
          startsAt: new Date("2026-10-10T16:00:01Z"),
          endsAt: new Date("2027-09-01T21:59:59.999Z"),
        }),
    ).toBe(false);
  });
  it("derives status without persistence", () => {
    const event = {
      startsAt: new Date("2026-01-01T10:00Z"),
      endsAt: new Date("2026-01-01T12:00Z"),
    };
    expect(eventStatus(event, new Date("2026-01-01T09:00Z"))).toBe("Kommend");
    expect(eventStatus(event, new Date("2026-01-01T11:00Z"))).toBe("Laufend");
    expect(eventStatus(event, new Date("2026-01-01T13:00Z"))).toBe("Beendet");
  });
});

describe("prepared QR access", () => {
  const organizer = {
    id: "u1",
    isMainAdmin: false,
    isApproved: true,
    isBlocked: false,
  };
  it("allows only main admin or approved assigned organizer", () => {
    expect(mayAccessEventQr(organizer, ["u1"])).toBe(true);
    expect(
      mayAccessEventQr({ ...organizer, id: "admin", isMainAdmin: true }, []),
    ).toBe(true);
    expect(mayAccessEventQr({ ...organizer, isApproved: false }, ["u1"])).toBe(
      false,
    );
    expect(mayAccessEventQr({ ...organizer, isBlocked: true }, ["u1"])).toBe(
      false,
    );
    expect(mayAccessEventQr(organizer, ["other"])).toBe(false);
    expect(mayAccessEventQr(null, ["u1"])).toBe(false);
  });
});
