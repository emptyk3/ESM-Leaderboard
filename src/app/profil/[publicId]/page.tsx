import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatViennaDate, formatViennaDateTime } from "@/domain/vienna-date";
import {
  getPublicArchivedProfile,
  getPublicProfile,
  getPublicProfileArchives,
} from "@/server/public-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Aliasprofil · eSports Mostviertel",
  description: "Öffentliches Saisonprofil eines Leaderboard-Alias.",
};

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ saison?: string }>;
}) {
  const { publicId } = await params;
  const selectedSeason = (await searchParams).saison;
  const [active, archives] = await Promise.all([
    getPublicProfile(publicId),
    getPublicProfileArchives(publicId),
  ]);
  const archived = selectedSeason
    ? await getPublicArchivedProfile(publicId, selectedSeason)
    : null;
  if (selectedSeason && !archived) notFound();
  if (!active && !archived && !archives.length) notFound();
  const shownArchive = archived ?? (!active ? archives[0] : null);
  const alias = shownArchive?.alias ?? active!.alias;
  return (
    <main className="public-page">
      <Link href="/">← Zum Leaderboard</Link>
      <header className="profile-heading">
        <p className="eyebrow">
          {shownArchive ? "Saisonarchiv" : "Aktuelle Saison"}
        </p>
        <h1>{alias}</h1>
        <div className="profile-score">
          <span>
            <strong>{shownArchive?.rank ?? active!.rank}</strong> Rang
          </span>
          <span>
            <strong>{shownArchive?.points ?? active!.points}</strong> Punkte
          </span>
        </div>
        {shownArchive && (
          <p>
            {shownArchive.snapshot.seasonName} ·{" "}
            {formatViennaDate(shownArchive.snapshot.startsAt)} –{" "}
            {formatViennaDate(shownArchive.snapshot.endsAt)}
          </p>
        )}
      </header>
      <nav className="profile-seasons" aria-label="Profilsaisonen">
        {active && (
          <Link
            href={`/profil/${publicId}`}
            aria-current={!shownArchive ? "page" : undefined}
          >
            Aktuell
          </Link>
        )}
        {archives.map((item) => (
          <Link
            key={item.snapshot.seasonId}
            href={`/profil/${publicId}?saison=${item.snapshot.seasonId}`}
            aria-current={
              shownArchive?.snapshot.seasonName === item.snapshot.seasonName
                ? "page"
                : undefined
            }
          >
            {item.snapshot.seasonName}
          </Link>
        ))}
      </nav>
      {shownArchive ? (
        <section>
          <h2>Archivierte Wertung</h2>
          <p>
            Für dieses unveränderliche Archiv sind Alias, Rang und Gesamtpunkte
            gespeichert. Eine vollständige historische Eventaufschlüsselung ist
            nicht verfügbar.
          </p>
        </section>
      ) : (
        <section>
          <h2>Gewertete Events</h2>
          {active!.events.length ? (
            <ul className="profile-events">
              {active!.events.map((event) => (
                <li key={event.publicId}>
                  <Link href={`/events/${event.publicId}`}>
                    <strong>{event.title}</strong>
                    <span>{formatViennaDateTime(event.startsAt)}</span>
                    <span>
                      {event.role}
                      {event.role === "Teilnehmer"
                        ? ` · ${event.participantPoints} Punkte`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>In der aktiven Saison sind noch keine Events gewertet.</p>
          )}
        </section>
      )}
    </main>
  );
}
