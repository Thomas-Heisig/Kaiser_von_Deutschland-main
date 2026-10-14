# Persistence - Data Storage and Database

## Übersicht

Das Persistence-System von "Kaiser von Deutschland" ist verantwortlich für die Speicherung und Verwaltung aller Spieldaten. Mit Version 2.4.0 erfolgt die Migration von reinem LocalForage zu einer hybriden Lösung mit SQLite.

## Aktuelle Architektur (v2.3.1)

### LocalForage-basiert

**Komponenten**:
- Browser LocalForage für Save/Load
- JSON-Dateien für statische Spieldaten
- In-Memory Objekte während Laufzeit

**Vorteile**:
- ✅ Einfache Implementation
- ✅ Keine externen Dependencies
- ✅ Funktioniert in allen modernen Browsern

**Nachteile**:
- ❌ Keine strukturierten Queries
- ❌ Schwierig zu skalieren
- ❌ Keine Relationen zwischen Daten
- ❌ Keine Cloud-Synchronisation
- ❌ Große Speichergröße bei vielen Bürgern

### Datenstrukturen

```typescript
interface GameSaveData {
  version: string;
  savedAt: string;
  currentYear: number;
  players: PlayerData[];
  citizens: CitizenData[];
  buildings: BuildingData[];
  resources: ResourceData;
  technologies: TechnologyData[];
  events: EventData[];
  // ... weitere Systeme
}
```

### Save/Load Mechanik

```typescript
// Speichern
public async saveGame(slot: string = 'default'): Promise<void> {
  const saveData = this.serializeGameState();
  await localforage.setItem(`save_${slot}`, saveData);
}

// Laden
public async loadGame(slot: string = 'default'): Promise<void> {
  const saveData = await localforage.getItem(`save_${slot}`);
  this.deserializeGameState(saveData);
}
```

## Geplante Architektur (v2.4.0+)

### SQLite-Integration

**Ziele**:
- Strukturierte Datenhaltung mit SQL
- Effiziente Queries für große Datenmengen
- Relationen zwischen Entitäten
- Migrations-System für Schema-Updates
- Cross-Platform (Browser, Desktop, Mobile, Cloud)

### Technologie-Optionen

#### Option 1: sql.js (Browser)

**Vorteile**:
- ✅ Läuft vollständig im Browser
- ✅ Keine Server-Abhängigkeit
- ✅ SQLite-kompatibel

**Nachteile**:
- ❌ Gesamte DB im RAM
- ❌ Speichergrenzen bei sehr großen DBs
- ❌ Kein natives File-System

**Verwendung**:
```typescript
import initSqlJs from 'sql.js';

const SQL = await initSqlJs({
  locateFile: file => `https://sql.js.org/dist/${file}`
});

const db = new SQL.Database();
```

#### Option 2: better-sqlite3 (Node.js/Electron)

**Vorteile**:
- ✅ Native Performance
- ✅ Große Datenbanken möglich
- ✅ Synchrone API (einfacher)

**Nachteile**:
- ❌ Nur für Desktop (Electron)
- ❌ Kein Browser-Support

**Verwendung**:
```typescript
import Database from 'better-sqlite3';
const db = new Database('kaiser.db');
```

#### Empfohlene Lösung: Hybrid

- **Browser**: sql.js für lokales Spielen
- **Desktop**: better-sqlite3 für Electron-Version
- **Mobile**: SQLite via Capacitor
- **Cloud**: PostgreSQL oder MySQL für Server

**Abstraktion-Layer**:
```typescript
interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  transaction(queries: Query[]): Promise<void>;
}
```

## Database Schema

### Core Tables

```sql
-- Spielstand-Metadaten
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY,
  version TEXT NOT NULL,
  current_year INTEGER NOT NULL,
  game_state TEXT NOT NULL, -- LOBBY, RUNNING, PAUSED, FINISHED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spieler
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT 0,
  ai_model TEXT,
  gold REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bürger
