# Changelog

All notable changes to Kaiser von Deutschland will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Offene Aufgaben und Planung: siehe [TODO.md](./TODO.md).

### Hinzugefügt – Spielbare Aufbaukampagne (Oktober 2026)
- **KingdomGameUI** als neuer Standard-Einstieg (`src/main.ts`): semantische HTML-Verwaltung mit responsivem CSS
  (`styles/kingdom.css`), Ansichten für Übersicht, Bauen, Wirtschaft, Forschung, Garnison, Feldzüge, Charakter,
  Chronik und Hilfe
- **KingdomMap** (PixiJS 8): Siedlungskarte mit Bezirksmarkern, Zoom und Zentrieren, wird erst beim Spielstart nachgeladen
- **Aufbaukampagne ab 1200** mit sechs Kampagnenzielen (`GameEngine.getCampaignGoals()`), danach freies Weiterspielen
- **CampaignWarfareSystem**: statistische Feldzüge und Überfälle, Rivalen, Tribut, Monatslimits, max. 60 Berichte,
  Feldherrenboni aus dem gespielten Charakter
- **Lokaler Hotseat** für 2–4 Herrscher: `endTurn()`, Übergabedialog, gegenseitige Angriffe (Sieger erhält 15 % Gold)
- Persönliche Charakteraktionen (eine pro Spieler und Monat) und Rollenwechsel über `RoleSwitchingSystem`
- Markthandel über die Preistabelle von `EconomySystem`, monatliche Bilanzprognose `Kingdom.getMonthlyBalance()`
- Tests: `GameEngine.test.ts`, `Kingdom.test.ts`, `CampaignWarfareSystem.test.ts`, `TimeSystem.test.ts`,
  `Player.test.ts`, inkl. Integrationstest, der alle Kampagnenziele erreicht
- **Forschung pro Reich**: `PlayerTechnologySystem` mit Forschungspunkten aus Schulen und Universitäten,
  ein Projekt pro Reich, `getTechnologyProgress()`, `getTechnologyOptions()`, `startResearch()`, Event
  `technologyResearched`, neue Technologie „Hochseesegeln“, Handelsrouten prüfen erforschte Technologien,
  mit UI für Forschungsprojekte und Route-Aktivierung; eigener Forschungsstand je Hotseat-Reich

### Geändert
- Engine besitzt den verbindlichen Kalender: `advanceMonth()` mit Schutz gegen parallele Monatsberechnungen,
  `nextYear()` berechnet zwölf reguläre Monate
- Spielstand-Version 2: enthält Bürgerdatensätze, Kriegszustand, Hotseat-Zugindex und Forschungsstand;
  Laden startet immer pausiert
- Daten-URLs nutzen `new URL(..., import.meta.url)`, damit JSON-Daten auch im Produktionsbuild ausgeliefert werden
- TypeScript-Konfiguration und Vite-Setup überarbeitet (Dev-Server auf Port 4100)
- README, ARCHITECTURE, API_REFERENCE und GAMEPLAY_TESTING_GUIDE auf die Aufbaukampagne aktualisiert

### Verifiziert
- `npm run check` und `npm run build` erfolgreich; alle Vitest-Tests bestanden
- Browserprüfung: Hochseesegeln erforscht; die Hanseroute meldet danach den fehlenden Hafen statt einer
  fehlenden Technologie. Ihre Aktivierung bleibt offen, da zusätzlich 15.030 Gold benötigt werden.

## [2.6.0] - 2025-12

> Laut Implementierungsberichten; `package.json` steht noch auf 2.5.1.

### Hinzugefügt – 🚢 Transport-Revolution & Lebenssimulation
- **Handelsrouten-Management**: Aktivierung von Routen nach Jahr und Technologie, Aktivierungskosten,
  Einkommen, Kultureinfluss, Prestige und Handelsmacht (`Kingdom`, `GameEngine`)
