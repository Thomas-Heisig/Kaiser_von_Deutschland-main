// src/core/Events.ts
import { Player } from './Player';
import { Kingdom } from './Kingdom';

export type EventType = 'natural' | 'military' | 'economic' | 'diplomatic' | 'social' | 'religious';
export type EventSeverity = 'minor' | 'moderate' | 'major' | 'catastrophic';
export type EventDuration = 'instant' | 'year' | 'multi-year';

export interface EventImpact {
  gold?: number;
  food?: number;
  wood?: number;
  stone?: number;
  iron?: number;
  happiness?: number;
  population?: Partial<Kingdom['population']>;
  military?: Partial<Kingdom['military']>;
  infrastructure?: Partial<Kingdom['infrastructure']>;
  stats?: Partial<Player['stats']>;
  prestige?: number;
  authority?: number;
  popularity?: number;
  corruption?: number;
  piety?: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  duration: EventDuration;
  title: string;
  description: string;
  probability: number; // 0-1
  conditions?: EventConditions;
  impact: EventImpact;
  choices?: EventChoice[];
  followUpEvents?: string[]; // IDs von Folgeereignissen
  expirationYear?: number;
}

export interface EventChoice {
  id: string;
  text: string;
  cost?: EventImpact; // Kosten der Wahl
  outcome: EventImpact; // Auswirkungen der Wahl
  nextEvent?: string; // ID des nächsten Events in der Kette
  requiredResources?: Partial<Kingdom['resources']>;
  requiredStats?: Partial<Player['stats']>;
}

export interface EventConditions {
  minYear?: number;
  maxYear?: number;
  requiredClimate?: Kingdom['climate'][];
  minHappiness?: number;
  maxHappiness?: number;
  minPrestige?: number;
  minAuthority?: number;
  minPiety?: number;
  requiredBuildings?: Partial<Record<keyof Kingdom['infrastructure'], number>>;
  requiredResources?: Partial<Kingdom['resources']>;
  playerGender?: Player['gender'][];
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface ActiveEvent extends GameEvent {
  startYear: number;
  affectedPlayerId?: string;
  choicesMade?: string[]; // IDs der getroffenen Entscheidungen
}

export class EventSystem {
  private events: Map<string, GameEvent> = new Map();
  private activeEvents: Map<string, ActiveEvent> = new Map();
  private eventHistory: ActiveEvent[] = [];
  private seasonalMultipliers: Record<string, Partial<Record<EventType, number>>> = {
    spring: { natural: 1.3, economic: 1.1, military: 1.0, diplomatic: 1.0, social: 1.0, religious: 1.0 },
    summer: { natural: 1.5, economic: 1.0, military: 1.2, diplomatic: 1.0, social: 1.1, religious: 1.0 },
    autumn: { natural: 1.0, economic: 1.3, military: 1.0, diplomatic: 1.1, social: 1.0, religious: 1.2 },
    winter: { natural: 1.8, economic: 0.8, military: 0.9, diplomatic: 1.0, social: 1.2, religious: 1.1 }
  };

  constructor() {
    this.initializeEvents();
  }

