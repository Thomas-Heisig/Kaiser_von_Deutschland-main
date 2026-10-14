/**
 * Library System - Knowledge storage, books, censorship
 * Manages libraries, book collections, and knowledge accessibility
 */

export interface Library {
  id: string;
  name: string;
  era: string;
  yearAvailable: number;
  capacity: number;
  buildCost: {
    gold: number;
    wood?: number;
    stone?: number;
    iron?: number;
    coal?: number;
  };
  maintenanceCost: number;
  researchBonus: number;
  culturalValue: number;
  description: string;
  specializations: string[];
  accessModel?: 'open_access' | 'paywall';
  income?: number;
}

export interface Book {
  id: string;
  name: string;
  author: string;
  year: number;
  category: string;
  culturalValue: number;
  researchValue: number;
}

export interface CensorshipPolicy {
  id: string;
  name: string;
  description: string;
  yearStart: number;
  yearEnd: number;
  popularityEffect?: number;
  culturalEffect?: number;
  religiousEffect?: number;
  stabilityEffect?: number;
  researchEffect?: number;
}

export class LibrarySystem {
  private libraries: Library[] = [];
  private books: Book[] = [];
  private censorshipPolicies: CensorshipPolicy[] = [];
  
  private ownedLibraries: Map<string, Library> = new Map();
  private bookCollection: Set<string> = new Set();
  // @ts-expect-error - Reserved for future active censorship tracking
  private activeCensorship: string | null = null;

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/libraries.json');
      const data = await response.json();
      
      this.libraries = data.libraries || [];
      this.books = data.books || [];
      this.censorshipPolicies = data.censorshipPolicies || [];
    } catch (error) {
      console.error('Failed to load library data:', error);
    }
  }

  /**
   * Build a library
   */
  public buildLibrary(libraryId: string, resources: Record<string, number>): {
    success: boolean;
    message: string;
    library?: Library;
  } {
    const library = this.libraries.find(l => l.id === libraryId);
    if (!library) {
      return { success: false, message: 'Library not found' };
    }

    // Check if already owned
    if (this.ownedLibraries.has(libraryId)) {
      return { success: false, message: 'Library already built' };
    }

    // Check resources
    for (const [resource, amount] of Object.entries(library.buildCost)) {
      if (!resources[resource] || resources[resource] < amount) {
        return { success: false, message: `Insufficient ${resource}` };
      }
    }

    this.ownedLibraries.set(libraryId, library);
    
    return {
      success: true,
      message: `${library.name} successfully built!`,
      library
    };
  }

  /**
   * Add book to collection
   */
  public acquireBook(bookId: string): {
    success: boolean;
    message: string;
    book?: Book;
  } {
    const book = this.books.find(b => b.id === bookId);
    if (!book) {
      return { success: false, message: 'Book not found' };
    }

    if (this.bookCollection.has(bookId)) {
      return { success: false, message: 'Book already in collection' };
    }

    // Check if library has capacity
    const totalCapacity = this.getTotalCapacity();
    if (this.bookCollection.size >= totalCapacity) {
      return { success: false, message: 'No library capacity available' };
    }

    this.bookCollection.add(bookId);
    
    return {
      success: true,
      message: `Acquired: ${book.name} by ${book.author}`,
      book
    };
  }

  /**
   * Apply censorship policy
   */
  public applyCensorship(policyId: string): {
    success: boolean;
    effects: Partial<CensorshipPolicy>;
  } {
    const policy = this.censorshipPolicies.find(p => p.id === policyId);
    if (!policy) {
      return { success: false, effects: {} };
    }

    this.activeCensorship = policyId;
    
    return {
      success: true,
      effects: {
        popularityEffect: policy.popularityEffect,
        culturalEffect: policy.culturalEffect,
        religiousEffect: policy.religiousEffect,
        stabilityEffect: policy.stabilityEffect,
        researchEffect: policy.researchEffect
      }
    };
  }

  /**
   * Calculate total research bonus from libraries
   */
  public getResearchBonus(): number {
    let bonus = 0;
    for (const library of this.ownedLibraries.values()) {
      bonus += library.researchBonus;
    }
    return bonus;
  }

  /**
   * Calculate total cultural value
   */
  public getCulturalValue(): number {
    let value = 0;
    
    // From libraries
    for (const library of this.ownedLibraries.values()) {
      value += library.culturalValue;
    }
    
    // From books
    for (const bookId of this.bookCollection) {
      const book = this.books.find(b => b.id === bookId);
      if (book) {
        value += book.culturalValue;
      }
    }
    
    return value;
  }

  /**
   * Get total library capacity
   */
  public getTotalCapacity(): number {
    let capacity = 0;
    for (const library of this.ownedLibraries.values()) {
      capacity += library.capacity;
    }
    return capacity;
  }

  /**
   * Get available libraries for year
   */
  public getAvailableLibraries(year: number): Library[] {
    return this.libraries.filter(library => year >= library.yearAvailable);
  }

  /**
   * Get books in collection
   */
  public getBookCollection(): Book[] {
    return Array.from(this.bookCollection)
      .map(id => this.books.find(b => b.id === id))
      .filter((book): book is Book => book !== undefined);
  }

  /**
   * Get maintenance cost
   */
  public getMaintenanceCost(): number {
    let cost = 0;
    for (const library of this.ownedLibraries.values()) {
      cost += library.maintenanceCost;
    }
    return cost;
  }

  /**
   * Get income from paywalled libraries
   */
  public getIncome(): number {
    let income = 0;
    for (const library of this.ownedLibraries.values()) {
      if (library.income) {
        income += library.income;
      }
    }
    return income;
  }
}
