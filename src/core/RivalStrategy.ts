/** Annual reactions use visible realm progress, with bounded difficulty scaling. */
export interface RealmProgress {
  gold: number;
  tradeRoutes: number;
  researched: number;
  soldiers: number;
  difficulty: number;
}

export interface RivalReaction {
  soldiers: number;
  fortification: number;
  wealth: number;
  reason: string;
}

export function rivalReaction(personality: 'raider' | 'fortifier' | 'merchant', progress?: RealmProgress): RivalReaction {
  const none = {soldiers:0, fortification:0, wealth:0, reason:''};
  if (!progress) return none;
  const bounded = (n: number, max: number): number => Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
  const scale = 0.5 + bounded(progress.difficulty, 3) * 0.25;
  const economy = bounded((progress.gold - 5000) / 5000, 4);
  const trade = bounded(progress.tradeRoutes, 5);
  const science = bounded(progress.researched / 3, 4);
  const military = bounded(progress.soldiers / 200, 5);
  if (personality === 'raider' && economy + trade > 0) return {
    soldiers:Math.round((economy * 4 + trade * 3) * scale), fortification:0, wealth:0,
    reason:'Deine Goldreserven und Handelswege locken zusätzliche Söldner an.'
  };
  if (personality === 'fortifier' && military + science > 0) return {
    soldiers:Math.round(science * 5 * scale), fortification:Math.round((military + science) * 0.003 * scale * 1000) / 1000, wealth:0,
    reason:'Dein Heer und dein Forschungsstand veranlassen den Nachbarn, seine Verteidigung auszubauen.'
  };
  if (personality === 'merchant' && economy + trade + science > 0) return {
    soldiers:0, fortification:0, wealth:Math.round((economy * 30 + trade * 60 + science * 20) * scale),
    reason:'Dein wirtschaftlicher Fortschritt fördert den Wettbewerb um Handel und Wissen.'
  };
  return none;
}
