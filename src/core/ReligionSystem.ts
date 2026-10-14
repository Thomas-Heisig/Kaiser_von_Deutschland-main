// src/core/ReligionSystem.ts

export type ReligionType = 
  | 'christianity_catholic' 
  | 'christianity_protestant' 
  | 'christianity_orthodox'
  | 'islam_sunni'
  | 'islam_shia'
  | 'judaism'
  | 'buddhism'
  | 'hinduism'
  | 'paganism'
  | 'atheism';

export type CulturalIdentity = 
  | 'germanic'
  | 'latin'
  | 'slavic'
  | 'celtic'
  | 'mediterranean'
  | 'scandinavian'
  | 'arabic'
  | 'asian';

export interface Religion {
  id: ReligionType;
  name: string;
  description: string;
  foundedYear: number;
  followers: number; // population following this religion
  influence: number; // 0-100
  tolerance: number; // 0-100, higher = more tolerant
  conversionRate: number; // base conversion rate per year
  bonuses: {
    happiness?: number;
    stability?: number;
    culturalInfluence?: number;
    tradePower?: number;
    scientificProgress?: number;
  };
  penalties?: {
    militaryPower?: number;
    economicGrowth?: number;
    scientificProgress?: number;
    culturalInfluence?: number;
  };
}

export interface ReligiousBuilding {
  id: string;
  name: string;
  religion: ReligionType;
  description: string;
  cost: {
    gold: number;
    wood: number;
    stone: number;
    land: number;
  };
  buildTime: number;
  maintenance: number;
  effects: {
    piety?: number;
    happiness?: number;
    culturalInfluence?: number;
    conversionRate?: number;
    pilgrimIncome?: number;
  };
  capacity: number; // max worshippers
  employmentSlots: number;
  requirements: {
    minPopulation?: number;
    religion: ReligionType;
    minTech?: number;
  };
}

export interface CulturalEvent {
  id: string;
  name: string;
  description: string;
  culture: CulturalIdentity;
  religion?: ReligionType;
  frequency: 'yearly' | 'monthly' | 'seasonal' | 'rare';
  month?: number; // 1-12
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  effects: {
    happiness?: number;
    culturalInfluence?: number;
    stability?: number;
    goldCost?: number;
    foodConsumption?: number;
  };
  attendance: number; // percentage of population attending
}

export interface ReligiousTension {
  id: string;
  religion1: ReligionType;
  religion2: ReligionType;
  tensionLevel: number; // 0-100
  conflictPotential: number; // 0-100
  lastIncident?: number; // year
  casualties?: number;
}

export interface ConversionEvent {
  year: number;
  fromReligion: ReligionType;
  toReligion: ReligionType;
  convertedPopulation: number;
  forced: boolean;
  stabilityImpact: number;
}

export class ReligionSystem {
  private religions: Map<ReligionType, Religion> = new Map();
  private religiousBuildings: Map<string, ReligiousBuilding[]> = new Map();
  private culturalEvents: CulturalEvent[] = [];
  private tensions: Map<string, ReligiousTension> = new Map();
  private conversionHistory: ConversionEvent[] = [];
  private dominantReligion: ReligionType = 'christianity_catholic';
  private dominantCulture: CulturalIdentity = 'germanic';
  private culturalInfluence: number = 50;
  private religiousFreedom: number = 30; // 0-100
  private currentYear: number = 1;

  constructor() {
    this.initializeReligions();
    this.initializeReligiousBuildings();
    this.initializeCulturalEvents();
  }

