# Spielart-Auswahl und Modi-System

## Überblick

Das **Modi-System** ermöglicht es jedem Spieler, seine eigene Spielerfahrung zu wählen - von abstrakten Tabellen bis zu komplexen Makrosimulationen, von spielerisch-zugänglich bis ernst-realistisch.

**Kern-Prinzip**: "Jeder kann alles sein und jeder hat eigene Spiel-Ideen"

## Spielart-Auswahl beim Start

### Hauptmenü-Flow

```
Hauptmenü
├── Neues Spiel
│   ├── 1. Spielart wählen (6 Typen)
│   ├── 2. Intensität einstellen (4 Achsen)
│   ├── 3. Rolle wählen (35 Rollen)
│   ├── 4. Epoche wählen (0-2050)
│   └── 5. Spielstart
├── Spiel laden
├── Multiplayer
└── Einstellungen
```

### Schritt 1: Spielart wählen

#### Option 1: Tabellen-Klassiker 📊

**Für wen?**: Nostalgie-Fans, Zahlen-Liebhaber, Einsteiger

**Beschreibung**:
> Klassische Kaiser-Erfahrung wie 1984. Einfache Menüs, klare Zahlen, direkte Kontrolle. Perfekt für schnelle Runden und Optimierungs-Freaks.

**Features**:
- Menü-basierte Steuerung
- Klare Tabellen und Statistiken
- Vollständige Informationen
- Schnelle Runden (30-60 Minuten)
- Fokus auf Zahlen-Optimierung

**Beispiel-Screenshot**: [Tabellen-Interface]

---

#### Option 2: Handels-Abenteuer 🚢

**Für wen?**: Trader, Aufsteiger, Karriere-Spieler

**Beschreibung**:
> Starten Sie als einfacher Händler und bauen Sie ein Handelsimperium auf. Routen planen, Waren handeln, Konkurrenten übertrumpfen.

**Features**:
- Fokus auf Handel und Wirtschaft
- Karriere vom Hausierer zum Handelsherrn
- Dynamische Preise und Märkte
- Handelsr outen und Logistik
- Konkurrenz mit KI-Händlern

**Beispiel-Screenshot**: [Handelsrouten-Karte]

---

#### Option 3: Aufbau-Meister 🏗️

**Für wen?**: Logistik-Fans, Produktionsketten-Optimierer, Anno-Spieler

**Beschreibung**:
> Errichten Sie komplexe Produktionsketten. Von der Rohstoff-Gewinnung bis zum Endprodukt - optimieren Sie jeden Schritt!

**Features**:
- Komplexe Produktionsketten
- Ressourcen-Flüsse visualisiert
- Logistik und Transport
- Stadt- und Regionsentwicklung
- Versorgung der Bevölkerung

**Beispiel-Screenshot**: [Produktionsketten-Diagramm]

---

#### Option 4: Konzern-Chef 🏢

**Für wen?**: Unternehmer, Wettbewerbs-Spieler, Strategen

**Beschreibung**:
> Führen Sie ein Unternehmen im harten Wettbewerb. Forschung, Marketing, Preisgestaltung - schlagen Sie die Konkurrenz!

**Features**:
- Unternehmens-Management
- KI-Konkurrenten
- Forschung und Innovation
- Marketing und Werbung
- Marktanteile erobern

**Beispiel-Screenshot**: [Unternehmens-Dashboard]

---

#### Option 5: Strategie-Klassiker ⚔️ [STANDARD]

**Für wen?**: Strategie-Profis, Victoria-Fans, Geschichts-Enthusiasten

**Beschreibung**:
> Lenken Sie die Geschicke einer ganzen Nation. Politik, Wirtschaft, Militär, Diplomatie - alles in Ihrer Hand. Komplex, herausfordernd, episch.

**Features**:
- Makroökonomische Steuerung
- Soziale Klassen und Interessengruppen
- Politische Maßnahmen
- Internationale Diplomatie
- Langfristige Konsequenzen

