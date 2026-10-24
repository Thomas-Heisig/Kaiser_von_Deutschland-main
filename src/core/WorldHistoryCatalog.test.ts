import { describe, expect, it } from 'vitest';
import { historicalYearReport, epochForYear, milestonesInYear, milestonesThrough, WORLD_MILESTONES } from './WorldHistoryCatalog';
describe('historical milestones and era classification', () => {
  it('distinguishes exact annual facts from older context and excludes future fiction', () => {
    expect(historicalYearReport(1200)).toMatchObject({exact:true, entries:[{id:'paris-charter',year:1200}]});
    expect(historicalYearReport(1201)).toMatchObject({exact:false, entries:[{year:1200}]});
    expect(historicalYearReport(0)).toEqual({exact:false, entries:[]});
    expect(historicalYearReport(2050).exact).toBe(false);
    expect(historicalYearReport(2050).entries.every(item => !item.speculative && item.year <= 2026)).toBe(true);
    expect(new Set(WORLD_MILESTONES.map(item => item.id)).size).toBe(WORLD_MILESTONES.length);
    for (const year of [1200,1300,1400,1500,1600,1750,1820,1890,1945,1970,2000]) {
      expect(historicalYearReport(year).exact).toBe(true);
    }
  });
  it('moves from medieval to industrial, modern and future periods', () => {
    expect(epochForYear(1200)).toBe('Mittelalter');
    expect(epochForYear(1850)).toBe('Industrialisierung');
    expect(epochForYear(1950)).toBe('Zeitgeschichte');
    expect(epochForYear(2026)).toBe('Digitales Zeitalter');
    expect(epochForYear(2100)).toBe('Alternative Zukunft');
  });
  it('makes only past or current events visible, including on a year boundary', () => {
    expect(milestonesThrough(1200).every(e => e.year <= 1200)).toBe(true);
    expect(milestonesThrough(1450).some(e => e.id === 'printing')).toBe(true);
    expect(milestonesThrough(1449).some(e => e.id === 'printing')).toBe(false);
    expect(milestonesInYear(1969).some(e => e.id === 'moon')).toBe(true);
  });
  it('separates documented past from marked future fiction', () => {
    expect(WORLD_MILESTONES.every(e => e.sourceTitle && e.sourceUrl.startsWith('https://'))).toBe(true);
    expect(WORLD_MILESTONES.filter(e => e.year > 2026).every(e => e.speculative === true)).toBe(true);
    expect(WORLD_MILESTONES.filter(e => e.year <= 2026).every(e => !e.speculative)).toBe(true);
  });
});
