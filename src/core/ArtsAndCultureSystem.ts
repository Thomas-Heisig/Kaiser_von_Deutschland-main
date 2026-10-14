/**
 * Arts and Culture System
 * 
 * Manages artistic creation, cultural events, and the cultural economy:
 * - Artworks creation and trading
 * - Concerts, theater, opera performances
 * - Literary salons and artist circles
 * - Cultural influence and reputation
 * 
 * Scalability:
 * - Limited number of tracked artworks (quality over quantity)
 * - Events aggregated at city/region level
 * - Artist circles use representative sampling
 */

/**
 * Artwork types
 */
export type ArtworkType = 'painting' | 'sculpture' | 'music' | 'literature' | 'architecture' | 'theater' | 'philosophy';

/**
 * Art movement/style
 */
export type ArtStyle = 'medieval' | 'renaissance' | 'baroque' | 'classicism' | 'romanticism' | 'realism' | 'impressionism' | 'modern' | 'contemporary';

/**
 * Artwork definition
 */
export interface Artwork {
  /** Unique ID */
  id: string;
  /** Title */
  title: string;
  /** Artist name */
  artist: string;
  /** Type */
  type: ArtworkType;
  /** Art style */
  style: ArtStyle;
  /** Quality (0-100) */
  quality: number;
  /** Cultural value */
  culturalValue: number;
  /** Market price */
  price: number;
  /** Owner (citizen or institution ID) */
  ownerId: string;
  /** Creation year */
  yearCreated: number;
  /** Fame level (0-100) */
  fame: number;
  /** Location (region/city ID) */
  location: string;
}

/**
 * Cultural performance/event
 */
export interface CulturalPerformance {
  /** Event ID */
  id: string;
  /** Event name */
  name: string;
  /** Type */
  type: 'concert' | 'theater' | 'opera' | 'reading' | 'exhibition' | 'festival';
  /** Performers/artists */
  performers: string[];
  /** Venue */
  venue: string;
  /** Attendance */
  attendance: number;
  /** Ticket price */
  ticketPrice: number;
  /** Quality (0-100) */
  quality: number;
  /** Date */
  date: number;
  /** Cultural impact */
  culturalImpact: number;
  /** Revenue */
  revenue: number;
}

/**
 * Artist/Cultural circle
 */
export interface CulturalCircle {
  /** Circle ID */
  id: string;
  /** Circle name */
  name: string;
  /** Type */
  type: 'literary_salon' | 'artist_guild' | 'philosophical_society' | 'music_academy' | 'theater_troupe';
  /** Members (artist IDs) */
  members: string[];
  /** Location */
  location: string;
  /** Prestige (0-100) */
  prestige: number;
  /** Active since */
  foundedYear: number;
  /** Patron (sponsor) */
  patronId?: string;
  /** Monthly funding */
  funding: number;
  /** Influence */
  influence: number;
}

/**
 * Artist (cultural figure)
 */
export interface Artist {
  /** Unique ID */
  id: string;
  /** Name */
  name: string;
  /** Profession */
  profession: ArtworkType;
  /** Skill level (0-100) */
  skill: number;
  /** Fame (0-100) */
  fame: number;
  /** Wealth */
  wealth: number;
  /** Birth year */
  birthYear: number;
  /** Death year (if dead) */
  deathYear?: number;
  /** Works created */
  works: string[]; // Artwork IDs
  /** Circle memberships */
  circles: string[]; // Circle IDs
  /** Patron */
  patronId?: string;
  /** Location */
  location: string;
}

/**
 * Arts and Culture System
 */
export class ArtsAndCultureSystem {
  private artworks: Map<string, Artwork> = new Map();
  private performances: CulturalPerformance[] = [];
  private culturalCircles: Map<string, CulturalCircle> = new Map();
  private artists: Map<string, Artist> = new Map();
  private maxArtworks: number = 10000; // Limit tracked artworks
  private maxPerformances: number = 1000; // Keep recent performances

  constructor() {
    // Initialize system
  }

  /**
   * Create a new artist
   */
  public createArtist(
    name: string,
    profession: ArtworkType,
    birthYear: number,
    location: string
  ): Artist {
    const id = `artist_${Date.now()}_${Math.random()}`;

    const artist: Artist = {
      id,
      name,
      profession,
      skill: 20 + Math.random() * 30, // Start 20-50 skill
      fame: 0,
      wealth: 100 + Math.random() * 400,
      birthYear,
      works: [],
      circles: [],
      location
    };

    this.artists.set(id, artist);
    return artist;
  }

