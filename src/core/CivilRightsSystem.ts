/**
 * Civil Rights Development System
 * 
 * Manages the evolution of fundamental rights and freedoms:
 * - Basic rights and constitutional development
 * - Voting rights expansion
 * - Equality movements (gender, race, LGBTQ+)
 * - Privacy and data protection (from 1970)
 * 
 * Integrates with:
 * - Legal system for rights enforcement
 * - Social system for movements and protests
 * - Policy system for rights legislation
 * 
 * Scalability:
 * - Rights adoption tracked at regional level
 * - Movements use representative sampling
 * - Effects propagate through social cohorts
 */

/**
 * Fundamental right definition
 */
export interface FundamentalRight {
  /** Right ID */
  id: string;
  /** Right name */
  name: string;
  /** Category */
  category: 'civil' | 'political' | 'social' | 'economic' | 'cultural';
  /** Introduction year */
  yearIntroduced: number;
  /** Description */
  description: string;
  /** Prerequisite rights */
  prerequisites: string[];
  /** Required technology */
  requiredTechnology: string | null;
  /** Population satisfaction bonus */
  satisfactionBonus: number;
  /** Stability impact */
  stabilityImpact: number;
  /** Economic cost */
  implementationCost: number;
}

/**
 * Voting rights expansion milestone
 */
export interface VotingRightsMilestone {
  /** Milestone ID */
  id: string;
  /** Milestone name */
  name: string;
  /** Year achieved */
  year: number;
  /** Description */
  description: string;
  /** Electorate expansion (%) */
  electorateExpansion: number;
  /** Affected groups */
  affectedGroups: string[];
  /** Political impact */
  politicalImpact: {
    democratization: number;
    participation: number;
    representation: number;
  };
}

/**
 * Equality movement
 */
export interface EqualityMovement {
  /** Movement ID */
  id: string;
  /** Movement name */
  name: string;
  /** Type */
  type: 'gender' | 'racial' | 'lgbtq' | 'disability' | 'class';
  /** Active period */
  period: {
    start: number;
    end: number | null;
  };
  /** Goals */
  goals: string[];
  /** Achievements */
  achievements: string[];
  /** Support level (0-100) */
  supportLevel: number;
  /** Opposition level (0-100) */
  oppositionLevel: number;
  /** Social impact */
  socialImpact: {
    awareness: number;
    legislation: number;
    culturalChange: number;
    economicEquality: number;
  };
  /** Key figures */
  keyFigures: string[];
}

/**
 * Privacy and data protection regulation
 */
export interface PrivacyRegulation {
  /** Regulation ID */
  id: string;
  /** Regulation name */
  name: string;
  /** Year enacted */
  yearEnacted: number;
  /** Scope */
  scope: 'national' | 'regional' | 'international';
  /** Protection level (0-100) */
  protectionLevel: number;
  /** Protected data types */
  protectedDataTypes: string[];
  /** Enforcement mechanisms */
  enforcementMechanisms: string[];
  /** Penalties for violations */
  violations: {
    fineLevel: number;
    criminalCharges: boolean;
  };
  /** Citizen trust impact */
  trustImpact: number;
}

/**
 * Constitutional development
 */
export interface Constitution {
  /** Constitution ID */
  id: string;
  /** Name */
  name: string;
  /** Year adopted */
  yearAdopted: number;
  /** Type */
  type: 'absolute_monarchy' | 'constitutional_monarchy' | 'republic' | 'federal_republic';
  /** Guaranteed rights */
  guaranteedRights: string[];
  /** Separation of powers */
  separationOfPowers: {
    legislative: boolean;
    executive: boolean;
    judicial: boolean;
  };
  /** Amendment difficulty (0-100) */
  amendmentDifficulty: number;
  /** Democratic legitimacy (0-100) */
  legitimacy: number;
}

/**
 * Civil Rights Development System class
 */
export class CivilRightsSystem {
  private fundamentalRights: Map<string, FundamentalRight> = new Map();
  private votingMilestones: Map<string, VotingRightsMilestone> = new Map();
  private equalityMovements: Map<string, EqualityMovement> = new Map();
  private privacyRegulations: Map<string, PrivacyRegulation> = new Map();
  private constitutions: Map<string, Constitution> = new Map();
  private activeRights: Set<string> = new Set();
  private activeMovements: Map<string, EqualityMovement> = new Map();

