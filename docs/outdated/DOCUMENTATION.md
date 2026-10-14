# Kaiser von Deutschland — Dokumentations-Übersicht

**Version**: 2.0.0  
**Letzte Aktualisierung**: Dezember 2025

## 📚 Dokumentations-Struktur

Diese Datei bietet einen Überblick über die vollständige Dokumentation des Projekts.

### Haupt-Dokumentationen

1. **[README.md](../README.md)** - Projekt-Übersicht und Schnellstart
   - Spielkonzept und Features
   - Installation und Setup
   - Projektstruktur
   - Lizenz und Credits

2. **[USER_GUIDE.md](USER_GUIDE.md)** - Umfassendes Spieler-Handbuch
   - Erste Schritte
   - Alle Spielmechaniken erklärt
   - Rollen, Gebäude, Technologien
   - Politik-System
   - Multiplayer und KI
   - Tipps & Tricks

3. **[API_REFERENCE.md](API_REFERENCE.md)** - Entwickler-API-Dokumentation
   - Alle Klassen und Methoden
   - TypeScript-Interfaces
   - Code-Beispiele
   - Ereignis-System

4. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technische Architektur
   - System-Design
   - Datenfluss
   - Komponenten-Übersicht
   - Performance-Optimierungen
   - Erweiterbarkeit

5. **[NEW_FEATURES.md](NEW_FEATURES.md)** - Neue Features (v2.0)
   - Politik-System (33 Politiken)
   - Ollama KI-Integration
   - Multiplayer-System
   - Wikipedia-Integration
   - Detaillierte Feature-Beschreibungen

6. **[ROADMAP.md](ROADMAP.md)** - Feature-Roadmap
   - Kurzfristige Ziele (2026)
   - Mittelfristige Pläne (2026-2027)
   - Langfristige Vision (2027+)
   - Community-Prioritäten

7. **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Beitrags-Richtlinien
   - Entwicklungsumgebung Setup
   - Code-Richtlinien
   - Commit-Konventionen
   - Pull Request Prozess

### Zusätzliche Dokumentation

8. **[COMPLETION_REPORT.md](COMPLETION_REPORT.md)** - Abschlussbericht v2.0
   - Implementierte Features
   - Code-Statistiken
   - Erfüllungsgrad der Anforderungen

9. **[EXPANSION_SUMMARY.md](../EXPANSION_SUMMARY.md)** - Projekt-Expansion
   - Entwicklungsgeschichte
   - Feature-Übersicht
   - Architektur-Entscheidungen

10. **[TESTING_SCREENSHOTS.md](TESTING_SCREENSHOTS.md)** - Test-Leitfaden
    - Test-Szenarien
    - Screenshot-Checklisten
    - Browser-Kompatibilität

## 🚀 Schnellstart

### Für Spieler

1. Lesen Sie [README.md](../README.md) für die Installation
2. Folgen Sie [USER_GUIDE.md](USER_GUIDE.md) für Gameplay-Hilfe
3. Entdecken Sie [NEW_FEATURES.md](NEW_FEATURES.md) für fortgeschrittene Features

### Für Entwickler

1. Lesen Sie [CONTRIBUTING.md](../CONTRIBUTING.md) für Setup
2. Konsultieren Sie [ARCHITECTURE.md](ARCHITECTURE.md) für System-Design
3. Nutzen Sie [API_REFERENCE.md](API_REFERENCE.md) als Referenz
4. Prüfen Sie [ROADMAP.md](ROADMAP.md) für geplante Features

### Für Modder

1. [ARCHITECTURE.md](ARCHITECTURE.md) - Verstehen Sie die Struktur
2. [API_REFERENCE.md](API_REFERENCE.md) - Nutzen Sie die APIs
3. JSON-Dateien in `src/data/json/` - Fügen Sie Content hinzu

## 📁 Projekt-Struktur

```
Kaiser_von_Deutschland/
│
├── README.md                    # Haupt-Readme
├── CONTRIBUTING.md              # Beitrags-Richtlinien
├── EXPANSION_SUMMARY.md         # Expansion-Zusammenfassung
│
├── docs/                        # Dokumentation
│   ├── DOCUMENTATION.md         # Diese Datei
│   ├── USER_GUIDE.md           # Spieler-Handbuch
│   ├── API_REFERENCE.md        # API-Dokumentation
│   ├── ARCHITECTURE.md         # Architektur-Docs
│   ├── NEW_FEATURES.md         # Feature-Dokumentation
│   ├── ROADMAP.md              # Feature-Roadmap
│   ├── COMPLETION_REPORT.md    # Abschlussbericht
│   ├── TESTING_SCREENSHOTS.md  # Test-Leitfaden
│   └── sourcecode Kaiser 2/    # Original-Referenz
│
├── src/                        # Quellcode
│   ├── core/                   # Kernlogik
│   ├── ui/                     # Benutzeroberfläche
│   ├── data/                   # Daten und JSON
│   └── utils/                  # Hilfsfunktionen
│
├── public/                     # Statische Assets
├── styles/                     # CSS-Dateien
└── index.html                  # Entry Point
```

## 🛠️ Setup & Entwicklung

### Installation

```bash
# Repository klonen
git clone https://github.com/Thomas-Heisig/Kaiser_von_Deutschland.git
cd Kaiser_von_Deutschland

# Dependencies installieren
npm install

# Development Server starten (Port 4100)
npm run dev

# TypeScript Type-Check
npm run check

# Build für Produktion
npm run build

# Tests ausführen
npm test
```

