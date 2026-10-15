import { describe, expect, it } from 'vitest';
import { PlayerTechnologySystem, TechnologySystem } from './TechnologySystem';

describe('PlayerTechnologySystem', (): void => {
  it('spends research points once and completes a project over game months', (): void => {
    const system = new PlayerTechnologySystem();
    const sailing = TechnologySystem.getTechnology('sailing');
    expect(sailing).toBeDefined();
    if (!sailing) throw new Error('Sailing technology fixture missing.');

    system.addResearchPoints(sailing.cost.research + 30);
    expect(system.startResearch(sailing)).toBe(true);
    expect(system.getResearchPoints()).toBe(30);
    expect(system.startResearch(sailing)).toBe(false);
    expect(system.updateResearch(30)).toBeNull();
    expect(system.updateResearch(30)).toEqual(sailing);
    expect(system.isResearched('sailing')).toBe(true);
    expect(system.getCurrentResearch()).toBeNull();
  });

  it('keeps research progress and points isolated between realms', (): void => {
    const first = new PlayerTechnologySystem();
    const second = new PlayerTechnologySystem();
    first.addResearchPoints(150);
    const bronzeWorking = TechnologySystem.getTechnology('bronze_working');
    expect(bronzeWorking).toBeDefined();
    if (!bronzeWorking) throw new Error('Bronze technology fixture missing.');

    expect(first.startResearch(bronzeWorking)).toBe(true);
    first.updateResearch(15);
    expect(first.getCurrentResearch()?.progress).toBe(15);
    expect(second.getResearchPoints()).toBe(0);
    expect(second.isResearched('bronze_working')).toBe(false);
  });

  it('rejects invalid research snapshots without accepting unknown technology IDs', (): void => {
    const system = new PlayerTechnologySystem();
    expect(() => system.load({
      researchPoints: 10,
      researched: ['not-a-technology'],
      currentResearch: null
    })).toThrow('Forschungsstand');
    expect(() => system.addResearchPoints(Number.NaN)).toThrow(RangeError);
  });
});
