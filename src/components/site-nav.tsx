"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { isNavigationActive } from "@/domain/navigation";

type Viewer = { isMainAdmin: boolean; isApproved: boolean } | null;

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isNavigationActive(pathname, href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function SiteNav({ viewer }: { viewer: Viewer }) {
  const links = (
    <>
      <NavLink href="/">Leaderboard</NavLink>
      <NavLink href="/events">Events</NavLink>
      <NavLink href="/#archiv">Archiv</NavLink>
      {viewer ? (
        <>
          {viewer.isMainAdmin && (
            <span className="admin-nav-group" aria-label="Administration">
              <NavLink href="/admin/events">Eventverwaltung</NavLink>
              <NavLink href="/admin/mitglieder">Mitglieder</NavLink>
              <NavLink href="/admin/saisonen">Saisonen</NavLink>
              <NavLink href="/admin/audit">Audit</NavLink>
            </span>
          )}
          {(viewer.isMainAdmin || viewer.isApproved) && (
            <NavLink href="/veranstalter/events">QR-Codes</NavLink>
          )}
          <NavLink href="/konto">Konto</NavLink>
          <form action={logoutAction}>
            <button className="link-button">Abmelden</button>
          </form>
        </>
      ) : (
        <>
          <NavLink href="/anmelden">Anmelden</NavLink>
          <NavLink href="/registrieren">Registrieren</NavLink>
        </>
      )}
    </>
  );
  return (
    <nav aria-label="Hauptnavigation" className="site-nav">
      <div className="nav-links desktop-nav">{links}</div>
      <details className="nav-disclosure">
        <summary>Menü</summary>
        <div className="nav-links mobile-nav">{links}</div>
      </details>
    </nav>
  );
}
