// src/core/RoleSwitchingSystem.ts

import { Citizen } from './CitizenSystem';
import { AIControllerManager } from './AIController';

/**
 * Rollenwechsel-Ereignis
 */
export interface RoleSwitchEvent {
  timestamp: number; // Jahr * 12 + Monat
  fromCitizenId: string | null;
  toCitizenId: string;
  reason: string;
}

/**
 * Spieler-Session - Verwaltet den aktuell gespielten Charakter
 */
export interface PlayerSession {
  playerId: string;
  currentCitizenId: string | null;
  previousCitizenIds: string[]; // Historie der gespielten Charaktere
  switchHistory: RoleSwitchEvent[];
  metaKnowledge: Map<string, any>; // Wissen, das über Charakterwechsel hinweg erhalten bleibt
}

/**
 * Rollenwechsel-System
 * Ermöglicht den sofortigen Wechsel zwischen verschiedenen Charakteren
 */
export class RoleSwitchingSystem {
  private sessions: Map<string, PlayerSession> = new Map();
  private aiControllerManager: AIControllerManager;
  
  constructor(aiControllerManager: AIControllerManager) {
    this.aiControllerManager = aiControllerManager;
  }
  
  /**
   * Erstellt eine neue Spieler-Session
   */
  public createSession(playerId: string): PlayerSession {
    const session: PlayerSession = {
      playerId,
      currentCitizenId: null,
      previousCitizenIds: [],
      switchHistory: [],
      metaKnowledge: new Map()
    };
    
    this.sessions.set(playerId, session);
    return session;
  }
  
  /**
   * Holt eine Session
   */
  public getSession(playerId: string): PlayerSession | undefined {
    return this.sessions.get(playerId);
  }
  
  /**
   * Wechselt die Rolle (Charakter) für einen Spieler
   */
  public switchRole(
    playerId: string,
    newCitizenId: string,
    getCitizen: (id: string) => Citizen | undefined,
    updateCitizen: (id: string, updates: Partial<Citizen>) => void,
    currentYear: number,
    currentMonth: number,
    reason: string = 'Spielerwahl'
  ): boolean {
    const session = this.sessions.get(playerId);
    if (!session) {
      console.error(`Session für Spieler ${playerId} nicht gefunden`);
      return false;
    }
    
    const newCitizen = getCitizen(newCitizenId);
    if (!newCitizen || !newCitizen.isAlive) {
      console.error(`Bürger ${newCitizenId} nicht gefunden oder tot`);
      return false;
    }
    
    // Alten Charakter zur KI-Kontrolle übergeben
    if (session.currentCitizenId) {
      const oldCitizen = getCitizen(session.currentCitizenId);
      if (oldCitizen) {
        // Charakter-Kontrolle entfernen
        updateCitizen(session.currentCitizenId, {
          controlledByPlayerId: undefined,
          isPlayerCharacter: false
        });
        
        // AI-Controller erstellen/aktivieren
        const aiType = this.aiControllerManager.determineAIType(oldCitizen);
        this.aiControllerManager.getOrCreateController(session.currentCitizenId, aiType);
        
        console.log(`Charakter ${oldCitizen.firstName} ${oldCitizen.lastName} wird nun von KI gesteuert (${aiType})`);
      }
    }
    
    // Neuen Charakter übernehmen
    updateCitizen(newCitizenId, {
      controlledByPlayerId: playerId,
      isPlayerCharacter: true
    });
    
    // Wechsel in Session speichern
    const switchEvent: RoleSwitchEvent = {
      timestamp: currentYear * 12 + currentMonth,
      fromCitizenId: session.currentCitizenId,
      toCitizenId: newCitizenId,
      reason
    };
    
    if (session.currentCitizenId) {
      session.previousCitizenIds.push(session.currentCitizenId);
    }
    
    session.currentCitizenId = newCitizenId;
    session.switchHistory.push(switchEvent);
    
    console.log(`Rollenwechsel: Jetzt spielst du ${newCitizen.firstName} ${newCitizen.lastName} (${newCitizen.profession})`);
    
    return true;
  }
  
  /**
   * Wechselt zurück zum vorherigen Charakter
   */
  public switchToPrevious(
    playerId: string,
    getCitizen: (id: string) => Citizen | undefined,
    updateCitizen: (id: string, updates: Partial<Citizen>) => void,
    currentYear: number,
    currentMonth: number
  ): boolean {
    const session = this.sessions.get(playerId);
    if (!session || session.previousCitizenIds.length === 0) {
      return false;
    }
    
    const previousCitizenId = session.previousCitizenIds[session.previousCitizenIds.length - 1];
    const previousCitizen = getCitizen(previousCitizenId);
    
    if (!previousCitizen || !previousCitizen.isAlive) {
      // Entferne toten Charakter aus Historie
      session.previousCitizenIds.pop();
      return this.switchToPrevious(playerId, getCitizen, updateCitizen, currentYear, currentMonth);
    }
    
    // Entferne aus previousCitizenIds (wird beim Wechsel wieder hinzugefügt)
    session.previousCitizenIds.pop();
    
    return this.switchRole(
      playerId,
      previousCitizenId,
      getCitizen,
      updateCitizen,
      currentYear,
      currentMonth,
      'Zurück zum vorherigen Charakter'
    );
  }
  
  /**
   * Speichert Meta-Wissen (spielerübergreifendes Wissen)
   */
  public storeMetaKnowledge(playerId: string, key: string, value: any): void {
    const session = this.sessions.get(playerId);
    if (session) {
      session.metaKnowledge.set(key, value);
    }
  }
  
  /**
   * Ruft Meta-Wissen ab
   */
  public getMetaKnowledge(playerId: string, key: string): any {
    const session = this.sessions.get(playerId);
    return session?.metaKnowledge.get(key);
  }
  
