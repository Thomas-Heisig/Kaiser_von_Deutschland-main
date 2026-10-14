/**
 * Information Spread and Social Network System
 * 
 * Manages information flow and social connections:
 * - Rumors and news spreading
 * - Kinship relationships
 * - Friendships and enmities
 * - Social movements and opinion formation
 * 
 * Scalability:
 * - Network sampling for large populations
 * - Limited relationships per citizen (Dunbar's number)
 * - Information spread uses statistical models
 * - Opinion aggregation at regional level
 */

import { ScalabilityConfig } from './ScalabilityConfig';

/**
 * Relationship types
 */
export type RelationshipType = 'family' | 'friend' | 'enemy' | 'acquaintance' | 'romantic' | 'rival' | 'mentor';

/**
 * Information types
 */
export type InformationType = 'rumor' | 'news' | 'scandal' | 'military_intelligence' | 'economic_info' | 'political_opinion';

/**
 * Social relationship
 */
export interface SocialRelationship {
  /** Unique ID */
  id: string;
  /** Person A */
  citizenAId: string;
  /** Person B */
  citizenBId: string;
  /** Relationship type */
  type: RelationshipType;
  /** Strength (0-100) */
  strength: number;
  /** Since when (timestamp) */
  since: number;
  /** Last interaction */
  lastInteraction: number;
}

/**
 * Information piece
 */
export interface Information {
  /** Information ID */
  id: string;
  /** Type */
  type: InformationType;
  /** Content (short description) */
  content: string;
  /** Accuracy (0-100) */
  accuracy: number;
  /** Spread speed (how fast it spreads) */
  spreadSpeed: number;
  /** Origin (who started it) */
  originId: string;
  /** Region of origin */
  originRegion: string;
  /** Creation time */
  created: number;
  /** People who know this */
  knownBy: Set<string>; // Citizen IDs
  /** Regional penetration */
  regionalPenetration: Map<string, number>; // Region -> percentage (0-100)
}

/**
 * Opinion on a topic
 */
export interface Opinion {
  /** Topic ID */
  topicId: string;
  /** Topic description */
  topic: string;
  /** Citizen's stance (-100 to +100) */
  stance: number;
  /** Conviction (how strongly held, 0-100) */
  conviction: number;
  /** Influenced by */
  influencedBy: string[]; // Citizen IDs
}

/**
 * Social circle/network
 */
export interface SocialCircle {
  /** Circle ID */
  id: string;
  /** Type/purpose */
  type: 'family_clan' | 'friend_group' | 'professional_network' | 'political_faction' | 'religious_group';
  /** Members */
  members: string[]; // Citizen IDs
  /** Cohesion (0-100) */
  cohesion: number;
  /** Influence */
  influence: number;
  /** Region */
  region: string;
}

/**
 * Information Spread and Social Network System
 */
export class InformationSpreadSystem {
  private relationships: Map<string, SocialRelationship> = new Map();
  private citizenRelationships: Map<string, string[]> = new Map(); // Citizen -> Relationship IDs
  private information: Map<string, Information> = new Map();
  private citizenOpinions: Map<string, Opinion[]> = new Map();
  private socialCircles: Map<string, SocialCircle> = new Map();
  private scalabilityConfig: ScalabilityConfig;
  private maxInformationTracked: number = 10000;

  constructor() {
    this.scalabilityConfig = ScalabilityConfig.getInstance();
  }

  /**
   * Create a relationship between two citizens
   */
  public createRelationship(
    citizenAId: string,
    citizenBId: string,
    type: RelationshipType,
    strength: number
  ): SocialRelationship | null {
    // Check if both citizens are under relationship limit
    const maxRel = this.scalabilityConfig.getMaxRelationships();
    
    const aRelCount = this.citizenRelationships.get(citizenAId)?.length || 0;
    const bRelCount = this.citizenRelationships.get(citizenBId)?.length || 0;

    if (aRelCount >= maxRel || bRelCount >= maxRel) {
      return null; // Cannot add more relationships
    }

    const id = `rel_${citizenAId}_${citizenBId}_${Date.now()}`;

    const relationship: SocialRelationship = {
      id,
      citizenAId,
      citizenBId,
      type,
      strength,
      since: Date.now(),
      lastInteraction: Date.now()
    };

    this.relationships.set(id, relationship);

    // Add to citizen indexes
    if (!this.citizenRelationships.has(citizenAId)) {
      this.citizenRelationships.set(citizenAId, []);
    }
    if (!this.citizenRelationships.has(citizenBId)) {
      this.citizenRelationships.set(citizenBId, []);
    }

    this.citizenRelationships.get(citizenAId)!.push(id);
    this.citizenRelationships.get(citizenBId)!.push(id);

    return relationship;
  }

