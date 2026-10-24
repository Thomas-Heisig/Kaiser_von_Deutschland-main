import { describe, expect, it } from 'vitest';
import { bce, formatYear } from './HistoricalCalendar';
import { TimeMode, TimeSystem } from './TimeSystem';
import { historicalMonthReport, milestoneDate, milestoneEvidence, WORLD_MILESTONES } from './WorldHistoryCatalog';

describe('civil dates and evidence for antiquity', () => {
  it('advances from 1 BCE to 1 CE without displaying a year zero', () => {
    expect(formatYear(bce(2000))).toBe('2000 v. Chr.');
    const time = new TimeSystem(bce(2), TimeMode.DETAIL);
    time.setDate(bce(1),12,31);
    expect(time.getFormattedDate()).toBe('31.12.1 v. Chr.');
    time.update(1000);
    expect(time.getFormattedDate()).toBe('1.1.1 n. Chr.');
    const loaded = new TimeSystem(); loaded.loadSnapshot(time.createSnapshot());
    expect(loaded.getFormattedDate()).toBe('1.1.1 n. Chr.');
    expect(formatYear(1200)).toBe('1200');
  });
  it('separates exact dates, contested dates, tradition and long periods', () => {
    const caesar = WORLD_MILESTONES.find(item=>item.id==='caesar-assassination')!;
    expect(milestoneDate(caesar)).toBe('15.3.44 v. Chr.');
    expect(historicalMonthReport(bce(44),2).events).toEqual([]);
    expect(historicalMonthReport(bce(44),3).events).toContain(caesar);
    const rome = WORLD_MILESTONES.find(item=>item.id==='rome-tradition')!;
    expect(milestoneEvidence(rome)).toContain('Überlieferung');
    expect(WORLD_MILESTONES.find(item=>item.id==='marathon')?.day).toBeUndefined();
    expect(WORLD_MILESTONES.find(item=>item.id==='varus')?.month).toBeUndefined();
    expect(historicalMonthReport(bce(440),5).periods.some(item=>item.id==='parthenon-construction')).toBe(true);
    expect(historicalMonthReport(bce(437),5).periods.some(item=>item.id==='parthenon-construction')).toBe(false);
  });
});
