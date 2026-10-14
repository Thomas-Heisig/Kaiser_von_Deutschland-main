/**
 * Education Reforms System
 * 
 * Manages educational policy evolution and quality metrics:
 * - PISA studies and international comparisons (from 2000)
 * - Education reform mechanics
 * - Quality metrics and rankings
 * - School system evolution
 * 
 * Integrates with:
 * - RoadmapFeaturesManager for universities
 * - Technology system for educational innovations
 * - Policy system for education policy
 * 
 * Scalability:
 * - Education metrics aggregated at regional level
 * - Quality based on statistical sampling
 * - Reform effects propagate through cohorts
 */

/**
 * Education system type
 */
export interface EducationSystemType {
  /** System ID */
  id: string;
  /** System name */
  name: string;
  /** Introduction year */
  yearIntroduced: number;
  /** System type */
  type: 'monastery_schools' | 'latin_schools' | 'gymnasium' | 'comprehensive' | 'modern';
  /** Accessibility (% of population) */
  accessibility: number;
  /** Quality level (0-100) */
  qualityLevel: number;
  /** Focus areas */
  focusAreas: string[];
  /** Cost per student */
  costPerStudent: number;
  /** Social mobility impact */
  socialMobilityImpact: number;
}

/**
 * PISA study results (from 2000)
 */
export interface PISAResults {
  /** Study year */
  year: number;
  /** Reading score (0-600) */
  readingScore: number;
  /** Mathematics score (0-600) */
  mathematicsScore: number;
  /** Science score (0-600) */
  scienceScore: number;
  /** International ranking */
  ranking: number;
  /** Total participating countries */
  totalCountries: number;
  /** Equity index (0-100) */
  equityIndex: number;
}

/**
 * Education reform
 */
export interface EducationReform {
  /** Reform ID */
  id: string;
  /** Reform name */
  name: string;
  /** Implementation year */
  yearImplemented: number;
  /** Reform type */
  type: 'curriculum' | 'structure' | 'funding' | 'teacher_training' | 'digitalization' | 'inclusion';
  /** Description */
  description: string;
  /** Implementation cost */
  cost: number;
  /** Expected impact */
  expectedImpact: {
    quality: number;
    accessibility: number;
    equity: number;
    innovation: number;
  };
  /** Duration (years to full effect) */
  duration: number;
  /** Prerequisites */
  prerequisites: string[];
}

/**
 * Education quality metric
 */
export interface EducationQualityMetrics {
  /** Overall quality (0-100) */
  overallQuality: number;
  /** Literacy rate (%) */
  literacyRate: number;
  /** University enrollment rate (%) */
  universityEnrollmentRate: number;
  /** Teacher-student ratio */
  teacherStudentRatio: number;
  /** Education spending (% of GDP) */
  educationSpending: number;
  /** Digital infrastructure (0-100) */
  digitalInfrastructure: number;
  /** Innovation index (0-100) */
  innovationIndex: number;
  /** Equity index (0-100) */
  equityIndex: number;
}

/**
 * Education Reforms System class
 */
export class EducationReformsSystem {
  private educationSystems: Map<string, EducationSystemType> = new Map();
  private pisaResults: Map<number, PISAResults> = new Map();
  private reforms: Map<string, EducationReform> = new Map();
  private activeReforms: Map<string, EducationReform> = new Map();
  private qualityMetrics: EducationQualityMetrics = {
    overallQuality: 30,
    literacyRate: 20,
    universityEnrollmentRate: 1,
    teacherStudentRatio: 50,
    educationSpending: 2,
    digitalInfrastructure: 0,
    innovationIndex: 10,
    equityIndex: 30
  };

