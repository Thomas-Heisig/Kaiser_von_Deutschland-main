import { describe, expect, it } from 'vitest';
import { VILLAGE_BUILDINGS, VILLAGE_ROADS, geographicToLocal } from './SettlementWorld';
import { DWELLING_MAP_POSITION, positionToMapPixels, step } from './FirstPersonLogic';
import { HOME_LAT, HOME_LON, METRES_PER_BASE_PIXEL } from './MapScale';
import { DWELLING_ANCHOR } from './MapScale';
import localMap from '../../public/maps/ganderkesee-map.json';

describe('walkable real village', () => {
  it('anchors real ways to the same home in both renderers', () => {
    expect([DWELLING_ANCHOR.x,DWELLING_ANCHOR.y]).toEqual(localMap.places.home);
    expect([HOME_LON,HOME_LAT]).toEqual([8.5465,53.0327]);
    expect(geographicToLocal([HOME_LON, HOME_LAT])).toEqual([-20, 15]);
    expect(positionToMapPixels({ x: 0, z: 0 })).toEqual(DWELLING_MAP_POSITION);
    expect(VILLAGE_ROADS.some(r => r.name === 'Im Knick')).toBe(true);
    expect(VILLAGE_ROADS.some(r => r.name === 'Ring')).toBe(true);
  });
  it('places every representative district within a 500 m connected walking route', () => {
    expect(VILLAGE_BUILDINGS).toHaveLength(16);
    expect(new Set(VILLAGE_BUILDINGS.map(b => b.sourceId)).size).toBe(16);
    for (const b of VILLAGE_BUILDINGS) {
      expect(b.walkingMetres, b.type).toBeLessThanOrEqual(500);
      expect(b.route.length).toBeGreaterThan(2);
      const length = b.route.reduce((sum,p,i) => i ? sum + Math.hypot(p[0]-b.route[i-1][0],p[1]-b.route[i-1][1]) : sum, 0);
      expect(length).toBeCloseTo(b.walkingMetres);
      expect(Math.hypot(b.x,b.z)).toBeLessThan(230);
      expect(b.width / METRES_PER_BASE_PIXEL).toBeLessThan(1);
    }
  });
  it('allows leaving the 24 m yard without walking through a neighboring building', () => {
    expect(step({x:0,z:10,yaw:0},0,{forward:1,strafe:0},5).z).toBeGreaterThan(12);
    const b = VILLAGE_BUILDINGS[0];
    const start = { x:b.x-b.width/2-2, z:b.z, yaw:90 };
    expect(step(start,0,{forward:1,strafe:0},10,[b]).x).toBeLessThan(b.x-b.width/2);
  });
  it('keeps the advertised walking routes traversable with the actual collision model', () => {
    for (const b of VILLAGE_BUILDINGS) {
      let state = { x:0,z:4.6,yaw:0 };
      for (const [x,z] of b.route.slice(1)) {
        const length = Math.hypot(x-state.x,z-state.z);
        state.yaw = Math.atan2(x-state.x,z-state.z)*180/Math.PI;
        state = step(state,0,{forward:1,strafe:0},length/2.2,VILLAGE_BUILDINGS);
        expect(Math.hypot(state.x-x,state.z-z), b.type).toBeLessThan(.2);
      }
    }
  });
});
