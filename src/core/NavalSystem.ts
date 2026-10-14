// src/core/NavalSystem.ts

/**
 * Naval Warfare System for Kaiser von Deutschland
 * Implements comprehensive naval combat, technology, and fleet management
 * 
 * Features:
 * - Naval technology tree (10 technologies from rowing to nuclear propulsion)
 * - Ship units (8 types from galleys to aircraft carriers)
 * - Combat tactics (ramming, boarding, broadsides, torpedoes)
 * - Fleet management and naval battles
 * - Harbor combat and blockades
 * - River and coastal navigation
 * - Piracy mechanics
 * 
 * @version 2.3.5
 */

export interface NavalTechnology {
  id: string;
  name: string;
  era: string;
  yearAvailable: number;
  cost: {
    gold: number;
    wood?: number;
    iron?: number;
    coal?: number;
  };
  description: string;
  prerequisite?: string;
  effects: {
    navalSpeed?: number;
    navalRange?: number;
    navalStrength?: number;
    cargoCapacity?: number;
    explorationSpeed?: number;
    independence?: number;
    defense?: number;
    stealth?: number;
    commerce_raiding?: number;
    airPower?: number;
    projection?: number;
  };
}

export interface NavalUnit {
  id: string;
  name: string;
  era: string;
  yearAvailable: number;
  cost: {
    gold: number;
    wood?: number;
    iron?: number;
    coal?: number;
  };
  maintenanceCost: number;
  crewSize: number;
  speed: number;
  strength: number;
  range: number;
  cargoCapacity?: number;
  cannons?: number;
  mainGuns?: number;
  stealth?: number;
  torpedoes?: number;
  aircraft?: number;
  description: string;
}

export interface NavalCombatTactic {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  era: string;
}

export interface Fleet {
  id: string;
  name: string;
  ownerId: string; // Kingdom or player ID
  ships: Map<string, number>; // Ship type ID -> count
  location: {
    regionId: string;
    type: 'port' | 'sea' | 'river';
  };
  admiralName?: string;
  admiralSkill?: number;
  morale: number;
  supplies: number;
  maxSupplies: number;
  experience: number;
  status: 'anchored' | 'patrol' | 'transit' | 'combat' | 'blockade' | 'raiding';
}

export interface NavalBattle {
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
    shipsLost: {
      attacker: Map<string, number>;
      defender: Map<string, number>;
    };
    shipsCaptured: {
      attacker: Map<string, number>;
      defender: Map<string, number>;
    };
  };
}

export interface Blockade {
  id: string;
  fleetId: string;
  targetPortId: string;
  startYear: number;
  effectiveness: number; // 0-1, how much trade is blocked
  suppliesConsumed: number; // Per month
}

export interface PiracyEvent {
  id: string;
  year: number;
  location: string;
  pirateFleetId?: string;
  targetType: 'merchant' | 'military' | 'coastal';
  loot: number;
  casualties: number;
  success: boolean;
}

export class NavalSystem {
  private technologies: Map<string, NavalTechnology> = new Map();
  private navalUnits: Map<string, NavalUnit> = new Map();
  private combatTactics: Map<string, NavalCombatTactic> = new Map();
  private fleets: Map<string, Fleet> = new Map();
  private battles: NavalBattle[] = [];
  private blockades: Map<string, Blockade> = new Map();
  private piracyEvents: PiracyEvent[] = [];
  private researchedTech: Map<string, Set<string>> = new Map(); // kingdomId -> tech IDs

  /**
   * Initialize the naval system by loading data from JSON
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/naval-systems.json');
      const data = await response.json();

      // Load naval technologies
      data.navalTechnologies.forEach((tech: NavalTechnology) => {
        this.technologies.set(tech.id, tech);
      });

      // Load naval units
      data.navalUnits.forEach((unit: NavalUnit) => {
        this.navalUnits.set(unit.id, unit);
      });

      // Load combat tactics
      data.navalCombatTactics.forEach((tactic: NavalCombatTactic) => {
        this.combatTactics.set(tactic.id, tactic);
      });

      console.log(`Naval System initialized: ${this.technologies.size} technologies, ${this.navalUnits.size} ship types, ${this.combatTactics.size} tactics`);
    } catch (error) {
      console.error('Failed to load naval systems data:', error);
    }
  }

  // ==================== Technology Management ====================

  /**
   * Get a specific naval technology
   */
  getTechnology(id: string): NavalTechnology | undefined {
    return this.technologies.get(id);
  }

