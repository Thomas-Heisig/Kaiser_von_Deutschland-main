## 🏰 Zwei weitere Kampagnen (PR in Prüfung)
- [x] „Glaube und Kultur“: drei Kapitel zu Kirchen, Bildung, Kultur und Zufriedenheit.
- [x] „Der Weg zur Kaiserkrone“: Burgen, Märkte, aktive Nichtangriffspakte, Handel, Eroberungen.
- [x] Ziele werden aus echtem Staats- und Vertragszustand berechnet; Spielstände bleiben kompatibel.
- [x] Kapitel- und Chromium-Browser-Tests um die beiden Kampagnen erweitert.

## 🛡️ Grenzwache und Spieleraktionen (PR in Prüfung)
- [x] Spieler kann für 300 Gold und 150 Holz eine Grenzwache alarmieren.
- [x] Der nächste Simulationsmonat erhält echten Verteidigungsbonus (+30 Prozentpunkte Führungsbonus, gedeckelt auf 50 %); Aktion wird auch ohne Überfall verbraucht.
- [x] Hotseat-Reichstrennung, Speichern/Laden, doppelte Vorbereitung und Kosten geprüft.
- [ ] Ausführliche Gelände-, Belagerungs- und Logistikentscheidungen samt Interaktionsanimationen.

## ⚔️ Game-Action-Animationen (PR in Prüfung)
- [x] Gegensätzliche Truppformationen (14 Figuren) laufen bei Gefechten sichtbar aufeinander zu.
- [x] Der Sieger erhält eigene farbliche Hervorhebung; Animation verändert nie das Kampfergebnis.
- [x] Begrenzte Laufzeit, Timer-Cleanup und Abschaltung bei reduzierter Bewegung berücksichtigt.
- [ ] Echte Schlachtkartographie, Pfeilsalven, Gebäudeschäden, authentische Audio-Samples und umfassende visuelle Abnahme.

## 🔬 Wissenschaftliche Errungenschaften mit echten Auswirkungen (PR in Prüfung)
- [x] Abgeschlossene Technologien verbessern nun tatsächlich Bildung, Kultur, Handelsmacht, Stabilität und teilweise Militärausrüstung.
- [x] Nahrung, Rohstoffe und Gold erhalten begrenzte, pro Monat berechnete Forschungsboni, ohne kumulativ den Produktionsbasiswert zu verändern.
- [x] Forschungsgeschwindigkeit wirkt auf neue monatliche Forschungspunkte.
- [x] Forschungsansicht zeigt aktuelle Boni an; Rechenlogik mit Unit-Tests abgedeckt.
- [ ] Langzeit-Balancing von Forschungseffekten, Rückwirkungsstrategie für ältere Spielstände und vollständige Prüfung im Browser.

## 🎮 Mehr Kampagnen und Game-Actions (PR #14 gemergt, Kapitel-Fortsetzung in Prüfung)
- [x] Sechs auswählbare Kampagnen: Aufbau, Hanse, Wissenschaft, Grenzland, Kultur und Kaiserkrone, mit jeweils sechs Live-Zielen.
- [x] Wissenschaftliche Errungenschaften erscheinen als sichtbare Ereignisaktion mit Map-Puls und Klang.
- [x] Überfälle und Feldschlachten lösen Game-Action-Banner und Kartenmarkierung aus.
- [~] Je drei Kampagnenkapitel und dauerhafte Belohnungen integriert; komplexe Verzweigungen, realistische Audio-Samples und tiefere historische Geschichten offen.

# ✅ TODO – Kaiser von Deutschland

**Stand**: 16. Oktober 2026 · **Paketversion**: 2.5.1 · **Standard-Einstieg**: Aufbaukampagne (`KingdomGameUI`)

Konsolidierte Aufgabenliste aus allen Roadmaps, Statusberichten und Implementierungsreports.
Abgeschlossene Arbeiten stehen im [CHANGELOG](./CHANGELOG.md).

