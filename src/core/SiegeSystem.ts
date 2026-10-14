/**
 * Siege System
 * 
 * Implements siege warfare mechanics:
 * - Siege tools (Catapults, Cannons, Battering Rams, Siege Towers)
 * - City walls with different strengths
 * - Undermining mechanics
 * - Supply management
 * - Sortie attacks
 * 
 * Scalability:
 * - Units aggregated for large sieges
 * - Supply calculations cached
 * - Wall damage calculated at segment level, not per stone
 */

/**
 * Siege tool types
 */
export type SiegeTool = 'catapult' | 'trebuchet' | 'cannon' | 'battering_ram' | 'siege_tower' | 'mining_team' | 'bombard';

/**
 * Siege tool definition
 */
export interface SiegeToolDefinition {
  /** Tool type */
  type: SiegeTool;
  /** Display name */
  name: string;
  /** Damage to walls per hour */
  wallDamage: number;
  /** Damage to buildings per hour */
  buildingDamage: number;
  /** Crew required */
  crewSize: number;
  /** Range in meters */
  range: number;
  /** Era available (year) */
  availableFrom: number;
  /** Cost to build */
  cost: number;
  /** Ammunition consumption per hour */
  ammunitionPerHour: number;
}

/**
 * City wall segment
 */
export interface WallSegment {
  /** Segment ID */
  id: string;
  /** Wall type */
  type: 'wooden_palisade' | 'stone_wall' | 'reinforced_stone' | 'medieval_fortress' | 'renaissance_bastion' | 'modern_fortification';
  /** Current integrity (0-100) */
  integrity: number;
  /** Maximum strength */
  maxStrength: number;
  /** Defenders on this segment */
  defenders: number;
  /** Under siege tool attack */
  underAttack: boolean;
  /** Undermined status */
  undermined: boolean;
}

/**
 * Siege state
 */
export interface Siege {
  /** Siege ID */
  id: string;
  /** Attacker kingdom ID */
  attackerId: string;
  /** Defender kingdom ID (city owner) */
  defenderId: string;
  /** Besieged city/region ID */
  targetId: string;
  /** Start date */
  startDate: number;
  /** Siege duration in days */
  duration: number;
  /** Attacking force size */
  attackingForce: number;
  /** Defending force size */
  defendingForce: number;
  /** Siege tools */
  siegeTools: Map<SiegeTool, number>; // Tool type -> count
  /** Wall segments */
  walls: WallSegment[];
  /** Supplies remaining (days) */
  attackerSupplies: number;
  /** Defender supplies (days) */
  defenderSupplies: number;
  /** Attrition rate per day */
  attritionRate: number;
  /** Morale (0-100) */
  attackerMorale: number;
  defenderMorale: number;
  /** Breaches created */
  breaches: number;
  /** Status */
  status: 'ongoing' | 'breach_achieved' | 'relieved' | 'surrendered' | 'lifted';
}

/**
 * Siege event
 */
export interface SiegeEvent {
  /** Event type */
  type: 'bombardment' | 'sortie' | 'breach' | 'undermining' | 'supply_shortage' | 'relief_force';
  /** Description */
  description: string;
  /** Casualties attacker */
  attackerCasualties: number;
  /** Casualties defender */
  defenderCasualties: number;
  /** Wall damage */
  wallDamage: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Siege System
 */
export class SiegeSystem {
  private siegeTools: Map<SiegeTool, SiegeToolDefinition> = new Map();
  private activeSieges: Map<string, Siege> = new Map();
  private siegeEvents: Map<string, SiegeEvent[]> = new Map();

  constructor() {
    this.initializeSiegeTools();
  }

