import { describe, expect, it } from 'vitest';
import { FEATURE_STATUS_LIST, FEATURE_STATUS_LABELS, groupFeaturesByStatus } from './FeatureStatus';

describe('FeatureStatus (In-Game-Statusanzeige)', () => {
  it('liefert jede Funktion mit gültigem Status und Beschreibung', () => {
    expect(FEATURE_STATUS_LIST.length).toBeGreaterThanOrEqual(10);
    for (const entry of FEATURE_STATUS_LIST) {
      expect(['fertig', 'in_arbeit', 'geplant']).toContain(entry.status);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.detail.length).toBeGreaterThan(0);
    }
  });

  it('gruppiert nach Status in der Reihenfolge fertig, in Arbeit, geplant', () => {
    const groups = groupFeaturesByStatus();
    expect(groups.map(g => g.label)).toEqual([FEATURE_STATUS_LABELS.fertig, FEATURE_STATUS_LABELS.in_arbeit, FEATURE_STATUS_LABELS.geplant]);
    const total = groups.reduce((sum, g) => sum + g.entries.length, 0);
    expect(total).toBe(FEATURE_STATUS_LIST.length);
  });

  it('enthält die Erbschaften als fertige Funktion', () => {
    const entry = FEATURE_STATUS_LIST.find(e => e.name === 'Erbschaften');
    expect(entry?.status).toBe('fertig');
  });
});
