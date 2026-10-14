/**
 * Fashion and Trends System
 * 
 * Manages fashion evolution, trends, and cultural movements:
 * - Era-based clothing styles and fashion houses
 * - Trendsetters and fashion influencers
 * - Youth cultures and subcultures (from 1950)
 * - Fashion industry economics
 * 
 * Integrates with:
 * - Cultural system for influence
 * - Economic system for fashion industry
 * - Social system for trend propagation
 * 
 * Scalability:
 * - Fashion trends spread through social networks
 * - Industry aggregated at regional level
 * - Subcultures use representative sampling
 */

/**
 * Fashion era defining clothing styles
 */
export interface FashionEra {
  /** Unique identifier */
  id: string;
  /** Era name */
  name: string;
  /** Time period */
  period: {
    start: number;
    end: number | null;
  };
  /** Dominant clothing styles */
  styles: string[];
  /** Typical materials */
  materials: string[];
  /** Fashion characteristics */
  characteristics: string[];
  /** Social class distinctions */
  classDistinctions: {
    nobility: string;
    middle: string;
    lower: string;
  };
  /** Cultural prestige bonus */
  prestigeBonus: number;
  /** Economic impact (fashion industry size) */
  economicImpact: number;
}

/**
 * Fashion house/designer
 */
export interface FashionHouse {
  /** Unique ID */
  id: string;
  /** House/designer name */
  name: string;
  /** Founder year */
  foundedYear: number;
  /** Location (city/region) */
  location: string;
  /** Prestige (0-100) */
  prestige: number;
  /** Specialization */
  specialization: 'haute_couture' | 'ready_to_wear' | 'streetwear' | 'luxury' | 'casual';
  /** Revenue (gold per year) */
  revenue: number;
  /** Trend influence (0-100) */
  trendInfluence: number;
  /** Historical status */
  isHistorical: boolean;
  /** Famous collections */
  famousCollections: string[];
}

/**
 * Youth culture/subculture
 */
export interface YouthCulture {
  /** Unique ID */
  id: string;
  /** Culture name */
  name: string;
  /** Emergence period */
  period: {
    start: number;
    end: number | null;
  };
  /** Origin country/region */
  origin: string;
  /** Core values/characteristics */
  values: string[];
  /** Fashion style */
  fashionStyle: string;
  /** Music genre association */
  musicGenre: string;
  /** Population adherents (% of youth) */
  adherenceRate: number;
  /** Social impact */
  socialImpact: {
    culturalInfluence: number;
    rebellion: number;
    creativity: number;
    commercialization: number;
  };
  /** Parent culture (if derived) */
  parentCulture: string | null;
}

/**
 * Trend/fashion movement
 */
export interface FashionTrend {
  /** Trend ID */
  id: string;
  /** Trend name */
  name: string;
  /** Trendsetter (citizen or house ID) */
  trendsetter: string;
  /** Origin year */
  yearStarted: number;
  /** Peak year */
  yearPeak: number;
  /** Decline year */
  yearDeclining: number | null;
  /** Popularity (0-100) */
  popularity: number;
  /** Adoption by social class */
  classAdoption: {
    nobility: number;
    middle: number;
    lower: number;
  };
  /** Regional spread */
  regions: string[];
  /** Economic value */
  economicValue: number;
  /** Cultural impact */
  culturalImpact: number;
}

/**
 * Fashion System class
 */
export class FashionSystem {
  private fashionEras: Map<string, FashionEra> = new Map();
  private fashionHouses: Map<string, FashionHouse> = new Map();
  private youthCultures: Map<string, YouthCulture> = new Map();
  private activeTrends: Map<string, FashionTrend> = new Map();

