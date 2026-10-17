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
 it('refuses double assignment and corrupted saves',()=>{
  const s=new CivicMissionSystem();const k=new Kingdom({name:'Test',rulerName:'Greta',foundingYear:1200});
  const c=citizen();s.start('one',c,k,'grain',1200,1);
  expect(()=>s.start('one',c,k,'grain',1200,1)).toThrow();
  expect(()=>new CivicMissionSystem().load({assignments:[{playerId:'wrong',citizenId:'x'}],history:[]},new Set(['one']),()=>c)).toThrow();
 });
});