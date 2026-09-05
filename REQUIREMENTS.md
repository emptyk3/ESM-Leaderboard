# Requirements: Vereins-Leaderboard

Status: MVP-Baseline – Umsetzung kann beginnen  
Letzte Aktualisierung: 4. September 2026

## 1. Ziel

Eine öffentlich erreichbare Website zeigt das Leaderboard des Vereins eSports Mostviertel. Sie verwendet die Farben und das Logo des Vereins. Mitglieder sammeln Punkte durch die Teilnahme an Events. Die Teilnahme wird über einen vom Admin erzeugten QR-Code erfasst.

## 2. Bestätigter Umfang

- Website für genau einen Verein
- Öffentliches Leaderboard im Erscheinungsbild des Vereins
- Selbstregistrierung und Anmeldung der Mitglieder
- Punktevergabe für die Teilnahme an Events
- Optional gesonderte Punkte für den Veranstalter eines Events
- Admin erstellt Events und die zugehörigen QR-Codes
- Mitglieder scannen den QR-Code zur Teilnahmeerfassung
- Admin kann Benutzer und Teilnahmen verwalten

## 3. Rollen und Rechte

### Besucher

- Kann das Leaderboard ohne Anmeldung ansehen.
- Sieht ausschließlich den Alias eines Mitglieds, keine Namen oder E-Mail-Adressen.

### Mitglied

- Kann sich mit Name, Alias, E-Mail-Adresse und Passwort selbst registrieren.
- Kann sich mit Alias oder E-Mail-Adresse und Passwort anmelden.
- Soll auf dem verwendeten Gerät dauerhaft angemeldet bleiben können.
- Kann den eigenen Alias ändern.
- Kann einen gültigen Event-QR-Code scannen und die eigene Teilnahme erfassen.
- Kann bereits vor der Freigabe durch einen Admin Teilnahmen und Punkte sammeln.
- Erscheint mit Alias und Punkten erst nach der Freigabe durch einen Admin im öffentlichen Leaderboard.

### Veranstalter

- Ein registrierter, angemeldeter und vom Hauptadmin freigegebener Veranstalter kann für ein ihm zugewiesenes Event dessen QR-Code vorab erzeugen, anzeigen, herunterladen und drucken.
- Der QR-Code akzeptiert unabhängig vom Erzeugungszeitpunkt nur während des festgelegten Eventzeitraums Teilnahmen.
- Ein reservierter Veranstalter-Alias ohne freigegebenes Benutzerkonto hat keinen Zugriff.

### Admin

- Das System hat genau einen Hauptadmin.
- Das Hauptadmin-Konto ist ein reines Verwaltungskonto und erscheint weder im öffentlichen Leaderboard noch in öffentlichen Aliasprofilen oder neuen Saisonarchiven.
- Kann Events erstellen und verwalten.
- Kann QR-Codes für Events erzeugen.
- Kann den QR-Code eines laufenden Events ausschließlich im geschützten Adminbereich bildschirmfüllend darstellen, beispielsweise für eine Projektion per Beamer.
- Kann erfasste Teilnahmen kontrollieren und löschen.
- Kann Mitglieder manuell zu einem Event hinzufügen.
- Kann neu registrierte Mitglieder für das öffentliche Leaderboard freigeben.
- Kann Benutzer sperren und löschen.
- Kann den Alias eines Benutzers ändern.

## 4. Registrierung und Benutzerkonto

- Pflichtfelder bei der Selbstregistrierung: Name, Alias, E-Mail-Adresse und Passwort.
- Neue Passwörter umfassen mindestens 4 Zeichen; weitere Komplexitätsanforderungen bestehen nicht.
- Alias und E-Mail-Adresse können zur Anmeldung verwendet werden.
- Der Alias ist öffentlich sichtbar und muss eindeutig sein.
- Name und E-Mail-Adresse sind nicht öffentlich sichtbar.
- Mitglieder können ihren Alias nach der Registrierung ändern.
- Mitglieder können ihren Namen und ihre E-Mail-Adresse nach der Registrierung nicht selbst ändern.
- Der Hauptadmin kann Name, E-Mail-Adresse und Alias eines Mitglieds korrigieren.
- Alias-Regeln:
  - Länge: 3 bis 30 Zeichen.
  - Erlaubt sind Unicode-Buchstaben einschließlich Buchstaben mit Akzenten und Umlauten, Ziffern, Leerzeichen, Bindestriche und Unterstriche.
  - Ein Alias darf nicht nur aus Leerzeichen bestehen und hat keine führenden oder abschließenden Leerzeichen.
  - Aliasse müssen unabhängig von Groß-/Kleinschreibung eindeutig sein.