  /**
   * Create a piece of information (rumor, news, etc.)
   */
  public createInformation(
    type: InformationType,
    content: string,
    accuracy: number,
    originId: string,
    originRegion: string
  ): Information {
    // Limit tracked information for scalability
    if (this.information.size >= this.maxInformationTracked) {
      this.pruneOldInformation();
    }

    const id = `info_${Date.now()}_${Math.random()}`;

    // Spread speed based on type
    let spreadSpeed = 1.0;
    switch (type) {
      case 'rumor': spreadSpeed = 2.0; break;
      case 'scandal': spreadSpeed = 3.0; break;
      case 'news': spreadSpeed = 1.5; break;
      case 'military_intelligence': spreadSpeed = 0.5; break;
      case 'economic_info': spreadSpeed = 1.0; break;
      case 'political_opinion': spreadSpeed = 1.0; break;
    }

    const info: Information = {
      id,
      type,
      content,
      accuracy,
      spreadSpeed,
      originId,
      originRegion,
      created: Date.now(),
      knownBy: new Set([originId]),
      regionalPenetration: new Map([[originRegion, 0.01]]) // Starts with 1% in origin
    };

    this.information.set(id, info);
    return info;
  }

  /**
   * Update information spread
   */
  public updateInformationSpread(deltaTime: number): void {
    const days = deltaTime / (24 * 3600 * 1000);

    for (const info of this.information.values()) {
      // For scalability, use regional penetration instead of individual tracking
      // for large populations
      if (this.scalabilityConfig.shouldUseAggregatedSimulation()) {
        this.spreadInformationRegionally(info, days);
      } else {
        this.spreadInformationIndividually(info, days);
      }
    }
  }

  /**
   * Spread information regionally (for large populations)
   */
  private spreadInformationRegionally(info: Information, days: number): void {
    for (const [region, penetration] of info.regionalPenetration.entries()) {
      if (penetration >= 100) continue; // Already fully spread

      // Spread within region
      const spreadRate = info.spreadSpeed * 5; // % per day
      const newPenetration = Math.min(100, penetration + spreadRate * days);
      info.regionalPenetration.set(region, newPenetration);

      // Spread to neighboring regions
      if (penetration > 50 && Math.random() < 0.2 * days) {
        // Would get neighboring regions from a map system
        // For now, simplified
        const neighborRegion = `neighbor_${region}`;
        if (!info.regionalPenetration.has(neighborRegion)) {
          info.regionalPenetration.set(neighborRegion, 1);
        }
      }
    }
  }

  /**
   * Spread information individually (for small populations)
   */
  private spreadInformationIndividually(info: Information, days: number): void {
    const spreadChance = info.spreadSpeed * 0.1 * days; // Chance per relationship

    // Sample who knows it
    const knowers = Array.from(info.knownBy);
    const sampleSize = this.scalabilityConfig.getSocialInteractionSampleSize(knowers.length);
    const sampledKnowers = this.sampleArray(knowers, sampleSize);

    for (const knowerId of sampledKnowers) {
      const relationships = this.citizenRelationships.get(knowerId) || [];

      for (const relId of relationships) {
        const rel = this.relationships.get(relId);
        if (!rel) continue;

        // Get the other person in relationship
        const otherId = rel.citizenAId === knowerId ? rel.citizenBId : rel.citizenAId;

        // Check if they already know
        if (info.knownBy.has(otherId)) continue;

        // Chance to spread based on relationship strength
        if (Math.random() < spreadChance * (rel.strength / 100)) {
          info.knownBy.add(otherId);
          
          // Accuracy degrades as it spreads (like telephone game)
          if (Math.random() < 0.1) {
            info.accuracy = Math.max(0, info.accuracy - 5);
          }
        }
      }
    }
  }

  /**
   * Sample array for scalability
   */
  private sampleArray<T>(array: T[], sampleSize: number): T[] {
    if (array.length <= sampleSize) return array;

    const sampled: T[] = [];
    const indices = new Set<number>();

    while (sampled.length < sampleSize) {
      const index = Math.floor(Math.random() * array.length);
      if (!indices.has(index)) {
        indices.add(index);
        sampled.push(array[index]);
      }
    }

    return sampled;
  }

  /**
   * Create social circle
   */
  public createSocialCircle(
    type: SocialCircle['type'],
    members: string[],
    region: string
  ): SocialCircle {
    const id = `circle_${Date.now()}_${Math.random()}`;

    const circle: SocialCircle = {
      id,
      type,
      members,
      cohesion: 50 + Math.random() * 30, // 50-80
      influence: members.length * 2,
      region
    };

    this.socialCircles.set(id, circle);
    return circle;
  }

