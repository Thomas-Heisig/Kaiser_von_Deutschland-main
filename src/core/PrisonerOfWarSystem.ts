// src/core/PrisonerOfWarSystem.ts

/**
 * Prisoners of War (PoW) System
 * 
 * Manages the capture, treatment, exchange, and release of prisoners of war
 * throughout different historical eras with evolving standards and practices.
 * 
 * Features:
 * - Capture mechanics from battles and sieges
 * - Treatment policies (humane, standard, harsh, forced labor)
 * - Prisoner exchanges and ransoms
 * - Escape attempts
 * - International law compliance (Geneva Convention after 1929)
 * - Diplomatic and morale consequences
 * - Economic costs
 * 
 * @version 2.5.1
 */

export type TreatmentPolicy =
  | 'humane'          // Good treatment, medical care, recreation
  | 'standard'        // Basic necessities, minimal comfort
  | 'harsh'           // Poor conditions, minimal food
  | 'forced_labor'    // Work camps, construction, mines
  | 'ransom'          // Hold for ransom (medieval/renaissance)
  | 'execution';      // War crimes (negative consequences)

export type PrisonerStatus =
  | 'captured'
  | 'held'
  | 'exchanged'
  | 'ransomed'
  | 'released'
  | 'escaped'
  | 'died'
  | 'executed';

export interface Prisoner {
  id: string;
  name: string;
  rank: 'soldier' | 'officer' | 'general' | 'noble';
  nationality: string;
  capturedBy: string;
  captureDate: number;        // Year of capture
  captureLocation: string;
  status: PrisonerStatus;
  health: number;             // 0-100
  morale: number;             // 0-100
  escapeAttempts: number;
  ransomValue?: number;       // For nobility/officers
  skills?: string[];          // Can be used for forced labor
}

export interface PrisonerCamp {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentOccupancy: number;
  treatmentPolicy: TreatmentPolicy;
  securityLevel: number;      // 1-10, affects escape chances
  conditions: number;          // 0-100, affects prisoner health
  guards: number;
  monthlyMaintenanceCost: number;
  established: number;         // Year
}

export interface TreatmentPolicyData {
  id: TreatmentPolicy;
  name: string;
  description: string;
  availableFrom: number;      // Year
  conditions: number;          // 0-100
  foodRations: number;         // 0-100
  medicalCare: number;         // 0-100
  workHoursPerDay: number;
  monthlyMaintenanceCostPerPrisoner: number;
  diplomaticImpact: number;    // -100 to +100
  moraleImpact: number;        // -100 to +100 (on own troops)
  escapeChanceModifier: number; // Multiplier
  healthDecayRate: number;     // Per month
  internationalLawCompliance: boolean; // Post-Geneva Convention
}

export interface PrisonerExchange {
  id: string;
  date: number;
  initiator: string;
  recipient: string;
  prisonersOffered: string[]; // Prisoner IDs
  prisonersRequested: string[];
  status: 'proposed' | 'accepted' | 'rejected' | 'completed';
  additionalTerms?: {
    gold?: number;
    territory?: string;
    resources?: Record<string, number>;
  };
}

export interface PoWEvent {
  id: string;
  type: 'capture' | 'escape' | 'exchange' | 'release' | 'death' | 'execution' | 'uprising';
  year: number;
  location: string;
  prisoners: string[];
  description: string;
  consequences: {
    diplomatic?: number;
    morale?: number;
    prestige?: number;
    gold?: number;
  };
}

export class PrisonerOfWarSystem {
  private prisoners: Map<string, Prisoner> = new Map();
  private camps: Map<string, PrisonerCamp> = new Map();
  private treatmentPolicies: Map<TreatmentPolicy, TreatmentPolicyData> = new Map();
  private exchanges: PrisonerExchange[] = [];
  private events: PoWEvent[] = [];
  private currentYear: number = 0;

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/src/data/json/prisoner-of-war.json');
      const data = await response.json();

      // Load treatment policies
      if (data.treatmentPolicies) {
        data.treatmentPolicies.forEach((policy: TreatmentPolicyData) => {
          this.treatmentPolicies.set(policy.id, policy);
        });
      }

      // Load historical PoW camps (if any)
      if (data.historicalCamps) {
        data.historicalCamps.forEach((camp: PrisonerCamp) => {
          this.camps.set(camp.id, camp);
        });
      }

