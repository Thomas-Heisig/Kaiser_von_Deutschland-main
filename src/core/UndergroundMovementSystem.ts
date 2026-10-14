/**
 * Underground Movement System
 * Handles rebels, guerilla fighters, secret societies, revolutionary cells, and terrorism
 * Part of Chapter II: Krieg und Frieden (War and Peace)
 */

import type { CitizenSystem } from './CitizenSystem';

/**
 * Rebel movement types
 */
export type RebelType = 'peasant' | 'worker' | 'nationalist' | 'religious' | 'ideological' | 'separatist';

/**
 * Revolutionary cell structure
 */
export interface RevolutionaryCell {
  id: string;
  name: string;
  type: 'communist' | 'anarchist' | 'nationalist' | 'religious' | 'democratic' | 'separatist';
  regionId: string;
  foundedYear: number;
  foundedMonth: number;
  memberCount: number;
  leadership: string[]; // Citizen IDs
  radicalization: number; // 0-100: How radical/violent
  secrecy: number; // 0-100: How hidden from authorities
  influence: number; // 0-100: Political influence
  resources: number; // Financial resources
  weapons: number; // Access to weapons
  active: boolean;
  goals: string[];
  recentActions: string[];
}

/**
 * Secret society data
 */
export interface SecretSociety {
  id: string;
  name: string;
  description: string;
  type: 'fraternal' | 'mystical' | 'political' | 'economic' | 'academic';
  yearFounded: number;
  historicalBasis?: string; // Historical reference
  memberCount: number;
  initiation: string; // Initiation ritual description
  symbols: string[];
  influence: number; // 0-100: Political/economic influence
  secrecy: number; // 0-100: How secret
  goals: string[];
  headquarters?: string; // Region ID
  chapters: string[]; // Region IDs where they have presence
  notableMembers: string[]; // Citizen IDs or historical figures
  active: boolean;
  resources: number; // Financial power
}

/**
 * Rebel group
 */
export interface RebelGroup {
  id: string;
  name: string;
  type: RebelType;
  regionId: string;
  foundedYear: number;
  foundedMonth: number;
  fighters: number;
  leadership: string[]; // Citizen IDs
  morale: number; // 0-100
  training: number; // 0-100: Combat effectiveness
  equipment: number; // 0-100: Quality of weapons/supplies
  publicSupport: number; // 0-100: Popular support
  controlledTerritories: string[]; // Region IDs
  active: boolean;
  guerillaTactics: boolean; // Use guerilla warfare vs conventional
  demands: string[];
  recentAttacks: number;
}

/**
 * Terror attack data (from industrialization onwards)
 */
export interface TerrorAttack {
  id: string;
  name: string;
  type: 'bombing' | 'assassination' | 'kidnapping' | 'arson' | 'sabotage' | 'shooting' | 'cyber';
  yearAvailable: number; // When this type becomes possible
  targetTypes: string[]; // government, civilian, infrastructure, military
  damage: number; // Potential damage 1-100
  casualties: number; // Potential casualties
  fearFactor: number; // 1-100: Impact on public fear
  detectionDifficulty: number; // 1-100: How hard to prevent
  cost: number; // Resources needed to execute
}

/**
 * Active terror attack event
 */
export interface TerrorEvent {
  id: string;
  attackType: string; // References TerrorAttack
  executorGroupId: string; // RebelGroup or RevolutionaryCell
  targetRegionId: string;
  targetType: string;
  year: number;
  month: number;
  casualties: number;
  economicDamage: number;
  publicFear: number; // Increase in fear level
  securityResponse: number; // Government response strength
  success: boolean;
}

/**
 * Underground Movement System
 * Manages all forms of underground resistance and subversive activities
 */
export class UndergroundMovementSystem {
  // Data loaded from JSON
  private terrorAttackTypes: TerrorAttack[] = [];
  private secretSocietyTemplates: SecretSociety[] = [];
  
  // Active movements
  private rebelGroups: Map<string, RebelGroup> = new Map();
  private revolutionaryCells: Map<string, RevolutionaryCell> = new Map();
  private secretSocieties: Map<string, SecretSociety> = new Map();
  private terrorEvents: TerrorEvent[] = [];
  
  // State tracking
  private publicFearLevel: number = 0; // 0-100
  private securityLevel: number = 50; // 0-100: Government security measures
  private revolutionThreat: number = 0; // 0-100: Overall threat of revolution
  
