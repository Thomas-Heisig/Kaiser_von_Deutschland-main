/**
 * Urban Districts System
 * 
 * Manages city districts (Stadtviertel) with different characteristics:
 * - Slums (Elendsviertel)
 * - Middle-class neighborhoods (Mittelklasseviertel)
 * - Noble districts (Nobelbezirke)
 * 
 * Features:
 * - Gentrification and displacement
 * - Crime hotspots with spatial partitioning
 * - District identities and rivalries
 * 
 * Scalability:
 * - Districts aggregate citizens, not individual tracking
 * - Crime calculated at district level
 * - Gentrification uses statistical models
 */

/**
 * District type classification
 */
export type DistrictType = 'slum' | 'working_class' | 'middle_class' | 'upper_class' | 'noble' | 'industrial' | 'commercial';

/**
 * Urban district representing a neighborhood
 */
export interface UrbanDistrict {
  /** Unique identifier */
  id: string;
  /** District name */
  name: string;
  /** Parent region ID */
  regionId: string;
  /** District type */
  type: DistrictType;
  /** Population in district */
  population: number;
  /** Wealth level (0-100) */
  wealthLevel: number;
  /** Crime rate (0-100) */
  crimeRate: number;
  /** Happiness level (0-100) */
  happiness: number;
  /** Infrastructure quality (0-100) */
  infrastructure: number;
  /** Cultural identity (0-100) */
  culturalIdentity: number;
  /** Gentrification pressure (0-100) */
  gentrificationPressure: number;
  /** Buildings in district */
  buildings: string[]; // Building IDs
  /** Rivalry with other districts */
  rivalDistricts: string[]; // District IDs
  /** Last update timestamp */
  lastUpdate: number;
}

/**
 * Crime hotspot data
 */
export interface CrimeHotspot {
  /** District ID */
  districtId: string;
  /** Crime type */
  crimeType: string;
  /** Severity (0-100) */
  severity: number;
  /** Frequency (crimes per day) */
  frequency: number;
  /** Contributing factors */
  factors: string[];
}

/**
 * Gentrification event
 */
export interface GentrificationEvent {
  /** District ID */
  districtId: string;
  /** Old type */
  oldType: DistrictType;
  /** New type */
  newType: DistrictType;
  /** Citizens displaced */
  displacedCitizens: number;
  /** Wealth increase */
  wealthIncrease: number;
  /** Date of gentrification */
  date: number;
}

/**
 * Urban Districts System
 */
export class UrbanDistrictsSystem {
  private districts: Map<string, UrbanDistrict> = new Map();
  private crimeHotspots: Map<string, CrimeHotspot[]> = new Map();
  private gentrificationEvents: GentrificationEvent[] = [];

  constructor() {
    // Initialize system
  }

  /**
   * Create a new district
   */
  public createDistrict(
    regionId: string,
    name: string,
    type: DistrictType,
    population: number
  ): UrbanDistrict {
    const id = `district_${regionId}_${Date.now()}_${Math.random()}`;

    const district: UrbanDistrict = {
      id,
      name,
      regionId,
      type,
      population,
      wealthLevel: this.getInitialWealthLevel(type),
      crimeRate: this.getInitialCrimeRate(type),
      happiness: this.getInitialHappiness(type),
      infrastructure: this.getInitialInfrastructure(type),
      culturalIdentity: Math.random() * 40 + 30, // 30-70
      gentrificationPressure: 0,
      buildings: [],
      rivalDistricts: [],
      lastUpdate: Date.now()
    };

    this.districts.set(id, district);
    return district;
  }

  /**
   * Update all districts
   */
  public updateDistricts(): void {
    const now = Date.now();

    for (const district of this.districts.values()) {
      // Update crime based on factors
      this.updateCrime(district);

      // Update gentrification pressure
      this.updateGentrification(district);

      // Update happiness based on conditions
      this.updateHappiness(district);

      district.lastUpdate = now;
    }

    // Process gentrification
    this.processGentrification();
  }

  /**
   * Update crime in a district
   */
  private updateCrime(district: UrbanDistrict): void {
    let crimeModifier = 0;

    // Wealth affects crime
    if (district.wealthLevel < 30) {
      crimeModifier += 20;
    } else if (district.wealthLevel > 70) {
      crimeModifier -= 10;
    }

    // Infrastructure affects crime
    if (district.infrastructure < 40) {
      crimeModifier += 15;
    }

    // Happiness affects crime
    if (district.happiness < 40) {
      crimeModifier += 10;
    }

    // Update crime rate with some randomness
    district.crimeRate = Math.max(0, Math.min(100,
      district.crimeRate + crimeModifier * 0.01 + (Math.random() - 0.5) * 5
    ));

    // Create/update crime hotspots
    if (district.crimeRate > 60) {
      this.createCrimeHotspot(district);
    }
  }