  /**
   * Initialize the education reforms system
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/education-reforms-system.json');
      const data = await response.json();

      // Load education systems
      data.educationSystems.forEach((system: EducationSystemType) => {
        this.educationSystems.set(system.id, system);
      });

      // Load PISA results
      if (data.pisaResults) {
        data.pisaResults.forEach((result: PISAResults) => {
          this.pisaResults.set(result.year, result);
        });
      }

      // Load reforms
      if (data.reforms) {
        data.reforms.forEach((reform: EducationReform) => {
          this.reforms.set(reform.id, reform);
        });
      }

      console.log(`Education Reforms System initialized: ${this.educationSystems.size} systems, ${this.reforms.size} reforms, ${this.pisaResults.size} PISA studies`);
    } catch (error) {
      console.error('Failed to load education reforms data:', error);
    }
  }

  /**
   * Update education system for current year
   */
  update(year: number, deltaTime: number): void {
    // Update current system
    this.updateCurrentSystem(year);

    // Update active reforms
    this.updateActiveReforms(year, deltaTime);

    // Update quality metrics
    this.updateQualityMetrics(year, deltaTime);

    // Record PISA results if applicable
    if (this.isPISAYear(year)) {
      this.recordPISAResults(year);
    }
  }

  /**
   * Get current education system
   */
  getCurrentSystem(year: number): EducationSystemType | null {
    let current: EducationSystemType | null = null;
    for (const system of this.educationSystems.values()) {
      if (system.yearIntroduced <= year) {
        if (!current || system.yearIntroduced > current.yearIntroduced) {
          current = system;
        }
      }
    }
    return current;
  }

  /**
   * Get PISA results for a specific year
   */
  getPISAResults(year: number): PISAResults | null {
    return this.pisaResults.get(year) || null;
  }

  /**
   * Get all historical PISA results
   */
  getAllPISAResults(): PISAResults[] {
    return Array.from(this.pisaResults.values()).sort((a, b) => a.year - b.year);
  }

  /**
   * Get available reforms
   */
  getAvailableReforms(_year: number): EducationReform[] {
    return Array.from(this.reforms.values()).filter(reform => {
      // Check if already implemented
      if (this.activeReforms.has(reform.id)) return false;

      // Check prerequisites
      for (const prereq of reform.prerequisites) {
        if (!this.activeReforms.has(prereq)) return false;
      }

      return true;
    });
  }

  /**
   * Get active reforms
   */
  getActiveReforms(): EducationReform[] {
    return Array.from(this.activeReforms.values());
  }

  /**
   * Get current quality metrics
   */
  getQualityMetrics(): EducationQualityMetrics {
    return { ...this.qualityMetrics };
  }

  /**
   * Implement an education reform
   */
  implementReform(reformId: string, year: number): boolean {
    const reform = this.reforms.get(reformId);
    if (!reform) return false;

    // Check prerequisites
    for (const prereq of reform.prerequisites) {
      if (!this.activeReforms.has(prereq)) {
        console.log(`Cannot implement reform ${reformId}: prerequisite ${prereq} not met`);
        return false;
      }
    }

    // Add to active reforms
    const activeReform = { ...reform, yearImplemented: year };
    this.activeReforms.set(reformId, activeReform);
    return true;
  }

  /**
   * Calculate overall education ranking
   */
  getEducationRanking(): number {
    // Simplified ranking based on quality metrics
    const score = (
      this.qualityMetrics.overallQuality * 0.3 +
      this.qualityMetrics.literacyRate * 0.2 +
      this.qualityMetrics.universityEnrollmentRate * 0.1 +
      this.qualityMetrics.innovationIndex * 0.2 +
      this.qualityMetrics.equityIndex * 0.2
    );

    // Convert to ranking (1-100, lower is better)
    return Math.max(1, Math.min(100, Math.round(100 - score)));
  }

  /**
   * Get summary for UI display
   */
  getSummary(year: number): {
    currentSystem: EducationSystemType | null;
    activeReforms: number;
    qualityMetrics: EducationQualityMetrics;
    latestPISA: PISAResults | null;
    ranking: number;
  } {
    // Get latest PISA results
    let latestPISA: PISAResults | null = null;
    if (year >= 2000) {
      const allResults = this.getAllPISAResults();
      latestPISA = allResults.length > 0 ? allResults[allResults.length - 1] : null;
    }

    return {
      currentSystem: this.getCurrentSystem(year),
      activeReforms: this.activeReforms.size,
      qualityMetrics: this.getQualityMetrics(),
      latestPISA,
      ranking: this.getEducationRanking()
    };
  }

