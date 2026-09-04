import { redirect } from "next/navigation";
import {
  CreateEventForm,
  DeleteEventForm,
  EditEventForm,
  ReserveAliasForm,
} from "@/components/event-forms";
import { eventStatus } from "@/domain/event";
import { formatViennaDate, formatViennaDateTime } from "@/domain/vienna-date";
import { getEventAdminData } from "@/server/event-service";
import { getRequiredUser } from "@/server/session-cookie";

export const dynamic = "force-dynamic";

export default async function EventAdminPage() {
  const user = await getRequiredUser();
  if (!user?.isMainAdmin) redirect("/konto");
  const { season, events, aliases } = await getEventAdminData();
  return (
    <main className="page-shell admin-page">
      <section className="card event-admin-card">
        <p className="eyebrow">Hauptadmin</p>
        <h1>Eventverwaltung</h1>
        {!season ? (
          <p className="empty-state">
            Es gibt keine aktive Saison. Lege zuerst in der Saisonverwaltung
            eine Saison an.
          </p>
        ) : (
          <>
            <p>
              Aktive Saison <strong>{season.name}</strong> ·{" "}
              {formatViennaDate(season.startsAt)} –{" "}
              {formatViennaDate(season.endsAt)}
            </p>
            <details className="admin-panel">
              <summary>Neuen Veranstalter-Alias reservieren</summary>
              <ReserveAliasForm />
            </details>
            <details className="admin-panel" open>
              <summary>Neues Event anlegen</summary>
              <CreateEventForm aliases={aliases} />
            </details>
            <section className="event-list">
              <h2>Events der aktiven Saison</h2>
              {events.length === 0 ? (
                <p>Noch keine Events angelegt.</p>
              ) : (
                events.map((event) => (
                  <article className="event-card" key={event.id}>
                    <div className="event-summary">
                      <div>
                        <span className="status-badge">
                          {eventStatus(event)}
                        </span>
                        <h3>{event.title}</h3>
                        <p>
                          {formatViennaDateTime(event.startsAt)} –{" "}
                          {formatViennaDateTime(event.endsAt)} ·{" "}
                          {event.location}
                        </p>
                      </div>
                      <div className="point-summary">
                        <strong>{event.participantPoints}</strong>{" "}
                        Teilnehmerpunkte
                        <strong>
                          {event.organizers.length
                            ? (event.organizerPoints ?? 0)
                            : "–"}
                        </strong>{" "}
                        Veranstalterpunkte
                      </div>
                    </div>
                    <p>
                      <strong>Veranstalter:</strong>{" "}
                      {event.organizers.length
                        ? event.organizers
                            .map((item) => item.alias.displayAlias)
                            .join(", ")
                        : "keine"}
                    </p>
                    <details className="admin-panel">
                      <summary>Details bearbeiten</summary>
                      <EditEventForm aliases={aliases} event={event} />
                      <DeleteEventForm eventId={event.id} title={event.title} />
                    </details>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
