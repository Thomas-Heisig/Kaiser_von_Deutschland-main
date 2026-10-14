# Life Simulation Features - Rollenwechsel-System

## 🎮 Übersicht

Das Kaiser von Deutschland Spiel wurde mit einem revolutionären **Life Simulation System** erweitert, das es ermöglicht, nahtlos zwischen verschiedenen Charakteren zu wechseln und die Geschichte aus verschiedenen Perspektiven zu erleben.

## ✨ Kernfeatures

### 1. **AI Controller System** (`AIController.ts`)

Verwaltet das Verhalten aller nicht-gespielten Charaktere mit einem 4-Schichten-Modell:

#### AI-Typen:
- **Reactive (Reaktiv)**: Normale Bürger, die auf Ereignisse reagieren
- **Proactive (Proaktiv)**: Ambitiöse Charaktere, die Veränderungen initiieren
- **Historical (Historisch)**: Vorbestimmte Figuren, die einem historischen Pfad folgen
- **Dynamic (Dynamisch)**: Charaktere, die aus Erfahrungen lernen

#### AI-Schichten:
1. **Grundbedürfnisse**: Nahrung, Unterkunft, Gesundheit
2. **Rollenspezifische Ziele**: Berufsabhängige Aktionen (Bauern ernten, Händler handeln, etc.)
3. **Persönlichkeit & Beziehungen**: Freundschaften, Familie, soziale Interaktionen
4. **Langfristige Ambitionen**: Karriere, Vermächtnis, dynastische Ziele

#### Verwendung:
```typescript
const aiManager = gameEngine.getAIControllerManager();
const controller = aiManager.getOrCreateController(citizenId, AIType.PROACTIVE);
controller.update(citizen, currentYear, currentMonth);
```

### 2. **Role Switching System** (`RoleSwitchingSystem.ts`)

Ermöglicht den sofortigen Wechsel zwischen verschiedenen Charakteren:

#### Features:
- **Sofortiger Rollenwechsel** ohne Ladezeit
- **KI-Übernahme** des alten Charakters
- **Meta-Wissen** bleibt über Charakterwechsel hinweg erhalten
- **Wechselhistorie** wird gespeichert
- **Empfohlene Charaktere** basierend auf Beziehungen

#### Verwendung:
```typescript
const roleSwitching = gameEngine.getRoleSwitchingSystem();

// Session erstellen
roleSwitching.createSession(playerId);

// Charakter wechseln
roleSwitching.switchRole(
  playerId,
  newCitizenId,
  getCitizen,
  updateCitizen,
  currentYear,
  currentMonth,
  'Spielerwahl'
);

// Empfohlene Charaktere
const recommended = roleSwitching.getRecommendedCharacters(
  playerId,
  getCitizen,
  getAllCitizens
);
```

### 3. **Time System** (`TimeSystem.ts`)

Drei verschiedene Zeit-Modi für unterschiedliche Spielstile:

#### Zeit-Modi:
- **Detail-Modus**: 1 Sekunde = 1 Tag (für persönliches Rollenspiel)
- **Ausgewogen**: 1 Sekunde = 1 Monat (Standard, für Familien-/Karrieresimulation)
- **Strategisch**: 1 Sekunde = 1 Jahr (für dynastische Simulation)

#### Features:
- **Geschwindigkeitsmultiplikator** (0.1x - 10x)
- **Pause/Resume**
- **Callbacks** für Tag-, Monats- und Jahreswechsel
- **Formatierte Datumsanzeige**

#### Verwendung:
```typescript
const timeSystem = gameEngine.getTimeSystem();

// Modus wechseln
timeSystem.setMode(TimeMode.DETAIL);

// Geschwindigkeit anpassen
timeSystem.setSpeed(2.0); // 2x schneller

// Pausieren
timeSystem.pause();
timeSystem.resume();

// Callbacks registrieren
timeSystem.onMonthChangeCallback((month, year) => {
  console.log(`Monat gewechselt: ${month}/${year}`);
});
```

### 4. **Dynamic Game View** (`DynamicGameView.ts`)

