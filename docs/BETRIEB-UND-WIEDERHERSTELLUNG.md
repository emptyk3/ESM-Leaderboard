# Betrieb und Wiederherstellung

Diese Anleitung richtet sich an die zuständige Vereinsperson. Geheimnisse
werden ausschließlich in lokalen Umgebungsdateien oder Vercel gespeichert und
nie in Tickets, Screenshots, Logs oder Git kopiert.

## Konfiguration

| Variable                                                            | Wo benötigt                                       | Geheim                   | Zweck                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                      | lokal und Vercel Production                       | ja                       | Gepoolte Neon-Verbindung der laufenden Anwendung                                 |
| `DIRECT_URL`                                                        | lokal für Migrationen und Vercel Production-Build | ja                       | Direkte Neon-Verbindung für `prisma migrate deploy`                              |
| `APP_URL`                                                           | optional lokal/Production                         | nein                     | Kanonische HTTPS-Basis für QR-Links; Vercel nutzt sonst seine Production-URL     |
| `RATE_LIMIT_PEPPER`                                                 | empfohlen in Production                           | ja                       | Eigenständiger HMAC-Pepper; ohne Wert wird serverseitig `DATABASE_URL` verwendet |
| `INITIAL_ADMIN_NAME`                                                | nur einmal beim Bootstrap                         | personenbezogen          | Name des ersten Hauptadmins                                                      |
| `INITIAL_ADMIN_ALIAS`                                               | nur einmal beim Bootstrap                         | öffentlich nach Freigabe | Alias des ersten Hauptadmins                                                     |
| `INITIAL_ADMIN_EMAIL`                                               | nur einmal beim Bootstrap                         | personenbezogen          | E-Mail des ersten Hauptadmins                                                    |
| `INITIAL_ADMIN_PASSWORD`                                            | nur einmal beim Bootstrap                         | **ja**                   | Initialpasswort; nach Erfolg wieder entfernen                                    |
| `VERCEL_ENV`, `VERCEL`, `VERCEL_PROJECT_PRODUCTION_URL`, `NODE_ENV` | von Vercel/Next gesetzt                           | nein                     | Laufzeit-, Trust- und Deploymentkontext; nicht manuell erfinden                  |

Preview-Deployments erhalten keine Produktions-`DATABASE_URL` und führen keine
Migration aus. Production nutzt die gepoolte URL zur Laufzeit und die direkte
URL nur im Build. Fehlt `DIRECT_URL`, bricht ein Production-Build vor der
Anwendungsmigration mit einer verständlichen Meldung ab. Fehlt `DATABASE_URL`,
schlägt der erste Datenbankzugriff ohne Ausgabe des Werts fehl.

## Reguläres Deployment

1. Änderungen lokal prüfen: `npm run format:check`, `npm run lint`,
   `npm run typecheck`, `npm test`, `npm run prisma:validate`,
   `npm run prisma:generate`, `npm run build`.
2. Eine additive Migration lokal unter `prisma/migrations` erzeugen und prüfen.
3. Auf `main` pushen. Vercel führt in Production zuerst
   `prisma migrate deploy` über `DIRECT_URL` und danach `next build` aus.
4. Im Vercel-Deployment kontrollieren: Status **Ready**, Commit stimmt mit
   `origin/main` überein. Danach `/status`, `/`, `/events` und `/anmelden`
   aufrufen.

## Hauptadmin und Vereinsbetrieb

- Erstinstallation: die vier `INITIAL_ADMIN_*`-Variablen nur in einer sicheren
  lokalen Umgebung zusammen mit `DATABASE_URL` setzen und
  `npm run admin:bootstrap` ausführen. Das Kommando ist idempotent und verändert
  einen vorhandenen Hauptadmin nicht. Danach das Initialpasswort aus der
  Konfiguration entfernen.
- Saison: unter **Saisonen** zuerst das Vereinsjahr eröffnen. Ein Abschluss ist
  endgültig, erzeugt das unveränderliche Archiv und eröffnet die Folgesaison.
- Events: Zeitraum, Ort und Punkte prüfen, Veranstalter zuordnen und erst dann
  QR-Code öffnen. Vor Ort Beameransicht und Ausdruck mit einem normalen
  Mobilgerät testen.
- Mitglieder: offene Konten prüfen, Claims ausdrücklich bestätigen, Sperren und
  Passwort-Resets nur nach Identitätsprüfung durchführen.