  /**
   * Get citizen's relationships
   */
  public getCitizenRelationships(citizenId: string): SocialRelationship[] {
    const relIds = this.citizenRelationships.get(citizenId) || [];
    return relIds.map(id => this.relationships.get(id)).filter(r => r !== undefined) as SocialRelationship[];
  }

  /**
   * Get information known by citizen
   */
  public getCitizenInformation(citizenId: string): Information[] {
    const info: Information[] = [];

    for (const infoItem of this.information.values()) {
      if (infoItem.knownBy.has(citizenId)) {
        info.push(infoItem);
      }
    }

    return info;
  }

  /**
   * Get information by region (for large-scale queries)
   */
  public getRegionalInformation(regionId: string, minPenetration: number = 10): Information[] {
    const info: Information[] = [];

    for (const infoItem of this.information.values()) {
      const penetration = infoItem.regionalPenetration.get(regionId) || 0;
      if (penetration >= minPenetration) {
        info.push(infoItem);
      }
    }

    return info;
  }

  /**
   * Update relationship decay
   */
  public updateRelationships(): void {
    const now = Date.now();
    const relationshipsToRemove: string[] = [];

    for (const [id, rel] of this.relationships.entries()) {
      // Decay strength if no recent interaction
      const daysSinceInteraction = (now - rel.lastInteraction) / (24 * 3600 * 1000);

      if (daysSinceInteraction > 30) {
        rel.strength = Math.max(0, rel.strength - daysSinceInteraction * 0.1);
      }

      // Remove very weak relationships
      if (rel.strength < 10 && rel.type === 'acquaintance') {
        relationshipsToRemove.push(id);
      }
    }

    // Remove weak relationships
    for (const id of relationshipsToRemove) {
      this.removeRelationship(id);
    }
  }

  /**
   * Remove a relationship
   */
  private removeRelationship(id: string): void {
    const rel = this.relationships.get(id);
    if (!rel) return;

    // Remove from citizen indexes
    const aRels = this.citizenRelationships.get(rel.citizenAId);
    if (aRels) {
      const index = aRels.indexOf(id);
      if (index >= 0) aRels.splice(index, 1);
    }

    const bRels = this.citizenRelationships.get(rel.citizenBId);
    if (bRels) {
      const index = bRels.indexOf(id);
      if (index >= 0) bRels.splice(index, 1);
    }

    this.relationships.delete(id);
  }

  /**
   * Prune old information
   */
  private pruneOldInformation(): void {
    const infoArray = Array.from(this.information.entries());
    infoArray.sort((a, b) => a[1].created - b[1].created); // Oldest first

    // Remove oldest 20%
    const toRemove = Math.floor(infoArray.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.information.delete(infoArray[i][0]);
    }
  }

  /**
   * Get all social circles
   */
  public getSocialCircles(): Map<string, SocialCircle> {
    return this.socialCircles;
  }

  /**
   * Get network statistics
   */
  public getNetworkStats(): {
    totalRelationships: number;
    averageRelationshipsPerCitizen: number;
    totalInformation: number;
    totalSocialCircles: number;
  } {
    let totalCitizens = this.citizenRelationships.size;
    
    return {
      totalRelationships: this.relationships.size,
      averageRelationshipsPerCitizen: totalCitizens > 0 ? this.relationships.size * 2 / totalCitizens : 0,
      totalInformation: this.information.size,
      totalSocialCircles: this.socialCircles.size
    };
  }

  /**
   * Serialize for save/load
   */
  public serialize(): any {
    return {
      relationships: Array.from(this.relationships.entries()),
      citizenRelationships: Array.from(this.citizenRelationships.entries()),
      information: Array.from(this.information.entries()).map(([id, info]) => [
        id,
        {
          ...info,
          knownBy: Array.from(info.knownBy),
          regionalPenetration: Array.from(info.regionalPenetration.entries())
        }
      ]),
      citizenOpinions: Array.from(this.citizenOpinions.entries()),
      socialCircles: Array.from(this.socialCircles.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.relationships) {
      this.relationships = new Map(data.relationships);
    }
    if (data.citizenRelationships) {
      this.citizenRelationships = new Map(data.citizenRelationships);
    }
    if (data.information) {
      this.information = new Map(
        data.information.map(([id, info]: [string, any]) => [
          id,
          {
            ...info,
            knownBy: new Set(info.knownBy),
            regionalPenetration: new Map(info.regionalPenetration)
          }
        ])
      );
    }
    if (data.citizenOpinions) {
      this.citizenOpinions = new Map(data.citizenOpinions);
    }
    if (data.socialCircles) {
      this.socialCircles = new Map(data.socialCircles);
    }
  }
}
