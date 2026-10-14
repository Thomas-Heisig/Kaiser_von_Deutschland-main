// src/core/AnimalPopulationSystem.ts

/**
 * Tierarten-Kategorien
 */
export type AnimalCategory = 
  | 'wildlife' // Wildtiere
  | 'livestock' // Nutztiere
  | 'fish' // Fische
  | 'birds' // Vögel
  | 'insects'; // Insekten

/**
 * Migrations-Muster
 */
export type MigrationPattern = 
  | 'seasonal' // Saisonale Migration
  | 'nomadic' // Nomadisch
  | 'stationary' // Standorttreu
  | 'dispersive'; // Verstreut

/**
 * Gefährdungsstatus
 */
export type ConservationStatus =
  | 'abundant' // Reichlich vorhanden
  | 'common' // Häufig
  | 'uncommon' // Selten
  | 'threatened' // Bedroht
  | 'endangered' // Gefährdet
  | 'critically_endangered' // Stark gefährdet
  | 'extinct'; // Ausgestorben

/**
 * Tier-Spezies
 */
export interface AnimalSpecies {
  id: string;
  name: string;
  germanName: string;
  category: AnimalCategory;
  population: number;
  maxPopulation: number; // Tragfähigkeit
  growthRate: number; // Natürliche Wachstumsrate pro Jahr
  migrationPattern: MigrationPattern;
  conservationStatus: ConservationStatus;
  habitatType: string[]; // z.B. ['forest', 'plains']
  dietType: 'herbivore' | 'carnivore' | 'omnivore';
  huntable: boolean;
  domesticated: boolean;
  economicValue: number; // Wert pro Tier
  extinctionYear?: number;
}

/**
 * Migrationsbewegung
 */
export interface Migration {
  id: string;
  speciesId: string;
  year: number;
  month: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  populationSize: number;
  reason: 'seasonal' | 'food_scarcity' | 'climate' | 'habitat_loss';
  completed: boolean;
}

/**
 * Jagd-Event
 */
export interface HuntingEvent {
  id: string;
  speciesId: string;
  year: number;
  month: number;
  huntedAmount: number;
  location: { x: number; y: number };
  hunterId?: string; // Optional: Player/Citizen ID
  legalHunt: boolean;
  yield: {
    meat: number;
    fur: number;
    other: number;
  };
}

/**
 * Viehzucht-Betrieb
 */
export interface LivestockFarm {
  id: string;
  speciesId: string;
  location: { x: number; y: number };
  animalCount: number;
  capacity: number;
  efficiency: number; // 0-100
  healthStatus: number; // 0-100
  lastHarvestYear: number;
  production: {
    meat: number;
    milk?: number;
    eggs?: number;
    wool?: number;
    leather?: number;
  };
}

/**
 * Fischbestand in Gewässer
 */
export interface FishStock {
  speciesId: string;
  waterbodyId: string; // River or lake ID
  population: number;
  maxPopulation: number;
  reproductionRate: number;
  overfished: boolean;
  lastFishingYear: number;
  pollutionImpact: number; // 0-100
}

/**
 * Artenschutz-Programm
 */
export interface ConservationProgram {
  id: string;
  speciesId: string;
  startYear: number;
  budget: number;
  protectedArea: number; // in hectares
  effectiveness: number; // 0-100
  populationTarget: number;
  active: boolean;
}

/**
 * Aussterbe-Event
 */
export interface ExtinctionEvent {
  speciesId: string;
  year: number;
  cause: 'overhunting' | 'habitat_loss' | 'pollution' | 'disease' | 'climate_change';
  lastPopulation: number;
  economicImpact: number;
  ecologicalImpact: number;
}

/**
 * Tierpopulations-System
 * Verwaltet Wildtiere, Viehzucht, Fischbestände, Jagd und Artenschutz
 */
export class AnimalPopulationSystem {
  private species: Map<string, AnimalSpecies> = new Map();
  private migrations: Migration[] = [];
  private huntingEvents: HuntingEvent[] = [];
  private livestockFarms: Map<string, LivestockFarm> = new Map();
  private fishStocks: Map<string, FishStock> = new Map();
  private conservationPrograms: Map<string, ConservationProgram> = new Map();
  private extinctionEvents: ExtinctionEvent[] = [];

  constructor() {
    this.initializeSpecies();
  }

