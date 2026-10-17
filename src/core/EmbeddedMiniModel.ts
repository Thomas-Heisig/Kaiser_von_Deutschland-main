/**
 * Tiny, self-contained inference model shipped with the game.
 *
 * Six hidden neurons; fixed design-time weights (NOT a pretrained language
 * model).  It ranks only actions already offered by the authoritative game
 * engine. No network request, downloads, telemetry or hidden game mutations.
 */
export interface MiniOption {
  id: string;
  affordable: boolean;
  probability: number | null;
  cost?: Partial<Record<'gold' | 'food' | 'wood' | 'stone' | 'iron', number>>;
  effect?: Partial<Record<'happiness' | 'stability' | 'prestige' | 'gold' | 'food', number>>;
}
export interface MiniContext { year: number; happiness?: number; stability?: number; }
const clamp = (x: number): number => Math.min(1, Math.max(-1, x));
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
/** Layer-1: utility / risk / resilience / era / social / resources. */
const HIDDEN_WEIGHTS: readonly (readonly number[])[] = [
  [ 0.2,  2.2, -2.2,  0.3,  0.2,  0.1,  0.8,  0.5],
  [ 0.1,  2.3, -0.8,  1.0,  0.2,  0.1,  0.0,  0.3],
  [-0.2,  0.4, -1.4,  0.3,  0.0,  0.0,  0.2,  0.9],
  [ 0.1,  0.1, -0.2,  0.2,  0.8,  0.2,  0.2,  0.3],
  [ 0.2,  0.3, -0.8,  0.2,  0.1,  0.8,  0.2,  0.2],
  [ 0.0,  0.5, -0.5,  0.1,  0.4,  0.2,  0.8,  0.3]
];
const OUTPUT_WEIGHTS = [0.4, 1.4, 0.8, 0.5, 0.5, 0.7];
const outputBias = -0.2;
const dot = (w: readonly number[], v: readonly number[]): number =>
  w.reduce((sum, weight, index) => sum + weight * (v[index] ?? 0), 0);
/** Fully local two-layer neural inference with frozen hand-authored weights. */
export function miniCouncilScores(
  context: MiniContext, options: readonly MiniOption[]
): Array<{ id: string; score: number }> {
  return options.filter(o => o.affordable).map(option => {
    const cost = option.cost ?? {};
    const effect = option.effect ?? {};
    const costUnits = (cost.gold ?? 0) / 1300 + (cost.food ?? 0) / 1900 +
      (cost.wood ?? 0) / 1400 + (cost.stone ?? 0) / 1500 + (cost.iron ?? 0) / 650;
    const result = [
      1,
      clamp((option.probability ?? 0.98) * 2 - 1),
      clamp(costUnits),
      clamp((context.stability ?? 65) / 100),
      clamp(((effect.happiness ?? 0) * 0.1 + (effect.stability ?? 0) * 0.08)),
      clamp(context.year >= 1900 ? 0.8 : context.year >= 1750 ? 0.5 : 0.2),
      clamp((effect.prestige ?? 0) * 0.2 + (effect.gold ?? 0) / 2600),
      clamp(((context.happiness ?? 65) < 50 ? 0.5 : 0.2))
    ];
    const hidden = HIDDEN_WEIGHTS.map(w => Math.tanh(dot(w, result)));
    // Guaranteed affordability is handled above; finite, reproducible rank.
    return { id: option.id, score: sigmoid(dot(OUTPUT_WEIGHTS, hidden) + outputBias) };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export function miniCouncilChoice(context: MiniContext, options: readonly MiniOption[]): string {
  const best = miniCouncilScores(context, options)[0];
  if (!best) throw new Error('Keine finanzierbare Ratsentscheidung vorhanden.');
  return best.id;
}
