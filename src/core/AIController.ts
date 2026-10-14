// src/core/AIController.ts

import { Citizen } from './CitizenSystem';

/**
 * AI-Typ für unterschiedliche Verhaltensweisen
 */
export enum AIType {
  REACTIVE = 'reactive', // Normale Bürger - reagieren auf Ereignisse
  PROACTIVE = 'proactive', // Ambitiöse Charaktere - initiieren Veränderungen
  HISTORICAL = 'historical', // Vorbestimmte Figuren - folgen historischem Pfad
  DYNAMIC = 'dynamic' // Lernt aus Erfahrungen
}

/**
 * AI-Ziel
 */
export interface AIGoal {
  id: string;
  type: 'basic_need' | 'role_goal' | 'relationship' | 'life_ambition';
  description: string;
  priority: number; // 0-100
  progress: number; // 0-100
  completed: boolean;
  deadline?: number; // Jahr
}

/**
 * AI-Entscheidung
 */
export interface AIDecision {
  citizenId: string;
  action: string;
  timestamp: number;
  reasoning: string;
  success: boolean;
}

/**
 * AI Controller Interface - Steuert nicht-besetzte Charaktere
 */
export interface IAIController {
  readonly citizenId: string;
  readonly aiType: AIType;
  
  /**
   * Schicht 1: Grundbedürfnisse befriedigen
   */
  satisfyBasicNeeds(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[];
  
  /**
   * Schicht 2: Rollenspezifische Ziele verfolgen
   */
  pursueRoleGoals(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[];
  
  /**
   * Schicht 3: Persönlichkeit & Beziehungen entwickeln
   */
  developRelationships(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[];
  
  /**
   * Schicht 4: Langfristige Ambitionen verfolgen
   */
  pursueLifeGoals(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[];
  
  /**
   * Hauptaktualisierung - ruft alle Schichten auf
   */
  update(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[];
  
  /**
   * Holt aktuelle Ziele
   */
  getGoals(): AIGoal[];
  
  /**
   * Fügt ein neues Ziel hinzu
   */
  addGoal(goal: AIGoal): void;
}

/**
 * Basis-AI-Controller-Implementierung
 */
export class AIController implements IAIController {
  public readonly citizenId: string;
  public readonly aiType: AIType;
  private goals: AIGoal[] = [];
  private decisions: AIDecision[] = [];
  private lastUpdateYear: number = 0;
  private lastUpdateMonth: number = 0;
  
  constructor(citizenId: string, aiType: AIType = AIType.REACTIVE) {
    this.citizenId = citizenId;
    this.aiType = aiType;
    this.initializeDefaultGoals(aiType);
  }
  
  /**
   * Initialisiert Standard-Ziele basierend auf AI-Typ
   */
  private initializeDefaultGoals(aiType: AIType): void {
    // Jeder Bürger hat Grundbedürfnisse
    this.goals.push({
      id: 'basic-food',
      type: 'basic_need',
      description: 'Nahrung sicherstellen',
      priority: 90,
      progress: 0,
      completed: false
    });
    
    this.goals.push({
      id: 'basic-shelter',
      type: 'basic_need',
      description: 'Unterkunft sichern',
      priority: 85,
      progress: 0,
      completed: false
    });
    
    // Proaktive Charaktere haben zusätzliche Ziele
    if (aiType === AIType.PROACTIVE) {
      this.goals.push({
        id: 'career-advancement',
        type: 'life_ambition',
        description: 'Karriere vorantreiben',
        priority: 70,
        progress: 0,
        completed: false
      });
      
      this.goals.push({
        id: 'build-wealth',
        type: 'life_ambition',
        description: 'Vermögen aufbauen',
        priority: 65,
        progress: 0,
        completed: false
      });
    }
  }
  
  /**
   * Schicht 1: Grundbedürfnisse
   */
  public satisfyBasicNeeds(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // Nahrungsbedarf prüfen
    if (citizen.needs.food < 50) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'seek_food',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Nahrungsbedarf unter kritischem Level',
        success: true
      });
    }
    
    // Unterkunft prüfen
    if (citizen.needs.shelter < 40) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'seek_shelter',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Unterkunft unzureichend',
        success: true
      });
    }
    
