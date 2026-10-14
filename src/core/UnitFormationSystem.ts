/**
 * Unit Formation System
 * 
 * Manages military unit formations with tactical bonuses.
 * Scalable for battles from 10s to 100,000+ units.
 */

export interface UnitFormation {
  id: string;
  name: string;
  type: 'wedge' | 'phalanx' | 'line' | 'column' | 'square' | 'skirmish' | 'crescent' | 'testudo';
  era: 'ancient' | 'medieval' | 'renaissance' | 'modern';
  description: string;
  
  /** Stat modifiers */
  attackBonus: number; // -50 to +50
  defenseBonus: number; // -50 to +50
  speedBonus: number; // -50 to +50
  moraleBonus: number; // -50 to +50
  
  /** Effectiveness against other formations */
  strongAgainst: string[];
  weakAgainst: string[];
  
  /** Requirements */
  minUnits: number;
  maxUnits: number;
  requiredUnitTypes: string[]; // e.g., ['infantry', 'cavalry']
  trainingRequired: number; // 0-100
  
  /** Terrain modifiers */
  terrainBonuses: Map<string, number>;
}

export interface BattleFormation {
  formationId: string;
  units: string[]; // Unit IDs in this formation
  position: { x: number; y: number };
  facing: number; // 0-360 degrees
  cohesion: number; // 0-100, affects effectiveness
  fatigue: number; // 0-100, higher = more tired
}

export class UnitFormationSystem {
  private formations: Map<string, UnitFormation> = new Map();

  constructor() {
    this.initializeFormations();
  }

