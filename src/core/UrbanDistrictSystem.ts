/**
 * Urban District System
 * 
 * Manages city districts with dynamic populations, crime, and gentrification.
 * Scalable for cities from 1,000 to 10,000,000+ inhabitants.
 */

export interface DistrictType {
  id: string;
  name: string;
  category: 'slum' | 'working_class' | 'middle_class' | 'upper_middle' | 'noble' | 'commercial' | 'industrial';
  
  /** Characteristics */
  averageIncome: number; // 0-10000 gold per capita
  propertyValue: number; // 0-100000 gold average
  populationDensity: number; // people per sq km
  
  /** Quality indices */
  infrastructure: number; // 0-100
  safety: number; // 0-100
  cleanliness: number; // 0-100
  culture: number; // 0-100
  
  /** Typical buildings */
  typicalBuildings: string[];
}

export interface CityDistrict {
  id: string;
  cityId: string;
  name: string;
  districtType: DistrictType['category'];
  
  /** Population */
  population: number;
  area: number; // sq km
  
  /** Economic */
  averageIncome: number;
  propertyValue: number;
  employment: number; // 0-100%
  
  /** Social */
  crimeRate: number; // 0-100
  stability: number; // 0-100
  happiness: number; // 0-100
  
  /** Infrastructure */
  infrastructure: number; // 0-100
  housing: number; // 0-100, availability
  
  /** Dynamics */
  gentrificationPressure: number; // 0-100
  displacementRisk: number; // 0-100
  
  /** District Identity */
  identity: string; // Cultural identity
  rivalDistricts: string[]; // District IDs
}

export interface GentrificationEvent {
  districtId: string;
  startYear: number;
  stage: 'early' | 'accelerating' | 'peak' | 'stabilizing';
  displacedPopulation: number;
  propertyValueIncrease: number; // percentage
  crimeReduction: number; // percentage
  cultureLoss: number; // 0-100, loss of original identity
}

export interface CrimeHotspot {
  districtId: string;
  type: 'theft' | 'violence' | 'organized' | 'corruption' | 'gang';
  severity: number; // 0-100
  trend: 'increasing' | 'stable' | 'decreasing';
  policePresence: number; // 0-100
}

export interface DistrictEvent {
  type: 'festival' | 'riot' | 'fire' | 'renovation' | 'demolition' | 'new_development';
  districtId: string;
  timestamp: number;
  impact: {
    population?: number;
    happiness?: number;
    crime?: number;
    propertyValue?: number;
    stability?: number;
  };
  description: string;
}

export class UrbanDistrictSystem {
  private districtTypes: Map<string, DistrictType> = new Map();
  private cityDistricts: Map<string, CityDistrict> = new Map();
  private gentrificationEvents: Map<string, GentrificationEvent> = new Map();
  private crimeHotspots: Map<string, CrimeHotspot> = new Map();
  private districtEvents: DistrictEvent[] = [];
  private maxEventHistory = 500;

  constructor() {
    // ScalabilityConfig available if needed for future enhancements
    this.initializeDistrictTypes();
  }

  /**
   * Initialize district types
   */
  private initializeDistrictTypes(): void {
    this.districtTypes.set('slum', {
      id: 'slum',
      name: 'Slum',
      category: 'slum',
      averageIncome: 50,
      propertyValue: 100,
      populationDensity: 15000,
      infrastructure: 20,
      safety: 30,
      cleanliness: 25,
      culture: 40,
      typicalBuildings: ['Hütte', 'Baracke', 'Armenviertel']
    });

    this.districtTypes.set('working_class', {
      id: 'working_class',
      name: 'Arbeiterviertel',
      category: 'working_class',
      averageIncome: 200,
      propertyValue: 500,
      populationDensity: 10000,
      infrastructure: 40,
      safety: 50,
      cleanliness: 45,
      culture: 50,
      typicalBuildings: ['Mietshaus', 'Fabrik', 'Kneipe']
    });

    this.districtTypes.set('middle_class', {
      id: 'middle_class',
      name: 'Mittelstandsviertel',
      category: 'middle_class',
      averageIncome: 800,
      propertyValue: 3000,
      populationDensity: 6000,
      infrastructure: 70,
      safety: 70,
      cleanliness: 70,
      culture: 65,
      typicalBuildings: ['Wohnhaus', 'Geschäft', 'Schule']
    });

    this.districtTypes.set('upper_middle', {
      id: 'upper_middle',
      name: 'Gehobenes Viertel',
      category: 'upper_middle',
      averageIncome: 2000,
      propertyValue: 10000,
      populationDensity: 4000,
      infrastructure: 85,
      safety: 85,
      cleanliness: 85,
      culture: 80,
      typicalBuildings: ['Villa', 'Park', 'Museum']
    });

    this.districtTypes.set('noble', {
      id: 'noble',
      name: 'Nobelviertel',
      category: 'noble',
      averageIncome: 5000,
      propertyValue: 50000,
      populationDensity: 2000,
      infrastructure: 95,
      safety: 95,
      cleanliness: 95,
      culture: 90,
      typicalBuildings: ['Palast', 'Herrschaftshaus', 'Privatpark']
    });

    this.districtTypes.set('commercial', {
      id: 'commercial',
      name: 'Geschäftsviertel',
      category: 'commercial',
      averageIncome: 1500,
      propertyValue: 8000,
      populationDensity: 3000,
      infrastructure: 80,
      safety: 75,
      cleanliness: 75,
      culture: 60,
      typicalBuildings: ['Büro', 'Kaufhaus', 'Bank']
    });

    this.districtTypes.set('industrial', {
      id: 'industrial',
      name: 'Industrieviertel',
      category: 'industrial',
      averageIncome: 300,
      propertyValue: 1000,
      populationDensity: 5000,
      infrastructure: 50,
      safety: 40,
      cleanliness: 30,
      culture: 35,
      typicalBuildings: ['Fabrik', 'Lager', 'Hafen']
    });
  }

