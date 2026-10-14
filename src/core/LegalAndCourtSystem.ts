/**
 * Legal and Court System
 * 
 * Implements justice system with:
 * - Court proceedings with judges, lawyers, juries
 * - Bureaucratic apparatus with hierarchies
 * - Case processing and verdicts
 * - Prison system
 * 
 * Scalability:
 * - Cases sampled for large populations
 * - Hierarchical bureaucracy aggregation
 * - Statistical crime processing
 */

import { ScalabilityConfig } from './ScalabilityConfig';

/**
 * Crime types
 */
export type CrimeType = 'theft' | 'assault' | 'murder' | 'fraud' | 'treason' | 'smuggling' | 'corruption' | 'vandalism' | 'tax_evasion';

/**
 * Court types
 */
export type CourtType = 'local' | 'regional' | 'supreme' | 'constitutional';

/**
 * Punishment types
 */
export type PunishmentType = 'fine' | 'imprisonment' | 'execution' | 'exile' | 'labor' | 'rehabilitation';

/**
 * Legal case
 */
export interface LegalCase {
  /** Case ID */
  id: string;
  /** Crime type */
  crimeType: CrimeType;
  /** Accused citizen ID */
  accusedId: string;
  /** Victim ID (if applicable) */
  victimId?: string;
  /** Judge ID */
  judgeId: string;
  /** Prosecutor ID */
  prosecutorId?: string;
  /** Defense lawyer ID */
  defenderId?: string;
  /** Jury members (if applicable) */
  jury?: string[];
  /** Evidence strength (0-100) */
  evidenceStrength: number;
  /** Court type */
  court: CourtType;
  /** Filing date */
  filedDate: number;
  /** Trial date */
  trialDate?: number;
  /** Verdict date */
  verdictDate?: number;
  /** Verdict */
  verdict?: 'guilty' | 'not_guilty' | 'dismissed';
  /** Punishment */
  punishment?: {
    type: PunishmentType;
    duration?: number; // Years for imprisonment
    amount?: number; // Gold for fines
  };
  /** Status */
  status: 'filed' | 'in_trial' | 'verdict_reached' | 'completed' | 'appealed';
}

/**
 * Judge
 */
export interface Judge {
  /** Judge ID */
  id: string;
  /** Name */
  name: string;
  /** Court level */
  courtLevel: CourtType;
  /** Experience (years) */
  experience: number;
  /** Integrity (0-100) */
  integrity: number;
  /** Bias (0=harsh, 50=fair, 100=lenient) */
  bias: number;
  /** Cases handled */
  casesHandled: number;
  /** Location */
  location: string;
}

/**
 * Bureaucrat
 */
export interface Bureaucrat {
  /** ID */
  id: string;
  /** Name */
  name: string;
  /** Position/rank */
  rank: 'clerk' | 'official' | 'administrator' | 'director' | 'minister';
  /** Department */
  department: string;
  /** Superior ID */
  superiorId?: string;
  /** Subordinates */
  subordinates: string[];
  /** Efficiency (0-100) */
  efficiency: number;
  /** Corruption level (0-100) */
  corruptionLevel: number;
  /** Salary */
  salary: number;
  /** Location */
  location: string;
}

/**
 * Prison
 */
export interface Prison {
  /** Prison ID */
  id: string;
  /** Name */
  name: string;
  /** Capacity */
  capacity: number;
  /** Current inmates */
  inmates: string[]; // Citizen IDs
  /** Conditions (0-100, higher is better) */
  conditions: number;
  /** Security level */
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  /** Rehabilitation programs */
  rehabilitation: boolean;
  /** Location */
  location: string;
}

/**
 * Legal and Court System
 */
export class LegalAndCourtSystem {
  private cases: Map<string, LegalCase> = new Map();
  private judges: Map<string, Judge> = new Map();
  private bureaucrats: Map<string, Bureaucrat> = new Map();
  private prisons: Map<string, Prison> = new Map();
  private scalabilityConfig: ScalabilityConfig;
  private caseBacklog: LegalCase[] = [];

  constructor() {
    this.scalabilityConfig = ScalabilityConfig.getInstance();
  }

  /**
   * File a legal case
   */
  public fileCase(
    crimeType: CrimeType,
    accusedId: string,
    victimId: string | undefined,
    evidenceStrength: number,
    location: string
  ): LegalCase {
    const id = `case_${Date.now()}_${Math.random()}`;

    // Determine court type based on crime severity
    const court = this.determineCourtType(crimeType);

    // Assign judge
    const judge = this.findAvailableJudge(court, location);
    
    const legalCase: LegalCase = {
      id,
      crimeType,
      accusedId,
      victimId,
      judgeId: judge?.id || 'unknown',
      evidenceStrength,
      court,
      filedDate: Date.now(),
      status: 'filed'
    };

    // Check if we should track this case or process statistically
    if (this.shouldTrackCase()) {
      this.cases.set(id, legalCase);
    } else {
      // Process statistically
      this.processStatisticalCase(legalCase);
      return legalCase;
    }

    this.caseBacklog.push(legalCase);
    return legalCase;
  }

