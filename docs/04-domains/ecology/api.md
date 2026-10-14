# 🌍 Ökologische Simulation - API Referenz

**Version**: 2.2.3  
**Status**: Implementiert (Dezember 2025)

Die Ökologische Simulation fügt eine lebendige Umwelt zu Kaiser von Deutschland hinzu, mit dynamischem Klima, Landschaftsveränderungen und Tierpopulationen.

---

## 📋 Inhaltsverzeichnis

- [ClimateSystem](#climatesystem)
- [LandscapeSystem](#landscapesystem)
- [AnimalPopulationSystem](#animalpopulationsystem)
- [Integration mit GameEngine](#integration-mit-gameengine)
- [Multiplayer-Features](#multiplayer-features)
- [Beispiele](#beispiele)

---

## ClimateSystem

Das Klimasystem verwaltet Jahreszeiten, Wetter, Klimawandel, Naturkatastrophen und Ressourcen-Regeneration.

### Hauptfunktionen

#### `updateMonth(year: number, month: number, industrializationLevel: number): void`

Aktualisiert das Klima für einen Monat.

**Parameter:**
- `year` - Aktuelles Jahr
- `month` - Aktueller Monat (1-12)
- `industrializationLevel` - Industrialisierungsgrad (0-100)

**Effekte:**
- Aktualisiert Jahreszeit basierend auf Monat
- Generiert Wetter für den Monat
- Berechnet Klimawandel-Effekte
- Regeneriert natürliche Ressourcen
- Prüft auf Naturkatastrophen

#### `getSeasonalEffects(season?: Season): SeasonalEffects`

Gibt die Effekte einer Jahreszeit zurück.

**Rückgabe:**
```typescript
{
  foodProductionModifier: number;    // Multiplikator für Nahrungsproduktion
  happinessModifier: number;         // Multiplikator für Zufriedenheit
  diseaseSpreadModifier: number;     // Multiplikator für Krankheitsausbreitung
  travelSpeedModifier: number;       // Multiplikator für Reisegeschwindigkeit
  buildingCostModifier: number;      // Multiplikator für Baukosten
  militaryEfficiencyModifier: number; // Multiplikator für Militäreffizienz
}
```

#### `getWeatherEffects(): { foodModifier, happinessModifier, buildingSpeedModifier }`

Gibt die aktuellen Wettereffekte zurück.

#### `createForecast(year: number, month: number, techLevel: number): WeatherForecast | null`

Erstellt eine Wettervorhersage (nur wenn Vorhersage-Technologie aktiviert ist).

**Parameter:**
- `techLevel` - Technologieniveau (0-100), beeinflusst Genauigkeit

**Rückgabe:**
```typescript
{
  year: number;
  month: number;
  predictedWeather: WeatherType;
  disasterRisk: number;        // 0-1
  accuracy: number;            // 0-1
  predictedTemperature: number;
  predictedPrecipitation: number;
}
```

#### `harvestResource(type: ResourceType, amount: number, year: number): number`

Erntet eine natürliche Ressource.

**Ressourcentypen:**
- `wood` - Holz (regeneriert)
- `stone` - Stein (regeneriert nicht)
- `iron` - Eisen (regeneriert nicht)
- `fish` - Fische (regenerieren)
- `game` - Wildtiere (regenerieren)
- `fertile_soil` - Fruchtbarer Boden (regeneriert langsam)

#### `getClimateChange(): ClimateChangeData`

Gibt aktuelle Klimawandel-Daten zurück.

```typescript
{
  globalTemperature: number;        // Relative Temperatur (°C)
  co2Level: number;                 // CO2 in ppm
  seaLevel: number;                 // Meeresspiegel über Baseline (m)
  extremeWeatherFrequency: number;  // Multiplikator für Katastrophen
  desertificationRate: number;      // Wüstenbildungsrate (% pro Jahrhundert)
  glacierMelting: number;           // % geschmolzene Gletscher
}
```

### Naturkatastrophen

Katastrophentypen:
- `flood` - Überschwemmung
- `drought` - Dürre
- `storm` - Sturm
- `tornado` - Tornado
- `earthquake` - Erdbeben
- `wildfire` - Waldbrand
- `blizzard` - Schneesturm
- `hurricane` - Hurrikan
- `hailstorm` - Hagelsturm
- `locust_plague` - Heuschreckenplage

#### `getActiveDisasters(): NaturalDisaster[]`

Gibt alle aktiven (nicht gelösten) Katastrophen zurück.

#### `resolveDisaster(id: string): boolean`

Markiert eine Katastrophe als gelöst.

---

## LandscapeSystem

Das Landschaftssystem verwaltet Terrain-Änderungen, Wälder, Flüsse, Bodenqualität und Terraforming-Projekte.

### Hauptfunktionen

#### `updateYear(year: number, population: number, industrialization: number, climateTemperature: number): void`

Aktualisiert die Landschaft für ein Jahr.

**Effekte:**
- Aktualisiert Bodenqualität
- Verarbeitet Entwaldung basierend auf Bevölkerung
- Aktualisiert Flussläufe
- Prüft auf natürliche Veränderungen (Erosion, Wüstenbildung)
- Aktualisiert Terraforming-Projekte

#### `plantForest(area: number, year: number, cost: number): boolean`

Führt Aufforstung durch.

**Parameter:**
- `area` - Fläche in Hektar
- `year` - Aktuelles Jahr
- `cost` - Kosten (nur zur Information)

**Effekte:**
- Erstellt neuen Wald
- Verbessert Biodiversität
- Reduziert Überschwemmungsrisiko

#### `startTerraformingProject(type, area, location, year): TerraformingProject`

Startet ein Terraforming-Projekt.

**Projekt-Typen:**
- `land_reclamation` - Landgewinnung (10 Jahre, 50.000 Gold)
- `mountain_leveling` - Bergabtragung (20 Jahre, 100.000 Gold)
- `marsh_drainage` - Sumpftrockenlegung (5 Jahre, 20.000 Gold)
- `irrigation` - Bewässerung (3 Jahre, 15.000 Gold)

#### `improveSoil(x: number, y: number, year: number): boolean`

Verbessert die Bodenqualität an einer Position.

**Effekte:**
- +20 Fruchtbarkeit
- +15 Organische Materie
- -10 Erosion

#### `divertRiver(riverId: string, year: number, cost: number): boolean`

Lenkt einen Fluss um.

**Effekte:**
- Verändert Flusslauf
- Kann Überschwemmungsrisiko reduzieren
- Kann Nahrungsproduktion verbessern

### Getter-Methoden

- `getForests(): Forest[]` - Alle Wälder
- `getRivers(): River[]` - Alle Flüsse
- `getLandUse(): LandUse` - Landnutzungsstatistik
- `getRecentChanges(years: number): LandscapeChange[]` - Aktuelle Landschaftsveränderungen
- `getActiveProjects(): TerraformingProject[]` - Aktive Terraforming-Projekte
- `getAverageSoilQuality(): number` - Durchschnittliche Bodenqualität (0-100)
- `getTotalForestArea(): number` - Gesamte Waldfläche

---

## AnimalPopulationSystem

Das Tierpopulationssystem verwaltet Wildtiere, Viehzucht, Fischerei, Jagd und Artenschutz.

### Hauptfunktionen

#### `updateYear(year, forestArea, waterPollution, huntingPressure, climateTemperature): void`

Aktualisiert Tierpopulationen für ein Jahr.

**Effekte:**
- Natürliches Populationswachstum
- Migrationen (saisonale Arten)
- Jagddruck-Auswirkungen
- Umwelt-Einflüsse (Habitat-Verlust, Verschmutzung)
- Artenschutz-Programme
- Aussterbe-Checks

#### `huntSpecies(speciesId, amount, year, month, location, legal): HuntingEvent | null`

Jagt eine Spezies.

**Parameter:**
- `legal` - Ob die Jagd legal ist (beeinflusst Artenschutz-Status)

**Rückgabe:**
```typescript
{
  id: string;
  speciesId: string;
  year: number;
  month: number;
  huntedAmount: number;
  location: { x: number; y: number };
  legalHunt: boolean;
  yield: {
    meat: number;
    fur: number;
    other: number;
  }
}
```

#### `createLivestockFarm(speciesId, location, capacity): LivestockFarm | null`

Erstellt einen Viehzucht-Betrieb.

**Vieharten:**
- `cattle` - Rind (Fleisch, Milch, Leder)
- `sheep` - Schaf (Fleisch, Wolle)
- `pig` - Schwein (Fleisch)
- `chicken` - Huhn (Fleisch, Eier)

#### `fishInWaterbody(waterbodyId, amount, year): { caught, species }`

Fischt in einem Gewässer.

**Rückgabe:**
- `caught` - Anzahl gefangener Fische
- `species` - Array von gefangenen Spezies-IDs

#### `startConservationProgram(speciesId, budget, protectedArea, year): ConservationProgram`

Startet ein Artenschutz-Programm.

**Parameter:**
- `budget` - Budget (beeinflusst Effektivität)
- `protectedArea` - Schutzgebiet in Hektar

**Effektivität:**
- Berechnet sich aus Budget und Schutzgebiet
- Boostet Populations-Erholung um bis zu 5% pro Jahr

### Wildtier-Spezies

Vorhandene Wildtiere:
- **Rothirsch** (Red Deer): 50.000 Population, Wert 150 Gold
- **Wildschwein** (Wild Boar): 30.000 Population, Wert 120 Gold
- **Wolf** (Gray Wolf): 5.000 Population, Wert 200 Gold (bedroht)
- **Braunbär** (Brown Bear): 2.000 Population, Wert 300 Gold (gefährdet)

### Fisch-Spezies

- **Bachforelle** (Brown Trout): 200.000 Population
- **Karpfen** (Common Carp): 300.000 Population
- **Hecht** (Northern Pike): 80.000 Population

### Gefährdungsstatus

- `abundant` - Reichlich vorhanden
- `common` - Häufig
- `uncommon` - Selten
- `threatened` - Bedroht
- `endangered` - Gefährdet
- `critically_endangered` - Stark gefährdet
- `extinct` - Ausgestorben

---

## Integration mit GameEngine

### Zugriff auf Systeme

```typescript
// Klima-System
const climateSystem = gameEngine.getClimateSystem();
const season = climateSystem.getCurrentSeason();
const weather = climateSystem.getCurrentWeather();

// Landschafts-System
const landscapeSystem = gameEngine.getLandscapeSystem();
const forests = landscapeSystem.getForests();
const soilQuality = landscapeSystem.getAverageSoilQuality();

// Tierpopulations-System
const animalSystem = gameEngine.getAnimalPopulationSystem();
const wildlife = animalSystem.getWildlifeSpecies();
const endangered = animalSystem.getEndangeredSpecies();
```

### Ökologische Statistiken

```typescript
const ecoStats = gameEngine.getEcologicalStats();

console.log(ecoStats.climate);      // Klima-Daten
console.log(ecoStats.landscape);    // Landschafts-Daten
console.log(ecoStats.animals);      // Tierpopulations-Daten
```

### Event-Handling

Das GameEngine emittiert Events für ökologische Ereignisse:

```typescript
gameEngine.on('naturalDisaster', (event) => {
  console.log(`Katastrophe: ${event.disaster.type}`);
  console.log(`Schwere: ${event.disaster.severity}`);
  console.log(`Opfer: ${event.disaster.casualties}`);
});

gameEngine.on('yearAdvanced', (event) => {
  // Jährliche ökologische Updates werden hier verarbeitet
});
```

---

## Multiplayer-Features

### Gemeinsame Umweltkrisen

Naturkatastrophen können mehrere Spieler gleichzeitig betreffen. Spieler können kooperieren, um Katastrophen zu bewältigen:

```typescript
// Katastrophe betrifft mehrere Regionen
const disaster = {
  type: 'flood',
  severity: 8,
  affectedRegions: ['player1-region', 'player2-region']
};
```

### Jagdkonflikte

Spieler konkurrieren um begrenzte Wildtier-Ressourcen:

```typescript
// Spieler 1 jagt
animalSystem.huntSpecies('deer', 100, year, month, location);

// Reduziert verfügbare Population für Spieler 2
const remainingDeer = animalSystem.getSpecies('deer').population;
```

### Grenzstreitigkeiten

Landschaftsveränderungen (z.B. Flussumleitung) können Grenzstreitigkeiten auslösen:

```typescript
// Spieler lenkt Fluss um, betrifft Nachbar-Region
landscapeSystem.divertRiver('river-1', year, 10000);
// Trigger: BorderDispute Event
```

### Kooperativer Artenschutz

Spieler können gemeinsame Artenschutz-Programme durchführen mit Bonus-Multiplikator:

```typescript
// Multiplayer-Bonus: 1.5x Effektivität
const program = animalSystem.startConservationProgram(
  'bear',
  20000,  // Budget
  5000,   // Schutzgebiet
  year
);
// Bei Kooperation: Effektivität * 1.5
```

---

## Beispiele

### Beispiel 1: Klimawandel überwachen

```typescript
const climateSystem = gameEngine.getClimateSystem();
const climateData = climateSystem.getClimateChange();

if (climateData.globalTemperature > 1.5) {
  console.warn('Gefährliche Erwärmung erreicht!');
  console.log(`CO2: ${climateData.co2Level} ppm`);
  console.log(`Katastrophen-Multiplikator: ${climateData.extremeWeatherFrequency}x`);
}

// Wettervorhersage aktivieren (ab Industrialisierung)
if (year >= 1850) {
  climateSystem.enableForecasting(0.7);
  const forecast = climateSystem.createForecast(year, month, techLevel);
  console.log(`Vorhersage für nächsten Monat: ${forecast.predictedWeather}`);
}
```

### Beispiel 2: Aufforstungsprogramm

```typescript
const landscapeSystem = gameEngine.getLandscapeSystem();

// Prüfe aktuelle Waldbedeckung
const forests = landscapeSystem.getForests();
const totalForestArea = landscapeSystem.getTotalForestArea();

if (totalForestArea < 100000) {
  // Starte Aufforstung
  landscapeSystem.plantForest(5000, year, 30000);
  console.log('Aufforstung gestartet: 5000 Hektar');
}

// Bodenqualität verbessern
for (let x = 0; x < 10; x++) {
  for (let y = 0; y < 10; y++) {
    landscapeSystem.improveSoil(x, y, year);
  }
}
```

### Beispiel 3: Artenschutz-Programm

```typescript
const animalSystem = gameEngine.getAnimalPopulationSystem();

// Finde bedrohte Arten
const endangered = animalSystem.getEndangeredSpecies();

endangered.forEach(species => {
  console.log(`${species.germanName} ist ${species.conservationStatus}`);
  
  // Starte Schutzprogramm
  const program = animalSystem.startConservationProgram(
    species.id,
    10000,  // Budget
    2000,   // Schutzgebiet (Hektar)
    year
  );
  
  console.log(`Schutzprogramm gestartet mit ${program.effectiveness}% Effektivität`);
});

// Prüfe auf ausgestorbene Arten
const extinct = animalSystem.getExtinctSpecies();
if (extinct.length > 0) {
  console.warn(`${extinct.length} Arten sind ausgestorben!`);
}
```

### Beispiel 4: Viehzucht und Fischerei

```typescript
const animalSystem = gameEngine.getAnimalPopulationSystem();

// Erstelle Viehzucht-Betrieb
const cattleFarm = animalSystem.createLivestockFarm(
  'cattle',
  { x: 50, y: 50 },
  500  // Kapazität
);

console.log(`Rinderfarm erstellt mit ${cattleFarm.animalCount} Tieren`);
console.log(`Produktion: ${cattleFarm.production.meat} Fleisch, ${cattleFarm.production.milk} Milch`);

// Fische in Gewässer
const fishStocks = animalSystem.getFishStocks();
fishStocks.forEach(stock => {
  if (!stock.overfished) {
    const result = animalSystem.fishInWaterbody(stock.waterbodyId, 1000, year);
    console.log(`Gefangen: ${result.caught} Fische`);
  }
});
```

### Beispiel 5: Naturkatastrophen-Management

```typescript
const climateSystem = gameEngine.getClimateSystem();

// Prüfe auf aktive Katastrophen
const disasters = climateSystem.getActiveDisasters();

disasters.forEach(disaster => {
  console.log(`Katastrophe: ${disaster.type}, Schwere: ${disaster.severity}/10`);
  console.log(`Opfer: ${disaster.casualties}`);
  console.log(`Wirtschaftsschaden: ${disaster.economicDamage} Gold`);
  console.log(`Ernteschaden: ${disaster.cropDamage} Nahrung`);
  
  // Nach Maßnahmen: Katastrophe lösen
  if (player.hasRespondedToDisaster(disaster.id)) {
    climateSystem.resolveDisaster(disaster.id);
  }
});
```

---

## Technische Details

### Performance-Optimierungen

- **Ressourcen-Regeneration**: Monatlich berechnet, nicht täglich
- **Landschafts-Updates**: Jährlich, nicht monatlich (außer Wetter)
- **Tier-Migrationen**: Nur für saisonale Arten, mit 30% Jahres-Chance
- **Event-Cleanup**: Alte Events werden automatisch entfernt (max. 100 Katastrophen, 50 Migrationen)

### Speicherung

Alle drei Systeme unterstützen Serialisierung/Deserialisierung für Speicherstände:

```typescript
// Speichern
const saveData = {
  climateSystem: climateSystem.serialize(),
  landscapeSystem: landscapeSystem.serialize(),
  animalPopulationSystem: animalPopulationSystem.serialize()
};

// Laden
const climateSystem = ClimateSystem.deserialize(saveData.climateSystem);
const landscapeSystem = LandscapeSystem.deserialize(saveData.landscapeSystem);
const animalSystem = AnimalPopulationSystem.deserialize(saveData.animalPopulationSystem);
```

---

## Zukünftige Erweiterungen

Mögliche zukünftige Features (nicht Teil von v2.2.3):

- UI-Komponenten für Klima-Visualisierung
- Interaktive Karten für Landschaftsveränderungen
- Detaillierte Artenschutz-Management-UI
- Erweiterte Multiplayer-Konflikte und Kooperationen
- Mehr Tier- und Pflanzenarten
- Komplexere Ökosystem-Simulationen
- Verschmutzungs-System (Luft, Wasser, Boden)

---

**Entwickelt mit ❤️ für eine lebendige, atmende historische Welt**