  /**
   * Initialize siege tool definitions
   */
  private initializeSiegeTools(): void {
    this.siegeTools.set('battering_ram', {
      type: 'battering_ram',
      name: 'Rammbock',
      wallDamage: 5,
      buildingDamage: 2,
      crewSize: 20,
      range: 10,
      availableFrom: 0,
      cost: 500,
      ammunitionPerHour: 0
    });

    this.siegeTools.set('catapult', {
      type: 'catapult',
      name: 'Katapult',
      wallDamage: 8,
      buildingDamage: 10,
      crewSize: 15,
      range: 200,
      availableFrom: 500,
      cost: 1000,
      ammunitionPerHour: 2
    });

    this.siegeTools.set('trebuchet', {
      type: 'trebuchet',
      name: 'Trebuchet',
      wallDamage: 15,
      buildingDamage: 20,
      crewSize: 30,
      range: 300,
      availableFrom: 1200,
      cost: 2500,
      ammunitionPerHour: 3
    });

    this.siegeTools.set('siege_tower', {
      type: 'siege_tower',
      name: 'Belagerungsturm',
      wallDamage: 0,
      buildingDamage: 0,
      crewSize: 40,
      range: 20,
      availableFrom: 800,
      cost: 1500,
      ammunitionPerHour: 0
    });

    this.siegeTools.set('mining_team', {
      type: 'mining_team',
      name: 'Minierungstrupp',
      wallDamage: 30, // Very effective but slow
      buildingDamage: 0,
      crewSize: 50,
      range: 0,
      availableFrom: 1000,
      cost: 800,
      ammunitionPerHour: 5 // Wood for supports
    });

    this.siegeTools.set('bombard', {
      type: 'bombard',
      name: 'Bombarde',
      wallDamage: 25,
      buildingDamage: 30,
      crewSize: 20,
      range: 400,
      availableFrom: 1400,
      cost: 3500,
      ammunitionPerHour: 5
    });

    this.siegeTools.set('cannon', {
      type: 'cannon',
      name: 'Kanone',
      wallDamage: 40,
      buildingDamage: 50,
      crewSize: 10,
      range: 800,
      availableFrom: 1600,
      cost: 5000,
      ammunitionPerHour: 10
    });
  }

  /**
   * Start a siege
   */
  public startSiege(
    attackerId: string,
    defenderId: string,
    targetId: string,
    attackingForce: number,
    defendingForce: number,
    wallType: WallSegment['type']
  ): Siege {
    const id = `siege_${targetId}_${Date.now()}`;

    // Create wall segments
    const wallSegmentCount = 4; // North, East, South, West
    const walls: WallSegment[] = [];
    
    for (let i = 0; i < wallSegmentCount; i++) {
      walls.push({
        id: `wall_${i}`,
        type: wallType,
        integrity: 100,
        maxStrength: this.getWallStrength(wallType),
        defenders: Math.floor(defendingForce / wallSegmentCount),
        underAttack: false,
        undermined: false
      });
    }

    const siege: Siege = {
      id,
      attackerId,
      defenderId,
      targetId,
      startDate: Date.now(),
      duration: 0,
      attackingForce,
      defendingForce,
      siegeTools: new Map(),
      walls,
      attackerSupplies: this.calculateInitialSupplies(attackingForce),
      defenderSupplies: this.calculateInitialSupplies(defendingForce),
      attritionRate: 0.01, // 1% per day base
      attackerMorale: 70,
      defenderMorale: 80, // Defenders start with higher morale
      breaches: 0,
      status: 'ongoing'
    };

    this.activeSieges.set(id, siege);
    this.siegeEvents.set(id, []);
    
    return siege;
  }

  /**
   * Get wall strength based on type
   */
  private getWallStrength(type: WallSegment['type']): number {
    switch (type) {
      case 'wooden_palisade': return 500;
      case 'stone_wall': return 2000;
      case 'reinforced_stone': return 4000;
      case 'medieval_fortress': return 8000;
      case 'renaissance_bastion': return 15000;
      case 'modern_fortification': return 30000;
      default: return 1000;
    }
  }

  /**
   * Calculate initial supplies
   */
  private calculateInitialSupplies(_armySize: number): number {
    // Average 30 days supply
    return 30 + Math.random() * 20;
  }

  /**
   * Add siege tools to a siege
   */
  public addSiegeTools(siegeId: string, tool: SiegeTool, count: number): void {
    const siege = this.activeSieges.get(siegeId);
    if (!siege) return;

    const current = siege.siegeTools.get(tool) || 0;
    siege.siegeTools.set(tool, current + count);
  }

