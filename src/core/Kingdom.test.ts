import { describe, expect, it } from 'vitest';
import { Kingdom } from './Kingdom';

const createKingdom = (): Kingdom => new Kingdom({ name: 'Testreich', rulerName: 'Heinrich', foundingYear: 1200 });

describe('Kingdom campaign economy', (): void => {
  it('supports timber expansion with an exact seasonal forecast, including old saves', () => {
    const kingdom = Kingdom.deserialize(createKingdom().serialize());
    kingdom.currentSeason = 'winter';
    const before = kingdom.getMonthlyBalance();
    const gain = kingdom.getWorkshopWoodGain();
    expect(gain).toBeGreaterThanOrEqual(17);
    expect(kingdom.buildStructure('workshops')).toBe(true);
    expect(kingdom.getMonthlyBalance().production.wood - before.production.wood).toBe(gain);
    expect(kingdom.getMonthlyBalance().net.wood).toBeGreaterThan(0);
    const stock = kingdom.resources.wood;
    const forecast = kingdom.getMonthlyBalance();
    kingdom.processMonth();
    expect(kingdom.resources.wood).toBe(stock + forecast.net.wood);
  });
  it('applies exactly the displayed monthly forecast, including taxes', (): void => {
    const kingdom = createKingdom();
    const before = { ...kingdom.resources };
    const forecast = kingdom.getMonthlyBalance();
    kingdom.processMonth();
    for (const resource of ['gold', 'food', 'wood', 'stone', 'iron'] as const) {
      expect(kingdom.resources[resource]).toBe(Math.max(0, before[resource] + forecast.net[resource]));
    }
    expect(forecast.taxes).toBeGreaterThan(0);
  });

  it('applies seasonal harvest and timber to both monthly forecast and actual accounting', (): void => {
    const kingdom=createKingdom();
    kingdom.currentSeason='summer';
    const summer=kingdom.getMonthlyBalance();
    kingdom.currentSeason='winter';
    const winter=kingdom.getMonthlyBalance();
    expect(summer.production.food).toBeGreaterThan(winter.production.food);
    expect(summer.production.wood).toBeGreaterThan(winter.production.wood);
    const old={...kingdom.resources};
    kingdom.processMonth();
    for (const resource of ['gold','food','wood','stone','iron'] as const)
      expect(kingdom.resources[resource]).toBe(Math.max(0,old[resource]+winter.net[resource]));
  });

  it('does not charge iron or build anything when construction cannot be funded', (): void => {
    const kingdom = createKingdom();
    kingdom.resources.iron = 0;
    const resources = { ...kingdom.resources };
    const workshops = kingdom.infrastructure.workshops;
    expect(kingdom.buildStructure('workshops')).toBe(false);
    expect(kingdom.resources).toEqual(resources);
    expect(kingdom.infrastructure.workshops).toBe(workshops);
  });

  it('charges all displayed construction costs and permanently increases production', (): void => {
    const kingdom = createKingdom();
    const before = { ...kingdom.resources };
    const forecast = kingdom.getMonthlyBalance();
    expect(kingdom.buildStructure('workshops')).toBe(true);
    expect(kingdom.resources.gold).toBe(before.gold - 1600);
    expect(kingdom.resources.wood).toBe(before.wood - 500);
    expect(kingdom.resources.iron).toBe(before.iron - 100);
    expect(kingdom.getMonthlyBalance().production.wood).toBeGreaterThan(forecast.production.wood);
    expect(kingdom.getMonthlyBalance().production.iron).toBeGreaterThan(forecast.production.iron);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid counts %s without creating resources', (count: number): void => {
    const kingdom = createKingdom();
    const resources = { ...kingdom.resources };
    expect(() => kingdom.buildStructure('farms', count)).toThrow(RangeError);
    expect(() => kingdom.recruitSoldiers(count)).toThrow(RangeError);
    expect(kingdom.resources).toEqual(resources);
  });

  it('moves recruits between population groups without creating people', (): void => {
    const kingdom = createKingdom();
    const population = kingdom.getSummary().totalPopulation;
    expect(kingdom.recruitSoldiers(10)).toBe(true);
    expect(kingdom.getSummary().totalPopulation).toBe(population);
    expect(kingdom.recruitSoldiers(kingdom.population.peasants + 1)).toBe(false);
  });

  it('keeps starting farms productive and does not apply a full year of population growth every month', (): void => {
    const kingdom = createKingdom();
    const start = kingdom.population.peasants;
    expect(kingdom.getMonthlyBalance().net.food).toBeGreaterThan(0);
    for (let month = 0; month < 12; month++) kingdom.processMonth();
    expect(kingdom.population.peasants).toBeLessThan(start * 1.03);
    expect(kingdom.happiness).toBeGreaterThan(60);
    expect(kingdom.stats.crimeRate).toBeLessThan(30);
  });

  it('makes starvation harmful instead of silently clamping a negative food balance', (): void => {
    const kingdom = createKingdom();
    kingdom.resources.food = 0;
    kingdom.infrastructure.farms = 0;
    const before = kingdom.population.peasants;
    kingdom.processMonth();
    expect(kingdom.resources.food).toBe(0);
    expect(kingdom.happiness).toBeLessThan(70);
    expect(kingdom.population.peasants).toBeLessThan(before);
  });

  it('counts real population groups, not growth rates or the unemployment subset', (): void => {
    const kingdom = createKingdom();
    const before = kingdom.getSummary().totalPopulation;
    kingdom.population.unemployed += 100;
    kingdom.population.growthRate = 0.5;
    expect(kingdom.getSummary().totalPopulation).toBe(before);
    expect(Number.isInteger(before)).toBe(true);
  });
});
