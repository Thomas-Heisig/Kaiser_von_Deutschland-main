import { doctrineForYear, rivalIdentity } from './HistoricalGameplay';
import { defenseBreakdown, type DefenseBreakdown } from './GarrisonModel';
import { rivalReaction, type RealmProgress } from './RivalStrategy';
// src/core/CampaignWarfareSystem.ts
import type { Kingdom } from './Kingdom';

/** Unit types that take part in field battles. */
export type FieldUnit = 'infantry' | 'archers' | 'cavalry';

/** Computer-controlled neighbouring realm of the build campaign. */
export interface RivalRealm {
  baseSoldiers?:number;
  generation?:number;
  id: string;
  name: string;
  description: string;
  soldiers: number;
  fortification: number;
  loot: number;
  settlers: number;
  subjugated: boolean;
  /** Owning player for per-player rival state (each human player has own neighbours). */
  playerId: string;
}

/** Outcome of a single resolved battle. */
export type RivalPersonality = 'raider' | 'fortifier' | 'merchant';
export interface RivalDevelopment {
  playerId: string;
  rivalId: string;
  name: string;
  personality: RivalPersonality;
  year: number;
  message: string;
}

/** Monatlicher Unterhalt eines Gegners mit erklärter Folge bei Mangel. */
export interface RivalUpkeep {
  rivalId: string;
  playerId: string;
  name: string;
  soldiers: number;
  cost: { gold: number; food: number };
  paid: number;
  shortfall: number;
  consequence: string;
}

/** Opponents retain recognizable strategies instead of simply gaining generic resources. */
export const rivalPersonality = (id: string): RivalPersonality =>
  id === 'raubritter' ? 'raider' : id === 'ostmark' ? 'fortifier' : 'merchant';

export interface BattleReport {
  id: string;
  rivalId?: string;
  year: number;
  month: number;
  kind: 'campaign' | 'raid' | 'duel';
  attacker: string;
  defender: string;
  attackerPower: number;
  defenderPower: number;
  victoryChance: number;
  attackerWon: boolean;
  attackerLosses: number;
  defenderLosses: number;
  plunder: number;
  summary: string;
  /** Players affected by this report. */
  playerIds: string[];
}

/** Serializable state of the warfare system. */
export interface CampaignWarfareSnapshot {
  rivals: RivalRealm[];
  reports: BattleReport[];
  lastCampaignMonth: Record<string, number>;
  reportCounter: number;
}

/** Random number source in [0, 1). Injected for deterministic tests. */
export type RandomSource = () => number;

/** Bonus multiplier applied on top of the army strength (e.g. ruler character skills). */
export interface PowerModifiers {
  commanderBonus?: number;
}

const RIVAL_TEMPLATES: ReadonlyArray<Omit<RivalRealm, 'playerId' | 'subjugated'>> = [
  {
    id: 'raubritter', name: 'Raubritter vom Schwarzwald',
    description: 'Eine Bande gepanzerter Reiter, die Handelswege und Dörfer plündert.',
    soldiers: 110, fortification: 1, loot: 1500, settlers: 150
  },
  {
    id: 'ostmark', name: 'Grafschaft Ostmark',
    description: 'Ein ehrgeiziger Graf mit befestigten Grenzburgen.',
    soldiers: 420, fortification: 1.2, loot: 4500, settlers: 700
  },
  {
    id: 'nordland', name: 'Herzogtum Nordland',
    description: 'Der mächtigste Nachbar. Seine Unterwerfung sichert dir die Vorherrschaft.',
    soldiers: 1100, fortification: 1.4, loot: 10000, settlers: 1600
  }
];

/** Gold and food needed per soldier to supply a field campaign. */
export const CAMPAIGN_SUPPLY = { gold: 2, food: 1 } as const;
/** Minimum number of field soldiers needed for a campaign. */
export const MIN_CAMPAIGN_SOLDIERS = 20;
const UNIT_POWER: Record<FieldUnit, number> = { infantry: 1, archers: 1.3, cavalry: 2.5 };
const MONTHLY_RAID_CHANCE = 0.06;
const MAX_REPORTS = 60;

/**
 * Playable warfare for the build campaign: field campaigns against rival realms,
 * raids on the player's realm and battles between hotseat players.
 * Battles are resolved statistically from aggregated unit strengths so they scale to large armies.
 */
