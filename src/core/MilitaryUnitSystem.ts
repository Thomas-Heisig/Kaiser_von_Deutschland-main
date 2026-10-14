// src/core/MilitaryUnitSystem.ts

export interface MilitaryUnit {
  id: string;
  name: string;
  era: 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'contemporary';
  category: 'infantry' | 'cavalry' | 'ranged' | 'gunpowder' | 'artillery' | 'modern_infantry' | 'armor';
  tier: number;
  cost: {
    gold: number;
    wood?: number;
    iron?: number;
    horses?: number;
    gunpowder?: number;
    oil?: number;
    time: number;
  };
  maintenance: number;
  strength: number;
  defense: number;
  speed: number;
  range: number;
  morale: number;
  training: number;
  requiredTechnology: string | null;
  availableFrom: number;
  upgrades: string[];
  specialAbilities: string[];
  terrainBonus?: Record<string, number>;
  terrainPenalty?: Record<string, number>;
}

export interface UnitInstance {
  unitTypeId: string;
  count: number;
  veterancy: number;
  currentMorale: number;
  location: string;
}

export class MilitaryUnitSystem {
  private unitTypes: Map<string, MilitaryUnit> = new Map();
  private activeUnits: UnitInstance[] = [];

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/military-units.json');
      const data = await response.json();
      
      data.militaryUnits.forEach((unit: MilitaryUnit) => {
        this.unitTypes.set(unit.id, unit);
      });
    } catch (error) {
      console.error('Failed to load military units:', error);
    }
  }

  getUnitType(id: string): MilitaryUnit | undefined {
    return this.unitTypes.get(id);
  }

  getAllUnitTypes(): MilitaryUnit[] {
    return Array.from(this.unitTypes.values());
  }

  getAvailableUnits(year: number, technologies: string[]): MilitaryUnit[] {
    return Array.from(this.unitTypes.values()).filter(unit => {
      // Check year availability
      if (unit.availableFrom > year) return false;

      // Check technology requirement
      if (unit.requiredTechnology && !technologies.includes(unit.requiredTechnology)) {
        return false;
      }

      return true;
    });
  }

  getUnitsByCategory(category: MilitaryUnit['category']): MilitaryUnit[] {
    return Array.from(this.unitTypes.values()).filter(u => u.category === category);
  }

  getUnitsByEra(era: MilitaryUnit['era']): MilitaryUnit[] {
    return Array.from(this.unitTypes.values()).filter(u => u.era === era);
  }

  recruitUnit(unitTypeId: string, count: number, location: string): boolean {
    const unitType = this.unitTypes.get(unitTypeId);
    if (!unitType) return false;

    const instance: UnitInstance = {
      unitTypeId,
      count,
      veterancy: 0,
      currentMorale: unitType.morale,
      location
    };

    this.activeUnits.push(instance);
    return true;
  }

  getActiveUnits(): UnitInstance[] {
    return this.activeUnits;
  }

  getUnitsByLocation(location: string): UnitInstance[] {
    return this.activeUnits.filter(u => u.location === location);
  }

  calculateArmyStrength(location?: string): number {
    const units = location
      ? this.getUnitsByLocation(location)
      : this.activeUnits;

    return units.reduce((total, instance) => {
      const unitType = this.unitTypes.get(instance.unitTypeId);
      if (!unitType) return total;

      const baseStrength = unitType.strength * instance.count;
      const moraleModifier = instance.currentMorale / 100;
      const veterancyModifier = 1 + (instance.veterancy * 0.1);

      return total + (baseStrength * moraleModifier * veterancyModifier);
    }, 0);
  }

  calculateMaintenanceCost(): number {
    return this.activeUnits.reduce((total, instance) => {
      const unitType = this.unitTypes.get(instance.unitTypeId);
      if (!unitType) return total;
      return total + (unitType.maintenance * instance.count);
    }, 0);
  }

  getUpgradePath(unitId: string): MilitaryUnit[] {
    const path: MilitaryUnit[] = [];
    const unit = this.unitTypes.get(unitId);
    
    if (!unit) return path;
    path.push(unit);

    // Follow upgrade chain
    let current = unit;
    while (current.upgrades.length > 0) {
      const nextId = current.upgrades[0]; // Take first upgrade
      const next = this.unitTypes.get(nextId);
      if (!next) break;
      path.push(next);
      current = next;
    }

    return path;
  }

  applyTerrainModifier(unitTypeId: string, terrain: string): number {
    const unit = this.unitTypes.get(unitTypeId);
    if (!unit) return 1.0;

    const bonus = unit.terrainBonus?.[terrain] ?? 0;
    const penalty = unit.terrainPenalty?.[terrain] ?? 0;

    return 1.0 + bonus + penalty;
  }
}
