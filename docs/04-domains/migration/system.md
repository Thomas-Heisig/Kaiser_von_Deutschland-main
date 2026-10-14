# Migration System Documentation

**Version**: 2.1.5  
**Status**: ✅ Implemented (December 2025)  
**Roadmap Feature**: Migrationsbewegungen zwischen Regionen

## Overview

The Migration System simulates realistic population movement between regions based on economic, social, and environmental factors. Citizens evaluate their current living conditions and may choose to migrate to regions with better opportunities.

## Architecture

### Core Components

1. **MigrationSystem** (`src/core/MigrationSystem.ts`)
   - Manages migration flows between regions
   - Calculates region attractiveness
   - Tracks migration statistics
   - Scalable design supporting millions of citizens

2. **CitizenSystem Extensions** (`src/core/CitizenSystem.ts`)
   - `migrateCitizen()` - Moves a citizen to a new region
   - `getMigrationCandidates()` - Selects citizens willing to migrate
   - `updateMigrationDesires()` - Calculates migration pressure

3. **GameEngine Integration** (`src/core/GameEngine.ts`)
   - `processMigrations()` - Monthly migration processing
   - Integrated into monthly tick cycle
   - Automatic region attractiveness calculation

4. **MigrationPanel** (`src/ui/MigrationPanel.ts`)
   - Visual interface for migration statistics
   - Real-time flow visualization
   - Region comparison dashboard

## How It Works

### 1. Region Attractiveness Calculation

Each region is evaluated based on multiple factors:

```typescript
- Economic Score (35%):
  - Employment rate (60%)
  - Wage levels (40%)

- Safety Score (25%):
  - Military morale
  - Disease prevalence

- Opportunity Score (25%):
  - Infrastructure quality (70%)
  - Employment opportunities (30%)

- Quality of Life Score (15%):
  - Food availability (40%)
  - Infrastructure (30%)
  - Safety (30%)
```

### 2. Migration Pressure

Migration pressure between two regions is determined by:

- **Score Difference**: Higher destination score → higher pressure
- **Distance Factor**: `1 / (1 + distance / 500)` - closer regions preferred
- **Cultural Similarity**: 0.5 to 1.0 multiplier
- **Result**: Pressure value 0-100

### 3. Citizen Migration Desire

Individual citizens have migration desires (0-100) that increase based on:

- **Unmet Needs**: Low satisfaction → higher desire
- **Regional Attractiveness**: Poor region → higher desire
- **Age Factor**: Young adults (18-35) more likely to migrate
- **Family Ties**: More family relations → lower desire

### 4. Migration Flow Process

Monthly cycle:

1. Calculate attractiveness for all regions
2. Update citizen migration desires
3. Calculate migration pressures between regions
4. Select migration candidates (sorted by desire)
5. Move citizens to destination regions
6. Record migration events in citizen history

## Migration Reasons

Citizens migrate for various reasons:

- **Economic**: Better wages and employment
- **War**: Fleeing conflict and unsafe regions
- **Famine**: Escaping food scarcity
- **Disease**: Avoiding epidemic areas
- **Opportunity**: Seeking better infrastructure and services
- **Persecution**: Religious or political reasons (future)
- **Family**: Following relatives (future)

## Configuration

### Scalability Settings

Defined in `ScalabilityConfig`:

```typescript
maxMigrationsPerTick: number  // Max citizens migrating per month
```

### Base Parameters

```typescript
baseMigrationRate: 0.05  // 0-5% of population per year
minimumPressure: 10      // Minimum pressure to trigger migration
```

## UI Features

### Migration Panel

Access via Kingdom View → 🚶 Migrations-Ströme button

**Statistics Section:**
- Total migrations count
- Top 5 immigration destinations
- Top 5 emigration sources

**Current Flows:**
- Active migration streams between regions
- Migration counts and reasons
- Bidirectional flow visualization

**Region Details:**
- Population count per region
- Average migration desire (color-coded)
- Average citizen happiness (color-coded)

**Color Coding:**
- 🟢 Green (Low desire / High happiness): 0-40
- 🟡 Orange (Medium): 40-70
- 🔴 Red (High desire / Low happiness): 70-100

## Code Examples

### Calculate Region Attractiveness

```typescript
const attractiveness = migrationSystem.calculateRegionAttractiveness(
  regionId,
  employment,   // 0-100
  wages,        // 0-100
  safety,       // 0-100
  infrastructure, // 0-100
  food,         // 0-100
  disease       // 0-100
);
```

