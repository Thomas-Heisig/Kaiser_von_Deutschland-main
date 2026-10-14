// src/core/LifeSimulationAchievements.ts

import { Citizen } from './CitizenSystem';
import { RoleSwitchingSystem } from './RoleSwitchingSystem';

/**
 * Life Simulation Achievement
 */
export interface LifeAchievement {
  id: string;
  name: string;
  description: string;
  category: 'character' | 'family' | 'social' | 'survival' | 'special';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  condition: (context: AchievementContext) => boolean;
  progress?: (context: AchievementContext) => { current: number; total: number };
}

/**
 * Achievement-Kontext
 */
export interface AchievementContext {
  playerId: string;
  currentCitizen?: Citizen;
  allCitizens: Citizen[];
  roleSwitchingSystem: RoleSwitchingSystem;
  currentYear: number;
  playedCharacterIds: string[];
}

/**
 * Freigeschaltetes Achievement
 */
export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number; // Timestamp
  unlockedYear: number; // Spiel-Jahr
  citizenId?: string; // Welcher Charakter war aktiv
}

/**
 * Life Simulation Achievements System
 */
export class LifeSimulationAchievements {
  private achievements: Map<string, LifeAchievement> = new Map();
  private unlockedAchievements: Map<string, UnlockedAchievement[]> = new Map(); // playerId -> achievements
  
  constructor() {
    this.initializeAchievements();
  }
  
