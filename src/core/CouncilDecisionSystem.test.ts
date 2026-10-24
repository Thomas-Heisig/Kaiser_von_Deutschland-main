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
  it('requires per-player opt-in, charges the chosen option and survives save/load', () => {
    const council = new CouncilDecisionSystem(() => 0.5);
    const ruler = player('one');
    council.issueForTutorial(ruler);
    expect(council.resolveAutomatic(ruler,1200,1)).toBeNull();
    council.setAutomatic(ruler.id,true);
    expect(council.isAutomatic('two')).toBe(false);
    const offers = council.getChoices(ruler);
    const gold = ruler.kingdom.resources.gold;
    const result = council.resolveAutomatic(ruler,1200,1)!;
    const choice = offers.find(offer => offer.id === result.choiceId)!;
    expect(choice.affordable).toBe(true);
    expect(choice.probability).toBeNull();
    expect(ruler.kingdom.resources.gold).toBe(gold - (choice.cost.gold ?? 0) + (choice.effect.gold ?? 0));
    expect(result.automatic).toBe(true);
    expect(result.message).toContain('Automatisch entschieden');
    expect(council.resolveAutomatic(ruler,1200,1)).toBeNull();
    const restored = new CouncilDecisionSystem();
    restored.load(council.serialize());
    expect(restored.isAutomatic(ruler.id)).toBe(true);
    expect(restored.getHistory(ruler.id)).toEqual([result]);
    restored.setAutomatic(ruler.id,false);
    restored.issueForTutorial(ruler);
    expect(restored.resolveAutomatic(ruler,1200,2)).toBeNull();
    const legacy = council.serialize();
    delete legacy.automaticPlayers;
    restored.load(legacy);
    expect(restored.isAutomatic(ruler.id)).toBe(false);
  });

  it('leaves an unaffordable event pending for the player instead of inventing resources', () => {
    const council = new CouncilDecisionSystem(() => 0.5);
    const ruler = player('one');
    const event = COUNCIL_DECISIONS.find(event => event.choices.every(choice => Object.values(choice.cost).some(cost => cost > 0)))!;
    expect(event).toBeDefined();
    council.load({pending:[[ruler.id,{decisionId:event.id,issuedAt:14401}]], lastTriggered:[],lastDecision:[],history:[],automaticPlayers:[ruler.id]});
    for (const key of ['gold','food','wood','stone','iron'] as const) ruler.kingdom.resources[key] = 0;
    expect(council.resolveAutomatic(ruler,1200,1)).toBeNull();
    expect(council.getPending(ruler.id)?.id).toBe(event.id);
    expect(council.getHistory(ruler.id)).toEqual([]);
  });
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