export class CampaignWarfareSystem {
  private rivals: RivalRealm[] = [];
  private reports: BattleReport[] = [];
  private lastCampaignMonth: Map<string, number> = new Map();
  private reportCounter: number = 0;

  /**
   * @param random Random source used for battle and raid rolls.
   */
  public constructor(private readonly random: RandomSource = Math.random) {}

  /**
   * Creates the neighbouring rivals for a player if they do not exist yet.
   * @param playerId Owning player.
   * @param difficulty Game difficulty 1-3; scales rival armies.
   * @returns Nothing.
   */
  public ensureRivals(playerId: string, difficulty: number = 2): void {
    if (this.rivals.some((rival: RivalRealm): boolean => rival.playerId === playerId)) return;
    const scale = 0.8 + Math.max(1, Math.min(3, difficulty)) * 0.1;
    for (const template of RIVAL_TEMPLATES) {
      this.rivals.push({
        ...template, playerId, subjugated: false, soldiers: Math.round(template.soldiers * scale)
      });
    }
  }

  /**
   * Returns the rivals of a player.
   * @param playerId Owning player.
   * @returns Copies of the rival realms.
   */
  public getRivals(playerId: string, year: number = 1200): RivalRealm[] {
    return this.rivals.filter((rival: RivalRealm): boolean => rival.playerId === playerId)
      .map((rival: RivalRealm): RivalRealm => ({ ...rival, ...(rivalIdentity(rival.id,year) ?? {}) }));
  }

  /**
   * Returns the latest battle reports concerning a player (newest first).
   * @param playerId Player filter; omit for all reports.
   * @returns Battle reports.
   */
  /** A completed siege weakens a rival before the next field assault. */
  public weakenRivalFortification(playerId: string, rivalId: string, amount: number): void {
    const rival = this.rivals.find((entry) => entry.playerId === playerId && entry.id === rivalId);
    if (!rival || rival.subjugated || !Number.isFinite(amount) || amount <= 0 || amount > 0.4)
      throw new Error('Ungültiges Belagerungsziel.');
    rival.fortification = Math.max(0.7, rival.fortification - amount);
  }

  public getReports(playerId?: string): BattleReport[] {
    return this.reports.filter((report: BattleReport): boolean =>
      !playerId || report.playerIds.includes(playerId)).map((report: BattleReport): BattleReport => ({ ...report }));
  }

  /**
   * Total number of field soldiers of a kingdom.
   * @param kingdom Kingdom to inspect.
   * @returns Infantry, archers and cavalry combined.
   */
  public static fieldSoldiers(kingdom: Kingdom): number {
    return kingdom.military.infantry + kingdom.military.archers + kingdom.military.cavalry;
  }

  /**
   * Computes the combat power of a kingdom's field army.
   * @param kingdom Kingdom to evaluate.
   * @param modifiers Optional commander bonus (0-0.5).
   * @returns Effective combat power.
   */
  public static armyPower(kingdom: Kingdom, modifiers: PowerModifiers = {}, year: number = 1200): number {
    const military = kingdom.military;
    const doctrine = doctrineForYear(year);
    const raw = (Object.keys(UNIT_POWER) as FieldUnit[])
      .reduce((sum: number, unit: FieldUnit): number => sum + military[unit] * doctrine.coefficients[unit], 0);
    const quality = 0.6 + (military.trainingLevel + military.equipmentQuality + military.morale) / 250;
    const barracks = 1 + Math.min(0.3, kingdom.infrastructure.barracks * 0.05);
    const commander = 1 + Math.max(0, Math.min(0.5, modifiers.commanderBonus ?? 0));
    return Math.round(raw * quality * barracks * commander);
  }

  /**
   * Computes the defensive power of a kingdom including walls and castles.
   * @param kingdom Defending kingdom.
   * @param modifiers Optional commander bonus.
   * @returns Effective defensive power.
   */
  public static defensePower(kingdom: Kingdom, modifiers: PowerModifiers = {}, year: number = 1200): number {
    // One shared basis for preview and resolution: garrison manning, supply and
    // per-site fortification instead of a flat global multiplier.
    const breakdown = CampaignWarfareSystem.defenseBreakdown(kingdom, modifiers, year);
    return breakdown.total;
  }

