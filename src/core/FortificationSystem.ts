/**
 * Fortifications and Siege Systems
 * City walls, siege weapons, and siege tactics
 */

export interface Fortification {
  id: string;
  name: string;
  era: string;
  yearAvailable: number;
  strength: number;
  buildCost: Record<string, number>;
  maintenanceCost: number;
  height: number;
  thickness: number;
  description: string;
  vulnerabilities: string[];
  defenseBonus: number;
  towers?: number;
  layers?: number;
  bastions?: number;
  bunkers?: number;
}

export interface SiegeWeapon {
  id: string;
  name: string;
  era: string;
  yearAvailable: number;
  cost: Record<string, number>;
  effectiveness: number;
  range: number;
  crewSize: number;
  description: string;
  targetTypes: string[];
  requiresGunpowder?: boolean;
  allowsScaling?: boolean;
}

export interface SiegeTactic {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  duration: number;
  cost: Record<string, number>;
  crewSize: number;
  casualties?: string;
  counterMeasures?: string[];
}

export class FortificationSystem {
  private fortifications: Fortification[] = [];
  private siegeWeapons: SiegeWeapon[] = [];
  private siegeTactics: SiegeTactic[] = [];
  
  private cityFortifications: Map<string, Fortification> = new Map();
  private availableWeapons: Map<string, number> = new Map();

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/fortifications.json');
      const data = await response.json();
      
      this.fortifications = data.fortifications || [];
      this.siegeWeapons = data.siegeWeapons || [];
      this.siegeTactics = data.siegeTactics || [];
    } catch (error) {
      console.error('Failed to load fortifications data:', error);
    }
  }

  /**
   * Build fortification for a city
   */
  public buildFortification(
    cityId: string,
    fortificationId: string,
    resources: Record<string, number>
  ): {
    success: boolean;
    message: string;
    fortification?: Fortification;
  } {
    const fortification = this.fortifications.find(f => f.id === fortificationId);
    if (!fortification) {
      return { success: false, message: 'Fortification type not found' };
    }

    // Check resources
    for (const [resource, amount] of Object.entries(fortification.buildCost)) {
      if (!resources[resource] || resources[resource] < amount) {
        return { success: false, message: `Insufficient ${resource}` };
      }
    }

    this.cityFortifications.set(cityId, fortification);
    
    return {
      success: true,
      message: `${fortification.name} built for city ${cityId}`,
      fortification
    };
  }

  /**
   * Build siege weapon
   */
  public buildSiegeWeapon(
    weaponId: string,
    quantity: number,
    resources: Record<string, number>
  ): {
    success: boolean;
    message: string;
    weapon?: SiegeWeapon;
  } {
    const weapon = this.siegeWeapons.find(w => w.id === weaponId);
    if (!weapon) {
      return { success: false, message: 'Siege weapon not found' };
    }

    // Check resources for quantity
    const totalCost: Record<string, number> = {};
    for (const [resource, amount] of Object.entries(weapon.cost)) {
      totalCost[resource] = amount * quantity;
      if (!resources[resource] || resources[resource] < totalCost[resource]) {
        return { success: false, message: `Insufficient ${resource}` };
      }
    }

    const current = this.availableWeapons.get(weaponId) || 0;
    this.availableWeapons.set(weaponId, current + quantity);
    
    return {
      success: true,
      message: `Built ${quantity}x ${weapon.name}`,
      weapon
    };
  }

  /**
   * Conduct siege
   */
  public conductSiege(params: {
    cityId: string;
    attackerWeapons: Map<string, number>;
    tacticIds: string[];
    duration: number;
  }): {
    success: boolean;
    damageDealt: number;
    casualties: number;
    breached: boolean;
  } {
    const fortification = this.cityFortifications.get(params.cityId);
    if (!fortification) {
      return {
        success: false,
        damageDealt: 0,
        casualties: 0,
        breached: false
      };
    }

    let totalDamage = 0;
    let casualties = 0;

    // Calculate damage from weapons
    for (const [weaponId, count] of params.attackerWeapons) {
      const weapon = this.siegeWeapons.find(w => w.id === weaponId);
      if (weapon) {
        totalDamage += weapon.effectiveness * count * params.duration;
        casualties += weapon.crewSize * count * 0.1; // 10% crew casualties
      }
    }

    // Calculate damage from tactics
    for (const tacticId of params.tacticIds) {
      const tactic = this.siegeTactics.find(t => t.id === tacticId);
      if (tactic) {
        totalDamage += tactic.effectiveness * 10;
        if (tactic.casualties === 'high') {
          casualties += tactic.crewSize * 0.5;
        }
      }
    }

    const breached = totalDamage >= fortification.strength;

    return {
      success: true,
      damageDealt: totalDamage,
      casualties: Math.floor(casualties),
      breached
    };
  }

  /**
   * Get defense bonus for city
   */
  public getDefenseBonus(cityId: string): number {
    const fortification = this.cityFortifications.get(cityId);
    return fortification ? fortification.defenseBonus : 0;
  }

  /**
   * Get fortification strength
   */
  public getFortificationStrength(cityId: string): number {
    const fortification = this.cityFortifications.get(cityId);
    return fortification ? fortification.strength : 0;
  }

  /**
   * Get available fortifications for year
   */
  public getAvailableFortifications(year: number): Fortification[] {
    return this.fortifications.filter(f => year >= f.yearAvailable);
  }

  /**
   * Get available siege weapons for year
   */
  public getAvailableSiegeWeapons(year: number): SiegeWeapon[] {
    return this.siegeWeapons.filter(w => year >= w.yearAvailable);
  }

  /**
   * Get maintenance cost for all fortifications
   */
  public getMaintenanceCost(): number {
    let cost = 0;
    for (const fortification of this.cityFortifications.values()) {
      cost += fortification.maintenanceCost;
    }
    return cost;
  }
}
