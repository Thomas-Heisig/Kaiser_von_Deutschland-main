/**
 * Battle Terrain and Weather System
 * 
 * Manages terrain effects and weather conditions on battles.
 * Integrated with unit formations for comprehensive tactical simulation.
 */

export interface TerrainType {
  id: string;
  name: string;
  category: 'plains' | 'hills' | 'mountains' | 'forest' | 'swamp' | 'desert' | 'urban' | 'river' | 'coastal';
  
  /** Movement modifiers */
  infantrySpeed: number; // 0-200%, 100 = normal
  cavalrySpeed: number;
  artillerySpeed: number;
  
  /** Combat modifiers */
  attackModifier: number; // -50 to +50
  defenseModifier: number;
  rangedAttackModifier: number;
  
  /** Special properties */
  provideCover: boolean;
  limitVisibility: boolean;
  allowsCavalryCharge: boolean;
  requiresBridges: boolean;
  
  /** Supply and attrition */
  supplyDifficulty: number; // 0-100, higher = harder
  attritionRate: number; // % per day without supplies
}

export interface WeatherCondition {
  id: string;
  name: string;
  type: 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'extreme_heat' | 'extreme_cold';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'any';
  
  /** Visibility */
  visibilityReduction: number; // 0-100%
  
  /** Movement effects */
  movementPenalty: number; // 0-100%
  
  /** Combat effects */
  rangedAccuracy: number; // 0-200%, 100 = normal
  moraleEffect: number; // -50 to +50
  
  /** Special effects */
  increasesFatigue: boolean;
  causesAttrition: boolean;
  attritionRate: number; // % per day
  
  /** Equipment effects */
  disablesGunpowder: boolean; // For rain/snow
  damagesEquipment: boolean;
}

export interface BattlefieldConditions {
  terrain: TerrainType;
  weather: WeatherCondition;
  elevation: 'lowland' | 'highland' | 'mountain';
  time: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  
  /** Dynamic conditions */
  muddiness: number; // 0-100, affects movement
  visibility: number; // 0-100
  temperature: number; // Celsius
}

export interface BattleModifiers {
  attackModifier: number;
  defenseModifier: number;
  rangedModifier: number;
  speedModifier: number;
  moraleModifier: number;
  attritionRate: number;
  supplyDifficulty: number;
}

export class BattleTerrainWeatherSystem {
  private terrainTypes: Map<string, TerrainType> = new Map();
  private weatherConditions: Map<string, WeatherCondition> = new Map();

  constructor() {
    this.initializeTerrainTypes();
    this.initializeWeatherConditions();
  }

  /**
   * Initialize all terrain types
   */
  private initializeTerrainTypes(): void {
    this.addTerrain({
      id: 'plains',
      name: 'Ebene (Plains)',
      category: 'plains',
      infantrySpeed: 100,
      cavalrySpeed: 120,
      artillerySpeed: 100,
      attackModifier: 0,
      defenseModifier: 0,
      rangedAttackModifier: 10,
      provideCover: false,
      limitVisibility: false,
      allowsCavalryCharge: true,
      requiresBridges: false,
      supplyDifficulty: 20,
      attritionRate: 0.5
    });

    this.addTerrain({
      id: 'hills',
      name: 'Hügel (Hills)',
      category: 'hills',
      infantrySpeed: 80,
      cavalrySpeed: 70,
      artillerySpeed: 60,
      attackModifier: 5,
      defenseModifier: 20,
      rangedAttackModifier: 15,
      provideCover: true,
      limitVisibility: false,
      allowsCavalryCharge: false,
      requiresBridges: false,
      supplyDifficulty: 30,
      attritionRate: 1
    });

    this.addTerrain({
      id: 'mountains',
      name: 'Berge (Mountains)',
      category: 'mountains',
      infantrySpeed: 50,
      cavalrySpeed: 30,
      artillerySpeed: 20,
      attackModifier: -10,
      defenseModifier: 35,
      rangedAttackModifier: 20,
      provideCover: true,
      limitVisibility: true,
      allowsCavalryCharge: false,
      requiresBridges: false,
      supplyDifficulty: 70,
      attritionRate: 3
    });

    this.addTerrain({
      id: 'forest',
      name: 'Wald (Forest)',
      category: 'forest',
      infantrySpeed: 70,
      cavalrySpeed: 40,
      artillerySpeed: 30,
      attackModifier: -15,
      defenseModifier: 25,
      rangedAttackModifier: -20,
      provideCover: true,
      limitVisibility: true,
      allowsCavalryCharge: false,
      requiresBridges: false,
      supplyDifficulty: 40,
      attritionRate: 1.5
    });

    this.addTerrain({
      id: 'swamp',
      name: 'Sumpf (Swamp)',
      category: 'swamp',
      infantrySpeed: 40,
      cavalrySpeed: 20,
      artillerySpeed: 10,
      attackModifier: -25,
      defenseModifier: 15,
      rangedAttackModifier: -15,
      provideCover: true,
      limitVisibility: true,
      allowsCavalryCharge: false,
      requiresBridges: false,
      supplyDifficulty: 60,
      attritionRate: 4
    });

    this.addTerrain({
      id: 'desert',
      name: 'Wüste (Desert)',
      category: 'desert',
      infantrySpeed: 90,
      cavalrySpeed: 110,
      artillerySpeed: 80,
      attackModifier: -5,
      defenseModifier: -5,
      rangedAttackModifier: 5,
      provideCover: false,
      limitVisibility: false,
      allowsCavalryCharge: true,
      requiresBridges: false,
      supplyDifficulty: 80,
      attritionRate: 5
    });

    this.addTerrain({
      id: 'urban',
      name: 'Stadt (Urban)',
      category: 'urban',
      infantrySpeed: 60,
      cavalrySpeed: 40,
      artillerySpeed: 50,
      attackModifier: -10,
      defenseModifier: 30,
      rangedAttackModifier: 5,
      provideCover: true,
      limitVisibility: true,
      allowsCavalryCharge: false,
      requiresBridges: false,
      supplyDifficulty: 25,
      attritionRate: 2
    });

    this.addTerrain({
      id: 'river',
      name: 'Fluss (River)',
      category: 'river',
      infantrySpeed: 30,
      cavalrySpeed: 20,
      artillerySpeed: 10,
      attackModifier: -30,
      defenseModifier: 40,
      rangedAttackModifier: -10,
      provideCover: true,
      limitVisibility: false,
      allowsCavalryCharge: false,
      requiresBridges: true,
      supplyDifficulty: 50,
      attritionRate: 2
    });
  }

