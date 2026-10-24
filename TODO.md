# TODO — Kaiser von Deutschland

## Verbindliche operative Aufgabenliste · Stand 20.10.2026 · Grafikentscheidung nach PR #67 · GitHub Pages live

Die Aufgaben entsprechen dem nachgeprüften [Status](docs/00-meta/status.md) und den Meilensteinen der [Roadmap](docs/00-meta/roadmap.md). `[x]` bedeutet im Hauptspiel **implementiert und mindestens automatisiert geprüft**, `[~]` teilweise, `[ ]` offen. Ein in alten Unterlagen als „fertig“ bezeichnetes Modul ist ohne Benutzeroberfläche **nicht** abgeschlossen. Frühere Einträge gingen nicht verloren: [TODO-Archiv](docs/outdated/TODO-snapshot-2026-10-17.md), [README-Ideenbestand](docs/00-meta/backlog-from-readme.md), [historische Roadmap](docs/outdated/roadmap-snapshot-2026-10-17.md).

## Priorisierung: spielbare Kampagnen zuerst (17.10.2026)

### P1a – durchgängiger Kampagnenablauf (vor neuen Großsystemen)

- [~] Industrie-Kampagne jetzt als vollständiger Bau-/Forschungs-/Save-Load-/Sieg-Test abgedeckt; fünfjährige Stabilitätsprüfung für endliche Ressourcen- und Bevölkerungswerte ergänzt. Kapitel-Startbalance für Industrie/Wiederaufbau und Siegstatusanzeige korrigiert; echte Niederlagebedingungen (Bankrott/Hungersnot/Anarchie) sind jetzt implementiert und automatisiert geprüft. **Der vollständige Kampagnendurchlauf von Beginn bis Sieg/Niederlage einschließlich Zufallsereignissen ist nun automatisiert** (`CampaignEndToEnd.test.ts`). Offen bleibt nur die Schlusswertungs-Oberfläche als manuelle Abnahme.
- [x] **End-to-End-Kampagnenabschluss automatisiert:** ein vollständiger Lauf von Spielstart über Bauen, Handel, Forschung, Reichsrat, Monatswechsel und Speichern/Laden bis zum Sieg (Kapitel 3), inklusive aktivierter Zufallsereignisse, deterministischem RNG und einem echten Zwischen-Save/Load. Zusätzlich ein vollständiger Niederlage-Lauf (Bankrott) mit anschließendem Save/Load, ein Ausschlusstest „Niederlage ≠ Sieg im selben Monat" und ein 10-Jahres-Balancing-Lauf mit Jahresprotokoll (Gold, Nahrung, Zufriedenheit, Stabilität, Bevölkerung) sowie ein 5-Jahres-Lauf der Digital-Kampagne. 12 Tests in `src/core/CampaignEndToEnd.test.ts`.
- [x] **Systemkopplung in messbaren Integrationstests nachgewiesen:** Ratsentscheidung → Ressourcen/Zufriedenheit/Stabilität, Handel → Monatsbilanz und Handelsnetz, Forschung → Produktionsboni, Kultur-Fest → Zufriedenheit/Stabilität, Diplomatie-Gesandtschaft → Beziehungen, Rivalenentwicklung über zwölf Monate. Jede Kopplung prüft konkrete Zustandsänderungen, nicht nur Aufrufe.
- [~] Monatsproduktion und Prognose für Sommer-/Winterernte und Holz korrigiert; saisonalen Verlauf in Regressionstest überprüft. Mehrjährige deterministische Balancing-Läufe mit Gold, Nahrung, Forschung, Bevölkerungs- und Stabilitätswerten sowie Kampagnenschwellen protokolliert (10 Jahre Standardkampagne, 5 Jahre Digital-Kampagne). **Offen:** gezielte Grenzwertverbesserung anhand dieser Protokolle.
- [x] Chronikeinträge der aktiven Herrschaft im Spielstand begrenzt auf 100 Einträge dauerhaft sichern; Altstände ohne Chronik bleiben ladbar; Test für Speichern/Laden ergänzt.
- [x] **Echte Niederlagebedingungen** (Bankrott, Hungersnot, Anarchie) als monatliche Prüfung mit aufeinanderfolgenden Monaten, Erholungsrücksetzung und dauerhafter Festhaltung; Untergang pausiert das Spiel, schreibt die Chronik und öffnet die Niederlageseite. Schwellen liegen über Minimum-Werten gesunder Läufe und sind konfigurierbar. Unit-Tests (12) und Engine-Integrationstests (Bankrott/Hungersnot/Anarchie, kein Doppelabbruch, Save/Load-Migration, kein Fehlalarm bei gesundem Reich) ergänzt; Altstände ohne Defeat-Daten bleiben ladbar.
- [x] **Interaktive Tutorial-Kampagne** mit den fünf Schritten Bauen → Handeln → Forschen → Reichsrat → Speichern; verbindliche Reihenfolge, Fortschrittsanzeige, Navigation zum passenden Bereich, Hilfe bei fehlenden Ressourcen und Überspringen. Über „Neue Herrschaft" aktivierbar, mit Startguthaben für den ersten Schritt; der Rats-Schritt ruft eine feste, bedingungslose Ratsangelegenheit auf. Zustand wird im Spielstand gespeichert und nach dem Laden fortgesetzt. 11 Unit-Tests und 9 Engine-Integrationstests (Reihenfolge, Events, Autosave zählt nicht als Speichern, deterministischer Rats-Schritt, Save/Load, Überspringen, Altstands-Kompatibilität).
- [ ] Sieg-/Niederlageseite, Wiederholung, Sandbox-Fortsetzung und Schlussstatistik UI-seitig abnehmen (Sieg- und Niederlageseite existieren jetzt und werden von der Engine geöffnet; manuelle Endgeräteabnahme und vollständiger Kampagnenabschluss mit Zufallsereignissen stehen aus).

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

