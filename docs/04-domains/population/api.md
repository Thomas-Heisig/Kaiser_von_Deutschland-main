# Population Dynamics API Reference

## Version 2.1.5 - Bevölkerungsdynamik

Diese Dokumentation beschreibt die neuen Systeme für die Bevölkerungsdynamik in Kaiser von Deutschland v2.1.5.

---

## CitizenSystem

Das `CitizenSystem` verwaltet alle individuellen Bürger im Spiel.

### Klasse: `CitizenSystem`

#### Methoden

##### `createCitizen(data: CitizenCreationData): Citizen`

Erstellt einen neuen Bürger mit den angegebenen Daten.

**Parameter:**
- `data.firstName` (string): Vorname
- `data.lastName` (string): Nachname
- `data.gender` ('male' | 'female' | 'other'): Geschlecht
- `data.age` (number): Alter in Jahren
- `data.birthYear` (number): Geburtsjahr
- `data.birthMonth` (number): Geburtsmonat (1-12)
- `data.profession` (Profession): Beruf
- `data.regionId` (string): Region-ID
- `data.socialClass` (optional): Soziale Klasse
- `data.familyId` (optional): Familien-ID

**Rückgabe:** Neues `Citizen`-Objekt

**Beispiel:**
```typescript
const citizen = citizenSystem.createCitizen({
  firstName: 'Heinrich',
  lastName: 'Müller',
  gender: 'male',
  age: 25,
  birthYear: 1200,
  birthMonth: 3,
  profession: 'farmer',
  regionId: 'bavaria'
});
```

##### `getCitizen(citizenId: string): Citizen | undefined`

Holt einen Bürger nach ID.

**Parameter:**
- `citizenId` (string): Eindeutige Bürger-ID

**Rückgabe:** `Citizen` oder `undefined` wenn nicht gefunden

##### `getAllCitizens(): Citizen[]`

Holt alle Bürger (lebend und tot).

**Rückgabe:** Array von `Citizen`-Objekten

##### `getCitizensByRegion(regionId: string): Citizen[]`

Holt alle Bürger einer bestimmten Region.

**Parameter:**
- `regionId` (string): Region-ID

**Rückgabe:** Array von `Citizen`-Objekten

##### `getFamilyMembers(familyId: string): Citizen[]`

Holt alle Mitglieder einer Familie.

**Parameter:**
- `familyId` (string): Familien-ID

**Rückgabe:** Array von `Citizen`-Objekten

##### `getPopulation(): number`

Zählt die lebende Bevölkerung.

**Rückgabe:** Anzahl lebender Bürger

##### `getRegionalPopulation(regionId: string): number`

Zählt die Bevölkerung einer Region.

**Parameter:**
- `regionId` (string): Region-ID

**Rückgabe:** Anzahl lebender Bürger in der Region

##### `assignPlayerControl(citizenId: string, playerId: string): boolean`

Erlaubt einem Spieler, einen Bürger zu übernehmen.

**Parameter:**
- `citizenId` (string): Bürger-ID
- `playerId` (string): Spieler-ID

**Rückgabe:** `true` bei Erfolg, `false` bei Fehler

**Beispiel:**
```typescript
const success = citizenSystem.assignPlayerControl(citizenId, 'player1');
if (success) {
  console.log('Spieler kontrolliert jetzt diesen Bürger');
}
```

##### `removePlayerControl(citizenId: string): boolean`

Entfernt Spielerkontrolle von einem Bürger.

##### `getPlayerControlledCitizens(playerId: string): Citizen[]`

Holt alle Bürger, die von einem Spieler kontrolliert werden.

##### `processMonth(currentYear: number, currentMonth: number): void`

Verarbeitet monatliche Updates für alle Bürger.

##### `removeFromRegion(citizenId: string, regionId: string): void`

Entfernt einen Bürger aus einer Region (für Migration).

---

### Interface: `Citizen`

Vollständige Bürger-Daten.

```typescript
interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  birthYear: number;
  birthMonth: number;
  deathYear?: number;
  deathMonth?: number;
  isAlive: boolean;
  
  // Beruf und Status
  profession: Profession;
  professionLevel: number; // 0-100
  income: number;
  wealth: number;
  
  // Ort
  regionId: string;
  homeId?: string;
  
  // Familie
  familyId?: string;
  familyRelations: FamilyRelation[];
  
  // Soziales
  socialRelations: SocialRelation[];
  reputation: number; // -100 bis +100
  socialClass: 'peasant' | 'middle' | 'noble' | 'royal';
  
  // Gesundheit und Bedürfnisse
  health: HealthStatus;
  needs: CitizenNeeds;
  happiness: number; // 0-100
  
  // Persönlichkeit und Fähigkeiten
  personality: PersonalityTraits;
  skills: CitizenSkills;
  
  // Spieler-Kontrolle
  controlledByPlayerId?: string;
  isPlayerCharacter: boolean;
  
  // Migration
  migrationDesire: number; // 0-100
  originalRegionId: string;
  
  // Geschichte
  lifeEvents: LifeEvent[];
}
```