  /**
   * Initialize the civil rights system
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/civil-rights-system.json');
      const data = await response.json();

      // Load fundamental rights
      data.fundamentalRights.forEach((right: FundamentalRight) => {
        this.fundamentalRights.set(right.id, right);
      });

      // Load voting milestones
      if (data.votingMilestones) {
        data.votingMilestones.forEach((milestone: VotingRightsMilestone) => {
          this.votingMilestones.set(milestone.id, milestone);
        });
      }

      // Load equality movements
      if (data.equalityMovements) {
        data.equalityMovements.forEach((movement: EqualityMovement) => {
          this.equalityMovements.set(movement.id, movement);
        });
      }

      // Load privacy regulations
      if (data.privacyRegulations) {
        data.privacyRegulations.forEach((regulation: PrivacyRegulation) => {
          this.privacyRegulations.set(regulation.id, regulation);
        });
      }

      // Load constitutions
      if (data.constitutions) {
        data.constitutions.forEach((constitution: Constitution) => {
          this.constitutions.set(constitution.id, constitution);
        });
      }

      console.log(`Civil Rights System initialized: ${this.fundamentalRights.size} rights, ${this.votingMilestones.size} milestones, ${this.equalityMovements.size} movements`);
    } catch (error) {
      console.error('Failed to load civil rights data:', error);
    }
  }

  /**
   * Update civil rights system for current year
   */
  update(year: number, deltaTime: number): void {
    // Update active rights
    this.updateActiveRights(year);

    // Update current constitution
    this.updateCurrentConstitution(year);

    // Update equality movements
    this.updateEqualityMovements(year, deltaTime);
  }

  /**
   * Get active fundamental rights for the year
   */
  getActiveRights(year: number): FundamentalRight[] {
    return Array.from(this.fundamentalRights.values()).filter(right => {
      return right.yearIntroduced <= year;
    });
  }

  /**
   * Get achieved voting milestones
   */
  getAchievedMilestones(year: number): VotingRightsMilestone[] {
    return Array.from(this.votingMilestones.values()).filter(milestone => {
      return milestone.year <= year;
    });
  }

  /**
   * Get active equality movements
   */
  getActiveMovements(year: number): EqualityMovement[] {
    return Array.from(this.equalityMovements.values()).filter(movement => {
      return movement.period.start <= year && 
             (movement.period.end === null || movement.period.end >= year);
    });
  }

  /**
   * Get active privacy regulations
   */
  getActiveRegulations(year: number): PrivacyRegulation[] {
    if (year < 1970) return [];
    return Array.from(this.privacyRegulations.values()).filter(regulation => {
      return regulation.yearEnacted <= year;
    });
  }

  /**
   * Get current constitution
   */
  getCurrentConstitution(year: number): Constitution | null {
    let current: Constitution | null = null;
    for (const constitution of this.constitutions.values()) {
      if (constitution.yearAdopted <= year) {
        if (!current || constitution.yearAdopted > current.yearAdopted) {
          current = constitution;
        }
      }
    }
    return current;
  }

  /**
   * Check if a right is active
   */
  hasRight(rightId: string, year: number): boolean {
    const right = this.fundamentalRights.get(rightId);
    return right ? right.yearIntroduced <= year : false;
  }

  /**
   * Grant a fundamental right
   */
  grantRight(rightId: string, year: number): boolean {
    const right = this.fundamentalRights.get(rightId);
    if (!right) return false;

    // Check prerequisites
    for (const prereq of right.prerequisites) {
      if (!this.hasRight(prereq, year)) {
        console.log(`Cannot grant right ${rightId}: prerequisite ${prereq} not met`);
        return false;
      }
    }

    right.yearIntroduced = year;
    this.activeRights.add(rightId);
    return true;
  }

