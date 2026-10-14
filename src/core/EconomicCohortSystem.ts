/**
 * Economic Cohort System
 * 
 * Implements scalable economic simulation for large populations (up to 100M citizens).
 * Instead of tracking individual citizens economically, groups similar citizens into cohorts
 * for aggregated production, consumption, and trade calculations.
 * 
 * Scalability Strategy:
 * - Below 10K: Individual citizen economics (handled by other systems)
 * - 10K-100K: Small cohorts (~100 citizens per cohort)
 * - 100K-1M: Medium cohorts (~1,000 citizens per cohort)
 * - 1M-10M: Large cohorts (~10,000 citizens per cohort)
 * - 10M+: Massive cohorts (~100,000 citizens per cohort)
 */

import { ScalabilityConfig } from './ScalabilityConfig';

/**
 * Economic cohort representing a group of similar citizens
 */
export interface EconomicCohort {
  /** Unique identifier for the cohort */
  id: string;
  /** Region where cohort lives */
  regionId: string;
  /** Profession of citizens in this cohort */
  profession: string;
  /** Number of citizens in this cohort */
  size: number;
  /** Average wealth per citizen (gold) */
  averageWealth: number;
  /** Total production per tick */
  totalProduction: Map<string, number>; // resource -> amount
  /** Total consumption per tick */
  totalConsumption: Map<string, number>; // resource -> amount
  /** Average happiness (0-100) */
  averageHappiness: number;
  /** Average age */
  averageAge: number;
  /** Employment rate (0-1) */
  employmentRate: number;
}

/**
 * Regional economic summary for macro-level calculations
 */
export interface RegionalEconomy {
  /** Region identifier */
  regionId: string;
  /** Total population in region */
  population: number;
  /** Total GDP (gold per year) */
  gdp: number;
  /** Total production by resource */
  production: Map<string, number>;
  /** Total consumption by resource */
  consumption: Map<string, number>;
  /** Resource surplus/deficit */
  balance: Map<string, number>;
  /** Average wealth per capita */
  wealthPerCapita: number;
  /** Unemployment rate (0-1) */
  unemploymentRate: number;
  /** Cached until timestamp */
  cachedUntil: number;
}

/**
 * Trade route between regions
 */
export interface TradeRoute {
  /** Source region */
  fromRegionId: string;
  /** Destination region */
  toRegionId: string;
  /** Resources being traded */
  resources: Map<string, number>; // resource -> amount per tick
  /** Trade efficiency (0-1) */
  efficiency: number;
  /** Cost of trade per unit */
  costPerUnit: number;
}

/**
 * Economic Cohort System for scalable economy simulation
 */
export class EconomicCohortSystem {
  private cohorts: Map<string, EconomicCohort> = new Map();
  private regionalEconomies: Map<string, RegionalEconomy> = new Map();
  private tradeRoutes: TradeRoute[] = [];
  private scalabilityConfig: ScalabilityConfig;
  private lastCohortUpdate: number = 0;
  private cohortUpdateInterval: number = 1000; // Update cohorts every second

  constructor() {
    this.scalabilityConfig = ScalabilityConfig.getInstance();
  }

