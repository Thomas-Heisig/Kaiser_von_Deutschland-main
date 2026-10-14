/**
 * CareerPathSystem - Verwaltet Karrierepfade und Aufstieg
 * 
 * Implementiert:
 * - 5 Hauptkarrierepfade (Handwerk, Politik, Militär, Klerus, Gelehrte)
 * - Aufstiegsbedingungen (Erfahrung, Fertigkeiten, Prestige)
 * - Beförderungs-Logik
 * - Prüfungen und Meisterstücke
 */

import { CareerCategory } from './LifePhaseTypes';

/**
 * Karrierepfad-Definition
 */
export interface CareerPath {
  id: string;
  name: string;
  category: CareerCategory;
  description: string;
  stages: CareerStage[];
}

/**
 * Karriere-Stufe
 */
export interface CareerStage {
  rank: string;
  minYearsExperience: number;
  requiredSkills: Record<string, number>;
  prestigeRequired: number;
  specialTasks?: string[];
}

/**
 * Karriere-Fortschritt eines Spielers
 */
export interface CareerProgress {
  currentPathId: string;
  currentStageIndex: number;
  yearsInCurrentStage: number;
  totalYearsExperience: number;
  skills: Map<string, number>;
  prestige: number;
  completedTasks: string[];
}

/**
 * Aufstiegs-Check-Ergebnis
 */
export interface PromotionCheckResult {
  eligible: boolean;
  missingRequirements: string[];
  recommendations: string[];
}

/**
 * Karrierepfad-Management-System
 */
export class CareerPathSystem {
  private careerPaths: CareerPath[] = [];
  private playerProgress: CareerProgress | null = null;

  constructor() {
    this.loadCareerPaths();
  }

