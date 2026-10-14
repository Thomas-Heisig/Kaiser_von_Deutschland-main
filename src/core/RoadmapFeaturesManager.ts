/**
 * Comprehensive Feature Manager
 * Integrates all 20 new roadmap features into a single unified system
 */

import { EconomicSystemsManager } from './EconomicSystemsManager';
import { LibrarySystem } from './LibrarySystem';
import { FortificationSystem } from './FortificationSystem';
import { AdvancedEspionageSystem } from './AdvancedEspionageSystem';
import { UndergroundMovementSystem } from './UndergroundMovementSystem';

export interface University {
  id: string;
  name: string;
  founded: number;
  location: string;
  type: string;
  capacity: number;
  prestige: number;
  researchBonus: number;
  specializations: string[];
}

export interface NobelPrize {
  id: string;
  name: string;
  category: string;
  yearEstablished: number;
  prestige: number;
  prizeAmount: number;
}

export interface Colony {
  id: string;
  name: string;
  region: string;
  established: number;
  area: number;
  population: number;
  resources: string[];
  annualRevenue: number;
  maintenanceCost: number;
}

export interface Waterway {
  id: string;
  name: string;
  type: string;
  length: number;
  navigable: number;
  cargoCapacity: number;
  economicValue: number;
  tradeBonus: number;
}

export interface UrbanDistrict {
  id: string;
  name: string;
  type: string;
  housingQuality: number;
  density: number;
  crimeRate: number;
  healthRisk: number;
}

/**
 * Main manager for all 20 new roadmap features
 */
export class RoadmapFeaturesManager {
  // Sub-systems
  private economicSystems: EconomicSystemsManager;
  private librarySystem: LibrarySystem;
  private fortificationSystem: FortificationSystem;
  private espionageSystem: AdvancedEspionageSystem;
  private undergroundMovements: UndergroundMovementSystem;
  
  // Additional data
  private universities: University[] = [];
  private nobelPrizes: NobelPrize[] = [];
  private colonies: Colony[] = [];
  private waterways: Waterway[] = [];
  private urbanDistricts: UrbanDistrict[] = [];
  private navalTechnologies: any[] = []; // Future use for naval tech tree
  private militaryLogistics: any[] = []; // Future use for logistics system
  
  // State
  private ownedUniversities: Set<string> = new Set();
  private nobelWinners: Map<number, string[]> = new Map(); // year -> winners
  private ownedColonies: Set<string> = new Set();
  private developedWaterways: Set<string> = new Set();
  private cityDistricts: Map<string, Set<string>> = new Map();

  constructor() {
    this.economicSystems = new EconomicSystemsManager();
    this.librarySystem = new LibrarySystem();
    this.fortificationSystem = new FortificationSystem();
    this.espionageSystem = new AdvancedEspionageSystem();
    this.undergroundMovements = new UndergroundMovementSystem();
    
    this.loadAllData();
  }

  private async loadAllData(): Promise<void> {
    await Promise.all([
      this.loadUniversities(),
      this.loadWaterways(),
      this.loadColonies(),
      this.loadUrbanDistricts(),
      this.loadNavalSystems(),
      this.loadMilitaryLogistics()
    ]);
  }

