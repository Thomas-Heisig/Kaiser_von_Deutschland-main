# Kaiser von Deutschland - Neue Features Dokumentation

## Übersicht

Diese Dokumentation beschreibt die neuen, erweiterten Funktionen des Spiels "Kaiser von Deutschland", die eine deutlich umfangreichere und modernere Spielerfahrung ermöglichen.

---

## 📋 Inhaltsverzeichnis

1. [Politik-System](#politik-system)
2. [Ollama AI Integration](#ollama-ai-integration)
3. [Multiplayer-System](#multiplayer-system)
4. [Wikipedia-Integration](#wikipedia-integration)
5. [Installation und Konfiguration](#installation-und-konfiguration)

---

## 🏛️ Politik-System

### Überblick

Das neue Politik-System ermöglicht es Spielern, verschiedene politische Maßnahmen zu ergreifen, die sich auf ihr Königreich auswirken. Das System ist vollständig modular aufgebaut und kann einfach erweitert werden.

### Kategorien

#### 1. **Asyl und Zuwanderung** 🌍
Steuert den Umgang mit Migration und Flüchtlingen.

**Verfügbare Politiken:**
- **Offene Grenzen** (ab 1800)
  - Freie Einwanderung ohne Beschränkungen
  - +2% Bevölkerungswachstum
  - +20 Bauern/Monat, +5 Händler/Monat
  - -10 Popularität, +5 Prestige
  - +1% Kriminalität/Monat

- **Kontrollierte Einwanderung** (ab 1850)
  - Geregelte, qualifikationsbasierte Einwanderung
  - +5 Bauern/Monat, +3 Händler/Monat
  - +0.5 Handelsmacht/Monat
  - Kosten: 100 Gold/Monat
  - Benötigt: 50 Autorität, 10.000 Gold

- **Geschlossene Grenzen** (ab 1700)
  - Starke Einschränkung der Einwanderung
  - +15 Autorität, -20 Popularität, -10 Prestige
  - -10 Zufriedenheit sofort
  - -0.5% Bevölkerungswachstum/Monat

- **Asylrecht** (ab 1900)
  - Schutz für politisch Verfolgte
  - +20 Prestige, +5 Popularität
  - +3 Bauern/Monat
  - Kosten: 200 Gold/Monat

#### 2. **Wirtschaft - Inland** 💰

**Innenpolitische Wirtschaftsmaßnahmen:**

- **Freie Marktwirtschaft** (ab 1776)
  - Minimale staatliche Eingriffe
  - +500 Gold/Monat
  - +10 Handelsmacht
  - +5 Händler/Monat, +2 Arbeitslose/Monat

- **Planwirtschaft** (ab 1917)
  - Staatliche Kontrolle über Wirtschaft
  - +100 Nahrung/Monat
  - -2 Handelsmacht/Monat
  - -5 Arbeitslose/Monat
  - -15 Zufriedenheit, +20 Autorität

- **Progressive Besteuerung** (ab 1850)
  - Höhere Steuern für Reiche
  - +800 Gold/Monat
  - +15 Popularität, +10 Zufriedenheit
  - -1 Adlige/Monat

- **Mindestlohn** (ab 1894)
  - Gesetzlicher Mindestlohn
  - +20 Popularität, +15 Zufriedenheit
  - -300 Gold/Monat
  - +3 Arbeitslose/Monat

#### 3. **Wirtschaft - Außenhandel** 🚢

**Außenwirtschaftspolitik:**

- **Freihandel** (ab 1800)
  - Keine Handelsbeschränkungen
  - +600 Gold/Monat, +10 Luxusgüter/Monat
  - +20 Handelsmacht, +10 Prestige

- **Protektionismus** (ab 1700)
  - Hohe Zölle zum Schutz heimischer Industrie
  - +400 Gold/Monat, +3 Händler/Monat
  - -5 Handelsmacht, +10 Autorität

- **Handelsembargo** (ab 1600)
  - Handelsverbot mit bestimmten Nationen
  - -500 Gold/Monat, -5 Luxusgüter/Monat
  - -10 Handelsmacht
  - +15 Autorität, -10 Prestige

- **Kolonialhandel** (ab 1500, bis 1960)
  - Ausbeutung von Kolonien
  - +1000 Gold/Monat, +20 Luxusgüter/Monat
  - +1% Korruption/Monat
  - Benötigt: 100 Prestige, 60 Autorität

#### 4. **Gesundheit** 🏥

**Gesundheitspolitik:**

- **Öffentliches Gesundheitswesen** (ab 1883)
  - Kostenlose medizinische Versorgung
  - +20 Zufriedenheit, +25 Popularität
  - +0.5% Bevölkerungswachstum/Monat
  - Kosten: 500 Gold/Monat
  - Benötigt: 3 Hospitäler, 30.000 Gold

- **Impfpflicht** (ab 1850)
  - Verpflichtende Impfungen
  - +10 Autorität, -5 Popularität
  - +0.3% Bevölkerungswachstum/Monat
  - Kosten: 300 Gold/Monat

- **Quarantäne-Protokolle** (ab 1600)
  - Isolation bei Krankheitsausbrüchen
  - +15 Autorität
  - Einmalige Kosten: 5000 Gold, -10 Popularität

- **Gesundheitsaufklärung** (ab 1900)
  - Programme zur Gesundheitsbildung
  - +10 Popularität
  - +0.2% Bevölkerungswachstum/Monat
  - Kosten: 200 Gold/Monat
  - Benötigt: 2 Schulen

#### 5. **Soziales - Förderung** 🤝

**Positive soziale Programme:**

- **Öffentliche Bildung** (ab 1717)
  - Kostenlose Bildung für alle Kinder
  - +15 Zufriedenheit, +20 Popularität
  - Kosten: 300 Gold/Monat
  - Benötigt: 2 Schulen, 15.000 Gold

- **Sozialfürsorge** (ab 1889)
  - Unterstützung für Bedürftige
  - +25 Zufriedenheit, +30 Popularität
  - -3 Arbeitslose/Monat
  - Kosten: 400 Gold/Monat
  - Benötigt: 25.000 Gold

- **Arbeiterrechte** (ab 1870)
  - Schutz durch Gesetze und Gewerkschaften
  - +20 Zufriedenheit, +25 Popularität, -5 Autorität
  - Kosten: 200 Gold/Monat

- **Gleichstellung** (ab 1900)
  - Geschlechtergleichberechtigung
  - +15 Zufriedenheit, +15 Prestige, +20 Popularität
  - +2 Händler/Monat, +1 Gelehrte/Monat

#### 6. **Soziales - Restriktion** ⛓️

**Restriktive Maßnahmen:**

- **Zwangsarbeit** (bis 1950)
  - Erzwungene Arbeit
  - -40 Zufriedenheit, +20 Autorität
  - -30 Prestige, -40 Popularität
  - +300 Gold/Monat, -10 Arbeitslose/Monat
  - -2 Stabilität/Monat

- **Zensur** (ab 1400)
  - Kontrolle von Informationen
  - +15 Autorität, -20 Popularität, -10 Prestige
  - -1 Zufriedenheit/Monat
  - +0.5% Korruption/Monat

- **Klassentrennung** (bis 1900)
  - Strikte soziale Trennung
  - -15 Zufriedenheit, +10 Autorität, -15 Popularität
  - -0.5 Stabilität/Monat
  - +0.5% Kriminalität/Monat

#### 7. **Soziale Spannungen** ⚡

**Konfliktmanagement:**

- **Konfliktlösung** (ab 1950)
  - Programme zur Deeskalation
  - +15 Stabilität, +10 Zufriedenheit
  - -1% Kriminalität/Monat, +0.5 Stabilität/Monat
  - Kosten: 250 Gold/Monat

- **Religiöse Toleranz** (ab 1648)
  - Akzeptanz verschiedener Glaubensrichtungen
  - +15 Zufriedenheit, +10 Stabilität, +10 Prestige
  - +1 Klerus/Monat

- **Kriegsrecht** (ab 1700)
  - Militärische Kontrolle bei Unruhen
  - +20 Stabilität, -30 Zufriedenheit
  - +25 Autorität, -35 Popularität
  - -2% Kriminalität/Monat
  - Kosten: 400 Gold/Monat
  - Dauer: 12 Monate (temporär)

#### 8. **Ballungsräume** 🏙️

**Stadtentwicklung:**

- **Stadtplanung** (ab 1850)
  - Systematische Stadtentwicklung
  - +10 Zufriedenheit, +5 Prestige
  - +0.5 Stabilität/Monat
  - Kosten: 300 Gold/Monat
  - Benötigt: 20.000 Gold, 5.000 Bevölkerung

- **Öffentlicher Nahverkehr** (ab 1863)
  - Ausbau von Bussen, Bahnen, Metro
  - +15 Zufriedenheit, +10 Popularität
  - +1 Handelsmacht/Monat
  - Kosten: 400 Gold/Monat
  - Benötigt: 30.000 Gold, 10.000 Bevölkerung

- **Slum-Sanierung** (ab 1900)
  - Erneuerung von Elendsvierteln
  - -10 Zufriedenheit sofort, +10 Autorität
  - +1 Zufriedenheit/Monat nach Umsetzung
  - -0.5% Kriminalität/Monat
  - +5 Arbeitslose/Monat
  - Einmalige Kosten: 15.000 Gold

- **Grünflächen** (ab 1800)
  - Parks und Erholungsgebiete
  - +12 Zufriedenheit, +8 Popularität
  - +0.3 Zufriedenheit/Monat
  - Einmalige Kosten: 8.000 Gold
  - Benötigt: 3.000 Bevölkerung

### Verwendung

```typescript
// PolicySystem verwenden
const policySystem = gameEngine.getPolicySystem();

// Verfügbare Politiken anzeigen
const availablePolicies = policySystem.getAvailablePolicies(player, currentYear);

// Politik einführen
const success = policySystem.enactPolicy('public_healthcare', player, currentYear, currentMonth);

// Aktive Politiken abrufen
const activePolicies = policySystem.getActivePolicies(player.id);

// Politik widerrufen
policySystem.repealPolicy('public_healthcare', player, currentYear);
```

### Erweiterung

Neue Politiken können durch Bearbeitung von `src/core/PolicySystem.ts` hinzugefügt werden. Die Struktur ist modular und JSON-kompatibel für zukünftige Erweiterungen.

---

## 🤖 Ollama AI Integration

### Überblick

Die Ollama-Integration ermöglicht es, KI-Modelle als Spieler oder Berater zu verwenden. Das System unterstützt mehrere Modelle mit unterschiedlichen Persönlichkeiten und Expertisen.

### Unterstützte Modelle

1. **Llama 2** (7B)
   - Persönlichkeit: Balanced und pragmatisch
   - Expertise: Allgemein, Strategie

2. **Mistral** (7B)
   - Persönlichkeit: Schnell und effizient
   - Expertise: Wirtschaft, Handel

3. **Code Llama** (7B)
   - Persönlichkeit: Analytisch und logisch
   - Expertise: Technologie, Infrastruktur

4. **Neural Chat** (7B)
   - Persönlichkeit: Diplomatisch und sozial
   - Expertise: Diplomatie, Soziales

5. **Orca Mini** (3B)
   - Persönlichkeit: Konservativ und vorsichtig
   - Expertise: Verteidigung, Stabilität

6. **Vicuna** (7B)
   - Persönlichkeit: Kreativ und expansiv
   - Expertise: Kultur, Expansion

### Funktionen

#### KI als Spieler

Die KI kann als vollwertiger Spieler agieren und eigenständige Entscheidungen treffen.

```typescript
// Ollama aktivieren
gameEngine.enableOllama({ 
  baseUrl: 'http://localhost:11434',
  model: 'llama2'
});

const ollamaService = gameEngine.getOllamaService();

// KI-Entscheidung abrufen
const decision = await ollamaService.getAIPlayerDecision(player, {
  year: currentYear,
  month: currentMonth,
  availableActions: ['build', 'policy', 'trade', 'military', 'wait']
});

// Entscheidung: { action, target, reason, confidence }
```

#### KI als Berater

Die KI kann Ratschläge und Empfehlungen geben.

```typescript
// Berater-Vorschläge abrufen
const suggestions = await ollamaService.getAdvisorSuggestion(player, 'economy');

// Ergebnis: Array von Vorschlägen
// [{ category, suggestion, priority, expectedOutcome }]
```

#### Event-Analyse

Die KI kann Ereignisse analysieren und Empfehlungen geben.

```typescript
const analysis = await ollamaService.analyzeEvent(player, {
  title: 'Pestausbruch',
  description: 'Eine schwere Seuche...',
  choices: [
    { id: 'build_hospitals', text: 'Hospitäler bauen' },
    { id: 'quarantine', text: 'Quarantäne verhängen' }
  ]
});

// Ergebnis: { analysis, recommendedChoice, reasoning }
```

#### Chat-Funktion

Ermöglicht Konversation mit der KI.

```typescript
const response = await ollamaService.chat(
  'Was sollte ich als nächstes tun?',
  { playerName: 'Heinrich', role: 'Kaiser' }
);
```

### Konfiguration

```typescript
// Ollama-Service konfigurieren
const config = {
  baseUrl: 'http://localhost:11434',
  model: 'mistral',
  temperature: 0.7,
  maxTokens: 500
};

gameEngine.enableOllama(config);

// Modell wechseln
ollamaService.setModel('neural-chat');

// Verfügbarkeit prüfen
const isAvailable = await ollamaService.isAvailable();
```

### Installation von Ollama

1. Ollama herunterladen: https://ollama.ai
2. Installieren und starten
3. Modell herunterladen: `ollama pull llama2`
4. Service läuft auf `http://localhost:11434`

---

## 🌐 Multiplayer-System

### Überblick

Das Multiplayer-System ermöglicht es mehreren Spielern, gemeinsam oder gegeneinander zu spielen. Es unterstützt menschliche Spieler, Basic-KI und Ollama-KI.

### Spielertypen

- **human**: Menschliche Spieler
- **ai_basic**: Einfache Computer-KI
- **ai_ollama**: KI-Spieler basierend auf Ollama-Modellen

### Session-Management

#### Session erstellen (Host)

```typescript
const multiplayerSystem = gameEngine.getMultiplayerSystem();

const session = await multiplayerSystem.createSession(
  {
    maxPlayers: 6,
    allowAI: true,
    allowOllama: true,
    turnBased: false,
    requirePassword: false
  },
  {
    id: 'player1',
    name: 'Heinrich',
    type: 'human'
  }
);
```

#### Session beitreten

```typescript
const success = await multiplayerSystem.joinSession(
  'session_id',
  {
    id: 'player2',
    name: 'Friedrich',
    type: 'human'
  },
  'password' // optional
);
```

#### KI-Spieler hinzufügen

```typescript
multiplayerSystem.addAIPlayer('ai_ollama', {
  name: 'KI Berater',
  ollamaModel: 'mistral'
});
```

### Chat-System

```typescript
// Nachricht senden
const message = multiplayerSystem.sendChatMessage('Hallo zusammen!');

// Private Nachricht
multiplayerSystem.sendChatMessage('Geheime Info', true, 'player2_id');

// System-Nachricht
multiplayerSystem.sendSystemMessage('Spieler X hat beigetreten');

// Chat-Historie abrufen
const history = multiplayerSystem.getChatHistory(50);
```

### Spielmodi

#### Rundenbasiert

Bei aktiviertem turnBased-Modus können Spieler nur in ihrer Runde Aktionen durchführen.

```typescript
// Prüfen ob eigene Runde
const isMyTurn = multiplayerSystem.isMyTurn();

// Runde beenden
multiplayerSystem.endTurn();
```

#### Echtzeit

Alle Spieler können gleichzeitig agieren.

### Events

```typescript
// Session-Events
multiplayerSystem.on('playerJoined', (player) => {
  console.log(`${player.name} ist beigetreten`);
});

multiplayerSystem.on('playerLeft', (player) => {
  console.log(`${player.name} hat das Spiel verlassen`);
});

multiplayerSystem.on('chatMessage', (message) => {
  console.log(`${message.senderName}: ${message.message}`);
});

multiplayerSystem.on('turnChanged', (playerId) => {
  console.log(`Spieler ${playerId} ist an der Reihe`);
});
```

---

## 📚 Wikipedia-Integration

### Überblick

Die Wikipedia-Integration reichert historische Ereignisse mit echten Informationen aus Wikipedia an und bietet Kontextwissen.

### Funktionen

#### Artikel abrufen

```typescript
const wikiIntegration = gameEngine.getWikiIntegration();

const article = await wikiIntegration.getArticle('Französische Revolution');

// Ergebnis: { title, extract, url, thumbnail, categories }
```

#### Event-Wiki

Automatische Zuordnung von Wikipedia-Artikeln zu Spielereignissen.

```typescript
const eventWiki = await wikiIntegration.getEventWiki(
  'french_revolution',
  'Französische Revolution',
  1789
);

// Ergebnis: { eventId, wikiArticles, relatedTopics, lastUpdated }
```

#### Suche

```typescript
const results = await wikiIntegration.search('Mittelalter', 5);

// Ergebnis: [{ title, snippet, pageid }, ...]
```

#### Verwandte Artikel

```typescript
const related = await wikiIntegration.getRelatedArticles('Napoleon', 5);
```

#### Themenvorschläge

Kontextbasierte Vorschläge basierend auf Spielsituation.

```typescript
const suggestions = wikiIntegration.suggestTopics({
  year: 1800,
  playerRole: 'Kaiser',
  recentEvents: ['french_revolution'],
  activePolicies: ['free_trade']
});

// Ergebnis: ['Industrialisierung', 'Französische Revolution', 'Nationalismus']
```

#### Event-Beschreibung anreichern

```typescript
const enriched = await wikiIntegration.enrichEventDescription(
  'Schwarzer Tod',
  'Die Pest wütet in Europa',
  1347
);

// Fügt Wikipedia-Auszug und Link hinzu
```

### Caching

Das System cached Artikel automatisch für bessere Performance.

```typescript
// Cache-Statistiken
const stats = wikiIntegration.getCacheStats();
// { articlesInCache: 42, eventsInCache: 12 }

// Cache leeren
wikiIntegration.clearCache();
```

---

## ⚙️ Installation und Konfiguration

### Voraussetzungen

- Node.js 18+ LTS
- npm, yarn oder pnpm
- Optional: Ollama (für KI-Funktionen)

### Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Build für Produktion
npm run build

# TypeScript Type-Check
npm run check
```

### Konfiguration

```typescript
// Spiel mit allen Features initialisieren
const gameEngine = new GameEngine({
  maxPlayers: 6,
  difficulty: 2,
  gameSpeed: 1,
  enableMultiplayer: true,
  randomEvents: true,
  startingYear: 1200,
  enableOllama: true,
  ollamaUrl: 'http://localhost:11434',
  enableWiki: true
});
```

### Umgebungsvariablen

```bash
# Port ändern (Standard: 4100)
PORT=4200 npm run dev

# Ollama URL
OLLAMA_URL=http://localhost:11434
```

---

## 🎮 Spielbeispiel

### Vollständiges Setup mit allen Features

```typescript
// Game Engine initialisieren
const engine = new GameEngine({
  enableMultiplayer: true,
  enableOllama: true,
  enableWiki: true
});

// Multiplayer-Session erstellen
const multiplayer = engine.getMultiplayerSystem();
await multiplayer.createSession({
  maxPlayers: 4,
  allowAI: true,
  allowOllama: true,
  turnBased: false
}, {
  id: 'player1',
  name: 'Heinrich',
  type: 'human'
});

// KI-Spieler hinzufügen
multiplayer.addAIPlayer('ai_ollama', {
  name: 'KI Kaiser',
  ollamaModel: 'llama2'
});

// Spieler erstellen
const player = engine.addPlayer({
  name: 'Heinrich',
  gender: 'male',
  kingdomName: 'Germania'
});

// Politik einführen
const policySystem = engine.getPolicySystem();
policySystem.enactPolicy('public_healthcare', player, 1900, 1);

// KI-Berater nutzen
const ollama = engine.getOllamaService();
const suggestions = await ollama.getAdvisorSuggestion(player, 'economy');

// Wikipedia-Info abrufen
const wiki = engine.getWikiIntegration();
const article = await wiki.getArticle('Industrialisierung');

// Spiel starten
await engine.startGame();
```

---

## 📝 Lizenz

MIT License

---

**Entwickelt mit ❤️ für Geschichts- und Strategiespiel-Fans**

_Erlebe Geschichte. Erschaffe Deine Dynastie. Herrsche über Deutschland._