### Type: `Profession`

```typescript
type Profession = 
  | 'farmer' | 'artisan' | 'merchant' | 'soldier' 
  | 'scholar' | 'clergy' | 'noble' | 'servant' 
  | 'laborer' | 'miner' | 'fisherman' | 'blacksmith' 
  | 'carpenter' | 'weaver' | 'baker' | 'brewer' 
  | 'unemployed';
```

---

## DemographicSystem

Das `DemographicSystem` verwaltet demografische Prozesse wie Geburten, Todesfälle, Epidemien und Hungersnöte.

### Klasse: `DemographicSystem`

#### Methoden

##### `calculateAgePyramid(citizenSystem: CitizenSystem): AgePyramid`

Berechnet die Alterspyramide der Bevölkerung.

**Parameter:**
- `citizenSystem` (CitizenSystem): Das Bürgersystem

**Rückgabe:** `AgePyramid`-Objekt mit männlichen und weiblichen Altersgruppen

**Beispiel:**
```typescript
const pyramid = demographicSystem.calculateAgePyramid(citizenSystem);
console.log(`Männer 21-30: ${pyramid.male[4].count}`);
```

##### `calculateStatistics(citizenSystem: CitizenSystem): DemographicStats`

Berechnet demografische Statistiken.

**Rückgabe:** Objekt mit:
- `totalPopulation`: Gesamtbevölkerung
- `birthRate`: Geburtenrate pro 1000 pro Jahr
- `deathRate`: Sterberate pro 1000 pro Jahr
- `growthRate`: Wachstumsrate
- `lifeExpectancy`: Lebenserwartung
- `infantMortalityRate`: Säuglingssterblichkeit
- `fertilityRate`: Fruchtbarkeitsrate
- `averageAge`: Durchschnittsalter
- `medianAge`: Medianalter

##### `processMonth(citizenSystem: CitizenSystem, currentYear: number, currentMonth: number): void`

Verarbeitet monatliche demografische Prozesse.

##### `startEpidemic(name: string, contagiousness: number, mortalityRate: number, duration: number, immunity?: boolean): Disease`

Startet eine Epidemie.

**Parameter:**
- `name` (string): Name der Krankheit
- `contagiousness` (number): Ansteckungsgrad (0-100)
- `mortalityRate` (number): Sterblichkeitsrate (0-100)
- `duration` (number): Dauer in Monaten
- `immunity` (boolean, optional): Immunität nach Genesung

**Rückgabe:** `Disease`-Objekt

**Beispiel:**
```typescript
const plague = demographicSystem.startEpidemic(
  'Schwarzer Tod',
  85, // Hochansteckend
  60, // 60% Sterblichkeit
  24, // 2 Jahre
  true // Immunität nach Genesung
);
```

##### `startFamine(regionId: string, severity: number, year: number, month: number, duration: number): Famine`

Startet eine Hungersnot in einer Region.

**Parameter:**
- `regionId` (string): Betroffene Region
- `severity` (number): Schweregrad (0-100)
- `year` (number): Startjahr
- `month` (number): Startmonat
- `duration` (number): Dauer in Monaten

**Rückgabe:** `Famine`-Objekt

##### `getActiveDiseases(): Disease[]`

Holt alle aktiven Epidemien.

##### `getActiveFamines(): Famine[]`

Holt alle aktiven Hungersnöte.

##### `endEpidemic(diseaseId: string): void`

Beendet eine Epidemie.

##### `endFamine(famineId: string): void`

Beendet eine Hungersnot.

---

### Interface: `AgePyramid`

```typescript
interface AgePyramid {
  male: AgeGroup[];
  female: AgeGroup[];
  total: number;
}

interface AgeGroup {
  min: number;
  max: number;
  count: number;
  percentage: number;
}
```

---

## SocialNetworkSystem

Das `SocialNetworkSystem` verwaltet soziale Beziehungen, Informationsverbreitung und soziale Bewegungen.

### Klasse: `SocialNetworkSystem`

#### Methoden

