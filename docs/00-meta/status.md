# Projektstatus – Kaiser von Deutschland

**Stand:** 17. Oktober 2026  
**Paketversion:** 2.5.1 (`package.json`; kein neues Release durch Dokumentationsarbeit)  
**Phase:** Aktive Entwicklung / spielbare Aufbaukampagne

## Produktiver Einstieg
`src/main.ts → KingdomGameUI → GameEngine`. Das Spiel läuft browserlokal;
`LocalForage` ist die tatsächliche Speicherlösung. Die alternative SQL-Architektur
unter `core/database/` ist nicht mit diesem Speicherpfad verbunden.

## In der Standardkampagne nachgewiesen
- Reichsrat mit 12 spielbaren Ereignissen, Risiken und Auswahlfolgen.
- Monatliche Speicherpunkte sowie komprimierte größere Savegames mit Legacy-Leseweg (PR #10).
- Gesandtschaften, Rivalenstrategien, zweijährige Nichtangriffspakte, Überfallschutz.
- Kulturfeste, Religionsüberblick und Forschungsfortschritt pro Reich.
- Kartenanimationen, synthetische Geräuschkulisse, Lautstärkeregler.
- Lokaler Hotseat mit abwechselnden Zügen.
- GitHub-CI: Typecheck, Build, Unit-Tests; Chromium-Smoke Desktop/320×740.

## Vorhandene Module, noch keine vollständige Gameplay-Integration
- Stadtviertel, Belagerung, Kolonien, Kultur, Militärformationen, Marine,
  Spionage und weitere Roadmap-Systeme sind als Klassen vorhanden.
  Die bloße Existenz einer Klasse beweist keine erreichbare Spielmechanik.
- Zwei inkompatible Generationen des SQL-Adapters und des Migrationsschemas;
  kein produktiver SQL-Savepfad.
- `GameUI`, `UIFlowManager`, `EnhancedPixiRenderer` und Roadmap-Panels
  sind alternative Legacy-Oberflächen.

## Risiken / offene Messungen
- Bürgerperformance über 5.000 bzw. 100.000 Einwohner und langfristiges Memory-Profiling.
- Kohorten statt Einzelobjekten für große Bevölkerungen: Architektur vorhanden,
  vollständige Migration, Balancing und Savegame-Kohärenz fehlen.
- Vollständige Browser-E2E-Abdeckung, WCAG, Audio-Abnahme und Crossbrowser-Tests.
- SQL-Schema- und Adaptervereinheitlichung einschließlich Migration 002.
- Reale Aktivierung einer Hanseroute im Browser mit Hafen, Forschung und Gold.

Die ehemals genannten ~40 % Coverage, <3 s Startup, 60 FPS und <2 s Save/Load
waren historische Schätzungen. Ohne neue reproduzierbare Messung gelten sie nicht
als aktuelle Leistungsnachweise.

## Weiterarbeit
Offene Aufgaben: [TODO](../../TODO.md). Architekturentscheidungen:
[Systemkonsolidierung](../05-technical-architecture/system-consolidation.md).
[Betriebshandbuch](../06-development/operations-guide.md).
