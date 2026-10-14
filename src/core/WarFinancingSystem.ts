/**
 * War Financing System - Kriegsfinanzierung und Kriegsanleihen
 * Implements historical war financing methods including war bonds, taxation, and loans
 * 
 * @version 2.3.6
 * @author Kaiser von Deutschland Team
 */

import { Kingdom } from './Kingdom';

export interface WarFinancingMethod {
  id: string;
  name: string;
  era: string;
  yearStart: number;
  yearEnd: number;
  description: string;
  goldGainMin?: number;
  goldGainMax?: number;
  goldAmount?: number;
  goldGainMultiplier?: number;
  interestRate?: number;
  repaymentPeriod?: number; // in months
  popularityEffect: number;
  moralityEffect?: number;
  civilUnrest?: number;
  patriotismBonus?: number;
  inflationEffect?: number;
  productionBonus?: number;
  materialValue?: number;
  diplomaticBonus?: number;
  duration?: number; // in months
  warCrimes?: boolean;
  resourceGain?: {
    food?: number;
    wood?: number;
    stone?: number;
    iron?: number;
  };
  socialMobility?: number;
  requirements: {
    atWar: boolean;
    year?: number;
    victoriesRequired?: number;
    tradePower?: number;
    alliances?: number;
  };
}

export interface WarBond {
  id: string;
  name: string;
  year: number;
  country: string;
  totalRaised: number;
  description: string;
  historicalImpact: string;
}

export interface HistoricalWarEvent {
  id: string;
  name: string;
  year: number;
  description: string;
  cause: string;
  effect: {
    inflationRate?: number;
    goldValue?: number;
    civilUnrest?: number;
    economicCollapse?: boolean;
    stabilityBonus?: number;
    tradePowerBonus?: number;
    goldInflow?: number;
    economicGrowth?: number;
    diplomaticRelations?: number;
  };
}

export interface DebtRepaymentStrategy {
  id: string;
  name: string;
  description: string;
  popularityEffect?: number;
  diplomaticEffect?: number;
  repaymentSpeedMultiplier?: number;
  civilUnrest?: number;
  debtCancelled?: boolean;
  tradePenalty?: number;
  warRisk?: number;
  interestReduction?: number;
  diplomaticCost?: number;
  requiresDiplomacy?: number;
  inflationEffect?: number;
  realDebtReduction?: number;
}

export interface ActiveWarLoan {
  methodId: string;
  principalAmount: number;
  interestRate: number;
  monthsRemaining: number;
  monthlyPayment: number;
  totalOwed: number;
  startYear: number;
  startMonth: number;
}

export interface WarFinancingStats {
  totalWarDebt: number;
  monthlyDebtPayment: number;
  activeLoans: number;
  totalGoldRaisedFromWar: number;
  popularityFromWarFinancing: number;
  inflationFromWarFinancing: number;
}

export class WarFinancingSystem {
  private warFinancingMethods: WarFinancingMethod[] = [];
  private warBonds: WarBond[] = [];
  private historicalEvents: HistoricalWarEvent[] = [];
  private debtRepaymentStrategies: DebtRepaymentStrategy[] = [];
  
  private activeLoans: ActiveWarLoan[] = [];
  private totalGoldRaised: number = 0;
  private totalPopularityChange: number = 0;
  private totalInflationChange: number = 0;
  private activeFinancingMethods: Set<string> = new Set();

  constructor() {
    this.loadData();
  }

