// src/core/EventTriggerSystem.ts

import { HistoricalEventSystem } from './HistoricalEventSystem';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bedingungstyp für Event-Trigger
 */
export type TriggerConditionType =
  | 'year_reached'           // Jahr erreicht
  | 'population_threshold'   // Bevölkerungsschwelle
  | 'wealth_threshold'       // Reichtumschwelle
  | 'technology_unlocked'    // Technologie freigeschaltet
  | 'building_count'         // Anzahl Gebäude
  | 'reputation_threshold'   // Reputationsschwelle
  | 'character_age'          // Charakteralter
  | 'character_profession'   // Charakterberuf
  | 'social_class'           // Soziale Klasse
  | 'war_active'             // Krieg aktiv
  | 'disease_active'         // Epidemie aktiv
  | 'custom_script';         // Eigenes Script

/**
 * Trigger-Bedingung
 */
export interface TriggerCondition {
  type: TriggerConditionType;
  value: any; // Wert hängt vom Typ ab
  comparison?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'; // Vergleichsoperator
}

/**
 * Event-Effekt
 */
export interface EventEffect {
  type: 'modify_wealth' | 'modify_reputation' | 'modify_population' | 'spawn_event' | 'custom';
  value: any;
  target?: 'player' | 'region' | 'global' | 'character';
}

/**
 * Custom Event Template
 */
export interface CustomEventTemplate {
  id: string;
  name: string;
  description: string;
  category: 'political' | 'economic' | 'military' | 'social' | 'cultural' | 'disaster' | 'custom';
  
  // Trigger-Bedingungen (alle müssen erfüllt sein)
  triggerConditions: TriggerCondition[];
  
  // Wiederhol-Einstellungen
  repeatable: boolean;
  cooldownYears?: number; // Minimale Jahre zwischen Wiederholungen
  maxOccurrences?: number; // Maximale Anzahl Vorkommen
  
  // Event-Daten
  eventTitle: string;
  eventDescription: string;
  eventChoices?: Array<{
    text: string;
    effects: EventEffect[];
  }>;
  
  // Automatische Effekte (ohne Auswahl)
  automaticEffects?: EventEffect[];
  
  // Metadaten
  createdBy: string; // Spieler-ID
  createdAt: number; // Timestamp
  enabled: boolean;
}

/**
 * Getriggertes Event-Vorkommen
 */
export interface TriggeredEventOccurrence {
  templateId: string;
  triggeredYear: number;
  triggeredMonth: number;
  playerId?: string;
  citizenId?: string;
  resolved: boolean;
  choiceMade?: number; // Index der gewählten Option
}

/**
 * Event Trigger System
 * Ermöglicht das Erstellen und Auslösen von benutzerdefinierten Events
 */
export class EventTriggerSystem {
  private customTemplates: Map<string, CustomEventTemplate> = new Map();
  private triggeredOccurrences: TriggeredEventOccurrence[] = [];
  private templateOccurrenceCount: Map<string, number> = new Map();
  private lastTriggeredYear: Map<string, number> = new Map();
  
  /**
   * Erstellt ein neues Custom Event Template
   */
  public createCustomEvent(template: Omit<CustomEventTemplate, 'id' | 'createdAt'>): CustomEventTemplate {
    const id = `custom_event_${uuidv4()}`;
    const fullTemplate: CustomEventTemplate = {
      ...template,
      id,
      createdAt: Date.now()
    };
    
    this.customTemplates.set(id, fullTemplate);
    this.templateOccurrenceCount.set(id, 0);
    
    console.log(`Custom Event erstellt: ${fullTemplate.name} (${id})`);
    return fullTemplate;
  }
  
  /**
   * Aktualisiert ein bestehendes Template
   */
  public updateCustomEvent(id: string, updates: Partial<CustomEventTemplate>): boolean {
    const template = this.customTemplates.get(id);
    if (!template) return false;
    
    const updated = { ...template, ...updates, id }; // ID kann nicht geändert werden
    this.customTemplates.set(id, updated);
    return true;
  }
  
  /**
   * Löscht ein Custom Event
   */
  public deleteCustomEvent(id: string): boolean {
    return this.customTemplates.delete(id);
  }
  
  /**
   * Aktiviert/Deaktiviert ein Event
   */
  public toggleEventEnabled(id: string, enabled: boolean): boolean {
    const template = this.customTemplates.get(id);
    if (!template) return false;
    
    template.enabled = enabled;
    return true;
  }
  
