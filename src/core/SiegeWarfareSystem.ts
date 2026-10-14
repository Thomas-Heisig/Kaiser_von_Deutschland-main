/**
 * Siege Weapons and Fortification System
 * 
 * Manages siege warfare including weapons, city walls, and siege mechanics.
 * Scalable for small castle sieges to massive city assaults.
 */

export interface SiegeWeapon {
  id: string;
  name: string;
  type: 'catapult' | 'trebuchet' | 'ballista' | 'ram' | 'siege_tower' | 'cannon' | 'mortar' | 'howitzer';
  era: 'ancient' | 'medieval' | 'renaissance' | 'modern';
  
  /** Combat stats */
  wallDamage: number; // 1-100 per shot
  range: number; // meters
  accuracy: number; // 0-100
  rateOfFire: number; // shots per hour
  
  /** Costs and requirements */
  buildCost: number; // gold
  buildTime: number; // days
  crewRequired: number;
  transportDifficulty: number; // 0-100
  
  /** Special abilities */
  canBreachWalls: boolean;
  canScaleWalls: boolean; // siege towers
  causesFire: boolean;
  splashDamage: boolean;
}

export interface Fortification {
  id: string;
  name: string;
  type: 'wooden_palisade' | 'stone_wall' | 'castle' | 'fortress' | 'star_fort' | 'bunker';
  era: 'ancient' | 'medieval' | 'renaissance' | 'modern';
  
  /** Defensive stats */
  wallStrength: number; // 1-1000, total HP
  wallHeight: number; // meters
  wallThickness: number; // meters
  gateStrength: number; // 1-100
  
  /** Defensive features */
  hasTowers: boolean;
  hasMoat: boolean;
  hasArrowSlits: boolean;
  hasCannonPorts: boolean;
  
  /** Garrison capacity */
  maxGarrison: number;
  foodStorage: number; // tons
  waterStorage: number; // tons
  
  /** Build costs */
  constructionCost: number; // gold
  constructionTime: number; // months
  maintenanceCost: number; // gold per month
  
  /** Siege resistance */
  resistanceToCatapult: number; // 0-100
  resistanceToRam: number;
  resistanceToCannon: number;
  resistanceToUndermine: boolean;
}

export interface SiegeStatus {
  siegeId: string;
  fortificationId: string;
  attackerId: string;
  defenderId: string;
  
  /** Siege progress */
  startDate: number;
  duration: number; // days elapsed
  wallDamage: number; // 0-100% of wallStrength
  gateDamage: number; // 0-100% of gateStrength
  
  /** Forces */
  attackingForces: number;
  defendingForces: number;
  attackerCasualties: number;
  defenderCasualties: number;
  
  /** Siege weapons */
  deployedWeapons: Map<string, number>; // weaponId -> count
  
  /** Supplies */
  attackerSupplies: number; // days worth
  defenderSupplies: number;
  
  /** Morale */
  attackerMorale: number; // 0-100
  defenderMorale: number;
  
  /** Special conditions */
  undermineAttempts: number;
  escaladeAttempts: number; // ladder/tower assaults
  sallies: number; // defender breakouts
  
  status: 'ongoing' | 'breached' | 'surrendered' | 'relieved' | 'abandoned';
}

export class SiegeWarfareSystem {
  private siegeWeapons: Map<string, SiegeWeapon> = new Map();
  private fortifications: Map<string, Fortification> = new Map();
  private activeSieges: Map<string, SiegeStatus> = new Map();
  private siegeHistory: SiegeStatus[] = [];
  private maxHistorySize = 50;

  constructor() {
    this.initializeSiegeWeapons();
    this.initializeFortifications();
  }

