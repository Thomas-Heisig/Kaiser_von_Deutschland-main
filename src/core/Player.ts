// src/core/Player.ts
import { Kingdom, KingdomConfig } from './Kingdom';
import { v4 as uuidv4 } from 'uuid';
import achievementsData from '../data/json/achievements.json';

export type Gender = 'male' | 'female' | 'other' | 'royal_blood' | 'noble_lineage';
export type PlayerStatus = 'alive' | 'wounded' | 'ill' | 'incapacitated' | 'deceased';
export type EducationLevel = 'uneducated' | 'basic' | 'scholarly' | 'university' | 'royal_tutor';
export type MarriageStatus = 'single' | 'married' | 'widowed' | 'divorced' | 'betrothed';

export interface PlayerStats {
  // Soziale Fähigkeiten
  diplomacy: number;        // 0-100: Verhandlungsgeschick
  intrigue: number;         // 0-100: Intrigen und Spionage
  stewardship: number;      // 0-100: Verwaltungskompetenz
  martial: number;          // 0-100: Militärische Fähigkeiten
  learning: number;         // 0-100: Gelehrsamkeit
  
  // Persönliche Eigenschaften
  charisma: number;         // 0-100: Ausstrahlung und Überzeugungskraft
  wisdom: number;          // 0-100: Weisheit und Urteilsvermögen
  courage: number;         // 0-100: Mut und Entschlossenheit
  patience: number;        // 0-100: Geduld und Ausdauer
  ambition: number;        // 0-100: Ehrgeiz und Zielstrebigkeit
  
  // Moral und Glaube
  piety: number;           // 0-100: Religiosität
  honor: number;          // 0-100: Ehrgefühl und Anstand
  generosity: number;     // 0-100: Großzügigkeit
  loyalty: number;        // 0-100: Loyalität zu Verbündeten
  
  // Reputation
  prestige: number;        // 0-1000: Ansehen in der Welt
  popularity: number;      // 0-100: Beliebtheit beim Volk
  authority: number;       // 0-100: Autorität und Durchsetzungsvermögen
  legitimacy: number;      // 0-100: Legitimität der Herrschaft
  
  // Negative Eigenschaften
  corruption: number;      // 0-100: Bestechlichkeit und Vetternwirtschaft
  tyranny: number;         // 0-100: Grausamkeit und Willkür
  paranoia: number;       // 0-100: Misstrauen und Verfolgungswahn
  greed: number;          // 0-100: Gier und Habsucht
  
  // Gesundheit
  health: number;         // 0-100: Körperliche Gesundheit
  fertility: number;      // 0-100: Fruchtbarkeit (für Dynastie)
  age: number;           // Alter in Jahren
}

export interface PlayerTraits {
  // Positive Eigenschaften
  just: boolean;          // Gerecht
  charitable: boolean;    // Wohltätig
  diligent: boolean;      // Fleißig
  brave: boolean;        // Tapfer
  temperate: boolean;    // Mäßig
  
  // Negative Eigenschaften
  cruel: boolean;        // Grausam
  arbitrary: boolean;    // Willkürlich
  paranoid: boolean;     // Paranoisch
  slothful: boolean;     // Faul
  gluttonous: boolean;   // Gefräßig
  
  // Spezielle Eigenschaften
  genius: boolean;       // Genial
  quick: boolean;        // Schnell lernend
  strong: boolean;       // Körperlich stark
  attractive: boolean;   // Attraktiv
  hale: boolean;         // Robust und gesund
}

export interface PlayerCreationData {
  name: string;
  gender: Gender;
  kingdomName: string;
  difficulty?: number;
  
  // Optionale Starteigenschaften
  dynastyName?: string;
  fatherName?: string;
  motherName?: string;
  birthYear?: number;
  education?: EducationLevel;
  
  // Startwerte
  startingStats?: Partial<PlayerStats>;
  startingTraits?: Partial<PlayerTraits>;
  
  // Visuelle Eigenschaften
  portraitSeed?: string;
  coatOfArms?: string;
}

