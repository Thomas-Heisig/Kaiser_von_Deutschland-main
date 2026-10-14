// src/core/BuildingSystem.ts
import buildingsData from '../data/json/buildings.json';

export interface BuildingCost {
  gold: number;
  wood?: number;
  stone?: number;
  iron?: number;
  land: number;
}

export interface BuildingProduction {
  gold?: number;
  food?: number;
  goods?: number;
  tradePower?: number;
  research?: number;
  power?: number;
  soldiers?: number;
  iron?: number;
  stone?: number;
  coal?: number;
  weapons?: number;
  exoticGoods?: number;
  exoticResources?: number;
}

export interface BuildingEffects {
  piety?: number;
  happiness?: number;
  stability?: number;
  literacyRate?: number;
  culturalInfluence?: number;
  technologicalLevel?: number;
  prestige?: number;
  militaryStrength?: number;
  trainingLevel?: number;
  health?: number;
  populationGrowth?: number;
  defense?: number;
  tradePower?: number;
  authority?: number;
  internationalRelations?: number;
  noblesSatisfaction?: number;
  socialCohesion?: number;
  equipmentQuality?: number;
  communicationSpeed?: number;
  publicOpinion?: number;
  propagandaPower?: number;
  colonialPower?: number;
  efficiency?: number;
  automation?: number;
  environmentalStability?: number;
  sustainability?: number;
  disasterPrevention?: number;
  spaceColonies?: number;
}

export interface BuildingRequirements {
  minTech: number;
  minPopulation?: number;
  terrain?: string[];
  buildings?: Record<string, number>;
  era?: string;
  rank?: number;
  minYear?: number;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  cost: BuildingCost;
  buildTime: number;
  maintenance: number;
  production?: BuildingProduction;
  effects?: BuildingEffects;
  employment?: number;
  requirements: BuildingRequirements;
  upgrades?: string[];
  unique?: boolean;
}

export interface BuildingCategory {
  name: string;
  icon: string;
  description: string;
}

export interface Era {
  name: string;
  years: [number, number];
  techLevel: [number, number];
}

export class BuildingSystem {
  private static buildings: Map<string, BuildingDefinition> = new Map();
  private static categories: Map<string, BuildingCategory> = new Map();
  private static eras: Map<string, Era> = new Map();
  
  static {
    // Initialize buildings from JSON data
    buildingsData.buildings.forEach((building: any) => {
      this.buildings.set(building.id, building as BuildingDefinition);
    });
    
    // Initialize categories
    Object.entries(buildingsData.buildingCategories).forEach(([id, data]: [string, any]) => {
      this.categories.set(id, data as BuildingCategory);
    });
    
    // Initialize eras
    Object.entries(buildingsData.eras).forEach(([id, data]: [string, any]) => {
      this.eras.set(id, data as Era);
    });
  }
  
  /**
   * Holt alle verfügbaren Gebäude
   */
  public static getAllBuildings(): BuildingDefinition[] {
    return Array.from(this.buildings.values());
  }
  
  /**
   * Holt ein Gebäude nach ID
   */
  public static getBuilding(buildingId: string): BuildingDefinition | undefined {
    return this.buildings.get(buildingId);
  }
  
  /**
   * Holt alle Gebäude einer Kategorie
   */
  public static getBuildingsByCategory(category: string): BuildingDefinition[] {
    return this.getAllBuildings().filter(b => b.category === category);
  }
  
  /**
   * Holt alle Kategorien
   */
  public static getCategories(): Map<string, BuildingCategory> {
    return this.categories;
  }
  
  /**
   * Holt alle Ären
   */
  public static getEras(): Map<string, Era> {
    return this.eras;
  }
  
  /**
   * Bestimmt die Ära basierend auf dem Jahr
   */
  public static getEraForYear(year: number): string | null {
    for (const [id, era] of this.eras.entries()) {
      if (year >= era.years[0] && year <= era.years[1]) {
        return id;
      }
    }
    return null;
  }
  
