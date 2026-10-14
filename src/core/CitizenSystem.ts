// src/core/CitizenSystem.ts

import { v4 as uuidv4 } from 'uuid';

// Migration constants
const MIGRATION_DESIRE_CONSTANTS = {
  UNHAPPY_INCREASE: 10,
  HAPPY_DECREASE: 5,
  YOUNG_ADULT_BONUS: 3,
  FAMILY_PENALTY: 5,
  UNHAPPY_THRESHOLD: 50,
  HAPPY_THRESHOLD: 70,
  LOW_ATTRACTIVENESS_THRESHOLD: 40,
  HIGH_ATTRACTIVENESS_THRESHOLD: 60,
  YOUNG_ADULT_MIN_AGE: 18,
  YOUNG_ADULT_MAX_AGE: 35,
  FAMILY_THRESHOLD: 3
} as const;

/**
 * Beruf eines Bürgers
 */
export type Profession = 
  | 'farmer' // Bauer
  | 'artisan' // Handwerker
  | 'merchant' // Händler
  | 'soldier' // Soldat
  | 'scholar' // Gelehrter
  | 'clergy' // Geistlicher
  | 'noble' // Adeliger
  | 'servant' // Diener
  | 'laborer' // Arbeiter
  | 'miner' // Bergmann
  | 'fisherman' // Fischer
  | 'blacksmith' // Schmied
  | 'carpenter' // Zimmermann
  | 'weaver' // Weber
  | 'baker' // Bäcker
  | 'brewer' // Brauer
  | 'unemployed'; // Arbeitslos

/**
 * Bedürfnisse eines Bürgers
 */
export interface CitizenNeeds {
  food: number; // 0-100: Nahrung
  shelter: number; // 0-100: Unterkunft
  safety: number; // 0-100: Sicherheit
  health: number; // 0-100: Gesundheit
  social: number; // 0-100: Soziale Bedürfnisse
  spiritual: number; // 0-100: Spirituelle Bedürfnisse
  education: number; // 0-100: Bildung
  entertainment: number; // 0-100: Unterhaltung
}

/**
 * Gesundheitszustand eines Bürgers
 */
export interface HealthStatus {
  overall: number; // 0-100: Allgemeine Gesundheit
  diseases: string[]; // Liste der Krankheiten
  immunity: number; // 0-100: Immunität
  fertility: number; // 0-100: Fruchtbarkeit
  isPregnant?: boolean; // Schwangerschaft
  pregnancyMonth?: number; // Schwangerschaftsmonat (1-9)
}

/**
 * Familienbeziehung
 */
export interface FamilyRelation {
  citizenId: string;
  relationType: 'spouse' | 'parent' | 'child' | 'sibling' | 'grandparent' | 'grandchild';
}

/**
 * Soziale Beziehung
 */
export interface SocialRelation {
  citizenId: string;
  relationType: 'friend' | 'enemy' | 'rival' | 'mentor' | 'student' | 'colleague';
  strength: number; // -100 (Feind) bis +100 (enger Freund)
  since: number; // Jahr der Entstehung
}

/**
 * Persönlichkeitsmerkmale
 */
export interface PersonalityTraits {
  courage: number; // 0-100: Mut
  intelligence: number; // 0-100: Intelligenz
  charisma: number; // 0-100: Charisma
  ambition: number; // 0-100: Ehrgeiz
  loyalty: number; // 0-100: Loyalität
  creativity: number; // 0-100: Kreativität
  discipline: number; // 0-100: Disziplin
  compassion: number; // 0-100: Mitgefühl
}

/**
 * Fähigkeiten eines Bürgers
 */
export interface CitizenSkills {
  agriculture: number; // 0-100: Landwirtschaft
  craftsmanship: number; // 0-100: Handwerk
  trading: number; // 0-100: Handel
  combat: number; // 0-100: Kampf
  literacy: number; // 0-100: Lesen/Schreiben
  leadership: number; // 0-100: Führung
  diplomacy: number; // 0-100: Diplomatie
  medicine: number; // 0-100: Medizin
}

/**
 * Vollständige Bürger-Daten
 */
export interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  age: number; // in Jahren
  birthYear: number;
  birthMonth: number;
  deathYear?: number;
  deathMonth?: number;
  isAlive: boolean;
  
  // Beruf und Status
  profession: Profession;
  professionLevel: number; // 0-100: Erfahrung im Beruf
  income: number; // Monatliches Einkommen
  wealth: number; // Akkumuliertes Vermögen
  
  // Ort
  regionId: string;
  homeId?: string; // ID des Hauses/Gebäudes
  
  // Familie
  familyId?: string; // Dynastie/Familien-ID
  familyRelations: FamilyRelation[];
  
  // Soziales
  socialRelations: SocialRelation[];
  reputation: number; // -100 bis +100
  socialClass: 'peasant' | 'middle' | 'noble' | 'royal';
  
  // Gesundheit und Bedürfnisse
  health: HealthStatus;
  needs: CitizenNeeds;
  happiness: number; // 0-100
  
  // Persönlichkeit und Fähigkeiten
  personality: PersonalityTraits;
  skills: CitizenSkills;
  
  // Spieler-Kontrolle
  controlledByPlayerId?: string; // Optional: Spieler, der diesen Bürger kontrolliert
  isPlayerCharacter: boolean;
  
  // Migration
  migrationDesire: number; // 0-100: Wunsch zu migrieren
  originalRegionId: string;
  
  // Geschichte
  lifeEvents: LifeEvent[];
}

/**
 * Lebensereignis
 */
export interface LifeEvent {
  year: number;
  month: number;
  type: 'birth' | 'death' | 'marriage' | 'divorce' | 'child_born' | 'profession_change' | 
        'migration' | 'illness' | 'recovery' | 'promotion' | 'demotion' | 'achievement' |
        'crime' | 'war' | 'revolution' | 'education';
  description: string;
  relatedCitizenIds?: string[];
}

/**
 * Bürger-System zur Verwaltung aller Bürger
 */
export class CitizenSystem {
  private citizens: Map<string, Citizen> = new Map();
  private families: Map<string, Set<string>> = new Map(); // familyId -> Set<citizenId>
  private regionalCitizens: Map<string, Set<string>> = new Map(); // regionId -> Set<citizenId>
  
