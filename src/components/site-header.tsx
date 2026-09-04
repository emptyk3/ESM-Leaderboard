import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/server/session-cookie";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <Image
          src="/assets/esports-mostviertel-logo.webp"
          alt=""
          width={48}
          height={48}
        />
        <span>eSports Mostviertel</span>
      </Link>
      <nav aria-label="Hauptnavigation">
        <Link href="/events">Events</Link>
        {user ? (
          <>
            {user.isMainAdmin && (
              <>
                <Link href="/admin/events">Events</Link>
                <Link href="/admin/mitglieder">Mitglieder</Link>
                <Link href="/admin/saisonen">Saisonen</Link>
                <Link href="/admin/audit">Audit-Protokoll</Link>
              </>
            )}
            {(user.isMainAdmin || user.isApproved) && (
              <Link href="/veranstalter/events">QR-Codes</Link>
            )}
            <Link href="/konto">Konto</Link>
            <form action={logoutAction}>
              <button className="link-button">Abmelden</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/anmelden">Anmelden</Link>
            <Link href="/registrieren">Registrieren</Link>
          </>
        )}
      </nav>
    </header>
  );
}