    // Gesundheit prüfen
    if (citizen.health.overall < 40) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'seek_medical_care',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Gesundheitszustand kritisch',
        success: true
      });
    }
    
    return decisions;
  }
  
  /**
   * Schicht 2: Rollenspezifische Ziele
   */
  public pursueRoleGoals(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // Rollenspezifische Logik
    switch (citizen.profession) {
      case 'farmer':
        decisions.push(...this.farmerGoals(citizen, currentYear, currentMonth));
        break;
      case 'merchant':
        decisions.push(...this.merchantGoals(citizen, currentYear, currentMonth));
        break;
      case 'soldier':
        decisions.push(...this.soldierGoals(citizen, currentYear, currentMonth));
        break;
      case 'noble':
        decisions.push(...this.nobleGoals(citizen, currentYear, currentMonth));
        break;
      default:
        // Generische Arbeitsziele
        if (citizen.professionLevel < 100) {
          decisions.push({
            citizenId: this.citizenId,
            action: 'improve_skills',
            timestamp: currentYear * 12 + currentMonth,
            reasoning: 'Verbesserung der Berufsfähigkeiten',
            success: true
          });
        }
    }
    
    return decisions;
  }
  
  /**
   * Bauern-spezifische Ziele
   */
  private farmerGoals(_citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // Erntezeit (Monate 8-10)
    if (currentMonth >= 8 && currentMonth <= 10) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'harvest_crops',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Erntezeit - Ernten müssen eingefahren werden',
        success: true
      });
    }
    
    // Aussaat (Monate 3-5)
    if (currentMonth >= 3 && currentMonth <= 5) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'plant_crops',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Aussaatzeit - Felder vorbereiten',
        success: true
      });
    }
    
    return decisions;
  }
  
  /**
   * Händler-spezifische Ziele
   */
  private merchantGoals(_citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    if (_citizen.wealth < 1000) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'seek_trade_opportunities',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Vermögen niedrig - neue Handelsmöglichkeiten suchen',
        success: true
      });
    }
    
    return decisions;
  }
  
  /**
   * Soldaten-spezifische Ziele
   */
  private soldierGoals(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    if (citizen.skills.combat < 70) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'combat_training',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Kampffähigkeiten verbessern',
        success: true
      });
    }
    
    return decisions;
  }
  
  /**
   * Adel-spezifische Ziele
   */
  private nobleGoals(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    if (citizen.reputation < 70) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'host_feast',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Reputation durch gesellschaftliche Veranstaltungen stärken',
        success: true
      });
    }
    
    if (citizen.socialRelations.length < 5) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'build_political_connections',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Politische Verbindungen aufbauen',
        success: true
      });
    }
    
    return decisions;
  }
  
  /**
   * Schicht 3: Persönlichkeit & Beziehungen
   */
  public developRelationships(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // Hochzeit anstreben (wenn unverheiratet, im richtigen Alter)
    const hasSpouse = citizen.familyRelations.some(r => r.relationType === 'spouse');
    if (!hasSpouse && citizen.age >= 18 && citizen.age <= 35 && citizen.happiness > 50) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'seek_marriage',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Im heiratsfähigen Alter und glücklich',
        success: true
      });
    }
    
    // Freundschaften pflegen
    if (citizen.socialRelations.length < 3) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'make_friends',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Soziale Isolation vermeiden',
        success: true
      });
    }
    
    // Familiäre Verpflichtungen
    const hasChildren = citizen.familyRelations.some(r => r.relationType === 'child');
    if (hasChildren && citizen.wealth > 500) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'support_family',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Für Familie sorgen',
        success: true
      });
    }
    
    return decisions;
  }
  
  /**
   * Schicht 4: Langfristige Ambitionen
   */
  public pursueLifeGoals(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // Nur für proaktive und dynamische AI
    if (this.aiType !== AIType.PROACTIVE && this.aiType !== AIType.DYNAMIC) {
      return decisions;
    }
    
    // Karriere-Fortschritt
    if (citizen.personality.ambition > 70 && citizen.professionLevel < 80) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'seek_promotion',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Hoher Ehrgeiz - Beförderung anstreben',
        success: true
      });
    }
    
    // Vermächtnis aufbauen
    if (citizen.age > 45 && citizen.wealth > 2000) {
      decisions.push({
        citizenId: this.citizenId,
        action: 'build_legacy',
        timestamp: currentYear * 12 + currentMonth,
        reasoning: 'Vermächtnis für zukünftige Generationen aufbauen',
        success: true
      });
    }
    
    return decisions;
  }
  
  /**
   * Hauptaktualisierung
   */
  public update(citizen: Citizen, currentYear: number, currentMonth: number): AIDecision[] {
    // Verhindere mehrfache Updates im gleichen Monat
    if (this.lastUpdateYear === currentYear && this.lastUpdateMonth === currentMonth) {
      return [];
    }
    
    this.lastUpdateYear = currentYear;
    this.lastUpdateMonth = currentMonth;
    
    const allDecisions: AIDecision[] = [];
    
    // Alle vier Schichten durchlaufen (in Prioritätsreihenfolge)
    allDecisions.push(...this.satisfyBasicNeeds(citizen, currentYear, currentMonth));
    allDecisions.push(...this.pursueRoleGoals(citizen, currentYear, currentMonth));
    allDecisions.push(...this.developRelationships(citizen, currentYear, currentMonth));
    allDecisions.push(...this.pursueLifeGoals(citizen, currentYear, currentMonth));
    
    // Entscheidungen speichern
    this.decisions.push(...allDecisions);
    
    // Nur die letzten 100 Entscheidungen behalten
    if (this.decisions.length > 100) {
      this.decisions = this.decisions.slice(-100);
    }
    
    return allDecisions;
  }
  
  /**
   * Holt aktuelle Ziele
   */
  public getGoals(): AIGoal[] {
    return [...this.goals];
  }
  
  /**
   * Fügt ein neues Ziel hinzu
   */
  public addGoal(goal: AIGoal): void {
    this.goals.push(goal);
  }
  
  /**
   * Holt vergangene Entscheidungen
   */
  public getDecisionHistory(): AIDecision[] {
    return [...this.decisions];
  }
  
  /**
   * Erstellt Snapshot für Speichern
   */
  public createSnapshot(): any {
    return {
      citizenId: this.citizenId,
      aiType: this.aiType,
      goals: this.goals,
      decisions: this.decisions,
      lastUpdateYear: this.lastUpdateYear,
      lastUpdateMonth: this.lastUpdateMonth
    };
  }
  
  /**
   * Lädt Snapshot
   */
  public static loadSnapshot(snapshot: any): AIController {
    const controller = new AIController(snapshot.citizenId, snapshot.aiType);
    controller.goals = snapshot.goals || [];
    controller.decisions = snapshot.decisions || [];
    controller.lastUpdateYear = snapshot.lastUpdateYear || 0;
    controller.lastUpdateMonth = snapshot.lastUpdateMonth || 0;
    return controller;
  }
}