**Quellen**: [Roadmap](./docs/00-meta/roadmap.md) (382 offene / 180 erledigte Punkte),
[Status](./docs/00-meta/status.md), [Vision](./docs/00-meta/vision.md),
[Gameplay-Prüfung](./GAMEPLAY_TESTING_GUIDE.md), [Reports](./docs/reports/), Code- und Git-Stand.

**Legende**: 🔴 P0 blockierend · 🟠 P1 hoch · 🟡 P2 mittel · 🟢 P3 niedrig · 🔮 Vision ·
👥 = Mehrspieler-Anteil · `[~]` = teilweise umgesetzt

---

## ✅ Erste Gameplay-Ausbaustufe – Reichsrat (PR #1 bereits gemergt)

- [x] Sechs spielbare Ratsdilemmata (Ernte, Grenze, Gilden, Intrige, Winter, Gelehrte).
- [x] Jeweils drei Entscheidungen mit überprüften Kosten, konkreten Folgen und teils Erfolgschance.
- [x] Reichsrat als Bereich der Aufbaukampagne mit Warnhinweis, Ergebnis und Ereignisverlauf.
- [x] Reichsspezifische offene Beschlüsse und Verlauf im Savegame; alte Spielstände bleiben ladbar.
- [x] Hotseat: keine Weitergabe des Zuges bei ungeklärtem Beschluss.
- [x] Unit-Tests für das neue Ratssystem hinzugefügt (lokale Ausführung und CI noch prüfen).
- [x] CI, Typecheck und Build bestanden; automatisierter Chromium-Smoke-Test für Desktop und 320 × 740 mit Navigation in PR #8 erfolgreich. Vollständige manuelle Abnahme separat offen.
- [~] Ereignispool von 6 auf 12 Dilemmata erweitert; deterministische 10.000er Kalibrierungstests für Risikowahrscheinlichkeiten ergänzt. Langzeit-Kampagnensimulation und ökonomisches Balancing noch offen.

## ✅ Lebendige Welt – PR #3 gemergt, Erweiterung in Prüfung

- [x] Prozedurale Umgebungsgeräusche mit Ein-/Ausschalter und szenenbezogener Umschaltung.
- [x] Dezente Kartenbewegungen mit Pausenmechanismus, 30-FPS-Limit und Reduced-Motion-Unterstützung.
- [x] Bereits vorhandenes Diplomatiesystem in NPC-Nachbarschaft eingebunden (Gesandtschaften/Beziehungen).
- [x] Diplomatie wird im Spielstand persistiert; Integrationstest hinzugefügt.
- [~] CI/Build und Desktop/320px Chromium-Smoke-Test erfolgreich; Lautstärkeregler, Reduced Motion und stumme Voreinstellung vorhanden. Hör- und vollständige WCAG-Prüfung noch offen.
- [~] Pfadgebundene animierte Passanten und Schornsteinrauch ergänzt; zusätzliche Kulturklänge und Lautstärke steuerbar. Vollständige Gebäudeanimationen, realistische Sample-Geräusche und echte Bürgerpositionsdaten noch offen.

## ✅ Kulturkalender in der Aufbaukampagne – PR #4 gemergt, Integration fortgesetzt

- [x] Bestehende Kulturevent-Daten für Jahrestage und Jahreszeiten spielbar.
- [x] Feste verbrauchen Gold und Nahrung und beeinflussen Zufriedenheit/Stabilität.
- [x] Jährliche Obergrenze pro Reich, Save/Load und Integrationstest ergänzt.
- [~] CI/Build und Chromium-Smoke-Test der Kulturansicht erfolgreich; Religion (dominanter Glaube, Einfluss, Religionsfreiheit) im Kulturpanel lesbar. Reichsspezifische Verwaltung noch offen.

