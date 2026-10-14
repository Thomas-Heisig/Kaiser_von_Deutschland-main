// src/core/Economy.ts
import { Kingdom, ClimateType, KingdomResources } from './Kingdom';

export interface HarvestResult {
  foodProduced: number;
  foodQuality: number; // 0-1 Qualitätsfaktor
  affectedByWeather: boolean;
}

export interface EconomyUpdate {
  taxRevenue: number;
  maintenanceCost: number;
  foodConsumption: number;
  foodDeficit: number;
  happinessChange: number;
  populationChange: number;
  goldChange: number;
  inflation: number;
}

export interface PopulationChange {
  nobles: number;
  merchants: number;
  peasants: number;
  soldiers: number;
  clergy: number;
  artisans: number;
  scholars: number;
  totalGrowth: number;
}

export interface TradeOpportunity {
  type: 'import' | 'export';
  resource: keyof KingdomResources;
  amount: number;
  pricePerUnit: number;
  expirationYear: number;
}

export class EconomySystem {
  private climateModifiers: Record<ClimateType, number>;
  private inflationRate: number = 0.02; // 2% jährliche Inflation
  private marketPrices: Record<keyof KingdomResources, number>;
  private tradeOpportunities: TradeOpportunity[] = [];

  constructor(private config: { difficulty: number; gameSpeed: number }) {
    // Klimamodifikatoren für die Landwirtschaft
    this.climateModifiers = {
      temperate: 1.2,    // Gemäßigtes Klima: beste Bedingungen
      arid: 0.6,         // Arides Klima: geringere Erträge
      cold: 0.8,         // Kaltes Klima: mittlere Erträge
      tropical: 1.0,     // Tropisches Klima: gute Bedingungen, aber andere Nachteile
      mountainous: 0.7,  // Bergiges Klima: schwierige Bedingungen
      coastal: 1.1       // Küstenklima: gute Bedingungen
    };

    // Basismarktpreise
    this.marketPrices = {
      gold: 1,      // Gold ist die Basiswährung
      food: 0.5,    // Nahrung pro Einheit
      wood: 0.3,    // Holz pro Einheit
      stone: 0.4,   // Stein pro Einheit
      iron: 0.8,    // Eisen pro Einheit
      debt: 1,      // Schulden haben keinen direkten Marktpreis
      luxuryGoods: 2.0,  // Luxusgüter pro Einheit
      treasury: 1   // Treasury hat keinen direkten Marktpreis
    };
  }

  /**
   * Berechnet die Ernte basierend auf Klima, Infrastruktur und Zufall
   */
  public async calculateHarvest(kingdom: Kingdom): Promise<HarvestResult> {
    const baseProduction = kingdom.infrastructure.farms * 200;
    const climateModifier = this.climateModifiers[kingdom.climate] || 1;
    
    // Zufällige Wettereffekte (±20%)
    const weatherEffect = 0.8 + Math.random() * 0.4;
    const infrastructureBonus = kingdom.infrastructure.roads * 0.05; // Straßen verbessern Effizienz
    
    // Qualitätsfaktor basierend auf Infrastruktur und Glück
    const foodQuality = 0.5 + (kingdom.happiness / 200) + (kingdom.infrastructure.farms * 0.01);
    
    const totalProduction = Math.floor(
      baseProduction * climateModifier * weatherEffect * (1 + infrastructureBonus)
    );

    // Nahrungshaltung durch Märkte
    const storageEfficiency = kingdom.infrastructure.markets > 0 ? 
      Math.min(0.9, kingdom.infrastructure.markets * 0.1) : 0.7;
    
    const effectiveProduction = Math.floor(totalProduction * storageEfficiency);

    kingdom.resources.food += effectiveProduction;
    
    return {
      foodProduced: effectiveProduction,
      foodQuality: Math.min(1, foodQuality),
      affectedByWeather: weatherEffect < 0.9 || weatherEffect > 1.1
    };
  }

