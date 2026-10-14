// src/core/DemographicSystem.ts

import type { Citizen, CitizenSystem } from './CitizenSystem';

/**
 * Alterskategorie für Demografie
 */
export interface AgeGroup {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

/**
 * Alterspyramide
 */
export interface AgePyramid {
  male: AgeGroup[];
  female: AgeGroup[];
  total: number;
}

/**
 * Krankheit/Epidemie
 */
export interface Disease {
  id: string;
  name: string;
  contagiousness: number; // 0-100: Ansteckungsgrad
  mortalityRate: number; // 0-100: Sterblichkeitsrate
  duration: number; // Monate
  immunity: boolean; // Immunität nach Genesung
  affectedCitizenIds: Set<string>;
}

/**
 * Hungersnot
 */
export interface Famine {
  id: string;
  regionId: string;
  severity: number; // 0-100
  startYear: number;
  startMonth: number;
  duration: number; // Monate
  active: boolean;
}

/**
 * Demografische Statistiken
 */
export interface DemographicStats {
  totalPopulation: number;
  birthRate: number; // pro 1000 Einwohner pro Jahr
  deathRate: number; // pro 1000 Einwohner pro Jahr
  growthRate: number; // Prozent pro Jahr
  lifeExpectancy: number; // Jahre
  infantMortalityRate: number; // pro 1000 Geburten
  fertilityRate: number; // Kinder pro Frau
  averageAge: number;
  medianAge: number;
}

/**
 * System zur Verwaltung demografischer Prozesse
 */
export class DemographicSystem {
  private activeDiseases: Map<string, Disease> = new Map();
  private activeFamines: Map<string, Famine> = new Map();
  private birthsThisYear: number = 0;
  private deathsThisYear: number = 0;
  private lastYearProcessed: number = 0;
  
  // Konfigurierbare Parameter
  private baseBirthRate: number = 35; // pro 1000 pro Jahr
  private baseDeathRate: number = 25; // pro 1000 pro Jahr
  private infantMortalityBase: number = 150; // pro 1000 Geburten
  
  /**
   * Berechnet die Alterspyramide
   */
  public calculateAgePyramid(citizenSystem: CitizenSystem): AgePyramid {
    const citizens = citizenSystem.getAllCitizens().filter(c => c.isAlive);
    
    const ageGroups = [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 11, max: 15 },
      { min: 16, max: 20 },
      { min: 21, max: 30 },
      { min: 31, max: 40 },
      { min: 41, max: 50 },
      { min: 51, max: 60 },
      { min: 61, max: 70 },
      { min: 71, max: 999 }
    ];
    
    const male: AgeGroup[] = [];
    const female: AgeGroup[] = [];
    const total = citizens.length;
    
    for (const group of ageGroups) {
      const maleCount = citizens.filter(c => 
        c.gender === 'male' && c.age >= group.min && c.age <= group.max
      ).length;
      
      const femaleCount = citizens.filter(c => 
        c.gender === 'female' && c.age >= group.min && c.age <= group.max
      ).length;
      
      male.push({
        min: group.min,
        max: group.max,
        count: maleCount,
        percentage: total > 0 ? (maleCount / total) * 100 : 0
      });
      
      female.push({
        min: group.min,
        max: group.max,
        count: femaleCount,
        percentage: total > 0 ? (femaleCount / total) * 100 : 0
      });
    }
    
    return { male, female, total };
  }
  
  /**
   * Berechnet demografische Statistiken
   */
  public calculateStatistics(citizenSystem: CitizenSystem): DemographicStats {
    const citizens = citizenSystem.getAllCitizens().filter(c => c.isAlive);
    const totalPopulation = citizens.length;
    
    if (totalPopulation === 0) {
      return {
        totalPopulation: 0,
        birthRate: 0,
        deathRate: 0,
        growthRate: 0,
        lifeExpectancy: 0,
        infantMortalityRate: 0,
        fertilityRate: 0,
        averageAge: 0,
        medianAge: 0
      };
    }
    
    // Durchschnittsalter
    const totalAge = citizens.reduce((sum, c) => sum + c.age, 0);
    const averageAge = totalAge / totalPopulation;
    
    // Median-Alter
    const sortedAges = citizens.map(c => c.age).sort((a, b) => a - b);
    const medianAge = sortedAges[Math.floor(sortedAges.length / 2)] || 0;
    
    // Lebenserwartung (Durchschnittsalter der Verstorbenen)
    const deceased = citizenSystem.getAllCitizens().filter(c => !c.isAlive && c.deathYear);
    const lifeExpectancy = deceased.length > 0
      ? deceased.reduce((sum, c) => sum + (c.deathYear! - c.birthYear), 0) / deceased.length
      : 45; // Standard-Lebenserwartung
    
    // Geburten- und Sterberate (pro 1000 pro Jahr)
    const birthRate = totalPopulation > 0 ? (this.birthsThisYear / totalPopulation) * 1000 : 0;
    const deathRate = totalPopulation > 0 ? (this.deathsThisYear / totalPopulation) * 1000 : 0;
    const growthRate = birthRate - deathRate;
    
    // Fruchtbarkeitsrate (Kinder pro Frau)
    const women = citizens.filter(c => c.gender === 'female' && c.age >= 15 && c.age <= 49);
    const fertilityRate = women.length > 0 ? (this.birthsThisYear / women.length) : 0;
    
    return {
      totalPopulation,
      birthRate,
      deathRate,
      growthRate,
      lifeExpectancy,
      infantMortalityRate: this.infantMortalityBase,
      fertilityRate,
      averageAge,
      medianAge
    };
  }
  