  /**
   * Initialize siege weapons
   */
  private initializeSiegeWeapons(): void {
    // Ancient
    this.addSiegeWeapon({
      id: 'ballista',
      name: 'Ballista',
      type: 'ballista',
      era: 'ancient',
      wallDamage: 5,
      range: 300,
      accuracy: 70,
      rateOfFire: 6,
      buildCost: 500,
      buildTime: 10,
      crewRequired: 4,
      transportDifficulty: 40,
      canBreachWalls: false,
      canScaleWalls: false,
      causesFire: false,
      splashDamage: false
    });

    this.addSiegeWeapon({
      id: 'ram',
      name: 'Battering Ram',
      type: 'ram',
      era: 'ancient',
      wallDamage: 15,
      range: 0,
      accuracy: 100,
      rateOfFire: 20,
      buildCost: 300,
      buildTime: 5,
      crewRequired: 20,
      transportDifficulty: 50,
      canBreachWalls: false,
      canScaleWalls: false,
      causesFire: false,
      splashDamage: false
    });

    // Medieval
    this.addSiegeWeapon({
      id: 'catapult',
      name: 'Katapult',
      type: 'catapult',
      era: 'medieval',
      wallDamage: 20,
      range: 250,
      accuracy: 50,
      rateOfFire: 4,
      buildCost: 800,
      buildTime: 15,
      crewRequired: 8,
      transportDifficulty: 60,
      canBreachWalls: true,
      canScaleWalls: false,
      causesFire: true,
      splashDamage: true
    });

    this.addSiegeWeapon({
      id: 'trebuchet',
      name: 'Trebuchet',
      type: 'trebuchet',
      era: 'medieval',
      wallDamage: 40,
      range: 300,
      accuracy: 60,
      rateOfFire: 2,
      buildCost: 1500,
      buildTime: 20,
      crewRequired: 12,
      transportDifficulty: 80,
      canBreachWalls: true,
      canScaleWalls: false,
      causesFire: true,
      splashDamage: true
    });

    this.addSiegeWeapon({
      id: 'siege_tower',
      name: 'Belagerungsturm',
      type: 'siege_tower',
      era: 'medieval',
      wallDamage: 0,
      range: 0,
      accuracy: 100,
      rateOfFire: 0,
      buildCost: 1000,
      buildTime: 12,
      crewRequired: 30,
      transportDifficulty: 90,
      canBreachWalls: false,
      canScaleWalls: true,
      causesFire: false,
      splashDamage: false
    });

    // Renaissance
    this.addSiegeWeapon({
      id: 'cannon',
      name: 'Kanone',
      type: 'cannon',
      era: 'renaissance',
      wallDamage: 60,
      range: 500,
      accuracy: 75,
      rateOfFire: 3,
      buildCost: 3000,
      buildTime: 30,
      crewRequired: 6,
      transportDifficulty: 70,
      canBreachWalls: true,
      canScaleWalls: false,
      causesFire: true,
      splashDamage: true
    });

    this.addSiegeWeapon({
      id: 'mortar',
      name: 'Mörser',
      type: 'mortar',
      era: 'renaissance',
      wallDamage: 50,
      range: 600,
      accuracy: 50,
      rateOfFire: 4,
      buildCost: 2500,
      buildTime: 25,
      crewRequired: 5,
      transportDifficulty: 60,
      canBreachWalls: true,
      canScaleWalls: false,
      causesFire: true,
      splashDamage: true
    });

    // Modern
    this.addSiegeWeapon({
      id: 'howitzer',
      name: 'Haubitze',
      type: 'howitzer',
      era: 'modern',
      wallDamage: 80,
      range: 10000,
      accuracy: 90,
      rateOfFire: 10,
      buildCost: 50000,
      buildTime: 60,
      crewRequired: 8,
      transportDifficulty: 50,
      canBreachWalls: true,
      canScaleWalls: false,
      causesFire: true,
      splashDamage: true
    });
  }

