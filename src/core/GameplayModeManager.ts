/**
 * Gameplay Mode Manager
 * 
 * Central service for managing gameplay modes, intensity settings, and perspectives
 * 
 * @version 2.4.0
 * @see docs/02-simulation-model/
 */

import {
  GameplayModeType,
  PerspectiveModeType,
  IntensitySettings,
  PlayerSettings,
  GameplayMode,
  RolePerspective,
  IntensityPreset,
  IntensityPresetType,
  INTENSITY_PRESETS,
  GAMEPLAY_MODE_INFO,
  validateIntensitySettings,
  getRolePerspectiveType,
  getTimeMultiplier,
  getInformationAccuracy,
  getDataDelay,
  calculateDifficulty,
} from './GameplayModeTypes';
import { DatabaseAdapter } from './DatabaseAdapter';

/**
 * Gameplay Mode Manager
 * 
 * Responsibilities:
 * - Load/save player settings
 * - Switch gameplay modes
 * - Adjust intensity settings
 * - Apply perspective filters
 * - Manage role-specific visibility
 */
export class GameplayModeManager {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Initialize player settings with defaults
   */
  async initializePlayerSettings(
    playerId: string,
    modeId: GameplayModeType = 'strategy_classic',
    roleType: string = 'MINISTER'
  ): Promise<PlayerSettings> {
    // Get mode default intensity
    const modeInfo = GAMEPLAY_MODE_INFO[modeId];
    const presetName = modeInfo.defaultIntensity;
    const intensity = INTENSITY_PRESETS[presetName];

    const settings: PlayerSettings = {
      playerId,
      modeId,
      intensity,
      currentRole: roleType,
      perspectiveMode: 'normal',
      tutorialCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    await this.db.execute(
      `INSERT INTO player_settings (
        player_id, mode_id,
        intensity_information, intensity_consequence, intensity_time, intensity_interpretation,
        current_role, perspective_mode, tutorial_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        playerId,
        modeId,
        intensity.information,
        intensity.consequence,
        intensity.time,
        intensity.interpretation,
        roleType,
        'normal',
        0,
      ]
    );

    return settings;
  }

  /**
   * Get player settings
   */
  async getPlayerSettings(playerId: string): Promise<PlayerSettings | null> {
    const rows = await this.db.query<{
      player_id: string;
      mode_id: GameplayModeType;
      intensity_information: number;
      intensity_consequence: number;
      intensity_time: number;
      intensity_interpretation: number;
      current_role: string;
      perspective_mode: PerspectiveModeType;
      tutorial_completed: number;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT * FROM player_settings WHERE player_id = ?',
      [playerId]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      playerId: row.player_id,
      modeId: row.mode_id,
      intensity: {
        information: row.intensity_information,
        consequence: row.intensity_consequence,
        time: row.intensity_time,
        interpretation: row.intensity_interpretation,
      },
      currentRole: row.current_role,
      perspectiveMode: row.perspective_mode,
      tutorialCompleted: row.tutorial_completed === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Update player intensity settings
   */
  async updateIntensity(playerId: string, intensity: IntensitySettings): Promise<void> {
    if (!validateIntensitySettings(intensity)) {
      throw new Error('Invalid intensity settings: values must be 1-10');
    }

    await this.db.execute(
      `UPDATE player_settings SET
        intensity_information = ?,
        intensity_consequence = ?,
        intensity_time = ?,
        intensity_interpretation = ?,
        updated_at = datetime('now')
      WHERE player_id = ?`,
      [
        intensity.information,
        intensity.consequence,
        intensity.time,
        intensity.interpretation,
        playerId,
      ]
    );
  }

  /**
   * Apply intensity preset
   */
  async applyPreset(playerId: string, presetType: IntensityPresetType): Promise<void> {
    const intensity = INTENSITY_PRESETS[presetType];
    await this.updateIntensity(playerId, intensity);
  }

  /**
   * Change gameplay mode
   */
  async changeMode(playerId: string, newModeId: GameplayModeType): Promise<void> {
    // Get default intensity for new mode
    const modeInfo = GAMEPLAY_MODE_INFO[newModeId];
    const intensity = INTENSITY_PRESETS[modeInfo.defaultIntensity];

    await this.db.execute(
      `UPDATE player_settings SET
        mode_id = ?,
        intensity_information = ?,
        intensity_consequence = ?,
        intensity_time = ?,
        intensity_interpretation = ?,
        updated_at = datetime('now')
      WHERE player_id = ?`,
      [
        newModeId,
        intensity.information,
        intensity.consequence,
        intensity.time,
        intensity.interpretation,
        playerId,
      ]
    );
  }

  /**
   * Switch player role
   */
  async switchRole(playerId: string, newRole: string): Promise<void> {
    await this.db.execute(
      `UPDATE player_settings SET
        current_role = ?,
        updated_at = datetime('now')
      WHERE player_id = ?`,
      [newRole, playerId]
    );
  }

  /**
   * Switch perspective mode
   */
  async switchPerspective(playerId: string, perspectiveMode: PerspectiveModeType): Promise<void> {
    await this.db.execute(
      `UPDATE player_settings SET
        perspective_mode = ?,
        updated_at = datetime('now')
      WHERE player_id = ?`,
      [perspectiveMode, playerId]
    );
  }

  /**
   * Mark tutorial as completed
   */
  async completeTutorial(playerId: string): Promise<void> {
    await this.db.execute(
      `UPDATE player_settings SET
        tutorial_completed = 1,
        updated_at = datetime('now')
      WHERE player_id = ?`,
      [playerId]
    );
  }

  /**
   * Get role perspective configuration
   */
  async getRolePerspective(roleType: string): Promise<RolePerspective | null> {
    const perspectiveType = getRolePerspectiveType(roleType);

    const rows = await this.db.query<{
      id: number;
      role_type: string;
      visible_data_json: string;
      data_accuracy: number;
      data_delay_days: number;
      interpretation_help: number;
      control_scope: string;
      information_sources_json: string;
      limitations_json: string;
      created_at: string;
    }>(
      'SELECT * FROM role_perspectives WHERE role_type = ?',
      [perspectiveType]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      roleType: perspectiveType,
      visibleData: JSON.parse(row.visible_data_json),
      dataAccuracy: row.data_accuracy,
      dataDelayDays: row.data_delay_days,
      interpretationHelp: row.interpretation_help === 1,
      controlScope: row.control_scope as any,
      informationSources: JSON.parse(row.information_sources_json),
      limitations: JSON.parse(row.limitations_json),
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Get all available gameplay modes
   */
  async getAllModes(): Promise<GameplayMode[]> {
    const rows = await this.db.query<{
      id: GameplayModeType;
      name: string;
      description: string;
      icon_path: string;
      complexity_level: number;
      default_info_intensity: number;
      default_consequence_intensity: number;
      default_time_intensity: number;
      default_interpretation_intensity: number;
      features_json: string;
      recommended_roles_json: string;
      singleplayer_only: number;
      created_at: string;
    }>('SELECT * FROM gameplay_modes ORDER BY complexity_level');

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      iconPath: row.icon_path,
      complexityLevel: row.complexity_level,
      defaultIntensity: {
        information: row.default_info_intensity,
        consequence: row.default_consequence_intensity,
        time: row.default_time_intensity,
        interpretation: row.default_interpretation_intensity,
      },
      features: row.features_json ? JSON.parse(row.features_json) : [],
      recommendedRoles: row.recommended_roles_json ? JSON.parse(row.recommended_roles_json) : [],
      singleplayerOnly: row.singleplayer_only === 1,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get all intensity presets
   */
  async getAllPresets(): Promise<IntensityPreset[]> {
    const rows = await this.db.query<{
      id: string;
      name: string;
      description: string;
      info_intensity: number;
      consequence_intensity: number;
      time_intensity: number;
      interpretation_intensity: number;
      is_default: number;
      created_at: string;
    }>('SELECT * FROM intensity_presets ORDER BY info_intensity');

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      intensity: {
        information: row.info_intensity,
        consequence: row.consequence_intensity,
        time: row.time_intensity,
        interpretation: row.interpretation_intensity,
      },
      isDefault: row.is_default === 1,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get gameplay statistics for a player
   */
  async getGameplayStats(playerId: string): Promise<{
    difficulty: number;
    timeMultiplier: number;
    dataAccuracy: number;
    dataDelayDays: number;
  }> {
    const settings = await this.getPlayerSettings(playerId);
    if (!settings) {
      throw new Error(`Player settings not found for ${playerId}`);
    }

    return {
      difficulty: calculateDifficulty(settings.intensity),
      timeMultiplier: getTimeMultiplier(settings.intensity.time),
      dataAccuracy: getInformationAccuracy(settings.intensity.information),
      dataDelayDays: getDataDelay(settings.intensity.information),
    };
  }

  /**
   * Check if data is visible to player based on role perspective
   */
  async isDataVisible(playerId: string, dataType: string): Promise<boolean> {
    const settings = await this.getPlayerSettings(playerId);
    if (!settings) {
      return false;
    }

    // God mode sees everything
    if (settings.perspectiveMode === 'god') {
      return true;
    }

    // Get role perspective
    const perspective = await this.getRolePerspective(settings.currentRole);
    if (!perspective) {
      return false;
    }

    // Check if data type is in visible list
    return (
      perspective.visibleData.includes(dataType) ||
      perspective.visibleData.includes('*')
    );
  }

  /**
   * Apply information filtering based on intensity and role
   */
  async filterInformation<T>(
    playerId: string,
    data: T,
    dataType: string
  ): Promise<T | null> {
    // Check if visible
    const visible = await this.isDataVisible(playerId, dataType);
    if (!visible) {
      return null;
    }

    const settings = await this.getPlayerSettings(playerId);
    if (!settings) {
      return null;
    }

    // God mode gets unfiltered data
    if (settings.perspectiveMode === 'god') {
      return data;
    }

    const perspective = await this.getRolePerspective(settings.currentRole);
    if (!perspective) {
      return null;
    }

    // Calculate effective accuracy based on both role and intensity
    const baseAccuracy = perspective.dataAccuracy;
    const intensityAccuracy = getInformationAccuracy(settings.intensity.information);
    const effectiveAccuracy = baseAccuracy * intensityAccuracy;

    // Apply accuracy reduction to numerical values
    if (typeof data === 'number') {
      // Add noise based on accuracy
      const noise = (1 - effectiveAccuracy) * 0.3; // Up to 30% noise
      const randomFactor = 1 + (Math.random() - 0.5) * noise;
      return (data * randomFactor) as T;
    }

    // For objects, recursively filter
    if (typeof data === 'object' && data !== null) {
      // Clone object and apply noise to numerical fields
      const filtered = { ...data } as any;
      for (const key in filtered) {
        if (typeof filtered[key] === 'number') {
          const noise = (1 - effectiveAccuracy) * 0.3;
          const randomFactor = 1 + (Math.random() - 0.5) * noise;
          filtered[key] = filtered[key] * randomFactor;
        }
      }
      return filtered as T;
    }

    // Return as-is for other types
    return data;
  }

  /**
   * Get interpretation hints based on intensity
   */
  async getInterpretationHints(
    playerId: string,
    event: string
  ): Promise<string[]> {
    const settings = await this.getPlayerSettings(playerId);
    if (!settings) {
      return [];
    }

    const perspective = await this.getRolePerspective(settings.currentRole);
    if (!perspective) {
      return [];
    }

    // No hints if high interpretation intensity (player must figure out themselves)
    if (settings.intensity.interpretation >= 7 && !perspective.interpretationHelp) {
      return [];
    }

    // God mode gets complete explanations
    if (settings.perspectiveMode === 'god') {
      return [
        'Complete causal chain visible',
        'All hidden variables revealed',
        'Future consequences predictable',
      ];
    }

    // Provide hints based on intensity level
    const hintCount = Math.max(1, 10 - settings.intensity.interpretation);
    const hints: string[] = [];

    for (let i = 0; i < hintCount && i < 3; i++) {
      hints.push(`Possible explanation ${i + 1} for "${event}"`);
    }

    return hints;
  }
}