  /**
   * Verteidigung mit Aufschlüsselung. Vorschau und Kampfauflösung nutzen
   * dieselbe Berechnung.
   * @param kingdom Verteidigendes Reich.
   * @param modifiers Optionaler Feldherrenbonus.
   * @param year Jahr für die Epochendoktrin.
   * @param supplyRatio Anteil gedeckter Versorgung (0–1).
   * @param damage Schadensanteil an den Anlagen (0–1).
   * @returns Aufschlüsselung mit Gesamtwert und Hinweisen.
   */
  public static defenseBreakdown(
    kingdom: Kingdom, modifiers: PowerModifiers = {}, year: number = 1200,
    supplyRatio = 1, damage = 0
  ): DefenseBreakdown {
    const troops = CampaignWarfareSystem.armyPower(kingdom, modifiers, year);
    const doctrine = doctrineForYear(year);
    const result = defenseBreakdown(kingdom, troops, supplyRatio, damage);
    // Doctrine still shapes how strongly fortification counts in each era.
    const scaled = Math.round(result.total * doctrine.fortificationFactor);
    return { ...result, total: scaled };
  }

  /**
   * Power of a rival realm when defending its lands.
   * @param rival Rival realm.
   * @returns Effective defensive power.
   */
  public static rivalPower(rival: RivalRealm, year: number = 1200): number {
    return Math.round(rival.soldiers * 1.2 * rival.fortification * doctrineForYear(year).rivalPowerFactor);
  }

  /**
   * Probability that the attacker wins, based on the power ratio.
   * @param attackerPower Attacker strength.
   * @param defenderPower Defender strength.
   * @returns Chance between 0.03 and 0.97.
   */
  public static victoryChance(attackerPower: number, defenderPower: number): number {
    if (attackerPower <= 0) return 0;
    if (defenderPower <= 0) return 0.97;
    const a = attackerPower ** 3;
    const chance = a / (a + defenderPower ** 3);
    return Math.max(0.03, Math.min(0.97, chance));
  }

  /**
   * Checks whether a player may launch a field campaign this month.
   * @param playerId Player.
   * @param monthIndex Absolute month index (year * 12 + month).
   * @returns True if no campaign was fought this month.
   */
  public canCampaign(playerId: string, monthIndex: number): boolean {
    return this.lastCampaignMonth.get(playerId) !== monthIndex;
  }

  /**
   * Supply costs of a field campaign for the current army.
   * @param kingdom Attacking kingdom.
   * @returns Gold and food required.
   */
  public static campaignCost(kingdom: Kingdom): { gold: number; food: number } {
    const soldiers = CampaignWarfareSystem.fieldSoldiers(kingdom);
    return { gold: soldiers * CAMPAIGN_SUPPLY.gold, food: soldiers * CAMPAIGN_SUPPLY.food };
  }

