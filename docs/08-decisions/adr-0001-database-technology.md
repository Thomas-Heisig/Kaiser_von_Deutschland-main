# ADR-0001: Database Technology Selection

## Architecture Decision Record

**Status**: Accepted  
**Date**: 2025-12-27  
**Decision Makers**: Development Team

## Context

### Technischer Kontext

Das Spiel "Kaiser von Deutschland" nutzt derzeit LocalForage für die Datenhaltung. Dies funktioniert für kleine bis mittlere Datenmengen, stößt aber an Grenzen:

- **Performance-Probleme** bei > 10.000 Bürgern
- **Fehlende Relationen** zwischen Daten (z.B. Bürger ↔ Familien)
- **Keine strukturierten Queries** (nur Key-Value)
- **Große Speichergröße** durch JSON-Serialisierung
- **Keine Migrations** für Schema-Updates
- **Keine Cloud-Synchronisation**

**Betroffene Systeme**:
- CitizenSystem (Bürger-Verwaltung)
- GameEngine (Save/Load)
- DiplomacySystem (Beziehungen)
- Alle anderen Systems mit Datenpersistenz

**Constraints**:
- Muss auf **Browser**, **Desktop**, **Mobile** und **Cloud** laufen
- Muss mit **100.000+ Datensätzen** skalieren
- Muss **Offline-First** funktionieren
- Soll **Open Source** sein

### Business Kontext

**Geschäftliche Ziele**:
1. Multiplayer-fähig mit Cloud-Synchronisation
2. Skalierbarkeit bis 100 Millionen Bürger (Deutschland)
3. Akademische Nutzung (Forschung benötigt strukturierte Daten)
4. Mobile-Version geplant (Q2 2026)

**Stakeholder**:
- Spieler (erwarten Offline-Spielen + Cloud-Saves)
- Akademische Nutzer (benötigen Datenexport)
- Entwickler (einfache Wartung und Erweiterung)

## Decision

**Wir haben entschieden**: Hybrid-Datenbank-Ansatz mit SQLite-Kern

- **Browser**: sql.js (SQLite in WebAssembly)
- **Desktop**: better-sqlite3 (Native SQLite)
- **Mobile**: Capacitor SQLite Plugin
- **Cloud**: PostgreSQL für Multiplayer-Server

**Abstraktion**: Gemeinsames Interface `DatabaseAdapter` für alle Plattformen

### Begründung

1. **SQLite ist Industrie-Standard**: Milliarden Geräte, bewährte Technologie
2. **Echtes Relational Model**: Joins, Foreign Keys, Transactions
3. **Cross-Platform**: Läuft überall (sogar im Browser via WASM)
4. **Performance**: Deutlich schneller als Key-Value-Stores bei komplexen Queries
5. **SQL-Skills**: Team kennt SQL, keine neue Sprache lernen
6. **Migrations**: Strukturierte Schema-Versionierung möglich
7. **Open Source**: MIT-Lizenz, keine Vendor-Lock-In

## Alternatives Considered

### Alternative 1: IndexedDB (Browser-Native)

**Beschreibung**: Browser-native NoSQL-Datenbank mit Indizes

**Vorteile**:
- ✅ Nativ in allen modernen Browsern
- ✅ Keine externe Library notwendig
- ✅ Asynchrone API (non-blocking)
- ✅ Gute Browser-Integration

**Nachteile**:
- ❌ Keine SQL-Queries (komplexe Abfragen schwierig)
- ❌ Keine Relationen (manuelles Join)
- ❌ Unterschiedliche APIs pro Browser (Kompatibilitätsprobleme)
- ❌ Schwierig auf Desktop/Mobile zu portieren
- ❌ Keine Migrations-Unterstützung

**Warum abgelehnt**: Zu limitiert für komplexe Relationen, nicht portable

### Alternative 2: PouchDB + CouchDB

**Beschreibung**: Offline-First NoSQL mit Cloud-Sync

