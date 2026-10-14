# 🎮 Integrated Systems Guide (v2.4.0)

**Letzte Aktualisierung**: Dezember 2025  
**Status**: ✅ Integriert und bereit für Gameplay

## Übersicht

Mit Version 2.4.0 wurden 17 bereits erstellte Roadmap-Systeme in das Gameplay integriert. Diese Systeme sind nun über die `GameEngine` zugänglich und können von der UI und dem Gameplay-Code verwendet werden.

## Zugriff auf integrierte Systeme

### Über GameEngine

Alle Systeme sind über Getter-Methoden in der `GameEngine` verfügbar:

```typescript
const gameEngine = new GameEngine();

// Einzelne Systeme abrufen
const religionSystem = gameEngine.getReligionSystem();
const migrationSystem = gameEngine.getMigrationSystem();
const espionageSystem = gameEngine.getEspionageSystem();

// Übersicht über alle Systeme
const allStats = gameEngine.getIntegratedSystemsStats();
```

## Verfügbare Systeme

### 1. ⛪ ReligionSystem

**Zweck**: Verwaltung von Religionen, religiösen Gebäuden, Konversion und religiösen Spannungen

**Zugriff**:
```typescript
const religionSystem = gameEngine.getReligionSystem();
```

**Wichtige Methoden**:
- `getDominantReligion()` - Die vorherrschende Religion
- `getAllReligions()` - Alle verfügbaren Religionen
- `convertCitizen(citizenId, newReligion)` - Bürger bekehren
- `buildReligiousBuilding(type, location)` - Religiöses Gebäude bauen

**Features**:
- 10 verschiedene Religionen (Katholizismus, Protestantismus, Orthodoxie, Islam, etc.)
- Religiöse Gebäude (Kapelle, Kirche, Kathedrale, Kloster)
- Konversionsmechaniken
- Religiöse Spannungen und Konflikte

---

### 2. 🚶 MigrationSystem

**Zweck**: Simulation von Bevölkerungsbewegungen zwischen Regionen

**Zugriff**:
```typescript
const migrationSystem = gameEngine.getMigrationSystem();
```

**Wichtige Methoden**:
- `getMigrationStats()` - Statistiken über Migrationen
- `calculateRegionAttractiveness(regionId, ...)` - Attraktivität einer Region berechnen
- `processMigration(flow)` - Migration durchführen

**Features**:
- Wirtschaftlich motivierte Migration
- Flucht vor Krieg, Hunger, Krankheit
- Familiennachzug
- Push- und Pull-Faktoren
- Skalierbar für große Populationen

---

### 3. 📈 SocialMobilitySystem

**Zweck**: Simulation von Klassenwechsel und sozialem Aufstieg

**Zugriff**:
```typescript
const socialMobilitySystem = gameEngine.getSocialMobilitySystem();
```

**Wichtige Methoden**:
- `getMobilityStats()` - Mobilitätsstatistiken
- `processMobility(citizen)` - Soziale Mobilität für einen Bürger
- `getMobilityProbability(from, to)` - Wahrscheinlichkeit eines Klassenwechsels

**Features**:
- Aufstieg durch Bildung
- Wirtschaftlicher Aufstieg/Abstieg
- Vererbung von sozialem Status
- Revolutionen und soziale Bewegungen

---

### 4. 🌾 FamineSystem

**Zweck**: Simulation von Hungersnöten mit Ursachen und Auswirkungen

**Zugriff**:
```typescript
const famineSystem = gameEngine.getFamineSystem();
```

**Wichtige Methoden**:
- `getActiveFamines()` - Aktive Hungersnöte
- `checkForFamine(region)` - Prüfen auf Hungersnot
- `getFamineRisk(region)` - Hungersnot-Risiko berechnen

**Features**:
- Regionale Hungersnöte
- Ursachen: Dürre, Krieg, Missernten
- Auswirkungen auf Bevölkerung
- Hilfsprogramme und Gegenmaßnahmen

