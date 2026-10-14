// src/core/DiplomacySystem.ts

export type RelationType = 'alliance' | 'trade' | 'war' | 'vassal' | 'neutral' | 'friendly' | 'hostile';
export type TreatyType = 'peace' | 'alliance' | 'trade' | 'non_aggression' | 'vassalage' | 'military_access';
export type MissionType = 'ambassador' | 'trade_delegation' | 'spy' | 'marriage_proposal' | 'alliance_offer';

export interface DiplomaticRelation {
  kingdomId: string;
  kingdomName: string;
  relationType: RelationType;
  relationshipValue: number; // -100 to 100
  trust: number; // 0 to 100
  lastInteraction?: number; // year
}

export interface Treaty {
  id: string;
  type: TreatyType;
  parties: string[]; // kingdom IDs
  signedYear: number;
  expiryYear?: number;
  terms: {
    goldPerYear?: number;
    tradeBonus?: number;
    militarySupport?: boolean;
    territoryExchange?: string[];
    vassalTribute?: number;
  };
  active: boolean;
}

export interface TradeAgreement {
  id: string;
  partnerId: string;
  partnerName: string;
  goldPerTurn: number;
  resourceExchange: {
    give: Partial<{ food: number; wood: number; stone: number; iron: number; luxuryGoods: number }>;
    receive: Partial<{ food: number; wood: number; stone: number; iron: number; luxuryGoods: number }>;
  };
  tradePowerBonus: number;
  startYear: number;
  duration?: number;
  active: boolean;
}

export interface DiplomaticMission {
  id: string;
  type: MissionType;
  targetKingdomId: string;
  targetKingdomName: string;
  startYear: number;
  duration: number;
  cost: number;
  success: boolean | null; // null = in progress
  outcome?: {
    relationshipChange?: number;
    treatyOffered?: Treaty;
    informationGained?: string[];
  };
}

export interface WarDeclaration {
  id: string;
  declaringKingdom: string;
  targetKingdom: string;
  targetKingdomName: string;
  year: number;
  causus_belli: string;
  allies: string[]; // kingdoms that joined the war
  warScore: number; // -100 to 100
  battles: number;
  casualties: number;
}

export interface PeaceOffer {
  id: string;
  offeringKingdom: string;
  receivingKingdom: string;
  receivingKingdomName: string;
  terms: {
    goldCompensation?: number;
    territoryExchange?: string[];
    tradeAgreement?: boolean;
    vassalage?: boolean;
    warReparations?: number;
  };
  accepted: boolean | null; // null = pending
}

export class DiplomacySystem {
  private relations: Map<string, DiplomaticRelation> = new Map();
  private treaties: Map<string, Treaty> = new Map();
  private tradeAgreements: Map<string, TradeAgreement> = new Map();
  private missions: Map<string, DiplomaticMission> = new Map();
  private wars: Map<string, WarDeclaration> = new Map();
  private peaceOffers: Map<string, PeaceOffer> = new Map();
  private currentYear: number = 1;

  constructor(private kingdomId: string) {}

  // Diplomatic Relations
  public initializeRelation(kingdomId: string, kingdomName: string, initialType: RelationType = 'neutral'): void {
    if (!this.relations.has(kingdomId)) {
      this.relations.set(kingdomId, {
        kingdomId,
        kingdomName,
        relationType: initialType,
        relationshipValue: initialType === 'neutral' ? 0 : initialType === 'friendly' ? 25 : -25,
        trust: 50,
      });
    }
  }

  public getRelation(kingdomId: string): DiplomaticRelation | undefined {
    return this.relations.get(kingdomId);
  }

  public getAllRelations(): DiplomaticRelation[] {
    return Array.from(this.relations.values());
  }

  public updateRelationship(kingdomId: string, change: number): void {
    const relation = this.relations.get(kingdomId);
    if (relation) {
      relation.relationshipValue = Math.max(-100, Math.min(100, relation.relationshipValue + change));
      relation.lastInteraction = this.currentYear;
      
      // Update relation type based on value
      if (relation.relationshipValue > 75) relation.relationType = 'friendly';
      else if (relation.relationshipValue < -75) relation.relationType = 'hostile';
      else relation.relationType = 'neutral';
    }
  }

  // Treaties and Alliances
  public proposeTreaty(treaty: Omit<Treaty, 'id'>): string {
    const id = `treaty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.treaties.set(id, { ...treaty, id });
    
    // Update relations for treaty parties
    treaty.parties.forEach(partyId => {
      if (partyId !== this.kingdomId) {
        this.updateRelationship(partyId, 10);
      }
    });
    
    return id;
  }

  public getTreaty(id: string): Treaty | undefined {
    return this.treaties.get(id);
  }

  public getActiveTreaties(): Treaty[] {
    return Array.from(this.treaties.values()).filter(t => t.active);
  }

  public breakTreaty(id: string): void {
    const treaty = this.treaties.get(id);
    if (treaty) {
      treaty.active = false;
      treaty.parties.forEach(partyId => {
        if (partyId !== this.kingdomId) {
          this.updateRelationship(partyId, -30);
          const relation = this.relations.get(partyId);
          if (relation) relation.trust = Math.max(0, relation.trust - 40);
        }
      });
    }
  }

  // Trade Agreements
  public createTradeAgreement(agreement: Omit<TradeAgreement, 'id'>): string {
    const id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.tradeAgreements.set(id, { ...agreement, id });
    this.updateRelationship(agreement.partnerId, 15);
    return id;
  }

  public getTradeAgreement(id: string): TradeAgreement | undefined {
    return this.tradeAgreements.get(id);
  }

  public getActiveTradeAgreements(): TradeAgreement[] {
    return Array.from(this.tradeAgreements.values()).filter(ta => ta.active);
  }

  public cancelTradeAgreement(id: string): void {
    const agreement = this.tradeAgreements.get(id);
    if (agreement) {
      agreement.active = false;
      this.updateRelationship(agreement.partnerId, -10);
    }
  }

  // War Declarations
  public declareWar(targetKingdomId: string, targetKingdomName: string, causus_belli: string): string {
    const id = `war_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const war: WarDeclaration = {
      id,
      declaringKingdom: this.kingdomId,
      targetKingdom: targetKingdomId,
      targetKingdomName,
      year: this.currentYear,
      causus_belli,
      allies: [],
      warScore: 0,
      battles: 0,
      casualties: 0,
    };
    
    this.wars.set(id, war);
    this.updateRelationship(targetKingdomId, -80);
    
    const relation = this.relations.get(targetKingdomId);
    if (relation) {
      relation.relationType = 'war';
    }
    
    return id;
  }

