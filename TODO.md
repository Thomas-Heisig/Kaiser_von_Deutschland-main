# TODO — Kaiser von Deutschland

## Verbindliche operative Aufgabenliste · Stand 18.10.2026 · Grafikentscheidung nach PR #67

Die Aufgaben entsprechen dem nachgeprüften [Status](docs/00-meta/status.md) und den Meilensteinen der [Roadmap](docs/00-meta/roadmap.md). `[x]` bedeutet im Hauptspiel **implementiert und mindestens automatisiert geprüft**, `[~]` teilweise, `[ ]` offen. Ein in alten Unterlagen als „fertig“ bezeichnetes Modul ist ohne Benutzeroberfläche **nicht** abgeschlossen. Frühere Einträge gingen nicht verloren: [TODO-Archiv](docs/outdated/TODO-snapshot-2026-10-17.md), [README-Ideenbestand](docs/00-meta/backlog-from-readme.md), [historische Roadmap](docs/outdated/roadmap-snapshot-2026-10-17.md).

## Priorisierung: spielbare Kampagnen zuerst (17.10.2026)

### P1a – durchgängiger Kampagnenablauf (vor neuen Großsystemen)

- [~] Industrie-Kampagne jetzt als vollständiger Bau-/Forschungs-/Save-Load-/Sieg-Test abgedeckt; fünfjährige Stabilitätsprüfung für endliche Ressourcen- und Bevölkerungswerte ergänzt. Kapitel-Startbalance für Industrie/Wiederaufbau und Siegstatusanzeige korrigiert; vollständigen Kampagnendurchlauf von Beginn bis Sieg/Niederlage einschließlich Monatswechsel, Zufallsereignissen, Speichern/Laden und Schlusswertung automatisieren. Vorhandene Kapitelziele/Belohnungen sind nur Teilabdeckung.
- [~] Monatsproduktion und Prognose für Sommer-/Winterernte und Holz korrigiert; saisonalen Verlauf in Regressionstest überprüft. Mehrjährige deterministische Balancing-Läufe mit Gold, Nahrung, Forschung, Bevölkerungs- und Stabilitätswerten sowie Kampagnenschwellen protokollieren und Grenzwerte verbessern.
- [ ] Kopplung zwischen Ratsbeschlüssen, Handel, Forschung, Kultur, Diplomatie und Rivalenentwicklung in messbaren Integrationstests nachweisen.
- [ ] Interaktive Tutorial-Kampagne mit Schritten Bauen → Handeln → Forschen → Reichsrat → Speichern und Hilfen bei fehlenden Ressourcen anbieten.
- [x] Chronikeinträge der aktiven Herrschaft im Spielstand begrenzt auf 100 Einträge dauerhaft sichern; Altstände ohne Chronik bleiben ladbar; Test für Speichern/Laden ergänzt.
- [ ] Sieg-/Niederlageseite, Wiederholung, Sandbox-Fortsetzung und Schlussstatistik UI-seitig abnehmen (die bisherige Erfolgsmeldung ist kein vollständiger Kampagnenabschluss).

### P1b – danach Strategie und reaktive Gegner

- [ ] Rivalen auf Wirtschafts-, Handels-, Forschungs- und Militärfortschritte dynamisch reagieren lassen; unterschiedliche Schwierigkeit mit nachvollziehbaren Regeln testen.
- [ ] Diplomatie um Bündnisse, Handelsverträge, Vertragsbruch und konsequentes Reputations-/Rivalenverhalten im Hauptspiel ergänzen.
- [ ] Regionale Hunger-, Wanderungs- und Versorgungslagen als Spielentscheidungen mit Kosten und dauerhaften Auswirkungen verknüpfen.
- [ ] Logistik, Belagerungen und Kriegsgefangene nur nach vollständigem Hauptkampagnen-/Savegame-Test erweitern.
- [ ] Alternative Gewinnstrategien für Handel, Wissenschaft, Kultur und Diplomatie unabhängig vom Krieg end-to-end prüfen.

