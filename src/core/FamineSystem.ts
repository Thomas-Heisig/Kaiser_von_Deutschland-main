/**
 * Famine System
 * 
 * Manages food shortages, famines, and hunger events with regional differences.
 * Scalable design using regional aggregation instead of individual citizen tracking.
 */

export interface FamineEvent {
  id: string;
  regionId: string;
  severity: number; // 0-100, higher = worse
  startYear: number;
  startMonth: number;
  duration: number; // months
  cause: 'drought' | 'flood' | 'war' | 'disease' | 'economic' | 'blockade' | 'pestilence';
  affectedPopulation: number;
  deaths: number;
  emigrants: number;
  active: boolean;
}

export interface RegionalFoodStatus {
  regionId: string;
  foodProduction: number; // tons per month
  foodConsumption: number; // tons per month
  foodStorage: number; // tons in reserves
  foodBalance: number; // production - consumption
  monthsOfReserves: number;
  hungerLevel: number; // 0-100, 0 = plenty, 100 = severe famine
  priceIndex: number; // food price relative to normal (1.0 = normal)
}

export interface FamineStats {
  totalFamines: number;
  activeFamines: number;
  totalDeaths: number;
  totalEmigrants: number;
  severityByRegion: Map<string, number>;
  worstFamines: FamineEvent[];
}

export class FamineSystem {
  private regionalFoodStatus: Map<string, RegionalFoodStatus> = new Map();
  private activeFamines: Map<string, FamineEvent> = new Map();
  private famineHistory: FamineEvent[] = [];
  private maxHistorySize = 100;

  /** Base food consumption per citizen per month (kg) */
  private readonly BASE_FOOD_CONSUMPTION = 15;

  /** Storage capacity multiplier per region development level */
  private readonly STORAGE_CAPACITY_MULTIPLIER = 1000;

  constructor() {
    // Configuration loaded from ScalabilityConfig if needed
  }

  /**
   * Update regional food status
   */
  public updateRegionalFoodStatus(
    regionId: string,
    population: number,
    farmland: number,
    infrastructure: number,
    technology: number,
    climate: number, // 0-100, higher = better conditions
    trade: number // food imports/exports
  ): RegionalFoodStatus {
    // Calculate food production (scalable formula)
    const baseProduction = farmland * 10; // tons per unit of farmland
    const techBonus = 1 + (technology / 100);
    const climateBonus = 0.5 + (climate / 100);
    const foodProduction = baseProduction * techBonus * climateBonus + trade;

    // Calculate food consumption
    const foodConsumption = (population * this.BASE_FOOD_CONSUMPTION) / 1000; // kg to tons

    // Get or create status
    const currentStatus = this.regionalFoodStatus.get(regionId) || {
      regionId,
      foodProduction: 0,
      foodConsumption: 0,
      foodStorage: farmland * 50, // Initial reserves
      foodBalance: 0,
      monthsOfReserves: 0,
      hungerLevel: 0,
      priceIndex: 1.0
    };

    // Update values
    const foodBalance = foodProduction - foodConsumption;
    const newStorage = Math.max(0, currentStatus.foodStorage + foodBalance);
    const maxStorage = infrastructure * this.STORAGE_CAPACITY_MULTIPLIER;
    const actualStorage = Math.min(newStorage, maxStorage);

    const monthsOfReserves = foodConsumption > 0
      ? actualStorage / foodConsumption
      : 999;

    // Calculate hunger level based on reserves and balance
    let hungerLevel = 0;
    if (foodBalance < 0) {
      hungerLevel = Math.min(100, Math.abs(foodBalance / foodConsumption) * 50);
    }
    if (monthsOfReserves < 3) {
      hungerLevel = Math.max(hungerLevel, (3 - monthsOfReserves) / 3 * 100);
    }

    // Calculate price index (scarcity drives prices)
    const scarcity = Math.max(0, 1 - (monthsOfReserves / 6));
    const priceIndex = 1.0 + (scarcity * 3); // Up to 4x normal price

    const status: RegionalFoodStatus = {
      regionId,
      foodProduction,
      foodConsumption,
      foodStorage: actualStorage,
      foodBalance,
      monthsOfReserves,
      hungerLevel,
      priceIndex
    };

    this.regionalFoodStatus.set(regionId, status);

    // Check for famine conditions
    if (hungerLevel > 60 && !this.activeFamines.has(regionId)) {
      this.triggerFamine(regionId, population, hungerLevel, 'economic');
    }

    return status;
  }

  /**
   * Trigger a famine event
   */
  public triggerFamine(
    regionId: string,
    population: number,
    severity: number,
    cause: FamineEvent['cause']
  ): FamineEvent {
    const famine: FamineEvent = {
      id: `famine_${regionId}_${Date.now()}`,
      regionId,
      severity,
      startYear: new Date().getFullYear(),
      startMonth: new Date().getMonth() + 1,
      duration: Math.floor(severity / 10) + 3, // 3-13 months based on severity
      cause,
      affectedPopulation: Math.floor(population * (severity / 100)),
      deaths: 0,
      emigrants: 0,
      active: true
    };

    this.activeFamines.set(regionId, famine);
    return famine;
  }

