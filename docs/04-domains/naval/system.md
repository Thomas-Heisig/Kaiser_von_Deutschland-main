# 🚢 Naval Warfare System - API Documentation

**Version**: 2.3.5  
**Status**: Implemented  
**Last Updated**: December 2025

## Overview

The Naval Warfare System provides comprehensive naval combat, technology, and fleet management for Kaiser von Deutschland. It enables players to build and command fleets, research naval technologies, conduct sea battles, establish blockades, and engage in piracy.

## Features

### ⚓ Core Systems

1. **Naval Technology Tree**
   - 10 technologies from Ancient rowing to Nuclear propulsion
   - Prerequisites and era-based availability
   - Cost requirements (gold, wood, iron, coal)
   - Technology effects on naval capabilities

2. **Ship Units**
   - 8 ship types spanning all eras
   - From Galleys (Year 0) to Aircraft Carriers (1920)
   - Detailed stats: speed, strength, range, crew size
   - Special capabilities (cannons, torpedoes, aircraft)

3. **Fleet Management**
   - Create and manage multiple fleets per kingdom
   - Assign ships to fleets
   - Track morale, supplies, and experience
   - Fleet movement (ports, seas, rivers)

4. **Naval Combat**
   - Realistic battle simulation
   - Environmental factors (weather, sea state, visibility)
   - 4 combat tactics (ramming, boarding, broadside, torpedoes)
   - Casualty and prize calculations

5. **Blockade System**
   - Establish blockades on enemy ports
   - Effectiveness based on fleet strength
   - Supply consumption over time

6. **Piracy Mechanics**
   - Generate piracy events
   - Target merchants, military, or coastal areas
   - Loot and casualties tracking

## Technology Tree

### Technologies

| ID | Name | Era | Year | Prerequisite | Effects |
|----|------|-----|------|--------------|---------|
| `rowing` | Rudertechnik | Antike | 0 | - | Speed +0.1, Range +0.1 |
| `sailing` | Segeltechnik | Frühmittelalter | 500 | rowing | Speed +0.3, Range +0.4 |
| `navigation` | Navigation | Spätmittelalter | 1200 | sailing | Range +0.5, Exploration +0.3 |
| `shipbuilding` | Schiffsbau | Frühe Neuzeit | 1500 | navigation | Strength +0.3, Cargo +0.4 |
| `steam_power` | Dampfkraft | Industrialisierung | 1820 | shipbuilding | Speed +0.6, Independence +0.8 |
| `ironclads` | Panzerschiffe | Industrialisierung | 1860 | steam_power | Strength +0.8, Defense +0.7 |
| `dreadnoughts` | Schlachtschiffe | Moderne | 1906 | ironclads | Strength +1.5, Range +0.9 |
| `submarines` | U-Boote | Moderne | 1900 | steam_power | Stealth +0.9, Commerce Raiding +0.8 |
| `aircraft_carriers` | Flugzeugträger | Moderne | 1920 | dreadnoughts | Air Power +1.0, Projection +1.2 |
| `nuclear_propulsion` | Nuklearantrieb | Gegenwart | 1955 | submarines | Range +2.0, Independence +2.0 |

### Ship Types

| ID | Name | Era | Year | Cost | Crew | Speed | Strength | Range | Special |
|----|------|-----|------|------|------|-------|----------|-------|---------|
| `galley` | Galeere | Antike | 0 | 500g, 200w | 100 | 15 | 10 | 200 | - |
| `cog` | Kogge | Mittelalter | 1000 | 1000g, 400w | 50 | 20 | 20 | 500 | 200 cargo |
| `carrack` | Karacke | Frühe Neuzeit | 1400 | 3000g, 800w | 200 | 25 | 40 | 2000 | 500 cargo |
| `ship_of_line` | Linienschiff | Frühe Neuzeit | 1650 | 10000g, 2000w, 500i | 800 | 20 | 100 | 3000 | 74 cannons |
| `ironclad` | Panzerschiff | Industrialisierung | 1860 | 25000g, 5000i, 2000c | 400 | 30 | 200 | 5000 | Armored |
| `dreadnought` | Schlachtschiff | Moderne | 1906 | 80000g, 15000i, 5000c | 1200 | 40 | 500 | 8000 | 10 main guns |
| `submarine` | U-Boot | Moderne | 1900 | 30000g, 8000i, 3000c | 50 | 25 | 100 | 10000 | 20 torpedoes, 0.9 stealth |
| `carrier` | Flugzeugträger | Moderne | 1920 | 200000g, 30000i, 10000c | 3000 | 35 | 300 | 15000 | 80 aircraft |

