# GitHub Copilot Instructions for Kaiser von Deutschland

## Project Overview
Kaiser von Deutschland is a comprehensive historical kingdom simulation game built with TypeScript, featuring extensive role-playing from year 0 to the future. This project emphasizes historical accuracy, multiplayer capabilities, and modular architecture.

## Core Development Rules

### TypeScript Standards
- **ALWAYS** use `strict` mode in TypeScript
- **ALWAYS** define explicit types for all function parameters and return values
- **NEVER** use `any` type unless absolutely necessary (prefer `unknown` if type is truly unknown)
- Use type aliases and interfaces for better code documentation
- Leverage TypeScript utility types (Partial, Required, Pick, Omit, etc.)
- Use const assertions for literal types where appropriate

### Code Style
- Use **single quotes** for strings
- Prefer **const** over let when variables won't be reassigned
- Use arrow functions for callbacks and short functions
- Use meaningful, descriptive variable and function names in German or English
- Follow German naming conventions for game-specific terms (e.g., Bürger, König, etc.)
- Use JSDoc comments for public APIs and complex logic
- Maximum line length: 120 characters

### Documentation Requirements
- **ALWAYS** update relevant documentation when adding new features
- Document all public APIs with JSDoc comments including:
  - Purpose/description
  - @param tags for all parameters
  - @returns tag for return values
  - @throws tag for potential errors
  - @example tag for complex functions
- Update README.md when adding major features
- Update ARCHITECTURE.md when modifying system structure
- Keep API_REFERENCE.md in sync with code changes

### Architecture Principles
- **Modularity**: Keep systems separate and loosely coupled
- **Data-Driven**: Use JSON files for configuration and game data
- **Type Safety**: Leverage TypeScript's type system fully
- **Performance**: Consider performance implications, especially for large-scale simulations
- **Multiplayer-Ready**: Design all features with multiplayer in mind from the start
- Use dependency injection where appropriate
- Follow SOLID principles

### File Organization
```
src/
├── core/          # Core game logic and systems
├── ui/            # User interface components
├── data/          # Game data and definitions
│   └── json/      # JSON data files
├── utils/         # Utility functions and helpers
└── main.ts        # Application entry point
```

### Naming Conventions
- **Files**: PascalCase for classes/types (e.g., `CitizenSystem.ts`)
- **Classes**: PascalCase (e.g., `class CitizenManager`)
- **Interfaces**: PascalCase with descriptive names (e.g., `interface CitizenData`)
- **Types**: PascalCase (e.g., `type ProfessionType`)
- **Functions**: camelCase (e.g., `function calculateBirthRate()`)
- **Variables**: camelCase (e.g., `const currentPopulation`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `const MAX_CITIZENS = 10000`)
- **Private members**: Use private keyword, not underscore prefix

### Error Handling
- Use try-catch blocks for error-prone operations
- Throw specific error types with descriptive messages
- Log errors appropriately (console.error for actual errors, console.warn for warnings)
- Validate input parameters at function boundaries
- Handle async errors with proper Promise rejection handling

### Testing
- Write unit tests for new functionality using Vitest
- Test edge cases and error conditions
- Aim for high code coverage on core systems
- Use descriptive test names that explain what is being tested
- Mock external dependencies appropriately

### Performance Considerations
- Avoid unnecessary re-renders in UI components
- Use efficient data structures (Maps/Sets over Objects/Arrays when appropriate)
- Implement lazy loading for large datasets
- Consider using Web Workers for heavy computations
- Profile performance-critical code paths
- Cache expensive calculations when possible

### Scalability Requirements (CRITICAL)
- **Population Limits**: Design systems to scale from 10,000 to 100,000,000 citizens (target: 80M for Germany)
- **Configurable Thresholds**: Use configuration objects for all scalability limits
- **Three-Tier Simulation Strategy**:
  - **Below 10,000**: Full individual simulation (every citizen tracked individually)
  - **10,000-100,000**: Hybrid simulation (VIPs individually, others aggregated)
  - **Above 100,000**: Statistical aggregation (demographic cohorts, representative sampling)