  /**
   * Launches a field campaign against a rival realm.
   * @param playerId Attacking player.
   * @param kingdom Attacking kingdom (mutated: supplies, casualties, loot).
   * @param rivalId Rival to attack.
   * @param date Current date.
   * @param modifiers Commander bonus.
   * @returns The battle report.
   * @throws Error if the campaign is not possible.
   */
  public attackRival(
    playerId: string, kingdom: Kingdom, rivalId: string,
    date: { year: number; month: number }, modifiers: PowerModifiers = {}, prepaid=false
  ): BattleReport {
    const rival = this.rivals.find((entry: RivalRealm): boolean => entry.playerId === playerId && entry.id === rivalId);
    if (!rival) throw new Error('Unbekannter Gegner.');
    if (rival.subjugated) throw new Error(`${rival.name} ist bereits unterworfen.`);
    const monthIndex = date.year * 12 + date.month;
    if(!prepaid){this.assertCampaignPossible(playerId, kingdom, monthIndex);this.payCampaign(kingdom);}
    this.lastCampaignMonth.set(playerId, monthIndex);

    const attackerPower = CampaignWarfareSystem.armyPower(kingdom, modifiers, date.year);
    const defenderPower = CampaignWarfareSystem.rivalPower(rival, date.year);
    const chance = CampaignWarfareSystem.victoryChance(attackerPower, defenderPower);
    const won = this.random() < chance;
    const ownSoldiers = CampaignWarfareSystem.fieldSoldiers(kingdom);
    const ratio = defenderPower / Math.max(1, attackerPower);
    const attackerLosses = this.applyCasualties(kingdom, won
      ? Math.min(0.4, 0.06 + 0.14 * ratio) : 0.25 + 0.15 * this.random(), ownSoldiers);
    const defenderLosses = Math.round(rival.soldiers * (won ? 0.5 : Math.min(0.3, 0.08 + 0.1 / Math.max(0.2, ratio))));
    rival.baseSoldiers=Math.max(rival.baseSoldiers??0,rival.soldiers);
    rival.soldiers = Math.max(0, rival.soldiers - defenderLosses);

    let plunder = 0;
    let summary: string;
    if (won) {
      rival.subjugated = true;
      plunder = rival.loot;
      kingdom.resources.gold += plunder;
      kingdom.population.peasants += rival.settlers;
      kingdom.military.morale = Math.min(100, kingdom.military.morale + 10);
      kingdom.happiness = Math.min(100, kingdom.happiness + 3);
      summary = `Sieg über ${rival.name}! ${plunder} Gold erbeutet, ${rival.settlers} Siedler schließen sich an. ` +
        `Der Gegner zahlt künftig Tribut.`;
    } else {
      kingdom.military.morale = Math.max(0, kingdom.military.morale - 12);
      kingdom.happiness = Math.max(0, kingdom.happiness - 4);
      summary = `Niederlage gegen ${rival.name}. Das Heer zieht sich mit ${attackerLosses} Gefallenen zurück.`;
    }
    summary = '[' + doctrineForYear(date.year).conflict + '] ' + summary;
    return this.addReport({
      year: date.year, month: date.month, kind: 'campaign', attacker: kingdom.name, defender: rivalIdentity(rival.id,date.year)?.name ?? rival.name,
      attackerPower, defenderPower, victoryChance: chance, attackerWon: won,
      attackerLosses, defenderLosses, plunder, summary, playerIds: [playerId]
    });
  }

  /**
   * Resolves a battle between two human players (hotseat).
   * @param attacker Attacking player id and kingdom.
   * @param defender Defending player id and kingdom.
   * @param date Current date.
   * @param modifiers Commander bonuses of both sides.
   * @returns Battle report.
   * @throws Error if the attack is not possible.
   */
  public attackPlayer(
    attacker: { id: string; kingdom: Kingdom }, defender: { id: string; kingdom: Kingdom },
    date: { year: number; month: number },
    modifiers: { attacker?: PowerModifiers; defender?: PowerModifiers } = {},prepaid=false
  ): BattleReport {
    if (attacker.id === defender.id) throw new Error('Ein Reich kann sich nicht selbst angreifen.');
    const monthIndex = date.year * 12 + date.month;
    if(!prepaid){this.assertCampaignPossible(attacker.id, attacker.kingdom, monthIndex);this.payCampaign(attacker.kingdom);}
    this.lastCampaignMonth.set(attacker.id, monthIndex);

    const attackerPower = CampaignWarfareSystem.armyPower(attacker.kingdom, modifiers.attacker, date.year);
    const defenderPower = CampaignWarfareSystem.defensePower(defender.kingdom, modifiers.defender, date.year);
    const chance = CampaignWarfareSystem.victoryChance(attackerPower, defenderPower);
    const won = this.random() < chance;
    const attackerSoldiers = CampaignWarfareSystem.fieldSoldiers(attacker.kingdom);
    const defenderSoldiers = CampaignWarfareSystem.fieldSoldiers(defender.kingdom);
    const attackerLosses = this.applyCasualties(attacker.kingdom, won ? 0.12 : 0.3, attackerSoldiers);
    const defenderLosses = this.applyCasualties(defender.kingdom, won ? 0.3 : 0.12, defenderSoldiers);
    let plunder = 0;
    const [winner, loser] = won ? [attacker.kingdom, defender.kingdom] : [defender.kingdom, attacker.kingdom];
    if (won) {
      plunder = Math.floor(defender.kingdom.resources.gold * 0.15);
      defender.kingdom.resources.gold -= plunder;
      attacker.kingdom.resources.gold += plunder;
    }
    winner.military.morale = Math.min(100, winner.military.morale + 6);
    loser.military.morale = Math.max(0, loser.military.morale - 10);
    loser.happiness = Math.max(0, loser.happiness - 5);
    const summary = won
      ? `${attacker.kingdom.name} besiegt ${defender.kingdom.name} und erbeutet ${plunder} Gold.`
      : `${defender.kingdom.name} schlägt den Angriff von ${attacker.kingdom.name} zurück.`;
    return this.addReport({
      year: date.year, month: date.month, kind: 'duel', attacker: attacker.kingdom.name,
      defender: defender.kingdom.name, attackerPower, defenderPower, victoryChance: chance, attackerWon: won,
      attackerLosses, defenderLosses, plunder, summary, playerIds: [attacker.id, defender.id]
    });
  }