  /**
   * Load war financing data from JSON
   */
  private async loadData(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/war-financing.json');
      const data = await response.json();
      
      this.warFinancingMethods = data.warFinancingMethods || [];
      this.warBonds = data.warBonds || [];
      this.historicalEvents = data.historicalEvents || [];
      this.debtRepaymentStrategies = data.debtRepaymentStrategies || [];
    } catch (error) {
      console.error('Failed to load war financing data:', error);
    }
  }

  /**
   * Get available financing methods for current year and kingdom state
   */
  public getAvailableMethods(
    kingdom: Kingdom,
    year: number,
    victories: number = 0
  ): WarFinancingMethod[] {
    return this.warFinancingMethods.filter(method => {
      // Check year range
      if (year < method.yearStart || year > method.yearEnd) return false;
      
      // Check requirements
      if (method.requirements.atWar && !kingdom.isAtWar) return false;
      if (method.requirements.year && year < method.requirements.year) return false;
      if (method.requirements.victoriesRequired && victories < method.requirements.victoriesRequired) return false;
      if (method.requirements.tradePower && kingdom.stats.tradePower < method.requirements.tradePower) return false;
      if (method.requirements.alliances && kingdom.alliances.length < method.requirements.alliances) return false;
      
      return true;
    });
  }

  /**
   * Activate a war financing method
   */
  public activateFinancingMethod(
    kingdom: Kingdom,
    methodId: string,
    currentYear: number,
    currentMonth: number = 1
  ): {
    success: boolean;
    goldGained: number;
    message: string;
    effects: {
      popularity?: number;
      civilUnrest?: number;
      inflation?: number;
      resources?: Partial<typeof kingdom.resources>;
    };
  } {
    const method = this.warFinancingMethods.find(m => m.id === methodId);
    if (!method) {
      return {
        success: false,
        goldGained: 0,
        message: 'Finanzierungsmethode nicht gefunden',
        effects: {}
      };
    }

    let goldGained = 0;
    const effects: any = {};

    // Calculate gold gain
    if (method.goldAmount) {
      goldGained = method.goldAmount;
    } else if (method.goldGainMin && method.goldGainMax) {
      goldGained = method.goldGainMin + 
        Math.random() * (method.goldGainMax - method.goldGainMin);
    } else if (method.goldGainMultiplier) {
      // Tax-based: multiply current income
      const currentIncome = kingdom.resources.gold * 0.1; // Approximate monthly income
      goldGained = currentIncome * method.goldGainMultiplier;
    }

    goldGained = Math.floor(goldGained);

    // Apply effects
    if (method.popularityEffect) {
      kingdom.happiness += method.popularityEffect;
      effects.popularity = method.popularityEffect;
      this.totalPopularityChange += method.popularityEffect;
    }

    if (method.civilUnrest) {
      kingdom.stats.stability -= method.civilUnrest * 100;
      effects.civilUnrest = method.civilUnrest;
    }

    if (method.inflationEffect) {
      this.totalInflationChange += method.inflationEffect;
      effects.inflation = method.inflationEffect;
    }

    // Handle resources
    if (method.resourceGain) {
      effects.resources = {};
      if (method.resourceGain.food) {
        kingdom.resources.food += method.resourceGain.food;
        effects.resources.food = method.resourceGain.food;
      }
      if (method.resourceGain.wood) {
        kingdom.resources.wood += method.resourceGain.wood;
        effects.resources.wood = method.resourceGain.wood;
      }
      if (method.resourceGain.stone) {
        kingdom.resources.stone += method.resourceGain.stone;
        effects.resources.stone = method.resourceGain.stone;
      }
      if (method.resourceGain.iron) {
        kingdom.resources.iron += method.resourceGain.iron;
        effects.resources.iron = method.resourceGain.iron;
      }
    }

    // Create loan if method has interest rate
    if (method.interestRate && method.repaymentPeriod) {
      const loan = this.createLoan(
        methodId,
        goldGained,
        method.interestRate,
        method.repaymentPeriod,
        currentYear,
        currentMonth
      );
      this.activeLoans.push(loan);
      kingdom.resources.debt += loan.totalOwed;
    } else {
      // Direct gold gain without debt
      kingdom.resources.gold += goldGained;
    }

    this.totalGoldRaised += goldGained;
    this.activeFinancingMethods.add(methodId);

    return {
      success: true,
      goldGained,
      message: `${method.name} aktiviert: ${goldGained.toLocaleString()} Gold erhalten`,
      effects
    };
  }

  /**
   * Create a loan with interest
   */
  private createLoan(
    methodId: string,
    principal: number,
    interestRate: number,
    months: number,
    startYear: number,
    startMonth: number
  ): ActiveWarLoan {
    // Calculate total owed with compound interest
    const totalOwed = principal * Math.pow(1 + interestRate / 12, months);
    const monthlyPayment = totalOwed / months;

    return {
      methodId,
      principalAmount: principal,
      interestRate,
      monthsRemaining: months,
      monthlyPayment,
      totalOwed,
      startYear,
      startMonth
    };
  }

  /**
   * Process monthly debt payments
   */
  public processMonthlyPayments(kingdom: Kingdom): {
    totalPayment: number;
    loansCompleted: number;
    cannotAfford: boolean;
  } {
    let totalPayment = 0;
    let loansCompleted = 0;
    let cannotAfford = false;

    this.activeLoans = this.activeLoans.filter(loan => {
      if (loan.monthsRemaining <= 0) {
        loansCompleted++;
        return false;
      }

      // Try to make payment
      if (kingdom.resources.gold >= loan.monthlyPayment) {
        kingdom.resources.gold -= loan.monthlyPayment;
        kingdom.resources.debt -= loan.monthlyPayment;
        totalPayment += loan.monthlyPayment;
        loan.monthsRemaining--;
        loan.totalOwed -= loan.monthlyPayment;
        return true;
      } else {
        // Cannot afford payment - accumulate penalty
        cannotAfford = true;
        kingdom.happiness -= 2; // Penalty for missed payment
        kingdom.stats.stability -= 1;
        return true; // Keep loan active
      }
    });

    return { totalPayment, loansCompleted, cannotAfford };
  }

  /**
   * Apply debt repayment strategy
   */
  public applyRepaymentStrategy(
    kingdom: Kingdom,
    strategyId: string
  ): {
    success: boolean;
    message: string;
    effects: any;
  } {
    const strategy = this.debtRepaymentStrategies.find(s => s.id === strategyId);
    if (!strategy) {
      return {
        success: false,
        message: 'Strategie nicht gefunden',
        effects: {}
      };
    }

    // Check requirements
    if (strategy.requiresDiplomacy && kingdom.stats.diplomaticRelations < strategy.requiresDiplomacy) {
      return {
        success: false,
        message: `Benötigt diplomatische Beziehungen von mindestens ${strategy.requiresDiplomacy}`,
        effects: {}
      };
    }

    const effects: any = {};

    // Apply strategy effects
    if (strategy.popularityEffect) {
      kingdom.happiness += strategy.popularityEffect;
      effects.popularity = strategy.popularityEffect;
    }

    if (strategy.diplomaticEffect) {
      kingdom.stats.diplomaticRelations += strategy.diplomaticEffect;
      effects.diplomatic = strategy.diplomaticEffect;
    }

    if (strategy.civilUnrest) {
      kingdom.stats.stability -= strategy.civilUnrest * 100;
      effects.civilUnrest = strategy.civilUnrest;
    }

    if (strategy.debtCancelled) {
      kingdom.resources.debt = 0;
      this.activeLoans = [];
      effects.debtCancelled = true;
    }

    if (strategy.repaymentSpeedMultiplier) {
      // Increase monthly payments
      this.activeLoans.forEach(loan => {
        loan.monthlyPayment *= strategy.repaymentSpeedMultiplier!;
      });
      effects.repaymentSpeedMultiplier = strategy.repaymentSpeedMultiplier;
    }

    if (strategy.interestReduction) {
      // Reduce interest on all loans
      this.activeLoans.forEach(loan => {
        loan.interestRate *= (1 - strategy.interestReduction!);
        // Recalculate total owed
        const remainingPrincipal = loan.principalAmount * (loan.monthsRemaining / 
          (loan.totalOwed / loan.monthlyPayment));
        loan.totalOwed = remainingPrincipal * Math.pow(1 + loan.interestRate / 12, loan.monthsRemaining);
        loan.monthlyPayment = loan.totalOwed / loan.monthsRemaining;
      });
      effects.interestReduction = strategy.interestReduction;
    }

    if (strategy.realDebtReduction) {
      // Reduce debt through inflation
      const debtReduction = kingdom.resources.debt * strategy.realDebtReduction;
      kingdom.resources.debt -= debtReduction;
      effects.debtReduction = debtReduction;
    }

    if (strategy.inflationEffect) {
      this.totalInflationChange += strategy.inflationEffect;
      effects.inflation = strategy.inflationEffect;
    }

    return {
      success: true,
      message: `${strategy.name} aktiviert`,
      effects
    };
  }

  /**
   * Get statistics about war financing
   */
  public getStats(): WarFinancingStats {
    const monthlyPayment = this.activeLoans.reduce(
      (sum, loan) => sum + loan.monthlyPayment,
      0
    );

    return {
      totalWarDebt: this.activeLoans.reduce((sum, loan) => sum + loan.totalOwed, 0),
      monthlyDebtPayment: monthlyPayment,
      activeLoans: this.activeLoans.length,
      totalGoldRaisedFromWar: this.totalGoldRaised,
      popularityFromWarFinancing: this.totalPopularityChange,
      inflationFromWarFinancing: this.totalInflationChange
    };
  }

  /**
   * Get active loans
   */
  public getActiveLoans(): ActiveWarLoan[] {
    return [...this.activeLoans];
  }

  /**
   * Get historical war bonds data
   */
  public getHistoricalWarBonds(): WarBond[] {
    return this.warBonds;
  }

  /**
   * Get historical events
   */
  public getHistoricalEvents(year?: number): HistoricalWarEvent[] {
    if (year) {
      return this.historicalEvents.filter(e => e.year === year);
    }
    return this.historicalEvents;
  }

  /**
   * Get repayment strategies
   */
  public getRepaymentStrategies(kingdom: Kingdom): DebtRepaymentStrategy[] {
    return this.debtRepaymentStrategies.filter(strategy => {
      if (strategy.requiresDiplomacy && 
          kingdom.stats.diplomaticRelations < strategy.requiresDiplomacy) {
        return false;
      }
      return true;
    });
  }

  /**
   * Check if a historical event should trigger
   */
  public checkHistoricalEvents(
    kingdom: Kingdom,
    year: number
  ): HistoricalWarEvent | null {
    const event = this.historicalEvents.find(e => e.year === year);
    if (!event) return null;

    // Apply event effects
    if (event.effect.inflationRate) {
      this.totalInflationChange += event.effect.inflationRate;
    }
    if (event.effect.goldValue) {
      kingdom.resources.gold *= event.effect.goldValue;
    }
    if (event.effect.civilUnrest) {
      kingdom.stats.stability -= event.effect.civilUnrest * 100;
    }
    if (event.effect.stabilityBonus) {
      kingdom.stats.stability += event.effect.stabilityBonus * 100;
    }
    if (event.effect.tradePowerBonus) {
      kingdom.stats.tradePower += event.effect.tradePowerBonus * 100;
    }
    if (event.effect.goldInflow) {
      kingdom.resources.gold += event.effect.goldInflow;
    }
    if (event.effect.economicGrowth) {
      // Economic growth bonus (could affect production rates)
    }
    if (event.effect.diplomaticRelations) {
      kingdom.stats.diplomaticRelations += event.effect.diplomaticRelations;
    }

    return event;
  }

  /**
   * Reset system (for testing or new game)
   */
  public reset(): void {
    this.activeLoans = [];
    this.totalGoldRaised = 0;
    this.totalPopularityChange = 0;
    this.totalInflationChange = 0;
    this.activeFinancingMethods.clear();
  }

  /**
   * Get summary for UI display
   */
  public getSummary(): string {
    const stats = this.getStats();
    return `
War Financing Summary:
- Total War Debt: ${stats.totalWarDebt.toLocaleString()} Gold
- Monthly Payments: ${stats.monthlyDebtPayment.toLocaleString()} Gold
- Active Loans: ${stats.activeLoans}
- Total Raised: ${stats.totalGoldRaisedFromWar.toLocaleString()} Gold
- Popularity Impact: ${stats.popularityFromWarFinancing > 0 ? '+' : ''}${stats.popularityFromWarFinancing}
- Inflation Impact: ${(stats.inflationFromWarFinancing * 100).toFixed(1)}%
    `.trim();
  }
}
