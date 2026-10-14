# Database System Usage Guide

## Overview

The Kaiser von Deutschland database system provides a structured, scalable persistence layer using SQLite. This guide explains how to use the database system in the game.

## Architecture

### Components

1. **DatabaseAdapter**: Abstract interface for database operations
2. **BrowserDatabaseAdapter**: SQLite implementation using sql.js (WebAssembly)
3. **MigrationRunner**: Manages database schema versioning
4. **Repositories**: Data access layer following Repository Pattern

### File Structure

```
src/core/database/
├── DatabaseAdapter.ts           # Interface definition
├── BrowserDatabaseAdapter.ts    # Browser implementation (sql.js)
├── Migration.ts                 # Migration base class
├── MigrationRunner.ts          # Migration execution engine
├── migrations/
│   └── 001_initial_schema.ts   # Initial database schema
├── repositories/
│   └── PlayerRepository.ts     # Player data access
├── database.test.ts            # Comprehensive tests
├── example-usage.ts            # Usage examples
└── index.ts                    # Public API exports
```

## Getting Started

### 1. Initialize Database

```typescript
import { BrowserDatabaseAdapter, MigrationRunner, Migration001InitialSchema } from './core/database';

// Create and initialize database
const db = new BrowserDatabaseAdapter();
await db.init();

// Run migrations
const migrationRunner = new MigrationRunner(db);
migrationRunner.register(new Migration001InitialSchema());
await migrationRunner.runPending();
```

### 2. Use Repositories

```typescript
import { PlayerRepository } from './core/database';

const playerRepo = new PlayerRepository(db);

// Save a player
await playerRepo.save(player);

// Load all players
const players = await playerRepo.findAll();

// Find specific player
const player = await playerRepo.findById('player-id');

// Delete a player
await playerRepo.delete('player-id');
```

### 3. Save/Load Game

```typescript
// Export database for saving
const dbData = await db.export(); // Returns Uint8Array
localStorage.setItem('game-save', JSON.stringify(Array.from(dbData)));

// Import database for loading
const savedData = localStorage.getItem('game-save');
const dataArray = new Uint8Array(JSON.parse(savedData));
await db.import(dataArray);
```

## Database Operations

### Query Data

```typescript
// Simple query
const results = await db.query<PlayerRow>(
  'SELECT * FROM players WHERE is_ai = ?',
  [0]
);

// Complex query with joins
const results = await db.query(
  `SELECT p.name, COUNT(c.id) as citizen_count
   FROM players p
   LEFT JOIN citizens c ON c.player_id = p.id
   GROUP BY p.id`
);
```

### Execute Statements

```typescript
// Insert/Update/Delete
const rowsAffected = await db.execute(
  'UPDATE players SET prestige = prestige + ? WHERE id = ?',
  [10, playerId]
);

// Get last inserted ID
const newId = await db.insert(
  'INSERT INTO buildings (player_id, type) VALUES (?, ?)',
  [playerId, 'farm']
);
```

### Transactions

```typescript
await db.transaction(async () => {
  // All operations in this block are atomic
  await db.execute('UPDATE players SET treasury = treasury - 1000 WHERE id = ?', [playerId]);
  await db.execute('INSERT INTO buildings (player_id, type) VALUES (?, ?)', [playerId, 'castle']);
  
  // If any operation fails, entire transaction is rolled back
});
```

## Creating Migrations

### Migration Structure

```typescript
import { BaseMigration } from '../Migration';
import { DatabaseAdapter } from '../DatabaseAdapter';

export class Migration002AddFamilies extends BaseMigration {
  readonly version = 2;
  readonly description = 'Add family relationships table';

  async up(db: DatabaseAdapter): Promise<void> {
    await this.createTable(db, `
      CREATE TABLE families (
        id TEXT PRIMARY KEY,
        citizen_id TEXT NOT NULL,
        parent_id TEXT,
        spouse_id TEXT,
        FOREIGN KEY (citizen_id) REFERENCES citizens(id),
        FOREIGN KEY (parent_id) REFERENCES citizens(id),
        FOREIGN KEY (spouse_id) REFERENCES citizens(id)
      )
    `);

    await this.createIndex(db, 'idx_families_citizen', 'families', ['citizen_id']);
  }

  async down(db: DatabaseAdapter): Promise<void> {
    await this.dropTable(db, 'families');
  }
}
```

### Registering Migrations

```typescript
const migrationRunner = new MigrationRunner(db);
migrationRunner.registerAll([
  new Migration001InitialSchema(),
  new Migration002AddFamilies(),
  new Migration003AddDiplomacy()
]);

await migrationRunner.runPending();
```

## Creating Repositories

### Basic Repository Pattern

```typescript
export class CitizenRepository {
  constructor(private db: DatabaseAdapter) {}

  async save(citizen: Citizen): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO citizens (
        id, player_id, name, age, profession, health, happiness
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.execute(sql, [
      citizen.id,
      citizen.playerId,
      citizen.name,
      citizen.age,
      citizen.profession,
      citizen.health,
      citizen.happiness
    ]);
  }

  async findByPlayer(playerId: string): Promise<Citizen[]> {
    const results = await this.db.query<CitizenRow>(
      'SELECT * FROM citizens WHERE player_id = ? AND is_alive = 1',
      [playerId]
    );
    
    return results.map(row => this.deserialize(row));
  }

  private deserialize(row: CitizenRow): Citizen {
    // Convert database row to Citizen object
    return new Citizen(row);
  }
}
```