  public getWar(id: string): WarDeclaration | undefined {
    return this.wars.get(id);
  }

  public getActiveWars(): WarDeclaration[] {
    return Array.from(this.wars.values());
  }

  public updateWarScore(warId: string, scoreChange: number): void {
    const war = this.wars.get(warId);
    if (war) {
      war.warScore = Math.max(-100, Math.min(100, war.warScore + scoreChange));
    }
  }

  // Peace Negotiations
  public offerPeace(receivingKingdom: string, receivingKingdomName: string, terms: PeaceOffer['terms']): string {
    const id = `peace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offer: PeaceOffer = {
      id,
      offeringKingdom: this.kingdomId,
      receivingKingdom,
      receivingKingdomName,
      terms,
      accepted: null,
    };
    
    this.peaceOffers.set(id, offer);
    return id;
  }

  public acceptPeaceOffer(offerId: string): void {
    const offer = this.peaceOffers.get(offerId);
    if (offer) {
      offer.accepted = true;
      
      // End all wars between the kingdoms
      this.wars.forEach(war => {
        if (
          (war.declaringKingdom === offer.offeringKingdom && war.targetKingdom === offer.receivingKingdom) ||
          (war.declaringKingdom === offer.receivingKingdom && war.targetKingdom === offer.offeringKingdom)
        ) {
          this.wars.delete(war.id);
        }
      });
      
      // Improve relations
      this.updateRelationship(offer.receivingKingdom, 20);
      
      const relation = this.relations.get(offer.receivingKingdom);
      if (relation && relation.relationType === 'war') {
        relation.relationType = 'neutral';
      }
    }
  }

  public rejectPeaceOffer(offerId: string): void {
    const offer = this.peaceOffers.get(offerId);
    if (offer) {
      offer.accepted = false;
      this.updateRelationship(offer.receivingKingdom, -5);
    }
  }

  public getPendingPeaceOffers(): PeaceOffer[] {
    return Array.from(this.peaceOffers.values()).filter(po => po.accepted === null);
  }

  // Diplomatic Missions
  public sendMission(mission: Omit<DiplomaticMission, 'id' | 'success'>): string {
    const id = `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.missions.set(id, { ...mission, id, success: null });
    return id;
  }

  public getMission(id: string): DiplomaticMission | undefined {
    return this.missions.get(id);
  }

  public getActiveMissions(): DiplomaticMission[] {
    return Array.from(this.missions.values()).filter(m => m.success === null);
  }

  public completeMission(missionId: string, success: boolean, outcome?: DiplomaticMission['outcome']): void {
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.success = success;
      mission.outcome = outcome;
      
      if (success && outcome?.relationshipChange) {
        this.updateRelationship(mission.targetKingdomId, outcome.relationshipChange);
      }
    }
  }

  // Year Updates
  public advanceYear(year: number): void {
    this.currentYear = year;
    
    // Check for expired treaties
    this.treaties.forEach(treaty => {
      if (treaty.expiryYear && treaty.expiryYear <= year) {
        treaty.active = false;
      }
    });
    
    // Check for expired trade agreements
    this.tradeAgreements.forEach(agreement => {
      if (agreement.duration && (this.currentYear - agreement.startYear) >= agreement.duration) {
        agreement.active = false;
      }
    });
    
    // Update ongoing missions
    this.missions.forEach(mission => {
      if (mission.success === null && (this.currentYear - mission.startYear) >= mission.duration) {
        // Auto-complete mission with random success
        const success = Math.random() > 0.3;
        this.completeMission(mission.id, success, {
          relationshipChange: success ? 10 : -5,
        });
      }
    });
  }

  // Serialization
  public serialize(): any {
    return {
      kingdomId: this.kingdomId,
      currentYear: this.currentYear,
      relations: Array.from(this.relations.entries()),
      treaties: Array.from(this.treaties.entries()),
      tradeAgreements: Array.from(this.tradeAgreements.entries()),
      missions: Array.from(this.missions.entries()),
      wars: Array.from(this.wars.entries()),
      peaceOffers: Array.from(this.peaceOffers.entries()),
    };
  }

  public static deserialize(data: any): DiplomacySystem {
    const system = new DiplomacySystem(data.kingdomId);
    system.currentYear = data.currentYear;
    system.relations = new Map(data.relations);
    system.treaties = new Map(data.treaties);
    system.tradeAgreements = new Map(data.tradeAgreements);
    system.missions = new Map(data.missions);
    system.wars = new Map(data.wars);
    system.peaceOffers = new Map(data.peaceOffers);
    return system;
  }
}