Passt die Visualisierung basierend auf der aktuellen Rolle an:

#### Ansichtstypen:
- **Politische Karte** (Kaiser/König): Territorien, Diplomatie, Allianzen
- **Lokales Feld** (Bauer): Felder, Ernten, Dorf
- **Handelsrouten** (Händler): Märkte, Waren, Handelsrouten
- **Spionage-Netzwerk** (Spion): Agenten, Intelligenz, Ziele
- **Militärische Übersicht** (Soldat): Einheiten, Schlachten, Versorgungslinien
- **Bibliothek** (Gelehrter): Bücher, Forschung, Studenten
- **Kirche** (Geistlicher): Gemeinde, Glaube, religiöse Ereignisse
- **Werkstatt** (Handwerker): Werkzeuge, Projekte, Kunden

#### Verwendung:
```typescript
const dynamicView = gameEngine.getDynamicGameView();

// Ansicht aktualisieren
const context = dynamicView.updateView(character, additionalData);

// Rendern
dynamicView.renderView(container, width, height);

// Dashboard-Daten
const dashboard = dynamicView.createDashboard(character);
```

## 🎨 UI-Komponenten

### 1. **RoleSwitchingPanel** (`ui/RoleSwitchingPanel.ts`)

Ein interaktives Panel zum Wechseln zwischen Charakteren:

#### Features:
- Liste aller verfügbaren Charaktere
- Empfohlene Charaktere basierend auf Beziehungen
- Filter nach Region, Beruf, Sozialklasse, Alter
- Charakterinformationen (Name, Beruf, Alter, Vermögen)
- One-Click-Wechsel

#### Bedienung:
1. Klicke auf "Charakter wechseln" in der unteren Leiste
2. Wähle einen Charakter aus der Liste
3. Sofortiger Wechsel - die KI übernimmt deinen alten Charakter

### 2. **TimeControlsPanel** (`ui/TimeControlsPanel.ts`)

Kompaktes Panel zur Zeit-Steuerung:

#### Features:
- Aktuelles Datum
- Zeit-Modus-Anzeige
- Geschwindigkeitsanzeige
- Pause/Resume-Button
- Modus-Wechsel-Buttons (Detail/Ausgewogen/Strategisch)
- Geschwindigkeitssteuerung (Langsamer/Normal/Schneller)

#### Bedienung:
- **⏸️/▶️**: Pause/Resume
- **📅/📆/🗓️**: Zeit-Modus wechseln
- **◀/▶/▶▶**: Geschwindigkeit anpassen

### 3. **CharacterDashboard** (`ui/CharacterDashboard.ts`)

Zeigt Informationen über den aktuell gespielten Charakter:

#### Angezeigte Informationen:
- **Name & Beruf**
- **Vermögen** 💰
- **Ruf** ⭐
- **Gesundheit** ❤️
- **Glück** 😊
- **Bedürfnisse**: Nahrung 🍞, Unterkunft 🏠, Sicherheit 🛡️

#### Features:
- Progress-Bars für alle Werte
- Farbcodierung (Grün/Gelb/Rot)
- Auto-Update

## 🔧 Integration in GameEngine

Die neuen Systeme sind vollständig in `GameEngine.ts` integriert:

```typescript
// Zugriff auf die Systeme
const aiManager = gameEngine.getAIControllerManager();
const roleSwitching = gameEngine.getRoleSwitchingSystem();
const timeSystem = gameEngine.getTimeSystem();
const dynamicView = gameEngine.getDynamicGameView();
```

### Monatlicher Update-Zyklus:
1. AI-Controller aktualisieren alle nicht-gespielten Charaktere
2. Zeit-System fortschreiten
3. Charakter-Dashboard aktualisieren
4. Dynamic View bei Bedarf aktualisieren

## 📋 Spielablauf

### Initialisierung:
1. Beim Spielstart werden automatisch 20 initiale Charaktere erstellt
2. Der erste Charakter wird automatisch ausgewählt
3. Eine Spieler-Session wird erstellt
4. Das Charakter-Dashboard zeigt den aktuellen Charakter

