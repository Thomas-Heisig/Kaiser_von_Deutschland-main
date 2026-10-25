import { describe, expect, it } from 'vitest';
import {
  ADDITIONAL_START_YEARS, START_EPOCHS, allStartYears, epochForStartYear, isKnownStartYear
} from './StartEpochs';

/** Alle Startjahre, die vor der Gruppierung gleichrangig angeboten wurden. */
const LEGACY_YEARS: readonly number[] = [
  -1999,-1499,-1199,-799,-752,-489,-479,-446,-430,-370,-337,-335,-332,-330,-322,-215,-201,
  -43,-30,-26,-14,0,1,9,14,60,66,70,500,800,1000,1200,1300,1400,1500,1600,1750,1820,1890,
  1945,1970,2000
];

describe('Gruppierte Startzeitpunkte', () => {
  it('keeps every previously offered start year selectable', () => {
    const known = new Set(allStartYears().map(entry => entry.year));
    for (const year of LEGACY_YEARS) {
      expect(known.has(year), `year ${year} must remain available`).toBe(true);
    }
  });
  it('offers only a few representative years per section', () => {
    for (const epoch of START_EPOCHS) {
      expect(epoch.years.length, epoch.id).toBeGreaterThan(0);
      expect(epoch.years.length, epoch.id).toBeLessThanOrEqual(5);
    }
    // The long tail lives in the separate "Weitere Startjahre" group.
    expect(ADDITIONAL_START_YEARS.length).toBeGreaterThan(10);
  });
  it('labels every entry with a name and an explanation', () => {
    for (const entry of allStartYears()) {
      expect(entry.name.length, String(entry.year)).toBeGreaterThan(3);
      expect(entry.note.length, String(entry.year)).toBeGreaterThan(10);
    }
  });
  it('sorts all start years chronologically', () => {
    const years = allStartYears().map(entry => entry.year);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });
  it('marks epoch boundaries as conventions, not exact dates', () => {
    for (const epoch of START_EPOCHS) {
      expect(epoch.caveat.length, epoch.id).toBeGreaterThan(20);
      // No section may claim an exact universal boundary.
      expect(epoch.caveat, epoch.id).not.toMatch(/exakte Grenze/i);
    }
  });
  it('resolves the section for a start year and rejects unknown ones', () => {
    expect(epochForStartYear(1200)?.id).toBe('mittelalter');
    expect(epochForStartYear(-1999)?.id).toBe('vorzeit');
    expect(epochForStartYear(2000)?.id).toBe('moderne');
    expect(isKnownStartYear(1200)).toBe(true);
    expect(isKnownStartYear(1234)).toBe(false);
  });
});
