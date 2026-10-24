import { describe, expect, it } from 'vitest';
import {
  buildHistoricalContext,
  dignityFor,
  historicalEpochFor,
  isHistoricalModelReady,
  MODEL_EPOCH_COUNT,
  MODEL_OFFICE_COUNT,
  referenceSystemFor
} from './HistoricalContext';

describe('HistoricalContext – Modellbrücke', (): void => {
  it('reports the loaded model as ready', (): void => {
    expect(isHistoricalModelReady()).toBe(true);
    expect(MODEL_EPOCH_COUNT).toBeGreaterThan(0);
    expect(MODEL_OFFICE_COUNT).toBeGreaterThan(0);
  });

  it('maps a verified year to its epoch', (): void => {
    expect(historicalEpochFor(1200)?.id).toBe('hochmittelalter');
    expect(historicalEpochFor(1900)?.id).toBe('kaiserreich');
    expect(historicalEpochFor(1960)?.id).toBe('bundesrepublik');
  });

  it('returns null instead of inventing a boundary for unverified years', (): void => {
    // Die Frühzeit ist bewusst als „nicht verifiziert" markiert.
    expect(historicalEpochFor(-500)).toBeNull();
  });

  it('selects only systems that are evidenced for the epoch', (): void => {
    const hrr = referenceSystemFor('hochmittelalter');
    expect(hrr).not.toBeNull();
    expect(hrr!.epochIds).toContain('hochmittelalter');
    // Kein Republikanisches System im Hochmittelalter.
    const republic = referenceSystemFor('bundesrepublik_vereint');
    expect(republic?.kind).toBe('republik');
  });

  it('is deterministic when several systems share an epoch', (): void => {
    const first = referenceSystemFor('weimarer_republik');
    const second = referenceSystemFor('weimarer_republik');
    expect(first?.id).toBe(second?.id);
  });

  it('never invents a dignity when rank and epoch do not match', (): void => {
    // Rang 8 (späte Ordnungsform) ist im Hochmittelalter nicht belegt.
    expect(dignityFor(8, 'hochmittelalter')).toBeNull();
    // Ein reines Bundesamt existiert nicht im Kaiserreich – dort gilt der Reichskanzler.
    expect(dignityFor(8, 'kaiserreich')?.id).toBe('reichskanzler');
    // Unbekannte Ränge behaupten nichts.
    expect(dignityFor(99, 'hochmittelalter')).toBeNull();
  });

  it('maps a medieval rank to an evidenced medieval dignity', (): void => {
    const dignity = dignityFor(4, 'hochmittelalter');
    expect(dignity?.name).toBe('König');
  });

  it('keeps the Roman-German and the German emperorship distinct', (): void => {
    const roman = dignityFor(6, 'fruehe_neuzeit');
    expect(roman?.id).toBe('kaiser');
    // Im Kaiserreich ist Rang 6 ebenfalls König/Kaiser – aber ein anderes Amt.
    const german = dignityFor(6, 'kaiserreich');
    expect(german?.id).toBe('deutscher_kaiser');
    expect(german?.id).not.toBe(roman?.id);
  });
});

describe('buildHistoricalContext – vollständiger Kontext', (): void => {
  it('builds a complete context for a documented year and rank', (): void => {
    const context = buildHistoricalContext(1200, 4);
    expect(context.year).toBe(1200);
    expect(context.epoch?.id).toBe('hochmittelalter');
    expect(context.epochEvidence).toBe('naeherung');
    expect(context.system).not.toBeNull();
    expect(context.rulerDignity?.name).toBe('König');
    expect(context.summary).toContain('Hochmittelalter');
    expect(context.alternateHistory).toBe(true);
  });

  it('flags unverified evidence in the summary', (): void => {
    // 950 liegt in der Frühzeit? Nein – aber prüfe einen genäherten Zeitraum.
    const context = buildHistoricalContext(950, 2);
    expect(context.epoch?.evidence).not.toBe('belegt');
    expect(context.summary.length).toBeGreaterThan(0);
  });

  it('degrades gracefully when no epoch can be determined', (): void => {
    const context = buildHistoricalContext(-500, 5);
    expect(context.epoch).toBeNull();
    expect(context.epochEvidence).toBe('nicht_verifiziert');
    expect(context.system).toBeNull();
    expect(context.rulerDignity).toBeNull();
    expect(context.summary).toContain('keine belastbare historische Einordnung');
    expect(context.alternateHistory).toBe(true);
  });

  it('never claims a modern dignity in a medieval year', (): void => {
    const context = buildHistoricalContext(1200, 8);
    expect(context.rulerDignity).toBeNull();
  });

  it('always marks the game as alternate history', (): void => {
    for (const year of [900, 1200, 1600, 1900, 2000]) {
      expect(buildHistoricalContext(year, 4).alternateHistory).toBe(true);
    }
  });
});
