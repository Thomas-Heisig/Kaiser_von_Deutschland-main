// src/core/ArtSystem.ts

export interface ArtStyle {
  id: string;
  name: string;
  period: {
    start: number;
    end: number | null;
  };
  characteristics: string[];
  famousWorks: string[];
  culturalImpact: number;
  prestige: number;
  cost: number;
  requiredTechnology: string | null;
}

export interface CulturalEvent {
  id: string;
  name: string;
  category: 'festival' | 'seasonal' | 'cultural' | 'religious' | 'political' | 'trade' | 'national';
  period: {
    start: number;
    end: number | null;
  };
  frequency: 'annual' | 'every_5_years' | 'irregular';
  month: number | null;
  duration: number;
  region: string;
  description: string;
  effects: {
    population_happiness?: number;
    tourism?: number;
    economy?: number;
    cultural_prestige?: number;
    social_cohesion?: number;
    tradition?: number;
    religious_unity?: number;
    cultural_identity?: number;
    political_prestige?: number;
    national_unity?: number;
    trade?: number;
    diplomatic_relations?: number;
    economic_cooperation?: number;
    international_reputation?: number;
    art_development?: number;
    [key: string]: number | undefined;
  };
  cost: number;
  requiredPopulation: number;
  requiredTechnology: string | null;
}

export class ArtSystem {
  private artStyles: Map<string, ArtStyle> = new Map();
  private culturalEvents: Map<string, CulturalEvent> = new Map();
  private activeStyles: Set<string> = new Set();
  private activeEvents: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      const [stylesResponse, eventsResponse] = await Promise.all([
        fetch('/src/data/json/art-styles.json'),
        fetch('/src/data/json/cultural-events.json')
      ]);

      const stylesData = await stylesResponse.json();
      const eventsData = await eventsResponse.json();

      stylesData.artStyles.forEach((style: ArtStyle) => {
        this.artStyles.set(style.id, style);
      });

      eventsData.culturalEvents.forEach((event: CulturalEvent) => {
        this.culturalEvents.set(event.id, event);
      });
    } catch (error) {
      console.error('Failed to load art data:', error);
    }
  }

  getArtStyle(id: string): ArtStyle | undefined {
    return this.artStyles.get(id);
  }

  getAvailableStyles(year: number, technologies: string[]): ArtStyle[] {
    return Array.from(this.artStyles.values()).filter(style => {
      // Check year availability
      if (style.period.start > year) return false;
      if (style.period.end && style.period.end < year) return false;

      // Check technology requirement
      if (style.requiredTechnology && !technologies.includes(style.requiredTechnology)) {
        return false;
      }

      return true;
    });
  }

  activateStyle(styleId: string): boolean {
    if (this.artStyles.has(styleId)) {
      this.activeStyles.add(styleId);
      return true;
    }
    return false;
  }

  getCulturalEvent(id: string): CulturalEvent | undefined {
    return this.culturalEvents.get(id);
  }

  getAvailableEvents(
    year: number,
    population: number,
    technologies: string[]
  ): CulturalEvent[] {
    return Array.from(this.culturalEvents.values()).filter(event => {
      // Check year availability
      if (event.period.start > year) return false;
      if (event.period.end && event.period.end < year) return false;

      // Check population requirement
      if (event.requiredPopulation > population) return false;

      // Check technology requirement
      if (event.requiredTechnology && !technologies.includes(event.requiredTechnology)) {
        return false;
      }

      return true;
    });
  }

  getEventsForMonth(month: number, year: number): CulturalEvent[] {
    return Array.from(this.culturalEvents.values()).filter(event => {
      if (event.month !== month) return false;
      if (event.period.start > year) return false;
      if (event.period.end && event.period.end < year) return false;
      return true;
    });
  }

  activateEvent(eventId: string): boolean {
    if (this.culturalEvents.has(eventId)) {
      this.activeEvents.add(eventId);
      return true;
    }
    return false;
  }

  getActiveEvents(): CulturalEvent[] {
    return Array.from(this.activeEvents)
      .map(id => this.culturalEvents.get(id))
      .filter((e): e is CulturalEvent => e !== undefined);
  }

  calculateCulturalPrestige(): number {
    const activeStyles = Array.from(this.activeStyles)
      .map(id => this.artStyles.get(id))
      .filter((s): s is ArtStyle => s !== undefined);

    const activeEvents = this.getActiveEvents();

    const stylePrestige = activeStyles.reduce((total, style) => total + style.prestige, 0);
    const eventPrestige = activeEvents.reduce(
      (total, event) => total + (event.effects.cultural_prestige ?? 0) * 100,
      0
    );

    return stylePrestige + eventPrestige;
  }

  calculateHappinessBonus(): number {
    const events = this.getActiveEvents();
    return events.reduce((total, event) => total + (event.effects.population_happiness ?? 0), 0);
  }
}
