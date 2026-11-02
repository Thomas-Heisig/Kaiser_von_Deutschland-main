import { Container, Graphics, Text } from 'pixi.js';
import { metresToBase } from './MapScale';
import { positionToMapPixels } from './FirstPersonLogic';
import { VILLAGE_FEATURES, VILLAGE_ROADS, roadWidth } from './SettlementWorld';

/** Real modern geometry stays separate from modeled historical game buildings. */
export function drawVillageGround(layer: Container, year: number): void {
  const shapes = new Container();
  const clip = new Graphics().rect(...bounds()).fill(0xffffff);
  shapes.mask = clip; layer.addChild(shapes, clip);
  const polygon = (points: readonly (readonly [number,number])[]): number[] => points.flatMap(([x,z]) => {
    const p = positionToMapPixels({ x,z }); return [p.x,p.y];
  });
  for (const area of VILLAGE_FEATURES.filter(f => f.kind === 'land' || f.kind === 'water')) {
    const color = area.kind === 'water' ? 0x588a99 : area.category === 'forest' ? 0x66845a
      : ['farmland','farmyard'].includes(area.category) ? 0xb2ab76 : 0x8f9c76;
    shapes.addChild(new Graphics().poly(polygon(area.points)).fill({ color, alpha: .65 }));
  }
  // Detailed current footprints are not presented as ancient/medieval buildings.
  if (year >= 1900) for (const building of VILLAGE_FEATURES.filter(f => f.kind === 'building')) {
    shapes.addChild(new Graphics().poly(polygon(building.points)).fill({ color: 0x887969, alpha: .4 })
      .stroke({ color: 0x685c4c, width: metresToBase(.15), alpha: .5 }));
  }
  for (const road of VILLAGE_ROADS) {
    const points = polygon(road.points);
    if (points.length < 4) continue;
    const g = new Graphics().moveTo(points[0], points[1]);
    for (let i=2; i<points.length; i+=2) g.lineTo(points[i], points[i+1]);
    shapes.addChild(g.stroke({ color: 0xbba982, width: metresToBase(roadWidth(road.category)), cap: 'round', join: 'round' }));
  }
  // Recorded tree locations, with modeled 2 m crowns (OSM gives no historic age).
  for (const tree of VILLAGE_FEATURES.filter(f => f.kind === 'tree')) {
    const [x,z] = tree.points[0], p = positionToMapPixels({x,z}), r = metresToBase(2);
    shapes.addChild(new Graphics().ellipse(p.x+r*.3,p.y+r*.45,r,r*.8).fill({color:0x233c27,alpha:.22})
      .circle(p.x,p.y,r).fill(0x557345)
      .circle(p.x-r*.25,p.y-r*.3,r*.65).fill(0x6f8d54));
  }
}
function bounds(): [number,number,number,number] {
  const p = positionToMapPixels({x:-390,z:370});
  return [p.x,p.y,metresToBase(780),metresToBase(740)];
}

export function villageLabel(text: string): Text {
  const label = new Text({ text, style: { fontFamily: 'Segoe UI', fontSize: 12,
    fill: 0xfff4da, stroke: { color: 0x26382d, width: 3 }, align: 'center' } });
  label.anchor.set(.5, 0); label.eventMode = 'none';
  return label;
}
