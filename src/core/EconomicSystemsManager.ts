/**
 * Economic Systems - Inflation, Deflation, and Monetary Policy
 * Implements dynamic currency valuation and price stability mechanics
 */

export interface InflationSystem {
  id: string;
  name: string;
  era: string;
  yearStart: number;
  yearEnd: number;
  baseInflationRate: number;
  volatility: number;
  description: string;
  causes: string[];
  effects: {
    economicGrowth: number;
    tradeVolume: number;
    civilUnrest: number;
  };
}

export interface DeflationEvent {
  id: string;
  name: string;
  year: number;
  duration: number;
  severity: number;
  description: string;
  causes: string[];
  effects: {
    priceLevel?: number;
    wageLevel?: number;
    economicActivity?: number;
    unemployment?: number;
  };
}

export interface MonetaryPolicy {
  id: string;
  name: string;
  description: string;
  inflationEffect: number;
  growthEffect: number;
  popularityEffect: number;
  yearAvailable?: number;
}

export class EconomicSystemsManager {
  private inflationSystems: InflationSystem[] = [];
  private deflationEvents: DeflationEvent[] = [];
  private monetaryPolicies: MonetaryPolicy[] = [];
  
  private currentInflationRate: number = 0.02; // 2% baseline
  private priceLevel: number = 1.0;
  private activePolicies: Set<string> = new Set();

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/economic-systems.json');
      const data = await response.json();
      
      this.inflationSystems = data.inflationSystems || [];
      this.deflationEvents = data.deflationEvents || [];
      this.monetaryPolicies = data.monetaryPolicies || [];
    } catch (error) {
      console.error('Failed to load economic systems data:', error);
    }
  }

  /**
   * Get current inflation system based on year
   */
  public getCurrentInflationSystem(year: number): InflationSystem | null {
    return this.inflationSystems.find(
      sys => year >= sys.yearStart && year <= sys.yearEnd
    ) || null;
  }

  /**
   * Calculate inflation rate for current period
   */
  public calculateInflation(year: number, economicFactors: {
    warStatus?: boolean;
    tradeVolume?: number;
    resourceShortages?: number;
  }): number {
    const system = this.getCurrentInflationSystem(year);
    if (!system) return this.currentInflationRate;

    let inflation = system.baseInflationRate;
    
    // Add volatility
    const randomFactor = (Math.random() - 0.5) * 2 * system.volatility;
    inflation += randomFactor;
    
    // Modify based on economic factors
    if (economicFactors.warStatus) {
      inflation += 0.05; // War increases inflation
    }
    
    if (economicFactors.resourceShortages) {
      inflation += economicFactors.resourceShortages * 0.02;
    }
    
    if (economicFactors.tradeVolume) {
      inflation += economicFactors.tradeVolume * 0.01;
    }

    this.currentInflationRate = Math.max(-0.1, Math.min(1.0, inflation));
    return this.currentInflationRate;
  }

  /**
   * Update price level based on inflation
   */
  public updatePriceLevel(inflationRate: number): void {
    this.priceLevel *= (1 + inflationRate);
  }

  /**
   * Apply monetary policy
   */
  public applyMonetaryPolicy(policyId: string): {
    success: boolean;
    effects: Partial<MonetaryPolicy>;
  } {
    const policy = this.monetaryPolicies.find(p => p.id === policyId);
    if (!policy) {
      return { success: false, effects: {} };
    }

    this.activePolicies.add(policyId);
    
    return {
      success: true,
      effects: {
        inflationEffect: policy.inflationEffect,
        growthEffect: policy.growthEffect,
        popularityEffect: policy.popularityEffect
      }
    };
  }

  /**
   * Check for deflation events
   */
  public checkDeflationEvents(year: number): DeflationEvent | null {
    return this.deflationEvents.find(event => 
      year >= event.year && year < event.year + event.duration
    ) || null;
  }

  /**
   * Get current price level
   */
  public getPriceLevel(): number {
    return this.priceLevel;
  }

  /**
   * Get current inflation rate
   */
  public getInflationRate(): number {
    return this.currentInflationRate;
  }

  /**
   * Get available monetary policies for year
   */
  public getAvailablePolicies(year: number): MonetaryPolicy[] {
    return this.monetaryPolicies.filter(policy => 
      !policy.yearAvailable || year >= policy.yearAvailable
    );
  }
}