/**
 * AI Controller Manager - Verwaltet alle AI-Controller
 */
export class AIControllerManager {
  private controllers: Map<string, AIController> = new Map();
  
  /**
   * Erstellt oder holt einen AI-Controller für einen Bürger
   */
  public getOrCreateController(citizenId: string, aiType: AIType = AIType.REACTIVE): AIController {
    let controller = this.controllers.get(citizenId);
    
    if (!controller) {
      controller = new AIController(citizenId, aiType);
      this.controllers.set(citizenId, controller);
    }
    
    return controller;
  }
  
  /**
   * Entfernt einen Controller (z.B. wenn Bürger stirbt)
   */
  public removeController(citizenId: string): void {
    this.controllers.delete(citizenId);
  }
  
  /**
   * Aktualisiert alle AI-Controller
   */
  public updateAll(getCitizen: (id: string) => Citizen | undefined, currentYear: number, currentMonth: number): void {
    for (const [citizenId, controller] of this.controllers) {
      const citizen = getCitizen(citizenId);
      if (citizen && citizen.isAlive && !citizen.isPlayerCharacter) {
        controller.update(citizen, currentYear, currentMonth);
      }
    }
  }
  
  /**
   * Holt AI-Typ für einen Bürger
   */
  public determineAIType(citizen: Citizen): AIType {
    // Historische Figuren
    if (citizen.socialClass === 'royal' || citizen.socialClass === 'noble') {
      return AIType.HISTORICAL;
    }
    
    // Ambitiöse Charaktere
    if (citizen.personality.ambition > 75) {
      return AIType.PROACTIVE;
    }
    
    // Intelligente Charaktere lernen
    if (citizen.personality.intelligence > 80) {
      return AIType.DYNAMIC;
    }
    
    // Standard: Reaktiv
    return AIType.REACTIVE;
  }
  
  /**
   * Holt alle Controller
   */
  public getAllControllers(): Map<string, AIController> {
    return new Map(this.controllers);
  }
  
  /**
   * Erstellt Snapshot für Speichern
   */
  public createSnapshot(): any {
    const controllersArray: any[] = [];
    for (const [_citizenId, controller] of this.controllers) {
      controllersArray.push(controller.createSnapshot());
    }
    return {
      controllers: controllersArray
    };
  }
  
  /**
   * Lädt Snapshot
   */
  public loadSnapshot(snapshot: any): void {
    this.controllers.clear();
    if (snapshot.controllers) {
      for (const controllerSnapshot of snapshot.controllers) {
        const controller = AIController.loadSnapshot(controllerSnapshot);
        this.controllers.set(controller.citizenId, controller);
      }
    }
  }
}
