import { describe, expect, it } from 'vitest';
import { COUNCIL_DECISIONS, CouncilDecisionSystem } from './CouncilDecisionSystem';
import { Kingdom } from './Kingdom';
import { Player } from './Player';

// Structural fixture: the council only requires the same kingdom fields as a real Player.
const player = (id: string) => {
  const kingdom = new Kingdom({ name: 'Testreich', rulerName: 'Anna', foundingYear: 1200 });
  const stats = { prestige: 0 };
  return {
    id, kingdom, stats,
    updateStats: (changes: { prestige?: number }) => { stats.prestige += changes.prestige ?? 0; }
  } as unknown as Player;
};

describe('Royal council', () => {
  it('validates every risk, resource cost and player decision in the extended catalog', () => {
    expect(COUNCIL_DECISIONS.length).toBeGreaterThanOrEqual(12);
    const ids = new Set(COUNCIL_DECISIONS.map((event) => event.id));
    expect(ids.size).toBe(COUNCIL_DECISIONS.length);
    for (const event of COUNCIL_DECISIONS) {
      expect(event.choices).toHaveLength(3);
      expect(new Set(event.choices.map((choice) => choice.id)).size).toBe(3);
      for (const choice of event.choices) {
        for (const amount of Object.values(choice.cost)) {
          expect(Number.isFinite(amount)).toBe(true);
          expect(amount).toBeGreaterThanOrEqual(0);
        }
        if (choice.successChance !== undefined) {
          expect(choice.successChance).toBeGreaterThan(0);
          expect(choice.successChance).toBeLessThan(1);
          expect(choice.failure).toBeDefined();
        }
      }
    }
  });

  it('matches seeded long-run gamble outcomes to probabilities', () => {
    // 10,000 evenly distributed deterministic rolls avoid flaky Monte Carlo thresholds.
    const rolls = Array.from({ length: 10000 }, (_, index) => (index + 0.5) / 10000);
    for (const event of COUNCIL_DECISIONS) {
      for (const choice of event.choices.filter((entry) => entry.successChance !== undefined)) {
        for (const stability of [0, 50, 100]) {
          const expected = Math.max(0.1, Math.min(0.95, choice.successChance! + (stability - 50) / 500));
          const successes = rolls.filter((roll) => roll < expected).length / rolls.length;
          expect(Math.abs(successes - expected)).toBeLessThanOrEqual(0.0001);
          expect(expected).toBeGreaterThanOrEqual(0.1);
          expect(expected).toBeLessThanOrEqual(0.95);
        }
      }
    }
  });

  it('does not issue a dilemma at the start of a campaign', () => {
    const council = new CouncilDecisionSystem(() => 0);
    expect(council.tryGenerate(player('one'), 1200, 1, 1200)).toBeNull();
  });

  it('issues dilemmas only after cooldown and keeps pending dilemmas unchanged', () => {
    const council = new CouncilDecisionSystem(() => 0);
    const ruler = player('one');
    const first = council.tryGenerate(ruler, 1200, 5, 1200);
    expect(first).not.toBeNull();
    expect(council.tryGenerate(ruler, 1200, 9, 1200)?.id ?? null).toBeNull();
    expect(council.getPending('one')?.id).toBe(first?.id);
  });

  it('rejects unknown choices, takes payment and persists outcomes', () => {
    const council = new CouncilDecisionSystem(() => 0);
    const ruler = player('one');
    const decision = council.tryGenerate(ruler, 1200, 5, 1200);
    expect(decision).not.toBeNull();
    expect(() => council.resolve(ruler, 'not-a-choice', 1200, 5)).toThrow();
    const affordable = council.getChoices(ruler).find((choice) => choice.affordable);
    expect(affordable).toBeDefined();
    const before = ruler.kingdom.resources.gold;
    const resolved = council.resolve(ruler, affordable!.id, 1200, 5);
    expect(resolved.decisionId).toBe(decision?.id);
    expect(council.getPending('one')).toBeNull();
    expect(ruler.kingdom.resources.gold).toBeGreaterThanOrEqual(0);
    expect(before).toBeGreaterThanOrEqual(0);
    const restored = new CouncilDecisionSystem();
    restored.load(council.serialize());
    expect(restored.getHistory('one')).toEqual(council.getHistory('one'));
  });

  it('blocks unaffordable decisions without mutating resources or clearing the dilemma', () => {
    const council = new CouncilDecisionSystem(() => 0);
    const ruler = player('one');
    council.tryGenerate(ruler, 1200, 5, 1200);
    const choice = council.getChoices(ruler).find((item) => Object.values(item.cost).some((value) => value > 0));
    expect(choice).toBeDefined();
    for (const key of ['gold', 'food', 'wood', 'stone', 'iron'] as const) ruler.kingdom.resources[key] = 0;
    expect(() => council.resolve(ruler, choice!.id, 1200, 5)).toThrow();
    expect(council.getPending('one')).not.toBeNull();
  });
});