- Eine Bestätigung der E-Mail-Adresse ist für die erste Version nicht erforderlich.
- Neue Konten müssen durch einen Admin freigegeben werden, bevor sie im öffentlichen Leaderboard erscheinen.
- Noch nicht freigegebene Konten dürfen sich anmelden, QR-Codes scannen und Punkte sammeln. Die gesammelten Punkte werden nach der Freigabe sichtbar.
- Eine dauerhafte Anmeldung soll möglich sein, damit bei einem QR-Code-Scan normalerweise keine erneute Anmeldung nötig ist.
- Gesperrte Benutzer können keine Teilnahme erfassen.
- Gesperrte Benutzer und ihre bereits gesammelten Punkte bleiben im öffentlichen Leaderboard sichtbar.
- Vergessene Passwörter werden über den Hauptadmin zurückgesetzt; ein automatischer E-Mail-Reset ist für die erste Version nicht vorgesehen.
- Beim Passwort-Reset setzt der Hauptadmin ein neues vorläufiges Passwort. Dieses läuft nicht ab und das Mitglied darf es ohne erzwungenen Passwortwechsel weiterverwenden.
- Beim Löschen eines Benutzers werden das Konto, alle Teilnahmen und sämtliche Punkte vollständig und endgültig entfernt.

## 5. Events und Punkte

- Der Admin legt für jedes Event einen Beginn und ein Ende fest.
- Der Admin bestimmt beim Erstellen des Events die Punkte pro Teilnehmer.
- Alle regulären Teilnehmer eines Events erhalten dieselbe Punktzahl.
- Ein Event kann keinen, einen oder mehrere designierte Veranstalter haben.
- Der Admin kann eine separate, gegebenenfalls höhere Punktzahl festlegen, die jeder designierte Veranstalter erhält.
- Ein Veranstalter kann beim selben Event nicht zusätzlich als regulärer Teilnehmer gewertet werden.
- Veranstalterpunkte müssen auf der öffentlichen Eventansicht nicht angezeigt werden.
- Ist ein Veranstalter noch nicht registriert, kann der Hauptadmin einen reservierten Veranstalter-Alias anlegen und dem Event zuweisen.
- Als Veranstalter kann der Hauptadmin freigegebene oder noch nicht freigegebene Mitglieder sowie reservierte Veranstalter-Aliasse auswählen.
- Registriert sich die betreffende Person später mit diesem reservierten Alias, wird die Übernahme vorgemerkt und durch die ohnehin erforderliche Admin-Freigabe bestätigt. Danach werden die bisherigen Veranstalterpunkte dem Benutzerkonto zugeordnet.
- Events des Gesamtvereins können ohne designierte Veranstalter angelegt werden. Dann werden nur Teilnehmerpunkte vergeben.
- Ein Mitglied darf für dasselbe Event höchstens einmal als Teilnehmer gewertet werden.
- Erforderliche Eventdaten: Titel, Beschreibung, Ort, Beginn, Ende, Teilnehmerpunkte, optionale Veranstalter und optionale Veranstalterpunkte.
- Der Admin kann eine Teilnahme auch nachträglich manuell hinzufügen.
- Ändert der Admin nachträglich die Punkte eines Events, werden die Punktestände aller betroffenen Teilnehmer und Veranstalter automatisch neu berechnet.
- Beim Löschen eines Events werden das Event, alle zugehörigen Teilnahmen und alle dadurch vergebenen Punkte vollständig entfernt.
- Kommende und vergangene Events dürfen öffentlich angezeigt werden.

## 6. Teilnahme per QR-Code

1. Ein Admin legt ein Event mit Zeitraum und Punkten an.
2. Das System erzeugt einen QR-Code für dieses Event.
3. Der Admin zeigt oder verteilt den QR-Code während des Events.
4. Ein angemeldetes Mitglied scannt den QR-Code.
5. Das System prüft das Mitglied, den Eventzeitraum und eine bereits vorhandene Teilnahme.
6. Bei erfolgreicher Prüfung wird die Teilnahme gespeichert und das Leaderboard aktualisiert.

Regeln:

