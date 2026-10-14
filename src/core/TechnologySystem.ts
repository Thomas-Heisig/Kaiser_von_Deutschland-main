// src/core/TechnologySystem.ts
import technologiesData from '../data/json/technologies.json';

export interface TechnologyCost {
  research: number;
  gold: number;
}

export interface TechnologyEffects {
  foodProduction?: number;
  populationGrowth?: number;
  literacyRate?: number;
  culturalInfluence?: number;
  militaryStrength?: number;
  productionBonus?: number;
  buildingDurability?: number;
  defense?: number;
  authority?: number;
  stability?: number;
  taxEfficiency?: number;
  tradePower?: number;
  goldProduction?: number;
  qualityBonus?: number;
  researchSpeed?: number;
  siegePower?: number;
  economicGrowth?: number;
  industrialCapacity?: number;
  tradeDistance?: number;
  qualityOfLife?: number;
  communicationRange?: number;
  prestige?: number;
  powerProduction?: number;
  administrativeEfficiency?: number;
  environmentalBonus?: number;
  sustainability?: number;
  publicApproval?: number;
  automation?: number;
  cryptographyPower?: number;
  technologicalLead?: number;
  resourceAccess?: number;
  populationCapacity?: number;
  scientificBreakthrough?: number;
}

export interface TechnologyDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  era: string;
  cost: TechnologyCost;
  researchTime: number;
  prerequisites: string[];
  effects: TechnologyEffects;
  unlocksBuildings?: string[];
  year: number;
}

export interface TechnologyCategory {
  name: string;
  icon: string;
  color: string;
}

export class TechnologySystem {
  private static technologies: Map<string, TechnologyDefinition> = new Map();
  private static categories: Map<string, TechnologyCategory> = new Map();
  private static researchedTechs: Set<string> = new Set();
  private static currentResearch: { techId: string; progress: number } | null = null;
  
  static {
    // Initialize technologies from JSON data
    technologiesData.technologies.forEach((tech: any) => {
      this.technologies.set(tech.id, tech as TechnologyDefinition);
    });
    
    // Initialize categories
    Object.entries(technologiesData.techCategories).forEach(([id, data]: [string, any]) => {
      this.categories.set(id, data as TechnologyCategory);
    });
  }
  
  /**
   * Holt alle verfügbaren Technologien
   */
  public static getAllTechnologies(): TechnologyDefinition[] {
    return Array.from(this.technologies.values());
  }
  
  /**
   * Holt eine Technologie nach ID
   */
  public static getTechnology(techId: string): TechnologyDefinition | undefined {
    return this.technologies.get(techId);
  }
  
  /**
   * Holt alle Technologien einer Kategorie
   */
  public static getTechnologiesByCategory(category: string): TechnologyDefinition[] {
    return this.getAllTechnologies().filter(tech => tech.category === category);
  }
  
  /**
   * Holt alle Technologien einer Ära
   */
  public static getTechnologiesByEra(era: string): TechnologyDefinition[] {
    return this.getAllTechnologies().filter(tech => tech.era === era);
  }
  
  /**
   * Holt alle Kategorien
   */
  public static getCategories(): Map<string, TechnologyCategory> {
    return this.categories;
  }
  
  /**
   * Prüft ob eine Technologie erforscht werden kann
   */
  public static canResearch(
    tech: TechnologyDefinition,
    resources: any
  ): { canResearch: boolean; missingRequirements: string[] } {
    const missing: string[] = [];
    
    // Check if already researched
    if (this.researchedTechs.has(tech.id)) {
      missing.push('Bereits erforscht');
      return { canResearch: false, missingRequirements: missing };
    }
    
    // Check prerequisites
    for (const prereqId of tech.prerequisites) {
      if (!this.researchedTechs.has(prereqId)) {
        const prereq = this.technologies.get(prereqId);
        missing.push(`Benötigt: ${prereq?.name || prereqId}`);
      }
    }
    
    // Check resources
    if (resources.gold < tech.cost.gold) {
      missing.push(`Gold: ${resources.gold}/${tech.cost.gold}`);
    }
    
    const currentResearch = resources.research ?? 0;
    if (currentResearch < tech.cost.research) {
      missing.push(`Forschungspunkte: ${currentResearch}/${tech.cost.research}`);
    }
    
    return {
      canResearch: missing.length === 0,
      missingRequirements: missing
    };
  }
  
  /**
   * Startet die Erforschung einer Technologie
   */
  public static startResearch(techId: string, resources: any): boolean {
    const tech = this.technologies.get(techId);
    if (!tech) return false;
    
    const check = this.canResearch(tech, resources);
    if (!check.canResearch) return false;
    
    // Deduct costs
    resources.gold -= tech.cost.gold;
    if (resources.research !== undefined) {
      resources.research -= tech.cost.research;
    }
    
    this.currentResearch = {
      techId,
      progress: 0
    };
    
    return true;
  }
  
  /**
   * Aktualisiert den Forschungsfortschritt
   */
  public static updateResearch(daysElapsed: number, researchRate: number = 1.0): boolean {
    if (!this.currentResearch) return false;
    
    const tech = this.technologies.get(this.currentResearch.techId);
    if (!tech) return false;
    
    this.currentResearch.progress += daysElapsed * researchRate;
    
    if (this.currentResearch.progress >= tech.researchTime) {
      this.completeResearch(tech.id);
      return true;
    }
    
    return false;
  }
  
  /**
   * Schließt die Erforschung einer Technologie ab
   */
  private static completeResearch(techId: string): void {
    this.researchedTechs.add(techId);
    this.currentResearch = null;
  }
  