  private initializeEvents(): void {
    const allEvents: GameEvent[] = [
      // Naturereignisse
      {
        id: 'drought_mild',
        type: 'natural',
        severity: 'minor',
        duration: 'year',
        title: 'Leichte Dürre',
        description: 'Ein ungewöhnlich trockener Sommer hat die Ernte beeinträchtigt.',
        probability: 0.15,
        conditions: {
          requiredClimate: ['temperate', 'arid'],
          season: 'summer',
          minHappiness: 30
        },
        impact: {
          food: -300,
          happiness: -8,
          population: { peasants: -50 }
        }
      },
      {
        id: 'drought_severe',
        type: 'natural',
        severity: 'major',
        duration: 'multi-year',
        title: 'Schwere Dürre',
        description: 'Eine lang anhaltende Dürre bedroht das Königreich mit Hungersnot.',
        probability: 0.05,
        conditions: {
          requiredClimate: ['arid'],
          minYear: 5,
          season: 'summer'
        },
        impact: {
          food: -1500,
          happiness: -25,
          population: { peasants: -300, merchants: -50 }
        },
        choices: [
          {
            id: 'import_food',
            text: 'Nahrungsmittel importieren',
            cost: { gold: -3000 },
            outcome: { food: 1000, happiness: 5 },
            requiredResources: { gold: 3000 }
          },
          {
            id: 'pray_for_rain',
            text: 'Für Regen beten',
            cost: { gold: -500 },
            outcome: { piety: 10, happiness: -5 },
            requiredStats: { piety: 30 }
          },
          {
            id: 'ration_food',
            text: 'Rationierung einführen',
            outcome: { happiness: -15, authority: 5 }
          }
        ]
      },
      {
        id: 'bountiful_harvest',
        type: 'economic',
        severity: 'moderate',
        duration: 'instant',
        title: 'Üppige Ernte',
        description: 'Perfekte Wetterbedingungen führen zu einer Rekordernte.',
        probability: 0.1,
        conditions: {
          requiredClimate: ['temperate'],
          minHappiness: 50,
          season: 'autumn',
          requiredBuildings: { farms: 3 }
        },
        impact: {
          food: 2000,
          happiness: 15,
          gold: 500
        }
      },
      {
        id: 'plague_outbreak',
        type: 'natural',
        severity: 'catastrophic',
        duration: 'multi-year',
        title: 'Pestausbruch',
        description: 'Eine schwere Seuche breitet sich im Königreich aus.',
        probability: 0.03,
        conditions: {
          minYear: 3,
          maxHappiness: 60,
          requiredBuildings: { hospitals: 0 }
        },
        impact: {
          population: { 
            peasants: -800,
            nobles: -20,
            merchants: -100,
            clergy: -30
          },
          happiness: -40,
          gold: -1000
        },
        choices: [
          {
            id: 'build_hospitals',
            text: 'Hospitäler bauen lassen',
            cost: { gold: -5000 },
            outcome: { 
              infrastructure: { hospitals: 2 },
              population: { peasants: 200 },
              happiness: 10
            },
            requiredResources: { gold: 5000, wood: 1000 }
          },
          {
            id: 'quarantine',
            text: 'Quarantäne verhängen',
            outcome: { 
              happiness: -20,
              authority: 15,
              population: { peasants: -400 }
            }
          },
          {
            id: 'pray_for_healing',
            text: 'Heilung erflehen',
            cost: { gold: -2000 },
            outcome: { 
              piety: 25,
              population: { peasants: -200 },
              happiness: 5
            }
          }
        ]
      },

      // Militärische Ereignisse
      {
        id: 'bandit_raid',
        type: 'military',
        severity: 'minor',
        duration: 'instant',
        title: 'Banditenüberfall',
        description: 'Eine Bande von Gesetzlosen überfällt abgelegene Dörfer.',
        probability: 0.12,
        conditions: {
          maxHappiness: 70,
          requiredBuildings: { barracks: 0 }
        },
        impact: {
          gold: -500,
          food: -200,
          happiness: -10
        },
        choices: [
          {
            id: 'send_guards',
            text: 'Wachen entsenden',
            cost: { gold: -300 },
            outcome: { authority: 5, happiness: 5 }
          },
          {
            id: 'ignore_raid',
            text: 'Ignorieren',
            outcome: { popularity: -10, happiness: -15 }
          }
        ]
      },
      {
        id: 'foreign_invasion',
        type: 'military',
        severity: 'major',
        duration: 'year',
        title: 'Fremde Invasion',
        description: 'Eine benachbarte Macht marschiert in Ihr Königreich ein.',
        probability: 0.04,
        conditions: {
          minYear: 10,
          minPrestige: 50,
          requiredBuildings: { barracks: 2 }
        },
        impact: {
          military: { infantry: -100, morale: -20 },
          food: -1000,
          gold: -2000,
          happiness: -30
        },
        choices: [
          {
            id: 'fight_back',
            text: 'Zurückschlagen',
            cost: { gold: -5000 },
            outcome: { 
              prestige: 20,
              authority: 15,
              military: { infantry: -300 }
            },
            requiredResources: { gold: 5000 },
            requiredStats: { authority: 40 }
          },
          {
            id: 'negotiate',
            text: 'Verhandeln',
            cost: { gold: -3000, food: -500 },
            outcome: { 
              prestige: -10,
              gold: -2000,
              happiness: 5
            }
          },
          {
            id: 'surrender',
            text: 'Kapitulieren',
            outcome: { 
              prestige: -30,
              authority: -20,
              happiness: -40
            }
          }
        ]
      },

      // Wirtschaftliche Ereignisse
      {
        id: 'trade_boom',
        type: 'economic',
        severity: 'moderate',
        duration: 'year',
        title: 'Handelsboom',
        description: 'Neue Handelsrouten bringen Wohlstand ins Königreich.',
        probability: 0.08,
        conditions: {
          requiredBuildings: { markets: 2, roads: 1 },
          minHappiness: 60
        },
        impact: {
          gold: 3000,
          happiness: 10,
          popularity: 5
        }
      },
      {
        id: 'market_crash',
        type: 'economic',
        severity: 'major',
        duration: 'multi-year',
        title: 'Markteinbruch',
        description: 'Ein plötzlicher Einbruch der Märkte führt zu wirtschaftlichen Problemen.',
        probability: 0.06,
        conditions: {
          minYear: 8,
          requiredBuildings: { markets: 3 }
        },
        impact: {
          gold: -4000,
          happiness: -20,
          popularity: -15
        },
        choices: [
          {
            id: 'bailout',
            text: 'Händler unterstützen',
            cost: { gold: -2000 },
            outcome: { popularity: 20, gold: -1000 }
          },
          {
            id: 'let_fail',
            text: 'Dem Markt freien Lauf lassen',
            outcome: { authority: 10, happiness: -30 }
          }
        ]
      },

      // Diplomatische Ereignisse
      {
        id: 'royal_marriage',
        type: 'diplomatic',
        severity: 'moderate',
        duration: 'instant',
        title: 'Königliche Hochzeit',
        description: 'Ein benachbartes Königreich schlägt eine königliche Hochzeit vor.',
        probability: 0.07,
        conditions: {
          minPrestige: 30,
          minYear: 3
        },
        impact: {
          prestige: 15,
          gold: 1000
        },
        choices: [
          {
            id: 'accept_marriage',
            text: 'Hochzeit akzeptieren',
            outcome: { 
              prestige: 25,
              gold: 5000,
              happiness: 10
            }
          },
          {
            id: 'decline_politely',
            text: 'Höflich ablehnen',
            outcome: { 
              prestige: -5,
              authority: 5
            }
          },
          {
            id: 'demand_concessions',
            text: 'Zugeständnisse fordern',
            outcome: { 
              authority: 10,
              gold: 2000,
              prestige: -10
            }
          }
        ]
      },

      // Soziale Ereignisse
      {
        id: 'peasant_revolt',
        type: 'social',
        severity: 'major',
        duration: 'year',
        title: 'Bauernaufstand',
        description: 'Unzufriedene Bauern erheben sich gegen die Obrigkeit.',
        probability: 0.05,
        conditions: {
          maxHappiness: 40,
          minYear: 5
        },
        impact: {
          happiness: -35,
          food: -800,
          gold: -1500,
          population: { peasants: -500 }
        },
        choices: [
          {
            id: 'crush_revolt',
            text: 'Aufstand niederschlagen',
            cost: { gold: -1000 },
            outcome: { 
              authority: 20,
              popularity: -25,
              military: { infantry: -100 },
              happiness: -20
            }
          },
          {
            id: 'negotiate_terms',
            text: 'Verhandlungen aufnehmen',
            outcome: { 
              popularity: 15,
              authority: -10,
              gold: -2000,
              happiness: 10
            }
          },
          {
            id: 'tax_relief',
            text: 'Steuern senken',
            outcome: { 
              popularity: 30,
              gold: -3000,
              happiness: 20
            }
          }
        ]
      },

      // Religiöse Ereignisse
      {
        id: 'divine_favor',
        type: 'religious',
        severity: 'moderate',
        duration: 'year',
        title: 'Göttliche Gunst',
        description: 'Die Götter scheinen Ihrem Königreich gewogen zu sein.',
        probability: 0.09,
        conditions: {
          minPiety: 40,
          requiredBuildings: { churches: 1 }
        },
        impact: {
          piety: 20,
          happiness: 15,
          gold: 1000
        }
      }
    ];

    // Events in Map speichern
    allEvents.forEach(event => this.events.set(event.id, event));

    // Folgeereignisse
    const followUpEvents: GameEvent[] = [
      {
        id: 'victory_celebration',
        type: 'social',
        severity: 'minor',
        duration: 'instant',
        title: 'Siegesfeier',
        description: 'Das Volk feiert den Sieg über die Invasoren.',
        probability: 1.0,
        impact: {
          happiness: 25,
          popularity: 15,
          gold: 1000
        }
      },
      {
        id: 'war_weariness',
        type: 'social',
        severity: 'moderate',
        duration: 'year',
        title: 'Kriegsmüdigkeit',
        description: 'Das Volk ist des langen Krieges überdrüssig.',
        probability: 1.0,
        impact: {
          happiness: -20,
          popularity: -10,
          military: { morale: -15 }
        }
      }
    ];

    followUpEvents.forEach(event => this.events.set(event.id, event));
  }

