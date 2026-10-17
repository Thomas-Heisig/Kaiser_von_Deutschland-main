import { describe, expect, it } from 'vitest';
import { miniCouncilChoice, miniCouncilScores } from './EmbeddedMiniModel';

describe('Embedded offline mini model', () => {
  const options = [
    { id: 'unaffordable', affordable: false, probability: 1, cost: {}, effect: {happiness:100} },
    { id: 'safe', affordable: true, probability: null, cost: {gold:100}, effect: {happiness:4, stability:3} },
    { id: 'risk', affordable: true, probability: 0.3, cost: {gold:600}, effect: {gold:500} }
  ] as const;
  it('never proposes an unaffordable option', () => {
    expect(miniCouncilChoice({year:1500},options)).not.toBe('unaffordable');
  });
  it('works offline deterministically', () => {
    expect(miniCouncilScores({year:1900},options)).toEqual(miniCouncilScores({year:1900},options));
    expect(miniCouncilScores({year:1900},options).every(x=>Number.isFinite(x.score))).toBe(true);
  });
  it('refuses when there are no affordable options', () => {
    expect(()=>miniCouncilChoice({year:1200},options.slice(0,1))).toThrow();
  });
});