  /**
   * Initialize the fashion system
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/fashion-system.json');
      const data = await response.json();

      // Load fashion eras
      data.fashionEras.forEach((era: FashionEra) => {
        this.fashionEras.set(era.id, era);
      });

      // Load fashion houses
      if (data.fashionHouses) {
        data.fashionHouses.forEach((house: FashionHouse) => {
          this.fashionHouses.set(house.id, house);
        });
      }

      // Load youth cultures
      if (data.youthCultures) {
        data.youthCultures.forEach((culture: YouthCulture) => {
          this.youthCultures.set(culture.id, culture);
        });
      }

      console.log(`Fashion System initialized: ${this.fashionEras.size} eras, ${this.fashionHouses.size} houses, ${this.youthCultures.size} cultures`);
    } catch (error) {
      console.error('Failed to load fashion data:', error);
    }
  }

  /**
   * Update fashion system for current year
   */
  update(year: number, deltaTime: number): void {
    // Update current era
    this.updateCurrentEra(year);

    // Update fashion houses
    this.updateFashionHouses(year, deltaTime);

    // Update trends
    this.updateTrends(year, deltaTime);

    // Update youth cultures
    this.updateYouthCultures(year);
  }

  /**
   * Get current fashion era for the year
   */
  getCurrentEra(year: number): FashionEra | null {
    for (const era of this.fashionEras.values()) {
      if (era.period.start <= year && (era.period.end === null || era.period.end >= year)) {
        return era;
      }
    }
    return null;
  }

  /**
   * Get all available fashion eras
   */
  getAllEras(): FashionEra[] {
    return Array.from(this.fashionEras.values());
  }

  /**
   * Get active youth cultures for the year
   */
  getActiveYouthCultures(year: number): YouthCulture[] {
    return Array.from(this.youthCultures.values()).filter(culture => {
      return culture.period.start <= year && 
             (culture.period.end === null || culture.period.end >= year);
    });
  }

  /**
   * Get all fashion houses
   */
  getFashionHouses(activeOnly: boolean = false): FashionHouse[] {
    const houses = Array.from(this.fashionHouses.values());
    if (activeOnly) {
      return houses.filter(h => h.prestige > 0);
    }
    return houses;
  }

  /**
   * Get active trends
   */
  getActiveTrends(): FashionTrend[] {
    return Array.from(this.activeTrends.values());
  }

  /**
   * Create a new fashion house
   */
  createFashionHouse(
    name: string,
    location: string,
    year: number,
    specialization: FashionHouse['specialization']
  ): FashionHouse {
    const house: FashionHouse = {
      id: `house_${Date.now()}_${Math.random()}`,
      name,
      foundedYear: year,
      location,
      prestige: 10,
      specialization,
      revenue: 1000,
      trendInfluence: 5,
      isHistorical: false,
      famousCollections: []
    };

    this.fashionHouses.set(house.id, house);
    return house;
  }

  /**
   * Create a new fashion trend
   */
  createTrend(
    name: string,
    trendsetter: string,
    year: number,
    initialPopularity: number = 10
  ): FashionTrend {
    const trend: FashionTrend = {
      id: `trend_${Date.now()}_${Math.random()}`,
      name,
      trendsetter,
      yearStarted: year,
      yearPeak: year + 2,
      yearDeclining: null,
      popularity: initialPopularity,
      classAdoption: {
        nobility: initialPopularity * 0.8,
        middle: initialPopularity * 0.6,
        lower: initialPopularity * 0.4
      },
      regions: [],
      economicValue: initialPopularity * 100,
      culturalImpact: initialPopularity / 10
    };

    this.activeTrends.set(trend.id, trend);
    return trend;
  }

  /**
   * Get fashion industry economic value
   */
  getFashionIndustryValue(): number {
    let total = 0;

    // Sum revenue from all fashion houses
    for (const house of this.fashionHouses.values()) {
      total += house.revenue;
    }

    // Add value from active trends
    for (const trend of this.activeTrends.values()) {
      total += trend.economicValue;
    }

    return total;
  }

