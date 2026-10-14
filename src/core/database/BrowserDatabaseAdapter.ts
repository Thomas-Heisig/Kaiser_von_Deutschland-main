// src/core/database/BrowserDatabaseAdapter.ts

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { DatabaseAdapter, DatabaseError, TransactionError } from './DatabaseAdapter';

/**
 * Browser-based SQLite implementation using sql.js (WebAssembly)
 * Runs entirely in the browser with no server dependencies
 */
export class BrowserDatabaseAdapter implements DatabaseAdapter {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize sql.js
      // In test/Node.js environment, load from node_modules
      // In browser, load from CDN
      const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
      
      this.SQL = await initSqlJs(
        isNode
          ? {
              // In Node.js/test environment, load from node_modules
              locateFile: (file: string) => {
                // Dynamically import path only in Node environment
                const path = require('path');
                return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
              }
            }
          : {
              // In browser, load from CDN
              locateFile: (file: string) => `https://sql.js.org/dist/${file}`
            }
      );

      // Create a new database
      this.db = new this.SQL.Database();

      // Create version table for migrations
      this.db.run(`
        CREATE TABLE IF NOT EXISTS _db_version (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert initial version if not exists
      const versionCheck = this.db.exec('SELECT version FROM _db_version ORDER BY version DESC LIMIT 1');
      if (!versionCheck || versionCheck.length === 0) {
        this.db.run('INSERT INTO _db_version (version) VALUES (0)');
      }

      this.initialized = true;
    } catch (error) {
      throw new DatabaseError('Failed to initialize database', error as Error);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    this.ensureInitialized();

    try {
      const results = this.db!.exec(sql, params);
      
      if (results.length === 0) {
        return [];
      }

      const result = results[0];
      const columns = result.columns;
      const values = result.values;

      // Convert rows to objects
      return values.map(row => {
        const obj: any = {};
        columns.forEach((col, index) => {
          obj[col] = row[index];
        });
        return obj as T;
      });
    } catch (error) {
      throw new DatabaseError(`Query failed: ${sql}`, error as Error);
    }
  }

  async execute(sql: string, params: any[] = []): Promise<number> {
    this.ensureInitialized();

    try {
      this.db!.run(sql, params);
      
      // Get number of changed rows
      const changesResult = this.db!.exec('SELECT changes() as count');
      if (changesResult.length > 0 && changesResult[0].values.length > 0) {
        return changesResult[0].values[0][0] as number;
      }
      return 0;
    } catch (error) {
      throw new DatabaseError(`Execute failed: ${sql}`, error as Error);
    }
  }

  async insert(sql: string, params: any[] = []): Promise<number> {
    this.ensureInitialized();

    try {
      this.db!.run(sql, params);
      
      // Get last inserted row ID
      const idResult = this.db!.exec('SELECT last_insert_rowid() as id');
      if (idResult.length > 0 && idResult[0].values.length > 0) {
        return idResult[0].values[0][0] as number;
      }
      return 0;
    } catch (error) {
      throw new DatabaseError(`Insert failed: ${sql}`, error as Error);
    }
  }

  async transaction(callback: () => Promise<void>): Promise<void> {
    this.ensureInitialized();

    try {
      this.db!.run('BEGIN TRANSACTION');
      
      try {
        await callback();
        this.db!.run('COMMIT');
      } catch (error) {
        this.db!.run('ROLLBACK');
        throw new TransactionError('Transaction failed and was rolled back', error as Error);
      }
    } catch (error) {
      throw new TransactionError('Failed to start transaction', error as Error);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
  }

  async export(): Promise<Uint8Array> {
    this.ensureInitialized();
    
    try {
      return this.db!.export();
    } catch (error) {
      throw new DatabaseError('Failed to export database', error as Error);
    }
  }

  async import(data: Uint8Array): Promise<void> {
    if (!this.SQL) {
      throw new DatabaseError('SQL.js not initialized');
    }

    try {
      // Close existing database if any
      if (this.db) {
        this.db.close();
      }

      // Import new database
      this.db = new this.SQL.Database(data);
      this.initialized = true;
    } catch (error) {
      throw new DatabaseError('Failed to import database', error as Error);
    }
  }

  async getVersion(): Promise<number> {
    this.ensureInitialized();
    
    try {
      const result = await this.query<{ version: number }>(
        'SELECT version FROM _db_version ORDER BY version DESC LIMIT 1'
      );
      
      return result.length > 0 ? result[0].version : 0;
    } catch (error) {
      throw new DatabaseError('Failed to get database version', error as Error);
    }
  }

  async setVersion(version: number): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.execute(
        'INSERT INTO _db_version (version) VALUES (?)',
        [version]
      );
    } catch (error) {
      throw new DatabaseError('Failed to set database version', error as Error);
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new DatabaseError('Database not initialized. Call init() first.');
    }
  }
}
