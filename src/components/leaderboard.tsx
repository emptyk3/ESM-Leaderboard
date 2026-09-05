import Link from "next/link";
import type { PublicLeaderboard } from "@/server/season-service";
import { formatViennaDate } from "@/domain/vienna-date";

export function Leaderboard({
  data,
  archived = false,
}: {
  data: PublicLeaderboard;
  archived?: boolean;
}) {
  return (
    <section className="leaderboard-card" aria-labelledby="leaderboard-title">
      <div className="leaderboard-heading">
        <div>
          <p className="eyebrow">
            {archived ? "Saisonarchiv" : "Aktuelle Saison"}
          </p>
          <h1 id="leaderboard-title">Leaderboard {data.season.name}</h1>
        </div>
        <p>
          {formatViennaDate(data.season.startsAt)} –{" "}
          {formatViennaDate(data.season.endsAt)}
        </p>
      </div>
      {data.entries.length === 0 ? (
        <p className="empty-state">
          In dieser Saison sind noch keine Einträge sichtbar.
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Rangliste der Saison {data.season.name}
            </caption>
            <thead>
              <tr>
                <th scope="col">Rang</th>
                <th scope="col">Alias</th>
                <th scope="col">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr
                  key={`${entry.rank}-${entry.alias}`}
                  data-rank={entry.rank <= 3 ? entry.rank : undefined}
                >
                  <td className="rank">{entry.rank}</td>
                  <td>
                    {entry.profileId ? (
                      <Link
                        className="member-alias"
                        href={`/profil/${entry.profileId}`}
                      >
                        {entry.alias}
                      </Link>
                    ) : (
                      <span className="member-alias">{entry.alias}</span>
                    )}
                  </td>
                  <td className="points">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ArchiveNavigation({
  seasons,
  currentId,
}: {
  seasons: Array<{ id: string; name: string }>;
  currentId?: string;
}) {
  return (
    <nav id="archiv" className="archive-nav" aria-label="Saisonarchiv">
      <h2>Archiv</h2>
      {seasons.length === 0 ? (
        <p>Noch keine abgeschlossenen Saisonen.</p>
      ) : (
        <ul>
          {seasons.map((season) => (
            <li key={season.id}>
              <Link
                href={`/archiv/${season.id}`}
                aria-current={season.id === currentId ? "page" : undefined}
              >
                {season.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