  private async loadUniversities(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/universities.json');
      const data = await response.json();
      this.universities = data.universities || [];
      this.nobelPrizes = data.nobelPrizes || [];
    } catch (error) {
      console.error('Failed to load universities data:', error);
    }
  }

  private async loadWaterways(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/waterways.json');
      const data = await response.json();
      this.waterways = [...(data.waterways || []), ...(data.canals || [])];
    } catch (error) {
      console.error('Failed to load waterways data:', error);
    }
  }

  private async loadColonies(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/colonial-systems.json');
      const data = await response.json();
      this.colonies = data.colonies || [];
    } catch (error) {
      console.error('Failed to load colonial data:', error);
    }
  }

  private async loadUrbanDistricts(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/urban-districts.json');
      const data = await response.json();
      this.urbanDistricts = data.urbanDistricts || [];
    } catch (error) {
      console.error('Failed to load urban districts data:', error);
    }
  }

  private async loadNavalSystems(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/naval-systems.json');
      const data = await response.json();
      this.navalTechnologies = data.navalTechnologies || [];
    } catch (error) {
      console.error('Failed to load naval systems data:', error);
    }
  }

  private async loadMilitaryLogistics(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/military-logistics.json');
      const data = await response.json();
      this.militaryLogistics = data.supplyLines || [];
    } catch (error) {
      console.error('Failed to load military logistics data:', error);
    }
  }

  // === UNIVERSITY SYSTEM ===
  
  public foundUniversity(universityId: string, _resources: Record<string, number>): {
    success: boolean;
    message: string;
  } {
    const university = this.universities.find(u => u.id === universityId);
    if (!university) {
      return { success: false, message: 'University not found' };
    }

    // Add to owned universities
    this.ownedUniversities.add(universityId);
    
    return {
      success: true,
      message: `Founded ${university.name}!`
    };
  }

  public awardNobelPrize(year: number, category: string, winnerId: string): {
    success: boolean;
    prize?: NobelPrize;
  } {
    if (year < 1901) {
      return { success: false };
    }

    const prize = this.nobelPrizes.find(p => p.category === category);
    if (!prize) {
      return { success: false };
    }

    const winners = this.nobelWinners.get(year) || [];
    winners.push(`${winnerId}:${category}`);
    this.nobelWinners.set(year, winners);

    return { success: true, prize };
  }

  public getTotalResearchBonus(): number {
    let bonus = this.librarySystem.getResearchBonus();
    
    // Add university bonuses
    for (const univId of this.ownedUniversities) {
      const univ = this.universities.find(u => u.id === univId);
      if (univ) {
        bonus += univ.researchBonus;
      }
    }
    
    return bonus;
  }

  // === COLONIAL SYSTEM ===
  
  public establishColony(colonyId: string, _resources: Record<string, number>): {
    success: boolean;
    colony?: Colony;
  } {
    const colony = this.colonies.find(c => c.id === colonyId);
    if (!colony) {
      return { success: false };
    }

    this.ownedColonies.add(colonyId);
    
    return { success: true, colony };
  }

  public getColonialRevenue(): number {
    let revenue = 0;
    for (const colonyId of this.ownedColonies) {
      const colony = this.colonies.find(c => c.id === colonyId);
      if (colony) {
        revenue += colony.annualRevenue - colony.maintenanceCost;
      }
    }
    return revenue;
  }

  // === WATERWAY SYSTEM ===
  
  public developWaterway(waterwayId: string): {
    success: boolean;
    waterway?: Waterway;
  } {
    const waterway = this.waterways.find(w => w.id === waterwayId);
    if (!waterway) {
      return { success: false };
    }

    this.developedWaterways.add(waterwayId);
    
    return { success: true, waterway };
  }

  public getTradeBonus(): number {
    let bonus = 0;
    for (const waterwayId of this.developedWaterways) {
      const waterway = this.waterways.find(w => w.id === waterwayId);
      if (waterway) {
        bonus += waterway.tradeBonus;
      }
    }
    return bonus;
  }

  // === URBAN DISTRICT SYSTEM ===
  
  public buildDistrict(cityId: string, districtId: string): {
    success: boolean;
    district?: UrbanDistrict;
  } {
    const district = this.urbanDistricts.find(d => d.id === districtId);
    if (!district) {
      return { success: false };
    }

    const cityDists = this.cityDistricts.get(cityId) || new Set();
    cityDists.add(districtId);
    this.cityDistricts.set(cityId, cityDists);
    
    return { success: true, district };
  }

  public getCityQualityOfLife(cityId: string): number {
    const districts = this.cityDistricts.get(cityId);
    if (!districts || districts.size === 0) return 0.5;

    let totalQuality = 0;
    for (const distId of districts) {
      const dist = this.urbanDistricts.find(d => d.id === distId);
      if (dist) {
        totalQuality += dist.housingQuality * (1 - dist.crimeRate) * (1 - dist.healthRisk);
      }
    }
    
    return totalQuality / districts.size;
  }

  // === ACCESSOR METHODS ===
  
  public getEconomicSystems(): EconomicSystemsManager {
    return this.economicSystems;
  }

  public getLibrarySystem(): LibrarySystem {
    return this.librarySystem;
  }

  public getFortificationSystem(): FortificationSystem {
    return this.fortificationSystem;
  }

  public getEspionageSystem(): AdvancedEspionageSystem {
    return this.espionageSystem;
  }

  // === GAME UPDATE ===
  
  public update(year: number, _deltaTime: number): void {
    // Update inflation
    const inflation = this.economicSystems.calculateInflation(year, {
      warStatus: false, // Get from game state
      tradeVolume: this.getTradeBonus(),
      resourceShortages: 0
    });
    this.economicSystems.updatePriceLevel(inflation);
    
    // Check for Nobel Prize eligibility
    if (year >= 1901 && year % 1 === 0) { // Annual check
      // Auto-award Nobel prizes based on research
      // Implementation depends on game mechanics
    }
  }

  /**
   * Get naval technologies (for future implementation)
   */
  public getNavalTechnologies(): any[] {
    return this.navalTechnologies;
  }

  /**
   * Get military logistics data (for future implementation)
   */
  public getMilitaryLogistics(): any[] {
    return this.militaryLogistics;
  }

  /**
   * Get summary of all features
   */
  public getFeaturesSummary(): Record<string, any> {
    return {
      economic: {
        inflationRate: this.economicSystems.getInflationRate(),
        priceLevel: this.economicSystems.getPriceLevel()
      },
      education: {
        universities: this.ownedUniversities.size,
        researchBonus: this.getTotalResearchBonus(),
        nobelPrizes: this.nobelWinners.size
      },
      libraries: {
        totalBooks: this.librarySystem.getBookCollection().length,
        culturalValue: this.librarySystem.getCulturalValue()
      },
      military: {
        fortifiedCities: 0, // Calculate from fortification system
        siegeWeapons: 0
      },
      espionage: {
        activeAgents: this.espionageSystem.getAgents().length,
        stolenTech: this.espionageSystem.getStolenTechnologies().length
      },
      underground: {
        activeRebelGroups: this.undergroundMovements.getActiveRebelGroups().length,
        totalFighters: this.undergroundMovements.getActiveRebelGroups().reduce((sum, g) => sum + g.fighters, 0),
        revolutionaryCells: this.undergroundMovements.getActiveRevolutionaryCells().length,
        secretSocieties: this.undergroundMovements.getActiveSecretSocieties().length,
        publicFear: this.undergroundMovements.getPublicFearLevel(),
        revolutionThreat: this.undergroundMovements.getRevolutionThreat()
      },
      colonial: {
        colonies: this.ownedColonies.size,
        revenue: this.getColonialRevenue()
      },
      trade: {
        waterways: this.developedWaterways.size,
        tradeBonus: this.getTradeBonus()
      }
    };
  }

  /**
   * Get underground movement system
   */
  public getUndergroundMovements(): UndergroundMovementSystem {
    return this.undergroundMovements;
  }
}
