import Link from "next/link";
import { formatViennaDateTime } from "@/domain/vienna-date";
import type { PublicEventSummary } from "@/domain/public-events";

export function PublicEventGroup({
  title,
  status,
  events,
}: {
  title: string;
  status: string;
  events: PublicEventSummary[];
}) {
  return (
    <section className="public-event-group">
      <h2>{title}</h2>
      {events.length ? (
        <ul>
          {events.map((event) => (
            <li key={event.publicId}>
              <Link href={`/events/${event.publicId}`}>
                <strong>{event.title}</strong>
                <span>{event.location}</span>
                <span>
                  {formatViennaDateTime(event.startsAt)} –{" "}
                  {formatViennaDateTime(event.endsAt)}
                </span>
                <span>{event.participantPoints} Teilnehmerpunkte</span>
                <span className="status-badge">{status}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Keine {title.toLocaleLowerCase("de-AT")} Events.</p>
      )}
    </section>
  );
}