  /**
   * Lädt Karrierepfade aus JSON
   */
  private async loadCareerPaths(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/career-paths.json');
      const data = await response.json();
      this.careerPaths = data.careerPaths;
    } catch (error) {
      console.error('Fehler beim Laden der Karrierepfade:', error);
    }
  }

  /**
   * Initialisiert Karriere-Fortschritt für einen neuen Spieler
   */
  initializeCareer(pathId: string, initialSkills: Map<string, number>): void {
    const path = this.careerPaths.find(p => p.id === pathId);
    if (!path) {
      console.error(`Karrierepfad ${pathId} nicht gefunden`);
      return;
    }

    this.playerProgress = {
      currentPathId: pathId,
      currentStageIndex: 0,
      yearsInCurrentStage: 0,
      totalYearsExperience: 0,
      skills: initialSkills,
      prestige: 0,
      completedTasks: []
    };
  }

  /**
   * Gibt alle verfügbaren Karrierepfade zurück
   */
  getCareerPaths(): CareerPath[] {
    return this.careerPaths;
  }

  /**
   * Gibt Karrierepfad nach ID zurück
   */
  getCareerPathById(id: string): CareerPath | undefined {
    return this.careerPaths.find(p => p.id === id);
  }

  /**
   * Gibt Karrierepfade nach Kategorie zurück
   */
  getCareerPathsByCategory(category: CareerCategory): CareerPath[] {
    return this.careerPaths.filter(p => p.category === category);
  }

  /**
   * Gibt aktuellen Karriere-Fortschritt zurück
   */
  getProgress(): CareerProgress | null {
    return this.playerProgress;
  }

  /**
   * Gibt aktuelle Karriere-Stufe zurück
   */
  getCurrentStage(): CareerStage | null {
    if (!this.playerProgress) return null;
    
    const path = this.getCareerPathById(this.playerProgress.currentPathId);
    if (!path) return null;
    
    return path.stages[this.playerProgress.currentStageIndex] || null;
  }

  /**
   * Gibt nächste Karriere-Stufe zurück
   */
  getNextStage(): CareerStage | null {
    if (!this.playerProgress) return null;
    
    const path = this.getCareerPathById(this.playerProgress.currentPathId);
    if (!path) return null;
    
    const nextIndex = this.playerProgress.currentStageIndex + 1;
    return path.stages[nextIndex] || null;
  }

  /**
   * Aktualisiert Fertigkeiten
   */
  updateSkill(skillName: string, value: number): void {
    if (!this.playerProgress) return;
    
    const currentValue = this.playerProgress.skills.get(skillName) || 0;
    const newValue = Math.max(0, Math.min(100, currentValue + value));
    this.playerProgress.skills.set(skillName, newValue);
  }

  /**
   * Aktualisiert Prestige
   */
  updatePrestige(change: number): void {
    if (!this.playerProgress) return;
    this.playerProgress.prestige = Math.max(0, Math.min(100, 
      this.playerProgress.prestige + change
    ));
  }

  /**
   * Markiert Spezial-Aufgabe als erledigt
   */
  completeTask(taskName: string): void {
    if (!this.playerProgress) return;
    
    if (!this.playerProgress.completedTasks.includes(taskName)) {
      this.playerProgress.completedTasks.push(taskName);
    }
  }

  /**
   * Verarbeitet Zeit-Fortschritt (z.B. ein Jahr)
   */
  advanceTime(years: number): void {
    if (!this.playerProgress) return;
    
    this.playerProgress.yearsInCurrentStage += years;
    this.playerProgress.totalYearsExperience += years;
  }

  /**
   * Prüft, ob Aufstieg möglich ist
   */
  checkPromotionEligibility(): PromotionCheckResult {
    const result: PromotionCheckResult = {
      eligible: true,
      missingRequirements: [],
      recommendations: []
    };

    if (!this.playerProgress) {
      result.eligible = false;
      result.missingRequirements.push('Keine aktive Karriere');
      return result;
    }

    const nextStage = this.getNextStage();
    if (!nextStage) {
      result.eligible = false;
      result.missingRequirements.push('Höchste Stufe erreicht');
      return result;
    }

    // Prüfe Erfahrung (in aktueller Stufe)
    if (this.playerProgress.yearsInCurrentStage < nextStage.minYearsExperience) {
      result.eligible = false;
      const missing = nextStage.minYearsExperience - this.playerProgress.yearsInCurrentStage;
      result.missingRequirements.push(
        `Noch ${missing} Jahr(e) Erfahrung in aktueller Stufe erforderlich`
      );
    }

    // Prüfe Fertigkeiten
    Object.entries(nextStage.requiredSkills).forEach(([skill, required]) => {
      const current = this.playerProgress!.skills.get(skill) || 0;
      if (current < required) {
        result.eligible = false;
        result.missingRequirements.push(
          `${skill}: ${required - current} Punkte fehlen (${current}/${required})`
        );
      }
    });

    // Prüfe Prestige
    if (this.playerProgress.prestige < nextStage.prestigeRequired) {
      result.eligible = false;
      const missing = nextStage.prestigeRequired - this.playerProgress.prestige;
      result.missingRequirements.push(
        `Noch ${missing} Prestige-Punkte erforderlich`
      );
    }

    // Prüfe Spezial-Aufgaben
    if (nextStage.specialTasks) {
      const incompleteTasks = nextStage.specialTasks.filter(
        task => !this.playerProgress!.completedTasks.includes(task)
      );
      
      if (incompleteTasks.length > 0) {
        result.eligible = false;
        incompleteTasks.forEach(task => {
          result.missingRequirements.push(`Aufgabe nicht erledigt: ${task}`);
        });
      }
    }

    // Empfehlungen für Verbesserung
    if (!result.eligible) {
      result.recommendations.push('Konzentriere dich auf die fehlenden Anforderungen');
      
      // Finde niedrigste Fertigkeit
      const skillEntries = Array.from(this.playerProgress.skills.entries());
      if (skillEntries.length > 0) {
        const lowestSkill = skillEntries.reduce((min, current) => 
          current[1] < min[1] ? current : min
        );
        result.recommendations.push(
          `Trainiere ${lowestSkill[0]} (aktuell ${lowestSkill[1]})`
        );
      }
    }

    return result;
  }

  /**
   * Führt Beförderung durch
   */
  promote(): boolean {
    const check = this.checkPromotionEligibility();
    
    if (!check.eligible || !this.playerProgress) {
      console.error('Beförderung nicht möglich:', check.missingRequirements);
      return false;
    }

    this.playerProgress.currentStageIndex++;
    this.playerProgress.yearsInCurrentStage = 0;
    
    const newStage = this.getCurrentStage();
    console.log(`Beförderung erfolgreich! Neuer Rang: ${newStage?.rank}`);
    
    return true;
  }

  /**
   * Gibt Karriere-Zusammenfassung zurück
   */
  getCareerSummary(): string {
    if (!this.playerProgress) {
      return 'Keine aktive Karriere';
    }

    const path = this.getCareerPathById(this.playerProgress.currentPathId);
    const stage = this.getCurrentStage();
    
    if (!path || !stage) {
      return 'Fehler beim Abrufen der Karriere-Daten';
    }

    return `
Karrierepfad: ${path.name}
Aktueller Rang: ${stage.rank}
Erfahrung: ${this.playerProgress.totalYearsExperience} Jahre (${this.playerProgress.yearsInCurrentStage} im aktuellen Rang)
Prestige: ${this.playerProgress.prestige}/100
Stufe: ${this.playerProgress.currentStageIndex + 1}/${path.stages.length}
    `.trim();
  }

  /**
   * Exportiert Karriere-Fortschritt
   */
  exportProgress(): string {
    if (!this.playerProgress) return '{}';
    
    // Konvertiere Map zu Object für JSON-Serialisierung
    const skillsObj: Record<string, number> = {};
    this.playerProgress.skills.forEach((value, key) => {
      skillsObj[key] = value;
    });

    return JSON.stringify({
      ...this.playerProgress,
      skills: skillsObj
    });
  }

  /**
   * Importiert Karriere-Fortschritt
   */
  importProgress(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      // Konvertiere Object zurück zu Map
      const skillsMap = new Map<string, number>();
      Object.entries(parsed.skills || {}).forEach(([key, value]) => {
        skillsMap.set(key, value as number);
      });

      this.playerProgress = {
        ...parsed,
        skills: skillsMap
      };
    } catch (error) {
      console.error('Fehler beim Importieren des Karriere-Fortschritts:', error);
    }
  }
}
