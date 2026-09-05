import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { participationWindow, scanStartsAt } from "@/domain/participation";
import { formatViennaDateTime } from "@/domain/vienna-date";
import {
  getQrEvent,
  qrDataUrlForEvent,
  QrAuthorizationError,
} from "@/server/participation-service";
import { getRequiredUser } from "@/server/session-cookie";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Event-QR-Code",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function QrPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await getRequiredUser();
  if (!user) redirect("/anmelden");
  const { eventId } = await params;
  let loaded;
  try {
    loaded = await Promise.all([
      getQrEvent(eventId, user),
      qrDataUrlForEvent(eventId, user),
    ]);
  } catch (error) {
    if (error instanceof QrAuthorizationError) notFound();
    throw error;
  }
  const [event, qrDataUrl] = loaded;
  const window = participationWindow(event);
  return (
    <main className="qr-presentation">
      <header className="qr-heading">
        <Image
          src="/assets/esports-mostviertel-logo.webp"
          alt="eSports Mostviertel"
          width={88}
          height={88}
          priority
        />
        <div>
          <p className="eyebrow">Eventteilnahme</p>
          <h1>{event.title}</h1>
          <p>
            {formatViennaDateTime(event.startsAt)} –{" "}
            {formatViennaDateTime(event.endsAt)}
          </p>
          {event.earlyScanMinutes && (
            <p>
              <strong>
                QR-Code scanbar ab {formatViennaDateTime(scanStartsAt(event))}
              </strong>{" "}
              ({event.earlyScanMinutes} Minuten vor Eventbeginn)
            </p>
          )}
        </div>
      </header>
      <div className={`qr-window ${window.toLowerCase()}`}>
        {window === "OPEN"
          ? "Teilnahme ist jetzt möglich"
          : window === "BEFORE"
            ? `Teilnahme ab ${formatViennaDateTime(scanStartsAt(event))}`
            : "Teilnahmefrist beendet"}
      </div>
      <div className="qr-image-wrap">
        <Image
          src={qrDataUrl}
          alt="QR-Code für die Eventteilnahme"
          width={1200}
          height={1200}
          unoptimized
          priority
        />
      </div>
      <div className="qr-controls">
        <a
          className="button-link"
          href={`/events/${event.id}/qr/png`}
          download={`event-qr-${event.id}.png`}
        >
          PNG herunterladen
        </a>
        <PrintButton />
        <Link href="/veranstalter/events">Zur Eventübersicht</Link>
      </div>
    </main>
  );
}
