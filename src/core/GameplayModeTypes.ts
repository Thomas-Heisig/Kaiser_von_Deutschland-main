/**
 * Gameplay Modes Type Definitions
 * 
 * Types for the economic simulation model with role-based perspectives
 * 
 * @version 2.4.0
 * @see docs/02-simulation-model/
 */

/**
 * Gameplay mode type (6 variants of economic simulation)
 */
export type GameplayModeType =
  | 'tables_classic'        // Abstract table models
  | 'trade_adventure'       // Trade & career simulation
  | 'production_master'     // Production chains
  | 'management_sim'        // Management simulation
  | 'strategy_classic'      // Macro-economic simulation (default)
  | 'multiplayer_world';    // Player-driven economy

/**
 * Perspective mode (how player views the world)
 */
export type PerspectiveModeType =
  | 'normal'       // Standard role perspective
  | 'scientist'    // Data-focused analytical view
  | 'god';         // Complete information (debug/learning mode)

/**
 * Role perspective categories
 */
export type RolePerspectiveType =
  | 'HOUSEHOLD'    // Consumer/Worker perspective
  | 'CRAFTSMAN'    // Self-employed trader/artisan
  | 'MINISTER'     // Government official
  | 'SCIENTIST'    // Researcher/Analyst
  | 'GOD';         // Omniscient (debug mode)

/**
 * Intensity settings (1-10 scale for each axis)
 */
export interface IntensitySettings {
  /** Information intensity: 1 = complete, 10 = fragmented/delayed */
  information: number;
  /** Consequence intensity: 1 = reversible, 10 = irreversible/path-dependent */
  consequence: number;
  /** Time intensity: 1 = instant (x100), 10 = realistic delays */
  time: number;
  /** Interpretation intensity: 1 = clear explained, 10 = ambiguous/self-discover */
  interpretation: number;
}

/**
 * Gameplay mode definition
 */
export interface GameplayMode {
  id: GameplayModeType;
  name: string;
  description: string;
  iconPath?: string;
  complexityLevel: number; // 1-6
  defaultIntensity: IntensitySettings;
  features: string[];
  recommendedRoles: string[];
  singleplayerOnly: boolean;
  createdAt?: Date;
}

/**
 * Player gameplay settings
 */