- [x] **HTTPS live geschaltet:** GitHub Pages aktiv unter https://thomas-heisig.github.io/Kaiser_von_Deutschland-main/ – PWA, Offline-Modus und alle Medien bestätigt.
- [x] Echte URL mit HTTPS, HTTP 200/206 für MP3/MP4, korrektes Manifest, Scope und Service Worker gemessen.
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
- [x] Die 16 festen Bezirke besitzen im Hauptspiel Kenney-Retro-Darstellungen (PR #72), Umschalter zwischen 2D und Retro steuert den Pixi-Renderer (PR #73); deterministische Retro-Landschaft eingefügt. GameEngine und Savegames unverändert.
- [~] Die 16 Bezirke besitzen nun differenzierte Retro-Silhouetten und Bauzustands-Deckkraft. Für **vollständige** Epochen-Grafik fehlen weiterhin umfangreiche Originalmodelle und hochauflösende Gebäuderenderings, Endgerätetests und Performance-Baseline. Die drei kleinen Vorschaustreifen sind seit PR #80 eingecheckt.


## P0/P1 – Vollständige Welt- und Retro-Grafikintegration (verbindlicher Abnahmeplan, 18.10.2026)

**Definition „vollständig“:** Sichtbar und interaktiv in der echten Produktionskette `src/main.ts → KingdomGameUI → KingdomMap`, auf Desktop und Mobilgeräten getestet, mit Produktionsbuild und öffentlichem HTTPS-Deployment belegt. Grafiken in der ZIP oder reine Platzhalter/Entwürfe zählen **nicht** als fertig. Derzeitige 16 Bezirke und die Retro-Asset-Ladepipeline sind ein nutzbarer Anfang, **keine** fertige Open World.

### G0 – Bestandsaudit und sichere Grundlage (P0)

- [x] Grafikwahl verbindlich: Kenney Retro Fantasy / Retro Textures Fantasy (frühe Epochen), Retro Urban (späte Epochen); Sketch Town nur Reserve.
- [x] 16 Bezirke, Basis-Retro-Atlanten, aus GLB gerendertes erstes Haus, Umschalter 2D/Retro, Texturakzente und mobile Chromium-Regression im Hauptspiel vorhanden (PR #67–#83); alte GameEngine-Spielstände bleiben unverändert.
- [ ] Nach PR #83 GitHub-`main`, Browser-Smoke-Screenshots und aktuellen Asset-Bestand gemeinsam auf Desktop, 375px und Tablet visuell prüfen. Nicht nur DOM-/Ladeindikatoren; sichtbare Karte, Schärfe, Lesbarkeit und Klicktreffer tatsächlich abnehmen.
- [ ] `RENDERER.md`, `ASSETS.md`, README, Roadmap und alte P0-Pages-Hinweise abgleichen: bereits gemergte Teile nicht doppelt als offen aufführen; tatsächlich ausstehende Teile nicht als fertig markieren.
- [ ] GitHub-Pages-Deployment von `main` per HTTP/HTTPS, Manifest, SW-Version, Cache-Busting und Test der Assets unter dem Repo-Unterpfad prüfen; Fehlveröffentlichung und veraltete Offline-Caches abfangen.
- [ ] Explizite Abnahmematrix pflegen: Asset-Quelle/Lizenz/Hash, Ziel-Epoche, Bezirk, Grafikzustände, Tests und Geräteergebnis pro Eintrag.

### G1 – Nachbarreiche als erkennbare, bedienbare Welt (P0)

**Ist:** `KingdomMap.drawNeighbors()` zeichnet maximal sechs schematische Ellipsen außerhalb der zentralen Siedlung, mit Namen und Vasallenstatus. Das ist **noch keine Weltkarte**. Nachbarpositionen sind keine historischen Geodaten.

- [ ] Nachbarn vollständig aus den vorhandenen `RivalRealm`-Daten inventarisieren (Name, Diplomatie, Wirtschaft, Stärke, Unterwerfung, Veränderungen); fehlende Daten ausdrücklich unbekannt anzeigen, nichts erfinden.
- [ ] Je Nachbar eine unterscheidbare **territoriale Retro-Darstellung**: Länderfläche/Grenze, Wappen- oder Fraktionssymbol, Siedlungen, Straßen-/Handelsverbindungen, Hauptstadt nur falls tatsächlich im Modell vorhanden; Vasallen und Kriegsgegner klar unterscheiden.
- [ ] Außenwelt-Ebene unabhängig von den 16 Bezirken erstellen; echte Weltkoordinaten/Regionenmodell einführen, statt nur sechs Offscreen-Ellipsen.
- [ ] Auf Nachbar tippen/klicken → erreichbare Detailansicht zu Diplomatie/Handel/Krieg und bekannten Kennzahlen; Tastatur und Touch berücksichtigen. Änderungen nur über bestehende validierte Spielaktionen.
- [ ] Überlagerungen/Pan/Zoom/Minikarte so gestalten, dass Nachbarn auf 375px **auffindbar** bleiben (Fit-to-World, Zentrieren, Marker für außerhalb des Bildschirms liegende Reiche); bisherige 16-Bezirke-Karte als Heimatansicht erhalten.
- [ ] Rivalenanzahl > sechs, neue/entfernte Rivalen, historische Epochengrafik, Vasall/Feind/neutral und Save-/Load-Verhalten automatisiert testen.

### G2 – Open World als gesonderter, phasenweiser Umfang (P1; **nicht als bereits vorhanden kennzeichnen**)

**Ist:** Die aktuelle Karte ist eine feste Siedlungsübersicht mit 16 Bezirksankern und schematischen Nachbarn. Es gibt weder eine frei begehbare Welt noch ein persistentes Platzierungsraster. „Open World“ ist eine Produktvision und benötigt bewusst eine eigene technische Entscheidung.

- [ ] **OW-0 Konzept/Scope verbindlich beschließen:** zuerst eine frei erkundbare, zoombare **Strategie-Weltkarte** mit Regionen, Wegen und dynamischen Nachbarn; keine Behauptung einer frei begehbaren 3D-RPG-Welt. Letztere ist nur langfristige Option.
- [ ] **OW-1 WorldModel:** stabile Regions-IDs, Koordinaten/Kamera, Gelände, Grenzen, Verbindungen, Herkunft von Weltpositionen, Fog-of-War/Entdeckung und Ereignisorte; deterministische Generierung mit Seed und reproduzierbaren Tests.
- [ ] **OW-2 Persistenz:** versioniertes Welt-/Regionsschema und Migration für Alt-Spielstände; keine Änderung an der aktuellen GameEngine ohne spezifizierte Schnittstellen und Tests.
- [ ] **OW-3 Kamera/Navigation:** freie Bewegung per Touch/Maus/Tastatur, Zoom, Zentrieren, Minikarte, „Zur Heimat“, Region finden, begrenztes Culling und Performancebudgets.
- [ ] **OW-4 Interaktion:** Regionen erkunden, Nachbarn besuchen/auswählen, Handel/Diplomatie/Reisen als klar geregelte Aktionen; passende epochen- und ressourcenabhängige Aufgaben statt generischer Platzhalter.
- [ ] **OW-5 Ausbau (separat, später):** freie Bebauung nur nach eigener Raster-/Bauplatz-/Kollisions-/Pfadfindungs-Spezifikation; die 16 Bezirke bis dahin beibehalten.
- [ ] **OW-6 Abnahme:** End-to-End vom Start über Erkundung, Ortswechsel, Diplomatie/Handel, Speichern/Laden bis zum Fortsetzen auf iPhone/Tablet/Desktop.

### G3 – Vollständige Retro-Grafikproduktion (P0/P1)

- [~] Drei **kleine** Retro-Atlanten (Fantasy, Urban, Textures) als PNG-Binärdateien in `main` integriert; Epochen-Routing und Materialakzente vorhanden. Sie sind 16px-Vorschaumotive, **nicht** die vollständigen 105/124 GLB-Modelle bzw. 119 Texturdateien.
- [ ] Komplettes Originalasset-Inventar mit Dateinamen, CC0-Nachweis, SHA-256, Modellrolle, Epoche, Materialzuweisung und Prüfvorschau erstellen; Duplikate/ungeeignete Assets ausschließen.
- [ ] Reproduzierbare Batch-Pipeline **GLB → 2D** für die notwendigen Gebäudetypen aufbauen (fester orthografischer Kamerawinkel 45°/30°, Scale, Licht, transparente PNG/WebP, Schatten, Metadaten, deterministischer Atlas-Packprozess).
- [ ] **16 Bezirke vollständig gestalten:** je Kategorie eindeutige hochauflösende Gebäude/Szenen statt derselben Fenster-/Tür-Vorschau; Bauzustände 0/1/mehrere, Upgrade-Stufen, Industrie-/Moderne-Wechsel und Auswahlmarkierung.
- [ ] Mauern, Stadttore, Straßen, Brücken, Wasser/Hafen, Grünflächen, Felder, Bergwerke, Marktstände und Wege als konsistente, zusammenhängende Landschaft mit sauberen Übergängen darstellen; keine unverbundenen Streukacheln.
- [ ] Retro Urban für spätere Epochen mit tatsächlichen passenden Gebäuden/Verkehr/Industrieanlagen verwenden; Retro Textures Fantasy für Oberflächen nach Material/Region statt zufälliger Bodensprenkler.
- [ ] Nachbarn (G1), Weltregionen (G2) und Hauptstadt/Siedlungen mit derselben Bildsprache vereinheitlichen; Zeichentiefen/Y-Sortierung und Pixel-/Skalierungsqualität kontrollieren.
- [ ] PixiJS-Sprite-Atlas/Texture-Caching und gestaffeltes Laden, Frustum-Culling, Gerätespeicher-Grenzen und degradierbaren Fallback für schwächere Geräte ergänzen.
- [ ] Originalität/Urheberrechte und vollständige Mediencredits getrennt vom MIT-Code dokumentieren; Benutzervorgaben (hellere natürliche Farben, warmes Licht, nicht Sketch Town) visuell abnehmen.

### G4 – Qualität, Mobile und Release (P0-Abnahme)

- [ ] Auf echten iPhone- und iPad-Geräten Modell/iOS/Safari-Version, Portrait/Landscape, Karten-Sichtbarkeit, Touch-Pan/Pinch, HUD-/Modal-Überlagerungen, Schärfe, Karten-Nachbarn, Zoom und Orientierung prüfen.
- [ ] Leistungsbudget auf echten Geräten: 30-FPS-Ziel, P95 Frame-Abstand ≤ 50 ms, 3 × 120 s plus 10 Minuten Stabilität, kein wiederholter WebGL-Kontextverlust, keine dauerhafte Speicherzunahme > 40 MB; Messdaten inklusive Build-SHA ablegen.
- [ ] Funktionale E2E-Gates für jede Epoche und alle 16 Bezirke: Assets HTTP 200, visuell sichtbare Grafik statt bloß erfolgreichem Promise, Auswahl/Bedienung, Nachbar-Detailansicht, Weltnavigation, Save-/Load.
- [ ] Screenshot-Golden-Tests auf 375px, 768px, 1024px, 1440px und echte Safari-Stichproben; Asset-/Bundlegrößen gegen dokumentierte Baseline prüfen.
- [ ] GitHub Pages/PWA öffentlich ausliefern, Version/Cache im UI anzeigen, Update-Pfad und Offline-Installation demonstrieren, echte Freigabe-URL prüfen.
- [ ] **Finale Abnahme:** ein kompletter Kampagnendurchlauf und eine Open-World-/Nachbarreise auf Desktop und Mobil mit nachvollziehbarem Prüfprotokoll. Erst dann „vollständige Grafik-Integration“/„Open World fertig“ behaupten.

**Empfohlene Reihenfolge für sichtbare Erfolge:** G1 Nachbarn **anklickbar und auffindbar** → G3 erste 3 hochwertige Bezirksszenen → G3 alle 16 → G2 OW-0/OW-1 Weltkarte → G2 Reisen/Interaktionen → G4 echte Geräte + Deployment + Release. Diese Schritte als kleine, einzeln testbare PRs durchführen.

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

- [~] Mobiler Retro-Regressionstest (375×812): Pixi-Canvas, Asset-Ladezustand, Overlay-Transparenz, 2D/Retro-Wechsel und Screenshot in Chromium CI; echtes iPhone/iPad Safari weiterhin ungeprüft.

- [~] Asset-Routing für drei optionale Retro-Atlanten im Kartenrenderer: Fantasy für ältere Epochen, Urban für spätere. Noch fehlen die binären Atlanten im GitHub-Build; bis dahin bleibt das bestehende Bildmaterial aktiv.