- **Economic Scaling for 80M+ Citizens**:
  - Use **economic cohorts** (groups of similar citizens) instead of individual tracking
  - Aggregate production/consumption by profession and region
  - Calculate trade at macro level (region-to-region, not person-to-person)
  - Cache market prices and update periodically, not per transaction
  - Use supply/demand curves instead of individual buyer/seller matching
- **Event Simulation Scalability**:
  - **Event Batching**: Process similar events in batches (all births, all deaths, all marriages)
  - **Event Sampling**: For large populations, sample subset for random events
  - **Event Pooling**: Reuse event objects instead of creating millions
  - **Probability-Based**: Use statistical probabilities for mass events instead of individual rolls
  - **Regional Aggregation**: Events affect regions, not individual citizens
- **Social Network Scaling**:
  - **Relationship Limits**: Max 5-20 relationships per citizen (configurable by population)
  - **Network Sampling**: For information spread, sample 0.1-1% of population
  - **Dunbar's Number**: Limit meaningful relationships based on cognitive limits (~150 max)
  - **Weak Ties**: Use statistical models for casual connections
- **Spatial Partitioning**: Use quadtrees, grids, or regions to partition large populations
- **Lazy Evaluation**: Don't calculate values until they're needed for display or decision-making
- **Resource Pooling**: Reuse objects instead of creating/destroying them repeatedly
- **Performance Monitoring**: Include performance metrics and warnings when thresholds are exceeded
- **Degradation Strategy**: Automatically reduce simulation detail when performance suffers
- **Military Scaling**: Support both small skirmishes (10s of units) and massive battles (100,000+ units)
  - Use unit formations as single entities for large armies
  - Aggregate casualties statistically for huge battles
  - Simplified combat resolution when >10,000 units per side
- **Data Structures**: Use Map/Set for O(1) lookups, avoid O(n²) algorithms for large datasets
- **Memory Management**: Implement cleanup for old/irrelevant data to prevent memory leaks
- **Cache Strategy**:
  - Cache frequently accessed calculations (GDP, population stats, resource totals)
  - Invalidate caches only when underlying data changes
  - Use time-based cache expiry for non-critical data

### Multiplayer Development
- Design all systems with multiplayer synchronization in mind
- Ensure all game state is serializable
- Use event-driven architecture for state changes
- Implement optimistic UI updates where appropriate
- Handle network latency and disconnections gracefully

### PixiJS Integration
- Use PixiJS for all graphical visualizations
- Organize PixiJS code in separate rendering modules
- Dispose of PixiJS resources properly to prevent memory leaks
- Use sprite sheets for better performance
- Implement proper scaling for different screen sizes

### Database and Data Management
- **ALWAYS** expand database schemas when adding new features
- Use JSON Schema for data validation where appropriate
- Maintain backward compatibility when updating data formats
- Document all data structures and their purposes
- Use TypeScript interfaces that match JSON structure

### Responsive Design
- Design for mobile-first, then enhance for desktop and tablet
- Use flexible layouts that adapt to different screen sizes
- Test on multiple device sizes
- Optimize touch interactions for mobile devices
- Ensure text is readable on all screen sizes

### Git Workflow
- Write clear, descriptive commit messages
- Keep commits focused on a single change
- Reference issue numbers in commits when applicable
- Don't commit build artifacts or dependencies
- Use .gitignore properly

### Security
- Never commit secrets or API keys
- Validate all user input
- Sanitize data before rendering (prevent XSS)
- Use secure communication protocols for multiplayer
- Implement proper authentication and authorization for multiplayer features

### Accessibility
- Use semantic HTML elements
- Provide keyboard navigation support
- Include ARIA labels where appropriate
- Ensure sufficient color contrast
- Support screen readers

