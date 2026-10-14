// src/core/database/DatabaseAdapter.ts

/**
 * Database Adapter Interface
 * Abstraction layer for different database implementations (sql.js, better-sqlite3, etc.)
 */

export interface QueryResult {
  columns: string[];
  values: any[][];
}

export interface DatabaseAdapter {
  /**
   * Initialize the database connection
   */
  init(): Promise<void>;

  /**
   * Execute a SQL query that returns data (SELECT)
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Execute a SQL statement that modifies data (INSERT, UPDATE, DELETE)
   * Returns the number of rows affected
   */
  execute(sql: string, params?: any[]): Promise<number>;

  /**
   * Execute a SQL statement and return the last inserted row ID
   */
  insert(sql: string, params?: any[]): Promise<number>;

  /**
   * Execute multiple SQL statements in a transaction
   */
  transaction(callback: () => Promise<void>): Promise<void>;

  /**
   * Close the database connection
   */
  close(): Promise<void>;

  /**
   * Export the database to a binary array (for saving to file/localStorage)
   */
  export(): Promise<Uint8Array>;

  /**
   * Import a database from a binary array
   */
  import(data: Uint8Array): Promise<void>;

  /**
   * Get the current database version
   */
  getVersion(): Promise<number>;

  /**
   * Set the database version (for migrations)
   */
  setVersion(version: number): Promise<void>;
}

/**
 * Base error for database operations
 */
export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Error for migration-related issues
 */
export class MigrationError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'MigrationError';
  }
}

/**
 * Error for transaction failures
 */
export class TransactionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'TransactionError';
  }
}