**Beispiel-Screenshot**: [Strategie-Übersicht]

**Hinweis**: Dies ist der Standard-Modus, der die volle Spieltiefe bietet.

---

#### Option 6: Multiplayer-Welt 🌐

**Für wen?**: Soziale Spieler, Rollenspiel-Fans, Wettbewerbs-Liebhaber

**Beschreibung**:
> Echte Spieler formen die Wirtschaft. Handel mit Menschen, politische Intrigen, emergente Geschichten. Jede Runde ist anders!

**Features**:
- Bis zu 100 Spieler pro Welt
- Emergente Wirtschaft
- Spieler-Gilden und Allianzen
- Echte Verhandlungen
- Unvorhersehbare Events

**Beispiel-Screenshot**: [Multiplayer-Lobby]

**Hinweis**: Erfordert Online-Verbindung und Account.

---

### Schritt 2: Intensität einstellen

Nach Spielart-Wahl öffnet sich das **Intensitäts-Konfigurationsmenü**:

```
┌─────────────────────────────────────────┐
│  Intensität und Realismus               │
├─────────────────────────────────────────┤
│                                         │
│  📊 Informations-Intensität             │
│  ├─────●───────────┤                   │
│  Vollständig      Fragmentiert          │
│  "Alle Daten sofort" vs "Verzögerte,   │
│   widersprüchliche Berichte"            │
│                                         │
│  ⚠️ Konsequenz-Intensität               │
│  ├────────●────────┤                   │
│  Reversibel       Irreversibel          │
│  "Fehler korrigierbar" vs "Dauerhafte  │
│   Folgen"                               │
│                                         │
│  ⏱️ Zeit-Intensität                     │
│  ├──────●──────────┤                   │
│  Beschleunigt     Echtzeit              │
│  "Sofortige Effekte" vs "Jahre bis     │
│   Wirkung"                              │
│                                         │
│  🤔 Interpretations-Intensität          │
│  ├───────────●─────┤                   │
│  Klar erklärt     Mehrdeutig            │
│  "Tooltips erklären alles" vs "Selbst  │
│   erforschen"                           │
│                                         │
│  Voreinstellungen:                      │
│  [Casual] [Balanced] [Realistisch]     │
│  [Historiker] [Eigene Einstellung]      │
│                                         │
│  [ Zurück ]  [ Weiter zur Rollenwahl ] │
└─────────────────────────────────────────┘
```

### Schritt 3: Rolle wählen

**35 Spielbare Rollen** in 7 Kategorien:

#### Herrschaft (5)
- Kaiser/Kaiserin - Absolute Macht
- König/Königin - Regionale Macht
- Fürst/Fürstin - Territoriale Herrschaft

#### Religion (5)
- Papst - Spirituelle Führung
- Bischof - Regionale Kirche
- Mönch/Nonne - Religiöses Leben
- Inquisitor - Glaubensreinheit

#### Adel (4)
- Herzog/Herzogin - Große Ländereien
- Graf/Gräfin - Mittlerer Adel
- Baron/Baronin - Kleinadel

#### Verwaltung (6)
- Minister - Regierungsämter
- Bürgermeister - Städtische Verwaltung
- Beamter - Bürokratie
- Richter - Justiz

#### Wirtschaft (8)
- Bankier - Finanzwesen
- Händler - Handel
- Gildenmeister - Handwerksorganisation
- Handwerker - Produktion
- Fabrikbesitzer - Industrie
- Architekt - Bauwesen

#### Arbeit & Gesellschaft (4)
- Bauer - Landwirtschaft
- Arbeiter - Industrie
- Journalist - Medien
- Künstler - Kultur

#### Wissenschaft & Militär (3)
- Gelehrter - Forschung
- General/Admiral - Militärführung
- Spion - Geheimdienst

