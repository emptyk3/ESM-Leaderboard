import type { Metadata } from "next";
import { PublicEventGroup } from "@/components/public-events";
import { groupPublicEvents } from "@/domain/public-events";
import { getPublicEvents } from "@/server/public-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Events · eSports Mostviertel",
  description:
    "Laufende, kommende und vergangene Events der aktiven Vereinssaison.",
};

export default async function EventsPage() {
  const grouped = groupPublicEvents(await getPublicEvents());
  return (
    <main className="public-page">
      <header>
        <p className="eyebrow">Aktuelle Saison</p>
        <h1>Events</h1>
        <p>Alle öffentlichen Events von eSports Mostviertel.</p>
      </header>
      <PublicEventGroup
        title="Laufende"
        status="Laufend"
        events={grouped.running}
      />
      <PublicEventGroup
        title="Kommende"
        status="Kommend"
        events={grouped.upcoming}
      />
      <PublicEventGroup
        title="Vergangene"
        status="Vergangen"
        events={grouped.past}
      />
    </main>
  );
}