  private initializeReligions(): void {
    // Christianity Catholic
    this.religions.set('christianity_catholic', {
      id: 'christianity_catholic',
      name: 'Katholizismus',
      description: 'Die römisch-katholische Kirche',
      foundedYear: 33,
      followers: 0,
      influence: 80,
      tolerance: 40,
      conversionRate: 2,
      bonuses: {
        culturalInfluence: 15,
        stability: 10,
      },
    });

    // Christianity Protestant
    this.religions.set('christianity_protestant', {
      id: 'christianity_protestant',
      name: 'Protestantismus',
      description: 'Die protestantischen Kirchen nach der Reformation',
      foundedYear: 1517,
      followers: 0,
      influence: 60,
      tolerance: 60,
      conversionRate: 3,
      bonuses: {
        tradePower: 10,
        scientificProgress: 5,
      },
    });

    // Christianity Orthodox
    this.religions.set('christianity_orthodox', {
      id: 'christianity_orthodox',
      name: 'Orthodoxie',
      description: 'Die orthodoxen Kirchen des Ostens',
      foundedYear: 1054,
      followers: 0,
      influence: 70,
      tolerance: 50,
      conversionRate: 2,
      bonuses: {
        culturalInfluence: 12,
        stability: 15,
      },
    });

    // Islam Sunni
    this.religions.set('islam_sunni', {
      id: 'islam_sunni',
      name: 'Sunnitischer Islam',
      description: 'Die sunnitische Richtung des Islam',
      foundedYear: 632,
      followers: 0,
      influence: 75,
      tolerance: 45,
      conversionRate: 2.5,
      bonuses: {
        tradePower: 15,
        culturalInfluence: 10,
      },
    });

    // Judaism
    this.religions.set('judaism', {
      id: 'judaism',
      name: 'Judentum',
      description: 'Die jüdische Religion',
      foundedYear: -1500,
      followers: 0,
      influence: 30,
      tolerance: 70,
      conversionRate: 0.5,
      bonuses: {
        tradePower: 20,
        scientificProgress: 10,
      },
    });

    // Paganism
    this.religions.set('paganism', {
      id: 'paganism',
      name: 'Heidentum',
      description: 'Traditionelle germanische und keltische Religionen',
      foundedYear: -1000,
      followers: 0,
      influence: 20,
      tolerance: 80,
      conversionRate: -1, // declining
      bonuses: {
        happiness: 10,
      },
      penalties: {
        scientificProgress: -5,
      },
    });

    // Atheism
    this.religions.set('atheism', {
      id: 'atheism',
      name: 'Atheismus',
      description: 'Säkularer Humanismus und Atheismus',
      foundedYear: 1700,
      followers: 0,
      influence: 10,
      tolerance: 90,
      conversionRate: 1,
      bonuses: {
        scientificProgress: 15,
        tradePower: 5,
      },
      penalties: {
        culturalInfluence: -5,
      },
    });
  }

  private initializeReligiousBuildings(): void {
    const churches: ReligiousBuilding[] = [
      {
        id: 'chapel',
        name: 'Kapelle',
        religion: 'christianity_catholic',
        description: 'Kleine Gebetshaus für lokale Gemeinde',
        cost: { gold: 500, wood: 200, stone: 300, land: 100 },
        buildTime: 60,
        maintenance: 50,
        effects: { piety: 5, happiness: 3, conversionRate: 1 },
        capacity: 50,
        employmentSlots: 2,
        requirements: { minPopulation: 100, religion: 'christianity_catholic' },
      },
      {
        id: 'church',
        name: 'Kirche',
        religion: 'christianity_catholic',
        description: 'Große Gemeindekirche',
        cost: { gold: 2000, wood: 500, stone: 1000, land: 300 },
        buildTime: 120,
        maintenance: 150,
        effects: { piety: 15, happiness: 8, conversionRate: 3, culturalInfluence: 5 },
        capacity: 200,
        employmentSlots: 8,
        requirements: { minPopulation: 500, religion: 'christianity_catholic' },
      },
      {
        id: 'cathedral',
        name: 'Kathedrale',
        religion: 'christianity_catholic',
        description: 'Prächtige Bischofskirche',
        cost: { gold: 10000, wood: 2000, stone: 5000, land: 1000 },
        buildTime: 365,
        maintenance: 500,
        effects: { piety: 40, happiness: 20, conversionRate: 8, culturalInfluence: 20, pilgrimIncome: 200 },
        capacity: 1000,
        employmentSlots: 30,
        requirements: { minPopulation: 5000, religion: 'christianity_catholic', minTech: 15 },
      },
      {
        id: 'monastery',
        name: 'Kloster',
        religion: 'christianity_catholic',
        description: 'Religiöses Zentrum für Mönche und Gelehrte',
        cost: { gold: 5000, wood: 1500, stone: 2000, land: 2000 },
        buildTime: 240,
        maintenance: 300,
        effects: { piety: 25, culturalInfluence: 15, conversionRate: 5 },
        capacity: 100,
        employmentSlots: 50,
        requirements: { minPopulation: 1000, religion: 'christianity_catholic', minTech: 10 },
      },
    ];

    this.religiousBuildings.set('christianity_catholic', churches);
  }