- **TradeRoutesPanel** (UI) mit Transportmitteln in 7 Kategorien (zu Fuß bis Flugzeug)
- Handelsrouten in Save/Load, Wirtschafts-, Infrastruktur- und Stabilitätssystem eingebunden
- **Lebenssimulation integriert**: Lebensphasen-Systeme in `GameEngine` und `UIFlowManager` eingebunden
- **UI-Interaktionssystem** (`UIFlowManager`): Startseite, Spieleinstellungen und Hauptbildschirm mit Tastaturnavigation

### Behoben
- Fehler in `RoleSwitchingPanel`

## [2.5.1] - 2025-12-28

### Added - ⚔️ Kriegsgefangene & Behandlung (Prisoners of War System)

#### Core Systems
- **PrisonerOfWarSystem**: Complete prisoner of war management
  - Prisoner capture mechanics from battles and sieges
  - Individual prisoner tracking (name, rank, nationality, health, morale)
  - Prisoner camps with configurable capacity and security
  - 6 treatment policies (humane, standard, harsh, forced labor, ransom, execution)
  - Treatment policy effects on diplomatic relations, morale, and health
  - Historical accuracy with Geneva Convention compliance (post-1929)
  - Prisoner exchange and ransom negotiations
  - Escape attempt mechanics with security-based success rates
  - Monthly health decay, morale changes, and death tracking
  - Economic costs for camp maintenance
  - PoW event system tracking all major prisoner-related events

#### Data Assets
- **prisoner-of-war.json**: Comprehensive historical data
  - 6 treatment policy definitions with era availability
  - Historical camps (Colditz Castle, Stalag Luft III)
  - Timeline of PoW-related historical events (1215-1977)
  - Ransom price structures by era
  - Escape statistics by camp type and era
  - Famous historical prisoners (Richard I, François I, Napoleon)
  - Work type definitions with legal status

#### Game Integration
- Monthly prisoner health and morale updates
- Automatic escape attempt processing
- Integration with battle outcomes for prisoner capture
- Diplomatic consequences for treatment policies
- Economic costs integrated into kingdom finances
- Event system for captures, escapes, exchanges, releases

#### Features
- Capture prisoners from defeated enemies (configurable rank distribution)
- Create and manage prisoner camps with varying security levels
- Choose treatment policies affecting prisoner welfare and diplomatic standing
- Negotiate prisoner exchanges with other kingdoms
- Release prisoners (end of war, amnesty)
- Track prisoner statistics (by status, rank, nationality)
- Historical compliance with international law (Geneva Convention after 1929)
- War crime consequences for execution policy

### Technical
- TypeScript strict mode compliance
- Comprehensive type definitions
- Scalable architecture supporting thousands of prisoners
- Full documentation with JSDoc comments
- Integration with GameEngine monthly tick system
- Public API via `getPrisonerOfWarSystem()` getter

### Documentation
- Updated roadmap.md to mark PoW feature as complete (v2.5.1)
- Added comprehensive inline documentation
- JSON schema documentation for all data structures

---

### Added - 📈 Berufswechsel & Soziale Mobilität (Career Changes & Social Mobility)

#### Core Systems
- **SocialMobilitySystem**: Automated career change processing
  - Career paths from 12 professions with difficulty ratings
  - Social class system (lower, working, middle, upper_middle, upper, nobility)
  - Probability-based career transitions based on education, wealth, connections, age
  - Social stability affects mobility rates
  - Upward, downward, and lateral mobility tracking
  - Individual citizen career change attempts for player-controlled citizens
  - Aggregate career change processing for large populations (scalable)
  - Yearly processing of ~5% population attempting career changes

- **CitizenSystem Enhancements**:
  - `changeProfession()` method for career transitions
  - `getProfessionDistribution()` for population analysis
  - `getAverageStats()` for education, wealth, connections, and age averages
  - Automatic profession change recording in citizen life events

#### User Interface
- **SocialMobilityPanel**: Beautiful modal panel for statistics
  - Overall mobility statistics (total transitions, upward/downward/lateral percentages)
  - Success rate tracking
  - Mobility breakdown by social class with animated progress bars
  - Top 10 popular career transitions visualization
  - Auto-updates every 2 seconds
  - Responsive design with gradient styling
  - Accessible via "📈 Berufswechsel" button in Kingdom view