## ✅ Rivalen-Dynamik – PR #5/#6 gemergt
- [x] Drei strategische NPC-Profile mit unterschiedlicher jährlicher Entwicklung.
- [x] Militärisches Wachstum auf das Fünffache des Ausgangswertes begrenzt.
- [x] NPC-Entwicklung als Chronikmeldung angezeigt und im vorhandenen Kriegsspeicher gesichert.
- [x] Tests für Strategievarianten, Speicherstände und vorbereitete Angriffsunterdrückung ergänzt.
- [x] Verhandelte zweijährige Nichtangriffspakte mit realer Angriffssperre und Überfallschutz integriert; Ablauffrist und Save/Load berücksichtigt.
- [~] CI für PR #5/#6 bestanden; Chromium-Smoke-Test Desktop/320px für PR #8 erfolgreich; umfassende visuelle QA und manuelle Abnahme offen.

## 🔴 P0 – Sofort (Build & laufende Arbeit)

- [x] **Build reparieren**: Forschungsansicht integriert; `npm run check`, Tests und Produktionsbuild
      bestehen wieder.
- [~] **Forschung pro Reich abschließen** (`PlayerTechnologySystem` ist in `src/core/TechnologySystem.ts` bereits committed):
  - [x] Forschungspunkte aus Schulen/Universitäten, ein Projekt je Reich
  - [x] Speichern/Laden des Forschungsstands (`technologyProgress` im Spielstand)
  - [x] Handelsrouten prüfen erforschte Technologien (neue Technologie „Hochseesegeln“)
  - [x] Forschungsansicht und Handelsrouten im Hauptspiel bedienbar gemacht
  - [x] Browserablauf für Hochseesegeln manuell geprüft (Forschung nach zwei Monaten abgeschlossen)
  - [ ] Hanseroute im echten Browser aktivieren: Forschungscode vorhanden; Aktivierung benötigt zusätzlich
        einen Hafen und 15.030 Gold, die im geprüften Spielstand fehlten
  - [x] Unit- und Integrationstests für `PlayerTechnologySystem` und `GameEngine.startResearch()`
  - [x] [GAMEPLAY_TESTING_GUIDE.md](./GAMEPLAY_TESTING_GUIDE.md) und
        [API_REFERENCE.md](./docs/05-technical-architecture/API_REFERENCE.md) ergänzt
  - [x] Committed und durch CI-Typprüfung abgedeckt
- [x] **Repository aufräumen**: Playwright-Artefakte (`.playwright-mcp/`, 5 getrackte Dateien) aus Git entfernen
      und in `.gitignore` aufnehmen

## 🟠 P1 – Stabilisierung & Konsistenz