  /**
   * Artist creates an artwork
   */
  public createArtwork(
    artistId: string,
    title: string,
    type: ArtworkType,
    style: ArtStyle,
    year: number
  ): Artwork | null {
    const artist = this.artists.get(artistId);
    if (!artist) return null;

    // Check limit
    if (this.artworks.size >= this.maxArtworks) {
      this.pruneOldArtworks();
    }

    const id = `artwork_${Date.now()}_${Math.random()}`;

    // Quality based on artist skill with randomness
    const quality = Math.min(100, artist.skill + Math.random() * 20 - 10);
    
    // Cultural value based on quality and fame
    const culturalValue = quality * (1 + artist.fame / 100);
    
    // Base price
    const basePrice = quality * 10 * (1 + artist.fame / 50);
    
    const artwork: Artwork = {
      id,
      title,
      artist: artist.name,
      type,
      style,
      quality,
      culturalValue,
      price: basePrice,
      ownerId: artistId,
      yearCreated: year,
      fame: artist.fame * 0.5, // Inherits some of artist's fame
      location: artist.location
    };

    this.artworks.set(id, artwork);
    artist.works.push(id);

    // Improve artist skill
    artist.skill = Math.min(100, artist.skill + Math.random() * 2);

    // Chance to increase fame
    if (quality > 70) {
      artist.fame = Math.min(100, artist.fame + (quality - 70) / 10);
    }

    return artwork;
  }

  /**
   * Trade artwork
   */
  public tradeArtwork(artworkId: string, newOwnerId: string, price: number): boolean {
    const artwork = this.artworks.get(artworkId);
    if (!artwork) return false;

    const previousOwner = artwork.ownerId;
    artwork.ownerId = newOwnerId;
    artwork.price = price;

    // Update artist wealth if they're the seller
    const artist = Array.from(this.artists.values()).find(a => a.name === artwork.artist);
    if (artist && previousOwner === artist.id) {
      artist.wealth += price;
      artist.fame = Math.min(100, artist.fame + price / 1000); // Fame from sales
    }

    return true;
  }

  /**
   * Create cultural performance
   */
  public createPerformance(
    name: string,
    type: CulturalPerformance['type'],
    performers: string[],
    venue: string,
    ticketPrice: number,
    potentialAttendance: number
  ): CulturalPerformance {
    // Check limit
    if (this.performances.length >= this.maxPerformances) {
      this.performances.shift(); // Remove oldest
    }

    const id = `performance_${Date.now()}_${Math.random()}`;

    // Calculate quality based on performers
    let totalSkill = 0;
    let totalFame = 0;
    
    for (const performerId of performers) {
      const artist = this.artists.get(performerId);
      if (artist) {
        totalSkill += artist.skill;
        totalFame += artist.fame;
      }
    }

    const avgSkill = totalSkill / performers.length || 50;
    const avgFame = totalFame / performers.length || 10;
    
    const quality = Math.min(100, avgSkill + Math.random() * 20 - 10);

    // Attendance influenced by quality and fame
    const attendanceModifier = (quality / 100) * (1 + avgFame / 100);
    const actualAttendance = Math.floor(potentialAttendance * attendanceModifier * (0.5 + Math.random() * 0.5));

    const revenue = actualAttendance * ticketPrice;
    const culturalImpact = quality * actualAttendance / 100;

    const performance: CulturalPerformance = {
      id,
      name,
      type,
      performers,
      venue,
      attendance: actualAttendance,
      ticketPrice,
      quality,
      date: Date.now(),
      culturalImpact,
      revenue
    };

    this.performances.push(performance);

    // Distribute revenue to performers
    const revenuePerPerformer = revenue / performers.length;
    for (const performerId of performers) {
      const artist = this.artists.get(performerId);
      if (artist) {
        artist.wealth += revenuePerPerformer;
        
        // Fame boost for successful performance
        if (quality > 70) {
          artist.fame = Math.min(100, artist.fame + (actualAttendance / 1000));
        }
      }
    }

    return performance;
  }

  /**
   * Create cultural circle
   */
  public createCulturalCircle(
    name: string,
    type: CulturalCircle['type'],
    foundedYear: number,
    location: string,
    patronId?: string
  ): CulturalCircle {
    const id = `circle_${Date.now()}_${Math.random()}`;

    const circle: CulturalCircle = {
      id,
      name,
      type,
      members: [],
      location,
      prestige: 10 + Math.random() * 20,
      foundedYear,
      patronId,
      funding: patronId ? 500 + Math.random() * 1500 : 100,
      influence: 10
    };

    this.culturalCircles.set(id, circle);
    return circle;
  }

