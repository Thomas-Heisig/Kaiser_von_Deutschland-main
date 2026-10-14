// src/data/Titles.ts

export type TitleType = 'noble' | 'royal' | 'military' | 'religious' | 'administrative' | 'honorary';
export type TitleGender = 'male' | 'female' | 'neutral';
export type Gender = 'male' | 'female';
export type TitleInheritance = 'primogeniture' | 'agnatic' | 'cognatic' | 'elective' | 'appointed';

export interface TitleBenefits {
  goldPerYear: number;
  landGrant?: number; // Hektar Land
  taxExemption?: number; // Prozent
  militaryLevy: number; // Anzahl Soldaten die gestellt werden können
  courtPositions: number; // Anzahl Hofämter
  diplomaticWeight: number; // 0-100
  specialPrivileges: string[]; // z.B. "hunt_rights", "tax_collection"
}

export interface TitleRequirements {
  minPrestige: number;
  minAuthority: number;
  minKingdomScore: number;
  minAge?: number;
  genderRestrictions?: TitleGender[];
  religionRequirements?: string[];
  culturalRequirements?: string[];
  previousTitle?: string; // Erforderlicher vorheriger Titel
  achievements?: string[]; // Erforderliche Erfolge
  specialConditions?: string[]; // z.B. "royal_marriage", "military_victory"
}

export interface TitleHistory {
  created: Date;
  previousHolders: Array<{
    name: string;
    heldFrom: Date;
    heldUntil: Date;
    reasonForLoss: string;
  }>;
  specialEvents: Array<{
    date: Date;
    event: string;
    significance: string;
  }>;
}

export interface Title {
  id: string;
  name: string;
  femaleName?: string; // Weibliche Form des Titels
  pluralName?: string; // Pluralform
  rank: number;
  type: TitleType;
  tier: 'petty' | 'lesser' | 'greater' | 'royal' | 'imperial';
  
  // Hierarchie
  vassalOf?: string; // Übergeordneter Titel ID
  deJureVassals: string[]; // Rechtmäßige Untergebene Titel
  deFactoVassals: string[]; // Tatsächliche Untergebene Titel
  
  // Gebiet und Herrschaft
  region?: string;
  historicalSeat?: string; // Historischer Herrschaftssitz
  coatOfArms?: string;
  colors: string[]; // Titel-Farben
  
  // Mechanik
  benefits: TitleBenefits;
  requirements: TitleRequirements;
  inheritance: TitleInheritance;
  
  // Historische Daten
  history: TitleHistory;
  
  // Kulturelle Varianten
  culturalVariants?: Record<string, {
    name: string;
    femaleName?: string;
  }>;
}

export class TitleSystem {
  private static titles: Map<string, Title> = new Map();
  private static titleHierarchy: Map<number, Title[]> = new Map();
  private static culturalTitles: Map<string, Map<string, Title>> = new Map();

  static {
    this.initializeTitles();
    this.buildHierarchy();
  }

