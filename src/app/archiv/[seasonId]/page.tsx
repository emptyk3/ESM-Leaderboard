import { notFound } from "next/navigation";
import { ArchiveNavigation, Leaderboard } from "@/components/leaderboard";
import {
  getArchivedLeaderboard,
  getArchivedLeaderboards,
} from "@/server/season-service";

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const [leaderboard, archives] = await Promise.all([
    getArchivedLeaderboard(seasonId),
    getArchivedLeaderboards(),
  ]);
  if (!leaderboard) notFound();
  return (
    <main className="leaderboard-page">
      <Leaderboard data={leaderboard} archived />
      <ArchiveNavigation seasons={archives} currentId={seasonId} />
    </main>
  );
}
