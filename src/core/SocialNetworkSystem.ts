// src/core/SocialNetworkSystem.ts

import type { Citizen, CitizenSystem, SocialRelation } from './CitizenSystem';

/**
 * Nachricht/Gerücht im sozialen Netzwerk
 */
export interface Message {
  id: string;
  type: 'news' | 'rumor' | 'propaganda' | 'gossip';
  content: string;
  originCitizenId: string;
  year: number;
  month: number;
  regionId: string;
  spreadRate: number; // 0-100: Wie schnell es sich verbreitet
  believability: number; // 0-100: Wie glaubwürdig
  reachedCitizenIds: Set<string>;
}

/**
 * Soziale Bewegung
 */
export interface SocialMovement {
  id: string;
  name: string;
  type: 'revolution' | 'reform' | 'protest' | 'cult' | 'guild' | 'party';
  ideology: string;
  leaderId?: string; // Bürger oder Spieler
  leaderPlayerId?: string; // Spieler, der die Bewegung anführt
  memberIds: Set<string>;
  supporters: number; // Anzahl Unterstützer
  influence: number; // 0-100: Politischer Einfluss
  regionId: string;
  foundedYear: number;
  foundedMonth: number;
  active: boolean;
  goals: string[];
  achievements: string[];
}

/**
 * Informationsverbreitungs-Event
 */
export interface InformationSpreadEvent {
  messageId: string;
  fromCitizenId: string;
  toCitizenId: string;
  year: number;
  month: number;
  believed: boolean;
}

/**
 * System zur Verwaltung sozialer Netzwerke und Informationsverbreitung
 */
export class SocialNetworkSystem {
  private messages: Map<string, Message> = new Map();
  private movements: Map<string, SocialMovement> = new Map();
  private spreadEvents: InformationSpreadEvent[] = [];
  
  /**
   * Erstellt eine Freundschaft zwischen zwei Bürgern
   */
  public createFriendship(
    citizenSystem: CitizenSystem,
    citizen1Id: string,
    citizen2Id: string,
    strength: number = 50,
    year: number
  ): boolean {
    const citizen1 = citizenSystem.getCitizen(citizen1Id);
    const citizen2 = citizenSystem.getCitizen(citizen2Id);
    
    if (!citizen1 || !citizen2) return false;
    
    // Prüfen ob bereits eine Beziehung existiert
    const existing1 = citizen1.socialRelations.find(r => r.citizenId === citizen2Id);
    const existing2 = citizen2.socialRelations.find(r => r.citizenId === citizen1Id);
    
    if (existing1 || existing2) return false;
    
    const relation1: SocialRelation = {
      citizenId: citizen2Id,
      relationType: 'friend',
      strength: Math.max(-100, Math.min(100, strength)),
      since: year
    };
    
    const relation2: SocialRelation = {
      citizenId: citizen1Id,
      relationType: 'friend',
      strength: Math.max(-100, Math.min(100, strength)),
      since: year
    };
    
    citizen1.socialRelations.push(relation1);
    citizen2.socialRelations.push(relation2);
    
    return true;
  }
  
  /**
   * Erstellt eine Feindschaft zwischen zwei Bürgern
   */
  public createEnmity(
    citizenSystem: CitizenSystem,
    citizen1Id: string,
    citizen2Id: string,
    strength: number = -50,
    year: number
  ): boolean {
    const citizen1 = citizenSystem.getCitizen(citizen1Id);
    const citizen2 = citizenSystem.getCitizen(citizen2Id);
    
    if (!citizen1 || !citizen2) return false;
    
    const relation1: SocialRelation = {
      citizenId: citizen2Id,
      relationType: 'enemy',
      strength: Math.max(-100, Math.min(0, strength)),
      since: year
    };
    
    const relation2: SocialRelation = {
      citizenId: citizen1Id,
      relationType: 'enemy',
      strength: Math.max(-100, Math.min(0, strength)),
      since: year
    };
    
    citizen1.socialRelations.push(relation1);
    citizen2.socialRelations.push(relation2);
    
    return true;
  }
  
