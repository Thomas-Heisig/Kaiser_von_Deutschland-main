# Berufswechsel & Soziale Mobilität (Social Mobility System)

## Übersicht

Das Social Mobility System simuliert realistische Karrierewechsel und soziale Mobilität in der Bevölkerung. Bürger können basierend auf ihren Fähigkeiten, ihrem Vermögen und den Bedingungen im Königreich ihren Beruf wechseln und in höhere oder niedrigere soziale Klassen aufsteigen.

## Features

### Soziale Klassen

Das System unterscheidet 6 soziale Klassen:

1. **Unterschicht (Lower)** - Mindestvermögen: 0
   - Berufe: Bettler, Tagelöhner, Leibeigener
   - Mobilitätsrate: 5% pro Jahr

2. **Arbeiterklasse (Working)** - Mindestvermögen: 100
   - Berufe: Bauer, Arbeiter, Diener, Soldat
   - Mobilitätsrate: 10% pro Jahr

3. **Mittelschicht (Middle)** - Mindestvermögen: 1.000
   - Berufe: Handwerker, Händler, Schreiber, Lehrer
   - Mobilitätsrate: 15% pro Jahr

4. **Obere Mittelschicht (Upper Middle)** - Mindestvermögen: 10.000
   - Berufe: Gildenmeister, Bankier, Architekt, Arzt, Gelehrter
   - Mobilitätsrate: 12% pro Jahr

5. **Oberschicht (Upper)** - Mindestvermögen: 50.000
   - Berufe: Fabrikbesitzer, Großhändler, Diplomat, General
   - Mobilitätsrate: 8% pro Jahr

6. **Adel (Nobility)** - Mindestvermögen: 100.000
   - Berufe: Herzog/Herzogin, König/Königin, Kaiser/Kaiserin
   - Mobilitätsrate: 2% pro Jahr

### Karrierepfade

Definierte Karrierepfade mit Schwierigkeit und Anforderungen:

**Aufwärts-Mobilität:**
- Bauer → Handwerker (Schwierigkeit: 30, benötigt Bildung: 20)
- Bauer → Soldat (Schwierigkeit: 20, Alter: 18-35)
- Arbeiter → Handwerker (Schwierigkeit: 40, benötigt Bildung: 30)
- Handwerker → Gildenmeister (Schwierigkeit: 50, Bildung: 50, Vermögen: 5.000)
- Händler → Bankier (Schwierigkeit: 60, Bildung: 60, Vermögen: 10.000)
- Handwerker → Architekt (Schwierigkeit: 70, Bildung: 70, Vermögen: 5.000)
- Soldat → General (Schwierigkeit: 80, Bildung: 50, Verbindungen: 60)

**Seitliche Mobilität:**
- Handwerker ↔ Händler
- Lehrer → Gelehrter

**Abwärts-Mobilität:**
- Händler → Arbeiter (bei Misserfolg/Unglück)
- Handwerker → Bauer (bei Misserfolg/Unglück)

### Berechnungsfaktoren

Die Wahrscheinlichkeit für einen erfolgreichen Karrierowechsel hängt ab von:

1. **Bildung (Education)**: Höhere Bildung erleichtert Aufstiege
2. **Vermögen (Wealth)**: Kapital für Geschäftsgründungen oder Investitionen
3. **Verbindungen (Connections)**: Soziales Netzwerk und Kontakte
4. **Alter (Age)**: Junge Erwachsene (18-35) sind mobiler
5. **Soziale Stabilität**: Höheres Königreichs-Glück = mehr Mobilität
6. **Berufsschwierigkeit**: Jeder Karrierepfad hat eine Schwierigkeit (0-100)

### Automatische Verarbeitung

- **Zeitpunkt**: Jährlich am Ende des Jahres
- **Teilnahmerate**: ~5% der Bevölkerung versucht pro Jahr einen Karrierewechsel
- **Skalierung**: 
  - Unter 10.000 Bürgern: Individuelle Simulation
  - 10.000-100.000: Hybrid (wichtige Bürger individuell, andere aggregiert)
  - Über 100.000: Statistische Aggregation

### UI-Features

Das **Social Mobility Panel** zeigt:

1. **Mobilitäts-Statistiken**
   - Gesamte Berufswechsel
   - Aufwärts-Mobilität (% und Anzahl)
   - Abwärts-Mobilität (% und Anzahl)
   - Seitliche Mobilität (% und Anzahl)
   - Erfolgsrate

2. **Mobilität nach Sozialklasse**
   - Visuelle Verteilung mit Fortschrittsbalken
   - Prozentsatz pro Klasse

3. **Beliebte Karrierewechsel**
   - Top 10 Berufsübergänge
   - Anzahl und Prozentsatz

### Zugriff

- **UI-Button**: Im Königreich-Panel unter "📈 Berufswechsel (v2.1.5)"
- **Position**: Neben dem Migrations-Button
- **Auto-Update**: Alle 2 Sekunden

## Technische Details

### API

```typescript
// GameEngine
const mobilitySystem = engine.getSocialMobilitySystem();

// Statistiken abrufen
const stats = mobilitySystem.getMobilityStats();

// Manuelle Karriere-Änderung versuchen (für Spieler-Charaktere)
const result = mobilitySystem.attemptCareerChange(
  citizenId,
  currentProfession,
  targetProfession,
  education,
  wealth,
  connections,
  age,
  socialStability
);

// Aggregierte Verarbeitung (wird automatisch jährlich ausgeführt)
const changes = mobilitySystem.processCareerChanges(
  population,
  professionDistribution,
  avgEducation,
  avgWealth,
  avgConnections,
  avgAge,
  socialStability,
  yearlyRate
);
```

### CitizenSystem

```typescript
// Beruf wechseln
citizenSystem.changeProfession(
  citizenId,
  newProfession,
  year,
  month,
  reason
);

// Berufsverteilung abrufen
const distribution = citizenSystem.getProfessionDistribution();

// Durchschnittliche Statistiken
const avgStats = citizenSystem.getAverageStats();
```

## Balance & Gameplay

### Strategische Überlegungen

1. **Bildungsinvestitionen**: Höhere Bildung erhöht Aufstiegschancen
2. **Wirtschaftspolitik**: Wohlstand ermöglicht Karrierewechsel
3. **Soziale Stabilität**: Glückliche Bürger = mehr Mobilität
4. **Altersdynamik**: Junge Bevölkerung = dynamischere Wirtschaft

### Realistisches Verhalten

- Nicht jeder Karrierewechsel ist erfolgreich
- Abwärts-Mobilität tritt bei Krisen auf
- Adel bleibt weitgehend stabil (niedrige Mobilitätsrate)
- Mittelschicht hat höchste Mobilität

## Zukünftige Erweiterungen

Geplante Features (siehe ROADMAP.md):

- [ ] Spieler kann manuell Bürger-Karrieren beeinflussen
- [ ] Bildungsreformen erhöhen Mobilitätsraten
- [ ] Gilden und Zünfte beeinflussen Karrierepfade
- [ ] Historische Ereignisse (Revolutionen) erhöhen Mobilität
- [ ] Multiplayer: Spieler können Karrieren anderer Spieler-Bürger beeinflussen

## Version

- **Eingeführt in**: v2.1.5 (Dezember 2025)
- **Status**: ✅ Vollständig implementiert
- **Roadmap**: Kapitel I: Das Lebendige Reich
