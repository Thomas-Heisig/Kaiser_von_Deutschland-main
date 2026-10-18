import {describe,it,expect} from 'vitest';
import {SZENE,kachelPosition,werkstattKacheln} from './WorkshopSceneModel';
describe('Isolierte Werkstattszene',()=>{
 it('hat 144 feste Kacheln ohne doppelte Positionen',()=>{
  const cells=werkstattKacheln();
  expect(cells).toHaveLength(144);
  expect(new Set(cells.map(x=>x.x+':'+x.y)).size).toBe(144);
  expect(cells.every(x=>x.spalte>=0&&x.spalte<12&&x.zeile>=0&&x.zeile<12)).toBe(true);
 });
 it('besitzt genau ein Gebäude, ein Licht und 24 Partikel',()=>{
  expect([SZENE.gebaeude,SZENE.lichter,SZENE.rauch]).toEqual([1,1,24]);
  expect(kachelPosition(5,5)).toEqual({x:0,y:160});
 });
});