  /**
   * Holt den aktuellen Forschungsfortschritt
   */
  public static getCurrentResearch(): {
    tech: TechnologyDefinition | null;
    progress: number;
    timeRemaining: number;
  } | null {
    if (!this.currentResearch) return null;
    
    const tech = this.technologies.get(this.currentResearch.techId);
    if (!tech) return null;
    
    return {
      tech,
      progress: this.currentResearch.progress,
      timeRemaining: tech.researchTime - this.currentResearch.progress
    };
  }
  
  /**
   * Prüft ob eine Technologie erforscht wurde
   */
  public static isResearched(techId: string): boolean {
    return this.researchedTechs.has(techId);
  }
  
  /**
   * Holt alle erforschten Technologien
   */
  public static getResearchedTechnologies(): TechnologyDefinition[] {
    return Array.from(this.researchedTechs)
      .map(id => this.technologies.get(id))
      .filter(tech => tech !== undefined) as TechnologyDefinition[];
  }
  
  /**
   * Holt verfügbare Technologien (Voraussetzungen erfüllt, noch nicht erforscht)
   */
  public static getAvailableTechnologies(resources: any): TechnologyDefinition[] {
    return this.getAllTechnologies().filter(tech => {
      const check = this.canResearch(tech, resources);
      return check.canResearch;
    });
  }
  
  /**
   * Berechnet die Gesamteffekte aller erforschten Technologien
   */
  public static calculateTotalEffects(): TechnologyEffects {
    const totalEffects: TechnologyEffects = {};
    
    this.getResearchedTechnologies().forEach(tech => {
      Object.entries(tech.effects).forEach(([key, value]) => {
        const effectKey = key as keyof TechnologyEffects;
        totalEffects[effectKey] = (totalEffects[effectKey] || 0) + (value || 0);
      });
    });
    
    return totalEffects;
  }
  
  /**
   * Holt Technologien die durch diese Technologie freigeschaltet werden
   */
  public static getUnlockedBy(techId: string): TechnologyDefinition[] {
    return this.getAllTechnologies().filter(tech => 
      tech.prerequisites.includes(techId)
    );
  }
  
  /**
   * Erstellt einen Technologie-Baum (Graph-Struktur)
   */
  public static getTechnologyTree(): Map<string, {
    tech: TechnologyDefinition;
    prerequisites: TechnologyDefinition[];
    unlocks: TechnologyDefinition[];
    researched: boolean;
    available: boolean;
  }> {
    const tree = new Map();
    
    this.getAllTechnologies().forEach(tech => {
      const prerequisites = tech.prerequisites
        .map(id => this.technologies.get(id))
        .filter(t => t !== undefined) as TechnologyDefinition[];
      
      const unlocks = this.getUnlockedBy(tech.id);
      
      const researched = this.isResearched(tech.id);
      const available = prerequisites.every(p => this.isResearched(p.id)) && !researched;
      
      tree.set(tech.id, {
        tech,
        prerequisites,
        unlocks,
        researched,
        available
      });
    });
    
    return tree;
  }
  
  /**
   * Gibt empfohlene Technologien basierend auf Priorität zurück
   */
  public static getRecommendedTechnologies(
    resources: any,
    priority: 'economic' | 'military' | 'cultural' | 'technology' | 'all' = 'all'
  ): TechnologyDefinition[] {
    const available = this.getAvailableTechnologies(resources);
    
    if (priority === 'all') {
      return available.slice(0, 5);
    }
    
    return available
      .filter(tech => tech.category === priority)
      .slice(0, 5);
  }
  
  /**
   * Berechnet den technologischen Fortschritt in Prozent
   */
  public static getTechnologicalProgress(): number {
    const total = this.technologies.size;
    const researched = this.researchedTechs.size;
    return Math.floor((researched / total) * 100);
  }
  
  /**
   * Gibt Statistiken über Technologien zurück
   */
  public static getStatistics(): {
    totalTechnologies: number;
    researchedTechnologies: number;
    availableTechnologies: number;
    progress: number;
    categoryCounts: Record<string, { total: number; researched: number }>;
  } {
    const categoryCounts: Record<string, { total: number; researched: number }> = {};
    
    this.getAllTechnologies().forEach(tech => {
      if (!categoryCounts[tech.category]) {
        categoryCounts[tech.category] = { total: 0, researched: 0 };
      }
      categoryCounts[tech.category].total++;
      if (this.isResearched(tech.id)) {
        categoryCounts[tech.category].researched++;
      }
    });
    
    return {
      totalTechnologies: this.technologies.size,
      researchedTechnologies: this.researchedTechs.size,
      availableTechnologies: this.getAvailableTechnologies({ gold: Infinity, research: Infinity }).length,
      progress: this.getTechnologicalProgress(),
      categoryCounts
    };
  }
  
  /**
   * Setzt den Forschungsstand zurück (für neue Spiele)
   */
  public static reset(): void {
    this.researchedTechs.clear();
    this.currentResearch = null;
  }
  
  /**
   * Serialisiert den Forschungsstand für Speicherung
   */
  public static serialize(): {
    researched: string[];
    currentResearch: { techId: string; progress: number } | null;
  } {
    return {
      researched: Array.from(this.researchedTechs),
      currentResearch: this.currentResearch
    };
  }
  
  /**
   * Deserialisiert den Forschungsstand aus Speicherdaten
   */
  public static deserialize(data: {
    researched: string[];
    currentResearch: { techId: string; progress: number } | null;
  }): void {
    this.researchedTechs = new Set(data.researched);
    this.currentResearch = data.currentResearch;
  }
}