### Während des Spiels:
1. **Charakter wechseln**: Öffne das Role Switching Panel
2. **Zeit steuern**: Nutze das Time Controls Panel
3. **Charakterinfo**: Schau im Character Dashboard
4. **Ansicht anpassen**: Wechselt automatisch je nach Rolle

### Beispiel-Session:
1. Start als junger Bauer im Jahr 1200
2. Arbeite auf deinem Feld, baue Vermögen auf
3. Wechsle zu einem Händler in der Stadt
4. Baue Handelsrouten auf
5. Wechsle zu deinem Sohn (wenn vorhanden)
6. Erlebe die Welt aus verschiedenen Perspektiven

## 🎯 Zukünftige Erweiterungen

### Geplant:
- **Biografiesystem**: Vollständige Lebensläufe mit Rückblenden
- **Familienstammbaum-UI**: Visuelle Darstellung von Dynastien
- **Erweiterte AI**: Lernen aus Spielerentscheidungen
- **Multiplayer-Rollenwechsel**: Mehrere Spieler können verschiedene Charaktere kontrollieren
- **Historische Ereignisse**: Persönliche Perspektive auf große historische Momente
- **Charakterziele**: Langfristige Questlines für einzelne Charaktere

## 🐛 Bekannte Limitierungen

- Maximale Anzahl empfohlener Charaktere: 10
- Charakterliste zeigt maximal 10 Charaktere gleichzeitig
- Zeit-Updates erfolgen unabhängig vom Spiel-State
- Dynamic View Rendering ist noch grundlegend (Platzhalter)

## 📚 Technische Details

### Architektur:
```
GameEngine
├── AIControllerManager (verwaltet alle AI-Controller)
├── RoleSwitchingSystem (verwaltet Charakterwechsel)
├── TimeSystem (verwaltet Spielzeit)
└── DynamicGameView (verwaltet Visualisierung)

UIFlowManager
├── RoleSwitchingPanel (UI für Charakterwechsel)
├── TimeControlsPanel (UI für Zeitsteuerung)
└── CharacterDashboard (UI für Charakterinfo)
```

### Datenfluss:
1. **Spieler wählt Charakter** → RoleSwitchingPanel
2. **Rollenwechsel** → RoleSwitchingSystem
3. **Alter Charakter** → AI-Controller übernimmt
4. **Neuer Charakter** → CharacterDashboard Update
5. **Ansicht** → DynamicGameView Update
6. **Zeit** → TimeSystem Update → AI-Updates

## 📖 Code-Beispiele

### AI-Verhalten erweitern:
```typescript
// Eigene AI-Entscheidung hinzufügen
class CustomAIController extends AIController {
  pursueRoleGoals(citizen: Citizen, year: number, month: number): AIDecision[] {
    const decisions = super.pursueRoleGoals(citizen, year, month);
    
    // Eigene Logik
    if (citizen.profession === 'custom_role') {
      decisions.push({
        citizenId: this.citizenId,
        action: 'custom_action',
        timestamp: year * 12 + month,
        reasoning: 'Custom reasoning',
        success: true
      });
    }
    
    return decisions;
  }
}
```

### Neue Ansicht hinzufügen:
```typescript
// In DynamicGameView.ts
case ViewType.CUSTOM_VIEW:
  data.title = 'Meine Ansicht';
  data.showCustomData = true;
  break;
```

## 🎓 Best Practices

1. **Charakterwechsel**: Wechsle strategisch zu wichtigen Charakteren
2. **Zeit-Modus**: Nutze Detail-Modus für persönliches Spiel, Strategisch für Dynastien
3. **AI-Typ**: Setze wichtige Charaktere auf PROACTIVE für aktives Verhalten
4. **Meta-Wissen**: Nutze das gespeicherte Wissen über Charaktere hinweg
5. **Empfehlungen**: Folge den empfohlenen Charakteren für zusammenhängende Geschichten

## 🔗 Siehe auch

- [CHANGELOG.md](../CHANGELOG.md) - Versionshistorie
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Entwicklerrichtlinien
- [README.md](../README.md) - Hauptdokumentation