  /**
   * Initialisiert Tier-Spezies
   */
  private initializeSpecies(): void {
    // Wildtiere
    this.addSpecies({
      id: 'deer',
      name: 'Red Deer',
      germanName: 'Rothirsch',
      category: 'wildlife',
      population: 50000,
      maxPopulation: 100000,
      growthRate: 0.15,
      migrationPattern: 'seasonal',
      conservationStatus: 'common',
      habitatType: ['forest', 'plains'],
      dietType: 'herbivore',
      huntable: true,
      domesticated: false,
      economicValue: 150
    });

    this.addSpecies({
      id: 'wild_boar',
      name: 'Wild Boar',
      germanName: 'Wildschwein',
      category: 'wildlife',
      population: 30000,
      maxPopulation: 80000,
      growthRate: 0.2,
      migrationPattern: 'nomadic',
      conservationStatus: 'common',
      habitatType: ['forest'],
      dietType: 'omnivore',
      huntable: true,
      domesticated: false,
      economicValue: 120
    });

    this.addSpecies({
      id: 'wolf',
      name: 'Gray Wolf',
      germanName: 'Wolf',
      category: 'wildlife',
      population: 5000,
      maxPopulation: 15000,
      growthRate: 0.1,
      migrationPattern: 'nomadic',
      conservationStatus: 'threatened',
      habitatType: ['forest', 'mountains'],
      dietType: 'carnivore',
      huntable: true,
      domesticated: false,
      economicValue: 200
    });

    this.addSpecies({
      id: 'bear',
      name: 'Brown Bear',
      germanName: 'Braunbär',
      category: 'wildlife',
      population: 2000,
      maxPopulation: 8000,
      growthRate: 0.05,
      migrationPattern: 'stationary',
      conservationStatus: 'endangered',
      habitatType: ['forest', 'mountains'],
      dietType: 'omnivore',
      huntable: true,
      domesticated: false,
      economicValue: 300
    });

    // Nutztiere
    this.addSpecies({
      id: 'cattle',
      name: 'Cattle',
      germanName: 'Rind',
      category: 'livestock',
      population: 100000,
      maxPopulation: 500000,
      growthRate: 0.1,
      migrationPattern: 'stationary',
      conservationStatus: 'abundant',
      habitatType: ['plains'],
      dietType: 'herbivore',
      huntable: false,
      domesticated: true,
      economicValue: 200
    });

    this.addSpecies({
      id: 'sheep',
      name: 'Sheep',
      germanName: 'Schaf',
      category: 'livestock',
      population: 150000,
      maxPopulation: 600000,
      growthRate: 0.15,
      migrationPattern: 'stationary',
      conservationStatus: 'abundant',
      habitatType: ['plains', 'hills'],
      dietType: 'herbivore',
      huntable: false,
      domesticated: true,
      economicValue: 80
    });

    this.addSpecies({
      id: 'pig',
      name: 'Domestic Pig',
      germanName: 'Schwein',
      category: 'livestock',
      population: 120000,
      maxPopulation: 550000,
      growthRate: 0.2,
      migrationPattern: 'stationary',
      conservationStatus: 'abundant',
      habitatType: ['plains'],
      dietType: 'omnivore',
      huntable: false,
      domesticated: true,
      economicValue: 100
    });

    this.addSpecies({
      id: 'chicken',
      name: 'Chicken',
      germanName: 'Huhn',
      category: 'livestock',
      population: 500000,
      maxPopulation: 2000000,
      growthRate: 0.5,
      migrationPattern: 'stationary',
      conservationStatus: 'abundant',
      habitatType: ['plains'],
      dietType: 'omnivore',
      huntable: false,
      domesticated: true,
      economicValue: 10
    });

    // Fische
    this.addSpecies({
      id: 'trout',
      name: 'Brown Trout',
      germanName: 'Bachforelle',
      category: 'fish',
      population: 200000,
      maxPopulation: 500000,
      growthRate: 0.3,
      migrationPattern: 'seasonal',
      conservationStatus: 'common',
      habitatType: ['rivers'],
      dietType: 'carnivore',
      huntable: true,
      domesticated: false,
      economicValue: 15
    });

    this.addSpecies({
      id: 'carp',
      name: 'Common Carp',
      germanName: 'Karpfen',
      category: 'fish',
      population: 300000,
      maxPopulation: 800000,
      growthRate: 0.25,
      migrationPattern: 'stationary',
      conservationStatus: 'common',
      habitatType: ['rivers', 'lakes'],
      dietType: 'omnivore',
      huntable: true,
      domesticated: false,
      economicValue: 12
    });

    this.addSpecies({
      id: 'pike',
      name: 'Northern Pike',
      germanName: 'Hecht',
      category: 'fish',
      population: 80000,
      maxPopulation: 200000,
      growthRate: 0.2,
      migrationPattern: 'stationary',
      conservationStatus: 'common',
      habitatType: ['rivers', 'lakes'],
      dietType: 'carnivore',
      huntable: true,
      domesticated: false,
      economicValue: 20
    });
  }

