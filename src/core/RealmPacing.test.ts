import {describe,it,expect} from 'vitest';
import {Kingdom} from './Kingdom';
import {foodSecurity,processFoodSecurity} from './FoodSecurity';
import {RealmProjects} from './RealmProjects';
import {CampaignWarfareSystem} from './CampaignWarfareSystem';

describe('persistent pacing and late-game risks',()=>{
  it('protects small reserves, exposes excess and reduces losses with warehouses',()=>{
    const k=new Kingdom({name:'Test',rulerName:'Test',foundingYear:1200});
    k.resources.food=1000;expect(foodSecurity(k).spoilage).toBe(0);
    k.resources.food=200000;k.infrastructure.farms=100;
    const exposed=foodSecurity(k);expect(exposed.spoilage).toBeGreaterThan(0);expect(exposed.risk).toBeLessThanOrEqual(.12);
    const before=k.resources.food;const ordinary=processFoodSecurity(k,false,()=>0);
    expect(k.resources.food).toBe(before-exposed.spoilage);expect(ordinary).toHaveLength(1);
    k.resources.food=before;k.infrastructure.warehouses+=10;
    expect(foodSecurity(k).spoilage).toBeLessThan(exposed.spoilage);
    const disaster=processFoodSecurity(k,true,()=>0);expect(disaster).toHaveLength(2);
    expect(disaster[1]).toContain('Nahrung verloren');expect(k.resources.food).toBeGreaterThan(0);
    let roll=0;const farms=k.infrastructure.farms;
    const flood=processFoodSecurity(k,true,()=>[0,.8,.5][Math.min(roll++,2)]);
    expect(flood[1]).toContain('Anbauflächen verwüstet');expect(k.infrastructure.farms).toBeLessThan(farms);
  });
  it('prevents duplicate project progress and migrates saves without projects',()=>{
    const projects=new RealmProjects();projects.add({playerId:'p',kind:'building',target:'farms',name:'Feld',months:3,started:-20,count:1});
    projects.advance('p',-20);projects.advance('p',-20);expect(projects.list('p')[0].remaining).toBe(2);
    const restored=new RealmProjects();restored.restore(projects.serialize(),['p']);
    expect(restored.advance('p',-19)).toHaveLength(0);expect(restored.advance('p',-18)).toHaveLength(1);
    expect(()=>restored.restore([{...projects.serialize()[0],remaining:-1}],['p'])).toThrow();
    restored.restore(undefined,['p']);expect(restored.list('p')).toHaveLength(0);
  });
  it('adds stronger frontier rivals only after everyone is subdued and retains vassals',()=>{
    const system=new CampaignWarfareSystem();system.ensureRivals('p');
    expect(system.expandFrontier('p',1201)).toEqual([]);
    const state=system.serialize();state.rivals.forEach(r=>r.subjugated=true);system.load(state);
    const wave=system.expandFrontier('p',1201);expect(wave).toHaveLength(3);
    expect(wave.every(r=>r.soldiers>1100)).toBe(true);expect(system.subjugatedCount('p')).toBe(3);
    expect(system.expandFrontier('p',1202)).toEqual([]);
    const restored=new CampaignWarfareSystem();restored.load(system.serialize());
    restored.processYear(1202);expect(restored.getRivals('p').filter(r=>!r.subjugated).every(r=>r.soldiers>=1375)).toBe(true);
  });
});
