/**
 * MonthlyPlannerSystem - Verwaltet monatliche Zyklen und Zeitmanagement
 * 
 * Ermöglicht:
 * - 24h-Zeitverteilung (Arbeit, Familie, Bildung, Freizeit, Schlaf)
 * - Berufsspezifische Monats-Aktionen
 * - Budgetplanung
 * - Ergebnisberechnung
 */

import {
  TimeAllocation,
  MonthlyAction,
  CareerCategory
} from './LifePhaseTypes';

// Konstanten für Validierung
const TIME_ALLOCATION_TOLERANCE = 0.1;
const BUDGET_ALLOCATION_TOLERANCE = 0.1;

/**
 * Budget-Allokation für den Monat
 */
export interface BudgetAllocation {
  production: number;      // Produktionskosten
  marketing: number;       // Werbung/Marketing
  education: number;       // Aus- und Weiterbildung
  infrastructure: number;  // Gebäude/Infrastruktur
  social: number;          // Soziales/Familie
  reserves: number;        // Rücklagen
}

/**
 * Monatliche Aktivität
 */
export interface Activity {
  id: string;
  name: string;
  type: 'work' | 'family' | 'education' | 'leisure';
  hoursAllocated: number;
  priority: number;
  status: 'planned' | 'in_progress' | 'completed';
  results?: ActivityResults;
}

/**
 * Aktivitäts-Ergebnisse
 */
export interface ActivityResults {
  skillGains: Map<string, number>;
  prestigeGain: number;
  goldGain: number;
  relationshipChanges: Map<string, number>;
}

/**
 * Monatsergebnisse
 */
export interface MonthlyResults {
  totalSkillGains: Map<string, number>;
  prestigeChange: number;
  goldChange: number;
  healthChange: number;
  happinessChange: number;
  events: string[];
  achievements: string[];
}

/**
 * Berufsspezifische Monats-Einstellungen
 */
export interface RoleMonthlySettings {
  // Handwerker
  productionQuantity?: number;      // 0-100 (Qualität vs. Quantität)
  materialQuality?: number;         // 0-100 (billig vs. hochwertig)
  apprenticeTraining?: boolean;     // Lehrlinge ausbilden?
  advertisingLevel?: number;        // 0-100 (lokal vs. regional)
  
  // Bürgermeister
  propertyTaxRate?: number;         // 0-100 Grundsteuer
  businessTaxRate?: number;         // 0-100 Gewerbesteuer
  infrastructureBudget?: number;    // Prozent des Haushalts
  securityBudget?: number;          // Prozent des Haushalts
  eventsBudget?: number;            // Prozent des Haushalts
  
  // Minister
  departmentBudget?: BudgetAllocation;
  legislativeInitiatives?: string[];
  staffingDecisions?: string[];
  publicRelations?: number;         // 0-100
  
  // Bischof
  churchTaxRate?: number;           // 0-100
  missionaryActivities?: number;    // 0-100
  theologicalPosition?: string;
  constructionProjects?: string[];
  
  // Gelehrter
  researchFocus?: string[];
  studentSelection?: number;        // 0-100 (selektiv vs. offen)
  publicationStrategy?: string;
  conferenceAttendance?: boolean;
}

/**
 * Monatlicher Planer
 */
export class MonthlyPlannerSystem {
  private currentMonth: number = 1;
  private currentYear: number = 1000;
  private timeAllocation: TimeAllocation;
  private budgetAllocation: BudgetAllocation;
  private activities: Activity[] = [];
  private roleSettings: RoleMonthlySettings = {};
  private availableActions: MonthlyAction[] = [];

  constructor() {
    this.timeAllocation = this.getDefaultTimeAllocation();
    this.budgetAllocation = this.getDefaultBudgetAllocation();
  }

  /**
   * Standard-Zeitverteilung
   */
  private getDefaultTimeAllocation(): TimeAllocation {
    return {
      work: 8,
      family: 4,
      education: 2,
      leisure: 4,
      sleep: 6
    };
  }