  /**
   * Prüft, ob ein Event basierend auf Bedingungen ausgelöst werden kann
   */
  private checkEventConditions(event: GameEvent, player: Player, currentYear: number, season?: string): boolean {
    if (!event.conditions) return true;

    const conditions = event.conditions;
    const kingdom = player.kingdom;

    // Jahresbedingungen
    if (conditions.minYear && currentYear < conditions.minYear) return false;
    if (conditions.maxYear && currentYear > conditions.maxYear) return false;

    // Klimabedingungen
    if (conditions.requiredClimate && 
        !conditions.requiredClimate.includes(kingdom.climate)) return false;

    // Zufriedenheit
    if (conditions.minHappiness && kingdom.happiness < conditions.minHappiness) return false;
    if (conditions.maxHappiness && kingdom.happiness > conditions.maxHappiness) return false;

    // Spielerstatistiken
    if (conditions.minPrestige && player.stats.prestige < conditions.minPrestige) return false;
    if (conditions.minAuthority && player.stats.authority < conditions.minAuthority) return false;

    // Gebäude
    if (conditions.requiredBuildings) {
      for (const [building, minCount] of Object.entries(conditions.requiredBuildings)) {
        const count = kingdom.infrastructure[building as keyof Kingdom['infrastructure']];
        if (count < minCount) return false;
      }
    }

    // Ressourcen
    if (conditions.requiredResources) {
      for (const [resource, minAmount] of Object.entries(conditions.requiredResources)) {
        const amount = kingdom.resources[resource as keyof Kingdom['resources']];
        if (amount < minAmount) return false;
      }
    }

    // Spielergeschlecht
    if (conditions.playerGender && 
        !conditions.playerGender.includes(player.gender)) return false;

    // Jahreszeit
    if (conditions.season && season !== conditions.season) return false;

    return true;
  }