#- [x] Karte als großflächiger Spielhintergrund mit innenliegenden 2D/3D- und Bezirksfiltern, Zoom/Zentrieren und Bezirksausbau; doppelte Gebäudebutton-Leiste entfernt.
- [ ] Karte und überlagerte Panels auf iPad/Smartphone samt Touch, Fokus, Performance und realen Geräten prüfen; Nachbarpositionen sind zunächst schematisch.

## P1c – Qualität und Zugänglichkeit

- [ ] E2E für neue Partie, Bauen, Handelsgeschäft, Forschung, Ratsentscheidung, Hotseat, Speichern/Laden und Kampagnenziel hinzufügen.
- [ ] Wesentliche Ansichten auf 320/768/1024 Pixel, mobilem Touch und Tastaturnavigation inklusive Fokus und Textskalierung abnehmen.
- [ ] Bevölkerungs- und Simulationslast mit 1.000/5.000/20.000 Bürgern messen, Speicher/CPU-Grenzen dokumentieren und Engpässe beheben.

## P0 — Veröffentlichung und zuverlässiger Betrieb

- [ ] **HTTPS live schalten:** Pages wurde selbst mit `enablement: true` nicht erstellt (`Resource not accessible by integration`); Eigentümer aktiviert Pages in Settings oder verbindet privaten Cloudflare-Pages-Host. **Nicht als deployed deklarieren.**
- [ ] Anschließend echte URL mit HTTPS, HTTP 200/206 für MP3/MP4, korrektes Manifest, Scope und Service Worker messen.
- [ ] PWA-Installation auf iPad/Safari, Android/Chrome und Windows/Edge sowie Offlinebetrieb mit Musik und Video im Flugmodus prüfen.
- [ ] Vor öffentlicher Freigabe Impressum, Datenschutz, Musik-/Video- und Coverrechte, Urheber-/KI-Credits vervollständigen.
- [x] Installationsbutton, PNG-App-Icons 192/512, Offline-ZIP, dynamischer Videokatalog sowie Release-Prüfung der 15 MP3 und 5 MP4 im Build.
- [x] CI Typecheck, Vitest, Build und Chromium-Smoke der aktuellen `main`-Version bestanden.

## P1 — Stabilität, Gameplay, Bürger und Generationen

- [ ] Echte Partnervermittlung und Eheschließungen, regionale Namensräume sowie Geburten-/Sterblichkeitsbalance bei mehrjährigen Simulationen.
- [ ] Ausbildung, Berufe, Arbeitsplätze, Karrierewechsel, Familienbesitz und generationsübergreifende Erbschaften kohärent verbinden.
- [ ] Ratsdelegation: lebender früherer Delegierter / Zufall nach fünf Sekunden / manuelle Auswahl / Tod / Hotseat / Save-Load in vollständigen E2E-Tests abnehmen.
- [ ] Langfristiges Vertrauen, Loyalität, Rivalitäten, politische Fraktionen und regionale Produktion als Folgen von Rats-/Bürgeraufträgen.
- [ ] Ereignis- und Kampagnenschleifen mit historischen Epochen, Konfliktlösung ohne Krieg, technische Einheiten und Balance über Jahrhunderte.
- [x] Chronik begrenzt und in Version-2-Spielständen integriert; große Altstände und Migrationsfälle weiterhin gesondert testen.
- [ ] Größere Spielstände, Bürgerzahlen >5.000 / 100.000, Browser-Latenz, Profiling, Benchmarks, deterministische Langläufe prüfen.
- [ ] Browser-E2E für Hotseat, Save/Load, Ratsentscheidungen, Tutorials und Fortschritt; WCAG und Touchgeräte ergänzen.

