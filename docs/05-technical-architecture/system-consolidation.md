# Konsolidierung der Systemvarianten (Stand: 17.10.2026)

## Verbindlicher Laufzeitpfad
`src/main.ts -> KingdomGameUI -> GameEngine` ist die einzige standardmäßig ausgelieferte Kampagne.
Die UI-Module `GameUI`, `UIFlowManager`, `EnhancedPixiRenderer` und `RoadmapFeaturesUI` sind
historische alternative Oberflächen, nicht Bestandteil dieses Einstiegspfads.
Nicht löschen, bevor noch benötigte Funktionalität und Importverbraucher migriert wurden.

## Paarweise Bewertung
| Bereich | Kanonischer Pfad heute | Andere Implementierung | Warum kein blindes Merge? |
| --- | --- | --- | --- |
| Stadtviertel | `core/UrbanDistrictsSystem.ts` (Engine-Instanz) | `core/UrbanDistrictSystem.ts` | Unterschiedliche `DistrictType`-Modelle: Stringunion vs Objekt, verschiedene IDs und Event-/Crime-Strukturen |
| Belagerung | `core/SiegeWarfareSystem.ts` (Engine-Instanz) | `core/SiegeSystem.ts` | Unterschiedliche `SiegeStatus`/`Siege`-Modelle, Tagesauflösung vs laufzeitbasiertes Update |
| SQL-Adapter | `core/database/DatabaseAdapter.ts` | `core/DatabaseAdapter.ts` | `init()`/Callback-Transaktionen und `connect()`/Query-Transaktionen sind inkompatibel |
| SQL-Browser | `core/database/BrowserDatabaseAdapter.ts` | `core/BrowserDatabaseAdapter.ts` | Abweichende Persistence-, Transaktions-, Versionierungsverträge |
| SQL-Migration | `core/database/migrations/001_initial_schema.ts` | `core/migrations/001_initial_schema.ts` + `002_gameplay_modes.ts` | Schema 001 ist nicht identisch; Gameplay-Modes-Schema 002 fehlt im kanonischen Pfad |

**Wichtig:** Die Live-Kampagne speichert über LocalForage; das SQL-Repository ist eine alternative,
noch nicht per Engine angeschlossene Persistenzarchitektur. Ein Umschalten ohne Datenmigration
würde Spielstände gefährden.

## Migrationsschritte (weiter offen)
1. Beide Schema-001-Varianten mit golden SQL Fixtures vergleichen; Kollisionen und Versionstabelle prüfen.
2. Eine einzige Adapter-Fassade definieren; Transaktions- und Versionssemantik mit Integrationstests sichern.
3. Migration 002 aus dem Altpfad auf das kanonische Schema portieren und rollbackfähig testen.
4. `UrbanDistrictSystem` und `SiegeSystem` über explizite Datenkonverter auf die Engine-Typen migrieren;
   bestehende Felder, IDs, Berechnungen und Serialisierung bewahren.
5. Erst danach Altimplementierungen löschen, alle Imports anpassen und Savegame-Kompatibilität testen.

## QA-Gates
`npm run check`, `npm run build`, `npx vitest run`, Chromium-Browser-Smoke (Desktop/320px),
SQL-Migrations-Rollback-Tests sowie Savedata-Roundtrips.
Keine abgeschlossenen Merges behaupten, solange die Datenkonverter fehlen.
