import { describe, expect, it } from 'vitest';
import { Kingdom } from './Kingdom';
import { TechnologySystem } from './TechnologySystem';
import { applyScienceDiscovery, researchImpact, researchProductionBonus } from './ScienceImpact';

describe('ScienceImpact', () => {
  it('counts duplicate research IDs only once and calculates bounded bonuses', () => {
    const impact = researchImpact(['agriculture', 'agriculture', 'guilds', 'universities']);
    expect(impact.foodPercent).toBe(20);
    expect(impact.goldPercent).toBe(15);
    expect(impact.researchPercent).toBe(30);
    expect(impact.industryPercent).toBe(0);
  });
  it('computes repeatable monthly income without mutating kingdom rates', () => {
    const kingdom = new Kingdom({ name: 'Burg', rulerName: 'Anna' });
    const before = structuredClone(kingdom.resources);
    const first = researchProductionBonus(kingdom, ['agriculture', 'guilds']);
    expect(first).toEqual(researchProductionBonus(kingdom, ['agriculture', 'guilds']));
    expect(kingdom.resources).toEqual(before);
    expect(first.food).toBeGreaterThanOrEqual(0);
    expect(first.gold).toBeGreaterThanOrEqual(0);
  });
  it('makes literacy and civic achievements effective and capped', () => {
    const kingdom = new Kingdom({ name: 'Burg', rulerName: 'Anna' });
    const tech = TechnologySystem.getTechnology('writing');
    expect(tech).toBeDefined();
    applyScienceDiscovery(kingdom, tech!);
    expect(kingdom.stats.literacyRate).toBe(30);
    expect(kingdom.stats.culturalInfluence).toBe(35);
    expect(kingdom.stats.technologicalLevel).toBe(22);
  });
});
