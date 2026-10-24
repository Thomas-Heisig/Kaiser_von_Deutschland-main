import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from './GameEngine';

vi.mock('localforage', (): object => {
  const storage = new Map<string, unknown>();
  return { default: {
    setItem: async (key: string, value: unknown): Promise<unknown> => { storage.set(key, structuredClone(value)); return value; },
    getItem: async (key: string): Promise<unknown> => structuredClone(storage.get(key) ?? null),
    removeItem: async (key: string): Promise<void> => { storage.delete(key); }
  } };
});

describe('defeat measurement', (): void => {
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

  it('measures industry campaign 140 months', async (): Promise<void> => {
    const engine = new GameEngine({ startingYear: 1820, campaignId: 'industrie', randomEvents: false, enableWiki: false });
    engines.push(engine);
    const player = engine.addPlayer({ name: 'Anna', kingdomName: 'Industrieprobe', gender: 'other' });
    await engine.startGame();
    engine.pauseGame();
    player.kingdom.resources.gold = 100000;
    const k = player.kingdom;
    let minGold = Infinity, minFood = Infinity, minHappy = Infinity;
    for (let m = 0; m < 140; m++) {
      await engine.advanceMonth();
      minGold = Math.min(minGold, k.resources.gold);
      minFood = Math.min(minFood, k.resources.food);
      minHappy = Math.min(minHappy, k.happiness);
    }
    // eslint-disable-next-line no-console
    process.stdout.write(`\nINDUSTRY 140m: minGold=${Math.round(minGold)} minFood=${Math.round(minFood)} minHappy=${Math.round(minHappy)} finalHappy=${Math.round(k.happiness)} finalGold=${Math.round(k.resources.gold)} finalFood=${Math.round(k.resources.food)}\n`);
    expect(true).toBe(true);
  });
});
