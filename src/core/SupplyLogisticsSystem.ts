/**
 * Supply Lines and Logistics System
 * 
 * Manages military supply chains, logistics, and attrition.
 * Critical for maintaining armies in the field.
 */

export interface SupplyRoute {
  id: string;
  from: string; // regionId or cityId
  to: string; // regionId or armyId
  distance: number; // km
  terrain: string[];
  capacity: number; // tons per month
  security: number; // 0-100, higher = more secure
  active: boolean;
}

export interface SupplyDepot {
  id: string;
  location: string; // regionId
  foodStored: number; // tons
  ammunitionStored: number; // tons
  equipmentStored: number; // units
  maxCapacity: number; // tons
  garrison: number; // guards
  infrastructure: number; // 0-100
}

export interface ArmySupplyStatus {
  armyId: string;
  location: string;
  size: number; // number of troops
  
  /** Current supplies (days worth) */
  foodDays: number;
  ammunitionDays: number;
  equipmentCondition: number; // 0-100
  
  /** Consumption rates */
  foodConsumptionPerDay: number; // tons
  ammunitionConsumptionPerDay: number; // tons in combat
  
  /** Supply line connection */
  connectedToSupply: boolean;
  supplyRouteIds: string[];
  supplyEfficiency: number; // 0-100, how much reaches the army
  
  /** Attrition */
  attritionRate: number; // % per day
  totalAttrition: number; // cumulative losses
  
  /** Morale impact */
  moraleModifier: number; // -50 to +50
}

export interface LogisticsEvent {
  type: 'supply_delivered' | 'convoy_raided' | 'depot_captured' | 'route_cut' | 'attrition';
  timestamp: number;
  location: string;
  armyId?: string;
  routeId?: string;
  depotId?: string;
  impact: {
    foodLost?: number;
    ammunitionLost?: number;
    troopsLost?: number;
    gold?: number;
  };
  description: string;
}

export class SupplyLogisticsSystem {
  private supplyRoutes: Map<string, SupplyRoute> = new Map();
  private supplyDepots: Map<string, SupplyDepot> = new Map();
  private armySupplyStatus: Map<string, ArmySupplyStatus> = new Map();
  private logisticsEvents: LogisticsEvent[] = [];
  private maxEventHistory = 200;

  /** Supply consumption constants */
  private readonly FOOD_PER_SOLDIER_PER_DAY = 0.015; // tons (15kg)
  private readonly AMMO_PER_SOLDIER_IN_COMBAT = 0.005; // tons (5kg)
  private readonly ATTRITION_BASE_RATE = 0.001; // 0.1% per day normally

  /**
   * Create supply route
   */
  public createSupplyRoute(
    id: string,
    from: string,
    to: string,
    distance: number,
    terrain: string[],
    infrastructure: number = 50
  ): SupplyRoute {
    // Calculate capacity based on distance and terrain
    let capacityModifier = 1.0;
    
    for (const t of terrain) {
      switch (t) {
        case 'mountains':
          capacityModifier *= 0.4;
          break;
        case 'forest':
          capacityModifier *= 0.6;
          break;
        case 'swamp':
          capacityModifier *= 0.3;
          break;
        case 'desert':
          capacityModifier *= 0.5;
          break;
        case 'plains':
          capacityModifier *= 1.2;
          break;
      }
    }

    // Infrastructure affects capacity
    capacityModifier *= (infrastructure / 100);

    // Distance affects capacity (longer = harder)
    const distanceModifier = Math.max(0.2, 1 - (distance / 1000));

    const capacity = 100 * capacityModifier * distanceModifier;

    const route: SupplyRoute = {
      id,
      from,
      to,
      distance,
      terrain,
      capacity,
      security: infrastructure, // Better infrastructure = more security
      active: true
    };

    this.supplyRoutes.set(id, route);
    return route;
  }

  /**
   * Create supply depot
   */
  public createSupplyDepot(
    id: string,
    location: string,
    maxCapacity: number = 1000,
    garrison: number = 100
  ): SupplyDepot {
    const depot: SupplyDepot = {
      id,
      location,
      foodStored: 0,
      ammunitionStored: 0,
      equipmentStored: 0,
      maxCapacity,
      garrison,
      infrastructure: 50
    };

    this.supplyDepots.set(id, depot);
    return depot;
  }

  /**
   * Initialize army supply status
   */
  public initializeArmySupply(
    armyId: string,
    location: string,
    size: number,
    initialFoodDays: number = 30,
    initialAmmoDays: number = 10
  ): ArmySupplyStatus {
    const foodConsumption = size * this.FOOD_PER_SOLDIER_PER_DAY;
    
    const status: ArmySupplyStatus = {
      armyId,
      location,
      size,
      foodDays: initialFoodDays,
      ammunitionDays: initialAmmoDays,
      equipmentCondition: 100,
      foodConsumptionPerDay: foodConsumption,
      ammunitionConsumptionPerDay: size * this.AMMO_PER_SOLDIER_IN_COMBAT,
      connectedToSupply: false,
      supplyRouteIds: [],
      supplyEfficiency: 0,
      attritionRate: this.ATTRITION_BASE_RATE,
      totalAttrition: 0,
      moraleModifier: 0
    };

    this.armySupplyStatus.set(armyId, status);
    return status;
  }