  /**
   * Determine if case should be tracked individually
   */
  private shouldTrackCase(): boolean {
    const population = this.scalabilityConfig.getMetrics().currentPopulation;
    
    if (population < 100000) {
      return true; // Track all cases
    } else if (population < 1000000) {
      return Math.random() < 0.1; // 10% sampling
    } else {
      return Math.random() < 0.01; // 1% sampling for large populations
    }
  }

  /**
   * Process case statistically (for scalability)
   */
  private processStatisticalCase(legalCase: LegalCase): void {
    // Simplified statistical verdict
    const guiltyChance = legalCase.evidenceStrength / 100;
    const verdict = Math.random() < guiltyChance ? 'guilty' : 'not_guilty';

    if (verdict === 'guilty') {
      // Statistical punishment assignment
      // Would update aggregate statistics instead of individual tracking
    }
  }

  /**
   * Determine court type based on crime
   */
  private determineCourtType(crime: CrimeType): CourtType {
    switch (crime) {
      case 'treason':
        return 'supreme';
      case 'murder':
        return 'regional';
      case 'theft':
      case 'vandalism':
      case 'assault':
        return 'local';
      case 'fraud':
      case 'corruption':
      case 'tax_evasion':
        return 'regional';
      default:
        return 'local';
    }
  }

  /**
   * Find available judge
   */
  private findAvailableJudge(courtType: CourtType, location: string): Judge | undefined {
    return Array.from(this.judges.values()).find(
      j => j.courtLevel === courtType && j.location === location
    );
  }

  /**
   * Process court proceedings
   */
  public processCases(): void {
    const casesToProcess = Math.min(
      this.caseBacklog.length,
      this.scalabilityConfig.getThresholds().maxEventsPerTick
    );

    for (let i = 0; i < casesToProcess; i++) {
      const legalCase = this.caseBacklog.shift();
      if (!legalCase) break;

      this.processCase(legalCase);
    }
  }

  /**
   * Process a single case through trial
   */
  private processCase(legalCase: LegalCase): void {
    if (legalCase.status !== 'filed') return;

    // Move to trial
    legalCase.status = 'in_trial';
    legalCase.trialDate = Date.now();

    // Simulate trial
    const judge = this.judges.get(legalCase.judgeId);
    if (!judge) return;

    // Calculate verdict probability
    let guiltyChance = legalCase.evidenceStrength / 100;

    // Judge bias affects verdict
    const biasFactor = (judge.bias - 50) / 100; // -0.5 to +0.5
    guiltyChance += biasFactor * 0.2; // Bias can shift up to ±20%

    // Judge integrity affects fairness
    if (judge.integrity < 50) {
      // Corrupt judge might be bribed
      guiltyChance *= (judge.integrity / 100);
    }

    // Determine verdict
    const verdict = Math.random() < guiltyChance ? 'guilty' : 'not_guilty';

    legalCase.verdict = verdict;
    legalCase.verdictDate = Date.now();
    legalCase.status = 'verdict_reached';

    // Assign punishment if guilty
    if (verdict === 'guilty') {
      legalCase.punishment = this.determinePunishment(legalCase.crimeType, judge);
    }

    // Update judge stats
    judge.casesHandled++;

    // Process punishment
    if (legalCase.punishment) {
      this.executePunishment(legalCase);
    }

    legalCase.status = 'completed';
  }

  /**
   * Determine punishment
   */
  private determinePunishment(crime: CrimeType, judge: Judge): LegalCase['punishment'] {
    const harshness = 100 - judge.bias; // Higher value = harsher

    switch (crime) {
      case 'theft':
        if (harshness > 70) {
          return { type: 'imprisonment', duration: 1 + Math.random() * 2 };
        }
        return { type: 'fine', amount: 100 + Math.random() * 400 };

      case 'assault':
        return { type: 'imprisonment', duration: 2 + Math.random() * 3 };

      case 'murder':
        if (harshness > 60) {
          return { type: 'execution' };
        }
        return { type: 'imprisonment', duration: 15 + Math.random() * 10 };

      case 'treason':
        return { type: 'execution' };

      case 'fraud':
      case 'corruption':
        return { type: 'fine', amount: 1000 + Math.random() * 4000 };

      case 'tax_evasion':
        return { type: 'fine', amount: 500 + Math.random() * 2000 };

      case 'smuggling':
        return { type: 'imprisonment', duration: 1 + Math.random() * 2 };

      case 'vandalism':
        return { type: 'labor', duration: 0.25 }; // 3 months

      default:
        return { type: 'fine', amount: 50 };
    }
  }