  private initializeCulturalEvents(): void {
    this.culturalEvents = [
      {
        id: 'easter',
        name: 'Ostern',
        description: 'Feier der Auferstehung Christi',
        culture: 'germanic',
        religion: 'christianity_catholic',
        frequency: 'yearly',
        month: 4,
        effects: { happiness: 10, culturalInfluence: 5, goldCost: 100 },
        attendance: 80,
      },
      {
        id: 'christmas',
        name: 'Weihnachten',
        description: 'Feier der Geburt Christi',
        culture: 'germanic',
        religion: 'christianity_catholic',
        frequency: 'yearly',
        month: 12,
        effects: { happiness: 15, culturalInfluence: 8, goldCost: 200, foodConsumption: 500 },
        attendance: 90,
      },
      {
        id: 'harvest_festival',
        name: 'Erntedankfest',
        description: 'Dank für die Ernte des Jahres',
        culture: 'germanic',
        frequency: 'yearly',
        season: 'autumn',
        effects: { happiness: 12, stability: 5, foodConsumption: 300 },
        attendance: 70,
      },
      {
        id: 'spring_festival',
        name: 'Frühlingsfest',
        description: 'Feier des Frühlingsanfangs',
        culture: 'germanic',
        religion: 'paganism',
        frequency: 'yearly',
        season: 'spring',
        effects: { happiness: 8, culturalInfluence: 3 },
        attendance: 50,
      },
      {
        id: 'midsummer',
        name: 'Mittsommer',
        description: 'Feier zur Sommersonnenwende',
        culture: 'scandinavian',
        religion: 'paganism',
        frequency: 'yearly',
        month: 6,
        effects: { happiness: 10, culturalInfluence: 5 },
        attendance: 60,
      },
    ];
  }

  // Religion Management
  public setDominantReligion(religion: ReligionType): void {
    this.dominantReligion = religion;
  }

  public getDominantReligion(): ReligionType {
    return this.dominantReligion;
  }

  public getReligion(type: ReligionType): Religion | undefined {
    return this.religions.get(type);
  }

  public getAllReligions(): Religion[] {
    return Array.from(this.religions.values());
  }

  public updateReligionFollowers(religion: ReligionType, followers: number): void {
    const rel = this.religions.get(religion);
    if (rel) {
      rel.followers = Math.max(0, followers);
    }
  }

  // Cultural Management
  public setDominantCulture(culture: CulturalIdentity): void {
    this.dominantCulture = culture;
  }

  public getDominantCulture(): CulturalIdentity {
    return this.dominantCulture;
  }

  public getCulturalInfluence(): number {
    return this.culturalInfluence;
  }

  public updateCulturalInfluence(change: number): void {
    this.culturalInfluence = Math.max(0, Math.min(100, this.culturalInfluence + change));
  }

  // Religious Buildings
  public getReligiousBuildings(religion: ReligionType): ReligiousBuilding[] {
    return this.religiousBuildings.get(religion) || [];
  }

  public addReligiousBuilding(religion: ReligionType, building: ReligiousBuilding): void {
    const buildings = this.religiousBuildings.get(religion) || [];
    buildings.push(building);
    this.religiousBuildings.set(religion, buildings);
  }

  // Cultural Events
  public getCulturalEvents(): CulturalEvent[] {
    return this.culturalEvents;
  }

  public getEventsByMonth(month: number): CulturalEvent[] {
    return this.culturalEvents.filter(e => e.month === month);
  }

  public getEventsBySeason(season: 'spring' | 'summer' | 'autumn' | 'winter'): CulturalEvent[] {
    return this.culturalEvents.filter(e => e.season === season);
  }

  public addCulturalEvent(event: CulturalEvent): void {
    this.culturalEvents.push(event);
  }

