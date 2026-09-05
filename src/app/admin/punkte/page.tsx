import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  CreateManualPointForm,
  ManualPointEntryForms,
} from "@/components/manual-point-forms";
import { formatSignedPoints } from "@/domain/manual-points";
import { formatViennaDateTime } from "@/domain/vienna-date";
import { getManualPointAdminData } from "@/server/manual-point-service";
import { getRequiredUser } from "@/server/session-cookie";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Manuelle Punkte",
  robots: { index: false, follow: false },
};
export default async function ManualPointsPage() {
  const user = await getRequiredUser();
  if (!user?.isMainAdmin) redirect("/konto");
  const data = await getManualPointAdminData(user.id);
  return (
    <main className="page-shell admin-page">
      <section className="card wide-card">
        <p className="eyebrow">Hauptadmin</p>
        <h1>Manuelle Punkte</h1>
        <p>
          Positive Anerkennungen und negative Korrekturen für die aktive Saison.
        </p>
        <CreateManualPointForm
          recipients={data.recipients}
          requestId={randomUUID()}
        />
        <section>
          <h2>Buchungen der aktiven Saison</h2>
          {data.entries.length ? (
            <div className="member-list">
              {data.entries.map((entry) => (
                <article className="member-card" key={entry.id}>
                  <div className="member-card-heading">
                    <h3>{entry.alias.displayAlias}</h3>
                    <strong>{formatSignedPoints(entry.points)} Punkte</strong>
                  </div>
                  <p>{entry.reason}</p>
                  <small>{formatViennaDateTime(entry.bookedAt)}</small>
                  <ManualPointEntryForms entry={entry} />
                </article>
              ))}
            </div>
          ) : (
            <p>Noch keine manuellen Punktebuchungen.</p>
          )}
        </section>
      </section>
    </main>
  );
}