  /**
   * Standard-Budgetverteilung
   */
  private getDefaultBudgetAllocation(): BudgetAllocation {
    return {
      production: 40,
      marketing: 10,
      education: 10,
      infrastructure: 20,
      social: 10,
      reserves: 10
    };
  }

  /**
   * Setzt Zeit-Verteilung
   */
  setTimeAllocation(allocation: TimeAllocation): boolean {
    // Validierung: Muss 24 Stunden ergeben
    const total = allocation.work + allocation.family + 
                  allocation.education + allocation.leisure + allocation.sleep;
    
    if (Math.abs(total - 24) > TIME_ALLOCATION_TOLERANCE) {
      console.error('Zeit-Verteilung muss 24 Stunden ergeben!');
      return false;
    }

    // Validierung: Schlaf muss mindestens 6 Stunden sein
    if (allocation.sleep < 6) {
      console.error('Mindestens 6 Stunden Schlaf erforderlich!');
      return false;
    }

    this.timeAllocation = allocation;
    return true;
  }

  /**
   * Gibt aktuelle Zeit-Verteilung zurück
   */
  getTimeAllocation(): TimeAllocation {
    return { ...this.timeAllocation };
  }

  /**
   * Setzt Budget-Verteilung
   */
  setBudgetAllocation(allocation: BudgetAllocation): boolean {
    // Validierung: Muss 100% ergeben
    const total = allocation.production + allocation.marketing + 
                  allocation.education + allocation.infrastructure + 
                  allocation.social + allocation.reserves;
    
    if (Math.abs(total - 100) > BUDGET_ALLOCATION_TOLERANCE) {
      console.error('Budget-Verteilung muss 100% ergeben!');
      return false;
    }

    this.budgetAllocation = allocation;
    return true;
  }

  /**
   * Gibt aktuelle Budget-Verteilung zurück
   */
  getBudgetAllocation(): BudgetAllocation {
    return { ...this.budgetAllocation };
  }

  /**
   * Fügt Aktivität zum Monatsplan hinzu
   */
  addActivity(activity: Activity): void {
    this.activities.push(activity);
  }

  /**
   * Entfernt Aktivität aus Monatsplan
   */
  removeActivity(activityId: string): void {
    this.activities = this.activities.filter(a => a.id !== activityId);
  }

  /**
   * Gibt alle geplanten Aktivitäten zurück
   */
  getActivities(): Activity[] {
    return [...this.activities];
  }

  /**
   * Setzt rollenspezifische Einstellungen
   */
  setRoleSettings(settings: RoleMonthlySettings): void {
    this.roleSettings = { ...settings };
  }

  /**
   * Gibt rollenspezifische Einstellungen zurück
   */
  getRoleSettings(): RoleMonthlySettings {
    return { ...this.roleSettings };
  }

  /**
   * Lädt verfügbare Aktionen für eine Rolle
   */
  loadActionsForRole(_role: string, career: CareerCategory): void {
    // Hier würden normalerweise Aktionen aus JSON geladen
    // Für jetzt: Beispiel-Aktionen
    this.availableActions = this.generateSampleActions(career);
  }

  /**
   * Generiert Beispiel-Aktionen basierend auf Karriere
   */
  private generateSampleActions(career: CareerCategory): MonthlyAction[] {
    const actions: MonthlyAction[] = [];
    
    switch (career) {
      case CareerCategory.CRAFTS:
        actions.push({
          id: 'produce_goods',
          name: 'Waren produzieren',
          description: 'Handwerkswaren für den Verkauf herstellen',
          category: 'production',
          effects: { gold: 100, skill_handwerk: 5 }
        });
        actions.push({
          id: 'train_apprentice',
          name: 'Lehrling ausbilden',
          description: 'Zeit in Ausbildung eines Lehrlings investieren',
          category: 'education',
          effects: { prestige: 10, skill_lehre: 3 }
        });
        break;
        
      case CareerCategory.POLITICS:
        actions.push({
          id: 'adjust_taxes',
          name: 'Steuern anpassen',
          description: 'Steuersätze der Stadt anpassen',
          category: 'governance',
          effects: { prestige: 5, gold: 50 }
        });
        actions.push({
          id: 'organize_event',
          name: 'Stadtfest organisieren',
          description: 'Ein öffentliches Fest veranstalten',
          category: 'culture',
          effects: { prestige: 20, happiness: 10 },
          cost: 200
        });
        break;
        
      // Weitere Karrieren...
    }
    
    return actions;
  }

