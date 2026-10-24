import {describe,it,expect} from 'vitest';
import {Kingdom} from './Kingdom';
import {RegionalProvisioning} from './RegionalProvisioning';
const kingdom=()=>new Kingdom({name:'Geest',rulerName:'Test',startingResources:{gold:50000,food:50000,wood:5000,stone:5000}});
describe('Regional provision decisions',()=>{
  it('leaves well supplied realms stable across a century without inventing migration',()=>{
    const k=kingdom(),s=new RegionalProvisioning(),population=k.population.peasants;
    for(let month=1;month<=1200;month++)expect(s.advance(k,month)).toEqual([]);
    expect(k.population.peasants).toBe(population);
    expect(s.overview(k,1200).every(r=>r.hunger===0&&r.emigrated===0)).toBe(true);
  });
  it('connects shortages to persistent worker losses and does not advance a month twice',()=>{
    const k=kingdom(),s=new RegionalProvisioning();k.resources.food=0;
    const population=k.population.peasants,messages:string[]=[];
    for(let month=1;month<=10;month++)messages.push(...s.advance(k,month));
    expect(messages.some(m=>m.includes('Versorgungskrise'))).toBe(true);
    expect(messages.some(m=>m.includes('wandern'))).toBe(true);
    const lost=s.overview(k,10).reduce((sum,r)=>sum+r.emigrated,0);
    expect(population-k.population.peasants).toBe(lost);
    const snapshot=s.serialize();s.advance(k,10);expect(s.serialize()).toEqual(snapshot);
    expect(s.overview(k,10)[2].hunger).toBeGreaterThan(s.overview(k,10)[0].hunger);
    k.resources.food=50000;
    for(let month=11;month<=18;month++)s.advance(k,month);
    expect(s.overview(k,18).every(r=>r.hunger===0)).toBe(true);
  });
  it('charges atomically, lasts three monthly steps and round-trips BCE state',()=>{
    const k=kingdom(),s=new RegionalProvisioning(),tick=-23987;
    s.act('outlying','relief',k,tick);
    expect(k.resources.gold).toBe(49880);expect(k.resources.food).toBe(49820);
    const resources={...k.resources};expect(()=>s.act('outlying','storage',k,tick)).toThrow('bereits');
    expect(k.resources).toEqual(resources);
    const restored=RegionalProvisioning.restore(s.serialize());
    expect(restored.overview(k,tick)[2].reliefMonths).toBe(3);
    for(let month=tick;month<tick+3;month++)restored.advance(k,month);
    expect(restored.options('outlying',k,tick+2).find(o=>o.id==='relief')?.canStart).toBe(false);
    expect(restored.options('outlying',k,tick+3).find(o=>o.id==='relief')?.canStart).toBe(true);
    k.resources.gold=0;const state=restored.serialize();
    expect(()=>restored.act('geest','storage',k,tick+3)).toThrow('Vorräte');expect(restored.serialize()).toEqual(state);
  });
  it('keeps storage permanent, blocks extra levels and links citizen relief to local trust',()=>{
    const k=kingdom(),s=new RegionalProvisioning();
    for(let tick=1;tick<=3;tick++)s.act('geest','storage',k,tick);
    expect(()=>s.act('geest','storage',k,4)).toThrow('vollständig');
    k.resources.food=0;
    for(let tick=4;tick<=12;tick++)s.advance(k,tick);
    const before=s.overview(k,12);expect(before[0].storage).toBe(3);
    expect(s.support('grain')).toContain('Bürgerhilfe');
    const after=s.overview(k,12);
    expect(after.reduce((n,r)=>n+r.hunger,0)).toBe(before.reduce((n,r)=>n+r.hunger,0)-15);
    expect(s.support('unknown')).toBeNull();
    expect(RegionalProvisioning.restore(s.serialize()).serialize()).toEqual(s.serialize());
  });
  it('guards malformed state and suppresses migration during paid household support',()=>{
    const k=kingdom(),s=new RegionalProvisioning();
    const data=s.serialize();data.regions[2].hunger=90;data.regions[2].crisisMonths=5;
    const loaded=RegionalProvisioning.restore(data);
    loaded.act('outlying','settlement',k,1);k.resources.food=0;
    for(let tick=1;tick<=3;tick++)loaded.advance(k,tick);
    expect(loaded.overview(k,3)[2].emigrated).toBe(0);
    loaded.advance(k,4);expect(loaded.overview(k,4)[2].emigrated).toBeGreaterThan(0);
    data.regions[0].storage=4;expect(()=>RegionalProvisioning.restore(data)).toThrow();
  });
});
