export type PublicEventSummary = {
  publicId: string;
  title: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  participantPoints: number;
};

export function groupPublicEvents(
  events: PublicEventSummary[],
  now = new Date(),
) {
  return {
    running: events
      .filter((event) => event.startsAt <= now && event.endsAt >= now)
      .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime()),
    upcoming: events
      .filter((event) => event.startsAt > now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    past: events
      .filter((event) => event.endsAt < now)
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
  };
}
