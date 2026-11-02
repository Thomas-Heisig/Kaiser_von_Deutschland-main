import { Container, Graphics } from 'pixi.js';
import type { LocalMapData } from './LocalMap';

export type MapPoint = readonly [number, number];
export interface MapLine { points: readonly MapPoint[]; width: number }
export interface MapBuilding {
  id: string; x: number; y: number; width: number; depth: number;
  roofColor?: number;
}
/** All coordinates and dimensions are metres, with x east and y south. */
export interface VectorMapScene {
  width: number; height: number;
  ground?: number;
  land?: readonly { points: readonly MapPoint[]; color: number }[];
  rivers?: readonly MapLine[];
  roads?: readonly MapLine[];
  fences?: readonly MapLine[];
  trees?: readonly { x: number; y: number; radius: number }[];
  buildings?: readonly MapBuilding[];
}

/** A texture-free PixiJS 8 scene. Camera transforms never change physical proportions.
 * Rebuild only when scene data changes; zoom/pan the returned container instead.
 * The caller owns it and must destroy it with { children: true } on replacement.
 */
export function renderVectorMap(scene: VectorMapScene, onSelect?: (id: string) => void): Container {
  if (![scene.width, scene.height].every(n => Number.isFinite(n) && n > 0)) {
    throw new Error('Die Kartenabmessungen müssen positive Meterwerte sein.');
  }
  const root = new Container();
  root.label = 'vector-map';
  const content = new Container();
  const mask = new Graphics().rect(0, 0, scene.width, scene.height).fill(0xffffff);
  root.addChild(content, mask);
  content.mask = mask;
  content.addChild(new Graphics().rect(0, 0, scene.width, scene.height).fill(scene.ground ?? 0x83977a));
  for (const area of scene.land ?? []) {
    if (area.points.length >= 3) content.addChild(new Graphics().poly(area.points.flat()).fill(area.color));
  }
  const lines = (items: readonly MapLine[], color: number) => {
    for (const line of items) {
      if (line.points.length < 2 || !Number.isFinite(line.width) || line.width <= 0) continue;
      const shape = new Graphics().moveTo(...line.points[0]);
      for (const point of line.points.slice(1)) shape.lineTo(...point);
      content.addChild(shape.stroke({ color, width: line.width, cap: 'round', join: 'round' }));
    }
  };
  lines(scene.rivers ?? [], 0x287b99);
  lines(scene.roads ?? [], 0xc5ae82);
  lines(scene.fences ?? [], 0x715239);
  for (const tree of scene.trees ?? []) {
    content.addChild(new Graphics()
      .ellipse(tree.x + tree.radius * .3, tree.y + tree.radius * .4, tree.radius, tree.radius * .8)
      .fill({ color: 0x172e21, alpha: .2 })
      .circle(tree.x, tree.y, tree.radius).fill(0x456c42)
      .circle(tree.x - tree.radius * .25, tree.y - tree.radius * .25, tree.radius * .65).fill(0x638451));
  }
  for (const building of scene.buildings ?? []) {
    if (![building.width, building.depth].every(n => Number.isFinite(n) && n > 0)) continue;
    const { x, y, width: w, depth: d } = building;
    const house = new Graphics().rect(x + .3, y + .4, w, d).fill({ color: 0x172820, alpha: .25 })
      .rect(x, y, w, d).fill(building.roofColor ?? 0x997344)
      .rect(x, y, w / 2, d).fill({ color: 0xffe4a2, alpha: .2 })
      .moveTo(x + w / 2, y).lineTo(x + w / 2, y + d).stroke({ color: 0x59452e, width: .12 });
    house.label = building.id;
    if (onSelect) {
      house.eventMode = 'static'; house.cursor = 'pointer';
      house.on('pointertap', () => onSelect(building.id));
    }
    content.addChild(house);
  }
  return root;
}

/** Existing source has projected river axes in map pixels. Widths are cartographic
 * symbols, NOT measured river widths. No unverified roads/houses are invented.
 */
export function renderLocalVectorTerrain(data: LocalMapData): Container {
  const metresPerPixel = 20000 / data.width;
  const result = renderVectorMap({
    width: data.width * metresPerPixel, height: data.height * metresPerPixel,
    rivers: data.rivers.map(river => ({
      points: river.points.map(([x, y]) => [x * metresPerPixel, y * metresPerPixel] as const),
      width: 2.3 * metresPerPixel,
    })),
  });
  result.scale.set(1 / metresPerPixel);
  return result;
}

/** Modelled example for a close-up, not a historical reconstruction of Ganderkesee. */
export const EXAMPLE_HOMESTEAD: VectorMapScene = {
  width: 40, height: 30,
  land: [{ points: [[10, 6], [26, 6], [26, 23], [10, 23]], color: 0xb3a17c }],
  roads: [{ points: [[0, 26], [18, 26], [40, 24]], width: 2 },
    { points: [[18, 26], [18, 18]], width: 1.2 }],
  fences: [{ points: [[10, 23], [10, 6], [26, 6], [26, 23], [20, 23]], width: .15 },
    { points: [[10, 23], [16, 23]], width: .15 }],
  buildings: [{ id: 'home', x: 14, y: 10, width: 6, depth: 8 }],
  trees: [{ x: 5, y: 7, radius: 2.5 }, { x: 32, y: 9, radius: 3 }, { x: 33, y: 19, radius: 2 }],
};