  /**
   * Create a new district
   */
  public createDistrict(
    id: string,
    cityId: string,
    name: string,
    districtType: DistrictType['category'],
    population: number,
    area: number
  ): CityDistrict {
    const type = this.districtTypes.get(districtType);
    if (!type) throw new Error(`Unknown district type: ${districtType}`);

    const district: CityDistrict = {
      id,
      cityId,
      name,
      districtType,
      population,
      area,
      averageIncome: type.averageIncome,
      propertyValue: type.propertyValue,
      employment: 60 + Math.random() * 30,
      crimeRate: 100 - type.safety,
      stability: type.infrastructure * 0.8,
      happiness: (type.infrastructure + type.safety + type.culture) / 3,
      infrastructure: type.infrastructure,
      housing: 70 + Math.random() * 20,
      gentrificationPressure: 0,
      displacementRisk: 0,
      identity: name,
      rivalDistricts: []
    };

    this.cityDistricts.set(id, district);
    return district;
  }

  /**
   * Process gentrification dynamics
   */
  public processGentrification(
    districtId: string,
    neighboringDistricts: string[],
    cityWealthGrowth: number // 0-100
  ): GentrificationEvent | null {
    const district = this.cityDistricts.get(districtId);
    if (!district) return null;

    // Only certain districts gentrify
    if (district.districtType !== 'slum' && 
        district.districtType !== 'working_class' && 
        district.districtType !== 'industrial') {
      return null;
    }

    // Calculate gentrification pressure
    let pressure = 0;

    // Neighboring wealthy districts increase pressure
    for (const neighborId of neighboringDistricts) {
      const neighbor = this.cityDistricts.get(neighborId);
      if (!neighbor) continue;

      if (neighbor.districtType === 'upper_middle' || neighbor.districtType === 'noble') {
        pressure += 20;
      } else if (neighbor.districtType === 'middle_class') {
        pressure += 10;
      }
    }

    // City wealth growth drives gentrification
    pressure += cityWealthGrowth * 0.5;

    // Low property values attract investment
    if (district.propertyValue < 2000) {
      pressure += 15;
    }

    // Good infrastructure but low property value = prime for gentrification
    if (district.infrastructure > 50 && district.propertyValue < 3000) {
      pressure += 20;
    }

    district.gentrificationPressure = Math.min(100, pressure);

    // Trigger gentrification if pressure is high
    if (district.gentrificationPressure > 60 && !this.gentrificationEvents.has(districtId)) {
      const event: GentrificationEvent = {
        districtId,
        startYear: new Date().getFullYear(),
        stage: 'early',
        displacedPopulation: 0,
        propertyValueIncrease: 0,
        crimeReduction: 0,
        cultureLoss: 0
      };

      this.gentrificationEvents.set(districtId, event);
      
      this.logEvent({
        type: 'renovation',
        districtId,
        timestamp: Date.now(),
        impact: { propertyValue: 10 },
        description: `Gentrification begins in ${district.name}`
      });

      return event;
    }

    // Update existing gentrification
    const existing = this.gentrificationEvents.get(districtId);
    if (existing) {
      this.updateGentrificationStage(existing, district);
      return existing;
    }

    return null;
  }

  /**
   * Update gentrification stage
   */
  private updateGentrificationStage(event: GentrificationEvent, district: CityDistrict): void {
    const yearsSince = new Date().getFullYear() - event.startYear;

    // Progress through stages
    if (yearsSince < 2) {
      event.stage = 'early';
      event.propertyValueIncrease += 5;
      event.crimeReduction += 2;
    } else if (yearsSince < 5) {
      event.stage = 'accelerating';
      event.propertyValueIncrease += 15;
      event.crimeReduction += 5;
      event.displacedPopulation += Math.floor(district.population * 0.02); // 2% per year
      event.cultureLoss += 10;
    } else if (yearsSince < 10) {
      event.stage = 'peak';
      event.propertyValueIncrease += 25;
      event.crimeReduction += 8;
      event.displacedPopulation += Math.floor(district.population * 0.05); // 5% per year
      event.cultureLoss += 15;
    } else {
      event.stage = 'stabilizing';
      event.propertyValueIncrease += 5;
      event.crimeReduction += 2;
    }

    // Apply to district
    district.propertyValue = Math.floor(district.propertyValue * (1 + event.propertyValueIncrease / 100));
    district.crimeRate = Math.max(10, district.crimeRate - event.crimeReduction);
    district.population = Math.max(0, district.population - event.displacedPopulation);
    district.displacementRisk = event.stage === 'accelerating' || event.stage === 'peak' ? 80 : 20;

    // Eventually transform district type
    if (yearsSince > 15 && district.propertyValue > 5000) {
      if (district.districtType === 'slum') {
        district.districtType = 'working_class';
      } else if (district.districtType === 'working_class') {
        district.districtType = 'middle_class';
      }
    }
  }