### Bekannte Probleme (aus Status-Bericht)
- [~] Soziale jährliche Beziehungsbildung: quadratische Gesamtsuche durch regional begrenztes Sampling ersetzt (PR #8); Lasttest für >5.000, 100.000+ Bürger und vollständige Simulation noch offen.
- [~] Ablauf alter Gerüchte und Begrenzung der Verbreitungsereignisse implementiert; systemweites Profiling und Objekt-Pooling noch offen.
- [~] Große Spielstände: gzip-Kompression mit Rückwärtskompatibilität implementiert; vollständige Kohortenmigration und Größen-/Latenzbenchmarks stehen noch aus.
- [~] Chromium-Smoke-Test bei 320 × 740 prüft Layoutüberlauf und Navigation erfolgreich (PR #8); manuelle Detailprüfung weiterer Screens offen.
- [ ] ⚠️ Einige historische Events fehlen
- [~] Erste spielbare Anleitung im Hilfebereich und Handelsrouten-Voraussetzungen ergänzt; interaktiver mehrstufiger Tutorial-Modus noch offen.

### Code-Duplikate & technische Schulden
- [~] Stadtviertel-Varianten klassifiziert und Legacy markiert; Datenmodell-Konverter und vollständige Zusammenführung offen
- [~] Belagerungs-Varianten klassifiziert und Legacy markiert; Semantik-/Savegame-Migration offen
- [~] SQL-Adapter kontrastiert: `core/database/*` als Zielarchitektur dokumentiert, alte Variante markiert; API-Bridge/Migration offen
- [~] Migrationsschemata 001/002 dokumentiert und ältere Schiene als Legacy markiert; Datenmigration offen
- [x] Alte Oberflächen (`UIFlowManager`, `GameUI`, `EnhancedPixiRenderer`, Roadmap-Panels) als Legacy gekennzeichnet;
      Funktionsübernahme in die Aufbaukampagne und anschließendes Entfernen bleibt offen (siehe Konsolidierungsplan).
- [~] `any` aus JSON-Initialisierung und Ressourcenbudgets in `TechnologySystem` entfernt; verbleibende Typen in weiteren Modulen offen

### Dokumentation synchronisieren
- [x] Paketversion 2.5.1 als Referenz in aktuellem Status/Architektur/Roadmap gesetzt; historische Reports bleiben als datierte Entwicklungsberichte
- [x] [status.md](./docs/00-meta/status.md) auf 17.10.2026 aktualisiert, inklusive belegter Kampagnenfunktionen und offener Lücken
- [~] Roadmap-Status abgeglichen: implementierte Klassen vs. spielbar integrierte Features unterschieden
- [x] Kapitel=Funktionskatalog, Episoden=Content-Roadmap, alte Zeitpläne=Archiv in Roadmap explizit eingeordnet
- [~] Betriebshandbuch und Systemkonsolidierungsleitfaden ergänzt; fehlende Domains weiterhin offen

### Qualitätssicherung
- [ ] Testabdeckung von ~40 % auf 70 % erhöhen (Kernsysteme zuerst)
- [ ] Integrationstests für die Aufbaukampagne erweitern
- [ ] E2E-Tests mit Playwright (Startseite, Bauen, Hotseat, Speichern/Laden)
- [ ] Accessibility-Tests (WCAG 2.1) und Cross-Browser-Tests
- [ ] Profiling & Benchmarks (FPS: < 30 bei > 10.000 Bürgern)

## 🟡 P2 – Nächste Features (v2.6.x – v2.7)

### Integration vorhandener Systeme in die Aufbaukampagne
Viele Systeme existieren in `src/core/`, sind aber nicht im Standard-Einstieg erreichbar.
- [~] Diplomatie (`DiplomacySystem`) – Gesandtschaften, Beziehungen und zweijährige Nichtangriffspakte mit tatsächlichem Überfallschutz integriert; Allianzen, Handel und komplexe Vertragsbrüche noch offen
- [~] Religion & Kultur: saisonale Feste aus `ReligionSystem` mit tatsächlichen Kosten/Effekten integriert; Religion, Künste und Kulturkreise noch offen
- [~] Bevölkerungsdynamik, Migration, soziale Mobilität und Hungersnöte: Weltansicht zeigt Bürger, Migration und Hungersnöte aus bestehenden Systemen; steuerbare Reichsmaßnahmen und kohärente regionale Simulation noch offen
- [~] Klima, Naturkatastrophen, Landschaft und Tierpopulationen: Spielansicht „Welt & Volk“ zeigt vorhandene Echtzeitstatistiken; stärkere Gameplay-Effekte noch offen
- [~] Belagerung, Formationen, Logistik, Marine, Kriegsfinanzierung, Kriegsgefangene: spielbare Rüstungsdarlehen mit echten Tilgungsraten und Spielstandintegration; Belagerungen, Logistik, Formationen, Marine und Gefangenenverwaltung noch nicht in der Hauptkampagne spielbar
- [~] Spionage mit Agentenanwerbung und Informationsmissionen in der Kampagne, pro Spieler getrennt und gespeichert; Sabotage, Untergrundbewegungen und Propaganda noch offen
- [ ] Universitäten, Bibliotheken, Nobelpreise, Bildungsreformen
- [ ] Recht & Gerichte, Bürgerrechte, Währung/Finanzen, Mode
- [ ] Lebensphasen-System (`LifePhaseSystem`, `MonthlyPlannerSystem`, `CareerPathSystem`)

### Datenbank-Integration (v2.4.0 – Restarbeiten)
- [ ] Daten-Migration von LocalForage zu SQLite
- [ ] GameEngine Save/Load über `DatabaseAdapter`
- [ ] Performance-Tests mit 100.000+ Datensätzen
- [ ] Cloud-Sync-Prototyp

### Gameplay-Modi-System (v2.4.0)
- [~] `GameplayModeManager` und Typdefinitionen vorhanden, Migration `002_gameplay_modes`
- [ ] `IntensityScaler` für 4 Achsen
- [ ] `PerspectiveFilter` für Rollen
- [ ] UI: `GameModeSelector`, `IntensityConfigurator` (Slider), `RoleSelector` mit Perspektiven
- [ ] 👥 Individuelle Spielereinstellungen
- [ ] Tests für Modi und Intensitäten

### Offene Kern-Features
- [ ] Wissenschaftliche Kontroversen und Paradigmenwechsel (v3.1.2)
- [ ] Verwaltungsreformen und Digitalisierung (v3.2.0)
- [ ] Steuerhinterziehung und Steueroasen (v3.3.0)
- [ ] 3D-Schlachtfeld-Ansicht als optionales Overlay (v2.3.5)

### Spielerlebnis & UX
- [ ] Interaktives Tutorial / Tutorial-Kampagne
- [ ] Historische Szenarien (z. B. „Der Dreißigjährige Krieg“), Herausforderungs- und Sandbox-Modus
- [x] Autosave nach jedem abgeschlossenen Monat (`autosave`), manueller Slot `campaign` bleibt erhalten; Fehler werden gemeldet.
- [ ] Chronik über Sitzungen hinweg speichern (aktuell nur letzte 100 Meldungen pro Sitzung)
- [~] KI-Gegner: drei eigenständige NPC-Entwicklungsprofile (Räuber, Festungsbau, Handel), jährliche Entwicklungen und Chronik umgesetzt; adaptive Reaktionen, Verhandlungen und Schwierigkeitsgrade folgen
- [ ] Automatisierung: Gouverneure, Auto-Handel, Produktionsketten, Vorlagen, Shortcuts

## 🟢 P3 – Mittelfristig (v2.8 – v3.x)

### Mehrspieler (online)
Aktuell gibt es nur lokales Hotseat (2–4 Spieler). Online-Mehrspieler fehlt.
- [ ] WebSocket-Server, Lobby mit Matchmaking, Zustandssynchronisierung, Reconnect, Anti-Cheat
- [ ] Kooperative Modi: Teams, gemeinsame Siegbedingungen, Ressourcenhandel unter Verbündeten
- [ ] Ranglisten, Saisons, Achievements, Spielerprofile
- [ ] 👥 Rollen-Mehrspieler aus allen Roadmap-Kapiteln (~150 Punkte, z. B. Bürger übernehmen,
      Bewegungen anführen, Spionage zwischen Spielern, Richter/Anwälte, Bürgermeister von Vierteln,
      Händler/Bankiers, Delegierte, Diplomaten in Echtzeit)

### Content-Erweiterung (v2.3.0-Plan)
- [ ] 50+ weitere historische Ereignisse, Ereignisketten (Renaissance, Aufklärung), regionale Events
- [ ] Alternative Geschichte (What-If) und dynamische Event-Generierung
- [ ] 10 neue Rollen, 30+ neue Gebäude, Weltwunder
- [ ] 20+ neue Politikmaßnahmen (Umwelt, Digital, Wissenschaft, Sicherheit)

### Globalisierung & Kolonialismus (v3.4.0 – v3.5.0)
- [~] Kolonialverwaltung datenseitig vorhanden (`colonial-systems.json`, `RoadmapFeaturesManager`)
- [ ] Überseegebiete erkunden, Plantagenwirtschaft, Unabhängigkeitsbewegungen spielbar machen
- [ ] Handelskompanien, Warenbörsen, globale Lieferketten (ab 1950), Fair Trade (ab 1990)
- [ ] Internationale Organisationen: HRR (bis 1806), Deutscher Bund, Völkerbund, UN, EU
- [ ] Diplomatie 2.0: Botschafter, Sanktionen, Embargos, humanitäre Interventionen, Klimadiplomatie

### UI/UX-Revolution (v2.4.0-Plan)
- [~] Kartenanimation (bewegte Markierungen, 30 FPS, Bewegung abschaltbar) und optionale prozedurale Geräuschkulisse (Dorf, Markt, Krieg, Winter) integriert; Gebäude-/Einheitenanimationen, visuelles Wetter und Tag/Nacht folgen
- [ ] Animierte Übergänge, Hilfe-Overlays
- [ ] PWA mit Offline-Modus, Touch-Optimierung; später native Apps (Capacitor)

### Performance & Infrastruktur
- [ ] Code-Splitting und Lazy Loading, Caching-Strategien
- [ ] Web Worker für Simulationsberechnungen
- [ ] Service Worker für Offline-Betrieb
- [ ] Automatisch generierte API-Dokumentation

### Barrierefreiheit & Lokalisierung
- [ ] Barrierearme Steuerung, Screenreader-Unterstützung
- [ ] Übersetzungen (EN, FR, ES, IT, PL, TR)
- [ ] Transparente Kennzeichnung von Spekulation/Fiktion, Quellenangaben für Ereignisse

## 🔮 Vision (2027 – 2030)

- [ ] **v3.0.0 Große Expansion**: Prähistorie (10.000 v. Chr.), ferne Zukunft (bis 2200), Mod-Loader
      und Plugin-System, Modding-API, Beispiel-Mods
- [ ] **v3.1.0 Social & Community**: Freundeslisten, Gilden, Zuschauermodus, Replays, Streaming
- [ ] **v4.0.0 Futuristische Erweiterung**: KI-Herrschaft, Transhumanismus, Raumfahrt und Kolonisierung
- [ ] **v4.1.0 Alternative Realitäten**: Parallelwelten, Zeitreise-Paradoxien
- [ ] **Immersive Interfaces**: VR-Thronraum, AR-Stadtplanung
- [ ] **Adaptive KI**: dynamische Schwierigkeit, emotionale NPCs mit Gedächtnis
- [ ] **Plattformen**: Electron-Desktop, Steam, Epic, GOG, Cross-Platform-Play
- [ ] **Cloud & Services**: Server-Cluster, persistente Welten, Spielstand-Cloud, historische Daten-API
- [ ] **Modding 2.0 / Creator Economy**: Skripting-Engine, Steam Workshop, Mod-Wettbewerbe
- [ ] **Akademische Edition**: Lehrplan-Szenarien, Quellenintegration, Datenexport, Klassenraum-Modi
- [ ] **Esports & Community**: Turniere, Ranked Matchmaking, Discord, Forum, Dev-Blogs

### Episoden-Plan (aus Roadmap)
| Episode | Titel | Ziel | Schwerpunkt |
|---|---|---|---|
| 1 | Sturm des Mittelalters | Q2 2026 (überfällig) | Bürger, Demografie, soziale Netzwerke, Formationen |
| 2 | Funken der Renaissance | Q3 2026 | Kunst, Stadtviertel, Tagesrhythmus, Handelsrouten |
| 3 | Donner der Revolution | Q4 2026 | Industrialisierung, Gewerkschaften, revolutionäre Zellen |
| 4 | Flammen der Weltkriege | Q1 2027 | Total War, Belagerung, Spionage, Logistik |
| 5 | Licht der Moderne | Q2 2027 | Justiz, Bürokratie, internationale Organisationen, Finanzen |
| 6 | Schatten der Zukunft | Q3–Q4 2027 | KI-Herrschaft, Transhumanismus, Raumfahrt |
| 7 | Ewigkeit der Geschichte | 2028+ | Prozedurale Narrative, persistente Welten |

Die meisten Kernsysteme der Episoden 1–4 sind als Code vorhanden. Es fehlen die Integration in die
Aufbaukampagne und die Mehrspieler-Anteile (siehe P2/P3).