  /**
   * Initialize all weather conditions
   */
  private initializeWeatherConditions(): void {
    this.addWeather({
      id: 'clear',
      name: 'Klar (Clear)',
      type: 'clear',
      season: 'any',
      visibilityReduction: 0,
      movementPenalty: 0,
      rangedAccuracy: 100,
      moraleEffect: 5,
      increasesFatigue: false,
      causesAttrition: false,
      attritionRate: 0,
      disablesGunpowder: false,
      damagesEquipment: false
    });

    this.addWeather({
      id: 'rain',
      name: 'Regen (Rain)',
      type: 'rain',
      season: 'any',
      visibilityReduction: 30,
      movementPenalty: 20,
      rangedAccuracy: 70,
      moraleEffect: -10,
      increasesFatigue: true,
      causesAttrition: true,
      attritionRate: 0.5,
      disablesGunpowder: true,
      damagesEquipment: false
    });

    this.addWeather({
      id: 'snow',
      name: 'Schnee (Snow)',
      type: 'snow',
      season: 'winter',
      visibilityReduction: 50,
      movementPenalty: 40,
      rangedAccuracy: 60,
      moraleEffect: -20,
      increasesFatigue: true,
      causesAttrition: true,
      attritionRate: 2,
      disablesGunpowder: true,
      damagesEquipment: true
    });

    this.addWeather({
      id: 'fog',
      name: 'Nebel (Fog)',
      type: 'fog',
      season: 'any',
      visibilityReduction: 70,
      movementPenalty: 15,
      rangedAccuracy: 40,
      moraleEffect: -15,
      increasesFatigue: false,
      causesAttrition: false,
      attritionRate: 0,
      disablesGunpowder: false,
      damagesEquipment: false
    });

    this.addWeather({
      id: 'storm',
      name: 'Sturm (Storm)',
      type: 'storm',
      season: 'any',
      visibilityReduction: 60,
      movementPenalty: 50,
      rangedAccuracy: 30,
      moraleEffect: -30,
      increasesFatigue: true,
      causesAttrition: true,
      attritionRate: 1,
      disablesGunpowder: true,
      damagesEquipment: true
    });

    this.addWeather({
      id: 'extreme_heat',
      name: 'Extreme Hitze (Extreme Heat)',
      type: 'extreme_heat',
      season: 'summer',
      visibilityReduction: 20,
      movementPenalty: 30,
      rangedAccuracy: 90,
      moraleEffect: -25,
      increasesFatigue: true,
      causesAttrition: true,
      attritionRate: 3,
      disablesGunpowder: false,
      damagesEquipment: false
    });

    this.addWeather({
      id: 'extreme_cold',
      name: 'Extreme Kälte (Extreme Cold)',
      type: 'extreme_cold',
      season: 'winter',
      visibilityReduction: 10,
      movementPenalty: 50,
      rangedAccuracy: 80,
      moraleEffect: -35,
      increasesFatigue: true,
      causesAttrition: true,
      attritionRate: 4,
      disablesGunpowder: false,
      damagesEquipment: true
    });
  }

  /**
   * Add terrain type
   */
  public addTerrain(terrain: TerrainType): void {
    this.terrainTypes.set(terrain.id, terrain);
  }

  /**
   * Add weather condition
   */
  public addWeather(weather: WeatherCondition): void {
    this.weatherConditions.set(weather.id, weather);
  }

