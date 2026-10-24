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
  minYear?: number;
  maxYear?: number;
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
  delegatedCitizenId?: string;
  delegatedCitizenName?: string;
  automatic?: boolean;
}

export interface CouncilSnapshot {
  pending: Array<[string, PendingCouncilDecision]>;
  lastTriggered: Array<[string, number]>;
  lastDecision: Array<[string, string]>;
  history: CouncilHistoryEntry[];
  automaticPlayers?: string[];
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
    id: 'border_alarm', maxYear: 1890, category: 'SICHERHEIT', title: 'Rauch an der Grenze',
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
    id: 'guild_petition', maxYear: 1750, category: 'HANDEL', title: 'Die Gilden erheben Anspruch',
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
    id: 'court_intrigue', maxYear: 1890, category: 'INTRIGE', title: 'Ein Komplott am Hof',
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
  },
  {
    id: 'bridge_collapse', category: 'INFRASTRUKTUR', title: 'Die Brücke ist eingestürzt',
    story: 'Der einzige Übergang über den Fluss ist zerstört. Händler und Bauern bitten dringend um Hilfe.',
    choices: [
      { id: 'rebuild', title: 'Neue Brücke errichten', description: 'Teuer, doch Handel und Ordnung erholen sich.',
        cost: { wood: 350, stone: 200, gold: 450 }, effect: { happiness: 6, stability: 4, prestige: 2 } },
      { id: 'ferry', title: 'Fährverkehr einrichten', description: 'Günstige Übergangslösung.',
        cost: { wood: 80, gold: 180 }, effect: { happiness: 2, stability: 1 } },
      { id: 'shortcut', title: 'Eine riskante Furt suchen', description: 'Die Abkürzung könnte den Handel retten.',
        cost: { food: 150 }, effect: { gold: 950, prestige: 2 },
        successChance: 0.58, failure: { happiness: -4, stability: -3 } }
    ]
  },
  {
    id: 'pilgrims', maxYear: 1750, category: 'GLAUBE', title: 'Pilger vor den Toren',
    story: 'Hunderte Reisende ersuchen Unterkunft. Die Geistlichkeit und Kaufleute sind uneins.',
    choices: [
      { id: 'welcome', title: 'Pilger aufnehmen', description: 'Versorge Gäste und gewinne Ansehen.',
        cost: { food: 380, gold: 180 }, effect: { happiness: 4, prestige: 3 } },
      { id: 'market', title: 'Pilgermarkt erlauben', description: 'Ein Fest bringt Einnahmen, aber auch Unruhe.',
        cost: { food: 150 }, effect: { gold: 650, stability: -2 } },
      { id: 'escort', title: 'Schutzgeleit stellen', description: 'Eine Eskorte kann Geschenke und Ruhm heimbringen.',
        cost: { gold: 300, iron: 30 }, effect: { gold: 850, prestige: 4 },
        successChance: 0.7, failure: { stability: -4, happiness: -2 } }
    ]
  },
  {
    id: 'miners_dispute', minYear: 1750, category: 'HANDWERK', title: 'Streit im Bergwerk',
    story: 'Bergleute verweigern die Arbeit. Sie fordern höhere Löhne und sichere Stollen.',
    choices: [
      { id: 'safety', title: 'Stollen sichern', description: 'Material und Gold schützen die Arbeitenden.',
        cost: { wood: 240, gold: 280 }, effect: { stability: 3, happiness: 5, iron: 140 } },
      { id: 'wages', title: 'Löhne erhöhen', description: 'Ein schneller Vergleich bewahrt den Frieden.',
        cost: { gold: 420 }, effect: { happiness: 4, stability: 2 } },
      { id: 'force', title: 'Die Arbeit erzwingen', description: 'Kostet wenig, doch Unruhe droht.',
        cost: {}, effect: { iron: 280, happiness: -8, stability: -5 } }
    ]
  },
  {
    id: 'merchant_caravan', maxYear: 1800, category: 'HANDEL', title: 'Eine fremde Karawane',
    story: 'Ein Händlerzug mit seltenen Waren bittet um Handelsrechte und Schutz.',
    choices: [
      { id: 'tariff', title: 'Zoll verlangen', description: 'Schnelle Einnahmen zulasten des Ansehens.',
        cost: {}, effect: { gold: 650, happiness: -2 } },
      { id: 'welcome_trade', title: 'Freien Handel gestatten', description: 'Offene Tore beleben die Stadt.',
        cost: { food: 250 }, effect: { gold: 480, happiness: 3, prestige: 1 } },
      { id: 'investment', title: 'In die Karawane investieren', description: 'Eine riskante Reise mit Aussicht auf reiche Gewinne.',
        cost: { gold: 500 }, effect: { gold: 1650, prestige: 2 },
        successChance: 0.55, failure: { happiness: -2, stability: -2 } }
    ]
  },
  {
    id: 'village_fire', category: 'NOTLAGE', title: 'Feuer im Dorf',
    story: 'Mehrere Höfe stehen in Flammen. Die Dorfbewohner warten auf die Hilfe der Krone.',
    choices: [
      { id: 'firefighters', title: 'Löschtrupps ausrüsten', description: 'Eine sofortige Hilfsaktion.',
        cost: { gold: 250, wood: 180 }, effect: { happiness: 6, stability: 3 } },
      { id: 'shelter_fire', title: 'Obdachlose unterbringen', description: 'Versorgung vor Wiederaufbau.',
        cost: { food: 300 }, effect: { happiness: 3, stability: 1 } },
      { id: 'fire_gamble', title: 'Wertvolle Vorräte bergen', description: 'Gefährlicher Einsatz mitten in den Flammen.',
        cost: { gold: 100 }, effect: { gold: 1000, prestige: 2 },
        successChance: 0.52, failure: { food: -350, happiness: -5 } }
    ]
  },
  {
    id: 'noble_wedding', maxYear: 1900, category: 'HOF', title: 'Eine Hochzeit am Hof',
    story: 'Zwei Adelsfamilien möchten mit einer großen Feier ihre Fehde beenden.',
    choices: [
      { id: 'sponsor', title: 'Die Feier ausrichten', description: 'Luxus kostet Geld, stärkt jedoch die politische Ordnung.',
        cost: { gold: 620, food: 200 }, effect: { prestige: 5, stability: 5, happiness: 2 } },
      { id: 'blessing', title: 'Einen schlichten Segen geben', description: 'Die Krone wahrt Abstand.',
        cost: { gold: 100 }, effect: { prestige: 1, stability: 1 } },
      { id: 'refuse', title: 'Eine Vermählung untersagen', description: 'Bewahre die Staatskasse, riskiere einen Aufruhr.',
        cost: {}, effect: { stability: -7, happiness: -3 } }
    ]
  },
  {
    id: "industrial_unrest", minYear: 1820, category: "ARBEIT", title: "Streik in den Manufakturen", story: "Arbeiter fordern Schutz und geregelte Arbeitszeiten. Die Betriebe drohen stillzustehen.",
    choices: [
      { id: "reform", title: "Arbeitsschutz einführen", description: "Arbeitsschutz einführen", cost: {"gold":500,"iron":50}, effect: {"happiness":6,"stability":3} },
      { id: "mediate", title: "Schlichter entsenden", description: "Schlichter entsenden", cost: {"gold":240}, effect: {"stability":2,"happiness":2} },
      { id: "crackdown", title: "Streik unterdrücken", description: "Streik unterdrücken", cost: {}, effect: {"gold":650,"stability":-6,"happiness":-7} }
    ]
  },
  {
    id: "railway_works", minYear: 1820, category: "INFRASTRUKTUR", title: "Die Eisenbahnlinie stockt", story: "Ein beschädigter Bahndamm bedroht Lieferungen und Versorgung.",
    choices: [
      { id: "repair", title: "Gleise und Brücke reparieren", description: "Gleise und Brücke reparieren", cost: {"iron":260,"stone":200,"gold":350}, effect: {"stability":4,"gold":500} },
      { id: "bypass", title: "Ersatztransporte organisieren", description: "Ersatztransporte organisieren", cost: {"food":180,"gold":220}, effect: {"happiness":2} },
      { id: "gamble", title: "Notbetrieb wagen", description: "Notbetrieb wagen", cost: {"gold":160}, effect: {"gold":1100,"prestige":2}, successChance: 0.56, failure: {"gold":-380,"stability":-4} }
    ]
  },
  {
    id: "postwar_housing", minYear: 1945, category: "WIEDERAUFBAU", title: "Wohnungen für Vertriebene", story: "Zerstörte Häuser und ankommende Familien führen zu Wohnungsnot.",
    choices: [
      { id: "build_homes", title: "Notwohnungen errichten", description: "Notwohnungen errichten", cost: {"wood":340,"stone":240,"gold":450}, effect: {"happiness":7,"stability":3} },
      { id: "shelter", title: "Gemeinschaftsunterkünfte einrichten", description: "Gemeinschaftsunterkünfte einrichten", cost: {"food":340,"gold":180}, effect: {"happiness":3} },
      { id: "private", title: "Private Bauträger beauftragen", description: "Private Bauträger beauftragen", cost: {"gold":400}, effect: {"happiness":6,"prestige":2}, successChance: 0.68, failure: {"stability":-3,"gold":-280} }
    ]
  },
  {
    id: "power_outage", minYear: 1970, category: "ENERGIE", title: "Großflächiger Stromausfall", story: "Ein Defekt unterbricht Unternehmen und Kliniken.",
    choices: [
      { id: "grid", title: "Stromnetz instand setzen", description: "Stromnetz instand setzen", cost: {"iron":250,"gold":620}, effect: {"stability":6,"happiness":4} },
      { id: "generators", title: "Notstrom bereitstellen", description: "Notstrom bereitstellen", cost: {"gold":390,"food":150}, effect: {"stability":3,"happiness":2} },
      { id: "risk", title: "Schnelle Wiedereinschaltung wagen", description: "Schnelle Wiedereinschaltung wagen", cost: {"gold":140}, effect: {"gold":550,"prestige":1}, successChance: 0.55, failure: {"stability":-7,"happiness":-4} }
    ]
  },
  {
    id: "cyber_incident", minYear: 2000, category: "DIGITALISIERUNG", title: "Angriff auf Verwaltungsnetze", story: "Unbekannte stören digitale Behörden und Zahlungsverkehr.",
    choices: [
      { id: "isolate", title: "Systeme isolieren und prüfen", description: "Systeme isolieren und prüfen", cost: {"gold":600,"iron":80}, effect: {"stability":7,"happiness":2} },
      { id: "response", title: "IT-Krisenstab einrichten", description: "IT-Krisenstab einrichten", cost: {"gold":350}, effect: {"stability":4} },
      { id: "shortcut", title: "Sicherheitswarnung ignorieren", description: "Sicherheitswarnung ignorieren", cost: {}, effect: {"gold":500,"stability":-9,"happiness":-5} }
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
  private automaticPlayers = new Set<string>();

  constructor(private readonly random: () => number = Math.random) {}

  public isAutomatic(playerId: string): boolean { return this.automaticPlayers.has(playerId); }

  public setAutomatic(playerId: string, enabled: boolean): void {
    if (enabled) this.automaticPlayers.add(playerId);
    else this.automaticPlayers.delete(playerId);
  }

  /** Only affordable choices; guaranteed outcomes first, then welfare and cost. */
  public resolveAutomatic(player: Player, year: number, month: number): CouncilHistoryEntry | null {
    if (!this.isAutomatic(player.id)) return null;
    const score = (choice: CouncilChoiceOffer): number => {
      const welfare = (effect: CouncilEffect): number => (effect.happiness ?? 0) * 4 +
        (effect.stability ?? 0) * 4 + (effect.prestige ?? 0) +
        RESOURCES.reduce((sum, key) => sum + (effect[key] ?? 0) / 100, 0);
      const probability = choice.probability ?? 1;
      return probability * welfare(choice.effect) + (1 - probability) * welfare(choice.failure ?? {}) -
        RESOURCES.reduce((sum, key) => sum + (choice.cost[key] ?? 0) / Math.max(1, player.kingdom.resources[key]), 0);
    };
    const choice = this.getChoices(player).filter(offer => offer.affordable).sort((a, b) =>
      (b.probability ?? 1) - (a.probability ?? 1) || score(b) - score(a))[0];
    return choice ? this.resolve(player, choice.id, year, month, undefined, true) : null;
  }

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
      if (decision.minYear !== undefined && year < decision.minYear) return false;
      if (decision.maxYear !== undefined && year > decision.maxYear) return false;
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

  /**
   * Stellt für die interaktive Tutorial-Kampagne eine feste, bedingungslose
   * Ratsangelegenheit zur Verfügung („Feuer im Dorf" – immer verfügbar,
   * ohne Zufall und ohne Cooldown). Liefert `null`, wenn der Rat bereits
   * eine Angelegenheit bearbeitet.
   * @param player Der Herrscher, für den der Rat einberufen wird.
   * @returns Die Tutorial-Entscheidung oder `null` bei bereits offenem Rat.
   */
  public issueForTutorial(player: Player): CouncilDecision | null {
    if (this.pending.has(player.id)) return null;
    const decision = COUNCIL_DECISIONS.find((entry) => entry.id === 'village_fire');
    if (!decision) return null;
    const tick = player.kingdom.currentYear * 12 + (player.kingdom.currentSeason === 'winter' ? 1 :
      player.kingdom.currentSeason === 'spring' ? 4 : player.kingdom.currentSeason === 'summer' ? 7 : 10);
    this.pending.set(player.id, { decisionId: decision.id, issuedAt: tick });
    this.lastTriggered.set(player.id, tick);
    this.lastDecision.set(player.id, decision.id);
    return decision;
  }

  public resolve(player: Player, choiceId: string, year: number, month: number, delegate?: { id: string; name: string }, automatic = false): CouncilHistoryEntry {
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
      ...(automatic ? { automatic: true } : {}),
      ...(delegate ? { delegatedCitizenId: delegate.id, delegatedCitizenName: delegate.name } : {}),
      date: String(month).padStart(2, '0') + '/' + year,
      message: (automatic ? 'Automatisch entschieden: ' : '') + (delegate ? delegate.name + ' übernimmt: ' : '') + decision.title + ': ' + choice.title + (choice.probability === null ? '.' :
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
      history: this.history.map((entry) => ({ ...entry })),
      automaticPlayers: [...this.automaticPlayers]
    };
  }

  public load(snapshot: CouncilSnapshot): void {
    if (!snapshot || !Array.isArray(snapshot.pending) || !Array.isArray(snapshot.lastTriggered) ||
        !Array.isArray(snapshot.lastDecision) || !Array.isArray(snapshot.history) ||
        (snapshot.automaticPlayers !== undefined && (!Array.isArray(snapshot.automaticPlayers) ||
          snapshot.automaticPlayers.some(id => typeof id !== 'string'))) ||
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
    this.automaticPlayers = new Set(snapshot.automaticPlayers ?? []);
  }
}