  /**
   * Get cultural prestige from fashion
   */
  getFashionPrestige(year: number): number {
    let prestige = 0;

    // Current era prestige
    const currentEra = this.getCurrentEra(year);
    if (currentEra) {
      prestige += currentEra.prestigeBonus;
    }

    // Fashion houses prestige
    for (const house of this.fashionHouses.values()) {
      prestige += house.prestige * 0.1;
    }

    // Youth culture influence
    const cultures = this.getActiveYouthCultures(year);
    for (const culture of cultures) {
      prestige += culture.socialImpact.culturalInfluence * 0.05;
    }

    return Math.round(prestige);
  }

  /**
   * Get summary for UI display
   */
  getSummary(year: number): {
    currentEra: FashionEra | null;
    activeHouses: number;
    activeTrends: number;
    activeCultures: YouthCulture[];
    industryValue: number;
    prestige: number;
  } {
    return {
      currentEra: this.getCurrentEra(year),
      activeHouses: this.getFashionHouses(true).length,
      activeTrends: this.activeTrends.size,
      activeCultures: this.getActiveYouthCultures(year),
      industryValue: this.getFashionIndustryValue(),
      prestige: this.getFashionPrestige(year)
    };
  }

  /**
   * Private: Update current era
   */
  private updateCurrentEra(_year: number): void {
    // Current era is retrieved on-demand via getCurrentEra()
    // No persistent state needed here
  }

  /**
   * Private: Update fashion houses
   */
  private updateFashionHouses(_year: number, deltaTime: number): void {
    for (const house of this.fashionHouses.values()) {
      // Decay prestige slightly over time
      house.prestige = Math.max(0, house.prestige - deltaTime * 0.1);

      // Update revenue based on prestige
      house.revenue = Math.round(house.prestige * 100 + house.trendInfluence * 50);
    }
  }

  /**
   * Private: Update trends lifecycle
   */
  private updateTrends(year: number, deltaTime: number): void {
    const trendsToRemove: string[] = [];

    for (const [id, trend] of this.activeTrends) {
      // Check if trend is in declining phase
      if (year >= trend.yearPeak + 3 && !trend.yearDeclining) {
        trend.yearDeclining = year;
      }

      // Update popularity based on lifecycle
      if (trend.yearDeclining) {
        // Declining trend
        trend.popularity = Math.max(0, trend.popularity - deltaTime * 5);
        if (trend.popularity === 0) {
          trendsToRemove.push(id);
        }
      } else if (year < trend.yearPeak) {
        // Growing trend
        trend.popularity = Math.min(100, trend.popularity + deltaTime * 2);
      } else {
        // Peak trend (stable)
        trend.popularity = Math.min(100, trend.popularity + deltaTime * 0.5);
      }

      // Update economic value
      trend.economicValue = Math.round(trend.popularity * 100);
    }

    // Remove dead trends
    trendsToRemove.forEach(id => this.activeTrends.delete(id));
  }

  /**
   * Private: Update youth cultures
   */
  private updateYouthCultures(year: number): void {
    // Calculate adherence rates based on cultural influence
    for (const culture of this.youthCultures.values()) {
      if (culture.period.start <= year && (culture.period.end === null || culture.period.end >= year)) {
        // Culture is active
        const yearsSinceStart = year - culture.period.start;
        
        // Growth phase (first 5 years)
        if (yearsSinceStart < 5) {
          culture.adherenceRate = Math.min(50, yearsSinceStart * 5 + 5);
        }
        // Mature phase (5-15 years)
        else if (yearsSinceStart < 15) {
          culture.adherenceRate = Math.min(80, 25 + yearsSinceStart * 3);
        }
        // Decline phase (15+ years, if end date exists)
        else if (culture.period.end && year > culture.period.end - 5) {
          culture.adherenceRate = Math.max(10, 80 - (year - (culture.period.end - 5)) * 10);
        }
      }
    }
  }
}