#### Game Integration
- Yearly career change processing in game loop
- Considers kingdom happiness as social stability factor
- Citizens change professions based on system calculations
- Life events recorded for all career changes
- Compatible with existing migration and demographic systems

## [2.5.0] - 2025-12-28

### Hinzugefügt – 🎮 Lebensphasen-System
- `LifePhaseTypes`, `LifePhaseSystem`, `MonthlyPlannerSystem`, `CareerPathSystem`
- Persönlichkeitssystem, Epochen, Lebensphasen, Zeitmanagement, Karrierepfade, Geschwindigkeitsmodi
- Daten: `epochs.json`, `philosophical-questions.json`, `career-paths.json`
- Dokumentation: `GAMEPLAY_SYSTEM.md`

### Hinzugefügt – 🎯 20 Roadmap-Features
- **Wirtschaft**: Inflation und Deflation (`EconomicSystemsManager`), Büchersammlungen und Open Access vs. Paywalls
  (`LibrarySystem`)
- **Militär**: Stadtmauern verschiedener Stärke, Katapulte/Kanonen/Belagerungstürme (`FortificationSystem`),
  Versorgungslinien, Winterquartiere und Lager, Marine-Technologiebaum
- **Spionage**: Doppelagenten, Wirtschaftsspionage, revolutionäre Zellen, Attentate und Entführungen, Sabotage,
  Propaganda und Gegenpropaganda, Verschlüsselung (`AdvancedEspionageSystem`)
- **Stadt**: Gentrifizierung und Verdrängung
- **Bildung**: Universitätsgründungen, Nobelpreis-Simulation ab 1901
- **Handel & Kolonien**: Flussschifffahrt und Kanäle, Kolonialverwaltung, weltweite Handelsrouten
- `RoadmapFeaturesManager` als Integrationspunkt mit `update(year, deltaTime)` und `getFeaturesSummary()`
- `RoadmapFeaturesUI` mit Tabs (Universitäten, Bibliotheken, Spionage …) über „🌟 Erweiterte Features“
- Daten: `economic-systems.json`, `libraries.json`, `fortifications.json`, `military-logistics.json`,
  `naval-systems.json`, `espionage-systems.json`, `universities.json`, `urban-districts.json`,
  `colonial-systems.json`, `waterways.json`

### Hinzugefügt – 📚 Dokumentations- & Hilfesystem
- In-Game-Dokumentationsbetrachter (`HelpSystem`) mit Hilfe-Button, Navigation, Suche und Markdown-Konverter
- Dokumentation neu strukturiert (`docs/00-meta` bis `docs/99-appendix`, `docs/reports`, `docs/INDEX.md`)

### Behoben
- TypeScript-Strict-Mode-Fehler; Anwendung startet wieder fehlerfrei

## [2.4.2] - 2025-12-28

### Hinzugefügt – 🕵️ Untergrundbewegungen
- `UndergroundMovementSystem`: Rebellengruppen, Geheimgesellschaften, revolutionäre Zellen,
  Terrorismus (ab Industrialisierung)
- Revolutionsbedrohung, öffentliche Angst und Sicherheit
- Daten: `underground-movements.json`, Integration in `RoadmapFeaturesManager`

## [2.4.0] - 2025-12-28

### Hinzugefügt – 🗄️ Datenbank-Integration (Grundlage)
- `DatabaseAdapter`-Schnittstelle und `BrowserDatabaseAdapter`
- Migrationssystem (`MigrationRunner`, `001_initial_schema`, `002_gameplay_modes`)
- Repository-Pattern: `CitizenRepository`, `BuildingRepository`, `TechnologyRepository`, `PlayerRepository`
- Tests (`database.test.ts`), ADR-0001 zur Datenbanktechnologie

### Hinzugefügt – 🎛️ Gameplay-Modi (Grundlage)
- `GameplayModeTypes` und `GameplayModeManager`: sechs Spielvarianten, vier Intensitätsachsen, fünf Rollenperspektiven

