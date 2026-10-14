# Dokumentation - Kaiser von Deutschland

## Übersicht

Diese Dokumentation folgt einer strukturierten, fachlich trennungsscharfen Organisation, die speziell für Wirtschaftssimulationen und Serious Games entwickelt wurde.

## Struktur

### 📁 00-meta - Projektstatus & Steuerung
Meta-Informationen über das Projekt selbst:
- `vision.md` - Zweck, Lernziel, Abgrenzung
- `roadmap.md` - Feature-Planung und Timeline  
- `status.md` - Aktueller Entwicklungsstand
- `contribution-model.md` - Wie man beiträgt

### 📁 01-overview - Überblick & Einordnung
Einstieg und grundlegende Information:
- `index.md` - Spielidee in nüchterner Form
- `target-groups.md` - Spieler, Bildung, Verwaltung
- `glossary.md` - Ökonomische und Spiel-Begriffe
- `assumptions.md` - Grundannahmen der Simulation

### 📁 02-simulation-model - Fachliche Kernlogik
**Sehr wichtig**: Die ökonomischen und sozialen Modelle:
- `economic-model.md` - Angebots-/Nachfragemodelle
- `actors.md` - Staat, Unternehmen, Haushalte
- `resources.md` - Kapital, Arbeit, Boden
- `markets.md` - Arbeits-, Güter-, Kapitalmarkt
- `time-model.md` - Runden, Zyklen, Zeitauflösung
- `limitations.md` - Bewusste Vereinfachungen

### 📁 03-game-design - Spielmechaniken
Wie wird simuliert gespielt:
- `core-loop.md` - Entscheidung → Wirkung → Feedback
- `rules.md` - Spielregeln
- `scoring-metrics.md` - Erfolgsmessung
- `events.md` - Zufalls- & Systemereignisse
- `balancing.md` - Parameter & Stellschrauben

### 📁 04-domains - Fachliche Teilbereiche
Spezialisierte Domänen der Simulation:

#### 04-domains/regional-development
- `overview.md` - Regionalentwicklung
- `infrastructure.md` - Infrastruktur
- `incentives.md` - Fördermaßnahmen
- `indicators.md` - KPIs

#### 04-domains/labor-market
- `overview.md` - Arbeitsmarkt
- `employment.md` - Beschäftigung
- `education.md` - Bildung
- `migration.md` - Migration

#### 04-domains/sustainability
- `overview.md` - Nachhaltigkeit
- `resources.md` - Ressourcen
- `emissions.md` - Emissionen
- `regulations.md` - Umweltregulierung

### 📁 05-technical-architecture - Umsetzung
Technische Implementierung:
- `system-overview.md` - Gesamtarchitektur
- `simulation-engine.md` - Kern-Engine
- `data-model.md` - Datenstrukturen
- `ai-and-agents.md` - KI-Systeme
- `ui-architecture.md` - User Interface
- `persistence.md` - Datenbank & Speicherung

### 📁 06-development - Entwicklung
Für Entwickler:
- `setup.md` - Entwicklungsumgebung
- `coding-guidelines.md` - Code-Standards
- `branching-model.md` - Git-Workflow
- `testing-simulation.md` - Testing-Strategie
- `tooling.md` - Entwickler-Tools

### 📁 07-operations - Betrieb
Deployment und Betrieb:
- `build.md` - Build-Prozess
- `configuration.md` - Konfiguration
- `savegames.md` - Spielstand-Management
- `telemetry.md` - Metriken & Monitoring

### 📁 08-decisions - Design- & Modellentscheidungen
Architecture Decision Records (ADRs):
- `adr-template.md` - Vorlage für ADRs
- `adr-0001-database-technology.md` - Datenbank-Wahl
- `adr-0002-time-scale.md` - Zeitsystem (geplant)
- `adr-0003-ai-behavior.md` - KI-Verhalten (geplant)

### 📁 99-appendix - Anhang
Zusätzliche Informationen:
- `references.md` - Studien, Bücher, Datenquellen
- `validation.md` - Plausibilitätsprüfungen

## Prinzipien der Dokumentation

### 1. Trennung von Concerns

**Simulation ≠ Spielmechanik ≠ Technik**

- **02-simulation-model**: Ökonomische Logik (wissenschaftlich)
- **03-game-design**: Spielerinteraktion (spielerisch)
- **05-technical-architecture**: Umsetzung (technisch)

Diese Trennung ermöglicht:
- Balancing ohne Modell-Verfälschung
- Simulation separat nutzbar (z.B. Forschung)
- Technologie-Updates ohne Design-Änderung

### 2. Explizite Annahmen

Alle Modelle basieren auf **dokumentierten Annahmen**:
- `assumptions.md` ist Pflichtlektüre
- Jedes Modell erklärt seine Vereinfachungen
- Keine versteckten Annahmen

### 3. Nachvollziehbarkeit

Jede Entscheidung ist dokumentiert:
- ADRs für wichtige Architektur-Entscheidungen
- Begründungen mit Alternativen
- Konsequenzen explizit genannt

### 4. Wissenschaftliche Fundierung

- Quellen in `references.md`
- Modelle basierend auf Fachliteratur
- Validation gegen reale Daten

## Für wen ist welcher Bereich?

### 🎮 Spieler
Start hier:
1. `01-overview/index.md` - Was ist das Spiel?
2. `../USER_GUIDE.md` - Wie spiele ich?
3. `03-game-design/` - Wie funktioniert es?

### 🎓 Lehrer & Bildung
Start hier:
1. `00-meta/vision.md` - Pädagogischer Wert
2. `01-overview/assumptions.md` - Was ist vereinfacht?
3. `02-simulation-model/` - Ökonomische Modelle