  /**
   * Prüft alle Events auf Trigger-Bedingungen
   */
  public checkTriggers(context: {
    currentYear: number;
    currentMonth: number;
    playerId: string;
    citizenId?: string;
    population: number;
    wealth: number;
    reputation: number;
    technologies: string[];
    buildings: Map<string, number>;
    isAtWar: boolean;
    activeDiseases: string[];
    characterAge?: number;
    characterProfession?: string;
    socialClass?: string;
  }): TriggeredEventOccurrence[] {
    const newlyTriggered: TriggeredEventOccurrence[] = [];
    
    for (const template of this.customTemplates.values()) {
      if (!template.enabled) continue;
      
      // Prüfe Wiederholungs-Limits
      if (!template.repeatable) {
        const occurrences = this.templateOccurrenceCount.get(template.id) || 0;
        if (occurrences > 0) continue;
      }
      
      if (template.maxOccurrences) {
        const occurrences = this.templateOccurrenceCount.get(template.id) || 0;
        if (occurrences >= template.maxOccurrences) continue;
      }
      
      // Prüfe Cooldown
      if (template.cooldownYears) {
        const lastYear = this.lastTriggeredYear.get(template.id);
        if (lastYear !== undefined && (context.currentYear - lastYear) < template.cooldownYears) {
          continue;
        }
      }
      
      // Prüfe alle Trigger-Bedingungen
      let allConditionsMet = true;
      for (const condition of template.triggerConditions) {
        if (!this.checkCondition(condition, context)) {
          allConditionsMet = false;
          break;
        }
      }
      
      if (allConditionsMet) {
        const occurrence: TriggeredEventOccurrence = {
          templateId: template.id,
          triggeredYear: context.currentYear,
          triggeredMonth: context.currentMonth,
          playerId: context.playerId,
          citizenId: context.citizenId,
          resolved: false
        };
        
        newlyTriggered.push(occurrence);
        this.triggeredOccurrences.push(occurrence);
        
        // Update Zähler
        const count = this.templateOccurrenceCount.get(template.id) || 0;
        this.templateOccurrenceCount.set(template.id, count + 1);
        this.lastTriggeredYear.set(template.id, context.currentYear);
        
        console.log(`Event getriggert: ${template.name} (${template.id})`);
      }
    }
    
    return newlyTriggered;
  }
  
  /**
   * Prüft eine einzelne Bedingung
   */
  private checkCondition(condition: TriggerCondition, context: any): boolean {
    const comparison = condition.comparison || 'gte';
    
    switch (condition.type) {
      case 'year_reached':
        return this.compare(context.currentYear, condition.value, comparison);
        
      case 'population_threshold':
        return this.compare(context.population, condition.value, comparison);
        
      case 'wealth_threshold':
        return this.compare(context.wealth, condition.value, comparison);
        
      case 'reputation_threshold':
        return this.compare(context.reputation, condition.value, comparison);
        
      case 'character_age':
        if (!context.characterAge) return false;
        return this.compare(context.characterAge, condition.value, comparison);
        
      case 'technology_unlocked':
        return context.technologies.includes(condition.value);
        
      case 'building_count':
        const buildingCount = context.buildings.get(condition.value.buildingType) || 0;
        return this.compare(buildingCount, condition.value.count, comparison);
        
      case 'character_profession':
        return context.characterProfession === condition.value;
        
      case 'social_class':
        return context.socialClass === condition.value;
        
      case 'war_active':
        return context.isAtWar === condition.value;
        
      case 'disease_active':
        if (condition.value === true) {
          return context.activeDiseases.length > 0;
        } else if (typeof condition.value === 'string') {
          return context.activeDiseases.includes(condition.value);
        }
        return false;
        
      case 'custom_script':
        // TODO: Implement safe custom script evaluation
        // Security note: Never use eval() directly - use a safe expression parser
        // or sandboxed scripting environment (e.g., vm2, isolated-vm)
        console.warn('Custom script conditions not yet implemented');
        return false;
        
      default:
        return false;
    }
  }
  
