# 🏗️ Kaiser von Deutschland - Architektur-Dokumentation

**Version**: 2.0.0  
**Letzte Aktualisierung**: Dezember 2025

Diese Dokumentation beschreibt die technische Architektur, Design-Patterns und Struktur des Projekts.

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Technologie-Stack](#technologie-stack)
3. [Architektur-Prinzipien](#architektur-prinzipien)
4. [System-Architektur](#system-architektur)
5. [Daten-Architektur](#daten-architektur)
6. [Komponenten-Übersicht](#komponenten-übersicht)
7. [Datenfluss](#datenfluss)
8. [Performance-Optimierungen](#performance-optimierungen)
9. [Erweiterbarkeit](#erweiterbarkeit)

---

## 🎯 Überblick

Kaiser von Deutschland nutzt eine **modulare, datengetriebene Architektur** mit TypeScript und Vite. Das Projekt ist als **Single-Page Application (SPA)** konzipiert mit optionaler Multiplayer-Funktionalität.

### Kern-Architektur-Merkmale

- **Modular**: Jedes System ist unabhängig und austauschbar
- **Datengetrieben**: Spielinhalte in JSON, Logik in TypeScript
- **Type-Safe**: Vollständige TypeScript-Typisierung
- **Event-Driven**: Lose Kopplung durch Event-System
- **Offline-First**: Funktioniert ohne Server (Single-Player)
- **Progressive Enhancement**: Optionale Features (Multiplayer, KI)

---

## 🛠️ Technologie-Stack

### Core Technologies

| Technologie | Version | Zweck |
|-------------|---------|-------|
| **TypeScript** | 5.3+ | Type-safe Entwicklung |
| **Vite** | 5.0+ | Build-Tool & Dev-Server |
| **LocalForage** | 1.10+ | Client-seitige Persistenz (IndexedDB) |
| **UUID** | 9.0+ | Eindeutige IDs generieren |

### Development Tools

| Tool | Zweck |
|------|-------|
| **Vitest** | Unit Testing |
| **TSC** | TypeScript Compiler & Type Checking |
| **npm** | Package Management |

### Browser-Support

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile**: iOS 14+, Android Chrome 90+

### Optionale Dependencies

| Service | Zweck | Erforderlich |
|---------|-------|--------------|
| **Ollama** | KI-Integration | Nein (optional) |
| **Wikipedia API** | Historische Informationen | Nein (optional) |
| **WebSocket Server** | Echtzeit-Multiplayer | Nein (geplant) |

---

## 🏛️ Architektur-Prinzipien

### 1. Separation of Concerns

```
┌─────────────┐
│     UI      │  ← Präsentations-Schicht (GameUI, Graphics)
├─────────────┤
│   Systems   │  ← Geschäftslogik (GameEngine, PolicySystem)
├─────────────┤
│    Data     │  ← Daten-Schicht (JSON, LocalForage)
└─────────────┘
```

### 2. Dependency Inversion

- Systeme sind von Abstraktionen abhängig, nicht von Konkretionen
- Interfaces definieren Verträge
- Dependency Injection ermöglicht Tests und Austausch

### 3. Single Responsibility

- Jede Klasse hat **eine** klare Verantwortung
- `PolicySystem` → nur Politik-Verwaltung
- `BuildingSystem` → nur Gebäude-Management
- Etc.

### 4. Open/Closed Principle

- **Offen für Erweiterung**: Neue Features via JSON
- **Geschlossen für Modifikation**: Core-Code bleibt stabil

### 5. Don't Repeat Yourself (DRY)

- Wiederverwendbare Utilities (`utils/`)
- Gemeinsame Interfaces und Types
- JSON-basierte Konfiguration

---

## 🏗️ System-Architektur

### High-Level Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    UI Layer                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   GameUI    │  │  Graphics   │  │NewFeatures  │  │   │
│  │  │             │  │   Canvas    │  │   Panel     │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  └─────────┼─────────────────┼─────────────────┼─────────┘   │
│            │                 │                 │             │
│  ┌─────────┼─────────────────┼─────────────────┼─────────┐   │
│  │         │    Core Game Engine Layer         │         │   │
│  │         ▼                                    ▼         │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │              GameEngine                         │  │   │
│  │  │  ┌────────────────────────────────────────┐     │  │   │
│  │  │  │  Core Systems:                        │     │  │   │
│  │  │  │  • Player, Kingdom, Economy           │     │  │   │
│  │  │  │  • RoleSystem, BuildingSystem         │     │  │   │
│  │  │  │  • TechnologySystem, EventSystem      │     │  │   │
│  │  │  │  • HistoricalEventSystem              │     │  │   │
│  │  │  └────────────────────────────────────────┘     │  │   │
│  │  │                                                  │  │   │
│  │  │  ┌────────────────────────────────────────┐     │  │   │
│  │  │  │  Extended Systems (Optional):         │     │  │   │
│  │  │  │  • PolicySystem (33 policies)         │     │  │   │
│  │  │  │  • OllamaService (6 AI models)        │     │  │   │
│  │  │  │  • MultiplayerSystem                   │     │  │   │
│  │  │  │  • WikiIntegration                     │     │  │   │
│  │  │  │  • RegionalSystem                      │     │  │   │
│  │  │  └────────────────────────────────────────┘     │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └─────────────────────┬───────────────────────────────────┘   │
│                        │                                       │
│  ┌─────────────────────┼───────────────────────────────────┐   │
│  │         Data & Persistence Layer          │             │   │
│  │         ▼                                 ▼             │   │
│  │  ┌─────────────┐                   ┌─────────────┐     │   │
│  │  │  JSON Data  │                   │ LocalForage │     │   │
│  │  │             │                   │  (IndexedDB)│     │   │
│  │  │  • roles    │                   │             │     │   │
│  │  │  • buildings│                   │ • Saves     │     │   │
│  │  │  • techs    │                   │ • Settings  │     │   │
│  │  │  • events   │                   │ • Progress  │     │   │
│  │  │  • policies │                   │             │     │   │
│  │  └─────────────┘                   └─────────────┘     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │         External Services (Optional)                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Ollama    │  │  Wikipedia  │  │  WebSocket  │  │   │
│  │  │     API     │  │     API     │  │   (geplant) │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Verzeichnis-Struktur

```
Kaiser_von_Deutschland/
│
├── src/
│   ├── core/                   # Kern-Spiellogik
│   │   ├── GameEngine.ts       # Zentrale Engine
│   │   ├── Player.ts           # Spieler-Verwaltung
│   │   ├── Kingdom.ts          # Königreich-System
│   │   ├── Economy.ts          # Wirtschafts-Engine
│   │   ├── Events.ts           # Event-System
│   │   ├── RoleSystem.ts       # Rollen-Management
│   │   ├── BuildingSystem.ts   # Gebäude-System
│   │   ├── TechnologySystem.ts # Tech-Tree
│   │   ├── HistoricalEventSystem.ts
│   │   ├── PolicySystem.ts     # Politik-Maßnahmen
│   │   ├── OllamaService.ts    # KI-Integration
│   │   ├── MultiplayerSystem.ts
│   │   ├── WikiIntegration.ts
│   │   └── RegionalSystem.ts
│   │
│   ├── ui/                     # User Interface
│   │   ├── GameUI.ts           # Haupt-UI-Controller
│   │   ├── Graphics.ts         # Canvas-Rendering
│   │   ├── NewFeaturesPanel.ts # Features-Panel
│   │   ├── NotificationSystem.ts
│   │   └── SaveManager.ts
│   │
│   ├── data/                   # Daten & Definitionen
│   │   ├── json/               # JSON-Datenbanken
│   │   │   ├── roles.json
│   │   │   ├── buildings.json
│   │   │   ├── technologies.json
│   │   │   ├── historical-events.json
│   │   │   ├── policy-categories.json
│   │   │   ├── regions.json
│   │   │   └── achievements.json
│   │   └── Titles.ts           # Titel-Definitionen
│   │
│   ├── utils/                  # Hilfsfunktionen
│   │
│   └── main.ts                 # Einstiegspunkt
│
├── public/                     # Statische Assets
├── styles/                     # CSS
├── docs/                       # Dokumentation
├── index.html                  # HTML Entry
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📊 Daten-Architektur

### Daten-Modelle

#### Player

```typescript
interface Player {
  id: string;                    // UUID
  name: string;
  gender: 'male' | 'female';
  kingdomName: string;
  
  // Rolle & Progression
  currentRole: string;           // ID aus roles.json
  prestige: number;
  level: number;
  
  // Ressourcen
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
  luxuryGoods: number;
  
  // Stats
  authority: number;
  popularity: number;
  militaryStrength: number;
  tradePower: number;
  culturalInfluence: number;
  
  // Spieler-Typ
  type: 'human' | 'ai_basic' | 'ai_ollama';
  
  // Erweitert
  activePolicies?: string[];
  researchedTechs?: string[];
  ownedBuildings?: Map<string, number>;
}
```

#### Kingdom

```typescript
interface Kingdom {
  id: string;
  name: string;
  playerId: string;
  
  // Bevölkerung
  population: number;
  farmers: number;
  workers: number;
  merchants: number;
  nobles: number;
  clergy: number;
  scholars: number;
  
  // Statistiken
  happiness: number;
  stability: number;
  corruption: number;
  crime: number;
  
  // Wirtschaft
  taxRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}
```

### JSON-Schema Beispiele

#### Role Definition

```json
{
  "id": "kaiser",
  "name": "Kaiser",
  "nameF": "Kaiserin",
  "rank": 10,
  "category": "imperial",
  "gender": "both",
  "description": "Höchste Macht im Reich",
  "abilities": [
    "Alle Politiken verfügbar",
    "Maximale Autorität",
    "Kann Kriege erklären"
  ],
  "requirements": {
    "prestige": 10000,
    "gold": 100000,
    "authority": 80
  },
  "startingResources": {
    "gold": 50000,
    "food": 10000,
    "prestige": 5000
  }
}
```

#### Building Definition

```json
{
  "id": "castle",
  "name": "Burg",
  "category": "military",
  "era": "medieval",
  "description": "Befestigte Residenz",
  "cost": {
    "gold": 5000,
    "wood": 1000,
    "stone": 2000,
    "land": 10
  },
  "production": {
    "gold": 100,
    "authority": 5
  },
  "effects": {
    "militaryStrength": 50,
    "prestige": 10
  },
  "requirements": {
    "technologies": ["feudalism"],
    "minYear": 800
  }
}
```

---

## 🔄 Komponenten-Übersicht

### Core Systems

#### GameEngine

**Verantwortung**: Zentrale Orchestrierung aller Systeme

**Hauptfunktionen**:
- Initialisierung aller Subsysteme
- Spiel-Loop (monatlich/jährlich)
- Event-Dispatch
- State-Management
- Save/Load-Koordination

**Wichtige Methoden**:
```typescript
class GameEngine {
  // Initialisierung
  constructor(config: GameConfig)
  async initialize()
  
  // Spiel-Control
  async startGame()
  pauseGame()
  resumeGame()
  
  // Zeit-Management
  advanceMonth()
  advanceYear()
  
  // System-Zugriff
  getPolicySystem(): PolicySystem
  getOllamaService(): OllamaService | null
  getMultiplayerSystem(): MultiplayerSystem | null
  
  // Spieler-Management
  addPlayer(config: PlayerConfig): Player
  getPlayer(id: string): Player | null
}
```

#### PolicySystem

**Verantwortung**: Verwaltung von 33 politischen Maßnahmen

**Features**:
- Policy-Enactment mit Bedingungsprüfung
- Sofortige, monatliche, jährliche Effekte
- Konflikt-Auflösung (mutual_exclusive)
- Temporäre vs. permanente Policies
- Kosten-Management

**Kategorien**:
1. Asyl & Migration
2. Inland Economy
3. Foreign Trade
4. Healthcare
5. Social Welfare
6. Social Restriction
7. Social Tensions
8. Urban Development

#### OllamaService

**Verantwortung**: KI-Integration via Ollama

**Features**:
- 6 KI-Modelle mit Persönlichkeiten
- KI als Spieler oder Berater
- Event-Analyse
- Chat-Funktionalität
- Conversation History

**Modelle**:
- Llama2, Mistral, Code Llama
- Neural Chat, Orca Mini, Vicuna

#### MultiplayerSystem

**Verantwortung**: Multiplayer-Funktionalität

**Features**:
- Session-Management
- Spieler-Typen (human, ai_basic, ai_ollama)
- Turn-based & Real-time Modi
- In-Game Chat
- Event-Synchronisation

---

## 🔄 Datenfluss

### Typischer Spiel-Loop

```
1. User Action (UI)
   ↓
2. GameUI Event Handler
   ↓
3. GameEngine Methode
   ↓
4. System-spezifische Logik
   ↓
5. Player/Kingdom State Update
   ↓
6. UI Re-render
   ↓
7. LocalForage Save (optional)
```

### Beispiel: Politik einführen

```typescript
// 1. User klickt "Einführen" im UI
button.onclick = () => {
  
  // 2. UI-Handler ruft GameEngine
  const success = gameEngine
    .getPolicySystem()
    .enactPolicy(
      'public_healthcare',
      player,
      currentYear,
      currentMonth
    );
  
  // 3. PolicySystem prüft Bedingungen
  if (!canEnactPolicy(policy, player, year)) {
    return false;
  }
  
  // 4. Effekte anwenden
  applyImmediateEffects(policy, player);
  player.activePolicies.push(policy.id);
  
  // 5. UI aktualisieren
  gameUI.updatePolicyPanel();
  gameUI.updateStatsDisplay();
  
  // 6. Save
  await saveManager.save();
};
```

### Event-System

```typescript
// Event-Emission
gameEngine.emit('policyEnacted', {
  policyId: 'public_healthcare',
  playerId: player.id
});

// Event-Listener
gameEngine.on('policyEnacted', (data) => {
  console.log(`Policy ${data.policyId} enacted`);
  
  // UI-Update, Benachrichtigung, etc.
  notificationSystem.show(
    `Politik "${policy.name}" eingeführt`,
    'success'
  );
});
```

---

## ⚡ Performance-Optimierungen

### 1. Lazy Loading

```typescript
// Nur laden was benötigt wird
async loadOllamaIfNeeded() {
  if (config.enableOllama && !this.ollamaService) {
    const { OllamaService } = await import('./core/OllamaService');
    this.ollamaService = new OllamaService(config.ollamaUrl);
  }
}
```

### 2. Caching

```typescript
// Wikipedia-Artikel cachen
private articleCache = new Map<string, WikiArticle>();

async getArticle(title: string): Promise<WikiArticle> {
  if (this.articleCache.has(title)) {
    return this.articleCache.get(title)!;
  }
  
  const article = await fetchFromWikipedia(title);
  this.articleCache.set(title, article);
  return article;
}
```

### 3. Debouncing

```typescript
// UI-Updates debounced
private updateDebounced = debounce(() => {
  this.render();
}, 100);
```

### 4. Virtual Scrolling

```typescript
// Große Listen effizient rendern
renderBuildingList(buildings: Building[]) {
  const visible = buildings.slice(
    scrollTop / itemHeight,
    scrollTop / itemHeight + visibleCount
  );
  
  return visible.map(building => 
    this.renderBuildingCard(building)
  );
}
```

---

## 🔌 Erweiterbarkeit

### Neues System hinzufügen

1. **Erstellen Sie das System**:
```typescript
// src/core/NewSystem.ts
export class NewSystem {
  constructor(private gameEngine: GameEngine) {}
  
  public doSomething(): void {
    // Implementation
  }
}
```

2. **Integration in GameEngine**:
```typescript
// src/core/GameEngine.ts
private newSystem: NewSystem;

constructor(config) {
  // ...
  this.newSystem = new NewSystem(this);
}

public getNewSystem(): NewSystem {
  return this.newSystem;
}
```

3. **Optional: UI-Integration**:
```typescript
// src/ui/GameUI.ts
private renderNewSystemPanel(): void {
  const system = this.engine.getNewSystem();
  // Render UI
}
```

### Neue Daten hinzufügen

Alle Content-Erweiterungen benötigen **keine Code-Änderungen**:

- **Neue Rolle**: `src/data/json/roles.json` bearbeiten
- **Neues Gebäude**: `src/data/json/buildings.json` bearbeiten
- **Neue Technologie**: `src/data/json/technologies.json` bearbeiten
- **Neues Event**: `src/data/json/historical-events.json` bearbeiten

### Plugin-System (Zukunft)

Geplant für v3.0.0:

```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(engine: GameEngine): void;
  onMonthEnd?(): void;
  onYearEnd?(): void;
}

gameEngine.loadPlugin(new MyCustomPlugin());
```

---

## 🧪 Testing-Strategie

### Unit Tests

```typescript
// src/core/Player.test.ts
import { describe, it, expect } from 'vitest';
import { Player } from './Player';

describe('Player', () => {
  it('should initialize with correct defaults', () => {
    const player = new Player({
      name: 'Test',
      gender: 'male',
      kingdomName: 'Testland'
    });
    
    expect(player.gold).toBeGreaterThan(0);
    expect(player.prestige).toBe(0);
  });
});
```

### Integration Tests

Testen von System-Interaktionen:
```typescript
describe('PolicySystem Integration', () => {
  it('should affect player stats when policy enacted', () => {
    const engine = new GameEngine(config);
    const player = engine.addPlayer(playerConfig);
    const policySystem = engine.getPolicySystem();
    
    const initialGold = player.gold;
    policySystem.enactPolicy('free_market', player, 1800, 1);
    
    expect(player.gold).toBeGreaterThan(initialGold);
  });
});
```

---

## 🧬 Version 2.1.5 - Bevölkerungsdynamik

### Neue Systeme

#### CitizenSystem

Verwaltet individuelle Bürger mit:
- Eindeutige IDs für jeden Bürger
- Name, Alter, Geschlecht, Beruf
- Familienbeziehungen und Dynastien
- Soziale Beziehungen (Freunde, Feinde)
- Gesundheit und Bedürfnisse
- Persönlichkeitsmerkmale und Fähigkeiten
- Spieler-Kontrolle (Multiplayer-Ready)

**Architektur-Pattern**: Repository-Pattern mit Maps für schnellen Zugriff

```typescript
class CitizenSystem {
  private citizens: Map<string, Citizen>;
  private families: Map<string, Set<string>>;
  private regionalCitizens: Map<string, Set<string>>;
  
  // O(1) Zugriff auf Bürger
  getCitizen(id: string): Citizen | undefined
  
  // Effiziente regionale Abfragen
  getCitizensByRegion(regionId: string): Citizen[]
}
```

#### DemographicSystem

Simuliert demografische Prozesse:
- Realistische Geburten- und Sterberaten
- Alterspyramiden mit Generationeneffekten
- Epidemien mit individueller Krankheitsverbreitung
- Hungersnöte mit regionalen Unterschieden
- Lebenserwartungs-Berechnungen

**Architektur-Pattern**: Service-Pattern mit monatlicher Verarbeitung

```typescript
class DemographicSystem {
  processMonth(citizenSystem, year, month): void {
    this.processBirths(...);
    this.processDeaths(...);
    this.processDiseases(...);
    this.processFamines(...);
  }
}
```

#### SocialNetworkSystem

Verwaltet soziale Netzwerke:
- Freundschaften und Feindschaften
- Informationsverbreitung (Gerüchte, Nachrichten)
- Soziale Bewegungen und Revolutionen
- Spieler können Bewegungen anführen

**Architektur-Pattern**: Graph-basiert mit Event-Propagation

```typescript
class SocialNetworkSystem {
  private messages: Map<string, Message>;
  private movements: Map<string, SocialMovement>;
  
  // Verbreitet Nachrichten durch soziales Netzwerk
  processInformationSpread(...): void
  
  // Rekrutiert Mitglieder basierend auf Persönlichkeit
  joinMovement(movement, citizen): boolean
}
```

#### PopulationVisualization (PixiJS)

Visualisiert Bevölkerungsdaten:
- Alterspyramiden mit interaktiven Grafiken
- Bürger-Karten mit Echtzeit-Updates
- Interaktive Tooltips
- Responsive Design

**Architektur-Pattern**: Observer-Pattern mit PixiJS Rendering

```typescript
class PopulationVisualization {
  private app: PIXI.Application;
  private citizenSprites: Map<string, PIXI.Graphics>;
  
  renderAgePyramid(pyramid): void
  renderCitizenMap(citizenSystem, regionId?): void
  update(citizenSystem): void  // Aktualisiert nur Änderungen
}
```

### Integration in GameEngine

```typescript
class GameEngine {
  private citizenSystem: CitizenSystem;
  private demographicSystem: DemographicSystem;
  private socialNetworkSystem: SocialNetworkSystem;
  
  private monthlyTick(): void {
    // ... existing code ...
    
    // Neue Bevölkerungssysteme
    this.citizenSystem.processMonth(year, month);
    this.demographicSystem.processMonth(
      this.citizenSystem, year, month
    );
    this.socialNetworkSystem.processInformationSpread(
      this.citizenSystem, year, month
    );
  }
}
```

### Performance-Optimierungen

#### Für große Bevölkerungen (100k+ Bürger):

1. **Spatial Hashing** (geplant):
```typescript
// Organisiere Bürger in räumlichen Grids
private citizenGrid: Map<string, Set<string>>;  // gridKey -> citizenIds
```

2. **Lazy Loading**:
```typescript
// Lade nur sichtbare Bürger
getCitizensInViewport(x, y, width, height): Citizen[]
```

3. **Batched Updates**:
```typescript
// Aktualisiere Bürger in Batches
processBatch(citizens: Citizen[], batchSize = 100): void
```

4. **Web Workers** (geplant):
```typescript
// Schwere Berechnungen in Worker
worker.postMessage({ 
  type: 'calculateDemographics', 
  citizens 
});
```

### Datenfluss

```
┌─────────────┐
│  GameEngine │
└──────┬──────┘
       │
       ├─────► CitizenSystem
       │       ├─ createCitizen()
       │       ├─ processMonth()
       │       └─ assignPlayerControl()
       │
       ├─────► DemographicSystem
       │       ├─ calculateStatistics()
       │       ├─ processBirths()
       │       ├─ processDeaths()
       │       └─ processDiseases()
       │
       └─────► SocialNetworkSystem
               ├─ createFriendship()
               ├─ processInformationSpread()
               └─ processMovements()
```

### Multiplayer-Integration

```typescript
// Spieler kann jeden Bürger übernehmen
citizenSystem.assignPlayerControl(citizenId, playerId);

// Spieler führt soziale Bewegung an
socialNetworkSystem.assignPlayerLeadership(movementId, playerId);

// Kooperative Seuchenbekämpfung (geplant)
demographicSystem.startEpidemicControl(diseaseId, [player1, player2]);
```

---

## 📚 Weitere Ressourcen

- **[API-Referenz](API_REFERENCE.md)** - Detaillierte API-Dokumentation
- **[Bevölkerungs-API](POPULATION_API.md)** - Population Dynamics API (NEU)
- **[Benutzerhandbuch](USER_GUIDE.md)** - Spielanleitung
- **[Roadmap](ROADMAP.md)** - Geplante Features
- **[Contributing](../CONTRIBUTING.md)** - Beitrags-Richtlinien

---

**Letzte Aktualisierung**: Dezember 2025  
**Version**: 2.1.5

_Entwickelt mit ❤️ für Geschichts- und Strategiespiel-Fans_
