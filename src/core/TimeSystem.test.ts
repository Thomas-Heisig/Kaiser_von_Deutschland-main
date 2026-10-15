import { describe, expect, it } from 'vitest';
import { TimeMode, TimeSystem } from './TimeSystem';

describe('TimeSystem calendar', (): void => {
  it('starts at the configured year rather than doubling it', (): void => {
    const clock = new TimeSystem(1200);
    expect(clock.getFormattedDate()).toBe('1.1.1200');
  });

  it('never produces a thirteenth month at the end of December', (): void => {
    const clock = new TimeSystem(1200, TimeMode.DETAIL);
    clock.setDate(1200, 12, 31);
    expect(clock.getCurrentMonth()).toBe(12);
    clock.update(1000);
    expect(clock.getFormattedDate()).toBe('1.1.1201');
  });

  it('uses supplied elapsed time, honors pause and notifies each month exactly once', (): void => {
    const clock = new TimeSystem(1200, TimeMode.STRATEGIC);
    const months: number[] = [];
    clock.onMonthChangeCallback((month: number): void => { months.push(month); });
    clock.pause();
    clock.update(5000);
    expect(clock.getCurrentYear()).toBe(1200);
    clock.resume();
    clock.update(1000);
    expect(clock.getCurrentYear()).toBe(1201);
    expect(months).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]);
  });

  it('rejects impossible dates and invalid deltas', (): void => {
    const clock = new TimeSystem(0);
    expect(() => clock.setDate(1200, 13)).toThrow(RangeError);
    expect(() => clock.setDate(1200, 2, 30)).toThrow(RangeError);
    expect(() => clock.update(NaN)).toThrow(RangeError);
    expect(() => clock.setSpeed(Infinity)).toThrow(RangeError);
  });

  it('round-trips a dated snapshot', (): void => {
    const clock = new TimeSystem(1200);
    clock.setDate(1203, 7, 8);
    const restored = new TimeSystem();
    restored.loadSnapshot(clock.createSnapshot());
    expect(restored.getFormattedDate()).toBe('8.7.1203');
  });
});