  /**
   * Fügt eine Spezies hinzu
   */
  private addSpecies(species: AnimalSpecies): void {
    this.species.set(species.id, species);
  }

  /**
   * Aktualisiert Tier-Populationen für ein Jahr
   */
  public updateYear(
    year: number,
    forestArea: number,
    waterPollution: number,
    huntingPressure: number,
    climateTemperature: number
  ): void {
    this.species.forEach(species => {
      if (species.conservationStatus !== 'extinct') {
        // Natürliches Wachstum
        this.updatePopulationGrowth(species, forestArea, climateTemperature);
        
        // Migrations-Check
        if (species.migrationPattern === 'seasonal') {
          this.checkMigration(species, year);
        }
        
        // Jagddruck
        if (species.huntable && !species.domesticated) {
          this.applyHuntingPressure(species, huntingPressure, year);
        }
        
        // Umwelt-Einflüsse
        this.applyEnvironmentalImpact(species, forestArea, waterPollution, climateTemperature);
        
        // Artenschutz-Programme
        this.applyConservationEffects(species, year);
        
        // Aussterbe-Check
        this.checkExtinction(species, year);
      }
    });

    // Update Viehzucht
    this.updateLivestockFarms(year);
    
    // Update Fischbestände
    this.updateFishStocks(year, waterPollution);
    
    // Alte Events bereinigen
    this.cleanupOldEvents(year);
  }

  /**
   * Aktualisiert Populations-Wachstum
   */
  private updatePopulationGrowth(
    species: AnimalSpecies,
    forestArea: number,
    climateTemperature: number
  ): void {
    // Habitat-Kapazität basierend auf Umgebung
    let capacityModifier = 1.0;
    
    if (species.habitatType.includes('forest')) {
      capacityModifier = forestArea / 300000; // Assuming baseline 300k hectares
    }
    
    // Klima-Einfluss
    const climateImpact = Math.max(0.5, 1 - Math.abs(climateTemperature) * 0.1);
    
    // Berechne effektive Tragfähigkeit
    const effectiveCapacity = species.maxPopulation * capacityModifier * climateImpact;
    
    // Logistische Wachstumsfunktion
    const populationRatio = species.population / effectiveCapacity;
    const growth = species.population * species.growthRate * (1 - populationRatio);
    
    species.population = Math.max(0, Math.min(effectiveCapacity, species.population + growth));
    
    // Update Conservation Status
    this.updateConservationStatus(species);
  }

  /**
   * Aktualisiert Gefährdungsstatus
   */
  private updateConservationStatus(species: AnimalSpecies): void {
    const ratio = species.population / species.maxPopulation;
    
    if (ratio === 0) {
      species.conservationStatus = 'extinct';
    } else if (ratio < 0.05) {
      species.conservationStatus = 'critically_endangered';
    } else if (ratio < 0.15) {
      species.conservationStatus = 'endangered';
    } else if (ratio < 0.3) {
      species.conservationStatus = 'threatened';
    } else if (ratio < 0.5) {
      species.conservationStatus = 'uncommon';
    } else if (ratio < 0.8) {
      species.conservationStatus = 'common';
    } else {
      species.conservationStatus = 'abundant';
    }
  }

  /**
   * Prüft auf Migration
   */
  private checkMigration(species: AnimalSpecies, year: number): void {
    // Saisonale Migration: Frühling (Monat 4) und Herbst (Monat 10)
    const month = Math.random() < 0.5 ? 4 : 10;
    
    if (Math.random() < 0.3) { // 30% Chance pro Jahr
      const migrationSize = Math.floor(species.population * (0.2 + Math.random() * 0.3));
      
      const migration: Migration = {
        id: `migration-${species.id}-${year}`,
        speciesId: species.id,
        year,
        month,
        from: { x: Math.random() * 100, y: Math.random() * 100 },
        to: { x: Math.random() * 100, y: Math.random() * 100 },
        populationSize: migrationSize,
        reason: 'seasonal',
        completed: false
      };
      
      this.migrations.push(migration);
    }
  }

