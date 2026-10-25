import { describe, expect, it } from 'vitest';
import { CampaignWarfareSystem } from './CampaignWarfareSystem';
import { Kingdom } from './Kingdom';

const createKingdom = (): Kingdom => new Kingdom({ name: 'Testreich', rulerName: 'Heinrich', foundingYear: 1200 });
const sequence = (...values: number[]): (() => number) => {
  let index = 0;
  return (): number => values[Math.min(index++, values.length - 1)];
};

describe('CampaignWarfareSystem', (): void => {
  it('develops rival personalities with bounded forces and preserves them', (): void => {
    const system = new CampaignWarfareSystem(() => 0.5);
    system.ensureRivals('p1');
    const before = system.getRivals('p1');
    const news = system.processYear(1201);
    expect(news).toHaveLength(3);
    const after = system.getRivals('p1');
    expect(after.find((r) => r.id === 'raubritter')!.soldiers).toBeGreaterThan(
      before.find((r) => r.id === 'raubritter')!.soldiers);
    expect(after.find((r) => r.id === 'ostmark')!.fortification).toBeGreaterThan(
      before.find((r) => r.id === 'ostmark')!.fortification);
    expect(after.find((r) => r.id === 'nordland')!.loot).toBeGreaterThan(
      before.find((r) => r.id === 'nordland')!.loot);
    for (let year = 1202; year < 1800; year++) system.processYear(year);
    expect(system.getRivals('p1').find((r) => r.id === 'raubritter')!.soldiers).toBeLessThanOrEqual(550);
    const restored = new CampaignWarfareSystem();
    restored.load(system.serialize());
    expect(restored.getRivals('p1')).toEqual(system.getRivals('p1'));
  });

  it('respects temporary diplomatic protection when picking raiders', (): void => {
    const system = new CampaignWarfareSystem(sequence(0, 0, 0));
    system.ensureRivals('p1');
    const kingdom = createKingdom();
    const raids = system.processMonth('p1', kingdom, { year: 1200, month: 2 },
      { raids: true, protectedByTreaty: () => true });
    expect(raids).toBeUndefined();
  });

  it('makes fortifications and training improve defense', (): void => {
    const kingdom = createKingdom();
    const plain = CampaignWarfareSystem.defensePower(kingdom);
    kingdom.infrastructure.walls += 2;
    expect(CampaignWarfareSystem.defensePower(kingdom)).toBeGreaterThan(plain);
    const attack = CampaignWarfareSystem.armyPower(kingdom);
    kingdom.military.trainingLevel = 100;
    expect(CampaignWarfareSystem.armyPower(kingdom)).toBeGreaterThan(attack);
    expect(CampaignWarfareSystem.armyPower(kingdom, { commanderBonus: 0.2 }))
      .toBeGreaterThan(CampaignWarfareSystem.armyPower(kingdom));
  });

  it('bounds victory chances and favours the stronger side', (): void => {
    expect(CampaignWarfareSystem.victoryChance(0, 100)).toBe(0);
    expect(CampaignWarfareSystem.victoryChance(1000, 10)).toBe(0.97);
    expect(CampaignWarfareSystem.victoryChance(200, 100)).toBeGreaterThan(0.8);
    expect(CampaignWarfareSystem.victoryChance(100, 200)).toBeLessThan(0.2);
  });

  it('resolves a lost raid by plundering gold and a repelled raid without plunder', (): void => {
    const lost = new CampaignWarfareSystem(sequence(0, 0, 0));
    const kingdom = createKingdom();
    lost.ensureRivals('p1');
    kingdom.military.infantry = 0;
    kingdom.military.archers = 0;
    kingdom.military.cavalry = 0;
    const gold = kingdom.resources.gold;
    const food = kingdom.resources.food;
    const rivalsBefore = lost.getRivals('p1').map((r) => ({ id: r.id, food: r.food, loot: r.loot }));
    const report = lost.processMonth('p1', kingdom, { year: 1200, month: 2 }, { raids: true });
    expect(report?.kind).toBe('raid');
    expect(report?.attackerWon).toBe(true);
    const spoils = report?.spoils;
    expect(spoils).toBeDefined();
    // Endbestand = Anfangsbestand − gestohlen − zerstört, für beide Güter.
    expect(kingdom.resources.gold).toBe(gold - spoils!.stolenGold - spoils!.destroyedGold);
    expect(kingdom.resources.food).toBe(food - spoils!.stolenFood - spoils!.destroyedFood);
    expect(spoils!.stolenGold + spoils!.destroyedGold).toBeGreaterThan(0);
    // Geraubtes erreicht den Angreifer, Zerstörtes geht verloren.
    const raiderAfter = lost.getRivals('p1').find((r) => r.id === report?.rivalId)!;
    const raiderBefore = rivalsBefore.find((r) => r.id === report?.rivalId)!;
    expect(raiderAfter.food).toBe(raiderBefore.food + spoils!.stolenFood);
    expect(raiderAfter.loot).toBe(raiderBefore.loot + spoils!.stolenGold);

    const repelled = new CampaignWarfareSystem(sequence(0, 0, 0.99));
    const defender = createKingdom();
    repelled.ensureRivals('p1');
    const defenderGold = defender.resources.gold;
    const defenderFood = defender.resources.food;
    const defended = repelled.processMonth('p1', defender, { year: 1200, month: 2 }, { raids: true });
    expect(defended?.attackerWon).toBe(false);
    expect(defender.resources.gold).toBe(defenderGold);
    expect(defender.resources.food).toBe(defenderFood);
    expect(defended?.spoils).toEqual({ stolenGold: 0, destroyedGold: 0, stolenFood: 0, destroyedFood: 0 });
    expect(repelled.processMonth('p1', defender, { year: 1200, month: 3 }, { raids: false })).toBeUndefined();
  });

  it('pays tribute after subjugation and stops raids from that rival; snapshots round-trip', (): void => {
    const warfare = new CampaignWarfareSystem(sequence(0));
    const kingdom = createKingdom();
    warfare.ensureRivals('p1');
    warfare.attackRival('p1', kingdom, 'raubritter', { year: 1200, month: 1 });
    expect(warfare.subjugatedCount('p1')).toBe(1);
    const gold = kingdom.resources.gold;
    warfare.processMonth('p1', kingdom, { year: 1200, month: 2 }, { raids: false });
    expect(kingdom.resources.gold).toBeGreaterThan(gold);
    expect(() => warfare.attackRival('p1', kingdom, 'raubritter', { year: 1200, month: 3 })).toThrow('unterworfen');

    const copy = new CampaignWarfareSystem();
    copy.load(warfare.serialize());
    expect(copy.getRivals('p1')).toEqual(warfare.getRivals('p1'));
    expect(copy.canCampaign('p1', 1200 * 12 + 1)).toBe(false);
    expect(() => copy.load({ rivals: [{ id: 1 }] } as never)).toThrow('Beschädigte');
  });

  it('rejects campaigns without enough soldiers or supplies', (): void => {
    const warfare = new CampaignWarfareSystem(sequence(0));
    const kingdom = createKingdom();
    warfare.ensureRivals('p1');
    kingdom.resources.food = 0;
    expect(() => warfare.attackRival('p1', kingdom, 'ostmark', { year: 1200, month: 1 })).toThrow('Nachschub');
    kingdom.military.infantry = 5;
    kingdom.military.archers = 0;
    kingdom.military.cavalry = 0;
    expect(() => warfare.attackRival('p1', kingdom, 'ostmark', { year: 1200, month: 1 })).toThrow('mindestens');
  });
});
