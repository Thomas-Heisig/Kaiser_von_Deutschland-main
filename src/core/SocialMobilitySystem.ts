/**
 * Social Mobility System
 * 
 * Manages career changes and social class transitions with scalability.
 * Uses probability-based aggregate calculations for large populations.
 */

import { ScalabilityConfig } from './ScalabilityConfig';

export interface CareerPath {
  fromProfession: string;
  toProfession: string;
  difficulty: number; // 0-100, higher = harder
  requirements: {
    education?: number;
    wealth?: number;
    connections?: number;
    age?: { min: number; max: number };
  };
}

export interface SocialClass {
  name: 'lower' | 'working' | 'middle' | 'upper_middle' | 'upper' | 'nobility';
  minWealth: number;
  professions: string[];
  mobilityRate: number; // 0-1, chance to move up per year
}

export interface MobilityEvent {
  citizenId?: string; // Optional for aggregated mode
  fromProfession: string;
  toProfession: string;
  fromClass: SocialClass['name'];
  toClass: SocialClass['name'];
  reason: 'education' | 'wealth' | 'opportunity' | 'inheritance' | 'merit' | 'revolution';
  timestamp: number;
  success: boolean;
}

export interface MobilityStats {
  totalTransitions: number;
  upwardMobility: number;
  downwardMobility: number;
  lateralMobility: number;
  transitionsByClass: Map<string, number>;
  transitionsByProfession: Map<string, number>;
  averageSuccessRate: number;
}

export class SocialMobilitySystem {
  private config: ScalabilityConfig;
  private mobilityHistory: MobilityEvent[] = [];
  private maxHistorySize = 1000;

  /** Social class definitions */
  private socialClasses: Map<SocialClass['name'], SocialClass> = new Map([
    ['lower', {
      name: 'lower',
      minWealth: 0,
      professions: ['Bettler', 'Tagelöhner', 'Leibeigener'],
      mobilityRate: 0.05
    }],
    ['working', {
      name: 'working',
      minWealth: 100,
      professions: ['Bauer', 'Arbeiter', 'Diener', 'Soldat'],
      mobilityRate: 0.1
    }],
    ['middle', {
      name: 'middle',
      minWealth: 1000,
      professions: ['Handwerker', 'Händler', 'Schreiber', 'Lehrer'],
      mobilityRate: 0.15
    }],
    ['upper_middle', {
      name: 'upper_middle',
      minWealth: 10000,
      professions: ['Gildenmeister', 'Bankier', 'Architekt', 'Arzt', 'Gelehrter'],
      mobilityRate: 0.12
    }],
    ['upper', {
      name: 'upper',
      minWealth: 50000,
      professions: ['Fabrikbesitzer', 'Großhändler', 'Diplomat', 'General'],
      mobilityRate: 0.08
    }],
    ['nobility', {
      name: 'nobility',
      minWealth: 100000,
      professions: ['Herzog', 'Herzogin', 'König', 'Königin', 'Kaiser', 'Kaiserin'],
      mobilityRate: 0.02
    }]
  ]);

  /** Career paths with difficulty */
  private careerPaths: CareerPath[] = [
    // Upward mobility paths
    { fromProfession: 'Bauer', toProfession: 'Handwerker', difficulty: 30, requirements: { education: 20 } },
    { fromProfession: 'Bauer', toProfession: 'Soldat', difficulty: 20, requirements: { age: { min: 18, max: 35 } } },
    { fromProfession: 'Arbeiter', toProfession: 'Handwerker', difficulty: 40, requirements: { education: 30 } },
    { fromProfession: 'Handwerker', toProfession: 'Gildenmeister', difficulty: 50, requirements: { education: 50, wealth: 5000 } },
    { fromProfession: 'Händler', toProfession: 'Bankier', difficulty: 60, requirements: { education: 60, wealth: 10000 } },
    { fromProfession: 'Handwerker', toProfession: 'Architekt', difficulty: 70, requirements: { education: 70, wealth: 5000 } },
    { fromProfession: 'Soldat', toProfession: 'General', difficulty: 80, requirements: { education: 50, connections: 60 } },
    
    // Lateral moves
    { fromProfession: 'Handwerker', toProfession: 'Händler', difficulty: 35, requirements: { wealth: 1000 } },
    { fromProfession: 'Händler', toProfession: 'Handwerker', difficulty: 40, requirements: { education: 30 } },
    { fromProfession: 'Lehrer', toProfession: 'Gelehrter', difficulty: 55, requirements: { education: 70 } },
    
    // Downward mobility (failures, misfortune)
    { fromProfession: 'Händler', toProfession: 'Arbeiter', difficulty: 0, requirements: {} },
    { fromProfession: 'Handwerker', toProfession: 'Bauer', difficulty: 0, requirements: {} }
  ];

