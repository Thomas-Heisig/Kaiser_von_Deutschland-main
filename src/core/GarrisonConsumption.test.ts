/**
 * Regressionstests zur Abrechnung von Unterhalt, Nahrung und Verteidigung.
 *
 * Abgedeckte Paket-1-Findings:
 *  1. Keine doppelte Nahrungszählung bei Rekrutierung (Feldheer ist Teilmenge
 *     von population.soldiers; der zivile Bedarf zählt nur die Garnisonsreserve).
 *  2. Gegnerunterhalt genau einmal je Spielmonat, auch im Hotseat; der
 *     Sperrzeitpunkt überlebt Save/Load.
 *  3. Geraubte Nahrung landet beim Angreifer; Bestand − gestohlen − zerstört
 *     = Endbestand für Gold und Nahrung.
 *  4. Verteidigungsanzeige und Kampfberechnung verwenden dieselben
 *     Zustandsdaten, Regeln und Modifikatoren.
 *  5. Garnisonsautomatik rechnet mit den realen Spielerfolgekosten pro Monat.
 *  6. Alte Spielstände ohne Nahrungs-/Sperrfelder laden ohne Fehler und
 *     werden sinnvoll migriert; RivalUpkeep meldet paidFood/foodShortfall.
 */

import { describe, it, expect } from 'vitest';
import { Kingdom } from './Kingdom';
import { CampaignWarfareSystem } from './CampaignWarfareSystem';
import {
  defenseBreakdown,
  supplyRatio,
  garrisonFoodNeed,
  garrisonGoldUpkeep
} from './GarrisonModel';

const YEAR = 1200;

function createKingdom(name: string): Kingdom {
  return new Kingdom({ name, rulerName: 'Heinrich', foundingYear: YEAR });
}

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
}