- Audit: nach kritischen Änderungen das Audit-Protokoll kontrollieren.

## Fehlgeschlagenes Deployment

1. Im Vercel-Projekt unter **Deployments** den betroffenen Commit öffnen und
   **Build Logs** prüfen. Keine Verbindungszeichenfolge in ein Ticket kopieren.
2. Bei `DIRECT_URL`-/Prismafehlern in Vercel nur Existenz und Umgebung der
   Variable prüfen, danach im Neon-Dashboard Projektstatus und Verbindung
   kontrollieren.
3. Bei Laufzeitfehlern **Functions/Runtime Logs** nach Zeitpunkt und Route
   filtern. Personenbezogene Eingaben, Cookies und QR-Links nicht nachloggen.
4. Nutzer sehen absichtlich nur eine deutsche generische Fehlermeldung. Für die
   Eskalation genügen Zeitpunkt, Route, Deployment-Commit und sichtbarer Status.

`GET /status` liefert ausschließlich `{"status":"ok"}` und wird nicht
gecacht. Die Route prüft bewusst weder Datenbank noch Mitgliederbestand und
offenbart keine Version oder Konfiguration.

## Anwendungsrollback

In Vercel unter **Deployments** ein zuvor nachweislich funktionierendes
Deployment auswählen und erneut als Production bereitstellen. Das rollt nur den
Anwendungscode zurück. Bereits angewandte Datenbankmigrationen werden nicht
automatisch zurückgenommen; alte Anwendungsversionen dürfen daher nur gewählt
werden, wenn sie mit dem aktuellen Schema kompatibel sind. Destruktive
Down-Migrationen erfolgen niemals spontan in Produktion.

## Datenbankwiederherstellung

Vor einem Vorfall im Neon-Dashboard prüfen und dokumentieren, welche Branch-,
Restore- oder Point-in-Time-Funktion der **tatsächlich gebuchte Tarif** aktuell
anbietet. Diese Funktion wurde für das Konto nicht verifiziert und wird hier
nicht zugesichert.

Sicherer Ablauf, sofern der Tarif die benötigte Funktion anzeigt:

1. Schreibzugriffe stoppen, Zeitpunkt und betroffenes Deployment festhalten.
2. Niemals die Produktionsdatenbank überschreiben. Zuerst einen isolierten
   Wiederherstellungs-Branch beziehungsweise eine separate Datenbank erstellen.
3. Mit einer nur lokal gesetzten Verbindung `npx prisma migrate status` und
   stichprobenartig Saisonen, Events, Mitgliederzahl und Archive prüfen.
4. Erst nach Freigabe durch die technische Zuständigkeit die Vercel-Verbindung
   kontrolliert auf den verifizierten Stand umstellen und neu deployen.
5. Alte Ressourcen erst nach dokumentierter Abnahme und eindeutigem
   Zielabgleich entfernen.

Eine Kontolöschung entfernt Konto, Sitzungen, Live-Teilnahmen,
Veranstalterzuordnungen und daraus abgeleitete Live-Punkte. Bereits erzeugte
Saison-Snapshots sind unabhängige historische Dokumente; Datenbanktrigger
verhindern ihre nachträgliche Änderung oder Löschung.

## Cache-Regeln

- Leaderboard, öffentliche Events und Profile werden dynamisch aus der
  Datenbank gerendert und nach Mutationen gezielt revalidiert.
- Konto- und Adminseiten sind sitzungsabhängig und werden nicht öffentlich
  zwischengespeichert.
- Scan-, QR- und PNG-Routen senden `private, no-store`, `noindex` und
  `no-referrer`; Token dürfen nicht in externe Links oder Logs kopiert werden.

## Organisatorische Go-live-Punkte

- Vereinsvorstand: bestätigte Ziel-URLs für Impressum und Datenschutz liefern.
- Technische Zuständigkeit: Neon-Tarif und konkret verfügbare
  Wiederherstellungsdauer/-funktion im Dashboard dokumentieren.
- Hauptadmin: Initialisierung und einmalige Rollen-/QR-/Saison-Abnahme in einer
  isolierten Umgebung durchführen.
- Optional später: bestätigte Vereinsdomain konfigurieren. Die funktionierende
  `vercel.app`-Adresse bleibt bis dahin unverändert.