  private static initializeTitles(): void {
    const allTitles: Title[] = [
      // ==================== ADELSTITEL ====================
      {
        id: 'knight',
        name: 'Ritter',
        femaleName: 'Dame',
        pluralName: 'Ritterschaft',
        rank: 1,
        type: 'noble',
        tier: 'petty',
        deJureVassals: [],
        deFactoVassals: [],
        colors: ['#C0C0C0', '#8B4513'],
        benefits: {
          goldPerYear: 100,
          militaryLevy: 10,
          courtPositions: 0,
          diplomaticWeight: 5,
          specialPrivileges: ['wear_armor', 'attend_court']
        },
        requirements: {
          minPrestige: 100,
          minAuthority: 20,
          minKingdomScore: 500,
          minAge: 21,
          specialConditions: ['military_service', 'land_ownership']
        },
        inheritance: 'appointed',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'baron',
        name: 'Baron',
        femaleName: 'Baronin',
        pluralName: 'Barone',
        rank: 2,
        type: 'noble',
        tier: 'lesser',
        deJureVassals: ['knight'],
        deFactoVassals: [],
        colors: ['#8B4513', '#DAA520'],
        benefits: {
          goldPerYear: 500,
          landGrant: 1000,
          taxExemption: 10,
          militaryLevy: 50,
          courtPositions: 2,
          diplomaticWeight: 15,
          specialPrivileges: ['collect_taxes', 'hold_court', 'build_castle']
        },
        requirements: {
          minPrestige: 300,
          minAuthority: 40,
          minKingdomScore: 2000,
          minAge: 25,
          previousTitle: 'knight',
          achievements: ['land_owner']
        },
        inheritance: 'primogeniture',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'viscount',
        name: 'Vizegraf',
        femaleName: 'Vizegräfin',
        pluralName: 'Vizegrafen',
        rank: 3,
        type: 'noble',
        tier: 'lesser',
        vassalOf: 'count',
        deJureVassals: ['baron'],
        deFactoVassals: [],
        colors: ['#DAA520', '#006400'],
        benefits: {
          goldPerYear: 1000,
          landGrant: 2500,
          taxExemption: 15,
          militaryLevy: 100,
          courtPositions: 3,
          diplomaticWeight: 25,
          specialPrivileges: ['appoint_judges', 'mint_copper']
        },
        requirements: {
          minPrestige: 600,
          minAuthority: 55,
          minKingdomScore: 5000,
          minAge: 28,
          previousTitle: 'baron',
          achievements: ['administrator']
        },
        inheritance: 'primogeniture',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'count',
        name: 'Graf',
        femaleName: 'Gräfin',
        pluralName: 'Grafen',
        rank: 4,
        type: 'noble',
        tier: 'greater',
        vassalOf: 'duke',
        deJureVassals: ['viscount', 'baron'],
        deFactoVassals: [],
        colors: ['#006400', '#00008B'],
        benefits: {
          goldPerYear: 2500,
          landGrant: 5000,
          taxExemption: 20,
          militaryLevy: 250,
          courtPositions: 5,
          diplomaticWeight: 40,
          specialPrivileges: ['declare_war', 'grant_titles', 'mint_silver']
        },
        requirements: {
          minPrestige: 1200,
          minAuthority: 70,
          minKingdomScore: 10000,
          minAge: 30,
          previousTitle: 'viscount',
          achievements: ['military_commander', 'diplomat']
        },
        inheritance: 'primogeniture',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'earl',
        name: 'Jarl',
        femaleName: 'Jarlin',
        pluralName: 'Jarle',
        rank: 4,
        type: 'noble',
        tier: 'greater',
        vassalOf: 'king',
        deJureVassals: ['baron'],
        deFactoVassals: [],
        colors: ['#8B0000', '#FFD700'],
        culturalVariants: {
          'germanic': { name: 'Herzog' },
          'french': { name: 'Comte' },
          'english': { name: 'Earl', femaleName: 'Countess' }
        },
        benefits: {
          goldPerYear: 3000,
          landGrant: 7500,
          taxExemption: 25,
          militaryLevy: 300,
          courtPositions: 6,
          diplomaticWeight: 45,
          specialPrivileges: ['raise_navy', 'trade_monopoly']
        },
        requirements: {
          minPrestige: 1500,
          minAuthority: 75,
          minKingdomScore: 15000,
          minAge: 35,
          culturalRequirements: ['norse', 'germanic', 'english'],
          achievements: ['naval_commander']
        },
        inheritance: 'agnatic',
        history: {
          created: new Date('800-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'marquis',
        name: 'Markgraf',
        femaleName: 'Markgräfin',
        pluralName: 'Markgrafen',
        rank: 5,
        type: 'military',
        tier: 'greater',
        vassalOf: 'king',
        deJureVassals: ['count'],
        deFactoVassals: [],
        colors: ['#800080', '#FF4500'],
        benefits: {
          goldPerYear: 4000,
          landGrant: 10000,
          taxExemption: 30,
          militaryLevy: 500,
          courtPositions: 8,
          diplomaticWeight: 60,
          specialPrivileges: ['border_defense', 'foreign_negotiations', 'mint_gold']
        },
        requirements: {
          minPrestige: 2000,
          minAuthority: 85,
          minKingdomScore: 25000,
          minAge: 40,
          specialConditions: ['border_region', 'military_victory'],
          achievements: ['defender_of_realm']
        },
        inheritance: 'agnatic',
        history: {
          created: new Date('900-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'duke',
        name: 'Herzog',
        femaleName: 'Herzogin',
        pluralName: 'Herzöge',
        rank: 6,
        type: 'noble',
        tier: 'royal',
        vassalOf: 'king',
        deJureVassals: ['count', 'marquis'],
        deFactoVassals: [],
        colors: ['#00008B', '#FF0000'],
        culturalVariants: {
          'french': { name: 'Duc' },
          'english': { name: 'Duke' },
          'italian': { name: 'Duca' }
        },
        benefits: {
          goldPerYear: 7500,
          landGrant: 25000,
          taxExemption: 40,
          militaryLevy: 1000,
          courtPositions: 12,
          diplomaticWeight: 80,
          specialPrivileges: [
            'crown_vassal',
            'royal_council',
            'grant_knighthood',
            'establish_town'
          ]
        },
        requirements: {
          minPrestige: 3000,
          minAuthority: 90,
          minKingdomScore: 50000,
          minAge: 45,
          previousTitle: 'count',
          achievements: ['kingdom_builder', 'royal_ally']
        },
        inheritance: 'primogeniture',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'grand_duke',
        name: 'Großherzog',
        femaleName: 'Großherzogin',
        pluralName: 'Großherzöge',
        rank: 7,
        type: 'royal',
        tier: 'royal',
        vassalOf: 'emperor',
        deJureVassals: ['duke'],
        deFactoVassals: [],
        colors: ['#FF0000', '#FFD700'],
        benefits: {
          goldPerYear: 15000,
          landGrant: 50000,
          taxExemption: 50,
          militaryLevy: 2000,
          courtPositions: 20,
          diplomaticWeight: 90,
          specialPrivileges: [
            'sovereign_rights',
            'diplomatic_immunity',
            'mint_currency',
            'declare_independence'
          ]
        },
        requirements: {
          minPrestige: 5000,
          minAuthority: 95,
          minKingdomScore: 100000,
          minAge: 50,
          previousTitle: 'duke',
          specialConditions: ['royal_blood', 'imperial_favor']
        },
        inheritance: 'primogeniture',
        history: {
          created: new Date('1200-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },

      // ==================== KÖNIGLICHE TITEL ====================
      {
        id: 'king',
        name: 'König',
        femaleName: 'Königin',
        pluralName: 'Könige',
        rank: 8,
        type: 'royal',
        tier: 'royal',
        vassalOf: 'emperor',
        deJureVassals: ['duke', 'grand_duke'],
        deFactoVassals: [],
        colors: ['#FFD700', '#000000'],
        culturalVariants: {
          'french': { name: 'Roi' },
          'english': { name: 'King' },
          'spanish': { name: 'Rey' }
        },
        benefits: {
          goldPerYear: 30000,
          landGrant: 100000,
          taxExemption: 60,
          militaryLevy: 5000,
          courtPositions: 50,
          diplomaticWeight: 100,
          specialPrivileges: [
            'crown_authority',
            'declare_war_peace',
            'appoint_bishops',
            'grant_nobility',
            'royal_pardon',
            'coronation_rights'
          ]
        },
        requirements: {
          minPrestige: 10000,
          minAuthority: 100,
          minKingdomScore: 250000,
          minAge: 30,
          genderRestrictions: ['male', 'female'],
          specialConditions: ['coronation', 'papal_approval'],
          achievements: ['unify_kingdom', 'royal_marriage']
        },
        inheritance: 'primogeniture',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'high_king',
        name: 'Hochkönig',
        femaleName: 'Hochkönigin',
        pluralName: 'Hochkönige',
        rank: 9,
        type: 'royal',
        tier: 'imperial',
        deJureVassals: ['king'],
        deFactoVassals: [],
        colors: ['#000000', '#FFFFFF'],
        culturalVariants: {
          'celtic': { name: 'Ard-Rí' },
          'norse': { name: 'Konungr' }
        },
        benefits: {
          goldPerYear: 50000,
          landGrant: 250000,
          taxExemption: 70,
          militaryLevy: 10000,
          courtPositions: 100,
          diplomaticWeight: 150,
          specialPrivileges: [
            'imperial_authority',
            'vassal_overlordship',
            'religious_suzerainty',
            'imperial_diet',
            'claim_empire'
          ]
        },
        requirements: {
          minPrestige: 25000,
          minAuthority: 100,
          minKingdomScore: 500000,
          minAge: 35,
          specialConditions: ['multiple_kingdoms', 'imperial_conquest'],
          achievements: ['empire_builder']
        },
        inheritance: 'elective',
        history: {
          created: new Date('800-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'emperor',
        name: 'Kaiser',
        femaleName: 'Kaiserin',
        pluralName: 'Kaiser',
        rank: 10,
        type: 'royal',
        tier: 'imperial',
        deJureVassals: ['king', 'high_king'],
        deFactoVassals: [],
        colors: ['#FFD700', '#800080'],
        culturalVariants: {
          'roman': { name: 'Imperator' },
          'byzantine': { name: 'Basileus' },
          'french': { name: 'Empereur' },
          'english': { name: 'Emperor' }
        },
        benefits: {
          goldPerYear: 100000,
          landGrant: 500000,
          taxExemption: 80,
          militaryLevy: 25000,
          courtPositions: 200,
          diplomaticWeight: 200,
          specialPrivileges: [
            'divine_right',
            'imperial_coronation',
            'appoint_kings',
            'holy_war',
            'imperial_reform',
            'universal_suzerainty'
          ]
        },
        requirements: {
          minPrestige: 50000,
          minAuthority: 100,
          minKingdomScore: 1000000,
          minAge: 40,
          specialConditions: ['imperial_coronation', 'papal_crowning'],
          achievements: ['restore_empire', 'holy_emperor']
        },
        inheritance: 'primogeniture',
        history: {
          created: new Date('800-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },

      // ==================== MILITÄRISCHE TITEL ====================
      {
        id: 'captain',
        name: 'Hauptmann',
        femaleName: 'Hauptfrau',
        rank: 1,
        type: 'military',
        tier: 'petty',
        deJureVassals: [],
        deFactoVassals: [],
        colors: ['#808080', '#0000FF'],
        benefits: {
          goldPerYear: 50,
          militaryLevy: 50,
          courtPositions: 0,
          diplomaticWeight: 2,
          specialPrivileges: ['command_company']
        },
        requirements: {
          minPrestige: 50,
          minAuthority: 30,
          minKingdomScore: 0,
          minAge: 20
        },
        inheritance: 'appointed',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },
      {
        id: 'marshal',
        name: 'Marschall',
        femaleName: 'Marschällin',
        rank: 5,
        type: 'military',
        tier: 'greater',
        deJureVassals: ['captain'],
        deFactoVassals: [],
        colors: ['#0000FF', '#FF0000'],
        benefits: {
          goldPerYear: 2000,
          militaryLevy: 1000,
          courtPositions: 5,
          diplomaticWeight: 40,
          specialPrivileges: ['command_army', 'strategic_planning', 'fortification_building']
        },
        requirements: {
          minPrestige: 1500,
          minAuthority: 70,
          minKingdomScore: 20000,
          minAge: 35,
          specialConditions: ['military_victory'],
          achievements: ['great_commander']
        },
        inheritance: 'appointed',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },

      // ==================== RELIGIÖSE TITEL ====================
      {
        id: 'bishop',
        name: 'Bischof',
        femaleName: 'Bischöfin',
        rank: 4,
        type: 'religious',
        tier: 'greater',
        deJureVassals: [],
        deFactoVassals: [],
        colors: ['#FFFFFF', '#800080'],
        benefits: {
          goldPerYear: 1500,
          taxExemption: 100,
          militaryLevy: 0,
          courtPositions: 3,
          diplomaticWeight: 35,
          specialPrivileges: ['religious_authority', 'excommunication', 'church_taxes']
        },
        requirements: {
          minPrestige: 1000,
          minAuthority: 60,
          minKingdomScore: 15000,
          minAge: 30,
          religionRequirements: ['christian'],
          specialConditions: ['papal_appointment']
        },
        inheritance: 'appointed',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      },

      // ==================== VERWALTUNGSTITEL ====================
      {
        id: 'chancellor',
        name: 'Kanzler',
        femaleName: 'Kanzlerin',
        rank: 4,
        type: 'administrative',
        tier: 'greater',
        deJureVassals: [],
        deFactoVassals: [],
        colors: ['#008000', '#FFFFFF'],
        benefits: {
          goldPerYear: 1800,
          militaryLevy: 100,
          courtPositions: 4,
          diplomaticWeight: 45,
          specialPrivileges: ['seal_documents', 'royal_correspondence', 'treaty_negotiation']
        },
        requirements: {
          minPrestige: 1200,
          minAuthority: 65,
          minKingdomScore: 18000,
          minAge: 32,
          achievements: ['master_diplomat']
        },
        inheritance: 'appointed',
        history: {
          created: new Date('1000-01-01'),
          previousHolders: [],
          specialEvents: []
        }
      }
    ];

    // Alle Titel in Map speichern
    allTitles.forEach(title => {
      this.titles.set(title.id, title);
    });

    // Kulturelle Varianten initialisieren
    this.initializeCulturalVariants();
  }

  private static initializeCulturalVariants(): void {
    const cultures = ['germanic', 'french', 'english', 'norse', 'celtic', 'roman', 'byzantine', 'spanish', 'italian'];
    
    cultures.forEach(culture => {
      this.culturalTitles.set(culture, new Map());
    });

    // Kulturelle Varianten zuordnen
    this.titles.forEach(title => {
      if (title.culturalVariants) {
        Object.entries(title.culturalVariants).forEach(([culture, variant]) => {
          const cultureMap = this.culturalTitles.get(culture);
          if (cultureMap) {
            const culturalTitle = { ...title, ...variant };
            cultureMap.set(title.id, culturalTitle);
          }
        });
      }
    });
  }

  private static buildHierarchy(): void {
    // Titel nach Rang gruppieren
    this.titles.forEach(title => {
      if (!this.titleHierarchy.has(title.rank)) {
        this.titleHierarchy.set(title.rank, []);
      }
      this.titleHierarchy.get(title.rank)!.push(title);
    });
  }

  // ==================== ÖFFENTLICHE METHODEN ====================

  /**
   * Gibt den Starttitel zurück
   */
  public static getStartingTitle(culture?: string): Title {
    const baseTitle = this.titles.get('baron')!;
    
    if (culture) {
      const culturalTitle = this.getTitleForCulture('baron', culture);
      if (culturalTitle) return culturalTitle;
    }
    
    return baseTitle;
  }

  /**
   * Gibt den passenden Titel basierend auf Punktzahl zurück
   */
  public static getTitleForScore(score: number, culture?: string): Title {
    let appropriateTitle: Title = this.titles.get('baron')!;
    
    // Rangbasierte Auswahl
    if (score >= 1000000) {
      appropriateTitle = this.titles.get('emperor')!;
    } else if (score >= 500000) {
      appropriateTitle = this.titles.get('high_king')!;
    } else if (score >= 250000) {
      appropriateTitle = this.titles.get('king')!;
    } else if (score >= 100000) {
      appropriateTitle = this.titles.get('grand_duke')!;
    } else if (score >= 50000) {
      appropriateTitle = this.titles.get('duke')!;
    } else if (score >= 25000) {
      appropriateTitle = this.titles.get('marquis')!;
    } else if (score >= 15000) {
      appropriateTitle = this.titles.get('earl')!;
    } else if (score >= 10000) {
      appropriateTitle = this.titles.get('count')!;
    } else if (score >= 5000) {
      appropriateTitle = this.titles.get('viscount')!;
    } else if (score >= 2000) {
      appropriateTitle = this.titles.get('baron')!;
    } else if (score >= 500) {
      appropriateTitle = this.titles.get('knight')!;
    }

    // Kulturelle Anpassung
    if (culture) {
      const culturalTitle = this.getTitleForCulture(appropriateTitle.id, culture);
      if (culturalTitle) return culturalTitle;
    }
    
    return appropriateTitle;
  }

  /**
   * Gibt einen kulturell angepassten Titel zurück
   */
  public static getTitleForCulture(titleId: string, culture: string): Title | undefined {
    const cultureMap = this.culturalTitles.get(culture);
    if (cultureMap) {
      return cultureMap.get(titleId);
    }
    return this.titles.get(titleId);
  }

  /**
   * Prüft ob ein Spieler die Anforderungen für einen Titel erfüllt
   */
  public static checkTitleRequirements(
    titleId: string, 
    playerStats: any, 
    kingdomScore: number,
    achievements: string[],
    culture?: string
  ): { canHold: boolean; reasons: string[] } {
    const title = culture ? 
      this.getTitleForCulture(titleId, culture) : 
      this.titles.get(titleId);
    
    if (!title) {
      return { canHold: false, reasons: ['Titel existiert nicht'] };
    }

    const reasons: string[] = [];
    const requirements = title.requirements;

    // Prestige prüfen
    if (playerStats.prestige < requirements.minPrestige) {
      reasons.push(`Nicht genug Prestige (Benötigt: ${requirements.minPrestige}, Aktuell: ${playerStats.prestige})`);
    }

    // Autorität prüfen
    if (playerStats.authority < requirements.minAuthority) {
      reasons.push(`Nicht genug Autorität (Benötigt: ${requirements.minAuthority}, Aktuell: ${playerStats.authority})`);
    }

    // Königreichspunktzahl prüfen
    if (kingdomScore < requirements.minKingdomScore) {
      reasons.push(`Königreich nicht entwickelt genug (Benötigt: ${requirements.minKingdomScore}, Aktuell: ${kingdomScore})`);
    }

    // Altersanforderung
    if (requirements.minAge && playerStats.age < requirements.minAge) {
      reasons.push(`Zu jung für diesen Titel (Benötigt: ${requirements.minAge} Jahre)`);
    }

    // Geschlechterbeschränkungen
    if (requirements.genderRestrictions && playerStats.gender) {
      if (!requirements.genderRestrictions.includes(playerStats.gender as any)) {
        reasons.push(`Geschlecht nicht berechtigt (${requirements.genderRestrictions.join('/')} erforderlich)`);
      }
    }

    // Vorheriger Titel
    if (requirements.previousTitle && playerStats.currentTitle !== requirements.previousTitle) {
      reasons.push(`Vorheriger Titel ${requirements.previousTitle} erforderlich`);
    }

    // Erfolge
    if (requirements.achievements) {
      const missingAchievements = requirements.achievements.filter(
        ach => !achievements.includes(ach)
      );
      if (missingAchievements.length > 0) {
        reasons.push(`Fehlende Erfolge: ${missingAchievements.join(', ')}`);
      }
    }

    return {
      canHold: reasons.length === 0,
      reasons
    };
  }

  /**
   * Gibt alle verfügbaren Titel für einen Spieler zurück
   */
  public static getAvailableTitles(
    playerStats: any, 
    kingdomScore: number,
    achievements: string[],
    culture?: string,
    currentTitleId?: string
  ): Title[] {
    const availableTitles: Title[] = [];
    
    this.titles.forEach(title => {
      // Überspringe wenn niedrigerer Rang
      if (currentTitleId) {
        const currentTitle = this.titles.get(currentTitleId);
        if (currentTitle && title.rank <= currentTitle.rank) {
          return;
        }
      }
      
      const { canHold } = this.checkTitleRequirements(
        title.id, 
        playerStats, 
        kingdomScore, 
        achievements, 
        culture
      );
      
      if (canHold) {
        const displayTitle = culture ? 
          this.getTitleForCulture(title.id, culture) || title : 
          title;
        availableTitles.push(displayTitle);
      }
    });
    
    return availableTitles.sort((a, b) => a.rank - b.rank);
  }

  /**
   * Gibt den nächsthöheren Titel zurück
   */
  public static getNextTitle(
    currentTitleId: string,
    playerStats: any,
    kingdomScore: number,
    achievements: string[],
    culture?: string
  ): Title | null {
    const currentTitle = this.titles.get(currentTitleId);
    if (!currentTitle) return null;
    
    // Finde Titel mit nächsthöherem Rang
    const higherTitles = Array.from(this.titles.values())
      .filter(t => t.rank > currentTitle.rank)
      .sort((a, b) => a.rank - b.rank);
    
    for (const title of higherTitles) {
      const { canHold } = this.checkTitleRequirements(
        title.id, 
        playerStats, 
        kingdomScore, 
        achievements, 
        culture
      );
      
      if (canHold) {
        return culture ? 
          this.getTitleForCulture(title.id, culture) || title : 
          title;
      }
    }
    
    return null;
  }

  /**
   * Gibt die Titelhierarchie zurück
   */
  public static getTitleHierarchy(): Map<number, Title[]> {
    return new Map(this.titleHierarchy);
  }

  /**
   * Gibt alle Vasallen eines Titels zurück
   */
  public static getVassals(titleId: string, includeIndirect: boolean = false): Title[] {
    const title = this.titles.get(titleId);
    if (!title) return [];
    
    const vassals: Title[] = [];
    
    // Direkte Vasallen
    title.deJureVassals.forEach(vassalId => {
      const vassal = this.titles.get(vassalId);
      if (vassal) vassals.push(vassal);
    });
    
    // Indirekte Vasallen (rekursiv)
    if (includeIndirect) {
      const indirectVassals: Title[] = [];
      vassals.forEach(vassal => {
        indirectVassals.push(...this.getVassals(vassal.id, true));
      });
      vassals.push(...indirectVassals);
    }
    
    return vassals;
  }

  /**
   * Gibt die Titelbenefits zurück
   */
  public static getTitleBenefits(titleId: string, culture?: string): TitleBenefits {
    const title = culture ? 
      this.getTitleForCulture(titleId, culture) : 
      this.titles.get(titleId);
    
    return title?.benefits || this.titles.get('baron')!.benefits;
  }

  /**
   * Fügt einen neuen Titel hinzu
   */
  public static addCustomTitle(title: Title): void {
    if (this.titles.has(title.id)) {
      throw new Error(`Titel mit ID ${title.id} existiert bereits`);
    }
    
    this.titles.set(title.id, title);
    
    // Hierarchie aktualisieren
    if (!this.titleHierarchy.has(title.rank)) {
      this.titleHierarchy.set(title.rank, []);
    }
    this.titleHierarchy.get(title.rank)!.push(title);
    
    // Kulturelle Varianten hinzufügen
    if (title.culturalVariants) {
      Object.entries(title.culturalVariants).forEach(([culture, variant]) => {
        let cultureMap = this.culturalTitles.get(culture);
        if (!cultureMap) {
          cultureMap = new Map();
          this.culturalTitles.set(culture, cultureMap);
        }
        cultureMap.set(title.id, { ...title, ...variant });
      });
    }
  }

  /**
   * Gibt den korrekten Titelnamen basierend auf Geschlecht zurück
   */
  public static getGenderSpecificTitle(titleId: string, gender: Gender, culture?: string): string {
    const title = culture ? 
      this.getTitleForCulture(titleId, culture) : 
      this.titles.get(titleId);
    
    if (!title) return 'Unbekannt';
    
    if (gender === 'female' && title.femaleName) {
      return title.femaleName;
    }
    
    return title.name;
  }

  /**
   * Berechnet den jährlichen Titelertrag
   */
  public static calculateTitleIncome(titleId: string, kingdomStats: any, culture?: string): number {
    const benefits = this.getTitleBenefits(titleId, culture);
    let income = benefits.goldPerYear;
    
    // Steuerbefreiung anwenden
    if (benefits.taxExemption) {
      const taxEfficiency = kingdomStats.taxEfficiency || 1;
      income += (kingdomStats.taxRevenue || 0) * (benefits.taxExemption / 100) * taxEfficiency;
    }
    
    // Weitere Boni basierend auf Königreichsstatistiken
    const tradeBonus = (kingdomStats.tradePower || 0) / 100;
    income *= (1 + tradeBonus);
    
    return Math.floor(income);
  }

  /**
   * Erstellt eine Titelliste für die Anzeige
   */
  public static getTitleDisplayList(culture?: string): Array<{
    id: string;
    name: string;
    rank: number;
    type: TitleType;
    tier: string;
    requirements: TitleRequirements;
  }> {
    const displayList: Array<{
      id: string;
      name: string;
      rank: number;
      type: TitleType;
      tier: string;
      requirements: TitleRequirements;
    }> = [];
    
    this.titles.forEach(title => {
      const displayTitle = culture ? 
        this.getTitleForCulture(title.id, culture) || title : 
        title;
      
      displayList.push({
        id: title.id,
        name: displayTitle.name,
        rank: title.rank,
        type: title.type,
        tier: title.tier,
        requirements: title.requirements
      });
    });
    
    return displayList.sort((a, b) => a.rank - b.rank);
  }
}