/**
 * LifePhaseSystem - Verwaltet Lebensphasen, Epochenauswahl und Charakterentwicklung
 * 
 * Dieses System implementiert das neue Spielablauf-Konzept:
 * 1. Intro-Sequenz mit philosophischen Fragen
 * 2. Zeitperioden-Auswahl
 * 3. Lebensabschnitts-Auswahl (Geburt, Kindheit, Erwachsen)
 * 4. Rollenspezifische Entwicklung
 */

import {
  PersonalityProfile,
  PhilosophicalQuestion,
  EpochPeriod,
  EpochDefinition,
  LifePhaseType,
  LifePhaseConfiguration,
  FamilyBackground,
  CareerCategory,
  BirthPhaseData,
  ChildhoodPhaseData,
  AdulthoodPhaseData,
  GameSpeedMode,
  TimeAllocation
} from './LifePhaseTypes';

/**
 * Haupt-System für Lebensphasen-Management
 */
export class LifePhaseSystem {
  private philosophicalQuestions: PhilosophicalQuestion[] = [];
  private epochs: EpochDefinition[] = [];
  private currentConfiguration: LifePhaseConfiguration | null = null;
  private currentPersonality: PersonalityProfile;
  private speedMode: GameSpeedMode = GameSpeedMode.BALANCED;

  constructor() {
    this.currentPersonality = this.createDefaultPersonality();
    this.loadData();
  }

  /**
   * Lädt alle benötigten Daten aus JSON-Dateien
   */
  private async loadData(): Promise<void> {
    try {
      // Philosophische Fragen laden
      const questionsResponse = await fetch('/src/data/json/philosophical-questions.json');
      const questionsData = await questionsResponse.json();
      this.philosophicalQuestions = questionsData.questions;

      // Epochen laden
      const epochsResponse = await fetch('/src/data/json/epochs.json');
      const epochsData = await epochsResponse.json();
      this.epochs = epochsData.epochs;
    } catch (error) {
      console.error('Fehler beim Laden der Lebensphasen-Daten:', error);
    }
  }

  /**
   * Erstellt Standard-Persönlichkeitsprofil
   */
  private createDefaultPersonality(): PersonalityProfile {
    return {
      charisma: 50,
      intellect: 50,
      pragmatism: 50,
      spirituality: 50
    };
  }

  /**
   * Gibt alle philosophischen Fragen zurück
   */
  getPhilosophicalQuestions(): PhilosophicalQuestion[] {
    return this.philosophicalQuestions;
  }

  /**
   * Verarbeitet Antwort auf philosophische Frage und aktualisiert Persönlichkeit
   */
  answerPhilosophicalQuestion(questionId: string, answerIndex: number): void {
    const question = this.philosophicalQuestions.find(q => q.id === questionId);
    if (!question) {
      console.error(`Frage ${questionId} nicht gefunden`);
      return;
    }

    const answer = question.answers[answerIndex];
    if (!answer) {
      console.error(`Antwort ${answerIndex} nicht gefunden`);
      return;
    }

    // Persönlichkeitswerte aktualisieren
    Object.entries(answer.effects).forEach(([key, value]) => {
      const profileKey = key as keyof PersonalityProfile;
      this.currentPersonality[profileKey] = Math.max(0, Math.min(100, 
        this.currentPersonality[profileKey] + value
      ));
    });
  }

  /**
   * Gibt aktuelles Persönlichkeitsprofil zurück
   */
  getPersonalityProfile(): PersonalityProfile {
    return { ...this.currentPersonality };
  }

  /**
   * Gibt alle verfügbaren Epochen zurück
   */
  getEpochs(): EpochDefinition[] {
    return [...this.epochs];
  }

  /**
   * Gibt Epoche nach ID zurück
   */
  getEpochById(id: EpochPeriod): EpochDefinition | undefined {
    return this.epochs.find(e => e.id === id);
  }

  /**
   * Startet Birth-Phase (Geburt)
   */
  startBirthPhase(
    epoch: EpochPeriod,
    familyBackground: FamilyBackground,
    birthYear: number,
    birthRegion: string
  ): void {
    const birthData: BirthPhaseData = {
      familyBackground,
      birthYear,
      birthRegion,
      parentsProfession: this.determineParentsProfession(familyBackground),
      siblings: Math.floor(Math.random() * 5),
      educationLevel: 0
    };

    this.currentConfiguration = {
      selectedPhase: LifePhaseType.BIRTH,
      epoch,
      personality: this.getPersonalityProfile(),
      birthData
    };
  }

  /**
   * Startet Childhood-Phase (Schulzeit)
   */
  startChildhoodPhase(
    epoch: EpochPeriod,
    schoolType: string,
    subjects: string[]
  ): void {
    const childhoodData: ChildhoodPhaseData = {
      schoolType,
      subjects,
      mentors: [],
      activities: [],
      examResults: 0
    };

    this.currentConfiguration = {
      selectedPhase: LifePhaseType.CHILDHOOD,
      epoch,
      personality: this.getPersonalityProfile(),
      childhoodData
    };
  }

