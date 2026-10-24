import {describe,it,expect} from 'vitest';
import {StrategyWorld} from './StrategyWorld';
import {rivalReaction} from './RivalStrategy';

describe('persistent strategy world',()=>{
  it('generates every rival deterministically and keeps positions across additions/removals',()=>{
    const ids=Array.from({length:20},(_,i)=>'neighbor-'+i);
    const a=new StrategyWorld(1200),b=new StrategyWorld(1200);
    a.sync(ids);b.sync([...ids].reverse());
    expect(a.serialize()).toEqual(b.serialize());
    expect(a.overview(ids).regions).toHaveLength(21);
    const before=a.serialize();
    a.sync(['new',...ids]);
    expect(a.serialize().regions.slice(1,21)).toEqual(before.regions.slice(1));
    expect(a.overview([ids[0]]).regions).toHaveLength(2);
    expect(a.overview(ids).regions[1]).toEqual(before.regions[1]);
  });
  it('charges longer journeys via home, discovers on arrival and round-trips mid-journey',()=>{
    const world=new StrategyWorld();world.sync(['a','b']);
    expect(world.plan('rival:a',['a','b'])).toEqual({months:1,gold:150,food:50});
    world.travel('rival:a',['a','b']);
    expect(()=>world.travel('rival:b',['a','b'])).toThrow('bereits');
    expect(world.processMonth(['a','b'])?.discovered).toBe(true);
    expect(world.plan('rival:b',['a','b']).months).toBe(2);
    world.travel('rival:b',['a','b']);
    expect(world.processMonth(['a','b'])).toBeNull();
    const loaded=StrategyWorld.restore(world.serialize());
    expect(loaded.processMonth(['a','b'])?.id).toBe('rival:b');
    expect(loaded.plan('home',['a','b'])).toEqual({months:1,gold:0,food:0});
    expect(()=>loaded.plan('missing',['a','b'])).toThrow();
    loaded.travel('rival:a',['a','b']);
    expect(loaded.processMonth(['b'])).toBeNull();
    expect(loaded.serialize().journey).toBeNull();
  });
  it('rejects bad versions, dangling routes, duplicate IDs and invalid travel times',()=>{
    const world=new StrategyWorld();world.sync(['a']);
    for(const mutate of [
      (s:any)=>s.version=2,
      (s:any)=>s.regions[0].connections.push('missing'),
      (s:any)=>s.regions[0].connections=[],
      (s:any)=>s.regions[0].rivalId='a',
      (s:any)=>s.currentRegion='rival:a',
      (s:any)=>s.journey={destination:'home',remaining:1},
      (s:any)=>s.regions.push(s.regions[0]),
      (s:any)=>s.journey={destination:'rival:a',remaining:-1},
      (s:any)=>s.regions[1].x=Infinity
    ]) {const snapshot=world.serialize();mutate(snapshot);expect(()=>StrategyWorld.restore(snapshot)).toThrow('Strategiewelt');}
  });
});

describe('rivals respond to visible progress',()=>{
  const baseline={gold:1000,tradeRoutes:0,researched:0,soldiers:0,difficulty:1};
  const strong={gold:25000,tradeRoutes:4,researched:12,soldiers:1000,difficulty:1};
  it('distinguishes economy, knowledge and army triggers and scales difficulty within bounds',()=>{
    expect(rivalReaction('raider',baseline).soldiers).toBe(0);
    expect(rivalReaction('raider',strong).soldiers).toBeGreaterThan(0);
    expect(rivalReaction('fortifier',strong).fortification).toBeGreaterThan(0);
    expect(rivalReaction('merchant',strong).wealth).toBeGreaterThan(0);
    for(const personality of ['raider','fortifier','merchant'] as const) {
      const easy=rivalReaction(personality,strong),hard=rivalReaction(personality,{...strong,difficulty:3});
      expect(hard.soldiers+hard.fortification+hard.wealth).toBeGreaterThan(easy.soldiers+easy.fortification+easy.wealth);
      expect(rivalReaction(personality,{...strong,gold:1e50,tradeRoutes:1e50,researched:1e50,soldiers:1e50,difficulty:99})).toEqual(
        rivalReaction(personality,{gold:25000,tradeRoutes:5,researched:12,soldiers:1000,difficulty:3}));
    }
  });
});