  /**
   * Monthly processing: tribute from subjugated rivals and possible raids by hostile ones.
   * @param playerId Player whose realm is processed.
   * @param kingdom The player's kingdom (mutated).
   * @param date Current date.
   * @param options Whether raids are enabled and the defender's commander bonus.
   * @returns Raid report if a raid happened.
   */
  public processMonth(
    playerId: string, kingdom: Kingdom, date: { year: number; month: number },
    options: { raids: boolean; modifiers?: PowerModifiers; protectedByTreaty?: (rivalId: string) => boolean }
  ): BattleReport | undefined {
    const own = this.rivals.filter((rival: RivalRealm): boolean => rival.playerId === playerId);
    for (const rival of own.filter((entry: RivalRealm): boolean => entry.subjugated)) {
      kingdom.resources.gold += Math.floor(rival.loot / 24);
    }
    if (!options.raids) return undefined;
    const hostile = own.filter((rival: RivalRealm): boolean =>
      !rival.subjugated && rival.soldiers > 0 && !options.protectedByTreaty?.(rival.id));
    if (!hostile.length || this.random() >= MONTHLY_RAID_CHANCE) return undefined;
    const raider = hostile[Math.min(hostile.length - 1, Math.floor(this.random() * hostile.length))];
    const raidPower = Math.round(CampaignWarfareSystem.rivalPower(raider, date.year) * 0.4 / raider.fortification);
    const defense = CampaignWarfareSystem.defensePower(kingdom, options.modifiers, date.year);
    const raiderChance = CampaignWarfareSystem.victoryChance(raidPower, defense);
    const raiderWon = this.random() < raiderChance;
    const defenderLosses = this.applyCasualties(kingdom, raiderWon ? 0.12 : 0.04,
      CampaignWarfareSystem.fieldSoldiers(kingdom));
    const raiderLosses = Math.round(raider.soldiers * (raiderWon ? 0.05 : 0.15));
    raider.soldiers = Math.max(0, raider.soldiers - raiderLosses);
    let plunder = 0;
    let summary: string;
    if (raiderWon) {
      plunder = Math.floor(kingdom.resources.gold * 0.1);
      kingdom.resources.gold -= plunder;
      kingdom.resources.food = Math.floor(kingdom.resources.food * 0.9);
      kingdom.happiness = Math.max(0, kingdom.happiness - 5);
      summary = `${raider.name} überfällt dein Reich und raubt ${plunder} Gold sowie Vorräte. ` +
        'Mauern, Burgen und eine stärkere Garnison schützen besser.';
    } else {
      kingdom.military.morale = Math.min(100, kingdom.military.morale + 4);
      summary = `Deine Garnison schlägt einen Überfall von ${raider.name} zurück.`;
    }
    summary = '[' + doctrineForYear(date.year).raid + '] ' + summary;
    return this.addReport({
      year: date.year, month: date.month, kind: 'raid', rivalId: raider.id, attacker: rivalIdentity(raider.id,date.year)?.name ?? raider.name, defender: kingdom.name,
      attackerPower: raidPower, defenderPower: defense, victoryChance: raiderChance, attackerWon: raiderWon,
      attackerLosses: raiderLosses, defenderLosses, plunder, summary, playerIds: [playerId]
    });
  }