  /**
   * Initialisiert alle Achievements
   */
  private initializeAchievements(): void {
    const achievementsList: LifeAchievement[] = [
      // === Character-Based Achievements ===
      {
        id: 'role_switcher',
        name: 'Rollenwechsler',
        description: 'Wechsle zum ersten Mal die Rolle',
        category: 'character',
        icon: '🔄',
        rarity: 'common',
        points: 10,
        condition: (ctx) => ctx.playedCharacterIds.length >= 2
      },
      {
        id: 'role_veteran',
        name: 'Rollenveteran',
        description: 'Spiele 5 verschiedene Charaktere',
        category: 'character',
        icon: '🎭',
        rarity: 'rare',
        points: 50,
        condition: (ctx) => ctx.playedCharacterIds.length >= 5,
        progress: (ctx) => ({ current: ctx.playedCharacterIds.length, total: 5 })
      },
      {
        id: 'role_master',
        name: 'Rollenmeister',
        description: 'Spiele 10 verschiedene Charaktere',
        category: 'character',
        icon: '🎪',
        rarity: 'epic',
        points: 100,
        condition: (ctx) => ctx.playedCharacterIds.length >= 10,
        progress: (ctx) => ({ current: ctx.playedCharacterIds.length, total: 10 })
      },
      {
        id: 'century_survivor',
        name: 'Jahrhundert-Überlebender',
        description: 'Überlebe 100 Jahre mit einem Charakter',
        category: 'survival',
        icon: '💯',
        rarity: 'legendary',
        points: 200,
        condition: (ctx) => ctx.currentCitizen ? ctx.currentCitizen.age >= 100 : false,
        progress: (ctx) => ({ current: ctx.currentCitizen?.age || 0, total: 100 })
      },
      {
        id: 'rags_to_riches',
        name: 'Vom Tellerwäscher zum Millionär',
        description: 'Erreiche 10000 Reichtum als Bauer oder Arbeiter',
        category: 'character',
        icon: '💰',
        rarity: 'rare',
        points: 75,
        condition: (ctx) => {
          if (!ctx.currentCitizen) return false;
          return (ctx.currentCitizen.profession === 'farmer' || ctx.currentCitizen.profession === 'laborer') &&
                 ctx.currentCitizen.wealth >= 10000;
        }
      },
      {
        id: 'social_climber',
        name: 'Sozialer Aufsteiger',
        description: 'Wechsle von "peasant" zu "noble" Sozialklasse',
        category: 'character',
        icon: '📈',
        rarity: 'epic',
        points: 100,
        condition: () => {
          // TODO: Manually triggered achievement - implement tracking when social class changes
          // Should be unlocked when a character transitions from 'peasant' to 'noble' class
          return false;
        }
      },
      
      // === Family Achievements ===
      {
        id: 'family_starter',
        name: 'Familiengründer',
        description: 'Habe dein erstes Kind',
        category: 'family',
        icon: '👶',
        rarity: 'common',
        points: 10,
        condition: (ctx) => {
          if (!ctx.currentCitizen) return false;
          return ctx.currentCitizen.familyRelations.some(r => r.relationType === 'child');
        }
      },
      {
        id: 'dynasty_builder',
        name: 'Dynastie-Erbauer',
        description: 'Habe 5 lebende Kinder',
        category: 'family',
        icon: '👨‍👩‍👧‍👦',
        rarity: 'rare',
        points: 50,
        condition: (ctx) => {
          if (!ctx.currentCitizen) return false;
          const childIds = ctx.currentCitizen.familyRelations
            .filter(r => r.relationType === 'child')
            .map(r => r.citizenId);
          const livingChildren = ctx.allCitizens.filter(c => childIds.includes(c.id) && c.isAlive);
          return livingChildren.length >= 5;
        },
        progress: (ctx) => {
          if (!ctx.currentCitizen) return { current: 0, total: 5 };
          const childIds = ctx.currentCitizen.familyRelations
            .filter(r => r.relationType === 'child')
            .map(r => r.citizenId);
          const livingChildren = ctx.allCitizens.filter(c => childIds.includes(c.id) && c.isAlive);
          return { current: livingChildren.length, total: 5 };
        }
      },
      {
        id: 'family_legacy',
        name: 'Familienerbe',
        description: 'Habe Enkel',
        category: 'family',
        icon: '👴',
        rarity: 'epic',
        points: 75,
        condition: (ctx) => {
          if (!ctx.currentCitizen) return false;
          return ctx.currentCitizen.familyRelations.some(r => r.relationType === 'grandchild');
        }
      },
      {
        id: 'multi_generational',
        name: 'Multi-Generational',
        description: 'Spiele 3 Generationen der gleichen Familie',
        category: 'family',
        icon: '🌳',
        rarity: 'legendary',
        points: 150,
        condition: () => {
          // TODO: Manually triggered achievement - track family lineage in RoleSwitchingSystem
          // Should be unlocked when player has controlled 3 generations of same family
          return false;
        }
      },
      
      // === Social Achievements ===
      {
        id: 'social_butterfly',
        name: 'Geselliger Schmetterling',
        description: 'Habe 10 Freunde',
        category: 'social',
        icon: '🦋',
        rarity: 'common',
        points: 25,
        condition: (ctx) => {
          if (!ctx.currentCitizen) return false;
          return ctx.currentCitizen.socialRelations.filter(r => r.relationType === 'friend').length >= 10;
        },
        progress: (ctx) => {
          if (!ctx.currentCitizen) return { current: 0, total: 10 };
          const friends = ctx.currentCitizen.socialRelations.filter(r => r.relationType === 'friend').length;
          return { current: friends, total: 10 };
        }
      },
      {
        id: 'beloved',
        name: 'Geliebt',
        description: 'Erreiche 90+ Reputation',
        category: 'social',
        icon: '❤️',
        rarity: 'rare',
        points: 50,
        condition: (ctx) => ctx.currentCitizen ? ctx.currentCitizen.reputation >= 90 : false,
        progress: (ctx) => ({ current: Math.floor(ctx.currentCitizen?.reputation || 0), total: 90 })
      },
      {
        id: 'feared',
        name: 'Gefürchtet',
        description: 'Erreiche -90 Reputation',
        category: 'social',
        icon: '😈',
        rarity: 'rare',
        points: 50,
        condition: (ctx) => ctx.currentCitizen ? ctx.currentCitizen.reputation <= -90 : false
      },
      {
        id: 'mentor',
        name: 'Mentor',
        description: 'Habe 3 Schüler',
        category: 'social',
        icon: '🎓',
        rarity: 'epic',
        points: 75,
        condition: (ctx) => {
          if (!ctx.currentCitizen) return false;
          return ctx.currentCitizen.socialRelations.filter(r => r.relationType === 'student').length >= 3;
        },
        progress: (ctx) => {
          if (!ctx.currentCitizen) return { current: 0, total: 3 };
          const students = ctx.currentCitizen.socialRelations.filter(r => r.relationType === 'student').length;
          return { current: students, total: 3 };
        }
      },
      {
        id: 'networker',
        name: 'Netzwerker',
        description: 'Habe insgesamt 50 soziale Beziehungen',
        category: 'social',
        icon: '🌐',
        rarity: 'epic',
        points: 100,
        condition: (ctx) => ctx.currentCitizen ? ctx.currentCitizen.socialRelations.length >= 50 : false,
        progress: (ctx) => {
          const count = ctx.currentCitizen?.socialRelations.length || 0;
          return { current: count, total: 50 };
        }
      },
      
      // === Survival Achievements ===
      {
        id: 'survivor',
        name: 'Überlebender',
        description: 'Überlebe eine Krankheit',
        category: 'survival',
        icon: '💊',
        rarity: 'common',
        points: 15,
        condition: () => {
          // Wird manuell freigeschaltet nach Krankheit
          return false;
        }
      },
      {
        id: 'disease_immune',
        name: 'Immun',
        description: 'Erreiche 90+ Immunität',
        category: 'survival',
        icon: '🛡️',
        rarity: 'rare',
        points: 50,
        condition: (ctx) => ctx.currentCitizen ? ctx.currentCitizen.health.immunity >= 90 : false
      },
      {
        id: 'war_veteran',
        name: 'Kriegsveteran',
        description: 'Überlebe 3 Kriege',
        category: 'survival',
        icon: '⚔️',
        rarity: 'epic',
        points: 100,
        condition: () => {
          // Muss manuell verfolgt werden
          return false;
        }
      },
      
      // === Special Achievements ===
      {
        id: 'time_traveler',
        name: 'Zeitreisender',
        description: 'Spiele Charaktere in 5 verschiedenen Jahrhunderten',
        category: 'special',
        icon: '⏰',
        rarity: 'legendary',
        points: 200,
        condition: () => {
          // Muss manuell verfolgt werden
          return false;
        }
      },
      {
        id: 'jack_of_all_trades',
        name: 'Tausendsassa',
        description: 'Spiele alle verfügbaren Berufe mindestens einmal',
        category: 'special',
        icon: '🎯',
        rarity: 'legendary',
        points: 250,
        condition: () => {
          // Muss manuell verfolgt werden mit Tracking
          return false;
        }
      },
      {
        id: 'renaissance_person',
        name: 'Renaissance-Mensch',
        description: 'Erreiche 70+ in allen Fähigkeiten',
        category: 'special',
        icon: '🎨',
        rarity: 'legendary',
        points: 300,
        condition: (ctx) => {
          if (!ctx.currentCitizen) return false;
          const skills = ctx.currentCitizen.skills;
          return Object.values(skills).every(v => v >= 70);
        }
      }
    ];
    
    achievementsList.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }
  
