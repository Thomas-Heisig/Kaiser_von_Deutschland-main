import type { Player } from './Player';

export type CouncilResource = 'gold' | 'food' | 'wood' | 'stone' | 'iron';
export type CouncilEffect = Partial<Record<CouncilResource | 'happiness' | 'stability' | 'prestige', number>>;

export interface CouncilChoice {
  id: string;
  title: string;
  description: string;
  cost: Partial<Record<CouncilResource, number>>;
  effect: CouncilEffect;
  /** When set, a failed gamble applies failure instead of effect. */
  successChance?: number;
  failure?: CouncilEffect;
}

export interface CouncilDecision {
  id: string;
  category: string;
  title: string;
  story: string;
  choices: CouncilChoice[];
}

export interface PendingCouncilDecision {
  decisionId: string;
  issuedAt: number;
}

export interface CouncilHistoryEntry {
  playerId: string;
  decisionId: string;
  choiceId: string;
  success: boolean;
  date: string;
  message: string;
}

export interface CouncilSnapshot {
  pending: Array<[string, PendingCouncilDecision]>;
  lastTriggered: Array<[string, number]>;
  lastDecision: Array<[string, string]>;
  history: CouncilHistoryEntry[];
}

export interface CouncilChoiceOffer extends CouncilChoice {
  affordable: boolean;
  probability: number | null;
}

export const COUNCIL_DECISIONS: readonly CouncilDecision[] = [
  {
    id: 'failed_harvest', category: 'VERSORGUNG', title: 'Eine Ernte in Gefahr',
    story: 'Die Bauern melden verdorbene Vorräte. Das Volk erwartet eine Entscheidung, ehe Hunger um sich greift.',
    choices: [
      { id: 'import', title: 'Korn aus Nachbarreichen kaufen', description: 'Sichere Nahrung, aber belaste die Schatzkammer.',
        cost: { gold: 650 }, effect: { food: 1300, happiness: 3 } },
      { id: 'ration', title: 'Rationen streng einteilen', description: 'Das Korn reicht länger, die Stimmung kippt.',
        cost: {}, effect: { food: 350, happiness: -6, stability: -2 } },
      { id: 'relief', title: 'Wagemutiger Hilfskonvoi', description: '65 % Grundchance: Hilfe trifft ein. Ein Fehlschlag kostet zusätzliche Vorräte.',
        cost: { gold: 250, wood: 80 }, effect: { food: 1600, happiness: 5, prestige: 2 },
        successChance: 0.65, failure: { food: -250, stability: -4 } }
    ]
  },
  {
    id: 'border_alarm', category: 'SICHERHEIT', title: 'Rauch an der Grenze',
    story: 'Grenzwachen melden bewaffnete Plünderer. Händler verlangen Schutz, die Feldherren drängen zum Handeln.',
    choices: [
      { id: 'guards', title: 'Grenzposten verstärken', description: 'Vorräte und Gold für eine sichere Grenze.',
        cost: { gold: 500, food: 250 }, effect: { stability: 5, happiness: 2 } },
      { id: 'parley', title: 'Unterhändler entsenden', description: 'Ein günstiger Friede, aber nicht ohne Zugeständnisse.',
        cost: { gold: 150 }, effect: { stability: 1, prestige: -1 } },
      { id: 'ambush', title: 'Einen Hinterhalt wagen', description: 'Riskanter Sieg mit Beute oder schwere Unruhe.',
        cost: { food: 250, iron: 45 }, effect: { gold: 1100, prestige: 3, stability: 3 },
        successChance: 0.55, failure: { gold: -400, stability: -7, happiness: -3 } }
    ]
  },
  {
    id: 'guild_petition', category: 'HANDEL', title: 'Die Gilden erheben Anspruch',
    story: 'Kaufleute und Handwerker fordern Privilegien. Ihr Angebot könnte das Reich reich machen.',
    choices: [
      { id: 'charter', title: 'Handelsrechte verleihen', description: 'Hoher Ertrag, aber weniger Rückhalt beim Volk.',
        cost: { gold: 150 }, effect: { gold: 850, happiness: -3, stability: 1 } },
      { id: 'fair', title: 'Freien Markt schützen', description: 'Du gewinnst Vertrauen statt eines schnellen Gewinns.',
        cost: { gold: 300 }, effect: { happiness: 5, prestige: 1 } },
      { id: 'fleet', title: 'Riskante Fernhandelsreise', description: 'Die Reise könnte eine reiche Ladung bringen oder scheitern.',
        cost: { gold: 750, wood: 150 }, effect: { gold: 2250, prestige: 3 },
        successChance: 0.6, failure: { stability: -3, happiness: -2 } }
    ]
  },
  {
    id: 'court_intrigue', category: 'INTRIGE', title: 'Ein Komplott am Hof',
    story: 'Es kursieren Gerüchte über Bestechung im Rat. Wer vorschnell urteilt, könnte treue Verbündete verlieren.',
    choices: [
      { id: 'inquiry', title: 'Öffentliche Untersuchung', description: 'Aufwendig, aber gut für Vertrauen und Ordnung.',
        cost: { gold: 400 }, effect: { stability: 5, prestige: 1 } },
      { id: 'silence', title: 'Die Gerüchte ersticken', description: 'Spare Gold, riskiere aber den Zorn der Bürger.',
        cost: {}, effect: { stability: -4, happiness: -4 } },
      { id: 'trap', title: 'Den Verräter entlarven', description: 'Ein riskanter Plan, der deine Autorität stärken könnte.',
        cost: { gold: 200 }, effect: { stability: 8, prestige: 3 },
        successChance: 0.55, failure: { stability: -8, prestige: -2 } }
    ]
  },
  {
    id: 'winter_storm', category: 'WINTER', title: 'Der Winter zieht auf',
    story: 'Heftige Stürme bedrohen Dörfer und Vorräte. Der Hof muss zwischen Schnelligkeit und Sparsamkeit wählen.',
    choices: [
      { id: 'supplies', title: 'Feuerholz und Essen verteilen', description: 'Teure, aber verlässliche Hilfe für die Dörfer.',
        cost: { wood: 450, food: 550 }, effect: { happiness: 7, stability: 2 } },
      { id: 'shelters', title: 'Gemeinschaftsunterkünfte öffnen', description: 'Kleinere Unterstützung, ohne die gesamte Reserve einzusetzen.',
        cost: { wood: 120, gold: 180 }, effect: { happiness: 3 } },
      { id: 'expedition', title: 'Durch den Sturm Vorräte bergen', description: 'Mutiger Einsatz mit Chance auf dringend benötigte Güter.',
        cost: { gold: 250 }, effect: { wood: 750, food: 900, prestige: 2 },
        successChance: 0.6, failure: { food: -350, happiness: -5 } }
    ]
  },
  {
    id: 'scholars_offer', category: 'FORSCHUNG', title: 'Gelehrte bitten um Gehör',
    story: 'Wandernde Gelehrte bieten neue Ideen an. Der Rat streitet über Aufwand, Nutzen und Glaubwürdigkeit.',
    choices: [
      { id: 'patron', title: 'Die Gelehrten fördern', description: 'Bildung und Ansehen gewinnen, gegen hohe Ausgaben.',
        cost: { gold: 550 }, effect: { prestige: 4, happiness: 2 } },
      { id: 'dismiss', title: 'Sie weiterziehen lassen', description: 'Kein Aufwand, aber eine vertane Chance.',
        cost: {}, effect: { prestige: -1 } },
      { id: 'experiment', title: 'Ein gewagtes Experiment finanzieren', description: 'Möglicher Durchbruch oder teurer Fehlschlag.',
        cost: { gold: 450, iron: 70 }, effect: { gold: 1200, prestige: 5 },
        successChance: 0.5, failure: { gold: -350, stability: -3 } }
    ]
  }
];

