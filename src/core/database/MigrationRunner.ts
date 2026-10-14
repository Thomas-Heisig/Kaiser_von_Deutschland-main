// src/core/database/MigrationRunner.ts

import { DatabaseAdapter } from './DatabaseAdapter';
import { Migration } from './Migration';
import { MigrationError } from './DatabaseAdapter';

/**
 * Manages and executes database migrations
 */
export class MigrationRunner {
  private migrations: Migration[] = [];

  constructor(private db: DatabaseAdapter) {}

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    // Check for duplicate versions
    if (this.migrations.some(m => m.version === migration.version)) {
      throw new MigrationError(
        `Migration version ${migration.version} is already registered`
      );
    }

    this.migrations.push(migration);
    
    // Sort by version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Register multiple migrations
   */
  registerAll(migrations: Migration[]): void {
    migrations.forEach(migration => this.register(migration));
  }

  /**
   * Run all pending migrations (migrations not yet applied)
   */
  async runPending(): Promise<number> {
    const currentVersion = await this.db.getVersion();
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return 0;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }

    return pendingMigrations.length;
  }

  /**
   * Run a specific migration
   */
  async runMigration(migration: Migration): Promise<void> {
    console.log(`Running migration ${migration.version}: ${migration.description}`);

    try {
      await this.db.transaction(async () => {
        await migration.up(this.db);
        await this.db.setVersion(migration.version);
      });

      console.log(`Migration ${migration.version} completed successfully`);
    } catch (error) {
      throw new MigrationError(
        `Migration ${migration.version} failed: ${migration.description}`,
        error as Error
      );
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackTo(targetVersion: number): Promise<number> {
    const currentVersion = await this.db.getVersion();
    
    if (targetVersion >= currentVersion) {
      console.log('No rollback needed');
      return 0;
    }

    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse(); // Rollback in reverse order

    console.log(`Rolling back ${migrationsToRollback.length} migrations...`);

    for (const migration of migrationsToRollback) {
      await this.rollbackMigration(migration);
    }

    return migrationsToRollback.length;
  }

  /**
   * Rollback a specific migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    console.log(`Rolling back migration ${migration.version}: ${migration.description}`);

    try {
      await this.db.transaction(async () => {
        await migration.down(this.db);
        
        // Set version to previous version
        const previousVersion = migration.version - 1;
        await this.db.execute('DELETE FROM _db_version WHERE version = ?', [migration.version]);
        
        if (previousVersion >= 0) {
          // Ensure previous version is in the table
          const versionExists = await this.db.query(
            'SELECT 1 FROM _db_version WHERE version = ?',
            [previousVersion]
          );
          
          if (versionExists.length === 0) {
            await this.db.execute('INSERT INTO _db_version (version) VALUES (?)', [previousVersion]);
          }
        }
      });

      console.log(`Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      throw new MigrationError(
        `Rollback of migration ${migration.version} failed: ${migration.description}`,
        error as Error
      );
    }
  }

  /**
   * Get current database version
   */
  async getCurrentVersion(): Promise<number> {
    return await this.db.getVersion();
  }

  /**
   * Get list of all migrations (applied and pending)
   */
  async getMigrationStatus(): Promise<{ migration: Migration; applied: boolean }[]> {
    const currentVersion = await this.db.getVersion();
    
    return this.migrations.map(migration => ({
      migration,
      applied: migration.version <= currentVersion
    }));
  }
}