  /**
   * Yearly processing: hostile rivals rebuild their armies.
   * @returns Nothing.
   */
  public processYear(year: number = 0, progressFor?: (playerId: string) => RealmProgress): RivalDevelopment[] {
    const news: RivalDevelopment[] = [];
    for (const rival of this.rivals) {
      if (rival.subjugated) continue;
      // A bounded baseline prevents exponential opponent scaling after long campaigns.
      const base = rival.baseSoldiers ?? RIVAL_TEMPLATES.find((template) => template.id === rival.id)?.soldiers ?? 200;
      const limit = base * 5;
      rival.soldiers = Math.min(limit, Math.round(rival.soldiers * 1.04 + 4));
      if (!year) continue;
      const personality = rivalPersonality(rival.id);
      let message: string;
      if (personality === 'raider') {
        rival.soldiers = Math.min(limit, rival.soldiers + Math.round(base * 0.05));
        message = `${rival.name} sammelt weitere Söldner an seiner Grenze.`;
      } else if (personality === 'fortifier') {
        rival.fortification = Math.min(1.8, Math.round((rival.fortification + 0.025) * 1000) / 1000);
        message = `${rival.name} verstärkt die Grenzbefestigungen.`;
      } else {
        rival.loot = Math.min(25000, rival.loot + 225);
        message = `${rival.name} erweitert seine Handelswege und füllt die Schatzkammer.`;
      }
      const reaction = rivalReaction(personality, progressFor?.(rival.playerId));
      rival.soldiers = Math.min(limit, rival.soldiers + reaction.soldiers);
      rival.fortification = Math.min(1.8, rival.fortification + reaction.fortification);
      rival.loot = Math.min(25000, rival.loot + reaction.wealth);
      if (reaction.reason) message += ' ' + reaction.reason;
      const identity = rivalIdentity(rival.id, year);
      if (identity) message = message.replace(rival.name, identity.name);
      news.push({ playerId: rival.playerId, rivalId: rival.id, name: identity?.name ?? rival.name, personality, year, message });
    }
    return news;
  }

  /**
   * Markiert einen Nachbarn als unterworfen (Vasall).
   * Wirkt auf den gespeicherten Zustand, nicht auf eine Kopie.
   * @param playerId Spieler.
   * @param rivalId Stabiler Nachbar-Schlüssel, nicht der Anzeigename.
   * @returns true, wenn der Nachbar gefunden und markiert wurde.
   */
  public subjugateRival(playerId: string, rivalId: string): boolean {
    const rival = this.rivals.find(entry => entry.playerId === playerId && entry.id === rivalId);
    if (!rival) return false;
    rival.subjugated = true;
    return true;
  }

  /**
   * Führt eine geprüfte Zustandsänderung an einem Nachbarn aus.
   * Einzige Schreibschnittstelle für Vasallenbuchungen, damit `getRivals`
   * weiterhin Kopien liefern kann.
   * @param playerId Spieler.
   * @param rivalId Stabile ID.
   * @param change Veränderung am gespeicherten Nachbarn.
   * @returns true, wenn der Nachbar gefunden wurde.
   */
  public mutateRival(playerId: string, rivalId: string, change: (rival: RivalRealm) => void): boolean {
    const rival = this.rivals.find(entry => entry.playerId === playerId && entry.id === rivalId);
    if (!rival) return false;
    change(rival);
    return true;
  }

  /**
   * Monatlicher Unterhalt der gegnerischen Truppen.
   *
   * Gegner zahlen denselben Grundregeln folgend wie der Spieler: Soldaten
   * kosten Gold und Nahrung. Die gegnerische Wirtschaft ist vereinfacht, aber
   * beschränkt — Truppen sind nie kostenlos. Bei Zahlungsmangel sinkt die
   * Schlagkraft abgestuft, statt sofort zu verschwinden. Bestände werden nicht
   * monatlich zurückgesetzt; neue Gegner erhalten einmalige Anfangsbestände.
   *
   * @returns Bericht je Nachbar mit Kosten, Zahlung und erklärter Folge.
   */
  public payUpkeep(): RivalUpkeep[] {
    const report: RivalUpkeep[] = [];
    for (const rival of this.rivals) {
      const cost = CampaignWarfareSystem.upkeepFor(rival.soldiers);
      const paid = Math.min(rival.loot, cost.gold);
      rival.loot -= paid;
      const shortfall = cost.gold - paid;
      let consequence = 'keine';
      if (shortfall > 0) {
        // Graded, explained consequence: no sudden loss of the whole army.
        const loss = Math.ceil(rival.soldiers * (shortfall / Math.max(1, cost.gold)) * 0.1);
        rival.soldiers = Math.max(0, rival.soldiers - loss);
        rival.fortification = Math.max(0.7, rival.fortification - 0.01);
        consequence = `${loss} Soldaten entlassen (Sold ausgeblieben) · Befestigung sinkt`;
      }
      report.push({
        rivalId: rival.id, playerId: rival.playerId, name: rival.name,
        soldiers: rival.soldiers, cost, paid, shortfall, consequence
      });
    }
    return report;
  }

