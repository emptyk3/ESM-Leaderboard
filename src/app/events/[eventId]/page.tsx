import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatViennaDateTime } from "@/domain/vienna-date";
import { getPublicEvent } from "@/server/public-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Event",
  description: "Öffentliche Eventdetails von eSports Mostviertel.",
};

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const event = await getPublicEvent((await params).eventId);
  if (!event) notFound();
  return (
    <main className="public-page">
      <Link href="/events">← Alle Events</Link>
      <article className="public-event-detail">
        <p className="eyebrow">Event</p>
        <h1>{event.title}</h1>
        <dl>
          <div>
            <dt>Ort</dt>
            <dd>{event.location}</dd>
          </div>
          <div>
            <dt>Beginn</dt>
            <dd>{formatViennaDateTime(event.startsAt)}</dd>
          </div>
          <div>
            <dt>Ende</dt>
            <dd>{formatViennaDateTime(event.endsAt)}</dd>
          </div>
          <div>
            <dt>Teilnehmerpunkte</dt>
            <dd>{event.participantPoints}</dd>
          </div>
        </dl>
        {event.description && (
          <section>
            <h2>Beschreibung</h2>
            <p>{event.description}</p>
          </section>
        )}
        <section>
          <h2>Veranstalter</h2>
          {event.organizers.length ? (
            <ul className="alias-links">
              {event.organizers.map((item) => (
                <li key={item.alias.publicId}>
                  <Link href={`/profil/${item.alias.publicId}`}>
                    {item.alias.displayAlias}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>Dieses Event hat keine designierten Veranstalter.</p>
          )}
        </section>
      </article>
    </main>
  );
}
