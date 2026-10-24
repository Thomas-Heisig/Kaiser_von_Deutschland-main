export type Terrain = 'Ebene' | 'Wald' | 'Hügelland' | 'Flusstal';
export interface WorldRegion {
  id: string; rivalId?: string; x: number; y: number; terrain: Terrain;
  discovered: boolean; connections: string[];
}
export interface WorldJourney { destination: string; remaining: number }
export interface StrategyWorldSnapshot {
  version: 1; seed: number; regions: WorldRegion[]; currentRegion: string; journey: WorldJourney | null;
}
export const WORLD_HOME = 'home';
const TERRAINS: Terrain[] = ['Ebene','Wald','Hügelland','Flusstal'];
const INITIAL_POSITIONS = [[-115,155],[1050,150],[1070,465],[-120,490],[490,-125],[470,760]];

/** Fictional strategy geography. Coordinates never claim to be historical borders. */
export class StrategyWorld {
  private regions: WorldRegion[] = [{id:WORLD_HOME,x:480,y:320,terrain:'Ebene',discovered:true,connections:[]}];
  private currentRegion = WORLD_HOME;
  private journey: WorldJourney | null = null;
  constructor(private seed = 1200) {}

  public sync(rivalIds: readonly string[]): void {
    for (const rivalId of [...new Set(rivalIds)].sort()) {
      if (this.regions.some(r => r.rivalId === rivalId)) continue;
      const index = this.regions.length - 1;
      const [x,y] = INITIAL_POSITIONS[index] ?? [(-1 + index % 5) * 360, 1080 + Math.floor((index - 6) / 5) * 260];
      let hash = this.seed >>> 0;
      for (const char of rivalId) hash = (Math.imul(hash ^ char.charCodeAt(0),16777619)) >>> 0;
      const id = 'rival:' + rivalId;
      this.regions.push({id,rivalId,x,y,terrain:TERRAINS[hash % TERRAINS.length],discovered:false,connections:[WORLD_HOME]});
      this.regions[0].connections.push(id);
    }
  }

  public overview(activeIds: readonly string[]): StrategyWorldSnapshot {
    const snapshot = this.serialize();
    snapshot.regions = snapshot.regions.filter(r => !r.rivalId || activeIds.includes(r.rivalId));
    const active = new Set(snapshot.regions.map(r => r.id));
    for (const region of snapshot.regions) region.connections = region.connections.filter(id => active.has(id));
    if (!active.has(snapshot.currentRegion)) snapshot.currentRegion = WORLD_HOME;
    if (snapshot.journey && !active.has(snapshot.journey.destination)) snapshot.journey = null;
    return snapshot;
  }

  public plan(destination: string, activeIds: readonly string[]): {months:number;gold:number;food:number} {
    const world = this.overview(activeIds);
    if (world.journey) throw new Error('Es ist bereits eine Reise unterwegs.');
    if (!world.regions.some(r => r.id === destination)) throw new Error('Diese Region ist nicht erreichbar.');
    if (destination === world.currentRegion) throw new Error('Du befindest dich bereits in dieser Region.');
    const months = destination === WORLD_HOME || world.currentRegion === WORLD_HOME ? 1 : 2;
    return {months,gold:destination === WORLD_HOME ? 0 : months * 150,food:destination === WORLD_HOME ? 0 : months * 50};
  }

  public travel(destination: string, activeIds: readonly string[]): void {
    const plan = this.plan(destination,activeIds);
    this.journey = {destination,remaining:plan.months};
  }
  public discover(id:string):void {const region=this.regions.find(r=>r.id===id);if(region)region.discovered=true;}

  public processMonth(activeIds: readonly string[]): WorldRegion | null {
    const active = this.overview(activeIds);
    this.currentRegion = active.currentRegion;
    this.journey = active.journey;
    if (!this.journey || --this.journey.remaining > 0) return null;
    this.currentRegion = this.journey.destination;
    this.journey = null;
    const region = this.regions.find(r => r.id === this.currentRegion)!;
    region.discovered = true;
    return {...region,connections:[...region.connections]};
  }

  public serialize(): StrategyWorldSnapshot {
    return {version:1,seed:this.seed,regions:this.regions.map(r=>({...r,connections:[...r.connections]})),
      currentRegion:this.currentRegion,journey:this.journey ? {...this.journey} : null};
  }

  public static restore(value: StrategyWorldSnapshot): StrategyWorld {
    const invalid = (): never => {throw new Error('Beschädigte Strategiewelt im Spielstand.');};
    if (!value || value.version !== 1 || !Number.isSafeInteger(value.seed) || !Array.isArray(value.regions) ||
      !value.regions.length || value.regions.length > 10000) invalid();
    const ids = new Set<string>();
    for (const r of value.regions) {
      if (!r || typeof r.id !== 'string' || ids.has(r.id) || !Number.isFinite(r.x) || !Number.isFinite(r.y) ||
        Math.abs(r.x) > 1000000 || Math.abs(r.y) > 1000000 || !TERRAINS.includes(r.terrain) ||
        typeof r.discovered !== 'boolean' || !Array.isArray(r.connections) ||
        (r.id !== WORLD_HOME && (typeof r.rivalId !== 'string' || r.id !== 'rival:' + r.rivalId))) invalid();
      ids.add(r.id);
    }
    if (value.regions[0].id !== WORLD_HOME || value.regions[0].rivalId !== undefined || !value.regions[0].discovered ||
      !value.regions.some(r=>r.id===value.currentRegion && r.discovered) ||
      value.regions.some(r=>new Set(r.connections).size!==r.connections.length ||
        r.connections.some(id=>id===r.id || !ids.has(id) || !value.regions.find(other=>other.id===id)?.connections.includes(r.id))) ||
      (value.journey !== null && (!value.journey || !ids.has(value.journey.destination) ||
        value.journey.destination === value.currentRegion ||
        !Number.isInteger(value.journey.remaining) || value.journey.remaining < 1 || value.journey.remaining > 2))) invalid();
    const world = new StrategyWorld(value.seed);
    world.regions = value.regions.map(r=>({...r,connections:[...r.connections]}));
    world.currentRegion = value.currentRegion;
    world.journey = value.journey ? {...value.journey} : null;
    return world;
  }
}