##### `createFriendship(citizenSystem: CitizenSystem, citizen1Id: string, citizen2Id: string, strength: number, year: number): boolean`

Erstellt eine Freundschaft zwischen zwei Bürgern.

**Parameter:**
- `citizenSystem` (CitizenSystem): Das Bürgersystem
- `citizen1Id` (string): ID des ersten Bürgers
- `citizen2Id` (string): ID des zweiten Bürgers
- `strength` (number): Stärke der Freundschaft (0-100)
- `year` (number): Jahr der Entstehung

**Rückgabe:** `true` bei Erfolg

##### `createEnmity(citizenSystem: CitizenSystem, citizen1Id: string, citizen2Id: string, strength: number, year: number): boolean`

Erstellt eine Feindschaft zwischen zwei Bürgern.

##### `getFriends(citizen: Citizen, citizenSystem: CitizenSystem): Citizen[]`

Holt alle Freunde eines Bürgers.

##### `getEnemies(citizen: Citizen, citizenSystem: CitizenSystem): Citizen[]`

Holt alle Feinde eines Bürgers.

##### `updateRelationship(citizen: Citizen, targetCitizenId: string, strengthChange: number): void`

Aktualisiert eine soziale Beziehung.

##### `createMessage(type, content, originCitizenId, regionId, year, month, spreadRate?, believability?): Message`

Erstellt eine neue Nachricht/Gerücht.

**Parameter:**
- `type`: 'news' | 'rumor' | 'propaganda' | 'gossip'
- `content` (string): Inhalt der Nachricht
- `originCitizenId` (string): Ursprungs-Bürger
- `regionId` (string): Region
- `year` (number): Jahr
- `month` (number): Monat
- `spreadRate` (number, optional): Verbreitungsrate (0-100, Standard: 50)
- `believability` (number, optional): Glaubwürdigkeit (0-100, Standard: 50)

**Rückgabe:** `Message`-Objekt

**Beispiel:**
```typescript
const rumor = socialNetworkSystem.createMessage(
  'rumor',
  'Der König ist krank!',
  citizenId,
  'bavaria',
  1225,
  6,
  80, // Verbreitet sich schnell
  30  // Nicht sehr glaubwürdig
);
```

##### `processInformationSpread(citizenSystem: CitizenSystem, currentYear: number, currentMonth: number): void`

Verarbeitet Informationsverbreitung.

##### `createMovement(name, type, ideology, regionId, foundedYear, foundedMonth, leaderId?, leaderPlayerId?): SocialMovement`

Erstellt eine soziale Bewegung.

**Parameter:**
- `name` (string): Name der Bewegung
- `type`: 'revolution' | 'reform' | 'protest' | 'cult' | 'guild' | 'party'
- `ideology` (string): Ideologie
- `regionId` (string): Region
- `foundedYear` (number): Gründungsjahr
- `foundedMonth` (number): Gründungsmonat
- `leaderId` (string, optional): Bürger-Anführer
- `leaderPlayerId` (string, optional): Spieler-Anführer

**Rückgabe:** `SocialMovement`-Objekt

**Beispiel:**
```typescript
const revolution = socialNetworkSystem.createMovement(
  'Bauernaufstand',
  'revolution',
  'Gleichheit und Gerechtigkeit',
  'bavaria',
  1225,
  3
);
```

##### `joinMovement(movement: SocialMovement, citizenId: string, citizen: Citizen): boolean`

Fügt einen Bürger zu einer Bewegung hinzu.

##### `leaveMovement(movement: SocialMovement, citizenId: string): boolean`

Entfernt einen Bürger aus einer Bewegung.

##### `processMovements(citizenSystem: CitizenSystem, currentYear: number, currentMonth: number): void`

Verarbeitet soziale Bewegungen.

##### `assignPlayerLeadership(movementId: string, playerId: string): boolean`

Erlaubt einem Spieler, eine Bewegung anzuführen.

**Beispiel:**
```typescript
const success = socialNetworkSystem.assignPlayerLeadership(movementId, 'player1');
```

##### `getActiveMovements(): SocialMovement[]`

Holt alle aktiven Bewegungen.

##### `getRegionalMovements(regionId: string): SocialMovement[]`

Holt alle Bewegungen in einer Region.

##### `getPlayerLedMovements(playerId: string): SocialMovement[]`

Holt alle Bewegungen, die ein Spieler anführt.

##### `getAllMessages(): Message[]`

Holt alle Nachrichten.

##### `getMessagesByType(type): Message[]`

Holt Nachrichten nach Typ.

##### `getMessageReach(messageId: string): number`