  /**
   * Update all active sieges
   */
  public updateSieges(deltaTime: number): void {
    for (const siege of this.activeSieges.values()) {
      if (siege.status !== 'ongoing') continue;

      this.updateSiege(siege, deltaTime);
    }
  }

  /**
   * Update a single siege
   */
  private updateSiege(siege: Siege, deltaTime: number): void {
    const days = deltaTime / (24 * 3600 * 1000); // Convert to days
    siege.duration += days;

    // Update supplies
    this.updateSupplies(siege, days);

    // Process bombardment
    this.processBombardment(siege, days);

    // Process attrition
    this.processAttrition(siege, days);

    // Update morale
    this.updateMorale(siege);

    // Check for sortie (random chance)
    if (Math.random() < 0.05 * days) { // 5% chance per day
      this.processSortie(siege);
    }

    // Check for breach
    this.checkForBreach(siege);

    // Check victory conditions
    this.checkVictoryConditions(siege);
  }

  /**
   * Update supplies
   */
  private updateSupplies(siege: Siege, days: number): void {
    // Consumption rate: 1 day per actual day + attrition
    siege.attackerSupplies -= days * (1 + siege.attritionRate);
    siege.defenderSupplies -= days * (1 + siege.attritionRate * 0.8); // Defenders more efficient

    // Supply shortage events
    if (siege.attackerSupplies < 5) {
      this.addSiegeEvent(siege, {
        type: 'supply_shortage',
        description: 'Belagerer leiden unter Versorgungsengpässen',
        attackerCasualties: Math.floor(siege.attackingForce * 0.01),
        defenderCasualties: 0,
        wallDamage: 0,
        timestamp: Date.now()
      });
      siege.attackerMorale -= 5;
    }

    if (siege.defenderSupplies < 5) {
      this.addSiegeEvent(siege, {
        type: 'supply_shortage',
        description: 'Verteidiger leiden unter Versorgungsengpässen',
        attackerCasualties: 0,
        defenderCasualties: Math.floor(siege.defendingForce * 0.01),
        wallDamage: 0,
        timestamp: Date.now()
      });
      siege.defenderMorale -= 10; // Worse for defenders
    }
  }