## Performance Optimization

### Indexing

```typescript
// Add indexes for frequently queried columns
await db.execute(`
  CREATE INDEX idx_citizens_profession 
  ON citizens(profession)
`);

await db.execute(`
  CREATE INDEX idx_citizens_player_alive 
  ON citizens(player_id, is_alive)
`);
```

### Batch Operations

```typescript
// Instead of individual inserts
await db.transaction(async () => {
  for (const citizen of citizens) {
    await citizenRepo.save(citizen);
  }
});
```

### Pagination

```typescript
async findPaginated(page: number, perPage: number): Promise<Player[]> {
  const offset = (page - 1) * perPage;
  const results = await this.db.query(
    'SELECT * FROM players LIMIT ? OFFSET ?',
    [perPage, offset]
  );
  return results.map(r => this.deserialize(r));
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserDatabaseAdapter } from './BrowserDatabaseAdapter';

describe('DatabaseAdapter', () => {
  let db: BrowserDatabaseAdapter;

  beforeEach(async () => {
    db = new BrowserDatabaseAdapter();
    await db.init();
  });

  it('should save and load data', async () => {
    await db.execute('CREATE TABLE test (value INTEGER)');
    await db.execute('INSERT INTO test (value) VALUES (42)');
    
    const results = await db.query('SELECT * FROM test');
    expect(results[0].value).toBe(42);
  });
});
```

## Migration from LocalForage

### Step 1: Export Existing Data

```typescript
// In GameEngine.ts
async exportToSQLite(db: DatabaseAdapter): Promise<void> {
  // Load from LocalForage
  const saveData = await localforage.getItem('kaiser-ii-save-default');
  
  // Save to SQLite
  const playerRepo = new PlayerRepository(db);
  for (const playerData of saveData.players) {
    const player = Player.deserialize(playerData);
    await playerRepo.save(player);
  }
}
```

### Step 2: Switch Save/Load

```typescript
public async saveGame(slot: string = 'default'): Promise<void> {
  // Export database
  const dbData = await this.db.export();
  
  // Save to localStorage (or file system in Electron)
  const dataArray = Array.from(dbData);
  await localforage.setItem(`kaiser-db-${slot}`, dataArray);
}

public async loadGame(slot: string = 'default'): Promise<void> {
  const dataArray = await localforage.getItem<number[]>(`kaiser-db-${slot}`);
  const uint8Array = new Uint8Array(dataArray);
  
  await this.db.import(uint8Array);
}
```

## Best Practices

### 1. Always Use Transactions for Multi-Step Operations

```typescript
// ✅ Good
await db.transaction(async () => {
  await db.execute('DELETE FROM old_table');
  await db.execute('INSERT INTO new_table SELECT * FROM temp');
});

// ❌ Bad
await db.execute('DELETE FROM old_table');
await db.execute('INSERT INTO new_table SELECT * FROM temp');
```

### 2. Use Prepared Statements (Parameterized Queries)

```typescript
// ✅ Good - prevents SQL injection
await db.query('SELECT * FROM players WHERE name = ?', [userName]);

// ❌ Bad - SQL injection risk
await db.query(`SELECT * FROM players WHERE name = '${userName}'`);
```

### 3. Handle Errors Gracefully

```typescript
try {
  await playerRepo.save(player);
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('Database error:', error.message);
    // Handle appropriately
  }
  throw error;
}
```

### 4. Close Database When Done

```typescript
// Always close database to free resources
await db.close();
```

## Troubleshooting

### Database Not Initialized Error

**Error**: `Database not initialized. Call init() first.`

**Solution**: Ensure you call `await db.init()` before any operations.

### Migration Errors

**Error**: `Migration X failed`

**Solution**: Check migration logs, ensure schema changes are valid, rollback if needed:

```typescript
await migrationRunner.rollbackTo(previousVersion);
```

### Performance Issues

**Symptoms**: Slow queries with large datasets

**Solutions**:
1. Add appropriate indexes
2. Use LIMIT/OFFSET for pagination
3. Optimize queries (use EXPLAIN QUERY PLAN)
4. Consider data aggregation for very large tables

## Future Enhancements

1. **Cloud Sync**: PostgreSQL adapter for multiplayer server
2. **Desktop**: better-sqlite3 adapter for Electron
3. **Mobile**: Capacitor SQLite plugin
4. **Query Builder**: Type-safe query construction
5. **ORM Layer**: Object-relational mapping for easier development

## References

- [sql.js Documentation](https://sql.js.org/)
- [SQLite SQL Syntax](https://www.sqlite.org/lang.html)
- [ADR-0001: Database Technology Selection](../08-decisions/adr-0001-database-technology.md)
- [Persistence Architecture](../05-technical-architecture/persistence.md)
