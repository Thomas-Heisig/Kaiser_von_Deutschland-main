# Changelog

All notable changes to Kaiser von Deutschland will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## Future Versions

### [2.2.0] - Planned
- Migration system for citizens
- Career change mechanics
- Advanced family dynamics
- Inheritance system
- AI-driven citizen behavior

### [2.3.0] - Planned
- Ecological simulation
- Dynamic climate system
- Natural disasters
- Resource depletion
- Wildlife populations

### [3.0.0] - Planned
- 3D visualization with Three.js
- VR/AR support
- Real-time multiplayer server
- Persistent worlds
- Mod support

---

[2.1.5]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/compare/v2.0.0...v2.1.5
[2.0.0]: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/releases/tag/v2.0.0