  /**
   * Führt eine volle Wirtschaftssimulation für ein Jahr durch
   */
  public updateEconomy(kingdom: Kingdom, _harvest: HarvestResult): EconomyUpdate {
    const foodConsumption = this.calculateTotalFoodConsumption(kingdom);
    const foodDeficit = Math.max(0, foodConsumption - kingdom.resources.food);
    
    // Zufriedenheitsänderungen
    let happinessChange = 0;
    
    if (foodDeficit > 0) {
      const deficitPct = foodDeficit / foodConsumption;
      happinessChange = -Math.min(50, deficitPct * 100);
      
      // Hungersnot-Effekte
      if (deficitPct > 0.3) {
        this.applyFamineEffects(kingdom, deficitPct);
      }
    } else {
      // Überschuss erhöht Zufriedenheit
      const surplusPct = (kingdom.resources.food - foodConsumption) / foodConsumption;
      happinessChange = Math.min(15, surplusPct * 20);
      
      // Nahrungsüberschuss kann verkauft werden
      if (surplusPct > 0.1) {
        const sellableFood = Math.floor((kingdom.resources.food - foodConsumption) * 0.5);
        const goldFromFood = Math.floor(sellableFood * this.marketPrices.food);
        kingdom.resources.gold += goldFromFood;
        kingdom.resources.food -= sellableFood;
      }
    }
    
    kingdom.happiness = Math.max(0, Math.min(100, kingdom.happiness + happinessChange));
    
    // Steuereinnahmen mit Inflation
    const baseTaxRevenue = kingdom.calculateTaxRevenue();
    const adjustedTaxRevenue = Math.floor(baseTaxRevenue * (1 - this.inflationRate));
    
    // Unterhaltskosten
    const maintenanceCost = this.calculateMaintenanceCost(kingdom);
    
    // Handelseinkünfte
    const tradeIncome = this.calculateTradeIncome(kingdom);
    
    // Gesamtgoldänderung
    const totalGoldChange = adjustedTaxRevenue - maintenanceCost + tradeIncome;
    kingdom.resources.gold += totalGoldChange;
    
    // Schuldenmanagement
    this.manageDebt(kingdom);
    
    // Inflation anpassen
    this.adjustInflation(kingdom);
    
    // Bevölkerungsänderungen
    const populationChange = this.calculateDetailedPopulationChanges(kingdom);
    this.applyPopulationChanges(kingdom, populationChange);
    
    // Neue Handelsmöglichkeiten generieren
    this.generateTradeOpportunities(kingdom);
    
    return {
      taxRevenue: adjustedTaxRevenue,
      maintenanceCost,
      foodConsumption,
      foodDeficit,
      happinessChange,
      populationChange: populationChange.totalGrowth,
      goldChange: totalGoldChange,
      inflation: this.inflationRate
    };
  }

  /**
   * Berechnet detaillierte Bevölkerungsänderungen
   */
  public calculateDetailedPopulationChanges(kingdom: Kingdom): PopulationChange {
    const baseGrowthRate = 0.01; // 1% Basiswachstum
    
    // Modifikatoren
    const happinessModifier = kingdom.happiness / 100;
    const foodModifier = kingdom.resources.food > 10000 ? 1.2 : 
                        kingdom.resources.food > 5000 ? 1.1 : 1.0;
    const diseaseModifier = kingdom.infrastructure.hospitals > 0 ? 
      1 + (kingdom.infrastructure.hospitals * 0.05) : 0.9;
    
    const totalGrowthRate = baseGrowthRate * happinessModifier * foodModifier * diseaseModifier;
    
    return {
      nobles: Math.floor(kingdom.population.nobles * totalGrowthRate * 0.5),
      merchants: Math.floor(kingdom.population.merchants * totalGrowthRate * 0.8),
      peasants: Math.floor(kingdom.population.peasants * totalGrowthRate),
      soldiers: Math.floor(kingdom.population.soldiers * totalGrowthRate * 0.3),
      clergy: Math.floor(kingdom.population.clergy * totalGrowthRate * 0.6),
      artisans: Math.floor(kingdom.population.artisans * totalGrowthRate * 0.7),
      scholars: Math.floor(kingdom.population.scholars * totalGrowthRate * 0.4),
      totalGrowth: Math.floor(
        Object.values(kingdom.population).reduce((sum, count) => sum + count, 0) * totalGrowthRate
      )
    };
  }

