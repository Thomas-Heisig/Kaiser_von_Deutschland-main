// src/core/ScientificDiscoverySystem.ts

export interface ScientificDiscovery {
  id: string;
  name: string;
  year: number;
  discoverer: string;
  field: 'technology' | 'astronomy' | 'physics' | 'engineering' | 'medicine' | 'biology';
  impact: number;
  description: string;
  effects: {
    science?: number;
    prestige?: number;
    literacy?: number;
    knowledge_spread?: number;
    cultural_influence?: number;
    religious_tension?: number;
    industry?: number;
    economy?: number;
    engineering?: number;
    health?: number;
    population_growth?: number;
    medicine?: number;
    technology?: number;
    communication?: number;
    [key: string]: number | undefined;
  };
  prerequisite: string | null;
  enablesTechnology: string[];
}

export class ScientificDiscoverySystem {
  private discoveries: Map<string, ScientificDiscovery> = new Map();
  private madeDiscoveries: Set<string> = new Set();
  private enabledTechnologies: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/scientific-discoveries.json');
      const data = await response.json();
      
      data.discoveries.forEach((discovery: ScientificDiscovery) => {
        this.discoveries.set(discovery.id, discovery);
      });
    } catch (error) {
      console.error('Failed to load scientific discoveries:', error);
    }
  }

  getDiscovery(id: string): ScientificDiscovery | undefined {
    return this.discoveries.get(id);
  }

  getAllDiscoveries(): ScientificDiscovery[] {
    return Array.from(this.discoveries.values());
  }

  getAvailableDiscoveries(year: number): ScientificDiscovery[] {
    return Array.from(this.discoveries.values()).filter(discovery => {
      // Discovery year must be reached
      if (discovery.year > year) return false;

      // Already discovered
      if (this.madeDiscoveries.has(discovery.id)) return false;

      // Check prerequisites
      if (discovery.prerequisite && !this.madeDiscoveries.has(discovery.prerequisite)) {
        return false;
      }

      return true;
    });
  }

  makeDiscovery(discoveryId: string): boolean {
    const discovery = this.discoveries.get(discoveryId);
    if (!discovery) return false;

    // Check prerequisite
    if (discovery.prerequisite && !this.madeDiscoveries.has(discovery.prerequisite)) {
      return false;
    }

    this.madeDiscoveries.add(discoveryId);
    
    // Enable new technologies
    discovery.enablesTechnology.forEach(tech => {
      this.enabledTechnologies.add(tech);
    });

    return true;
  }

  getMadeDiscoveries(): ScientificDiscovery[] {
    return Array.from(this.madeDiscoveries)
      .map(id => this.discoveries.get(id))
      .filter((d): d is ScientificDiscovery => d !== undefined);
  }

  getEnabledTechnologies(): string[] {
    return Array.from(this.enabledTechnologies);
  }

  hasTechnology(technology: string): boolean {
    return this.enabledTechnologies.has(technology);
  }

  getDiscoveriesByField(field: ScientificDiscovery['field']): ScientificDiscovery[] {
    return Array.from(this.discoveries.values()).filter(d => d.field === field);
  }

  calculateScienceBonus(): number {
    const discoveries = this.getMadeDiscoveries();
    return discoveries.reduce((total, discovery) => {
      return total + (discovery.effects.science ?? 0);
    }, 0);
  }

  calculatePrestigeBonus(): number {
    const discoveries = this.getMadeDiscoveries();
    return discoveries.reduce((total, discovery) => {
      return total + (discovery.effects.prestige ?? 0);
    }, 0);
  }

  getDiscoveryChain(discoveryId: string): ScientificDiscovery[] {
    const chain: ScientificDiscovery[] = [];
    let current = this.discoveries.get(discoveryId);

    while (current) {
      chain.unshift(current);
      if (!current.prerequisite) break;
      current = this.discoveries.get(current.prerequisite);
    }

    return chain;
  }
}