  /** Unterhaltssatz je Soldat und Monat (Gold und Nahrung). */
  public static upkeepFor(soldiers: number): { gold: number; food: number } {
    return { gold: Math.ceil(soldiers * 0.5), food: Math.ceil(soldiers * 0.25) };
  }

  /**
   * Ergänzt neue Nachbarn jenseits einer befriedeten Grenze.
   *
   * Kriterien statt Zufall: Es wird nur ergänzt, wenn **alle** bisherigen
   * Nachbarn unterworfen sind und für die aktuelle Generation noch keine
   * Akteure existieren. Dadurch entstehen beim wiederholten Laden oder bei
   * mehreren Monatswechseln keine Duplikate, und Eroberungen sowie Verträge
   * bleiben erhalten. Alle Akteure werden über stabile IDs verwaltet.
   *
   * @param playerId Spieler.
   * @param year Aktuelles Jahr; bestimmt Benennung und Einordnung.
   * @returns Neu hinzugefügte Nachbarn (leer, wenn kein Anlass besteht).
   */
  public expandFrontier(playerId:string,year:number):RivalRealm[] {
    const previous=this.rivals.filter(r=>r.playerId===playerId);
    if(!previous.length||previous.some(r=>!r.subjugated))return [];
    const generation=Math.max(...previous.map(r=>r.generation??0))+1;
    // Idempotence: this generation already exists, so nothing is added again.
    if(this.rivals.some(r=>r.playerId===playerId&&r.generation===generation))return [];
    const base=Math.min(100000,Math.ceil(Math.max(...previous.map(r=>r.baseSoldiers??r.soldiers),1100)*1.25));
    // Period-appropriate collective names; no modern state projected backwards.
    const label=year<500?'Bund':year<900?'Stammesbund':year<1500?'Grenzherrschaft'
      :year<1800?'Territorium':'Regionalmacht';
    const directions=['West','Nord','Ost'] as const;
    const fresh: RivalRealm[] = directions.map((direction, i) => ({
      id:`frontier-${playerId}-${generation}-${i}`,
      name:`${label} ${generation} · ${direction}`,
      description:'Neue, fiktive Macht jenseits der befriedeten Grenze. Spielmodell, keine historische Staatsgrenze.',
      playerId,
      soldiers:Math.ceil(base*(1+i*.25)),baseSoldiers:Math.ceil(base*(1+i*.25)),generation,
      fortification:Math.min(1.8,1.15+generation*.05+i*.1),
      loot:Math.min(50000,5000+generation*1500+i*2000),
      settlers:500+generation*100,subjugated:false}));
    this.rivals.push(...fresh);
    return fresh.map(r=>({...r}));
  }

  /**
   * Begründung für neu hinzugekommene Nachbarn (für die Chronik).
   * @param fresh Neu erzeugte Nachbarn aus {@link expandFrontier}.
   * @returns Ein Satz mit nachvollziehbarer Ursache, oder `null`.
   */
  public static frontierReason(fresh: readonly RivalRealm[]): string | null {
    if (!fresh.length) return null;
    return `Nach der Befriedung der bisherigen Grenze treten weiter entfernte Mächte auf: `
      + fresh.map(r => r.name).join(', ')
      + '. Sie sind ein Spielmodell und keine belegte historische Grenzziehung.';
  }

  /**
   * Number of rivals a player has subjugated.
   * @param playerId Player.
   * @returns Count of subjugated rivals.
   */
  public subjugatedCount(playerId: string): number {
    return this.rivals.filter((rival: RivalRealm): boolean => rival.playerId === playerId && rival.subjugated).length;
  }