## API Reference

### NavalSystem Class

#### Initialization

```typescript
const navalSystem = new NavalSystem();
await navalSystem.initialize(); // Load data from JSON
```

#### Technology Management

```typescript
// Get available technologies for a kingdom
const availableTech = navalSystem.getAvailableTechnologies(kingdomId, currentYear);

// Research a technology
const success = navalSystem.researchTechnology(kingdomId, 'sailing');

// Check if technology is researched
const hasTech = navalSystem.hasTechnology(kingdomId, 'steam_power');

// Get a specific technology
const tech = navalSystem.getTechnology('navigation');
```

#### Fleet Management

```typescript
// Create a new fleet
const fleet = navalSystem.createFleet(
  kingdomId,
  'Baltic Fleet',
  'hamburg',
  new Map([['ship_of_line', 5], ['frigate', 10]])
);

// Add ships to a fleet
navalSystem.addShipsToFleet(fleetId, 'dreadnought', 3);

// Move fleet
navalSystem.moveFleet(fleetId, 'rotterdam', 'port');

// Calculate fleet strength
const strength = navalSystem.calculateFleetStrength(fleetId);

// Get kingdom's fleets
const fleets = navalSystem.getKingdomFleets(kingdomId);
```

#### Combat

```typescript
// Simulate a naval battle
const battle = navalSystem.simulateBattle(
  attackerFleetId,
  defenderFleetId,
  currentYear,
  'North Sea'
);

// Get available tactics
const tactics = navalSystem.getAvailableTactics(currentYear);

// Get battle history
const battles = navalSystem.getKingdomBattles(kingdomId);
```

#### Blockades

```typescript
// Establish a blockade
const blockade = navalSystem.establishBlockade(
  fleetId,
  'london_port',
  currentYear
);

// Get port blockades
const blockades = navalSystem.getPortBlockades('london_port');

// Remove blockade
navalSystem.removeBlockade(blockadeId);
```

#### Piracy

```typescript
// Generate piracy event
const pirateEvent = navalSystem.generatePiracyEvent(
  currentYear,
  'Mediterranean',
  'merchant'
);

// Get piracy events
const events = navalSystem.getPiracyEventsByYear(currentYear);
```

#### Monthly Updates

```typescript
// Called automatically by GameEngine each month
navalSystem.monthlyUpdate(year, month);

// This updates:
// - Fleet supplies (consumption and replenishment)
// - Morale (decreases with low supplies, recovers in port)
// - Blockade supply consumption
```

#### Statistics

```typescript
// Get summary for UI
const summary = navalSystem.getSummary(kingdomId);
// Returns: {
//   totalFleets: number,
//   totalShips: number,
//   totalStrength: number,
//   technologiesResearched: number,
//   activeBattles: number,
//   activeBlockades: number
// }
```

## Data Structures

### Fleet

```typescript
interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  ships: Map<string, number>; // shipTypeId -> count
  location: {
    regionId: string;
    type: 'port' | 'sea' | 'river';
  };
  admiralName?: string;
  admiralSkill?: number;
  morale: number; // 0-100
  supplies: number; // 0-maxSupplies
  maxSupplies: number;
  experience: number;
  status: 'anchored' | 'patrol' | 'transit' | 'combat' | 'blockade' | 'raiding';
}
```

### Naval Battle

```typescript
interface NavalBattle {
  id: string;
  year: number;
  location: string;
  attacker: {
    kingdomId: string;
    fleetId: string;
    strength: number;
    tactics: string[];
  };
  defender: {
    kingdomId: string;
    fleetId: string;
    strength: number;
    tactics: string[];
  };
  environment: {
    weather: 'clear' | 'fog' | 'storm' | 'calm';
    seaState: 'calm' | 'rough' | 'stormy';
    visibility: number; // 0-1
  };
  outcome?: {
    winner: string;
    casualties: {
      attacker: number;
      defender: number;
    };
    shipsLost: Map<string, number>;
    shipsCaptured: Map<string, number>;
  };
}
```

## Integration with GameEngine

The NavalSystem is integrated into the GameEngine and accessible via:

```typescript
const gameEngine = new GameEngine();
const navalSystem = gameEngine.getNavalSystem();

// Systems are automatically initialized when game starts
await gameEngine.startGame();

// Monthly updates are called automatically
// No manual intervention needed for basic operation
```

## Combat Mechanics

### Battle Resolution

1. **Strength Calculation**: Base strength from ships × morale modifier × experience modifier
2. **Environmental Modifiers**: 
   - Storm: -30% to both sides
   - Fog: -10% to both sides  
   - Stormy seas: -20% to both sides
3. **Defender Advantage**: +20% to defender
4. **Outcome**: Probabilistic based on modified strengths
5. **Casualties**: 10-40% for winner, 30-70% for loser

### Morale System

- **Recovery**: +2 per month in port
- **Decay**: -5 per month when supplies < 20
- **Range**: 0-100
- **Effect on Combat**: Multiplier for fleet strength

### Supply System

- **Consumption**:
  - Patrol/Blockade: -5 per month
  - Transit: -3 per month
  - Anchored: Replenishes +10 per month (up to max)
- **Low Supply Penalty**: Morale drops when supplies < 20

## Usage Examples

### Example 1: Research Naval Technology

```typescript
const navalSystem = gameEngine.getNavalSystem();

// Check what's available
const availableTech = navalSystem.getAvailableTechnologies('kingdom_1', 1500);

// Research sailing technology
if (navalSystem.researchTechnology('kingdom_1', 'sailing')) {
  console.log('Sailing technology researched!');
}
```

### Example 2: Build and Deploy a Fleet

```typescript
// Create a fleet with carracks
const fleet = navalSystem.createFleet(
  'kingdom_1',
  'Atlantic Expedition Fleet',
  'lisbon',
  new Map([['carrack', 5]])
);

// Move to sea for exploration
navalSystem.moveFleet(fleet.id, 'atlantic_ocean', 'sea');

// Add more ships later
navalSystem.addShipsToFleet(fleet.id, 'carrack', 3);
```

### Example 3: Naval Battle

```typescript
// Two fleets meet in battle
const attackerFleet = navalSystem.createFleet(
  'kingdom_1',
  'Strike Fleet',
  'channel',
  new Map([['ship_of_line', 10]])
);

const defenderFleet = navalSystem.createFleet(
  'kingdom_2',
  'Home Fleet',
  'channel',
  new Map([['ship_of_line', 8], ['frigate', 15]])
);

// Simulate battle
const battle = navalSystem.simulateBattle(
  attackerFleet.id,
  defenderFleet.id,
  1805,
  'English Channel'
);

if (battle?.outcome) {
  console.log(`Winner: ${battle.outcome.winner}`);
  console.log(`Attacker casualties: ${battle.outcome.casualties.attacker}`);
  console.log(`Defender casualties: ${battle.outcome.casualties.defender}`);
}
```

### Example 4: Blockade Enemy Port

```typescript
// Position fleet for blockade
const fleet = navalSystem.getFleet(fleetId);
navalSystem.moveFleet(fleetId, 'enemy_port_region', 'sea');

// Establish blockade
const blockade = navalSystem.establishBlockade(
  fleetId,
  'enemy_port',
  1812
);

console.log(`Blockade effectiveness: ${blockade.effectiveness * 100}%`);

// Check port blockades
const activeBlockades = navalSystem.getPortBlockades('enemy_port');
console.log(`Port has ${activeBlockades.length} active blockades`);
```

## Best Practices

1. **Technology Progression**: Always research prerequisites before advanced technologies
2. **Fleet Composition**: Mix ship types for balanced capabilities
3. **Supply Management**: Keep fleets near friendly ports to maintain supplies
4. **Morale**: Rotate fleets to ports regularly to maintain high morale
5. **Experience**: Keep successful fleets together to build experience bonuses
6. **Blockades**: Use strong fleets for blockades as they consume supplies continuously

## Future Enhancements (Planned)

- [ ] Harbor combat mechanics
- [ ] Coastal bombardment
- [ ] Naval transport for land armies
- [ ] Advanced weather systems
- [ ] Trade route protection missions
- [ ] Multiplayer fleet battles
- [ ] 3D naval battle visualization
- [ ] Historical naval commanders

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to the Naval System.

## License

MIT License - See [LICENSE](../LICENSE) for details.

---

**Developed with ❤️ for Kaiser von Deutschland v2.3.5**