### Hinzugefügt – 📈 Skalierbare Systeme (17 Systeme ins Gameplay integriert)
- `ScalabilityConfig` mit dreistufiger Simulation (individuell, hybrid, statistisch)
- **Bevölkerung & Gesellschaft**: `MigrationSystem`, `SocialMobilitySystem`, `FamineSystem`,
  `EconomicCohortSystem`, `SocialNetworkSystem`, `InformationSpreadSystem`
- **Militär**: `BattleTerrainWeatherSystem`, `UnitFormationSystem`, `SupplyLogisticsSystem`, `SiegeSystem`,
  `SiegeWarfareSystem`, `EspionageSystem`
- **Stadt & Kultur**: `UrbanDistrictsSystem`, `DayNightCycleSystem`, `ArtsAndCultureSystem`, `ArtSystem`
- **Recht**: `LegalSystem`, `LegalAndCourtSystem`
- `MigrationPanel` und `SocialMobilityPanel` (UI)
- Erweiterte Copilot-Instruktionen mit Skalierungsrichtlinien

## [2.3.6] - 2025-12-28

### Hinzugefügt – 💰 Kriegsfinanzierung
- `WarFinancingSystem`: Finanzierungsmethoden je Epoche, Kriegsanleihen, Kredite, Rückzahlungsstrategien,
  wirtschaftliche Effekte
- `WarFinancingPanel` (UI), Daten `war-financing.json` mit historischen Anleihedaten

## [2.3.5] - 2025-12

### Hinzugefügt – ⚓ Marinekriegsführung
- `NavalSystem` mit 10 Marinetechnologien, 8 Schiffstypen und 4 Kampftaktiken
- Daten: `naval-systems.json`

## [2.3.1] - 2025-12

### Hinzugefügt – 📜 Datengetriebene Inhalte (12 Datenbanken)
- Historische Persönlichkeiten (`HistoricalFiguresSystem`), historische Schlachten (10)
- Krankheiten und Epidemien (`DiseaseSystem`), Naturkatastrophen (`NaturalDisasterSystem`)
- Transportsysteme (15 Typen) und Handelsrouten (10 Routen, `TransportSystem`)
- Kunststile (11 Epochen), kulturelle Ereignisse (12 Feste)
- Wissenschaftliche Entdeckungen (15, `ScientificDiscoverySystem`)
- Rechtssysteme (10), Steuersysteme (12), Militäreinheiten (`MilitaryUnitSystem`)
- Schlachtsimulation mit Gelände und Wetter, Belagerungssystem

## [2.3.0] - 2025-12

### Hinzugefügt – 🤝 Diplomatie, Religion & Kultur
- `DiplomacySystem`: Beziehungen, Verträge, Allianzen, Handelsabkommen, Kriegserklärungen, Friedensverhandlungen
- `ReligionSystem`: 7 Religionen, 8 kulturelle Identitäten

## [2.2.3] - 2025-12-27

### Hinzugefügt – 🌍 Ökologische Simulation
- `ClimateSystem`: Jahreszeiten, Wetter, Klimawandel über Jahrhunderte, Naturkatastrophen, Ressourcenerschöpfung,
  Wettervorhersage (ab Industrialisierung)
- `LandscapeSystem`: Entwaldung/Aufforstung, Flussläufe, Bodenerosion, Flächenkonkurrenz, Terraforming
- `AnimalPopulationSystem`: Wildtiermigration, Fischbestände, Jagd und Artenschutz, Viehzucht, Aussterben
- Daten: `ecology.json`, Dokumentation unter `docs/04-domains/ecology/`

## [2.1.5] - 2025-12-27

### Added - 🧬 Bevölkerungsdynamik (Population Dynamics)

#### Core Systems
- **CitizenSystem**: Complete individual citizen simulation
  - Each citizen has unique ID, name, age, gender, profession
  - Personal needs system (food, shelter, safety, health, social, spiritual, education, entertainment)
  - Health tracking with diseases, immunity, and fertility
  - Personality traits (courage, intelligence, charisma, ambition, etc.)
  - Skills system (agriculture, craftsmanship, trading, combat, etc.)
  - Family relationships and dynasties
  - Social relationships (friends, enemies, rivals, mentors)
  - Life events tracking
  - Player control support for multiplayer