### 💻 Entwickler
Start hier:
1. `05-technical-architecture/system-overview.md` - Architektur
2. `06-development/setup.md` - Entwicklungsumgebung
3. `08-decisions/` - Warum so gebaut?

### 🔬 Forscher
Start hier:
1. `02-simulation-model/` - Simulationsmodelle
2. `01-overview/assumptions.md` - Modellannahmen
3. `99-appendix/references.md` - Quellenverzeichnis

### 🎯 Modder
Start hier:
1. `03-game-design/` - Mechaniken verstehen
2. `05-technical-architecture/data-model.md` - Datenstrukturen
3. `06-development/` - Entwicklungstools

## Dokumentations-Standards

### Markdown-Format

Alle Dokumente nutzen Markdown:
- Überschriften: `#`, `##`, `###`
- Listen: `-` oder `1.`
- Code: ` ```typescript ` 
- Links: `[Text](url)`
- Tabellen: Markdown-Tables

### Dateinamen

- Kleinbuchstaben mit Bindestrichen: `economic-model.md`
- Keine Leerzeichen
- Beschreibend und kurz

### Struktur pro Dokument

1. **Titel** (`#`)
2. **Übersicht** - Was steht in diesem Dokument?
3. **Hauptinhalt** mit Unterabschnitten
4. **Beispiele** (wenn relevant)
5. **Referenzen** zu anderen Dokumenten
6. **Footer** mit Version und Datum

### Versionierung

Jedes Dokument hat am Ende:
```markdown
---
**Version**: 2.3.1  
**Letzte Aktualisierung**: Dezember 2025
```

## Migration alter Dokumentation

Die Dokumentation wurde reorganisiert und ist nun vollständig migriert:

**Alte Struktur** → **Neue Struktur**:
- `ARCHITECTURE.md` → `05-technical-architecture/ARCHITECTURE.md` ✅
- `API_REFERENCE.md` → `05-technical-architecture/API_REFERENCE.md` ✅
- `PIXIJS_OVERHAUL.md` → `05-technical-architecture/PIXIJS_OVERHAUL.md` ✅
- `GAMEPLAY_SYSTEM.md` → `03-game-design/GAMEPLAY_SYSTEM.md` ✅
- `POPULATION_API.md` → `04-domains/population/api.md` ✅
- `POPULATION_GUIDE.md` → `04-domains/population/guide.md` ✅
- `ECOLOGY_API.md` → `04-domains/ecology/api.md` ✅
- `NAVAL_SYSTEM.md` → `04-domains/naval/system.md` ✅
- `MIGRATION_SYSTEM.md` → `04-domains/migration/system.md` ✅
- `SOCIAL_MOBILITY_GUIDE.md` → `04-domains/population/social-mobility.md` ✅
- `TESTING_SCREENSHOTS.md` → `06-development/TESTING_SCREENSHOTS.md` ✅
- `USER_GUIDE.md` → Bleibt im Root (Spieler-Einstieg) ✅
- `INDEX.md` → Bleibt im Root (Hauptnavigation) ✅
- `ROADMAP.md` → `00-meta/roadmap.md` ✅

**Implementation Reports** → `reports/`:
- `20_FEATURES_IMPLEMENTATION.md` ✅
- `FEATURES_IMPLEMENTATION_V2.3.1.md` ✅
- `SCALABLE_FEATURES_IMPLEMENTATION.md` ✅
- `INTEGRATED_SYSTEMS_GUIDE.md` ✅
- `COMPLETION_REPORT.md` ✅
- `ECOLOGY_COMPLETION_REPORT.md` ✅
- `NEW_FEATURES.md` ✅

**Archivierte Dateien** → `outdated/`:
- `DOCUMENTATION.md` (ersetzt durch INDEX.md und README.md) ✅
- `IMPLEMENTATION_SUMMARY.md` (veraltet) ✅
- `IMPLEMENTATION_SUMMARY_ROADMAP.md` (veraltet) ✅
- `implementation-summary-v2.4.0-old.md` (alte Version) ✅

**Status**: Migration abgeschlossen ✅ (Dezember 2025)

## Beitragen zur Dokumentation

### Was dokumentieren?

- **Neue Features**: Update `00-meta/roadmap.md` und `status.md`
- **Design-Entscheidungen**: Neues ADR in `08-decisions/`
- **Modell-Änderungen**: Update `02-simulation-model/`
- **Code-Änderungen**: Update `05-technical-architecture/`

### Wie dokumentieren?

1. **Klar und präzise**: Kurze Sätze, einfache Sprache
2. **Strukturiert**: Überschriften, Listen, Tabellen
3. **Verlinkt**: Referenzen zu verwandten Dokumenten
4. **Aktuell**: Datum und Version pflegen

### Review-Prozess

1. Dokumentation zusammen mit Code committen
2. Pull Request erstellen
3. Review durch Maintainer
4. Merge und Deploy

## Tools

### Empfohlene Markdown-Editoren

- **VS Code** mit Markdown-Preview
- **Typora** (WYSIWYG)
- **Obsidian** (für lokales Lesen)
- **GitHub Web-Editor** (für kleine Änderungen)

### Dokumentations-Generator (geplant)

- Static Site mit VitePress oder Docusaurus
- Automatische Verlinkung
- Suchfunktion
- Versionierung

## Fragen?

- **GitHub Issues**: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/issues
- **Discussions**: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/discussions
- **Discord**: (Link folgt)

---

**Dokumentations-Version**: 2.4.0  
**Letzte Aktualisierung**: Dezember 2025  
**Maintainer**: Development Team
