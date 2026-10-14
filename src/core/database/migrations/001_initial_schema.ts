// src/core/database/migrations/001_initial_schema.ts

import { BaseMigration } from '../Migration';
import { DatabaseAdapter } from '../DatabaseAdapter';

/**
 * Initial database schema
 * Creates core tables for the game
 */
export class Migration001InitialSchema extends BaseMigration {
  readonly version = 1;
  readonly description = 'Initial database schema with core tables';

  async up(db: DatabaseAdapter): Promise<void> {
    // Players table
    await this.createTable(db, `
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role_id TEXT NOT NULL,
        kingdom_name TEXT,
        color TEXT,
        treasury REAL NOT NULL DEFAULT 1000,
        prestige INTEGER NOT NULL DEFAULT 0,
        current_year INTEGER NOT NULL,
        current_month INTEGER NOT NULL DEFAULT 1,
        is_ai BOOLEAN NOT NULL DEFAULT 0,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Citizens table
    await this.createTable(db, `
      CREATE TABLE IF NOT EXISTS citizens (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        profession TEXT NOT NULL,
        health REAL NOT NULL DEFAULT 100,
        happiness REAL NOT NULL DEFAULT 50,
        birth_year INTEGER NOT NULL,
        death_year INTEGER,
        is_alive BOOLEAN NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    // Buildings table
    await this.createTable(db, `
      CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        type TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        construction_year INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    // Technologies table
    await this.createTable(db, `
      CREATE TABLE IF NOT EXISTS technologies (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        tech_id TEXT NOT NULL,
        unlocked_year INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE(player_id, tech_id)
      )
    `);

    // Policies table
    await this.createTable(db, `
      CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        policy_id TEXT NOT NULL,
        enacted_year INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    // Game events table
    await this.createTable(db, `
      CREATE TABLE IF NOT EXISTS game_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL DEFAULT 1,
        description TEXT NOT NULL,
        data TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await this.createIndex(db, 'idx_citizens_player', 'citizens', ['player_id']);
    await this.createIndex(db, 'idx_citizens_alive', 'citizens', ['is_alive']);
    await this.createIndex(db, 'idx_buildings_player', 'buildings', ['player_id']);
    await this.createIndex(db, 'idx_technologies_player', 'technologies', ['player_id']);
    await this.createIndex(db, 'idx_policies_player', 'policies', ['player_id']);
    await this.createIndex(db, 'idx_events_year', 'game_events', ['year', 'month']);
  }

  async down(db: DatabaseAdapter): Promise<void> {
    // Drop indexes
    await this.dropIndex(db, 'idx_events_year');
    await this.dropIndex(db, 'idx_policies_player');
    await this.dropIndex(db, 'idx_technologies_player');
    await this.dropIndex(db, 'idx_buildings_player');
    await this.dropIndex(db, 'idx_citizens_alive');
    await this.dropIndex(db, 'idx_citizens_player');

    // Drop tables in reverse order (respecting foreign keys)
    await this.dropTable(db, 'game_events');
    await this.dropTable(db, 'policies');
    await this.dropTable(db, 'technologies');
    await this.dropTable(db, 'buildings');
    await this.dropTable(db, 'citizens');
    await this.dropTable(db, 'players');
  }
}