---

### 5. 💰 EconomicCohortSystem

**Zweck**: Skalierbare Wirtschaftssimulation für Millionen von Bürgern

**Zugriff**:
```typescript
const economicCohortSystem = gameEngine.getEconomicCohortSystem();
```

**Wichtige Methoden**:
- `getCohorts()` - Alle wirtschaftlichen Kohorten
- `createCohort(profession, count)` - Neue Kohorte erstellen
- `processEconomy(totalPopulation)` - Wirtschaft verarbeiten

**Features**:
- Gruppierung ähnlicher Bürger
- Bis zu 100.000 Bürger pro Kohorte
- Regionale Wirtschaften
- Handelsrouten zwischen Regionen
- Skalierbar bis 80 Millionen Bürger

---

### 6. ⚔️ BattleTerrainWeatherSystem

**Zweck**: Gelände- und Wettereffekte auf Schlachten

**Zugriff**:
```typescript
const battleTerrainWeatherSystem = gameEngine.getBattleTerrainWeatherSystem();
```

**Wichtige Methoden**:
- `getTerrainModifier(terrain, unit)` - Geländemodifikator
- `getWeatherModifier(weather, unit)` - Wettermodifikator
- `applyModifiers(battle)` - Modifikatoren anwenden

**Features**:
- Geländetypen: Ebene, Hügel, Berge, Wald, Sumpf, etc.
- Wettereffekte: Regen, Schnee, Nebel, etc.
- Einheitenspezifische Modifikatoren
- Realistische Kampfsimulation

---

### 7. 🎖️ UnitFormationSystem

**Zweck**: Militärische Formationen und Taktiken

**Zugriff**:
```typescript
const unitFormationSystem = gameEngine.getUnitFormationSystem();
```

**Wichtige Methoden**:
- `getFormation(id)` - Formation abrufen
- `createFormation(type, units)` - Formation erstellen
- `applyFormationBonus(formation)` - Formationsboni anwenden

**Features**:
- Verschiedene Formationen (Phalanx, Keil, Linie, etc.)
- Formationsboni und -mali
- Taktische Flexibilität
- Historisch korrekte Formationen

---

### 8. 📦 SupplyLogisticsSystem

**Zweck**: Militärische Versorgungslinien

**Zugriff**:
```typescript
const supplyLogisticsSystem = gameEngine.getSupplyLogisticsSystem();
```

**Wichtige Methoden**:
- `createSupplyDepot(location)` - Versorgungsdepot erstellen
- `calculateSupplyLine(from, to)` - Versorgungslinie berechnen
- `checkSupplyStatus(army)` - Versorgungsstatus prüfen

**Features**:
- Versorgungsdepots
- Versorgungslinien
- Unterbrechung von Versorgungslinien
- Auswirkungen auf Moral und Kampfkraft

---

### 9. 🏰 SiegeWarfareSystem

**Zweck**: Belagerungskriegsführung

**Zugriff**:
```typescript
const siegeWarfareSystem = gameEngine.getSiegeWarfareSystem();
```

**Wichtige Methoden**:
- `getActiveSieges()` - Aktive Belagerungen
- `startSiege(attacker, defender, city)` - Belagerung beginnen
- `processSiegeTurn(siege)` - Belagerungsrunde verarbeiten

**Features**:
- Belagerungswerkzeuge (Katapulte, Rammen, Türme)
- Stadtmauern mit Haltbarkeit
- Versorgungsprobleme
- Ausbruchsversuche
- Verhandlungen und Kapitulation

---

### 10. 🕵️ EspionageSystem

**Zweck**: Spionage und verdeckte Operationen

**Zugriff**:
```typescript
const espionageSystem = gameEngine.getEspionageSystem();
```

**Wichtige Methoden**:
- `recruitAgent(kingdom)` - Agent rekrutieren
- `sendMission(agent, target, type)` - Mission senden
- `getMissionStatus(missionId)` - Missionsstatus abrufen

