import { redirect } from "next/navigation";
import { AliasForm } from "@/components/auth-form";
import { getRequiredUser } from "@/server/session-cookie";

export default async function AccountPage() {
  const user = await getRequiredUser();
  if (!user) redirect("/anmelden");
  return (
    <main className="page-shell">
      <section className="card account-card">
        <h1>Mein Konto</h1>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>E-Mail-Adresse</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{user.isApproved ? "Freigegeben" : "Freigabe ausständig"}</dd>
          </div>
          {user.isMainAdmin && (
            <div>
              <dt>Rolle</dt>
              <dd>Hauptadmin</dd>
            </div>
          )}
        </dl>
        <p className="privacy-note">
          Name und E-Mail-Adresse können nur durch den Hauptadmin korrigiert
          werden.
        </p>
        <AliasForm currentAlias={user.alias} />
      </section>
    </main>
  );
}