  /**
   * Ermittelt verfügbare Events basierend auf aktueller Situation
   */
  private getAvailableEvents(player: Player, currentYear: number, season?: string): GameEvent[] {
    const availableEvents: GameEvent[] = [];

    for (const event of this.events.values()) {
      // Prüfe, ob Event schon aktiv ist
      if (this.activeEvents.has(event.id)) continue;

      // Prüfe Bedingungen
      if (this.checkEventConditions(event, player, currentYear, season)) {
        // Berücksichtige saisonale Wahrscheinlichkeitsmultiplikatoren
        let probability = event.probability;
        if (season && this.seasonalMultipliers[season as keyof typeof this.seasonalMultipliers]) {
          const multiplier = this.seasonalMultipliers[season as keyof typeof this.seasonalMultipliers][event.type] || 1;
          probability *= multiplier;
        }

        // Schwierigkeitsgrad Modifikator
        probability *= (1 + (player.kingdom.difficulty - 1) * 0.1);

        // Zufallsprüfung
        if (Math.random() < probability) {
          availableEvents.push(event);
        }
      }
    }

    return availableEvents;
  }

  /**
   * Holt ein zufälliges Event für einen Spieler
   */
  public async getRandomEvent(player: Player, currentYear: number, season?: string): Promise<GameEvent | null> {
    const availableEvents = this.getAvailableEvents(player, currentYear, season);
    
    if (availableEvents.length === 0) return null;

    // Gewichte Events nach Schweregrad
    const weights: Record<EventSeverity, number> = {
      minor: 0.4,
      moderate: 0.3,
      major: 0.2,
      catastrophic: 0.1
    };

    const weightedEvents = availableEvents.flatMap(event => 
      Array(Math.ceil(weights[event.severity] * 100)).fill(event)
    );

    const randomEvent = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
    
    if (randomEvent) {
      const activeEvent: ActiveEvent = {
        ...randomEvent,
        startYear: currentYear,
        affectedPlayerId: player.id
      };

      this.activeEvents.set(randomEvent.id, activeEvent);
      
      if (randomEvent.duration === 'instant') {
        await this.applyEvent(randomEvent, player, null);
        this.activeEvents.delete(randomEvent.id);
      }
    }

    return randomEvent || null;
  }