  /**
   * Add artist to circle
   */
  public addArtistToCircle(artistId: string, circleId: string): boolean {
    const artist = this.artists.get(artistId);
    const circle = this.culturalCircles.get(circleId);
    
    if (!artist || !circle) return false;

    if (!circle.members.includes(artistId)) {
      circle.members.push(artistId);
      artist.circles.push(circleId);

      // Skill boost from being in a circle
      artist.skill = Math.min(100, artist.skill + Math.random() * 5);
      
      return true;
    }

    return false;
  }

  /**
   * Update cultural circles
   */
  public updateCulturalCircles(): void {
    for (const circle of this.culturalCircles.values()) {
      // Prestige based on member quality
      let totalSkill = 0;
      let totalFame = 0;

      for (const memberId of circle.members) {
        const artist = this.artists.get(memberId);
        if (artist) {
          totalSkill += artist.skill;
          totalFame += artist.fame;
        }
      }

      if (circle.members.length > 0) {
        const avgSkill = totalSkill / circle.members.length;
        const avgFame = totalFame / circle.members.length;
        
        circle.prestige = Math.min(100, (avgSkill + avgFame) / 2);
        circle.influence = circle.prestige * circle.members.length / 10;
      }

      // Funding affects member support
      if (circle.funding > 0) {
        const fundingPerMember = circle.funding / Math.max(1, circle.members.length);
        
        for (const memberId of circle.members) {
          const artist = this.artists.get(memberId);
          if (artist) {
            artist.wealth += fundingPerMember;
          }
        }
      }
    }
  }

  /**
   * Get cultural influence for a region
   */
  public getRegionalCulturalInfluence(regionId: string): number {
    let influence = 0;

    // From artworks
    for (const artwork of this.artworks.values()) {
      if (artwork.location === regionId) {
        influence += artwork.culturalValue * 0.1;
      }
    }

    // From artists
    for (const artist of this.artists.values()) {
      if (artist.location === regionId) {
        influence += artist.fame * 0.5;
      }
    }

    // From circles
    for (const circle of this.culturalCircles.values()) {
      if (circle.location === regionId) {
        influence += circle.influence;
      }
    }

    return influence;
  }

  /**
   * Prune old artworks to maintain limit
   */
  private pruneOldArtworks(): void {
    // Remove lowest quality artworks
    const artworkArray = Array.from(this.artworks.entries());
    artworkArray.sort((a, b) => a[1].quality - b[1].quality);
    
    // Remove bottom 10%
    const toRemove = Math.floor(artworkArray.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.artworks.delete(artworkArray[i][0]);
    }
  }

  /**
   * Get famous artists (top by fame)
   */
  public getFamousArtists(limit: number = 10): Artist[] {
    return Array.from(this.artists.values())
      .filter(a => !a.deathYear) // Only living
      .sort((a, b) => b.fame - a.fame)
      .slice(0, limit);
  }

  /**
   * Get valuable artworks
   */
  public getValuableArtworks(limit: number = 10): Artwork[] {
    return Array.from(this.artworks.values())
      .sort((a, b) => b.price - a.price)
      .slice(0, limit);
  }

  /**
   * Get recent performances
   */
  public getRecentPerformances(limit: number = 20): CulturalPerformance[] {
    return this.performances.slice(-limit);
  }

  /**
   * Get all cultural circles
   */
  public getCulturalCircles(): Map<string, CulturalCircle> {
    return this.culturalCircles;
  }

  /**
   * Get all artists
   */
  public getArtists(): Map<string, Artist> {
    return this.artists;
  }

  /**
   * Get all artworks
   */
  public getArtworks(): Map<string, Artwork> {
    return this.artworks;
  }

  /**
   * Serialize for save/load
   */
  public serialize(): any {
    return {
      artworks: Array.from(this.artworks.entries()),
      performances: this.performances,
      culturalCircles: Array.from(this.culturalCircles.entries()),
      artists: Array.from(this.artists.entries())
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.artworks) {
      this.artworks = new Map(data.artworks);
    }
    if (data.performances) {
      this.performances = data.performances;
    }
    if (data.culturalCircles) {
      this.culturalCircles = new Map(data.culturalCircles);
    }
    if (data.artists) {
      this.artists = new Map(data.artists);
    }
  }
}