  /**
   * Wendet Jagddruck an
   */
  private applyHuntingPressure(species: AnimalSpecies, pressure: number, year: number): void {
    // Pressure: 0-100, higher = more hunting
    const huntingRate = (pressure / 100) * 0.2; // Max 20% per year
    const hunted = Math.floor(species.population * huntingRate);
    
    if (hunted > 0) {
      species.population = Math.max(0, species.population - hunted);
      
      // Record hunting event
      const huntingEvent: HuntingEvent = {
        id: `hunt-${species.id}-${year}`,
        speciesId: species.id,
        year,
        month: Math.floor(Math.random() * 12) + 1,
        huntedAmount: hunted,
        location: { x: Math.random() * 100, y: Math.random() * 100 },
        legalHunt: pressure < 50, // Over 50 is considered overhunting
        yield: {
          meat: hunted * 50,
          fur: hunted * 2,
          other: hunted * 5
        }
      };
      
      this.huntingEvents.push(huntingEvent);
    }
  }

  /**
   * Wendet Umwelt-Einflüsse an
   */
  private applyEnvironmentalImpact(
    species: AnimalSpecies,
    forestArea: number,
    waterPollution: number,
    climateTemperature: number
  ): void {
    let impact = 1.0;
    
    // Habitat-Verlust
    if (species.habitatType.includes('forest')) {
      const forestLoss = Math.max(0, 1 - forestArea / 300000);
      impact *= (1 - forestLoss * 0.3);
    }
    
    // Wasser-Verschmutzung (für Fische und Wasser-abhängige Arten)
    if (species.category === 'fish') {
      impact *= (1 - waterPollution / 200);
    }
    
    // Klima-Stress
    if (Math.abs(climateTemperature) > 1.5) {
      impact *= (1 - Math.abs(climateTemperature) * 0.05);
    }
    
    species.population = Math.floor(species.population * Math.max(0.5, impact));
  }

  /**
   * Wendet Artenschutz-Effekte an
   */
  private applyConservationEffects(species: AnimalSpecies, _year: number): void {
    this.conservationPrograms.forEach(program => {
      if (program.speciesId === species.id && program.active) {
        // Conservation boosts population recovery
        const boost = (program.effectiveness / 100) * 0.05; // Up to 5% boost
        species.population = Math.min(
          species.maxPopulation,
          Math.floor(species.population * (1 + boost))
        );
      }
    });
  }

  /**
   * Prüft auf Aussterben
   */
  private checkExtinction(species: AnimalSpecies, year: number): void {
    if (species.population <= 0 && species.conservationStatus !== 'extinct') {
      species.conservationStatus = 'extinct';
      species.extinctionYear = year;
      
      const extinctionEvent: ExtinctionEvent = {
        speciesId: species.id,
        year,
        cause: this.determineExtinctionCause(species),
        lastPopulation: species.population,
        economicImpact: species.economicValue * species.maxPopulation * 0.01,
        ecologicalImpact: species.category === 'wildlife' ? 50 : 10
      };
      
      this.extinctionEvents.push(extinctionEvent);
    }
  }

  /**
   * Bestimmt Aussterbe-Ursache
   */
  private determineExtinctionCause(species: AnimalSpecies): ExtinctionEvent['cause'] {
    // Simplified logic based on species characteristics
    if (species.huntable && species.population < species.maxPopulation * 0.1) {
      return 'overhunting';
    }
    if (species.habitatType.includes('forest')) {
      return 'habitat_loss';
    }
    if (species.category === 'fish') {
      return 'pollution';
    }
    return 'climate_change';
  }

  /**
   * Aktualisiert Viehzucht-Betriebe
   */
  private updateLivestockFarms(_year: number): void {
    this.livestockFarms.forEach(farm => {
      const species = this.species.get(farm.speciesId);
      if (!species) return;
      
      // Natural growth
      const growth = Math.floor(farm.animalCount * species.growthRate * (farm.efficiency / 100));
      farm.animalCount = Math.min(farm.capacity, farm.animalCount + growth);
      
      // Production
      farm.production.meat = farm.animalCount * 50;
      if (farm.speciesId === 'cattle') {
        farm.production.milk = farm.animalCount * 200;
        farm.production.leather = farm.animalCount * 2;
      } else if (farm.speciesId === 'sheep') {
        farm.production.wool = farm.animalCount * 5;
      } else if (farm.speciesId === 'chicken') {
        farm.production.eggs = farm.animalCount * 250;
      }
      
      // Health degradation (requires maintenance)
      farm.healthStatus = Math.max(50, farm.healthStatus - 5);
    });
  }