CREATE TABLE citizens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  profession TEXT NOT NULL,
  region_id TEXT,
  health INTEGER DEFAULT 100,
  happiness INTEGER DEFAULT 50,
  education INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Familien-Beziehungen
CREATE TABLE family_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_id TEXT NOT NULL,
  related_id TEXT NOT NULL,
  relation_type TEXT NOT NULL, -- parent, child, spouse, sibling
  FOREIGN KEY (citizen_id) REFERENCES citizens(id),
  FOREIGN KEY (related_id) REFERENCES citizens(id)
);

-- Gebäude
CREATE TABLE buildings (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  region_id TEXT NOT NULL,
  owner_id TEXT,
  level INTEGER DEFAULT 1,
  health INTEGER DEFAULT 100,
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (owner_id) REFERENCES players(id)
);

-- Regionen
CREATE TABLE regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- urban, rural, etc.
  population INTEGER DEFAULT 0,
  climate TEXT
);

-- Ressourcen pro Region
CREATE TABLE region_resources (
  region_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  amount REAL DEFAULT 0,
  PRIMARY KEY (region_id, resource_type),
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Technologien
CREATE TABLE technologies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT 0,
  unlocked_year INTEGER
);

-- Historische Ereignisse
CREATE TABLE historical_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  triggered BOOLEAN DEFAULT 0,
  outcome TEXT
);