export interface PlayerSettings {
  playerId: string;
  modeId: GameplayModeType;
  intensity: IntensitySettings;
  currentRole: string;
  perspectiveMode: PerspectiveModeType;
  tutorialCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Role perspective configuration
 */
export interface RolePerspective {
  id?: number;
  roleType: RolePerspectiveType;
  visibleData: string[];           // What data can this role see?
  dataAccuracy: number;             // 0.0-1.0, how accurate is the data?
  dataDelayDays: number;            // How old is the information?
  interpretationHelp: boolean;      // Are causality hints provided?
  controlScope: 'personal' | 'local' | 'national' | 'analytical' | 'complete';
  informationSources: string[];     // Where does data come from?
  limitations: string[];            // What can't this role do/see?
  createdAt?: Date;
}

/**
 * Intensity preset (predefined configuration)
 */
export interface IntensityPreset {
  id: string;
  name: string;
  description: string;
  intensity: IntensitySettings;
  isDefault: boolean;
  createdAt?: Date;
}

/**
 * Intensity preset IDs
 */
export type IntensityPresetType =
  | 'casual'       // Easy, accessible (3/3/4/3)
  | 'balanced'     // Standard challenge (5/5/5/5)
  | 'realistic'    // High difficulty (8/9/8/8)
  | 'historian'    // Maximum realism (10/10/10/10)
  | 'learning';    // Optimized for education (7/4/6/8)

/**
 * Default intensity values
 */
export const DEFAULT_INTENSITY: IntensitySettings = {
  information: 5,
  consequence: 5,
  time: 5,
  interpretation: 5,
};

/**
 * Predefined intensity presets
 */
export const INTENSITY_PRESETS: Record<IntensityPresetType, IntensitySettings> = {
  casual: {
    information: 3,
    consequence: 3,
    time: 4,
    interpretation: 3,
  },
  balanced: {
    information: 5,
    consequence: 5,
    time: 5,
    interpretation: 5,
  },
  realistic: {
    information: 8,
    consequence: 9,
    time: 8,
    interpretation: 8,
  },
  historian: {
    information: 10,
    consequence: 10,
    time: 10,
    interpretation: 10,
  },
  learning: {
    information: 7,
    consequence: 4,
    time: 6,
    interpretation: 8,
  },
};

/**
 * Gameplay mode metadata
 */
export const GAMEPLAY_MODE_INFO: Record<GameplayModeType, {
  name: string;
  description: string;
  complexity: number;
  defaultIntensity: IntensityPresetType;
}> = {
  tables_classic: {
    name: 'Tabellen-Klassiker',
    description: 'Klassische Kaiser-Erfahrung mit Menüs und Tabellen',
    complexity: 1,
    defaultIntensity: 'casual',
  },
  trade_adventure: {
    name: 'Handels-Abenteuer',
    description: 'Fokus auf Handel und Karriere als Kaufmann',
    complexity: 2,
    defaultIntensity: 'casual',
  },
  production_master: {
    name: 'Aufbau-Meister',
    description: 'Komplexe Produktionsketten und Logistik',
    complexity: 3,
    defaultIntensity: 'balanced',
  },
  management_sim: {
    name: 'Konzern-Chef',
    description: 'Unternehmensführung mit KI-Konkurrenz',
    complexity: 4,
    defaultIntensity: 'balanced',
  },
  strategy_classic: {
    name: 'Strategie-Klassiker',
    description: 'Vollständige makroökonomische Simulation',
    complexity: 5,
    defaultIntensity: 'balanced',
  },
  multiplayer_world: {
    name: 'Multiplayer-Welt',
    description: 'Emergente Wirtschaft mit echten Spielern',
    complexity: 6,
    defaultIntensity: 'realistic',
  },
};

/**
 * Validate intensity value (must be 1-10)
 */
export function validateIntensity(value: number): boolean {
  return value >= 1 && value <= 10 && Number.isInteger(value);
}

/**
 * Validate intensity settings
 */
export function validateIntensitySettings(settings: IntensitySettings): boolean {
  return (
    validateIntensity(settings.information) &&
    validateIntensity(settings.consequence) &&
    validateIntensity(settings.time) &&
    validateIntensity(settings.interpretation)
  );
}

/**
 * Get time multiplier from time intensity
 * 
 * @param intensity Time intensity (1-10)
 * @returns Time multiplier (100x to 1x)
 */
export function getTimeMultiplier(intensity: number): number {
  // 1 = x100 (very fast), 5 = x10 (balanced), 10 = x1 (realtime)
  return Math.pow(10, 2 - (intensity - 1) * 0.2);
}

/**
 * Get information accuracy from information intensity
 * 
 * @param intensity Information intensity (1-10)
 * @returns Accuracy factor (1.0 to 0.3)
 */
export function getInformationAccuracy(intensity: number): number {
  // 1 = 100% accurate, 5 = 70%, 10 = 30%
  return 1.0 - ((intensity - 1) * 0.07);
}

/**
 * Get data delay from information intensity
 * 
 * @param intensity Information intensity (1-10)
 * @returns Delay in days (0 to 30)
 */
export function getDataDelay(intensity: number): number {
  // 1 = 0 days, 5 = 7 days, 10 = 30 days
  return Math.floor((intensity - 1) * 3.33);
}

/**
 * Calculate difficulty score (0-100)
 * Higher = more difficult/realistic
 */
export function calculateDifficulty(settings: IntensitySettings): number {
  const sum = settings.information + settings.consequence + settings.time + settings.interpretation;
  return Math.round((sum / 40) * 100);
}

/**
 * Get appropriate role perspective for a role type
 */
export function getRolePerspectiveType(roleType: string): RolePerspectiveType {
  const roleUpper = roleType.toUpperCase();
  
  // Map specific roles to perspective types
  if (roleUpper.includes('BAUER') || roleUpper.includes('ARBEITER') || roleUpper === 'WORKER') {
    return 'HOUSEHOLD';
  }
  
  if (roleUpper.includes('HÄNDLER') || roleUpper.includes('HANDWERKER') || roleUpper.includes('TRADER') || roleUpper === 'CRAFTSMAN') {
    return 'CRAFTSMAN';
  }
  
  if (roleUpper.includes('MINISTER') || roleUpper.includes('BÜRGERMEISTER') || roleUpper.includes('KAISER') || roleUpper.includes('KÖNIG')) {
    return 'MINISTER';
  }
  
  if (roleUpper.includes('GELEHRTER') || roleUpper === 'SCIENTIST') {
    return 'SCIENTIST';
  }
  
  if (roleUpper === 'GOD' || roleUpper === 'DEBUG') {
    return 'GOD';
  }
  
  // Default to household for unknown roles
  return 'HOUSEHOLD';
}