- Der QR-Code ist genau einem Event zugeordnet.
- Pro Event existiert genau ein stabiler QR-Code. Er kann beliebig oft erneut geöffnet, dargestellt, heruntergeladen und gedruckt werden; es werden keine parallelen oder wechselnden Codes für dasselbe Event erzeugt.
- Er ist im halboffenen Zeitfenster `Beginn ≤ Serverzeit < Ende` zur Teilnahmeerfassung gültig.
- Optional kann der Hauptadmin eine positive ganzzahlige Vorlaufzeit aktivieren; dann gilt `Beginn − Vorlaufminuten ≤ Serverzeit < Ende`, ohne den offiziellen Eventbeginn zu verändern.
- Außerhalb des Eventzeitraums wird keine Teilnahme angenommen.
- Standortprüfung und ständig wechselnde QR-Codes sind für die erste Version nicht vorgesehen.
- Der Admin kann unberechtigte oder fehlerhafte Teilnahmen nachträglich entfernen.
- Falls das Scannen nicht funktioniert hat, kann der Admin das Mitglied manuell als Teilnehmer hinzufügen.
- Bei erfolgreicher Erfassung sieht das Mitglied Eventname, Bestätigung, erhaltene Punkte und den aktuellen Rang.
- Bei erneutem Scan desselben Events werden keine weiteren Punkte vergeben. Das Mitglied erhält einen freundlichen Hinweis, dass die Teilnahme bereits erfasst wurde.
- Der geschützte Adminbereich besitzt einen Bereich „Laufende Events“. In dessen Präsentationsansicht nimmt der QR-Code den Großteil des Bildschirms ein.
- Nur der Hauptadmin kann QR-Codes erzeugen, anzeigen, als PNG herunterladen und in druckbarer Form ausgeben.
- QR-Codes und die darin enthaltenen Teilnahme-Links werden auf keiner öffentlichen Event- oder Übersichtsseite dargestellt oder verlinkt.
- Der im QR-Code enthaltene Teilnahme-Link ist für den Scan technisch erreichbar, aber nicht über die öffentliche Navigation auffindbar.

## 7. Öffentliche Darstellung

- Das Leaderboard ist ohne Anmeldung öffentlich erreichbar.
- Pro Mitglied wird ausschließlich der Alias angezeigt.
- Das Leaderboard ist in jährliche Saisonen unterteilt.
- Standardmäßig wird die aktuelle Saison angezeigt.
- Abgeschlossene Saisonen werden in einem öffentlich einsehbaren Archiv aufbewahrt.
- Eine Saison entspricht dem Vereinsjahr. Das Vereinsjahr beginnt und endet mit der Jahreshauptversammlung und muss daher nicht dem Kalenderjahr entsprechen.
- Der Hauptadmin schließt die laufende Saison anlässlich der Jahreshauptversammlung ab und eröffnet die nächste Saison.
- Der Saisonname verwendet das Format `2026/27`.
- Beim Saisonwechsel gibt der Hauptadmin den Saisonnamen sowie Beginn und Ende manuell ein.
- Ein archiviertes Leaderboard ist endgültig und wird durch spätere Änderungen nicht mehr neu berechnet.
- Zusätzliche Monats- oder benutzerdefinierte Zeitraumfilter sind nicht vorgesehen.
- Mitglieder mit derselben Punktzahl erhalten denselben Rang.
- Mitglieder mit gleichem Rang werden alphabetisch nach Alias angezeigt.
- Der Alias eines freigegebenen Mitglieds kann angeklickt werden. Eine öffentliche Profilseite zeigt dessen gewertete Events.
- Eine zusätzliche private Teilnahmeübersicht ist für die erste Version nicht vorgesehen, da die öffentliche Profilseite diese Informationen bereits zeigt.
- Kommende und vergangene Events können öffentlich eingesehen werden.
- Öffentliche Eventseiten zeigen die Aliasse der Veranstalter, aber nicht die Höhe der Veranstalterpunkte.
- Öffentlich sichtbare Eventdaten: Titel, Beschreibung, Ort, Beginn, Ende, Teilnehmerpunkte und Veranstalter-Aliasse.
- Öffentliche Seiten zeigen niemals den Event-QR-Code oder den zugehörigen Teilnahme-Link.
- Die Website verwendet Logo und Farben des Vereins.

## 8. Vereinsauftritt

- Vereinsname: eSports Mostviertel
- Logo-Datei: `assets/esports-mostviertel-logo.webp`
- Vorläufig aus dem Logo abgeleitete Farbpalette:
  - Primärgrün: `#4AA900`
  - Hellgrün/Akzent: `#9BE600`
  - Dunkelgrün: `#245F00`
  - Anthrazit: `#222222`
  - Schwarz: `#050505`
  - Helles Cremeweiß: `#FFF5D0`
  - Goldgelber Akzent: `#FFD15C`