  /**
   * Führt Monats-Aktion aus
   */
  executeAction(actionId: string): void {
    const action = this.availableActions.find(a => a.id === actionId);
    if (!action) {
      console.error(`Aktion ${actionId} nicht gefunden`);
      return;
    }
    
    console.log(`Führe Aktion aus: ${action.name}`);
    // Effekte würden hier angewendet
  }

  /**
   * Verarbeitet Ende des Monats und berechnet Ergebnisse
   */
  processMonthEnd(): MonthlyResults {
    const results: MonthlyResults = {
      totalSkillGains: new Map(),
      prestigeChange: 0,
      goldChange: 0,
      healthChange: 0,
      happinessChange: 0,
      events: [],
      achievements: []
    };

    // Aktivitäten verarbeiten
    for (const activity of this.activities) {
      if (activity.status === 'completed' && activity.results) {
        // Skill-Gewinne aggregieren
        activity.results.skillGains.forEach((value, skill) => {
          const current = results.totalSkillGains.get(skill) || 0;
          results.totalSkillGains.set(skill, current + value);
        });
        
        results.prestigeChange += activity.results.prestigeGain;
        results.goldChange += activity.results.goldGain;
      }
    }

    // Gesundheits-Effekte basierend auf Schlaf
    if (this.timeAllocation.sleep < 6) {
      results.healthChange -= 10;
      results.events.push('Zu wenig Schlaf! Gesundheit leidet.');
    } else if (this.timeAllocation.sleep >= 8) {
      results.healthChange += 5;
    }

    // Glücks-Effekte basierend auf Freizeit
    if (this.timeAllocation.leisure < 2) {
      results.happinessChange -= 5;
      results.events.push('Zu wenig Freizeit! Zufriedenheit sinkt.');
    } else if (this.timeAllocation.leisure >= 4) {
      results.happinessChange += 5;
    }

    // Monat voranschreiten
    this.advanceMonth();

    return results;
  }

  /**
   * Schreitet zum nächsten Monat voran
   */
  private advanceMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    
    // Aktivitäten zurücksetzen
    this.activities = [];
  }

  /**
   * Gibt aktuellen Monat zurück
   */
  getCurrentMonth(): number {
    return this.currentMonth;
  }

  /**
   * Gibt aktuelles Jahr zurück
   */
  getCurrentYear(): number {
    return this.currentYear;
  }

  /**
   * Setzt Datum
   */
  setDate(year: number, month: number): void {
    this.currentYear = year;
    this.currentMonth = month;
  }

  /**
   * Exportiert Planer-Status
   */
  exportState(): string {
    return JSON.stringify({
      month: this.currentMonth,
      year: this.currentYear,
      timeAllocation: this.timeAllocation,
      budgetAllocation: this.budgetAllocation,
      roleSettings: this.roleSettings,
      activities: this.activities
    });
  }

  /**
   * Importiert Planer-Status
   */
  importState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.currentMonth = parsed.month;
      this.currentYear = parsed.year;
      this.timeAllocation = parsed.timeAllocation;
      this.budgetAllocation = parsed.budgetAllocation;
      this.roleSettings = parsed.roleSettings;
      this.activities = parsed.activities || [];
    } catch (error) {
      console.error('Fehler beim Importieren des Planer-Status:', error);
    }
  }
}