**Jede Rolle hat**:
- Eigene Start-Ressourcen
- Spezifische Fähigkeiten
- Einzigartige Perspektive
- Eigene Herausforderungen

### Schritt 4: Epoche wählen

**6 Epochen** zur Auswahl:

1. **Antike (0-500)** - Grundlagen
2. **Mittelalter (500-1500)** - Feudalismus
3. **Frühe Neuzeit (1500-1800)** - Renaissance
4. **Industrialisierung (1800-1900)** - Maschinen
5. **Moderne (1900-2000)** - Weltkriege
6. **Zukunft (2000-2050)** - Digitalisierung

**Optional**: Freie Jahreszahl-Eingabe

### Schritt 5: Spielstart

Zusammenfassung:
```
┌─────────────────────────────────────────┐
│  Spiel-Konfiguration                    │
├─────────────────────────────────────────┤
│  Spielart: Strategie-Klassiker          │
│  Intensität: Realistisch                │
│    • Information: 8/10                  │
│    • Konsequenz: 9/10                   │
│    • Zeit: 8/10                         │
│    • Interpretation: 8/10               │
│  Rolle: Minister                        │
│  Epoche: Industrialisierung (1850)      │
│                                         │
│  [ Ändern ]  [ Spiel starten! ]        │
└─────────────────────────────────────────┘
```

## Im Spiel: Modi-Wechsel

### Während des Spiels

Spieler können **jederzeit**:

1. **Rolle wechseln**: "Jetzt mal als Bauer spielen"
2. **Intensität anpassen**: "Zu schwer? Runter mit Konsequenz-Intensität"
3. **Perspektive ändern**: "Gott-Modus aktivieren zum Lernen"

**Aber**: Modus-Wechsel (1-6) nur bei Neustart möglich

### Modi-Wechsel-Menü (ESC)

```
┌─────────────────────────────────────────┐
│  Einstellungen                          │
├─────────────────────────────────────────┤
│  ▶ Rolle wechseln                       │
│    • Aktuell: Minister                  │
│    • Verfügbar: Alle 35 Rollen          │
│                                         │
│  ▶ Intensität anpassen                  │
│    • Information: [||||||||  ] 8       │
│    • Konsequenz: [||||||||||| ] 9      │
│    • Zeit: [||||||||  ] 8              │
│    • Interpretation: [||||||||  ] 8    │
│                                         │
│  ▶ Perspektiven-Modus                   │
│    [ ] Normal                           │
│    [ ] Wissenschaftler (Daten-Fokus)    │
│    [✓] Gott (Debug/Lern-Modus)         │
│                                         │
│  ▶ Speichern & Laden                    │
│  ▶ Zurück zum Hauptmenü                 │
└─────────────────────────────────────────┘
```

## Multiplayer: Jeder seine eigene Erfahrung

### Individuelle Einstellungen

**Revolutionäres Konzept**: Jeder Spieler kann **eigene Intensitäts-Einstellungen** haben!

**Beispiel-Szenario**:
- **Spieler A (Veteran)**: Realistisch-Profil (8/9/8/8)
- **Spieler B (Einsteiger)**: Casual-Profil (3/3/4/3)
- **Spieler C (Lern-Modus)**: Historiker-Profil (10/10/10/10)

**Alle spielen in derselben Welt**, aber:
- Sehen unterschiedliche Informationen
- Erleben unterschiedliche Schwierigkeiten
- Haben unterschiedliche Konsequenzen

**Spielmechanik**:
- **Gemeinsame Wirtschaft**: Preise, Ressourcen sind für alle gleich
- **Individuelle Wahrnehmung**: Aber A sieht "Weizen: 14.7 Taler", B sieht "Weizen: ~15 Taler", C sieht "Weizen: 14.67 ± 0.34 Taler (95% Konfidenz)"
- **Faire Balance**: Schwierigere Einstellungen = Mehr Erfahrungspunkte / Erfolge

### Rollen-Verteilung

