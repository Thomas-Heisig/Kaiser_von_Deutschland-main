# Screenshots und Testing Guide

## Übersicht

Dieses Dokument beschreibt, wie die neuen Features getestet und dokumentiert werden können.

## Features zum Testen

### 1. Politik-System (PolicySystem)

**Test-Schritte:**
1. Spiel starten und Spieler erstellen
2. NewFeaturesPanel öffnen
3. "Politik"-Tab auswählen
4. Verschiedene Politiken in verschiedenen Kategorien ansehen
5. Politik einführen (z.B. "Öffentliche Bildung")
6. Beobachten der Auswirkungen auf Königreich
7. Politik widerrufen

**Screenshots benötigt:**
- [ ] Übersicht aller 8 Kategorien
- [ ] Detailansicht einer Politik-Kategorie (z.B. Asyl & Zuwanderung)
- [ ] Aktive Politiken-Übersicht
- [ ] Politik-Einführungsdialog
- [ ] Effekte einer aktiven Politik

**Zu demonstrieren:**
- 33 verschiedene Politiken
- 8 Kategorien
- Positive, negative, gemischte Auswirkungen
- Bedingungen und Konflikte
- Sofortige, monatliche und jährliche Effekte

### 2. Ollama KI-Integration

**Voraussetzung:**
```bash
# Ollama installieren
# Von https://ollama.ai herunterladen

# Modell herunterladen
ollama pull llama2

# Ollama starten (läuft automatisch nach Installation)
```

**Test-Schritte:**
1. Ollama im Spiel aktivieren
2. KI-Modell auswählen (z.B. Llama 2, Mistral)
3. KI-Berater um Rat fragen
4. KI-Entscheidung abrufen
5. Mit KI chatten

**Screenshots benötigt:**
- [ ] Ollama-Aktivierungsbildschirm
- [ ] Modellauswahl mit 6 verfügbaren Modellen
- [ ] KI-Berater Empfehlungen
- [ ] Chat mit KI
- [ ] KI-Spieler in Aktion

**Zu demonstrieren:**
- 6 verschiedene KI-Modelle
- Unterschiedliche Persönlichkeiten
- Berater-Funktion
- Chat-Funktion
- Event-Analyse

### 3. Multiplayer-System

**Test-Schritte:**
1. Multiplayer aktivieren
2. Session erstellen
3. Konfiguration wählen (max. Spieler, KI erlauben, etc.)
4. KI-Spieler hinzufügen (Basic-KI und Ollama-KI)
5. Chat nutzen
6. Spiel starten

**Screenshots benötigt:**
- [ ] Multiplayer-Lobby
- [ ] Session-Erstellung
- [ ] Spielerliste mit verschiedenen Typen (human, ai_basic, ai_ollama)
- [ ] Chat-System
- [ ] Rundenbasierter Modus

**Zu demonstrieren:**
- Session-Management
- Verschiedene Spielertypen
- Chat-Funktionalität
- Host-Controls
- Ready-Status

### 4. Wikipedia-Integration

**Test-Schritte:**
1. Wiki-Tab öffnen
2. Nach historischem Ereignis suchen (z.B. "Französische Revolution")
3. Artikel ansehen
4. Verwandte Themen erkunden
5. Event-Anreicherung testen

**Screenshots benötigt:**
- [ ] Wiki-Suchfunktion
- [ ] Suchergebnisse
- [ ] Artikel-Anzeige mit Bild
- [ ] Themenvorschläge
- [ ] Event mit Wikipedia-Info

**Zu demonstrieren:**
- Wikipedia-Suche
- Artikel-Anzeige
- Caching-System
- Event-Anreicherung
- Kontextbasierte Vorschläge

## UI-Screenshots

### Haupt-Features-Panel
- [ ] Tab-Navigation (4 Tabs)
- [ ] Responsives Design
- [ ] Dark Theme

### Politik-Tab
- [ ] Kategorien-Übersicht (alle 8)
- [ ] Expandierte Kategorie mit Politiken
- [ ] Politik-Karte mit Effekten
- [ ] Aktive Politik mit Status
- [ ] Nicht verfügbare Politik mit Anforderungen

### Ollama-Tab
- [ ] Aktivierung
- [ ] Modellauswahl-Dropdown
- [ ] Berater-Interface
- [ ] Chat-Verlauf
- [ ] KI-Antwort

### Multiplayer-Tab
- [ ] Lobby vor Spiel
- [ ] Spielerliste
- [ ] Chat-Interface
- [ ] Session-Info
- [ ] Controls (Host)

