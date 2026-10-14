// src/core/database/Migration.ts

import { DatabaseAdapter } from './DatabaseAdapter';

/**
 * Interface for database migrations
 */
export interface Migration {
  /**
   * Migration version number (must be unique and incremental)
   */
  readonly version: number;

  /**
   * Description of what this migration does
   */
  readonly description: string;

  /**
   * Execute the migration (apply changes to database)
   */
  up(db: DatabaseAdapter): Promise<void>;

  /**
   * Rollback the migration (revert changes)
   */
  down(db: DatabaseAdapter): Promise<void>;
}

/**
 * Base class for migrations with common utilities
 */
export abstract class BaseMigration implements Migration {
  abstract readonly version: number;
  abstract readonly description: string;

  abstract up(db: DatabaseAdapter): Promise<void>;
  abstract down(db: DatabaseAdapter): Promise<void>;

  /**
   * Helper to create a table if it doesn't exist
   */
  protected async createTable(db: DatabaseAdapter, sql: string): Promise<void> {
    await db.execute(sql);
  }

  /**
   * Helper to drop a table if it exists
   */
  protected async dropTable(db: DatabaseAdapter, tableName: string): Promise<void> {
    await db.execute(`DROP TABLE IF EXISTS ${tableName}`);
  }

  /**
   * Helper to add a column to an existing table
   */
  protected async addColumn(
    db: DatabaseAdapter,
    tableName: string,
    columnName: string,
    columnDef: string
  ): Promise<void> {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
  }

  /**
   * Helper to create an index
   */
  protected async createIndex(
    db: DatabaseAdapter,
    indexName: string,
    tableName: string,
    columns: string[]
  ): Promise<void> {
    await db.execute(
      `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columns.join(', ')})`
    );
  }

  /**
   * Helper to drop an index
   */
  protected async dropIndex(db: DatabaseAdapter, indexName: string): Promise<void> {
    await db.execute(`DROP INDEX IF EXISTS ${indexName}`);
  }
}
