// src/core/TransportSystem.ts

export interface TransportType {
  id: string;
  name: string;
  era: 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'contemporary';
  category: 'pedestrian' | 'animal' | 'animal_drawn' | 'naval' | 'rail' | 'human_powered' | 'motor_vehicle' | 'aircraft';
  speed: number;
  capacity: number;
  cost: number;
  maintenance: number;
  range: number;
  requiredTechnology: string | null;
  availableFrom: number;
  availableUntil: number | null;
  terrainModifiers: Record<string, number>;
  infrastructureRequired?: string;
  environmentalBenefit?: number;
}

export interface TradeRoute {
  id: string;
  name: string;
  period: {
    start: number;
    end: number | null;
  };
  origin: string;
  destination: string;
  mainGoods: string[];
  length: number;
  profitability: number;
  danger: number;
  culturalExchange: number;
  requiredTechnology: string | null;
  effects: {
    trade_income: number;
    prestige: number;
    cultural_influence?: number;
    diplomatic_relations?: number;
    regional_development?: number;
    technology_transfer?: number;
    [key: string]: number | undefined;
  };
}

export class TransportSystem {
  private transportTypes: Map<string, TransportType> = new Map();
  private tradeRoutes: Map<string, TradeRoute> = new Map();
  private activeRoutes: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      const [transportResponse, routesResponse] = await Promise.all([
        fetch('/src/data/json/transport-types.json'),
        fetch('/src/data/json/trade-routes.json')
      ]);

      const transportData = await transportResponse.json();
      const routesData = await routesResponse.json();

      transportData.transportTypes.forEach((transport: TransportType) => {
        this.transportTypes.set(transport.id, transport);
      });

      routesData.tradeRoutes.forEach((route: TradeRoute) => {
        this.tradeRoutes.set(route.id, route);
      });
    } catch (error) {
      console.error('Failed to load transport data:', error);
    }
  }

  getTransportType(id: string): TransportType | undefined {
    return this.transportTypes.get(id);
  }

  getAvailableTransport(year: number, technologies: string[]): TransportType[] {
    return Array.from(this.transportTypes.values()).filter(transport => {
      // Check year availability
      if (transport.availableFrom > year) return false;
      if (transport.availableUntil && transport.availableUntil < year) return false;

      // Check technology requirement
      if (transport.requiredTechnology && !technologies.includes(transport.requiredTechnology)) {
        return false;
      }

      return true;
    });
  }

  getTradeRoute(id: string): TradeRoute | undefined {
    return this.tradeRoutes.get(id);
  }

  getAvailableRoutes(year: number, technologies: string[]): TradeRoute[] {
    return Array.from(this.tradeRoutes.values()).filter(route => {
      // Check year availability
      if (route.period.start > year) return false;
      if (route.period.end && route.period.end < year) return false;

      // Check technology requirement
      if (route.requiredTechnology && !technologies.includes(route.requiredTechnology)) {
        return false;
      }

      return true;
    });
  }

  activateRoute(routeId: string): boolean {
    if (this.tradeRoutes.has(routeId)) {
      this.activeRoutes.add(routeId);
      return true;
    }
    return false;
  }

  deactivateRoute(routeId: string): void {
    this.activeRoutes.delete(routeId);
  }

  getActiveRoutes(): TradeRoute[] {
    return Array.from(this.activeRoutes)
      .map(id => this.tradeRoutes.get(id))
      .filter((r): r is TradeRoute => r !== undefined);
  }

  calculateRouteIncome(): number {
    return this.getActiveRoutes().reduce(
      (total, route) => total + route.effects.trade_income,
      0
    );
  }

  calculateCulturalExchange(): number {
    const routes = this.getActiveRoutes();
    if (routes.length === 0) return 0;

    return routes.reduce((total, route) => total + route.culturalExchange, 0) / routes.length;
  }

  calculateTransportCost(distance: number, transportId: string, terrain: string = 'plains'): number {
    const transport = this.transportTypes.get(transportId);
    if (!transport) return Infinity;

    const terrainModifier = transport.terrainModifiers[terrain] ?? 1.0;
    const time = distance / (transport.speed * terrainModifier);
    
    return transport.cost + (transport.maintenance * time);
  }
}
