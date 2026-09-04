import Image from "next/image";

export default function Home() {
  return (
    <main className="home">
      <Image
        src="/assets/esports-mostviertel-logo.webp"
        alt="eSports Mostviertel"
        width={180}
        height={180}
        priority
      />
      <h1>eSports Mostviertel Leaderboard</h1>
      <p>
        Das öffentliche Leaderboard folgt im nächsten Umsetzungsschritt.
        Mitglieder können bereits ihr Konto einrichten.
      </p>
    </main>
  );
}