**Jeder kann jede Rolle**:
- **A** spielt Kaiser
- **B** spielt Händler
- **C** spielt Bauer

**Oder sogar**:
- **Mehrere Kaiser**: Verschiedene Königreiche
- **Alle Händler**: Konkurrenz!
- **Gemischt**: Realistisches Gesellschaftsbild

## Pädagogischer Wert

### Lern-Szenarien

#### Szenario 1: Perspektiven-Vergleich
1. **Spielen als Bauer** (Information: 8, viele Einschränkungen)
2. **Wechseln zu Kaiser** (mehr Macht, aber auch mehr Verantwortung)
3. **Gott-Modus aktivieren**: "Aha! DARUM waren die Preise hoch!"

**Lernen**: Informationsasymmetrie verstehen

#### Szenario 2: Intensitäts-Steigerung
1. **Start mit Casual** (3/3/3/3) - Spielen lernen
2. **Steigern zu Balanced** (5/5/5/5) - Herausforderung erhöhen
3. **Wechsel zu Realistisch** (8/9/8/8) - Volle Komplexität

**Lernen**: Schrittweise an Komplexität heranführen

#### Szenario 3: Theorie vs. Praxis
1. **Wissenschaftler-Rolle** - Daten analysieren, Empfehlungen geben
2. **Minister-Rolle** - Empfehlungen umsetzen, Scheitern erleben
3. **Zurück zu Wissenschaftler** - Verstehen, warum Theorie nicht funktionierte

**Lernen**: Kluft zwischen Wissen und Handeln

### Für Bildungseinrichtungen

**Lehrer-Funktionen**:
- Vorkonfigurierte Szenarien
- Klassenraum-Modus (alle Schüler in einer Welt)
- Lehrer hat Gott-Perspektive
- Debriefing-Werkzeuge

**Beispiel-Unterricht**:
```
Stunde 1: Alle spielen Haushalt (niedrige Intensität)
Stunde 2: Diskussion über erlebte Wirtschaft
Stunde 3: Einige spielen Minister, versuchen zu helfen
Stunde 4: Gott-Modus - Was lief wirklich ab?
Stunde 5: Reflexion und Erkenntnisse
```

## Technische Umsetzung

### Datenstruktur

```typescript
interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultIntensity: IntensitySettings;
  recommendedRoles: RoleType[];
  features: string[];
  singleplayerOnly: boolean;
}

interface PlayerSettings {
  playerId: string;
  mode: string;
  intensity: IntensitySettings;
  currentRole: RoleType;
  perspectiveMode: 'normal' | 'scientist' | 'god';
}

interface IntensitySettings {
  information: number; // 1-10
  consequence: number; // 1-10
  time: number; // 1-10
  interpretation: number; // 1-10
}
```

### Persistierung

**In Datenbank**:
```sql
CREATE TABLE player_settings (
  player_id TEXT PRIMARY KEY,
  mode_id TEXT NOT NULL,
  intensity_info INTEGER DEFAULT 5,
  intensity_consequence INTEGER DEFAULT 5,
  intensity_time INTEGER DEFAULT 5,
  intensity_interpretation INTEGER DEFAULT 5,
  current_role TEXT NOT NULL,
  perspective_mode TEXT DEFAULT 'normal',
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE game_modes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_path TEXT,
  default_intensity_json TEXT,
  features_json TEXT,
  singleplayer_only BOOLEAN DEFAULT 0
);
```

### UI-Komponenten

**Neue Komponenten**:
- `GameModeSelector.ts` - Spielart-Auswahl
- `IntensityConfigurator.ts` - 4-Achsen-Slider
- `RoleSelector.ts` - 35 Rollen mit Infos
- `EpochSelector.ts` - Zeitauswahl
- `PerspectiveToggle.ts` - Normal/Wissenschaftler/Gott-Umschalter

---

**Version**: 2.4.0  
**Letzte Aktualisierung**: Dezember 2025  
**Status**: In Entwicklung
