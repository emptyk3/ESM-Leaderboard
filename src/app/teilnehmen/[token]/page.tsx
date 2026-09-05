import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ParticipationForm } from "@/components/participation-form";
import { formatViennaDateTime } from "@/domain/vienna-date";
import { getScanEvent } from "@/server/participation-service";
import { getCurrentUser } from "@/server/session-cookie";
import { requestFingerprint } from "@/server/rate-limit-service";

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
  if (!user)
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
        {event.alreadyParticipating ? (
          <div className="scan-result info" role="status">
            <p>
              Teilnahme bereits erfasst. Es werden keine weiteren Punkte
              vergeben.
            </p>
          </div>
        ) : event.window === "BEFORE" ? (
          <div className="scan-result info">
            <p>
              Die Teilnahme ist ab {formatViennaDateTime(event.startsAt)}
              möglich.
            </p>
          </div>
        ) : event.window === "AFTER" ? (
          <div className="scan-result info">
            <p>Die Teilnahmefrist für dieses Event ist beendet.</p>
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
