import { redirect } from "next/navigation";
import { RegistrationForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/session-cookie";

export const metadata = { title: "Registrieren" };

export default async function RegistrationPage() {
  if (await getCurrentUser()) redirect("/konto");
  return (
    <main className="page-shell">
      <section className="card">
        <h1>Registrieren</h1>
        <p>
          Dein Konto wird nach der Registrierung zunächst nicht öffentlich
          angezeigt.
        </p>
        <RegistrationForm />
      </section>
    </main>
  );
}