  /**
   * Wendet die Auswirkungen eines Events an
   */
  public async applyEvent(event: GameEvent, player: Player, choiceId: string | null): Promise<void> {
    const kingdom = player.kingdom;
    let impact: EventImpact = { ...event.impact };

    // Falls eine Wahl getroffen wurde, deren Auswirkungen anwenden
    if (choiceId && event.choices) {
      const choice = event.choices.find(c => c.id === choiceId);
      if (choice) {
        // Kosten der Wahl anwenden
        if (choice.cost) {
          this.applyImpact(kingdom, player, choice.cost);
        }

        // Auswirkungen der Wahl anwenden
        impact = { ...impact, ...choice.outcome };

        // Aktiven Event aktualisieren
        const activeEvent = this.activeEvents.get(event.id);
        if (activeEvent) {
          activeEvent.choicesMade = [...(activeEvent.choicesMade || []), choiceId];
          this.activeEvents.set(event.id, activeEvent);
        }

        // Folgeevent auslösen
        if (choice.nextEvent) {
          const followUpEvent = this.events.get(choice.nextEvent);
          if (followUpEvent) {
            setTimeout(() => {
              this.getRandomEvent(player, player.kingdom.currentYear || 1);
            }, 1000);
          }
        }
      }
    }

    // Hauptauswirkungen anwenden
    this.applyImpact(kingdom, player, impact);

    // Event zur Historie hinzufügen
    const activeEvent = this.activeEvents.get(event.id);
    if (activeEvent) {
      this.eventHistory.push(activeEvent);
    }
  }

  /**
   * Wendet Event-Auswirkungen auf Königreich und Spieler an
   */
  private applyImpact(kingdom: Kingdom, player: Player, impact: EventImpact): void {
    // Ressourcen
    if (impact.gold) kingdom.resources.gold = Math.max(0, kingdom.resources.gold + impact.gold);
    if (impact.food) kingdom.resources.food = Math.max(0, kingdom.resources.food + impact.food);
    if (impact.wood) kingdom.resources.wood = Math.max(0, kingdom.resources.wood + impact.wood);
    if (impact.stone) kingdom.resources.stone = Math.max(0, kingdom.resources.stone + impact.stone);
    if (impact.iron) kingdom.resources.iron = Math.max(0, kingdom.resources.iron + impact.iron);

    // Zufriedenheit
    if (impact.happiness) {
      kingdom.happiness = Math.max(0, Math.min(100, kingdom.happiness + impact.happiness));
    }

    // Bevölkerung
    if (impact.population) {
      Object.entries(impact.population).forEach(([key, value]) => {
        const populationKey = key as keyof Kingdom['population'];
        const currentValue = kingdom.population[populationKey] ?? 0;
        kingdom.population[populationKey] = Math.max(0, currentValue + (value || 0));
      });
    }

    // Militär
    if (impact.military) {
      Object.entries(impact.military).forEach(([key, value]) => {
        const militaryKey = key as keyof Kingdom['military'];
        if (militaryKey === 'morale') {
          kingdom.military[militaryKey] = Math.max(0, Math.min(100, 
            kingdom.military[militaryKey] + (value || 0)));
        } else {
          kingdom.military[militaryKey] = Math.max(0, 
            kingdom.military[militaryKey] + (value || 0));
        }
      });
    }

    // Infrastruktur
    if (impact.infrastructure) {
      Object.entries(impact.infrastructure).forEach(([key, value]) => {
        const infraKey = key as keyof Kingdom['infrastructure'];
        kingdom.infrastructure[infraKey] = Math.max(0, 
          kingdom.infrastructure[infraKey] + (value || 0));
      });
    }

    // Spielerstatistiken
    if (impact.prestige) player.stats.prestige += impact.prestige;
    if (impact.authority) player.stats.authority += impact.authority;
    if (impact.popularity) player.stats.popularity += impact.popularity;
    if (impact.corruption) player.stats.corruption += impact.corruption;
    if (impact.piety) player.stats.piety += impact.piety;

    // Allgemeine Stats
    if (impact.stats) {
      Object.entries(impact.stats).forEach(([key, value]) => {
        const statKey = key as keyof Player['stats'];
        player.stats[statKey] = Math.max(0, Math.min(100, 
          player.stats[statKey] + (value || 0)));
      });
    }
  }

