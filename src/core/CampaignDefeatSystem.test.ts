import { describe, expect, it } from 'vitest';
import {
  CampaignDefeatSystem,
  DEFEAT_TITLES,
  DEFAULT_DEFEAT_THRESHOLDS,
  DefeatReason
} from './CampaignDefeatSystem';

describe('CampaignDefeatSystem', (): void => {
  it('uses safe default thresholds that never trip a healthy realm', (): void => {
    // Normale, gesunde Läufe bleiben weit über diesen Werten (Gold ~4.700,
    // Nahrung ~11.000, Zufriedenheit ~8). Ein gesundes Reich untergeht nie.
    const system = new CampaignDefeatSystem();
    expect(system.checkDefeat('p1', 4700, 11000, 8)).toBeNull();
    expect(system.checkDefeat('p1', 5700, 17000, 40)).toBeNull();
    expect(system.isDefeated('p1')).toBe(false);
  });

  it('declares bankruptcy after three consecutive months without gold', (): void => {
    const system = new CampaignDefeatSystem();
    expect(system.checkDefeat('p1', 0, 1000, 50)).toBeNull();
    expect(system.checkDefeat('p1', 0, 1000, 50)).toBeNull();
    expect(system.checkDefeat('p1', 0, 1000, 50)).toBe('bankruptcy');
    expect(system.isDefeated('p1')).toBe(true);
    expect(system.getDefeatReason('p1')).toBe('bankruptcy');
  });

  it('declares famine after two consecutive months without food', (): void => {
    const system = new CampaignDefeatSystem();
    expect(system.checkDefeat('p1', 1000, 0, 50)).toBeNull();
    expect(system.checkDefeat('p1', 1000, 0, 50)).toBe('famine');
    expect(system.getDefeatReason('p1')).toBe('famine');
  });

  it('declares anarchy after six consecutive months of collapsed happiness', (): void => {
    const system = new CampaignDefeatSystem();
    for (let month = 0; month < 5; month++) {
      expect(system.checkDefeat('p1', 1000, 1000, 3)).toBeNull();
    }
    expect(system.checkDefeat('p1', 1000, 1000, 3)).toBe('anarchy');
    expect(system.getDefeatReason('p1')).toBe('anarchy');
  });

  it('resets the counter when the realm recovers before the threshold', (): void => {
    const system = new CampaignDefeatSystem();
    expect(system.checkDefeat('p1', 0, 1000, 50)).toBeNull();
    expect(system.checkDefeat('p1', 0, 1000, 50)).toBeNull();
    // Ein Monat mit Gold bricht die Bankrottreihe ab.
    expect(system.checkDefeat('p1', 500, 1000, 50)).toBeNull();
    expect(system.getCounts('p1').bankruptcy).toBe(0);
    // Die Zählung beginnt von vorn.
    expect(system.checkDefeat('p1', 0, 1000, 50)).toBeNull();
    expect(system.checkDefeat('p1', 0, 1000, 50)).toBeNull();
    expect(system.isDefeated('p1')).toBe(false);
  });

  it('prioritizes famine over anarchy over bankruptcy when several fail at once', (): void => {
    const system = new CampaignDefeatSystem();
    // Alle drei Schwellen gleichzeitig über mehrere Monate verletzen.
    for (let month = 0; month < 6; month++) {
      const result = system.checkDefeat('p1', 0, 0, 0);
      if (month < 1) expect(result).toBeNull();
    }
    // Nahrungsmangel hat Vorrang.
    expect(system.getDefeatReason('p1')).toBe('famine');
  });

  it('never re-fires once a realm has fallen', (): void => {
    const system = new CampaignDefeatSystem();
    system.checkDefeat('p1', 0, 0, 0);
    system.checkDefeat('p1', 0, 0, 0);
    expect(system.getDefeatReason('p1')).toBe('famine');
    // Auch wenn sich die Lage ändert, bleibt der Untergang bestehen.
    expect(system.checkDefeat('p1', 10000, 10000, 90)).toBeNull();
    expect(system.getDefeatReason('p1')).toBe('famine');
    expect(system.isDefeated('p1')).toBe(true);
  });

  it('tracks players independently', (): void => {
    const system = new CampaignDefeatSystem();
    // p1: zwei Bankrott-Monate (unter der 3er-Schwelle), p2 bleibt unberührt.
    system.checkDefeat('p1', 0, 1000, 50);
    system.checkDefeat('p1', 0, 1000, 50);
    expect(system.isDefeated('p1')).toBe(false);
    expect(system.isDefeated('p2')).toBe(false);
    expect(system.getCounts('p1').bankruptcy).toBe(2);
    expect(system.getCounts('p2').bankruptcy).toBe(0);
  });

  it('round-trips its state through serialize/deserialize', (): void => {
    const system = new CampaignDefeatSystem();
    system.checkDefeat('p1', 0, 1000, 50);
    system.checkDefeat('p1', 0, 1000, 50);
    system.checkDefeat('p2', 1000, 0, 50);
    system.checkDefeat('p2', 1000, 0, 50); // p2 untergeht (Hungersnot)
    const data = system.serialize();

    const restored = new CampaignDefeatSystem();
    restored.deserialize(data);
    expect(restored.getCounts('p1').bankruptcy).toBe(2);
    expect(restored.isDefeated('p1')).toBe(false);
    expect(restored.isDefeated('p2')).toBe(true);
    expect(restored.getDefeatReason('p2')).toBe('famine');
  });

  it('ignores malformed or missing save data safely', (): void => {
    const system = new CampaignDefeatSystem();
    expect(() => system.deserialize(undefined)).not.toThrow();
    expect(() => system.deserialize('nonsense')).not.toThrow();
    expect(() => system.deserialize([['p1'], [42, null], ['p2', { counts: { bankruptcy: -3 }, defeated: 'x' }]])).not.toThrow();
    expect(system.getCounts('p2').bankruptcy).toBe(0);
    expect(system.getDefeatReason('p2')).toBeNull();
  });

  it('removes and resets player state on request', (): void => {
    const system = new CampaignDefeatSystem();
    system.checkDefeat('p1', 0, 1000, 50);
    system.removePlayer('p1');
    expect(system.getCounts('p1').bankruptcy).toBe(0);
    // p2 untergeht durch Hungersnot nach zwei Monaten ohne Nahrung.
    system.checkDefeat('p2', 1000, 0, 50);
    system.checkDefeat('p2', 1000, 0, 50);
    expect(system.isDefeated('p2')).toBe(true);
    system.reset();
    expect(system.isDefeated('p2')).toBe(false);
  });

  it('exposes human-readable German titles for every reason', (): void => {
    const reasons: DefeatReason[] = ['bankruptcy', 'famine', 'anarchy'];
    for (const reason of reasons) {
      expect(typeof DEFEAT_TITLES[reason]).toBe('string');
      expect(DEFEAT_TITLES[reason].length).toBeGreaterThan(0);
    }
    expect(DEFAULT_DEFEAT_THRESHOLDS.bankruptcy.atMost).toBe(0);
    expect(DEFAULT_DEFEAT_THRESHOLDS.famine.atMost).toBe(0);
    expect(DEFAULT_DEFEAT_THRESHOLDS.anarchy.atMost).toBe(5);
  });
});
