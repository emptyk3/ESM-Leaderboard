# eSports Mostviertel Leaderboard

Technische Grundlage für das Vereins-Leaderboard mit Next.js, React, TypeScript, Prisma und PostgreSQL. In diesem Schritt existiert bewusst nur eine minimale Startseite; Authentifizierung, Adminbereich und das eigentliche Leaderboard folgen später.

## Lokal starten

Voraussetzungen: Node.js 20.9 oder neuer, npm und eine PostgreSQL-Datenbank.

```powershell
npm install
Copy-Item .env.example .env
# DATABASE_URL in .env auf die lokale PostgreSQL-Datenbank setzen
npm run db:migrate
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar. Registrierung, Anmeldung und die Kontoseite sind unter `/registrieren`, `/anmelden` und `/konto` verfügbar. Alle fachlichen Zeitpunkte werden als PostgreSQL `timestamptz` gespeichert; Auswertung und Eingabe erfolgen später ausdrücklich in `Europe/Vienna`.

## Umgebungsvariablen

- `DATABASE_URL`: gepoolte PostgreSQL-Verbindung der laufenden Anwendung; bei Neon enthält der Host üblicherweise `-pooler`.
- `DIRECT_URL`: direkte, ungepoolte PostgreSQL-Verbindung ausschließlich für Prisma CLI und Migrationen.
- `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_ALIAS`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`: Konfiguration für den initialen Hauptadmin.

Echte Werte gehören ausschließlich in `.env` beziehungsweise `.env.local`; beide werden von Git ignoriert.

## Initialen Hauptadmin einrichten

Nach Migration der Datenbank werden die vier `INITIAL_ADMIN_*`-Werte ausschließlich lokal oder in der sicheren Laufzeitkonfiguration gesetzt. Danach:

```powershell
npm run admin:bootstrap
```

Das Kommando ist idempotent: Existiert bereits ein Hauptadmin, wird weder ein zweiter Admin noch ein weiteres Konto angelegt. Der Admin ist sofort freigegeben. Das Passwort muss mindestens 10 Zeichen lang sein; im Produktionsmodus gelten zusätzlich mindestens 14 Zeichen und eine Prüfung auf leicht erratbare Bestandteile. Passwörter werden nicht ausgegeben und ausschließlich als Argon2id-Hash gespeichert. Nach erfolgreicher Einrichtung sollte `INITIAL_ADMIN_PASSWORD` aus der lokalen Datei beziehungsweise Laufzeitkonfiguration entfernt werden.

## Authentifizierung und Sitzungen

Anmeldung ist über ein gemeinsames Alias-/E-Mail-Feld möglich. Neue Mitglieder bleiben bis zur späteren Adminfreigabe nicht öffentlich. Sitzungen verwenden ein zufälliges 256-Bit-Token im `HttpOnly`-Cookie (`SameSite=Lax`, in Produktion `Secure`); PostgreSQL erhält ausschließlich dessen SHA-256-Hash. Die widerrufbare Laufzeit beträgt 180 Tage. Bei aktiver Nutzung wird die Sitzung frühestens nach 24 Stunden atomar erneut auf 180 Tage verlängert. Gesperrte Konten werden bei jeder Sitzungsprüfung abgewiesen.

## Datenmodell

Normalisierte Aliasse leben zentral in `AliasIdentity`. Dadurch teilen Benutzer und reservierte Veranstalter-Aliasse denselben eindeutigen Namensraum, und ein reservierter Alias kann später ohne Umbau kontrolliert einem Konto zugeordnet werden. Punkte der laufenden Saison werden aus Events, Veranstalterzuordnungen und Teilnahmen berechnet; dadurch wirken Punktänderungen ohne redundante Punktdatensätze.

Beim Saisonabschluss werden Anzeigealias, Rang, Punkte und Eventdaten in eigene Snapshot-Tabellen kopiert. Datenbank-Trigger verhindern danach Änderungen und Löschungen dieser fachlichen Inhalte. Eine Benutzerlöschung entfernt per Kaskade Sitzungen und Live-Teilnahmen. Der spätere Löschdienst entfernt in derselben Transaktion außerdem dessen nicht archivierte Veranstalterzuordnungen und die Aliasidentität. Optionale Verknüpfungen aus Snapshots werden dabei auf `NULL` gesetzt, die eingefrorenen historischen Anzeige- und Punktwerte bleiben jedoch unverändert. Ein Archiv ist damit keine fortbestehende personenbezogene Live-Punktebuchung, sondern ein unabhängiges historisches Dokument.

`MainAdmin` ist eine Singleton-Zuordnung: Die Datenbank erlaubt durch einen konstanten Primärschlüssel höchstens eine Zeile und verhindert die Löschung des zugeordneten Benutzers. Der in Schritt 2 vorgesehene transaktionale Bootstrap stellt sicher, dass genau eine solche Zeile vorhanden ist. Eine partielle eindeutige Datenbankstruktur erlaubt außerdem höchstens eine aktive Saison.

## Prüfkommandos

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run prisma:validate
npm run prisma:generate
npm run build
```

Die erste Migration liegt unter `prisma/migrations/20260904000000_initial`. Sie wurde datenbankunabhängig aus dem validierten Schema erzeugt. `npm run db:migrate` wendet sie auf eine erreichbare PostgreSQL-Datenbank an.

## Saisonen und Leaderboard

Die Startseite zeigt ohne Anmeldung die aktive Vereinsjahres-Saison. Freigegebene Mitglieder werden einschließlich Null-Punkte-Mitgliedern angezeigt; gesperrte freigegebene Konten bleiben sichtbar. Die Punktzahl wird live aus Teilnehmer- und Veranstalterzuordnungen berechnet, Gleichstände verwenden Standard-Wettkampfränge (`1, 2, 2, 4`).

Der Hauptadmin verwaltet Saisonen unter `/admin/saisonen`. Datumsfelder werden als lokale Tagesgrenzen in `Europe/Vienna` interpretiert. Beim Abschluss entstehen Snapshot, archivierte Saison, aktive Folgesaison und Audit-Eintrag atomar in einer serialisierbaren Transaktion. Die erwartete aktive Saison-ID und die Datenbank-Constraints schützen vor Doppelaufrufen. Archivierte Ranglisten sind unter `/archiv/[seasonId]` öffentlich abrufbar und durch Datenbank-Trigger gegen inhaltliche Änderungen geschützt.

## Deployment

Das GitHub-Repository ist über die offizielle Git-Integration mit Vercel verbunden. Pushes auf den Produktionsbranch `main` lösen automatisch ein Production-Deployment aus. Die laufende Anwendung erhält in Vercel Production `DATABASE_URL` als gepoolte Neon-Verbindung. `DIRECT_URL` ist dort als direkte Verbindung für kontrollierte Prisma-Migrationsläufe hinterlegt. Der Vercel-Build führt `prisma migrate deploy` ausschließlich für Production aus und baut danach Next.js. Preview-Deployments überspringen Migrationen und erhalten vorerst keinen Zugriff auf die Produktionsdatenbank, solange keine verwaltete Neon-Preview-Verzweigung eingerichtet ist.
