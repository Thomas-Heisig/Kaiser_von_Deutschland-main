/**
 * Scalability Configuration System
 * 
 * Manages performance and scalability settings for the game.
 * Automatically adjusts simulation detail based on population size
 * and system performance.
 */

export interface ScalabilityThresholds {
  /** Population threshold for full individual simulation */
  fullSimulationThreshold: number;
  /** Population threshold for hybrid simulation */
  hybridSimulationThreshold: number;
  /** Maximum number of individual citizens to track in detail */
  maxDetailedCitizens: number;
  /** Maximum number of social relationships to track per citizen */
  maxRelationshipsPerCitizen: number;
  /** Sample size for social interaction calculations (percentage) */
  socialInteractionSampleRate: number;
  /** Maximum events to process per game tick */
  maxEventsPerTick: number;
  /** Maximum battles to simulate simultaneously */
  maxConcurrentBattles: number;
  /** Maximum units per battle before aggregation */
  maxUnitsPerBattleDetail: number;
  /** Grid size for spatial partitioning */
  spatialGridSize: number;
  /** Maximum migration calculations per tick */
  maxMigrationsPerTick: number;
  /** Cache timeout for expensive calculations (ms) */
  cacheTimeout: number;
}

export interface PerformanceMetrics {
  /** Current population size */
  currentPopulation: number;
  /** Average tick time (ms) */
  averageTickTime: number;
  /** Peak memory usage (MB) */
  peakMemoryUsage: number;
  /** Number of active events */
  activeEvents: number;
  /** Current simulation mode */
  simulationMode: 'full' | 'hybrid' | 'aggregated';
  /** Performance warning level */
  warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export class ScalabilityConfig {
  private static instance: ScalabilityConfig;
  
  /** Default thresholds optimized for modern browsers - supports up to 100M citizens */
  private thresholds: ScalabilityThresholds = {
    fullSimulationThreshold: 10000, // Below this: full individual simulation
    hybridSimulationThreshold: 100000, // Above this: statistical aggregation
    maxDetailedCitizens: 50000, // Max citizens to track individually in hybrid mode
    maxRelationshipsPerCitizen: 20, // Reduced to 5 for populations >10M
    socialInteractionSampleRate: 0.1, // 10% sampling, reduced to 0.01% for >10M
    maxEventsPerTick: 100, // Batch processing for efficiency
    maxConcurrentBattles: 5,
    maxUnitsPerBattleDetail: 10000, // Aggregate battles above this
    spatialGridSize: 100, // Grid cells for spatial partitioning
    maxMigrationsPerTick: 1000, // Process migrations in batches
    cacheTimeout: 5000 // 5 seconds cache for calculations
  };

  /** Current performance metrics */
  private metrics: PerformanceMetrics = {
    currentPopulation: 0,
    averageTickTime: 0,
    peakMemoryUsage: 0,
    activeEvents: 0,
    simulationMode: 'full',
    warningLevel: 'none'
  };

  /** Tick times for averaging */
  private tickTimes: number[] = [];
  private maxTickSamples = 100;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ScalabilityConfig {
    if (!ScalabilityConfig.instance) {
      ScalabilityConfig.instance = new ScalabilityConfig();
    }
    return ScalabilityConfig.instance;
  }

  /**
   * Get current thresholds
   */
  public getThresholds(): ScalabilityThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds
   */
  public setThresholds(thresholds: Partial<ScalabilityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.updateSimulationMode();
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Update population count
   */
  public updatePopulation(population: number): void {
    this.metrics.currentPopulation = population;
    this.updateSimulationMode();
  }

  /**
   * Record tick time for performance monitoring
   */
  public recordTickTime(timeMs: number): void {
    this.tickTimes.push(timeMs);
    if (this.tickTimes.length > this.maxTickSamples) {
      this.tickTimes.shift();
    }
    
    this.metrics.averageTickTime = 
      this.tickTimes.reduce((a, b) => a + b, 0) / this.tickTimes.length;
    
    this.updateWarningLevel();
  }

  /**
   * Update active events count
   */
  public updateActiveEvents(count: number): void {
    this.metrics.activeEvents = count;
  }

  /**
   * Get recommended simulation mode based on population
   */
  public getSimulationMode(): 'full' | 'hybrid' | 'aggregated' {
    return this.metrics.simulationMode;
  }

  /**
   * Check if population should use full simulation
   */
  public shouldUseFullSimulation(): boolean {
    return this.metrics.currentPopulation < this.thresholds.fullSimulationThreshold;
  }

  /**
   * Check if population should use hybrid simulation
   */
  public shouldUseHybridSimulation(): boolean {
    return this.metrics.currentPopulation >= this.thresholds.fullSimulationThreshold &&
           this.metrics.currentPopulation < this.thresholds.hybridSimulationThreshold;
  }

  /**
   * Check if population should use aggregated simulation
   */
  public shouldUseAggregatedSimulation(): boolean {
    return this.metrics.currentPopulation >= this.thresholds.hybridSimulationThreshold;
  }

  /**
   * Get sample size for social interactions
   */
  public getSocialInteractionSampleSize(totalPopulation: number): number {
    if (this.shouldUseFullSimulation()) {
      return totalPopulation; // Process all
    }
    return Math.max(
      1000, // Minimum sample
      Math.floor(totalPopulation * this.thresholds.socialInteractionSampleRate)
    );
  }

  /**
   * Get maximum relationships to track for a citizen
   */
  public getMaxRelationships(): number {
    const pop = this.metrics.currentPopulation;
    
    // Scale down relationships for larger populations
    if (pop > 10000000) { // 10M+
      return 5; // Dunbar's inner circle only
    } else if (pop > 1000000) { // 1M+
      return 10;
    } else if (this.shouldUseAggregatedSimulation()) {
      return Math.floor(this.thresholds.maxRelationshipsPerCitizen * 0.5);
    }
    return this.thresholds.maxRelationshipsPerCitizen;
  }

  /**
   * Check if population requires extreme scaling (80M+)
   */
  public isExtremeScale(): boolean {
    return this.metrics.currentPopulation > 50000000; // 50M threshold
  }

  /**
   * Get economic cohort size for aggregation
   * Returns number of citizens to group together for economic calculations
   */
  public getEconomicCohortSize(): number {
    const pop = this.metrics.currentPopulation;
    
    if (pop < 10000) {
      return 1; // Individual tracking
    } else if (pop < 100000) {
      return 100; // Small groups
    } else if (pop < 1000000) {
      return 1000; // Medium groups
    } else if (pop < 10000000) {
      return 10000; // Large groups
    } else {
      return 100000; // Massive cohorts for 10M+ populations
    }
  }

  /**
   * Get adjusted sample rate for social interactions
   * Scales down dramatically for massive populations
   */
  public getAdjustedSocialSampleRate(): number {
    const pop = this.metrics.currentPopulation;
    
    if (pop < 10000) {
      return 1.0; // 100% - simulate all
    } else if (pop < 100000) {
      return 0.1; // 10%
    } else if (pop < 1000000) {
      return 0.01; // 1%
    } else if (pop < 10000000) {
      return 0.001; // 0.1%
    } else {
      return 0.0001; // 0.01% for 10M+ (e.g., 8000 out of 80M)
    }
  }

  /**
   * Get event processing batch size
   */
  public getEventBatchSize(): number {
    const pop = this.metrics.currentPopulation;
    
    if (pop < 100000) {
      return 100;
    } else if (pop < 1000000) {
      return 1000;
    } else if (pop < 10000000) {
      return 10000;
    } else {
      return 100000; // Process 100K events at a time for 10M+
    }
  }

  /**
   * Should use probability-based events instead of individual rolls
   */
  public shouldUseProbabilityEvents(): boolean {
    return this.metrics.currentPopulation > 100000;
  }

  /**
   * Get cache duration for economic calculations (ms)
   * Larger populations = longer cache times
   */
  public getEconomicCacheTimeout(): number {
    const pop = this.metrics.currentPopulation;
    
    if (pop < 10000) {
      return 1000; // 1 second
    } else if (pop < 100000) {
      return 5000; // 5 seconds
    } else if (pop < 1000000) {
      return 15000; // 15 seconds
    } else {
      return 30000; // 30 seconds for 1M+
    }
  }

  /**
   * Check if should batch events
   */
  public shouldBatchEvents(eventCount: number): boolean {
    return eventCount > this.thresholds.maxEventsPerTick;
  }

  /**
   * Get spatial grid size for partitioning
   */
  public getSpatialGridSize(): number {
    return this.thresholds.spatialGridSize;
  }

  /**
   * Check if performance is acceptable
   */
  public isPerformanceAcceptable(): boolean {
    return this.metrics.warningLevel === 'none' || 
           this.metrics.warningLevel === 'low';
  }

  /**
   * Get performance warning message
   */
  public getPerformanceWarning(): string | null {
    switch (this.metrics.warningLevel) {
      case 'none':
      case 'low':
        return null;
      case 'medium':
        return 'Performance degradation detected. Consider reducing population or detail level.';
      case 'high':
        return 'Significant performance issues. Simulation detail automatically reduced.';
      case 'critical':
        return 'Critical performance issues! Game may become unplayable. Reduce population immediately.';
      default:
        return null;
    }
  }

  /**
   * Update simulation mode based on population
   */
  private updateSimulationMode(): void {
    if (this.shouldUseAggregatedSimulation()) {
      this.metrics.simulationMode = 'aggregated';
    } else if (this.shouldUseHybridSimulation()) {
      this.metrics.simulationMode = 'hybrid';
    } else {
      this.metrics.simulationMode = 'full';
    }
  }

  /**
   * Update warning level based on performance
   */
  private updateWarningLevel(): void {
    const tickTime = this.metrics.averageTickTime;
    
    if (tickTime < 16) { // 60 FPS
      this.metrics.warningLevel = 'none';
    } else if (tickTime < 33) { // 30 FPS
      this.metrics.warningLevel = 'low';
    } else if (tickTime < 50) { // 20 FPS
      this.metrics.warningLevel = 'medium';
    } else if (tickTime < 100) { // 10 FPS
      this.metrics.warningLevel = 'high';
    } else {
      this.metrics.warningLevel = 'critical';
    }
  }

  /**
   * Export configuration for saving
   */
  public serialize(): any {
    return {
      thresholds: this.thresholds,
      metrics: this.metrics
    };
  }

  /**
   * Import configuration from save
   */
  public deserialize(data: any): void {
    if (data.thresholds) {
      this.thresholds = { ...this.thresholds, ...data.thresholds };
    }
    if (data.metrics) {
      this.metrics = { ...this.metrics, ...data.metrics };
    }
  }
}