  /**
   * Connect army to supply route
   */
  public connectArmyToSupply(armyId: string, routeId: string): boolean {
    const army = this.armySupplyStatus.get(armyId);
    const route = this.supplyRoutes.get(routeId);
    
    if (!army || !route || !route.active) return false;

    if (!army.supplyRouteIds.includes(routeId)) {
      army.supplyRouteIds.push(routeId);
    }
    
    army.connectedToSupply = army.supplyRouteIds.length > 0;
    this.updateSupplyEfficiency(armyId);
    
    return true;
  }

  /**
   * Update supply efficiency based on routes
   */
  private updateSupplyEfficiency(armyId: string): void {
    const army = this.armySupplyStatus.get(armyId);
    if (!army) return;

    if (army.supplyRouteIds.length === 0) {
      army.supplyEfficiency = 0;
      return;
    }

    // Calculate average efficiency from all routes
    let totalEfficiency = 0;
    let activeRoutes = 0;

    for (const routeId of army.supplyRouteIds) {
      const route = this.supplyRoutes.get(routeId);
      if (!route || !route.active) continue;

      // Efficiency based on security and distance
      const securityFactor = route.security / 100;
      const distanceFactor = Math.max(0.3, 1 - (route.distance / 2000));
      const routeEfficiency = securityFactor * distanceFactor * 100;

      totalEfficiency += routeEfficiency;
      activeRoutes++;
    }

    army.supplyEfficiency = activeRoutes > 0 ? totalEfficiency / activeRoutes : 0;
  }

  /**
   * Process daily supply consumption and attrition
   */
  public processDailySupply(
    armyId: string,
    inCombat: boolean = false,
    weatherPenalty: number = 0 // 0-50
  ): {
    foodConsumed: number;
    ammoConsumed: number;
    attritionLosses: number;
    moraleChange: number;
  } {
    const army = this.armySupplyStatus.get(armyId);
    if (!army) {
      return { foodConsumed: 0, ammoConsumed: 0, attritionLosses: 0, moraleChange: 0 };
    }

    // Food consumption
    const foodConsumed = army.foodConsumptionPerDay;
    army.foodDays = Math.max(0, army.foodDays - 1);

    // Ammunition consumption (only in combat)
    let ammoConsumed = 0;
    if (inCombat) {
      ammoConsumed = army.ammunitionConsumptionPerDay;
      army.ammunitionDays = Math.max(0, army.ammunitionDays - 1);
    }

    // Supply from routes
    if (army.connectedToSupply && army.supplyEfficiency > 0) {
      const foodResupply = (army.supplyEfficiency / 100) * 2; // 2 days per efficient day
      const ammoResupply = (army.supplyEfficiency / 100) * 1;
      
      army.foodDays = Math.min(90, army.foodDays + foodResupply); // Max 90 days
      army.ammunitionDays = Math.min(30, army.ammunitionDays + ammoResupply); // Max 30 days
    }

    // Calculate attrition
    let attritionRate = this.ATTRITION_BASE_RATE;

    // No food = severe attrition
    if (army.foodDays === 0) {
      attritionRate += 0.05; // 5% per day!
    } else if (army.foodDays < 7) {
      attritionRate += 0.02; // 2% per day
    }

    // No ammo in combat = increased casualties
    if (inCombat && army.ammunitionDays === 0) {
      attritionRate += 0.03;
    }

    // Weather effects
    attritionRate += (weatherPenalty / 100) * 0.02;

    // Poor equipment
    if (army.equipmentCondition < 50) {
      attritionRate += 0.01;
    }

    // Apply attrition
    const attritionLosses = Math.floor(army.size * attritionRate);
    army.totalAttrition += attritionLosses;
    army.size = Math.max(0, army.size - attritionLosses);
    army.attritionRate = attritionRate;

    // Equipment degradation
    army.equipmentCondition = Math.max(0, army.equipmentCondition - 0.5);
    if (inCombat) {
      army.equipmentCondition = Math.max(0, army.equipmentCondition - 2);
    }

    // Morale effects
    let moraleChange = 0;
    
    if (army.foodDays === 0) {
      moraleChange -= 10;
    } else if (army.foodDays < 7) {
      moraleChange -= 3;
    } else if (army.connectedToSupply && army.supplyEfficiency > 80) {
      moraleChange += 2;
    }

    if (inCombat && army.ammunitionDays === 0) {
      moraleChange -= 15;
    }

    army.moraleModifier = Math.max(-50, Math.min(50, army.moraleModifier + moraleChange));

    // Log attrition event if significant
    if (attritionLosses > army.size * 0.01) { // More than 1% losses
      this.logEvent({
        type: 'attrition',
        timestamp: Date.now(),
        location: army.location,
        armyId,
        impact: {
          troopsLost: attritionLosses
        },
        description: `Army suffered ${attritionLosses} casualties from attrition`
      });
    }

    return {
      foodConsumed,
      ammoConsumed,
      attritionLosses,
      moraleChange
    };
  }