  /**
   * Initialize all available formations
   */
  private initializeFormations(): void {
    // Ancient formations
    this.addFormation({
      id: 'phalanx',
      name: 'Phalanx',
      type: 'phalanx',
      era: 'ancient',
      description: 'Dense infantry formation with overlapping shields and long spears',
      attackBonus: 10,
      defenseBonus: 30,
      speedBonus: -20,
      moraleBonus: 15,
      strongAgainst: ['line', 'column'],
      weakAgainst: ['wedge', 'skirmish'],
      minUnits: 100,
      maxUnits: 10000,
      requiredUnitTypes: ['infantry'],
      trainingRequired: 60,
      terrainBonuses: new Map([
        ['plains', 20],
        ['hills', -10],
        ['forest', -30]
      ])
    });

    this.addFormation({
      id: 'testudo',
      name: 'Testudo (Tortoise)',
      type: 'testudo',
      era: 'ancient',
      description: 'Roman formation with shields forming a protective shell',
      attackBonus: -10,
      defenseBonus: 40,
      speedBonus: -30,
      moraleBonus: 10,
      strongAgainst: ['skirmish'],
      weakAgainst: ['wedge', 'cavalry'],
      minUnits: 50,
      maxUnits: 500,
      requiredUnitTypes: ['infantry'],
      trainingRequired: 70,
      terrainBonuses: new Map([
        ['urban', 15],
        ['plains', 5]
      ])
    });

    this.addFormation({
      id: 'wedge',
      name: 'Wedge (Keil)',
      type: 'wedge',
      era: 'medieval',
      description: 'V-shaped formation designed to penetrate enemy lines',
      attackBonus: 35,
      defenseBonus: -10,
      speedBonus: 10,
      moraleBonus: 20,
      strongAgainst: ['phalanx', 'line'],
      weakAgainst: ['square', 'crescent'],
      minUnits: 50,
      maxUnits: 5000,
      requiredUnitTypes: ['cavalry', 'infantry'],
      trainingRequired: 50,
      terrainBonuses: new Map([
        ['plains', 25],
        ['hills', 10],
        ['forest', -20]
      ])
    });

    this.addFormation({
      id: 'line',
      name: 'Line Formation',
      type: 'line',
      era: 'renaissance',
      description: 'Soldiers arranged in long, thin lines to maximize firepower',
      attackBonus: 20,
      defenseBonus: 0,
      speedBonus: 0,
      moraleBonus: 5,
      strongAgainst: ['column', 'skirmish'],
      weakAgainst: ['wedge', 'cavalry'],
      minUnits: 100,
      maxUnits: 50000,
      requiredUnitTypes: ['infantry', 'musketeer'],
      trainingRequired: 40,
      terrainBonuses: new Map([
        ['plains', 15],
        ['hills', 5],
        ['forest', -15]
      ])
    });

    this.addFormation({
      id: 'column',
      name: 'Column Formation',
      type: 'column',
      era: 'renaissance',
      description: 'Deep formation for rapid movement and breakthrough',
      attackBonus: 15,
      defenseBonus: 10,
      speedBonus: 20,
      moraleBonus: 10,
      strongAgainst: ['square', 'skirmish'],
      weakAgainst: ['line', 'crescent'],
      minUnits: 100,
      maxUnits: 20000,
      requiredUnitTypes: ['infantry'],
      trainingRequired: 30,
      terrainBonuses: new Map([
        ['plains', 10],
        ['hills', -5],
        ['forest', 5],
        ['urban', 15]
      ])
    });

    this.addFormation({
      id: 'square',
      name: 'Square Formation',
      type: 'square',
      era: 'renaissance',
      description: 'Defensive formation with units facing outward in all directions',
      attackBonus: -5,
      defenseBonus: 25,
      speedBonus: -15,
      moraleBonus: 15,
      strongAgainst: ['cavalry', 'wedge'],
      weakAgainst: ['artillery', 'column'],
      minUnits: 200,
      maxUnits: 10000,
      requiredUnitTypes: ['infantry', 'musketeer'],
      trainingRequired: 55,
      terrainBonuses: new Map([
        ['plains', 20],
        ['hills', 10]
      ])
    });

    this.addFormation({
      id: 'skirmish',
      name: 'Skirmish Line',
      type: 'skirmish',
      era: 'renaissance',
      description: 'Loose formation with scattered units for harassment',
      attackBonus: 10,
      defenseBonus: -15,
      speedBonus: 30,
      moraleBonus: -5,
      strongAgainst: ['column', 'line'],
      weakAgainst: ['cavalry', 'phalanx'],
      minUnits: 20,
      maxUnits: 2000,
      requiredUnitTypes: ['light_infantry', 'skirmisher'],
      trainingRequired: 35,
      terrainBonuses: new Map([
        ['forest', 25],
        ['hills', 20],
        ['mountains', 15],
        ['plains', -10]
      ])
    });

    this.addFormation({
      id: 'crescent',
      name: 'Crescent (Halbmond)',
      type: 'crescent',
      era: 'medieval',
      description: 'Curved formation to envelop enemy flanks',
      attackBonus: 25,
      defenseBonus: 5,
      speedBonus: 5,
      moraleBonus: 10,
      strongAgainst: ['wedge', 'column'],
      weakAgainst: ['square', 'phalanx'],
      minUnits: 200,
      maxUnits: 15000,
      requiredUnitTypes: ['cavalry', 'infantry'],
      trainingRequired: 65,
      terrainBonuses: new Map([
        ['plains', 30],
        ['desert', 20],
        ['hills', -5]
      ])
    });

    this.addFormation({
      id: 'modern_dispersed',
      name: 'Dispersed Formation',
      type: 'skirmish',
      era: 'modern',
      description: 'Modern scattered formation to minimize casualties from artillery',
      attackBonus: 15,
      defenseBonus: 20,
      speedBonus: 25,
      moraleBonus: 0,
      strongAgainst: ['column', 'line'],
      weakAgainst: ['mechanized'],
      minUnits: 10,
      maxUnits: 100000,
      requiredUnitTypes: ['infantry', 'motorized'],
      trainingRequired: 50,
      terrainBonuses: new Map([
        ['urban', 30],
        ['forest', 25],
        ['mountains', 20],
        ['plains', -5]
      ])
    });
  }

  /**
   * Add a formation to the system
   */
  public addFormation(formation: UnitFormation): void {
    this.formations.set(formation.id, formation);
  }

  /**
   * Get formation by ID
   */
  public getFormation(formationId: string): UnitFormation | undefined {
    return this.formations.get(formationId);
  }

  /**
   * Get all formations for an era
   */
  public getFormationsByEra(era: UnitFormation['era']): UnitFormation[] {
    return Array.from(this.formations.values()).filter(f => f.era === era);
  }

  /**
   * Check if units can use a formation
   */
  public canUseFormation(
    formationId: string,
    unitCount: number,
    unitTypes: string[],
    training: number
  ): { canUse: boolean; reasons: string[] } {
    const formation = this.formations.get(formationId);
    if (!formation) {
      return { canUse: false, reasons: ['Formation not found'] };
    }

    const reasons: string[] = [];

    if (unitCount < formation.minUnits) {
      reasons.push(`Minimum ${formation.minUnits} units required (have ${unitCount})`);
    }

    if (unitCount > formation.maxUnits) {
      reasons.push(`Maximum ${formation.maxUnits} units allowed (have ${unitCount})`);
    }

    if (training < formation.trainingRequired) {
      reasons.push(`Training level ${formation.trainingRequired} required (have ${training})`);
    }

    const hasRequiredTypes = formation.requiredUnitTypes.every(required =>
      unitTypes.includes(required)
    );
    if (!hasRequiredTypes) {
      reasons.push(`Missing required unit types: ${formation.requiredUnitTypes.join(', ')}`);
    }

    return {
      canUse: reasons.length === 0,
      reasons
    };
  }

