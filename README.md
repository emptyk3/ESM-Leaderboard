# eSports Mostviertel Leaderboard

Abschlussunterlagen:

- [MVP-Abnahmematrix](docs/MVP-ABNAHME.md)
- [Betrieb und Wiederherstellung](docs/BETRIEB-UND-WIEDERHERSTELLUNG.md)

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
- `APP_URL`: optionale kanonische Basisadresse für QR-Links, lokal etwa `http://localhost:3000`. In Vercel wird ohne diesen Wert automatisch die stabile Production-URL verwendet; Produktion erzwingt HTTPS.
- `RATE_LIMIT_PEPPER`: empfohlenes unabhängiges zufälliges Geheimnis mit mindestens 32 Zeichen für pseudonyme Rate-Limit-Schlüssel. Ohne diesen optionalen Wert dient die bereits geschützte, serverseitige `DATABASE_URL` als sicherer Fallback.
- `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_ALIAS`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`: Konfiguration für den initialen Hauptadmin.

Echte Werte gehören ausschließlich in `.env` beziehungsweise `.env.local`; beide werden von Git ignoriert.

## Initialen Hauptadmin einrichten

Nach Migration der Datenbank werden die vier `INITIAL_ADMIN_*`-Werte ausschließlich lokal oder in der sicheren Laufzeitkonfiguration gesetzt. Danach:

```powershell
npm run admin:bootstrap
```

Das Kommando ist idempotent: Existiert bereits ein Hauptadmin, wird weder ein zweiter Admin noch ein weiteres Konto angelegt. Der Admin ist sofort freigegeben. Das Passwort muss mindestens 4 Zeichen lang sein; weitere Komplexitätsanforderungen bestehen nicht. Passwörter werden nicht ausgegeben und ausschließlich als Argon2id-Hash gespeichert.

Im Vercel-Production-Build wird der Bootstrap nach den Migrationen automatisch ausgeführt, sobald alle vier `INITIAL_ADMIN_*`-Variablen gesetzt sind. Eine nur teilweise gesetzte Konfiguration bricht den Build ab. Nach der erfolgreichen Erstanlage können und sollen alle vier Bootstrap-Variablen gemeinsam aus Vercel entfernt werden; das bestehende Hauptadmin-Konto bleibt erhalten und spätere Deployments überspringen den Bootstrap.

## Authentifizierung und Sitzungen

Anmeldung ist über ein gemeinsames Alias-/E-Mail-Feld möglich. Neue Mitglieder bleiben bis zur späteren Adminfreigabe nicht öffentlich. Sitzungen verwenden ein zufälliges 256-Bit-Token im `HttpOnly`-Cookie (`SameSite=Lax`, in Produktion `Secure`); PostgreSQL erhält ausschließlich dessen SHA-256-Hash. Die widerrufbare Laufzeit beträgt 180 Tage. Bei aktiver Nutzung wird die Sitzung frühestens nach 24 Stunden atomar erneut auf 180 Tage verlängert. Gesperrte Konten werden bei jeder Sitzungsprüfung abgewiesen.

## Datenmodell

Manuelle Punkte sind eigenständige `ManualPointEntry`-Buchungen der aktiven
Saison. Zulässig sind ganze Werte von −100.000 bis +100.000 außer `0`; jede
Buchung benötigt eine öffentliche, auf 500 Zeichen begrenzte Begründung.
Leaderboard und öffentliche Profile leiten ihre Werte aus Event-,
Veranstalter- und manuellen Punkten ab. Beim Saisonabschluss werden Gesamtstand
und öffentliche Buchungsdetails unveränderlich archiviert. Eine eindeutige
Übermittlungs-UUID verhindert doppelte Anlage.

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

Die additive Migration `20260905000000_event_integrity_and_alias_claims`
ergänzt die Claim-Vormerkung für reservierte Veranstalter-Aliasse. Trigger
erzwingen zusätzlich Saisongrenzen, schützen archivierte Events und verhindern
eine gleichzeitige Teilnehmer- und Veranstalterwertung desselben Mitglieds.

## Saisonen und Leaderboard

Die Startseite zeigt ohne Anmeldung die aktive Vereinsjahres-Saison. Freigegebene Mitglieder werden einschließlich Null-Punkte-Mitgliedern angezeigt; gesperrte freigegebene Konten bleiben sichtbar. Die Punktzahl wird live aus Teilnehmer- und Veranstalterzuordnungen berechnet, Gleichstände verwenden Standard-Wettkampfränge (`1, 2, 2, 4`).

Der Hauptadmin verwaltet Saisonen unter `/admin/saisonen`. Datumsfelder werden als lokale Tagesgrenzen in `Europe/Vienna` interpretiert. Beim Abschluss entstehen Snapshot, archivierte Saison, aktive Folgesaison und Audit-Eintrag atomar in einer serialisierbaren Transaktion. Die erwartete aktive Saison-ID und die Datenbank-Constraints schützen vor Doppelaufrufen. Archivierte Ranglisten sind unter `/archiv/[seasonId]` öffentlich abrufbar und durch Datenbank-Trigger gegen inhaltliche Änderungen geschützt.

## Events und Veranstalter

Unter `/admin/events` verwaltet ausschließlich der Hauptadmin Events der aktiven
Saison. Eingaben werden als lokale Uhrzeit in `Europe/Vienna` interpretiert und
als eindeutiger UTC-Zeitpunkt gespeichert. Freigegebene, nicht gesperrte
Mitglieder und zentral reservierte Aliasse können mehrfach ausgewählt werden.
Eine Registrierung mit reserviertem Alias setzt nur eine Claim-Vormerkung; die
Bestätigung bleibt dem späteren Mitgliederverwaltungs-Schritt vorbehalten.

Ungeclaimte reservierte Aliasse erscheinen bereits öffentlich im aktuellen
Leaderboard. Ihre Punkte werden aus allen Veranstalterzuweisungen der aktiven
Saison summiert und gemeinsam mit freigegebenen Konten gerankt. Eine lediglich
vorgemerkte Registrierung ändert weder diese Wertung noch die Rechte; erst die
spätere atomare Claim-Freigabe führt dieselbe Alias-Identität als Mitglied fort.

Prompt 04 präzisiert hier die allgemeinere Aussage aus `REQUIREMENTS.md`, nach
der auch noch nicht freigegebene Mitglieder auswählbar wären: Für neue
Eventzuweisungen gilt derzeit die strengere Regel „freigegeben und nicht
gesperrt“. Bereits zugewiesene Mitglieder bleiben bei einer späteren Sperre am
Event historisch sichtbar, erhalten aber keinen geschützten Veranstalterzugriff.

Jedes Event erhält genau einen zufälligen, stabilen Teilnahme-Token. Er wird in
diesem Schritt weder angezeigt noch über eine Route veröffentlicht oder im Audit
protokolliert. Änderungen und Löschungen wirken durch die dynamische Berechnung
sofort auf die Live-Rangliste, während vorhandene Saison-Snapshots unabhängig
und unveränderlich bleiben.

## QR-Code und Teilnahme

Berechtigte Hauptadmins und registrierte, freigegebene, nicht gesperrte
Veranstalter erreichen ihre QR-Übersicht unter `/veranstalter/events`. Die
Präsentationsansicht unterstützt Beamer, PNG-Download und ein reduziertes
Drucklayout. QR- und Scanantworten sind `noindex`, verwenden `no-store` und
unterdrücken Referrer. Öffentliche Seiten enthalten weder Token noch QR-Link.

Die Scanroute führt nur eine serverseitige Tokenprüfung aus. Eine Teilnahme
entsteht erst nach ausdrücklicher Bestätigung über eine Server Action. Serverzeit,
Eventzeitraum, aktiver Saisonstatus, Kontosperre und Veranstalter-Doppelwertung
werden innerhalb der transaktionalen Erfassung erneut geprüft. Der eindeutige
Constraint auf Event und Benutzer verhindert doppelte Punkte auch bei parallelen
Scans; Live-Punkte bleiben abgeleitet.

Das gültige Zeitfenster ist halboffen: `Beginn ≤ Serverzeit < Ende`. Vor Beginn
fordert die Scanseite zum späteren erneuten Versuch auf; ab dem exakten Ende
weist sie darauf hin, dass das Event vorbei ist. Außerhalb des Fensters wird
keine Bestätigungsaktion angeboten.

Optional kann der Hauptadmin eine positive ganzzahlige Vorlaufzeit aktivieren.
Dann beginnt das Fenster entsprechend früher, während offizieller Eventbeginn
und exklusives Ende unverändert bleiben. Die Konfiguration ist nur in der
Eventverwaltung sowie für berechtigte Personen in QR-Übersicht, QR-Ansicht,
Druck und PNG sichtbar; öffentliche Event- und Profildaten enthalten sie nicht.

Eine verteilte Begrenzung ungültiger Tokenversuche ist ohne gemeinsamen
Rate-Limit-Speicher nicht zuverlässig umsetzbar und wurde daher nicht als
scheinbarer In-Memory-Schutz eingebaut. Die hochentropischen Token, generischen
Fehlermeldungen und cache-/referrergeschützten Antworten bilden bis zur späteren
Einrichtung eines verteilten Rate Limiters die verbleibende Schutzgrenze.

## Freigaben und Mitgliederverwaltung

Unter `/admin/mitglieder` sieht ausschließlich der Hauptadmin offene Freigaben
und die durchsuchbare Mitgliederliste. Freigabe, bestätigter Claim, Korrekturen,
Sperren und Entsperren, Passwort-Reset sowie vollständige Löschung sind
transaktionale, serverseitig autorisierte Aktionen. Sperre und Passwort-Reset
widerrufen alle Sitzungen. Das Hauptadmin-Konto ist von diesen normalen
Verwaltungsaktionen ausgeschlossen.

Ein vorgemerkter reservierter Alias muss beim Freigeben ausdrücklich geclaimt
werden. Alternativ erhält das Konto vorher eine neue eindeutige Alias-Identität,
während die Reservierung bestehen bleibt. Beim Claim wird dieselbe Identität
fortgeführt; überschneidende Teilnehmerrollen auf eigenen Veranstalter-Events
werden entfernt. Dadurch werden Teilnehmer- und Veranstalterpunkte genau einmal
gezählt und der freigegebene Claim erhält anschließend den vorgesehenen
QR-Zugriff.

Die Eventverwaltung zeigt Teilnehmer und erlaubt dem Hauptadmin manuelle
Korrekturen ohne Eventzeitfenster, jedoch nur in der aktiven, nicht archivierten
Saison. Sperrstatus, Duplikatschutz und Veranstalter-Ausschluss gelten weiterhin.
Alle kritischen Aktionen werden mit IDs und minimalen fachlichen Angaben
auditiert; Passwörter, Hashes, Sitzungs- und QR-Token werden nicht protokolliert.

## Öffentliche Events und Aliasprofile

Die öffentliche Navigation führt unter `/events` zu laufenden, kommenden und
vergangenen Events der aktiven Saison. Detailseiten enthalten ausschließlich
Titel, Beschreibung, Ort, Vienna-Zeitraum, Teilnehmerpunkte und verlinkte
Veranstalter-Aliasse. Veranstalterpunkte, Teilnehmerlisten, interne IDs und
QR-/Teilnahmeinformationen werden nicht in öffentliche DTOs aufgenommen.

Leaderboard- und Veranstalter-Aliasse verlinken auf stabile öffentliche
Profile. Freigegebene Mitglieder einschließlich gesperrter sichtbarer Konten und
ungeclaimte reservierte Aliasse erhalten dieselbe Profilansicht. Teilnehmerrollen
zeigen die öffentlichen Teilnehmerpunkte; Veranstalterrollen nennen keine
Veranstalterpunktzahl. Archivprofile verwenden ausschließlich eingefrorene
Snapshotwerte und weisen darauf hin, wenn keine historische Eventaufschlüsselung
vorliegt.

Die Migration `20260906000000_public_identifiers` ergänzt zufällige öffentliche
UUIDs für Events und Alias-Identitäten. `aliasPublicId` wird als unabhängiger
Skalar in neue Snapshot-Einträge kopiert und bleibt dadurch bei Claim,
Aliasänderung oder Kontolöschung stabil, ohne interne Konto- oder Datenbank-IDs
öffentlich zu machen.

## Audit und Sicherheitsabschluss

Das ausschließlich für den Hauptadmin erreichbare Audit-Protokoll liegt unter
`/admin/audit`. Es verwendet serverseitige Pagination und Filter und gibt nur
eine explizite Darstellungs-Whitelist aus; interne Objekt-IDs und freie
Audit-Metadaten bleiben serverintern.

Fehlgeschlagene Login- und ungültige QR-Versuche werden instanzübergreifend in
PostgreSQL begrenzt. Ein atomarer Upsert zählt getrennte Zwecke und Zeitfenster
pro HMAC-pseudonymisiertem Vercel-Verbindungsmerkmal. Außerhalb von Vercel werden
weitergeleitete Client-Header nicht vertraut. Abgelaufene Zähler werden
stichprobenartig nach höchstens einem zusätzlichen Aufbewahrungstag entfernt.
Die Runtime verwendet `DATABASE_URL`, Migrationen weiterhin `DIRECT_URL`.

Globale CSP-, MIME-, Referrer-, Frame- und Permissions-Header ergänzen die
strengeren `no-store`-/`no-referrer`-Regeln der QR-Routen. Next.js Server Actions
behalten ihre standardmäßige Origin-/Host-Prüfung; das Sitzungscookie ist
zusätzlich `HttpOnly`, in Produktion `Secure` und `SameSite=Lax`.

`npm audit` meldet derzeit vier hohe transitive Befunde in `deepmerge-ts` und
`mysql2`, beide ausschließlich über Primas Konfigurations-/CLI-Werkzeugkette.
Die Anwendung verwendet PostgreSQL und lädt `mysql2` nicht zur Laufzeit. NPM
bietet nur einen erzwungenen, inkompatiblen Prisma-Downgrade als automatische
Korrektur an; deshalb bleiben diese Werkzeugkettenbefunde bis zu einem
kompatiblen Prisma-Update dokumentiertes Restrisiko. Der separat gemeldete
`esbuild`-Befund wurde durch das Update auf 0.28.2 behoben.

## Vereinsdesign und Bedienung

Das UI verwendet ein kleines CSS-Designsystem in `src/app/globals.css` mit den
Vereinsfarben, konsistenten Abständen, Radien, Fokus-, Status- und
Aktionszuständen. Das hellere Oberflächen-Grau und die aufgehellte
Sekundärschrift sichern auf dunklem Grund mindestens AA-taugliche Kontraste.
Die Hauptnavigation wird unter 1088 Pixeln zu einem tastaturbedienbaren Menü;
Tabellen und Aktionsbereiche bleiben auf schmalen Displays scrollbar oder
wechseln in eine einspaltige Darstellung. Die QR-Präsentation blendet die
Seitennavigation aus. Das Drucklayout enthält Logo, Eventname, Zeitraum,
Statushinweis und QR-Code, aber keine Bedienelemente.

## Deployment

Das GitHub-Repository ist über die offizielle Git-Integration mit Vercel verbunden. Pushes auf den Produktionsbranch `main` lösen automatisch ein Production-Deployment aus. Die laufende Anwendung erhält in Vercel Production `DATABASE_URL` als gepoolte Neon-Verbindung. `DIRECT_URL` ist dort als direkte Verbindung für kontrollierte Prisma-Migrationsläufe hinterlegt. Der Vercel-Build führt `prisma migrate deploy` ausschließlich für Production aus und baut danach Next.js. Preview-Deployments überspringen Migrationen und erhalten vorerst keinen Zugriff auf die Produktionsdatenbank, solange keine verwaltete Neon-Preview-Verzweigung eingerichtet ist.