  constructor() {
    this.config = ScalabilityConfig.getInstance();
  }

  /**
   * Determine social class based on wealth and profession
   */
  public determineSocialClass(wealth: number, profession: string): SocialClass['name'] {
    // Check from highest to lowest
    const classes: SocialClass['name'][] = ['nobility', 'upper', 'upper_middle', 'middle', 'working', 'lower'];
    
    for (const className of classes) {
      const socialClass = this.socialClasses.get(className);
      if (socialClass && wealth >= socialClass.minWealth && 
          socialClass.professions.includes(profession)) {
        return className;
      }
    }

    // Default to class based on wealth alone
    for (const className of classes) {
      const socialClass = this.socialClasses.get(className);
      if (socialClass && wealth >= socialClass.minWealth) {
        return className;
      }
    }

    return 'lower';
  }

  /**
   * Calculate career change probability
   */
  public calculateCareerChangeProbability(
    currentProfession: string,
    targetProfession: string,
    education: number,
    wealth: number,
    connections: number,
    age: number,
    socialStability: number = 50 // 0-100
  ): number {
    const path = this.careerPaths.find(
      p => p.fromProfession === currentProfession && p.toProfession === targetProfession
    );

    if (!path) return 0; // No path available

    let probability = 100 - path.difficulty;

    // Check requirements
    if (path.requirements.education && education < path.requirements.education) {
      probability *= 0.3; // Heavy penalty
    }
    if (path.requirements.wealth && wealth < path.requirements.wealth) {
      probability *= 0.5;
    }
    if (path.requirements.connections && connections < path.requirements.connections) {
      probability *= 0.6;
    }
    if (path.requirements.age) {
      if (age < path.requirements.age.min || age > path.requirements.age.max) {
        probability *= 0.2;
      }
    }

    // Social stability affects mobility
    probability *= (0.5 + socialStability / 100);

    return Math.max(0, Math.min(100, probability));
  }

  /**
   * Process career changes for a population
   * Scalable: Uses statistical sampling for large populations
   */
  public processCareerChanges(
    _population: number, // Prefix with _ to indicate intentionally unused
    professionDistribution: Map<string, number>,
    avgEducation: number,
    avgWealth: number,
    avgConnections: number,
    avgAge: number,
    socialStability: number,
    yearlyRate: number = 0.05 // 5% attempt career change per year
  ): Map<string, { from: string; to: string; count: number }> {
    const changes = new Map<string, { from: string; to: string; count: number }>();
    
    // Scale based on simulation mode
    const useAggregated = this.config.shouldUseAggregatedSimulation();
    
    for (const [profession, count] of professionDistribution) {
      // How many attempt a career change
      const attemptingChange = Math.floor(count * yearlyRate);
      if (attemptingChange === 0) continue;

      // Find available paths
      const availablePaths = this.careerPaths.filter(p => p.fromProfession === profession);
      if (availablePaths.length === 0) continue;

      // Distribute attempts across paths
      for (const path of availablePaths) {
        const probability = this.calculateCareerChangeProbability(
          profession,
          path.toProfession,
          avgEducation,
          avgWealth,
          avgConnections,
          avgAge,
          socialStability
        );

        // Calculate successful transitions
        const successfulTransitions = Math.floor(
          (attemptingChange / availablePaths.length) * (probability / 100)
        );

        if (successfulTransitions > 0) {
          const key = `${profession}_to_${path.toProfession}`;
          changes.set(key, {
            from: profession,
            to: path.toProfession,
            count: successfulTransitions
          });

          // Record event (aggregated)
          if (!useAggregated || successfulTransitions > 100) {
            this.recordMobilityEvent({
              fromProfession: profession,
              toProfession: path.toProfession,
              fromClass: this.determineSocialClass(avgWealth, profession),
              toClass: this.determineSocialClass(avgWealth, path.toProfession),
              reason: this.determineTransitionReason(path, avgEducation, avgWealth),
              timestamp: Date.now(),
              success: true
            });
          }
        }
      }
    }

    return changes;
  }