  /**
   * Get all naval technologies
   */
  getAllTechnologies(): NavalTechnology[] {
    return Array.from(this.technologies.values());
  }

  /**
   * Get available technologies for a kingdom based on year and prerequisites
   */
  getAvailableTechnologies(kingdomId: string, year: number): NavalTechnology[] {
    const researched = this.researchedTech.get(kingdomId) || new Set();
    
    return Array.from(this.technologies.values()).filter(tech => {
      // Check year availability
      if (tech.yearAvailable > year) return false;

      // Already researched
      if (researched.has(tech.id)) return false;

      // Check prerequisite
      if (tech.prerequisite && !researched.has(tech.prerequisite)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Research a naval technology
   */
  researchTechnology(kingdomId: string, techId: string): boolean {
    const tech = this.technologies.get(techId);
    if (!tech) return false;

    const researched = this.researchedTech.get(kingdomId) || new Set();
    
    // Check prerequisite
    if (tech.prerequisite && !researched.has(tech.prerequisite)) {
      return false;
    }

    researched.add(techId);
    this.researchedTech.set(kingdomId, researched);
    return true;
  }

  /**
   * Check if a kingdom has researched a specific technology
   */
  hasTechnology(kingdomId: string, techId: string): boolean {
    const researched = this.researchedTech.get(kingdomId);
    return researched ? researched.has(techId) : false;
  }

  // ==================== Ship Unit Management ====================

  /**
   * Get a specific naval unit type
   */
  getNavalUnit(id: string): NavalUnit | undefined {
    return this.navalUnits.get(id);
  }

  /**
   * Get all naval unit types
   */
  getAllNavalUnits(): NavalUnit[] {
    return Array.from(this.navalUnits.values());
  }

  /**
   * Get available ship types for a kingdom based on year
   * Note: Ships are unlocked by year, not technology. Technologies enhance naval capabilities.
   * This allows historical progression where ships evolve naturally over time.
   */
  getAvailableShips(_kingdomId: string, year: number): NavalUnit[] {
    return Array.from(this.navalUnits.values()).filter(ship => {
      // Check year availability
      return ship.yearAvailable <= year;
    });
  }

  // ==================== Fleet Management ====================

  /**
   * Create a new fleet
   */
  createFleet(
    kingdomId: string,
    name: string,
    regionId: string,
    ships: Map<string, number> = new Map()
  ): Fleet {
    const fleet: Fleet = {
      id: `fleet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      ownerId: kingdomId,
      ships,
      location: {
        regionId,
        type: 'port'
      },
      morale: 100,
      supplies: 100,
      maxSupplies: 100,
      experience: 0,
      status: 'anchored'
    };

    this.fleets.set(fleet.id, fleet);
    return fleet;
  }

  /**
   * Get a specific fleet
   */
  getFleet(fleetId: string): Fleet | undefined {
    return this.fleets.get(fleetId);
  }

  /**
   * Get all fleets for a kingdom
   */
  getKingdomFleets(kingdomId: string): Fleet[] {
    return Array.from(this.fleets.values()).filter(
      fleet => fleet.ownerId === kingdomId
    );
  }

  /**
   * Add ships to a fleet
   */
  addShipsToFleet(fleetId: string, shipTypeId: string, count: number): boolean {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return false;

    const currentCount = fleet.ships.get(shipTypeId) || 0;
    fleet.ships.set(shipTypeId, currentCount + count);
    return true;
  }

  /**
   * Calculate total fleet strength
   */
  calculateFleetStrength(fleetId: string): number {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return 0;

    let totalStrength = 0;
    fleet.ships.forEach((count, shipTypeId) => {
      const ship = this.navalUnits.get(shipTypeId);
      if (ship) {
        totalStrength += ship.strength * count;
      }
    });

    // Apply morale and experience modifiers
    const moraleModifier = fleet.morale / 100;
    const experienceModifier = 1 + (fleet.experience / 100);

    return totalStrength * moraleModifier * experienceModifier;
  }

  /**
   * Move a fleet to a new location
   */
  moveFleet(fleetId: string, targetRegionId: string, locationType: 'port' | 'sea' | 'river'): boolean {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return false;

    fleet.location = {
      regionId: targetRegionId,
      type: locationType
    };
    fleet.status = 'transit';
    return true;
  }

  // ==================== Combat System ====================

  /**
   * Get a specific combat tactic
   */
  getCombatTactic(id: string): NavalCombatTactic | undefined {
    return this.combatTactics.get(id);
  }

  /**
   * Get all combat tactics
   */
  getAllCombatTactics(): NavalCombatTactic[] {
    return Array.from(this.combatTactics.values());
  }

  /**
   * Get available tactics based on era
   */
  getAvailableTactics(year: number): NavalCombatTactic[] {
    const era = this.getEraFromYear(year);
    return Array.from(this.combatTactics.values()).filter(
      tactic => this.isEraAvailable(tactic.era, era)
    );
  }

  /**
   * Simulate a naval battle between two fleets
   */
  simulateBattle(
    attackerFleetId: string,
    defenderFleetId: string,
    year: number,
    location: string
  ): NavalBattle | null {
    const attackerFleet = this.fleets.get(attackerFleetId);
    const defenderFleet = this.fleets.get(defenderFleetId);

    if (!attackerFleet || !defenderFleet) return null;

    const attackerStrength = this.calculateFleetStrength(attackerFleetId);
    const defenderStrength = this.calculateFleetStrength(defenderFleetId);

    // Generate battle environment
    const environment = this.generateBattleEnvironment();

    // Create battle record
    const battle: NavalBattle = {
      id: `battle_${Date.now()}`,
      year,
      location,
      attacker: {
        kingdomId: attackerFleet.ownerId,
        fleetId: attackerFleetId,
        strength: attackerStrength,
        tactics: []
      },
      defender: {
        kingdomId: defenderFleet.ownerId,
        fleetId: defenderFleetId,
        strength: defenderStrength,
        tactics: []
      },
      environment
    };

    // Calculate battle outcome
    const outcome = this.calculateBattleOutcome(
      attackerFleet,
      defenderFleet,
      attackerStrength,
      defenderStrength,
      environment
    );

    battle.outcome = outcome;
    this.battles.push(battle);

    // Update fleet status
    if (outcome) {
      this.applyBattleCasualties(attackerFleetId, outcome.shipsLost.attacker);
      this.applyBattleCasualties(defenderFleetId, outcome.shipsLost.defender);
    }

    // Update experience
    attackerFleet.experience += 10;
    defenderFleet.experience += 10;

    return battle;
  }

  /**
   * Calculate battle outcome based on strengths and environment
   */
  private calculateBattleOutcome(
    attackerFleet: Fleet,
    defenderFleet: Fleet,
    attackerStrength: number,
    defenderStrength: number,
    environment: NavalBattle['environment']
  ): NavalBattle['outcome'] {
    // Environmental modifiers
    let attackerModifier = 1.0;
    let defenderModifier = 1.2; // Defender advantage

    // Weather effects
    if (environment.weather === 'storm') {
      attackerModifier *= 0.7;
      defenderModifier *= 0.7;
    } else if (environment.weather === 'fog') {
      attackerModifier *= 0.9;
      defenderModifier *= 0.9;
    }

    // Sea state effects
    if (environment.seaState === 'stormy') {
      attackerModifier *= 0.8;
      defenderModifier *= 0.8;
    }

    const modifiedAttackerStrength = attackerStrength * attackerModifier;
    const modifiedDefenderStrength = defenderStrength * defenderModifier;

    const totalStrength = modifiedAttackerStrength + modifiedDefenderStrength;
    const attackerChance = modifiedAttackerStrength / totalStrength;

    // Determine winner
    const winner = Math.random() < attackerChance ? 'attacker' : 'defender';

    // Calculate casualties (10-40% losses for winner, 30-70% for loser)
    const winnerLossRate = 0.1 + Math.random() * 0.3;
    const loserLossRate = 0.3 + Math.random() * 0.4;

    const attackerCasualties = winner === 'attacker' 
      ? attackerStrength * winnerLossRate 
      : attackerStrength * loserLossRate;
    
    const defenderCasualties = winner === 'defender' 
      ? defenderStrength * winnerLossRate 
      : defenderStrength * loserLossRate;

    // Calculate ship losses based on casualty rates
    const attackerShipsLost = this.calculateShipLosses(
      attackerFleet,
      winner === 'attacker' ? winnerLossRate : loserLossRate
    );
    
    const defenderShipsLost = this.calculateShipLosses(
      defenderFleet,
      winner === 'defender' ? winnerLossRate : loserLossRate
    );

    return {
      winner,
      casualties: {
        attacker: Math.floor(attackerCasualties),
        defender: Math.floor(defenderCasualties)
      },
      shipsLost: {
        attacker: attackerShipsLost,
        defender: defenderShipsLost
      },
      shipsCaptured: {
        attacker: new Map(),
        defender: new Map()
      }
    };
  }

  /**
   * Calculate ship losses for a fleet based on loss rate
   */
  private calculateShipLosses(fleet: Fleet, lossRate: number): Map<string, number> {
    const losses = new Map<string, number>();
    
    fleet.ships.forEach((count, shipTypeId) => {
      const shipsLost = Math.floor(count * lossRate);
      if (shipsLost > 0) {
        losses.set(shipTypeId, shipsLost);
      }
    });
    
    return losses;
  }

  /**
   * Generate random battle environment
   */
  private generateBattleEnvironment(): NavalBattle['environment'] {
    const weathers: NavalBattle['environment']['weather'][] = ['clear', 'fog', 'storm', 'calm'];
    const seaStates: NavalBattle['environment']['seaState'][] = ['calm', 'rough', 'stormy'];

    return {
      weather: weathers[Math.floor(Math.random() * weathers.length)],
      seaState: seaStates[Math.floor(Math.random() * seaStates.length)],
      visibility: Math.random()
    };
  }

  /**
   * Apply battle casualties to a fleet
   */
  private applyBattleCasualties(fleetId: string, casualties: Map<string, number>): void {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return;

    casualties.forEach((count, shipTypeId) => {
      const currentCount = fleet.ships.get(shipTypeId) || 0;
      const newCount = Math.max(0, currentCount - count);
      
      if (newCount === 0) {
        fleet.ships.delete(shipTypeId);
      } else {
        fleet.ships.set(shipTypeId, newCount);
      }
    });

    // Check if fleet is destroyed
    if (fleet.ships.size === 0) {
      this.fleets.delete(fleetId);
    }
  }

  // ==================== Blockade System ====================

  /**
   * Establish a naval blockade
   */
  establishBlockade(fleetId: string, targetPortId: string, year: number): Blockade | null {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return null;

    const fleetStrength = this.calculateFleetStrength(fleetId);
    const effectiveness = Math.min(1.0, fleetStrength / 1000);

    const blockade: Blockade = {
      id: `blockade_${Date.now()}`,
      fleetId,
      targetPortId,
      startYear: year,
      effectiveness,
      suppliesConsumed: 5 // Per month
    };

    this.blockades.set(blockade.id, blockade);
    fleet.status = 'blockade';

    return blockade;
  }

  /**
   * Get active blockades for a port
   */
  getPortBlockades(portId: string): Blockade[] {
    return Array.from(this.blockades.values()).filter(
      blockade => blockade.targetPortId === portId
    );
  }

  /**
   * Remove a blockade
   */
  removeBlockade(blockadeId: string): boolean {
    const blockade = this.blockades.get(blockadeId);
    if (!blockade) return false;

    const fleet = this.fleets.get(blockade.fleetId);
    if (fleet) {
      fleet.status = 'anchored';
    }

    return this.blockades.delete(blockadeId);
  }

  // ==================== Piracy System ====================

  /**
   * Generate a piracy event
   */
  generatePiracyEvent(
    year: number,
    location: string,
    targetType: PiracyEvent['targetType']
  ): PiracyEvent {
    const success = Math.random() > 0.5;
    const loot = success ? Math.floor(Math.random() * 10000) : 0;
    const casualties = Math.floor(Math.random() * 50);

    const event: PiracyEvent = {
      id: `piracy_${Date.now()}`,
      year,
      location,
      targetType,
      loot,
      casualties,
      success
    };

    this.piracyEvents.push(event);
    return event;
  }

  /**
   * Get piracy events for a specific year
   */
  getPiracyEventsByYear(year: number): PiracyEvent[] {
    return this.piracyEvents.filter(event => event.year === year);
  }

  /**
   * Get all piracy events
   */
  getAllPiracyEvents(): PiracyEvent[] {
    return this.piracyEvents;
  }

  // ==================== Utility Methods ====================

  /**
   * Get era from year
   */
  private getEraFromYear(year: number): string {
    if (year < 500) return 'Antike';
    if (year < 1000) return 'Frühmittelalter';
    if (year < 1200) return 'Mittelalter';
    if (year < 1500) return 'Spätmittelalter';
    if (year < 1800) return 'Frühe Neuzeit';
    if (year < 1900) return 'Industrialisierung';
    if (year < 2000) return 'Moderne';
    return 'Gegenwart';
  }

  /**
   * Check if an era is available for the current year
   */
  private isEraAvailable(requiredEra: string, currentEra: string): boolean {
    const eras = ['Antike', 'Frühmittelalter', 'Mittelalter', 'Spätmittelalter', 
                  'Frühe Neuzeit', 'Industrialisierung', 'Moderne', 'Gegenwart'];
    const requiredIndex = eras.indexOf(requiredEra);
    const currentIndex = eras.indexOf(currentEra);
    return currentIndex >= requiredIndex;
  }

  /**
   * Get all battles
   */
  getAllBattles(): NavalBattle[] {
    return this.battles;
  }

  /**
   * Get battles by year
   */
  getBattlesByYear(year: number): NavalBattle[] {
    return this.battles.filter(battle => battle.year === year);
  }

  /**
   * Get battles for a specific kingdom
   */
  getKingdomBattles(kingdomId: string): NavalBattle[] {
    return this.battles.filter(
      battle => battle.attacker.kingdomId === kingdomId || 
                battle.defender.kingdomId === kingdomId
    );
  }

  /**
   * Update fleets monthly (supplies, morale, etc.)
   */
  monthlyUpdate(_year: number, _month: number): void {
    this.fleets.forEach(fleet => {
      // Consume supplies
      if (fleet.status === 'patrol' || fleet.status === 'blockade') {
        fleet.supplies = Math.max(0, fleet.supplies - 5);
      } else if (fleet.status === 'transit') {
        fleet.supplies = Math.max(0, fleet.supplies - 3);
      } else {
        // Replenish supplies in port
        fleet.supplies = Math.min(fleet.maxSupplies, fleet.supplies + 10);
      }

      // Morale decreases if low on supplies
      if (fleet.supplies < 20) {
        fleet.morale = Math.max(0, fleet.morale - 5);
      } else if (fleet.location.type === 'port') {
        // Morale recovers in port
        fleet.morale = Math.min(100, fleet.morale + 2);
      }
    });

    // Update blockades
    this.blockades.forEach(blockade => {
      const fleet = this.fleets.get(blockade.fleetId);
      if (fleet) {
        fleet.supplies = Math.max(0, fleet.supplies - blockade.suppliesConsumed);
      }
    });
  }

  /**
   * Get summary statistics for UI display
   */
  getSummary(kingdomId: string): {
    totalFleets: number;
    totalShips: number;
    totalStrength: number;
    technologiesResearched: number;
    activeBattles: number;
    activeBlockades: number;
  } {
    const fleets = this.getKingdomFleets(kingdomId);
    const totalShips = fleets.reduce((sum, fleet) => {
      let fleetShips = 0;
      fleet.ships.forEach(count => fleetShips += count);
      return sum + fleetShips;
    }, 0);

    const totalStrength = fleets.reduce((sum, fleet) => 
      sum + this.calculateFleetStrength(fleet.id), 0
    );

    const researched = this.researchedTech.get(kingdomId) || new Set();
    const activeBattles = this.battles.filter(battle =>
      battle.attacker.kingdomId === kingdomId || 
      battle.defender.kingdomId === kingdomId
    ).length;

    const activeBlockades = Array.from(this.blockades.values()).filter(blockade => {
      const fleet = this.fleets.get(blockade.fleetId);
      return fleet && fleet.ownerId === kingdomId;
    }).length;

    return {
      totalFleets: fleets.length,
      totalShips,
      totalStrength,
      technologiesResearched: researched.size,
      activeBattles,
      activeBlockades
    };
  }
}