  /**
   * Vergleichsoperationen
   */
  private compare(actual: number, expected: number, operator: string): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return actual > expected;
      case 'gte': return actual >= expected;
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      default: return false;
    }
  }
  
  /**
   * Markiert ein Event als aufgelöst
   */
  public resolveEvent(occurrence: TriggeredEventOccurrence, choiceIndex?: number): void {
    occurrence.resolved = true;
    occurrence.choiceMade = choiceIndex;
  }
  
  /**
   * Wendet Event-Effekte an
   */
  public applyEffects(
    effects: EventEffect[],
    target: {
      modifyWealth?: (amount: number) => void;
      modifyReputation?: (amount: number) => void;
      modifyPopulation?: (amount: number) => void;
      triggerEvent?: (eventId: string) => void;
    }
  ): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'modify_wealth':
          if (target.modifyWealth) {
            target.modifyWealth(effect.value);
          }
          break;
          
        case 'modify_reputation':
          if (target.modifyReputation) {
            target.modifyReputation(effect.value);
          }
          break;
          
        case 'modify_population':
          if (target.modifyPopulation) {
            target.modifyPopulation(effect.value);
          }
          break;
          
        case 'spawn_event':
          if (target.triggerEvent) {
            target.triggerEvent(effect.value);
          }
          break;
          
        case 'custom':
          console.log('Custom effect:', effect.value);
          break;
      }
    }
  }
  
  /**
   * Holt alle Custom Events
   */
  public getAllCustomEvents(): CustomEventTemplate[] {
    return Array.from(this.customTemplates.values());
  }
  
  /**
   * Holt ein bestimmtes Template
   */
  public getTemplate(id: string): CustomEventTemplate | undefined {
    return this.customTemplates.get(id);
  }
  
  /**
   * Holt alle getriggerten Events
   */
  public getTriggeredEvents(resolved?: boolean): TriggeredEventOccurrence[] {
    if (resolved === undefined) {
      return [...this.triggeredOccurrences];
    }
    return this.triggeredOccurrences.filter(o => o.resolved === resolved);
  }
  
  /**
   * Holt ungelöste Events für einen Spieler
   */
  public getPendingEventsForPlayer(playerId: string): Array<{
    occurrence: TriggeredEventOccurrence;
    template: CustomEventTemplate;
  }> {
    return this.triggeredOccurrences
      .filter(o => !o.resolved && o.playerId === playerId)
      .map(o => ({
        occurrence: o,
        template: this.customTemplates.get(o.templateId)!
      }))
      .filter(pair => pair.template !== undefined);
  }
  
  /**
   * Statistiken
   */
  public getStatistics(): {
    totalTemplates: number;
    enabledTemplates: number;
    totalTriggered: number;
    pendingResolution: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let enabledCount = 0;
    
    for (const template of this.customTemplates.values()) {
      if (template.enabled) enabledCount++;
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
    }
    
    return {
      totalTemplates: this.customTemplates.size,
      enabledTemplates: enabledCount,
      totalTriggered: this.triggeredOccurrences.length,
      pendingResolution: this.triggeredOccurrences.filter(o => !o.resolved).length,
      byCategory
    };
  }
  
  /**
   * Integration mit HistoricalEventSystem
   */
  public triggerHistoricalEvent(
    occurrence: TriggeredEventOccurrence,
    _historicalEventSystem: HistoricalEventSystem
  ): void {
    const template = this.customTemplates.get(occurrence.templateId);
    if (!template) return;
    
    // Erstelle historisches Event basierend auf Template
    // Dies ist eine Brücke zwischen Custom Events und dem bestehenden System
    console.log(`Triggering historical event from template: ${template.name}`);
    
    // TODO: Rufe historicalEventSystem.triggerEvent() oder ähnlich auf
    // Dies erfordert möglicherweise Anpassungen am HistoricalEventSystem
  }
  
  /**
   * Serialisierung
   */
  public serialize(): any {
    return {
      customTemplates: Array.from(this.customTemplates.entries()),
      triggeredOccurrences: this.triggeredOccurrences,
      templateOccurrenceCount: Array.from(this.templateOccurrenceCount.entries()),
      lastTriggeredYear: Array.from(this.lastTriggeredYear.entries())
    };
  }
  
  /**
   * Deserialisierung
   */
  public deserialize(data: any): void {
    if (data.customTemplates) {
      this.customTemplates = new Map(data.customTemplates);
    }
    if (data.triggeredOccurrences) {
      this.triggeredOccurrences = data.triggeredOccurrences;
    }
    if (data.templateOccurrenceCount) {
      this.templateOccurrenceCount = new Map(data.templateOccurrenceCount);
    }
    if (data.lastTriggeredYear) {
      this.lastTriggeredYear = new Map(data.lastTriggeredYear);
    }
  }
  
  /**
   * Vordefinierte Event-Templates
   */
  public static readonly PREDEFINED_TEMPLATES: Omit<CustomEventTemplate, 'id' | 'createdAt' | 'createdBy'>[] = [
    {
      name: 'Goldenes Zeitalter',
      description: 'Eine Ära des Wohlstands und Fortschritts',
      category: 'economic',
      triggerConditions: [
        { type: 'wealth_threshold', value: 50000, comparison: 'gte' },
        { type: 'reputation_threshold', value: 75, comparison: 'gte' },
        { type: 'population_threshold', value: 10000, comparison: 'gte' }
      ],
      repeatable: false,
      eventTitle: 'Goldenes Zeitalter',
      eventDescription: 'Dein Reich erlebt eine beispiellose Zeit des Wohlstands!',
      automaticEffects: [
        { type: 'modify_wealth', value: 10000, target: 'player' },
        { type: 'modify_reputation', value: 20, target: 'player' }
      ],
      enabled: true
    },
    {
      name: 'Dynast-Jubiläum',
      description: '100 Jahre regiert',
      category: 'social',
      triggerConditions: [
        { type: 'character_age', value: 100, comparison: 'gte' }
      ],
      repeatable: false,
      eventTitle: '100 Jahre!',
      eventDescription: 'Ein Jahrhundert Leben - ein seltener Meilenstein!',
      eventChoices: [
        {
          text: 'Großes Fest veranstalten',
          effects: [
            { type: 'modify_wealth', value: -5000, target: 'player' },
            { type: 'modify_reputation', value: 30, target: 'player' }
          ]
        },
        {
          text: 'Bescheiden feiern',
          effects: [
            { type: 'modify_reputation', value: 10, target: 'player' }
          ]
        }
      ],
      enabled: true
    }
  ];
}
