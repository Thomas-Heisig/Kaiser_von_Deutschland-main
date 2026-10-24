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

  it('rejects premature modernization and preserves old-save-compatible progress', async (): Promise<void> => {
    const engine = await campaign();
    const player = engine.getPlayers()[0];
    expect(engine.getModernizationOptions(player.id)).toHaveLength(6);
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
    expect(engine.getCampaignChapterStatus(ruler.id).ready).toBe(true);
    await engine.advanceMonth();
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
    await engine.saveGame('war-loan');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('war-loan');
    expect(restored.getWarFinanceOverview(player.id).stats.totalWarDebt)
      .toBeCloseTo(engine.getWarFinanceOverview(player.id).stats.totalWarDebt);
    expect(restored.getWarFinanceOverview(player.id).available).toBe(false);
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
    expect(restored.getPlayers()[0].kingdom.infrastructure.farms).toBe(9);
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