### Port ändern

**Windows PowerShell**:
```powershell
$env:PORT = 4200
npm run dev
```

**Linux/macOS**:
```bash
PORT=4200 npm run dev
```

## 🏗️ Architektur-Übersicht

### Kern-Systeme

- **GameEngine** - Zentrale Orchestrierung
- **Player** - Spieler-Verwaltung
- **Kingdom** - Königreich-Management
- **RoleSystem** - 15 spielbare Rollen
- **BuildingSystem** - 23 Gebäudetypen
- **TechnologySystem** - 24 Technologien
- **HistoricalEventSystem** - 27 historische Ereignisse

### Erweiterte Systeme (v2.0)

- **PolicySystem** - 33 Politik-Maßnahmen in 8 Kategorien
- **OllamaService** - KI-Integration (6 Modelle)
- **MultiplayerSystem** - Multiplayer-Framework
- **WikiIntegration** - Wikipedia-Anbindung
- **RegionalSystem** - Regional-Verwaltung
- **Economy** - Erweiterte Wirtschafts-Engine

### UI-Komponenten

- **GameUI** - Haupt-Benutzeroberfläche
- **Graphics** - Canvas-Rendering
- **NewFeaturesPanel** - Panel für neue Features
- **NotificationSystem** - Benachrichtigungen
- **SaveManager** - Speicher-Verwaltung

### Daten-Architektur

JSON-basierte Daten in `src/data/json/`:
- `roles.json` - Rollen-Definitionen
- `buildings.json` - Gebäude-Daten
- `technologies.json` - Technologie-Baum
- `historical-events.json` - Ereignisse
- `policy-categories.json` - Politik-Kategorien
- `regions.json` - Regionen
- `achievements.json` - Erfolge

## 🎮 Spiel-Features

### Kern-Features

- **15 Spielerrollen** vom Arbeiter bis zum Kaiser
- **27 historische Ereignisse** von Jahr 0 bis 2050
- **23 Gebäudetypen** über 6 historische Ären
- **24 Technologien** im vollständigen Tech-Tree
- **Komplexes Wirtschaftssystem** mit 7 Ressourcen
- **Regional-Verwaltung** mit verschiedenen Regionen
- **Save/Load** mit LocalForage (IndexedDB)

### Neue Features (v2.0)

- **33 Politik-Maßnahmen** in 8 Kategorien
- **Ollama KI-Integration** mit 6 verschiedenen Modellen
- **Multiplayer-System** für bis zu 6 Spieler
- **Wikipedia-Integration** für historische Ereignisse
- **Erweiterte UI** mit modernem Design
- **Event-System** für lose Kopplung

## 📖 Verwendete Technologien

- **TypeScript** 5.3+ - Type-safe Entwicklung
- **Vite** 5.0+ - Build-Tool und Dev-Server
- **LocalForage** 1.10+ - Client-seitige Persistenz (IndexedDB)
- **UUID** 9.0+ - Eindeutige ID-Generierung
- **Vitest** - Unit Testing

### Optionale Integrationen

- **Ollama** - Lokale KI-Modelle
- **Wikipedia API** - Historische Informationen

## 🔍 Dokumentations-Konventionen

### Code-Beispiele

Alle Code-Beispiele sind in TypeScript und funktional getestet.

```typescript
// Beispiel
const engine = new GameEngine(config);
await engine.initialize();
```

### Versionierung

Dokumentation folgt der Projekt-Version (aktuell: 2.0.0).

### Updates

Die Dokumentation wird mit jeder Version aktualisiert. Siehe Versionsnummern oben in jeder Datei.

## 🤝 Beitragen zur Dokumentation

Verbesserungen an der Dokumentation sind willkommen!

1. Fehler oder Unklarheiten gefunden?
   - Öffnen Sie ein Issue auf GitHub

2. Verbesserungsvorschläge?
   - Erstellen Sie einen Pull Request

3. Neue Sektion hinzufügen?
   - Folgen Sie dem Stil der bestehenden Dokumentation
   - Fügen Sie die neue Datei zum Inhaltsverzeichnis hinzu

## 📝 Hinweise

### Original-Referenz

Der Ordner `docs/sourcecode Kaiser 2/` enthält BASIC-Quelltexte des Original-Spiels "Kaiser II" als Referenz und Inspiration. Diese sind nicht Teil des aktuellen TypeScript-Codes.

### Dev-Server

Der Development-Server ist in `vite.config.ts` auf Port `4100` voreingestellt. Verwenden Sie die Umgebungsvariable `PORT`, um einen anderen Port zu nutzen.

### Browser-Unterstützung

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS 14+, Android Chrome 90+

## 🆘 Hilfe & Support

- **Fragen**: Öffnen Sie ein GitHub Issue
- **Bugs**: Nutzen Sie das Bug-Report Template
- **Features**: Nutzen Sie das Feature-Request Template
- **Diskussionen**: GitHub Discussions (falls verfügbar)

## 📜 Lizenz

Alle Dokumentation ist unter der MIT-Lizenz verfügbar (wie das Projekt selbst).

---

**Letzte Aktualisierung**: Dezember 2025  
**Version**: 2.0.0

_Entwickelt mit ❤️ für Geschichts- und Strategiespiel-Fans_