-- Diplomatische Beziehungen (Multiplayer)
CREATE TABLE diplomatic_relations (
  player_id TEXT NOT NULL,
  other_player_id TEXT NOT NULL,
  trust INTEGER DEFAULT 50,
  relationship INTEGER DEFAULT 50,
  PRIMARY KEY (player_id, other_player_id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (other_player_id) REFERENCES players(id)
);

-- Verträge
CREATE TABLE treaties (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  player1_id TEXT NOT NULL,
  player2_id TEXT NOT NULL,
  start_year INTEGER NOT NULL,
  duration INTEGER,
  active BOOLEAN DEFAULT 1,
  FOREIGN KEY (player1_id) REFERENCES players(id),
  FOREIGN KEY (player2_id) REFERENCES players(id)
);
```

### Indizes für Performance

```sql
-- Bürger-Queries optimieren
CREATE INDEX idx_citizens_region ON citizens(region_id);
CREATE INDEX idx_citizens_profession ON citizens(profession);
CREATE INDEX idx_citizens_age ON citizens(age);

-- Gebäude-Queries
CREATE INDEX idx_buildings_region ON buildings(region_id);
CREATE INDEX idx_buildings_owner ON buildings(owner_id);

-- Events
CREATE INDEX idx_events_year ON historical_events(year);
CREATE INDEX idx_events_triggered ON historical_events(triggered);
```

## Migrations-System

### Migration-Struktur

```typescript
interface Migration {
  version: number;
  up: (db: DatabaseAdapter) => Promise<void>;
  down: (db: DatabaseAdapter) => Promise<void>;
}
```

### Beispiel-Migration

```typescript
const migration_001: Migration = {
  version: 1,
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY,
        version TEXT NOT NULL,
        current_year INTEGER NOT NULL,
        game_state TEXT NOT NULL
      )
    `);
  },
  down: async (db) => {
    await db.execute('DROP TABLE IF EXISTS game_state');
  }
};
```

### Migration Runner

```typescript
class MigrationRunner {
  async migrate(db: DatabaseAdapter, targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion(db);
    
    for (let v = currentVersion + 1; v <= targetVersion; v++) {
      const migration = this.getMigration(v);
      await migration.up(db);
      await this.setVersion(db, v);
    }
  }
}
```

## Data Access Layer

### Repository Pattern

```typescript
interface CitizenRepository {
  findById(id: string): Promise<Citizen | null>;
  findByRegion(regionId: string): Promise<Citizen[]>;
  findByProfession(profession: string): Promise<Citizen[]>;
  save(citizen: Citizen): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

class SQLCitizenRepository implements CitizenRepository {
  constructor(private db: DatabaseAdapter) {}
  
  async findById(id: string): Promise<Citizen | null> {
    const rows = await this.db.query(
      'SELECT * FROM citizens WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapToCitizen(rows[0]) : null;
  }
  
  async findByRegion(regionId: string): Promise<Citizen[]> {
    const rows = await this.db.query(
      'SELECT * FROM citizens WHERE region_id = ?',
      [regionId]
    );
    return rows.map(this.mapToCitizen);
  }
  
  // ... weitere Methoden
}
```

## Cloud-Synchronisation

### Sync-Strategie

**Konflikt-Auflösung**: Last-Write-Wins mit Timestamp

```typescript
interface SyncService {
  push(localData: GameSaveData): Promise<void>;
  pull(): Promise<GameSaveData>;
  sync(): Promise<SyncResult>;
}

interface SyncResult {
  conflicts: Conflict[];
  resolved: number;
  failed: number;
}
```

### Optimistic Locking

```sql
ALTER TABLE game_state ADD COLUMN version_hash TEXT;

-- Beim Update prüfen
UPDATE game_state 
SET current_year = ?, version_hash = ?
WHERE id = ? AND version_hash = ?;
```

## Performance-Optimierungen

### Lazy Loading

```typescript
class LazyLoadingCitizenRepository implements CitizenRepository {
  private cache: Map<string, Citizen> = new Map();
  
  async findById(id: string): Promise<Citizen | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    
    const citizen = await this.db.query(/*...*/);
    this.cache.set(id, citizen);
    return citizen;
  }
}
```

### Batch Operations

```typescript
async saveBatch(citizens: Citizen[]): Promise<void> {
  const queries = citizens.map(c => ({
    sql: 'INSERT OR REPLACE INTO citizens (...) VALUES (...)',
    params: [c.id, c.name, ...]
  }));
  
  await this.db.transaction(queries);
}
```

### Pagination

```typescript
async findPaginated(
  page: number,
  pageSize: number
): Promise<PaginatedResult<Citizen>> {
  const offset = (page - 1) * pageSize;
  
  const [rows, total] = await Promise.all([
    this.db.query(
      'SELECT * FROM citizens LIMIT ? OFFSET ?',
      [pageSize, offset]
    ),
    this.db.query('SELECT COUNT(*) as count FROM citizens')
  ]);
  
  return {
    data: rows.map(this.mapToCitizen),
    total: total[0].count,
    page,
    pageSize
  };
}
```

## Backup und Recovery

### Auto-Save

```typescript
class AutoSaveService {
  private interval: number = 5 * 60 * 1000; // 5 Minuten
  
  start(gameEngine: GameEngine): void {
    setInterval(() => {
      gameEngine.saveGame('autosave');
    }, this.interval);
  }
}
```

### Backup-Rotation

```typescript
async createBackup(): Promise<void> {
  const timestamp = Date.now();
  const backupSlot = `backup_${timestamp}`;
  
  await this.saveGame(backupSlot);
  
  // Alte Backups löschen (behalte nur letzte 10)
  await this.cleanOldBackups(10);
}
```

## Testing

### Unit Tests

```typescript
describe('SQLCitizenRepository', () => {
  let db: DatabaseAdapter;
  let repo: CitizenRepository;
  
  beforeEach(async () => {
    db = new InMemoryDatabase();
    await db.execute(CREATE_CITIZENS_TABLE);
    repo = new SQLCitizenRepository(db);
  });
  
  it('should save and retrieve citizen', async () => {
    const citizen = createTestCitizen();
    await repo.save(citizen);
    
    const retrieved = await repo.findById(citizen.id);
    expect(retrieved).toEqual(citizen);
  });
});
```

## Nächste Schritte

1. **Phase 1**: Database Adapter Interface implementieren
2. **Phase 2**: sql.js Integration für Browser
3. **Phase 3**: Migration von LocalForage zu SQLite
4. **Phase 4**: Cloud-Sync Prototype
5. **Phase 5**: Performance-Testing mit 100k+ Bürgern

---

**Version**: 2.4.0 (geplant)  
**Letzte Aktualisierung**: Dezember 2025