  /**
   * Calculate democratization level
   */
  getDemocratizationLevel(year: number): number {
    let level = 0;

    // Constitution type
    const constitution = this.getCurrentConstitution(year);
    if (constitution) {
      switch (constitution.type) {
        case 'federal_republic':
          level += 40;
          break;
        case 'republic':
          level += 30;
          break;
        case 'constitutional_monarchy':
          level += 20;
          break;
        case 'absolute_monarchy':
          level += 0;
          break;
      }

      // Separation of powers
      if (constitution.separationOfPowers.legislative) level += 10;
      if (constitution.separationOfPowers.executive) level += 10;
      if (constitution.separationOfPowers.judicial) level += 10;
    }

    // Voting rights
    const milestones = this.getAchievedMilestones(year);
    level += milestones.length * 3;

    // Active rights
    const activeRights = this.getActiveRights(year);
    level += activeRights.filter(r => r.category === 'political').length * 2;

    return Math.min(100, level);
  }

  /**
   * Calculate social equality level
   */
  getSocialEqualityLevel(year: number): number {
    let level = 0;

    // Equality movements
    const movements = this.getActiveMovements(year);
    for (const movement of movements) {
      level += movement.socialImpact.culturalChange * 0.1;
      level += movement.supportLevel * 0.05;
    }

    // Rights in equality category
    const rights = this.getActiveRights(year);
    level += rights.filter(r => r.category === 'social').length * 5;

    return Math.min(100, level);
  }

  /**
   * Calculate privacy protection level
   */
  getPrivacyProtectionLevel(year: number): number {
    if (year < 1970) return 0;

    const regulations = this.getActiveRegulations(year);
    let level = 0;

    for (const regulation of regulations) {
      level += regulation.protectionLevel * 0.3;
    }

    return Math.min(100, level);
  }

  /**
   * Get summary for UI display
   */
  getSummary(year: number): {
    activeRights: number;
    votingMilestones: number;
    activeMovements: number;
    privacyRegulations: number;
    currentConstitution: Constitution | null;
    democratization: number;
    socialEquality: number;
    privacyProtection: number;
  } {
    return {
      activeRights: this.getActiveRights(year).length,
      votingMilestones: this.getAchievedMilestones(year).length,
      activeMovements: this.getActiveMovements(year).length,
      privacyRegulations: this.getActiveRegulations(year).length,
      currentConstitution: this.getCurrentConstitution(year),
      democratization: this.getDemocratizationLevel(year),
      socialEquality: this.getSocialEqualityLevel(year),
      privacyProtection: this.getPrivacyProtectionLevel(year)
    };
  }

  /**
   * Private: Update active rights
   */
  private updateActiveRights(year: number): void {
    this.activeRights.clear();
    for (const [id, right] of this.fundamentalRights) {
      if (right.yearIntroduced <= year) {
        this.activeRights.add(id);
      }
    }
  }

  /**
   * Private: Update current constitution
   */
  private updateCurrentConstitution(_year: number): void {
    // Constitution is retrieved on-demand via getCurrentConstitution()
    // No persistent state needed here
  }

  /**
   * Private: Update equality movements
   */
  private updateEqualityMovements(year: number, deltaTime: number): void {
    this.activeMovements.clear();

    for (const [id, movement] of this.equalityMovements) {
      if (movement.period.start <= year && 
          (movement.period.end === null || movement.period.end >= year)) {
        
        this.activeMovements.set(id, movement);

        // Update support and opposition
        const yearsSinceStart = year - movement.period.start;

        if (yearsSinceStart < 5) {
          // Growing phase
          movement.supportLevel = Math.min(100, movement.supportLevel + deltaTime * 2);
          movement.oppositionLevel = Math.max(20, movement.oppositionLevel - deltaTime);
        } else if (yearsSinceStart < 20) {
          // Mature phase
          movement.supportLevel = Math.min(80, movement.supportLevel + deltaTime * 0.5);
          movement.oppositionLevel = Math.max(10, movement.oppositionLevel - deltaTime * 0.5);
        } else {
          // Decline phase (if end date exists)
          if (movement.period.end && year > movement.period.end - 5) {
            movement.supportLevel = Math.max(30, movement.supportLevel - deltaTime * 2);
          }
        }

        // Update social impact
        movement.socialImpact.awareness = Math.min(100, movement.supportLevel * 0.8);
        movement.socialImpact.culturalChange = Math.min(100, (yearsSinceStart / 30) * 100);
      }
    }
  }
}
