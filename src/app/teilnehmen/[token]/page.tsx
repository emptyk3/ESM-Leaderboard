import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ParticipationForm } from "@/components/participation-form";
import { formatViennaDateTime } from "@/domain/vienna-date";
import { getScanEvent } from "@/server/participation-service";
import { getCurrentUser } from "@/server/session-cookie";
import { requestFingerprint } from "@/server/rate-limit-service";
import {
  PARTICIPATION_AFTER_MESSAGE,
  PARTICIPATION_BEFORE_MESSAGE,
} from "@/domain/participation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Eventteilnahme",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function ScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();
  const event = await getScanEvent(token, user?.id, await requestFingerprint());
  if (!event)
    return (
      <main className="page-shell scan-page">
        <section className="card">
          <h1>Teilnahme-Link ungültig</h1>
          <p>Dieser Teilnahme-Link ist ungültig oder nicht mehr verfügbar.</p>
        </section>
      </main>
    );
  if (!user && event.window === "OPEN")
    redirect(
      `/anmelden?returnTo=${encodeURIComponent(`/teilnehmen/${token}`)}`,
    );
  return (
    <main className="page-shell scan-page">
      <section className="card">
        <p className="eyebrow">Eventteilnahme</p>
        <h1>{event.title}</h1>
        <p>{event.location}</p>
        <p>
          {formatViennaDateTime(event.startsAt)} –{" "}
          {formatViennaDateTime(event.endsAt)}
        </p>
        <p>
          <strong>{event.participantPoints} Punkte</strong> für deine Teilnahme
        </p>
        {event.window === "BEFORE" ? (
          <div className="scan-result info" role="status">
            <p>{PARTICIPATION_BEFORE_MESSAGE}</p>
          </div>
        ) : event.window === "AFTER" ? (
          <div className="scan-result info" role="status">
            <p>{PARTICIPATION_AFTER_MESSAGE}</p>
          </div>
        ) : event.alreadyParticipating ? (
          <div className="scan-result info" role="status">
            <p>
              Teilnahme bereits erfasst. Es werden keine weiteren Punkte
              vergeben.
            </p>
          </div>
        ) : (
          <>
            <p>Bestätige jetzt ausdrücklich deine Teilnahme.</p>
            <ParticipationForm token={token} />
          </>
        )}
      </section>
    </main>
  );
}
