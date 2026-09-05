import Link from "next/link";
import { redirect } from "next/navigation";
import { eventStatus } from "@/domain/event";
import { formatViennaDateTime } from "@/domain/vienna-date";
import { scanStartsAt } from "@/domain/participation";
import { getManagedQrEvents } from "@/server/participation-service";
import { getRequiredUser } from "@/server/session-cookie";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event-QR-Codes" };

export default async function OrganizerEventsPage() {
  const user = await getRequiredUser();
  if (!user) redirect("/anmelden");
  const events = await getManagedQrEvents(user);
  return (
    <main className="page-shell admin-page">
      <section className="card wide-card">
        <p className="eyebrow">Geschützter Bereich</p>
        <h1>Meine Event-QR-Codes</h1>
        <p>
          QR-Codes können jederzeit vorbereitet werden. Teilnahmen sind nur im
          jeweiligen Eventzeitraum möglich.
        </p>
        {events.length ? (
          <ul className="managed-event-list">
            {events.map((event) => (
              <li key={event.id}>
                <div>
                  <span className="status-badge">{eventStatus(event)}</span>
                  <strong>{event.title}</strong>
                  <span>
                    {formatViennaDateTime(event.startsAt)} · {event.location}
                  </span>
                  {event.earlyScanMinutes && (
                    <span>
                      QR-Code scanbar ab{" "}
                      {formatViennaDateTime(scanStartsAt(event))} (
                      {event.earlyScanMinutes} Minuten vor Eventbeginn)
                    </span>
                  )}
                </div>
                <Link className="button-link" href={`/events/${event.id}/qr`}>
                  QR-Code öffnen
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">
            Dir sind keine Events mit QR-Zugriff zugewiesen.
          </p>
        )}
      </section>
    </main>
  );
}