**Features**:
- Agentennetzwerke
- Verschiedene Missionstypen (Spionage, Sabotage, Attentate)
- Gegenspionage
- Doppeltagenten
- Informationsgewinnung

---

### 11. 🏙️ UrbanDistrictsSystem

**Zweck**: Stadtbezirke und urbane Dynamiken

**Zugriff**:
```typescript
const urbanDistrictsSystem = gameEngine.getUrbanDistrictsSystem();
```

**Wichtige Methoden**:
- `getDistricts()` - Alle Bezirke
- `createDistrict(type, location)` - Bezirk erstellen
- `getDistrictStats(districtId)` - Bezirksstatistiken

**Features**:
- 7 Bezirkstypen (Slum, Mittelklasse, Nobelbereich, etc.)
- Gentrifizierung
- Kriminalitäts-Hotspots
- Bezirksrivalitäten
- Infrastrukturentwicklung

---

### 12. 🌙 DayNightCycleSystem

**Zweck**: Tag/Nacht-Zyklus mit zeitabhängigen Aktivitäten

**Zugriff**:
```typescript
const dayNightCycleSystem = gameEngine.getDayNightCycleSystem();
```

**Wichtige Methoden**:
- `getCurrentTime()` - Aktuelle Uhrzeit
- `isDay()` - Ist es Tag?
- `isNight()` - Ist es Nacht?

**Features**:
- 24-Stunden-Zyklus
- Sonnenauf- und -untergang
- Zeitabhängige Aktivitäten
- Beleuchtung und Nachtwache
- Marktzeiten

---

### 13. 🎨 ArtsAndCultureSystem

**Zweck**: Kunst, Kultur und kulturelle Aktivitäten

**Zugriff**:
```typescript
const artsAndCultureSystem = gameEngine.getArtsAndCultureSystem();
```

**Wichtige Methoden**:
- `getCulturalCircles()` - Kulturelle Kreise
- `createArtwork(artist, type)` - Kunstwerk erstellen
- `organizePerformance(type, location)` - Aufführung organisieren

**Features**:
- Künstler (Maler, Musiker, Schriftsteller)
- Kunstwerke
- Aufführungen (Konzerte, Theater, Opern)
- Kulturelle Kreise
- 11 Kunststile von Romanik bis Postmoderne

---

### 14. 📜 HistoricalEventSystem

**Zweck**: Erweiterte historische Ereignisse

**Zugriff**:
```typescript
const historicalEventSystem = gameEngine.getHistoricalEventSystem();
```

**Wichtige Methoden**:
- `getEventsForYear(year)` - Events für ein Jahr
- `triggerEvent(eventId)` - Event auslösen
- `getEventChains()` - Event-Ketten abrufen

**Features**:
- 70+ historische Events
- Event-Ketten (Kreuzzüge, Weltkriege, etc.)
- Alternative Geschichte
- Spielerentscheidungen mit Konsequenzen

---

### 15. 📰 InformationSpreadSystem

**Zweck**: Nachrichten, Gerüchte und Propaganda

**Zugriff**:
```typescript
const informationSpreadSystem = gameEngine.getInformationSpreadSystem();
```

**Wichtige Methoden**:
- `spreadNews(news)` - Nachricht verbreiten
- `createRumor(rumor)` - Gerücht erstellen
- `launchPropagandaCampaign(campaign)` - Propagandakampagne starten

**Features**:
- Nachrichtensystem
- Gerüchteverbreitung
- Propaganda
- Soziale Netzwerke
- Informationsgeschwindigkeit

---

### 16. ⚖️ LegalAndCourtSystem

**Zweck**: Rechtssystem und Gerichtsbarkeit

**Zugriff**:
```typescript
const legalAndCourtSystem = gameEngine.getLegalAndCourtSystem();
```

**Wichtige Methoden**:
- `fileCase(case)` - Fall einreichen
- `conductTrial(caseId)` - Gerichtsverfahren durchführen
- `sendToPrison(citizenId, duration)` - Ins Gefängnis schicken