  /**
   * Berechnet den gesamten Nahrungsverbrauch
   */
  private calculateTotalFoodConsumption(kingdom: Kingdom): number {
    const { peasants, soldiers, nobles, merchants, clergy, artisans, scholars } = kingdom.population;
    
    const consumptionRates = {
      peasants: 2,
      soldiers: 3,
      nobles: 10,
      merchants: 5,
      clergy: 4,
      artisans: 3,
      scholars: 3
    };
    
    return (
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
   * Berechnet Unterhaltskosten für Infrastruktur und Militär
   */
  private calculateMaintenanceCost(kingdom: Kingdom): number {
    let totalCost = 0;
    
    // Infrastrukturkosten
    totalCost += kingdom.infrastructure.markets * 50;
    totalCost += kingdom.infrastructure.farms * 20;
    totalCost += kingdom.infrastructure.mines * 40;
    totalCost += kingdom.infrastructure.roads * 10;
    totalCost += kingdom.infrastructure.barracks * 60;
    totalCost += kingdom.infrastructure.churches * 30;
    totalCost += kingdom.infrastructure.schools * 25;
    totalCost += kingdom.infrastructure.hospitals * 35;
    
    // Militärkosten
    totalCost += kingdom.military.infantry * 3;
    totalCost += kingdom.military.cavalry * 8;
    totalCost += kingdom.military.archers * 4;
    totalCost += kingdom.military.siege * 50;
    totalCost += kingdom.military.navy * 30;
    
    // Verwaltungskosten (abhängig von Bevölkerung)
    const adminCost = Object.values(kingdom.population).reduce((sum, count) => sum + count, 0) * 0.01;
    totalCost += adminCost;
    
    // Schwierigkeitsmodifikator
    totalCost *= (1 + (this.config.difficulty - 1) * 0.2);
    
    return Math.floor(totalCost);
  }

  /**
   * Berechnet Einkünfte aus Handel
   */
  private calculateTradeIncome(kingdom: Kingdom): number {
    let income = 0;
    
    // Basishandel basierend auf Märkten
    const baseTrade = kingdom.infrastructure.markets * 100;
    
    // Ressourcenexport
    income += Math.min(kingdom.resources.wood * 0.1, 500);
    income += Math.min(kingdom.resources.stone * 0.15, 750);
    income += Math.min(kingdom.resources.iron * 0.2, 1000);
    
    // Straßenbonus
    const roadBonus = kingdom.infrastructure.roads * 5;
    
    return Math.floor(baseTrade + income + roadBonus);
  }

  /**
   * Verwaltet Schulden und Zinsen
   */
  private manageDebt(kingdom: Kingdom): void {
    if (kingdom.resources.debt > 0) {
      // Zinsen (10% jährlich)
      const interest = Math.floor(kingdom.resources.debt * 0.1);
      kingdom.resources.debt += interest;
      
      // Automatische Tilgung wenn genug Gold vorhanden
      const maxRepayment = Math.floor(kingdom.resources.gold * 0.1);
      const repayment = Math.min(maxRepayment, kingdom.resources.debt);
      
      if (repayment > 0) {
        kingdom.resources.gold -= repayment;
        kingdom.resources.debt -= repayment;
        
        // Schuldentilgung erhöht Zufriedenheit
        if (repayment > 1000) {
          kingdom.happiness = Math.min(100, kingdom.happiness + 2);
        }
      }
      
      // Hohe Schulden reduzieren Zufriedenheit
      if (kingdom.resources.debt > 10000) {
        kingdom.happiness = Math.max(0, kingdom.happiness - 5);
      }
    }
  }

  /**
   * Passt die Inflation basierend auf Wirtschaftslage an
   */
  private adjustInflation(kingdom: Kingdom): void {
    // Inflation steigt mit Goldmenge, sinkt mit Produktion
    const goldFactor = kingdom.resources.gold / 100000;
    const productionFactor = kingdom.infrastructure.farms + kingdom.infrastructure.mines;
    const stabilityFactor = kingdom.happiness / 100;
    
    this.inflationRate = 0.02 + (goldFactor * 0.01) - (productionFactor * 0.001) - (stabilityFactor * 0.005);
    this.inflationRate = Math.max(0.001, Math.min(0.1, this.inflationRate));
    
    // Preise an Inflation anpassen
    Object.keys(this.marketPrices).forEach(key => {
      if (key !== 'gold') {
        this.marketPrices[key as keyof KingdomResources] *= (1 + this.inflationRate);
      }
    });
  }

  /**
   * Wendet Hungersnot-Effekte an
   */
  private applyFamineEffects(kingdom: Kingdom, deficitPct: number): void {
    // Bevölkerungsverlust
    const populationLoss = Math.floor(kingdom.population.peasants * deficitPct * 0.3);
    kingdom.population.peasants = Math.max(0, kingdom.population.peasants - populationLoss);
    
    // Weitere Zufriedenheitsverluste
    kingdom.happiness = Math.max(0, kingdom.happiness - (deficitPct * 30));
    
    // Krankheiten (wenn keine Hospitäler)
    if (kingdom.infrastructure.hospitals === 0 && Math.random() < deficitPct) {
      const diseaseSpread = Math.floor(populationLoss * 0.5);
      kingdom.population.peasants = Math.max(0, kingdom.population.peasants - diseaseSpread);
    }
  }

  /**
   * Wendet Bevölkerungsänderungen an
   */
  private applyPopulationChanges(kingdom: Kingdom, changes: PopulationChange): void {
    kingdom.population.nobles += changes.nobles;
    kingdom.population.merchants += changes.merchants;
    kingdom.population.peasants += changes.peasants;
    kingdom.population.soldiers += changes.soldiers;
    kingdom.population.clergy += changes.clergy;
    kingdom.population.artisans += changes.artisans;
    kingdom.population.scholars += changes.scholars;
  }

  /**
   * Generiert neue Handelsmöglichkeiten
   */
  private generateTradeOpportunities(_kingdom: Kingdom): void {
    // Alte Gelegenheiten entfernen (basierend auf maximaler Lebensdauer)
    const maxAge = 5;
    if (this.tradeOpportunities.length > maxAge) {
      this.tradeOpportunities.shift();
    }
    
    // Neue Gelegenheiten generieren (30% Chance pro Jahr)
    if (Math.random() < 0.3) {
      const resources: (keyof KingdomResources)[] = ['food', 'wood', 'stone', 'iron'];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      
      const opportunity: TradeOpportunity = {
        type: Math.random() > 0.5 ? 'import' : 'export',
        resource,
        amount: Math.floor(Math.random() * 1000) + 100,
        pricePerUnit: this.marketPrices[resource] * (0.8 + Math.random() * 0.4),
        expirationYear: Math.floor(Math.random() * 3) + 1
      };
      
      this.tradeOpportunities.push(opportunity);
    }
  }

  /**
   * Führt einen Handel durch
   */
  public executeTrade(kingdom: Kingdom, opportunityIndex: number): boolean {
    if (opportunityIndex < 0 || opportunityIndex >= this.tradeOpportunities.length) {
      return false;
    }
    
    const opportunity = this.tradeOpportunities[opportunityIndex];
    
    if (opportunity.type === 'import') {
      // Import: Gold gegen Ressource
      const totalCost = opportunity.amount * opportunity.pricePerUnit;
      
      if (kingdom.resources.gold >= totalCost) {
        kingdom.resources.gold -= totalCost;
        kingdom.resources[opportunity.resource] += opportunity.amount;
        this.tradeOpportunities.splice(opportunityIndex, 1);
        return true;
      }
    } else {
      // Export: Ressource gegen Gold
      if (kingdom.resources[opportunity.resource] >= opportunity.amount) {
        kingdom.resources[opportunity.resource] -= opportunity.amount;
        kingdom.resources.gold += opportunity.amount * opportunity.pricePerUnit;
        this.tradeOpportunities.splice(opportunityIndex, 1);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Gibt aktuelle Handelsmöglichkeiten zurück
   */
  public getTradeOpportunities(): TradeOpportunity[] {
    return [...this.tradeOpportunities];
  }

  /**
   * Gibt aktuelle Marktpreise zurück
   */
  public getMarketPrices(): Record<keyof KingdomResources, number> {
    return { ...this.marketPrices };
  }

  /**
   * Simuliert ein ganzes Wirtschaftsjahr
   */
  public async processYear(kingdom: Kingdom): Promise<EconomyUpdate> {
    const harvest = await this.calculateHarvest(kingdom);
    return this.updateEconomy(kingdom, harvest);
  }
}