import source from '../../public/maps/ganderkesee-village.json';
import { DWELLING_OFFSET_METRES, HOME_LAT, HOME_LON, METRES_PER_DEG_LAT, METRES_PER_DEG_LON_HOME } from './MapScale';
import { SETTLEMENT_DISTRICTS, type SettlementDistrict } from './SettlementSceneModel';

/** Shared local coordinates: metres east (+x), north (+z), relative to the home. */
export type WorldPoint = readonly [number, number];
export const VILLAGE_VIEW_WIDTH = 520;
export const WALKABLE_EXTENT = 330;
export const VILLAGE_ATTRIBUTION = source.attribution;
export function geographicToLocal([lon, lat]: readonly number[]): WorldPoint {
  return [(lon - HOME_LON) * METRES_PER_DEG_LON_HOME - DWELLING_OFFSET_METRES.east,
    (lat - HOME_LAT) * METRES_PER_DEG_LAT + DWELLING_OFFSET_METRES.south];
}
export const VILLAGE_FEATURES = source.features.map(feature => ({
  ...feature, points: feature.points.map(geographicToLocal),
}));
export const VILLAGE_ROADS = VILLAGE_FEATURES.filter(f => f.kind === 'road');
export const walkableRoads = VILLAGE_ROADS.filter(f => !['private','no'].includes(f.access)
  && f.foot !== 'no' && !['steps','cycleway'].includes(f.category));

const graph = new Map<number, { point: WorldPoint; edges: Map<number, number> }>();
for (const road of walkableRoads) {
  road.nodes?.forEach((id, i) => {
    if (!graph.has(id)) graph.set(id, { point: road.points[i], edges: new Map() });
    if (i) {
      const previous = road.nodes![i - 1];
      const length = Math.hypot(road.points[i][0] - road.points[i - 1][0], road.points[i][1] - road.points[i - 1][1]);
      graph.get(id)!.edges.set(previous, length); graph.get(previous)!.edges.set(id, length);
    }
  });
}
const distance = (a: WorldPoint, b: WorldPoint): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const door: WorldPoint = [0, 4];
const start = [...graph.keys()].sort((a, b) => distance(graph.get(a)!.point, door) - distance(graph.get(b)!.point, door))[0];
const costs = new Map<number, number>([[start, distance(door, graph.get(start)!.point)]]);
const parents = new Map<number, number>();
const pending = new Set(graph.keys());
while (pending.size) {
  let current: number | undefined, best = Infinity;
  for (const id of pending) if ((costs.get(id) ?? Infinity) < best) { current = id; best = costs.get(id)!; }
  if (current === undefined || best > 650) break;
  pending.delete(current);
  for (const [id, length] of graph.get(current)!.edges) {
    if (best + length < (costs.get(id) ?? Infinity)) { costs.set(id, best + length); parents.set(id, current); }
  }
}

export interface VillageBuilding {
  type: SettlementDistrict['type']; name: string; sourceId: number;
  x: number; z: number; width: number; depth: number; height: number;
  route: WorldPoint[]; walkingMetres: number;
}
const candidates = VILLAGE_FEATURES.filter(f => f.kind === 'building').map(f => {
  const xs = f.points.map(p => p[0]), zs = f.points.map(p => p[1]);
  const width = Math.max(...xs) - Math.min(...xs), depth = Math.max(...zs) - Math.min(...zs);
  return { f, x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2, width, depth };
}).filter(b => Math.hypot(b.x, b.z) > 18 && Math.hypot(b.x, b.z) < 230 && b.width >= 8 && b.depth >= 8)
  .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));

/** Real location references, but use and dimensions are explicitly game models.
 * Each representative building gets a connected walking route over OSM ways.
 * The short links from doors to the network are modelled access paths.
 */
