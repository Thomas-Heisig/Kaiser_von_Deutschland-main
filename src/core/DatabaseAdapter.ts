/**
 * Database Abstraction Layer for Kaiser von Deutschland
 * 
 * Provides a unified interface for database operations across different platforms:
 * - Browser: sql.js (SQLite in WebAssembly)
 * - Desktop: better-sqlite3 (Native SQLite)
 * - Mobile: Capacitor SQLite
 * - Cloud: PostgreSQL/MySQL
 * 
 * @version 2.4.0
 * @see docs/08-decisions/adr-0001-database-technology.md
 */

/**
 * Query parameter type
 */
export type QueryParam = string | number | boolean | null | Uint8Array;

/**
 * Query result row (generic key-value object)
 */
export type QueryResult = Record<string, any>;

/**
 * Transaction query object
 */
export interface TransactionQuery {
  sql: string;
  params?: QueryParam[];
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** Database name/path */
  name: string;
  /** Database type */
  type: 'sqlite' | 'postgres' | 'mysql';
  /** Enable WAL mode (SQLite only) */
  wal?: boolean;
  /** Enable foreign keys */
  foreignKeys?: boolean;
  /** Debug mode (log all queries) */
  debug?: boolean;
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  /** Number of tables */
  tableCount: number;
  /** Total rows across all tables */
  totalRows: number;
  /** Database size in bytes */
  sizeBytes: number;
  /** Database version */
  version: number;
}

/**
 * Main database adapter interface
 * 
 * All platform-specific implementations must implement this interface
 */
export interface DatabaseAdapter {
  /**
   * Initialize the database connection
   */
  connect(): Promise<void>;

  /**
   * Close the database connection
   */
  close(): Promise<void>;

  /**
   * Execute a SQL query and return results
   * 
   * @param sql SQL query string
   * @param params Query parameters (prevents SQL injection)
   * @returns Array of result rows
   * 
   * @example
   * const citizens = await db.query('SELECT * FROM citizens WHERE age > ?', [18]);
   */
  query<T = QueryResult>(sql: string, params?: QueryParam[]): Promise<T[]>;

  /**
   * Execute a SQL statement without returning results
   * Used for INSERT, UPDATE, DELETE, CREATE TABLE, etc.
   * 
   * @param sql SQL statement
   * @param params Statement parameters
   * @returns Number of affected rows
   * 
   * @example
   * await db.execute('INSERT INTO citizens (id, name) VALUES (?, ?)', ['123', 'Hans']);
   */
  execute(sql: string, params?: QueryParam[]): Promise<number>;

  /**
   * Execute multiple queries in a transaction
   * All queries succeed or all fail (atomicity)
   * 
   * @param queries Array of queries to execute
   * @returns Number of total affected rows
   * 
   * @example
   * await db.transaction([
   *   { sql: 'INSERT INTO citizens ...', params: [...] },
   *   { sql: 'UPDATE regions ...', params: [...] }
   * ]);
   */
  transaction(queries: TransactionQuery[]): Promise<number>;

  /**
   * Get database statistics
   */
  getStats(): Promise<DatabaseStats>;

  /**
   * Export database to binary blob (for backup/save)
   */
  export(): Promise<Uint8Array>;

  /**
   * Import database from binary blob
   */
  import(data: Uint8Array): Promise<void>;
}

/**
 * Migration interface
 */
export interface Migration {
  /** Migration version number (sequential) */
  version: number;
  /** Migration name/description */
  name: string;
  /** SQL statements to apply migration */
  up: (db: DatabaseAdapter) => Promise<void>;
  /** SQL statements to rollback migration */
  down: (db: DatabaseAdapter) => Promise<void>;
}

/**
 * Migration runner
 */
export interface MigrationRunner {
  /**
   * Get current database version
   */
  getCurrentVersion(): Promise<number>;

  /**
   * Run migrations up to target version
   * 
   * @param targetVersion Target version (if not specified, runs all)
   */
  migrate(targetVersion?: number): Promise<void>;

  /**
   * Rollback to specific version
   * 
   * @param targetVersion Version to rollback to
   */
  rollback(targetVersion: number): Promise<void>;

  /**
   * Get list of pending migrations
   */
  getPendingMigrations(): Promise<Migration[]>;
}

/**
 * Repository base interface
 * 
 * Generic CRUD operations for entities
 */
export interface Repository<T, ID = string> {
  /**
   * Find entity by ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Save entity (insert or update)
   */
  save(entity: T): Promise<void>;

  /**
   * Delete entity by ID
   */
  delete(id: ID): Promise<void>;

  /**
   * Count total entities
   */
  count(): Promise<number>;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Query builder interface (optional, for complex queries)
 */
export interface QueryBuilder<T> {
  where(condition: string, ...params: QueryParam[]): QueryBuilder<T>;
  orderBy(field: string, direction: 'ASC' | 'DESC'): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  offset(count: number): QueryBuilder<T>;
  execute(): Promise<T[]>;
  count(): Promise<number>;
}
