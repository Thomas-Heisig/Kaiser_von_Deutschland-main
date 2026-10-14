// src/core/CharacterCreationWizard.ts

import { Citizen, CitizenSystem, Profession, PersonalityTraits } from './CitizenSystem';

/**
 * Charakter-Hintergrund
 */
export interface CharacterBackground {
  type: 'noble' | 'merchant' | 'craftsman' | 'peasant' | 'scholar' | 'soldier' | 'clergy';
  description: string;
  startingWealth: number;
  startingReputation: number;
  socialClass: 'royal' | 'noble' | 'middle' | 'peasant';
  defaultProfession: Profession;
  skillBonuses: Partial<Record<keyof Citizen['skills'], number>>;
}

/**
 * Fähigkeiten-Verteilung
 */
export interface SkillDistribution {
  agriculture: number;
  combat: number;
  craftsmanship: number;
  diplomacy: number;
  leadership: number;
  literacy: number;
  medicine: number;
  trading: number;
}

/**
 * Charakter-Erstellungs-Daten
 */
export interface CharacterCreationData {
  // Basis-Informationen
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  age: number;
  
  // Hintergrund
  background: CharacterBackground;
  
  // Persönlichkeit
  personality: PersonalityTraits;
  
  // Fähigkeiten
  skills: SkillDistribution;
  
  // Optionale Felder
  regionId?: string;
  customProfession?: Profession;
}

/**
 * Charakter-Erstellungs-Assistent
 */
export class CharacterCreationWizard {
  private static readonly AVAILABLE_BACKGROUNDS: CharacterBackground[] = [
    {
      type: 'noble',
      description: 'Geboren in den Adel, mit Privilegien und Verantwortung',
      startingWealth: 10000,
      startingReputation: 75,
      socialClass: 'noble',
      defaultProfession: 'noble',
      skillBonuses: {
        leadership: 20,
        diplomacy: 15,
        literacy: 15
      }
    },
    {
      type: 'merchant',
      description: 'Kaufmannsfamilie, geschickt im Handel',
      startingWealth: 2000,
      startingReputation: 40,
      socialClass: 'middle',
      defaultProfession: 'merchant',
      skillBonuses: {
        trading: 25,
        literacy: 15,
        diplomacy: 10
      }
    },
    {
      type: 'craftsman',
      description: 'Handwerker-Familie, Meister ihres Fachs',
      startingWealth: 500,
      startingReputation: 30,
      socialClass: 'middle',
      defaultProfession: 'artisan',
      skillBonuses: {
        craftsmanship: 30,
        trading: 10
      }
    },
    {
      type: 'peasant',
      description: 'Einfache Bauernfamilie, hart arbeitend',
      startingWealth: 100,
      startingReputation: 10,
      socialClass: 'peasant',
      defaultProfession: 'farmer',
      skillBonuses: {
        agriculture: 25,
        craftsmanship: 10
      }
    },
    {
      type: 'scholar',
      description: 'Gelehrte Familie, dem Wissen verschrieben',
      startingWealth: 800,
      startingReputation: 50,
      socialClass: 'middle',
      defaultProfession: 'scholar',
      skillBonuses: {
        literacy: 30,
        medicine: 15,
        diplomacy: 10
      }
    },
    {
      type: 'soldier',
      description: 'Militärische Familie, kampferprobt',
      startingWealth: 300,
      startingReputation: 35,
      socialClass: 'peasant',
      defaultProfession: 'soldier',
      skillBonuses: {
        combat: 30,
        leadership: 15
      }
    },
    {
      type: 'clergy',
      description: 'Religiöse Familie, dem Glauben gewidmet',
      startingWealth: 600,
      startingReputation: 45,
      socialClass: 'middle',
      defaultProfession: 'clergy',
      skillBonuses: {
        literacy: 20,
        diplomacy: 15,
        medicine: 10
      }
    }
  ];
  
  private static readonly TOTAL_SKILL_POINTS = 120;
  private static readonly TOTAL_PERSONALITY_POINTS = 400;
  
