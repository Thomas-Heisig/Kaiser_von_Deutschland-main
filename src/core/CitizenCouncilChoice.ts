import type { Citizen } from './CitizenSystem';
import type { CouncilChoiceOffer, CouncilDecision } from './CouncilDecisionSystem';

/**
 * Deterministic local roleplay logic. Only affordable choices can be returned.
 * No AI download, random seed, or automatic approval of political actions.
 */
export function chooseCitizenCouncilOption(
  citizen: Pick<Citizen, 'profession' | 'skills' | 'personality' | 'reputation'>,
  decision: Pick<CouncilDecision, 'category'>,
  offers: readonly CouncilChoiceOffer[]
): string {
  const available = offers.filter(c => c.affordable);
  if (!available.length) throw new Error('Keine finanzierbare Ratsentscheidung.');
  const { personality: p, skills: s } = citizen;
  const riskAppetite = (p.courage + p.ambition) / 2;
  const caution = (p.discipline + p.compassion) / 2;
  const abilities: Record<string, number> = {
    HANDEL: s.trading, HANDWERK: s.craftsmanship, ARBEIT: s.craftsmanship,
    FORSCHUNG: s.literacy, DIGITALISIERUNG: s.literacy,
    SICHERHEIT: s.combat, INFRASTRUKTUR: s.craftsmanship,
    VERSORGUNG: s.agriculture, ENERGIE: s.craftsmanship,
    HOF: s.diplomacy, INTRIGE: s.diplomacy
  };
  const talent = abilities[decision.category] ?? s.leadership;
  const prefersTrade = citizen.profession === 'merchant' && decision.category === 'HANDEL';
  return [...available].sort((a, b) => score(b) - score(a) ||
    a.id.localeCompare(b.id))[0].id;
  function score(choice: CouncilChoiceOffer): number {
    const effects = choice.effect;
    const cost = Object.values(choice.cost).reduce((sum, n) => sum + (n ?? 0), 0);
    const positive = (effects.happiness ?? 0) * (0.65 + p.compassion / 90) +
      (effects.stability ?? 0) * (0.6 + p.discipline / 100) +
      (effects.prestige ?? 0) * (0.7 + p.ambition / 100);
    const risk = choice.probability ?? 1;
    const safety = (risk - 0.5) * (caution - riskAppetite) / 5;
    const skill = talent / 100 * (positive > 0 ? 2 : 0);
    return positive + safety + skill + (prefersTrade ? (effects.gold ?? 0) / 150 : 0) +
      (effects.gold ?? 0) / 380 - cost / 900 + citizen.reputation / 350;
  }
}
