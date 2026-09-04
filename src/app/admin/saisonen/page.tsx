import { redirect } from "next/navigation";
import { CloseSeasonForm, InitialSeasonForm } from "@/components/season-forms";
import { mayManageSeasons } from "@/domain/season-management";
import { formatViennaDate } from "@/domain/vienna-date";
import {
  getActiveLeaderboard,
  getSeasonOverview,
} from "@/server/season-service";
import { getRequiredUser } from "@/server/session-cookie";

export const dynamic = "force-dynamic";

export default async function SeasonAdminPage() {
  const user = await getRequiredUser();
  if (!mayManageSeasons(user)) redirect("/konto");
  const [seasons, leaderboard] = await Promise.all([
    getSeasonOverview(),
    getActiveLeaderboard(),
  ]);
  const active = seasons.find((season) => season.isActive);
  return (
    <main className="page-shell admin-page">
      <section className="card wide-card">
        <p className="eyebrow">Hauptadmin</p>
        <h1>Saisonverwaltung</h1>
        {seasons.length === 0 ? (
          <>
            <p>
              Lege das erste Vereinsjahr mit frei gewähltem Beginn und Ende an.
            </p>
            <InitialSeasonForm />
          </>
        ) : (
          <>
            <div className="season-list">
              <h2>Übersicht</h2>
              <ul>
                {seasons.map((season) => (
                  <li key={season.id}>
                    <strong>{season.name}</strong>
                    <span>
                      {formatViennaDate(season.startsAt)} –{" "}
                      {formatViennaDate(season.endsAt)}
                    </span>
                    <span>
                      {season.isActive ? "Aktiv" : "Archiviert"} ·{" "}
                      {season._count.events} Events
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {active ? (
              <CloseSeasonForm
                active={{
                  id: active.id,
                  name: active.name,
                  period: `${formatViennaDate(active.startsAt)} – ${formatViennaDate(active.endsAt)}`,
                  eventCount: active._count.events,
                  memberCount: leaderboard?.entries.length ?? 0,
                }}
              />
            ) : (
              <p className="empty-state">
                Es gibt keine aktive Saison. Bitte prüfe den Datenbestand.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