  /**
   * Process famine effects for a month
   * Scalable: Uses aggregated calculations
   */
  public processFamineEffects(
    regionId: string,
    _population: number, // Prefix with _ to indicate intentionally unused
    currentYear: number,
    currentMonth: number
  ): {
    deaths: number;
    emigrants: number;
    healthImpact: number;
    moraleImpact: number;
  } {
    const famine = this.activeFamines.get(regionId);
    if (!famine) {
      return { deaths: 0, emigrants: 0, healthImpact: 0, moraleImpact: 0 };
    }

    // Calculate duration elapsed
    const monthsElapsed = (currentYear - famine.startYear) * 12 + (currentMonth - famine.startMonth);
    
    // Check if famine should end
    if (monthsElapsed >= famine.duration) {
      famine.active = false;
      this.activeFamines.delete(regionId);
      this.famineHistory.push(famine);
      if (this.famineHistory.length > this.maxHistorySize) {
        this.famineHistory.shift();
      }
      return { deaths: 0, emigrants: 0, healthImpact: 0, moraleImpact: 0 };
    }

    // Calculate effects based on severity (aggregated)
    const severityFactor = famine.severity / 100;
    const timeFactor = Math.min(1, monthsElapsed / 6); // Worsens over first 6 months

    // Death rate: 0-5% of affected population per month at peak
    const monthlyDeathRate = 0.05 * severityFactor * timeFactor;
    const deaths = Math.floor(famine.affectedPopulation * monthlyDeathRate);
    famine.deaths += deaths;

    // Emigration rate: 0-10% of affected population per month
    const monthlyEmigrationRate = 0.1 * severityFactor * (1 - timeFactor * 0.5);
    const emigrants = Math.floor(famine.affectedPopulation * monthlyEmigrationRate);
    famine.emigrants += emigrants;

    // Health impact on survivors (0-100)
    const healthImpact = 30 + (severityFactor * 50);

    // Morale impact (0-100)
    const moraleImpact = 40 + (severityFactor * 60);

    return {
      deaths,
      emigrants,
      healthImpact,
      moraleImpact
    };
  }

  /**
   * Implement relief measures
   */
  public implementRelief(
    regionId: string,
    foodAid: number, // tons
    funding: number, // gold
    organizationLevel: number // 0-100
  ): number {
    const famine = this.activeFamines.get(regionId);
    if (!famine) return 0;

    // Calculate relief effectiveness
    const aidEffectiveness = (foodAid / 100) * (organizationLevel / 100);
    const fundingEffectiveness = (funding / 10000) * (organizationLevel / 100);

    // Reduce severity
    const severityReduction = Math.min(
      famine.severity,
      (aidEffectiveness + fundingEffectiveness) * 20
    );

    famine.severity = Math.max(0, famine.severity - severityReduction);

    // Update regional food status
    const status = this.regionalFoodStatus.get(regionId);
    if (status) {
      status.foodStorage += foodAid;
      status.hungerLevel = Math.max(0, status.hungerLevel - severityReduction);
    }

    // End famine if severity drops below threshold
    if (famine.severity < 20) {
      famine.active = false;
      famine.duration = monthsElapsed(famine); // Record actual duration
      this.activeFamines.delete(regionId);
      this.famineHistory.push(famine);
    }

    return severityReduction;
  }

  /**
   * Check famine risk for a region
   */
  public assessFamineRisk(regionId: string): {
    risk: number; // 0-100
    factors: string[];
    timeToFamine: number; // months, 0 if imminent
  } {
    const status = this.regionalFoodStatus.get(regionId);
    if (!status) {
      return { risk: 0, factors: [], timeToFamine: 999 };
    }

    const factors: string[] = [];
    let risk = 0;

    // Low reserves
    if (status.monthsOfReserves < 6) {
      risk += 30;
      factors.push('Low food reserves');
    }

    // Negative balance
    if (status.foodBalance < 0) {
      risk += 40;
      factors.push('Food consumption exceeds production');
    }

    // Existing hunger
    if (status.hungerLevel > 40) {
      risk += 30;
      factors.push('Existing hunger conditions');
    }

    const timeToFamine = status.foodBalance < 0 && status.monthsOfReserves > 0
      ? status.monthsOfReserves
      : 999;

    return {
      risk: Math.min(100, risk),
      factors,
      timeToFamine
    };
  }

  /**
   * Get famine statistics
   */
  public getFamineStats(): FamineStats {
    const severityByRegion = new Map<string, number>();
    
    for (const famine of this.activeFamines.values()) {
      severityByRegion.set(famine.regionId, famine.severity);
    }

    const allFamines = [...this.famineHistory, ...Array.from(this.activeFamines.values())];
    const worstFamines = allFamines
      .sort((a, b) => b.deaths - a.deaths)
      .slice(0, 10);

    return {
      totalFamines: this.famineHistory.length + this.activeFamines.size,
      activeFamines: this.activeFamines.size,
      totalDeaths: allFamines.reduce((sum, f) => sum + f.deaths, 0),
      totalEmigrants: allFamines.reduce((sum, f) => sum + f.emigrants, 0),
      severityByRegion,
      worstFamines
    };
  }

  /**
   * Get active famines
   */
  public getActiveFamines(): FamineEvent[] {
    return Array.from(this.activeFamines.values());
  }

  /**
   * Get regional food status
   */
  public getRegionalStatus(regionId: string): RegionalFoodStatus | undefined {
    return this.regionalFoodStatus.get(regionId);
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      activeFamines: Array.from(this.activeFamines.values()),
      famineHistory: this.famineHistory,
      regionalFoodStatus: Array.from(this.regionalFoodStatus.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.activeFamines) {
      this.activeFamines = new Map(
        data.activeFamines.map((f: FamineEvent) => [f.regionId, f])
      );
    }
    if (data.famineHistory) {
      this.famineHistory = data.famineHistory;
    }
    if (data.regionalFoodStatus) {
      this.regionalFoodStatus = new Map(data.regionalFoodStatus);
    }
  }
}

/**
 * Calculate months elapsed since famine start
 */
function monthsElapsed(famine: FamineEvent): number {
  const now = new Date();
  return (now.getFullYear() - famine.startYear) * 12 + (now.getMonth() + 1 - famine.startMonth);
}