## Feature-Specific Guidelines

### Population Dynamics (v2.1.5)
- Each citizen must have unique ID, name, age, profession, and needs
- Implement efficient algorithms for large populations (100,000+ citizens)
- Use spatial hashing or quadtrees for regional organization
- Batch updates for performance
- Cache frequently accessed citizen data
- **Scalable Population System**:
  - Below 10,000: Full individual simulation
  - 10,000-100,000: Hybrid (detailed for important citizens, aggregated for others)
  - Above 100,000: Statistical aggregation with representative sampling
  - Use population density maps instead of tracking every individual location
  - Aggregate similar citizens into demographic cohorts for bulk calculations

### Historical Accuracy
- Cross-reference historical events with Wikipedia integration
- Maintain chronological consistency
- Document sources for historical data
- Allow for "alternate history" scenarios while marking them as such

### KI Integration
- Support both local and remote KI services

## 🎯 New Roadmap Features (20 Random Features - v2.5.0)

### Economic Systems (v2.5.0)
- **Inflation and Deflation**: Dynamic currency valuation system with historical inflation rates
  - Uses `EconomicSystemsManager` class
  - Tracks price levels, inflation rates, and monetary policies
  - Historical systems from medieval to modern era
  - Supports deflation events (Black Death, Great Depression)
  - Data: `src/data/json/economic-systems.json`
- **Libraries & Knowledge**: Book collections, libraries, censorship, Open Access vs Paywalls
  - Uses `LibrarySystem` class
  - Supports multiple library types from monastery to digital libraries
  - Book collection with cultural and research values
  - Censorship policies affect research and culture
  - Data: `src/data/json/libraries.json`

### Military & Defense Systems (v2.5.0)
- **Fortifications**: City walls, siege weapons, siege tactics
  - Uses `FortificationSystem` class
  - Wall types from wooden palisade to modern bunkers
  - Siege weapons: battering rams, catapults, trebuchets, cannons
  - Siege tactics: undermining, starvation, escalade
  - Data: `src/data/json/fortifications.json`
- **Military Logistics**: Supply lines, winter quarters, military camps
  - Supply line types: road, river, rail, motorized
  - Camp types: tent camps, forts, winter quarters, barracks, bases
  - Logistics upgrades affect capacity and efficiency
  - Data: `src/data/json/military-logistics.json`
- **Naval Systems**: Marine technology tree, naval units, combat tactics
  - Technologies from rowing to nuclear propulsion
  - Ship types: galleys, cogs, carracks, ironclads, submarines, carriers
  - Naval combat tactics and blockades
  - Data: `src/data/json/naval-systems.json`

### Espionage & Information Warfare (v2.5.0)
- **Advanced Espionage**: Agents, double agents, sabotage, assassinations
  - Uses `AdvancedEspionageSystem` class
  - Agent recruitment and network building
  - Operations: sabotage, tech theft, assassinations, kidnapping
  - Double agent mechanics with loyalty and skill
  - Cipher systems for message encryption
  - Data: `src/data/json/espionage-systems.json`
- **Propaganda Systems**: Campaigns, counter-propaganda, information warfare
  - Patriotic propaganda, enemy demonization
  - Radio and social media campaigns (era-dependent)
  - Secret societies and revolutionary cells
  - Effects on morale and war support

### Education & Science (v2.5.0)
- **Universities**: Historical German universities (Heidelberg, Leipzig, Berlin, TUM)
  - University founding and management
  - Specializations and research bonuses
  - Student capacity and prestige tracking
  - Educational reforms from Latin schools to PISA
  - Data: `src/data/json/universities.json`
- **Nobel Prize Simulation**: Scientific awards system (from 1901)
  - Six Nobel categories: Physics, Chemistry, Medicine, Literature, Peace, Economics
  - Track Nobel laureates by year
  - Prestige and cultural bonuses
  - Famous scholars database (Einstein, Planck, Koch)