### Wiki-Tab
- [ ] Suchfeld
- [ ] Ergebnisliste
- [ ] Themenvorschläge
- [ ] Artikel-Darstellung

## Technische Tests

### PolicySystem
```typescript
// Test 1: Politik einführen
const policySystem = gameEngine.getPolicySystem();
const success = policySystem.enactPolicy('public_healthcare', player, 1900, 1);
console.log('Healthcare policy enacted:', success);

// Test 2: Verfügbare Politiken abrufen
const available = policySystem.getAvailablePolicies(player, 1900);
console.log('Available policies:', available.length);

// Test 3: Aktive Politiken
const active = policySystem.getActivePolicies(player.id);
console.log('Active policies:', active.length);

// Test 4: Politik widerrufen
policySystem.repealPolicy('public_healthcare', player, 1901);
```

### OllamaService
```typescript
// Test 1: Verfügbarkeit prüfen
const ollama = gameEngine.getOllamaService();
const available = await ollama?.isAvailable();
console.log('Ollama available:', available);

// Test 2: KI-Berater
const suggestions = await ollama?.getAdvisorSuggestion(player, 'economy');
console.log('AI suggestions:', suggestions);

// Test 3: Chat
const response = await ollama?.chat('Was soll ich tun?', {
  playerName: 'Heinrich',
  role: 'Kaiser'
});
console.log('AI response:', response);
```

### MultiplayerSystem
```typescript
// Test 1: Session erstellen
const multiplayer = gameEngine.getMultiplayerSystem();
const session = await multiplayer?.createSession({
  maxPlayers: 4,
  allowAI: true,
  allowOllama: true
}, {
  id: 'player1',
  name: 'Heinrich',
  type: 'human'
});
console.log('Session created:', session?.id);

// Test 2: KI-Spieler hinzufügen
multiplayer?.addAIPlayer('ai_ollama', {
  name: 'KI Kaiser',
  ollamaModel: 'llama2'
});

// Test 3: Chat senden
multiplayer?.sendChatMessage('Hallo!');
```

### WikiIntegration
```typescript
// Test 1: Artikel abrufen
const wiki = gameEngine.getWikiIntegration();
const article = await wiki?.getArticle('Napoleon');
console.log('Article:', article?.title);

// Test 2: Suche
const results = await wiki?.search('Mittelalter', 5);
console.log('Search results:', results?.length);

// Test 3: Event-Wiki
const eventWiki = await wiki?.getEventWiki(
  'french_revolution',
  'Französische Revolution',
  1789
);
console.log('Event wiki articles:', eventWiki?.wikiArticles.length);
```

## Performance-Tests

### PolicySystem
- [ ] 100 Politiken gleichzeitig aktiv
- [ ] Monatliche Effekte für alle Politiken
- [ ] Cache-Performance

### OllamaService
- [ ] Antwortzeit für einfache Fragen
- [ ] Conversation History Management
- [ ] Mehrere Modelle wechseln

### MultiplayerSystem
- [ ] 6 Spieler gleichzeitig
- [ ] 100+ Chat-Nachrichten
- [ ] Event-Synchronisation

### WikiIntegration
- [ ] Cache-Hit-Rate
- [ ] Mehrere parallele Anfragen
- [ ] Große Artikel

## Build und Deployment

```bash
# TypeScript kompilieren
npm run check

# Development Server
npm run dev

# Production Build
npm run build

# Dist testen
npm run preview
```

## Browser-Kompatibilität

Zu testen in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Barrierefreiheit

- [ ] Keyboard Navigation
- [ ] Screen Reader Kompatibilität
- [ ] Kontrast-Verhältnisse
- [ ] Focus States

## Dokumentation

Alle Features sind dokumentiert in:
- `docs/NEW_FEATURES.md` - Umfassende Dokumentation
- `README.md` - Projekt-Übersicht
- Code-Kommentare - Inline-Dokumentation

## Next Steps

1. Screenshots erstellen für alle Features
2. Tests durchführen
3. Performance optimieren
4. Bugs fixen
5. README aktualisieren mit Screenshots
6. Release Notes erstellen

## Bekannte Einschränkungen

1. **Ollama**: Benötigt lokale Installation
2. **Multiplayer**: Aktuell nur lokaler Modus (kein echter Server)
3. **Wikipedia**: Abhängig von Wikipedia-API-Verfügbarkeit
4. **Browser**: Moderne Browser erforderlich (ES6+)

## Kontakt

Bei Fragen oder Problemen, bitte ein Issue erstellen.