  // Religious Tensions
  public createTension(religion1: ReligionType, religion2: ReligionType, initialTension: number = 20): void {
    const id = `${religion1}_${religion2}`;
    this.tensions.set(id, {
      id,
      religion1,
      religion2,
      tensionLevel: initialTension,
      conflictPotential: initialTension * 0.5,
    });
  }

  public getTension(religion1: ReligionType, religion2: ReligionType): ReligiousTension | undefined {
    const id1 = `${religion1}_${religion2}`;
    const id2 = `${religion2}_${religion1}`;
    return this.tensions.get(id1) || this.tensions.get(id2);
  }

  public updateTension(religion1: ReligionType, religion2: ReligionType, change: number): void {
    const tension = this.getTension(religion1, religion2);
    if (tension) {
      tension.tensionLevel = Math.max(0, Math.min(100, tension.tensionLevel + change));
      tension.conflictPotential = Math.max(0, Math.min(100, tension.tensionLevel * 0.8));
    }
  }

  // Conversion
  public convertPopulation(fromReligion: ReligionType, toReligion: ReligionType, amount: number, forced: boolean = false): void {
    const from = this.religions.get(fromReligion);
    const to = this.religions.get(toReligion);
    
    if (from && to) {
      const actualAmount = Math.min(amount, from.followers);
      from.followers -= actualAmount;
      to.followers += actualAmount;
      
      const stabilityImpact = forced ? -actualAmount * 0.01 : -actualAmount * 0.001;
      
      this.conversionHistory.push({
        year: this.currentYear,
        fromReligion,
        toReligion,
        convertedPopulation: actualAmount,
        forced,
        stabilityImpact,
      });
      
      if (forced) {
        this.updateTension(fromReligion, toReligion, 15);
      }
    }
  }

  public getConversionHistory(): ConversionEvent[] {
    return this.conversionHistory;
  }

  // Religious Freedom
  public setReligiousFreedom(value: number): void {
    this.religiousFreedom = Math.max(0, Math.min(100, value));
  }

  public getReligiousFreedom(): number {
    return this.religiousFreedom;
  }

  // Year Updates
  public advanceYear(year: number, totalPopulation: number): void {
    this.currentYear = year;
    
    // Natural conversion based on conversion rates
    this.religions.forEach((religion, type) => {
      if (religion.conversionRate !== 0) {
        const conversionAmount = Math.floor(totalPopulation * (religion.conversionRate / 100) * (this.religiousFreedom / 100));
        
        if (conversionAmount > 0) {
          // Convert from dominant religion
          if (type !== this.dominantReligion) {
            const dominantRel = this.religions.get(this.dominantReligion);
            if (dominantRel && dominantRel.followers > conversionAmount) {
              this.convertPopulation(this.dominantReligion, type, conversionAmount, false);
            }
          }
        }
      }
    });
    
    // Reduce tensions over time
    this.tensions.forEach(tension => {
      tension.tensionLevel = Math.max(0, tension.tensionLevel - 1);
      tension.conflictPotential = Math.max(0, tension.conflictPotential - 0.5);
    });
  }

  // Serialization
  public serialize(): any {
    return {
      religions: Array.from(this.religions.entries()),
      religiousBuildings: Array.from(this.religiousBuildings.entries()),
      culturalEvents: this.culturalEvents,
      tensions: Array.from(this.tensions.entries()),
      conversionHistory: this.conversionHistory,
      dominantReligion: this.dominantReligion,
      dominantCulture: this.dominantCulture,
      culturalInfluence: this.culturalInfluence,
      religiousFreedom: this.religiousFreedom,
      currentYear: this.currentYear,
    };
  }

  public static deserialize(data: any): ReligionSystem {
    const system = new ReligionSystem();
    system.religions = new Map(data.religions);
    system.religiousBuildings = new Map(data.religiousBuildings);
    system.culturalEvents = data.culturalEvents;
    system.tensions = new Map(data.tensions);
    system.conversionHistory = data.conversionHistory;
    system.dominantReligion = data.dominantReligion;
    system.dominantCulture = data.dominantCulture;
    system.culturalInfluence = data.culturalInfluence;
    system.religiousFreedom = data.religiousFreedom;
    system.currentYear = data.currentYear;
    return system;
  }
}