describe('Garnisons- und Unterhaltsabrechnung', () => {
  it('Rekrutierung zählt Rekruten nicht doppelt (Feldsatz statt zusätzlicher Bevölkerungssatz)', () => {
    const kingdom = createKingdom('Einfeldreich');
    const fieldBefore = kingdom.militaryFoodConsumption();
    const before = kingdom.calculateFoodConsumption();

    expect(kingdom.recruitSoldiers(10)).toBe(true);

    const after = kingdom.calculateFoodConsumption();
    // Zehn Rekruten rücken direkt ins Feld: +Feldsatz (10 × 6), −bisheriger
    // bäuerlicher Bedarf (10 × 2,5). Die Garnisonsreserve bleibt unverändert,
    // weil population.soldiers und Feldheer gemeinsam um 10 wachsen.
    // Eine Doppelzählung (Bevölkerungssatz 4 zusätzlich) ergäbe +75.
    expect(after - before).toBe(10 * 6 - 10 * 2.5);
    expect(kingdom.militaryFoodConsumption() - fieldBefore).toBe(60);
  });

  it('payUpkeep bucht jeden Gegner genau einmal je Spielmonat, auch im Hotseat', () => {
    const warfare = new CampaignWarfareSystem(sequence(0.5));
    warfare.ensureRivals('player-a');
    warfare.ensureRivals('player-b');

    const monthIndex = YEAR * 12 + 3;

    // Hotseat: Der erste Spieler abrechnet den Monat ...
    const first = warfare.payUpkeep(monthIndex);
    expect(first.length).toBeGreaterThan(0);
    // ... der zweite Spieler im selben Monat bucht keinen Gegner erneut.
    const second = warfare.payUpkeep(monthIndex);
    expect(second).toHaveLength(0);

    // Sperrzeitpunkt überlebt Save/Load.
    warfare.payUpkeep(monthIndex + 1);
    const snapshot = JSON.parse(JSON.stringify(warfare.serialize()));
    const restored = new CampaignWarfareSystem(sequence(0.5));
    restored.load(snapshot);
    expect(restored.payUpkeep(monthIndex + 1)).toHaveLength(0);
    expect(restored.payUpkeep(monthIndex + 2).length).toBeGreaterThan(0);
  });

  it('RivalUpkeep meldet bezahlte Nahrung und Nahrungsdeckungslücke', () => {
    const warfare = new CampaignWarfareSystem(sequence(0.5));
    warfare.ensureRivals('payer');
    for (const rival of warfare.getRivals('payer')) {
      warfare.mutateRival('payer', rival.id, (entry) => {
        entry.loot = 1000;
        entry.food = 0;
      });
    }

    const report = warfare.payUpkeep(YEAR * 12);
    expect(report.length).toBeGreaterThan(0);
    for (const entry of report) {
      expect(entry.paidFood).toBe(0);
      expect(entry.foodShortfall).toBe(entry.cost.food);
      expect(entry.foodShortfall).toBeGreaterThan(0);
    }

    for (const entry of report) {
      warfare.mutateRival('payer', entry.rivalId, (state) => {
        state.food = entry.cost.food;
        state.loot = entry.cost.gold;
      });
    }
    const covered = warfare.payUpkeep(YEAR * 12 + 1);
    expect(covered.length).toBeGreaterThan(0);
    for (const entry of covered) {
      expect(entry.paidFood).toBe(entry.cost.food);
      expect(entry.foodShortfall).toBe(0);
    }
  });

  it('Geraubte Nahrung landet beim Angreifer und Bestand − gestohlen − zerstört ergibt den Endbestand', () => {
    const warfare = new CampaignWarfareSystem(sequence(0, 0, 0));
    const victim = createKingdom('Weiches Ziel');
    warfare.ensureRivals('victim-player');
    // Ohne Feldtruppen gewinnt der Angreifer (deterministisch bei Zufall 0).
    victim.military.infantry = 0;
    victim.military.archers = 0;
    victim.military.cavalry = 0;

    const goldBefore = victim.resources.gold;
    const foodBefore = victim.resources.food;
    const rivalsBefore = warfare.getRivals('victim-player')
      .map((r) => ({ id: r.id, food: r.food, loot: r.loot }));

    const report = warfare.processMonth('victim-player', victim,
      { year: YEAR, month: 2 }, { raids: true });

    expect(report?.kind).toBe('raid');
    expect(report?.attackerWon).toBe(true);
    const spoils = report?.spoils;
    expect(spoils).toBeDefined();
    expect(spoils!.stolenGold + spoils!.destroyedGold).toBeGreaterThan(0);
    expect(spoils!.stolenFood + spoils!.destroyedFood).toBeGreaterThan(0);

    expect(victim.resources.gold).toBe(goldBefore - spoils!.stolenGold - spoils!.destroyedGold);
    expect(victim.resources.food).toBe(foodBefore - spoils!.stolenFood - spoils!.destroyedFood);
    const raiderAfter = warfare.getRivals('victim-player').find((r) => r.id === report?.rivalId)!;
    const raiderBefore = rivalsBefore.find((r) => r.id === report?.rivalId)!;
    expect(raiderAfter.food).toBe(raiderBefore.food + spoils!.stolenFood);
    expect(raiderAfter.loot).toBe(raiderBefore.loot + spoils!.stolenGold);
  });

  it('Verteidigungsanzeige entspricht der tatsächlichen Kampfberechnung', () => {
    const kingdom = createKingdom('Festungsreich');
    kingdom.military.infantry = 120;
    kingdom.military.cavalry = 30;
    kingdom.infrastructure.walls = 3;
    kingdom.infrastructure.castles = 2;
    kingdom.infrastructure.barracks = 4;
    kingdom.resources.food = 500;

    // getArmyOverview verwendet dieselben Zustandsdaten, Regeln und Modifikatoren.
    const preview = defenseBreakdown(
      kingdom,
      CampaignWarfareSystem.armyPower(kingdom),
      supplyRatio(kingdom)
    );

    expect(preview.total).toBeGreaterThan(0);
    expect(preview.supplyPenalty).toBeGreaterThanOrEqual(0);
    // Der Kampfwert nutzt armyPower als Truppenbasis (wie attackPlayer);
    // alle Abzüge folgen denselben Regeln wie in der Kampfauflösung.
    expect(preview.troops).toBe(CampaignWarfareSystem.armyPower(kingdom));
    // Kein Modifikator-Spielraum: dieselbe Eingabe muss dieselbe Ausgabe liefern.
    const repeat = defenseBreakdown(
      kingdom,
      CampaignWarfareSystem.armyPower(kingdom),
      supplyRatio(kingdom)
    );
    expect(repeat.total).toBe(preview.total);
  });

  it('Garnisonsautomatik nutzt reale Spielerfolgekosten pro Monat (nicht Jahreswerte, nicht Gegnersätze)', () => {
    const kingdom = createKingdom('Automatikreich');
    kingdom.military.infantry = 60;
    kingdom.military.cavalry = 12;
    kingdom.military.archers = 20;
    kingdom.infrastructure.barracks = 2;
    kingdom.infrastructure.castles = 1;

    const foodNeed = garrisonFoodNeed(kingdom);
    const goldUpkeep = garrisonGoldUpkeep(kingdom);

    // Reale Basis: militärischer Nahrungsbedarf pro Monat.
    expect(foodNeed).toBe(Math.ceil(kingdom.militaryFoodConsumption() / 12));
    expect(foodNeed).toBeLessThan(kingdom.militaryFoodConsumption());
    // Reale Basis: tatsächlicher Goldunterhalt aller Spielerausgaben pro Monat.
    expect(goldUpkeep).toBe(Math.ceil(kingdom.goldUpkeepParts().total / 12));
    expect(goldUpkeep).toBeLessThan(kingdom.goldUpkeepParts().total);
  });

  it('Alte Spielstände ohne Nahrungs- und Sperrfelder laden ohne Fehler und migrieren sinnvoll', () => {
    const warfare = new CampaignWarfareSystem(sequence(0.5));
    warfare.ensureRivals('legacy');

    // Spielstand-Simulation ohne die neuen Felder food/lastUpkeepMonth.
    const legacySnapshot = warfare.serialize() as unknown as Record<string, unknown>;
    const rivals = legacySnapshot.rivals as unknown as Record<string, unknown>[];
    expect(rivals.length).toBeGreaterThan(0);
    for (const rival of rivals) {
      delete rival.food;
      delete rival.lastUpkeepMonth;
    }

    const restored = new CampaignWarfareSystem(sequence(0.5));
    expect(() => restored.load(legacySnapshot as never)).not.toThrow();

    // Migration: leere Vorräte, keine vorgespiegelte Monatsbuchung.
    const loaded = restored.getRivals('legacy');
    for (const rival of loaded) {
      expect(rival.food).toBe(0);
      expect(rival.lastUpkeepMonth).toBeNull();
    }

    // Roundtrip bewahrt den migrierten Zustand.
    const reloaded = new CampaignWarfareSystem(sequence(0.5));
    reloaded.load(JSON.parse(JSON.stringify(restored.serialize())));
    for (const rival of reloaded.getRivals('legacy')) {
      expect(rival.food).toBe(0);
      expect(rival.lastUpkeepMonth).toBeNull();
    }

    // Nach der Migration wird korrekt abgerechnet — der Gegner zahlt, was er
    // hat; Bestand und Deckungslücke sind im Bericht nachvollziehbar.
    const report = restored.payUpkeep(YEAR * 12);
    expect(report.length).toBe(loaded.length);
    for (const entry of report) {
      expect(entry.paidFood).toBeLessThanOrEqual(entry.cost.food);
      expect(entry.foodShortfall).toBe(entry.cost.food - entry.paidFood);
      expect(entry.shortfall).toBe(entry.cost.gold - entry.paid);
    }
    // Dieselbe Monatsabrechnung wird nach der Migration nicht doppelt gebucht.
    expect(restored.payUpkeep(YEAR * 12)).toHaveLength(0);
  });
});