  /**
   * Update cohorts from individual citizens
   * Groups citizens into cohorts based on profession and region
   */
  public updateCohortsFromCitizens(citizens: any[], regions: string[]): void {
    const now = Date.now();
    
    // Don't update too frequently for performance
    if (now - this.lastCohortUpdate < this.cohortUpdateInterval) {
      return;
    }

    this.lastCohortUpdate = now;
    this.cohorts.clear();

    const cohortSize = this.scalabilityConfig.getEconomicCohortSize();

    // Group citizens by region and profession
    const groups: Map<string, any[]> = new Map();
    
    for (const citizen of citizens) {
      const key = `${citizen.regionId || 'default'}_${citizen.profession || 'unemployed'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(citizen);
    }

    // Create cohorts from groups
    for (const [key, group] of groups.entries()) {
      const [regionId, profession] = key.split('_');

      // For small groups, create single cohort
      if (group.length <= cohortSize * 1.5) {
        this.createCohort(regionId, profession, group);
      } else {
        // Split large groups into multiple cohorts
        for (let i = 0; i < group.length; i += cohortSize) {
          const chunk = group.slice(i, Math.min(i + cohortSize, group.length));
          this.createCohort(regionId, profession, chunk, i / cohortSize);
        }
      }
    }

    // Update regional economies
    this.updateRegionalEconomies(regions);
  }

  /**
   * Create a cohort from a group of citizens
   */
  private createCohort(
    regionId: string,
    profession: string,
    citizens: any[],
    index: number = 0
  ): void {
    const id = `cohort_${regionId}_${profession}_${index}`;

    const totalWealth = citizens.reduce((sum, c) => sum + (c.wealth || 0), 0);
    const totalHappiness = citizens.reduce((sum, c) => sum + (c.happiness || 50), 0);
    const totalAge = citizens.reduce((sum, c) => sum + (c.age || 25), 0);
    const employed = citizens.filter(c => c.employed !== false).length;

    const production = new Map<string, number>();
    const consumption = new Map<string, number>();

    // Aggregate production and consumption
    // This would be calculated based on profession and other factors
    // For now, placeholder logic
    const baseProduction = this.getBaseProduction(profession);
    const baseConsumption = this.getBaseConsumption();

    for (const [resource, amount] of baseProduction.entries()) {
      production.set(resource, amount * citizens.length);
    }

    for (const [resource, amount] of baseConsumption.entries()) {
      consumption.set(resource, amount * citizens.length);
    }

    const cohort: EconomicCohort = {
      id,
      regionId,
      profession,
      size: citizens.length,
      averageWealth: totalWealth / citizens.length,
      totalProduction: production,
      totalConsumption: consumption,
      averageHappiness: totalHappiness / citizens.length,
      averageAge: totalAge / citizens.length,
      employmentRate: employed / citizens.length
    };

    this.cohorts.set(id, cohort);
  }

  /**
   * Get base production for a profession
   * This is a simplified version - real implementation would be more complex
   */
  private getBaseProduction(profession: string): Map<string, number> {
    const production = new Map<string, number>();

    switch (profession) {
      case 'farmer':
        production.set('food', 10);
        break;
      case 'miner':
        production.set('ore', 5);
        production.set('stone', 5);
        break;
      case 'carpenter':
        production.set('wood', 8);
        break;
      case 'blacksmith':
        production.set('tools', 3);
        production.set('weapons', 2);
        break;
      case 'merchant':
        production.set('gold', 15);
        break;
      case 'scholar':
        production.set('research', 5);
        break;
      default:
        production.set('labor', 1);
    }

    return production;
  }

  /**
   * Get base consumption for all citizens
   */
  private getBaseConsumption(): Map<string, number> {
    const consumption = new Map<string, number>();
    consumption.set('food', 2);
    consumption.set('wood', 0.5);
    return consumption;
  }

  /**
   * Update regional economy summaries
   */
  private updateRegionalEconomies(regions: string[]): void {
    const cacheTimeout = this.scalabilityConfig.getEconomicCacheTimeout();

    for (const regionId of regions) {
      const cached = this.regionalEconomies.get(regionId);
      
      // Use cached value if still valid
      if (cached && Date.now() < cached.cachedUntil) {
        continue;
      }

      // Calculate regional economy from cohorts
      const regionalCohorts = Array.from(this.cohorts.values())
        .filter(c => c.regionId === regionId);

      if (regionalCohorts.length === 0) {
        continue;
      }

      const population = regionalCohorts.reduce((sum, c) => sum + c.size, 0);
      
      const production = new Map<string, number>();
      const consumption = new Map<string, number>();

      // Aggregate production and consumption
      for (const cohort of regionalCohorts) {
        for (const [resource, amount] of cohort.totalProduction.entries()) {
          production.set(resource, (production.get(resource) || 0) + amount);
        }
        for (const [resource, amount] of cohort.totalConsumption.entries()) {
          consumption.set(resource, (consumption.get(resource) || 0) + amount);
        }
      }

      // Calculate balance
      const balance = new Map<string, number>();
      const allResources = new Set([...production.keys(), ...consumption.keys()]);
      for (const resource of allResources) {
        const prod = production.get(resource) || 0;
        const cons = consumption.get(resource) || 0;
        balance.set(resource, prod - cons);
      }

      // Calculate GDP (simplified)
      const gdp = regionalCohorts.reduce((sum, c) => sum + c.averageWealth * c.size, 0);

      // Calculate unemployment
      const employed = regionalCohorts.reduce((sum, c) => sum + c.size * c.employmentRate, 0);
      const unemploymentRate = 1 - (employed / population);

      const regionalEconomy: RegionalEconomy = {
        regionId,
        population,
        gdp,
        production,
        consumption,
        balance,
        wealthPerCapita: gdp / population,
        unemploymentRate,
        cachedUntil: Date.now() + cacheTimeout
      };

      this.regionalEconomies.set(regionId, regionalEconomy);
    }
  }

  /**
   * Get regional economy (cached)
   */
  public getRegionalEconomy(regionId: string): RegionalEconomy | undefined {
    return this.regionalEconomies.get(regionId);
  }

  /**
   * Add trade route between regions
   */
  public addTradeRoute(route: TradeRoute): void {
    this.tradeRoutes.push(route);
  }

  /**
   * Process trade between regions
   * This is done at macro level for efficiency
   */
  public processTrade(): void {
    for (const route of this.tradeRoutes) {
      const fromRegion = this.regionalEconomies.get(route.fromRegionId);
      const toRegion = this.regionalEconomies.get(route.toRegionId);

      if (!fromRegion || !toRegion) continue;

      // Transfer resources based on trade route
      for (const [resource, amount] of route.resources.entries()) {
        const actualAmount = amount * route.efficiency;

        // Check if source has surplus
        const surplus = fromRegion.balance.get(resource) || 0;
        if (surplus > 0) {
          const tradeAmount = Math.min(actualAmount, surplus);

          // Update balances (would need to persist these changes)
          fromRegion.balance.set(resource, surplus - tradeAmount);
          const toBalance = toRegion.balance.get(resource) || 0;
          toRegion.balance.set(resource, toBalance + tradeAmount);
        }
      }
    }
  }

  /**
   * Get total GDP across all regions
   */
  public getTotalGDP(): number {
    let total = 0;
    for (const economy of this.regionalEconomies.values()) {
      total += economy.gdp;
    }
    return total;
  }

  /**
   * Get total population across all cohorts
   */
  public getTotalPopulation(): number {
    let total = 0;
    for (const cohort of this.cohorts.values()) {
      total += cohort.size;
    }
    return total;
  }

  /**
   * Get all cohorts
   */
  public getCohorts(): Map<string, EconomicCohort> {
    return this.cohorts;
  }

  /**
   * Get cohorts for a specific region
   */
  public getRegionalCohorts(regionId: string): EconomicCohort[] {
    return Array.from(this.cohorts.values())
      .filter(c => c.regionId === regionId);
  }

  /**
   * Get cohorts for a specific profession
   */
  public getProfessionCohorts(profession: string): EconomicCohort[] {
    return Array.from(this.cohorts.values())
      .filter(c => c.profession === profession);
  }

  /**
   * Serialize for save/load
   */
  public serialize(): any {
    return {
      cohorts: Array.from(this.cohorts.entries()),
      regionalEconomies: Array.from(this.regionalEconomies.entries()),
      tradeRoutes: this.tradeRoutes
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.cohorts) {
      this.cohorts = new Map(data.cohorts);
    }
    if (data.regionalEconomies) {
      this.regionalEconomies = new Map(data.regionalEconomies);
    }
    if (data.tradeRoutes) {
      this.tradeRoutes = data.tradeRoutes;
    }
  }
}
