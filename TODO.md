# TODO — Kaiser von Deutschland

## Verbindliche operative Aufgabenliste · Stand 24.10.2026 · Gesamte Roadmap beauftragt · GitHub Pages live

Die Aufgaben entsprechen dem nachgeprüften [Status](docs/00-meta/status.md) und den Meilensteinen der [Roadmap](docs/00-meta/roadmap.md). `[x]` bedeutet im Hauptspiel **implementiert und mindestens automatisiert geprüft**, `[~]` teilweise, `[ ]` offen. Ein in alten Unterlagen als „fertig“ bezeichnetes Modul ist ohne Benutzeroberfläche **nicht** abgeschlossen. Frühere Einträge gingen nicht verloren: [TODO-Archiv](docs/outdated/TODO-snapshot-2026-10-17.md), [README-Ideenbestand](docs/00-meta/backlog-from-readme.md), [historische Roadmap](docs/outdated/roadmap-snapshot-2026-10-17.md).

## Priorisierung: spielbare Kampagnen zuerst (17.10.2026)

### Stabilisierung und Integration · 24.10.2026

- [x] [Frühstart und Zeitbilder](docs/09-history-model/ZEITBILD.md): auswählbar ab 2000 v. Chr., bürgerliche Datumsanzeige ohne Jahr null, frühe Darstellung und verfügbare Grundtechnologien. Bauen, Forschung, Reise und Kulturförderung mit Save/Load geprüft.
- [x] Quellengeprüfte Antikenereignisse und kulturelle Lesekarten: Tag/Monat, Jahreskontext, Datierungsspannen und Epochenwissen getrennt. Themenfilter, Region, Quellen und Unsicherheiten sichtbar; Monatswechsel und 20 Startjahre in Chromium geprüft.
- [ ] Weitere regionale Stilunterarten der eingereichten Liste und lückenlose Jahresabdeckung ergänzen; vorhandene Auswahl ersetzt keine vollständige Weltchronik. Jahrtausendelange Balance und echte Geräte bleiben gesonderte Abnahmen.
- [x] Gemeinsames Epochenlayout, Schreibtischstart, sichtbare Flüsse, paginierte Menüs ohne Seitenscrollen; Lagebericht mit Tutorial, Quellen zur Jahresgeschichte und optionaler Ereignisautomatik (PR #96/#97).
- [x] Erste [Strategiewelt-Ausbaustufe](docs/05-technical-architecture/STRATEGY_WORLD.md): Reisen, Entdeckung, alle Nachbarn, gezielter Kartenfokus, eigene Weltpersistenz und Altstandmigration. Chromium-Bedienabläufe mit 20 Nachbarn bei 320/768/1024 px geprüft.
- [~] Gesamte Roadmap einschließlich Großsystemen beauftragt. Diese Ausbaustufe schließt nicht Online-Mehrspieler, freie Bebauung, vollständige GLB-Grafik, Rollen-/Generationenintegration oder VR ab. Die zugehörigen Aufgaben unten bleiben offen.

- [x] Dorf/Welt/Relief-Wechsel, Zoom-Reset und Feature-Flag korrigiert; unsichtbare Bezirke nehmen keine Kartenklicks mehr entgegen. Regionsdaten werden bei neuen Partien erneut geladen.
- [x] Ergebnisdialog: Hauptmenü und Neubeginn räumen die Partie auf; Sandbox-Fortsetzung stellt die Engine tatsächlich auf freie Herrschaft um und bleibt nach Save/Load erhalten. Geladene abgeschlossene Kampagnen zeigen ihre Ergebnisansicht.
- [x] Hotseat-Monatsautosave speichert den nächsten aktiven Spieler. Abgeschlossene Einzelspieler-Kampagnen bleiben bis zur ausdrücklichen Sandbox-Fortsetzung pausiert.
- [x] Konkurrierenden Jekyll-Publisher entfernt; nur der gebaute Vite-Spielstand wird auf Pages veröffentlicht. Offline-Cache-Version aktualisiert.
- [x] Automatisierte Engine-, Karten- und Browserprüfungen ergänzt; Ergebnisdialog, Menü-Rückkehr, neue Partie und persistente Sandbox sind in Chromium geprüft. Echte Safari-/Mobilgeräteabnahme und die langfristigen Open-World-/Grafikaufgaben unten bleiben offen.

### P1a – durchgängiger Kampagnenablauf (vor neuen Großsystemen)

- [x] **Karten-Zoom-Ebenen (Gerüst, Schritt 3):** Schieberegler 0–100 logarithmisch auf Kamera-Zoom 0.4–4.0 abgebildet, gleichwertige „+"/„−"-Buttons; Ebenenwechsel Dorf ↔ Zentraleuropa mit Hysterese (35/40). Ebene „Zentraleuropa" zeigt schematische Regionsnamen aus dem historischen Modell als Punkte mit Legende — bewusst ohne Polygone, Linien oder Einfärbungen. `nicht_verifiziert`-Regionen und ungeprüfte Jahre liefern einen definierten Hinweistext. Feature-Flag `VITE_MAP_ZOOM_LEVELS`. Logik in `src/ui/MapZoomLevels.ts` (22 Tests, ohne PixiJS testbar); GameEngine, Spielstände und die 16 Bezirke unverändert. Offen: echte Relief-Textur (Natural Earth, Public Domain), L2 Nahregion, L0 Tisch, Geräteabnahme. Doku: `docs/05-technical-architecture/MAP_ZOOM_LEVELS.md`.
- [x] **Historisches Datenmodell in die Engine integriert:** Epochen, Regionen, politische Systeme und Ämter als deklarative Daten (`src/history/`) mit Evidenzgrad (`belegt`/`naeherung`/`nicht_verifiziert`) und Quellenhinweis je Datensatz. Brücke `src/core/HistoricalContext.ts` bildet Spieljahre auf Epoche, Referenzsystem und Herrscherwürde ab; `GameEngine.getHistoricalContext()`/`getRulerDignity()` als öffentliche API, Event `historicalEpochChanged` mit Chronikeintrag nur bei echter Epochenänderung. UI zeigt die Einordnung samt Evidenzgrad und die historische Würde; bei Abweichung von der Kampagnen-Epoche werden beide genannt. Keine Grenzpolygone, keine Jahresbindung von Ämtern, keine Teleologie (römisch-deutscher Kaiser und Deutscher Kaiser sind getrennte Ämter). 49 Tests; Simulation, Kampagnen und Spielstände unverändert. Doku: `docs/09-history-model/POLITY_MODEL.md`.

- [~] Industrie-Kampagne jetzt als vollständiger Bau-/Forschungs-/Save-Load-/Sieg-Test abgedeckt; fünfjährige Stabilitätsprüfung für endliche Ressourcen- und Bevölkerungswerte ergänzt. Kapitel-Startbalance für Industrie/Wiederaufbau und Siegstatusanzeige korrigiert; echte Niederlagebedingungen (Bankrott/Hungersnot/Anarchie) sind jetzt implementiert und automatisiert geprüft. **Der vollständige Kampagnendurchlauf von Beginn bis Sieg/Niederlage einschließlich Zufallsereignissen ist nun automatisiert** (`CampaignEndToEnd.test.ts`). Offen bleibt nur die Schlusswertungs-Oberfläche als manuelle Abnahme.
- [x] **End-to-End-Kampagnenabschluss automatisiert:** ein vollständiger Lauf von Spielstart über Bauen, Handel, Forschung, Reichsrat, Monatswechsel und Speichern/Laden bis zum Sieg (Kapitel 3), inklusive aktivierter Zufallsereignisse, deterministischem RNG und einem echten Zwischen-Save/Load. Zusätzlich ein vollständiger Niederlage-Lauf (Bankrott) mit anschließendem Save/Load, ein Ausschlusstest „Niederlage ≠ Sieg im selben Monat" und ein 10-Jahres-Balancing-Lauf mit Jahresprotokoll (Gold, Nahrung, Zufriedenheit, Stabilität, Bevölkerung) sowie ein 5-Jahres-Lauf der Digital-Kampagne. 12 Tests in `src/core/CampaignEndToEnd.test.ts`.
- [x] **Systemkopplung in messbaren Integrationstests nachgewiesen:** Ratsentscheidung → Ressourcen/Zufriedenheit/Stabilität, Handel → Monatsbilanz und Handelsnetz, Forschung → Produktionsboni, Kultur-Fest → Zufriedenheit/Stabilität, Diplomatie-Gesandtschaft → Beziehungen, Rivalenentwicklung über zwölf Monate. Jede Kopplung prüft konkrete Zustandsänderungen, nicht nur Aufrufe.
- [~] Monatsproduktion und Prognose für Sommer-/Winterernte und Holz korrigiert; saisonalen Verlauf in Regressionstest überprüft. Mehrjährige deterministische Balancing-Läufe mit Gold, Nahrung, Forschung, Bevölkerungs- und Stabilitätswerten sowie Kampagnenschwellen protokolliert (10 Jahre Standardkampagne, 5 Jahre Digital-Kampagne). **Offen:** gezielte Grenzwertverbesserung anhand dieser Protokolle.
- [x] Chronikeinträge der aktiven Herrschaft im Spielstand begrenzt auf 100 Einträge dauerhaft sichern; Altstände ohne Chronik bleiben ladbar; Test für Speichern/Laden ergänzt.
- [x] **Echte Niederlagebedingungen** (Bankrott, Hungersnot, Anarchie) als monatliche Prüfung mit aufeinanderfolgenden Monaten, Erholungsrücksetzung und dauerhafter Festhaltung; Untergang pausiert das Spiel, schreibt die Chronik und öffnet die Niederlageseite. Schwellen liegen über Minimum-Werten gesunder Läufe und sind konfigurierbar. Unit-Tests (12) und Engine-Integrationstests (Bankrott/Hungersnot/Anarchie, kein Doppelabbruch, Save/Load-Migration, kein Fehlalarm bei gesundem Reich) ergänzt; Altstände ohne Defeat-Daten bleiben ladbar.
- [x] **Interaktive Tutorial-Kampagne** mit den fünf Schritten Bauen → Handeln → Forschen → Reichsrat → Speichern; verbindliche Reihenfolge, Fortschrittsanzeige, Navigation zum passenden Bereich, Hilfe bei fehlenden Ressourcen und Überspringen. Über „Neue Herrschaft" aktivierbar, mit Startguthaben für den ersten Schritt; der Rats-Schritt ruft eine feste, bedingungslose Ratsangelegenheit auf. Zustand wird im Spielstand gespeichert und nach dem Laden fortgesetzt. 11 Unit-Tests und 9 Engine-Integrationstests (Reihenfolge, Events, Autosave zählt nicht als Speichern, deterministischer Rats-Schritt, Save/Load, Überspringen, Altstands-Kompatibilität).
- [ ] Sieg-/Niederlageseite, Wiederholung, Sandbox-Fortsetzung und Schlussstatistik UI-seitig abnehmen (Sieg- und Niederlageseite existieren jetzt und werden von der Engine geöffnet; manuelle Endgeräteabnahme und vollständiger Kampagnenabschluss mit Zufallsereignissen stehen aus).

### P1b – danach Strategie und reaktive Gegner

- [x] Rivalen reagieren jährlich auf Wirtschafts-, Handels-, Forschungs- und Militärfortschritte; begrenzte Regeln je Persönlichkeit/Schwierigkeit und Chronikgründe getestet.
- [x] Schutzbündnisse, Handelsverträge, Vertragsbruch, Vertrauensverlust/-aufbau und gegenseitige Angriffssperren im Hauptspiel. Fremde Überfälle beenden Handel ohne Prestigeabzug für den Spieler; monatsgenauer Ablauf und Save/Load getestet.
- [ ] Regionale Hunger-, Wanderungs- und Versorgungslagen als Spielentscheidungen mit Kosten und dauerhaften Auswirkungen verknüpfen.
- [ ] Logistik, Belagerungen und Kriegsgefangene nur nach vollständigem Hauptkampagnen-/Savegame-Test erweitern.
- [x] Hanse, Wissenschaft, Kultur und diplomatische Kaiserkrone bis zum Sieg ohne Eroberung inklusive Save/Load geprüft. Finanzierte Testpartien; normale Startbalance bleibt unter P1a offen.

#- [x] Karte als großflächiger Spielhintergrund mit innenliegenden 2D/3D- und Bezirksfiltern, Zoom/Zentrieren und Bezirksausbau; doppelte Gebäudebutton-Leiste entfernt.
- [ ] Karte und überlagerte Panels auf iPad/Smartphone samt Touch, Fokus, Performance und realen Geräten prüfen; Nachbarpositionen sind zunächst schematisch.

## P1c – Qualität und Zugänglichkeit

- [ ] E2E für neue Partie, Bauen, Handelsgeschäft, Forschung, Ratsentscheidung, Hotseat, Speichern/Laden und Kampagnenziel hinzufügen.
- [~] Browserprüfungen bei 320/768/1024 px sowie weiteren Größen; Tastatur-Kartensteuerung, Menüpaginierung, Bericht und Weltreise geprüft. Textskalierung, vollständiger WCAG-/Touchtest und echte Geräte bleiben offen.
- [~] [Messung mit 1.000/5.000/20.000 Bürgern](docs/reports/strategy-population-2026-10-24.md) samt Speicherwerten dokumentiert; Zahlenarray-Kopieraufwand beim Speichern behoben. 20.000 Bürger benötigen weiterhin etwa 380 ms pro Monat inklusive Autosave. Worker, Langläufe/Spitzenverbrauch und Gerätebudgets offen.

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

- [x] PR #93 vervollständigt: 24 texturierte GLB-Kompositionen aus den vorhandenen Kenney-CC0-Originalpaketen als sechs WebP-Atlanten gerendert, Rebuild-Skript und Herkunfts-Hashes eingecheckt. Hauptspiel lädt alle 24 Frames; Antikenpartien verwenden weiterhin frühe Darstellungen. Geräteabnahme und freie Bebauung bleiben offen.

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

**Ist:** `KingdomMap.drawNeighbors()` zeigt alle Nachbarn als schematische Territorien mit Verbindungen, Entdeckungs-/Beziehungsstatus und Heimatmarker. Weltmodell, Regionsfokus und Reisen sind vorhanden; Positionen sind keine historischen Geodaten.

- [x] Vorhandene Rivalendaten mit Beziehungen, Heer, Befestigung, Beutevorrat und Unterwerfung in der Weltansicht zugänglich; Hauptstadt und gesamte Wirtschaftsleistung ausdrücklich unbekannt.
- [ ] Je Nachbar eine unterscheidbare **territoriale Retro-Darstellung**: Länderfläche/Grenze, Wappen- oder Fraktionssymbol, Siedlungen, Straßen-/Handelsverbindungen, Hauptstadt nur falls tatsächlich im Modell vorhanden; Vasallen und Kriegsgegner klar unterscheiden.
- [x] Separate Außenwelt-Ansicht mit stabilen Regionskoordinaten und unbegrenzter Darstellung vorhandener Nachbarn (20 automatisiert geprüft); Heimatbezirke bleiben erhalten.
- [ ] Auf Nachbar tippen/klicken → erreichbare Detailansicht zu Diplomatie/Handel/Krieg und bekannten Kennzahlen; Tastatur und Touch berücksichtigen. Änderungen nur über bestehende validierte Spielaktionen.
- [~] Fit-to-World, Zentrieren und gezielter Regionsfokus auch bei 320 px geprüft; Heimatansicht erhalten. Minikarte und Randmarker bleiben offen.
- [~] 20 Nachbarn, neue/entfernte Regionen, Reise und Save/Load getestet. Vollständige visuelle Matrix aller Epochen und Vasall/Feind/neutral bleibt offen.

### G2 – Open World als gesonderter, phasenweiser Umfang (P1; **nicht als bereits vorhanden kennzeichnen**)

**Ist:** Erste erkundbare Strategiewelt neben der Siedlungsübersicht mit 16 Bezirksankern. Es gibt keine frei begehbare 3D-Welt und kein freies Platzierungsraster. Details und Grenzen: [Strategiewelt-Spezifikation](docs/05-technical-architecture/STRATEGY_WORLD.md).

- [x] **OW-0:** Erste Ausbaustufe als Strategie-Weltkarte spezifiziert; 3D-RPG/VR bleiben getrennte spätere Vorhaben.
- [~] **OW-1 WorldModel:** stabile IDs/Positionen, seedabhängiges Gelände, Verbindungen, Entdeckung und Herkunft der schematischen Geografie implementiert/testbar. Ereignisorte und räumliche Nebelgrafik noch offen.
- [x] **OW-2 Persistenz:** eigenes versioniertes Welt-/Regionsschema im Spielstand, Altstandmigration, validierte Engine-Schnittstellen und Reise-/Ladetests.
- [~] **OW-3 Kamera/Navigation:** Maus/Touch-Ziehen, Tastatur-Pan, Zoom, Zentrieren, Regionsfokus und Heimreise implementiert. Pinch, Minikarte, Culling und Gerätebudgets bleiben offen.
- [~] **OW-4 Interaktion:** bezahlte Reisen, Ankunft/Entdeckung, Nachbarauswahl sowie Handel/Diplomatie integriert. Epochenabhängige regionale Aufträge stehen aus.
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

- [x] Asset-Routing und drei kleine binäre Retro-Vorschauatlanten im Build vorhanden. Vollständige Originalmodelle/hochaufgelöste Renderings bleiben unter G3 offen.
