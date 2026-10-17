import { describe,it,expect } from 'vitest';
import { CivicMissionSystem } from './CivicMissionSystem';
import { Kingdom } from './Kingdom';
import type { Citizen } from './CitizenSystem';
const citizen=(id='p'):Citizen=>({id,firstName:'Greta',lastName:'Weber',age:30,isAlive:true,isPlayerCharacter:false,skills:{agriculture:70,craftsmanship:60,trading:50,combat:10,literacy:40,leadership:20,diplomacy:10,medicine:20}} as Citizen);
describe('Historische Bürgeraufträge',()=>{
 it('only exposes missions in their historical periods',()=>{
  const s=new CivicMissionSystem();
  expect(s.options(1200).some(m=>m.id==='computer')).toBe(false);
  expect(s.options(2020).some(m=>m.id==='computer')).toBe(true);
  expect(s.options(2020).some(m=>m.id==='guild')).toBe(false);
 });
 it('charges upfront, completes after elapsed months and persists progress',()=>{
  const s=new CivicMissionSystem();const k=new Kingdom({name:'Test',rulerName:'Greta',foundingYear:1200});
  const c=citizen();const initial=k.resources.gold;
  s.start('one',c,k,'grain',1200,1);
  expect(k.resources.gold).toBe(initial-120);
  expect(s.advance('one',k,1200,1,()=>c)).toHaveLength(0);
  expect(s.advance('one',k,1200,2,()=>c)).toHaveLength(0);
  const restored=new CivicMissionSystem();restored.load(s.serialize(),new Set(['one']),()=>c);
  expect(restored.advance('one',k,1200,3,()=>c)).toHaveLength(1);
  expect(restored.active('one')).toHaveLength(0);
  expect(restored.advance('one',k,1200,4,()=>c)).toHaveLength(0);
 });
 it('supports historically gated civic professions and bounded local outcomes',()=>{
  const s=new CivicMissionSystem();
  expect(s.options(1200).some(m=>m.id==='mills')).toBe(true);
  expect(s.options(1200).some(m=>m.id==='printing')).toBe(false);
  expect(s.options(1500).some(m=>m.id==='printing')).toBe(true);
  expect(s.options(1800).some(m=>m.id==='rail')).toBe(false);
  expect(s.options(1900).some(m=>m.id==='rail')).toBe(true);
  const k1=new Kingdom({name:'A',rulerName:'Test',foundingYear:1200});
  const k2=new Kingdom({name:'B',rulerName:'Test',foundingYear:1200});
  const matching=citizen('a');
  matching.profession='farmer';
  matching.professionLevel=40;
  matching.personality={courage:50,intelligence:50,charisma:50,ambition:50,loyalty:50,creativity:50,discipline:70,compassion:50};
  matching.needs={food:60,shelter:60,safety:90,health:60,social:60,spiritual:60,education:60,entertainment:60};
  matching.lifeEvents=[];
  const unfamiliar={...matching,id:'b',profession:'soldier' as const,lifeEvents:[]};
  const a=new CivicMissionSystem(); const b=new CivicMissionSystem();
  a.start('a',matching,k1,'grain',1200,1);
  b.start('b',unfamiliar,k2,'grain',1200,1);
  a.advance('a',k1,1200,2,()=>matching);
  b.advance('b',k2,1200,2,()=>unfamiliar);
  a.advance('a',k1,1200,3,()=>matching);
  b.advance('b',k2,1200,3,()=>unfamiliar);
  expect(k1.resources.food).toBeGreaterThan(k2.resources.food);
  expect(matching.lifeEvents.some(x=>x.type==='achievement')).toBe(true);
 });
 it('refuses double assignment and corrupted saves',()=>{
  const s=new CivicMissionSystem();const k=new Kingdom({name:'Test',rulerName:'Greta',foundingYear:1200});
  const c=citizen();s.start('one',c,k,'grain',1200,1);
  expect(()=>s.start('one',c,k,'grain',1200,1)).toThrow();
  expect(()=>new CivicMissionSystem().load({assignments:[{playerId:'wrong',citizenId:'x'}],history:[]},new Set(['one']),()=>c)).toThrow();
 });
});