  /**
   * Calculate formation effectiveness
   */
  public calculateEffectiveness(
    attackerFormation: BattleFormation,
    defenderFormationId: string,
    terrain: string,
    weather: string
  ): {
    attackModifier: number;
    defenseModifier: number;
    speedModifier: number;
    moraleModifier: number;
  } {
    const attacker = this.formations.get(attackerFormation.formationId);
    if (!attacker) {
      return { attackModifier: 0, defenseModifier: 0, speedModifier: 0, moraleModifier: 0 };
    }

    let attackModifier = attacker.attackBonus;
    let defenseModifier = attacker.defenseBonus;
    let speedModifier = attacker.speedBonus;
    let moraleModifier = attacker.moraleBonus;

    // Counter-formation bonuses
    if (attacker.strongAgainst.includes(defenderFormationId)) {
      attackModifier += 20;
      moraleModifier += 10;
    }
    if (attacker.weakAgainst.includes(defenderFormationId)) {
      attackModifier -= 20;
      moraleModifier -= 10;
    }

    // Terrain bonuses
    const terrainBonus = attacker.terrainBonuses.get(terrain) || 0;
    attackModifier += terrainBonus * 0.5;
    defenseModifier += terrainBonus * 0.5;

    // Cohesion affects all stats
    const cohesionFactor = attackerFormation.cohesion / 100;
    attackModifier *= cohesionFactor;
    defenseModifier *= cohesionFactor;
    speedModifier *= cohesionFactor;

    // Fatigue penalties
    const fatiguePenalty = attackerFormation.fatigue / 100;
    attackModifier *= (1 - fatiguePenalty * 0.5);
    speedModifier *= (1 - fatiguePenalty * 0.7);
    moraleModifier *= (1 - fatiguePenalty * 0.3);

    // Weather effects
    if (weather === 'rain' || weather === 'snow') {
      speedModifier *= 0.7;
      if (attacker.type === 'skirmish') {
        attackModifier *= 0.8;
      }
    }

    return {
      attackModifier: Math.round(attackModifier),
      defenseModifier: Math.round(defenseModifier),
      speedModifier: Math.round(speedModifier),
      moraleModifier: Math.round(moraleModifier)
    };
  }

  /**
   * Update formation cohesion based on combat
   */
  public updateCohesion(
    formation: BattleFormation,
    casualties: number,
    totalUnits: number,
    commandQuality: number // 0-100
  ): void {
    const casualtyRate = casualties / totalUnits;
    const cohesionLoss = casualtyRate * 30;
    
    // Command quality helps maintain cohesion
    const commandBonus = (commandQuality / 100) * 10;
    
    formation.cohesion = Math.max(0, Math.min(100,
      formation.cohesion - cohesionLoss + commandBonus
    ));
  }

  /**
   * Apply fatigue from marching or fighting
   */
  public applyFatigue(
    formation: BattleFormation,
    hours: number,
    intensity: 'march' | 'combat' | 'rest'
  ): void {
    const fatigueRates = {
      march: 5,
      combat: 15,
      rest: -10
    };

    const fatigueChange = fatigueRates[intensity] * hours;
    formation.fatigue = Math.max(0, Math.min(100, formation.fatigue + fatigueChange));
  }

  /**
   * Get recommended formation for situation
   */
  public recommendFormation(
    unitCount: number,
    unitTypes: string[],
    training: number,
    terrain: string,
    enemyFormation?: string,
    era: UnitFormation['era'] = 'medieval'
  ): UnitFormation | null {
    const available = Array.from(this.formations.values()).filter(f => {
      const check = this.canUseFormation(f.id, unitCount, unitTypes, training);
      return check.canUse && f.era === era;
    });

    if (available.length === 0) return null;

    // Score each formation
    const scored = available.map(formation => {
      let score = 0;
      
      // Terrain bonus
      score += formation.terrainBonuses.get(terrain) || 0;
      
      // Counter-formation bonus
      if (enemyFormation) {
        if (formation.strongAgainst.includes(enemyFormation)) {
          score += 30;
        }
        if (formation.weakAgainst.includes(enemyFormation)) {
          score -= 30;
        }
      }
      
      // Balanced stats bonus
      score += (formation.attackBonus + formation.defenseBonus) / 2;
      
      return { formation, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].formation;
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      formations: Array.from(this.formations.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.formations) {
      this.formations = new Map(data.formations.map((entry: any) => {
        const [id, formation] = entry;
        return [id, {
          ...formation,
          terrainBonuses: new Map(Object.entries(formation.terrainBonuses || {}))
        }];
      }));
    }
  }
}
