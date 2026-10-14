# 🎮 Kaiser von Deutschland - Benutzerhandbuch

**Version**: 2.0.0  
**Letzte Aktualisierung**: Dezember 2025

Willkommen bei Kaiser von Deutschland! Dieses Handbuch führt Sie durch alle Aspekte des Spiels.

## 🚧 Entwicklungsstatus

> **⚠️ Hinweis:** Das Spiel befindet sich im **ersten Entwicklungsstadium**.  
> 
> - Die beschriebenen Features sind größtenteils implementiert
> - Einige Funktionen befinden sich noch in der Entwicklung
> - Das Gameplay wird kontinuierlich verbessert und ausbalanciert
> - Eine vollständig spielbare Version wird bald verfügbar sein

---

## 📋 Inhaltsverzeichnis

1. [Erste Schritte](#erste-schritte)
2. [Spielkonzept](#spielkonzept)
3. [Rollen-System](#rollen-system)
4. [Ressourcen-Management](#ressourcen-management)
5. [Gebäude](#gebäude)
6. [Technologien](#technologien)
7. [Politik-System](#politik-system)
8. [Historische Ereignisse](#historische-ereignisse)
9. [KI-Berater](#ki-berater)
10. [Multiplayer](#multiplayer)
11. [Tipps & Tricks](#tipps--tricks)

---

## 🚀 Erste Schritte

### Installation

1. **Repository klonen oder herunterladen**
   ```bash
   git clone https://github.com/Thomas-Heisig/Kaiser_von_Deutschland.git
   cd Kaiser_von_Deutschland
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Spiel starten**
   ```bash
   npm run dev
   ```

4. **Browser öffnen**
   - Navigieren Sie zu `http://localhost:4100`
   - Das Spiel lädt automatisch

### Neues Spiel beginnen

1. Klicken Sie auf "Neues Spiel"
2. Wählen Sie Ihre Starteinstellungen:
   - **Name**: Ihr Herrschername
   - **Geschlecht**: Männlich oder Weiblich (beeinflusst Rollennamen)
   - **Königreichsname**: Name Ihres Reiches
   - **Startjahr**: Wann möchten Sie beginnen? (Standard: 1200)
   - **Schwierigkeitsgrad**: Leicht, Mittel, Schwer

3. Klicken Sie auf "Spiel starten"

### Benutzeroberfläche

```
┌─────────────────────────────────────────────────────────┐
│  Header: Name | Gold | Prestige | Jahr                  │
├─────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌──────────────────────────────────┐   │
│  │           │  │                                   │   │
│  │  Menü     │  │     Haupt-Spielbereich            │   │
│  │           │  │     (Karte, Stats, etc.)          │   │
│  │  • Stats  │  │                                   │   │
│  │  • Build  │  │                                   │   │
│  │  • Tech   │  │                                   │   │
│  │  • Policy │  │                                   │   │
│  │  • Events │  │                                   │   │
│  │           │  │                                   │   │
│  └───────────┘  └──────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Footer: Monat vorrücken | Speichern | Optionen        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Spielkonzept

### Spielziel

Es gibt mehrere Wege zum Sieg:

1. **Prestige-Sieg**: Erreichen Sie 100.000 Prestige
2. **Wirtschafts-Sieg**: Akkumulieren Sie 1.000.000 Gold
3. **Kultur-Sieg**: Erreichen Sie 10.000 Kulturellen Einfluss
4. **Militär-Sieg**: Erobern Sie alle Regionen (Multiplayer)
5. **Zeit-Sieg**: Überleben Sie bis zum Jahr 2050 mit hohem Score

### Spielmechaniken

#### Zeit-Verwaltung

- Das Spiel läuft **monatsweise**
- Klicken Sie auf "Nächster Monat" um voranzuschreiten
- Jeder Monat:
  - Ressourcen werden produziert
  - Kosten werden abgezogen
  - Ereignisse können auftreten
  - Bevölkerung wächst

- Jedes Jahr (12 Monate):
  - Jährliche Effekte werden angewandt
  - Historische Ereignisse können eintreten
  - Technologien werden erforscht

#### Schwierigkeitsgrade

- **Leicht**: 150% Ressourcen-Produktion, -25% Kosten
- **Mittel**: 100% normal
- **Schwer**: 75% Ressourcen-Produktion, +50% Kosten, mehr negative Events

---

## 👑 Rollen-System

### 15 Spielbare Rollen

Das Spiel bietet ein **Aufstiegs-System** von niedrigen zu hohen Rollen:

#### Rang 1-3: Niedere Stände
- **Arbeiter/Arbeiterin** (Rang 1)
  - Start-Rolle, wenig Autorität
  - Kann grundlegende Gebäude bauen
  
- **Bauer/Bäuerin** (Rang 2)
  - Nahrungsproduktions-Bonus
  - Mehr Startland

- **Handwerker/Handwerkerin** (Rang 3)
  - Produktions-Bonus
  - Zugang zu Werkstätten

#### Rang 4-5: Bürgerliche
- **Händler/Händlerin** (Rang 4)
  - Handels-Bonus
  - Günstigere Käufe
  
- **Gildenmeister/Gildenmeisterin** (Rang 5)
  - Wirtschafts-Bonus
  - Kontrolle über Gilden

#### Rang 6-7: Bildungs-Elite
- **Gelehrter/Gelehrte** (Rang 6)
  - Forschungs-Bonus
  - Schnellere Tech-Entwicklung

- **Mönch/Nonne** (Rang 6)
  - Religiöser Einfluss
  - Bevölkerungs-Zufriedenheit

#### Rang 7-8: Adel & Klerus
- **Bischof/Bischöfin** (Rang 7)
  - Hohe religiöse Autorität
  - Einfluss auf Klerus

- **Herzog/Herzogin** (Rang 7)
  - Regionale Macht
  - Militär-Kontrolle

- **Minister/Ministerin** (Rang 8)
  - Politik-Zugang
  - Verwaltungs-Bonus

- **Bürgermeister/Bürgermeisterin** (Rang 8)
  - Stadt-Verwaltung
  - Bevölkerungs-Management

#### Rang 9-10: Höchste Macht
- **König/Königin** (Rang 9)
  - Königliche Autorität
  - Erweiterte Politiken

- **Papst/Päpstin** (Rang 9)
  - Höchste religiöse Macht
  - Einfluss auf Christenheit

- **Kaiser/Kaiserin** (Rang 10)
  - Absolute Macht
  - Alle Features freigeschaltet
  - Kann andere Königreiche beeinflussen

### Rollen-Aufstieg

**Voraussetzungen zum Aufstieg**:
- Ausreichend **Prestige**
- Genügend **Gold**
- Erforderliche **Autorität**
- Manchmal: Spezielle Gebäude oder Technologien

**Beispiel - Aufstieg zu Minister**:
```
Erforderlich:
- Prestige: 5,000
- Gold: 20,000
- Autorität: 40
```

**So steigen Sie auf**:
1. Öffnen Sie das Rollen-Menü
2. Prüfen Sie verfügbare Aufstiegsmöglichkeiten
3. Klicken Sie auf "Aufsteigen" bei gewünschter Rolle
4. Bestätigen Sie die Entscheidung

---

## 💰 Ressourcen-Management

### Haupt-Ressourcen

#### Gold 🪙
- **Verwendung**: Gebäude, Technologien, Politiken
- **Produktion**: Märkte, Gilden, Handel, Steuern
- **Wichtigste Ressource** für Fortschritt

#### Nahrung 🌾
- **Verwendung**: Bevölkerungs-Wachstum
- **Produktion**: Farmen, Plantagen
- **Kritisch** für große Bevölkerungen

#### Holz 🪵
- **Verwendung**: Frühe Gebäude
- **Produktion**: Wälder, Sägewerke

#### Stein 🪨
- **Verwendung**: Befestigungen, Burgen
- **Produktion**: Steinbrüche

#### Eisen ⚒️
- **Verwendung**: Militärische Gebäude, Waffen
- **Produktion**: Minen, Schmieden

#### Luxusgüter 💎
- **Verwendung**: Prestige, Handel
- **Produktion**: Handel, Kolonien

#### Land 🗺️
- **Verwendung**: Platz für Gebäude
- **Gewinnung**: Expansion, Eroberung

### Attribute

#### Prestige ⭐
- Zeigt Ihren Ruhm und Status
- Erforderlich für Rollen-Aufstieg
- Gewonnen durch: Gebäude, Errungenschaften, Erfolge

#### Autorität 👑
- Ihre Macht und Kontrolle
- Erforderlich für: Politiken, höhere Rollen
- Beeinflusst: Stabilität, Gehorsam

#### Popularität ❤️
- Wie beliebt Sie beim Volk sind
- Beeinflusst: Steuereinnahmen, Stabilität
- Kann durch Politiken verändert werden

#### Militärische Stärke ⚔️
- Verteidigungskraft
- Eroberungs-Fähigkeit
- Gewonnen durch: Militär-Gebäude, Ausbildung

#### Handelsmacht 🚢
- Handels-Einfluss
- Gewinn aus Handel
- Gewonnen durch: Handels-Gebäude, Routen

#### Kultureller Einfluss 🎭
- Kultur-Ausstrahlung
- Gewonnen durch: Bibliotheken, Theater, Universitäten

---

## 🏗️ Gebäude

### 23 Gebäudetypen

Gebäude sind in **6 Ären** verfügbar:

#### Antike (0-500)
- **Bauernhof**: Nahrungsproduktion
- **Markt**: Gold-Produktion
- **Tempel**: Kultureller Einfluss

#### Mittelalter (500-1500)
- **Burg**: Verteidigung, Prestige
- **Kirche**: Religiöser Einfluss
- **Gilde**: Wirtschafts-Bonus
- **Mühle**: Nahrungsverarbeitung

#### Renaissance (1450-1650)
- **Universität**: Forschungs-Bonus
- **Druckerei**: Kultur-Verbreitung
- **Bank**: Gold-Multiplikator

#### Industrialisierung (1760-1920)
- **Fabrik**: Massen-Produktion
- **Eisenbahn**: Handel-Boost
- **Krankenhaus**: Bevölkerungs-Wachstum

#### Moderne (1920-2000)
- **Kraftwerk**: Energie-Produktion
- **Flughafen**: Globaler Handel
- **Forschungslabor**: Schnelle Forschung

#### Digital (2000+)
- **Rechenzentrum**: KI & Automatisierung
- **Solarpark**: Nachhaltige Energie

### Gebäude bauen

1. Öffnen Sie das **Gebäude-Menü**
2. Wählen Sie eine **Kategorie** oder **Ära**
3. Prüfen Sie:
   - ✅ Grün = Kann gebaut werden
   - ⚠️ Gelb = Voraussetzungen fehlen
   - 🔒 Rot = Gesperrt (Technologie/Jahr fehlt)
4. Klicken Sie auf "Bauen"
5. Wählen Sie **Anzahl**
6. Bestätigen Sie

### Gebäude-Kategorien

- **Landwirtschaft**: Nahrung
- **Wirtschaft**: Gold, Handel
- **Industrie**: Produktion
- **Religion**: Kultureller/Religiöser Einfluss
- **Bildung**: Forschung, Kultur
- **Militär**: Verteidigung, Stärke
- **Soziales**: Bevölkerung, Gesundheit
- **Infrastruktur**: Handel, Transport
- **Technologie**: Forschung, Innovation

---

## 🔬 Technologien

### 24 Technologien

Technologien sind in einem **Baum** organisiert mit Abhängigkeiten.

#### Antike Technologien
1. **Landwirtschaft** (Start)
   - Ermöglicht: Bauernhöfe
   
2. **Schrift** (Voraussetzung: Landwirtschaft)
   - Ermöglicht: Bibliotheken
   
3. **Bronzeverarbeitung**
   - Ermöglicht: Bronze-Waffen

#### Mittelalter-Technologien
4. **Feudalismus**
   - Ermöglicht: Burgen
   
5. **Gilden**
   - Ermöglicht: Gildenhallen

#### Renaissance-Technologien
6. **Schießpulver**
   - Revolutioniert Kriegsführung
   
7. **Druckerpresse**
   - Ermöglicht: Druckereien, Kultur-Verbreitung

8. **Bankwesen**
   - Gold-Bonus

#### Industrielle Technologien
9. **Dampfkraft**
   - Ermöglicht: Fabriken
   
10. **Eisenbahn**
    - Ermöglicht: Bahnhöfe

11. **Elektrizität**
    - Ermöglicht: Kraftwerke

#### Moderne Technologien
12. **Radio**
13. **Luftfahrt**
14. **Atomkraft**
15. **Computer**

#### Digitale Technologien
16. **Internet**
17. **Erneuerbare Energien**
18. **Künstliche Intelligenz**
19. **Quantencomputer**
20. **Fusionsenergie**
21. **Weltraumkolonisierung**

### Forschung

1. Öffnen Sie das **Technologie-Menü**
2. Sehen Sie den **Tech-Baum**
3. Klicken Sie auf eine verfügbare Technologie
4. Bezahlen Sie die **Forschungskosten**
5. Warten Sie die **Forschungszeit**
6. Technologie ist freigeschaltet!

**Forschungs-Tipps**:
- Priorisieren Sie Technologien, die wichtige Gebäude freischalten
- Forschungs-Kosten steigen mit jeder Technologie
- Universitäten reduzieren Forschungszeit

---

## 🏛️ Politik-System

### 33 Politik-Maßnahmen

Politiken ermöglichen es Ihnen, Ihr Reich zu formen.

#### 8 Kategorien

1. **🌍 Asyl & Zuwanderung** (4 Politiken)
   - Offene Grenzen
   - Kontrollierte Einwanderung
   - Geschlossene Grenzen
   - Asylrecht

2. **💰 Wirtschaft - Inland** (4 Politiken)
   - Freie Marktwirtschaft
   - Planwirtschaft
   - Progressive Besteuerung
   - Mindestlohn

3. **🚢 Wirtschaft - Außenhandel** (4 Politiken)
   - Freihandel
   - Protektionismus
   - Handelsembargo
   - Kolonialhandel

4. **🏥 Gesundheit** (4 Politiken)
   - Öffentliches Gesundheitswesen
   - Impfpflicht
   - Quarantäne-Protokolle
   - Gesundheitsaufklärung

5. **🤝 Soziales - Förderung** (4 Politiken)
   - Öffentliche Bildung
   - Sozialfürsorge
   - Arbeiterrechte
   - Gleichstellung

6. **⛓️ Soziales - Restriktion** (3 Politiken)
   - Zwangsarbeit
   - Zensur
   - Klassentrennung

7. **⚡ Soziale Spannungen** (3 Politiken)
   - Konfliktlösung
   - Religiöse Toleranz
   - Kriegsrecht

8. **🏙️ Ballungsräume** (4 Politiken)
   - Stadtplanung
   - Öffentlicher Nahverkehr
   - Slum-Sanierung
   - Grünflächen

### Politik einführen

1. Öffnen Sie das **Politik-Panel**
2. Wählen Sie eine **Kategorie**
3. Prüfen Sie:
   - **Verfügbarkeit**: Jahr-Anforderungen
   - **Kosten**: Einmaliger + monatlicher Preis
   - **Voraussetzungen**: Gebäude, Ressourcen, etc.
   - **Effekte**: Was passiert?
4. Klicken Sie auf "Einführen"
5. Bestätigen Sie

**Wichtig**:
- Manche Politiken **schließen sich gegenseitig aus**
  - z.B. "Freie Marktwirtschaft" ⚔️ "Planwirtschaft"
- Einige sind **temporär** (z.B. Kriegsrecht: 12 Monate)
- Monatliche Kosten werden automatisch abgezogen

### Politik-Beispiel: Öffentliches Gesundheitswesen

```
Name: Öffentliches Gesundheitswesen
Verfügbar ab: 1883
Kategorie: Gesundheit

Kosten:
- Einführung: 10,000 Gold
- Monatlich: 500 Gold

Voraussetzungen:
- 3 Hospitäler
- 30,000 Gold
- Jahr 1883+

Effekte:
Sofort:
- +20 Zufriedenheit
- +25 Popularität

Monatlich:
- +0.5% Bevölkerungswachstum
```

---

## 📜 Historische Ereignisse

### 27 Hauptereignisse

Von Jahr 0 bis 2050 erleben Sie **historische Meilensteine**:

#### Antike & Frühes Mittelalter
- Jahr 0: Geburt Christi
- Jahr 476: Fall Roms
- Jahr 800: Krönung Karls des Großen

#### Mittelalter
- Jahr 1215: Magna Carta
- Jahr 1347: Schwarzer Tod
- Jahr 1455: Gutenberg-Druckerpresse

#### Renaissance & Frühe Neuzeit
- Jahr 1492: Kolumbus entdeckt Amerika
- Jahr 1517: Luthers Reformation
- Jahr 1618: Dreißigjähriger Krieg

#### Aufklärung & Moderne
- Jahr 1789: Französische Revolution
- Jahr 1815: Wiener Kongress
- Jahr 1848: Revolutionen in Europa

#### Zeitgenössisch
- Jahr 1871: Deutsche Einigung
- Jahr 1914: Erster Weltkrieg
- Jahr 1939: Zweiter Weltkrieg
- Jahr 1989: Fall der Berliner Mauer

#### Zukunft
- Jahr 2030: KI-Revolution
- Jahr 2040: Fusionsenergie
- Jahr 2050: Weltraumkolonisierung

### Event-Interaktion

Wenn ein Ereignis eintritt:
1. **Popup erscheint** mit Beschreibung
2. Sie erhalten **Wahlmöglichkeiten**
3. Jede Wahl hat **Konsequenzen**
4. **Wikipedia-Link** für mehr Informationen (optional)

**Beispiel**:
```
Event: Schwarzer Tod (1347)

Die Pest wütet in Europa. Millionen sterben.

Optionen:
1. Quarantäne verhängen
   → -10 Gold, -20 Bevölkerung, +Stabilität
   
2. Hospitäler bauen
   → -5000 Gold, -10 Bevölkerung, +Prestige
   
3. Nichts tun
   → -50 Bevölkerung, -Stabilität
```

---

## 🤖 KI-Berater

### Ollama-Integration

Wenn Sie **Ollama** installiert haben, können Sie KI als Berater nutzen.

#### Installation

1. Laden Sie **Ollama** herunter: https://ollama.ai
2. Installieren und starten Sie Ollama
3. Laden Sie ein Modell:
   ```bash
   ollama pull llama2
   ```
4. Im Spiel: Aktivieren Sie KI-Features

#### 6 KI-Modelle

Jedes Modell hat eine **Persönlichkeit**:

1. **Llama 2** - Ausgewogen & Pragmatisch
   - Allgemeine Beratung
   
2. **Mistral** - Schnell & Effizient
   - Wirtschafts-Experte
   
3. **Code Llama** - Analytisch
   - Technologie-Fokus
   
4. **Neural Chat** - Diplomatisch
   - Soziale Politik
   
5. **Orca Mini** - Konservativ
   - Verteidigungs-Strategie
   
6. **Vicuna** - Kreativ
   - Kultur & Expansion

#### KI-Funktionen

**Als Berater**:
1. Öffnen Sie das **KI-Panel**
2. Wählen Sie ein **Modell**
3. Fragen Sie:
   - "Was sollte ich als nächstes bauen?"
   - "Welche Technologie sollte ich erforschen?"
   - "Ist diese Politik gut für mein Reich?"
4. Erhalten Sie **Empfehlungen**

**Event-Analyse**:
- Wenn ein Event auftritt, kann die KI:
  - Das Ereignis analysieren
  - Optionen bewerten
  - Eine Empfehlung geben
  - Risiken einschätzen

**Chat**:
```
Sie: Was ist die beste Strategie für schnelles Wachstum?

KI: Für schnelles Wachstum empfehle ich:
1. Baue mehr Farmen für Nahrung
2. Forsche Landwirtschaft für Bonus
3. Führe "Öffentliche Bildung" ein für Produktivität
4. Halte Steuern niedrig für Zufriedenheit
```

---

## 🌐 Multiplayer

### Bis zu 6 Spieler

Spielen Sie mit Freunden oder gegen KI.

#### Session erstellen

1. Klicken Sie auf **"Multiplayer"**
2. Wählen Sie **"Session erstellen"**
3. Konfigurieren Sie:
   - **Max. Spieler**: 2-6
   - **KI erlauben**: Ja/Nein
   - **Ollama-KI**: Ja/Nein
   - **Rundenbasiert**: Ja/Nein
   - **Passwort**: Optional
4. Klicken Sie auf **"Erstellen"**
5. Teilen Sie die **Session-ID** mit Freunden

#### Session beitreten

1. Klicken Sie auf **"Beitreten"**
2. Geben Sie **Session-ID** ein
3. Optional: **Passwort**
4. Klicken Sie auf **"Beitreten"**
5. Warten Sie in der **Lobby**
6. Klicken Sie auf **"Bereit"**
7. Host startet das Spiel

#### KI-Spieler hinzufügen

Als **Host**:
1. In der Lobby, klicken Sie **"KI hinzufügen"**
2. Wählen Sie Typ:
   - **Basic KI**: Einfache Computer-KI
   - **Ollama KI**: Intelligente KI mit Modell
3. Geben Sie einen Namen ein
4. Bei Ollama: Wählen Sie Modell

#### Spielmodi

**Echtzeit**:
- Alle Spieler agieren gleichzeitig
- Schnelles, dynamisches Gameplay

**Rundenbasiert**:
- Spieler sind der Reihe nach dran
- Strategisches, überlegtes Gameplay

#### Chat

- Klicken Sie auf **Chat-Symbol**
- Schreiben Sie eine Nachricht
- **Öffentlich**: Alle sehen
- **Privat**: Nur ein Spieler
- **System**: Automatische Nachrichten

---

## 💡 Tipps & Tricks

### Für Anfänger

1. **Starten Sie im Mittelalter** (Jahr 1200)
   - Gute Balance zwischen Einfachheit und Features
   
2. **Fokussieren Sie auf Gold**
   - Gold ist die wichtigste Ressource
   - Bauen Sie Märkte und Gilden
   
3. **Ignorieren Sie nicht die Nahrung**
   - Ohne Nahrung wächst Bevölkerung nicht
   - Mehr Bevölkerung = mehr Produktion
   
4. **Forschen Sie früh**
   - Technologien schalten wichtige Features frei
   - Priorisieren Sie Wirtschafts-Technologien
   
5. **Achten Sie auf Zufriedenheit**
   - Unzufriedene Bevölkerung → Rebellionen
   - Halten Sie Steuern moderat

### Fortgeschritten

1. **Politik-Synergien nutzen**
   - Kombinieren Sie Politiken für maximalen Effekt
   - Beispiel: "Öffentliche Bildung" + "Gleichstellung"
   
2. **Spezialisierung**
   - Fokussieren Sie auf einen Aspekt (Wirtschaft, Militär, Kultur)
   - Werden Sie der Beste in einem Bereich
   
3. **Timing ist alles**
   - Führen Sie Politiken zum richtigen Zeitpunkt ein
   - Bauen Sie Gebäude bevor Sie sie brauchen
   
4. **Langfristig planen**
   - Denken Sie 100 Jahre voraus
   - Bereiten Sie sich auf historische Ereignisse vor

### Experten-Strategien

1. **Rolle-Rushing**
   - Konzentrieren Sie sich auf schnellen Prestige-Gewinn
   - Erreichen Sie Kaiser-Rolle schnell für maximale Kontrolle
   
2. **Wirtschafts-Imperium**
   - Bauen Sie massives Handels-Netzwerk
   - Nutzen Sie "Freihandel" + "Kolonialhandel"
   - Dominieren Sie durch Gold
   
3. **Kultur-Sieg**
   - Bauen Sie Bibliotheken, Universitäten, Theater
   - Forschung maximieren
   - Nutzen Sie "Öffentliche Bildung"
   
4. **Event-Optimierung**
   - Bereiten Sie sich auf bekannte Events vor
   - Schwarzer Tod (1347): Bauen Sie Hospitäler vorher
   - Industrialisierung (1760): Haben Sie Kohle/Eisen

### Ressourcen-Management

**Gold-Farming**:
```
1. Baue 10+ Märkte
2. Forsche "Bankwesen"
3. Nutze "Freie Marktwirtschaft"
4. Handelsrouten maximieren
→ 10,000+ Gold/Monat
```

**Schnelles Bevölkerungs-Wachstum**:
```
1. Baue viele Farmen
2. "Öffentliches Gesundheitswesen"
3. "Sozialfürsorge"
4. Niedrige Steuern
→ +5% Wachstum/Monat
```

**Prestige-Boost**:
```
1. Baue Burgen, Kathedralen
2. Forsche fortgeschrittene Technologien
3. "Religiöse Toleranz"
4. Gewinne Schlachten
→ Schneller Aufstieg
```

---

## 🆘 Häufige Probleme

### "Ich habe kein Gold mehr!"
- **Lösung**: Reduzieren Sie Ausgaben
  - Verkaufen Sie unnötige Gebäude
  - Widerrufen Sie teure Politiken
  - Erhöhen Sie Steuern temporär

### "Meine Bevölkerung ist unglücklich"
- **Lösung**: Erhöhen Sie Zufriedenheit
  - Senken Sie Steuern
  - Führen Sie Sozial-Politiken ein
  - Bauen Sie mehr Sozial-Gebäude

### "Ich kann nicht aufsteigen"
- **Lösung**: Prüfen Sie Anforderungen
  - Verdienen Sie mehr Prestige
  - Sammeln Sie Gold
  - Erhöhen Sie Autorität

### "Events sind zu schwer"
- **Lösung**: Schwierigkeitsgrad anpassen
  - Speichern Sie oft
  - Bereiten Sie sich vor
  - Nutzen Sie KI-Berater

---

## 📚 Weitere Hilfe

- **[API-Referenz](API_REFERENCE.md)** - Für Modder und Entwickler
- **[Architektur](ARCHITECTURE.md)** - Technische Details
- **[Neue Features](NEW_FEATURES.md)** - Detaillierte Feature-Dokumentation
- **[Roadmap](ROADMAP.md)** - Kommende Features
- **GitHub Issues**: Bug-Reports und Fragen

---

## 🎮 Viel Erfolg!

**Erlebe Geschichte. Erschaffe Deine Dynastie. Herrsche über Deutschland!**

---

**Letzte Aktualisierung**: Dezember 2025  
**Version**: 2.0.0

_Entwickelt mit ❤️ für Geschichts- und Strategiespiel-Fans_
