import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import {
  registrationQrDataUrl,
  RegistrationQrAuthorizationError,
} from "@/server/registration-qr-service";
import { getRequiredUser } from "@/server/session-cookie";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Registrierungs-QR-Code",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function RegistrationQrPage() {
  const user = await getRequiredUser();
  if (!user) redirect("/anmelden");
  let qr;
  try {
    qr = await registrationQrDataUrl(user);
  } catch (error) {
    if (error instanceof RegistrationQrAuthorizationError) notFound();
    throw error;
  }
  return (
    <main className="qr-presentation registration-qr-presentation">
      <header className="qr-heading">
        <Image
          src="/assets/esports-mostviertel-logo.webp"
          alt="eSports Mostviertel"
          width={88}
          height={88}
          priority
        />
        <div>
          <p className="eyebrow">Dauerhafter QR-Code</p>
          <h1>Bei eSports Mostviertel registrieren</h1>
          <p className="registration-target">{qr.targetUrl}</p>
        </div>
      </header>
      <div className="qr-image-wrap">
        <Image
          src={qr.dataUrl}
          alt="QR-Code zur Registrierung bei eSports Mostviertel"
          width={1200}
          height={1200}
          unoptimized
          priority
        />
      </div>
      <div className="qr-controls">
        <a
          className="button-link"
          href="/admin/qr/registrierung/png"
          download="esm-registrierung-qr.png"
        >
          PNG herunterladen
        </a>
        <PrintButton />
        <Link href="/veranstalter/events">Zur QR-Code-Übersicht</Link>
      </div>
    </main>
  );
}
