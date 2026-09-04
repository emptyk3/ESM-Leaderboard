import { ArchiveNavigation, Leaderboard } from "@/components/leaderboard";
import {
  getActiveLeaderboard,
  getArchivedLeaderboards,
} from "@/server/season-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [leaderboard, archives] = await Promise.all([
    getActiveLeaderboard(),
    getArchivedLeaderboards(),
  ]);
  return (
    <main className="leaderboard-page">
      {leaderboard ? (
        <Leaderboard data={leaderboard} />
      ) : (
        <section className="leaderboard-card empty-state">
          <p className="eyebrow">Aktuelle Saison</p>
          <h1>Noch keine aktive Saison</h1>
          <p>Das erste Vereinsjahr wurde noch nicht eröffnet.</p>
        </section>
      )}
      <ArchiveNavigation seasons={archives} />
    </main>
  );
}