  /**
   * Holt alle Freunde eines Bürgers
   */
  public getFriends(citizen: Citizen, citizenSystem: CitizenSystem): Citizen[] {
    return citizen.socialRelations
      .filter(r => r.relationType === 'friend' && r.strength > 0)
      .map(r => citizenSystem.getCitizen(r.citizenId))
      .filter((c): c is Citizen => c !== undefined && c.isAlive);
  }
  
  /**
   * Holt alle Feinde eines Bürgers
   */
  public getEnemies(citizen: Citizen, citizenSystem: CitizenSystem): Citizen[] {
    return citizen.socialRelations
      .filter(r => r.relationType === 'enemy' && r.strength < 0)
      .map(r => citizenSystem.getCitizen(r.citizenId))
      .filter((c): c is Citizen => c !== undefined && c.isAlive);
  }
  
  /**
   * Aktualisiert eine soziale Beziehung
   */
  public updateRelationship(
    citizen: Citizen,
    targetCitizenId: string,
    strengthChange: number
  ): void {
    const relation = citizen.socialRelations.find(r => r.citizenId === targetCitizenId);
    if (relation) {
      relation.strength = Math.max(-100, Math.min(100, relation.strength + strengthChange));
      
      // Beziehungstyp anpassen
      if (relation.strength > 30) {
        relation.relationType = 'friend';
      } else if (relation.strength < -30) {
        relation.relationType = 'enemy';
      } else {
        relation.relationType = 'colleague';
      }
    }
  }
  
  /**
   * Erstellt eine neue Nachricht/Gerücht
   */
  public createMessage(
    type: 'news' | 'rumor' | 'propaganda' | 'gossip',
    content: string,
    originCitizenId: string,
    regionId: string,
    year: number,
    month: number,
    spreadRate: number = 50,
    believability: number = 50
  ): Message {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      type,
      content,
      originCitizenId,
      year,
      month,
      regionId,
      spreadRate,
      believability,
      reachedCitizenIds: new Set([originCitizenId])
    };
    