**Features**:
- 9 Verbrechenstypen
- 4 Gerichtstypen
- Richter und Anwälte
- Gefängnisse
- Korruption und Bestechung
- 10 historische Rechtssysteme

---

## Verwendungsbeispiele

### Beispiel 1: Religion und Migration

```typescript
// Check dominant religion
const dominantReligion = gameEngine.getReligionSystem().getDominantReligion();

// Calculate regional attractiveness based on religion
const migrationSystem = gameEngine.getMigrationSystem();
const attractiveness = migrationSystem.calculateRegionAttractiveness(
  'bavaria',
  employmentRate,
  wages,
  safety,
  infrastructure,
  foodSupply,
  diseaseRate
);
```

### Beispiel 2: Militär und Belagerung

```typescript
// Create military formation
const formationSystem = gameEngine.getUnitFormationSystem();
const phalanx = formationSystem.createFormation('phalanx', units);

// Start siege with supply considerations
const siegeSystem = gameEngine.getSiegeWarfareSystem();
const supplySystem = gameEngine.getSupplyLogisticsSystem();

const siege = siegeSystem.startSiege(attacker, defender, city);
const supplyStatus = supplySystem.checkSupplyStatus(attacker.army);
```

### Beispiel 3: Urban Development

```typescript
// Create city district
const urbanSystem = gameEngine.getUrbanDistrictsSystem();
const district = urbanSystem.createDistrict('noble', location);

// Check day/night cycle for activities
const dayNight = gameEngine.getDayNightCycleSystem();
if (dayNight.isDay()) {
  // Open markets
} else {
  // Activate night watch
}
```

## Integration in UI

Die UI kann die Systeme über die `getIntegratedSystemsStats()` Methode abfragen:

```typescript
const stats = gameEngine.getIntegratedSystemsStats();

// Display religion info
console.log('Dominant Religion:', stats.religion.dominantReligion);

// Display migration stats
console.log('Migration Stats:', stats.migration.stats);

// Display active sieges
console.log('Active Sieges:', stats.military.activeSieges);
```

## Zukünftige Entwicklungen

### Geplante Features für v2.5.0

- ✅ Automatische monatliche/jährliche Verarbeitung für alle Systeme
- ✅ Vollständige UI-Integration
- ✅ Multiplayer-Synchronisation
- ✅ Performance-Optimierung
- ✅ Tutorial-System für neue Systeme

### Integration Roadmap

1. **Phase 1** (Aktuell): Systeme verfügbar via Getter
2. **Phase 2**: Automatische Verarbeitung in monthly/yearly Ticks
3. **Phase 3**: UI-Panels für alle Systeme
4. **Phase 4**: Spieler-Interaktionen und Entscheidungen
5. **Phase 5**: Multiplayer-Events und Kooperation

## Troubleshooting

### Problem: System gibt keine Daten zurück

**Lösung**: Prüfen, ob das System initialisiert wurde:
```typescript
const system = gameEngine.getReligionSystem();
if (!system) {
  console.error('ReligionSystem not initialized');
}
```

### Problem: Methode nicht gefunden

**Lösung**: Prüfen, ob die Methode für das System existiert. Einige Systeme haben unterschiedliche Methoden. Siehe API-Dokumentation.

### Problem: Performance-Probleme

**Lösung**: Verwenden Sie EconomicCohortSystem für große Populationen statt individuelle Bürger-Verarbeitung.

## Support

- **Dokumentation**: [docs/README.md](./README.md)
- **API-Referenz**: [API_REFERENCE.md](./API_REFERENCE.md)
- **GitHub Issues**: [Issues](https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/issues)

---

**Version**: 2.4.0  
**Letzte Aktualisierung**: Dezember 2025  
**Status**: ✅ Production Ready

_Entwickelt mit ❤️ für komplexe Geschichtssimulation_