### Process Migrations

```typescript
const flows = migrationSystem.processMigrations(
  fromRegionId,
  population,
  fromAttractiveness,
  neighborRegions,    // Map<regionId, attractiveness>
  distances,          // Map<regionId, distance in km>
  culturalSimilarities // Map<regionId, 0-1>
);
```

### Migrate a Citizen

```typescript
const success = citizenSystem.migrateCitizen(
  citizenId,
  toRegionId,
  currentYear,
  currentMonth,
  reason  // 'economic', 'war', etc.
);
```

## Performance Considerations

### Scalability

The system is designed to handle large populations efficiently:

- **Aggregated Flows**: Groups citizens into migration flows rather than individual movements
- **Candidate Selection**: Only evaluates citizens with high migration desire
- **Regional Batching**: Processes migrations by region, not individually
- **Cleanup**: Automatically removes old migration records

### Optimization Tips

1. **Limit Active Regions**: More regions = more calculations
2. **Adjust Migration Rate**: Lower rate = fewer migrations to process
3. **Batch Size**: Controlled by `maxMigrationsPerTick`
4. **Update Frequency**: Monthly processing balances realism and performance

## Integration Points

### With Other Systems

- **DemographicSystem**: Population statistics affected by migration
- **EconomicSystem**: Regional economies change with population shifts
- **SocialNetworkSystem**: Relationships may break or form through migration
- **DiseaseSystem**: Disease spreads through migration
- **FamineSystem**: Food scarcity drives migration
- **ClimateSystem**: Natural disasters trigger mass migrations

### Events

Migration events are recorded in citizen life histories:

```typescript
{
  year: number,
  month: number,
  type: 'migration',
  description: 'Migrierte von {from} nach {to} wegen {reason}'
}
```

## Future Enhancements

Planned features (from roadmap):

- **Multiplayer Migration**: Players can influence migration policies
- **Immigration Control**: Border policies and visa systems
- **Refugee Systems**: War and persecution-driven mass migrations
- **Brain Drain**: Skilled workers migrating to better regions
- **Return Migration**: Citizens returning to origin regions
- **Migration Networks**: Chain migration along established paths

## API Reference

### MigrationSystem

**Methods:**

- `calculateRegionAttractiveness(...)`: Evaluates region desirability
- `calculateMigrationPressure(...)`: Determines migration likelihood
- `processMigrations(...)`: Executes migration flows
- `applyMigrationFlow(...)`: Records migration
- `getMigrationStats()`: Returns statistics
- `getActiveMigrationsForRegion(...)`: Gets current flows
- `cleanupOldMigrations()`: Removes old records

### CitizenSystem Migration Methods

**Methods:**

- `migrateCitizen(...)`: Moves citizen to new region
- `getMigrationCandidates(...)`: Finds willing migrants
- `updateMigrationDesires(...)`: Updates migration pressure

## Testing

### Manual Testing

1. Create multiple players in different regions
2. Make one region prosperous (high gold, food, infrastructure)
3. Make another region poor (low resources)
4. Advance months/years
5. Open Migration Panel to observe flows
6. Check citizen locations in Population view

### Expected Behavior

- Citizens should migrate from poor to rich regions
- Migration desire should be higher in worse regions
- Young adults should migrate more than elderly
- Distance should dampen migration between far regions

## Troubleshooting

### No Migrations Occurring

**Check:**
- Are there multiple regions with population?
- Is there significant attractiveness difference?
- Are citizens' migration desires being updated?
- Check console for migration processing logs

### Too Many/Few Migrations

**Adjust:**
- `baseMigrationRate` in MigrationSystem
- `maxMigrationsPerTick` in ScalabilityConfig
- Region attractiveness calculation weights

### Performance Issues

**Solutions:**
- Reduce number of active regions
- Increase `cleanupOldMigrations` frequency
- Lower migration rate
- Use aggregated citizen groups for large populations

## References

- [Population Dynamics Roadmap](../ROADMAP.md#version-215---bevölkerungsdynamik)
- [Scalability Guide](./SCALABLE_FEATURES_IMPLEMENTATION.md)
- [CitizenSystem API](./POPULATION_API.md)
- [GameEngine Architecture](./ARCHITECTURE.md)

---

**Last Updated**: December 2025  
**Version**: 2.1.5  
**Status**: ✅ Production Ready