  /**
   * Prüft alle Achievements für einen Spieler
   */
  public checkAchievements(context: AchievementContext): UnlockedAchievement[] {
    const newlyUnlocked: UnlockedAchievement[] = [];
    const playerUnlocked = this.unlockedAchievements.get(context.playerId) || [];
    const unlockedIds = new Set(playerUnlocked.map(a => a.achievementId));
    
    for (const achievement of this.achievements.values()) {
      // Überspringe bereits freigeschaltete
      if (unlockedIds.has(achievement.id)) continue;
      
      // Prüfe Bedingung
      if (achievement.condition(context)) {
        const unlocked: UnlockedAchievement = {
          achievementId: achievement.id,
          unlockedAt: Date.now(),
          unlockedYear: context.currentYear,
          citizenId: context.currentCitizen?.id
        };
        
        newlyUnlocked.push(unlocked);
        playerUnlocked.push(unlocked);
      }
    }
    
    if (newlyUnlocked.length > 0) {
      this.unlockedAchievements.set(context.playerId, playerUnlocked);
    }
    
    return newlyUnlocked;
  }
  
  /**
   * Schaltet ein Achievement manuell frei
   */
  public unlockAchievement(
    playerId: string,
    achievementId: string,
    currentYear: number,
    citizenId?: string
  ): boolean {
    const playerUnlocked = this.unlockedAchievements.get(playerId) || [];
    const alreadyUnlocked = playerUnlocked.some(a => a.achievementId === achievementId);
    
    if (alreadyUnlocked) return false;
    
    const unlocked: UnlockedAchievement = {
      achievementId,
      unlockedAt: Date.now(),
      unlockedYear: currentYear,
      citizenId
    };
    
    playerUnlocked.push(unlocked);
    this.unlockedAchievements.set(playerId, playerUnlocked);
    
    return true;
  }
  