  /**
   * Holt verfügbare Hintergründe
   */
  public static getAvailableBackgrounds(): CharacterBackground[] {
    return [...this.AVAILABLE_BACKGROUNDS];
  }
  
  /**
   * Validiert Charakter-Erstellungs-Daten
   */
  public static validateCreationData(data: CharacterCreationData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Name validieren
    if (!data.firstName || data.firstName.length < 2) {
      errors.push('Vorname muss mindestens 2 Zeichen lang sein');
    }
    if (!data.lastName || data.lastName.length < 2) {
      errors.push('Nachname muss mindestens 2 Zeichen lang sein');
    }
    
    // Alter validieren
    if (data.age < 16 || data.age > 80) {
      errors.push('Alter muss zwischen 16 und 80 Jahren liegen');
    }
    
    // Fähigkeiten validieren
    const totalSkills = Object.values(data.skills).reduce((sum, val) => sum + val, 0);
    if (totalSkills > this.TOTAL_SKILL_POINTS) {
      errors.push(`Zu viele Fähigkeitspunkte verwendet (${totalSkills}/${this.TOTAL_SKILL_POINTS})`);
    }
    
    // Alle Fähigkeiten zwischen 0 und 100
    for (const [skill, value] of Object.entries(data.skills)) {
      if (value < 0 || value > 100) {
        errors.push(`${skill} muss zwischen 0 und 100 liegen`);
      }
    }
    
    // Persönlichkeit validieren
    const totalPersonality = Object.values(data.personality).reduce((sum, val) => sum + val, 0);
    if (totalPersonality > this.TOTAL_PERSONALITY_POINTS) {
      errors.push(`Zu viele Persönlichkeitspunkte verwendet (${totalPersonality}/${this.TOTAL_PERSONALITY_POINTS})`);
    }
    
    // Alle Persönlichkeitsmerkmale zwischen 0 und 100
    for (const [trait, value] of Object.entries(data.personality)) {
      if (value < 0 || value > 100) {
        errors.push(`${trait} muss zwischen 0 und 100 liegen`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Erstellt einen Charakter basierend auf den Erstellungs-Daten
   */
  public static createCharacter(
    data: CharacterCreationData,
    citizenSystem: CitizenSystem,
    currentYear: number
  ): Citizen | null {
    // Validierung
    const validation = this.validateCreationData(data);
    if (!validation.valid) {
      console.error('Charakter-Erstellung fehlgeschlagen:', validation.errors);
      return null;
    }
    
    // Profession bestimmen
    const profession = data.customProfession || data.background.defaultProfession;
    
    // Region bestimmen (Standard: erste Region oder bereitgestellt)
    const regionId = data.regionId || 'region_1';
    
    // Fähigkeiten mit Hintergrund-Boni kombinieren
    const finalSkills: SkillDistribution = { ...data.skills };
    for (const [skill, bonus] of Object.entries(data.background.skillBonuses)) {
      const skillKey = skill as keyof SkillDistribution;
      finalSkills[skillKey] = Math.min(100, finalSkills[skillKey] + (bonus || 0));
    }
    
    // Neuen Bürger erstellen
    const citizen = citizenSystem.createCitizen({
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      age: data.age,
      profession,
      regionId,
      socialClass: data.background.socialClass,
      birthYear: currentYear - data.age,
      birthMonth: Math.floor(Math.random() * 12) + 1
    });
    
    // Nachträglich Eigenschaften setzen, die nicht im Constructor verfügbar sind
    citizen.wealth = data.background.startingWealth;
    citizen.reputation = data.background.startingReputation;
    citizen.personality = data.personality;
    citizen.skills = finalSkills as any; // Type assertion needed here
    
    return citizen;
  }
  
  /**
   * Generiert Standard-Persönlichkeit basierend auf Hintergrund
   */
  public static generateDefaultPersonality(background: CharacterBackground): PersonalityTraits {
    const personality: PersonalityTraits = {
      courage: 50,
      intelligence: 50,
      charisma: 50,
      ambition: 50,
      loyalty: 50,
      creativity: 50,
      discipline: 50,
      compassion: 50
    };
    
    switch (background.type) {
      case 'noble':
        personality.charisma = 70;
        personality.ambition = 70;
        personality.intelligence = 65;
        break;
      case 'merchant':
        personality.intelligence = 65;
        personality.charisma = 60;
        personality.ambition = 70;
        break;
      case 'craftsman':
        personality.discipline = 70;
        personality.creativity = 65;
        personality.loyalty = 70;
        break;
      case 'peasant':
        personality.discipline = 65;
        personality.loyalty = 70;
        personality.compassion = 60;
        break;
      case 'scholar':
        personality.intelligence = 80;
        personality.creativity = 65;
        personality.discipline = 75;
        break;
      case 'soldier':
        personality.courage = 75;
        personality.discipline = 70;
        personality.loyalty = 65;
        break;
      case 'clergy':
        personality.compassion = 75;
        personality.intelligence = 70;
        personality.discipline = 65;
        break;
    }
    
    return personality;
  }
  
  /**
   * Generiert Standard-Fähigkeiten basierend auf Hintergrund
   */
  public static generateDefaultSkills(background: CharacterBackground): SkillDistribution {
    const skills: SkillDistribution = {
      agriculture: 10,
      combat: 10,
      craftsmanship: 10,
      diplomacy: 10,
      leadership: 10,
      literacy: 10,
      medicine: 10,
      trading: 10
    };
    
    // Wende Boni an
    for (const [skill, bonus] of Object.entries(background.skillBonuses)) {
      const skillKey = skill as keyof SkillDistribution;
      skills[skillKey] = Math.min(100, skills[skillKey] + (bonus || 0));
    }
    
    return skills;
  }
  
  /**
   * Generiert zufälligen Charakter
   */
  public static generateRandomCharacter(
    gender?: 'male' | 'female',
    background?: CharacterBackground
  ): Omit<CharacterCreationData, 'regionId'> {
    const randomGender = gender || (Math.random() > 0.5 ? 'male' : 'female');
    const randomBackground = background || this.AVAILABLE_BACKGROUNDS[
      Math.floor(Math.random() * this.AVAILABLE_BACKGROUNDS.length)
    ];
    
    const firstNames = randomGender === 'male'
      ? ['Hans', 'Friedrich', 'Karl', 'Wilhelm', 'Heinrich', 'Otto', 'Ludwig', 'Albrecht']
      : ['Anna', 'Maria', 'Elisabeth', 'Katharina', 'Margarete', 'Sophie', 'Dorothea', 'Johanna'];
    
    const lastNames = [
      'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner',
      'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Bauer', 'Richter', 'Klein'
    ];
    
    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      gender: randomGender,
      age: 18 + Math.floor(Math.random() * 30), // 18-48
      background: randomBackground,
      personality: this.generateDefaultPersonality(randomBackground),
      skills: this.generateDefaultSkills(randomBackground)
    };
  }
  
  /**
   * Holt verbleibende Fähigkeitspunkte
   */
  public static getRemainingSkillPoints(skills: SkillDistribution): number {
    const used = Object.values(skills).reduce((sum, val) => sum + val, 0);
    return this.TOTAL_SKILL_POINTS - used;
  }
  
  /**
   * Holt verbleibende Persönlichkeitspunkte
   */
  public static getRemainingPersonalityPoints(personality: PersonalityTraits): number {
    const used = Object.values(personality).reduce((sum, val) => sum + val, 0);
    return this.TOTAL_PERSONALITY_POINTS - used;
  }
  
  /**
   * Holt alle verfügbaren Berufe
   */
  public static getAvailableProfessions(): Profession[] {
    return [
      'farmer',
      'artisan',
      'merchant',
      'soldier',
      'scholar',
      'clergy',
      'noble',
      'servant',
      'laborer',
      'miner',
      'fisherman',
      'blacksmith',
      'carpenter',
      'weaver',
      'baker',
      'brewer'
    ];
  }
}
