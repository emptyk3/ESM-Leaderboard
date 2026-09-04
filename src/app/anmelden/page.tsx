import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/session-cookie";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/konto");
  return (
    <main className="page-shell">
      <section className="card">
        <h1>Anmelden</h1>
        <p>Melde dich mit deinem Alias oder deiner E-Mail-Adresse an.</p>
        <LoginForm />
      </section>
    </main>
  );
}