- [x] Einstellungen als fünf Tabs bereits im Startmenü und laufenden Spiel zugänglich; Bürgeraufträge nur in Navigation, Animation/Installation ausschließlich in Einstellungen.
- [ ] Einstellungen auf echtem iPad/Android mit Tastatur und Touch abnehmen.

## Grafikkarte – aktive Entscheidung: Kenney Retro (18.10.2026)

- [x] **Retro Fantasy + Retro Textures Fantasy** für das Mittelalter, **Retro Urban** für spätere Epochen verbindlich; Sketch Town ist nur Reserve, nicht zweite parallele Richtung ([Renderer](docs/05-technical-architecture/RENDERER.md)).
- [x] PR #67: geprüfte Kenney-CC0-Vorschaugrafiken in kompaktem Atlas, isolierter PixiJS-Prototyp und Browser-Smoke mit realem Atlasladecheck in `main` integriert.
- [x] Prototyp-Baseline bewusst eingefroren: 144 Kacheln, 1 modular angedeutetes Gebäude, 1 Licht, 24 Rauchpartikel, 30-FPS-Limit. **Preview-Sprites ≠ fertig vorgerendertes GLB-Gebäude.**
- [x] **Erster GLB→2D-Durchlauf:** modulares Kenney-Retro-Fantasy-Haus mit VTK/EGL orthografisch gerendert, transparentes mobiles PNG samt Hash dokumentiert und in den isolierten PixiJS-Prototyp eingebaut; Blender wurde dabei nicht verwendet.
- [ ] Erst Desktop-Chromium visuell/technisch abnehmen; danach Safari auf echten iPad-/iPhone-Geräten nach Messplan prüfen. **Gerätemodelle/OS unbekannt – beim Test erfassen.**
- [ ] Nach bestandenen Messgates genau einen festen Bezirk optional auf Retro-Sprite umstellen; geometrische Fallbacks und vorhandene Kartenauswahl erhalten.


## P2 — Spielerlebnis und Module

- [ ] Historische Video-3/4/5-Inhalte nach tatsächlicher Sichtung epochengetreu benennen und verorten; Audio-/Video-Übergänge auf Geräten prüfen.
- [ ] Hochauflösende Originalcover und vollständige Metadaten/Credits für 15 Musikstücke.
- [ ] WebGPU-Gerätetest (Modell, Lizenz, Download, Speicher, Inferenz), optionale Ollama-/Mini-KI-Reaktionen; KI bleibt Opt-in.
- [ ] Bürgeraufträge und Regionen, Produktion, Transport sowie lokale Sicherheit mit Wirtschaft und Familien verbinden.
- [ ] Vorhandene Legacy-Module (Religion, Marine, Recht, Bildung, Lebensphasen, Tagesrhythmus, Stadt, Ökologie) einzeln im Standardspiel zugänglich machen, nur danach als spielbar markieren.
- [ ] Geführtes Tutorial, historische Szenarien, achtsame Barrierefreiheit und internationales UI.
- [ ] Code-Splitting, Worker, verlässliche lokale Speicherung und optionales Cloud-Sync-Konzept.
- [ ] Vollständige, reproduzierbare Tests für LAN-ZIP und Versionen am Heimnetzserver durchführen.

## P3 — Langfristige Vision / aus README und Roadmap übernommen

- [ ] Online-Mehrspieler mit WebSocket, Reconnect, Lobby, Synchronisation, Schutz vor Betrug; kooperative Herrschaften.
- [ ] Perspektivwechsel für jede Bevölkerungsschicht, Rollen-Mehrspieler, soziale Bewegungen, Bürgerämter und individuelle Politik.
- [ ] Erweiterte historische Ereignisketten, Entdeckungsreisen, Finanzsysteme, Gerichte, Universitäten, Kunst, Medien, ökologische Wirkungen, Globalisierung.
- [ ] Modding-API, Plugins, eigene Szenarien, Replays, Communities, Schul-/Wissenschaftsversion.
- [ ] Electron/Capacitor, Desktop-/Mobile-Distribution, optionale Cloud-Spielstände, lokalisierte Sprachversionen.
- [ ] Perspektivisch 3D-Schlachtfeld, VR/AR, Raumfahrt, Zukunft, alternative Realitäten und prozedurale Narrative.