      console.log(`Loaded ${this.treatmentPolicies.size} PoW treatment policies`);
    } catch (error) {
      console.error('Failed to load PoW data:', error);
      // Load default policies
      this.loadDefaultPolicies();
    }
  }

  private loadDefaultPolicies(): void {
    const defaultPolicies: TreatmentPolicyData[] = [
      {
        id: 'humane',
        name: 'Humane Treatment',
        description: 'Full compliance with international law, good conditions, medical care',
        availableFrom: 1929,
        conditions: 90,
        foodRations: 90,
        medicalCare: 90,
        workHoursPerDay: 0,
        monthlyMaintenanceCostPerPrisoner: 50,
        diplomaticImpact: 20,
        moraleImpact: 5,
        escapeChanceModifier: 0.5,
        healthDecayRate: -0.1,
        internationalLawCompliance: true
      },
      {
        id: 'standard',
        name: 'Standard Treatment',
        description: 'Basic necessities provided, minimal comfort',
        availableFrom: 0,
        conditions: 60,
        foodRations: 70,
        medicalCare: 50,
        workHoursPerDay: 4,
        monthlyMaintenanceCostPerPrisoner: 30,
        diplomaticImpact: 0,
        moraleImpact: 0,
        escapeChanceModifier: 1.0,
        healthDecayRate: 0.5,
        internationalLawCompliance: true
      },
      {
        id: 'harsh',
        name: 'Harsh Conditions',
        description: 'Poor conditions, minimal food, limited medical care',
        availableFrom: 0,
        conditions: 30,
        foodRations: 40,
        medicalCare: 20,
        workHoursPerDay: 8,
        monthlyMaintenanceCostPerPrisoner: 15,
        diplomaticImpact: -30,
        moraleImpact: -10,
        escapeChanceModifier: 1.5,
        healthDecayRate: 2.0,
        internationalLawCompliance: false
      },
      {
        id: 'forced_labor',
        name: 'Forced Labor',
        description: 'Prisoners used for construction, mining, or agriculture',
        availableFrom: 0,
        conditions: 40,
        foodRations: 60,
        medicalCare: 30,
        workHoursPerDay: 12,
        monthlyMaintenanceCostPerPrisoner: 20,
        diplomaticImpact: -50,
        moraleImpact: 10,
        escapeChanceModifier: 1.2,
        healthDecayRate: 3.0,
        internationalLawCompliance: false
      },
      {
        id: 'ransom',
        name: 'Hold for Ransom',
        description: 'Keep prisoners until ransom is paid (medieval practice)',
        availableFrom: 0,
        conditions: 70,
        foodRations: 80,
        medicalCare: 70,
        workHoursPerDay: 0,
        monthlyMaintenanceCostPerPrisoner: 40,
        diplomaticImpact: 10,
        moraleImpact: 0,
        escapeChanceModifier: 0.8,
        healthDecayRate: 0.2,
        internationalLawCompliance: false
      },
      {
        id: 'execution',
        name: 'Execution',
        description: 'War crime - execute prisoners (severe consequences)',
        availableFrom: 0,
        conditions: 0,
        foodRations: 0,
        medicalCare: 0,
        workHoursPerDay: 0,
        monthlyMaintenanceCostPerPrisoner: 0,
        diplomaticImpact: -100,
        moraleImpact: -50,
        escapeChanceModifier: 0,
        healthDecayRate: 100,
        internationalLawCompliance: false
      }
    ];

    defaultPolicies.forEach(policy => {
      this.treatmentPolicies.set(policy.id, policy);
    });
  }

  /**
   * Capture prisoners from a battle or siege
   */
  capturePrisoners(
    nationality: string,
    capturedBy: string,
    count: number,
    location: string,
    year: number,
    ranks: { soldier?: number; officer?: number; general?: number; noble?: number } = {}
  ): Prisoner[] {
    const captured: Prisoner[] = [];
    const total = count;

    // Default distribution if not specified
    const distribution = {
      soldier: ranks.soldier ?? Math.floor(count * 0.9),
      officer: ranks.officer ?? Math.floor(count * 0.08),
      general: ranks.general ?? Math.floor(count * 0.01),
      noble: ranks.noble ?? Math.floor(count * 0.01)
    };

    // Ensure total matches
    const sum = distribution.soldier + distribution.officer + distribution.general + distribution.noble;
    if (sum < total) distribution.soldier += (total - sum);

    // Create prisoners
    const rankTypes: Array<'soldier' | 'officer' | 'general' | 'noble'> = ['soldier', 'officer', 'general', 'noble'];
    rankTypes.forEach(rank => {
      for (let i = 0; i < distribution[rank]; i++) {
        const prisoner: Prisoner = {
          id: `pow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: this.generatePrisonerName(nationality, rank),
          rank,
          nationality,
          capturedBy,
          captureDate: year,
          captureLocation: location,
          status: 'captured',
          health: 80 + Math.random() * 20,
          morale: 30 + Math.random() * 30,
          escapeAttempts: 0,
          ransomValue: rank === 'noble' || rank === 'general' ? 1000 + Math.random() * 9000 : undefined
        };

        this.prisoners.set(prisoner.id, prisoner);
        captured.push(prisoner);
      }
    });

    // Create event
    const event: PoWEvent = {
      id: `event_${Date.now()}`,
      type: 'capture',
      year,
      location,
      prisoners: captured.map(p => p.id),
      description: `Captured ${count} ${nationality} prisoners at ${location}`,
      consequences: {
        prestige: Math.floor(count / 10)
      }
    };
    this.events.push(event);

    return captured;
  }

  /**
   * Create a new prisoner camp
   */
  createCamp(
    name: string,
    location: string,
    capacity: number,
    treatmentPolicy: TreatmentPolicy,
    guards: number,
    year: number
  ): PrisonerCamp {
    const policy = this.treatmentPolicies.get(treatmentPolicy);
    const maintenanceCost = policy
      ? capacity * policy.monthlyMaintenanceCostPerPrisoner * 0.1
      : capacity * 10;

    const camp: PrisonerCamp = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      location,
      capacity,
      currentOccupancy: 0,
      treatmentPolicy,
      securityLevel: Math.min(10, Math.max(1, Math.floor(guards / (capacity / 100)))),
      conditions: policy?.conditions ?? 50,
      guards,
      monthlyMaintenanceCost: maintenanceCost,
      established: year
    };

    this.camps.set(camp.id, camp);
    return camp;
  }

  /**
   * Assign prisoners to a camp
   */
  assignToCamp(prisonerIds: string[], campId: string): boolean {
    const camp = this.camps.get(campId);
    if (!camp) return false;

    const availableCapacity = camp.capacity - camp.currentOccupancy;
    if (availableCapacity < prisonerIds.length) return false;

    prisonerIds.forEach(id => {
      const prisoner = this.prisoners.get(id);
      if (prisoner) {
        prisoner.status = 'held';
      }
    });

    camp.currentOccupancy += prisonerIds.length;
    return true;
  }

  /**
   * Change treatment policy for a camp
   */
  setCampTreatmentPolicy(campId: string, policy: TreatmentPolicy): boolean {
    const camp = this.camps.get(campId);
    if (!camp) return false;

    const policyData = this.treatmentPolicies.get(policy);
    if (!policyData) return false;

    // Check if policy is available in current year
    if (policyData.availableFrom > this.currentYear) return false;

    camp.treatmentPolicy = policy;
    camp.conditions = policyData.conditions;
    camp.monthlyMaintenanceCost = camp.capacity * policyData.monthlyMaintenanceCostPerPrisoner * 0.1;

    return true;
  }

  /**
   * Propose prisoner exchange
   */
  proposeExchange(
    initiator: string,
    recipient: string,
    offeredPrisoners: string[],
    requestedPrisoners: string[],
    year: number,
    additionalTerms?: PrisonerExchange['additionalTerms']
  ): PrisonerExchange {
    const exchange: PrisonerExchange = {
      id: `exchange_${Date.now()}`,
      date: year,
      initiator,
      recipient,
      prisonersOffered: offeredPrisoners,
      prisonersRequested: requestedPrisoners,
      status: 'proposed',
      additionalTerms
    };

    this.exchanges.push(exchange);
    return exchange;
  }

  /**
   * Accept or reject exchange
   */
  respondToExchange(exchangeId: string, accept: boolean): boolean {
    const exchange = this.exchanges.find(e => e.id === exchangeId);
    if (!exchange || exchange.status !== 'proposed') return false;

    if (accept) {
      exchange.status = 'accepted';
      this.executeExchange(exchange);
    } else {
      exchange.status = 'rejected';
    }

    return true;
  }

  private executeExchange(exchange: PrisonerExchange): void {
    // Update prisoner statuses
    [...exchange.prisonersOffered, ...exchange.prisonersRequested].forEach(id => {
      const prisoner = this.prisoners.get(id);
      if (prisoner) {
        prisoner.status = 'exchanged';
        // Swap captor
        prisoner.capturedBy = prisoner.capturedBy === exchange.initiator
          ? exchange.recipient
          : exchange.initiator;
      }
    });

    exchange.status = 'completed';

    // Create event
    const event: PoWEvent = {
      id: `event_${Date.now()}`,
      type: 'exchange',
      year: exchange.date,
      location: 'Exchange Point',
      prisoners: [...exchange.prisonersOffered, ...exchange.prisonersRequested],
      description: `Prisoner exchange between ${exchange.initiator} and ${exchange.recipient}`,
      consequences: {
        diplomatic: 10
      }
    };
    this.events.push(event);
  }

  /**
   * Release prisoners (end of war, amnesty, etc.)
   */
  releasePrisoners(prisonerIds: string[], year: number): void {
    prisonerIds.forEach(id => {
      const prisoner = this.prisoners.get(id);
      if (prisoner) {
        prisoner.status = 'released';
      }
    });

    const event: PoWEvent = {
      id: `event_${Date.now()}`,
      type: 'release',
      year,
      location: 'Various',
      prisoners: prisonerIds,
      description: `Released ${prisonerIds.length} prisoners`,
      consequences: {
        diplomatic: 5,
        prestige: 2
      }
    };
    this.events.push(event);
  }

  /**
   * Monthly update - handle health decay, escape attempts, deaths
   */
  update(year: number, _month: number): void {
    this.currentYear = year;

    this.camps.forEach(camp => {
      const policy = this.treatmentPolicies.get(camp.treatmentPolicy);
      if (!policy) return;

      // Get prisoners in this camp
      const campPrisoners = Array.from(this.prisoners.values()).filter(
        p => p.status === 'held' && p.capturedBy === camp.location
      );

      campPrisoners.forEach(prisoner => {
        // Health decay
        prisoner.health -= policy.healthDecayRate;
        prisoner.health = Math.max(0, Math.min(100, prisoner.health));

        // Death check
        if (prisoner.health <= 0) {
          prisoner.status = 'died';
          camp.currentOccupancy--;
        }

        // Escape attempt (1% base chance per month)
        const escapeChance = 0.01 * policy.escapeChanceModifier * (1 - camp.securityLevel / 10);
        if (Math.random() < escapeChance) {
          prisoner.escapeAttempts++;
          if (Math.random() < 0.3) { // 30% success rate
            prisoner.status = 'escaped';
            camp.currentOccupancy--;

            this.events.push({
              id: `event_${Date.now()}`,
              type: 'escape',
              year,
              location: camp.location,
              prisoners: [prisoner.id],
              description: `${prisoner.rank} ${prisoner.name} escaped from ${camp.name}`,
              consequences: {
                prestige: -1,
                morale: -5
              }
            });
          }
        }

        // Morale changes
        prisoner.morale += (policy.conditions - 50) / 10;
        prisoner.morale = Math.max(0, Math.min(100, prisoner.morale));
      });
    });
  }

  /**
   * Calculate total monthly maintenance costs
   */
  calculateTotalMaintenanceCost(): number {
    return Array.from(this.camps.values()).reduce(
      (total, camp) => total + camp.monthlyMaintenanceCost,
      0
    );
  }

  /**
   * Get all prisoners by status
   */
  getPrisonersByStatus(status: PrisonerStatus): Prisoner[] {
    return Array.from(this.prisoners.values()).filter(p => p.status === status);
  }

  /**
   * Get prisoners by nationality
   */
  getPrisonersByNationality(nationality: string): Prisoner[] {
    return Array.from(this.prisoners.values()).filter(p => p.nationality === nationality);
  }

  /**
   * Get all camps
   */
  getAllCamps(): PrisonerCamp[] {
    return Array.from(this.camps.values());
  }

  /**
   * Get treatment policy data
   */
  getTreatmentPolicy(policy: TreatmentPolicy): TreatmentPolicyData | undefined {
    return this.treatmentPolicies.get(policy);
  }

  /**
   * Get available treatment policies for current year
   */
  getAvailablePolicies(year: number): TreatmentPolicyData[] {
    return Array.from(this.treatmentPolicies.values()).filter(
      p => p.availableFrom <= year
    );
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const all = Array.from(this.prisoners.values());
    return {
      totalPrisoners: all.length,
      byCaptureStatus: {
        captured: this.getPrisonersByStatus('captured').length,
        held: this.getPrisonersByStatus('held').length,
        exchanged: this.getPrisonersByStatus('exchanged').length,
        released: this.getPrisonersByStatus('released').length,
        escaped: this.getPrisonersByStatus('escaped').length,
        died: this.getPrisonersByStatus('died').length,
        executed: this.getPrisonersByStatus('executed').length
      },
      byRank: {
        soldier: all.filter(p => p.rank === 'soldier').length,
        officer: all.filter(p => p.rank === 'officer').length,
        general: all.filter(p => p.rank === 'general').length,
        noble: all.filter(p => p.rank === 'noble').length
      },
      totalCamps: this.camps.size,
      totalCapacity: Array.from(this.camps.values()).reduce((sum, c) => sum + c.capacity, 0),
      totalOccupancy: Array.from(this.camps.values()).reduce((sum, c) => sum + c.currentOccupancy, 0),
      monthlyMaintenanceCost: this.calculateTotalMaintenanceCost()
    };
  }

  /**
   * Get all PoW events
   */
  getEvents(): PoWEvent[] {
    return this.events;
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 10): PoWEvent[] {
    return this.events.slice(-count);
  }

  private generatePrisonerName(_nationality: string, _rank: string): string {
    const firstNames = ['Hans', 'Friedrich', 'Wilhelm', 'Otto', 'Karl', 'Heinrich', 'Ludwig', 'Gustav'];
    const lastNames = ['Schmidt', 'Müller', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
}