- Die endgültige Verwendung und Kontrastprüfung der Farben wird im UI-Entwurf festgelegt.
- Sprache der ersten Version: ausschließlich Deutsch.

## 9. Noch zu klärende Anforderungen

### Verein und Gestaltung

- Erwartete Größenordnung: 20 bis 150 Mitglieder und 10 bis 50 Events pro Jahr.

### Konten und Datenschutz

- Keine offene Frage zum Passwort-Reset; das vom Hauptadmin gesetzte Passwort läuft nicht ab.

### Events

- Keine offenen Grundsatzfragen; Detailregeln für Bearbeitung und Status werden noch festgelegt.

### Leaderboard

- Beim späteren Claimen eines Veranstalter-Alias bleiben Punkte und angezeigter Alias eines abgeschlossenen Archivs unverändert; lediglich die interne Zuordnung zum Benutzerkonto wird ergänzt.

### Administration und Betrieb

- Benötigte Adminbereiche: offene Kontofreigaben, Mitgliederverwaltung und Eventverwaltung.
- Wichtige Admin-Aktionen werden protokolliert, insbesondere Benutzerlöschungen, Punkteänderungen, manuelle Teilnahmen und Saisonabschlüsse.
- CSV-Exporte sind für die erste Version nicht vorgesehen.
- Eigene Seiten für Impressum und Datenschutzerklärung sind zunächst nicht Teil des Funktionsumfangs. Vor Veröffentlichung beziehungsweise Einbindung ist zu klären, ob und wie die vorhandenen Rechtstexte der bestehenden Vereinswebsite verwendet werden.
- Gewünschte Domain, Hosting und Budget?
- Besondere Anforderungen an Datenschutz, Einwilligung und Kontolöschung?

## 10. Entwicklungs- und Betriebsmodell

- Die Anwendung wird lokal entwickelt.
- Der Quellcode wird in einem GitHub-Repository versioniert.
- Deployments erfolgen über Vercel.
- Persistente Anwendungsdaten werden in einer PostgreSQL-Datenbank bei Neon gespeichert.
- Die Anwendung wird zunächst als eigenständige Vercel-Webanwendung umgesetzt; eine spätere Einbindung in die bestehende Vereinswebsite bleibt möglich.
- Bestätigter technischer Ausgangspunkt: Next.js, React, TypeScript und Prisma. Konkrete Versionen und ergänzende Bibliotheken werden vor der Umsetzung festgelegt.
- Das erste Hauptadmin-Konto wird bei der initialen Einrichtung der Anwendung automatisch aus sicher hinterlegten Konfigurationswerten angelegt, nicht über die öffentliche Registrierung. Das Passwort steht nicht im Quellcode.
- Zeitzone für alle fachlichen Datums- und Zeitregeln: `Europe/Vienna` mit automatischer Berücksichtigung von Sommer- und Winterzeit.
- Die Sichtbarkeit des GitHub-Repositorys ist noch festzulegen.
- Mitglieder bleiben 180 Tage angemeldet. Bei aktiver Nutzung beginnt diese Frist erneut.

## 11. Qualitätsanforderungen (zu bestätigen)

- Für Smartphones optimierte Bedienung
- Sichere Anmeldung und Passwortspeicherung
- Datenschutzkonforme Verarbeitung personenbezogener Daten
- Nachvollziehbare und konsistente Punkteberechnung
- Schutz vor mehrfacher Teilnahmeerfassung
- Datensicherung und Wiederherstellbarkeit

## 12. Abgrenzung

Noch nicht vollständig festgelegt. Funktionen außerhalb des ersten Releases werden während der Anforderungsaufnahme als spätere Ausbaustufe markiert.

## 13. Entscheidungsprotokoll

