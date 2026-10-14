// src/core/ClimateSystem.ts

import type { Season } from './Kingdom';

/**
 * Wettertypen für tägliche/monatliche Wetterbedingungen
 */
export type WeatherType = 
  | 'clear' // Klar
  | 'cloudy' // Bewölkt
  | 'rain' // Regen
  | 'storm' // Sturm
  | 'snow' // Schnee
  | 'fog' // Nebel
  | 'blizzard' // Schneesturm
  | 'drought' // Dürre
  | 'heatwave' // Hitzewelle
  | 'cold_snap'; // Kälteeinbruch

/**
 * Naturkatastrophentypen
 */
export type DisasterType =
  | 'flood' // Überschwemmung
  | 'drought' // Dürre
  | 'storm' // Sturm
  | 'tornado' // Tornado
  | 'earthquake' // Erdbeben
  | 'wildfire' // Waldbrand
  | 'blizzard' // Schneesturm
  | 'hurricane' // Hurrikan
  | 'hailstorm' // Hagelsturm
  | 'locust_plague'; // Heuschreckenplage

/**
 * Naturkatastrophe
 */
export interface NaturalDisaster {
  id: string;
  type: DisasterType;
  severity: number; // 1-10
  year: number;
  month: number;
  affectedRegions: string[];
  casualties: number;
  economicDamage: number; // In Gold
  cropDamage: number; // In Food Units
  buildingsDamaged: number;
  resolved: boolean;
}

/**
 * Klimawandel-Daten
 */
export interface ClimateChangeData {
  globalTemperature: number; // Relative to baseline (°C)
  co2Level: number; // ppm (parts per million)
  seaLevel: number; // meters above baseline
  extremeWeatherFrequency: number; // Multiplier for disaster chance
  desertificationRate: number; // % per century
  glacierMelting: number; // % melted
}

/**
 * Jahreszeiten-Effekte
 */
export interface SeasonalEffects {
  foodProductionModifier: number;
  happinessModifier: number;
  diseaseSpreadModifier: number;
  travelSpeedModifier: number;
  buildingCostModifier: number;
  militaryEfficiencyModifier: number;
}

/**
 * Wettervorhersage (verfügbar ab Industrialisierung)
 */
export interface WeatherForecast {
  year: number;
  month: number;
  predictedWeather: WeatherType;
  disasterRisk: number; // 0-1
  accuracy: number; // 0-1 (depends on technology level)
  predictedTemperature: number;
  predictedPrecipitation: number;
}

/**
 * Ressourcen-Zustand
 */
export interface ResourceState {
  type: 'wood' | 'stone' | 'iron' | 'fish' | 'game' | 'fertile_soil';
  currentAmount: number;
  maxAmount: number;
  depletionRate: number; // per year
  regenerationRate: number; // per year
  depleted: boolean;
  lastHarvestYear: number;
}

/**
 * Dynamisches Klima-System
 * Verwaltet Jahreszeiten, Klimawandel, Naturkatastrophen und Ressourcen
 */
export class ClimateSystem {
  private currentSeason: Season = 'spring';
  private currentWeather: WeatherType = 'clear';
  private disasters: Map<string, NaturalDisaster> = new Map();
  private climateChange: ClimateChangeData;
  private resourceStates: Map<string, ResourceState> = new Map();
  private weatherHistory: Array<{ year: number; month: number; weather: WeatherType }> = [];
  private temperatureHistory: Array<{ year: number; temperature: number }> = [];
  
  // Wettervorhersage-Technologie (wird durch Tech-Level aktiviert)
  private forecastingEnabled: boolean = false;
  private forecastAccuracy: number = 0.5;

  constructor() {
    // Initialisiere Klimawandel-Daten (Baseline für Jahr 0)
    this.climateChange = {
      globalTemperature: 0,
      co2Level: 280, // Pre-industrial baseline
      seaLevel: 0,
      extremeWeatherFrequency: 1.0,
      desertificationRate: 0.01,
      glacierMelting: 0
    };

    this.initializeResources();
  }