**Vorteile**:
- ✅ Offline-First Design
- ✅ Automatische Cloud-Synchronisation
- ✅ Konfliktauflösung eingebaut
- ✅ Läuft im Browser und Server

**Nachteile**:
- ❌ NoSQL = keine Relationen, schwierige Queries
- ❌ Große Bundle-Size (~150KB minified)
- ❌ Komplexe API, steile Lernkurve
- ❌ CouchDB-Server notwendig (nicht Standard)
- ❌ Performance-Probleme bei vielen kleinen Dokumenten

**Warum abgelehnt**: Zu komplex, NoSQL passt nicht zum relationalen Datenmodell

### Alternative 3: Dexie.js (IndexedDB Wrapper)

**Beschreibung**: Moderne IndexedDB-Library mit einfacherer API

**Vorteile**:
- ✅ Bessere API als natives IndexedDB
- ✅ Promise-basiert
- ✅ Gute TypeScript-Unterstützung
- ✅ Observables für reactive Updates

**Nachteile**:
- ❌ Immer noch NoSQL (keine echten Joins)
- ❌ Nur Browser (kein Desktop/Mobile)
- ❌ Relationen manuell implementieren
- ❌ Keine SQL-Syntax

**Warum abgelehnt**: Grundlegende Limitierungen von IndexedDB bleiben

### Alternative 4: Firebase / Supabase

**Beschreibung**: Backend-as-a-Service mit Realtime-Datenbank

**Vorteile**:
- ✅ Cloud-Sync eingebaut
- ✅ Realtime-Updates
- ✅ Authentication inklusive
- ✅ Skaliert automatisch

**Nachteile**:
- ❌ Vendor-Lock-In (Firebase = Google, Supabase = proprietär)
- ❌ Kosten skalieren mit Nutzern
- ❌ Offline-First nicht ideal (vor allem Firebase)
- ❌ Weniger Kontrolle über Daten
- ❌ Privacy-Bedenken (externe Server)

**Warum abgelehnt**: Zu abhängig von externem Service, Kosten, Privacy

### Alternative 5: Alles in-memory (kein Persistence)

**Beschreibung**: Spiel-State nur im RAM, kein Speichern

**Vorteile**:
- ✅ Maximale Performance
- ✅ Keine Komplexität
- ✅ Einfache Implementation

**Nachteile**:
- ❌ Kein Save/Load möglich
- ❌ Spieler verlieren Fortschritt bei Reload
- ❌ Keine Multiplayer-Persistenz
- ❌ Unrealistisch für ein Strategiespiel

**Warum abgelehnt**: Nicht akzeptabel für Spieler

## Consequences

### Positive Konsequenzen

- ✅ **Skalierbarkeit**: Kann 100.000+ Bürger verwalten
- ✅ **Strukturierte Daten**: Relationen, Joins, Foreign Keys
- ✅ **Migrations**: Schema-Updates kontrolliert möglich
- ✅ **Cross-Platform**: Ein Datenmodell für alle Plattformen
- ✅ **Standard-Skills**: SQL ist weitverbreitet
- ✅ **Tooling**: SQLite-Browser, Debugging-Tools verfügbar
- ✅ **Export**: Daten können für Forschung exportiert werden
- ✅ **Performance**: Indizes beschleunigen Queries drastisch

### Negative Konsequenzen

- ❌ **Bundle-Size**: sql.js ist ~500KB (komprimiert ~180KB)
- ❌ **Memory**: Browser-SQLite läuft komplett im RAM
- ❌ **Komplexität**: Schema-Design und Migrations erfordern Planung
- ❌ **Synchron in Browser**: sql.js ist synchron (kann UI blockieren)
- ❌ **Migration-Aufwand**: Bestehende LocalForage-Daten müssen migriert werden

### Risiken

- ⚠️ **Memory-Limit in Browsern**: Bei sehr großen DBs (> 500MB)
  - **Mitigation**: Aggregation ab 100k Bürgern, alte Daten archivieren
  