  /**
   * Aktualisiert laufende Events
   */
  public async updateActiveEvents(currentYear: number): Promise<void> {
    const expiredEvents: string[] = [];

    for (const [eventId, activeEvent] of this.activeEvents) {
      const event = this.events.get(eventId);
      if (!event) continue;

      // Prüfe auf Ablauf
      if (event.duration === 'year' && currentYear > activeEvent.startYear) {
        expiredEvents.push(eventId);
      } else if (event.expirationYear && currentYear > event.expirationYear) {
        expiredEvents.push(eventId);
      }
    }

    // Abgelaufene Events entfernen
    expiredEvents.forEach(eventId => this.activeEvents.delete(eventId));
  }

  /**
   * Gibt aktive Events zurück
   */
  public getActiveEvents(): ActiveEvent[] {
    return Array.from(this.activeEvents.values());
  }

  /**
   * Gibt Event-Historie zurück
   */
  public getEventHistory(): ActiveEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Gibt ein spezifisches Event zurück
   */
  public getEvent(eventId: string): GameEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Holt verfügbare Entscheidungen für ein aktives Event
   */
  public getAvailableChoices(eventId: string, player: Player): EventChoice[] {
    const event = this.events.get(eventId);
    if (!event || !event.choices) return [];

    return event.choices.filter(choice => {
      // Prüfe benötigte Ressourcen
      if (choice.requiredResources) {
        for (const [resource, requiredAmount] of Object.entries(choice.requiredResources)) {
          const amount = player.kingdom.resources[resource as keyof Kingdom['resources']];
          if (amount < requiredAmount) return false;
        }
      }

      // Prüfe benötigte Statistiken
      if (choice.requiredStats) {
        for (const [stat, requiredValue] of Object.entries(choice.requiredStats)) {
          const value = player.stats[stat as keyof Player['stats']];
          if (value < requiredValue) return false;
        }
      }

      return true;
    });
  }

  /**
   * Erstellt ein benutzerdefiniertes Event
   */
  public createCustomEvent(eventData: Partial<GameEvent> & { id: string; title: string; }): string {
    const event: GameEvent = {
      id: eventData.id,
      type: eventData.type || 'economic',
      severity: eventData.severity || 'moderate',
      duration: eventData.duration || 'instant',
      title: eventData.title,
      description: eventData.description || '',
      probability: eventData.probability || 0.1,
      conditions: eventData.conditions,
      impact: eventData.impact || {},
      choices: eventData.choices,
      followUpEvents: eventData.followUpEvents
    };

    this.events.set(event.id, event);
    return event.id;
  }

  /**
   * Bereinigt alte Event-Historie
   */
  public cleanupHistory(maxHistorySize: number = 100): void {
    if (this.eventHistory.length > maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-maxHistorySize);
    }
  }
}