  /**
   * Initialisiert Ressourcen-Zustände
   */
  private initializeResources(): void {
    const resourceTypes: Array<ResourceState['type']> = [
      'wood', 'stone', 'iron', 'fish', 'game', 'fertile_soil'
    ];

    resourceTypes.forEach(type => {
      this.resourceStates.set(type, {
        type,
        currentAmount: 100000,
        maxAmount: 100000,
        depletionRate: 0,
        regenerationRate: this.getBaseRegenerationRate(type),
        depleted: false,
        lastHarvestYear: 0
      });
    });
  }

  /**
   * Gibt die Basis-Regenerationsrate für einen Ressourcentyp zurück
   */
  private getBaseRegenerationRate(type: ResourceState['type']): number {
    const rates: Record<ResourceState['type'], number> = {
      wood: 500, // Wälder wachsen nach
      stone: 0, // Stein regeneriert nicht
      iron: 0, // Eisen regeneriert nicht
      fish: 1000, // Fische vermehren sich
      game: 800, // Wildtiere vermehren sich
      fertile_soil: 50 // Boden regeneriert langsam
    };
    return rates[type];
  }

  /**
   * Aktualisiert das Klima für einen Monat
   */
  public updateMonth(year: number, month: number, industrializationLevel: number): void {
    // Update Jahreszeit
    this.currentSeason = this.getSeasonForMonth(month);
    
    // Update Wetter
    this.currentWeather = this.generateWeather(year, month);
    this.weatherHistory.push({ year, month, weather: this.currentWeather });
    
    // Keep history limited to last 120 months (10 years)
    if (this.weatherHistory.length > 120) {
      this.weatherHistory.shift();
    }

    // Update Klimawandel (abhängig vom Industrialisierungsgrad)
    this.updateClimateChange(year, industrializationLevel);
    
    // Regeneriere Ressourcen
    this.regenerateResources(year);
    
    // Chance auf Naturkatastrophen
    this.checkForDisasters(year, month);
  }