## Abgleich mit den konkreten Funktionsversprechen der alten README (17.10.2026)

Die historische README enthält detailliertere Funktionsumfänge als der bisherige Sammel-Backlog. **Quelle:** [vollständiges Original](docs/outdated/README-snapshot-2026-10-17.md) und [Ideenbestand](docs/00-meta/backlog-from-readme.md). In der Hauptkampagne sind viele alte Module zwar als Quellcode vorhanden, aber nicht bis zur Bedienoberfläche und zum Spielstand durchgängig verbunden. Deshalb bleiben sie bis zur tatsächlichen Integration offen.

- [x] Drei zusätzliche, epocheabhängige Bürgeraufträge aus alter README in Standardspiel ergänzt: Seuchenhilfe, Bewässerung bei Dürre, Kulturfest; Zeitraumtests ergänzt.
- [ ] Auftragsergebnisse künftig mit tatsächlichen Epidemie-/Klima- und Kultureffekten statt nur Ressourcen- und Zufriedenheitswerten verbinden.

### P1 – Historische Rollen, gesellschaftliche Systeme und Ereignisse

- [ ] **Rollen / Lebenssimulation:** Frühere 15, später 35 Rollen (Kaiser, König, Klerus, Adel, Beamte, Händler, Handwerker, Bauern, Gelehrte; Bankier, Architekt, Spion, Admiral, General, Journalist, Erfinder, Diplomat, Fabrikbesitzer, Philosoph) auf tatsächliche auswählbare Hauptspiel-Rollen abgleichen. Rollenwechsel, KI für nicht gespielte Charaktere, Rollenziele und rollenabhängige UI erst nach Integration als fertig melden.
- [ ] **Lebensphasen:** Kindheit, Schulzeit, Erwachsenenleben, Lehre–Geselle–Meister, monatliches Tagesbudget, drei Zeitmodi (Tag/Monat/Jahr), Charaktererstellung und Persönlichkeit durchgehend im Hauptspiel testen.
- [ ] **Geschichte und Krisen:** Die früher genannten 27 bzw. 70 historischen Ereignisse, zehn Persönlichkeiten, zehn Schlachten, acht Epidemien, acht Katastrophen und Ereignisketten anhand des tatsächlichen Katalogs inventarisieren und epochegerecht im Spiel verknüpfen.
- [ ] **Politik und Diplomatie:** Früher angegebene 33/53 Maßnahmen, acht Politikbereiche, Umwelt-, Digital-, Wissenschafts- und Sicherheitspolitik, Bündnisse, Vasallen, Friedensverträge, Nichtangriffspakte und politische Folgeereignisse mit echter UI/Savegame-Wirkung prüfen.
- [ ] **Bevölkerung und Religion:** Religionen (frühere Angaben sieben bzw. zehn), acht Kulturen, religiöse Bauten, Konversion, kulturelle Spannungen, soziale Netzwerke, Migration, Klassenwechsel und Revolutionen nachvollziehbar integrieren.

### P2 – Originale Domänen und Detailmechanik