| Datum      | Entscheidung                                                                                                                                       | Status    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 05.09.2026 | Das Hauptadmin-Konto ist von öffentlichen Ranglisten, Aliasprofilen und neu erzeugten Saison-Snapshots ausgeschlossen.                             | Bestätigt |
| 05.09.2026 | Neue Passwörter benötigen mindestens 4 Zeichen; Groß-/Kleinbuchstaben, Ziffern, Sonderzeichen oder Kombinationen sind nicht vorgeschrieben.         | Bestätigt |
| 04.09.2026 | Website dient genau einem Verein und verwendet dessen Logo und Farben.                                                                             | Bestätigt |
| 04.09.2026 | Das Leaderboard ist öffentlich und zeigt ausschließlich Aliasse.                                                                                   | Bestätigt |
| 04.09.2026 | Mitglieder registrieren sich selbst und melden sich mit Alias oder E-Mail-Adresse und Passwort an.                                                 | Bestätigt |
| 04.09.2026 | Mitglieder sollen auf ihrem Gerät dauerhaft angemeldet bleiben können.                                                                             | Bestätigt |
| 04.09.2026 | Teilnehmerpunkte und optionale Veranstalterpunkte werden je Event festgelegt.                                                                      | Bestätigt |
| 04.09.2026 | Der Event-QR-Code gilt nur im Eventzeitraum; weitergehender Weiterleitungsschutz ist zunächst nicht vorgesehen.                                    | Bestätigt |
| 04.09.2026 | Admins können Benutzer verwalten und Teilnahmen löschen.                                                                                           | Bestätigt |
| 04.09.2026 | Konten benötigen keine E-Mail-Bestätigung, aber eine Admin-Freigabe für die Anzeige im Leaderboard.                                                | Bestätigt |
| 04.09.2026 | Nicht freigegebene Mitglieder dürfen bereits Punkte sammeln; sichtbar werden sie erst nach der Freigabe.                                           | Bestätigt |
| 04.09.2026 | Name und E-Mail-Adresse können vom Mitglied nicht geändert werden; der Alias ist änderbar.                                                         | Bestätigt |
| 04.09.2026 | Beim Löschen eines Mitglieds werden Konto, Teilnahmen und Punkte vollständig entfernt.                                                             | Bestätigt |
| 04.09.2026 | Events können mehrere Veranstalter haben; Veranstalter erhalten keine zusätzlichen Teilnehmerpunkte.                                               | Bestätigt |
| 04.09.2026 | Admins können Teilnahmen manuell hinzufügen.                                                                                                       | Bestätigt |
| 04.09.2026 | Das Leaderboard verwendet jährliche Saisonen mit öffentlich einsehbarem Archiv.                                                                    | Bestätigt |
| 04.09.2026 | Gleich hohe Punktzahlen erhalten denselben Rang.                                                                                                   | Bestätigt |
| 04.09.2026 | Öffentliche Mitgliederprofile zeigen die gewerteten Events des jeweiligen Alias.                                                                   | Bestätigt |
| 04.09.2026 | Änderungen an Eventpunkten lösen eine Neuberechnung aus; gelöschte Events entfernen auch Teilnahmen und Punkte.                                    | Bestätigt |
| 04.09.2026 | Kommende und vergangene Events dürfen öffentlich sichtbar sein.                                                                                    | Bestätigt |
| 04.09.2026 | Es gibt genau einen Hauptadmin; Passwort-Resets erfolgen über diesen.                                                                              | Bestätigt |
| 04.09.2026 | Gesperrte Mitglieder bleiben mit bisherigen Punkten sichtbar, können aber keine neuen QR-Teilnahmen erfassen.                                      | Bestätigt |
| 04.09.2026 | Der Hauptadmin setzt ein neues vorläufiges Passwort; es läuft nicht ab und muss nicht zwingend geändert werden.                                    | Bestätigt |
| 04.09.2026 | Saisonen folgen dem Vereinsjahr zwischen Jahreshauptversammlungen; abgeschlossene Archive sind unveränderlich.                                     | Bestätigt |
| 04.09.2026 | Innerhalb eines geteilten Rangs wird alphabetisch nach Alias sortiert.                                                                             | Bestätigt |
| 04.09.2026 | Nicht registrierte Veranstalter können über reservierte Aliasse geführt und später nach Admin-Freigabe geclaimt werden.                            | Bestätigt |
| 04.09.2026 | Der Vereinsauftritt verwendet den Namen eSports Mostviertel sowie die aus dem bereitgestellten Logo abgeleitete Farbwelt.                          | Bestätigt |
| 04.09.2026 | Saisonen tragen Namen im Format 2026/27; Name, Beginn und Ende werden beim Saisonwechsel manuell festgelegt.                                       | Bestätigt |
| 04.09.2026 | Veranstalter-Aliasse sind öffentlich sichtbar, die Höhe der Veranstalterpunkte jedoch nicht.                                                       | Bestätigt |
| 04.09.2026 | Der Hauptadmin darf Name, E-Mail-Adresse und Alias eines Mitglieds korrigieren.                                                                    | Bestätigt |
| 04.09.2026 | Aliasse bestehen aus 3–30 Zeichen und unterstützen internationale Unicode-Buchstaben; ihre Eindeutigkeit ist unabhängig von Groß-/Kleinschreibung. | Bestätigt |
| 04.09.2026 | Erwartete Größenordnung: 20–150 Mitglieder und 10–50 Events pro Jahr.                                                                              | Bestätigt |
| 04.09.2026 | Das Claimen verändert abgeschlossene Archive nicht; nur die interne Kontozuordnung wird ergänzt.                                                   | Bestätigt |
| 04.09.2026 | Die erste Version ist deutschsprachig.                                                                                                             | Bestätigt |
| 04.09.2026 | Der Bereich „Laufende Events“ bietet eine großformatige QR-Ansicht sowie PNG-Download und Druckausgabe.                                            | Bestätigt |
| 04.09.2026 | Ein erfolgreicher Scan zeigt Event, Punkte und aktuellen Rang; ein doppelter Scan erzeugt nur einen Hinweis.                                       | Bestätigt |
| 04.09.2026 | Die öffentliche Mitgliederprofilseite ersetzt eine zusätzliche private Teilnahmeübersicht.                                                         | Bestätigt |
| 04.09.2026 | Adminbereiche umfassen offene Freigaben, Mitgliederverwaltung und Eventverwaltung; CSV-Exporte sind nicht vorgesehen.                              | Bestätigt |
| 04.09.2026 | Kritische Admin-Aktionen werden protokolliert.                                                                                                     | Bestätigt |
| 04.09.2026 | QR-Codes werden ausschließlich im geschützten Adminbereich erzeugt und dargestellt; öffentliche Seiten verlinken sie nicht.                        | Bestätigt |
| 04.09.2026 | Lokale Entwicklung, GitHub-Versionierung, Vercel-Hosting und Neon-PostgreSQL bilden das Zielbetriebsmodell.                                        | Bestätigt |
| 04.09.2026 | Fachliche Zeiten verwenden Europe/Vienna einschließlich Sommer- und Winterzeit.                                                                    | Bestätigt |
| 04.09.2026 | QR-Codes können vor dem Event erzeugt und gedruckt werden, akzeptieren Scans aber nur während des Eventzeitraums.                                  | Bestätigt |
| 04.09.2026 | Registrierte Veranstalter dürfen QR-Codes ihrer eigenen Events verwalten.                                                                          | Bestätigt |
| 04.09.2026 | Die erste Bereitstellung erfolgt als eigenständige Vercel-Anwendung; eine spätere Website-Einbindung bleibt möglich.                               | Bestätigt |
| 04.09.2026 | Das erste Hauptadmin-Konto wird bei der initialen Einrichtung angelegt.                                                                            | Bestätigt |
| 04.09.2026 | Nur Hauptadmin sowie angemeldete, freigegebene und dem Event zugewiesene Veranstalter können dessen QR-Code verwalten.                             | Bestätigt |
| 04.09.2026 | Pro Event existiert genau ein stabiler QR-Code, der beliebig oft dargestellt und gedruckt werden kann.                                             | Bestätigt |
| 04.09.2026 | Anmeldungen gelten 180 Tage und verlängern sich bei aktiver Nutzung.                                                                               | Bestätigt |
| 04.09.2026 | Next.js, React, TypeScript und Prisma sind als technische Basis bestätigt.                                                                         | Bestätigt |

## 14. Umsetzungsplan und Codex-Prompts

Die Umsetzung erfolgt in abgegrenzten, überprüfbaren Schritten. `REQUIREMENTS.md` bleibt die verbindliche Produktgrundlage und wird bei späteren Entscheidungen fortgeschrieben.

Geplante Reihenfolge:

1. Projektgrundlage, Datenmodell und lokale Entwicklungsumgebung
2. Registrierung, Anmeldung, Sitzungen und initialer Hauptadmin
3. Saisonverwaltung, öffentliches Leaderboard und Archiv
4. Eventverwaltung, Veranstalter und reservierte Aliasse
5. QR-Code-Ablauf und Teilnahmeerfassung
6. Benutzerfreigabe, Mitgliederverwaltung und Passwort-Reset
7. Öffentliche Event- und Mitgliederseiten
8. Audit-Protokoll, Sicherheitsprüfung und fachliche Tests
9. UI-Feinschliff im Vereinsdesign
10. GitHub-, Neon- und Vercel-Bereitstellung

Offene Detailfragen werden jeweils vor dem betroffenen Umsetzungsschritt entschieden, sofern sie das Ergebnis wesentlich verändern.
