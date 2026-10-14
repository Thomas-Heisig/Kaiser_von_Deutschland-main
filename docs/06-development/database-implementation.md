# Database Implementation Guide

## Overview

This guide describes the database implementation for Kaiser von Deutschland v2.4.0.

## Architecture

### Database Adapter Pattern

The system uses the **Adapter Pattern** to support multiple database backends:

```
DatabaseAdapter (Interface)
    ├── BrowserDatabaseAdapter (sql.js) - Planned
    ├── DesktopDatabaseAdapter (better-sqlite3) - Future
    └── CloudDatabaseAdapter (PostgreSQL) - Future
```

### Core Components

1. **DatabaseAdapter.ts** - Main interface definition
2. **MigrationRunner.ts** - Schema version management
3. **migrations/** - All schema migrations
4. **repositories/** - Data access layer (planned)

## Current Status (v2.4.0)

### ✅ Completed

- [x] DatabaseAdapter interface defined
- [x] Migration interface and runner implemented
- [x] Initial schema migration (001_initial_schema.ts)
- [x] Core types and interfaces
- [x] ADR-0001 (Database Technology Decision)
- [x] Persistence architecture documentation

### 🚧 In Progress

- [ ] sql.js browser implementation
- [ ] Repository implementations
- [ ] Data migration from LocalForage
- [ ] Integration with GameEngine

### 📋 Planned

- [ ] Performance testing
- [ ] Cloud sync implementation
- [ ] Mobile support (Capacitor)
- [ ] Desktop support (Electron + better-sqlite3)

## Schema

### Tables

The initial schema includes:

#### Core Tables
- `game_state` - Current game state metadata
- `players` - Player accounts
- `regions` - Geographic regions

#### Population & Society
- `citizens` - Individual citizen records
- `family_relations` - Family trees and relationships

#### Economy & Buildings
- `buildings` - Constructed buildings
- `region_resources` - Resources per region

#### Technology & History
- `technologies` - Unlocked technologies
- `historical_events` - Event history

#### Diplomacy (Multiplayer)
- `diplomatic_relations` - Player relationships
- `treaties` - Diplomatic agreements

See [persistence.md](../../docs/05-technical-architecture/persistence.md) for detailed schema.

## Migration System

### How Migrations Work

1. Each migration has a **version number** (sequential)
2. Migrations are stored in `src/core/migrations/`
3. MigrationRunner tracks applied migrations in `schema_migrations` table
4. Migrations can be applied (`up`) or rolled back (`down`)

### Creating a New Migration

```typescript
// src/core/migrations/002_add_social_networks.ts
import { Migration, DatabaseAdapter } from '../DatabaseAdapter';

export const migration_002_social_networks: Migration = {
  version: 2,
  name: 'add_social_networks',

  async up(db: DatabaseAdapter): Promise<void> {
    await db.execute(`
      CREATE TABLE social_connections (
        citizen1_id TEXT NOT NULL,
        citizen2_id TEXT NOT NULL,
        connection_type TEXT NOT NULL,
        strength INTEGER DEFAULT 50,
        PRIMARY KEY (citizen1_id, citizen2_id),
        FOREIGN KEY (citizen1_id) REFERENCES citizens(id),
        FOREIGN KEY (citizen2_id) REFERENCES citizens(id)
      )
    `);
  },

  async down(db: DatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS social_connections');
  }
};
```

Then register it in `migrations/index.ts`:

```typescript
import { migration_002_social_networks } from './002_add_social_networks';

export const allMigrations: Migration[] = [
  migration_001_initial_schema,
  migration_002_social_networks, // Add here
];
```

### Running Migrations

```typescript
import { DefaultMigrationRunner } from './migrations/MigrationRunner';
import { allMigrations } from './migrations';

// Initialize
const runner = new DefaultMigrationRunner(db, allMigrations);

// Run all pending migrations
await runner.migrate();

// Run to specific version
await runner.migrate(5);

// Check status
const current = await runner.getCurrentVersion();
const pending = await runner.getPendingMigrations();
```

### Rolling Back

```typescript
// Rollback to version 3
await runner.rollback(3);
```

## Repository Pattern

### Planned Implementation

Each entity type will have a repository for data access:

```typescript
interface CitizenRepository extends Repository<Citizen, string> {
  findByRegion(regionId: string): Promise<Citizen[]>;
  findByProfession(profession: string): Promise<Citizen[]>;
  findByAge(minAge: number, maxAge: number): Promise<Citizen[]>;
}

class SQLCitizenRepository implements CitizenRepository {
  constructor(private db: DatabaseAdapter) {}

  async findById(id: string): Promise<Citizen | null> {
    const rows = await this.db.query<CitizenRow>(
      'SELECT * FROM citizens WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapToCitizen(rows[0]) : null;
  }

  // ... more methods
}
```

### Repositories to Implement

- CitizenRepository
- PlayerRepository
- BuildingRepository
- RegionRepository
- TechnologyRepository
- EventRepository
- DiplomacyRepository
- TreatyRepository

## Integration with GameEngine

### Current System (LocalForage)

```typescript
public async saveGame(slot: string = 'default'): Promise<void> {
  const saveData = this.serializeGameState();
  await localforage.setItem(`save_${slot}`, saveData);
}
```

### Future System (Database)

```typescript
public async saveGame(slot: string = 'default'): Promise<void> {
  await this.db.transaction([
    // Save game state
    { sql: 'INSERT OR REPLACE INTO game_state ...', params: [...] },
    // Save all players
    ...this.players.map(p => ({
      sql: 'INSERT OR REPLACE INTO players ...', 
      params: [...]
    })),
    // Save all citizens (batch)
    ...this.citizens.map(c => ({
      sql: 'INSERT OR REPLACE INTO citizens ...',
      params: [...]
    }))
  ]);
}
```

## Performance Considerations

### Batch Operations

Always use transactions for bulk operations:

```typescript
// ❌ Bad: Multiple individual queries
for (const citizen of citizens) {
  await db.execute('INSERT INTO citizens ...', [citizen.id, ...]);
}

// ✅ Good: Single transaction
await db.transaction(
  citizens.map(c => ({
    sql: 'INSERT INTO citizens ...',
    params: [c.id, ...]
  }))
);
```

### Indices

Critical indices are created in migration 001:
- `idx_citizens_region` - Fast region lookups
- `idx_citizens_profession` - Fast profession queries
- `idx_citizens_age` - Age-based queries
- `idx_buildings_region` - Buildings by region
- `idx_events_year` - Events by year

### Pagination

For large result sets, use pagination:

```typescript
const limit = 100;
const offset = page * limit;

const citizens = await db.query(
  'SELECT * FROM citizens LIMIT ? OFFSET ?',
  [limit, offset]
);
```

## Testing

### Unit Tests (Planned)

```typescript
describe('MigrationRunner', () => {
  it('should run migrations in order', async () => {
    const runner = new DefaultMigrationRunner(db, allMigrations);
    await runner.migrate();
    
    const version = await runner.getCurrentVersion();
    expect(version).toBe(1);
  });

  it('should rollback migrations', async () => {
    await runner.migrate(5);
    await runner.rollback(3);
    
    const version = await runner.getCurrentVersion();
    expect(version).toBe(3);
  });
});
```

## Security

### SQL Injection Prevention

**Always use parameterized queries**:

```typescript
// ❌ NEVER do this (SQL injection!)
const name = userInput;
await db.query(`SELECT * FROM citizens WHERE name = '${name}'`);

// ✅ Always use parameters
await db.query('SELECT * FROM citizens WHERE name = ?', [name]);
```

### Foreign Keys

Foreign keys are enforced to maintain data integrity:

```sql
FOREIGN KEY (region_id) REFERENCES regions(id)
```

## Troubleshooting

### Migration Failures

If a migration fails:

1. Check the error message
2. Fix the migration SQL
3. Manually rollback if needed: `DELETE FROM schema_migrations WHERE version = X`
4. Re-run migration

### Database Corruption

If database is corrupted:

1. Load from backup (autosave)
2. Or start fresh with `db.import()`

## Next Steps

1. Implement BrowserDatabaseAdapter with sql.js
2. Create repository implementations
3. Migrate GameEngine to use database
4. Add comprehensive tests
5. Performance benchmarking

## References

- [ADR-0001: Database Technology](../../docs/08-decisions/adr-0001-database-technology.md)
- [Persistence Architecture](../../docs/05-technical-architecture/persistence.md)
- [sql.js Documentation](https://sql.js.org/)

---

**Version**: 2.4.0  
**Last Updated**: December 2025