export interface PlayerTitle {
  name: string;
  rank: number;
  requirements: {
    prestige: number;
    authority: number;
    kingdomScore?: number;
    specialConditions?: string[];
  };
  benefits: {
    goldPerYear: number;
    authorityBonus: number;
    prestigeBonus: number;
    specialPrivileges?: string[];
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'military' | 'economic' | 'diplomatic' | 'cultural' | 'personal';
  prestigeReward: number;
  goldReward?: number;
  unlockConditions: {
    statRequirements?: Partial<PlayerStats>;
    kingdomRequirements?: {
      minScore?: number;
      minYear?: number;
      buildings?: Record<string, number>;
    };
    specialConditions?: string[];
  };
  unlockedAt?: Date;
  isSecret?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'artifact' | 'document' | 'treasure' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description: string;
  effects?: {
    statBonuses?: Partial<PlayerStats>;
    kingdomEffects?: {
      happiness?: number;
      stability?: number;
      production?: Record<string, number>;
    };
    specialAbilities?: string[];
  };
  value: number;
  weight: number;
  acquiredAt: Date;
}

export interface Alliance {
  id: string;
  name: string;
  type: 'marriage' | 'military' | 'trade' | 'defensive' | 'dynastic';
  partnerId: string;
  strength: number; // 0-100: Stärke des Bündnisses
  establishedAt: Date;
  terms: {
    mutualDefense: boolean;
    tradeBenefits: boolean;
    militaryAccess: boolean;
    tribute?: number;
  };
}

export interface PlayerFamily {
  spouse?: {
    id: string;
    name: string;
    stats: Partial<PlayerStats>;
    traits: Partial<PlayerTraits>;
  };
  children: Array<{
    id: string;
    name: string;
    age: number;
    gender: Gender;
    education: EducationLevel;
    stats: Partial<PlayerStats>;
    traits: Partial<PlayerTraits>;
  }>;
  dynastyMembers: Array<{
    id: string;
    name: string;
    relation: string;
    loyalty: number;
    position?: string;
  }>;
}

export interface PlayerSaveData {
  id: string;
  name: string;
  gender: Gender;
  kingdom: any;
  title: PlayerTitle;
  stats: PlayerStats;
  traits: PlayerTraits;
  achievements: Achievement[];
  inventory: InventoryItem[];
  family: PlayerFamily;
  alliances: Alliance[];
  status: PlayerStatus;
  marriageStatus: MarriageStatus;
  education: EducationLevel;
  createdAt: string;
  lastPlayed: string;
  dynastyName?: string;
  portraitSeed?: string;
  coatOfArms?: string;
}

export class Player {
  // Identifikation
  public id: string;
  public name: string;
  public gender: Gender;
  public status: PlayerStatus = 'alive';
  public marriageStatus: MarriageStatus = 'single';
  public education: EducationLevel = 'basic';
  
  // Herrschaft
  public kingdom: Kingdom;
  public title: PlayerTitle;
  public stats: PlayerStats;
  public traits: PlayerTraits;
  
  // Fortschritt
  public achievements: Achievement[] = [];
  public inventory: InventoryItem[] = [];
  public family: PlayerFamily = { children: [], dynastyMembers: [] };
  public alliances: Alliance[] = [];
  
  // Meta-Daten
  public readonly createdAt: Date;
  public lastPlayed: Date;
  public dynastyName?: string;
  public portraitSeed: string;
  public coatOfArms?: string;
  
  // Temporäre Modifikatoren
  private temporaryModifiers: Array<{
    source: string;
    type: 'stat' | 'trait' | 'ability';
    modifier: any;
    expiresAt?: Date;
  }> = [];

  constructor(data: PlayerCreationData) {
    this.id = uuidv4();
    this.name = data.name;
    this.gender = data.gender;
    this.dynastyName = data.dynastyName;
    this.portraitSeed = data.portraitSeed || this.generatePortraitSeed();
    this.coatOfArms = data.coatOfArms;
    
    // Königreich erstellen
    const kingdomConfig: KingdomConfig = {
      name: data.kingdomName,
      rulerName: data.name,
      difficulty: data.difficulty || 1,
      foundingYear: data.birthYear || 1
    };
    
    this.kingdom = new Kingdom(kingdomConfig);
    
    // Titel initialisieren
    this.title = this.getStartingTitle();
    
    // Statistiken initialisieren
    this.stats = this.initializeStats(data.startingStats, data.education);
    
    // Eigenschaften initialisieren
    this.traits = this.initializeTraits(data.startingTraits);
    
    // Metadaten
    this.createdAt = new Date();
    this.lastPlayed = new Date();
    
    // Anfangserfolge vergeben
    this.grantStartingAchievements();
    
    // Anfangsinventar
    this.initializeInventory();
  }