  /**
   * Execute punishment
   */
  private executePunishment(legalCase: LegalCase): void {
    if (!legalCase.punishment) return;

    switch (legalCase.punishment.type) {
      case 'imprisonment':
        this.imprisonCitizen(legalCase.accusedId, legalCase.punishment.duration || 1);
        break;
      case 'execution':
        // Would mark citizen as executed
        break;
      case 'fine':
        // Would deduct gold from citizen
        break;
      case 'exile':
        // Would relocate citizen
        break;
      case 'labor':
        // Would assign forced labor
        break;
    }
  }

  /**
   * Imprison a citizen
   */
  private imprisonCitizen(citizenId: string, _duration: number): void {
    // Find prison with space
    for (const prison of this.prisons.values()) {
      if (prison.inmates.length < prison.capacity) {
        prison.inmates.push(citizenId);
        return;
      }
    }

    // No space - would need to build more prisons or early release
  }

  /**
   * Create a judge
   */
  public createJudge(
    name: string,
    courtLevel: CourtType,
    experience: number,
    location: string
  ): Judge {
    const id = `judge_${Date.now()}_${Math.random()}`;

    const judge: Judge = {
      id,
      name,
      courtLevel,
      experience,
      integrity: 50 + Math.random() * 40, // 50-90
      bias: 30 + Math.random() * 40, // 30-70 (fair range)
      casesHandled: 0,
      location
    };

    this.judges.set(id, judge);
    return judge;
  }

  /**
   * Create a bureaucrat
   */
  public createBureaucrat(
    name: string,
    rank: Bureaucrat['rank'],
    department: string,
    location: string,
    superiorId?: string
  ): Bureaucrat {
    const id = `bureaucrat_${Date.now()}_${Math.random()}`;

    const bureaucrat: Bureaucrat = {
      id,
      name,
      rank,
      department,
      superiorId,
      subordinates: [],
      efficiency: 40 + Math.random() * 40, // 40-80
      corruptionLevel: Math.random() * 30, // 0-30
      salary: this.getSalaryForRank(rank),
      location
    };

    this.bureaucrats.set(id, bureaucrat);

    // Add to superior's subordinates
    if (superiorId) {
      const superior = this.bureaucrats.get(superiorId);
      if (superior) {
        superior.subordinates.push(id);
      }
    }

    return bureaucrat;
  }

  /**
   * Get salary for bureaucratic rank
   */
  private getSalaryForRank(rank: Bureaucrat['rank']): number {
    switch (rank) {
      case 'clerk': return 50;
      case 'official': return 100;
      case 'administrator': return 200;
      case 'director': return 500;
      case 'minister': return 1500;
      default: return 50;
    }
  }

  /**
   * Create a prison
   */
  public createPrison(
    name: string,
    capacity: number,
    securityLevel: Prison['securityLevel'],
    location: string
  ): Prison {
    const id = `prison_${Date.now()}_${Math.random()}`;

    const prison: Prison = {
      id,
      name,
      capacity,
      inmates: [],
      conditions: 30 + Math.random() * 40, // 30-70
      securityLevel,
      rehabilitation: Math.random() > 0.5,
      location
    };

    this.prisons.set(id, prison);
    return prison;
  }

  /**
   * Get cases by status
   */
  public getCasesByStatus(status: LegalCase['status']): LegalCase[] {
    return Array.from(this.cases.values()).filter(c => c.status === status);
  }

  /**
   * Get backlog size
   */
  public getBacklogSize(): number {
    return this.caseBacklog.length;
  }

  /**
   * Get all judges
   */
  public getJudges(): Map<string, Judge> {
    return this.judges;
  }

  /**
   * Get all bureaucrats
   */
  public getBureaucrats(): Map<string, Bureaucrat> {
    return this.bureaucrats;
  }

  /**
   * Get all prisons
   */
  public getPrisons(): Map<string, Prison> {
    return this.prisons;
  }

  /**
   * Get prison occupancy rate
   */
  public getPrisonOccupancyRate(): number {
    let totalCapacity = 0;
    let totalInmates = 0;

    for (const prison of this.prisons.values()) {
      totalCapacity += prison.capacity;
      totalInmates += prison.inmates.length;
    }

    return totalCapacity > 0 ? totalInmates / totalCapacity : 0;
  }

  /**
   * Serialize for save/load
   */
  public serialize(): any {
    return {
      cases: Array.from(this.cases.entries()),
      judges: Array.from(this.judges.entries()),
      bureaucrats: Array.from(this.bureaucrats.entries()),
      prisons: Array.from(this.prisons.entries()),
      caseBacklog: this.caseBacklog
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.cases) {
      this.cases = new Map(data.cases);
    }
    if (data.judges) {
      this.judges = new Map(data.judges);
    }
    if (data.bureaucrats) {
      this.bureaucrats = new Map(data.bureaucrats);
    }
    if (data.prisons) {
      this.prisons = new Map(data.prisons);
    }
    if (data.caseBacklog) {
      this.caseBacklog = data.caseBacklog;
    }
  }
}