Zählt wie viele Bürger eine Nachricht erreicht hat.

##### `generateSocialRelations(citizenSystem: CitizenSystem, year: number): void`

Generiert automatisch soziale Beziehungen.

---

## PopulationVisualization

Die `PopulationVisualization` Klasse verwendet PixiJS für visuelle Darstellungen.

### Klasse: `PopulationVisualization`

#### Konstruktor

```typescript
constructor(containerId: string, width?: number, height?: number)
```

**Parameter:**
- `containerId` (string): DOM-Element-ID des Containers
- `width` (number, optional): Breite in Pixeln (Standard: 800)
- `height` (number, optional): Höhe in Pixeln (Standard: 600)

**Beispiel:**
```typescript
const visualization = new PopulationVisualization('viz-container', 1024, 768);
```

#### Methoden

##### `renderAgePyramid(pyramid: AgePyramid): void`

Rendert eine Alterspyramide.

**Parameter:**
- `pyramid` (AgePyramid): Alterspyramiden-Daten

**Beispiel:**
```typescript
const pyramid = demographicSystem.calculateAgePyramid(citizenSystem);
visualization.renderAgePyramid(pyramid);
```

##### `renderCitizenMap(citizenSystem: CitizenSystem, regionId?: string): void`

Rendert eine Karte mit Bürgern als Punkte.

**Parameter:**
- `citizenSystem` (CitizenSystem): Das Bürgersystem
- `regionId` (string, optional): Nur Bürger dieser Region zeigen

**Beispiel:**
```typescript
visualization.renderCitizenMap(citizenSystem, 'bavaria');
```

##### `update(citizenSystem: CitizenSystem): void`

Aktualisiert die Visualisierung.

##### `resize(width: number, height: number): void`

Ändert die Größe (responsive).

##### `destroy(): void`

Zerstört die Visualisierung und gibt Ressourcen frei.

---

## NameGenerator

Die `NameGenerator` Klasse generiert realistische deutsche Namen.

### Klasse: `NameGenerator`

Alle Methoden sind statisch.

#### Methoden

##### `generateFirstName(gender: 'male' | 'female', year: number): string`

Generiert einen epochengerechten Vornamen.

**Beispiel:**
```typescript
const name = NameGenerator.generateFirstName('male', 1200); // 'Heinrich'
```

##### `generateLastName(): string`

Generiert einen deutschen Nachnamen.

##### `generateFullName(gender: 'male' | 'female', year: number): { firstName: string; lastName: string }`

Generiert einen vollständigen Namen.

**Beispiel:**
```typescript
const { firstName, lastName } = NameGenerator.generateFullName('female', 1500);
console.log(`${firstName} ${lastName}`); // 'Anna Weber'
```

##### `generateNobleName(gender: 'male' | 'female', year: number): { firstName: string; lastName: string }`

Generiert einen adeligen Namen.

**Beispiel:**
```typescript
const { firstName, lastName } = NameGenerator.generateNobleName('male', 1400);
console.log(`${firstName} ${lastName}`); // 'Friedrich von Habsburg'
```

##### `generateClergyName(gender: 'male' | 'female', year: number): { firstName: string; lastName: string }`

Generiert einen Namen für Geistliche.

---

## GameEngine Erweiterungen

### Neue Methoden

##### `getCitizenSystem(): CitizenSystem`

Holt das Bürgersystem.

##### `getDemographicSystem(): DemographicSystem`

Holt das demografische System.

##### `getSocialNetworkSystem(): SocialNetworkSystem`

Holt das soziale Netzwerksystem.

##### `getPopulationStats(): object`

Holt umfassende Bevölkerungsstatistiken.

**Rückgabe:**
```typescript
{
  total: number;
  demographics: DemographicStats;
  agePyramid: AgePyramid;
  activeDiseases: Disease[];
  activeFamines: Famine[];
  activeMovements: SocialMovement[];
}
```

**Beispiel:**
```typescript
const stats = gameEngine.getPopulationStats();
console.log(`Bevölkerung: ${stats.total}`);
console.log(`Geburtenrate: ${stats.demographics.birthRate}`);
console.log(`Aktive Epidemien: ${stats.activeDiseases.length}`);
```

---

## Verwendungsbeispiele

### Vollständiges Beispiel: Bevölkerung initialisieren

