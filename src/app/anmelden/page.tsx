import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/session-cookie";
import { safeScanReturnPath } from "@/domain/participation";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; passwort?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeScanReturnPath(params.returnTo ?? "");
  if (await getCurrentUser()) redirect(returnTo ?? "/konto");
  return (
    <main className="page-shell">
      <section className="card">
        <h1>Anmelden</h1>
        <p>Melde dich mit deinem Alias oder deiner E-Mail-Adresse an.</p>
        {params.passwort === "geaendert" && (
          <p className="form-message success" role="status">
            Dein Passwort wurde geändert. Bitte melde dich erneut an.
          </p>
        )}
        <LoginForm returnTo={returnTo ?? undefined} />
      </section>
    </main>
  );
}