  /**
   * Create a crime hotspot
   */
  private createCrimeHotspot(district: UrbanDistrict): void {
    const crimeTypes = ['theft', 'assault', 'vandalism', 'drug_trade', 'organized_crime'];
    const crimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];

    const factors: string[] = [];
    if (district.wealthLevel < 30) factors.push('poverty');
    if (district.infrastructure < 40) factors.push('poor_infrastructure');
    if (district.happiness < 40) factors.push('low_happiness');
    if (district.type === 'slum') factors.push('overcrowding');

    const hotspot: CrimeHotspot = {
      districtId: district.id,
      crimeType,
      severity: district.crimeRate,
      frequency: district.crimeRate / 10, // crimes per day
      factors
    };

    if (!this.crimeHotspots.has(district.id)) {
      this.crimeHotspots.set(district.id, []);
    }

    // Add or update hotspot
    const hotspots = this.crimeHotspots.get(district.id)!;
    const existing = hotspots.findIndex(h => h.crimeType === crimeType);
    if (existing >= 0) {
      hotspots[existing] = hotspot;
    } else {
      hotspots.push(hotspot);
    }
  }

  /**
   * Update gentrification pressure
   */
  private updateGentrification(district: UrbanDistrict): void {
    let pressure = district.gentrificationPressure;

    // Factors that increase gentrification pressure
    if (district.type === 'slum' || district.type === 'working_class') {
      // Nearby wealthy districts increase pressure
      const nearbyDistricts = this.getNearbyDistricts(district);
      const wealthyNearby = nearbyDistricts.filter(d => 
        d.type === 'upper_class' || d.type === 'noble'
      ).length;

      pressure += wealthyNearby * 0.1;

      // Low infrastructure but good location
      if (district.infrastructure < 50) {
        pressure += 0.05;
      }

      // Cultural identity resistance
      if (district.culturalIdentity > 60) {
        pressure -= 0.03; // Strong identity resists gentrification
      }
    }

    district.gentrificationPressure = Math.max(0, Math.min(100, pressure));
  }

  /**
   * Process gentrification events
   */
  private processGentrification(): void {
    for (const district of this.districts.values()) {
      // Check if district should gentrify
      if (district.gentrificationPressure > 70) {
        const chance = (district.gentrificationPressure - 70) / 30; // 0-1
        if (Math.random() < chance * 0.01) { // Small chance per update
          this.gentrifyDistrict(district);
        }
      }
    }
  }

  /**
   * Gentrify a district
   */
  private gentrifyDistrict(district: UrbanDistrict): void {
    const oldType = district.type;
    let newType: DistrictType = oldType;

    // Upgrade district type
    switch (oldType) {
      case 'slum':
        newType = 'working_class';
        break;
      case 'working_class':
        newType = 'middle_class';
        break;
      case 'middle_class':
        newType = 'upper_class';
        break;
      default:
        return; // Can't gentrify further
    }

    // Calculate displacement
    const displacementRate = 0.3 + Math.random() * 0.3; // 30-60%
    const displaced = Math.floor(district.population * displacementRate);

    // Update district
    district.type = newType;
    district.population -= displaced;
    const wealthIncrease = 20 + Math.random() * 30; // 20-50 increase
    district.wealthLevel = Math.min(100, district.wealthLevel + wealthIncrease);
    district.infrastructure = Math.min(100, district.infrastructure + 20);
    district.gentrificationPressure = 0; // Reset pressure

    // Record event
    const event: GentrificationEvent = {
      districtId: district.id,
      oldType,
      newType,
      displacedCitizens: displaced,
      wealthIncrease,
      date: Date.now()
    };

    this.gentrificationEvents.push(event);

    // Create slums in other areas for displaced citizens (simplified)
    // In full implementation, would relocate citizens to other districts
  }

  /**
   * Update happiness in district
   */
  private updateHappiness(district: UrbanDistrict): void {
    let happiness = 50; // Base

    // Wealth affects happiness
    happiness += (district.wealthLevel - 50) * 0.3;

    // Infrastructure affects happiness
    happiness += (district.infrastructure - 50) * 0.2;

    // Crime affects happiness negatively
    happiness -= district.crimeRate * 0.3;

    // Cultural identity affects happiness
    happiness += (district.culturalIdentity - 50) * 0.1;

    district.happiness = Math.max(0, Math.min(100, happiness));
  }

  /**
   * Get nearby districts (simplified spatial relationship)
   */
  private getNearbyDistricts(district: UrbanDistrict): UrbanDistrict[] {
    // In full implementation, would use spatial partitioning
    // For now, just return other districts in same region
    return Array.from(this.districts.values())
      .filter(d => d.regionId === district.regionId && d.id !== district.id);
  }

  /**
   * Get initial wealth level based on district type
   */
  private getInitialWealthLevel(type: DistrictType): number {
    switch (type) {
      case 'slum': return 10 + Math.random() * 20;
      case 'working_class': return 30 + Math.random() * 20;
      case 'middle_class': return 50 + Math.random() * 20;
      case 'upper_class': return 70 + Math.random() * 20;
      case 'noble': return 85 + Math.random() * 15;
      case 'industrial': return 40 + Math.random() * 20;
      case 'commercial': return 60 + Math.random() * 20;
      default: return 50;
    }
  }

  /**
   * Get initial crime rate based on district type
   */
  private getInitialCrimeRate(type: DistrictType): number {
    switch (type) {
      case 'slum': return 60 + Math.random() * 30;
      case 'working_class': return 40 + Math.random() * 20;
      case 'middle_class': return 20 + Math.random() * 20;
      case 'upper_class': return 10 + Math.random() * 10;
      case 'noble': return 5 + Math.random() * 10;
      case 'industrial': return 50 + Math.random() * 20;
      case 'commercial': return 30 + Math.random() * 20;
      default: return 30;
    }
  }

  /**
   * Get initial happiness based on district type
   */
  private getInitialHappiness(type: DistrictType): number {
    switch (type) {
      case 'slum': return 20 + Math.random() * 20;
      case 'working_class': return 40 + Math.random() * 20;
      case 'middle_class': return 60 + Math.random() * 20;
      case 'upper_class': return 70 + Math.random() * 20;
      case 'noble': return 80 + Math.random() * 15;
      case 'industrial': return 35 + Math.random() * 20;
      case 'commercial': return 55 + Math.random() * 20;
      default: return 50;
    }
  }

  /**
   * Get initial infrastructure based on district type
   */
  private getInitialInfrastructure(type: DistrictType): number {
    switch (type) {
      case 'slum': return 10 + Math.random() * 20;
      case 'working_class': return 35 + Math.random() * 20;
      case 'middle_class': return 55 + Math.random() * 20;
      case 'upper_class': return 75 + Math.random() * 20;
      case 'noble': return 90 + Math.random() * 10;
      case 'industrial': return 45 + Math.random() * 20;
      case 'commercial': return 65 + Math.random() * 20;
      default: return 50;
    }
  }

  /**
   * Get all districts
   */
  public getDistricts(): Map<string, UrbanDistrict> {
    return this.districts;
  }

  /**
   * Get district by ID
   */
  public getDistrict(id: string): UrbanDistrict | undefined {
    return this.districts.get(id);
  }

  /**
   * Get districts in a region
   */
  public getRegionalDistricts(regionId: string): UrbanDistrict[] {
    return Array.from(this.districts.values())
      .filter(d => d.regionId === regionId);
  }

  /**
   * Get crime hotspots for a district
   */
  public getCrimeHotspots(districtId: string): CrimeHotspot[] {
    return this.crimeHotspots.get(districtId) || [];
  }

  /**
   * Get recent gentrification events
   */
  public getRecentGentrificationEvents(limit: number = 10): GentrificationEvent[] {
    return this.gentrificationEvents.slice(-limit);
  }

  /**
   * Serialize for save/load
   */
  public serialize(): any {
    return {
      districts: Array.from(this.districts.entries()),
      crimeHotspots: Array.from(this.crimeHotspots.entries()),
      gentrificationEvents: this.gentrificationEvents
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.districts) {
      this.districts = new Map(data.districts);
    }
    if (data.crimeHotspots) {
      this.crimeHotspots = new Map(data.crimeHotspots);
    }
    if (data.gentrificationEvents) {
      this.gentrificationEvents = data.gentrificationEvents;
    }
  }
}
