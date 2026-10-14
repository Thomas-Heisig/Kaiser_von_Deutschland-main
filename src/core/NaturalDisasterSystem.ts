// src/core/NaturalDisasterSystem.ts

export interface NaturalDisaster {
  id: string;
  name: string;
  category: 'seismic' | 'hydrological' | 'meteorological' | 'fire' | 'biological' | 'snow';
  frequency: 'very_common' | 'common' | 'uncommon' | 'rare';
  probability: number;
  severity: {
    min: number;
    max: number;
  };
  effects: {
    buildingDamage: number;
    populationLoss: number;
    economicImpact: number;
    farmlandDestruction?: number;
    forestDestruction?: number;
    famine?: number;
  };
  duration: number;
  recoveryTime: number;
  warningPossible: boolean;
  preventionMeasures: string[];
  affectedRegions: string[];
  seasonality?: string[];
  historicalExamples: Array<{
    year: number;
    location: string;
    severity?: number;
    magnitude?: number;
    deaths: number;
  }>;
}

export interface DisasterEvent {
  disasterId: string;
  year: number;
  severity: number;
  region: string;
  damage: {
    buildings: number;
    population: number;
    economy: number;
    farmland?: number;
  };
  warned: boolean;
  prevented: boolean;
}

export class NaturalDisasterSystem {
  private disasters: Map<string, NaturalDisaster> = new Map();
  private disasterHistory: DisasterEvent[] = [];
  private preventionTechnologies: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/natural-disasters.json');
      const data = await response.json();
      
      data.disasters.forEach((disaster: NaturalDisaster) => {
        this.disasters.set(disaster.id, disaster);
      });
    } catch (error) {
      console.error('Failed to load natural disasters:', error);
    }
  }

  getDisaster(id: string): NaturalDisaster | undefined {
    return this.disasters.get(id);
  }

  getAllDisasters(): NaturalDisaster[] {
    return Array.from(this.disasters.values());
  }

  checkForDisasters(year: number, month: number, regions: string[]): DisasterEvent[] {
    const events: DisasterEvent[] = [];
    const season = this.getSeason(month);

    for (const disaster of this.disasters.values()) {
      // Check if disaster can occur
      if (Math.random() < disaster.probability) {
        // Check seasonality
        if (disaster.seasonality && !disaster.seasonality.includes(season)) {
          continue;
        }

        // Pick affected region
        const possibleRegions = regions.filter(r =>
          disaster.affectedRegions.includes('all') ||
          disaster.affectedRegions.some(ar => r.toLowerCase().includes(ar))
        );

        if (possibleRegions.length === 0) continue;

        const region = possibleRegions[Math.floor(Math.random() * possibleRegions.length)];
        const severity = Math.floor(
          Math.random() * (disaster.severity.max - disaster.severity.min + 1) +
          disaster.severity.min
        );

        // Check for prevention
        const prevented = disaster.preventionMeasures.some(measure =>
          this.preventionTechnologies.has(measure)
        );

        const event: DisasterEvent = {
          disasterId: disaster.id,
          year,
          severity,
          region,
          damage: {
            buildings: Math.floor(disaster.effects.buildingDamage * severity * 100),
            population: Math.floor(disaster.effects.populationLoss * severity * 100),
            economy: Math.floor(Math.abs(disaster.effects.economicImpact) * severity * 1000),
            farmland: disaster.effects.farmlandDestruction
              ? Math.floor(disaster.effects.farmlandDestruction * severity * 100)
              : undefined
          },
          warned: disaster.warningPossible,
          prevented
        };

        if (!prevented) {
          events.push(event);
          this.disasterHistory.push(event);
        }
      }
    }

    return events;
  }

  addPreventionTechnology(technology: string): void {
    this.preventionTechnologies.add(technology);
  }

  hasPreventionTechnology(technology: string): boolean {
    return this.preventionTechnologies.has(technology);
  }

  getDisasterHistory(): DisasterEvent[] {
    return this.disasterHistory;
  }

  getDisastersByRegion(region: string): DisasterEvent[] {
    return this.disasterHistory.filter(e => e.region === region);
  }

  private getSeason(month: number): string {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }
}