  /**
   * Aktualisiert Fischbestände
   */
  private updateFishStocks(year: number, waterPollution: number): void {
    this.fishStocks.forEach(stock => {
      const species = this.species.get(stock.speciesId);
      if (!species) return;
      
      // Pollution impact
      stock.pollutionImpact = waterPollution;
      const pollutionModifier = Math.max(0.3, 1 - waterPollution / 100);
      
      // Natural reproduction
      const populationRatio = stock.population / stock.maxPopulation;
      const growth = stock.population * stock.reproductionRate * (1 - populationRatio) * pollutionModifier;
      
      stock.population = Math.max(0, Math.min(stock.maxPopulation, stock.population + growth));
      
      // Check overfishing
      const yearsSinceFishing = year - stock.lastFishingYear;
      if (stock.population < stock.maxPopulation * 0.3 && yearsSinceFishing < 2) {
        stock.overfished = true;
      } else if (yearsSinceFishing > 5) {
        stock.overfished = false;
      }
    });
  }

  /**
   * Bereinigt alte Events
   */
  private cleanupOldEvents(_year: number): void {
    // Keep last 100 hunting events
    if (this.huntingEvents.length > 100) {
      this.huntingEvents = this.huntingEvents.slice(-100);
    }
    
    // Keep last 50 migrations
    if (this.migrations.length > 50) {
      this.migrations = this.migrations.slice(-50);
    }
  }

  /**
   * Jagt eine Spezies
   */
  public huntSpecies(
    speciesId: string,
    amount: number,
    year: number,
    month: number,
    location: { x: number; y: number },
    legal: boolean = true
  ): HuntingEvent | null {
    const species = this.species.get(speciesId);
    if (!species || !species.huntable || species.domesticated) {
      return null;
    }
    
    const actualAmount = Math.min(amount, species.population);
    species.population -= actualAmount;
    
    const huntingEvent: HuntingEvent = {
      id: `hunt-${speciesId}-${year}-${Date.now()}`,
      speciesId,
      year,
      month,
      huntedAmount: actualAmount,
      location,
      legalHunt: legal,
      yield: {
        meat: actualAmount * 50,
        fur: actualAmount * 2,
        other: actualAmount * 5
      }
    };
    
    this.huntingEvents.push(huntingEvent);
    return huntingEvent;
  }

  /**
   * Erstellt einen Viehzucht-Betrieb
   */
  public createLivestockFarm(
    speciesId: string,
    location: { x: number; y: number },
    capacity: number
  ): LivestockFarm | null {
    const species = this.species.get(speciesId);
    if (!species || !species.domesticated) {
      return null;
    }
    
    const farm: LivestockFarm = {
      id: `farm-${speciesId}-${Date.now()}`,
      speciesId,
      location,
      animalCount: Math.floor(capacity * 0.5), // Start at 50% capacity
      capacity,
      efficiency: 70,
      healthStatus: 100,
      lastHarvestYear: 0,
      production: {
        meat: 0,
        milk: 0,
        eggs: 0,
        wool: 0,
        leather: 0
      }
    };
    
    this.livestockFarms.set(farm.id, farm);
    return farm;
  }

  /**
   * Fischt in einem Gewässer
   */
  public fishInWaterbody(
    waterbodyId: string,
    amount: number,
    year: number
  ): { caught: number; species: string[] } {
    const stocks = Array.from(this.fishStocks.values()).filter(
      s => s.waterbodyId === waterbodyId
    );
    
    let totalCaught = 0;
    const caughtSpecies: string[] = [];
    
    stocks.forEach(stock => {
      if (stock.overfished) {
        return; // Don't fish overfished stocks
      }
      
      const catchAmount = Math.min(amount / stocks.length, stock.population * 0.1);
      stock.population -= catchAmount;
      stock.lastFishingYear = year;
      totalCaught += catchAmount;
      
      if (catchAmount > 0) {
        caughtSpecies.push(stock.speciesId);
      }
    });
    
    return { caught: Math.floor(totalCaught), species: caughtSpecies };
  }

