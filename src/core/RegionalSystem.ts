// src/core/RegionalSystem.ts
import regionsData from '../data/json/regions.json';

export interface RegionalBonuses {
  militaryStrength?: number;
  discipline?: number;
  trainingEfficiency?: number;
  martialSkill?: number;
  culturalInfluence?: number;
  happiness?: number;
  foodProduction?: number;
  prestige?: number;
  tradePower?: number;
  navalStrength?: number;
  shipbuildingSpeed?: number;
  merchantIncome?: number;
  industrialProduction?: number;
  miningEfficiency?: number;
  coalProduction?: number;
  steelProduction?: number;
  researchSpeed?: number;
  technologicalLevel?: number;
  silverProduction?: number;
  diplomaticPower?: number;
  musicPrestige?: number;
  imperialAuthority?: number;
  innovationRate?: number;
  engineeringBonus?: number;
  manufacturingEfficiency?: number;
  precision?: number;
  wineProduction?: number;
  tourism?: number;
  agricultureBonus?: number;
  militaryOrganization?: number;
  administrativeEfficiency?: number;
  centralLocation?: number;
  craftsmanship?: number;
  industrialGrowth?: number;
  workerProductivity?: number;
}

export interface RegionalPenalties {
  culturalInfluence?: number;
  happiness?: number;
  militaryStrength?: number;
  landMilitary?: number;
  environmentalQuality?: number;
  ethnicTension?: number;
  naturalResources?: number;
}

export interface RegionDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  bonuses: RegionalBonuses;
  penalties: RegionalPenalties;
  uniqueUnits: string[];
  uniqueBuildings: string[];
  specialResources?: string[];
  historicalPeriod: {
    start: number;
    end?: number;
    peak?: number;
    continuous?: boolean;
  };
  traits: string[];
}

export class RegionalSystem {
  private static regions: Map<string, RegionDefinition> = new Map();
  
  static {
    // Initialize regions from JSON data
    regionsData.regions.forEach((region: any) => {
      this.regions.set(region.id, region as RegionDefinition);
    });
  }
  
  /**
   * Holt alle verfügbaren Regionen
   */
  public static getAllRegions(): RegionDefinition[] {
    return Array.from(this.regions.values());
  }
  
  /**
   * Holt eine Region nach ID
   */
  public static getRegion(regionId: string): RegionDefinition | undefined {
    return this.regions.get(regionId);
  }
  
  /**
   * Holt alle Regionen mit einem bestimmten Merkmal
   */
  public static getRegionsByTrait(trait: string): RegionDefinition[] {
    return this.getAllRegions().filter(region => 
      region.traits.includes(trait)
    );
  }
  
  /**
   * Prüft ob eine Region in einem bestimmten Jahr aktiv ist
   */
  public static isRegionActiveInYear(region: RegionDefinition, year: number): boolean {
    const period = region.historicalPeriod;
    
    // Region ist kontinuierlich aktiv
    if (period.continuous) {
      return year >= period.start;
    }
    
    // Region hat Start- und Endjahr
    if (period.end) {
      return year >= period.start && year <= period.end;
    }
    
    // Region hat nur Startjahr
    return year >= period.start;
  }
  
  /**
   * Holt alle Regionen die in einem bestimmten Jahr aktiv sind
   */
  public static getActiveRegionsInYear(year: number): RegionDefinition[] {
    return this.getAllRegions().filter(region => 
      this.isRegionActiveInYear(region, year)
    );
  }
  
  /**
   * Berechnet die Gesamtboni einer Region für einen Spieler
   */
  public static calculateRegionalModifiers(
    region: RegionDefinition
  ): { bonuses: RegionalBonuses; penalties: RegionalPenalties } {
    return {
      bonuses: { ...region.bonuses },
      penalties: { ...region.penalties }
    };
  }
  
  /**
   * Wendet regionale Boni auf Spielerstatistiken an
   */
  public static applyRegionalBonuses(
    baseStats: any,
    region: RegionDefinition
  ): any {
    const modifiedStats = { ...baseStats };
    const { bonuses, penalties } = this.calculateRegionalModifiers(region);
    
    // Apply bonuses
    Object.keys(bonuses).forEach(key => {
      const bonusValue = (bonuses as any)[key];
      if (bonusValue && modifiedStats[key] !== undefined) {
        modifiedStats[key] += bonusValue;
      }
    });
    
    // Apply penalties
    Object.keys(penalties).forEach(key => {
      const penaltyValue = (penalties as any)[key];
      if (penaltyValue && modifiedStats[key] !== undefined) {
        modifiedStats[key] -= penaltyValue;
      }
    });
    
    return modifiedStats;
  }
  