  /**
   * Gibt die Jahreszeit für einen Monat zurück
   */
  private getSeasonForMonth(month: number): Season {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * Generiert Wetter für einen Monat
   */
  private generateWeather(_year: number, month: number): WeatherType {
    const season = this.getSeasonForMonth(month);
    const rand = Math.random();
    const extremeModifier = this.climateChange.extremeWeatherFrequency;

    // Basiert auf Jahreszeit und Klimawandel
    if (season === 'winter') {
      if (rand < 0.1 * extremeModifier) return 'blizzard';
      if (rand < 0.3) return 'snow';
      if (rand < 0.5) return 'cold_snap';
      if (rand < 0.7) return 'cloudy';
      return 'clear';
    } else if (season === 'summer') {
      if (rand < 0.05 * extremeModifier) return 'heatwave';
      if (rand < 0.15 * extremeModifier) return 'drought';
      if (rand < 0.25) return 'storm';
      if (rand < 0.4) return 'cloudy';
      return 'clear';
    } else if (season === 'spring' || season === 'autumn') {
      if (rand < 0.1 * extremeModifier) return 'storm';
      if (rand < 0.35) return 'rain';
      if (rand < 0.6) return 'cloudy';
      return 'clear';
    }

    return 'clear';
  }

  /**
   * Aktualisiert Klimawandel basierend auf Industrialisierung
   */
  private updateClimateChange(year: number, industrializationLevel: number): void {
    // Berechne CO2-Anstieg basierend auf Industrialisierung
    // Vor 1800: minimaler Einfluss
    // Nach 1800: exponentieller Anstieg
    const yearsSince1800 = Math.max(0, year - 1800);
    const industrialImpact = industrializationLevel / 100;
    
    // CO2 steigt mit Industrialisierung
    const co2Increase = yearsSince1800 > 0 ? 
      (0.5 + industrialImpact * 2) / 12 : 0.01 / 12; // Per month
    this.climateChange.co2Level += co2Increase;
    
    // Temperaturanstieg folgt CO2 (mit Verzögerung)
    const co2Deviation = this.climateChange.co2Level - 280;
    this.climateChange.globalTemperature = (co2Deviation / 280) * 2; // Simplified climate model
    
    // Meeresspiegel steigt mit Temperatur
    this.climateChange.seaLevel = this.climateChange.globalTemperature * 0.3;
    
    // Extreme Wetterereignisse nehmen zu
    this.climateChange.extremeWeatherFrequency = 1.0 + (this.climateChange.globalTemperature * 0.2);
    
    // Gletscherschmelze
    this.climateChange.glacierMelting = Math.min(100, this.climateChange.globalTemperature * 10);
    
    // Wüstenbildung
    this.climateChange.desertificationRate = 0.01 + (this.climateChange.globalTemperature * 0.005);

    // Track temperature history (yearly)
    if (year % 12 === 0) {
      this.temperatureHistory.push({ 
        year, 
        temperature: this.climateChange.globalTemperature 
      });
      if (this.temperatureHistory.length > 200) {
        this.temperatureHistory.shift();
      }
    }
  }

  /**
   * Regeneriert Ressourcen
   */
  private regenerateResources(year: number): void {
    this.resourceStates.forEach((state) => {
      if (!state.depleted) {
        // Regeneration (monthly)
        const monthlyRegen = state.regenerationRate / 12;
        const climateImpact = 1.0 - (this.climateChange.globalTemperature * 0.1);
        const effectiveRegen = monthlyRegen * Math.max(0.1, climateImpact);
        
        state.currentAmount = Math.min(
          state.maxAmount,
          state.currentAmount + effectiveRegen
        );
      } else {
        // Check if resource can recover
        const yearsSinceDepletion = year - state.lastHarvestYear;
        if (yearsSinceDepletion > 50 && state.regenerationRate > 0) {
          state.depleted = false;
          state.currentAmount = state.maxAmount * 0.1; // Start with 10%
        }
      }
    });
  }

  /**
   * Prüft auf Naturkatastrophen
   */
  private checkForDisasters(year: number, month: number): void {
    const baseChance = 0.01; // 1% pro Monat
    const modifiedChance = baseChance * this.climateChange.extremeWeatherFrequency;
    
    if (Math.random() < modifiedChance) {
      const disaster = this.generateDisaster(year, month);
      this.disasters.set(disaster.id, disaster);
    }

    // Clean up old resolved disasters (keep last 100)
    const disasterArray = Array.from(this.disasters.values());
    if (disasterArray.length > 100) {
      const resolved = disasterArray.filter(d => d.resolved);
      resolved.slice(0, -50).forEach(d => this.disasters.delete(d.id));
    }
  }

  /**
   * Generiert eine Naturkatastrophe
   */
  private generateDisaster(year: number, month: number): NaturalDisaster {
    const season = this.getSeasonForMonth(month);
    const disasterTypes = this.getSeasonalDisasterTypes(season);
    const type = disasterTypes[Math.floor(Math.random() * disasterTypes.length)];
    
    const severity = 1 + Math.floor(Math.random() * 10);
    
    return {
      id: `disaster-${year}-${month}-${Date.now()}`,
      type,
      severity,
      year,
      month,
      affectedRegions: [], // Will be filled based on game state
      casualties: Math.floor(severity * 100 * (1 + Math.random())),
      economicDamage: Math.floor(severity * 1000 * (1 + Math.random())),
      cropDamage: Math.floor(severity * 500 * (1 + Math.random())),
      buildingsDamaged: Math.floor(severity * 10 * Math.random()),
      resolved: false
    };
  }

  /**
   * Gibt saisonale Katastrophentypen zurück
   */
  private getSeasonalDisasterTypes(season: Season): DisasterType[] {
    const types: Record<Season, DisasterType[]> = {
      spring: ['flood', 'storm', 'tornado'],
      summer: ['drought', 'wildfire', 'locust_plague', 'hailstorm'],
      autumn: ['storm', 'hurricane', 'flood'],
      winter: ['blizzard', 'earthquake']
    };
    return types[season];
  }

  /**
   * Aktiviert Wettervorhersage-Technologie
   */
  public enableForecasting(accuracy: number = 0.5): void {
    this.forecastingEnabled = true;
    this.forecastAccuracy = Math.min(1.0, Math.max(0.1, accuracy));
  }

  /**
   * Erstellt eine Wettervorhersage
   */
  public createForecast(year: number, month: number, techLevel: number): WeatherForecast | null {
    if (!this.forecastingEnabled) {
      return null;
    }

    // Accuracy improves with tech level
    const accuracy = Math.min(0.95, this.forecastAccuracy + (techLevel / 100) * 0.3);
    
    // Predict next month's weather
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    
    const actualWeather = this.generateWeather(nextYear, nextMonth);
    const predictedWeather = Math.random() < accuracy ? actualWeather : this.getRandomWeather();
    
    return {
      year: nextYear,
      month: nextMonth,
      predictedWeather,
      disasterRisk: this.calculateDisasterRisk(nextYear, nextMonth),
      accuracy,
      predictedTemperature: this.climateChange.globalTemperature,
      predictedPrecipitation: this.estimatePrecipitation(predictedWeather)
    };
  }

  /**
   * Gibt zufälliges Wetter zurück (für ungenaue Vorhersagen)
   */
  private getRandomWeather(): WeatherType {
    const weathers: WeatherType[] = [
      'clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'
    ];
    return weathers[Math.floor(Math.random() * weathers.length)];
  }

  /**
   * Berechnet Katastrophenrisiko
   */
  private calculateDisasterRisk(_year: number, _month: number): number {
    const baseRisk = 0.01;
    const climateRisk = this.climateChange.extremeWeatherFrequency * baseRisk;
    return Math.min(1.0, climateRisk);
  }

  /**
   * Schätzt Niederschlagsmenge basierend auf Wettertyp
   */
  private estimatePrecipitation(weather: WeatherType): number {
    const precipitation: Record<WeatherType, number> = {
      clear: 0,
      cloudy: 5,
      rain: 30,
      storm: 60,
      snow: 25,
      fog: 10,
      blizzard: 40,
      drought: 0,
      heatwave: 0,
      cold_snap: 5
    };
    return precipitation[weather] || 0;
  }

  /**
   * Erntet Ressourcen
   */
  public harvestResource(type: ResourceState['type'], amount: number, year: number): number {
    const state = this.resourceStates.get(type);
    if (!state) return 0;

    const actualHarvest = Math.min(amount, state.currentAmount);
    state.currentAmount -= actualHarvest;
    state.lastHarvestYear = year;
    state.depletionRate += actualHarvest / 12; // Track depletion rate per month

    // Check if depleted
    if (state.currentAmount < state.maxAmount * 0.05) {
      state.depleted = true;
    }

    return actualHarvest;
  }

  /**
   * Gibt saisonale Effekte zurück
   */
  public getSeasonalEffects(season?: Season): SeasonalEffects {
    const currentSeason = season || this.currentSeason;
    
    const effects: Record<Season, SeasonalEffects> = {
      spring: {
        foodProductionModifier: 1.1,
        happinessModifier: 1.1,
        diseaseSpreadModifier: 1.0,
        travelSpeedModifier: 1.0,
        buildingCostModifier: 1.0,
        militaryEfficiencyModifier: 1.0
      },
      summer: {
        foodProductionModifier: 1.2,
        happinessModifier: 1.2,
        diseaseSpreadModifier: 1.3,
        travelSpeedModifier: 1.1,
        buildingCostModifier: 0.9,
        militaryEfficiencyModifier: 1.1
      },
      autumn: {
        foodProductionModifier: 1.3,
        happinessModifier: 1.0,
        diseaseSpreadModifier: 1.1,
        travelSpeedModifier: 1.0,
        buildingCostModifier: 1.0,
        militaryEfficiencyModifier: 1.0
      },
      winter: {
        foodProductionModifier: 0.6,
        happinessModifier: 0.8,
        diseaseSpreadModifier: 0.8,
        travelSpeedModifier: 0.7,
        buildingCostModifier: 1.2,
        militaryEfficiencyModifier: 0.8
      }
    };

    return effects[currentSeason];
  }

  /**
   * Gibt Wettereffekte auf Produktion zurück
   */
  public getWeatherEffects(): {
    foodModifier: number;
    happinessModifier: number;
    buildingSpeedModifier: number;
  } {
    const effects: Record<WeatherType, { foodModifier: number; happinessModifier: number; buildingSpeedModifier: number }> = {
      clear: { foodModifier: 1.0, happinessModifier: 1.1, buildingSpeedModifier: 1.0 },
      cloudy: { foodModifier: 0.95, happinessModifier: 1.0, buildingSpeedModifier: 1.0 },
      rain: { foodModifier: 1.1, happinessModifier: 0.95, buildingSpeedModifier: 0.9 },
      storm: { foodModifier: 0.7, happinessModifier: 0.8, buildingSpeedModifier: 0.6 },
      snow: { foodModifier: 0.8, happinessModifier: 0.9, buildingSpeedModifier: 0.7 },
      fog: { foodModifier: 0.9, happinessModifier: 0.95, buildingSpeedModifier: 0.95 },
      blizzard: { foodModifier: 0.5, happinessModifier: 0.7, buildingSpeedModifier: 0.5 },
      drought: { foodModifier: 0.3, happinessModifier: 0.6, buildingSpeedModifier: 1.0 },
      heatwave: { foodModifier: 0.5, happinessModifier: 0.7, buildingSpeedModifier: 0.8 },
      cold_snap: { foodModifier: 0.6, happinessModifier: 0.75, buildingSpeedModifier: 0.7 }
    };

    return effects[this.currentWeather];
  }

  // Getter methods
  public getCurrentSeason(): Season {
    return this.currentSeason;
  }

  public getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  public getClimateChange(): ClimateChangeData {
    return { ...this.climateChange };
  }

  public getDisasters(): NaturalDisaster[] {
    return Array.from(this.disasters.values());
  }

  public getActiveDisasters(): NaturalDisaster[] {
    return this.getDisasters().filter(d => !d.resolved);
  }

  public resolveDisaster(id: string): boolean {
    const disaster = this.disasters.get(id);
    if (disaster) {
      disaster.resolved = true;
      return true;
    }
    return false;
  }

  public getResourceState(type: ResourceState['type']): ResourceState | undefined {
    return this.resourceStates.get(type);
  }

  public getAllResourceStates(): ResourceState[] {
    return Array.from(this.resourceStates.values());
  }

  public getWeatherHistory(): Array<{ year: number; month: number; weather: WeatherType }> {
    return [...this.weatherHistory];
  }

  public getTemperatureHistory(): Array<{ year: number; temperature: number }> {
    return [...this.temperatureHistory];
  }

  /**
   * Serialisiert das Klimasystem für das Speichern
   */
  public serialize(): any {
    return {
      currentSeason: this.currentSeason,
      currentWeather: this.currentWeather,
      disasters: Array.from(this.disasters.entries()),
      climateChange: this.climateChange,
      resourceStates: Array.from(this.resourceStates.entries()),
      weatherHistory: this.weatherHistory,
      temperatureHistory: this.temperatureHistory,
      forecastingEnabled: this.forecastingEnabled,
      forecastAccuracy: this.forecastAccuracy
    };
  }

  /**
   * Deserialisiert das Klimasystem beim Laden
   */
  public static deserialize(data: any): ClimateSystem {
    const system = new ClimateSystem();
    
    system.currentSeason = data.currentSeason;
    system.currentWeather = data.currentWeather;
    system.disasters = new Map(data.disasters);
    system.climateChange = data.climateChange;
    system.resourceStates = new Map(data.resourceStates);
    system.weatherHistory = data.weatherHistory || [];
    system.temperatureHistory = data.temperatureHistory || [];
    system.forecastingEnabled = data.forecastingEnabled || false;
    system.forecastAccuracy = data.forecastAccuracy || 0.5;
    
    return system;
  }
}