  /**
   * Verarbeitet monatliche demografische Prozesse
   */
  public processMonth(
    citizenSystem: CitizenSystem,
    currentYear: number,
    currentMonth: number
  ): void {
    // Jahreswechsel - Statistiken zurücksetzen
    if (currentYear !== this.lastYearProcessed && currentMonth === 1) {
      this.birthsThisYear = 0;
      this.deathsThisYear = 0;
      this.lastYearProcessed = currentYear;
    }
    
    // Geburten
    this.processBirths(citizenSystem, currentYear, currentMonth);
    
    // Todesfälle
    this.processDeaths(citizenSystem, currentYear, currentMonth);
    
    // Epidemien
    this.processDiseases(citizenSystem, currentYear, currentMonth);
    
    // Hungersnöte
    this.processFamines(citizenSystem, currentYear, currentMonth);
  }
  
  /**
   * Verarbeitet Geburten
   */
  private processBirths(
    citizenSystem: CitizenSystem,
    _year: number,
    _month: number
  ): void {
    const citizens = citizenSystem.getAllCitizens().filter(c => c.isAlive);
    const population = citizens.length;
    
    if (population === 0) return;
    
    // Monatliche Geburtenrate (Jahresrate / 12)
    const monthlyBirthRate = this.baseBirthRate / 12 / 1000;
    const expectedBirths = Math.floor(population * monthlyBirthRate);
    
    // Qualität des Lebens beeinflusst Geburtenrate
    const avgHappiness = citizens.reduce((sum, c) => sum + c.happiness, 0) / population;
    const happinessFactor = avgHappiness / 100;
    
    const actualBirths = Math.max(0, Math.floor(expectedBirths * (0.5 + happinessFactor * 0.5)));
    
    this.birthsThisYear += actualBirths;
    
    // Geburten werden in CitizenSystem durch Schwangerschaften gehandhabt
    // Hier könnten zusätzliche Geburten-Events generiert werden
  }
  
  /**
   * Verarbeitet Todesfälle
   */
  private processDeaths(
    citizenSystem: CitizenSystem,
    year: number,
    month: number
  ): void {
    const citizens = citizenSystem.getAllCitizens().filter(c => c.isAlive);
    
    for (const citizen of citizens) {
      let deathChance = this.calculateDeathChance(citizen);
      
      // Zufälliger Tod
      if (Math.random() * 1000 < deathChance) {
        this.killCitizen(citizen, year, month, 'natural');
        this.deathsThisYear++;
      }
    }
  }
  
  /**
   * Berechnet die monatliche Todeswahrscheinlichkeit
   */
  private calculateDeathChance(citizen: Citizen): number {
    let baseChance = this.baseDeathRate / 12; // Monatliche Rate
    
    // Alter erhöht Todeswahrscheinlichkeit exponentiell
    if (citizen.age < 1) {
      baseChance *= 5; // Säuglingssterblichkeit
    } else if (citizen.age < 5) {
      baseChance *= 2; // Kindersterblichkeit
    } else if (citizen.age > 60) {
      baseChance *= 2 + (citizen.age - 60) * 0.2;
    }
    
    // Gesundheit reduziert Todeswahrscheinlichkeit
    const healthFactor = citizen.health.overall / 100;
    baseChance *= (2 - healthFactor);
    
    // Krankheiten erhöhen Todeswahrscheinlichkeit
    if (citizen.health.diseases.length > 0) {
      baseChance *= (1 + citizen.health.diseases.length * 0.5);
    }
    
    // Bedürfnisse beeinflussen Sterbewahrscheinlichkeit
    const criticalNeeds = (citizen.needs.food + citizen.needs.health + citizen.needs.shelter) / 3;
    if (criticalNeeds < 20) {
      baseChance *= 3;
    } else if (criticalNeeds < 40) {
      baseChance *= 1.5;
    }
    
    return baseChance;
  }
  
  /**
   * Tötet einen Bürger
   */
  private killCitizen(
    citizen: Citizen,
    year: number,
    month: number,
    cause: string
  ): void {
    citizen.isAlive = false;
    citizen.deathYear = year;
    citizen.deathMonth = month;
    
    citizen.lifeEvents.push({
      year,
      month,
      type: 'death',
      description: `Gestorben an ${cause}`
    });
  }
  
