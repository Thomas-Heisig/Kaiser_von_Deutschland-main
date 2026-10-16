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
- [~] CI, Typecheck und Build für PR #1 erfolgreich; neuer Workflow trennt Check und Build explizit. Echter Browser-Smoke-Test noch offen.
- [~] Ereignispool von 6 auf 12 Dilemmata erweitert; deterministische 10.000er Kalibrierungstests für Risikowahrscheinlichkeiten ergänzt. Langzeit-Kampagnensimulation und ökonomisches Balancing noch offen.

## ✅ Lebendige Welt – PR #3 gemergt, Erweiterung in Prüfung

- [x] Prozedurale Umgebungsgeräusche mit Ein-/Ausschalter und szenenbezogener Umschaltung.
- [x] Dezente Kartenbewegungen mit Pausenmechanismus, 30-FPS-Limit und Reduced-Motion-Unterstützung.
- [x] Bereits vorhandenes Diplomatiesystem in NPC-Nachbarschaft eingebunden (Gesandtschaften/Beziehungen).
- [x] Diplomatie wird im Spielstand persistiert; Integrationstest hinzugefügt.
- [~] CI/Build für PR #3 erfolgreich; Lautstärkeregler für Umgebung ergänzt, Reduced Motion und stumme Voreinstellung vorhanden. Browser-, Hör- und WCAG-Prüfung noch offen.
- [~] Pfadgebundene animierte Passanten und Schornsteinrauch ergänzt; zusätzliche Kulturklänge und Lautstärke steuerbar. Vollständige Gebäudeanimationen, realistische Sample-Geräusche und echte Bürgerpositionsdaten noch offen.

## ✅ Kulturkalender in der Aufbaukampagne – PR #4 gemergt, Integration fortgesetzt

- [x] Bestehende Kulturevent-Daten für Jahrestage und Jahreszeiten spielbar.
- [x] Feste verbrauchen Gold und Nahrung und beeinflussen Zufriedenheit/Stabilität.
- [x] Jährliche Obergrenze pro Reich, Save/Load und Integrationstest ergänzt.
- [~] CI/Build von PR #4 erfolgreich; Religion (dominanter Glaube, Einfluss, Religionsfreiheit) im Kulturpanel lesbar. Browser-Test und echte reichsspezifische Religions- und Kulturverwaltung noch offen.

## ✅ Rivalen-Dynamik – PR #5/#6 gemergt
- [x] Drei strategische NPC-Profile mit unterschiedlicher jährlicher Entwicklung.
- [x] Militärisches Wachstum auf das Fünffache des Ausgangswertes begrenzt.
- [x] NPC-Entwicklung als Chronikmeldung angezeigt und im vorhandenen Kriegsspeicher gesichert.
- [x] Tests für Strategievarianten, Speicherstände und vorbereitete Angriffsunterdrückung ergänzt.
- [x] Verhandelte zweijährige Nichtangriffspakte mit realer Angriffssperre und Überfallschutz integriert; Ablauffrist und Save/Load berücksichtigt.
- [~] CI für PR #5/#6 bestanden; echte visuelle Browserabnahme bleibt offen.

## 🔴 P0 – Sofort (Build & laufende Arbeit)

- [x] **Build reparieren**: Forschungsansicht integriert; `npm run check`, Tests und Produktionsbuild
      bestehen wieder.
- [ ] **Forschung pro Reich abschließen** (`PlayerTechnologySystem`, uncommittet):
  - [x] Forschungspunkte aus Schulen/Universitäten, ein Projekt je Reich
  - [x] Speichern/Laden des Forschungsstands (`technologyProgress` im Spielstand)
  - [x] Handelsrouten prüfen erforschte Technologien (neue Technologie „Hochseesegeln“)
  - [x] Forschungsansicht und Handelsrouten im Hauptspiel bedienbar gemacht
  - [x] Browserablauf für Hochseesegeln manuell geprüft (Forschung nach zwei Monaten abgeschlossen)
  - [ ] Hanseroute im Browser aktivieren: Technologie ist nachgewiesen; Aktivierung benötigt zusätzlich
        einen Hafen und 15.030 Gold, die im geprüften Spielstand fehlten
  - [x] Unit- und Integrationstests für `PlayerTechnologySystem` und `GameEngine.startResearch()`
  - [x] [GAMEPLAY_TESTING_GUIDE.md](./GAMEPLAY_TESTING_GUIDE.md) und
        [API_REFERENCE.md](./docs/05-technical-architecture/API_REFERENCE.md) ergänzt
  - [ ] Committen
- [x] **Repository aufräumen**: Playwright-Artefakte (`.playwright-mcp/`, 5 getrackte Dateien) aus Git entfernen
      und in `.gitignore` aufnehmen

## 🟠 P1 – Stabilisierung & Konsistenz

### Bekannte Probleme (aus Status-Bericht)
- [ ] ❌ Performance bricht bei > 5.000 Bürgern ein (Ziel: 100.000+, langfristig 80 Mio. über Kohorten)
- [ ] ❌ Speicherverbrauch steigt in langen Sitzungen (Cleanup alter Daten, Objekt-Pooling)
- [ ] ⚠️ Spielstände werden bei großen Reichen zu groß (Kompression / Kohorten statt Einzelbürger)
- [ ] ⚠️ UI-Responsivität auf kleinen Bildschirmen (320 × 740) prüfen
- [ ] ⚠️ Einige historische Events fehlen
- [ ] ℹ️ Tooltips ausführlicher, Tutorial-System fehlt

### Code-Duplikate & technische Schulden
- [ ] `UrbanDistrictSystem.ts` vs. `UrbanDistrictsSystem.ts` zusammenführen
- [ ] `SiegeSystem.ts` vs. `SiegeWarfareSystem.ts` zusammenführen
- [ ] `core/DatabaseAdapter.ts` + `core/BrowserDatabaseAdapter.ts` vs. `core/database/*` vereinheitlichen
- [ ] `core/migrations/*` vs. `core/database/migrations/*` vereinheitlichen
- [ ] Alte Oberflächen (`UIFlowManager`, `GameUI`, `EnhancedPixiRenderer`, Roadmap-Panels) entweder in die
      Aufbaukampagne integrieren oder als Legacy kennzeichnen/entfernen
- [ ] Verbleibende `any`-Typen entfernen (z. B. JSON-Initialisierung in `TechnologySystem`)

### Dokumentation synchronisieren
- [ ] Versionsangaben vereinheitlichen: `package.json` 2.5.1, `status.md` 2.3.1,
      `ARCHITECTURE.md` 2.0.0, Reports bis 2.6.0
- [ ] [status.md](./docs/00-meta/status.md) aktualisieren (letztes Update Dezember 2025)
- [ ] Roadmap-Abgleich: bereits umgesetzte, aber offen markierte Punkte abhaken
      (Diplomatie- und Religionssystem, Kampagnenmodus, lokaler Hotseat, Kolonialverwaltung,
      Belagerung, Militäreinheiten, Kulturelle Ereignisse)
- [ ] Doppelte Release-Pläne in Roadmap (Kapitel/Episoden/„Kurzfristig–Langfristig“) zusammenführen
- [ ] Domains-Dokumentation vervollständigen, Operations-Guides schreiben

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
- [ ] Bevölkerungsdynamik, Migration, soziale Mobilität, Hungersnöte
- [ ] Klima, Naturkatastrophen, Landschaft, Tierpopulationen
- [ ] Belagerung, Formationen, Logistik, Marine, Kriegsfinanzierung, Kriegsgefangene
- [ ] Spionage, Untergrundbewegungen, Propaganda
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