  /**
   * Update crime dynamics
   */
  public updateCrimeHotspots(districtId: string): CrimeHotspot | null {
    const district = this.cityDistricts.get(districtId);
    if (!district) return null;

    // High crime triggers hotspot tracking
    if (district.crimeRate > 60) {
      const hotspot: CrimeHotspot = {
        districtId,
        type: this.determineCrimeType(district),
        severity: district.crimeRate,
        trend: district.crimeRate > 70 ? 'increasing' : 'stable',
        policePresence: 100 - district.crimeRate
      };

      this.crimeHotspots.set(districtId, hotspot);
      return hotspot;
    }

    return null;
  }

  /**
   * Determine predominant crime type
   */
  private determineCrimeType(district: CityDistrict): CrimeHotspot['type'] {
    if (district.districtType === 'slum' || district.districtType === 'working_class') {
      return Math.random() < 0.5 ? 'theft' : 'gang';
    } else if (district.districtType === 'commercial') {
      return Math.random() < 0.5 ? 'theft' : 'organized';
    } else if (district.districtType === 'noble' || district.districtType === 'upper_middle') {
      return 'corruption';
    }
    return 'violence';
  }

  /**
   * Create district rivalry
   */
  public createRivalry(district1Id: string, district2Id: string, reason: string): void {
    const d1 = this.cityDistricts.get(district1Id);
    const d2 = this.cityDistricts.get(district2Id);
    
    if (!d1 || !d2) return;

    if (!d1.rivalDistricts.includes(district2Id)) {
      d1.rivalDistricts.push(district2Id);
    }
    if (!d2.rivalDistricts.includes(district1Id)) {
      d2.rivalDistricts.push(district1Id);
    }

    this.logEvent({
      type: 'riot',
      districtId: district1Id,
      timestamp: Date.now(),
      impact: { stability: -10, happiness: -5 },
      description: `Rivalry erupts between ${d1.name} and ${d2.name}: ${reason}`
    });
  }

  /**
   * Get district statistics
   */
  public getDistrictStats(cityId: string): {
    totalPopulation: number;
    averageIncome: number;
    averageCrimeRate: number;
    gentrifyingDistricts: number;
    crimeHotspots: number;
    districtsByType: Map<string, number>;
  } {
    const districts = Array.from(this.cityDistricts.values()).filter(
      d => d.cityId === cityId
    );

    const stats = {
      totalPopulation: districts.reduce((sum, d) => sum + d.population, 0),
      averageIncome: districts.reduce((sum, d) => sum + d.averageIncome, 0) / (districts.length || 1),
      averageCrimeRate: districts.reduce((sum, d) => sum + d.crimeRate, 0) / (districts.length || 1),
      gentrifyingDistricts: Array.from(this.gentrificationEvents.values()).filter(
        e => districts.some(d => d.id === e.districtId)
      ).length,
      crimeHotspots: Array.from(this.crimeHotspots.values()).filter(
        h => districts.some(d => d.id === h.districtId)
      ).length,
      districtsByType: new Map<string, number>()
    };

    for (const district of districts) {
      const count = stats.districtsByType.get(district.districtType) || 0;
      stats.districtsByType.set(district.districtType, count + 1);
    }

    return stats;
  }

  /**
   * Log district event
   */
  private logEvent(event: DistrictEvent): void {
    this.districtEvents.push(event);
    if (this.districtEvents.length > this.maxEventHistory) {
      this.districtEvents.shift();
    }
  }

  /**
   * Get district by ID
   */
  public getDistrict(id: string): CityDistrict | undefined {
    return this.cityDistricts.get(id);
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      districtTypes: Array.from(this.districtTypes.entries()),
      cityDistricts: Array.from(this.cityDistricts.entries()),
      gentrificationEvents: Array.from(this.gentrificationEvents.entries()),
      crimeHotspots: Array.from(this.crimeHotspots.entries()),
      districtEvents: this.districtEvents.slice(-200)
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.districtTypes) {
      this.districtTypes = new Map(data.districtTypes);
    }
    if (data.cityDistricts) {
      this.cityDistricts = new Map(data.cityDistricts);
    }
    if (data.gentrificationEvents) {
      this.gentrificationEvents = new Map(data.gentrificationEvents);
    }
    if (data.crimeHotspots) {
      this.crimeHotspots = new Map(data.crimeHotspots);
    }
    if (data.districtEvents) {
      this.districtEvents = data.districtEvents;
    }
  }
}