  /**
   * Removes all state of a player.
   * @param playerId Player to remove.
   * @returns Nothing.
   */
  public removePlayer(playerId: string): void {
    this.rivals = this.rivals.filter((rival: RivalRealm): boolean => rival.playerId !== playerId);
    this.lastCampaignMonth.delete(playerId);
  }

  /**
   * Serializes the system for save games.
   * @returns Plain snapshot.
   */
  public serialize(): CampaignWarfareSnapshot {
    return {
      rivals: this.rivals.map((rival: RivalRealm): RivalRealm => ({ ...rival })),
      reports: this.reports.map((report: BattleReport): BattleReport => ({ ...report, playerIds: [...report.playerIds] })),
      lastCampaignMonth: Object.fromEntries(this.lastCampaignMonth),
      reportCounter: this.reportCounter
    };
  }

  /**
   * Restores a snapshot.
   * @param snapshot Previously serialized state.
   * @returns Nothing.
   * @throws Error for malformed snapshots.
   */
  public load(snapshot: CampaignWarfareSnapshot): void {
    if (!snapshot || !Array.isArray(snapshot.rivals) || !Array.isArray(snapshot.reports)) {
      throw new Error('Beschädigte Kriegsdaten im Spielstand.');
    }
    for (const rival of snapshot.rivals) {
      if (typeof rival.id !== 'string' || !Number.isFinite(rival.soldiers) || rival.soldiers < 0) {
        throw new Error('Beschädigte Kriegsdaten im Spielstand.');
      }
    }
    this.rivals = snapshot.rivals.map((rival: RivalRealm): RivalRealm => ({ ...rival }));
    this.reports = snapshot.reports.map((report: BattleReport): BattleReport => ({ ...report }));
    this.lastCampaignMonth = new Map(Object.entries(snapshot.lastCampaignMonth ?? {}));
    this.reportCounter = Number.isSafeInteger(snapshot.reportCounter) ? snapshot.reportCounter : this.reports.length;
  }

  private assertCampaignPossible(playerId: string, kingdom: Kingdom, monthIndex: number): void {
    if (!this.canCampaign(playerId, monthIndex)) {
      throw new Error('Dein Heer hat in diesem Monat bereits gekämpft. Warte bis zum nächsten Monat.');
    }
    if (CampaignWarfareSystem.fieldSoldiers(kingdom) < MIN_CAMPAIGN_SOLDIERS) {
      throw new Error(`Für einen Feldzug brauchst du mindestens ${MIN_CAMPAIGN_SOLDIERS} Soldaten.`);
    }
    const cost = CampaignWarfareSystem.campaignCost(kingdom);
    if (kingdom.resources.gold < cost.gold || kingdom.resources.food < cost.food) {
      throw new Error(`Nicht genug Nachschub: ${cost.gold} Gold und ${cost.food} Nahrung benötigt.`);
    }
  }

  private payCampaign(kingdom: Kingdom): void {
    const cost = CampaignWarfareSystem.campaignCost(kingdom);
    kingdom.resources.gold -= cost.gold;
    kingdom.resources.food -= cost.food;
  }

  /** Removes a share of the field army proportionally across unit types and returns the dead. */
  private applyCasualties(kingdom: Kingdom, share: number, soldiers: number): number {
    const target = Math.min(soldiers, Math.round(soldiers * Math.max(0, Math.min(1, share))));
    let removed = 0;
    for (const unit of ['infantry', 'archers', 'cavalry'] as const) {
      const loss = Math.min(kingdom.military[unit], Math.round(target * (kingdom.military[unit] / Math.max(1, soldiers))));
      kingdom.military[unit] -= loss;
      removed += loss;
    }
    kingdom.population.soldiers = Math.max(0, kingdom.population.soldiers - removed);
    return removed;
  }

  private addReport(data: Omit<BattleReport, 'id'>): BattleReport {
    this.reportCounter += 1;
    const report: BattleReport = { ...data, id: `battle-${this.reportCounter}` };
    this.reports.unshift(report);
    this.reports = this.reports.slice(0, MAX_REPORTS);
    return { ...report };
  }
}
