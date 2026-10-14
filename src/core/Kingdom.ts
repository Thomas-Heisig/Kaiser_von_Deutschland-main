// src/core/Kingdom.ts

export type ClimateType = 'temperate' | 'arid' | 'cold' | 'tropical' | 'mountainous' | 'coastal';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TerrainType = 'plains' | 'forests' | 'mountains' | 'hills' | 'wetlands' | 'desert';

export interface KingdomResources {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
  luxuryGoods: number;
  debt: number;
  treasury: number; // Langfristige Reserven
}

export interface KingdomPopulation {
  nobles: number;
  merchants: number;
  soldiers: number;
  clergy: number;
  peasants: number;
  artisans: number;
  scholars: number;
  slaves?: number; // Historische Genauigkeit
  unemployed: number;
  growthRate: number;
}

export interface KingdomMilitary {
  infantry: number;
  cavalry: number;
  archers: number;
  siege: number;
  navy: number;
  morale: number;
  recruitmentRate: number;
  trainingLevel: number; // 0-100
  equipmentQuality: number; // 0-100
}

export interface KingdomInfrastructure {
  markets: number;
  churches: number;
  barracks: number;
  farms: number;
  mines: number;
  roads: number;
  schools: number;
  hospitals: number;
  ports: number;
  walls: number;
  castles: number;
  universities: number;
  guildhalls: number;
  taverns: number;
  warehouses: number;
  workshops: number;
}

export interface KingdomTerrain {
  plains: number; // %
  forests: number; // %
  mountains: number; // %
  hills: number; // %
  wetlands: number; // %
  desert: number; // %
  arableLand: number; // nutzbares Land in Hektar
}

export interface KingdomStats {
  stability: number; // 0-100
  crimeRate: number; // 0-100
  literacyRate: number; // 0-100
  tradePower: number; // 0-100
  culturalInfluence: number; // 0-100
  technologicalLevel: number; // 0-100
  diplomaticRelations: number; // 0-100
}

export interface KingdomConfig {
  name: string;
  rulerName: string;
  difficulty?: number;
  climate?: ClimateType;
  terrain?: Partial<KingdomTerrain>;
  startingResources?: Partial<KingdomResources>;
  startingInfrastructure?: Partial<KingdomInfrastructure>;
  foundingYear?: number;
}

export interface ProductionRates {
  food: number;
  wood: number;
  stone: number;
  iron: number;
  gold: number;
}

export interface ConsumptionRates {
  food: number;
  wood: number;
  gold: number;
}

export class Kingdom {
  public id: string;
  public name: string;
  public rulerName: string;
  public resources!: KingdomResources;
  public population!: KingdomPopulation;
  public military!: KingdomMilitary;
  public infrastructure!: KingdomInfrastructure;
  public terrain!: KingdomTerrain;
  public stats!: KingdomStats;
  
  public taxRate: number = 0.15;
  public happiness: number = 70;
  public difficulty: number = 1;
  public landArea: number = 10000; // in km²
  public climate: ClimateType = 'temperate';
  public currentSeason: Season = 'spring';
  public foundingYear: number;
  public currentYear: number = 1;
  public isAtWar: boolean = false;
  public alliances: string[] = [];
  public vassals: string[] = [];
  public tradePartners: string[] = [];
  
  // Trade Routes (v2.6.0)
  public activeTradeRoutes: Set<string> = new Set();
  public availableTransportTypes: Set<string> = new Set();

  // Produktions- und Verbrauchsraten
  private productionRates!: ProductionRates;
  private consumptionRates!: ConsumptionRates;

  constructor(cfg: KingdomConfig) {
    this.id = this.generateId();
    this.name = cfg.name;
    this.rulerName = cfg.rulerName;
    this.difficulty = cfg.difficulty || 1;
    this.climate = cfg.climate || 'temperate';
    this.foundingYear = cfg.foundingYear || 1;

    this.initializeTerrain(cfg.terrain);
    this.initializeResources(cfg.startingResources);
    this.initializePopulation();
    this.initializeInfrastructure(cfg.startingInfrastructure);
    this.initializeMilitary();
    this.initializeStats();
    this.initializeRates();
  }

