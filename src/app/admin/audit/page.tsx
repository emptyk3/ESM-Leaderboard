import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_SUBJECT_LABELS,
  parseAuditPage,
} from "@/domain/audit";
import { formatViennaDateTime } from "@/domain/vienna-date";
import { getAuditLog } from "@/server/audit-service";
import { getRequiredUser } from "@/server/session-cookie";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Audit-Protokoll · eSports Mostviertel",
  robots: { index: false, follow: false },
};

type Params = {
  action?: string;
  subjectType?: string;
  from?: string;
  to?: string;
  page?: string;
};

function pageHref(params: Params, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, page: String(page) }))
    if (value) query.set(key, value);
  return `/admin/audit?${query}`;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const user = await getRequiredUser();
  if (!user?.isMainAdmin) redirect("/konto");
  const params = await searchParams;
  const log = await getAuditLog(user.id, {
    ...params,
    page: parseAuditPage(params.page),
  });
  return (
    <main className="page-shell admin-page">
      <section className="card wide-card audit-card">
        <p className="eyebrow">Hauptadmin</p>
        <h1>Audit-Protokoll</h1>
        <p>
          Kritische administrative Änderungen in zeitlich absteigender
          Reihenfolge.
        </p>
        <form className="audit-filters">
          <label>
            Aktion
            <select name="action" defaultValue={params.action ?? ""}>
              <option value="">Alle Aktionen</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Objektart
            <select name="subjectType" defaultValue={params.subjectType ?? ""}>
              <option value="">Alle Objektarten</option>
              {Object.entries(AUDIT_SUBJECT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Von
            <input type="date" name="from" defaultValue={params.from ?? ""} />
          </label>
          <label>
            Bis
            <input type="date" name="to" defaultValue={params.to ?? ""} />
          </label>
          <button>Filtern</button>
        </form>
        <p>{log.total} Einträge</p>
        {log.entries.length ? (
          <ol className="audit-list" start={(log.page - 1) * 25 + 1}>
            {log.entries.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.action}</strong>
                  <span>{formatViennaDateTime(entry.createdAt)}</span>
                </div>
                <p>{entry.description}</p>
                <small>
                  Handelndes Konto: {entry.actorAlias} · Objektart:{" "}
                  {entry.subject}
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <p>Für diese Filter wurden keine Einträge gefunden.</p>
        )}
        <nav className="audit-pagination" aria-label="Seitennavigation">
          {log.page > 1 && (
            <Link href={pageHref(params, log.page - 1)}>Neuere Einträge</Link>
          )}
          <span>
            Seite {log.page} von {log.totalPages}
          </span>
          {log.page < log.totalPages && (
            <Link href={pageHref(params, log.page + 1)}>Ältere Einträge</Link>
          )}
        </nav>
      </section>
    </main>
  );
}
