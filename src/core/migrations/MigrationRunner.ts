/**
 * Migration Runner Implementation
 * 
 * Manages database schema migrations with versioning
 * 
 * @version 2.4.0
 */

import { DatabaseAdapter, Migration, MigrationRunner } from '../DatabaseAdapter';

export class DefaultMigrationRunner implements MigrationRunner {
  private migrations: Migration[] = [];

  constructor(
    private db: DatabaseAdapter,
    migrations: Migration[] = []
  ) {
    this.migrations = migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Initialize migrations table if it doesn't exist
   */
  private async initMigrationsTable(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get current database version
   */
  async getCurrentVersion(): Promise<number> {
    await this.initMigrationsTable();

    const result = await this.db.query<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_migrations'
    );

    return result[0]?.version || 0;
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(migration: Migration): Promise<void> {
    await this.db.execute(
      'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
      [migration.version, migration.name]
    );
  }

  /**
   * Remove migration record
   */
  private async removeMigration(version: number): Promise<void> {
    await this.db.execute(
      'DELETE FROM schema_migrations WHERE version = ?',
      [version]
    );
  }

  /**
   * Run migrations up to target version
   */
  async migrate(targetVersion?: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const target = targetVersion ?? Math.max(...this.migrations.map(m => m.version));

    console.log(`📊 Current database version: ${currentVersion}`);
    console.log(`🎯 Target version: ${target}`);

    const pendingMigrations = this.migrations.filter(
      m => m.version > currentVersion && m.version <= target
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date');
      return;
    }

    console.log(`⚡ Running ${pendingMigrations.length} migrations...`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`  📦 Applying migration ${migration.version}: ${migration.name}`);
        await migration.up(this.db);
        await this.recordMigration(migration);
        console.log(`  ✅ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`  ❌ Migration ${migration.version} failed:`, error);
        throw new Error(`Migration ${migration.version} failed: ${error}`);
      }
    }

    console.log('✅ All migrations completed successfully');
  }

  /**
   * Rollback to specific version
   */
  async rollback(targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();

    if (targetVersion >= currentVersion) {
      console.log('ℹ️ Target version is not lower than current version');
      return;
    }

    console.log(`⏮️ Rolling back from version ${currentVersion} to ${targetVersion}`);

    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // Reverse order

    for (const migration of migrationsToRollback) {
      try {
        console.log(`  🔄 Rolling back migration ${migration.version}: ${migration.name}`);
        await migration.down(this.db);
        await this.removeMigration(migration.version);
        console.log(`  ✅ Rollback ${migration.version} completed`);
      } catch (error) {
        console.error(`  ❌ Rollback ${migration.version} failed:`, error);
        throw new Error(`Rollback ${migration.version} failed: ${error}`);
      }
    }

    console.log('✅ Rollback completed successfully');
  }

  /**
   * Get list of pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const currentVersion = await this.getCurrentVersion();
    return this.migrations.filter(m => m.version > currentVersion);
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations(): Promise<number[]> {
    await this.initMigrationsTable();
    
    const result = await this.db.query<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version ASC'
    );

    return result.map(r => r.version);
  }

  /**
   * Add a new migration
   */
  addMigration(migration: Migration): void {
    // Check for duplicate version
    if (this.migrations.some(m => m.version === migration.version)) {
      throw new Error(`Migration version ${migration.version} already exists`);
    }

    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }
}
