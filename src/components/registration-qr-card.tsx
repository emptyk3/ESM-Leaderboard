import Image from "next/image";
import Link from "next/link";

export function RegistrationQrCard({
  targetUrl,
  dataUrl,
}: {
  targetUrl: string;
  dataUrl: string;
}) {
  return (
    <section
      className="registration-qr-card"
      aria-labelledby="registration-qr-title"
    >
      <div>
        <p className="eyebrow">Dauerhafter QR-Code</p>
        <h2 id="registration-qr-title">Registrierung</h2>
        <p>
          Der Code führt direkt zur Registrierung bei eSports Mostviertel und
          ist dauerhaft verwendbar, solange die enthaltene Webadresse erreichbar
          bleibt.
        </p>
        <p>
          <strong>Zieladresse:</strong> <a href={targetUrl}>{targetUrl}</a>
        </p>
        <div className="qr-controls">
          <Link className="button-link" href="/admin/qr/registrierung">
            Großansicht öffnen
          </Link>
          <a
            className="button-link secondary"
            href="/admin/qr/registrierung/png"
            download="esm-registrierung-qr.png"
          >
            PNG herunterladen
          </a>
        </div>
      </div>
      <div className="registration-qr-preview">
        <Image
          src={dataUrl}
          alt="QR-Code zur Registrierung bei eSports Mostviertel"
          width={420}
          height={420}
          unoptimized
        />
      </div>
    </section>
  );
}