export const VILLAGE_BUILDINGS: VillageBuilding[] = [];
const used = new Set<number>();
for (const district of [...SETTLEMENT_DISTRICTS].sort((a, b) => Number(b.type === 'churches') - Number(a.type === 'churches'))) {
  for (const candidate of candidates) {
    if (used.has(candidate.f.id) || (district.type === 'churches' && candidate.f.category !== 'church')) continue;
    if (VILLAGE_BUILDINGS.some(b => Math.hypot(b.x - candidate.x, b.z - candidate.z) < 22)) continue;
    const width = Math.min(candidate.width, district.type === 'churches' ? 16 : 10);
    const depth = Math.min(candidate.depth, district.type === 'churches' ? 24 : 12);
    const entrance: WorldPoint = [candidate.x, candidate.z + depth / 2 + 1];
    const nearest = [...costs.keys()].sort((a,b) => distance(graph.get(a)!.point, entrance) - distance(graph.get(b)!.point, entrance))[0];
    const walkingMetres = costs.get(nearest)! + distance(graph.get(nearest)!.point, entrance);
    if (walkingMetres > 500) continue;
    const path: WorldPoint[] = [entrance];
    let cursor: number | undefined = nearest;
    while (cursor !== undefined) { path.push(graph.get(cursor)!.point); cursor = parents.get(cursor); }
    path.push(door); path.reverse();
    VILLAGE_BUILDINGS.push({ type: district.type, name: district.name, sourceId: candidate.f.id,
      x: candidate.x, z: candidate.z, width, depth, height: district.type === 'churches' ? 7 : 3.2,
      route: path, walkingMetres });
    used.add(candidate.f.id); break;
  }
}

// Re-route after every footprint is known. A nearest-node connector alone can
// cross a neighbour's wall; include clearance and choose the accessible door side.
const obstacles = [{ x:0,z:0,width:6,depth:8 }, ...VILLAGE_BUILDINGS];
function clearSegment(a: WorldPoint, b: WorldPoint): boolean {
  return !obstacles.some(box => {
    let enter = 0, leave = 1;
    const axes = [[a[0],b[0],box.x,box.width], [a[1],b[1],box.z,box.depth]];
    for (const [from,to,centre,size] of axes) {
      const low=centre-size/2-.4, high=centre+size/2+.4, delta=to-from;
      if (Math.abs(delta)<1e-9) { if (from<low || from>high) return false; }
      else { const t0=(low-from)/delta,t1=(high-from)/delta;
        enter=Math.max(enter,Math.min(t0,t1)); leave=Math.min(leave,Math.max(t0,t1)); }
      if (enter>leave) return false;
    }
    return true;
  });
}
const safeDoor: WorldPoint = [0,4.6];
const safeStart = [...graph.keys()].filter(id => clearSegment(safeDoor,graph.get(id)!.point))
  .sort((a,b) => distance(safeDoor,graph.get(a)!.point)-distance(safeDoor,graph.get(b)!.point))[0];
costs.clear(); parents.clear();
costs.set(safeStart,distance(safeDoor,graph.get(safeStart)!.point));
const open = new Set(graph.keys());
while (open.size) {
  let current: number | undefined, best=Infinity;
  for (const id of open) if ((costs.get(id)??Infinity)<best) {current=id;best=costs.get(id)!;}
  if (current===undefined || best>650) break;
  open.delete(current);
  for (const [id,length] of graph.get(current)!.edges) {
    if (best+length<(costs.get(id)??Infinity) && clearSegment(graph.get(current)!.point,graph.get(id)!.point)) {
      costs.set(id,best+length);parents.set(id,current);
    }
  }
}
for (const building of VILLAGE_BUILDINGS) {
  const entrances: WorldPoint[] = [[building.x,building.z+building.depth/2+1],
    [building.x,building.z-building.depth/2-1], [building.x-building.width/2-1,building.z],
    [building.x+building.width/2+1,building.z]];
  const options = entrances.flatMap(entrance => [...costs.keys()]
    .filter(id => distance(entrance,graph.get(id)!.point)<40 && clearSegment(entrance,graph.get(id)!.point))
    .map(id => ({id,entrance,length:costs.get(id)!+distance(entrance,graph.get(id)!.point)})))
    .sort((a,b)=>a.length-b.length);
  if (!options.length) throw new Error('Kein begehbarer Zugang: '+building.type);
  const choice=options[0], route: WorldPoint[]=[choice.entrance];
  let cursor: number|undefined=choice.id;
  while (cursor!==undefined) { route.push(graph.get(cursor)!.point);cursor=parents.get(cursor); }
  route.push(safeDoor);route.reverse();
  building.route=route;building.walkingMetres=choice.length;
}

/** Historical dates here are evidence gates, never inferred from modern OSM. */
export function villageBuildingName(building: VillageBuilding, year: number): string {
  if (building.type === 'churches' && year < 1052) return 'Versammlungsplatz';
  return building.name;
}
export function roadWidth(category: string): number {
  return ['footway','path','pedestrian','steps'].includes(category) ? 1.5 : category === 'service' ? 2.5 : 4;
}
