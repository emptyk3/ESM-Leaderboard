# MVP-Abnahmematrix

Stand: 5. September 2026 · Produktionsziel:
`https://esm-leaderboard.vercel.app`

Statusbedeutung: **Verifiziert** wurde automatisiert oder risikofrei in
Produktion geprüft. **Manuelle Abnahme** benötigt Rollen oder veränderliche
Testdaten und wurde nicht gegen Produktion simuliert. **Go-live-Restpunkt** ist
eine organisatorische Entscheidung außerhalb des Codes.

| Bereich                    | Anforderung                                                                                              | Nachweis                                                                                              | Status                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Öffentlichkeit             | Leaderboard zeigt nur Alias, Rang und Punkte; Gleichstände und alphabetische Reihenfolge                 | `leaderboard.test.ts`, `public-data-invariants.test.ts`, Produktionsaufruf `/`                        | Verifiziert                                                                        |
| Konten                     | Registrierung mit Name, Alias, E-Mail und Passwort; Unicode- und Eindeutigkeitsregeln                    | `identity.test.ts`, `password.test.ts`, `auth-validation.ts`, Browserprüfung `/registrieren`          | Verifiziert                                                                        |
| Anmeldung                  | Anmeldung mit Alias oder E-Mail, generische Fehler, keine offene Rückleitung                             | `login.test.ts`, `participation.test.ts`, Produktions-Smoke-Test                                      | Verifiziert                                                                        |
| Sitzung                    | 180 Tage, gleitende Verlängerung, Hashspeicherung, sichere Cookies und Widerruf                          | `session.test.ts`, `session-cookie.ts`, `auth-service.ts`                                             | Verifiziert                                                                        |
| Rollen                     | Hauptadmin, Freigabe, Sperre, nicht freigegebene Konten und QR-Veranstalterrechte                        | `event.test.ts`, `member-management.test.ts`, Service-Invariantentests; ausgeloggte Produktionsrouten | Verifiziert; angemeldete Rollen zusätzlich manuell abnehmen                        |
| Mitglieder                 | Admin-Korrektur, Passwort-Reset, Sperre und vollständige Live-Löschung                                   | `member-service.ts`, `member-service-invariants.test.ts`                                              | Verifiziert; Bedienablauf manuell abnehmen                                         |
| Reservierter Alias         | Öffentlicher Eintrag, Claim-Vormerkung und ausdrückliche Freigabe ohne Doppelzählung                     | `leaderboard.test.ts`, `member-management.test.ts`, `event-invariants.test.ts`                        | Verifiziert                                                                        |
| Veranstalterauswahl        | Für neue Zuweisungen gelten die später bestätigten Regeln aus Auftrag 04: freigegeben und nicht gesperrt | `event.ts`, `event.test.ts`, README-Entscheidungsnotiz                                                | Verifiziert; bewusste Präzisierung gegenüber der älteren Requirements-Formulierung |
| Events                     | Zeitraum, Punkte, mehrere Veranstalter, Bearbeitung und Löschung mit abgeleiteten Live-Punkten           | `event.test.ts`, `event-invariants.test.ts`, Event-Service                                            | Verifiziert; Bedienablauf manuell abnehmen                                         |
| QR                         | Genau ein stabiler Token, geschützte Anzeige/PNG/Druck, kein öffentlicher Link, kein Cache/Referrer      | `qr-security.test.ts`, Produktionsheader einer ungültigen Scanroute                                   | Verifiziert; echter Ausdruck und Beamerbild manuell abnehmen                       |
| Teilnahme                  | Bestätigendes POST, Eventfenster, Sperre, Veranstalterausschluss, Duplikatschutz bei Parallelzugriff     | `participation.test.ts`, `qr-security.test.ts`, DB-Constraints und Trigger                            | Verifiziert; vollständiger Scan mit isolierten Daten manuell abnehmen              |
| Saisonen                   | Freier Vienna-Zeitraum, Format `2026/27`, genau eine aktive Saison                                       | `season.test.ts`, `vienna-date.test.ts`, DB-Constraints                                               | Verifiziert                                                                        |
| Archiv                     | Atomarer Abschluss, eingefrorene Rangliste und DB-Trigger gegen Änderung/Löschung                        | `archive-invariants.test.ts`, `season-management.test.ts`, Migrationen                                | Verifiziert; Saisonwechsel-UI manuell abnehmen                                     |
| Öffentliche Events/Profile | Nur freigegebene Felder, stabile öffentliche UUIDs, eingefrorene Archivprofile                           | `public-events.test.ts`, `public-data-invariants.test.ts`, Produktionsaufrufe und 404                 | Verifiziert                                                                        |
| Audit                      | Nur Hauptadmin, Filter, Pagination, deutsche Whitelist ohne sensible Metadaten                           | `security-closure.test.ts`, ausgeloggter Produktionszugriff `/admin/audit`                            | Verifiziert; gefüllte Ansicht manuell abnehmen                                     |
| Missbrauchsschutz          | Getrennte, atomare PostgreSQL-Zähler für Login und ungültige QR-Token                                    | `security-closure.test.ts`, Migration und je ein risikofreier Produktionsfehler                       | Verifiziert                                                                        |
| Sicherheit                 | CSP, MIME-, Referrer-, Frame- und Permissions-Header; private QR-/Adminantworten ungecacht               | Tests und produktive HTTP-Header                                                                      | Verifiziert                                                                        |
| Vereinsdesign              | Logo, Vereinsfarben, responsive Navigation, Fokus- und Druckregeln                                       | Browserprüfung Desktop, `navigation.test.ts`, Produktionsbuild                                        | Verifiziert; datenreiche Mobil-/Druckansichten manuell abnehmen                    |
| Betrieb                    | GitHub `main` → Vercel Production; Neon-Laufzeit/Migration getrennt                                      | Deploymentstatus und `vercel-build.mjs`                                                               | Verifiziert                                                                        |
| Recht                      | Bestätigte Ziele für Impressum und Datenschutz                                                           | Keine Werte im Repository; öffentliche Suche lieferte keine eindeutig verifizierbaren Ziele           | **Go-live-Restpunkt**                                                              |

## Nicht destruktiv geprüfte Produktionslage

Die öffentliche Produktion ist erreichbar, enthält aber noch keine aktive
Saison, Events oder Archive. Es wurden keine Konten oder Fachdaten angelegt.
Darum sind mutierende End-to-End-Abläufe und gefüllte Rollenansichten durch
Fachtests und Datenbankconstraints nachgewiesen, müssen aber vor dem echten
Vereinsbetrieb einmal mit einer isolierten Testdatenbank oder einem ausdrücklich
als Test gekennzeichneten Neon-Branch durchgespielt werden.
