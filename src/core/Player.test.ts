import { describe, it, expect } from 'vitest';
import { Player } from './Player';

describe('Player basic', () => {
  it('creates player and serializes', () => {
    const p = new Player({ name: 'Test', gender: 'male', kingdomName: 'Testland' });
    expect(p.name).toBe('Test');
    const s = p.serialize();
    expect(s.name).toBe('Test');
  });
});
