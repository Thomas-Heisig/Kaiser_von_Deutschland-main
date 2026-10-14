/**
 * Browser Database Adapter using sql.js
 * 
 * SQLite implementation for browsers using WebAssembly
 * 
 * @version 2.4.0
 * @see docs/08-decisions/adr-0001-database-technology.md
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import {
  DatabaseAdapter,
  DatabaseConfig,
  DatabaseStats,
  QueryParam,
  QueryResult,
  TransactionQuery,
} from './DatabaseAdapter';

/**
 * Browser implementation of DatabaseAdapter using sql.js
 * 
 * Features:
 * - Runs entirely in browser (WebAssembly)
 * - In-memory database with optional persistence
 * - Compatible with SQLite syntax
 * - Synchronous API (wrapped in async)
 */
export class BrowserDatabaseAdapter implements DatabaseAdapter {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private config: DatabaseConfig;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = {
      foreignKeys: true,
      wal: false,
      debug: false,
      ...config,
    };
  }

  /**
   * Initialize sql.js and create/load database
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      throw new Error('Database already connected');
    }

    try {
      // Initialize sql.js
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem(`db_${this.config.name}`);
      
      if (savedDb) {
        // Load from base64-encoded binary
        const binaryStr = atob(savedDb);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        this.db = new this.SQL.Database(bytes);
        
        if (this.config.debug) {
          console.log(`[DB] Loaded database "${this.config.name}" from storage`);
        }
      } else {
        // Create new database
        this.db = new this.SQL.Database();
        
        if (this.config.debug) {
          console.log(`[DB] Created new database "${this.config.name}"`);
        }
      }

      // Configure database
      if (this.config.foreignKeys) {
        this.db.run('PRAGMA foreign_keys = ON');
      }

      this.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error}`);
    }
  }

  /**
   * Close database and save to localStorage
   */
  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      // Export and save to localStorage
      const data = this.db.export();
      const base64 = btoa(
        String.fromCharCode.apply(null, Array.from(data))
      );
      localStorage.setItem(`db_${this.config.name}`, base64);
      
      this.db.close();
      this.db = null;
      this.isConnected = false;

      if (this.config.debug) {
        console.log(`[DB] Closed and saved database "${this.config.name}"`);
      }
    } catch (error) {
      console.error('Failed to close database:', error);
    }
  }

  /**
   * Execute query and return results
   */
  async query<T = QueryResult>(sql: string, params: QueryParam[] = []): Promise<T[]> {
    this.ensureConnected();

    try {
      if (this.config.debug) {
        console.log('[DB Query]', sql, params);
      }

      const stmt = this.db!.prepare(sql);
      stmt.bind(params as any); // sql.js has strict BindParams type

      const results: T[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as T;
        results.push(row);
      }
      stmt.free();

      if (this.config.debug) {
        console.log('[DB Result]', results.length, 'rows');
      }

      return results;
    } catch (error) {
      console.error('[DB Error] Query failed:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Execute statement (INSERT, UPDATE, DELETE, CREATE, etc.)
   */
  async execute(sql: string, params: QueryParam[] = []): Promise<number> {
    this.ensureConnected();

    try {
      if (this.config.debug) {
        console.log('[DB Execute]', sql, params);
      }

      this.db!.run(sql, params as any); // sql.js has strict BindParams type
      
      // Get affected rows
      const result = this.db!.exec('SELECT changes() as affected');
      const affected = result[0]?.values[0]?.[0] as number || 0;

      if (this.config.debug) {
        console.log('[DB Affected]', affected, 'rows');
      }

      // Auto-save after modifications
      await this.autoSave();

      return affected;
    } catch (error) {
      console.error('[DB Error] Execute failed:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries: TransactionQuery[]): Promise<number> {
    this.ensureConnected();

    try {
      if (this.config.debug) {
        console.log('[DB Transaction] Starting with', queries.length, 'queries');
      }

      // Begin transaction
      this.db!.run('BEGIN TRANSACTION');

      let totalAffected = 0;

      try {
        for (const query of queries) {
          this.db!.run(query.sql, query.params as any || []); // sql.js has strict BindParams type
          const result = this.db!.exec('SELECT changes() as affected');
          const affected = result[0]?.values[0]?.[0] as number || 0;
          totalAffected += affected;
        }

        // Commit transaction
        this.db!.run('COMMIT');

        if (this.config.debug) {
          console.log('[DB Transaction] Committed,', totalAffected, 'rows affected');
        }

        // Auto-save after transaction
        await this.autoSave();

        return totalAffected;
      } catch (error) {
        // Rollback on error
        this.db!.run('ROLLBACK');
        
        if (this.config.debug) {
          console.log('[DB Transaction] Rolled back due to error');
        }

        throw error;
      }
    } catch (error) {
      console.error('[DB Error] Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    this.ensureConnected();

    // Get table count
    const tables = await this.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const tableCount = tables.length;

    // Get total rows across all tables
    let totalRows = 0;
    for (const table of tables) {
      const result = await this.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table.name}`
      );
      totalRows += result[0]?.count || 0;
    }

    // Get database size (approximate)
    const data = this.db!.export();
    const sizeBytes = data.length;

    // Get schema version
    const versionResult = await this.query<{ version: number }>(
      'PRAGMA schema_version'
    );
    const version = versionResult[0]?.version || 0;

    return {
      tableCount,
      totalRows,
      sizeBytes,
      version,
    };
  }

  /**
   * Export database to binary blob
   */
  async export(): Promise<Uint8Array> {
    this.ensureConnected();
    return this.db!.export();
  }

  /**
   * Import database from binary blob
   */
  async import(data: Uint8Array): Promise<void> {
    if (!this.SQL) {
      throw new Error('SQL.js not initialized');
    }

    // Close existing database
    if (this.db) {
      this.db.close();
    }

    // Create new database from data
    this.db = new this.SQL.Database(data);

    // Configure
    if (this.config.foreignKeys) {
      this.db.run('PRAGMA foreign_keys = ON');
    }

    this.isConnected = true;

    // Save to localStorage
    await this.autoSave();
  }

  /**
   * Auto-save database to localStorage (throttled)
   */
  private autoSaveTimeout: number | null = null;
  
  private async autoSave(): Promise<void> {
    // Throttle saves to avoid too frequent writes
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = window.setTimeout(() => {
      try {
        const data = this.db!.export();
        const base64 = btoa(
          String.fromCharCode.apply(null, Array.from(data))
        );
        localStorage.setItem(`db_${this.config.name}`, base64);
        
        if (this.config.debug) {
          console.log('[DB] Auto-saved to localStorage');
        }
      } catch (error) {
        console.error('[DB] Auto-save failed:', error);
      }
    }, 100); // Save after 100ms of inactivity
  }

  /**
   * Ensure database is connected
   */
  private ensureConnected(): void {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clear(): Promise<void> {
    this.ensureConnected();

    // Get all tables
    const tables = await this.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    // Drop all tables
    for (const table of tables) {
      await this.execute(`DROP TABLE IF EXISTS ${table.name}`);
    }

    if (this.config.debug) {
      console.log('[DB] Cleared all tables');
    }
  }

  /**
   * Vacuum database (optimize storage)
   */
  async vacuum(): Promise<void> {
    this.ensureConnected();
    this.db!.run('VACUUM');
    await this.autoSave();
  }
}