  /**
   * Attempt individual career change (for important/player citizens)
   */
  public attemptCareerChange(
    citizenId: string,
    currentProfession: string,
    targetProfession: string,
    education: number,
    wealth: number,
    connections: number,
    age: number,
    socialStability: number
  ): { success: boolean; event: MobilityEvent } {
    const probability = this.calculateCareerChangeProbability(
      currentProfession,
      targetProfession,
      education,
      wealth,
      connections,
      age,
      socialStability
    );

    const success = Math.random() * 100 < probability;

    const event: MobilityEvent = {
      citizenId,
      fromProfession: currentProfession,
      toProfession: targetProfession,
      fromClass: this.determineSocialClass(wealth, currentProfession),
      toClass: this.determineSocialClass(wealth, targetProfession),
      reason: this.determineTransitionReason(
        this.careerPaths.find(p => p.fromProfession === currentProfession && p.toProfession === targetProfession)!,
        education,
        wealth
      ),
      timestamp: Date.now(),
      success
    };

    this.recordMobilityEvent(event);
    return { success, event };
  }

  /**
   * Determine reason for transition
   */
  private determineTransitionReason(
    path: CareerPath,
    education: number,
    wealth: number
  ): MobilityEvent['reason'] {
    if (path.difficulty === 0) return 'revolution'; // Downward mobility
    if (path.requirements.education && education >= path.requirements.education + 20) return 'education';
    if (path.requirements.wealth && wealth >= path.requirements.wealth * 2) return 'wealth';
    if (education >= 70) return 'merit';
    return 'opportunity';
  }

  /**
   * Record mobility event
   */
  private recordMobilityEvent(event: MobilityEvent): void {
    this.mobilityHistory.push(event);
    if (this.mobilityHistory.length > this.maxHistorySize) {
      this.mobilityHistory.shift();
    }
  }

  /**
   * Get mobility statistics
   */
  public getMobilityStats(): MobilityStats {
    const transitionsByClass = new Map<string, number>();
    const transitionsByProfession = new Map<string, number>();
    let upward = 0, downward = 0, lateral = 0, successful = 0;

    const classOrder: SocialClass['name'][] = ['lower', 'working', 'middle', 'upper_middle', 'upper', 'nobility'];

    for (const event of this.mobilityHistory) {
      if (!event.success) continue;

      successful++;

      const fromClassIndex = classOrder.indexOf(event.fromClass);
      const toClassIndex = classOrder.indexOf(event.toClass);

      if (toClassIndex > fromClassIndex) upward++;
      else if (toClassIndex < fromClassIndex) downward++;
      else lateral++;

      transitionsByClass.set(event.toClass, (transitionsByClass.get(event.toClass) || 0) + 1);
      transitionsByProfession.set(event.toProfession, (transitionsByProfession.get(event.toProfession) || 0) + 1);
    }

    return {
      totalTransitions: this.mobilityHistory.length,
      upwardMobility: upward,
      downwardMobility: downward,
      lateralMobility: lateral,
      transitionsByClass,
      transitionsByProfession,
      averageSuccessRate: this.mobilityHistory.length > 0 ? successful / this.mobilityHistory.length : 0
    };
  }

  /**
   * Get available career paths for a profession
   */
  public getAvailableCareerPaths(profession: string): CareerPath[] {
    return this.careerPaths.filter(p => p.fromProfession === profession);
  }

  /**
   * Add custom career path
   */
  public addCareerPath(path: CareerPath): void {
    this.careerPaths.push(path);
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      mobilityHistory: this.mobilityHistory.slice(-100),
      careerPaths: this.careerPaths
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.mobilityHistory) {
      this.mobilityHistory = data.mobilityHistory;
    }
    if (data.careerPaths) {
      this.careerPaths = data.careerPaths;
    }
  }
}
