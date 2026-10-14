// src/core/LegalSystem.ts

export interface LegalSystemType {
  id: string;
  name: string;
  era: 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'contemporary';
  period: {
    start: number;
    end: number | null;
  };
  description: string;
  characteristics: string[];
  justice: number;
  efficiency: number;
  fairness: number;
  stability: number;
  requiredTechnology: string | null;
  effects: {
    crime_rate?: number;
    social_order?: number;
    population_happiness?: number;
    trade?: number;
    religious_authority?: number;
    political_stability?: number;
    worker_satisfaction?: number;
    international_reputation?: number;
    productivity?: number;
    modernization?: number;
    international_cooperation?: number;
    [key: string]: number | undefined;
  };
}

export interface TaxSystemType {
  id: string;
  name: string;
  era: 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'contemporary';
  period: {
    start: number;
    end: number | null;
  };
  description: string;
  taxRate: number;
  collectionEfficiency: number;
  populationAcceptance: number;
  administrativeCost: number;
  taxBase: string[];
  progressive?: boolean;
  effects: {
    revenue: number;
    population_happiness: number;
    trade?: number;
    social_equality?: number;
    business_investment?: number;
    consumption?: number;
    national_unity?: number;
    environmental_quality?: number;
    green_technology?: number;
    capital_flight?: number;
    productivity?: number;
    domestic_industry?: number;
    [key: string]: number | undefined;
  };
}

export class LegalSystem {
  private legalSystems: Map<string, LegalSystemType> = new Map();
  private taxSystems: Map<string, TaxSystemType> = new Map();
  private currentLegalSystem: string | null = null;
  private activeTaxSystems: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      const [legalResponse, taxResponse] = await Promise.all([
        fetch('/src/data/json/legal-systems.json'),
        fetch('/src/data/json/tax-systems.json')
      ]);

      const legalData = await legalResponse.json();
      const taxData = await taxResponse.json();

      legalData.legalSystems.forEach((system: LegalSystemType) => {
        this.legalSystems.set(system.id, system);
      });

      taxData.taxSystems.forEach((system: TaxSystemType) => {
        this.taxSystems.set(system.id, system);
      });
    } catch (error) {
      console.error('Failed to load legal systems:', error);
    }
  }

  getLegalSystem(id: string): LegalSystemType | undefined {
    return this.legalSystems.get(id);
  }

  getAvailableLegalSystems(year: number, technologies: string[]): LegalSystemType[] {
    return Array.from(this.legalSystems.values()).filter(system => {
      // Check year availability
      if (system.period.start > year) return false;
      if (system.period.end && system.period.end < year) return false;

      // Check technology requirement
      if (system.requiredTechnology && !technologies.includes(system.requiredTechnology)) {
        return false;
      }

      return true;
    });
  }

  setLegalSystem(systemId: string): boolean {
    if (this.legalSystems.has(systemId)) {
      this.currentLegalSystem = systemId;
      return true;
    }
    return false;
  }

  getCurrentLegalSystem(): LegalSystemType | null {
    return this.currentLegalSystem
      ? this.legalSystems.get(this.currentLegalSystem) ?? null
      : null;
  }

  getTaxSystem(id: string): TaxSystemType | undefined {
    return this.taxSystems.get(id);
  }

  getAvailableTaxSystems(year: number): TaxSystemType[] {
    return Array.from(this.taxSystems.values()).filter(system => {
      // Check year availability
      if (system.period.start > year) return false;
      if (system.period.end && system.period.end < year) return false;

      return true;
    });
  }

  activateTaxSystem(systemId: string): boolean {
    if (this.taxSystems.has(systemId)) {
      this.activeTaxSystems.add(systemId);
      return true;
    }
    return false;
  }

  deactivateTaxSystem(systemId: string): void {
    this.activeTaxSystems.delete(systemId);
  }

  getActiveTaxSystems(): TaxSystemType[] {
    return Array.from(this.activeTaxSystems)
      .map(id => this.taxSystems.get(id))
      .filter((s): s is TaxSystemType => s !== undefined);
  }

  calculateTotalRevenue(baseIncome: number): number {
    const systems = this.getActiveTaxSystems();
    return systems.reduce((total, system) => {
      const grossRevenue = baseIncome * system.taxRate * system.collectionEfficiency;
      const netRevenue = grossRevenue * (1 - system.administrativeCost);
      return total + netRevenue;
    }, 0);
  }

  calculateHappinessImpact(): number {
    const legal = this.getCurrentLegalSystem();
    const taxes = this.getActiveTaxSystems();

    const legalImpact = legal?.effects.population_happiness ?? 0;
    const taxImpact = taxes.reduce(
      (total, system) => total + system.effects.population_happiness,
      0
    );

    return legalImpact + taxImpact;
  }

  calculateSocialOrder(): number {
    const legal = this.getCurrentLegalSystem();
    return legal?.effects.social_order ?? 0.5;
  }

  calculateCrimeRate(): number {
    const legal = this.getCurrentLegalSystem();
    return legal?.effects.crime_rate ?? 0.15;
  }
}