  /**
   * Holt alle spielbaren Charaktere (lebende Bürger)
   */
  public getPlayableCharacters(
    getAllCitizens: () => Citizen[],
    filters?: {
      regionId?: string;
      profession?: string;
      socialClass?: string;
      minAge?: number;
      maxAge?: number;
    }
  ): Citizen[] {
    let citizens = getAllCitizens().filter(c => c.isAlive);
    
    if (filters) {
      if (filters.regionId) {
        citizens = citizens.filter(c => c.regionId === filters.regionId);
      }
      if (filters.profession) {
        citizens = citizens.filter(c => c.profession === filters.profession);
      }
      if (filters.socialClass) {
        citizens = citizens.filter(c => c.socialClass === filters.socialClass);
      }
      if (filters.minAge !== undefined) {
        citizens = citizens.filter(c => c.age >= filters.minAge!);
      }
      if (filters.maxAge !== undefined) {
        citizens = citizens.filter(c => c.age <= filters.maxAge!);
      }
    }
    
    return citizens;
  }
  
  /**
   * Holt Wechselhistorie eines Spielers
   */
  public getSwitchHistory(playerId: string): RoleSwitchEvent[] {
    const session = this.sessions.get(playerId);
    return session ? [...session.switchHistory] : [];
  }
  
  /**
   * Holt aktuell gespielten Charakter
   */
  public getCurrentCharacter(
    playerId: string,
    getCitizen: (id: string) => Citizen | undefined
  ): Citizen | null {
    const session = this.sessions.get(playerId);
    if (!session || !session.currentCitizenId) {
      return null;
    }
    
    return getCitizen(session.currentCitizenId) || null;
  }
  
  /**
   * Erstellt Snapshot der aktuellen Session
   */
  public createSessionSnapshot(playerId: string): any {
    const session = this.sessions.get(playerId);
    if (!session) {
      return null;
    }
    
    return {
      playerId: session.playerId,
      currentCitizenId: session.currentCitizenId,
      previousCitizenIds: [...session.previousCitizenIds],
      switchHistory: [...session.switchHistory],
      metaKnowledge: Object.fromEntries(session.metaKnowledge)
    };
  }
  
  /**
   * Lädt Session aus Snapshot
   */
  public loadSessionSnapshot(snapshot: any): void {
    const session: PlayerSession = {
      playerId: snapshot.playerId,
      currentCitizenId: snapshot.currentCitizenId,
      previousCitizenIds: snapshot.previousCitizenIds || [],
      switchHistory: snapshot.switchHistory || [],
      metaKnowledge: new Map(Object.entries(snapshot.metaKnowledge || {}))
    };
    
    this.sessions.set(snapshot.playerId, session);
  }
  
  /**
   * Prüft ob ein Charakter verfügbar zum Spielen ist
   */
  public isCharacterAvailable(citizen: Citizen): boolean {
    return citizen.isAlive && !citizen.isPlayerCharacter;
  }
  
  /**
   * Holt empfohlene Charaktere basierend auf dem aktuellen Charakter
   */
  public getRecommendedCharacters(
    playerId: string,
    getCitizen: (id: string) => Citizen | undefined,
    getAllCitizens: () => Citizen[]
  ): Citizen[] {
    const currentCharacter = this.getCurrentCharacter(playerId, getCitizen);
    if (!currentCharacter) {
      return [];
    }
    
    const recommendations: Citizen[] = [];
    
    // 1. Familienmitglieder
    for (const relation of currentCharacter.familyRelations) {
      const relative = getCitizen(relation.citizenId);
      if (relative && this.isCharacterAvailable(relative)) {
        recommendations.push(relative);
      }
    }
    
    // 2. Enge soziale Verbindungen
    const closeRelations = currentCharacter.socialRelations
      .filter(r => r.strength > 50)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);
    
    for (const relation of closeRelations) {
      const friend = getCitizen(relation.citizenId);
      if (friend && this.isCharacterAvailable(friend) && !recommendations.includes(friend)) {
        recommendations.push(friend);
      }
    }
    
    // 3. Interessante Charaktere in der gleichen Region
    const sameRegion = getAllCitizens().filter(c =>
      c.regionId === currentCharacter.regionId &&
      this.isCharacterAvailable(c) &&
      c.id !== currentCharacter.id &&
      !recommendations.includes(c)
    );
    
    // Sortiere nach interessanten Eigenschaften
    sameRegion.sort((a, b) => {
      const scoreA = this.calculateInterestScore(a);
      const scoreB = this.calculateInterestScore(b);
      return scoreB - scoreA;
    });
    
    recommendations.push(...sameRegion.slice(0, 3));
    
    return recommendations;
  }
  
  /**
   * Berechnet Interesse-Score für einen Charakter
   */
  private calculateInterestScore(citizen: Citizen): number {
    let score = 0;
    
    // Hohe soziale Klasse
    if (citizen.socialClass === 'royal') score += 100;
    else if (citizen.socialClass === 'noble') score += 50;
    else if (citizen.socialClass === 'middle') score += 25;
    
    // Reichtum
    score += Math.min(citizen.wealth / 100, 50);
    
    // Reputation
    score += Math.abs(citizen.reputation) / 2; // Auch negative Reputation ist interessant
    
    // Viele Beziehungen
    score += citizen.socialRelations.length * 2;
    
    // Hohe Fähigkeiten
    const maxSkill = Math.max(
      citizen.skills.agriculture,
      citizen.skills.combat,
      citizen.skills.craftsmanship,
      citizen.skills.diplomacy,
      citizen.skills.leadership,
      citizen.skills.literacy,
      citizen.skills.medicine,
      citizen.skills.trading
    );
    score += maxSkill / 2;
    
    return score;
  }
}
