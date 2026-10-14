// src/core/BattleSystem.ts

export interface HistoricalBattle {
  id: string;
  name: string;
  year: number;
  location: string;
  participants: string[];
  victor: string;
  casualties: {
    total: number;
    victor: number;
    loser: number;
  };
  significance: string;
  historicalImpact: number;
  militaryInnovations: string[];
  commanders: string[];
  weatherConditions: string;
  terrain: string;
}

export interface BattleEvent {
  battleId: string;
  year: number;
  playerParticipation: boolean;
  playerSide?: string;
  outcome?: 'victory' | 'defeat' | 'draw';
  casualties?: number;
  prestigeGained?: number;
}

export class BattleSystem {
  private battles: Map<string, HistoricalBattle> = new Map();
  private battleHistory: BattleEvent[] = [];

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/historical-battles.json');
      const data = await response.json();
      
      data.battles.forEach((battle: HistoricalBattle) => {
        this.battles.set(battle.id, battle);
      });
    } catch (error) {
      console.error('Failed to load historical battles:', error);
    }
  }

  getBattle(id: string): HistoricalBattle | undefined {
    return this.battles.get(id);
  }

  getAllBattles(): HistoricalBattle[] {
    return Array.from(this.battles.values());
  }

  getBattlesByYear(year: number): HistoricalBattle[] {
    return Array.from(this.battles.values()).filter(
      battle => battle.year === year
    );
  }

  getBattlesByPeriod(startYear: number, endYear: number): HistoricalBattle[] {
    return Array.from(this.battles.values()).filter(
      battle => battle.year >= startYear && battle.year <= endYear
    );
  }

  recordBattle(event: BattleEvent): void {
    this.battleHistory.push(event);
  }

  getBattleHistory(): BattleEvent[] {
    return this.battleHistory;
  }

  getPlayerBattles(): BattleEvent[] {
    return this.battleHistory.filter(e => e.playerParticipation);
  }

  calculateBattleOutcome(
    attackerStrength: number,
    defenderStrength: number,
    terrain: string,
    weather: string
  ): {
    outcome: 'victory' | 'defeat' | 'draw';
    casualties: { attacker: number; defender: number };
  } {
    // Simple battle calculation
    let attackerModifier = 1.0;
    let defenderModifier = 1.2; // Defender advantage

    // Terrain modifiers
    if (terrain === 'hills' || terrain === 'mountains') {
      defenderModifier += 0.2;
    }

    // Weather modifiers
    if (weather === 'rainy' || weather === 'muddy') {
      attackerModifier -= 0.1;
    }

    const attackerEffective = attackerStrength * attackerModifier;
    const defenderEffective = defenderStrength * defenderModifier;

    const ratio = attackerEffective / defenderEffective;

    let outcome: 'victory' | 'defeat' | 'draw';
    if (ratio > 1.3) {
      outcome = 'victory';
    } else if (ratio < 0.7) {
      outcome = 'defeat';
    } else {
      outcome = 'draw';
    }

    // Calculate casualties
    const attackerCasualties = Math.floor(attackerStrength * (0.1 + Math.random() * 0.3));
    const defenderCasualties = Math.floor(defenderStrength * (0.1 + Math.random() * 0.3));

    return {
      outcome,
      casualties: {
        attacker: attackerCasualties,
        defender: defenderCasualties
      }
    };
  }

  getInnovationsFromBattles(): string[] {
    const innovations = new Set<string>();
    this.battleHistory.forEach(event => {
      const battle = this.battles.get(event.battleId);
      if (battle) {
        battle.militaryInnovations.forEach(innovation => innovations.add(innovation));
      }
    });
    return Array.from(innovations);
  }
}