  /**
   * Gibt eine Beschreibung der regionalen Boni zurück
   */
  public static getRegionalBonusDescription(region: RegionDefinition): string {
    const bonusLines: string[] = [];
    
    Object.entries(region.bonuses).forEach(([key, value]) => {
      if (value) {
        const displayName = this.getBonusDisplayName(key);
        bonusLines.push(`+${value}% ${displayName}`);
      }
    });
    
    Object.entries(region.penalties).forEach(([key, value]) => {
      if (value) {
        const displayName = this.getBonusDisplayName(key);
        bonusLines.push(`-${value}% ${displayName}`);
      }
    });
    
    return bonusLines.join('\n');
  }
  
  /**
   * Übersetzt Bonus-Schlüssel in lesbare Namen
   */
  private static getBonusDisplayName(key: string): string {
    const displayNames: { [key: string]: string } = {
      militaryStrength: 'Militärstärke',
      discipline: 'Disziplin',
      trainingEfficiency: 'Ausbildungseffizienz',
      martialSkill: 'Kriegskunst',
      culturalInfluence: 'Kultureller Einfluss',
      happiness: 'Zufriedenheit',
      foodProduction: 'Nahrungsproduktion',
      prestige: 'Prestige',
      tradePower: 'Handelsmacht',
      navalStrength: 'Marinestärke',
      shipbuildingSpeed: 'Schiffbaugeschwindigkeit',
      merchantIncome: 'Händlereinkommen',
      industrialProduction: 'Industrieproduktion',
      miningEfficiency: 'Bergbaueffizienz',
      coalProduction: 'Kohleproduktion',
      steelProduction: 'Stahlproduktion',
      researchSpeed: 'Forschungsgeschwindigkeit',
      technologicalLevel: 'Technologieniveau',
      silverProduction: 'Silberproduktion',
      diplomaticPower: 'Diplomatische Macht',
      musicPrestige: 'Musik-Prestige',
      imperialAuthority: 'Kaiserliche Autorität',
      innovationRate: 'Innovationsrate',
      engineeringBonus: 'Ingenieurwesen',
      manufacturingEfficiency: 'Fertigungseffizienz',
      precision: 'Präzision',
      wineProduction: 'Weinproduktion',
      tourism: 'Tourismus',
      agricultureBonus: 'Landwirtschaft',
      militaryOrganization: 'Militärorganisation',
      administrativeEfficiency: 'Verwaltungseffizienz',
      centralLocation: 'Zentrale Lage',
      craftsmanship: 'Handwerkskunst',
      industrialGrowth: 'Industrielles Wachstum',
      workerProductivity: 'Arbeiterproduktivität',
      environmentalQuality: 'Umweltqualität',
      landMilitary: 'Landmilitär',
      ethnicTension: 'Ethnische Spannungen',
      naturalResources: 'Natürliche Ressourcen'
    };
    
    return displayNames[key] || key;
  }
  
  /**
   * Empfiehlt die beste Region basierend auf Spielstil
   */
  public static recommendRegion(playStyle: string): RegionDefinition | null {
    const regions = this.getAllRegions();
    
    switch (playStyle.toLowerCase()) {
      case 'military':
      case 'militärisch':
        return regions.find(r => r.id === 'preussen') || null;
      
      case 'cultural':
      case 'kulturell':
        return regions.find(r => r.id === 'bayern') || null;
      
      case 'trade':
      case 'handel':
        return regions.find(r => r.id === 'hanse') || null;
      
      case 'industrial':
      case 'industriell':
        return regions.find(r => r.id === 'rheinland') || null;
      
      case 'scientific':
      case 'wissenschaftlich':
        return regions.find(r => r.id === 'sachsen') || null;
      
      case 'diplomatic':
      case 'diplomatisch':
        return regions.find(r => r.id === 'oesterreich') || null;
      
      default:
        return null;
    }
  }
}