- [ ] **Bauten / Forschung:** Historische Versprechen 23/68 Gebäudetypen, 24 Technologien, drei Weltwunder, Spezialbauten und Technologiebaum gegen verfügbare Bau- und Forschungsoptionen zählen und Lücken schließen.
- [ ] **Handel / Verkehr / Wirtschaft:** Zehn Handelsrouten, 15 Transportarten, Bernsteinstraße/Hanse/EU-Binnenmarkt, Routenrisiko, aktive Routen, Einnahmen, Infrastrukturboni, Markt, regionale Produktionsketten, Inflation, Arbeitsplätze und Kohortenwirtschaft spielbar nachweisen.
- [ ] **Umwelt:** Klima, Ressourcenregeneration, Landschaftsumbau, Bewässerung, Tierpopulationen, Artenschutz, historische Naturkatastrophen und Umweltpolitik zeitgebunden integrieren.
- [ ] **Militär und Marine:** Fünfzehn Militäreinheiten, Geländeeffekte, Wetter, Formationen, Nachschub, Belagerungen, Befestigungen, Marine (acht Schiffstypen/zehn Technologien), Seeschlachten, Blockaden, Piraterie und friedliche Alternativen prüfen.
- [ ] **Geheimdienst / Gefangene / Kriegsfinanzierung:** Agenten, Sabotage, Doppelagenten; Gefangenenlager, Austausch, Lösegeld, Fluchten; zwölf Finanzierungsformen, Kriegsanleihen, Kredite, Rückzahlung, Inflation und diplomatische Konsequenzen integrieren.
- [ ] **Städte / Wissen / Kultur / Recht:** Stadtbezirke, Nachtzyklus, Künstler, elf Kunststile, zwölf Kulturereignisse, Medien/Gerüchte/Zensur, Gerichte, Bibliothek, Universitäten, 15 Entdeckungen, zehn Rechts- und zwölf Steuermodelle integrieren.
- [ ] **Wissensquellen:** Historische Wikipedia-Anreicherung nur optional, mit Quellenhinweisen und Cache-/Offline-Verhalten.
- [ ] **Sichtbarkeit und Umfang:** Alte reine Code-Module/Prototyp-Panels zuerst über verknüpfte UI, Engine, Migration und Tests integrieren; danach tatsächliche Zahlen und Verfügbarkeit dokumentieren. Die historische Behauptung über 80 Millionen Bürger ist **nicht** durch Performance-Tests der aktuellen Browser-App bestätigt.

### P3 – Gemeinschaft und Zukunft

- [ ] **Online-Multiplayer:** Sechs Spieler inklusive Bots, Echtzeit/Rundenmodus, öffentliche/private Chats, Lobby, Sitzungen und wiederverbundene Clients sind eigene neue Implementierungsvorhaben; nicht mit 2–4 lokalem Hotseat verwechseln.
- [ ] **Zukunft/Episoden:** 2050/2080/2100/2200, KI-Revolution, Fusion, Raumfahrt, alternative Verläufe, originale Episoden und zukünftige Rollen/Technologien als gesonderte Szenarien mit Konsistenztests realisieren.
- [ ] **Sammlungen/Medien:** Historische Personen und Schlachten, 15 wissenschaftliche Entdeckungen, Kunst, Musik, Videos, Ursprungs-/Lizenzangaben sowie optional vertonte Geschichtserzählung konsistent katalogisieren.

## Qualität und Dokumentation

- [ ] Testabdeckung nachvollziehbar messen und für Kernsysteme schrittweise auf 70 % bringen; Ist-Wert bisher nicht bestätigt.
- [~] Legacy-Architektur und veraltete Berichte systematisch von Live-Dokumentation getrennt; API-Referenz und Handbuch regelmäßig weiter aktualisieren.
- [x] Lokale Markdown-Links in README/TODO/Roadmap/Changelog/Status/Index/Ideenbestand automatisch in CI prüfen.
- [x] Verbindliche Ist-/Plan-Trennung, historische README-, TODO- und Roadmap-Snapshots, aktive Dokumentationsnavigation und Changelog-Reihenfolge angelegt.

**Vollständige historische Ideen:** [README-Ideenbestand](docs/00-meta/backlog-from-readme.md). Ausführliche technische Einträge, frühere PR-Notizen und alle Legacy-TODOs bleiben lesbar im [unveränderten TODO-Snapshot](docs/outdated/TODO-snapshot-2026-10-17.md); ein Archiv-Eintrag ist nicht stillschweigend erledigt.
