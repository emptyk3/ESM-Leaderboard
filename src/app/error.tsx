"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page-shell">
      <section className="card" role="alert">
        <p className="eyebrow">Unerwarteter Fehler</p>
        <h1>Das hat leider nicht funktioniert</h1>
        <p>
          Bitte versuche es erneut. Wenn der Fehler bestehen bleibt, informiere
          die zuständige Vereinsperson mit Zeitpunkt und betroffener Seite.
        </p>
        <button type="button" onClick={reset}>
          Erneut versuchen
        </button>
      </section>
    </main>
  );
}
