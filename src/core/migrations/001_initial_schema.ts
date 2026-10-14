/**
 * Migration 001: Initial Schema
 * 
 * Creates the base tables for Kaiser von Deutschland
 * 
 * @version 2.4.0
 */

import { Migration, DatabaseAdapter } from '../DatabaseAdapter';

export const migration_001_initial_schema: Migration = {
  version: 1,
  name: 'initial_schema',

  async up(db: DatabaseAdapter): Promise<void> {
    // Game State
    await db.execute(`
      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY,
        version TEXT NOT NULL,
        current_year INTEGER NOT NULL,
        game_state TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Players
    await db.execute(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_ai BOOLEAN DEFAULT 0,
        ai_model TEXT,
        gold REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Regions
    await db.execute(`
      CREATE TABLE IF NOT EXISTS regions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        population INTEGER DEFAULT 0,
        climate TEXT
      )
    `);

    // Citizens
    await db.execute(`
      CREATE TABLE IF NOT EXISTS citizens (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        profession TEXT NOT NULL,
        region_id TEXT,
        health INTEGER DEFAULT 100,
        happiness INTEGER DEFAULT 50,
        education INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (region_id) REFERENCES regions(id)
      )
    `);

    // Family Relations
    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        citizen_id TEXT NOT NULL,
        related_id TEXT NOT NULL,
        relation_type TEXT NOT NULL,
        FOREIGN KEY (citizen_id) REFERENCES citizens(id),
        FOREIGN KEY (related_id) REFERENCES citizens(id)
      )
    `);

    // Buildings
    await db.execute(`
      CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        region_id TEXT NOT NULL,
        owner_id TEXT,
        level INTEGER DEFAULT 1,
        health INTEGER DEFAULT 100,
        FOREIGN KEY (region_id) REFERENCES regions(id),
        FOREIGN KEY (owner_id) REFERENCES players(id)
      )
    `);

    // Region Resources
    await db.execute(`
      CREATE TABLE IF NOT EXISTS region_resources (
        region_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        amount REAL DEFAULT 0,
        PRIMARY KEY (region_id, resource_type),
        FOREIGN KEY (region_id) REFERENCES regions(id)
      )
    `);

    // Technologies
    await db.execute(`
      CREATE TABLE IF NOT EXISTS technologies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unlocked BOOLEAN DEFAULT 0,
        unlocked_year INTEGER
      )
    `);

    // Historical Events
    await db.execute(`
      CREATE TABLE IF NOT EXISTS historical_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        triggered BOOLEAN DEFAULT 0,
        outcome TEXT
      )
    `);

    // Diplomatic Relations
    await db.execute(`
      CREATE TABLE IF NOT EXISTS diplomatic_relations (
        player_id TEXT NOT NULL,
        other_player_id TEXT NOT NULL,
        trust INTEGER DEFAULT 50,
        relationship INTEGER DEFAULT 50,
        PRIMARY KEY (player_id, other_player_id),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (other_player_id) REFERENCES players(id)
      )
    `);

    // Treaties
    await db.execute(`
      CREATE TABLE IF NOT EXISTS treaties (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        player1_id TEXT NOT NULL,
        player2_id TEXT NOT NULL,
        start_year INTEGER NOT NULL,
        duration INTEGER,
        active BOOLEAN DEFAULT 1,
        FOREIGN KEY (player1_id) REFERENCES players(id),
        FOREIGN KEY (player2_id) REFERENCES players(id)
      )
    `);

    // Create indices for performance
    await db.execute('CREATE INDEX IF NOT EXISTS idx_citizens_region ON citizens(region_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_citizens_profession ON citizens(profession)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_citizens_age ON citizens(age)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_buildings_region ON buildings(region_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_buildings_owner ON buildings(owner_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_events_year ON historical_events(year)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_events_triggered ON historical_events(triggered)');

    console.log('✅ Initial schema created successfully');
  },

  async down(db: DatabaseAdapter): Promise<void> {
    // Drop all tables in reverse order (respecting foreign keys)
    await db.execute('DROP TABLE IF EXISTS treaties');
    await db.execute('DROP TABLE IF EXISTS diplomatic_relations');
    await db.execute('DROP TABLE IF EXISTS historical_events');
    await db.execute('DROP TABLE IF EXISTS technologies');
    await db.execute('DROP TABLE IF EXISTS region_resources');
    await db.execute('DROP TABLE IF EXISTS buildings');
    await db.execute('DROP TABLE IF EXISTS family_relations');
    await db.execute('DROP TABLE IF EXISTS citizens');
    await db.execute('DROP TABLE IF EXISTS regions');
    await db.execute('DROP TABLE IF EXISTS players');
    await db.execute('DROP TABLE IF EXISTS game_state');

    console.log('✅ Initial schema dropped successfully');
  }
};