  /**
   * Initialize fortifications
   */
  private initializeFortifications(): void {
    this.addFortification({
      id: 'wooden_palisade',
      name: 'Holzpalisade',
      type: 'wooden_palisade',
      era: 'ancient',
      wallStrength: 100,
      wallHeight: 3,
      wallThickness: 0.5,
      gateStrength: 20,
      hasTowers: false,
      hasMoat: false,
      hasArrowSlits: false,
      hasCannonPorts: false,
      maxGarrison: 200,
      foodStorage: 10,
      waterStorage: 5,
      constructionCost: 1000,
      constructionTime: 2,
      maintenanceCost: 50,
      resistanceToCatapult: 20,
      resistanceToRam: 30,
      resistanceToCannon: 10,
      resistanceToUndermine: false
    });

    this.addFortification({
      id: 'stone_wall',
      name: 'Steinmauer',
      type: 'stone_wall',
      era: 'medieval',
      wallStrength: 300,
      wallHeight: 8,
      wallThickness: 2,
      gateStrength: 50,
      hasTowers: true,
      hasMoat: false,
      hasArrowSlits: true,
      hasCannonPorts: false,
      maxGarrison: 500,
      foodStorage: 50,
      waterStorage: 25,
      constructionCost: 10000,
      constructionTime: 12,
      maintenanceCost: 200,
      resistanceToCatapult: 60,
      resistanceToRam: 70,
      resistanceToCannon: 40,
      resistanceToUndermine: true
    });

    this.addFortification({
      id: 'castle',
      name: 'Burg',
      type: 'castle',
      era: 'medieval',
      wallStrength: 600,
      wallHeight: 12,
      wallThickness: 3,
      gateStrength: 80,
      hasTowers: true,
      hasMoat: true,
      hasArrowSlits: true,
      hasCannonPorts: false,
      maxGarrison: 1000,
      foodStorage: 200,
      waterStorage: 100,
      constructionCost: 50000,
      constructionTime: 36,
      maintenanceCost: 500,
      resistanceToCatapult: 80,
      resistanceToRam: 90,
      resistanceToCannon: 50,
      resistanceToUndermine: true
    });

    this.addFortification({
      id: 'star_fort',
      name: 'Sternfestung',
      type: 'star_fort',
      era: 'renaissance',
      wallStrength: 800,
      wallHeight: 6,
      wallThickness: 8,
      gateStrength: 90,
      hasTowers: false,
      hasMoat: true,
      hasArrowSlits: false,
      hasCannonPorts: true,
      maxGarrison: 2000,
      foodStorage: 500,
      waterStorage: 250,
      constructionCost: 150000,
      constructionTime: 60,
      maintenanceCost: 1000,
      resistanceToCatapult: 100,
      resistanceToRam: 100,
      resistanceToCannon: 85,
      resistanceToUndermine: true
    });

    this.addFortification({
      id: 'bunker',
      name: 'Bunker',
      type: 'bunker',
      era: 'modern',
      wallStrength: 1000,
      wallHeight: 3,
      wallThickness: 2,
      gateStrength: 100,
      hasTowers: false,
      hasMoat: false,
      hasArrowSlits: false,
      hasCannonPorts: true,
      maxGarrison: 500,
      foodStorage: 300,
      waterStorage: 150,
      constructionCost: 200000,
      constructionTime: 48,
      maintenanceCost: 2000,
      resistanceToCatapult: 100,
      resistanceToRam: 100,
      resistanceToCannon: 95,
      resistanceToUndermine: true
    });
  }

  /**
   * Start a siege
   */
  public startSiege(
    siegeId: string,
    fortificationId: string,
    attackerId: string,
    defenderId: string,
    attackingForces: number,
    defendingForces: number
  ): SiegeStatus | null {
    const fortification = this.fortifications.get(fortificationId);
    if (!fortification) return null;

    const siege: SiegeStatus = {
      siegeId,
      fortificationId,
      attackerId,
      defenderId,
      startDate: Date.now(),
      duration: 0,
      wallDamage: 0,
      gateDamage: 0,
      attackingForces,
      defendingForces: Math.min(defendingForces, fortification.maxGarrison),
      attackerCasualties: 0,
      defenderCasualties: 0,
      deployedWeapons: new Map(),
      attackerSupplies: 30, // 30 days default
      defenderSupplies: fortification.foodStorage,
      attackerMorale: 70,
      defenderMorale: 80,
      undermineAttempts: 0,
      escaladeAttempts: 0,
      sallies: 0,
      status: 'ongoing'
    };

    this.activeSieges.set(siegeId, siege);
    return siege;
  }

  /**
   * Deploy siege weapon
   */
  public deploySiegeWeapon(siegeId: string, weaponId: string, count: number): boolean {
    const siege = this.activeSieges.get(siegeId);
    if (!siege) return false;

    const current = siege.deployedWeapons.get(weaponId) || 0;
    siege.deployedWeapons.set(weaponId, current + count);
    return true;
  }

