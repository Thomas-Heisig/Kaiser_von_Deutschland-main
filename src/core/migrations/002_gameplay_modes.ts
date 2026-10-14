/**
 * Migration 002: Gameplay Modes System
 * 
 * Adds tables for gameplay modes, intensity settings, and role perspectives
 * 
 * @version 2.4.0
 */

import { Migration, DatabaseAdapter } from '../DatabaseAdapter';

export const migration_002_gameplay_modes: Migration = {
  version: 2,
  name: 'gameplay_modes',

  async up(db: DatabaseAdapter): Promise<void> {
    // Gameplay Modes Definition
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gameplay_modes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_path TEXT,
        complexity_level INTEGER DEFAULT 3,
        default_info_intensity INTEGER DEFAULT 5,
        default_consequence_intensity INTEGER DEFAULT 5,
        default_time_intensity INTEGER DEFAULT 5,
        default_interpretation_intensity INTEGER DEFAULT 5,
        features_json TEXT,
        recommended_roles_json TEXT,
        singleplayer_only BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Player Settings (extends players table with gameplay preferences)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS player_settings (
        player_id TEXT PRIMARY KEY,
        mode_id TEXT NOT NULL DEFAULT 'strategy_classic',
        intensity_information INTEGER DEFAULT 5 CHECK(intensity_information >= 1 AND intensity_information <= 10),
        intensity_consequence INTEGER DEFAULT 5 CHECK(intensity_consequence >= 1 AND intensity_consequence <= 10),
        intensity_time INTEGER DEFAULT 5 CHECK(intensity_time >= 1 AND intensity_time <= 10),
        intensity_interpretation INTEGER DEFAULT 5 CHECK(intensity_interpretation >= 1 AND intensity_interpretation <= 10),
        current_role TEXT NOT NULL,
        perspective_mode TEXT DEFAULT 'normal' CHECK(perspective_mode IN ('normal', 'scientist', 'god')),
        tutorial_completed BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (mode_id) REFERENCES gameplay_modes(id)
      )
    `);

    // Role Perspectives (defines what each role can see/do)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS role_perspectives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_type TEXT NOT NULL UNIQUE,
        visible_data_json TEXT NOT NULL,
        data_accuracy REAL DEFAULT 1.0 CHECK(data_accuracy >= 0 AND data_accuracy <= 1.0),
        data_delay_days INTEGER DEFAULT 0,
        interpretation_help BOOLEAN DEFAULT 0,
        control_scope TEXT DEFAULT 'local',
        information_sources_json TEXT,
        limitations_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Intensity Presets (predefined configurations)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS intensity_presets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        info_intensity INTEGER DEFAULT 5,
        consequence_intensity INTEGER DEFAULT 5,
        time_intensity INTEGER DEFAULT 5,
        interpretation_intensity INTEGER DEFAULT 5,
        is_default BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default gameplay modes
    await db.execute(`
      INSERT INTO gameplay_modes (id, name, description, complexity_level, default_info_intensity, default_consequence_intensity, default_time_intensity, default_interpretation_intensity, singleplayer_only) VALUES
        ('tables_classic', 'Tabellen-Klassiker', 'Klassische Kaiser-Erfahrung mit Menüs und Tabellen', 1, 2, 2, 3, 2, 0),
        ('trade_adventure', 'Handels-Abenteuer', 'Fokus auf Handel und Karriere als Kaufmann', 2, 4, 4, 4, 4, 0),
        ('production_master', 'Aufbau-Meister', 'Komplexe Produktionsketten und Logistik', 3, 5, 5, 5, 4, 0),
        ('management_sim', 'Konzern-Chef', 'Unternehmensführung mit KI-Konkurrenz', 4, 6, 6, 5, 5, 0),
        ('strategy_classic', 'Strategie-Klassiker', 'Vollständige makroökonomische Simulation', 5, 5, 5, 5, 5, 0),
        ('multiplayer_world', 'Multiplayer-Welt', 'Emergente Wirtschaft mit echten Spielern', 6, 7, 8, 6, 7, 0)
    `);

    // Insert default intensity presets
    await db.execute(`
      INSERT INTO intensity_presets (id, name, description, info_intensity, consequence_intensity, time_intensity, interpretation_intensity, is_default) VALUES
        ('casual', 'Casual', 'Entspannt und zugänglich', 3, 3, 4, 3, 0),
        ('balanced', 'Balanced', 'Ausgewogene Herausforderung', 5, 5, 5, 5, 1),
        ('realistic', 'Realistisch', 'Anspruchsvolle Simulation', 8, 9, 8, 8, 0),
        ('historian', 'Historiker', 'Maximaler Realismus', 10, 10, 10, 10, 0),
        ('learning', 'Lern-Profil', 'Optimiert für Bildung', 7, 4, 6, 8, 0)
    `);

    // Insert default role perspectives (5 main types)
    await db.execute(`
      INSERT INTO role_perspectives (role_type, visible_data_json, data_accuracy, data_delay_days, interpretation_help, control_scope, information_sources_json, limitations_json) VALUES
        ('HOUSEHOLD', '["ownIncome", "localPrices", "localAvailability", "ownResources"]', 0.95, 0, 0, 'personal', '["personalExperience", "localMarket", "rumors"]', '["noMacroView", "noControl"]'),
        ('CRAFTSMAN', '["ownIncome", "materialCosts", "customerDemand", "localCompetition", "localPrices"]', 0.90, 1, 0, 'local', '["suppliers", "customers", "guild"]', '["limitedMarketView", "noMacroControl"]'),
        ('MINISTER', '["macroStats", "budgets", "policies", "lobbyGroups", "reports"]', 0.70, 7, 1, 'national', '["statistics", "reports", "advisors"]', '["delayedData", "filteredReports", "indirectControl"]'),
        ('SCIENTIST', '["allStats", "historicalData", "correlations", "models"]', 0.80, 14, 0, 'analytical', '["data", "research", "publications"]', '["noDirectControl", "uncertainCausality"]'),
        ('GOD', '["*"]', 1.00, 0, 1, 'complete', '["omniscient"]', '[]')
    `);

    // Create indices
    await db.execute('CREATE INDEX IF NOT EXISTS idx_player_settings_mode ON player_settings(mode_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_player_settings_role ON player_settings(current_role)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_role_perspectives_type ON role_perspectives(role_type)');

    console.log('✅ Gameplay modes schema created successfully');
  },

  async down(db: DatabaseAdapter): Promise<void> {
    // Drop all tables in reverse order
    await db.execute('DROP TABLE IF EXISTS intensity_presets');
    await db.execute('DROP TABLE IF EXISTS role_perspectives');
    await db.execute('DROP TABLE IF EXISTS player_settings');
    await db.execute('DROP TABLE IF EXISTS gameplay_modes');

    console.log('✅ Gameplay modes schema dropped successfully');
  }
};
