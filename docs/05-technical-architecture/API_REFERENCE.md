# 📚 Kaiser von Deutschland - API-Referenz

**Version**: 2.0.0  
**Letzte Aktualisierung**: Dezember 2025

Diese Dokumentation beschreibt die öffentlichen APIs aller Hauptsysteme für Entwickler.

---

## 📋 Inhaltsverzeichnis

1. [GameEngine](#gameengine)
2. [Player](#player)
3. [Kingdom](#kingdom)
4. [PolicySystem](#policysystem)
5. [BuildingSystem](#buildingsystem)
6. [TechnologySystem](#technologysystem)
7. [OllamaService](#ollamaservice)
8. [MultiplayerSystem](#multiplayersystem)
9. [WikiIntegration](#wikiintegration)
10. [Events](#events)

---

## GameEngine

Zentrale Engine-Klasse, die alle Systeme orchestriert.

### Constructor

```typescript
constructor(config?: GameConfig)
```

**Parameter**:
- `config` (optional): Spiel-Konfiguration

**Config-Optionen**:
```typescript
interface GameConfig {
  maxPlayers?: number;           // Standard: 1
  difficulty?: number;            // 1-3, Standard: 2
  gameSpeed?: number;            // 0.5-2.0, Standard: 1
  enableMultiplayer?: boolean;   // Standard: false
  randomEvents?: boolean;        // Standard: true
  startingYear?: number;         // Standard: 1200
  enableOllama?: boolean;        // Standard: false
  ollamaUrl?: string;           // Standard: 'http://localhost:11434'
  enableWiki?: boolean;         // Standard: false
}
```

### Initialisierung

```typescript
async initialize(): Promise<void>
```

Initialisiert alle Subsysteme. Muss vor `startGame()` aufgerufen werden.

### Spiel-Steuerung

```typescript
async startGame(): Promise<void>
pauseGame(): void
resumeGame(): void
resetGame(): void
```

### Zeit-Management

```typescript
advanceMonth(): void
advanceYear(): void
getCurrentDate(): { year: number; month: number }
```

### Spieler-Management

```typescript
addPlayer(config: PlayerConfig): Player
getPlayer(id: string): Player | null
getAllPlayers(): Player[]
removePlayer(id: string): void
```

**PlayerConfig**:
```typescript
interface PlayerConfig {
  name: string;
  gender: 'male' | 'female';
  kingdomName: string;
  startingRole?: string;      // Standard: 'arbeiter'
  type?: 'human' | 'ai_basic' | 'ai_ollama';
}
```

### System-Zugriff

```typescript
getPolicySystem(): PolicySystem
getBuildingSystem(): BuildingSystem
getTechnologySystem(): TechnologySystem
getOllamaService(): OllamaService | null
getMultiplayerSystem(): MultiplayerSystem | null
getWikiIntegration(): WikiIntegration | null
getRoleSystem(): RoleSystem
getHistoricalEventSystem(): HistoricalEventSystem
```

### Ollama aktivieren

```typescript
enableOllama(config: OllamaConfig): void
```

**OllamaConfig**:
```typescript
interface OllamaConfig {
  baseUrl: string;              // z.B. 'http://localhost:11434'
  model?: string;               // Standard: 'llama2'
  temperature?: number;         // 0-1, Standard: 0.7
  maxTokens?: number;          // Standard: 500
}
```

### Beispiel

```typescript
// Engine erstellen
const engine = new GameEngine({
  maxPlayers: 4,
  difficulty: 2,
  enableMultiplayer: true,
  enableOllama: true,
  enableWiki: true
});

// Initialisieren
await engine.initialize();

// Spieler hinzufügen
const player = engine.addPlayer({
  name: 'Heinrich',
  gender: 'male',
  kingdomName: 'Germania'
});

// Spiel starten
await engine.startGame();

// Monat vorrücken
engine.advanceMonth();
```

---

## Player

Repräsentiert einen Spieler im Spiel.

### Eigenschaften

```typescript
class Player {
  // Identifikation
  readonly id: string;
  name: string;
  gender: 'male' | 'female';
  kingdomName: string;
  
  // Rolle & Level
  currentRole: string;
  prestige: number;
  level: number;
  experience: number;
  
  // Ressourcen
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
  luxuryGoods: number;
  land: number;
  
  // Attribute
  authority: number;
  popularity: number;
  militaryStrength: number;
  tradePower: number;
  culturalInfluence: number;
  
  // Spieler-Typ
  type: 'human' | 'ai_basic' | 'ai_ollama';
  
  // Erweitert
  activePolicies: string[];
  researchedTechnologies: string[];
  ownedBuildings: Map<string, number>;
}
```

### Methoden

```typescript
// Ressourcen
addGold(amount: number): void
removeGold(amount: number): boolean
addResource(type: ResourceType, amount: number): void
hasResources(cost: ResourceCost): boolean

// Rolle
canUpgradeToRole(roleId: string): boolean
upgradeRole(roleId: string): boolean

// Statistiken
modifyAuthority(amount: number): void
modifyPopularity(amount: number): void
modifyPrestige(amount: number): void

// Serialisierung
toJSON(): object
static fromJSON(data: object): Player
```

### Beispiel

```typescript
const player = engine.getPlayer('player-123');

// Ressourcen verwalten
player.addGold(1000);
if (player.hasResources({ gold: 500, wood: 100 })) {
  player.removeGold(500);
}

// Rolle upgraden
if (player.canUpgradeToRole('minister')) {
  player.upgradeRole('minister');
}

// Stats modifizieren
player.modifyPrestige(50);
player.modifyAuthority(10);
```

---

## Kingdom

Verwaltet das Königreich eines Spielers.

### Eigenschaften

```typescript
class Kingdom {
  readonly id: string;
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
  unemployed: number;
  
  // Statistiken
  happiness: number;          // 0-100
  stability: number;          // 0-100
  corruption: number;         // 0-100
  crime: number;             // 0-100
  
  // Wirtschaft
  taxRate: number;           // 0-1 (Prozent)
  monthlyIncome: number;
  monthlyExpenses: number;
}
```

### Methoden

```typescript
// Bevölkerung
addPopulation(type: PopulationType, amount: number): void
getPopulationGrowthRate(): number
calculateTotalPopulation(): number

// Wirtschaft
calculateMonthlyIncome(): number
calculateMonthlyExpenses(): number
setTaxRate(rate: number): void

// Statistiken
modifyHappiness(amount: number): void
modifyStability(amount: number): void
```

---

## PolicySystem

Verwaltet 33 politische Maßnahmen in 8 Kategorien.

### Methoden

```typescript
// Politik einführen
enactPolicy(
  policyId: string,
  player: Player,
  year: number,
  month: number
): boolean

// Politik widerrufen
repealPolicy(
  policyId: string,
  player: Player,
  year: number
): boolean

// Verfügbarkeit prüfen
getAvailablePolicies(
  player: Player,
  year: number
): Policy[]

canEnactPolicy(
  policy: Policy,
  player: Player,
  year: number
): boolean

// Aktive Politiken
getActivePolicies(playerId: string): Policy[]
isPolicyActive(playerId: string, policyId: string): boolean

// Kategorien
getPoliciesByCategory(category: PolicyCategory): Policy[]
getAllCategories(): PolicyCategory[]

// Effekte anwenden
applyMonthlyEffects(player: Player): void
applyYearlyEffects(player: Player): void
```

### Policy-Struktur

```typescript
interface Policy {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  
  // Verfügbarkeit
  minYear: number;
  maxYear?: number;
  
  // Kosten
  enactmentCost?: {
    gold?: number;
    authority?: number;
    // ...
  };
  monthlyCost?: {
    gold?: number;
  };
  
  // Voraussetzungen
  requirements?: {
    authority?: number;
    gold?: number;
    buildings?: { [key: string]: number };
    // ...
  };
  
  // Effekte
  immediateEffects?: PolicyEffect;
  monthlyEffects?: PolicyEffect;
  yearlyEffects?: PolicyEffect;
  
  // Konflikte
  mutualExclusive?: string[];  // IDs konfligierender Policies
  
  // Dauer
  duration?: number;  // Monate (undefined = permanent)
}
```

### Beispiel

```typescript
const policySystem = engine.getPolicySystem();

// Verfügbare Politiken abrufen
const available = policySystem.getAvailablePolicies(player, 1900);

// Politik einführen
const success = policySystem.enactPolicy(
  'public_healthcare',
  player,
  1900,
  1
);

if (success) {
  console.log('Öffentliches Gesundheitswesen eingeführt');
}

// Aktive Politiken prüfen
const active = policySystem.getActivePolicies(player.id);

// Monatliche Effekte anwenden (automatisch von Engine)
policySystem.applyMonthlyEffects(player);
```

---

## BuildingSystem

Verwaltet 23 Gebäudetypen.

### Methoden

```typescript
// Gebäude bauen
buildBuilding(
  buildingId: string,
  quantity: number,
  player: Player,
  year: number
): boolean

// Gebäude verkaufen/abreißen
demolishBuilding(
  buildingId: string,
  quantity: number,
  player: Player
): boolean

// Verfügbarkeit
getAvailableBuildings(
  player: Player,
  year: number
): Building[]

canBuild(
  building: Building,
  player: Player,
  year: number
): boolean

// Informationen
getBuilding(id: string): Building | null
getBuildingsByCategory(category: string): Building[]
getBuildingsByEra(era: string): Building[]

// Produktion
calculateBuildingProduction(
  buildingId: string,
  quantity: number
): Production

// Empfehlungen
recommendBuildings(
  player: Player,
  year: number,
  count?: number
): Building[]
```

### Building-Struktur

```typescript
interface Building {
  id: string;
  name: string;
  category: BuildingCategory;
  era: Era;
  description: string;
  
  // Kosten
  cost: {
    gold: number;
    wood?: number;
    stone?: number;
    iron?: number;
    land?: number;
  };
  
  // Voraussetzungen
  requirements?: {
    technologies?: string[];
    buildings?: { [key: string]: number };
    minYear?: number;
    maxYear?: number;
  };
  
  // Produktion
  production?: {
    gold?: number;
    food?: number;
    // ...
  };
  
  // Effekte
  effects?: {
    militaryStrength?: number;
    prestige?: number;
    // ...
  };
  
  // Wartung
  maintenance?: {
    gold?: number;
    // ...
  };
}
```

### Beispiel

```typescript
const buildingSystem = engine.getBuildingSystem();

// Verfügbare Gebäude
const buildings = buildingSystem.getAvailableBuildings(player, 1800);

// Gebäude bauen
if (buildingSystem.canBuild(building, player, 1800)) {
  buildingSystem.buildBuilding('farm', 5, player, 1800);
}

// Produktion berechnen
const production = buildingSystem.calculateBuildingProduction(
  'market',
  3
);

console.log(`3 Märkte produzieren ${production.gold} Gold/Monat`);

// Empfehlungen
const recommended = buildingSystem.recommendBuildings(player, 1800, 5);
```

---

## TechnologySystem

Verwaltet 24 Technologien im Tech-Tree.

### Methoden

```typescript
// Forschung
researchTechnology(
  techId: string,
  player: Player
): boolean

isResearching(playerId: string, techId: string): boolean

advanceResearch(
  playerId: string,
  techId: string,
  progress: number
): void

// Verfügbarkeit
getAvailableTechnologies(player: Player): Technology[]

canResearch(
  tech: Technology,
  player: Player
): boolean

// Informationen
getTechnology(id: string): Technology | null
getTechnologiesByCategory(category: string): Technology[]
getResearchedTechnologies(playerId: string): Technology[]

// Tech-Tree
getTechTree(): TechTreeNode[]
getPrerequisites(techId: string): Technology[]
getUnlockedBuildings(techId: string): string[]
```

### Technology-Struktur

```typescript
interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  era: Era;
  description: string;
  
  // Kosten
  researchCost: number;        // Gold
  researchTime: number;        // Monate
  
  // Voraussetzungen
  prerequisites?: string[];    // Tech-IDs
  
  // Effekte
  effects?: {
    goldBonus?: number;        // Prozent
    productionBonus?: number;
    // ...
  };
  
  // Freischaltungen
  unlocksBuildings?: string[]; // Building-IDs
  unlocksPolicies?: string[];  // Policy-IDs
}
```

### Beispiel

```typescript
const techSystem = engine.getTechnologySystem();

// Verfügbare Technologien
const available = techSystem.getAvailableTechnologies(player);

// Forschung starten
if (techSystem.canResearch(tech, player)) {
  techSystem.researchTechnology('steam_power', player);
}

// Tech-Tree anzeigen
const tree = techSystem.getTechTree();

// Freigeschaltete Gebäude
const buildings = techSystem.getUnlockedBuildings('iron_working');
```

---

## OllamaService

KI-Integration mit 6 Modellen.

### Methoden

```typescript
// Verfügbarkeit
async isAvailable(): Promise<boolean>

// Modell-Verwaltung
setModel(model: OllamaModel): void
getModel(): OllamaModel
getAvailableModels(): OllamaModel[]

// KI als Spieler
async getAIPlayerDecision(
  player: Player,
  context: GameContext
): Promise<AIDecision>

// KI als Berater
async getAdvisorSuggestion(
  player: Player,
  category: 'economy' | 'military' | 'diplomacy' | 'culture'
): Promise<AdvisorSuggestion[]>

// Event-Analyse
async analyzeEvent(
  player: Player,
  event: GameEvent
): Promise<EventAnalysis>

// Chat
async chat(
  message: string,
  context?: ChatContext
): Promise<string>

// Konfiguration
configure(config: OllamaConfig): void
```

### Typen

```typescript
interface AIDecision {
  action: 'build' | 'research' | 'policy' | 'trade' | 'military' | 'wait';
  target?: string;           // ID des Ziels
  reasoning: string;
  confidence: number;        // 0-1
}

interface AdvisorSuggestion {
  category: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  expectedOutcome: string;
}

interface EventAnalysis {
  analysis: string;
  recommendedChoice?: string;
  reasoning: string;
  riskAssessment: 'low' | 'medium' | 'high';
}

type OllamaModel = 
  | 'llama2' 
  | 'mistral' 
  | 'codellama' 
  | 'neural-chat' 
  | 'orca-mini' 
  | 'vicuna';
```

### Beispiel

```typescript
const ollama = engine.getOllamaService();

// Verfügbarkeit prüfen
if (await ollama.isAvailable()) {
  
  // KI-Entscheidung abrufen
  const decision = await ollama.getAIPlayerDecision(player, {
    year: 1800,
    month: 6,
    availableActions: ['build', 'research', 'policy']
  });
  
  console.log(`KI empfiehlt: ${decision.action} - ${decision.reasoning}`);
  
  // Berater nutzen
  const suggestions = await ollama.getAdvisorSuggestion(player, 'economy');
  
  for (const suggestion of suggestions) {
    console.log(`${suggestion.priority}: ${suggestion.suggestion}`);
  }
  
  // Chat
  const response = await ollama.chat('Was sollte ich als nächstes tun?');
  console.log(response);
}
```

---

## MultiplayerSystem

Multiplayer-Framework für bis zu 6 Spieler.

### Methoden

```typescript
// Session-Management
async createSession(
  config: SessionConfig,
  host: PlayerInfo
): Promise<MultiplayerSession>

async joinSession(
  sessionId: string,
  player: PlayerInfo,
  password?: string
): Promise<boolean>

leaveSession(): void

// Session-Info
getCurrentSession(): MultiplayerSession | null
getPlayers(): PlayerInfo[]
isHost(): boolean

// Spiel-Control
isMyTurn(): boolean
endTurn(): void
setReady(ready: boolean): void

// KI-Spieler
addAIPlayer(
  type: 'ai_basic' | 'ai_ollama',
  config?: AIPlayerConfig
): void

removeAIPlayer(playerId: string): void

// Chat
sendChatMessage(
  message: string,
  isPrivate?: boolean,
  recipientId?: string
): ChatMessage

getChatHistory(limit?: number): ChatMessage[]

sendSystemMessage(message: string): void

// Events
on(event: MultiplayerEvent, handler: Function): void
off(event: MultiplayerEvent, handler: Function): void
```

### Typen

```typescript
interface SessionConfig {
  maxPlayers: number;        // 2-6
  allowAI: boolean;
  allowOllama: boolean;
  turnBased: boolean;
  requirePassword: boolean;
  password?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  type: 'human' | 'ai_basic' | 'ai_ollama';
  ollamaModel?: string;
  isReady?: boolean;
  isHost?: boolean;
}

interface MultiplayerSession {
  id: string;
  hostId: string;
  players: PlayerInfo[];
  config: SessionConfig;
  currentTurn?: string;      // Player-ID
  status: 'lobby' | 'playing' | 'paused' | 'ended';
}

type MultiplayerEvent = 
  | 'playerJoined'
  | 'playerLeft'
  | 'chatMessage'
  | 'turnChanged'
  | 'gameStarted'
  | 'gameEnded';
```

### Beispiel

```typescript
const mp = engine.getMultiplayerSystem();

// Session erstellen
const session = await mp.createSession(
  {
    maxPlayers: 4,
    allowAI: true,
    turnBased: false
  },
  {
    id: 'player1',
    name: 'Heinrich',
    type: 'human'
  }
);

// Anderen Spieler beitreten lassen
await mp.joinSession(session.id, {
  id: 'player2',
  name: 'Friedrich',
  type: 'human'
});

// KI hinzufügen
mp.addAIPlayer('ai_ollama', {
  name: 'KI Kaiser',
  ollamaModel: 'mistral'
});

// Chat
mp.sendChatMessage('Hallo zusammen!');

// Events
mp.on('chatMessage', (msg) => {
  console.log(`${msg.senderName}: ${msg.message}`);
});

mp.on('playerJoined', (player) => {
  console.log(`${player.name} ist beigetreten`);
});
```

---

## WikiIntegration

Wikipedia-Anbindung für historische Informationen.

### Methoden

```typescript
// Artikel
async getArticle(title: string): Promise<WikiArticle | null>

async search(
  query: string,
  limit?: number
): Promise<WikiSearchResult[]>

// Event-Integration
async getEventWiki(
  eventId: string,
  eventTitle: string,
  year: number
): Promise<EventWiki | null>

async enrichEventDescription(
  eventTitle: string,
  description: string,
  year: number
): Promise<string>

// Verwandte Artikel
async getRelatedArticles(
  title: string,
  limit?: number
): Promise<string[]>

// Themen-Vorschläge
suggestTopics(context: GameContext): string[]

// Cache
getCacheStats(): CacheStats
clearCache(): void
```

### Typen

```typescript
interface WikiArticle {
  title: string;
  extract: string;          // Zusammenfassung
  url: string;
  thumbnail?: string;       // Bild-URL
  categories?: string[];
}

interface WikiSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

interface EventWiki {
  eventId: string;
  wikiArticles: WikiArticle[];
  relatedTopics: string[];
  lastUpdated: number;
}

interface CacheStats {
  articlesInCache: number;
  eventsInCache: number;
}
```

### Beispiel

```typescript
const wiki = engine.getWikiIntegration();

// Artikel abrufen
const article = await wiki.getArticle('Französische Revolution');
if (article) {
  console.log(article.extract);
  console.log(article.url);
}

// Suche
const results = await wiki.search('Napoleon', 5);

// Event anreichern
const enriched = await wiki.enrichEventDescription(
  'Schwarzer Tod',
  'Die Pest wütet in Europa',
  1347
);

// Themen-Vorschläge
const topics = wiki.suggestTopics({
  year: 1800,
  playerRole: 'kaiser',
  recentEvents: ['french_revolution']
});

console.log('Vorgeschlagene Themen:', topics);
```

---

## Events

Event-System für lose Kopplung.

### GameEngine Events

```typescript
// Event-Types
type GameEvent = 
  | 'gameStarted'
  | 'gamePaused'
  | 'gameResumed'
  | 'monthAdvanced'
  | 'yearAdvanced'
  | 'playerAdded'
  | 'playerRemoved'
  | 'policyEnacted'
  | 'policyRepealed'
  | 'buildingBuilt'
  | 'technologyResearched'
  | 'historicalEventTriggered';

// Listener registrieren
engine.on('monthAdvanced', (data) => {
  console.log(`Monat ${data.month} in Jahr ${data.year}`);
});

engine.on('policyEnacted', (data) => {
  console.log(`Politik ${data.policyId} eingeführt`);
});

// Listener entfernen
engine.off('monthAdvanced', handler);
```

### Custom Events

```typescript
// Eigene Events emittieren
engine.emit('customEvent', {
  type: 'achievement',
  data: { achievement: 'first_castle' }
});

// Event abfangen
engine.on('customEvent', (payload) => {
  if (payload.type === 'achievement') {
    showAchievement(payload.data.achievement);
  }
});
```

---

## 🔧 Utilities

Hilfsfunktionen im `utils/` Verzeichnis.

```typescript
// Zufallszahlen
function randomInt(min: number, max: number): number
function randomFloat(min: number, max: number): number
function randomChoice<T>(array: T[]): T

// Formatierung
function formatNumber(num: number): string
function formatGold(gold: number): string
function formatDate(year: number, month: number): string

// Validierung
function isValidEmail(email: string): boolean
function isValidUsername(username: string): boolean

// Debouncing
function debounce(fn: Function, delay: number): Function
function throttle(fn: Function, limit: number): Function
```

---

## 📝 Hinweise

### TypeScript-Typen

Alle APIs sind vollständig typisiert. Nutzen Sie die Auto-Completion Ihres Editors.

### Asynchrone Operationen

Viele Methoden sind `async` und geben `Promise` zurück. Verwenden Sie `await` oder `.then()`.

### Fehlerbehandlung

```typescript
try {
  await engine.initialize();
  const success = policySystem.enactPolicy('...', player, year, month);
  
  if (!success) {
    console.error('Konnte Politik nicht einführen');
  }
} catch (error) {
  console.error('Fehler:', error);
}
```

### Serialisierung

Die meisten Objekte haben `toJSON()` und `fromJSON()` Methoden für Speicherung.

---

## 📚 Weitere Ressourcen

- **[Architektur](ARCHITECTURE.md)** - System-Design
- **[Benutzerhandbuch](USER_GUIDE.md)** - Spielanleitung
- **[Neue Features](NEW_FEATURES.md)** - Detaillierte Feature-Docs
- **[Roadmap](ROADMAP.md)** - Geplante Features

---

**Letzte Aktualisierung**: Dezember 2025  
**Version**: 2.0.0

_Entwickelt mit ❤️ für Geschichts- und Strategiespiel-Fans_