- **DemographicSystem**: Realistic population simulation
  - Birth and death rate calculations based on historical data
  - Age pyramids with generational effects
  - Life expectancy calculations
  - Epidemic system with individual disease spread
  - Famine system with regional differences
  - Population growth based on quality of life
  - Detailed demographic statistics

- **SocialNetworkSystem**: Social interactions and movements
  - Friendship and enemy relationship management
  - Information spread through social networks (news, rumors, propaganda, gossip)
  - Social movements (revolutions, reforms, protests, guilds, parties)
  - Message propagation with believability and spread rate
  - Player leadership of movements
  - Automatic social relation generation

#### Visualization
- **PopulationVisualization** (PixiJS): Interactive graphics
  - Age pyramid rendering with male/female breakdown
  - Citizen map with color-coded citizens
  - Interactive tooltips on hover
  - Responsive design for all screen sizes
  - Real-time updates

#### Utilities
- **NameGenerator**: Realistic German names
  - Era-appropriate first names (medieval to contemporary)
  - 100+ German surnames
  - Special generators for nobles and clergy
  - Full name generation with historical accuracy

#### Integration
- Integrated all population systems into GameEngine
- Monthly processing of all population dynamics
- Yearly social relation generation
- Population statistics accessible from GameEngine

#### Documentation
- Comprehensive API reference (POPULATION_API.md)
- User guide for population features (POPULATION_GUIDE.md)
- Updated architecture documentation
- Demo/example code
- GitHub Copilot instructions file

### Changed
- Updated package.json to version 2.1.5
- Updated README with population dynamics features
- Enhanced ARCHITECTURE.md with new systems
- GameEngine now processes population dynamics monthly

### Technical Details
- **Language**: TypeScript with strict mode
- **Graphics**: PixiJS 8.x for high-performance rendering
- **Performance**: Optimized for 10,000-100,000+ citizens
- **Architecture**: Repository pattern with Maps for O(1) access
- **Multiplayer**: Full support for citizen control and movement leadership

### Dependencies Added
- `pixi.js@^8.x` - 2D Graphics Engine

### Performance Optimizations
- Efficient data structures (Maps and Sets)
- Spatial organization for regional queries
- Lazy loading preparation
- Batch processing ready

### Multiplayer Features
- Players can take control of any citizen
- Players can lead social movements
- Citizen interactions between players
- Social networks span player characters
- Cooperative disease control (planned)

---

## [2.0.0] - 2025-12-XX

### Added
- 15 different playable roles (Worker to Emperor)
- 27 historical events (Year 0 to 2050)
- 23 building types across 6 historical eras
- 24 technologies in complete tech tree
- 33 policy measures in 8 categories
- Ollama AI integration (6 models)
- Multiplayer system (up to 6 players)
- Wikipedia integration for historical events
- Comprehensive economy system
- Regional management system
- Save/Load system with LocalForage
- Responsive UI with dark theme
- TypeScript-based architecture

### Technical
- TypeScript 5.3+
- Vite 5.0+
- LocalForage for persistence
- JSON-based data architecture
- Event-driven architecture
- Vitest for testing

---

## Geplante Versionen

Die frühere Liste geplanter Versionen ist überholt (2.2.0/2.3.0 sind umgesetzt).
Planung und offene Punkte stehen jetzt in [TODO.md](./TODO.md) und der
[Roadmap](./docs/00-meta/roadmap.md).

---

[Unreleased]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.6.0...HEAD
[2.6.0]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.5.1...v2.6.0
[2.5.1]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.5.0...v2.5.1
[2.5.0]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.4.2...v2.5.0
[2.4.2]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.4.0...v2.4.2
[2.4.0]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.3.6...v2.4.0
[2.3.6]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.3.5...v2.3.6
[2.3.5]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.3.1...v2.3.5
[2.3.1]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.2.3...v2.3.0
[2.2.3]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.1.5...v2.2.3
[2.1.5]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.0.0...v2.1.5
[2.0.0]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/releases/tag/v2.0.0
