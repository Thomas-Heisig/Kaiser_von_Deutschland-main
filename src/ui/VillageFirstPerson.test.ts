import { describe, expect, it } from 'vitest';
import { Mesh, BoxGeometry } from 'three';
import { VILLAGE_BUILDINGS } from './SettlementWorld';
import { buildVillageExterior, disposeVillageExterior } from './VillageFirstPerson';

describe('shared village in Three.js', () => {
  it('uses exactly the map footprints and disposes the exterior independently', () => {
    const active = VILLAGE_BUILDINGS.slice(0,3);
    const group = buildVillageExterior(active);
    for (const b of active) {
      const wall = group.getObjectByName(b.type) as Mesh<BoxGeometry>;
      expect(wall.position.x).toBe(b.x); expect(wall.position.z).toBe(-b.z);
      expect(wall.geometry.parameters).toMatchObject({width:b.width,depth:b.depth,height:b.height});
    }
    expect(group.getObjectByName(VILLAGE_BUILDINGS[4].type)).toBeUndefined();
    let disposed = false;
    const wall = group.getObjectByName(active[0].type) as Mesh;
    wall.geometry.addEventListener('dispose',()=>{disposed=true;});
    disposeVillageExterior(group);
    expect(disposed).toBe(true);
  });
});