  private generatePortraitSeed(): string {
    const adjectives = ['noble', 'wise', 'bold', 'just', 'strong', 'fair', 'stern', 'kind'];
    const nouns = ['lion', 'eagle', 'bear', 'wolf', 'stag', 'fox', 'hawk', 'raven'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdj}_${randomNoun}_${Date.now()}`;
  }

  private getStartingTitle(): PlayerTitle {
    return {
      name: 'Baron',
      rank: 1,
      requirements: {
        prestige: 0,
        authority: 10,
        kingdomScore: 0
      },
      benefits: {
        goldPerYear: 500,
        authorityBonus: 5,
        prestigeBonus: 10,
        specialPrivileges: ['collect_taxes', 'raise_militia']
      }
    };
  }

  private initializeStats(startingStats?: Partial<PlayerStats>, education?: EducationLevel): PlayerStats {
    const baseStats: PlayerStats = {
      // Soziale Fähigkeiten
      diplomacy: 30,
      intrigue: 25,
      stewardship: 35,
      martial: 30,
      learning: 28,
      
      // Persönliche Eigenschaften
      charisma: 32,
      wisdom: 30,
      courage: 35,
      patience: 28,
      ambition: 40,
      
      // Moral und Glaube
      piety: 30,
      honor: 35,
      generosity: 25,
      loyalty: 40,
      
      // Reputation
      prestige: 25,
      popularity: 50,
      authority: 40,
      legitimacy: 60,
      
      // Negative Eigenschaften
      corruption: 10,
      tyranny: 5,
      paranoia: 15,
      greed: 20,
      
      // Gesundheit
      health: 90,
      fertility: 80,
      age: 25
    };

    // Bildungsbonus
    const educationBonus: Record<EducationLevel, Partial<PlayerStats>> = {
      uneducated: { learning: -10, diplomacy: -5 },
      basic: {}, // Kein Bonus
      scholarly: { learning: 15, wisdom: 10 },
      university: { learning: 25, stewardship: 15, diplomacy: 10 },
      royal_tutor: { learning: 30, diplomacy: 20, intrigue: 15, martial: 10 }
    };

    const bonus = educationBonus[education || 'basic'];
    Object.keys(bonus).forEach(key => {
      const statKey = key as keyof PlayerStats;
      baseStats[statKey] = Math.max(0, Math.min(100, baseStats[statKey] + (bonus[statKey] || 0)));
    });

    // Geschlechterbonus (historisch akkurat)
    if (this.gender === 'female') {
      baseStats.diplomacy += 5;
      baseStats.intrigue += 10;
      baseStats.piety += 5;
      baseStats.fertility += 10;
      baseStats.authority -= 10; // Historische Benachteiligung
    } else if (this.gender === 'male') {
      baseStats.martial += 5;
      baseStats.authority += 5;
      baseStats.courage += 5;
    }

    // Benutzerdefinierte Startwerte anwenden
    if (startingStats) {
      Object.keys(startingStats).forEach(key => {
        const statKey = key as keyof PlayerStats;
        baseStats[statKey] = startingStats[statKey] || baseStats[statKey];
      });
    }

    return baseStats;
  }

  private initializeTraits(startingTraits?: Partial<PlayerTraits>): PlayerTraits {
    const baseTraits: PlayerTraits = {
      // Positive Eigenschaften
      just: false,
      charitable: false,
      diligent: false,
      brave: false,
      temperate: false,
      
      // Negative Eigenschaften
      cruel: false,
      arbitrary: false,
      paranoid: false,
      slothful: false,
      gluttonous: false,
      
      // Spezielle Eigenschaften
      genius: false,
      quick: false,
      strong: false,
      attractive: false,
      hale: false
    };

    // Zufällige Eigenschaften basierend auf Statistiken
    if (this.stats.learning > 70 && Math.random() < 0.3) baseTraits.genius = true;
    if (this.stats.courage > 75 && Math.random() < 0.4) baseTraits.brave = true;
    if (this.stats.health > 85 && Math.random() < 0.3) baseTraits.hale = true;
    if (this.stats.charisma > 70 && Math.random() < 0.3) baseTraits.attractive = true;
    if (this.stats.stewardship > 60 && Math.random() < 0.4) baseTraits.diligent = true;
    if (this.stats.tyranny > 40 && Math.random() < 0.3) baseTraits.cruel = true;

    // Benutzerdefinierte Eigenschaften anwenden
    if (startingTraits) {
      Object.assign(baseTraits, startingTraits);
    }

    return baseTraits;
  }

  private grantStartingAchievements(): void {
    const startingAchievements: Achievement[] = [
      {
        id: 'founder',
        name: 'Reichsgründer',
        description: 'Ein neues Königreich gegründet',
        category: 'personal',
        prestigeReward: 50,
        unlockConditions: {},
        unlockedAt: new Date()
      },
      {
        id: 'first_title',
        name: 'Erster Titel',
        description: 'Den ersten Adelstitel erlangt',
        category: 'personal',
        prestigeReward: 25,
        unlockConditions: {},
        unlockedAt: new Date()
      }
    ];

    this.achievements.push(...startingAchievements);
  }

  private initializeInventory(): void {
    const startingInventory: InventoryItem[] = [
      {
        id: 'family_sword',
        name: 'Familien-Schwert',
        type: 'weapon',
        rarity: 'uncommon',
        description: 'Das Erbstück deiner Familie, mit dem dein Vater einst kämpfte.',
        effects: {
          statBonuses: { martial: 5, prestige: 10 },
          kingdomEffects: { stability: 5 }
        },
        value: 500,
        weight: 3,
        acquiredAt: new Date()
      },
      {
        id: 'royal_seal',
        name: 'Königliches Siegel',
        type: 'artifact',
        rarity: 'rare',
        description: 'Das offizielle Siegel deines Königreichs.',
        effects: {
          statBonuses: { authority: 10, legitimacy: 15 },
          specialAbilities: ['official_decrees']
        },
        value: 1000,
        weight: 0.5,
        acquiredAt: new Date()
      },
      {
        id: 'gold_coins',
        name: 'Goldmünzen',
        type: 'treasure',
        rarity: 'common',
        description: 'Eine kleine Menge Startkapital.',
        value: 1000,
        weight: 1,
        acquiredAt: new Date()
      }
    ];

    this.inventory.push(...startingInventory);
  }

  // ==================== ÖFFENTLICHE METHODEN ====================

  /**
   * Befördert den Spieler auf einen neuen Titel
   */
  public promoteTitle(newTitle: PlayerTitle): { success: boolean; message: string } {
    // Prüfe Anforderungen
    const requirements = newTitle.requirements;
    
    if (this.stats.prestige < requirements.prestige) {
      return { 
        success: false, 
        message: `Nicht genug Prestige. Benötigt: ${requirements.prestige}, Aktuell: ${this.stats.prestige}` 
      };
    }
    
    if (this.stats.authority < requirements.authority) {
      return { 
        success: false, 
        message: `Nicht genug Autorität. Benötigt: ${requirements.authority}, Aktuell: ${this.stats.authority}` 
      };
    }
    
    if (requirements.kingdomScore && this.kingdom.calculateTotalScore() < requirements.kingdomScore) {
      return { 
        success: false, 
        message: `Königreich nicht entwickelt genug. Benötigte Punktzahl: ${requirements.kingdomScore}` 
      };
    }
    
    // Titel wechseln
    this.title = newTitle;
    
    // Titelbonusse anwenden
    this.stats.authority += newTitle.benefits.authorityBonus;
    this.stats.prestige += newTitle.benefits.prestigeBonus;
    this.kingdom.resources.gold += newTitle.benefits.goldPerYear;
    
    // Erfolg vergeben
    this.unlockAchievement(`title_${newTitle.name.toLowerCase()}`);
    
    return { 
      success: true, 
      message: `Du wurdest zum ${newTitle.name} befördert!` 
    };
  }

  /**
   * Aktualisiert Spielerstatistiken
   */
  public updateStats(updates: Partial<PlayerStats>, _source: string = 'generic'): void {
    Object.keys(updates).forEach(key => {
      const statKey = key as keyof PlayerStats;
      const oldValue = this.stats[statKey];
      const change = updates[statKey] || 0;
      
      // Spezielle Regeln für bestimmte Statistiken
      let newValue = oldValue + change;
      
      // Grenzen setzen
      if (statKey === 'prestige') {
        newValue = Math.max(0, newValue); // Prestige kann nicht negativ sein
      } else if (statKey === 'health') {
        newValue = Math.max(0, Math.min(100, newValue));
      } else {
        newValue = Math.max(0, Math.min(100, newValue));
      }
      
      this.stats[statKey] = newValue;
      
      // Negative Auswirkungen von hohen Werten
      this.applyStatSideEffects(statKey, newValue);
    });
    
    // Trait-Aktualisierungen basierend auf Statistiken
    this.updateTraitsFromStats();
    
    // Erfolgsprüfung
    this.checkForAchievements();
  }

  /**
   * Fügt einen temporären Modifikator hinzu
   */
  public addTemporaryModifier(
    source: string, 
    type: 'stat' | 'trait' | 'ability', 
    modifier: any, 
    durationHours?: number
  ): void {
    const expiresAt = durationHours ? 
      new Date(Date.now() + durationHours * 60 * 60 * 1000) : 
      undefined;
    
    this.temporaryModifiers.push({
      source,
      type,
      modifier,
      expiresAt
    });
    
    // Modifikator sofort anwenden
    this.applyModifier(modifier, type);
  }

  /**
   * Entfernt abgelaufene Modifikatoren
   */
  public cleanupExpiredModifiers(): void {
    const now = new Date();
    const expired = this.temporaryModifiers.filter(mod => 
      mod.expiresAt && mod.expiresAt < now
    );
    
    expired.forEach(mod => {
      // Rückgängig machen des Modifikators
      this.removeModifier(mod.modifier, mod.type);
    });
    
    this.temporaryModifiers = this.temporaryModifiers.filter(mod => 
      !mod.expiresAt || mod.expiresAt >= now
    );
  }

  /**
   * Schaltet einen Erfolg frei
   */
  public unlockAchievement(achievementId: string): boolean {
    // Load achievement definition from external JSON
    const achievement = this.getAchievementDefinition(achievementId);
    
    if (!achievement || this.achievements.some(a => a.id === achievementId)) {
      return false;
    }
    
    // Prüfe Bedingungen
    if (!this.checkAchievementConditions(achievement)) {
      return false;
    }
    
    achievement.unlockedAt = new Date();
    this.achievements.push(achievement);
    
    // Belohnungen anwenden
    this.stats.prestige += achievement.prestigeReward;
    if (achievement.goldReward) {
      this.kingdom.resources.gold += achievement.goldReward;
    }
    
    return true;
  }

  /**
   * Fügt ein Item zum Inventar hinzu
   */
  public addToInventory(item: InventoryItem): void {
    // Prüfe auf maximales Gewicht
    const currentWeight = this.inventory.reduce((sum, i) => sum + i.weight, 0);
    const maxWeight = 100 + (this.traits.strong ? 50 : 0);
    
    if (currentWeight + item.weight > maxWeight) {
      throw new Error('Inventar zu schwer');
    }
    
    this.inventory.push(item);
    
    // Item-Effekte anwenden
    if (item.effects?.statBonuses) {
      this.updateStats(item.effects.statBonuses, `item_${item.id}`);
    }
    
    if (item.effects?.kingdomEffects) {
      this.applyItemKingdomEffects(item.effects.kingdomEffects);
    }
  }

  /**
   * Entfernt ein Item aus dem Inventar
   */
  public removeFromInventory(itemId: string, sellValue?: number): boolean {
    const index = this.inventory.findIndex(item => item.id === itemId);
    
    if (index === -1) return false;
    
    const item = this.inventory[index];
    
    // Item-Effekte entfernen
    if (item.effects?.statBonuses) {
      const negativeBonuses: Partial<PlayerStats> = {};
      Object.keys(item.effects.statBonuses).forEach(key => {
        const statKey = key as keyof PlayerStats;
        negativeBonuses[statKey] = -(item.effects!.statBonuses![statKey] || 0);
      });
      this.updateStats(negativeBonuses, `remove_item_${itemId}`);
    }
    
    // Gold hinzufügen wenn verkauft
    if (sellValue) {
      this.kingdom.resources.gold += sellValue;
    }
    
    this.inventory.splice(index, 1);
    return true;
  }

  /**
   * Schließt ein Bündnis
   */
  public formAlliance(
    partnerId: string, 
    partnerName: string, 
    type: Alliance['type'], 
    terms: Alliance['terms']
  ): Alliance {
    const alliance: Alliance = {
      id: uuidv4(),
      name: `${this.name}-${partnerName} Pakt`,
      type,
      partnerId,
      strength: 75, // Startstärke
      establishedAt: new Date(),
      terms
    };
    
    this.alliances.push(alliance);
    
    // Diplomatische Bonusse
    this.stats.diplomacy += 5;
    this.stats.prestige += 10;
    
    // Handelbonus für das Königreich
    if (terms.tradeBenefits) {
      this.kingdom.stats.tradePower += 15;
    }
    
    return alliance;
  }

  /**
   * Heiratet einen anderen Charakter
   */
  public marry(spouse: PlayerFamily['spouse']): boolean {
    if (this.marriageStatus !== 'single' || !spouse) {
      return false;
    }
    
    this.family.spouse = spouse;
    this.marriageStatus = 'married';
    
    // Eheliche Bonusse
    this.stats.fertility = Math.min(100, this.stats.fertility + 20);
    this.stats.legitimacy += 15;
    
    // Dynastie-Bonus
    if (this.dynastyName) {
      this.stats.prestige += 25;
    }
    
    return true;
  }

  /**
   * Bekommt ein Kind
   */
  public haveChild(childName: string, gender: Gender): void {
    if (!this.family.spouse || this.stats.fertility < 20) {
      return;
    }
    
    const child = {
      id: uuidv4(),
      name: childName,
      age: 0,
      gender,
      education: 'uneducated' as EducationLevel,
      stats: this.calculateChildStats(),
      traits: this.calculateChildTraits()
    };
    
    this.family.children.push(child);
    
    // Fertilität verringern mit jedem Kind
    this.stats.fertility = Math.max(10, this.stats.fertility - 15);
    
    // Prestige-Bonus für Nachwuchs
    this.stats.prestige += 10;
    this.stats.legitimacy += 5;
  }

  /**
   * Verarbeitet ein Spieljahr
   */
  public processYear(): void {
    // Alter erhöhen
    this.stats.age += 1;
    
    // Gesundheit verringern mit dem Alter
    if (this.stats.age > 40) {
      const healthLoss = Math.floor((this.stats.age - 40) / 5);
      this.stats.health = Math.max(0, this.stats.health - healthLoss);
    }
    
    // Temporäre Modifikatoren bereinigen
    this.cleanupExpiredModifiers();
    
    // Erfolgsprüfung am Jahresende
    this.checkYearEndAchievements();
    
    // Titelbonusse
    this.kingdom.resources.gold += this.title.benefits.goldPerYear;
    
    // Datum aktualisieren
    this.lastPlayed = new Date();
  }

  /**
   * Berechnet Gesamtpunktzahl des Spielers
   */
  public calculateTotalScore(): number {
    const playerScore = Object.values(this.stats).reduce((sum, val) => {
      if (typeof val === 'number') {
        return sum + val;
      }
      return sum;
    }, 0);
    
    const titleScore = this.title.rank * 100;
    const achievementScore = this.achievements.reduce((sum, a) => sum + a.prestigeReward, 0);
    const inventoryScore = this.inventory.reduce((sum, item) => sum + item.value, 0) / 100;
    const allianceScore = this.alliances.reduce((sum, a) => sum + a.strength, 0);
    
    return Math.floor(
      playerScore * 0.5 + 
      titleScore * 1.5 + 
      achievementScore * 2 + 
      inventoryScore + 
      allianceScore * 0.5
    );
  }

  /**
   * Serialisiert den Spieler für Speicherung
   */
  public serialize(): PlayerSaveData {
    return {
      id: this.id,
      name: this.name,
      gender: this.gender,
      kingdom: this.kingdom.serialize(),
      title: this.title,
      stats: this.stats,
      traits: this.traits,
      achievements: this.achievements,
      inventory: this.inventory,
      family: this.family,
      alliances: this.alliances,
      status: this.status,
      marriageStatus: this.marriageStatus,
      education: this.education,
      createdAt: this.createdAt.toISOString(),
      lastPlayed: this.lastPlayed.toISOString(),
      dynastyName: this.dynastyName,
      portraitSeed: this.portraitSeed,
      coatOfArms: this.coatOfArms
    };
  }

  /**
   * Deserialisiert einen Spieler aus gespeicherten Daten
   */
  public static deserialize(data: PlayerSaveData): Player {
    const creationData: PlayerCreationData = {
      name: data.name,
      gender: data.gender,
      kingdomName: data.kingdom.name,
      difficulty: data.kingdom.difficulty,
      dynastyName: data.dynastyName,
      portraitSeed: data.portraitSeed,
      coatOfArms: data.coatOfArms,
      education: data.education,
      startingStats: data.stats
    };
    
    const player = new Player(creationData);
    
    // Überschreibe generierte Werte
    player.id = data.id;
    player.title = data.title;
    player.stats = data.stats;
    player.traits = data.traits;
    player.achievements = data.achievements;
    player.inventory = data.inventory;
    player.family = data.family;
    player.alliances = data.alliances;
    player.status = data.status;
    player.marriageStatus = data.marriageStatus;
    (player as any).createdAt = new Date(data.createdAt);
    player.lastPlayed = new Date(data.lastPlayed);
    
    // Königreich deserialisieren
    player.kingdom = Kingdom.deserialize(data.kingdom);
    
    return player;
  }

  /**
   * Gibt eine Zusammenfassung des Spielers zurück
   */
  public getSummary(): {
    totalScore: number;
    kingdomSummary: any;
    militaryStrength: number;
    economicPower: number;
    diplomaticInfluence: number;
  } {
    const kingdomSummary = this.kingdom.getSummary();
    
    return {
      totalScore: this.calculateTotalScore(),
      kingdomSummary,
      militaryStrength: kingdomSummary.militaryStrength,
      economicPower: kingdomSummary.netWorth,
      diplomaticInfluence: this.alliances.reduce((sum, a) => sum + a.strength, 0) / this.alliances.length || 0
    };
  }

  // ==================== PRIVATE HELFERMETHODEN ====================

  private applyStatSideEffects(statKey: keyof PlayerStats, value: number): void {
    switch (statKey) {
      case 'corruption':
        if (value > 70) {
          this.stats.popularity = Math.max(0, this.stats.popularity - 10);
          this.stats.legitimacy = Math.max(0, this.stats.legitimacy - 15);
        }
        break;
      case 'tyranny':
        if (value > 60) {
          this.stats.popularity = Math.max(0, this.stats.popularity - 20);
        }
        break;
      case 'piety':
        if (value > 80) {
          this.stats.legitimacy = Math.min(100, this.stats.legitimacy + 10);
        }
        break;
      case 'generosity':
        if (value > 70 && this.kingdom.resources.gold > 5000) {
          this.stats.popularity = Math.min(100, this.stats.popularity + 5);
        }
        break;
    }
  }

  private updateTraitsFromStats(): void {
    // Positive Eigenschaften
    if (this.stats.honor > 80 && !this.traits.just) this.traits.just = true;
    if (this.stats.generosity > 75 && !this.traits.charitable) this.traits.charitable = true;
    if (this.stats.courage > 85 && !this.traits.brave) this.traits.brave = true;
    
    // Negative Eigenschaften
    if (this.stats.tyranny > 60 && !this.traits.cruel) this.traits.cruel = true;
    if (this.stats.paranoia > 70 && !this.traits.paranoid) this.traits.paranoid = true;
    if (this.stats.greed > 65 && !this.traits.gluttonous) this.traits.gluttonous = true;
  }

  private applyModifier(modifier: any, type: 'stat' | 'trait' | 'ability'): void {
    if (type === 'stat' && modifier.statBonuses) {
      this.updateStats(modifier.statBonuses, 'temporary_modifier');
    }
    // Weitere Modifikator-Typen...
  }

  private removeModifier(modifier: any, type: 'stat' | 'trait' | 'ability'): void {
    if (type === 'stat' && modifier.statBonuses) {
      const negativeBonuses: Partial<PlayerStats> = {};
      Object.keys(modifier.statBonuses).forEach(key => {
        const statKey = key as keyof PlayerStats;
        negativeBonuses[statKey] = -(modifier.statBonuses[statKey] || 0);
      });
      this.updateStats(negativeBonuses, 'remove_temporary_modifier');
    }
  }

  private getAchievementDefinition(achievementId: string): Achievement | undefined {
    // Load achievements from external JSON file
    const achievementDefinitions: Achievement[] = achievementsData.achievements as Achievement[];
    return achievementDefinitions.find(a => a.id === achievementId);
  }

  private checkAchievementConditions(achievement: Achievement): boolean {
    const conditions = achievement.unlockConditions;
    
    // Statistische Anforderungen
    if (conditions.statRequirements) {
      for (const [stat, required] of Object.entries(conditions.statRequirements)) {
        const statKey = stat as keyof PlayerStats;
        if (this.stats[statKey] < (required as number)) {
          return false;
        }
      }
    }
    
    // Königreichsanforderungen
    if (conditions.kingdomRequirements) {
      const req = conditions.kingdomRequirements;
      
      if (req.minScore && this.kingdom.calculateTotalScore() < req.minScore) {
        return false;
      }
      
      if (req.minYear && this.kingdom.currentYear < req.minYear) {
        return false;
      }
      
      if (req.buildings) {
        for (const [building, minCount] of Object.entries(req.buildings)) {
          const infraKey = building as keyof Kingdom['infrastructure'];
          if (this.kingdom.infrastructure[infraKey] < minCount) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  private checkForAchievements(): void {
    // Load all achievement definitions and check them
    const allAchievements = achievementsData.achievements as Achievement[];
    
    allAchievements.forEach(achievementDef => {
      // Skip if already unlocked
      if (!this.achievements.some(a => a.id === achievementDef.id)) {
        this.unlockAchievement(achievementDef.id);
      }
    });
  }

  private checkYearEndAchievements(): void {
    // Erfolge die am Jahresende geprüft werden
    const year = this.kingdom.currentYear;
    
    if (year === 10) {
      this.unlockAchievement('decade_ruler');
    }
    
    if (year === 25) {
      this.unlockAchievement('silver_jubilee');
    }
    
    if (year === 50) {
      this.unlockAchievement('golden_reign');
    }
  }

  private applyItemKingdomEffects(effects: any): void {
    if (effects.happiness) {
      this.kingdom.happiness = Math.min(100, this.kingdom.happiness + effects.happiness);
    }
    
    if (effects.stability) {
      this.kingdom.stats.stability = Math.min(100, this.kingdom.stats.stability + effects.stability);
    }
    
    if (effects.production) {
      // Update production rates with percentage modifiers
      this.kingdom.updateProductionRates(effects.production);
    }
  }

  private calculateChildStats(): Partial<PlayerStats> {
    // Vererbung der Elternstatistiken mit Variation
    const baseStats: Partial<PlayerStats> = {};
    
    const parentStats = [this.stats, this.family.spouse?.stats || {}];
    
    // Durchschnittliche Werte mit leichter Variation
    (Object.keys(this.stats) as Array<keyof PlayerStats>).forEach(stat => {
      const parentValues = parentStats
        .map(p => p[stat] || 50)
        .filter(v => typeof v === 'number');
      
      const average = parentValues.reduce((sum, v) => sum + v, 0) / parentValues.length;
      
      // Variation: ±20%
      const variation = (Math.random() * 40) - 20;
      baseStats[stat] = Math.max(0, Math.min(100, average + variation));
    });
    
    return baseStats;
  }

  private calculateChildTraits(): Partial<PlayerTraits> {
    const childTraits: Partial<PlayerTraits> = {};
    
    // Vererbung von Eltern-Eigenschaften (30% Chance)
    const parentTraits = [this.traits, this.family.spouse?.traits || {}];
    
    (Object.keys(this.traits) as Array<keyof PlayerTraits>).forEach(trait => {
      const hasTrait = parentTraits.some(p => p[trait]);
      
      if (hasTrait && Math.random() < 0.3) {
        childTraits[trait] = true;
      }
    });
    
    // Zufällige neue Eigenschaften (10% Chance)
    if (Math.random() < 0.1) {
      const randomTrait = Object.keys(this.traits)[
        Math.floor(Math.random() * Object.keys(this.traits).length)
      ] as keyof PlayerTraits;
      
      childTraits[randomTrait] = true;
    }
    
    return childTraits;
  }
}