  /**
   * Startet eine Epidemie
   */
  public startEpidemic(
    name: string,
    contagiousness: number,
    mortalityRate: number,
    duration: number,
    immunity: boolean = true
  ): Disease {
    const disease: Disease = {
      id: `disease_${Date.now()}_${Math.random()}`,
      name,
      contagiousness,
      mortalityRate,
      duration,
      immunity,
      affectedCitizenIds: new Set()
    };
    
    this.activeDiseases.set(disease.id, disease);
    return disease;
  }
  
  /**
   * Verarbeitet Epidemien
   */
  private processDiseases(
    citizenSystem: CitizenSystem,
    year: number,
    month: number
  ): void {
    for (const disease of this.activeDiseases.values()) {
      const citizens = citizenSystem.getAllCitizens().filter(c => c.isAlive);
      
      // Verbreitung der Krankheit
      for (const citizen of citizens) {
        // Bereits krank?
        if (disease.affectedCitizenIds.has(citizen.id)) {
          // Genesungschance oder Tod
          const recoveryChance = citizen.health.immunity / 100;
          
          if (Math.random() < recoveryChance) {
            // Geheilt
            disease.affectedCitizenIds.delete(citizen.id);
            citizen.health.diseases = citizen.health.diseases.filter(d => d !== disease.name);
            
            if (disease.immunity) {
              citizen.health.immunity = Math.min(100, citizen.health.immunity + 20);
            }
            
            citizen.lifeEvents.push({
              year,
              month,
              type: 'recovery',
              description: `Genesen von ${disease.name}`
            });
          } else if (Math.random() * 100 < disease.mortalityRate) {
            // Tod durch Krankheit
            this.killCitizen(citizen, year, month, disease.name);
            this.deathsThisYear++;
            disease.affectedCitizenIds.delete(citizen.id);
          }
        } else {
          // Ansteckungschance
          const hasImmunity = disease.immunity && 
            citizen.lifeEvents.some(e => 
              e.type === 'recovery' && e.description.includes(disease.name)
            );
          
          if (!hasImmunity) {
            const infectionChance = (disease.contagiousness / 100) * (1 - citizen.health.immunity / 100);
            
            if (Math.random() < infectionChance / 100) {
              disease.affectedCitizenIds.add(citizen.id);
              citizen.health.diseases.push(disease.name);
              citizen.health.overall = Math.max(0, citizen.health.overall - 20);
              
              citizen.lifeEvents.push({
                year,
                month,
                type: 'illness',
                description: `Erkrankt an ${disease.name}`
              });
            }
          }
        }
      }
    }
  }
  
  /**
   * Startet eine Hungersnot in einer Region
   */
  public startFamine(
    regionId: string,
    severity: number,
    year: number,
    month: number,
    duration: number
  ): Famine {
    const famine: Famine = {
      id: `famine_${Date.now()}_${Math.random()}`,
      regionId,
      severity,
      startYear: year,
      startMonth: month,
      duration,
      active: true
    };
    
    this.activeFamines.set(famine.id, famine);
    return famine;
  }
  
  /**
   * Verarbeitet Hungersnöte
   */
  private processFamines(
    citizenSystem: CitizenSystem,
    year: number,
    month: number
  ): void {
    for (const famine of this.activeFamines.values()) {
      if (!famine.active) continue;
      
      // Dauer prüfen
      const monthsPassed = (year - famine.startYear) * 12 + (month - famine.startMonth);
      if (monthsPassed >= famine.duration) {
        famine.active = false;
        continue;
      }
      
      // Betroffene Bürger
      const affectedCitizens = citizenSystem.getCitizensByRegion(famine.regionId)
        .filter(c => c.isAlive);
      
      for (const citizen of affectedCitizens) {
        // Nahrungsbedürfnis stark reduzieren
        citizen.needs.food = Math.max(0, citizen.needs.food - (famine.severity / 10));
        
        // Erhöhte Sterblichkeit
        if (citizen.needs.food < 10) {
          const deathChance = (famine.severity / 100) * 0.1; // 10% bei Schweregrad 100
          if (Math.random() < deathChance) {
            this.killCitizen(citizen, year, month, 'hunger');
            this.deathsThisYear++;
          }
        }
      }
    }
  }
  
  /**
   * Holt alle aktiven Epidemien
   */
  public getActiveDiseases(): Disease[] {
    return Array.from(this.activeDiseases.values());
  }
  
  /**
   * Holt alle aktiven Hungersnöte
   */
  public getActiveFamines(): Famine[] {
    return Array.from(this.activeFamines.values()).filter(f => f.active);
  }
  
  /**
   * Beendet eine Epidemie
   */
  public endEpidemic(diseaseId: string): void {
    this.activeDiseases.delete(diseaseId);
  }
  
  /**
   * Beendet eine Hungersnot
   */
  public endFamine(famineId: string): void {
    const famine = this.activeFamines.get(famineId);
    if (famine) {
      famine.active = false;
    }
  }
}
