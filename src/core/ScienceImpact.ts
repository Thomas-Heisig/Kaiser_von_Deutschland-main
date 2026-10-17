import type { Kingdom } from './Kingdom';
import type { TechnologyDefinition } from './TechnologySystem';
import { TechnologySystem } from './TechnologySystem';

/** A detached read model for the visible effects of technology. */
export interface ResearchImpact {
  name: string;
  foodPercent: number;
  industryPercent: number;
  goldPercent: number;
  researchPercent: number;
}

const clampPercent = (value: number): number => Math.max(0, Math.min(200, value));

/** Accumulate effects from the *current* research set; never compound monthly. */
export function researchImpact(ids: readonly string[]): ResearchImpact {
  const totals = { foodPercent: 0, industryPercent: 0, goldPercent: 0, researchPercent: 0 };
  for (const id of new Set(ids)) {
    const effect = TechnologySystem.getTechnology(id)?.effects;
    if (!effect) continue;
    totals.foodPercent += (effect.foodProduction ?? 0) + (effect.productionBonus ?? 0);
    totals.industryPercent += effect.productionBonus ?? 0;
    totals.goldPercent += effect.goldProduction ?? 0;
    totals.researchPercent += effect.researchSpeed ?? 0;
  }
  return {
    name: 'Dauerhafte wissenschaftliche Wirkungen',
    foodPercent: clampPercent(totals.foodPercent),
    industryPercent: clampPercent(totals.industryPercent),
    goldPercent: clampPercent(totals.goldPercent),
    researchPercent: clampPercent(totals.researchPercent)
  };
}

export interface MonthlyResearchProduction {
  food: number; wood: number; stone: number; iron: number; gold: number;
}
/** Returns only the incremental monthly amounts; no mutation and no double taxation. */
export function researchProductionBonus(kingdom: Kingdom, ids: readonly string[]): MonthlyResearchProduction {
  const impact = researchImpact(ids);
  const production = kingdom.getMonthlyBalance().production;
  return {
    food: Math.floor(production.food * impact.foodPercent / 100),
    wood: Math.floor(production.wood * impact.industryPercent / 100),
    stone: Math.floor(production.stone * impact.industryPercent / 100),
    iron: Math.floor(production.iron * impact.industryPercent / 100),
    gold: Math.floor(production.gold * impact.goldPercent / 100)
  };
}

/**
 * One-time civic and military effects at actual research completion.
 * Resource-rate changes use researchProductionBonus instead, so they survive saves
 * without being permanently added to the saved Kingdom object.
 */
export function applyScienceDiscovery(kingdom: Kingdom, tech: TechnologyDefinition): void {
  const e = tech.effects;
  const bounded = (value: number): number => Math.max(0, Math.min(100, value));
  kingdom.stats.literacyRate = bounded(kingdom.stats.literacyRate + (e.literacyRate ?? 0));
  kingdom.stats.culturalInfluence = bounded(kingdom.stats.culturalInfluence + (e.culturalInfluence ?? 0));
  kingdom.stats.tradePower = bounded(kingdom.stats.tradePower + (e.tradePower ?? 0));
  kingdom.stats.stability = bounded(kingdom.stats.stability + (e.stability ?? 0));
  kingdom.stats.technologicalLevel = bounded(kingdom.stats.technologicalLevel + 2);
  kingdom.military.equipmentQuality = bounded(kingdom.military.equipmentQuality + (e.militaryStrength ?? 0) / 5);
  kingdom.military.trainingLevel = bounded(kingdom.military.trainingLevel + (e.defense ?? 0) / 5);
  kingdom.happiness = bounded(kingdom.happiness + (e.publicApproval ?? 0) / 5);
}