  /**
   * Calculate comprehensive battle modifiers
   */
  public calculateBattleModifiers(
    conditions: BattlefieldConditions,
    unitType: 'infantry' | 'cavalry' | 'artillery' | 'ranged'
  ): BattleModifiers {
    const terrain = conditions.terrain;
    const weather = conditions.weather;

    let attackModifier = terrain.attackModifier;
    let defenseModifier = terrain.defenseModifier;
    let rangedModifier = terrain.rangedAttackModifier;
    let speedModifier = 100;
    let moraleModifier = weather.moraleEffect;
    let attritionRate = terrain.attritionRate;
    let supplyDifficulty = terrain.supplyDifficulty;

    // Apply unit-specific speed modifiers
    switch (unitType) {
      case 'infantry':
        speedModifier = terrain.infantrySpeed;
        break;
      case 'cavalry':
        speedModifier = terrain.cavalrySpeed;
        if (!terrain.allowsCavalryCharge) {
          attackModifier -= 20;
        }
        break;
      case 'artillery':
        speedModifier = terrain.artillerySpeed;
        break;
      case 'ranged':
        speedModifier = terrain.infantrySpeed;
        rangedModifier += 10;
        break;
    }

    // Apply weather effects
    speedModifier *= (1 - weather.movementPenalty / 100);
    rangedModifier *= (weather.rangedAccuracy / 100);
    
    if (weather.causesAttrition) {
      attritionRate += weather.attritionRate;
    }

    // Muddiness from weather
    if (conditions.muddiness > 50) {
      speedModifier *= 0.7;
      attackModifier -= 10;
    }

    // Elevation bonuses
    if (conditions.elevation === 'highland') {
      defenseModifier += 10;
      rangedModifier += 10;
    } else if (conditions.elevation === 'mountain') {
      defenseModifier += 20;
      rangedModifier += 15;
      speedModifier *= 0.6;
    }

    // Time of day effects
    if (conditions.time === 'night' || conditions.time === 'dusk' || conditions.time === 'dawn') {
      rangedModifier *= 0.5;
      moraleModifier -= 10;
      if (!terrain.limitVisibility) {
        attackModifier -= 15;
      }
    }

    // Visibility effects
    const totalVisibility = Math.max(0, conditions.visibility - weather.visibilityReduction);
    if (totalVisibility < 30) {
      rangedModifier *= 0.3;
      speedModifier *= 0.8;
    } else if (totalVisibility < 60) {
      rangedModifier *= 0.7;
    }

    // Temperature effects
    if (conditions.temperature > 35) { // Extreme heat
      moraleModifier -= 15;
      attritionRate += 1.5;
    } else if (conditions.temperature < -10) { // Extreme cold
      moraleModifier -= 20;
      speedModifier *= 0.8;
      attritionRate += 2;
    }

    return {
      attackModifier: Math.round(attackModifier),
      defenseModifier: Math.round(defenseModifier),
      rangedModifier: Math.round(rangedModifier),
      speedModifier: Math.round(speedModifier),
      moraleModifier: Math.round(moraleModifier),
      attritionRate,
      supplyDifficulty
    };
  }

  /**
   * Generate random weather for season
   */
  public generateWeather(season: BattlefieldConditions['season']): WeatherCondition {
    const seasonalWeather = Array.from(this.weatherConditions.values()).filter(
      w => w.season === season || w.season === 'any'
    );

    // Weighted random selection (clear is most common)
    const weights = seasonalWeather.map(w => {
      if (w.type === 'clear') return 50;
      if (w.type === 'rain') return 20;
      if (w.type === 'fog') return 15;
      return 5;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < seasonalWeather.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return seasonalWeather[i];
      }
    }

    return seasonalWeather[0];
  }

  /**
   * Check if terrain requires special preparation
   */
  public requiresPreparation(terrainId: string, unitType: string): {
    required: boolean;
    preparations: string[];
  } {
    const terrain = this.terrainTypes.get(terrainId);
    if (!terrain) return { required: false, preparations: [] };

    const preparations: string[] = [];

    if (terrain.requiresBridges) {
      preparations.push('Build bridges or find fords');
    }

    if (terrain.category === 'mountains' && unitType === 'artillery') {
      preparations.push('Mountain trails and rope systems needed');
    }

    if (terrain.category === 'swamp') {
      preparations.push('Prepare elevated paths and drainage');
    }

    if (terrain.category === 'desert') {
      preparations.push('Extra water supplies essential');
    }

    if (terrain.category === 'forest' && unitType === 'cavalry') {
      preparations.push('Clear paths for mounted units');
    }

    return {
      required: preparations.length > 0,
      preparations
    };
  }

  /**
   * Get terrain by ID
   */
  public getTerrain(id: string): TerrainType | undefined {
    return this.terrainTypes.get(id);
  }

  /**
   * Get weather by ID
   */
  public getWeather(id: string): WeatherCondition | undefined {
    return this.weatherConditions.get(id);
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      terrainTypes: Array.from(this.terrainTypes.entries()),
      weatherConditions: Array.from(this.weatherConditions.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.terrainTypes) {
      this.terrainTypes = new Map(data.terrainTypes);
    }
    if (data.weatherConditions) {
      this.weatherConditions = new Map(data.weatherConditions);
    }
  }
}