  private generateId(): string {
    return `kingdom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private initializeTerrain(customTerrain?: Partial<KingdomTerrain>): void {
    const defaultTerrain: KingdomTerrain = {
      plains: 40,
      forests: 25,
      mountains: 15,
      hills: 10,
      wetlands: 5,
      desert: 5,
      arableLand: this.landArea * 0.4 // 40% des Landes ist nutzbar
    };

    this.terrain = { ...defaultTerrain, ...customTerrain };

    // Klima-spezifische Anpassungen
    switch (this.climate) {
      case 'arid':
        this.terrain.desert = 40;
        this.terrain.plains = 35;
        this.terrain.arableLand = this.landArea * 0.2;
        break;
      case 'cold':
        this.terrain.mountains = 25;
        this.terrain.forests = 35;
        this.terrain.arableLand = this.landArea * 0.3;
        break;
      case 'tropical':
        this.terrain.forests = 40;
        this.terrain.wetlands = 15;
        this.terrain.arableLand = this.landArea * 0.35;
        break;
      case 'mountainous':
        this.terrain.mountains = 40;
        this.terrain.hills = 20;
        this.terrain.arableLand = this.landArea * 0.25;
        break;
      case 'coastal':
        // Keine spezifischen Änderungen, nur für Produktionsbonus
        break;
    }
  }

  private initializeResources(customResources?: Partial<KingdomResources>): void {
    const baseMultiplier = 1 - (this.difficulty - 1) * 0.15;
    const climateMultiplier = this.getClimateResourceMultiplier();

    const defaultResources: KingdomResources = {
      gold: Math.floor(5000 * baseMultiplier * climateMultiplier.gold),
      food: Math.floor(10000 * baseMultiplier * climateMultiplier.food),
      wood: Math.floor(5000 * baseMultiplier * climateMultiplier.wood),
      stone: Math.floor(3000 * baseMultiplier * climateMultiplier.stone),
      iron: Math.floor(2000 * baseMultiplier * climateMultiplier.iron),
      luxuryGoods: Math.floor(500 * baseMultiplier),
      debt: 0,
      treasury: Math.floor(10000 * baseMultiplier)
    };

    this.resources = { ...defaultResources, ...customResources };
  }

  private getClimateResourceMultiplier(): Record<string, number> {
    const multipliers: Record<ClimateType, Record<string, number>> = {
      temperate: { food: 1.2, wood: 1.1, stone: 1.0, iron: 1.0, gold: 1.0 },
      arid: { food: 0.6, wood: 0.5, stone: 1.3, iron: 1.1, gold: 1.2 },
      cold: { food: 0.8, wood: 1.3, stone: 1.1, iron: 1.2, gold: 1.1 },
      tropical: { food: 1.3, wood: 1.4, stone: 0.8, iron: 0.9, gold: 0.9 },
      mountainous: { food: 0.7, wood: 0.9, stone: 1.5, iron: 1.4, gold: 1.3 },
      coastal: { food: 1.1, wood: 1.0, stone: 1.0, iron: 1.0, gold: 1.1 }
    };

    return multipliers[this.climate] || multipliers.temperate;
  }

  private initializePopulation(): void {
    const basePopulation = 3000;
    const difficultyMultiplier = 1 - (this.difficulty - 1) * 0.1;
    const total = Math.floor(basePopulation * difficultyMultiplier);

    this.population = {
      nobles: Math.max(3, Math.floor(total * 0.005)),
      merchants: Math.max(10, Math.floor(total * 0.03)),
      soldiers: Math.max(50, Math.floor(total * 0.02)),
      clergy: Math.max(5, Math.floor(total * 0.01)),
      peasants: Math.floor(total * 0.85),
      artisans: Math.max(20, Math.floor(total * 0.05)),
      scholars: Math.max(5, Math.floor(total * 0.005)),
      unemployed: Math.floor(total * 0.04),
      growthRate: 0.015 // 1.5% jährliches Wachstum
    };
  }

  private initializeInfrastructure(customInfra?: Partial<KingdomInfrastructure>): void {
    const defaultInfrastructure: KingdomInfrastructure = {
      markets: 1,
      churches: 1,
      barracks: 1,
      farms: 8,
      mines: 2,
      roads: 3,
      schools: 1,
      hospitals: 0,
      ports: this.climate === 'coastal' ? 1 : 0,
      walls: 0,
      castles: 0,
      universities: 0,
      guildhalls: 0,
      taverns: 2,
      warehouses: 1,
      workshops: 2
    };

    this.infrastructure = { ...defaultInfrastructure, ...customInfra };
  }

  private initializeMilitary(): void {
    this.military = {
      infantry: 100,
      cavalry: 20,
      archers: 30,
      siege: 0,
      navy: this.climate === 'coastal' ? 10 : 0,
      morale: 65,
      recruitmentRate: 0.05,
      trainingLevel: 40,
      equipmentQuality: 50
    };
  }

  private initializeStats(): void {
    this.stats = {
      stability: 70,
      crimeRate: 20,
      literacyRate: 15,
      tradePower: 30,
      culturalInfluence: 25,
      technologicalLevel: 20,
      diplomaticRelations: 50
    };
  }

  private initializeRates(): void {
    this.productionRates = {
      food: this.calculateFoodProductionRate(),
      wood: this.calculateWoodProductionRate(),
      stone: this.calculateStoneProductionRate(),
      iron: this.calculateIronProductionRate(),
      gold: this.calculateGoldProductionRate()
    };

    this.consumptionRates = {
      food: this.calculateFoodConsumption(),
      wood: this.calculateWoodConsumption(),
      gold: this.calculateGoldConsumption()
    };
  }

  /**
   * Updates production rates with modifiers (temporary, reset monthly)
   * Note: These modifiers are temporary and reset when initializeRates() is called.
   * For permanent production bonuses, modify the calculation methods directly.
   * @param modifiers - Object with resource keys and percentage modifier values (e.g., {food: 10} for +10%)
   */
  public updateProductionRates(modifiers: Partial<Record<keyof ProductionRates, number>>): void {
    Object.keys(modifiers).forEach(resource => {
      const key = resource as keyof ProductionRates;
      const modifier = modifiers[key];
      if (modifier !== undefined && this.productionRates[key] !== undefined) {
        this.productionRates[key] *= (1 + modifier / 100);
      }
    });
  }

  // ==================== ÖFFENTLICHE METHODEN ====================

  /**
   * Baut eine Struktur im Königreich
   */
  public buildStructure(type: keyof KingdomInfrastructure, count: number = 1): boolean {
    const buildingData = this.getBuildingData(type);
    if (!buildingData) return false;

    const totalCost = buildingData.cost * count;
    
    if (this.resources.gold < totalCost || 
        this.resources.wood < (buildingData.woodCost || 0) * count ||
        this.resources.stone < (buildingData.stoneCost || 0) * count) {
      return false;
    }

    // Ressourcen abziehen
    this.resources.gold -= totalCost;
    if (buildingData.woodCost) this.resources.wood -= buildingData.woodCost * count;
    if (buildingData.stoneCost) this.resources.stone -= buildingData.stoneCost * count;

    // Gebäude hinzufügen
    this.infrastructure[type] += count;

    // Auswirkungen anwenden
    if (buildingData.effects) {
      buildingData.effects.forEach(effect => {
        this.applyBuildingEffect(effect, count);
      });
    }

    // Statistiken aktualisieren
    this.updateStatsAfterConstruction(type, count);

    return true;
  }

  /**
   * Baut einen Marktplatz
   */
  public buildMarket(): boolean {
    return this.buildStructure('markets');
  }

  /**
   * Baut eine Farm
   */
  public buildFarm(): boolean {
    return this.buildStructure('farms');
  }

  /**
   * Baut eine Mühle (als speziellen Gebäudetyp)
   */
  public buildMill(): boolean {
    // Mühlen erhöhen Nahrungsproduktion
    const cost = 1800;
    const woodCost = 200;
    
    if (this.resources.gold < cost || this.resources.wood < woodCost) {
      return false;
    }

    this.resources.gold -= cost;
    this.resources.wood -= woodCost;
    
    // Mühlen als spezielles Gebäude zählen
    this.infrastructure.workshops += 1; // Nutze workshops für Mühlen
    
    // Produktionsbonus
    this.productionRates.food *= 1.05; // 5% mehr Nahrungsproduktion
    this.happiness = Math.min(100, this.happiness + 3);
    
    return true;
  }

  /**
   * Rekrutiert Soldaten
   */
  public recruitSoldiers(count: number, type: 'infantry' | 'cavalry' | 'archers' = 'infantry'): boolean {
    const recruitmentCosts = {
      infantry: { gold: 50, food: 10 },
      cavalry: { gold: 150, food: 30, iron: 5 },
      archers: { gold: 75, food: 15, wood: 10 }
    };

    const cost = recruitmentCosts[type];
    const totalGoldCost = cost.gold * count;
    const totalFoodCost = cost.food * count;
    const totalIronCost = ('iron' in cost ? cost.iron * count : 0);
    const totalWoodCost = ('wood' in cost ? cost.wood * count : 0);

    if (this.resources.gold < totalGoldCost || 
        this.resources.food < totalFoodCost ||
        ('iron' in cost && this.resources.iron < totalIronCost) ||
        ('wood' in cost && this.resources.wood < totalWoodCost)) {
      return false;
    }

    // Ressourcen abziehen
    this.resources.gold -= totalGoldCost;
    this.resources.food -= totalFoodCost;
    if ('iron' in cost) this.resources.iron -= totalIronCost;
    if ('wood' in cost) this.resources.wood -= totalWoodCost;

    // Soldaten hinzufügen
    this.military[type] += count;
    
    // Moral-Anpassung
    this.military.morale = Math.min(100, this.military.morale + (count * 0.1));
    
    // Bevölkerungsanpassung
    this.population.soldiers += count;
    this.population.peasants = Math.max(0, this.population.peasants - Math.floor(count * 0.8));
    this.population.unemployed = Math.max(0, this.population.unemployed - Math.floor(count * 0.2));

    return true;
  }

  /**
   * Besteuert die Bevölkerung
   */
  public collectTaxes(): { revenue: number; happinessImpact: number } {
    const baseRevenue = this.calculateTaxRevenue();
    const efficiency = this.calculateTaxEfficiency();
    const actualRevenue = Math.floor(baseRevenue * efficiency);
    
    this.resources.gold += actualRevenue;
    
    // Zufriedenheitsauswirkungen
    const taxHappinessImpact = -Math.floor(this.taxRate * 20);
    this.happiness = Math.max(0, this.happiness + taxHappinessImpact);
    
    // Korruptionschance
    if (Math.random() < 0.1 && this.stats.stability < 60) {
      const stolenAmount = Math.floor(actualRevenue * 0.1);
      this.resources.gold -= stolenAmount;
    }

    return {
      revenue: actualRevenue,
      happinessImpact: taxHappinessImpact
    };
  }

  /**
   * Führt einen kompletten Jahresschritt durch
   */
  public processYear(): void {
    // Jahresstart: aktualisiere Produktionsraten basierend auf Infrastruktur und Zustand
    this.initializeRates();

    this.currentYear++;
    this.updateSeason();

    // Steuern einziehen (jährlich)
    try {
      this.collectTaxes();
    } catch (err) {
      // defensive: falls collectTaxes Fehler wirft, nicht das ganze Jahr abbrechen
      console.warn('collectTaxes failed', err);
    }

    // Ressourcenproduktion
    this.produceResources();

    // Ressourcenverbrauch
    this.consumeResources();

    // Bevölkerungsveränderungen
    this.updatePopulation();

    // Militärpflege
    this.maintainMilitary();

    // Infrastrukturerhaltung
    this.maintainInfrastructure();

    // Statistiken aktualisieren
    this.updateStats();

    // Events basierend auf Jahreszeit
    this.applySeasonalEffects();
  }

  /**
   * Monthly processing: partial production/consumption and upkeep.
   */
  public processMonth(): void {
    // Ensure production rates are up to date
    this.initializeRates();

    // Add monthly share of production
    this.resources.food += Math.floor(this.productionRates.food / 12);
    this.resources.wood += Math.floor(this.productionRates.wood / 12);
    this.resources.stone += Math.floor(this.productionRates.stone / 12);
    this.resources.iron += Math.floor(this.productionRates.iron / 12);
    this.resources.gold += Math.floor(this.productionRates.gold / 12);

    // Consume monthly needs
    this.resources.food = Math.max(0, this.resources.food - Math.floor(this.consumptionRates.food / 12));
    this.resources.wood = Math.max(0, this.resources.wood - Math.floor(this.consumptionRates.wood / 12));
    this.resources.gold = Math.max(0, this.resources.gold - Math.floor(this.consumptionRates.gold / 12));

    // Small maintenance and morale changes
    this.military.morale = Math.max(0, Math.min(100, this.military.morale + (this.happiness - 50) * 0.02));
    this.updatePopulation();
    this.updateStats();
  }

  /**
   * Berechnet Gesamtpunktzahl für das Königreich
   */
  public calculateTotalScore(): number {
    const resourceScore = (
      this.resources.gold / 100 +
      this.resources.food / 500 +
      this.resources.wood / 300 +
      this.resources.stone / 200 +
      this.resources.iron / 150 +
      this.resources.luxuryGoods / 50
    );
    
    const populationScore = (
      this.population.nobles * 150 +
      this.population.merchants * 75 +
      this.population.soldiers * 50 +
      this.population.peasants * 2 +
      this.population.artisans * 40 +
      this.population.scholars * 100
    ) / 100;
    
    const infrastructureScore = (
      this.infrastructure.markets * 60 +
      this.infrastructure.churches * 30 +
      this.infrastructure.barracks * 40 +
      this.infrastructure.farms * 15 +
      this.infrastructure.mines * 35 +
      this.infrastructure.roads * 20 +
      this.infrastructure.schools * 50 +
      this.infrastructure.hospitals * 45 +
      this.infrastructure.castles * 80
    );
    
    const militaryScore = (
      this.military.infantry * 2 +
      this.military.cavalry * 5 +
      this.military.archers * 3 +
      this.military.siege * 15 +
      this.military.navy * 8 +
      this.military.morale * 10 +
      this.military.trainingLevel * 5 +
      this.military.equipmentQuality * 3
    ) / 10;
    
    const statsScore = (
      this.happiness * 15 +
      this.stats.stability * 10 +
      (100 - this.stats.crimeRate) * 8 +
      this.stats.literacyRate * 12 +
      this.stats.tradePower * 9 +
      this.stats.culturalInfluence * 7 +
      this.stats.technologicalLevel * 11 +
      this.stats.diplomaticRelations * 6
    ) / 10;

    const difficultyMultiplier = 1 + (this.difficulty - 1) * 0.5;
    
    return Math.floor((
      resourceScore + 
      populationScore + 
      infrastructureScore + 
      militaryScore + 
      statsScore
    ) / difficultyMultiplier);
  }

  /**
   * Berechnet Nahrungsverbrauch
   */
  public calculateFoodConsumption(): number {
    const { peasants, soldiers, nobles, merchants, clergy, artisans, scholars } = this.population;
    
    const consumptionRates = {
      peasants: 2.5,
      soldiers: 4,
      nobles: 12,
      merchants: 6,
      clergy: 5,
      artisans: 3.5,
      scholars: 3
    };
    
    return Math.floor(
      peasants * consumptionRates.peasants +
      soldiers * consumptionRates.soldiers +
      nobles * consumptionRates.nobles +
      merchants * consumptionRates.merchants +
      clergy * consumptionRates.clergy +
      artisans * consumptionRates.artisans +
      scholars * consumptionRates.scholars
    );
  }

  /**
   * Berechnet Steuereinnahmen
   */
  public calculateTaxRevenue(): number {
    const populationValues = {
      peasants: 0.8,
      merchants: 3,
      nobles: 15,
      artisans: 2,
      clergy: 1,
      scholars: 0.5
    };
    
    let totalRevenue = 0;
    Object.entries(populationValues).forEach(([key, value]) => {
      const populationKey = key as keyof typeof populationValues;
      totalRevenue += this.population[populationKey] * value;
    });
    
    // Steuerbonus durch Infrastruktur
    const infrastructureBonus = this.infrastructure.roads * 0.05 + 
                               this.infrastructure.markets * 0.1;
    
    // Effizienz durch Stabilität und Glück
    const efficiency = (this.happiness / 100) * (this.stats.stability / 100);
    
    return Math.floor(totalRevenue * this.taxRate * (1 + infrastructureBonus) * efficiency);
  }

  /**
   * Berechnet Steuereffizienz
   */
  private calculateTaxEfficiency(): number {
    const baseEfficiency = 0.8;
    const roadsBonus = Math.min(0.3, this.infrastructure.roads * 0.05);
    const stabilityBonus = this.stats.stability * 0.005;
    const literacyPenalty = (100 - this.stats.literacyRate) * 0.001;
    
    return Math.max(0.3, Math.min(1.0, 
      baseEfficiency + roadsBonus + stabilityBonus - literacyPenalty
    ));
  }

  // ==================== PRIVATE METHODEN ====================

  private getBuildingData(type: keyof KingdomInfrastructure): {
    cost: number;
    woodCost?: number;
    stoneCost?: number;
    ironCost?: number;
    effects?: Array<{ type: string; value: number }>;
  } | undefined {
    const buildingData: Record<keyof KingdomInfrastructure, {
      cost: number;
      woodCost?: number;
      stoneCost?: number;
      ironCost?: number;
      effects?: Array<{ type: string; value: number }>;
    }> = {
      markets: { cost: 2000, woodCost: 500, effects: [{ type: 'happiness', value: 3 }, { type: 'trade', value: 10 }] },
      churches: { cost: 1500, stoneCost: 300, effects: [{ type: 'happiness', value: 4 }, { type: 'stability', value: 5 }] },
      barracks: { cost: 2500, woodCost: 800, stoneCost: 400, effects: [{ type: 'recruitment', value: 5 }, { type: 'training', value: 3 }] },
      farms: { cost: 1200, woodCost: 300, effects: [{ type: 'foodProduction', value: 200 }] },
      mines: { cost: 3000, woodCost: 400, effects: [{ type: 'resourceProduction', value: 10 }] },
      roads: { cost: 800, stoneCost: 200, effects: [{ type: 'trade', value: 5 }, { type: 'mobility', value: 8 }] },
      schools: { cost: 2200, woodCost: 400, stoneCost: 300, effects: [{ type: 'literacy', value: 7 }] },
      hospitals: { cost: 2800, woodCost: 600, stoneCost: 400, effects: [{ type: 'happiness', value: 5 }, { type: 'health', value: 10 }] },
      ports: { cost: 3500, woodCost: 1200, stoneCost: 800, effects: [{ type: 'trade', value: 15 }, { type: 'navy', value: 10 }] },
      walls: { cost: 5000, stoneCost: 2000, effects: [{ type: 'defense', value: 20 }, { type: 'stability', value: 8 }] },
      castles: { cost: 10000, stoneCost: 5000, woodCost: 2000, ironCost: 500, effects: [{ type: 'defense', value: 50 }, { type: 'prestige', value: 15 }] },
      universities: { cost: 6000, woodCost: 1500, stoneCost: 1200, effects: [{ type: 'literacy', value: 15 }, { type: 'technology', value: 10 }] },
      guildhalls: { cost: 1800, woodCost: 600, effects: [{ type: 'trade', value: 8 }, { type: 'artisans', value: 5 }] },
      taverns: { cost: 900, woodCost: 300, effects: [{ type: 'happiness', value: 6 }] },
      warehouses: { cost: 1400, woodCost: 800, effects: [{ type: 'storage', value: 1000 }] },
      workshops: { cost: 1600, woodCost: 500, ironCost: 100, effects: [{ type: 'production', value: 8 }] }
    };

    return buildingData[type];
  }

  private applyBuildingEffect(effect: { type: string; value: number }, count: number): void {
    switch (effect.type) {
      case 'happiness':
        this.happiness = Math.min(100, this.happiness + effect.value * count);
        break;
      case 'foodProduction':
        this.resources.food += effect.value * count;
        break;
      case 'stability':
        this.stats.stability = Math.min(100, this.stats.stability + effect.value * count);
        break;
      case 'literacy':
        this.stats.literacyRate = Math.min(100, this.stats.literacyRate + effect.value * count);
        break;
      // Weitere Effekte...
    }
  }

  private updateStatsAfterConstruction(type: keyof KingdomInfrastructure, count: number): void {
    // Stabilitätsbonus für Bauprojekte
    this.stats.stability = Math.min(100, this.stats.stability + count * 2);
    
    // Technologiebonus für fortschrittliche Gebäude
    if (['universities', 'schools', 'workshops'].includes(type)) {
      this.stats.technologicalLevel = Math.min(100, this.stats.technologicalLevel + count * 3);
    }
  }

  private updateSeason(): void {
    const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
    const currentIndex = seasons.indexOf(this.currentSeason);
    this.currentSeason = seasons[(currentIndex + 1) % 4];
  }

  private produceResources(): void {
    // Nahrungsproduktion (abhängig von Jahreszeit)
    const seasonalMultiplier = this.getSeasonalMultiplier();
    const foodProduced = Math.floor(this.productionRates.food * seasonalMultiplier.food);
    this.resources.food += foodProduced;
    
    // Holzproduktion
    const woodProduced = Math.floor(this.productionRates.wood * seasonalMultiplier.wood);
    this.resources.wood += woodProduced;
    
    // Stein- und Eisenproduktion
    this.resources.stone += Math.floor(this.productionRates.stone);
    this.resources.iron += Math.floor(this.productionRates.iron);
    
    // Goldproduktion (Handel, Steuern, etc.)
    const goldProduced = Math.floor(this.productionRates.gold);
    this.resources.gold += goldProduced;
  }

  private getSeasonalMultiplier(): { food: number; wood: number } {
    const multipliers: Record<Season, { food: number; wood: number }> = {
      spring: { food: 1.2, wood: 1.1 },
      summer: { food: 1.4, wood: 1.0 },
      autumn: { food: 1.0, wood: 0.9 },
      winter: { food: 0.5, wood: 0.7 }
    };
    
    return multipliers[this.currentSeason];
  }

  private calculateFoodProductionRate(): number {
    const baseRate = this.infrastructure.farms * 250;
    const climateBonus = this.climate === 'temperate' || this.climate === 'tropical' ? 1.2 : 1.0;
    const roadBonus = this.infrastructure.roads * 10;
    const peasantEfficiency = this.population.peasants * 0.1;
    
    return Math.floor((baseRate + roadBonus + peasantEfficiency) * climateBonus);
  }

  private calculateWoodProductionRate(): number {
    const baseRate = this.terrain.forests * 20;
    const infrastructureBonus = this.infrastructure.workshops * 15;
    
    return Math.floor(baseRate + infrastructureBonus);
  }

  private calculateStoneProductionRate(): number {
    const baseRate = this.terrain.mountains * 15 + this.terrain.hills * 10;
    const mineBonus = this.infrastructure.mines * 50;
    
    return Math.floor(baseRate + mineBonus);
  }

  private calculateIronProductionRate(): number {
    const baseRate = this.infrastructure.mines * 30;
    const terrainBonus = this.terrain.mountains * 5;
    const workshopBonus = this.infrastructure.workshops * 10;
    
    return Math.floor(baseRate + terrainBonus + workshopBonus);
  }

  private calculateGoldProductionRate(): number {
    const tradeIncome = this.infrastructure.markets * 75 + this.infrastructure.ports * 120;
    const mineIncome = this.infrastructure.mines * 25;

    // Steueraufkommen wird separat durch collectTaxes() erfasst, damit Steuersatz
    // nicht doppelt gezählt wird. Hier nur Handel und Bergbau als dauerhafte Erträge.
    return Math.floor(tradeIncome + mineIncome);
  }

  private consumeResources(): void {
    // Nahrungsverbrauch
    const foodConsumed = this.consumptionRates.food;
    this.resources.food = Math.max(0, this.resources.food - foodConsumed);
    
    // Holzverbrauch (Heizung, Bau, etc.)
    const woodConsumed = this.consumptionRates.wood;
    this.resources.wood = Math.max(0, this.resources.wood - woodConsumed);
    
    // Goldverbrauch (Unterhalt, Gehälter, etc.)
    const goldConsumed = this.consumptionRates.gold;
    this.resources.gold = Math.max(0, this.resources.gold - goldConsumed);
  }

  private calculateWoodConsumption(): number {
    const baseConsumption = this.population.peasants * 0.2 + 
                           this.population.nobles * 1.5 + 
                           this.infrastructure.farms * 10;
    
    const winterMultiplier = this.currentSeason === 'winter' ? 1.5 : 1.0;
    
    return Math.floor(baseConsumption * winterMultiplier);
  }

  private calculateGoldConsumption(): number {
    const militaryUpkeep = (
      this.military.infantry * 1 +
      this.military.cavalry * 3 +
      this.military.archers * 2 +
      this.military.siege * 10 +
      this.military.navy * 5
    );
    
    const infrastructureUpkeep = (
      this.infrastructure.markets * 25 +
      this.infrastructure.barracks * 40 +
      this.infrastructure.castles * 100 +
      this.infrastructure.hospitals * 35 +
      this.infrastructure.schools * 20
    );
    
    const officialSalaries = (
      this.population.nobles * 10 +
      this.population.clergy * 5 +
      this.population.scholars * 8
    );
    
    return Math.floor(militaryUpkeep + infrastructureUpkeep + officialSalaries);
  }

  private updatePopulation(): void {
    // Bevölkerungswachstum
    const growthFactor = this.population.growthRate * 
                        (this.happiness / 100) * 
                        (this.resources.food > 10000 ? 1.2 : 1.0);
    
    const newPeasants = Math.floor(this.population.peasants * growthFactor);
    this.population.peasants += newPeasants;
    
    // Migration basierend auf Zufriedenheit
    if (this.happiness < 40) {
      const emigration = Math.floor(this.population.peasants * 0.02);
      this.population.peasants = Math.max(0, this.population.peasants - emigration);
    } else if (this.happiness > 80) {
      const immigration = Math.floor(this.population.peasants * 0.01);
      this.population.peasants += immigration;
    }
    
    // Arbeitslosenquote aktualisieren
    this.updateUnemployment();
  }

  private updateUnemployment(): void {
    const availableJobs = (
      this.infrastructure.farms * 10 +
      this.infrastructure.mines * 8 +
      this.infrastructure.workshops * 6 +
      this.infrastructure.markets * 4
    );
    
    const totalWorkers = this.population.peasants + this.population.artisans;
    this.population.unemployed = Math.max(0, totalWorkers - availableJobs);
    
    // Arbeitslosigkeit beeinflusst Zufriedenheit und Kriminalität
    if (this.population.unemployed > totalWorkers * 0.1) {
      this.happiness = Math.max(0, this.happiness - 5);
      this.stats.crimeRate = Math.min(100, this.stats.crimeRate + 3);
    }
  }

  private maintainMilitary(): void {
    // Moral-Anpassung
    const moraleChange = (
      (this.happiness / 100) * 2 - 
      (this.isAtWar ? 10 : 0) + 
      (this.military.trainingLevel / 100) * 3
    );
    
    this.military.morale = Math.max(0, Math.min(100, 
      this.military.morale + moraleChange
    ));
    
    // Training verbessern
    if (this.infrastructure.barracks > 0) {
      this.military.trainingLevel = Math.min(100, 
        this.military.trainingLevel + 0.5
      );
    }
    
    // Ausrüstung verschlechtert sich
    this.military.equipmentQuality = Math.max(0, 
      this.military.equipmentQuality - 0.3
    );
    
    // Ausrüstung kann verbessert werden
    if (this.resources.iron > 500 && this.resources.gold > 1000) {
      this.military.equipmentQuality = Math.min(100, 
        this.military.equipmentQuality + 2
      );
      this.resources.iron -= 100;
      this.resources.gold -= 200;
    }
  }

  private maintainInfrastructure(): void {
    // Infrastruktur verschlechtert sich
    const decayChance = 0.1;
    Object.keys(this.infrastructure).forEach(key => {
      if (Math.random() < decayChance) {
        const infraKey = key as keyof KingdomInfrastructure;
        if (this.infrastructure[infraKey] > 0) {
          this.infrastructure[infraKey] = Math.max(0, this.infrastructure[infraKey] - 1);
        }
      }
    });
    
    // Straßen erhalten Priorität
    if (this.infrastructure.roads < 5 && this.resources.stone > 200) {
      this.infrastructure.roads += 1;
      this.resources.stone -= 200;
    }
  }

  private updateStats(): void {
    // Stabilität basierend auf verschiedenen Faktoren
    const stabilityChange = (
      (this.happiness / 100) * 5 -
      (this.stats.crimeRate / 100) * 8 +
      (this.infrastructure.churches > 0 ? 3 : 0) +
      (this.military.infantry > 200 ? 5 : 0) -
      (this.isAtWar ? 15 : 0)
    );
    
    this.stats.stability = Math.max(0, Math.min(100, 
      this.stats.stability + stabilityChange
    ));
    
    // Kriminalität
    const crimeChange = (
      (this.population.unemployed / this.population.peasants) * 10 -
      (this.stats.stability / 100) * 5 -
      (this.infrastructure.churches > 0 ? 2 : 0)
    );
    
    this.stats.crimeRate = Math.max(0, Math.min(100, 
      this.stats.crimeRate + crimeChange
    ));
    
    // Alphabetisierungsrate
    if (this.infrastructure.schools > 0 || this.infrastructure.universities > 0) {
      const literacyIncrease = (
        this.infrastructure.schools * 0.5 +
        this.infrastructure.universities * 1.5
      );
      this.stats.literacyRate = Math.min(100, 
        this.stats.literacyRate + literacyIncrease
      );
    }
    
    // Handelsmacht
    const tradeChange = (
      this.infrastructure.markets * 2 +
      this.infrastructure.ports * 3 +
      this.infrastructure.roads * 1 -
      (this.stats.crimeRate / 100) * 5
    );
    
    this.stats.tradePower = Math.max(0, Math.min(100, 
      this.stats.tradePower + tradeChange
    ));
  }

  private applySeasonalEffects(): void {
    switch (this.currentSeason) {
      case 'spring':
        // Bauprojekte günstiger
        this.happiness = Math.min(100, this.happiness + 3);
        break;
      case 'summer':
        // Landwirtschaft boomt, aber Krankheitsrisiko
        if (Math.random() < 0.1 && this.infrastructure.hospitals < 2) {
          this.population.peasants = Math.max(0, this.population.peasants - 50);
        }
        break;
      case 'autumn':
        // Erntezeit, Vorräte auffüllen
        this.resources.food = Math.min(50000, this.resources.food * 1.2);
        break;
      case 'winter':
        // Herausforderungen
        this.happiness = Math.max(0, this.happiness - 5);
        if (this.resources.wood < 1000) {
          this.happiness = Math.max(0, this.happiness - 10);
          this.population.peasants = Math.max(0, this.population.peasants - 100);
        }
        break;
    }
  }

  // ===== Trade Routes Management (v2.6.0) =====

  /**
   * Aktiviert eine Handelsroute
   * @param routeId ID der Handelsroute
   * @returns true wenn erfolgreich aktiviert
   */
  public activateTradeRoute(routeId: string): boolean {
    if (!this.activeTradeRoutes.has(routeId)) {
      this.activeTradeRoutes.add(routeId);
      return true;
    }
    return false;
  }

  /**
   * Deaktiviert eine Handelsroute
   * @param routeId ID der Handelsroute
   */
  public deactivateTradeRoute(routeId: string): void {
    this.activeTradeRoutes.delete(routeId);
  }

  /**
   * Prüft ob eine Handelsroute aktiv ist
   * @param routeId ID der Handelsroute
   */
  public isTradeRouteActive(routeId: string): boolean {
    return this.activeTradeRoutes.has(routeId);
  }

  /**
   * Gibt alle aktiven Handelsrouten zurück
   */
  public getActiveTradeRoutes(): string[] {
    return Array.from(this.activeTradeRoutes);
  }

  /**
   * Berechnet das Einkommen aus aktiven Handelsrouten
   * Wird vom GameEngine's TransportSystem verwendet
   * @param transportSystem Das TransportSystem aus der GameEngine
   */
  public calculateTradeRouteIncome(transportSystem: any): number {
    let totalIncome = 0;
    
    for (const routeId of this.activeTradeRoutes) {
      const route = transportSystem.getTradeRoute(routeId);
      if (route) {
        // Basis-Einkommen aus der Route
        let routeIncome = route.effects.trade_income || 0;
        
        // Modifikatoren basierend auf Infrastruktur
        const infrastructureBonus = (
          (this.infrastructure.ports || 0) * 0.15 +
          (this.infrastructure.markets || 0) * 0.10 +
          (this.infrastructure.roads || 0) * 0.05 +
          (this.infrastructure.warehouses || 0) * 0.08
        );
        
        // Trade Power Bonus
        const tradePowerBonus = (this.stats.tradePower / 100) * 0.5;
        
        // Handelspartner-Bonus (mehr Partner = mehr Handel)
        const partnerBonus = Math.min(this.tradePartners.length * 0.05, 0.25);
        
        // Sicherheits-Malus bei niedrigem Stabilitätswert
        const stabilityPenalty = this.stats.stability < 50 ? (50 - this.stats.stability) * 0.01 : 0;
        
        // Kriegs-Malus
        const warPenalty = this.isAtWar ? 0.3 : 0;
        
        routeIncome = routeIncome * (
          1 + infrastructureBonus + tradePowerBonus + partnerBonus - stabilityPenalty - warPenalty
        );
        
        totalIncome += Math.floor(routeIncome);
      }
    }
    
    return totalIncome;
  }

  /**
   * Berechnet kulturellen Einfluss aus Handelsrouten
   * @param transportSystem Das TransportSystem aus der GameEngine
   */
  public calculateTradeRouteCulturalInfluence(transportSystem: any): number {
    let totalInfluence = 0;
    
    for (const routeId of this.activeTradeRoutes) {
      const route = transportSystem.getTradeRoute(routeId);
      if (route) {
        const influence = route.effects.cultural_influence || route.culturalExchange || 0;
        totalInfluence += influence;
      }
    }
    
    return totalInfluence / Math.max(1, this.activeTradeRoutes.size);
  }

  /**
   * Berechnet Prestige aus Handelsrouten
   * @param transportSystem Das TransportSystem aus der GameEngine
   */
  public calculateTradeRoutePrestige(transportSystem: any): number {
    let totalPrestige = 0;
    
    for (const routeId of this.activeTradeRoutes) {
      const route = transportSystem.getTradeRoute(routeId);
      if (route) {
        totalPrestige += route.effects.prestige || 0;
      }
    }
    
    return totalPrestige;
  }

  /**
   * Fügt einen verfügbaren Transporttyp hinzu
   * @param transportId ID des Transporttyps
   */
  public unlockTransportType(transportId: string): void {
    this.availableTransportTypes.add(transportId);
  }

  /**
   * Prüft ob ein Transporttyp verfügbar ist
   * @param transportId ID des Transporttyps
   */
  public hasTransportType(transportId: string): boolean {
    return this.availableTransportTypes.has(transportId);
  }

  /**
   * Gibt alle verfügbaren Transporttypen zurück
   */
  public getAvailableTransportTypes(): string[] {
    return Array.from(this.availableTransportTypes);
  }

  /**
   * Serialisiert das Königreich für Speicherung
   */
  public serialize(): any {
    return {
      id: this.id,
      name: this.name,
      rulerName: this.rulerName,
      resources: this.resources,
      population: this.population,
      military: this.military,
      infrastructure: this.infrastructure,
      terrain: this.terrain,
      stats: this.stats,
      taxRate: this.taxRate,
      happiness: this.happiness,
      difficulty: this.difficulty,
      landArea: this.landArea,
      climate: this.climate,
      currentSeason: this.currentSeason,
      foundingYear: this.foundingYear,
      currentYear: this.currentYear,
      isAtWar: this.isAtWar,
      alliances: this.alliances,
      vassals: this.vassals,
      tradePartners: this.tradePartners,
      activeTradeRoutes: Array.from(this.activeTradeRoutes),
      availableTransportTypes: Array.from(this.availableTransportTypes),
      productionRates: this.productionRates,
      consumptionRates: this.consumptionRates
    };
  }

  /**
   * Deserialisiert ein Königreich aus gespeicherten Daten
   */
  public static deserialize(data: any): Kingdom {
    const kingdom = new Kingdom({
      name: data.name,
      rulerName: data.rulerName,
      difficulty: data.difficulty,
      climate: data.climate,
      foundingYear: data.foundingYear,
      terrain: data.terrain,
      startingResources: data.resources,
      startingInfrastructure: data.infrastructure
    });

    kingdom.id = data.id;
    kingdom.population = data.population;
    kingdom.military = data.military;
    kingdom.stats = data.stats;
    kingdom.taxRate = data.taxRate;
    kingdom.happiness = data.happiness;
    kingdom.landArea = data.landArea;
    kingdom.currentSeason = data.currentSeason;
    kingdom.currentYear = data.currentYear;
    kingdom.isAtWar = data.isAtWar;
    kingdom.alliances = data.alliances || [];
    kingdom.vassals = data.vassals || [];
    kingdom.tradePartners = data.tradePartners || [];
    kingdom.activeTradeRoutes = new Set(data.activeTradeRoutes || []);
    kingdom.availableTransportTypes = new Set(data.availableTransportTypes || []);

    // Private Felder
    (kingdom as any).productionRates = data.productionRates;
    (kingdom as any).consumptionRates = data.consumptionRates;

    return kingdom;
  }

  /**
   * Gibt eine Zusammenfassung des Königreichs zurück
   */
  public getSummary(): {
    totalPopulation: number;
    netWorth: number;
    militaryStrength: number;
    developmentScore: number;
  } {
    const totalPopulation = Object.values(this.population)
      .filter(val => typeof val === 'number')
      .reduce((sum, val) => sum + (val as number), 0) - this.population.unemployed;

    const netWorth = (
      this.resources.gold +
      this.resources.food * 0.5 +
      this.resources.wood * 0.3 +
      this.resources.stone * 0.4 +
      this.resources.iron * 0.8 +
      this.resources.luxuryGoods * 10 +
      this.resources.treasury
    );

    const militaryStrength = (
      this.military.infantry * 1 +
      this.military.cavalry * 3 +
      this.military.archers * 2 +
      this.military.siege * 10 +
      this.military.navy * 5
    ) * (this.military.morale / 100) * (this.military.equipmentQuality / 100);

    const developmentScore = this.calculateTotalScore();

    return {
      totalPopulation,
      netWorth: Math.floor(netWorth),
      militaryStrength: Math.floor(militaryStrength),
      developmentScore
    };
  }
}