### Urban Development (v2.5.0)
- **Urban Districts**: Slums, working-class, middle-class, noble districts
  - District types with quality, density, crime metrics
  - Gentrification mechanics and displacement
  - Crime hotspots and urban policies
  - District identities (artistic, financial, immigrant, university)
  - Data: `src/data/json/urban-districts.json`
- **Social Policies**: Rent control, social housing, slum clearance
  - Effects on affordability and inequality
  - Displacement and social tension tracking

### Colonial Systems (v2.5.0)
- **Colonial Administration**: German colonies, governors, economic exploitation
  - Six historical German colonies (East Africa, Southwest Africa, Cameroon, etc.)
  - Colonial officials: governor-general, district officers, native chiefs
  - Plantation economy and mining operations
  - Independence movements and decolonization
  - Data: `src/data/json/colonial-systems.json`
- **Colonial Economics**: Revenue vs. costs, resource extraction
  - Annual revenue and maintenance costs per colony
  - Colonial policies: direct rule, indirect rule, civilizing mission

### Waterways & Trade (v2.5.0)
- **River Systems**: Rhine, Danube, Elbe, Oder with cargo capacity
  - Major rivers with navigation and trade bonuses
  - River shipping from medieval barges to container ships
  - Data: `src/data/json/waterways.json`
- **Canal Systems**: Ludwig Canal, Kiel Canal, Mittelland Canal, Rhine-Main-Danube
  - Historical canal construction and costs
  - Economic and military value
  - Waterway improvements: dredging, locks, straightening
- **Ports**: Hamburg, Bremen, Kiel with facilities
  - Seaports and naval bases
  - Container terminals, shipyards, customs facilities

### Integration Guidelines for New Features
- **Manager Class**: Use `RoadmapFeaturesManager` as main integration point
- **Sub-systems**: Access via getter methods (e.g., `getEconomicSystems()`)
- **JSON Data**: All features use JSON databases in `src/data/json/`
- **TypeScript Types**: Each system has complete type definitions
- **Update Loop**: Call `RoadmapFeaturesManager.update(year, deltaTime)` each game tick
- **Feature Summary**: Use `getFeaturesSummary()` for UI display
- Implement fallback mechanisms when KI is unavailable
- Cache KI responses appropriately
- Rate limit KI API calls to prevent abuse

## Common Patterns

### Event System
```typescript
interface GameEvent {
  type: string;
  timestamp: number;
  data: unknown;
}

class EventEmitter {
  private listeners: Map<string, Function[]>;
  
  on(event: string, callback: Function): void { /* ... */ }
  emit(event: string, data: unknown): void { /* ... */ }
}
```

### Data Loading
```typescript
// Prefer async loading for large datasets
async function loadGameData<T>(path: string): Promise<T> {
  const response = await fetch(path);
  return await response.json() as T;
}
```

### State Management
```typescript
// Use immutable updates for state
const newState = {
  ...oldState,
  property: newValue
};
```

## Dependencies Management
- Keep dependencies up to date
- Audit dependencies for security vulnerabilities regularly
- Prefer well-maintained, popular libraries
- Document why each dependency is needed
- Minimize dependency count

## Build and Deployment
- Ensure code passes TypeScript type checking (`npm run check`)
- Build successfully before committing (`npm run build`)
- Test in development mode (`npm run dev`)
- Optimize for production builds
- Use appropriate source maps for debugging

## Collaboration
- Be responsive to code review feedback
- Ask questions when requirements are unclear
- Share knowledge through documentation
- Help onboard new contributors
- Respect existing code patterns and conventions

## Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [PixiJS Documentation](https://pixijs.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/guide/)

---

**Remember**: Quality over quantity. Write code that is maintainable, testable, and well-documented. The goal is to create a living, breathing historical simulation that can scale to millions of citizens while remaining performant and enjoyable to play.
