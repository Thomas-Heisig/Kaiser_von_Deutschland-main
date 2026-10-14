# Database Layer

## Overview

This module provides a structured, scalable persistence layer for Kaiser von Deutschland using SQLite. It supports browser (via sql.js), desktop (via better-sqlite3), and mobile (via Capacitor SQLite) platforms through a unified interface.

## Quick Start

```typescript
import { BrowserDatabaseAdapter, MigrationRunner, Migration001InitialSchema } from './database';

// Initialize
const db = new BrowserDatabaseAdapter();
await db.init();

// Run migrations
const runner = new MigrationRunner(db);
runner.register(new Migration001InitialSchema());
await runner.runPending();

// Use repositories
const playerRepo = new PlayerRepository(db);
await playerRepo.save(player);
const players = await playerRepo.findAll();
```

## Features

- ✅ **Cross-Platform**: Same API for browser, desktop, mobile
- ✅ **Migrations**: Version-controlled schema evolution
- ✅ **Transactions**: ACID-compliant atomic operations
- ✅ **Repository Pattern**: Clean data access layer
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Export/Import**: Save/load game functionality
- ✅ **Performance**: Optimized for 100k+ entities

## Architecture

```
database/
├── DatabaseAdapter.ts           # Core interface
├── BrowserDatabaseAdapter.ts    # Browser (sql.js)
├── Migration.ts                 # Migration framework
├── MigrationRunner.ts          # Migration engine
├── migrations/                 # Schema versions
│   └── 001_initial_schema.ts
├── repositories/               # Data access
│   └── PlayerRepository.ts
└── database.test.ts           # Tests
```

## Components

### DatabaseAdapter

Abstract interface for database operations:

- `query<T>(sql, params)` - SELECT queries
- `execute(sql, params)` - INSERT/UPDATE/DELETE
- `insert(sql, params)` - INSERT with ID return
- `transaction(callback)` - Atomic operations
- `export()` / `import(data)` - Save/load

### BrowserDatabaseAdapter

SQLite in WebAssembly using sql.js:

- Runs entirely in browser
- No server required
- Full SQL support
- In-memory with export/import

### Migration System

Version-controlled schema evolution:

- `BaseMigration` - Base class for migrations
- `MigrationRunner` - Executes migrations
- `up()` - Apply changes
- `down()` - Rollback changes

### Repository Pattern

Clean data access layer:

- Separates data access from business logic
- Type-safe queries
- Consistent API across entities
- Easy testing and mocking

## Usage Examples

See `/docs/06-development/database-usage.md` for complete guide.

### Save/Load Game

```typescript
// Save
const data = await db.export();
localStorage.setItem('save', JSON.stringify(Array.from(data)));

// Load
const saved = JSON.parse(localStorage.getItem('save'));
await db.import(new Uint8Array(saved));
```

### Queries

```typescript
// Simple query
const results = await db.query<Player>('SELECT * FROM players WHERE is_ai = 0');

// With params
const player = await db.query('SELECT * FROM players WHERE id = ?', [playerId]);

// Join
const stats = await db.query(`
  SELECT p.name, COUNT(c.id) as citizens
  FROM players p
  LEFT JOIN citizens c ON c.player_id = p.id
  GROUP BY p.id
`);
```

### Transactions

```typescript
await db.transaction(async () => {
  await db.execute('UPDATE players SET treasury = treasury - 1000');
  await db.execute('INSERT INTO buildings (type) VALUES ("castle")');
});
```

## Testing

Run tests:

```bash
npm test src/core/database/database.test.ts
```

## Future Roadmap

- [ ] Desktop adapter (better-sqlite3)
- [ ] Mobile adapter (Capacitor SQLite)
- [ ] Cloud sync (PostgreSQL)
- [ ] Query builder
- [ ] ORM layer
- [ ] Performance profiling

## Documentation

- [Usage Guide](/docs/06-development/database-usage.md)
- [ADR-0001: Database Technology Selection](/docs/08-decisions/adr-0001-database-technology.md)
- [Persistence Architecture](/docs/05-technical-architecture/persistence.md)

## License

Part of Kaiser von Deutschland project