  /**
   * Private: Update current system
   */
  private updateCurrentSystem(_year: number): void {
    const system = this.getCurrentSystem(_year);

    // Update base metrics from system
    if (system) {
      this.qualityMetrics.literacyRate = Math.max(
        this.qualityMetrics.literacyRate,
        system.accessibility
      );
    }
  }

  /**
   * Private: Update active reforms
   */
  private updateActiveReforms(_year: number, _deltaTime: number): void {
    for (const [id, reform] of this.activeReforms) {
      const yearsSinceImplementation = _year - reform.yearImplemented;

      // Check if reform is fully implemented
      if (yearsSinceImplementation >= reform.duration) {
        // Reform complete, remove from active
        this.activeReforms.delete(id);
        console.log(`Education reform completed: ${reform.name}`);
      }
    }
  }

  /**
   * Private: Update quality metrics
   */
  private updateQualityMetrics(year: number, deltaTime: number): void {
    // Base growth
    this.qualityMetrics.literacyRate = Math.min(100, this.qualityMetrics.literacyRate + deltaTime * 0.5);
    this.qualityMetrics.universityEnrollmentRate = Math.min(60, this.qualityMetrics.universityEnrollmentRate + deltaTime * 0.1);

    // System impact
    const system = this.getCurrentSystem(year);
    if (system) {
      this.qualityMetrics.overallQuality = Math.min(100, system.qualityLevel);
      this.qualityMetrics.equityIndex = Math.min(100, system.accessibility * 0.8);
    }

    // Reform impacts
    for (const reform of this.activeReforms.values()) {
      const progress = Math.min(1, (year - reform.yearImplemented) / reform.duration);
      this.qualityMetrics.overallQuality += reform.expectedImpact.quality * progress * deltaTime * 0.1;
      this.qualityMetrics.equityIndex += reform.expectedImpact.equity * progress * deltaTime * 0.1;
      this.qualityMetrics.innovationIndex += reform.expectedImpact.innovation * progress * deltaTime * 0.1;
    }

    // Digital infrastructure (from 1990)
    if (year >= 1990) {
      this.qualityMetrics.digitalInfrastructure = Math.min(100, this.qualityMetrics.digitalInfrastructure + deltaTime * 2);
    }

    // Cap all metrics at 100
    this.qualityMetrics.overallQuality = Math.min(100, this.qualityMetrics.overallQuality);
    this.qualityMetrics.equityIndex = Math.min(100, this.qualityMetrics.equityIndex);
    this.qualityMetrics.innovationIndex = Math.min(100, this.qualityMetrics.innovationIndex);
  }

  /**
   * Private: Check if this is a PISA year
   */
  private isPISAYear(year: number): boolean {
    // PISA studies every 3 years from 2000
    if (year < 2000) return false;
    return (year - 2000) % 3 === 0;
  }

  /**
   * Private: Record PISA results for a year
   */
  private recordPISAResults(year: number): void {
    // Only if we don't have results for this year yet
    if (this.pisaResults.has(year)) return;

    // Generate results based on quality metrics
    const results: PISAResults = {
      year,
      readingScore: Math.round(400 + this.qualityMetrics.overallQuality * 1.5),
      mathematicsScore: Math.round(400 + this.qualityMetrics.overallQuality * 1.5 + this.qualityMetrics.innovationIndex * 0.5),
      scienceScore: Math.round(400 + this.qualityMetrics.overallQuality * 1.5 + this.qualityMetrics.innovationIndex * 0.3),
      ranking: this.getEducationRanking(),
      totalCountries: Math.min(80, 30 + (year - 2000)),
      equityIndex: Math.round(this.qualityMetrics.equityIndex)
    };

    this.pisaResults.set(year, results);
    console.log(`PISA ${year} results recorded: Reading ${results.readingScore}, Math ${results.mathematicsScore}, Science ${results.scienceScore}`);
  }
}