  /**
   * Startet Adulthood-Phase (Erwachsener)
   */
  startAdulthoodPhase(
    epoch: EpochPeriod,
    careerCategory: CareerCategory,
    specificProfession: string
  ): void {
    const adulthoodData: AdulthoodPhaseData = {
      careerCategory,
      specificProfession,
      startingNetwork: this.generateStartingNetwork(),
      initialSkills: this.generateInitialSkills(careerCategory)
    };

    this.currentConfiguration = {
      selectedPhase: LifePhaseType.ADULTHOOD,
      epoch,
      personality: this.getPersonalityProfile(),
      adulthoodData
    };
  }

  /**
   * Bestimmt Beruf der Eltern basierend auf Familienhintergrund
   */
  private determineParentsProfession(background: FamilyBackground): string {
    const professions = {
      [FamilyBackground.NOBILITY]: 'Adeliger',
      [FamilyBackground.BOURGEOISIE]: 'Händler',
      [FamilyBackground.PEASANTRY]: 'Bauer',
      [FamilyBackground.CLERGY]: 'Geistlicher'
    };
    return professions[background];
  }

  /**
   * Generiert Start-Netzwerk basierend auf Epoche
   */
  private generateStartingNetwork(): string[] {
    return [
      'Kollege A',
      'Kollege B',
      'Vorgesetzter'
    ];
  }

  /**
   * Generiert initiale Fertigkeiten basierend auf Karriere-Kategorie
   */
  private generateInitialSkills(category: CareerCategory): Map<string, number> {
    const skills = new Map<string, number>();
    
    switch (category) {
      case CareerCategory.ECONOMY:
        skills.set('handel', 30);
        skills.set('verwaltung', 20);
        break;
      case CareerCategory.CRAFTS:
        skills.set('handwerk', 35);
        skills.set('verwaltung', 15);
        break;
      case CareerCategory.POLITICS:
        skills.set('politik', 30);
        skills.set('verwaltung', 30);
        skills.set('diplomatie', 20);
        break;
      case CareerCategory.MILITARY:
        skills.set('kampf', 40);
        skills.set('führung', 20);
        break;
      case CareerCategory.CLERGY_CAREER:
        skills.set('theologie', 35);
        skills.set('bildung', 25);
        break;
    }
    
    return skills;
  }

  /**
   * Gibt aktuelle Konfiguration zurück
   */
  getCurrentConfiguration(): LifePhaseConfiguration | null {
    return this.currentConfiguration;
  }

  /**
   * Setzt Geschwindigkeitsmodus
   */
  setSpeedMode(mode: GameSpeedMode): void {
    this.speedMode = mode;
  }

  /**
   * Gibt aktuellen Geschwindigkeitsmodus zurück
   */
  getSpeedMode(): GameSpeedMode {
    return this.speedMode;
  }

  /**
   * Berechnet Zeit-Multiplikator basierend auf Modus
   */
  getTimeMultiplier(): number {
    switch (this.speedMode) {
      case GameSpeedMode.DETAILED:
        return 1;      // 1 Tag = 5-10 min
      case GameSpeedMode.BALANCED:
        return 30;     // 1 Monat = 20-30 min
      case GameSpeedMode.STRATEGIC:
        return 365;    // 1 Jahr = 30-45 min
      default:
        return 30;
    }
  }

  /**
   * Validiert Zeit-Verteilung (muss 24 Stunden ergeben)
   */
  validateTimeAllocation(allocation: TimeAllocation): boolean {
    const total = allocation.work + allocation.family + 
                  allocation.education + allocation.leisure + allocation.sleep;
    return Math.abs(total - 24) < 0.1;
  }

  /**
   * Gibt empfohlene Zeit-Verteilung basierend auf Karriere zurück
   */
  getRecommendedTimeAllocation(career: CareerCategory): TimeAllocation {
    const recommendations: Record<CareerCategory, TimeAllocation> = {
      [CareerCategory.ECONOMY]: {
        work: 10,
        family: 4,
        education: 2,
        leisure: 2,
        sleep: 6
      },
      [CareerCategory.CRAFTS]: {
        work: 8,
        family: 4,
        education: 3,
        leisure: 3,
        sleep: 6
      },
      [CareerCategory.POLITICS]: {
        work: 10,
        family: 3,
        education: 3,
        leisure: 2,
        sleep: 6
      },
      [CareerCategory.MILITARY]: {
        work: 12,
        family: 2,
        education: 2,
        leisure: 2,
        sleep: 6
      },
      [CareerCategory.CLERGY_CAREER]: {
        work: 6,
        family: 2,
        education: 4,
        leisure: 4,
        sleep: 8
      }
    };

    return recommendations[career];
  }

  /**
   * Exportiert Konfiguration für Speichern
   */
  exportConfiguration(): string {
    return JSON.stringify({
      configuration: this.currentConfiguration,
      personality: this.currentPersonality,
      speedMode: this.speedMode
    });
  }

  /**
   * Importiert Konfiguration beim Laden
   */
  importConfiguration(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.currentConfiguration = parsed.configuration;
      this.currentPersonality = parsed.personality;
      this.speedMode = parsed.speedMode || GameSpeedMode.BALANCED;
    } catch (error) {
      console.error('Fehler beim Importieren der Konfiguration:', error);
    }
  }
}
