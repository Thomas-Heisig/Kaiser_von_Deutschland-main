import { describe, expect, it } from 'vitest';
import { CampaignWarfareSystem } from './CampaignWarfareSystem';

/** Erzeugt einen Spieler mit Nachbarn und unterwirft sie wahlweise. */
function frontier(subjugateAll: boolean): CampaignWarfareSystem {
  const system = new CampaignWarfareSystem();
  system.ensureRivals('p1', 1);
  if (subjugateAll) for (const rival of system.getRivals('p1')) system.subjugateRival('p1', rival.id);
  return system;
}

describe('Nachbarentwicklung mit nachvollziehbaren Kriterien', () => {
  it('adds nothing while any neighbour is still unconquered', () => {
    const system = frontier(false);
    expect(system.expandFrontier('p1', 1200)).toHaveLength(0);
  });
  it('adds a new generation only once the frontier is pacified', () => {
    const system = frontier(true);
    const fresh = system.expandFrontier('p1', 1200);
    expect(fresh.length).toBeGreaterThan(0);
    for (const rival of fresh) expect(rival.subjugated).toBe(false);
  });
  it('never creates duplicates when called repeatedly', () => {
    const system = frontier(true);
    expect(system.expandFrontier('p1', 1200).length).toBeGreaterThan(0);
    // A second call in the same year must not spawn the same generation again.
    expect(system.expandFrontier('p1', 1200)).toHaveLength(0);
    const ids = system.getRivals('p1').map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('keeps conquered vassals when a new generation appears', () => {
    const system = frontier(true);
    const vassals = system.getRivals('p1').map(r => r.id);
    system.expandFrontier('p1', 1200);
    for (const id of vassals) {
      expect(system.getRivals('p1').find(r => r.id === id)?.subjugated).toBe(true);
    }
  });
  it('uses stable ids and period-appropriate naming', () => {
    const system = frontier(true);
    const fresh = system.expandFrontier('p1', 1200);
    for (const rival of fresh) {
      expect(rival.id).toContain('frontier-');
      expect(rival.id).toContain('p1');
      // No modern state name projected into the medieval period.
      expect(rival.name).not.toMatch(/Bundesrepublik|Nationalstaat/);
    }
    const modern = frontier(true);
    expect(modern.expandFrontier('p1', 1900)[0].name).toContain('Regionalmacht');
  });
  it('explains new neighbours in the chronicle', () => {
    const system = frontier(true);
    const fresh = system.expandFrontier('p1', 1200);
    const reason = CampaignWarfareSystem.frontierReason(fresh);
    expect(reason).toBeTruthy();
    expect(reason).toContain('Befriedung');
    expect(reason).toContain('Spielmodell');
    expect(CampaignWarfareSystem.frontierReason([])).toBeNull();
  });
});
