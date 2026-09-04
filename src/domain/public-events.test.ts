import { describe, expect, it } from "vitest";
import { groupPublicEvents, type PublicEventSummary } from "./public-events";

const event = (
  publicId: string,
  start: string,
  end: string,
): PublicEventSummary => ({
  publicId,
  title: publicId,
  location: "Mostviertel",
  startsAt: new Date(start),
  endsAt: new Date(end),
  participantPoints: 10,
});

describe("öffentliche Eventgruppierung", () => {
  it("gruppiert und sortiert laufend, kommend und vergangen mit Serverzeit", () => {
    const grouped = groupPublicEvents(
      [
        event("past-old", "2026-01-01T10:00Z", "2026-01-01T11:00Z"),
        event("future-late", "2026-01-03T12:00Z", "2026-01-03T13:00Z"),
        event("running-late", "2026-01-02T09:00Z", "2026-01-02T13:00Z"),
        event("past-new", "2026-01-01T12:00Z", "2026-01-01T13:00Z"),
        event("future-early", "2026-01-03T10:00Z", "2026-01-03T11:00Z"),
        event("running-early", "2026-01-02T10:00Z", "2026-01-02T12:00Z"),
      ],
      new Date("2026-01-02T11:00Z"),
    );
    expect(grouped.running.map((item) => item.publicId)).toEqual([
      "running-early",
      "running-late",
    ]);
    expect(grouped.upcoming.map((item) => item.publicId)).toEqual([
      "future-early",
      "future-late",
    ]);
    expect(grouped.past.map((item) => item.publicId)).toEqual([
      "past-new",
      "past-old",
    ]);
  });
});