```typescript
import { GameEngine } from './core/GameEngine';
import { NameGenerator } from './utils/NameGenerator';

const engine = new GameEngine({ startingYear: 1200 });
const citizenSystem = engine.getCitizenSystem();

// Erstelle 1000 Bürger
for (let i = 0; i < 1000; i++) {
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  const { firstName, lastName } = NameGenerator.generateFullName(gender, 1200);
  
  citizenSystem.createCitizen({
    firstName,
    lastName,
    gender,
    age: Math.floor(Math.random() * 70),
    birthYear: 1200 - Math.floor(Math.random() * 70),
    birthMonth: Math.floor(Math.random() * 12) + 1,
    profession: 'farmer',
    regionId: 'bavaria'
  });
}

console.log(`Bevölkerung: ${citizenSystem.getPopulation()}`);
```

### Beispiel: Epidemie starten

```typescript
const demographicSystem = engine.getDemographicSystem();

// Starte eine Pest-Epidemie
const plague = demographicSystem.startEpidemic(
  'Schwarzer Tod',
  80,  // Sehr ansteckend
  50,  // 50% Sterblichkeit
  36,  // 3 Jahre
  true // Immunität nach Genesung
);

// Lasse das Spiel 36 Monate laufen
for (let i = 0; i < 36; i++) {
  demographicSystem.processMonth(citizenSystem, 1347, i % 12 + 1);
}

// Prüfe Auswirkungen
const stats = demographicSystem.calculateStatistics(citizenSystem);
console.log(`Neue Bevölkerung: ${stats.totalPopulation}`);
```

### Beispiel: Soziale Bewegung

```typescript
const socialSystem = engine.getSocialNetworkSystem();

// Erstelle eine Revolution
const revolution = socialSystem.createMovement(
  'Bauernaufstand 1225',
  'revolution',
  'Gegen hohe Steuern',
  'bavaria',
  1225,
  3
);

// Spieler übernimmt Führung
socialSystem.assignPlayerLeadership(revolution.id, 'player1');

// Verarbeite mehrere Monate
for (let i = 0; i < 12; i++) {
  socialSystem.processMovements(citizenSystem, 1225, i + 1);
}

console.log(`Unterstützer: ${revolution.supporters}`);
console.log(`Einfluss: ${revolution.influence}`);
```

---

## Performance-Hinweise

### Große Bevölkerungen

Bei mehr als 10.000 Bürgern:
- Verwenden Sie regionale Filter wo möglich
- Implementieren Sie Pagination für UI-Listen
- Nutzen Sie Web Workers für schwere Berechnungen
- Cachen Sie häufig verwendete Abfragen

### PixiJS Optimierung

- Verwenden Sie Sprite-Batching
- Limitieren Sie die Anzahl gleichzeitig angezeigter Sprites
- Implementieren Sie Culling (ausblenden von off-screen Elementen)
- Nutzen Sie Texture Atlases

---

## Multiplayer-Funktionen

### Bürger übernehmen

```typescript
// Spieler übernimmt einen Bürger
const citizens = citizenSystem.getCitizensByRegion('bavaria');
const randomCitizen = citizens[Math.floor(Math.random() * citizens.length)];

citizenSystem.assignPlayerControl(randomCitizen.id, 'player1');

// Hole alle vom Spieler kontrollierten Bürger
const controlled = citizenSystem.getPlayerControlledCitizens('player1');
```

### Bewegungen anführen

```typescript
// Spieler führt eine Bewegung an
const movements = socialSystem.getRegionalMovements('bavaria');
if (movements.length > 0) {
  socialSystem.assignPlayerLeadership(movements[0].id, 'player1');
}

// Hole alle vom Spieler geführten Bewegungen
const led = socialSystem.getPlayerLedMovements('player1');
```

---

## Migration und Mobilität

Migration wird in zukünftigen Updates implementiert:

```typescript
// Geplante API (noch nicht implementiert)
function migrateCitizen(citizenId: string, targetRegionId: string): boolean {
  const citizen = citizenSystem.getCitizen(citizenId);
  if (!citizen) return false;
  
  // Entferne aus alter Region
  citizenSystem.removeFromRegion(citizenId, citizen.regionId);
  
  // Füge zu neuer Region hinzu
  citizen.regionId = targetRegionId;
  // addToRegion wird noch implementiert
  
  // Füge Lebensereignis hinzu
  citizen.lifeEvents.push({
    year: currentYear,
    month: currentMonth,
    type: 'migration',
    description: `Migriert nach ${targetRegionId}`
  });
  
  return true;
}
```

---

Für weitere Informationen siehe:
- [Architecture Documentation](./ARCHITECTURE.md)
- [User Guide](./USER_GUIDE.md)
- [GitHub Repository](https://github.com/Thomas-Heisig/Kaiser_von_Deutschland)