const RESOURCES: readonly CouncilResource[] = ['gold', 'food', 'wood', 'stone', 'iron'];

const between = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

/** Playable realm-specific narrative choices, with no external event dependencies. */
export class CouncilDecisionSystem {
  private pending = new Map<string, PendingCouncilDecision>();
  private lastTriggered = new Map<string, number>();
  private lastDecision = new Map<string, string>();
  private history: CouncilHistoryEntry[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  public getPending(playerId: string): CouncilDecision | null {
    const id = this.pending.get(playerId)?.decisionId;
    return COUNCIL_DECISIONS.find((decision) => decision.id === id) ?? null;
  }

  public getHistory(playerId: string): CouncilHistoryEntry[] {
    return this.history.filter((entry) => entry.playerId === playerId).map((entry) => ({ ...entry }));
  }

  public getChoices(player: Player): CouncilChoiceOffer[] {
    const decision = this.getPending(player.id);
    if (!decision) return [];
    return decision.choices.map((choice) => ({
      ...choice,
      cost: { ...choice.cost }, effect: { ...choice.effect },
      affordable: RESOURCES.every((key) => player.kingdom.resources[key] >= (choice.cost[key] ?? 0)),
      probability: choice.successChance === undefined ? null
        : between(choice.successChance + (player.kingdom.stats.stability - 50) / 500, 0.1, 0.95)
    }));
  }

  /** At most one decision per realm, with a four-to-six-month cooldown. */
  public tryGenerate(player: Player, year: number, month: number, startingYear: number): CouncilDecision | null {
    if (this.pending.has(player.id)) return null;
    const tick = year * 12 + month;
    const gap = tick - (this.lastTriggered.get(player.id) ?? (startingYear * 12 + 1));
    if (gap < 4 || (gap < 6 && this.random() >= 0.45)) return null;

    const kingdom = player.kingdom;
    const candidates = COUNCIL_DECISIONS.filter((decision) => {
      if (decision.id === this.lastDecision.get(player.id)) return false;
      if (decision.id === 'failed_harvest') return kingdom.resources.food < 2400 ||
        kingdom.getMonthlyBalance().net.food < 0;
      if (decision.id === 'border_alarm') return kingdom.military.infantry +
        kingdom.military.archers + kingdom.military.cavalry >= 10;
      if (decision.id === 'court_intrigue') return kingdom.stats.stability < 75;
      if (decision.id === 'winter_storm') return month >= 10 || month <= 2;
      return true;
    });
    if (!candidates.length) return null;
    const index = Math.min(candidates.length - 1, Math.floor(between(this.random(), 0, 0.999999) * candidates.length));
    const choice = candidates[index];
    this.pending.set(player.id, { decisionId: choice.id, issuedAt: tick });
    this.lastTriggered.set(player.id, tick);
    this.lastDecision.set(player.id, choice.id);
    return choice;
  }

  public resolve(player: Player, choiceId: string, year: number, month: number): CouncilHistoryEntry {
    const decision = this.getPending(player.id);
    if (!decision) throw new Error('Zurzeit liegt keine Ratsentscheidung vor.');
    const choice = this.getChoices(player).find((offer) => offer.id === choiceId);
    if (!choice) throw new Error('Diese Ratsentscheidung ist unbekannt.');
    if (!choice.affordable) throw new Error('Für diese Ratsentscheidung fehlen Ressourcen.');

    // A failed gamble never refunds the upfront cost.
    for (const resource of RESOURCES) player.kingdom.resources[resource] -= choice.cost[resource] ?? 0;
    const success = choice.probability === null || this.random() < choice.probability;
    const effects = success ? choice.effect : (choice.failure ?? {});
    for (const resource of RESOURCES) {
      player.kingdom.resources[resource] = Math.max(0, player.kingdom.resources[resource] + (effects[resource] ?? 0));
    }
    player.kingdom.happiness = between(player.kingdom.happiness + (effects.happiness ?? 0), 0, 100);
    player.kingdom.stats.stability = between(player.kingdom.stats.stability + (effects.stability ?? 0), 0, 100);
    if (effects.prestige) player.updateStats({ prestige: effects.prestige });

    const result: CouncilHistoryEntry = {
      playerId: player.id, decisionId: decision.id, choiceId: choice.id, success,
      date: String(month).padStart(2, '0') + '/' + year,
      message: decision.title + ': ' + choice.title + (choice.probability === null ? '.' :
        success ? ' – der Plan gelingt.' : ' – der Plan scheitert.')
    };
    this.pending.delete(player.id);
    this.history.unshift(result);
    this.history = this.history.slice(0, 100);
    return { ...result };
  }

  public serialize(): CouncilSnapshot {
    return {
      pending: Array.from(this.pending, ([key, value]) => [key, { ...value }]),
      lastTriggered: Array.from(this.lastTriggered),
      lastDecision: Array.from(this.lastDecision),
      history: this.history.map((entry) => ({ ...entry }))
    };
  }

  public load(snapshot: CouncilSnapshot): void {
    if (!snapshot || !Array.isArray(snapshot.pending) || !Array.isArray(snapshot.lastTriggered) ||
        !Array.isArray(snapshot.lastDecision) || !Array.isArray(snapshot.history) ||
        snapshot.pending.some(([id, value]) => typeof id !== 'string' || !value ||
          !COUNCIL_DECISIONS.some((decision) => decision.id === value.decisionId) ||
          !Number.isSafeInteger(value.issuedAt)) ||
        snapshot.lastTriggered.some(([id, tick]) => typeof id !== 'string' || !Number.isSafeInteger(tick)) ||
        snapshot.lastDecision.some(([id, decisionId]) => typeof id !== 'string' ||
          !COUNCIL_DECISIONS.some((decision) => decision.id === decisionId)) ||
        snapshot.history.some((entry) => !entry || typeof entry.playerId !== 'string' ||
          typeof entry.message !== 'string' || typeof entry.success !== 'boolean' ||
          !COUNCIL_DECISIONS.some((decision) => decision.id === entry.decisionId))) {
      throw new Error('Die Ratsentscheidungen im Spielstand sind beschädigt.');
    }
    this.pending = new Map(snapshot.pending.map(([id, value]) => [id, { ...value }]));
    this.lastTriggered = new Map(snapshot.lastTriggered);
    this.lastDecision = new Map(snapshot.lastDecision);
    this.history = snapshot.history.slice(0, 100).map((entry) => ({ ...entry }));
  }
}
