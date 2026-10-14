/**
 * Migration System
 * 
 * Manages population movement between regions with scalability support.
 * Uses aggregated flows for large populations instead of tracking individual migrants.
 */

import { ScalabilityConfig } from './ScalabilityConfig';

export interface MigrationReason {
  type: 'economic' | 'war' | 'famine' | 'disease' | 'opportunity' | 'persecution' | 'family';
  strength: number; // 0-100
}

export interface MigrationFlow {
  fromRegion: string;
  toRegion: string;
  count: number;
  reason: MigrationReason;
  timestamp: number;
}

export interface RegionAttractiveness {
  regionId: string;
  economicScore: number; // 0-100
  safetyScore: number; // 0-100
  opportunityScore: number; // 0-100
  qualityOfLifeScore: number; // 0-100
  totalScore: number;
}

export interface MigrationStats {
  totalMigrations: number;
  regionInflows: Map<string, number>;
  regionOutflows: Map<string, number>;
  topDestinations: Array<{ regionId: string; count: number }>;
  topOrigins: Array<{ regionId: string; count: number }>;
}

export class MigrationSystem {
  private activeMigrations: MigrationFlow[] = [];
  private migrationHistory: MigrationFlow[] = [];
  private maxHistorySize = 1000;
  
  private config: ScalabilityConfig;
  
  constructor() {
    this.config = ScalabilityConfig.getInstance();
  }

  /**
   * Calculate region attractiveness based on various factors
   */
  public calculateRegionAttractiveness(
    regionId: string,
    employment: number,
    wages: number,
    safety: number,
    infrastructure: number,
    food: number,
    disease: number
  ): RegionAttractiveness {
    const economicScore = Math.min(100, (employment * 0.6 + wages * 0.4));
    const safetyScore = Math.min(100, safety * (1 - disease / 100));
    const opportunityScore = Math.min(100, infrastructure * 0.7 + employment * 0.3);
    const qualityOfLifeScore = Math.min(100, (food * 0.4 + infrastructure * 0.3 + safety * 0.3));
    
    const totalScore = (
      economicScore * 0.35 +
      safetyScore * 0.25 +
      opportunityScore * 0.25 +
      qualityOfLifeScore * 0.15
    );

    return {
      regionId,
      economicScore,
      safetyScore,
      opportunityScore,
      qualityOfLifeScore,
      totalScore
    };
  }

  /**
   * Calculate migration pressure between two regions
   */
  public calculateMigrationPressure(
    fromAttractiveness: RegionAttractiveness,
    toAttractiveness: RegionAttractiveness,
    distance: number,
    culturalSimilarity: number = 0.5
  ): number {
    // Score difference drives migration
    const scoreDiff = toAttractiveness.totalScore - fromAttractiveness.totalScore;
    if (scoreDiff <= 0) return 0; // No migration if destination is worse

    // Distance dampens migration (max 1000km reference)
    const distanceFactor = 1 / (1 + distance / 500);
    
    // Cultural similarity encourages migration
    const culturalFactor = 0.5 + (culturalSimilarity * 0.5);
    
    // Calculate base pressure (0-100)
    const pressure = scoreDiff * distanceFactor * culturalFactor;
    
    return Math.max(0, Math.min(100, pressure));
  }

  /**
   * Process migrations for a region
   * Scalable: Uses aggregated flows instead of individual citizen tracking
   */
  public processMigrations(
    fromRegion: string,
    population: number,
    attractiveness: RegionAttractiveness,
    neighborRegions: Map<string, RegionAttractiveness>,
    distances: Map<string, number>,
    culturalSimilarities: Map<string, number>
  ): MigrationFlow[] {
    const flows: MigrationFlow[] = [];
    const scalabilityThresholds = this.config.getThresholds();
    
    // Base migration rate: 0-5% of population per year
    const baseMigrationRate = 0.05;
    
    // Calculate migration pressure to each neighbor
    const migrations: Array<{ region: string; pressure: number; attractiveness: RegionAttractiveness }> = [];
    
    for (const [neighborId, neighborAttractiveness] of neighborRegions) {
      const distance = distances.get(neighborId) || 500;
      const culturalSimilarity = culturalSimilarities.get(neighborId) || 0.5;
      
      const pressure = this.calculateMigrationPressure(
        attractiveness,
        neighborAttractiveness,
        distance,
        culturalSimilarity
      );
      
      if (pressure > 10) { // Only migrate if pressure is significant
        migrations.push({ region: neighborId, pressure, attractiveness: neighborAttractiveness });
      }
    }

    // Sort by pressure
    migrations.sort((a, b) => b.pressure - a.pressure);

    // Calculate total migration count (scalable based on pressure)
    const totalPressure = migrations.reduce((sum, m) => sum + m.pressure, 0);
    if (totalPressure === 0) return flows;

    // Maximum migrations per tick based on scalability config
    const maxMigrants = Math.min(
      population * baseMigrationRate,
      scalabilityThresholds.maxMigrationsPerTick
    );

    // Distribute migrants proportionally to pressure
    for (const migration of migrations) {
      const proportion = migration.pressure / totalPressure;
      const migrantCount = Math.floor(maxMigrants * proportion);
      
      if (migrantCount > 0) {
        const flow: MigrationFlow = {
          fromRegion,
          toRegion: migration.region,
          count: migrantCount,
          reason: this.determinePrimaryReason(attractiveness, migration.attractiveness),
          timestamp: Date.now()
        };
        
        flows.push(flow);
        this.activeMigrations.push(flow);
      }
    }

    return flows;
  }

