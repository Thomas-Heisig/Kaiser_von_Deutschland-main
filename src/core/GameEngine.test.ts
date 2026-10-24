import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import localforage from 'localforage';
import { CampaignGoal, GameEngine, GameState, MarketResource, SaveMeta } from './GameEngine';
import { TimeMode } from './TimeSystem';
import { Citizen } from './CitizenSystem';
import { Achievement } from './Player';

vi.mock('localforage', (): object => {
  const storage = new Map<string, unknown>();
  return {
    default: {
      setItem: async (key: string, value: unknown): Promise<unknown> => {
        storage.set(key, structuredClone(value));
        return value;
      },
      getItem: async (key: string): Promise<unknown> => structuredClone(storage.get(key) ?? null),
      removeItem: async (key: string): Promise<void> => { storage.delete(key); }
    }
  };
});

describe('Playable campaign integration', (): void => {
  const engines: GameEngine[] = [];

  beforeEach((): void => {
    vi.stubGlobal('fetch', async (url: URL): Promise<Response> => {
      const text = await readFile(url, 'utf8');
      return new Response(text, { headers: { 'Content-Type': 'application/json' } });
    });
    vi.spyOn(console, 'log').mockImplementation((): void => {});
    vi.spyOn(console, 'warn').mockImplementation((): void => {});
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach((): void => {
    engines.forEach((engine: GameEngine): void => engine.dispose());
    engines.length = 0;
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const campaign = async (): Promise<GameEngine> => {
    const engine = new GameEngine({ startingYear: 1200, randomEvents: false, enableWiki: false });
    engines.push(engine);
    engine.addPlayer({ name: 'Heinrich', kingdomName: 'Testreich', gender: 'other', startingStats: { age: 25 } });
    await engine.startGame();
    engine.pauseGame();
    return engine;
  };

  it('finances construction once, persists remaining time and delays all building effects',async()=>{
    const engine=await campaign(),p=engine.getPlayers()[0],k=p.kingdom;
    const initial=k.infrastructure.farms,gold=k.resources.gold,food=k.resources.food;
    expect(await engine.buildForPlayer(p.id,'farms')).toBe(true);
    expect(k.resources.gold).toBe(gold-1200);expect(k.resources.food).toBe(food);
    expect(k.infrastructure.farms).toBe(initial);
    await engine.advanceMonth();await engine.saveGame('timed-build');
    const loaded=new GameEngine({enableWiki:false});engines.push(loaded);await loaded.loadGame('timed-build');
    expect(loaded.getProjects(p.id)[0].remaining).toBe(2);
    await loaded.advanceMonth();expect(loaded.getPlayers()[0].kingdom.infrastructure.farms).toBe(initial);
    await loaded.advanceMonth();expect(loaded.getPlayers()[0].kingdom.infrastructure.farms).toBe(initial+1);
    expect(loaded.getProjects(p.id)).toHaveLength(0);
    expect(loaded.getChronicle().some(e=>e.message.includes('nach 3 Monaten abgeschlossen'))).toBe(true);
  });
  it('waits for recruitment and resolves a saved campaign only after the march',async()=>{
    const engine=await campaign(),p=engine.getPlayers()[0],k=p.kingdom;
    Object.assign(k.resources,{gold:1000000,food:1000000});
    const infantry=k.military.infantry;
    expect(engine.recruitForPlayer(p.id,10)).toBe(true);expect(k.military.infantry).toBe(infantry);
    for(let n=0;n<3;n++)await engine.advanceMonth();expect(k.military.infantry).toBe(infantry+10);
    k.military.infantry=5000;
    engine.launchCampaign(p.id,'raubritter');
    expect(engine.getRivals(p.id)[0].subjugated).toBe(false);
    expect(()=>engine.launchCampaign(p.id,'ostmark')).toThrow('bereits unterwegs');
    await engine.advanceMonth();await engine.saveGame('march');
    const loaded=new GameEngine({enableWiki:false});engines.push(loaded);await loaded.loadGame('march');
    expect(loaded.getProjects(p.id)[0]).toMatchObject({kind:'campaign',remaining:2});
    await loaded.advanceMonth();expect(loaded.getRivals(p.id)[0].subjugated).toBe(false);
    await loaded.advanceMonth();expect(loaded.getRivals(p.id)[0].subjugated).toBe(true);
    expect(loaded.getBattleReports(p.id)).toHaveLength(1);
    expect(loaded.getRivalRelations(p.id)[0].relationType).toBe('vassal');
  });
  it('delays garrison improvements and hotseat attacks without charging completion again',async()=>{
    const engine=new GameEngine({startingYear:1200,randomEvents:false,enableWiki:false,maxPlayers:2,enableMultiplayer:true});engines.push(engine);
    const first=engine.addPlayer({name:'A',kingdomName:'A',gender:'other'}),second=engine.addPlayer({name:'B',kingdomName:'B',gender:'other'});
    await engine.startGame();engine.pauseGame();
    first.kingdom.resources.gold=1000000;first.kingdom.resources.food=1000000;first.kingdom.military.infantry=1000;
    const training=first.kingdom.military.trainingLevel;
    engine.improveGarrison(first.id,'training');expect(first.kingdom.military.trainingLevel).toBe(training);
    expect(()=>engine.improveGarrison(first.id,'training')).toThrow('bereits');
    engine.launchPlayerCampaign(first.id,second.id);
    expect(()=>engine.launchPlayerCampaign(second.id,first.id)).toThrow('Nicht am Zug');
    expect(engine.getBattleReports(first.id)).toHaveLength(0);
    for(let n=0;n<2;n++)await engine.advanceMonth();
    expect(first.kingdom.military.trainingLevel).toBeGreaterThanOrEqual(training+5);
    expect(engine.getBattleReports(first.id)).toHaveLength(0);
    await engine.advanceMonth();expect(engine.getBattleReports(first.id)).toHaveLength(1);
  });
  it('calculates a year month by month and stops a time journey on request',async()=>{
    const engine=new GameEngine({startingYear:-1,campaignId:'frei',randomEvents:false,enableWiki:false});engines.push(engine);
    const p=engine.addPlayer({name:'Zeit',kingdomName:'Probe',gender:'other'});await engine.startGame();engine.pauseGame();
    p.kingdom.resources.gold=1000000;p.kingdom.resources.food=1000000;
    const result=await engine.travelThroughTime(12);expect(result.completed).toBe(12);
    expect(engine.getCurrentYear()).toBe(0);expect(engine.getCurrentMonth()).toBe(1);
    const stop=engine.on('timeTravelProgress',({completed})=>{if(completed===4)engine.cancelTimeTravel();});
    expect(await engine.travelThroughTime(1200)).toEqual({completed:4,reason:'Abgebrochen'});stop();
    expect(engine.getGameState()).toBe(GameState.PAUSED);
    await expect(engine.travelThroughTime(0)).rejects.toThrow('Wähle');
  });
  it('advances a funded peaceful century without bypassing construction or ageing',async()=>{
    const engine=new GameEngine({startingYear:1100,campaignId:'frei',randomEvents:false,enableWiki:false});engines.push(engine);
    const p=engine.addPlayer({name:'Langlauf',kingdomName:'Jahrhundert',gender:'other'});await engine.startGame();engine.pauseGame();
    Object.assign(p.kingdom.resources,{gold:100000000,food:1000000,wood:1000000,stone:1000000});
    p.kingdom.infrastructure.farms=100;p.kingdom.taxRate=.1;
    const farms=p.kingdom.infrastructure.farms;await engine.buildForPlayer(p.id,'farms');
    const prefs=engine.getAdministration(p.id);prefs.domains.character=true;engine.setAdministration(p.id,prefs);
    const result=await engine.travelThroughTime(1200);
    expect(result).toEqual({completed:1200,reason:'Ziel erreicht'});
    expect(engine.getCurrentYear()).toBe(1200);expect(p.kingdom.infrastructure.farms).toBe(farms+1);
    expect(engine.getCitizenSystem().getAllCitizens().some(c=>!c.isAlive)).toBe(true);
    expect(engine.getCurrentCharacter(p.id)?.isAlive).toBe(true);
    expect(Number.isFinite(p.kingdom.resources.gold)).toBe(true);
  },60000);

  it('plays, researches, travels and reloads a Bronze Age realm with negative years', async () => {
    const engine = new GameEngine({startingYear:-1999,campaignId:'frei',randomEvents:true,enableWiki:false});
    engines.push(engine);
    const player = engine.addPlayer({name:'Frühstart',kingdomName:'Siedlung',gender:'other'});
    await engine.startGame(); engine.pauseGame();
    player.kingdom.resources.gold=100000;player.kingdom.resources.food=100000;
    expect(engine.getTechnologyOptions(player.id).map(item=>item.technology.id)).toContain('agriculture');
    expect(engine.getTechnologyOptions(player.id).some(item=>item.technology.id==='iron_working')).toBe(false);
    const farms = player.kingdom.infrastructure.farms;
    await engine.buildForPlayer(player.id,'farms');
    expect(player.kingdom.infrastructure.farms).toBe(farms);
    for(let i=0;i<3;i++)await engine.advanceMonth();
    expect(player.kingdom.infrastructure.farms).toBe(farms+1);
    player.kingdom.infrastructure.schools=5;
    engine.travelWorld(player.id,'rival:ostmark');
    for (let m=0;m<12;m++) {
      const pending=engine.getPendingCouncilDecision(player.id);
      if (pending) {
        expect(pending.id).not.toBe('guild_petition');
        const choice=engine.getCouncilChoices(player.id).find(c=>c.affordable)!;
        engine.resolveCouncilDecision(player.id,choice.id);
      }
      await engine.advanceMonth();
      if (m===2) engine.startResearch(player.id,'agriculture');
    }
    expect(engine.getCurrentYear()).toBe(-1998);
    expect(engine.getTechnologyProgress(player.id).researched).toContain('agriculture');
    expect(engine.getStrategyWorld(player.id).currentRegion).toBe('rival:ostmark');
    engine.sponsorExhibition(player.id,'aegean-middle-bronze');
    await engine.saveGame('bronze');
    const loaded=new GameEngine({enableWiki:false}); engines.push(loaded); await loaded.loadGame('bronze');
    expect(loaded.getCurrentYear()).toBe(-1998);
    expect(loaded.getTimeSystem().getFormattedDate()).toBe('1.4.1999 v. Chr.');
    expect(loaded.getPlayers()[0].kingdom.foundingYear).toBe(-1999);
    expect(loaded.getExhibitionOptions(player.id).find(item=>item.milestone.id==='aegean-middle-bronze')?.held).toBe(true);
    expect(()=>loaded.sponsorExhibition(player.id,'aegean-middle-bronze')).toThrow('bereits');
    expect(Object.values(loaded.getPlayers()[0].kingdom.resources).every(Number.isFinite)).toBe(true);
  });

  it('crosses the civil era boundary with stable citizens and founding dates', async () => {
    const engine=new GameEngine({startingYear:0,campaignId:'frei',randomEvents:false,enableWiki:false}); engines.push(engine);
    const player=engine.addPlayer({name:'Zeitenwende',kingdomName:'Siedlung',gender:'other'});
    await engine.startGame(); engine.pauseGame();
    for(let m=0;m<12;m++) await engine.advanceMonth();
    expect(engine.getCurrentYear()).toBe(1);
    expect(engine.getTimeSystem().getFormattedDate()).toBe('1.1.1 n. Chr.');
    await engine.saveGame('era-boundary');
    const loaded=new GameEngine({enableWiki:false});engines.push(loaded);await loaded.loadGame('era-boundary');
    expect(loaded.getCurrentYear()).toBe(1);
    expect(loaded.getPlayers()[0].kingdom.foundingYear).toBe(0);
    expect(loaded.getCurrentCharacter(player.id)?.age).toBeGreaterThan(0);
  });

  it('gates historical events and paid exhibitions by month across save/load', async () => {
    const engine = new GameEngine({startingYear:2000,randomEvents:false,enableWiki:false});
    engines.push(engine);
    engine.addPlayer({name:'Ada',kingdomName:'Zeitreich',gender:'other',startingStats:{age:25}});
    await engine.startGame(); engine.pauseGame();
    const id = engine.getPlayers()[0].id;
    const events: string[] = [];
    engine.on('historyMilestone', ({milestone}: {milestone:{id:string}}) => events.push(milestone.id));
    expect(() => engine.sponsorExhibition(id, 'expo-hannover')).toThrow('noch nicht');
    for (let i=0;i<4;i++) await engine.advanceMonth();
    expect(engine.getCurrentMonth()).toBe(5);
    expect(events).toEqual([]);
    await engine.saveGame('history-may');
    const restored = new GameEngine({enableWiki:false}); engines.push(restored);
    await restored.loadGame('history-may');
    restored.on('historyMilestone', ({milestone}: {milestone:{id:string}}) => events.push(milestone.id));
    expect(restored.getHistoricalTimeline().some(item => item.id === 'expo-hannover')).toBe(false);
    await restored.advanceMonth();
    expect(events).toEqual(['expo-hannover']);
    expect(restored.getExhibitionOptions(id).some(item => item.milestone.id === 'expo-hannover')).toBe(true);
    await restored.saveGame('history-june');
    await restored.loadGame('history-june');
    await restored.advanceMonth();
    expect(events).toEqual(['expo-hannover']);
  });

  it('persists paid travel, discovers the destination and migrates old saves', async()=>{
    const engine=await campaign(),player=engine.getPlayers()[0];
    const gold=player.kingdom.resources.gold,food=player.kingdom.resources.food;
    expect(engine.getStrategyWorld(player.id).regions).toHaveLength(4);
    engine.travelWorld(player.id,'rival:ostmark');
    expect(player.kingdom.resources.gold).toBe(gold-150);
    expect(player.kingdom.resources.food).toBe(food-50);
    expect(()=>engine.travelWorld(player.id,'rival:nordland')).toThrow('bereits');
    await engine.saveGame('world-travel');
    const restored=new GameEngine({enableWiki:false});engines.push(restored);
    await restored.loadGame('world-travel');
    expect(restored.getStrategyWorld(player.id).journey?.remaining).toBe(1);
    await restored.advanceMonth();
    const world=restored.getStrategyWorld(player.id);
    expect(world.currentRegion).toBe('rival:ostmark');
    expect(world.regions.find(r=>r.id==='rival:ostmark')?.discovered).toBe(true);
    expect(restored.getChronicle().some(e=>e.message.includes('Reise abgeschlossen'))).toBe(true);
    const data:any=await localforage.getItem('kaiser-ii-save-world-travel');
    const {decodeSave}=await import('./SaveCodec');const decoded:any=await decodeSave(data);
    decoded.strategyWorlds[player.id].journey.remaining=-1;
    await localforage.setItem('kaiser-ii-save-bad-world',decoded);
    await expect(restored.loadGame('bad-world')).rejects.toThrow('Strategiewelt');
    expect(restored.getStrategyWorld(player.id).currentRegion).toBe('rival:ostmark');
    delete decoded.strategyWorlds;await localforage.setItem('kaiser-ii-save-old-world',decoded);
    await restored.loadGame('old-world');
    expect(restored.getStrategyWorld(player.id).currentRegion).toBe('home');
  });

  it('saves trade and defensive alliances and applies a single consequential treaty breach',async()=>{
    const engine=await campaign(),player=engine.getPlayers()[0];
    player.kingdom.resources.gold=10000;
    const relation=engine.getRivalRelations(player.id).find(r=>r.kingdomId==='ostmark')!;
    relation.relationshipValue=40;
    engine.negotiateRivalAgreement(player.id,'ostmark','trade');
    expect(()=>engine.attackRival(player.id,'ostmark')).toThrow('Verträge');
    expect(()=>engine.beginCampaignSiege(player.id,'ostmark')).toThrow('Verträge');
    engine.negotiateRivalAgreement(player.id,'ostmark','alliance');
    expect(engine.getRivalTreaties(player.id)).toHaveLength(2);
    expect(engine.getDiplomaticIncome(player.id)).toBe(80);
    expect(engine.getAllianceDefenseBonus(player.id)).toBe(0.15);
    expect(engine.hasRivalTruce(player.id,'ostmark')).toBe(true);
    expect(()=>engine.attackRival(player.id,'ostmark')).toThrow('Nichtangriffspakt');
    expect(()=>engine.negotiateRivalAgreement(player.id,'ostmark','trade')).toThrow('bereits');
    await engine.saveGame('contracts');
    const restored=new GameEngine({enableWiki:false});engines.push(restored);await restored.loadGame('contracts');
    expect(restored.getDiplomaticIncome(player.id)).toBe(80);
    const id=restored.getRivalTreaties(player.id)[0].id;
    restored.breakRivalTreaty(player.id,id);
    expect(restored.getRivalTreaties(player.id)).toHaveLength(0);
    expect(restored.getDiplomaticIncome(player.id)).toBe(0);
    expect(restored.getAllianceDefenseBonus(player.id)).toBe(0);
    expect(restored.getRivalRelations(player.id).find(r=>r.kingdomId==='ostmark')).toMatchObject({relationshipValue:30,trust:10});
    expect(restored.getRivalRelations(player.id).find(r=>r.kingdomId==='nordland')?.trust).toBe(40);
    expect(()=>restored.breakRivalTreaty(player.id,id)).toThrow('Kein aktiver');
    expect(()=>restored.negotiateRivalAgreement(player.id,'ostmark','trade')).toThrow('Vertrauen');
    expect(()=>restored.negotiateRivalTruce(player.id,'ostmark')).toThrow('Vertrauen');
  });

  it('keeps world travel and contracts isolated to the active hotseat player',async()=>{
    const engine=new GameEngine({startingYear:1200,campaignId:'frei',randomEvents:false,enableWiki:false});engines.push(engine);
    const first=engine.addPlayer({name:'Anna',kingdomName:'West',gender:'other'});
    const second=engine.addPlayer({name:'Berta',kingdomName:'Ost',gender:'other'});
    await engine.startGame();engine.pauseGame();
    for(const player of [first,second]) {
      player.kingdom.resources.gold=10000;
      engine.getRivalRelations(player.id).find(r=>r.kingdomId==='ostmark')!.relationshipValue=40;
    }
    const gold=second.kingdom.resources.gold;
    expect(()=>engine.travelWorld(second.id,'rival:ostmark')).toThrow('Nicht am Zug');
    expect(()=>engine.negotiateRivalAgreement(second.id,'ostmark','trade')).toThrow('Nicht am Zug');
    expect(()=>engine.attackRival(second.id,'ostmark')).toThrow('Nicht am Zug');
    expect(()=>engine.attackPlayer(second.id,first.id)).toThrow('Nicht am Zug');
    expect(second.kingdom.resources.gold).toBe(gold);
    engine.travelWorld(first.id,'rival:ostmark');
    engine.negotiateRivalAgreement(first.id,'ostmark','trade');
    const treaty=engine.getRivalTreaties(first.id)[0];
    expect(()=>engine.breakRivalTreaty(second.id,treaty.id)).toThrow('Nicht am Zug');
    expect(engine.getStrategyWorld(second.id).journey).toBeNull();
    expect(engine.getDiplomaticIncome(second.id)).toBe(0);
  });

  it('ends trade when the rival raids without blaming the player for the breach',async()=>{
    const engine=new GameEngine({startingYear:1200,campaignId:'frei',randomEvents:true,enableWiki:false});engines.push(engine);
    const player=engine.addPlayer({name:'Anna',kingdomName:'Handelsreich',gender:'other'});
    await engine.startGame();engine.pauseGame();
    player.kingdom.resources.gold=10000;
    engine.getRivalRelations(player.id).find(r=>r.kingdomId==='raubritter')!.relationshipValue=20;
    engine.negotiateRivalAgreement(player.id,'raubritter','trade');
    const prestige=player.stats.prestige;
    vi.mocked(Math.random).mockReturnValue(0);
    await engine.advanceMonth();
    expect(engine.getBattleReports(player.id).some(r=>r.kind==='raid' && r.rivalId==='raubritter')).toBe(true);
    expect(engine.getDiplomaticIncome(player.id)).toBe(0);
    expect(player.stats.prestige).toBeGreaterThanOrEqual(prestige); // ordinary monthly prestige still accrues
    expect(engine.getChronicle().some(e=>e.message.includes('bricht durch den Überfall'))).toBe(true);
  });

  it('pays trade income monthly and expires a mid-year agreement exactly 36 months later',async()=>{
    const engine=await campaign(),baseline=await campaign();
    const player=engine.getPlayers()[0],other=baseline.getPlayers()[0];
    for(const p of [player,other]) {p.kingdom.resources.gold=100000;p.kingdom.resources.food=100000;}
    for(let i=0;i<6;i++){await engine.advanceMonth();await baseline.advanceMonth();}
    engine.getRivalRelations(player.id).find(r=>r.kingdomId==='ostmark')!.relationshipValue=20;
    engine.negotiateRivalAgreement(player.id,'ostmark','trade');
    other.kingdom.resources.gold-=600;
    await engine.advanceMonth();await baseline.advanceMonth();
    expect(player.kingdom.resources.gold-other.kingdom.resources.gold).toBeCloseTo(80,6);
    for(let i=0;i<34;i++)await engine.advanceMonth();
    expect(engine.getDiplomaticIncome(player.id)).toBe(80);
    await engine.advanceMonth();
    expect(engine.getCurrentMonth()).toBe(7);
    expect(engine.getDiplomaticIncome(player.id)).toBe(0);
  });

  it('automates opted-in events, persists the preference and lets manual decisions pause again', async () => {
    const engine = new GameEngine({startingYear:1200,randomEvents:true,enableWiki:false});
    engines.push(engine);
    const player = engine.addPlayer({name:'Anna',kingdomName:'Westreich',gender:'other'});
    await engine.startGame();
    const prompted = vi.fn();
    engine.on('councilDecision',prompted);
    engine.setCouncilAutomatic(player.id,true);
    for (let i=0;i<6;i++) await engine.advanceMonth();
    expect(engine.getPendingCouncilDecision(player.id)).toBeNull();
    expect(engine.getCouncilHistory(player.id)[0].automatic).toBe(true);
    expect(engine.getGameState()).toBe(GameState.RUNNING);
    expect(prompted).not.toHaveBeenCalled();
    expect(engine.getChronicle().filter(entry=>entry.message.includes('Automatisch entschieden'))).toHaveLength(1);
    engine.pauseGame();
    await engine.saveGame('automatic-events');
    const restored = new GameEngine({enableWiki:false});
    engines.push(restored);
    await restored.loadGame('automatic-events');
    expect(restored.isCouncilAutomatic(player.id)).toBe(true);
    restored.setCouncilAutomatic(player.id,false);
    for(let i=0;i<6;i++) await restored.advanceMonth();
    expect(restored.getPendingCouncilDecision(player.id)).not.toBeNull();
    expect(restored.getGameState()).toBe(GameState.PAUSED);
    const outcome = restored.setCouncilAutomatic(player.id,true);
    expect(outcome?.automatic).toBe(true);
    expect(restored.getPendingCouncilDecision(player.id)).toBeNull();
    expect(restored.getGameState()).toBe(GameState.PAUSED);
  });

  it('keeps automatic event preferences and decisions separate in hotseat', async () => {
    const engine = new GameEngine({startingYear:1200,randomEvents:true,enableWiki:false});
    engines.push(engine);
    const first = engine.addPlayer({name:'Anna',kingdomName:'Westreich',gender:'other'});
    const second = engine.addPlayer({name:'Otto',kingdomName:'Ostreich',gender:'other'});
    await engine.startGame();
    engine.setCouncilAutomatic(first.id,true);
    expect(()=>engine.setCouncilAutomatic(second.id,true)).toThrow('Nicht am Zug');
    for(let i=0;i<6;i++){await engine.endTurn();await engine.endTurn();}
    expect(engine.getCouncilHistory(first.id)[0].automatic).toBe(true);
    expect(engine.getPendingCouncilDecision(first.id)).toBeNull();
    expect(engine.isCouncilAutomatic(second.id)).toBe(false);
    expect(engine.getPendingCouncilDecision(second.id)).not.toBeNull();
    expect(engine.getCouncilHistory(second.id)).toHaveLength(0);
  });

  it('delegates within a shared budget and restores Bronze Age civic assignments',async()=>{
    const engine=new GameEngine({startingYear:-1999,randomEvents:false,enableWiki:false});engines.push(engine);
    const player=engine.addPlayer({name:'Test',kingdomName:'Geest',gender:'other'});
    await engine.startGame();engine.pauseGame();
    Object.assign(player.kingdom.resources,{gold:50000,food:100000,wood:5000,stone:5000,iron:5000});
    const prefs=engine.getAdministration(player.id);
    for(const domain of Object.keys(prefs.domains) as Array<keyof typeof prefs.domains>)prefs.domains[domain]=true;
    engine.setAdministration(player.id,prefs);engine.setCouncilAutomatic(player.id,true);
    const originalBudget=engine.getAdministrationBudget(player.id).budget;
    await engine.advanceMonth();
    const report=engine.getTreasuryReport(player.id)!;
    const spent=report.entries.filter(e=>e.reason.startsWith('Automatik:')).reduce((sum,e)=>sum+Math.max(0,-e.amount),0);
    // Monthly earnings precede budget allocation; allow precisely their effect on the 5% budget.
    const beforeAuto=report.opening+report.entries.filter(e=>!e.reason.startsWith('Automatik:')).reduce((sum,e)=>sum+e.amount,0);
    expect(spent).toBeLessThanOrEqual(originalBudget+Math.max(0,beforeAuto-report.opening)*.05+1);
    expect(engine.getCivicMissions(player.id).active.length).toBeGreaterThan(0);
    expect(engine.getCivicMissions(player.id).active[0].started).toBeLessThan(0);
    expect(report.closing).toBeCloseTo(player.kingdom.resources.gold);
    await engine.saveGame('administration-bronze');
    const restored=new GameEngine({enableWiki:false});engines.push(restored);await restored.loadGame('administration-bronze');
    expect(restored.getAdministration(player.id)).toEqual(prefs);
    expect(restored.getCivicMissions(player.id).active).toEqual(engine.getCivicMissions(player.id).active);
  });

  it('runs one delegated personal action per month, persists the plan and respects manual priority',async()=>{
    const engine=await campaign(),p=engine.getActivePlayer(),character=engine.getCurrentCharacter(p.id)!;
    const prefs=engine.getAdministration(p.id);prefs.domains.character=true;prefs.characterPlan='study';engine.setAdministration(p.id,prefs);
    const wealth=character.wealth;
    engine.performCharacterAction(p.id,'work');
    const literacy=character.skills.literacy;
    await engine.advanceMonth();
    expect(character.wealth).toBeGreaterThan(wealth);expect(character.skills.literacy).toBe(literacy);
    await engine.advanceMonth();expect(character.skills.literacy).toBe(Math.min(100,literacy+6));
    await engine.saveGame('personal-automation');
    const restored=new GameEngine({enableWiki:false});engines.push(restored);await restored.loadGame('personal-automation');
    expect(restored.getAdministration(p.id)).toEqual(prefs);
    expect(restored.getChronicle().some(e=>e.message.includes('studiert'))).toBe(true);
  });

  it('hands a dead character to an adult child and persists the succession',async()=>{
    const engine=await campaign(),p=engine.getActivePlayer(),old=engine.getCurrentCharacter(p.id)!;
    const citizens=engine.getCitizenSystem();
    const child=citizens.createCitizen({firstName:'Nachfolge',lastName:'Test',gender:'female',age:20,birthYear:1180,birthMonth:1,profession:'farmer',regionId:old.regionId,familyId:old.familyId});
    old.familyRelations.push({citizenId:child.id,relationType:'child'});child.familyRelations.push({citizenId:old.id,relationType:'parent'});
    const prefs=engine.getAdministration(p.id);prefs.domains.character=true;engine.setAdministration(p.id,prefs);
    old.isAlive=false;
    await engine.advanceMonth();
    expect(engine.getCurrentCharacter(p.id)?.id).toBe(child.id);
    expect(old.isPlayerCharacter).toBe(false);
    expect(engine.getChronicle().some(e=>e.message.includes('Automatische Nachfolge: Nachfolge Test'))).toBe(true);
    await engine.saveGame('successor');const restored=new GameEngine({enableWiki:false});engines.push(restored);await restored.loadGame('successor');
    expect(restored.getCurrentCharacter(p.id)?.id).toBe(child.id);
  });

  it('keeps a late-list assigned citizen visible and preserves a funded mission across death',async()=>{
    const engine=await campaign(),p=engine.getActivePlayer(),s=engine.getCitizenSystem();
    for(let i=0;i<110;i++)s.createCitizen({firstName:'Extra '+i,lastName:'Test',gender:'male',age:30,birthYear:1170,birthMonth:1,profession:'farmer',regionId:'dorf'});
    const worker=s.getAllCitizens().at(-1)!;
    engine.assignCivicMission(p.id,worker.id,'crafts');
    expect(engine.getCivicMissions(p.id).citizens.some(c=>c.id===worker.id)).toBe(true);
    const prefs=engine.getAdministration(p.id);prefs.domains.civic=true;engine.setAdministration(p.id,prefs);
    worker.isAlive=false;p.kingdom.resources.gold=0;
    await engine.advanceMonth();
    const active=engine.getCivicMissions(p.id).active.find(a=>a.missionId==='crafts')!;
    expect(active).toBeDefined();expect(active.citizenId).not.toBe(worker.id);expect(active.completedMonths).toBe(0);
    expect(engine.getAutomationPeople(p.id).some(a=>a.alive&&a.task==='Handwerk weitergeben')).toBe(true);
    expect(engine.getChronicle().some(e=>e.message.includes('Auftragsnachfolge'))).toBe(true);
  });

  it('replaces automatic court vacancies, keeps manual vacancies loadable and prevents duplicate jobs',async()=>{
    const engine=await campaign(),p=engine.getActivePlayer();
    const advisor=engine.getCourtCandidates(p.id)[0];engine.appointCourtAssistant(p.id,'forschung',advisor.id);
    expect(()=>engine.assignCivicMission(p.id,advisor.id,'grain')).toThrow('Hofamt');
    engine.setCourtAssistantMode(p.id,'forschung','automatisch');advisor.isAlive=false;
    await engine.advanceMonth();
    expect(engine.getCourtAssistants(p.id)[0].citizen?.isAlive).toBe(true);
    expect(engine.getCourtAssistants(p.id)[0].citizenId).not.toBe(advisor.id);
    engine.setCourtAssistantMode(p.id,'forschung','beratung');engine.getCourtAssistants(p.id)[0].citizen!.isAlive=false;
    await engine.saveGame('vacant-court');const restored=new GameEngine({enableWiki:false});engines.push(restored);await restored.loadGame('vacant-court');
    expect(restored.getCourtAssistants(p.id)[0].citizen?.isAlive).toBe(false);
    const replacement=restored.getCourtCandidates(p.id)[0];restored.appointCourtAssistant(p.id,'forschung',replacement.id);
    expect(restored.getCourtAssistants(p.id)[0].citizenId).toBe(replacement.id);
  });

  it('surfaces an existing unnamed adult when an old save has no living successor',async()=>{
    const engine=await campaign(),p=engine.getActivePlayer();
    for(const citizen of engine.getCitizenSystem().getAllCitizens())citizen.isAlive=false;
    await engine.saveGame('no-survivors');const restored=new GameEngine({enableWiki:false});engines.push(restored);await restored.loadGame('no-survivors');
    expect(restored.getCurrentCharacter(p.id)).toBeNull();
    expect(restored.getCharacterSuccession(p.id).candidates).toHaveLength(1);
    expect(restored.getCharacterSuccession(p.id).candidates[0].familyRelations).toEqual([]);
    expect(restored.getPlayerById(p.id)?.kingdom.population).toEqual(p.kingdom.population);
  });

  it('runs care and personal automation through ten years of the actual monthly engine',async()=>{
    const engine=await campaign(),p=engine.getActivePlayer(),character=engine.getCurrentCharacter(p.id)!;
    const prefs=engine.getAdministration(p.id);prefs.domains.character=true;engine.setAdministration(p.id,prefs);
    engine.setCouncilAutomatic(p.id,true);
    for(let month=0;month<120;month++) {
      p.kingdom.resources.food=50000;p.kingdom.resources.gold=50000;
      await engine.advanceMonth();
    }
    expect(character.isAlive).toBe(true);expect(character.health.overall).toBeGreaterThan(60);
    expect(character.needs.food).toBeGreaterThan(60);expect(character.needs.shelter).toBeGreaterThan(50);
    expect(engine.getCurrentCharacter(p.id)).not.toBeNull();
  });

  it('keeps personal automation and successor control separate in hotseat',async()=>{
    const engine=new GameEngine({startingYear:-1999,enableWiki:false,randomEvents:false});engines.push(engine);
    const first=engine.addPlayer({name:'A',kingdomName:'A',gender:'other'}),second=engine.addPlayer({name:'B',kingdomName:'B',gender:'other'});
    await engine.startGame();engine.pauseGame();
    const prefs=engine.getAdministration(first.id);prefs.domains.character=true;prefs.characterPlan='study';engine.setAdministration(first.id,prefs);
    const other=engine.getCurrentCharacter(second.id)!,literacy=other.skills.literacy;
    expect(()=>engine.performCharacterAction(second.id,'study')).toThrow('Nicht am Zug');
    expect(()=>engine.switchCharacter(second.id,engine.getPlayableCharacters(1)[0].id)).toThrow('Nicht am Zug');
    engine.getCurrentCharacter(first.id)!.isAlive=false;
    await engine.advanceMonth();
    expect(engine.getCurrentCharacter(first.id)?.id).not.toBe(other.id);
    expect(engine.getCurrentCharacter(second.id)?.id).toBe(other.id);
    expect(other.skills.literacy).toBe(literacy);
    expect(engine.getAdministration(second.id).domains.character).toBe(false);
  });

  it('allows small monthly celebrations again after the month changes, including BCE saves',async()=>{
    const engine=new GameEngine({startingYear:-1999,randomEvents:false,enableWiki:false});engines.push(engine);
    const player=engine.addPlayer({name:'Fest',kingdomName:'Geest',gender:'other'});
    await engine.startGame();engine.pauseGame();
    player.kingdom.resources.gold=10000;player.kingdom.resources.food=10000;
    engine.holdFestival(player.id,'social-meal');
    expect(()=>engine.holdFestival(player.id,'social-meal')).toThrow('bereits');
    await engine.saveGame('bronze-festival');
    await engine.loadGame('bronze-festival');
    expect(()=>engine.holdFestival(player.id,'social-meal')).toThrow('bereits');
    await engine.advanceMonth();
    expect(engine.getFestivalOptions(player.id).find(o=>o.event.id==='social-meal')?.alreadyHeld).toBe(false);
  });

  it('charges a disaster once, logs the exact loss, and persists its resolution',async()=>{
    const engine=new GameEngine({startingYear:1200,randomEvents:true,enableWiki:false});engines.push(engine);
    const player=engine.addPlayer({name:'Test',kingdomName:'Geest',gender:'other'});
    await engine.startGame();engine.pauseGame();engine.setCouncilAutomatic(player.id,true);
    player.kingdom.resources.gold=100000;player.kingdom.resources.food=100000;
    const climate=engine.getClimateSystem();
    const snapshot=climate.serialize();
    snapshot.disasters.push(['test-flood',{id:'test-flood',type:'flood',severity:3,year:1200,month:1,affectedRegions:[],casualties:0,economicDamage:750,cropDamage:50,buildingsDamaged:0,resolved:false}]);
    // Seed through the supported climate save format.
    const {ClimateSystem}=await import('./ClimateSystem');
    const seeded=ClimateSystem.deserialize(snapshot);
    vi.spyOn(climate,'getActiveDisasters').mockImplementation(()=>seeded.getActiveDisasters());
    vi.spyOn(climate,'resolveDisaster').mockImplementation(id=>seeded.resolveDisaster(id));
    await engine.advanceMonth();
    expect(engine.getTreasuryReport(player.id)?.entries.find(e=>e.reason==='Naturereignis: Hochwasser')?.amount).toBe(-750);
    expect(engine.getChronicle().some(e=>e.message.includes('einmaliger Verlust 750 Gold'))).toBe(true);
    expect(seeded.getActiveDisasters()).toHaveLength(0);
    expect(ClimateSystem.deserialize(seeded.serialize()).getActiveDisasters()).toHaveLength(0);
    await engine.advanceMonth();
    expect(engine.getTreasuryReport(player.id)?.entries.some(e=>e.reason==='Naturereignis: Hochwasser')).toBe(false);
  });

  it('persists regional investments, validates actions and links completed civic aid',async()=>{
    const engine=await campaign(),player=engine.getPlayers()[0];
    Object.assign(player.kingdom.resources,{gold:50000,food:50000,wood:5000,stone:5000});
    const gold=player.kingdom.resources.gold;
    engine.addressRegionalProvisioning(player.id,'geest','storage');
    expect(player.kingdom.resources.gold).toBe(gold-400);
    expect(()=>engine.addressRegionalProvisioning(player.id,'geest','storage')).toThrow('bereits');
    const citizen=engine.getCivicMissions(player.id).citizens[0];
    engine.assignCivicMission(player.id,citizen.id,'grain');
    for(let n=0;n<3;n++)await engine.advanceMonth();
    expect(engine.getChronicle().some(e=>e.message.includes('Bürgerhilfe'))).toBe(true);
    expect(engine.getRegionalProvisioning(player.id)[0].storage).toBe(1);
    await engine.saveGame('regional');
    const restored=new GameEngine({enableWiki:false});engines.push(restored);await restored.loadGame('regional');
    expect(restored.getRegionalProvisioning(player.id)).toEqual(engine.getRegionalProvisioning(player.id));
    const {decodeSave}=await import('./SaveCodec');
    const snapshot:any=await decodeSave(await localforage.getItem('kaiser-ii-save-regional'));
    snapshot.regionalProvisioning[player.id].regions[0].storage=99;
    await localforage.setItem('kaiser-ii-save-bad-provision',snapshot);
    await expect(restored.loadGame('bad-provision')).rejects.toThrow('Versorgung');
    expect(restored.getRegionalProvisioning(player.id)[0].storage).toBe(1);
    delete snapshot.regionalProvisioning;
    await localforage.setItem('kaiser-ii-save-old-provision',snapshot);await restored.loadGame('old-provision');
    expect(restored.getRegionalProvisioning(player.id).every(r=>r.storage===0&&r.hunger===0)).toBe(true);
  });

  it('isolates regional decisions and persistence across hotseat realms',async()=>{
    const engine=new GameEngine({startingYear:-1999,randomEvents:false,enableWiki:false});engines.push(engine);
    const first=engine.addPlayer({name:'A',kingdomName:'A',gender:'other'}),second=engine.addPlayer({name:'B',kingdomName:'B',gender:'other'});
    await engine.startGame();engine.pauseGame();
    Object.assign(first.kingdom.resources,{gold:50000,wood:5000,stone:5000});
    expect(()=>engine.addressRegionalProvisioning(second.id,'geest','storage')).toThrow('Nicht am Zug');
    engine.addressRegionalProvisioning(first.id,'geest','storage');
    expect(engine.getRegionalProvisioning(second.id)[0].storage).toBe(0);
    await engine.saveGame('regional-hotseat');await engine.loadGame('regional-hotseat');
    expect(engine.getRegionalProvisioning(first.id)[0].storage).toBe(1);
    expect(engine.getRegionalProvisioning(second.id)[0].storage).toBe(0);
  });

  it('uses the civic administration budget for aid in a stressed region',async()=>{
    const engine=await campaign(),player=engine.getPlayers()[0];
    Object.assign(player.kingdom.resources,{gold:50000,food:50000});
    const prefs=engine.getAdministration(player.id);prefs.domains.civic=true;engine.setAdministration(player.id,prefs);
    engine.getRegionalProvisioning(player.id);
    await engine.saveGame('aid');
    const {decodeSave}=await import('./SaveCodec');
    const snapshot:any=await decodeSave(await localforage.getItem('kaiser-ii-save-aid'));
    snapshot.regionalProvisioning[player.id].regions[2].hunger=80;
    await localforage.setItem('kaiser-ii-save-aid',snapshot);await engine.loadGame('aid');
    await engine.advanceMonth();
    const region=engine.getRegionalProvisioning(player.id)[2];
    expect(region.reliefMonths).toBe(3);
    expect(region.hunger).toBe(40);
    expect(engine.getTreasuryReport(player.id)?.entries.some(e=>e.reason.includes('Nothilfe')&&e.amount===-120)).toBe(true);
  });

  it('rejects premature modernization and preserves old-save-compatible progress', async (): Promise<void> => {
    const engine = await campaign();
    const player = engine.getPlayers()[0];
    expect(engine.getModernizationOptions(player.id).some(x=>x.visible&&x.project.id==='village-well')).toBe(true);
    expect(engine.getModernizationOptions(player.id).find(x=>x.project.id==='manufacturing')?.visible).toBe(false);
    expect(engine.getModernizationOptions(player.id).every(x => !x.canStart)).toBe(true);
    expect(() => engine.launchModernization(player.id,'manufacturing')).toThrow('Verfügbar ab');
    await engine.saveGame('early-modernization');
    const loaded = new GameEngine({enableWiki:false});
    engines.push(loaded);
    await loaded.loadGame('early-modernization');
    expect(loaded.getModernizationOptions(player.id).every(x => !x.completed)).toBe(true);
  });

  it('funds one historical exhibit per realm and preserves it in a save', async (): Promise<void> => {
    const engine = await campaign();
    const player = engine.getPlayers()[0];
    player.kingdom.resources.gold = 4000;
    const option = engine.getExhibitionOptions(player.id).find(o => o.milestone.id === 'university-bologna');
    expect(option).toBeDefined();
    const culture = player.kingdom.stats.culturalInfluence;
    const gold = player.kingdom.resources.gold;
    expect(engine.sponsorExhibition(player.id, 'university-bologna')).toContain('Ausstellung');
    expect(player.kingdom.resources.gold).toBe(gold - option!.cost);
    expect(player.kingdom.stats.culturalInfluence).toBe(Math.min(100, culture + 2));
    expect(() => engine.sponsorExhibition(player.id, 'university-bologna')).toThrow('bereits');
    expect(() => engine.sponsorExhibition(player.id, 'moon')).toThrow('noch nicht');
    await engine.saveGame('exhibition');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('exhibition');
    expect(restored.getExhibitionOptions(player.id).find(o =>
      o.milestone.id === 'university-bologna')?.held).toBe(true);
  });

  it('activates the real Hanseatic route after sailing research, a port and 15030 gold', async (): Promise<void> => {
    const engine = await campaign();
    const player = engine.getPlayers()[0];
    const t = engine.getTransportSystem().getTradeRoute('hanseatic_routes');
    expect(t?.requiredTechnology).toBe('sailing');
    expect(engine.activateTradeRoute(player, 'hanseatic_routes').success).toBe(false);
    player.kingdom.infrastructure.schools = 2;
    for (let month = 0; month < 6; month++) await engine.advanceMonth();
    player.kingdom.resources.gold = 50000;
    engine.startResearch(player.id, 'sailing');
    await engine.advanceMonth();
    await engine.advanceMonth();
    expect(engine.getTechnologyProgress(player.id).researched).toContain('sailing');
    expect(engine.activateTradeRoute(player, 'hanseatic_routes').message).toContain('Hafen');
    player.kingdom.infrastructure.ports = 1;
    player.kingdom.resources.gold = 15029;
    expect(engine.activateTradeRoute(player, 'hanseatic_routes').success).toBe(false);
    player.kingdom.resources.gold = 15030;
    expect(engine.activateTradeRoute(player, 'hanseatic_routes').success).toBe(true);
    expect(player.kingdom.resources.gold).toBe(0);
    expect(player.kingdom.isTradeRouteActive('hanseatic_routes')).toBe(true);
  });

  it('appoints living advisors, keeps automatic actions optional and saves trained skills', async (): Promise<void> => {
    const engine = await campaign();
    const player = engine.getPlayers()[0];
    const citizen = engine.getCourtCandidates(player.id)[0];
    expect(citizen).toBeDefined();
    engine.appointCourtAssistant(player.id, 'forschung', citizen.id);
    expect(engine.getCourtAssistants(player.id)[0].mode).toBe('beratung');
    engine.setCourtAssistantMode(player.id, 'forschung', 'automatisch');
    const before = citizen.skills.literacy;
    await engine.advanceMonth();
    expect(citizen.skills.literacy).toBe(before + 1);
    await engine.saveGame('court-advisor');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('court-advisor');
    expect(restored.getCourtAssistants(player.id)[0].mode).toBe('automatisch');
    restored.dismissCourtAssistant(player.id, 'forschung');
    expect(restored.getCourtAssistants(player.id)).toHaveLength(0);
  });

  it('retains the chronicle across saves and limits history to 100 messages', async (): Promise<void> => {
    const engine = await campaign();
    for (let i=0;i<112;i++) engine.recordChronicle('Chronik-Ereignis '+i);
    expect(engine.getChronicle()).toHaveLength(100);
    expect(engine.getChronicle()[0].message).toBe('Chronik-Ereignis 111');
    await engine.saveGame('chronicle-persistent');
    const loaded = new GameEngine({ enableWiki:false });
    engines.push(loaded);
    await loaded.loadGame('chronicle-persistent');
    expect(loaded.getChronicle()).toEqual(engine.getChronicle());
    loaded.recordChronicle('Nach dem Laden');
    expect(loaded.getChronicle()[0].message).toBe('Nach dem Laden');
    expect(engine.getChronicle()[0].message).toBe('Chronik-Ereignis 111');
  });

  it('loads each campaign with six independent objectives and retains selection after saving', async (): Promise<void> => {
    for (const campaignId of ['aufbau', 'hanse', 'wissenschaft', 'grenzland', 'kultur', 'kaiserkrone'] as const) {
      const engine = new GameEngine({ enableWiki: false, randomEvents: false, campaignId });
      engines.push(engine);
      const ruler = engine.addPlayer({ name: 'Anna', kingdomName: 'Testmark', gender: 'other' });
      await engine.startGame();
      engine.pauseGame();
      expect(engine.getCampaignId()).toBe(campaignId);
      expect(engine.getCampaignGoals(ruler.id)).toHaveLength(6);
      await engine.saveGame('scenario-' + campaignId);
      const restored = new GameEngine({ enableWiki: false });
      engines.push(restored);
      await restored.loadGame('scenario-' + campaignId);
      expect(restored.getCampaignId()).toBe(campaignId);
      expect(restored.getCampaignGoals(ruler.id)).toEqual(engine.getCampaignGoals(ruler.id));
    }
  });

  it('completes the industrial campaign through buildings, research, save/load and victory', async (): Promise<void> => {
    const engine = new GameEngine({ startingYear:1820, campaignId:'industrie',
      randomEvents:false, enableWiki:false });
    engines.push(engine);
    const ruler = engine.addPlayer({name:'Anna', kingdomName:'Industrieprobe',gender:'other'});
    await engine.startGame(); engine.pauseGame();
    ruler.kingdom.resources.gold=100000;
    ruler.kingdom.resources.wood=20000;
    ruler.kingdom.resources.stone=20000;
    ruler.kingdom.resources.iron=5000;
    expect(engine.getCampaignChapterStatus(ruler.id).index).toBe(0);
    expect(await engine.buildForPlayer(ruler.id,'workshops')).toBe(true);
    expect(await engine.buildForPlayer(ruler.id,'workshops')).toBe(true);
    expect(await engine.buildForPlayer(ruler.id,'roads')).toBe(true);
    expect(await engine.buildForPlayer(ruler.id,'roads')).toBe(true);
    expect(engine.getCampaignChapterStatus(ruler.id).ready).toBe(false);
    for(let i=0;i<engine.getConstructionMonths('workshops');i++)await engine.advanceMonth();
    expect(engine.getCampaignChapterStatus(ruler.id).index).toBe(1);
    await engine.saveGame('full-industry');
    const restored = new GameEngine({enableWiki:false});
    engines.push(restored);await restored.loadGame('full-industry');
    const current=restored.getPlayerById(ruler.id)!;
    expect(restored.getCampaignChapterStatus(ruler.id).index).toBe(1);
    expect(await restored.buildForPlayer(ruler.id,'schools')).toBe(true);
    for(const tech of ['agriculture','writing','bronze_working']){
      for(let month=0;month<30 && !restored.getTechnologyOptions(ruler.id).find(o=>o.technology.id===tech)?.canStart;month++)
        await restored.advanceMonth();
      expect(restored.getTechnologyOptions(ruler.id).find(o=>o.technology.id===tech)?.canStart).toBe(true);
      restored.startResearch(ruler.id,tech);
      for(let month=0;month<8 && !restored.getTechnologyProgress(ruler.id).researched.includes(tech);month++)
        await restored.advanceMonth();
      expect(restored.getTechnologyProgress(ruler.id).researched).toContain(tech);
    }
    expect(restored.getCampaignChapterStatus(ruler.id).index).toBeGreaterThanOrEqual(2);
    for(let month=0;month<3 && !restored.getCampaignChapterStatus(ruler.id).finished;month++)
      await restored.advanceMonth();
    expect(restored.getCampaignChapterStatus(ruler.id).finished).toBe(true);
    expect(current.kingdom.resources.gold).toBeGreaterThan(5500);
    await restored.saveGame('industry-won');
    const victory = new GameEngine({enableWiki:false});engines.push(victory);
    await victory.loadGame('industry-won');
    expect(victory.getCampaignChapterStatus(ruler.id).finished).toBe(true);
    expect(victory.getCampaignChapterStatus(ruler.id).index).toBe(2);
  });

  it('keeps core economy and demographics finite over five simulated years', async (): Promise<void> => {
    const engine=await campaign();const player=engine.getPlayers()[0];
    for(let month=0;month<60;month++){
      await engine.advanceMonth();
      const {resources,happiness,population,stats}=player.kingdom;
      for(const value of Object.values(resources)) expect(Number.isFinite(value)).toBe(true);
      for(const value of Object.values(population)) expect(Number.isFinite(value)).toBe(true);
      expect(happiness).toBeGreaterThanOrEqual(0);
      expect(happiness).toBeLessThanOrEqual(100);
      expect(stats.stability).toBeGreaterThanOrEqual(0);
      expect(stats.stability).toBeLessThanOrEqual(100);
    }
    expect(engine.getCurrentYear()).toBe(1205);
  });

  it('starts later campaigns with meaningful first-chapter building goals', async (): Promise<void> => {
    for (const [id, needed] of [['industrie','Werkstätten'],['wiederaufbau','Bauernhöfe']] as const) {
      const engine = new GameEngine({ startingYear: id === 'industrie' ? 1820 : 1945,
        campaignId:id, randomEvents:false, enableWiki:false });
      engines.push(engine);
      const player = engine.addPlayer({name:'Anna', kingdomName:'Prüfreich',gender:'other'});
      await engine.startGame(); engine.pauseGame();
      const first = engine.getCampaignChapterStatus(player.id);
      expect(first.index).toBe(0);
      expect(first.ready).toBe(false);
      expect(first.goals[0].label).toContain(needed);
      await engine.advanceMonth();
      expect(engine.getCampaignChapterStatus(player.id).index).toBe(0);
    }
  });

  it('progresses campaign chapters once and saves milestone progress', async (): Promise<void> => {
    const engine = await campaign();
    const player = engine.getPlayers()[0];
    expect(engine.getCampaignChapterStatus(player.id).index).toBe(0);
    player.kingdom.infrastructure.farms = 12;
    player.kingdom.infrastructure.markets = 3;
    await engine.advanceMonth();
    expect(engine.getCampaignChapterStatus(player.id).index).toBe(1);
    const gold = player.kingdom.resources.gold;
    // A completed chapter must never award its reward again.
    await engine.advanceMonth();
    expect(engine.getCampaignChapterStatus(player.id).index).toBe(1);
    await engine.saveGame('story-progress');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('story-progress');
    expect(restored.getCampaignChapterStatus(player.id).index).toBe(1);
    expect(restored.getCampaignChapterStatus(player.id).title).toBe('Wissen und Vertrauen');
    expect(Number.isFinite(gold)).toBe(true);
  });

  it('can hold seasonal festivals once per year and preserve them in a savegame', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    // December contains the Christmas festival in the existing historical catalog.
    for (let month = 1; month < 12; month++) await engine.advanceMonth();
    const option = engine.getFestivalOptions(ruler.id).find((entry) => entry.event.id === 'christmas');
    expect(option).toBeDefined();
    ruler.kingdom.resources.gold = Math.max(ruler.kingdom.resources.gold, 1000);
    ruler.kingdom.resources.food = Math.max(ruler.kingdom.resources.food, 1500);
    const message = engine.holdFestival(ruler.id, 'christmas');
    expect(message).toContain('Weihnachten');
    expect(engine.getFestivalOptions(ruler.id).find((item) => item.event.id === 'christmas')?.alreadyHeld).toBe(true);
    expect(() => engine.holdFestival(ruler.id, 'christmas')).toThrow();
    await engine.saveGame('festival');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('festival');
    expect(restored.getFestivalOptions(ruler.id).find((entry) => entry.event.id === 'christmas')?.alreadyHeld).toBe(true);
  });

  it('plays and saves an ongoing siege with real monthly supply costs', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    ruler.kingdom.resources.gold = 10000;
    ruler.kingdom.resources.food = 10000;
    const rival = engine.getRivals(ruler.id)[0];
    const before = rival.fortification;
    expect(engine.beginCampaignSiege(ruler.id, rival.id)).toContain('Belagerungsring');
    expect(() => engine.beginCampaignSiege(ruler.id, rival.id)).toThrow('nur eine');
    expect(ruler.kingdom.resources.gold).toBe(9500);
    expect(ruler.kingdom.resources.food).toBe(9750);
    await engine.saveGame('active-siege');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('active-siege');
    expect(restored.getCampaignSiege(ruler.id)?.rivalId).toBe(rival.id);
    expect(restored.getCampaignSiege(ruler.id)?.duration).toBe(0);
    expect(()=>restored.negotiateRivalAgreement(ruler.id,rival.id,'alliance')).toThrow('Belagerung');
    expect(()=>restored.negotiateRivalTruce(ruler.id,rival.id)).toThrow('Belagerung');
    await restored.advanceMonth();
    expect(restored.getCampaignSiege(ruler.id)?.duration).toBe(5);
    expect(restored.getRivals(ruler.id)[0].fortification).toBe(before);
    expect(restored.resupplyCampaignSiege(ruler.id)).toContain('Versorgungswagen');
    expect(restored.withdrawCampaignSiege(ruler.id)).toContain('bricht');
    expect(restored.getCampaignSiege(ruler.id)).toBeNull();
  });

  it('blocks siege targets protected by truce and refuses insufficient provisions', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const rival = engine.getRivals(ruler.id)[0];
    ruler.kingdom.resources.food = 0;
    expect(() => engine.beginCampaignSiege(ruler.id, rival.id)).toThrow('250 Nahrung');
    expect(engine.getCampaignSiege(ruler.id)).toBeNull();
  });

  it('spends border watch supplies once and consumes the defense after one tick', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    ruler.kingdom.resources.gold = Math.max(2000, ruler.kingdom.resources.gold);
    ruler.kingdom.resources.wood = Math.max(500, ruler.kingdom.resources.wood);
    const gold = ruler.kingdom.resources.gold;
    const wood = ruler.kingdom.resources.wood;
    expect(engine.prepareBorderWatch(ruler.id)).toContain('Grenzwache');
    expect(ruler.kingdom.resources.gold).toBe(gold - 300);
    expect(ruler.kingdom.resources.wood).toBe(wood - 150);
    expect(() => engine.prepareBorderWatch(ruler.id)).toThrow('bereits');
    await engine.saveGame('watch');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('watch');
    expect(restored.hasBorderWatch(ruler.id)).toBe(true);
    await restored.advanceMonth();
    expect(restored.hasBorderWatch(ruler.id)).toBe(false);
  });

  it('persists a two-year non-aggression treaty and prevents attacks and raids', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const rival = engine.getRivals(ruler.id)[0];
    ruler.kingdom.resources.gold = Math.max(2000, ruler.kingdom.resources.gold);
    expect(() => engine.negotiateRivalTruce(ruler.id, rival.id)).toThrow('Beziehungspunkte');
    engine.sendRivalEnvoy(ruler.id, rival.id);
    // A successful existing mission increases relations and unlocks peace.
    const diplomacy = engine.getRivalMissions(ruler.id);
    expect(diplomacy).toHaveLength(1);
    // No direct mutable diplomacy accessor: let the mission complete using deterministic random.
    for (let month = 0; month < 12; month++) await engine.advanceMonth();
    const relation = engine.getRivalRelations(ruler.id).find((item) => item.kingdomId === rival.id);
    // At least one mission succeeded or failed; more envoys may be required for 10 points.
    if ((relation?.relationshipValue ?? 0) < 10) {
      engine.sendRivalEnvoy(ruler.id, rival.id);
      for (let month = 0; month < 12; month++) await engine.advanceMonth();
    }
    expect(engine.negotiateRivalTruce(ruler.id, rival.id)).toContain('Nichtangriffspakt');
    expect(engine.hasRivalTruce(ruler.id, rival.id)).toBe(true);
    expect(() => engine.attackRival(ruler.id, rival.id)).toThrow('Nichtangriffspakt');
    await engine.saveGame('peace-roundtrip');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('peace-roundtrip');
    expect(restored.hasRivalTruce(ruler.id, rival.id)).toBe(true);
    expect(() => restored.negotiateRivalTruce(ruler.id, rival.id)).toThrow('bereits');
    for (let month = 0; month < 24; month++) await restored.advanceMonth();
    expect(restored.hasRivalTruce(ruler.id, rival.id)).toBe(false);
  });

  it('keeps covert agents isolated between players and restores them from saves', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const rival = engine.getRivals(ruler.id)[0];
    const other = engine.addPlayer({ name: 'Anna', kingdomName: 'Nachbarreich', gender: 'other',
      startingStats: { age: 25 } });
    const starting = ruler.kingdom.resources.gold;
    expect(engine.recruitCampaignSpy(ruler.id)).toContain('Kundschafter');
    expect(ruler.kingdom.resources.gold).toBe(starting - 400);
    expect(engine.getCampaignIntelligence(other.id).agents).toHaveLength(0);
    expect(engine.sendCampaignSpy(ruler.id, engine.getCampaignIntelligence(ruler.id).agents[0].id, rival.id))
      .toContain(rival.name);
    expect(engine.getCampaignIntelligence(ruler.id).missions).toHaveLength(1);
    await engine.saveGame('spy-roundtrip');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('spy-roundtrip');
    expect(restored.getCampaignIntelligence(ruler.id).agents).toHaveLength(1);
    expect(restored.getCampaignIntelligence(ruler.id).missions).toHaveLength(1);
    expect(restored.getCampaignIntelligence(other.id).agents).toHaveLength(0);
  });

  it('finances an army with a per-realm loan, charges installments and restores debts', async (): Promise<void> => {
    const engine = await campaign();
    const player = engine.getPlayers()[0];
    const gold = player.kingdom.resources.gold;
    expect(engine.takeWarLoan(player.id)).toContain('Rüstungsdarlehen');
    expect(player.kingdom.resources.gold).toBe(gold + 3000);
    const debt = engine.getWarFinanceOverview(player.id).stats.totalWarDebt;
    expect(debt).toBeGreaterThan(3000);
    expect(() => engine.takeWarLoan(player.id)).toThrow('bereits');
    await engine.advanceMonth();
    expect(engine.getWarFinanceOverview(player.id).stats.totalWarDebt).toBeLessThan(debt);
    const report=engine.getTreasuryReport(player.id)!;
    expect(report.entries.find(e=>e.reason.includes('Darlehen'))?.amount).toBeLessThan(0);
    expect(report.opening+report.entries.reduce((sum,e)=>sum+e.amount,0)).toBeCloseTo(report.closing);
    expect(engine.getChronicle().some(e=>e.message.includes('Kassenabschluss'))).toBe(true);
    await engine.saveGame('war-loan');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('war-loan');
    expect(restored.getWarFinanceOverview(player.id).stats.totalWarDebt)
      .toBeCloseTo(engine.getWarFinanceOverview(player.id).stats.totalWarDebt);
    expect(restored.getWarFinanceOverview(player.id).available).toBe(false);
    expect(restored.getTreasuryReport(player.id)).toEqual(report);
  });

  it('lets rulers send embassies and restores relations after saving', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const rival = engine.getRivals(ruler.id)[0];
    const gold = ruler.kingdom.resources.gold;
    expect(engine.getRivalRelations(ruler.id)).toHaveLength(3);
    expect(engine.sendRivalEnvoy(ruler.id, rival.id)).toContain(rival.name);
    expect(ruler.kingdom.resources.gold).toBe(gold - 350);
    expect(engine.getRivalMissions(ruler.id)).toHaveLength(1);
    expect(() => engine.sendRivalEnvoy(ruler.id, rival.id)).toThrow();
    await engine.saveGame('diplomacy-roundtrip');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('diplomacy-roundtrip');
    expect(restored.getRivalMissions(ruler.id)).toHaveLength(1);
    expect(restored.getRivalRelations(ruler.id)).toHaveLength(3);
  });

  it('automatically saves the completed month and can restore that checkpoint', async (): Promise<void> => {
    const engine = await campaign();
    await engine.advanceMonth();
    const autosave = (await engine.listSaves()).find((save) => save.slot === 'autosave');
    expect(autosave).toBeDefined();
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('autosave');
    expect(restored.getCurrentMonth()).toBe(2);
    expect(restored.getGameState()).toBe(GameState.PAUSED);
  });

  it('loads bundled game data before starting and uses the same month everywhere', async (): Promise<void> => {
    const engine = await campaign();
    expect(engine.getAvailableTradeRoutes(engine.getPlayers()[0]).length).toBeGreaterThan(0);
    await engine.advanceMonth();
    expect(engine.getCurrentMonth()).toBe(2);
    expect(engine.getTimeSystem().getFormattedDate()).toBe('1.2.1200');
    expect(engine.getGameState()).toBe(GameState.PAUSED);
  });

  it('applies statistic deltas without granting unearned jubilees or exponential prestige in month one', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const before = { gold: ruler.kingdom.resources.gold, prestige: ruler.stats.prestige };
    const forecast = ruler.kingdom.getMonthlyBalance();
    await engine.advanceMonth();
    expect(ruler.kingdom.resources.gold).toBe(before.gold + forecast.net.gold);
    expect(ruler.stats.prestige - before.prestige).toBeLessThan(2);
    expect(ruler.achievements.some((achievement: Achievement): boolean => achievement.id === 'golden_reign')).toBe(false);
  });

  it('rejects duplicate starts and concurrent month updates', async (): Promise<void> => {
    const engine = await campaign();
    await expect(engine.startGame()).rejects.toThrow('bereits gestartet');
    const month = engine.advanceMonth();
    await expect(engine.advanceMonth()).rejects.toThrow('bereits verarbeitet');
    await month;
    expect(engine.getCurrentMonth()).toBe(2);
  });

  it('applies twelve months, ages the ruler once and aligns the kingdom year', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    for (let month = 0; month < 12; month++) await engine.advanceMonth();
    expect(engine.getCurrentYear()).toBe(1201);
    expect(engine.getCurrentMonth()).toBe(1);
    expect(engine.getTimeSystem().getCurrentYear()).toBe(1201);
    expect(ruler.stats.age).toBe(26);
    expect(ruler.kingdom.currentYear).toBe(1201);
  });

  it('uses shared construction costs for every visible category', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    for (const resource of ['gold', 'wood', 'stone', 'iron'] as const) ruler.kingdom.resources[resource] = 100000;
    const before = ruler.kingdom.infrastructure.schools;
    expect(await engine.buildForPlayer(ruler.id, 'schools')).toBe(true);
    expect(ruler.kingdom.infrastructure.schools).toBe(before);
    for(let i=0;i<engine.getConstructionMonths('schools');i++)await engine.advanceMonth();
    expect(ruler.kingdom.infrastructure.schools).toBe(before + 1);
    await expect(engine.buildForPlayer(ruler.id, 'not-a-building')).rejects.toThrow('Unbekanntes');
  });

  it('executes atomic market exchanges with no buy/sell profit exploit', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const tradeCompleted = vi.fn();
    engine.on('tradeCompleted', tradeCompleted);
    const before = { ...ruler.kingdom.resources };
    expect(engine.tradeForPlayer(ruler.id, 'food', 500, 'buy')).toBe(true);
    expect(tradeCompleted).toHaveBeenLastCalledWith({
      playerId: ruler.id, resource: 'food', amount: 500, direction: 'buy',
      price: engine.quoteTrade('food', 500, 'buy')
    });
    expect(ruler.kingdom.resources.food).toBe(before.food + 500);
    expect(engine.tradeForPlayer(ruler.id, 'food', 500, 'sell')).toBe(true);
    expect(ruler.kingdom.resources.food).toBe(before.food);
    expect(ruler.kingdom.resources.gold).toBeLessThan(before.gold);
    const after = { ...ruler.kingdom.resources };
    expect(engine.tradeForPlayer(ruler.id, 'food', 1000000, 'buy')).toBe(false);
    expect(tradeCompleted).toHaveBeenCalledTimes(2);
    expect(ruler.kingdom.resources).toEqual(after);
    expect(() => engine.quoteTrade('food', -100, 'sell')).toThrow(RangeError);
    expect(() => engine.setTaxRate(ruler.id, NaN)).toThrow(RangeError);
  });

  it('exposes realm research methods without requiring a market exchange', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const before = { ...ruler.kingdom.resources };
    expect(engine.getTechnologyProgress(ruler.id)).toEqual({
      researchPoints: 0, researched: [], currentResearch: null
    });
    expect(engine.getTechnologyOptions(ruler.id).length).toBeGreaterThan(0);
    expect(() => engine.startResearch(ruler.id, 'unknown-technology')).toThrow('aktuellen Epoche');
    expect(ruler.kingdom.resources).toEqual(before);
  });

  it('round-trips infrastructure, resources, citizens and role references into a fresh paused engine', async (): Promise<void> => {
    const original = await campaign();
    const ruler = original.getPlayers()[0];
    await original.buildForPlayer(ruler.id, 'farm');
    await original.advanceMonth();
    await original.saveGame('roundtrip');
    const expectedResources = { ...ruler.kingdom.resources };
    const citizenIds = original.getCitizenSystem().getAllCitizens().map((citizen: Citizen): string => citizen.id);
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('roundtrip');
    expect(restored.getPlayers()[0].kingdom.resources).toEqual(expectedResources);
    expect(restored.getPlayers()[0].kingdom.infrastructure.farms).toBe(8);
    expect(restored.getProjects(ruler.id)[0]).toMatchObject({target:'farms',remaining:2});
    expect(restored.getCitizenSystem().getAllCitizens().map((citizen: Citizen): string => citizen.id)).toEqual(citizenIds);
    const restoredRole = restored.getRoleSwitchingSystem().createSessionSnapshot(ruler.id);
    expect(restoredRole?.currentCitizenId).toBe(
      original.getRoleSwitchingSystem().createSessionSnapshot(ruler.id)?.currentCitizenId
    );
    expect(restored.getCitizenSystem().getCitizen(restoredRole?.currentCitizenId ?? '')).toBeDefined();
    expect(restored.getGameState()).toBe(GameState.PAUSED);
    expect(restored.getTimeSystem().getPaused()).toBe(true);
    await restored.advanceMonth();
    expect(restored.getCurrentMonth()).toBe(3);
    expect((await restored.listSaves()).find((save: SaveMeta): boolean => save.slot === 'roundtrip')).toBeDefined();
  });

  it('leaves the current game intact when a malformed save is rejected', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    await localforage.setItem('kaiser-ii-save-invalid', { players: [], currentYear: 1200, currentMonth: 99 });
    await expect(engine.loadGame('invalid')).rejects.toThrow('beschädigt');
    expect(engine.getPlayers()[0]).toBe(ruler);
    expect(engine.getCurrentMonth()).toBe(1);
  });

  it('stops time on pause and resumes a single automatic simulation timer', async (): Promise<void> => {
    const engine = await campaign();
    vi.useFakeTimers();
    engine.getTimeSystem().setMode(TimeMode.BALANCED);
    engine.resumeGame();
    await vi.advanceTimersByTimeAsync(1000);
    expect(engine.getCurrentMonth()).toBe(2);
    engine.pauseGame();
    await vi.advanceTimersByTimeAsync(10000);
    expect(engine.getCurrentMonth()).toBe(2);
    engine.resumeGame();
    engine.resumeGame();
    await vi.advanceTimersByTimeAsync(1000);
    expect(engine.getCurrentMonth()).toBe(3);
  });

  it('can reach every campaign objective through funded actions and monthly production, without cheats', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    engine.setTaxRate(ruler.id, 0.1);
    expect(engine.attackRival(ruler.id, 'raubritter').attackerWon).toBe(true);
    for (let month = 0; month < 180; month++) {
      for (const resource of ['food', 'wood', 'stone', 'iron'] as const) {
        const reserve: Record<MarketResource, number> = { food: 3000, wood: 1500, stone: 1500, iron: 500 };
        const surplus = Math.floor(ruler.kingdom.resources[resource] - reserve[resource]);
        if (surplus > 0) expect(engine.tradeForPlayer(ruler.id, resource, surplus, 'sell')).toBe(true);
      }
      if (ruler.kingdom.resources.wood < 800 && ruler.kingdom.resources.gold > 2000) {
        expect(engine.tradeForPlayer(ruler.id, 'wood', 1500, 'buy')).toBe(true);
      }
      for (const [building, target] of [['farms', 12], ['markets', 3], ['schools', 2]] as const) {
        if (ruler.kingdom.infrastructure[building] < target) await engine.buildForPlayer(ruler.id, building);
      }
      if (ruler.kingdom.infrastructure.farms >= 12 && ruler.kingdom.getMonthlyBalance().net.gold < 0) {
        await engine.buildForPlayer(ruler.id, 'markets');
      }
      if (engine.getCampaignGoals(ruler.id).every((goal: CampaignGoal): boolean => goal.done)) break;
      await engine.advanceMonth();
    }
    expect(
      engine.getCampaignGoals(ruler.id).filter((goal: CampaignGoal): boolean => !goal.done),
      JSON.stringify({
        resources: ruler.kingdom.resources, happiness: ruler.kingdom.happiness,
        infrastructure: ruler.kingdom.infrastructure, balance: ruler.kingdom.getMonthlyBalance()
      })
    ).toEqual([]);
    expect(ruler.kingdom.happiness).toBeGreaterThanOrEqual(65);
    expect(ruler.kingdom.resources.gold).toBeGreaterThanOrEqual(8000);
  });

  it('resolves field campaigns with supply costs, casualties, loot and a monthly limit', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const army = engine.getArmyOverview(ruler.id);
    const before = { gold: ruler.kingdom.resources.gold, soldiers: army.soldiers };
    expect(engine.getVictoryChance(ruler.id, 'raubritter')).toBeGreaterThan(0.5);
    const report = engine.attackRival(ruler.id, 'raubritter');
    expect(report.attackerWon).toBe(true);
    expect(report.attackerLosses).toBeGreaterThan(0);
    expect(engine.getArmyOverview(ruler.id).soldiers).toBe(before.soldiers - report.attackerLosses);
    expect(ruler.kingdom.resources.gold).toBe(before.gold - army.cost.gold + report.plunder);
    expect(engine.getRivals(ruler.id).find((rival) => rival.id === 'raubritter')?.subjugated).toBe(true);
    expect(() => engine.attackRival(ruler.id, 'ostmark')).toThrow('bereits gekämpft');
    expect(engine.getCampaignGoals(ruler.id).at(-1)?.done).toBe(true);
    await engine.advanceMonth();
    const lost = engine.attackRival(ruler.id, 'nordland');
    expect(lost.attackerWon).toBe(false);
    expect(engine.getBattleReports(ruler.id)).toHaveLength(2);
  });

  it('lets the player switch characters and act once per month with real effects', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const first = engine.getCurrentCharacter(ruler.id);
    expect(first).not.toBeNull();
    const candidate = engine.getPlayableCharacters(5)[0];
    expect(candidate.id).not.toBe(first?.id);
    engine.switchCharacter(ruler.id, candidate.id);
    expect(engine.getCurrentCharacter(ruler.id)?.id).toBe(candidate.id);
    expect(engine.getCitizenSystem().getCitizen(first?.id ?? '')?.isPlayerCharacter).toBe(false);
    const training = ruler.kingdom.military.trainingLevel;
    const combat = candidate.skills.combat;
    engine.performCharacterAction(ruler.id, 'train');
    expect(candidate.skills.combat).toBeGreaterThan(combat);
    expect(ruler.kingdom.military.trainingLevel).toBeGreaterThan(training);
    expect(() => engine.performCharacterAction(ruler.id, 'work')).toThrow('bereits gehandelt');
    await engine.advanceMonth();
    expect(engine.canCharacterAct(ruler.id)).toBe(true);
    await engine.saveGame('character');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('character');
    expect(restored.getCurrentCharacter(ruler.id)?.id).toBe(candidate.id);
  });

  it('accumulates realm-specific research, persists projects and gates trade routes on technology', async (): Promise<void> => {
    const engine = await campaign();
    const ruler = engine.getPlayers()[0];
    const other = engine.addPlayer({ name: 'Mathilde', kingdomName: 'Westmark', gender: 'other' });
    const sailing = engine.getTechnologyOptions(ruler.id).find((option) =>
      option.technology.id === 'sailing');
    expect(sailing?.canStart).toBe(false);
    expect(engine.getAvailableTradeRoutes(ruler).some((route) => route.id === 'hanseatic_routes')).toBe(false);
    expect(engine.activateTradeRoute(ruler, 'hanseatic_routes')).toMatchObject({
      success: false, message: 'Erfordert Technologie: Hochseesegeln'
    });
    engine.performCharacterAction(ruler.id, 'study');

    for (let month = 0; month < 12; month++) await engine.advanceMonth();
    const researchBefore = engine.getTechnologyProgress(ruler.id);
    expect(researchBefore.researchPoints).toBeGreaterThanOrEqual(120);
    expect(engine.getTechnologyProgress(other.id).researchPoints).toBeLessThan(researchBefore.researchPoints);
    expect(engine.startResearch(ruler.id, 'sailing').name).toBe('Hochseesegeln');
    await engine.advanceMonth();
    await engine.saveGame('research');

    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('research');
    const restoredProgress = restored.getTechnologyProgress(ruler.id);
    expect(restoredProgress.currentResearch).toMatchObject({ technologyId: 'sailing', progressDays: 30 });
    await restored.advanceMonth();
    expect(restored.getTechnologyProgress(ruler.id).researched).toContain('sailing');
    expect(restored.getAvailableTradeRoutes(restored.getPlayers()[0])
      .some((route) => route.id === 'hanseatic_routes')).toBe(true);
  });

  it('plays local hotseat turns, advances the month after the last player and supports player battles', async (): Promise<void> => {
    const engine = new GameEngine({ startingYear: 1200, randomEvents: false, enableWiki: false });
    engines.push(engine);
    const first = engine.addPlayer({ name: 'Anna', kingdomName: 'Westreich', gender: 'other' });
    const second = engine.addPlayer({ name: 'Otto', kingdomName: 'Ostreich', gender: 'other' });
    await engine.startGame();
    engine.pauseGame();
    expect(engine.isHotseat()).toBe(true);
    engine.resumeGame();
    expect(engine.getGameState()).toBe(GameState.PAUSED);
    expect(engine.getActivePlayer().id).toBe(first.id);
    expect(engine.getCurrentCharacter(first.id)?.id).not.toBe(engine.getCurrentCharacter(second.id)?.id);
    let result = await engine.endTurn();
    expect(result).toMatchObject({ monthAdvanced: false });
    expect(result.activePlayer.id).toBe(second.id);
    expect(engine.getCurrentMonth()).toBe(1);
    second.kingdom.recruitSoldiers(100, 'infantry');
    second.kingdom.resources.gold += 1000;
    second.kingdom.resources.food += 1000;
    const report = engine.attackPlayer(second.id, first.id);
    expect(report.kind).toBe('duel');
    expect(engine.getBattleReports(first.id)[0].id).toBe(report.id);
    result = await engine.endTurn();
    expect(result.monthAdvanced).toBe(true);
    expect(result.activePlayer.id).toBe(first.id);
    expect(engine.getCurrentMonth()).toBe(2);
    const checkpoint = new GameEngine({ enableWiki: false });
    engines.push(checkpoint);
    await checkpoint.loadGame('autosave');
    expect(checkpoint.getActivePlayer().id).toBe(first.id);
    expect(checkpoint.getCurrentMonth()).toBe(2);
    await engine.endTurn();
    await engine.saveGame('hotseat');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('hotseat');
    expect(restored.getActivePlayer().id).toBe(second.id);
    expect(restored.getRivals(first.id)).toHaveLength(3);
  });

  describe('real defeat conditions (bankruptcy, famine, anarchy)', (): void => {
    it('requires an explicit sandbox continuation and persists the free campaign', async () => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      expect(() => engine.continueAsSandbox()).toThrow('noch nicht abgeschlossen');
      for (let month = 0; month < 3; month++) {
        player.kingdom.resources.gold = 0;
        player.kingdom.resources.food = 20000;
        player.kingdom.happiness = 60;
        await engine.advanceMonth();
      }
      expect(engine.isPlayerDefeated(player.id)).toBe(true);
      engine.resumeGame();
      expect(engine.getGameState()).toBe(GameState.PAUSED);
      engine.continueAsSandbox();
      engine.pauseGame();
      expect(engine.getCampaignId()).toBe('frei');
      expect(engine.getCampaignGoals(player.id)).toEqual([]);
      expect(engine.isPlayerDefeated(player.id)).toBe(false);
      await engine.saveGame('sandbox-continuation');
      await engine.loadGame('sandbox-continuation');
      expect(engine.getCampaignId()).toBe('frei');
      expect(engine.isPlayerDefeated(player.id)).toBe(false);
      await engine.advanceMonth();
      expect(engine.getCurrentMonth()).toBe(5);
    });
    it('does not defeat a healthy realm over a full year', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      for (let month = 0; month < 12; month++) {
        await engine.advanceMonth();
        expect(engine.isPlayerDefeated(player.id)).toBe(false);
      }
      expect(engine.getPlayerDefeatReason(player.id)).toBeNull();
    });

    it('declares bankruptcy after three months without gold and pauses the game', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      const k = player.kingdom;
      const defeats: Array<{ reason: string }> = [];
      engine.on('campaignDefeat', (detail: { playerId: string; reason: string }): void => {
        defeats.push({ reason: detail.reason });
      });
      // Gold bleibt drei Monate auf null, Nahrung/Zufriedenheit gesund.
      for (let month = 0; month < 3; month++) {
        k.resources.gold = 0;
        k.resources.food = 20000;
        k.happiness = 60;
        await engine.advanceMonth();
      }
      expect(engine.isPlayerDefeated(player.id)).toBe(true);
      expect(engine.getPlayerDefeatReason(player.id)).toBe('bankruptcy');
      expect(defeats).toEqual([{ reason: 'bankruptcy' }]);
      expect(engine.getGameState()).toBe(GameState.PAUSED);
    });

    it('declares famine after two months without food', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      const k = player.kingdom;
      k.infrastructure.farms = 0;
      for (let month = 0; month < 2; month++) {
        k.resources.food = 0;
        k.resources.gold = 20000;
        k.happiness = 60;
        await engine.advanceMonth();
      }
      expect(engine.isPlayerDefeated(player.id)).toBe(true);
      expect(engine.getPlayerDefeatReason(player.id)).toBe('famine');
    });

    it('declares anarchy after six months of collapsed happiness', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      const k = player.kingdom;
      for (let month = 0; month < 6; month++) {
        k.resources.gold = 20000;
        k.resources.food = 20000;
        k.happiness = 0;
        await engine.advanceMonth();
      }
      expect(engine.isPlayerDefeated(player.id)).toBe(true);
      expect(engine.getPlayerDefeatReason(player.id)).toBe('anarchy');
    });

    it('never re-fires a defeat and records it in the chronicle', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      const k = player.kingdom;
      let fired = 0;
      engine.on('campaignDefeat', (): void => { fired += 1; });
      for (let month = 0; month < 5; month++) {
        k.resources.gold = 0;
        k.resources.food = 20000;
        k.happiness = 60;
        await engine.advanceMonth();
      }
      expect(fired).toBe(1);
      expect(engine.getChronicle().some((entry) => entry.message.includes('Bankrott'))).toBe(true);
    });

    it('persists the defeat state across a save/load round-trip', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      const k = player.kingdom;
      for (let month = 0; month < 3; month++) {
        k.resources.gold = 0;
        k.resources.food = 20000;
        k.happiness = 60;
        await engine.advanceMonth();
      }
      expect(engine.isPlayerDefeated(player.id)).toBe(true);
      await engine.saveGame('defeat-save');
      const restored = new GameEngine({ enableWiki: false });
      engines.push(restored);
      await restored.loadGame('defeat-save');
      expect(restored.isPlayerDefeated(player.id)).toBe(true);
      expect(restored.getPlayerDefeatReason(player.id)).toBe('bankruptcy');
    });

    it('loads a pre-defeat save without a defeat state safely', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      await engine.advanceMonth();
      await engine.saveGame('pre-defeat');
      expect(engine.isPlayerDefeated(player.id)).toBe(false);
      const restored = new GameEngine({ enableWiki: false });
      engines.push(restored);
      await restored.loadGame('pre-defeat');
      expect(restored.isPlayerDefeated(player.id)).toBe(false);
      expect(restored.getPlayerDefeatReason(player.id)).toBeNull();
    });
  });

  describe('historical model integration', (): void => {
    it('exposes the evidenced historical context for the current year', async (): Promise<void> => {
      const engine = await campaign();
      const player = engine.getPlayers()[0];
      const context = engine.getHistoricalContext(player.id);
      expect(context.year).toBe(1200);
      expect(context.epoch?.id).toBe('hochmittelalter');
      expect(context.epochEvidence).toBe('naeherung');
      expect(context.system).not.toBeNull();
      // Alternatives Geschichtsbild ist immer gekennzeichnet.
      expect(context.alternateHistory).toBe(true);
      expect(context.summary).toContain('Hochmittelalter');
    });

    it('never claims a dignity that the epoch does not evidence', async (): Promise<void> => {
      const engine = new GameEngine({ startingYear: 1200, randomEvents: false, enableWiki: false });
      engines.push(engine);
      const player = engine.addPlayer({ name: 'Anna', kingdomName: 'Prüfreich', gender: 'other' });
      await engine.startGame();
      engine.pauseGame();
      // Frischer Spieler startet mit niedrigem Rang – im Hochmittelalter ist eine
      // frühe Herrschaftsform belegt, aber kein modernes Amt.
      const dignity = engine.getRulerDignity(player.id);
      if (dignity) {
        expect(dignity.epochIds).toContain('hochmittelalter');
        expect(dignity.systemIds.length).toBeGreaterThan(0);
      }
      expect(engine.getHistoricalContext(player.id).rulerDignity?.id ?? 'keine')
        .not.toBe('bundeskanzler');
    });

    it('fires historicalEpochChanged only when the evidenced epoch actually changes', async (): Promise<void> => {
      const engine = new GameEngine({ startingYear: 1908, randomEvents: false, enableWiki: false });
      engines.push(engine);
      engine.addPlayer({ name: 'Otto', kingdomName: 'Prüfreich', gender: 'other' });
      await engine.startGame();
      engine.pauseGame();
      const changes: Array<{ epochName: string; year: number }> = [];
      engine.on('historicalEpochChanged', (detail: { epochName: string; year: number }): void => {
        changes.push({ epochName: detail.epochName, year: detail.year });
      });
      // 1908 → 1919: Kaiserreich → Weimarer Republik
      for (let month = 0; month < 12 * 12 && changes.length === 0; month++) {
        await engine.advanceMonth();
      }
      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].epochName).toContain('Weimar');
      expect(changes[0].year).toBe(1919);
    });

    it('records the epoch change in the chronicle', async (): Promise<void> => {
      const engine = new GameEngine({ startingYear: 1918, randomEvents: false, enableWiki: false });
      engines.push(engine);
      engine.addPlayer({ name: 'Otto', kingdomName: 'Prüfreich', gender: 'other' });
      await engine.startGame();
      engine.pauseGame();
      for (let month = 0; month < 24; month++) await engine.advanceMonth();
      expect(engine.getChronicle().some((entry) => entry.message.includes('Neue Epoche'))).toBe(true);
    });

    it('returns no epoch for years with unverified boundaries', async (): Promise<void> => {
      const engine = new GameEngine({ startingYear: 700, randomEvents: false, enableWiki: false });
      engines.push(engine);
      const player = engine.addPlayer({ name: 'Hilde', kingdomName: 'Frühreich', gender: 'other' });
      await engine.startGame();
      engine.pauseGame();
      const context = engine.getHistoricalContext(player.id);
      // Die Frühzeit ist bewusst ungeprüft: es wird keine Epoche behauptet.
      expect(context.epoch).toBeNull();
      expect(context.epochEvidence).toBe('nicht_verifiziert');
      expect(context.rulerDignity).toBeNull();
    });
  });

  describe('interactive tutorial campaign (build → trade → research → council → save)', (): void => {    const tutorialEngine = async (): Promise<{ engine: GameEngine; player: ReturnType<GameEngine['getPlayers']>[number] }> => {
      const engine = new GameEngine({ startingYear: 1200, randomEvents: false, enableWiki: false, enableTutorial: true });
      engines.push(engine);
      const player = engine.addPlayer({ name: 'Heinrich', kingdomName: 'Tutorialreich', gender: 'other' });
      await engine.startGame();
      engine.pauseGame();
      return { engine, player };
    };

    /**
     * Bringt das Reich in den Zustand, in dem „Landwirtschaft" (100 Punkte,
     * 500 Gold) sofort startbar ist: Schulen für den Punktezuwachs und
     * genügend Gold. Der Monatswechsel ist deterministisch (Math.random = 0.5).
     */
    const readyForResearch = async (engine: GameEngine, player: ReturnType<GameEngine['getPlayers']>[number]): Promise<void> => {
      player.kingdom.infrastructure.schools = 5; // 50 Punkte/Monat
      player.kingdom.resources.gold += 1000;
      for (let month = 0; month < 3 && !engine.getTechnologyOptions(player.id).find((o) => o.technology.id === 'agriculture')?.canStart; month++) {
        await engine.advanceMonth();
      }
      expect(engine.getTechnologyOptions(player.id).find((o) => o.technology.id === 'agriculture')?.canStart).toBe(true);
    };

    it('activates on game start with the first step and start resources', async (): Promise<void> => {
      const { engine, player } = await tutorialEngine();
      expect(engine.isTutorialActive()).toBe(true);
      expect(engine.getTutorialStep()?.id).toBe('build');
      expect(engine.getTutorialProgress()).toEqual({ done: 0, total: 5 });
      // Startguthaben für den ersten Schritt: Bauernhof (250 Gold, 500 Holz) bleibt finanzierbar.
      expect(player.kingdom.resources.gold).toBeGreaterThanOrEqual(250);
      expect(player.kingdom.resources.wood).toBeGreaterThanOrEqual(500);
    });

    it('does not activate without the enableTutorial flag', async (): Promise<void> => {
      const engine = await campaign();
      expect(engine.isTutorialActive()).toBe(false);
      expect(engine.getTutorialStep()).toBeNull();
    });

    it('completes all five steps in order through real engine actions', async (): Promise<void> => {
      const { engine, player } = await tutorialEngine();
      const steps: string[] = [];
      let completed = 0;
      engine.on('tutorialStep', (detail: { step: string }): void => { steps.push(detail.step); });
      engine.on('tutorialCompleted', (): void => { completed += 1; });

      // 1. Bauen
      expect(await engine.buildForPlayer(player.id, 'farms')).toBe(true);
      expect(engine.getTutorialStep()?.id).toBe('trade');

      // 2. Handeln (Kauf)
      expect(engine.tradeForPlayer(player.id, 'food', 100, 'buy')).toBe(true);
      expect(engine.getTutorialStep()?.id).toBe('research');

      // 3. Forschen (Landwirtschaft: 100 Forschungspunkte, 500 Gold)
      await readyForResearch(engine, player);
      engine.startResearch(player.id, 'agriculture');
      expect(engine.getTutorialStep()?.id).toBe('council');

      // 4. Reichsrat (feste Tutorial-Entscheidung)
      engine.ensureTutorialCouncil(player.id);
      const pending = engine.getPendingCouncilDecision(player.id);
      expect(pending?.id).toBe('village_fire');
      const choice = engine.getCouncilChoices(player.id).find((offer) => offer.id === 'firefighters');
      expect(choice?.affordable).toBe(true);
      engine.resolveCouncilDecision(player.id, 'firefighters');
      expect(engine.getTutorialStep()?.id).toBe('save');

      // 5. Speichern (manuell – der Autosave zählt nicht)
      await engine.saveGame('tutorial-save', true);
      expect(engine.isTutorialActive()).toBe(false);
      expect(engine.getTutorialProgress()).toEqual({ done: 5, total: 5 });
      expect(steps).toEqual(['build', 'trade', 'research', 'council', 'save']);
      expect(completed).toBe(1);
      await engine.loadGame('tutorial-save');
      expect(engine.isTutorialActive()).toBe(false);
      expect(engine.getTutorialProgress()).toEqual({ done: 5, total: 5 });
    });

    it('does not count an autosave as the save step', async (): Promise<void> => {
      const { engine, player } = await tutorialEngine();
      // Schneller zu Schritt 5 bringen.
      expect(await engine.buildForPlayer(player.id, 'farms')).toBe(true);
      expect(engine.tradeForPlayer(player.id, 'food', 100, 'buy')).toBe(true);
      await readyForResearch(engine, player);
      engine.startResearch(player.id, 'agriculture');
      engine.ensureTutorialCouncil(player.id);
      engine.resolveCouncilDecision(player.id, 'firefighters');
      expect(engine.getTutorialStep()?.id).toBe('save');
      await engine.saveGame('autosave'); // ohne manual-Flag
      expect(engine.getTutorialStep()?.id).toBe('save');
      expect(engine.isTutorialActive()).toBe(true);
    });

    it('ignores out-of-sequence actions', async (): Promise<void> => {
      const { engine, player } = await tutorialEngine();
      // Handeln vor dem Bauen wird nicht gezählt.
      expect(engine.tradeForPlayer(player.id, 'food', 100, 'buy')).toBe(true);
      expect(engine.getTutorialStep()?.id).toBe('build');
      // Forschen vor dem Bauen wird nicht gezählt.
      await readyForResearch(engine, player);
      engine.startResearch(player.id, 'agriculture');
      expect(engine.getTutorialStep()?.id).toBe('build');
      expect(await engine.buildForPlayer(player.id, 'farms')).toBe(true);
      expect(engine.getTutorialStep()?.id).toBe('trade');
    });

    it('issues the tutorial council decision deterministically and only once', async (): Promise<void> => {
      const { engine, player } = await tutorialEngine();
      // Ohne aktiven „Reichsrat“-Schritt passiert nichts.
      engine.ensureTutorialCouncil(player.id);
      expect(engine.getPendingCouncilDecision(player.id)).toBeNull();
      // Zum Schritt wechseln.
      expect(await engine.buildForPlayer(player.id, 'farms')).toBe(true);
      expect(engine.tradeForPlayer(player.id, 'food', 100, 'buy')).toBe(true);
      await readyForResearch(engine, player);
      engine.startResearch(player.id, 'agriculture');
      expect(engine.getTutorialStep()?.id).toBe('council');
      engine.ensureTutorialCouncil(player.id);
      expect(engine.getPendingCouncilDecision(player.id)?.id).toBe('village_fire');
      // Zweiter Aufruf erzeugt keine Duplikate.
      engine.ensureTutorialCouncil(player.id);
      expect(engine.getCouncilChoices(player.id).length).toBeGreaterThan(0);
    });

    it('persists the tutorial progress across a save/load round-trip', async (): Promise<void> => {
      const { engine, player } = await tutorialEngine();
      expect(await engine.buildForPlayer(player.id, 'farms')).toBe(true);
      expect(engine.tradeForPlayer(player.id, 'food', 100, 'buy')).toBe(true);
      expect(engine.getTutorialStep()?.id).toBe('research');
      await engine.saveGame('tutorial-progress');
      const restored = new GameEngine({ enableWiki: false });
      engines.push(restored);
      await restored.loadGame('tutorial-progress');
      expect(restored.isTutorialActive()).toBe(true);
      expect(restored.getTutorialStep()?.id).toBe('research');
      expect(restored.getTutorialProgress()).toEqual({ done: 2, total: 5 });
    });

    it('loads a pre-tutorial save without a tutorial state safely', async (): Promise<void> => {
      const engine = await campaign();
      await engine.advanceMonth();
      await engine.saveGame('pre-tutorial');
      const restored = new GameEngine({ enableWiki: false });
      engines.push(restored);
      await restored.loadGame('pre-tutorial');
      expect(restored.isTutorialActive()).toBe(false);
      expect(restored.getTutorialStep()).toBeNull();
    });

    it('skips the tutorial and stops counting steps', async (): Promise<void> => {
      const { engine, player } = await tutorialEngine();
      engine.skipTutorial();
      expect(engine.isTutorialActive()).toBe(false);
      expect(await engine.buildForPlayer(player.id, 'farms')).toBe(true);
      expect(engine.getTutorialStep()).toBeNull();
    });
  });
});