  /**
   * Prüft ob ein Spieler ein Gebäude bauen kann
   */
  public static canBuild(
    building: BuildingDefinition,
    resources: any,
    stats: any,
    existingBuildings: Record<string, number>,
    currentYear: number
  ): { canBuild: boolean; missingRequirements: string[] } {
    const missing: string[] = [];
    
    // Check tech level
    if (stats.technologicalLevel < building.requirements.minTech) {
      missing.push(`Technologiestufe: ${stats.technologicalLevel}/${building.requirements.minTech}`);
    }
    
    // Check population
    if (building.requirements.minPopulation && stats.population < building.requirements.minPopulation) {
      missing.push(`Bevölkerung: ${stats.population}/${building.requirements.minPopulation}`);
    }
    
    // Check era
    if (building.requirements.era) {
      const currentEra = this.getEraForYear(currentYear);
      if (currentEra !== building.requirements.era) {
        const era = this.eras.get(building.requirements.era);
        missing.push(`Erfordert Ära: ${era?.name || building.requirements.era}`);
      }
    }
    
    // Check rank
    if (building.requirements.rank && stats.rank < building.requirements.rank) {
      missing.push(`Rang: ${stats.rank}/${building.requirements.rank}`);
    }
    
    // Check prerequisite buildings
    if (building.requirements.buildings) {
      for (const [prereqId, count] of Object.entries(building.requirements.buildings)) {
        const existing = existingBuildings[prereqId] || 0;
        if (existing < count) {
          const prereqBuilding = this.getBuilding(prereqId);
          missing.push(`${prereqBuilding?.name || prereqId}: ${existing}/${count}`);
        }
      }
    }
    
    // Check resources
    if (resources.gold < building.cost.gold) {
      missing.push(`Gold: ${resources.gold}/${building.cost.gold}`);
    }
    
    if (building.cost.wood && resources.wood < building.cost.wood) {
      missing.push(`Holz: ${resources.wood}/${building.cost.wood}`);
    }
    
    if (building.cost.stone && resources.stone < building.cost.stone) {
      missing.push(`Stein: ${resources.stone}/${building.cost.stone}`);
    }
    
    if (building.cost.iron && resources.iron < building.cost.iron) {
      missing.push(`Eisen: ${resources.iron}/${building.cost.iron}`);
    }
    
    if (resources.land < building.cost.land) {
      missing.push(`Land: ${resources.land}/${building.cost.land}`);
    }
    
    // Check if unique and already built
    if (building.unique && existingBuildings[building.id] > 0) {
      missing.push('Dieses Gebäude kann nur einmal gebaut werden');
    }
    
    return {
      canBuild: missing.length === 0,
      missingRequirements: missing
    };
  }
  
  /**
   * Berechnet die Gesamtproduktion eines Gebäudes
   */
  public static calculateProduction(
    building: BuildingDefinition,
    count: number = 1,
    bonusModifier: number = 1.0
  ): BuildingProduction {
    if (!building.production) return {};
    
    const production: BuildingProduction = {};
    
    Object.entries(building.production).forEach(([key, value]) => {
      production[key as keyof BuildingProduction] = Math.floor(value * count * bonusModifier);
    });
    
    return production;
  }
  
  /**
   * Berechnet die Gesamteffekte eines Gebäudes
   */
  public static calculateEffects(
    building: BuildingDefinition,
    count: number = 1,
    bonusModifier: number = 1.0
  ): BuildingEffects {
    if (!building.effects) return {};
    
    const effects: BuildingEffects = {};
    
    Object.entries(building.effects).forEach(([key, value]) => {
      effects[key as keyof BuildingEffects] = Math.floor(value * count * bonusModifier);
    });
    
    return effects;
  }
  
  /**
   * Berechnet die Gesamtwartungskosten
   */
  public static calculateMaintenance(
    building: BuildingDefinition,
    count: number = 1
  ): number {
    return building.maintenance * count;
  }
  
  /**
   * Gibt alle möglichen Upgrades für ein Gebäude zurück
   */
  public static getUpgrades(buildingId: string): BuildingDefinition[] {
    const building = this.buildings.get(buildingId);
    if (!building || !building.upgrades) return [];
    
    return building.upgrades
      .map(id => this.buildings.get(id))
      .filter(b => b !== undefined) as BuildingDefinition[];
  }
  
  /**
   * Holt verfügbare Gebäude basierend auf aktuellen Stats
   */
  public static getAvailableBuildings(
    resources: any,
    stats: any,
    existingBuildings: Record<string, number>,
    currentYear: number
  ): BuildingDefinition[] {
    return this.getAllBuildings().filter(building => {
      const check = this.canBuild(building, resources, stats, existingBuildings, currentYear);
      return check.canBuild;
    });
  }
  
  /**
   * Gibt empfohlene Gebäude basierend auf der aktuellen Situation zurück
   */
  public static getRecommendedBuildings(
    resources: any,
    stats: any,
    existingBuildings: Record<string, number>,
    currentYear: number,
    priority: 'economic' | 'military' | 'cultural' | 'all' = 'all'
  ): BuildingDefinition[] {
    const available = this.getAvailableBuildings(resources, stats, existingBuildings, currentYear);
    
    if (priority === 'all') return available.slice(0, 5);
    
    const categoryMap: Record<string, string[]> = {
      economic: ['economic', 'agricultural', 'industrial'],
      military: ['military', 'defensive'],
      cultural: ['cultural', 'education', 'religious', 'scientific']
    };
    
    const targetCategories = categoryMap[priority] || [];
    
    return available
      .filter(b => targetCategories.includes(b.category))
      .slice(0, 5);
  }
  
  /**
   * Gibt Statistiken über alle Gebäude zurück
   */
  public static getStatistics(): {
    totalBuildings: number;
    categoryCounts: Record<string, number>;
    averageCost: number;
    totalUniqueBuildings: number;
  } {
    const allBuildings = this.getAllBuildings();
    const categoryCounts: Record<string, number> = {};
    let totalCost = 0;
    
    allBuildings.forEach(building => {
      categoryCounts[building.category] = (categoryCounts[building.category] || 0) + 1;
      totalCost += building.cost.gold;
    });
    
    return {
      totalBuildings: allBuildings.length,
      categoryCounts,
      averageCost: Math.floor(totalCost / allBuildings.length),
      totalUniqueBuildings: allBuildings.filter(b => b.unique).length
    };
  }
}
