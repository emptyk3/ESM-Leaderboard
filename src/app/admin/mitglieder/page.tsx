import { redirect } from "next/navigation";
import {
  ApprovalForm,
  MemberEditForm,
  MemberSecurityForms,
} from "@/components/member-admin-forms";
import { formatViennaDateTime } from "@/domain/vienna-date";
import { getMemberAdminData } from "@/server/member-service";
import { getRequiredUser } from "@/server/session-cookie";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getRequiredUser();
  if (!user?.isMainAdmin) redirect("/konto");
  const query = (await searchParams).q ?? "";
  const members = await getMemberAdminData(user.id, query);
  const pending = members.filter((member) => !member.isApproved);
  return (
    <main className="page-shell admin-page">
      <section className="card member-admin-card">
        <p className="eyebrow">Hauptadmin</p>
        <h1>Mitgliederverwaltung</h1>
        <form className="member-search">
          <label htmlFor="member-search">
            Suche nach Alias, Name oder E-Mail
          </label>
          <div>
            <input id="member-search" name="q" defaultValue={query} />
            <button>Suchen</button>
          </div>
        </form>
        <section>
          <h2>Offene Freigaben</h2>
          {pending.length ? (
            <div className="member-list">
              {pending.map((member) => {
                const credits = member.alias.organizerAssignments.reduce(
                  (sum, item) => sum + (item.event.organizerPoints ?? 0),
                  0,
                );
                return (
                  <article className="member-card" key={member.id}>
                    <h3>{member.alias.displayAlias}</h3>
                    <p>
                      {member.name} · {member.email}
                    </p>
                    <p>Registriert: {formatViennaDateTime(member.createdAt)}</p>
                    {member.alias.isReserved && (
                      <p className="claim-notice">
                        <strong>Reservierter Alias – Claim vorgemerkt.</strong>{" "}
                        Die Freigabe benötigt eine ausdrückliche
                        Claim-Bestätigung.
                      </p>
                    )}
                    <ApprovalForm
                      userId={member.id}
                      reserved={member.alias.isReserved}
                      assignmentCount={member.alias.organizerAssignments.length}
                      organizerPoints={credits}
                    />
                    {member.alias.isReserved && (
                      <details>
                        <summary>
                          Statt Claim einen anderen Alias vergeben
                        </summary>
                        <MemberEditForm member={member} />
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p>Keine offenen Freigaben.</p>
          )}
        </section>
        <section>
          <h2>Alle Mitglieder</h2>
          <div className="member-list">
            {members.map((member) => (
              <article className="member-card" key={member.id}>
                <div className="member-card-heading">
                  <div>
                    <h3>{member.alias.displayAlias}</h3>
                    <p>
                      {member.name} · {member.email}
                    </p>
                  </div>
                  <span className="status-badge">
                    {member.isBlocked
                      ? "Gesperrt"
                      : member.isApproved
                        ? "Freigegeben"
                        : "Offen"}
                  </span>
                </div>
                <p>
                  Registriert: {formatViennaDateTime(member.createdAt)} ·{" "}
                  {member._count.participations} Teilnahmen
                </p>
                {member.mainAdmin ? (
                  <p>
                    <strong>Geschütztes Hauptadmin-Konto</strong>
                  </p>
                ) : (
                  <details className="admin-panel">
                    <summary>Verwalten</summary>
                    <MemberEditForm member={member} />
                    <MemberSecurityForms
                      userId={member.id}
                      alias={member.alias.displayAlias}
                      blocked={member.isBlocked}
                    />
                  </details>
                )}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
