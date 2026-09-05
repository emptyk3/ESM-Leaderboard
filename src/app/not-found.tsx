import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="card">
        <p className="eyebrow">Seite nicht gefunden</p>
        <h1>Diese Seite gibt es nicht</h1>
        <p>Der Link ist möglicherweise veraltet oder unvollständig.</p>
        <Link className="button-link" href="/">
          Zum Leaderboard
        </Link>
      </section>
    </main>
  );
}