  /**
   * Process bombardment damage
   */
  private processBombardment(siege: Siege, days: number): void {
    let totalDamage = 0;
    
    for (const [toolType, count] of siege.siegeTools.entries()) {
      const toolDef = this.siegeTools.get(toolType);
      if (!toolDef) continue;

      const damage = toolDef.wallDamage * count * days * 24; // Per hour damage
      totalDamage += damage;

      // Distribute damage across walls
      const damagePerWall = damage / siege.walls.length;
      
      for (const wall of siege.walls) {
        const actualDamage = Math.min(damagePerWall, wall.integrity);
        wall.integrity -= actualDamage;
        wall.underAttack = true;
        
        if (wall.integrity <= 0) {
          wall.integrity = 0;
          // Wall breached
        }
      }
    }

    if (totalDamage > 0) {
      this.addSiegeEvent(siege, {
        type: 'bombardment',
        description: `Artillerie verursacht ${Math.floor(totalDamage)} Schaden an den Mauern`,
        attackerCasualties: 0,
        defenderCasualties: Math.floor(Math.random() * 10),
        wallDamage: totalDamage,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Process attrition
   */
  private processAttrition(siege: Siege, days: number): void {
    const attackerLoss = Math.floor(siege.attackingForce * siege.attritionRate * days);
    const defenderLoss = Math.floor(siege.defendingForce * siege.attritionRate * days * 0.5);

    siege.attackingForce -= attackerLoss;
    siege.defendingForce -= defenderLoss;
  }

  /**
   * Process sortie (defender counterattack)
   */
  private processSortie(siege: Siege): void {
    const sortieForce = Math.floor(siege.defendingForce * (0.1 + Math.random() * 0.2)); // 10-30%
    
    // Combat calculation (simplified)
    const attackerCasualties = Math.floor(sortieForce * 0.5 * Math.random());
    const defenderCasualties = Math.floor(sortieForce * 0.3 * Math.random());

    siege.attackingForce -= attackerCasualties;
    siege.defendingForce -= defenderCasualties;

    this.addSiegeEvent(siege, {
      type: 'sortie',
      description: `Verteidiger führen einen Ausfall mit ${sortieForce} Soldaten durch`,
      attackerCasualties,
      defenderCasualties,
      wallDamage: 0,
      timestamp: Date.now()
    });

    // Morale impact
    if (defenderCasualties < attackerCasualties) {
      siege.defenderMorale += 5;
      siege.attackerMorale -= 3;
    } else {
      siege.attackerMorale += 3;
      siege.defenderMorale -= 5;
    }
  }

  /**
   * Check for wall breach
   */
  private checkForBreach(siege: Siege): void {
    for (const wall of siege.walls) {
      if (wall.integrity <= 0 && !wall.undermined) {
        siege.breaches++;
        wall.undermined = true; // Mark as breached

        this.addSiegeEvent(siege, {
          type: 'breach',
          description: `Mauer durchbrochen! Segment ${wall.id} ist gefallen.`,
          attackerCasualties: 0,
          defenderCasualties: 0,
          wallDamage: 0,
          timestamp: Date.now()
        });

        siege.attackerMorale += 10;
        siege.defenderMorale -= 15;
      }
    }

    if (siege.breaches >= 2) {
      siege.status = 'breach_achieved';
    }
  }

  /**
   * Update morale
   */
  private updateMorale(siege: Siege): void {
    // Duration affects morale
    if (siege.duration > 30) {
      siege.attackerMorale -= 0.5;
    }
    if (siege.duration > 60) {
      siege.attackerMorale -= 1;
      siege.defenderMorale -= 0.5;
    }

    // Supplies affect morale
    if (siege.attackerSupplies < 10) {
      siege.attackerMorale -= 1;
    }
    if (siege.defenderSupplies < 10) {
      siege.defenderMorale -= 2;
    }

    // Clamp morale
    siege.attackerMorale = Math.max(0, Math.min(100, siege.attackerMorale));
    siege.defenderMorale = Math.max(0, Math.min(100, siege.defenderMorale));
  }

  /**
   * Check victory conditions
   */
  private checkVictoryConditions(siege: Siege): void {
    // Attacker runs out of supplies
    if (siege.attackerSupplies <= 0) {
      siege.status = 'lifted';
      return;
    }

    // Defender surrenders (low supplies or morale)
    if (siege.defenderSupplies <= 0 || siege.defenderMorale <= 20) {
      siege.status = 'surrendered';
      return;
    }

    // Attacker gives up (low morale)
    if (siege.attackerMorale <= 20) {
      siege.status = 'lifted';
      return;
    }

    // Breach achieved
    if (siege.breaches >= 2) {
      siege.status = 'breach_achieved';
    }
  }

  /**
   * Add siege event
   */
  private addSiegeEvent(siege: Siege, event: SiegeEvent): void {
    const events = this.siegeEvents.get(siege.id) || [];
    events.push(event);
    this.siegeEvents.set(siege.id, events);
  }

  /**
   * Get active sieges
   */
  public getActiveSieges(): Map<string, Siege> {
    return this.activeSieges;
  }

  /**
   * Get siege by ID
   */
  public getSiege(id: string): Siege | undefined {
    return this.activeSieges.get(id);
  }

  /**
   * Get siege events
   */
  public getSiegeEvents(siegeId: string): SiegeEvent[] {
    return this.siegeEvents.get(siegeId) || [];
  }

  /**
   * Serialize for save/load
   */
  public serialize(): any {
    return {
      activeSieges: Array.from(this.activeSieges.entries()),
      siegeEvents: Array.from(this.siegeEvents.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.activeSieges) {
      this.activeSieges = new Map(data.activeSieges);
    }
    if (data.siegeEvents) {
      this.siegeEvents = new Map(data.siegeEvents);
    }
  }
}