  /**
   * Erstellt einen neuen Bürger
   */
  public createCitizen(data: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    age: number;
    birthYear: number;
    birthMonth: number;
    profession: Profession;
    regionId: string;
    socialClass?: 'peasant' | 'middle' | 'noble' | 'royal';
    familyId?: string;
  }): Citizen {
    const citizen: Citizen = {
      id: uuidv4(),
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      age: data.age,
      birthYear: data.birthYear,
      birthMonth: data.birthMonth,
      isAlive: true,
      
      profession: data.profession,
      professionLevel: Math.floor(Math.random() * 30), // Anfänger
      income: this.calculateBaseIncome(data.profession),
      wealth: Math.floor(Math.random() * 100),
      
      regionId: data.regionId,
      originalRegionId: data.regionId,
      
      familyId: data.familyId || uuidv4(),
      familyRelations: [],
      
      socialRelations: [],
      reputation: 50 + Math.floor(Math.random() * 20) - 10,
      socialClass: data.socialClass || 'peasant',
      
      health: this.generateHealthStatus(),
      needs: this.generateNeeds(),
      happiness: 50 + Math.floor(Math.random() * 30),
      
      personality: this.generatePersonality(),
      skills: this.generateSkills(data.profession),
      
      isPlayerCharacter: false,
      migrationDesire: Math.floor(Math.random() * 20),
      
      lifeEvents: [{
        year: data.birthYear,
        month: data.birthMonth,
        type: 'birth',
        description: `Geboren in ${data.regionId}`
      }]
    };
    
    this.citizens.set(citizen.id, citizen);
    this.addToRegion(citizen.id, data.regionId);
    this.addToFamily(citizen.id, citizen.familyId!);
    
    return citizen;
  }
  
  /**
   * Berechnet das Basiseinkommen basierend auf dem Beruf
   */
  private calculateBaseIncome(profession: Profession): number {
    const incomeMap: Record<Profession, number> = {
      farmer: 20,
      artisan: 40,
      merchant: 60,
      soldier: 35,
      scholar: 50,
      clergy: 45,
      noble: 200,
      servant: 15,
      laborer: 25,
      miner: 30,
      fisherman: 22,
      blacksmith: 45,
      carpenter: 40,
      weaver: 35,
      baker: 38,
      brewer: 42,
      unemployed: 5
    };
    
    return incomeMap[profession] || 20;
  }
  
  /**
   * Generiert zufälligen Gesundheitszustand
   */
  private generateHealthStatus(): HealthStatus {
    return {
      overall: 70 + Math.floor(Math.random() * 30),
      diseases: [],
      immunity: 60 + Math.floor(Math.random() * 40),
      fertility: 50 + Math.floor(Math.random() * 50)
    };
  }
  
  /**
   * Generiert zufällige Bedürfnisse
   */
  private generateNeeds(): CitizenNeeds {
    return {
      food: 60 + Math.floor(Math.random() * 30),
      shelter: 70 + Math.floor(Math.random() * 20),
      safety: 60 + Math.floor(Math.random() * 30),
      health: 70 + Math.floor(Math.random() * 30),
      social: 50 + Math.floor(Math.random() * 40),
      spiritual: 40 + Math.floor(Math.random() * 40),
      education: 30 + Math.floor(Math.random() * 50),
      entertainment: 40 + Math.floor(Math.random() * 40)
    };
  }
  
  /**
   * Generiert zufällige Persönlichkeit
   */
  private generatePersonality(): PersonalityTraits {
    return {
      courage: Math.floor(Math.random() * 100),
      intelligence: Math.floor(Math.random() * 100),
      charisma: Math.floor(Math.random() * 100),
      ambition: Math.floor(Math.random() * 100),
      loyalty: Math.floor(Math.random() * 100),
      creativity: Math.floor(Math.random() * 100),
      discipline: Math.floor(Math.random() * 100),
      compassion: Math.floor(Math.random() * 100)
    };
  }
  
  /**
   * Generiert Fähigkeiten basierend auf dem Beruf
   */
  private generateSkills(profession: Profession): CitizenSkills {
    const skills: CitizenSkills = {
      agriculture: 0,
      craftsmanship: 0,
      trading: 0,
      combat: 0,
      literacy: 0,
      leadership: 0,
      diplomacy: 0,
      medicine: 0
    };
    
    // Berufsspezifische Fähigkeiten
    switch (profession) {
      case 'farmer':
        skills.agriculture = 40 + Math.floor(Math.random() * 40);
        break;
      case 'artisan':
      case 'blacksmith':
      case 'carpenter':
      case 'weaver':
        skills.craftsmanship = 40 + Math.floor(Math.random() * 40);
        break;
      case 'merchant':
        skills.trading = 40 + Math.floor(Math.random() * 40);
        skills.literacy = 30 + Math.floor(Math.random() * 40);
        break;
      case 'soldier':
        skills.combat = 40 + Math.floor(Math.random() * 40);
        break;
      case 'scholar':
        skills.literacy = 60 + Math.floor(Math.random() * 40);
        break;
      case 'clergy':
        skills.literacy = 40 + Math.floor(Math.random() * 40);
        skills.medicine = 20 + Math.floor(Math.random() * 30);
        break;
      case 'noble':
        skills.leadership = 40 + Math.floor(Math.random() * 40);
        skills.diplomacy = 30 + Math.floor(Math.random() * 40);
        skills.literacy = 40 + Math.floor(Math.random() * 40);
        break;
    }
    
    return skills;
  }
  
  /**
   * Fügt Bürger zu einer Region hinzu
   */
  private addToRegion(citizenId: string, regionId: string): void {
    if (!this.regionalCitizens.has(regionId)) {
      this.regionalCitizens.set(regionId, new Set());
    }
    this.regionalCitizens.get(regionId)!.add(citizenId);
  }
  
  /**
   * Entfernt Bürger aus einer Region (wird für Migration verwendet)
   */
  public removeFromRegion(citizenId: string, regionId: string): void {
    const citizens = this.regionalCitizens.get(regionId);
    if (citizens) {
      citizens.delete(citizenId);
    }
  }
  
  /**
   * Fügt Bürger zu einer Familie hinzu
   */
  private addToFamily(citizenId: string, familyId: string): void {
    if (!this.families.has(familyId)) {
      this.families.set(familyId, new Set());
    }
    this.families.get(familyId)!.add(citizenId);
  }
  
  /**
   * Holt einen Bürger nach ID
   */
  public getCitizen(citizenId: string): Citizen | undefined {
    return this.citizens.get(citizenId);
  }
  
  /**
   * Holt alle Bürger
   */
  public getAllCitizens(): Citizen[] {
    return Array.from(this.citizens.values());
  }
  
  /**
   * Holt alle lebenden Bürger (optimiert für häufige Abfragen)
   */
  public getAliveCitizens(): Citizen[] {
    return Array.from(this.citizens.values()).filter(c => c.isAlive);
  }
  
  /**
   * Holt alle Bürger einer Region
   */
  public getCitizensByRegion(regionId: string): Citizen[] {
    const citizenIds = this.regionalCitizens.get(regionId);
    if (!citizenIds) return [];
    
    return Array.from(citizenIds)
      .map(id => this.citizens.get(id))
      .filter((c): c is Citizen => c !== undefined);
  }
  
  /**
   * Holt alle Mitglieder einer Familie
   */
  public getFamilyMembers(familyId: string): Citizen[] {
    const citizenIds = this.families.get(familyId);
    if (!citizenIds) return [];
    
    return Array.from(citizenIds)
      .map(id => this.citizens.get(id))
      .filter((c): c is Citizen => c !== undefined);
  }
  
  /**
   * Zählt lebende Bürger
   */
  public getPopulation(): number {
    return Array.from(this.citizens.values()).filter(c => c.isAlive).length;
  }
  
  /**
   * Zählt Bevölkerung nach Region
   */
  public getRegionalPopulation(regionId: string): number {
    return this.getCitizensByRegion(regionId).filter(c => c.isAlive).length;
  }
  
  /**
   * Erlaubt einem Spieler, einen Bürger zu übernehmen
   */
  public assignPlayerControl(citizenId: string, playerId: string): boolean {
    const citizen = this.citizens.get(citizenId);
    if (!citizen || !citizen.isAlive) return false;
    
    citizen.controlledByPlayerId = playerId;
    citizen.isPlayerCharacter = true;
    
    return true;
  }
  
  /**
   * Entfernt Spielerkontrolle von einem Bürger
   */
  public removePlayerControl(citizenId: string): boolean {
    const citizen = this.citizens.get(citizenId);
    if (!citizen) return false;
    
    citizen.controlledByPlayerId = undefined;
    citizen.isPlayerCharacter = false;
    
    return true;
  }
  
  /**
   * Holt alle Bürger, die von einem Spieler kontrolliert werden
   */
  public getPlayerControlledCitizens(playerId: string): Citizen[] {
    return Array.from(this.citizens.values())
      .filter(c => c.controlledByPlayerId === playerId && c.isAlive);
  }
  
  /**
   * Aktualisiert einen Bürger mit partiellen Updates
   */
  public updateCitizen(citizenId: string, updates: Partial<Citizen>): boolean {
    const citizen = this.citizens.get(citizenId);
    if (!citizen) return false;
    
    Object.assign(citizen, updates);
    return true;
  }
  
  /**
   * Verarbeitet monatliche Updates für alle Bürger
   */
  public processMonth(currentYear: number, currentMonth: number): void {
    for (const citizen of this.citizens.values()) {
      if (!citizen.isAlive) continue;
      
      // Altern (einmal pro Jahr)
      if (currentMonth === citizen.birthMonth) {
        citizen.age++;
      }
      
      // Bedürfnisse leicht abnehmen
      this.updateNeeds(citizen);
      
      // Gesundheit aktualisieren
      this.updateHealth(citizen);
      
      // Glück basierend auf Bedürfnissen berechnen
      this.updateHappiness(citizen);
      
      // Schwangerschaft verarbeiten
      if (citizen.health.isPregnant && citizen.health.pregnancyMonth !== undefined) {
        citizen.health.pregnancyMonth++;
        if (citizen.health.pregnancyMonth >= 9) {
          this.giveBirth(citizen, currentYear, currentMonth);
        }
      }
    }
  }
  
  /**
   * Aktualisiert Bedürfnisse eines Bürgers
   */
  private updateNeeds(citizen: Citizen): void {
    // Bedürfnisse nehmen leicht ab
    citizen.needs.food = Math.max(0, citizen.needs.food - Math.random() * 5);
    citizen.needs.shelter = Math.max(0, citizen.needs.shelter - Math.random() * 2);
    citizen.needs.safety = Math.max(0, citizen.needs.safety - Math.random() * 3);
    citizen.needs.health = Math.max(0, citizen.needs.health - Math.random() * 3);
    citizen.needs.social = Math.max(0, citizen.needs.social - Math.random() * 4);
    citizen.needs.spiritual = Math.max(0, citizen.needs.spiritual - Math.random() * 2);
    citizen.needs.education = Math.max(0, citizen.needs.education - Math.random() * 1);
    citizen.needs.entertainment = Math.max(0, citizen.needs.entertainment - Math.random() * 4);
  }
  
  /**
   * Aktualisiert Gesundheit eines Bürgers
   */
  private updateHealth(citizen: Citizen): void {
    // Gesundheit basiert auf Bedürfnissen
    const needsSatisfaction = (citizen.needs.food + citizen.needs.health + citizen.needs.shelter) / 3;
    
    if (needsSatisfaction < 30) {
      citizen.health.overall = Math.max(0, citizen.health.overall - Math.random() * 5);
    } else if (needsSatisfaction > 70) {
      citizen.health.overall = Math.min(100, citizen.health.overall + Math.random() * 2);
    }
    
    // Altersabhängige Gesundheit
    if (citizen.age > 60) {
      citizen.health.overall = Math.max(0, citizen.health.overall - Math.random() * 2);
    }
  }
  
  /**
   * Aktualisiert Glück eines Bürgers
   */
  private updateHappiness(citizen: Citizen): void {
    const avgNeeds = Object.values(citizen.needs).reduce((a, b) => a + b, 0) / Object.keys(citizen.needs).length;
    citizen.happiness = Math.floor((avgNeeds + citizen.health.overall + citizen.reputation) / 3);
  }
  
  /**
   * Geburt eines Kindes
   */
  private giveBirth(mother: Citizen, year: number, month: number): void {
    mother.health.isPregnant = false;
    mother.health.pregnancyMonth = undefined;
    
    // Kind wird noch implementiert (benötigt Partner-Logik)
    const event: LifeEvent = {
      year,
      month,
      type: 'child_born',
      description: 'Kind geboren'
    };
    mother.lifeEvents.push(event);
  }
  
  /**
   * Migriert einen Bürger von einer Region zu einer anderen
   */
  public migrateCitizen(citizenId: string, toRegionId: string, year: number, month: number, reason: string): boolean {
    const citizen = this.citizens.get(citizenId);
    if (!citizen || !citizen.isAlive) return false;
    
    const fromRegionId = citizen.regionId;
    
    // Update regional tracking
    this.removeFromRegion(citizenId, fromRegionId);
    this.addToRegion(citizenId, toRegionId);
    
    // Update citizen
    citizen.regionId = toRegionId;
    citizen.migrationDesire = Math.max(0, citizen.migrationDesire - 50); // Reset desire
    
    // Record event
    const event: LifeEvent = {
      year,
      month,
      type: 'migration',
      description: `Migrierte von ${fromRegionId} nach ${toRegionId} wegen ${reason}`
    };
    citizen.lifeEvents.push(event);
    
    return true;
  }
  
  /**
   * Holt Bürger mit hohem Migrationswunsch aus einer Region
   */
  public getMigrationCandidates(regionId: string, count: number): Citizen[] {
    const regionCitizens = this.getCitizensByRegion(regionId)
      .filter(c => c.isAlive && !c.isPlayerCharacter); // Don't migrate player characters
    
    // Sort by migration desire and take top candidates
    return regionCitizens
      .sort((a, b) => b.migrationDesire - a.migrationDesire)
      .slice(0, count);
  }
  
  /**
   * Aktualisiert den Migrationswunsch basierend auf Bedürfnissen
   */
  public updateMigrationDesires(regionId: string, attractiveness: number): void {
    const citizens = this.getCitizensByRegion(regionId);
    
    for (const citizen of citizens) {
      if (!citizen.isAlive || citizen.isPlayerCharacter) continue;
      
      // Lower attractiveness increases migration desire
      const avgNeeds = Object.values(citizen.needs).reduce((a, b) => a + b, 0) / Object.keys(citizen.needs).length;
      
      // If needs are not met or attractiveness is low, increase migration desire
      if (avgNeeds < MIGRATION_DESIRE_CONSTANTS.UNHAPPY_THRESHOLD || 
          attractiveness < MIGRATION_DESIRE_CONSTANTS.LOW_ATTRACTIVENESS_THRESHOLD) {
        citizen.migrationDesire = Math.min(100, 
          citizen.migrationDesire + Math.random() * MIGRATION_DESIRE_CONSTANTS.UNHAPPY_INCREASE
        );
      } else if (avgNeeds > MIGRATION_DESIRE_CONSTANTS.HAPPY_THRESHOLD && 
                 attractiveness > MIGRATION_DESIRE_CONSTANTS.HIGH_ATTRACTIVENESS_THRESHOLD) {
        // If happy and region is good, decrease migration desire
        citizen.migrationDesire = Math.max(0, 
          citizen.migrationDesire - Math.random() * MIGRATION_DESIRE_CONSTANTS.HAPPY_DECREASE
        );
      }
      
      // Age factor: young adults more likely to migrate
      if (citizen.age >= MIGRATION_DESIRE_CONSTANTS.YOUNG_ADULT_MIN_AGE && 
          citizen.age <= MIGRATION_DESIRE_CONSTANTS.YOUNG_ADULT_MAX_AGE) {
        citizen.migrationDesire = Math.min(100, 
          citizen.migrationDesire + Math.random() * MIGRATION_DESIRE_CONSTANTS.YOUNG_ADULT_BONUS
        );
      }
      
      // Family factor: people with families less likely to migrate
      if (citizen.familyRelations.length > MIGRATION_DESIRE_CONSTANTS.FAMILY_THRESHOLD) {
        citizen.migrationDesire = Math.max(0, 
          citizen.migrationDesire - Math.random() * MIGRATION_DESIRE_CONSTANTS.FAMILY_PENALTY
        );
      }
    }
  }
  
  /**
   * Ändert den Beruf eines Bürgers
   */
  public changeProfession(
    citizenId: string, 
    newProfession: Profession, 
    year: number, 
    month: number,
    reason: string = 'Karrierewechsel'
  ): boolean {
    const citizen = this.citizens.get(citizenId);
    if (!citizen || !citizen.isAlive) return false;
    
    const oldProfession = citizen.profession;
    citizen.profession = newProfession;
    citizen.professionLevel = 0; // Start at beginner level in new profession
    citizen.income = this.calculateBaseIncome(newProfession);
    
    // Record life event
    const event: LifeEvent = {
      year,
      month,
      type: 'profession_change',
      description: `Berufswechsel von ${oldProfession} zu ${newProfession} - ${reason}`
    };
    citizen.lifeEvents.push(event);
    
    return true;
  }
  
  /**
   * Holt Statistiken über Berufsverteilung
   */
  public getProfessionDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();
    
    for (const citizen of this.citizens.values()) {
      if (!citizen.isAlive) continue;
      
      const count = distribution.get(citizen.profession) || 0;
      distribution.set(citizen.profession, count + 1);
    }
    
    return distribution;
  }
  
  /**
   * Berechnet durchschnittliche Werte für die Bevölkerung
   */
  public getAverageStats(): {
    education: number;
    wealth: number;
    connections: number;
    age: number;
  } {
    const aliveCitizens = this.getAliveCitizens();
    if (aliveCitizens.length === 0) {
      return { education: 50, wealth: 1000, connections: 50, age: 30 };
    }
    
    let totalEducation = 0;
    let totalWealth = 0;
    let totalConnections = 0;
    let totalAge = 0;
    
    for (const citizen of aliveCitizens) {
      totalEducation += citizen.skills.literacy;
      totalWealth += citizen.wealth;
      totalConnections += citizen.socialRelations.length * 10; // Rough estimate
      totalAge += citizen.age;
    }
    
    const count = aliveCitizens.length;
    return {
      education: totalEducation / count,
      wealth: totalWealth / count,
      connections: totalConnections / count,
      age: totalAge / count
    };
  }
  
  /**
   * Löscht alle Bürger (für Tests oder Neubeginn)
   */
  public clear(): void {
    this.citizens.clear();
    this.families.clear();
    this.regionalCitizens.clear();
  }
}
