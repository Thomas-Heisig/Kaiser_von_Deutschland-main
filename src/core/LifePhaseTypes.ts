/**
 * Typen für das Lebensphasen-System
 * Definiert alle Datenstrukturen für Intro, Charakterbildung, Lebensphasen
 */

/**
 * Persönlichkeitsprofil aus philosophischen Fragen
 */
export interface PersonalityProfile {
  charisma: number;        // 0-100: Charisma und soziale Fähigkeiten
  intellect: number;       // 0-100: Intelligenz und Wissen
  pragmatism: number;      // 0-100: Pragmatismus vs. Idealismus
  spirituality: number;    // 0-100: Spiritualität und Glaube
}

/**
 * Philosophische Frage für Charakter-Building
 */
export interface PhilosophicalQuestion {
  id: string;
  question: string;
  answers: PhilosophicalAnswer[];
}

/**
 * Antwort auf philosophische Frage
 */
export interface PhilosophicalAnswer {
  text: string;
  effects: Partial<PersonalityProfile>;
}

/**
 * Zeitperioden für Spielstart
 */
export enum EpochPeriod {
  ANTIQUE_EARLY_MEDIEVAL = 'antique_early_medieval',    // 500-1000
  HIGH_MEDIEVAL = 'high_medieval',                       // 1000-1350
  LATE_MEDIEVAL = 'late_medieval',                       // 1350-1500
  EARLY_MODERN = 'early_modern',                         // 1500-1800
  INDUSTRIALIZATION = 'industrialization',               // 1800-1914
  WORLD_WARS = 'world_wars',                             // 1914-1945
  ECONOMIC_MIRACLE = 'economic_miracle',                 // 1945-1989
  MODERN = 'modern',                                     // 1990-2024
  FUTURE = 'future'                                      // 2025-2050+
}

/**
 * Epochen-Definition mit Zeitraum und Beschreibung
 */
export interface EpochDefinition {
  id: EpochPeriod;
  name: string;
  description: string;
  yearStart: number;
  yearEnd: number;
  availableRoles: string[];
  historicalContext: string;
}

/**
 * Lebensphasen-Typen
 */
export enum LifePhaseType {
  BIRTH = 'birth',           // Bei der Geburt starten (5-10 Jahre)
  CHILDHOOD = 'childhood',   // Als Schüler starten (10-14 Jahre)
  ADULTHOOD = 'adulthood'    // Als Erwachsener starten (18-25 Jahre)
}

/**
 * Familienhintergrund für Birth-Phase
 */
export enum FamilyBackground {
  NOBILITY = 'nobility',         // Adel
  BOURGEOISIE = 'bourgeoisie',  // Bürgertum
  PEASANTRY = 'peasantry',      // Bauerntum
  CLERGY = 'clergy'             // Klerus
}

/**
 * Hauptberufskategorien für Adulthood-Phase
 */
export enum CareerCategory {
  ECONOMY = 'economy',         // Händler, Bankier, Gildenmeister
  CRAFTS = 'crafts',          // Schmied, Baumeister, Bäcker
  POLITICS = 'politics',      // Beamter, Diplomat, Parteimitglied
  MILITARY = 'military',      // Soldat, Offizier, Stratege
  CLERGY_CAREER = 'clergy'    // Mönch, Priester, Theologe
}

/**
 * Lebensphasen-Optionen
 */
export interface LifePhaseOption {
  type: LifePhaseType;
  name: string;
  description: string;
  ageStart: number;
  ageEnd: number;
  features: string[];
}

/**
 * Birth-Phase spezifische Daten
 */
export interface BirthPhaseData {
  familyBackground: FamilyBackground;
  birthYear: number;
  birthRegion: string;
  parentsProfession: string;
  siblings: number;
  educationLevel: number; // 0-100
}

/**
 * Childhood-Phase spezifische Daten
 */
export interface ChildhoodPhaseData {
  schoolType: string;        // Lateinschule, Universitas, etc.
  subjects: string[];        // Gewählte Fächer
  mentors: string[];         // Lehrer und Mentoren
  activities: string[];      // Ferienaktivitäten
  examResults: number;       // 0-100
}

/**
 * Adulthood-Phase spezifische Daten
 */
export interface AdulthoodPhaseData {
  careerCategory: CareerCategory;
  specificProfession: string;
  startingNetwork: string[]; // Kollegen, Vorgesetzte
  initialSkills: Map<string, number>;
}

/**
 * Komplette Lebensphasen-Konfiguration
 */
export interface LifePhaseConfiguration {
  selectedPhase: LifePhaseType;
  epoch: EpochPeriod;
  personality: PersonalityProfile;
  birthData?: BirthPhaseData;
  childhoodData?: ChildhoodPhaseData;
  adulthoodData?: AdulthoodPhaseData;
}

/**
 * Zeitmanagement für monatliche Zyklen
 */
export interface TimeAllocation {
  work: number;           // 4-12 Stunden
  family: number;         // 2-6 Stunden
  education: number;      // 1-4 Stunden
  leisure: number;        // 2-6 Stunden
  sleep: number;          // 6-8 Stunden (Pflicht!)
}

/**
 * Geschwindigkeitsmodus
 */
export enum GameSpeedMode {
  DETAILED = 'detailed',      // 1 Tag = 5-10 min real time
  BALANCED = 'balanced',      // 1 Monat = 20-30 min real time
  STRATEGIC = 'strategic'     // 1 Jahr = 30-45 min real time
}

/**
 * Rollenspezifischer Bereich
 */
export interface RoleSpecificArea {
  level: number;              // 1-4 (Personal, Lokal, Regional, National)
  name: string;
  description: string;
  availableActions: string[];
  buildings: string[];
}

/**
 * Karrierepfad
 */
export interface CareerPath {
  id: string;
  name: string;
  stages: CareerStage[];
  requirements: CareerRequirements;
}

/**
 * Karriere-Stufe
 */
export interface CareerStage {
  rank: string;
  minYearsExperience: number;
  requiredSkills: Map<string, number>;
  prestigeRequired: number;
  specialTasks?: string[];
}

/**
 * Aufstiegsbedingungen
 */
export interface CareerRequirements {
  yearsInRole: number;
  skillLevels: Map<string, number>;
  prestige: number;
  reputation: number;
  networkSize: number;
  specialAchievements?: string[];
}

/**
 * Monatliche Aktion (berufsspezifisch)
 */
export interface MonthlyAction {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredRole?: string;
  effects: Record<string, number>;
  cost?: number;
}

/**
 * Bauoption nach Rolle
 */
export interface RoleSpecificBuilding {
  id: string;
  name: string;
  category: 'living' | 'professional' | 'advancement';
  requiredRole: string;
  requiredRank?: string;
  cost: number;
  effects: Record<string, number>;
  description: string;
}

/**
 * Spielstart-Szenario
 */
export interface GameStartScenario {
  id: string;
  name: string;
  description: string;
  startYear: number;
  startingPhase: LifePhaseType;
  suggestedCareer: string;
  historicalContext: string;
  goals: string[];
}