  /**
   * Raid/cut supply route (enemy action)
   */
  public raidSupplyRoute(routeId: string, raidStrength: number): {
    success: boolean;
    foodDestroyed: number;
    ammoDestroyed: number;
    goldLost: number;
  } {
    const route = this.supplyRoutes.get(routeId);
    if (!route || !route.active) {
      return { success: false, foodDestroyed: 0, ammoDestroyed: 0, goldLost: 0 };
    }

    // Success chance based on route security vs raid strength
    const successChance = Math.max(10, Math.min(90, 100 - route.security + raidStrength));
    const success = Math.random() * 100 < successChance;

    if (!success) return { success: false, foodDestroyed: 0, ammoDestroyed: 0, goldLost: 0 };

    // Calculate losses
    const capacityLost = route.capacity * 0.3; // 30% of monthly capacity lost
    const foodDestroyed = capacityLost * 0.6;
    const ammoDestroyed = capacityLost * 0.3;
    const goldLost = capacityLost * 100; // Approximate value

    // Reduce route security temporarily
    route.security = Math.max(0, route.security - 20);

    this.logEvent({
      type: 'convoy_raided',
      timestamp: Date.now(),
      location: route.to,
      routeId,
      impact: {
        foodLost: foodDestroyed,
        ammunitionLost: ammoDestroyed,
        gold: goldLost
      },
      description: `Supply convoy on route ${routeId} was raided`
    });

    return { success: true, foodDestroyed, ammoDestroyed, goldLost };
  }

  /**
   * Permanently cut supply route
   */
  public cutSupplyRoute(routeId: string): boolean {
    const route = this.supplyRoutes.get(routeId);
    if (!route) return false;

    route.active = false;

    // Update all armies using this route
    for (const army of this.armySupplyStatus.values()) {
      if (army.supplyRouteIds.includes(routeId)) {
        this.updateSupplyEfficiency(army.armyId);
      }
    }

    this.logEvent({
      type: 'route_cut',
      timestamp: Date.now(),
      location: route.to,
      routeId,
      impact: {},
      description: `Supply route ${routeId} has been cut`
    });

    return true;
  }

  /**
   * Stock supply depot
   */
  public stockDepot(
    depotId: string,
    food: number = 0,
    ammunition: number = 0,
    equipment: number = 0
  ): boolean {
    const depot = this.supplyDepots.get(depotId);
    if (!depot) return false;

    const totalToAdd = food + ammunition + equipment;
    const currentTotal = depot.foodStored + depot.ammunitionStored + depot.equipmentStored;
    
    if (currentTotal + totalToAdd > depot.maxCapacity) {
      return false; // Not enough capacity
    }

    depot.foodStored += food;
    depot.ammunitionStored += ammunition;
    depot.equipmentStored += equipment;

    return true;
  }

  /**
   * Log logistics event
   */
  private logEvent(event: LogisticsEvent): void {
    this.logisticsEvents.push(event);
    if (this.logisticsEvents.length > this.maxEventHistory) {
      this.logisticsEvents.shift();
    }
  }

  /**
   * Get army supply status
   */
  public getArmySupplyStatus(armyId: string): ArmySupplyStatus | undefined {
    return this.armySupplyStatus.get(armyId);
  }

  /**
   * Get supply route
   */
  public getSupplyRoute(routeId: string): SupplyRoute | undefined {
    return this.supplyRoutes.get(routeId);
  }

  /**
   * Get recent logistics events
   */
  public getRecentEvents(count: number = 50): LogisticsEvent[] {
    return this.logisticsEvents.slice(-count);
  }

  /**
   * Serialize for save
   */
  public serialize(): any {
    return {
      supplyRoutes: Array.from(this.supplyRoutes.entries()),
      supplyDepots: Array.from(this.supplyDepots.entries()),
      armySupplyStatus: Array.from(this.armySupplyStatus.entries()),
      logisticsEvents: this.logisticsEvents.slice(-100)
    };
  }

  /**
   * Deserialize from save
   */
  public deserialize(data: any): void {
    if (data.supplyRoutes) {
      this.supplyRoutes = new Map(data.supplyRoutes);
    }
    if (data.supplyDepots) {
      this.supplyDepots = new Map(data.supplyDepots);
    }
    if (data.armySupplyStatus) {
      this.armySupplyStatus = new Map(data.armySupplyStatus);
    }
    if (data.logisticsEvents) {
      this.logisticsEvents = data.logisticsEvents;
    }
  }
}
