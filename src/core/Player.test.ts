import { describe, it, expect } from 'vitest';
import { Player } from './Player';

describe('Player basic', () => {
  it('creates player and serializes', () => {
    const p = new Player({ name: 'Test', gender: 'male', kingdomName: 'Testland' });
    expect(p.name).toBe('Test');
    const s = p.serialize();
    expect(s.name).toBe('Test');
  });

  describe('Reign duration achievements', (): void => {
    it('requires fifty elapsed years, not a calendar year greater than fifty', (): void => {
      const player = new Player({ name: 'Test', gender: 'other', kingdomName: 'Testland' });
      player.kingdom.foundingYear = 1200;
      player.kingdom.currentYear = 1200;
      expect(player.unlockAchievement('golden_reign')).toBe(false);
      player.kingdom.currentYear = 1249;
      expect(player.unlockAchievement('golden_reign')).toBe(false);
      player.kingdom.currentYear = 1250;
      expect(player.unlockAchievement('golden_reign')).toBe(true);
      expect(player.unlockAchievement('golden_reign')).toBe(false);
    });
  });
});
