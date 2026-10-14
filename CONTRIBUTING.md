# Contributing to Kaiser von Deutschland

Vielen Dank, dass Sie einen Beitrag zu Kaiser von Deutschland in Erwägung ziehen! 🎮👑

## 📋 Inhaltsverzeichnis

1. [Code of Conduct](#code-of-conduct)
2. [Wie kann ich beitragen?](#wie-kann-ich-beitragen)
3. [Entwicklungsumgebung einrichten](#entwicklungsumgebung-einrichten)
4. [Entwicklungsprozess](#entwicklungsprozess)
5. [Code-Richtlinien](#code-richtlinien)
6. [Commit-Konventionen](#commit-konventionen)
7. [Pull Request Prozess](#pull-request-prozess)

## Code of Conduct

Dieses Projekt folgt einem freundlichen und respektvollen Umgang. Bitte seien Sie höflich und konstruktiv in allen Interaktionen.

## Wie kann ich beitragen?

### 🐛 Bugs melden

- Überprüfen Sie, ob der Bug bereits gemeldet wurde
- Erstellen Sie ein detailliertes Issue mit:
  - Schritte zur Reproduktion
  - Erwartetes vs. tatsächliches Verhalten
  - Screenshots (wenn relevant)
  - Browser/OS-Version

### 💡 Features vorschlagen

- Beschreiben Sie das Feature im Detail
- Erklären Sie den Nutzen für Spieler
- Diskutieren Sie mögliche Implementierungen

### 🔧 Code beitragen

Wir freuen uns besonders über Beiträge in folgenden Bereichen:

- **Historische Ereignisse**: Neue Events für die Timeline
- **Rollen & Gebäude**: Zusätzliche spielbare Rollen oder Strukturen
- **Politik-Maßnahmen**: Neue politische Optionen
- **Technologien**: Erweiterte Tech-Trees
- **Lokalisierung**: Übersetzungen in andere Sprachen
- **UI/UX**: Verbesserungen der Benutzeroberfläche
- **Performance**: Optimierungen und Bug-Fixes

## Entwicklungsumgebung einrichten

### Voraussetzungen

- **Node.js**: Version 18.x oder höher (LTS empfohlen)
- **npm**: Version 9.x oder höher (kommt mit Node.js)
- **Git**: Für Version Control
- **Code-Editor**: VS Code empfohlen (mit TypeScript-Unterstützung)

### Setup

1. **Repository forken**
   ```bash
   # Fork auf GitHub erstellen, dann:
   git clone https://github.com/IHR-USERNAME/Kaiser_von_Deutschland.git
   cd Kaiser_von_Deutschland
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   # oder
   npm ci  # für reproduzierbare Builds
   ```

3. **Entwicklungsserver starten**
   ```bash
   npm run dev
   # Öffnet auf http://localhost:4100
   ```

4. **Upstream konfigurieren**
   ```bash
   git remote add upstream https://github.com/Thomas-Heisig/Kaiser_von_Deutschland.git
   git fetch upstream
   ```

## Entwicklungsprozess

### Branch-Strategie

1. Erstellen Sie einen Feature-Branch:
   ```bash
   git checkout -b feature/mein-neues-feature
   # oder
   git checkout -b fix/bug-beschreibung
   ```

2. Arbeiten Sie am Code und commiten Sie regelmäßig

3. Pushen Sie zu Ihrem Fork:
   ```bash
   git push origin feature/mein-neues-feature
   ```

### Wichtige Befehle

```bash
# Development Server starten (Port 4100)
npm run dev

# TypeScript Type-Check
npm run check

# Build für Produktion
npm run build

# Tests ausführen (falls verfügbar)
npm test

# Port ändern (Windows PowerShell)
$env:PORT = 4200
npm run dev

# Port ändern (Linux/macOS)
PORT=4200 npm run dev
```

## Code-Richtlinien

### TypeScript

- **Nutzen Sie TypeScript**: Alle neuen Dateien sollten `.ts` sein
- **Strikte Typisierung**: Vermeiden Sie `any`, nutzen Sie spezifische Typen
- **Interfaces definieren**: Erstellen Sie Interfaces für Objekt-Strukturen
- **Dokumentation**: JSDoc-Kommentare für öffentliche Methoden

Beispiel:
```typescript
/**
 * Fügt ein neues Gebäude zum Königreich hinzu
 * @param buildingId - ID des Gebäudes aus buildings.json
 * @param quantity - Anzahl der zu bauenden Gebäude
 * @returns true wenn erfolgreich, false sonst
 */
public addBuilding(buildingId: string, quantity: number = 1): boolean {
  // Implementation
}
```

### Coding Style

- **Einrückung**: 2 Leerzeichen (keine Tabs)
- **Quotes**: Einfache Anführungszeichen `'string'`
- **Semikolons**: Immer verwenden
- **Variablen**: `camelCase` für Variablen, `PascalCase` für Klassen
- **Konstanten**: `UPPER_SNAKE_CASE` für echte Konstanten

### JSON-Daten

Wenn Sie JSON-Dateien bearbeiten (z.B. neue Gebäude oder Events):

```json
{
  "id": "eindeutige_id",
  "name": "Beschreibender Name",
  "description": "Detaillierte Beschreibung",
  "category": "passende_kategorie"
}
```

- Konsistente Struktur einhalten
- IDs in `snake_case`
- Namen und Beschreibungen auf Deutsch
- Vollständige Metadaten angeben

### Modularität

- **Ein System pro Datei**: Jede Klasse in eigener Datei
- **Datengetrieben**: Spielinhalte in JSON, nicht in Code
- **Keine Breaking Changes**: Rückwärtskompatibilität wahren
- **Dependency Injection**: Systeme sollten unabhängig sein

## Commit-Konventionen

Wir folgen einer vereinfachten Commit-Konvention:

```
type: Kurze Beschreibung (max 72 Zeichen)

Optionale detaillierte Beschreibung nach einer Leerzeile.
```

### Commit-Typen

- `feat`: Neues Feature
- `fix`: Bug-Fix
- `docs`: Dokumentations-Änderungen
- `style`: Code-Formatierung (keine funktionalen Änderungen)
- `refactor`: Code-Umstrukturierung
- `perf`: Performance-Verbesserungen
- `test`: Tests hinzufügen oder ändern
- `chore`: Build-Prozess, Dependencies, etc.

### Beispiele

```bash
feat: Füge Windmühle als neues Gebäude hinzu

fix: Korrigiere Ressourcen-Berechnung bei Technologie-Forschung

docs: Aktualisiere README mit neuen Features

refactor: Verbessere PolicySystem Struktur
```

## Pull Request Prozess

### Vor dem PR

1. **Code-Qualität sicherstellen**
   ```bash
   npm run check  # TypeScript ohne Fehler
   npm test       # Alle Tests grün (falls vorhanden)
   npm run build  # Build erfolgreich
   ```

2. **Commits aufräumen**: Squashen Sie kleine Fix-Commits wenn sinnvoll

3. **Upstream synchronisieren**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR erstellen

1. Gehen Sie zu GitHub und erstellen Sie einen Pull Request
2. Füllen Sie die PR-Vorlage aus:
   - **Beschreibung**: Was ändert der PR?
   - **Motivation**: Warum ist die Änderung wichtig?
   - **Testing**: Wie wurde getestet?
   - **Screenshots**: Bei UI-Änderungen

3. **PR-Titel**: Klarer, beschreibender Titel
   ```
   Füge Multiplayer-Chat-System hinzu
   Korrigiere Bug in Technologie-Freischaltung
   Aktualisiere Dokumentation für Politik-System
   ```

### Review-Prozess

- Maintainer werden den Code reviewen
- Feedback konstruktiv umsetzen
- CI muss erfolgreich durchlaufen
- Mindestens eine Approval erforderlich

### Nach dem Merge

- Branch kann gelöscht werden
- Danke für Ihren Beitrag! 🎉

## 📂 Projekt-spezifische Hinweise

### Neue Rolle hinzufügen

1. Bearbeiten Sie `src/data/json/roles.json`
2. Fügen Sie vollständige Definition hinzu:
   ```json
   {
     "id": "role_id",
     "name": "Rollenname",
     "rank": 5,
     "category": "kategorie",
     "gender": "both",
     "abilities": ["fähigkeit1", "fähigkeit2"],
     "requirements": { "prestige": 100, "gold": 5000 }
   }
   ```
3. Keine Code-Änderungen nötig!

### Neues Gebäude hinzufügen

1. Bearbeiten Sie `src/data/json/buildings.json`
2. Definieren Sie Kosten, Produktion, Effekte
3. Ordnen Sie der passenden Ära zu

### Neue Politik hinzufügen

1. Bearbeiten Sie `src/core/PolicySystem.ts`
2. Fügen Sie zur `initializePolicies()` Methode hinzu
3. Definieren Sie Effekte (immediate, monthly, yearly)
4. Dokumentieren Sie in `docs/NEW_FEATURES.md`

### Neue Technologie hinzufügen

1. Bearbeiten Sie `src/data/json/technologies.json`
2. Definieren Sie Voraussetzungen (prerequisites)
3. Geben Sie Forschungskosten und -zeit an
4. Listen Sie freigeschaltete Gebäude auf

## 🆘 Hilfe bekommen

- **Fragen**: Öffnen Sie ein Issue mit dem Tag `question`
- **Diskussionen**: Nutzen Sie GitHub Discussions (falls verfügbar)
- **Dokumentation**: Siehe [docs/](docs/) Verzeichnis

## 🎯 Gute erste Beiträge

Suchen Sie nach einem Einstieg? Issues mit dem Label `good first issue` sind gut für Anfänger geeignet.

Vorschläge:
- Tippfehler in Dokumentation korrigieren
- Neue historische Ereignisse hinzufügen
- Fehlende JSDoc-Kommentare ergänzen
- Kleine UI-Verbesserungen

---

**Vielen Dank für Ihr Interesse an Kaiser von Deutschland!** 🎮👑

Bei Fragen oder Problemen, zögern Sie nicht, ein Issue zu öffnen.
