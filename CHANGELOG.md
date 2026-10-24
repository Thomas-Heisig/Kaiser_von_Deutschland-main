# Changelog

Änderungen im Git-Repository, nach [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Die Paketversion ist weiterhin `2.5.1`; GitHub Pages veröffentlicht den geprüften `main` unabhängig von einer Paketversion. Die historische Änderungsliste bleibt archiviert.

## [Unreleased] — Stand 24.10.2026

### Fixed

- **Build- und Rekrutierungsvorschau nutzt dieselbe Regel wie die Ausführung.** `GameEngine.getBuildPlan()` und `GameEngine.getRecruitPlan()` liefern Kosten, Bauzeit und konkrete Hindernisse; Oberfläche und Ausführung greifen auf dieselbe Prüfung zu. Damit nennt ein abgelehnter Bau den tatsächlichen Grund.
- **Volle Vorhabenliste wird nicht länger als Ressourcenmangel gemeldet.** Waren alle zwölf Vorhabenplätze belegt, erschien zuvor „Nicht genügend Ressourcen". Jetzt erscheint „12 Vorhaben laufen bereits" — in Vorschau, Fehlermeldung und nach dem Laden eines Spielstands.
- **Fehlermeldungen nennen fehlende Mengen.** Statt „Nicht genügend Ressourcen" erscheint z. B. „4.950 Gold fehlt, 2.450 Stein fehlt"; die Rekrutierung nennt zusätzlich fehlende Bauern.
- **Erfolgsmeldungen beziffern die tatsächliche Zahlung.** Bau und Rekrutierung melden die abgezogenen Beträge („Bezahlt: 1.200 Gold · 300 Holz") statt einer pauschalen Bestätigung.
- Rekrutierungskosten liegen als `RECRUITMENT_COSTS` in `src/core/Kingdom.ts` an einer Stelle; Vorschau und `recruitSoldiers()` können nicht mehr auseinanderlaufen.
- Projektstatus-Dialog: doppelte Rückgabetyp-Angabe in `src/ui/FeatureStatus.ts` behoben, die `npm run check` und den Testlauf unterbrach.

### Added

- Fünf neue Vorzeit-Aufnahmen mit umbenannten Dateien, ID3-Titeln, eingebetteten Covern und neuer Galerie; Ancient Veil als instrumentales Startthema. Epochen-Playlists wechseln passende Titel ohne Neustart bei Monatswechsel.
- Gespeicherte Bau-, Modernisierungs-, Rekrutierungs- und Feldzugzeiten, genaue Startkosten und Abschlussmeldungen. Echte Jahres-/Jahrzehnt-/Jahrhundertreisen mit Abbruch und Jahresautosaves.
- Lagerkapazität, Überschussverderb, optionale Vorratskatastrophen und Feldschäden, stärkere neue Grenzmächte nach vollständiger Unterwerfung.
- Reale Ganderkesee-Geländebasis und Gewässer auch in der Siedlung, sichtbare Rivalenwerte, filterbarer Lagebericht, gespeichertes Ausblenden der Spielbegleitung. Geschichte-Lesezeitreise und sieben institutionell belegte Karolinger-/Bauhaus-Karten.

- Charakterautomatik mit Ausgewogen/Arbeiten/Studieren/Waffenübung/Dem Reich dienen und Vorrang manueller Monatsaktionen. Zugewiesene Bürger mit Namen, Aufgabe und Fortschritt; Familienübersicht und erwachsene Nachfolge. Automatische Nachbesetzung von Hofämtern und laufenden Bürgeraufträgen ohne erneute Kosten, Chronik und Altstandmigration.
- Bedürfnisversorgung statt dauerhaftem Verfall, kalendarische Alterung, jährliche Haushaltsgründung und Berufseinstieg für erwachsenen Nachwuchs. Zwei deterministische 60-Jahre-Demografieläufe, zehn Jahre durch die Engine sowie Browserabläufe mit Monatsaktionen und Save/Load ergänzt. [Modell und Grenzen](docs/05-technical-architecture/CITIZEN_LIFECYCLE.md).
- Regionale Versorgungsentscheidungen mit dauerhaften Speichern, zeitlich begrenzter Hilfe und tatsächlichen Abwanderungsfolgen; erfolgreiche Bürgeraufträge und Verwaltungsbudget angebunden. Hotseat, BCE und Save/Load getestet.
- Dauerhafte Anzeige von Zufriedenheit, Stabilität, Bevölkerung und Nahrungsvorrat in Monatsverbräuchen. Strukturierte Chronik, vollständig scrollbar lesbare aktuelle Meldungen und sechs Bürgerrollen je Seite.
- Holzproduktion und Werkstattausbau neu abgestimmt, saisonaler Mehrertrag beim Bauen sichtbar. Neue Bürger erhalten Namen nach Geburtsjahr; vorhandene Personen bleiben erhalten. Naturereignis-Meldungen werden nun in der tatsächlich aktiven Spieloberfläche abonniert.

- Frühstart ab 2000 v. Chr. mit Siedlungsdarstellung, angepassten Begriffen und erreichbaren Grundtechnologien. Chronik, Kalender und Vertragsdaten zeigen v./n. Chr.; der Jahreswechsel überspringt ein sichtbares Jahr null.
- Geschichte & Zeitbild mit Quellenkarten zu Kunst, Architektur, Kultur und Alltag. Antike Ereignisse und Zeiträume ergänzt; umstrittene Tagesdaten, überlieferte Daten und Näherungen kenntlich gemacht. Monatsdaten erscheinen erst im zugehörigen Monat; Jahrseinträge bleiben Jahreskontext. [Quellenprüfung und Grenzen](docs/09-history-model/ZEITBILD.md).
- Regressionstests für vorchristliche Kulturförderung und Save/Load; Browsermatrix für 20 historische Starts sowie antike/neuzeitliche Monatswechsel und Themenfilter.
- Persistente Strategie-Weltkarte: alle Nachbarn, Regionsfokus, Tastatur-Pan, bezahlte Reisen, Geländeentdeckung, Chronik und Altstandmigration. 20 Nachbarn bei 320/768/1024 px automatisiert geprüft.
- Handelsverträge, Schutzbündnisse, monatsgenauer Ablauf, Vertragsbruch und Vertrauensaufbau; fremde Überfälle beenden Handel ohne Prestigeabzug für den Spieler. Jährliche Rivalen reagieren begrenzt auf Wirtschaft, Handel, Forschung und Heer.
- Friedlicher Kaiserkrone-Abschluss durch zwei Bündnisse; Hanse/Wissenschaft/Kultur/Kaiserkrone mit bezahlten Aktionen und Save/Load bis zum Sieg geprüft (finanzierte Testpartien).
- Reproduzierbare Bevölkerungsmessung bis 20.000 Bürgern. Speicherhülle `gzip-base64-v2` vermeidet Zahlenarrays; alte GZIP- und Klartext-Saves bleiben lesbar.
- PR #96/#97: gemeinsame Epochenoberfläche, Schreibtischstart, Flüsse, paginierte Dialoge ohne Seitenscrollen; Lagebericht mit Tutorial, Quellen zur Jahresgeschichte und gespeicherter Ereignisautomatik.

- **Karten-Zoom-Ebenen (Gerüst):** Schieberegler (0–100, logarithmisch auf Kamera-Zoom 0.4–4.0 abgebildet) plus gleichwertige „+"/„−"-Buttons; Ebenenwechsel Dorf ↔ Zentraleuropa mit Hysterese (35/40). Die Ebene „Zentraleuropa" zeigt schematische Regionsnamen aus dem historischen Modell als Punkte mit Legende — **ohne** Polygone, Linien oder Einfärbungen. `nicht_verifiziert`-Regionen und ungeprüfte Jahre liefern einen definierten Hinweistext statt eines Fehlers. Feature-Flag `VITE_MAP_ZOOM_LEVELS`. 22 neue Tests; GameEngine, Spielstände und die 16 Bezirke unverändert.
- **Historisches Datenmodell, fest in die Engine integriert:** deklarative Epochen, Regionen, politische Systeme und Ämter (`src/history/`) mit Evidenzgrad und Quellenhinweis je Datensatz; Brücke `src/core/HistoricalContext.ts` mit `getHistoricalContext()`, `getRulerDignity()` und dem Event `historicalEpochChanged` (inkl. Chronikeintrag, nur bei echter Epochenänderung). UI zeigt Epoche mit Evidenzgrad und historische Herrscherwürde, bei Abweichung beide Epochen. Keine Grenzpolygone, keine Jahresbindung von Ämtern, getrennte Ämter für römisch-deutschen Kaiser (bis 1806) und Deutschen Kaiser (ab 1871). 49 neue Tests; Simulation und Spielstände unverändert.
- **Automatisierter End-to-End-Kampagnenabschluss** (`src/core/CampaignEndToEnd.test.ts`): vollständiger Lauf von Spielstart über Bauen, Handel, Forschung, Reichsrat, Monatswechsel und Zwischen-Save/Load bis zum Sieg (alle drei Kapitel) mit aktivierten Zufallsereignissen; vollständiger Niederlage-Lauf inklusive Save/Load und dauerhafter Niederlage; Ausschluss „Niederlage ≠ Sieg im selben Monat"; 10-Jahres-Balancing-Protokoll und 5-Jahres-Digitallauf. Sechs Systemkopplungen (Rat, Handel, Forschung, Kultur, Diplomatie, Rivalen) über konkrete Zustandsänderungen nachgewiesen.
- **Interaktive Tutorial-Kampagne** (Bauen → Handeln → Forschen → Reichsrat → Speichern): fünf verbindliche Schritte an den echten Engine-Aktionen, Fortschrittskarte mit Navigation und Ressourcen-Hilfe, Startguthaben, Überspringen und Save/Load-Persistenz; 11 Unit-Tests und 9 Engine-Integrationstests.
- **Echte Niederlagebedingungen** (Bankrott, Hungersnot, Anarchie) über das neue `CampaignDefeatSystem`: monatliche Prüfung mit aufeinanderfolgenden Monaten, Erholungsrücksetzung und dauerhafter Festhaltung; Untergang pausiert das Spiel, schreibt die Chronik und öffnet die Vollbild-Niederlageseite. Schwellen liegen über Minimum-Werten gesunder Läufe und sind konfigurierbar; Save/Load-Migration und Fehlalarmfreiheit automatisiert geprüft.
- P1-Integrationstest der Industrie-Kampagne mit Bauen, Forschung, drei Kapiteln, Save/Load und Sieg sowie 60-Monats-Wirtschaftsstabilität.

- Drei historisch begrenzte Bürgeraufträge aus dem ursprünglichen Ideenbestand: Seuchenhilfe, Bewässerung und Kulturförderung.
- Browserbasierte Hauptoberfläche, mehrere Epochen, sechs Kampagnen und Hotseat (2–4) mit Forschungs-, Handels- und Ratsentscheidungen.
- Vollständige Musikbibliothek mit 15 MP3-Titeln, Covergalerie und Download; fünf MP4-Filme mit Intro-/Outro-/Zwischenszene.
- Bürgeraufträge mit Epochenverfügbarkeit, Kosten, Abschluss und Biografie; Bürgerauswahl berücksichtigt Beruf/Fähigkeiten.
- Wiederkehrende Ratsereignisse merken den früheren lebenden Delegierten, andernfalls Vorauswahl nach fünf Sekunden; Entscheidungen bleiben ausdrücklich nutzerbestätigt.
- Auswirkungen von Beruf, Charakterzügen, Ansehen und Führungserfahrung auf delegierte Ratsentscheidungen.
- Echte Familiengeburten, Eltern-Kind-Beziehungen, schwangerschaftsgebundene Familienmechanik, epochenbezogene Vornamen und echte demografische Geburtenzählung.
- Offline-ZIP für vertrauenswürdiges Heimnetz, PWA-Manifest, Service Worker, Installationsbutton, PNG-Icons und HTTPS-Pages-Workflow.
- Release-Gate in CI für 15 MP3s, fünf MP4-Dateien, Filmdatenbank, ZIP und PWA-Pfade.

### Changed

- Interaktive Karte deckt den Spielbereich ab. Kartenansicht, Bezirke, Zentrieren/Zoom und Bezirksausbau liegen als schwebende Bedienelemente direkt über der Grafik; doppelte Gebäudeliste entfernt; Nachbarreiche werden schematisch am Rand dargestellt.

- Frühere README-Featureversprechen (Rollen, Gebäude, Technologie, Geschichte, Politik, Religion, Militär, Marine, Umwelt, Kultur, Wirtschaft und Mehrspieler) mit konkreten Nachweis- und Integrationsaufgaben in Roadmap/TODO zurückgeführt.
- Dokumente TODO und CHANGELOG nach einem früheren fehlerhaften Austausch wieder ihren korrekten Inhalten zugeordnet.
- Einstellungssystem in fünf responsiven Kategorien gruppiert, auf Startbildschirm und im Spiel erreichbar; Bürgeraufträge, Installation und Animationsschalter aus der Kopfzeile entfernt. Anzeigepräferenzen lokal speicherbar.
- Responsives Tablet-/Mobil-Layout, sichtbare Bürgeraufträge, WebGPU-Start-/Statusanzeige und optionale lokale Mini-KI.
- README, Status, Roadmap und operative TODO werden gegen den tatsächlichen aktiven Git-Stand abgegrenzt; sämtliche älteren Planungen bleiben archiviert.

### Fixed

- Saisonale Produktionsmultiplikatoren beeinflussen nun die tatsächlich gespielten Monate und die identische Monatsprognose; vorher wirkten sie nur im ungenutzten Jahrespfad.

- Kampagnen: Industrie und Wiederaufbau beginnen nicht mehr mit bereits erfüllten ersten Kapitelzielen; Siegmeldung verlangt tatsächlich alle drei abgeschlossenen Kapitel und Fortschrittsanzeige fokussiert das aktuelle Kapitel.

- Historisch eingeschränkte Bürger-/Militäraktionen und Savegame-kompatible Familienbeziehungen.
- Release-Prüfung von Audio-/Filmdateien; Typcheck- und Testfehler aus den zugehörigen Feature-Branches korrigiert.

### Known limitations (unreleased)

- GitHub Pages ist öffentlich verfügbar; reale Installation/Offline-Abnahme auf allen Zielgeräten bleibt offen.
- Keine Endgeräteabnahme für PWA, Medienrechte/Impressum/Datenschutz vor Veröffentlichung offen.
- Generations-Balance, Partnervermittlung, Erbschaften, Online-Mehrspieler und große Epochen-Simulation weiterhin Roadmap-Themen.

## Historische Versionseinträge

Die vollständige alte Versionschronik, einschließlich der alten 2.3.x–2.6.0-Entwicklungsberichte, wurde **wortgetreu** nach [Changelog-Archiv](docs/outdated/CHANGELOG-snapshot-2026-10-17.md) übernommen. Ältere „fertig“-Meldungen sind Projektberichte ihrer Zeit und nicht automatisch Freigaben der jetzigen Standardkampagne.