  /**
   * Startet ein Artenschutz-Programm
   */
  public startConservationProgram(
    speciesId: string,
    budget: number,
    protectedArea: number,
    year: number
  ): ConservationProgram | null {
    const species = this.species.get(speciesId);
    if (!species) {
      return null;
    }
    
    const program: ConservationProgram = {
      id: `conservation-${speciesId}-${year}`,
      speciesId,
      startYear: year,
      budget,
      protectedArea,
      effectiveness: Math.min(100, (budget / 10000) * 50 + (protectedArea / 1000) * 30),
      populationTarget: species.maxPopulation * 0.8,
      active: true
    };
    
    this.conservationPrograms.set(program.id, program);
    return program;
  }

  /**
   * Fügt Fischbestand hinzu
   */
  public addFishStock(
    speciesId: string,
    waterbodyId: string,
    population: number,
    maxPopulation: number
  ): FishStock {
    const stock: FishStock = {
      speciesId,
      waterbodyId,
      population,
      maxPopulation,
      reproductionRate: 0.25,
      overfished: false,
      lastFishingYear: 0,
      pollutionImpact: 0
    };
    
    this.fishStocks.set(`${waterbodyId}-${speciesId}`, stock);
    return stock;
  }

  // Getter methods
  public getSpecies(id: string): AnimalSpecies | undefined {
    return this.species.get(id);
  }

  public getAllSpecies(): AnimalSpecies[] {
    return Array.from(this.species.values());
  }

  public getWildlifeSpecies(): AnimalSpecies[] {
    return this.getAllSpecies().filter(s => s.category === 'wildlife');
  }

  public getLivestockSpecies(): AnimalSpecies[] {
    return this.getAllSpecies().filter(s => s.category === 'livestock');
  }

  public getFishSpecies(): AnimalSpecies[] {
    return this.getAllSpecies().filter(s => s.category === 'fish');
  }

  public getEndangeredSpecies(): AnimalSpecies[] {
    return this.getAllSpecies().filter(s => 
      s.conservationStatus === 'endangered' || 
      s.conservationStatus === 'critically_endangered'
    );
  }

  public getExtinctSpecies(): AnimalSpecies[] {
    return this.getAllSpecies().filter(s => s.conservationStatus === 'extinct');
  }

  public getMigrations(): Migration[] {
    return [...this.migrations];
  }

  public getActiveMigrations(): Migration[] {
    return this.migrations.filter(m => !m.completed);
  }

  public getHuntingEvents(years: number = 10): HuntingEvent[] {
    const cutoffYear = Math.max(...this.huntingEvents.map(e => e.year)) - years;
    return this.huntingEvents.filter(e => e.year >= cutoffYear);
  }

  public getLivestockFarms(): LivestockFarm[] {
    return Array.from(this.livestockFarms.values());
  }

  public getFishStocks(): FishStock[] {
    return Array.from(this.fishStocks.values());
  }

  public getConservationPrograms(): ConservationProgram[] {
    return Array.from(this.conservationPrograms.values());
  }

  public getExtinctionEvents(): ExtinctionEvent[] {
    return [...this.extinctionEvents];
  }

  public getTotalWildlifePopulation(): number {
    return this.getWildlifeSpecies().reduce((sum, s) => sum + s.population, 0);
  }

  public getTotalLivestockPopulation(): number {
    return this.getLivestockSpecies().reduce((sum, s) => sum + s.population, 0);
  }

  /**
   * Serialisiert das Tierpopulations-System
   */
  public serialize(): any {
    return {
      species: Array.from(this.species.entries()),
      migrations: this.migrations,
      huntingEvents: this.huntingEvents,
      livestockFarms: Array.from(this.livestockFarms.entries()),
      fishStocks: Array.from(this.fishStocks.entries()),
      conservationPrograms: Array.from(this.conservationPrograms.entries()),
      extinctionEvents: this.extinctionEvents
    };
  }

  /**
   * Deserialisiert das Tierpopulations-System
   */
  public static deserialize(data: any): AnimalPopulationSystem {
    const system = new AnimalPopulationSystem();
    
    system.species = new Map(data.species);
    system.migrations = data.migrations || [];
    system.huntingEvents = data.huntingEvents || [];
    system.livestockFarms = new Map(data.livestockFarms || []);
    system.fishStocks = new Map(data.fishStocks || []);
    system.conservationPrograms = new Map(data.conservationPrograms || []);
    system.extinctionEvents = data.extinctionEvents || [];
    
    return system;
  }
}