  /**
   * Process siege for one day
   */
  public processSiegeDay(siegeId: string): {
    wallDamageDealt: number;
    gateDamageDealt: number;
    attackerCasualties: number;
    defenderCasualties: number;
    breached: boolean;
    surrendered: boolean;
  } {
    const siege = this.activeSieges.get(siegeId);
    if (!siege || siege.status !== 'ongoing') {
      return { wallDamageDealt: 0, gateDamageDealt: 0, attackerCasualties: 0, defenderCasualties: 0, breached: false, surrendered: false };
    }

    const fortification = this.fortifications.get(siege.fortificationId)!;

    let wallDamageDealt = 0;
    let gateDamageDealt = 0;
    let attackerCasualties = 0;
    let defenderCasualties = 0;

    // Process each deployed siege weapon
    for (const [weaponId, count] of siege.deployedWeapons) {
      const weapon = this.siegeWeapons.get(weaponId);
      if (!weapon) continue;

      // Calculate damage reduction based on fortification resistance
      let damageMultiplier = 1.0;
      if (weapon.type === 'catapult' || weapon.type === 'trebuchet') {
        damageMultiplier *= (100 - fortification.resistanceToCatapult) / 100;
      } else if (weapon.type === 'ram') {
        damageMultiplier *= (100 - fortification.resistanceToRam) / 100;
      } else if (weapon.type === 'cannon' || weapon.type === 'mortar' || weapon.type === 'howitzer') {
        damageMultiplier *= (100 - fortification.resistanceToCannon) / 100;
      }

      // Daily shots = count * rateOfFire * 24 hours * accuracy
      const effectiveShots = count * weapon.rateOfFire * 24 * (weapon.accuracy / 100);
      const damage = effectiveShots * weapon.wallDamage * damageMultiplier;

      if (weapon.type === 'ram') {
        gateDamageDealt += damage;
      } else {
        wallDamageDealt += damage;
      }

      // Defenders cause casualties to siege weapon crews
      const crewCasualties = count * weapon.crewRequired * 0.05; // 5% daily casualty rate
      attackerCasualties += Math.floor(crewCasualties);
    }

    // Update siege damage
    siege.wallDamage = Math.min(fortification.wallStrength, siege.wallDamage + wallDamageDealt);
    siege.gateDamage = Math.min(fortification.gateStrength, siege.gateDamage + gateDamageDealt);

    // Defender casualties from bombardment
    const bombardmentCasualties = (wallDamageDealt + gateDamageDealt) / 100;
    defenderCasualties += Math.floor(bombardmentCasualties);

    siege.attackerCasualties += attackerCasualties;
    siege.defenderCasualties += defenderCasualties;

    // Supply consumption
    siege.attackerSupplies -= 1;
    siege.defenderSupplies -= siege.defendingForces * 0.015; // 15kg per person per day

    // Morale effects
    if (siege.attackerSupplies < 10) {
      siege.attackerMorale -= 2;
    }
    if (siege.defenderSupplies < 10) {
      siege.defenderMorale -= 3;
    }
    if (siege.wallDamage > fortification.wallStrength * 0.5) {
      siege.defenderMorale -= 1;
    }

    siege.duration += 1;

    // Check for breach
    const breached = siege.wallDamage >= fortification.wallStrength || 
                     siege.gateDamage >= fortification.gateStrength;

    // Check for surrender
    const surrendered = siege.defenderMorale <= 10 || 
                        siege.defenderSupplies <= 0 ||
                        siege.defendingForces < 10;

    if (breached) {
      siege.status = 'breached';
      this.endSiege(siegeId);
    } else if (surrendered) {
      siege.status = 'surrendered';
      this.endSiege(siegeId);
    }

    return {
      wallDamageDealt,
      gateDamageDealt,
      attackerCasualties,
      defenderCasualties,
      breached,
      surrendered
    };
  }

  /**
   * End siege
   */
  private endSiege(siegeId: string): void {
    const siege = this.activeSieges.get(siegeId);
    if (!siege) return;

    this.siegeHistory.push(siege);
    if (this.siegeHistory.length > this.maxHistorySize) {
      this.siegeHistory.shift();
    }

    this.activeSieges.delete(siegeId);
  }

  /**
   * Add siege weapon
   */
  public addSiegeWeapon(weapon: SiegeWeapon): void {
    this.siegeWeapons.set(weapon.id, weapon);
  }

  /**
   * Add fortification
   */
  public addFortification(fortification: Fortification): void {
    this.fortifications.set(fortification.id, fortification);
  }

  /**
   * Get active sieges
   */
  public getActiveSieges(): SiegeStatus[] {
    return Array.from(this.activeSieges.values());
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      siegeWeapons: Array.from(this.siegeWeapons.entries()),
      fortifications: Array.from(this.fortifications.entries()),
      activeSieges: Array.from(this.activeSieges.entries()).map(([id, siege]) => [
        id,
        {
          ...siege,
          deployedWeapons: Array.from(siege.deployedWeapons.entries())
        }
      ]),
      siegeHistory: this.siegeHistory
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.siegeWeapons) {
      this.siegeWeapons = new Map(data.siegeWeapons);
    }
    if (data.fortifications) {
      this.fortifications = new Map(data.fortifications);
    }
    if (data.activeSieges) {
      this.activeSieges = new Map(
        data.activeSieges.map(([id, siege]: any) => [
          id,
          {
            ...siege,
            deployedWeapons: new Map(siege.deployedWeapons)
          }
        ])
      );
    }
    if (data.siegeHistory) {
      this.siegeHistory = data.siegeHistory;
    }
  }
}