  /**
   * Determine the primary reason for migration
   */
  private determinePrimaryReason(
    from: RegionAttractiveness,
    to: RegionAttractiveness
  ): MigrationReason {
    const economicDiff = to.economicScore - from.economicScore;
    const safetyDiff = to.safetyScore - from.safetyScore;
    const opportunityDiff = to.opportunityScore - from.opportunityScore;
    const qolDiff = to.qualityOfLifeScore - from.qualityOfLifeScore;

    const maxDiff = Math.max(economicDiff, safetyDiff, opportunityDiff, qolDiff);

    let type: MigrationReason['type'] = 'opportunity';
    let strength = 50;

    if (maxDiff === safetyDiff && safetyDiff > 20) {
      type = from.safetyScore < 30 ? 'war' : 'opportunity';
      strength = Math.min(100, safetyDiff * 1.5);
    } else if (maxDiff === economicDiff && economicDiff > 20) {
      type = from.economicScore < 20 ? 'famine' : 'economic';
      strength = Math.min(100, economicDiff * 1.5);
    } else if (maxDiff === opportunityDiff) {
      type = 'opportunity';
      strength = Math.min(100, opportunityDiff * 1.2);
    }

    return { type, strength };
  }

  /**
   * Apply migration flow (update population counts)
   */
  public applyMigrationFlow(flow: MigrationFlow): {
    fromPopulationChange: number;
    toPopulationChange: number;
  } {
    // Record in history
    this.migrationHistory.push(flow);
    if (this.migrationHistory.length > this.maxHistorySize) {
      this.migrationHistory.shift();
    }

    return {
      fromPopulationChange: -flow.count,
      toPopulationChange: flow.count
    };
  }

  /**
   * Get migration statistics
   */
  public getMigrationStats(): MigrationStats {
    const inflows = new Map<string, number>();
    const outflows = new Map<string, number>();
    
    for (const flow of this.migrationHistory) {
      outflows.set(flow.fromRegion, (outflows.get(flow.fromRegion) || 0) + flow.count);
      inflows.set(flow.toRegion, (inflows.get(flow.toRegion) || 0) + flow.count);
    }

    const topDestinations = Array.from(inflows.entries())
      .map(([regionId, count]) => ({ regionId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topOrigins = Array.from(outflows.entries())
      .map(([regionId, count]) => ({ regionId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMigrations: this.migrationHistory.reduce((sum, f) => sum + f.count, 0),
      regionInflows: inflows,
      regionOutflows: outflows,
      topDestinations,
      topOrigins
    };
  }

  /**
   * Get active migrations for a region
   */
  public getActiveMigrationsForRegion(regionId: string): MigrationFlow[] {
    return this.activeMigrations.filter(
      m => m.fromRegion === regionId || m.toRegion === regionId
    );
  }

  /**
   * Clear old migrations (cleanup)
   */
  public cleanupOldMigrations(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    this.activeMigrations = this.activeMigrations.filter(
      m => now - m.timestamp < maxAgeMs
    );
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      activeMigrations: this.activeMigrations,
      migrationHistory: this.migrationHistory.slice(-100) // Keep last 100
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.activeMigrations) {
      this.activeMigrations = data.activeMigrations;
    }
    if (data.migrationHistory) {
      this.migrationHistory = data.migrationHistory;
    }
  }
}