- ⚠️ **Migrations fehlschlagen**: Schema-Updates können schiefgehen
  - **Mitigation**: Automatische Backups vor Migration, Rollback-Plan
  
- ⚠️ **Performance-Regression**: Initial-Load könnte langsamer werden
  - **Mitigation**: Lazy Loading, Indizes, Paginierung

## Implementation

### Erforderliche Änderungen

1. **DatabaseAdapter Interface** (`src/core/DatabaseAdapter.ts`)
   - Abstrakte Schnittstelle für alle Plattformen
   - Methoden: query, execute, transaction

2. **SQLite Implementierungen**
   - `BrowserDatabaseAdapter.ts` (sql.js)
   - `DesktopDatabaseAdapter.ts` (better-sqlite3) - später
   - `MobileDatabaseAdapter.ts` (Capacitor) - später

3. **Repository Pattern** für alle Systeme
   - `CitizenRepository.ts`
   - `BuildingRepository.ts`
   - `PlayerRepository.ts`
   - etc.

4. **Migration System** (`src/core/migrations/`)
   - `MigrationRunner.ts`
   - `migrations/001_initial_schema.ts`
   - `migrations/002_add_families.ts`
   - etc.

5. **GameEngine Refactoring**
   - Ersetze LocalForage durch DatabaseAdapter
   - Save/Load nutzt SQL statt JSON

6. **Tests**
   - Unit Tests für alle Repositories
   - Integration Tests für Migrations
   - Performance Tests mit 100k Datensätzen

### Migration Plan

1. **Phase 1: Foundation** (Woche 1)
   - DatabaseAdapter Interface
   - sql.js Integration
   - Erste Migration (Schema)

2. **Phase 2: Repositories** (Woche 2)
   - CitizenRepository
   - PlayerRepository
   - BuildingRepository

3. **Phase 3: Migration** (Woche 3)
   - Daten-Migration von LocalForage
   - Backward-Compatibility-Layer

4. **Phase 4: Testing** (Woche 4)
   - Performance-Tests
   - Bug-Fixes
   - Dokumentation

### Rollback Plan

Falls SQLite nicht funktioniert:

1. Feature-Flag `USE_SQLITE` auf `false` setzen
2. Fallback zu LocalForage (Code bleibt erhalten)
3. Evaluation von Alternative 2 oder 3
4. 3 Monate Zeit für Rollback (bis März 2026)

## Validation

### Success Criteria

- **Performance**: Laden von 100k Bürgern in < 5 Sekunden
- **Speicher**: DB-Größe < 50% von aktueller LocalForage-Lösung
- **Funktionalität**: Alle Save/Load-Features weiterhin funktional
- **Tests**: Test-Coverage > 80% für neue Repositories
- **Keine Regressions**: Alle existierenden Tests bestehen

### Review Date

**Nächste Review**: 2026-03-31  
**Grund**: Nach 3 Monaten im Produktiveinsatz evaluieren wir:
- Performance-Metriken
- Benutzer-Feedback
- Skalierbarkeit bei großen Spielständen
- Bundle-Size Impact

## Related Documents

- [Persistence Architecture](../05-technical-architecture/persistence.md)
- [Database Schema](../05-technical-architecture/data-model.md)
- [Migration Guide](../06-development/database-migrations.md)
- [GitHub Issue #10](https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/issues/10)

## Notes

**Diskussionen**:
- Community Discord (2025-12-15): Mehrheit für SQLite
- Team Meeting (2025-12-20): Entscheidung für Hybrid-Ansatz

**Referenzen**:
- [sql.js Documentation](https://sql.js.org/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Official Docs](https://www.sqlite.org/docs.html)

**Änderungen**:
- 2025-12-27: Initial ADR erstellt und akzeptiert

---

**ADR-Nummer**: ADR-0001  
**Erstellt**: 2025-12-27  
**Aktualisiert**: 2025-12-27  
**Status**: Accepted