    this.messages.set(message.id, message);
    return message;
  }
  
  /**
   * Verarbeitet Informationsverbreitung
   */
  public processInformationSpread(
    citizenSystem: CitizenSystem,
    currentYear: number,
    currentMonth: number
  ): void {
    for (const message of this.messages.values()) {
      // Nur aktuelle Nachrichten (maximal 12 Monate alt)
      const monthsOld = (currentYear - message.year) * 12 + (currentMonth - message.month);
      if (monthsOld > 12) continue;
      
      const reachedCitizens = Array.from(message.reachedCitizenIds)
        .map(id => citizenSystem.getCitizen(id))
        .filter((c): c is Citizen => c !== undefined && c.isAlive);
      
      // Jeder erreichte Bürger kann die Nachricht weiterverbreiten
      for (const citizen of reachedCitizens) {
        // Freunde und Familie sind wahrscheinlichere Ziele
        const friends = this.getFriends(citizen, citizenSystem);
        const family = citizen.familyRelations
          .map(r => citizenSystem.getCitizen(r.citizenId))
          .filter((c): c is Citizen => c !== undefined && c.isAlive);
        
        const potentialRecipients = [...friends, ...family];
        
        for (const recipient of potentialRecipients) {
          if (message.reachedCitizenIds.has(recipient.id)) continue;
          
          // Wahrscheinlichkeit der Verbreitung
          const spreadChance = (message.spreadRate / 100) * (citizen.personality.charisma / 100);
          
          if (Math.random() < spreadChance) {
            message.reachedCitizenIds.add(recipient.id);
            
            // Glaubwürdigkeit prüfen
            const beliefChance = (message.believability / 100) * (recipient.personality.intelligence / 100);
            const believed = Math.random() < beliefChance;
            
            this.spreadEvents.push({
              messageId: message.id,
              fromCitizenId: citizen.id,
              toCitizenId: recipient.id,
              year: currentYear,
              month: currentMonth,
              believed
            });
            
            // Einfluss auf Meinung und Verhalten
            if (believed && message.type === 'propaganda') {
              recipient.happiness += (message.believability > 70 ? 5 : -5);
            }
          }
        }
      }
    }
  }
  
  /**
   * Erstellt eine soziale Bewegung
   */
  public createMovement(
    name: string,
    type: 'revolution' | 'reform' | 'protest' | 'cult' | 'guild' | 'party',
    ideology: string,
    regionId: string,
    foundedYear: number,
    foundedMonth: number,
    leaderId?: string,
    leaderPlayerId?: string
  ): SocialMovement {
    const movement: SocialMovement = {
      id: `mov_${Date.now()}_${Math.random()}`,
      name,
      type,
      ideology,
      leaderId,
      leaderPlayerId,
      memberIds: new Set(),
      supporters: 0,
      influence: 0,
      regionId,
      foundedYear,
      foundedMonth,
      active: true,
      goals: [],
      achievements: []
    };
    
    this.movements.set(movement.id, movement);
    return movement;
  }
  
  /**
   * Fügt einen Bürger zu einer Bewegung hinzu
   */
  public joinMovement(
    movement: SocialMovement,
    citizenId: string,
    citizen: Citizen
  ): boolean {
    if (movement.memberIds.has(citizenId)) return false;
    
    // Prüfen ob Persönlichkeit zur Bewegung passt
    let joinChance = 0.1; // Basis 10%
    
    if (movement.type === 'revolution' && citizen.personality.courage > 70) {
      joinChance += 0.3;
    }
    if (movement.type === 'reform' && citizen.personality.intelligence > 70) {
      joinChance += 0.2;
    }
    if (citizen.happiness < 40) {
      joinChance += 0.2; // Unglückliche Bürger sind empfänglicher
    }
    
    // Freunde in der Bewegung erhöhen Chance
    const friendsInMovement = citizen.socialRelations.filter(r => 
      r.relationType === 'friend' && movement.memberIds.has(r.citizenId)
    ).length;
    joinChance += friendsInMovement * 0.1;
    
    if (Math.random() < Math.min(0.9, joinChance)) {
      movement.memberIds.add(citizenId);
      movement.supporters++;
      return true;
    }
    
    return false;
  }
  
  /**
   * Entfernt einen Bürger aus einer Bewegung
   */
  public leaveMovement(movement: SocialMovement, citizenId: string): boolean {
    if (!movement.memberIds.has(citizenId)) return false;
    
    movement.memberIds.delete(citizenId);
    movement.supporters = Math.max(0, movement.supporters - 1);
    
    return true;
  }
  
  /**
   * Verarbeitet soziale Bewegungen
   */
  public processMovements(
    citizenSystem: CitizenSystem,
    currentYear: number,
    _currentMonth: number
  ): void {
    for (const movement of this.movements.values()) {
      if (!movement.active) continue;
      
      // Rekrutierung neuer Mitglieder
      const regionalCitizens = citizenSystem.getCitizensByRegion(movement.regionId)
        .filter(c => c.isAlive && !movement.memberIds.has(c.id));
      
      // Nur rekrutieren wenn Bürger verfügbar sind
      if (regionalCitizens.length > 0) {
        // Versuche monatlich einige neue Mitglieder zu rekrutieren
        const recruitmentAttempts = Math.min(10, Math.floor(movement.supporters * 0.01));
        
        for (let i = 0; i < recruitmentAttempts; i++) {
          const randomCitizen = regionalCitizens[Math.floor(Math.random() * regionalCitizens.length)];
          if (randomCitizen) {
            this.joinMovement(movement, randomCitizen.id, randomCitizen);
          }
        }
      }
      
      // Einfluss aktualisieren
      movement.influence = Math.min(100, movement.supporters / 100);
      
      // Bewegung kann inaktiv werden wenn zu wenig Unterstützer
      if (movement.supporters < 5) {
        movement.active = false;
      }
      
      // Revolution kann erfolgreich sein
      if (movement.type === 'revolution' && movement.influence > 70) {
        movement.achievements.push(`Revolution erfolgreich im Jahr ${currentYear}`);
        // Hier könnten weitere Effekte implementiert werden
      }
    }
  }
  
  /**
   * Erlaubt einem Spieler, eine Bewegung anzuführen
   */
  public assignPlayerLeadership(movementId: string, playerId: string): boolean {
    const movement = this.movements.get(movementId);
    if (!movement) return false;
    
    movement.leaderPlayerId = playerId;
    movement.influence = Math.min(100, movement.influence + 20); // Spieler erhöht Einfluss
    
    return true;
  }
  
  /**
   * Holt alle aktiven Bewegungen
   */
  public getActiveMovements(): SocialMovement[] {
    return Array.from(this.movements.values()).filter(m => m.active);
  }
  
  /**
   * Holt alle Bewegungen in einer Region
   */
  public getRegionalMovements(regionId: string): SocialMovement[] {
    return Array.from(this.movements.values())
      .filter(m => m.active && m.regionId === regionId);
  }
  
  /**
   * Holt alle Bewegungen, die ein Spieler anführt
   */
  public getPlayerLedMovements(playerId: string): SocialMovement[] {
    return Array.from(this.movements.values())
      .filter(m => m.active && m.leaderPlayerId === playerId);
  }
  
  /**
   * Holt alle Nachrichten
   */
  public getAllMessages(): Message[] {
    return Array.from(this.messages.values());
  }
  
  /**
   * Holt Nachrichten nach Typ
   */
  public getMessagesByType(type: 'news' | 'rumor' | 'propaganda' | 'gossip'): Message[] {
    return Array.from(this.messages.values()).filter(m => m.type === type);
  }
  
  /**
   * Zählt wie viele Bürger eine Nachricht erreicht hat
   */
  public getMessageReach(messageId: string): number {
    const message = this.messages.get(messageId);
    return message ? message.reachedCitizenIds.size : 0;
  }
  
  /**
   * Generiert automatisch soziale Beziehungen basierend auf Nähe und Gemeinsamkeiten
   */
  public generateSocialRelations(
    citizenSystem: CitizenSystem,
    year: number
  ): void {
    const citizens = citizenSystem.getAllCitizens().filter(c => c.isAlive);
    
    for (const citizen of citizens) {
      // Maximal 10 neue Beziehungen pro Durchlauf
      if (citizen.socialRelations.length >= 20) continue;
      
      // Finde potenzielle Freunde in der gleichen Region und Berufsgruppe
      const potentialFriends = citizens.filter(other => 
        other.id !== citizen.id &&
        other.regionId === citizen.regionId &&
        !citizen.socialRelations.some(r => r.citizenId === other.id) &&
        Math.abs(citizen.age - other.age) < 20 // Ähnliches Alter
      );
      
      // Wähle zufällig einige aus
      const newFriendsCount = Math.floor(Math.random() * 3);
      for (let i = 0; i < newFriendsCount && potentialFriends.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * potentialFriends.length);
        const friend = potentialFriends.splice(randomIndex, 1)[0];
        
        // Beziehungsstärke basiert auf Persönlichkeitskompatibilität
        const compatibility = this.calculateCompatibility(citizen, friend);
        
        if (compatibility > 30) {
          this.createFriendship(citizenSystem, citizen.id, friend.id, compatibility, year);
        }
      }
    }
  }
  
  /**
   * Berechnet Kompatibilität zwischen zwei Bürgern
   */
  private calculateCompatibility(citizen1: Citizen, citizen2: Citizen): number {
    // Persönlichkeitsunterschiede
    const personalityDiff = 
      Math.abs(citizen1.personality.charisma - citizen2.personality.charisma) +
      Math.abs(citizen1.personality.intelligence - citizen2.personality.intelligence) +
      Math.abs(citizen1.personality.ambition - citizen2.personality.ambition);
    
    // Je ähnlicher, desto kompatibler (aber nicht zu ähnlich)
    let compatibility = 100 - (personalityDiff / 3);
    
    // Gemeinsame Interessen (Beruf)
    if (citizen1.profession === citizen2.profession) {
      compatibility += 20;
    }
    
    // Soziale Klasse
    if (citizen1.socialClass === citizen2.socialClass) {
      compatibility += 15;
    }
    
    return Math.max(0, Math.min(100, compatibility));
  }
}