  constructor() {
    this.loadData();
  }
  
  /**
   * Load underground movement data from JSON
   */
  private async loadData(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/underground-movements.json');
      const data = await response.json();
      
      this.terrorAttackTypes = data.terrorAttackTypes || [];
      this.secretSocietyTemplates = data.secretSocietyTemplates || [];
    } catch (error) {
      console.error('Failed to load underground movements data:', error);
      // Provide fallback data
      this.initializeFallbackData();
    }
  }
  
  /**
   * Initialize fallback data if JSON loading fails
   */
  private initializeFallbackData(): void {
    this.terrorAttackTypes = [
      {
        id: 'bombing',
        name: 'Bombing',
        type: 'bombing',
        yearAvailable: 1850,
        targetTypes: ['government', 'civilian', 'infrastructure'],
        damage: 80,
        casualties: 50,
        fearFactor: 90,
        detectionDifficulty: 60,
        cost: 500
      }
    ];
    
    this.secretSocietyTemplates = [
      {
        id: 'freemasons',
        name: 'Freemasons',
        description: 'Fraternal organization with philosophical and charitable aims',
        type: 'fraternal',
        yearFounded: 1717,
        memberCount: 0,
        initiation: 'Three-degree system of initiation',
        symbols: ['Square and Compass', 'All-Seeing Eye', 'Letter G'],
        influence: 60,
        secrecy: 40,
        goals: ['Moral improvement', 'Charity', 'Mutual support'],
        chapters: [],
        notableMembers: [],
        active: true,
        resources: 1000
      }
    ];
  }
  
  /**
   * Create a new rebel group
   */
  public createRebelGroup(
    name: string,
    type: RebelType,
    regionId: string,
    year: number,
    month: number,
    initialFighters: number = 50
  ): RebelGroup {
    const id = `rebel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const rebelGroup: RebelGroup = {
      id,
      name,
      type,
      regionId,
      foundedYear: year,
      foundedMonth: month,
      fighters: initialFighters,
      leadership: [],
      morale: 60,
      training: 30,
      equipment: 20,
      publicSupport: 40,
      controlledTerritories: [],
      active: true,
      guerillaTactics: true,
      demands: [],
      recentAttacks: 0
    };
    
    this.rebelGroups.set(id, rebelGroup);
    this.updateRevolutionThreat();
    
    return rebelGroup;
  }
  
  /**
   * Create a revolutionary cell
   */
  public createRevolutionaryCell(
    name: string,
    type: RevolutionaryCell['type'],
    regionId: string,
    year: number,
    month: number
  ): RevolutionaryCell {
    const id = `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const cell: RevolutionaryCell = {
      id,
      name,
      type,
      regionId,
      foundedYear: year,
      foundedMonth: month,
      memberCount: 10,
      leadership: [],
      radicalization: 40,
      secrecy: 80,
      influence: 10,
      resources: 100,
      weapons: 5,
      active: true,
      goals: [],
      recentActions: []
    };
    
    this.revolutionaryCells.set(id, cell);
    this.updateRevolutionThreat();
    
    return cell;
  }
  
  /**
   * Found a secret society (from template or new)
   */
  public foundSecretSociety(
    templateId: string,
    regionId: string,
    year: number
  ): SecretSociety | null {
    const template = this.secretSocietyTemplates.find(t => t.id === templateId);
    if (!template) return null;
    
    // Check if already exists
    if (this.secretSocieties.has(templateId)) {
      return this.secretSocieties.get(templateId) || null;
    }
    
    const society: SecretSociety = {
      ...template,
      yearFounded: year,
      headquarters: regionId,
      chapters: [regionId],
      memberCount: 50,
      active: true
    };
    
    this.secretSocieties.set(templateId, society);
    
    return society;
  }
  
  /**
   * Recruit citizens to a rebel group
   */
  public recruitToRebelGroup(
    groupId: string,
    _citizenSystem: CitizenSystem,
    _regionId: string,
    recruitmentEffort: number
  ): number {
    const group = this.rebelGroups.get(groupId);
    if (!group || !group.active) return 0;
    
    // Calculate recruitment based on public support and conditions
    const baseRecruitment = Math.floor(recruitmentEffort * (group.publicSupport / 100));
    const recruited = Math.max(0, Math.min(baseRecruitment, 100));
    
    group.fighters += recruited;
    
    return recruited;
  }
  
  /**
   * Execute a terror attack (available from industrialization)
   */
  public executeTerrorAttack(
    attackTypeId: string,
    executorGroupId: string,
    targetRegionId: string,
    targetType: string,
    year: number,
    month: number
  ): TerrorEvent | null {
    const attackType = this.terrorAttackTypes.find(t => t.id === attackTypeId);
    if (!attackType || year < attackType.yearAvailable) return null;
    
    const group = this.rebelGroups.get(executorGroupId) || this.revolutionaryCells.get(executorGroupId);
    if (!group) return null;
    
    // Calculate success chance based on security level and detection difficulty
    const successChance = attackType.detectionDifficulty - this.securityLevel;
    const success = Math.random() * 100 < successChance;
    
    const casualties = success ? Math.floor(attackType.casualties * (0.5 + Math.random() * 0.5)) : 0;
    const economicDamage = success ? attackType.damage * 1000 : 0;
    
    const event: TerrorEvent = {
      id: `terror_${Date.now()}`,
      attackType: attackTypeId,
      executorGroupId,
      targetRegionId,
      targetType,
      year,
      month,
      casualties,
      economicDamage,
      publicFear: success ? attackType.fearFactor : 10,
      securityResponse: success ? 20 : 5,
      success
    };
    
    this.terrorEvents.push(event);
    
    if (success) {
      this.publicFearLevel = Math.min(100, this.publicFearLevel + event.publicFear);
      this.securityLevel = Math.min(100, this.securityLevel + event.securityResponse);
    }
    
    // Update rebel group stats
    if (this.rebelGroups.has(executorGroupId)) {
      const rebelGroup = this.rebelGroups.get(executorGroupId)!;
      rebelGroup.recentAttacks++;
      if (success) {
        rebelGroup.publicSupport = Math.max(0, rebelGroup.publicSupport - 10);
      }
    }
    
    return event;
  }
  
  /**
   * Grow/shrink rebel groups based on conditions
   */
  public updateRebelGroups(
    _year: number,
    _month: number,
    economicConditions: number, // 0-100: worse = more rebels
    politicalRepression: number // 0-100: higher = more rebels
  ): void {
    for (const [_id, group] of this.rebelGroups) {
      if (!group.active) continue;
      
      // Calculate growth factors
      const grievanceFactor = (100 - economicConditions) / 100 + politicalRepression / 100;
      const supportFactor = group.publicSupport / 100;
      const securityFactor = this.securityLevel / 100;
      
      // Monthly growth/decline
      const growthRate = (grievanceFactor * supportFactor * 0.05) - (securityFactor * 0.03);
      const fighterChange = Math.floor(group.fighters * growthRate);
      
      group.fighters = Math.max(10, group.fighters + fighterChange);
      
      // Morale changes
      if (fighterChange > 0) {
        group.morale = Math.min(100, group.morale + 2);
      } else {
        group.morale = Math.max(0, group.morale - 3);
      }
      
      // Disband if too weak
      if (group.fighters < 10 && group.morale < 20) {
        group.active = false;
      }
    }
    
    this.updateRevolutionThreat();
  }
  
  /**
   * Update revolutionary cells
   */
  public updateRevolutionaryCells(
    _year: number,
    _month: number,
    politicalClimate: number // 0-100: higher = more radicalization
  ): void {
    for (const [_id, cell] of this.revolutionaryCells) {
      if (!cell.active) continue;
      
      // Radicalization increases with political climate
      const radicalizationChange = (politicalClimate - 50) / 50 * 2;
      cell.radicalization = Math.max(0, Math.min(100, cell.radicalization + radicalizationChange));
      
      // Membership growth
      if (cell.radicalization > 60) {
        const growth = Math.floor(cell.memberCount * 0.02);
        cell.memberCount += growth;
      }
      
      // Security crackdowns
      if (this.securityLevel > 70 && Math.random() < 0.1) {
        // Cell discovered
        cell.memberCount = Math.floor(cell.memberCount * 0.5);
        cell.secrecy = Math.max(0, cell.secrecy - 20);
        
        if (cell.memberCount < 5) {
          cell.active = false;
        }
      }
    }
    
    this.updateRevolutionThreat();
  }
  
  /**
   * Calculate overall revolution threat
   */
  private updateRevolutionThreat(): void {
    let threat = 0;
    
    // Count active rebel fighters
    let totalFighters = 0;
    for (const group of this.rebelGroups.values()) {
      if (group.active) {
        totalFighters += group.fighters;
      }
    }
    threat += Math.min(50, totalFighters / 100);
    
    // Count radical cells
    let radicalCells = 0;
    for (const cell of this.revolutionaryCells.values()) {
      if (cell.active && cell.radicalization > 70) {
        radicalCells++;
      }
    }
    threat += Math.min(30, radicalCells * 5);
    
    // Fear level contributes
    threat += this.publicFearLevel * 0.2;
    
    this.revolutionThreat = Math.min(100, threat);
  }
  
  /**
   * Check if revolution should trigger
   */
  public checkRevolutionTrigger(
    economicCrisis: boolean,
    politicalLegitimacy: number // 0-100
  ): boolean {
    const threshold = 80;
    
    if (this.revolutionThreat < threshold) return false;
    
    // Additional conditions
    if (economicCrisis && politicalLegitimacy < 30) {
      return Math.random() < 0.5; // 50% chance per check
    }
    
    if (politicalLegitimacy < 20) {
      return Math.random() < 0.3; // 30% chance
    }
    
    return false;
  }
  
  /**
   * Increase government security measures
   */
  public increaseSecurityLevel(amount: number): void {
    this.securityLevel = Math.min(100, this.securityLevel + amount);
  }
  
  /**
   * Decrease public fear through measures
   */
  public decreasePublicFear(amount: number): void {
    this.publicFearLevel = Math.max(0, this.publicFearLevel - amount);
  }
  
  // Getters
  
  public getRebelGroups(): RebelGroup[] {
    return Array.from(this.rebelGroups.values());
  }
  
  public getActiveRebelGroups(): RebelGroup[] {
    return this.getRebelGroups().filter(g => g.active);
  }
  
  public getRevolutionaryCells(): RevolutionaryCell[] {
    return Array.from(this.revolutionaryCells.values());
  }
  
  public getActiveRevolutionaryCells(): RevolutionaryCell[] {
    return this.getRevolutionaryCells().filter(c => c.active);
  }
  
  public getSecretSocieties(): SecretSociety[] {
    return Array.from(this.secretSocieties.values());
  }
  
  public getActiveSecretSocieties(): SecretSociety[] {
    return this.getSecretSocieties().filter(s => s.active);
  }
  
  public getTerrorEvents(): TerrorEvent[] {
    return this.terrorEvents;
  }
  
  public getRecentTerrorEvents(years: number = 5): TerrorEvent[] {
    const currentYear = new Date().getFullYear();
    return this.terrorEvents.filter(e => currentYear - e.year <= years);
  }
  
  public getPublicFearLevel(): number {
    return this.publicFearLevel;
  }
  
  public getSecurityLevel(): number {
    return this.securityLevel;
  }
  
  public getRevolutionThreat(): number {
    return this.revolutionThreat;
  }
  
  public getTerrorAttackTypes(): TerrorAttack[] {
    return this.terrorAttackTypes;
  }
  
  public getAvailableTerrorAttackTypes(year: number): TerrorAttack[] {
    return this.terrorAttackTypes.filter(t => year >= t.yearAvailable);
  }
  
  public getSecretSocietyTemplates(): SecretSociety[] {
    return this.secretSocietyTemplates;
  }
  
  /**
   * Get summary statistics
   */
  public getStatistics(): {
    activeRebelGroups: number;
    totalFighters: number;
    activeCells: number;
    activeSecretSocieties: number;
    terrorAttacks: number;
    publicFear: number;
    securityLevel: number;
    revolutionThreat: number;
  } {
    const activeRebels = this.getActiveRebelGroups();
    const totalFighters = activeRebels.reduce((sum, g) => sum + g.fighters, 0);
    
    return {
      activeRebelGroups: activeRebels.length,
      totalFighters,
      activeCells: this.getActiveRevolutionaryCells().length,
      activeSecretSocieties: this.getActiveSecretSocieties().length,
      terrorAttacks: this.terrorEvents.length,
      publicFear: this.publicFearLevel,
      securityLevel: this.securityLevel,
      revolutionThreat: this.revolutionThreat
    };
  }
}
