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
    const before = { ...ruler.kingdom.resources };
    expect(engine.tradeForPlayer(ruler.id, 'food', 500, 'buy')).toBe(true);
    expect(ruler.kingdom.resources.food).toBe(before.food + 500);
    expect(engine.tradeForPlayer(ruler.id, 'food', 500, 'sell')).toBe(true);
    expect(ruler.kingdom.resources.food).toBe(before.food);
    expect(ruler.kingdom.resources.gold).toBeLessThan(before.gold);
    const after = { ...ruler.kingdom.resources };
    expect(engine.tradeForPlayer(ruler.id, 'food', 1000000, 'buy')).toBe(false);
    expect(ruler.kingdom.resources).toEqual(after);
    expect(() => engine.quoteTrade('food', -100, 'sell')).toThrow(RangeError);
    expect(() => engine.setTaxRate(ruler.id, NaN)).toThrow(RangeError);
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
    await engine.endTurn();
    await engine.saveGame('hotseat');
    const restored = new GameEngine({ enableWiki: false });
    engines.push(restored);
    await restored.loadGame('hotseat');
    expect(restored.getActivePlayer().id).toBe(second.id);
    expect(restored.getRivals(first.id)).toHaveLength(3);
  });
});