  /**
   * Holt alle freigeschalteten Achievements eines Spielers
   */
  public getUnlockedAchievements(playerId: string): UnlockedAchievement[] {
    return this.unlockedAchievements.get(playerId) || [];
  }
  
  /**
   * Holt alle Achievements mit Fortschritt
   */
  public getAllAchievementsWithProgress(context: AchievementContext): Array<{
    achievement: LifeAchievement;
    unlocked: boolean;
    progress?: { current: number; total: number };
  }> {
    const playerUnlocked = this.unlockedAchievements.get(context.playerId) || [];
    const unlockedIds = new Set(playerUnlocked.map(a => a.achievementId));
    
    return Array.from(this.achievements.values()).map(achievement => ({
      achievement,
      unlocked: unlockedIds.has(achievement.id),
      progress: achievement.progress ? achievement.progress(context) : undefined
    }));
  }
  
  /**
   * Berechnet Gesamt-Achievement-Punkte
   */
  public getTotalPoints(playerId: string): number {
    const unlocked = this.getUnlockedAchievements(playerId);
    return unlocked.reduce((sum, u) => {
      const achievement = this.achievements.get(u.achievementId);
      return sum + (achievement?.points || 0);
    }, 0);
  }
  
  /**
   * Holt Achievement-Statistiken
   */
  public getStatistics(playerId: string): {
    totalAchievements: number;
    unlockedAchievements: number;
    totalPoints: number;
    maxPoints: number;
    completionPercentage: number;
    byCategory: Record<string, { unlocked: number; total: number }>;
    byRarity: Record<string, { unlocked: number; total: number }>;
  } {
    const unlocked = this.getUnlockedAchievements(playerId);
    const unlockedIds = new Set(unlocked.map(a => a.achievementId));
    
    const byCategory: Record<string, { unlocked: number; total: number }> = {};
    const byRarity: Record<string, { unlocked: number; total: number }> = {};
    
    let maxPoints = 0;
    
    for (const achievement of this.achievements.values()) {
      // Nach Kategorie
      if (!byCategory[achievement.category]) {
        byCategory[achievement.category] = { unlocked: 0, total: 0 };
      }
      byCategory[achievement.category].total++;
      if (unlockedIds.has(achievement.id)) {
        byCategory[achievement.category].unlocked++;
      }
      
      // Nach Seltenheit
      if (!byRarity[achievement.rarity]) {
        byRarity[achievement.rarity] = { unlocked: 0, total: 0 };
      }
      byRarity[achievement.rarity].total++;
      if (unlockedIds.has(achievement.id)) {
        byRarity[achievement.rarity].unlocked++;
      }
      
      maxPoints += achievement.points;
    }
    
    return {
      totalAchievements: this.achievements.size,
      unlockedAchievements: unlocked.length,
      totalPoints: this.getTotalPoints(playerId),
      maxPoints,
      completionPercentage: (unlocked.length / this.achievements.size) * 100,
      byCategory,
      byRarity
    };
  }
  
  /**
   * Serialisierung
   */
  public serialize(): any {
    const unlockedMap: Record<string, any[]> = {};
    for (const [playerId, achievements] of this.unlockedAchievements) {
      unlockedMap[playerId] = achievements;
    }
    return {
      unlockedAchievements: unlockedMap
    };
  }
  
  /**
   * Deserialisierung
   */
  public deserialize(data: any): void {
    if (data.unlockedAchievements) {
      this.unlockedAchievements.clear();
      for (const [playerId, achievements] of Object.entries(data.unlockedAchievements)) {
        this.unlockedAchievements.set(playerId, achievements as UnlockedAchievement[]);
      }
    }
  }
}
