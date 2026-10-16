import {
  CampaignGoal, CharacterAction, GameEngine, GameState, MarketResource, SaveMeta
} from '../core/GameEngine';
import {
  BattleReport, CampaignWarfareSystem, MIN_CAMPAIGN_SOLDIERS, RivalRealm
} from '../core/CampaignWarfareSystem';
import type { Citizen, CitizenSkills, Profession } from '../core/CitizenSystem';
import { KingdomInfrastructure } from '../core/Kingdom';
import { Player } from '../core/Player';
import type { KingdomMap } from './KingdomMap';
import { GameAudio } from './GameAudio';
import { GameAmbience, Soundscape } from './GameAmbience';

type View = 'council' | 'overview' | 'build' | 'economy' | 'research' | 'military' | 'war' | 'character' | 'chronicle' | 'help';
interface JournalEntry { date: string; message: string }
interface StructureInfo { name: string; description: string; symbol: string }
interface NewPlayer { name: string; kingdomName: string }

const MAX_PLAYERS = 4;
const DEFAULT_PLAYERS: ReadonlyArray<NewPlayer> = [
  { name: 'Heinrich', kingdomName: 'Mittelreich' }, { name: 'Mathilde', kingdomName: 'Westmark' },
  { name: 'Konrad', kingdomName: 'Schwabenland' }, { name: 'Adelheid', kingdomName: 'Sachsenau' }
];
const PROFESSIONS: Partial<Record<Profession, string>> = {
  farmer: 'Bauer', artisan: 'Handwerker', merchant: 'Händler', soldier: 'Soldat', scholar: 'Gelehrter',
  clergy: 'Geistlicher', noble: 'Adeliger', servant: 'Diener', laborer: 'Arbeiter', miner: 'Bergmann',
  fisherman: 'Fischer', blacksmith: 'Schmied', carpenter: 'Zimmermann', weaver: 'Weber', baker: 'Bäcker',
  brewer: 'Brauer', unemployed: 'Ohne Arbeit'
};
const CLASSES: Record<Citizen['socialClass'], string> = {
  royal: 'Königlich', noble: 'Adel', middle: 'Bürgertum', peasant: 'Bauernstand'
};
const SKILLS: ReadonlyArray<[keyof CitizenSkills, string]> = [
  ['leadership', 'Führung'], ['combat', 'Kampf'], ['literacy', 'Bildung'], ['trading', 'Handel'],
  ['diplomacy', 'Diplomatie'], ['craftsmanship', 'Handwerk']
];
const CHARACTER_ACTIONS: ReadonlyArray<[CharacterAction, string, string]> = [
  ['work', 'Arbeiten', 'Verdient Gold für das eigene Vermögen und steigert die Berufserfahrung.'],
  ['study', 'Studieren', 'Bildung und Führung steigen, die Alphabetisierung im Reich wächst leicht.'],
  ['train', 'Waffenübung', 'Kampf und Führung steigen; die Garnison wird besser ausgebildet.'],
  ['serve', 'Dem Reich dienen', 'Stiftet die Hälfte des Vermögens der Schatzkammer, bringt Ansehen und Prestige.']
];

const STRUCTURES: Record<keyof KingdomInfrastructure, StructureInfo> = {
  farms: { name: 'Bauernhof', description: 'Mehr Nahrung und Arbeit für 250 Menschen.', symbol: '♧' },
  markets: { name: 'Marktplatz', description: 'Handelseinnahmen, höhere Steuerbasis und Zufriedenheit.', symbol: '⚖' },
  churches: { name: 'Kirche', description: 'Stärkt Zufriedenheit und Stabilität.', symbol: '♱' },
  barracks: { name: 'Kaserne', description: 'Verbessert Ausbildung und ermöglicht eine starke Garnison.', symbol: '⚑' },
  mines: { name: 'Bergwerk', description: 'Fördert Stein und Eisen; schafft 80 Arbeitsplätze.', symbol: '◆' },
  roads: { name: 'Straße', description: 'Verbessert Steuerverwaltung, Handel und Nahrungsproduktion.', symbol: '↝' },
  schools: { name: 'Schule', description: 'Erhöht Bildung und Technologie.', symbol: '▤' },
  hospitals: { name: 'Hospital', description: 'Steigert die Zufriedenheit, benötigt laufenden Unterhalt.', symbol: '✚' },
  ports: { name: 'Hafen', description: 'Zusätzliche Handelseinnahmen und Handelsmacht.', symbol: '⚓' },
  walls: { name: 'Stadtmauer', description: 'Erhöht die Stabilität des Reiches.', symbol: '▥' },
  castles: { name: 'Burg', description: 'Befestigt den Herrschaftssitz und erhöht den Reichswert.', symbol: '♜' },
  universities: { name: 'Universität', description: 'Starker Bildungs- und Technologiebonus.', symbol: '▦' },
  guildhalls: { name: 'Gildenhaus', description: 'Stärkt die Handelsmacht.', symbol: '◇' },
  taverns: { name: 'Taverne', description: 'Erhöht die Zufriedenheit um 6 Punkte.', symbol: '♧' },
  warehouses: { name: 'Lagerhaus', description: 'Erweitert die Infrastruktur und den Reichswert.', symbol: '▣' },
  workshops: { name: 'Werkstatt', description: 'Mehr Holz und Eisen; Arbeit für 60 Menschen.', symbol: '⚒' }
};
const RESOURCE_NAMES: Record<MarketResource | 'gold', string> = {
  gold: 'Gold', food: 'Nahrung', wood: 'Holz', stone: 'Stein', iron: 'Eisen'
};
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const NUMBER = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const format = (value: number): string => NUMBER.format(value);
const escape = (value: string): string =>
  value.replace(/[&<>"']/g, (character: string) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character] ?? character));

/**
 * Accessible game shell over the existing simulation engine.
 * UI actions never maintain a separate economic or calendar state.
 */
export class KingdomGameUI {
  private engine?: GameEngine;
  private player?: Player;
  private map?: KingdomMap;
  private view: View = 'overview';
  private selected: keyof KingdomInfrastructure = 'farms';
  private busy: boolean = false;
  private saves: SaveMeta[] = [];
  private journal: JournalEntry[] = [];
  private subscriptions: Array<() => void> = [];
  private readonly audio: GameAudio;
  private readonly ambience = new GameAmbience();
  private motionEnabled = false;
  private readonly buttonSoundHandler = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (button && !button.hasAttribute('data-audio-toggle')) this.audio.playEffect('click');
  };
  private readonly keyboardHandler = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLElement &&
        (event.target.matches('input, select, textarea, button') || event.target.isContentEditable)) return;
    if (this.root.querySelector('.handover')) return;
    if (event.code === 'Space' && this.player && !this.engine?.isHotseat()) {
      event.preventDefault();
      void this.run((): void => this.togglePause());
    }
    if (event.key === 'Escape' && this.player && !this.engine?.isHotseat()) this.engine?.pauseGame();
  };

  /**
   * Mounts the start menu.
   * @param root Application root.
   */
  public constructor(private readonly root: HTMLElement) {
    this.audio = new GameAudio((error: unknown): void => {
      console.error('Audio konnte nicht abgespielt werden:', error);
      this.notify('Audio konnte nicht abgespielt werden. Prüfe die Browser-Audioeinstellungen.', true);
    });
    this.root.addEventListener('click', this.buttonSoundHandler);
    this.showMenu();
    document.addEventListener('keydown', this.keyboardHandler);
  }

  private showMenu(): void {
    this.root.innerHTML = `
      <main class="welcome">
        <div class="welcome-art" aria-hidden="true">
          <div class="seal">♜</div><div class="horizon"></div>
          <p>Ein Land. Deine Entscheidungen.<br>Eine Geschichte, die du schreibst.</p>
        </div>
        <section class="welcome-content" aria-labelledby="game-title">
          <p class="eyebrow">DIE KÖNIGREICHSSIMULATION</p>
          <h1 id="game-title">Kaiser von<br><em>Deutschland</em></h1>
          <p class="lead">Aus einem kleinen Lehen wird ein blühendes Reich.
            Sorge für dein Volk, lenke den Handel und baue deine Herrschaft auf.</p>
          <div class="scenario"><span class="scenario-icon">♜</span><div>
            <strong>Ein neuer Anfang · 1200</strong>
            <p>Freie mittelalterliche Aufbaukampagne. Alternative Geschichte, keine historische Landkarte.</p>
          </div></div>
          <div class="audio-controls" aria-label="Audioeinstellungen">
            <button type="button" class="secondary" data-audio-toggle="music" aria-pressed="false">♫ Musik: Aus</button>
            <button type="button" class="secondary" data-audio-toggle="effects" aria-pressed="true">🔊 Effekte: An</button>
            <button type="button" class="secondary" data-audio-toggle="ambience" aria-pressed="false">🌿 Umgebung: Aus</button>
          </div>
          <form id="new-game">
            <label>Spieler an diesem Gerät<select name="players" id="player-count">
              <option value="1" selected>1 – Einzelspieler-Kampagne</option>
              <option value="2">2 – Hotseat (abwechselnd)</option>
              <option value="3">3 – Hotseat (abwechselnd)</option>
              <option value="4">4 – Hotseat (abwechselnd)</option>
            </select></label>
            ${DEFAULT_PLAYERS.map((preset: NewPlayer, index: number): string => `
              <fieldset class="player-fields" data-player="${index}" ${index > 0 ? 'hidden disabled' : ''}>
                <legend>${index === 0 ? 'Erster Herrscher' : `Herrscher ${index + 1}`}</legend>
                <div class="form-grid">
                  <label>${index === 0 ? 'Dein Name' : 'Name'}<input name="ruler-${index}" id="${index === 0 ? 'ruler' : `ruler-${index}`}"
                    value="${preset.name}" maxlength="40" required autocomplete="off"></label>
                  <label>Name des Reiches<input name="realm-${index}" id="${index === 0 ? 'realm' : `realm-${index}`}"
                    value="${preset.kingdomName}" maxlength="40" required autocomplete="off"></label>
                </div>
              </fieldset>`).join('')}
            <label>Schwierigkeit<select name="difficulty" id="difficulty">
              <option value="1">Entspannt – mehr Startressourcen</option>
              <option value="2" selected>Ausgewogen – vorausschauend regieren</option>
              <option value="3">Anspruchsvoll – knappe Reserven</option>
            </select></label>
            <label class="checkbox"><input type="checkbox" name="events" checked> Zufällige Ereignisse zulassen</label>
            <button type="submit" class="primary wide">Herrschaft beginnen <span>→</span></button>
          </form>
          <div class="continue-row"><button id="continue" class="secondary">Spielstand fortsetzen</button>
            <span>Lokaler Spielstand im Browser</span></div>
          <p class="menu-note">Startet pausiert · Ohne Anmeldung · Hotseat: alle Spieler an einem Gerät, Zug um Zug</p>
          <p id="notice" role="status" aria-live="polite"></p>
        </section>
      </main>`;
    this.bindAudioControls();
    const playerCount = this.root.querySelector<HTMLSelectElement>('#player-count');
    playerCount?.addEventListener('change', (): void => {
      const count = Number(playerCount.value);
      this.root.querySelectorAll<HTMLFieldSetElement>('.player-fields').forEach((fieldset: HTMLFieldSetElement): void => {
        const visible = Number(fieldset.dataset.player) < count;
        fieldset.hidden = !visible;
        fieldset.disabled = !visible;
      });
    });
    this.root.querySelector<HTMLFormElement>('#new-game')?.addEventListener('submit', (event: SubmitEvent): void => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;
      const data = new FormData(form);
      void this.run(async (): Promise<void> => {
        const count = Math.max(1, Math.min(MAX_PLAYERS, Number(data.get('players')) || 1));
        const players: NewPlayer[] = [];
        for (let index = 0; index < count; index++) {
          const name = String(data.get(`ruler-${index}`) ?? '').trim();
          const kingdomName = String(data.get(`realm-${index}`) ?? '').trim();
          if (!name || !kingdomName) throw new Error('Bitte für jeden Spieler Namen und Reich ausfüllen.');
          players.push({ name, kingdomName });
        }
        if (new Set(players.map((entry: NewPlayer): string => entry.kingdomName.toLowerCase())).size !== players.length) {
          throw new Error('Jedes Reich braucht einen eigenen Namen.');
        }
        await this.createGame(players, Number(data.get('difficulty')), data.has('events'));
      });
    });
    this.root.querySelector('#continue')?.addEventListener('click', (): void => {
      void this.run(async (): Promise<void> => {
        await this.replaceEngine(new GameEngine({ enableWiki: false }));
        if (!this.engine) return;
        this.saves = await this.engine.listSaves();
        if (!this.saves.length) throw new Error('Noch kein Spielstand vorhanden. Beginne eine neue Herrschaft.');
        await this.engine.loadGame(this.saves[0].slot);
        this.player = this.engine.getActivePlayer();
        this.journal = [];
        await this.showGame();
        this.notify(this.engine.isHotseat()
          ? `Spielstand geladen. ${this.player.name} ist am Zug.` : 'Spielstand geladen. Die Zeit ist pausiert.');
      });
    });
  }

  private async replaceEngine(engine: GameEngine): Promise<void> {
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions = [];
    this.engine?.dispose();
    this.map?.dispose();
    this.map = undefined;
    this.engine = engine;
    this.player = undefined;
  }

  private async createGame(players: NewPlayer[], difficulty: number, randomEvents: boolean): Promise<void> {
    await this.replaceEngine(new GameEngine({
      startingYear: 1200, difficulty, gameSpeed: 0.25, randomEvents, enableWiki: false
    }));
    const engine = this.requireEngine();
    for (const entry of players) {
      engine.addPlayer({
        name: entry.name, kingdomName: entry.kingdomName, gender: 'other', difficulty, startingStats: { age: 25 }
      });
    }
    await engine.startGame();
    engine.pauseGame();
    this.player = engine.getActivePlayer();
    this.journal = [];
    this.record(engine.isHotseat()
      ? `${players.length} Herrscher teilen sich das Land. ${this.player.name} beginnt.`
      : 'Deine Herrschaft beginnt. Sichere zuerst Nahrung und Einnahmen.');
    this.audio.playEffect('success');
    this.saves = await engine.listSaves();
    await this.showGame();
  }

  private async showGame(): Promise<void> {
    const engine = this.requireEngine();
    this.view = 'overview';
    this.root.innerHTML = `
      <div class="kingdom-app">
        <header class="topbar">
          <a href="#" class="brand" aria-label="Zur Reichsübersicht"><span class="brand-seal">♜</span>
            <span>KAISER<small>VON DEUTSCHLAND</small></span></a>
          <div class="realm-heading"><strong id="realm-name"></strong><span id="ruler-name"></span></div>
          <div class="header-actions">
            <button type="button" class="secondary" data-audio-toggle="music" aria-pressed="false">♫ Musik: Aus</button>
            <button type="button" class="secondary" data-audio-toggle="effects" aria-pressed="true">🔊 Effekte: An</button>
            <button type="button" id="motion-toggle" class="secondary" aria-pressed="false">✨ Animation: Aus</button>
            <button data-action="save" class="secondary">Speichern</button>
            <button data-action="load" class="secondary">Laden</button></div>
        </header>
        <section class="resource-bar" aria-label="Ressourcen und monatliche Änderung">
          ${(['gold', 'food', 'wood', 'stone', 'iron'] as const).map((key: MarketResource | 'gold') => `
            <div class="resource"><span class="resource-symbol" aria-hidden="true">${
              { gold: '◈', food: '♧', wood: '♠', stone: '◆', iron: '⬡' }[key]}</span>
              <div><span>${RESOURCE_NAMES[key]}</span><strong id="resource-${key}">0</strong></div>
              <small id="delta-${key}"></small></div>`).join('')}
        </section>
        <div class="game-layout">
          <aside class="sidebar">
            <p class="eyebrow nav-label">DEINE HERRSCHAFT</p>
            <nav aria-label="Spielbereiche">
              ${([
                ['overview', '◈', 'Reichsübersicht'], ['council', '♛', 'Reichsrat'], ['build', '♜', 'Bauvorhaben'],
                ['economy', '⚖', 'Wirtschaft'], ['research', '✧', 'Forschung'], ['military', '⚑', 'Garnison'],
                ['war', '⚔', 'Feldzüge'], ['character', '♙', 'Charakter'],
                ['chronicle', '▤', 'Chronik'], ['help', '?', 'Spielhilfe']
              ] as const).map(([key, symbol, name]) => `
                <button data-view="${key}"><span aria-hidden="true">${symbol}</span>${name}</button>`).join('')}
            </nav>
            <section class="realm-health" aria-label="Reichszustand">
              <p class="eyebrow">DEIN VOLK</p>
              <div class="health-stat"><span>Bevölkerung</span><strong id="population"></strong></div>
              <div class="health-stat"><span>Zufriedenheit</span><strong id="happiness"></strong></div>
              <progress id="happiness-bar" max="100" aria-label="Zufriedenheit"></progress>
              <div class="health-stat"><span>Stabilität</span><strong id="stability"></strong></div>
              <progress id="stability-bar" max="100" aria-label="Stabilität"></progress>
            </section>
            <div class="sidebar-footer"><span class="status-dot"></span> <span id="mode-label"></span></div>
          </aside>
          <main class="workspace">
            <section class="timebar" aria-label="Zeitsteuerung">
              <div><p class="eyebrow">HOCHMITTELALTER · ALTERNATIVE GESCHICHTE</p>
                <h1 id="date"></h1></div>
              <div class="time-actions" data-mode="solo"><span id="time-status"></span>
                <button data-action="pause" id="pause" aria-label="Zeit fortsetzen">▶ Fortsetzen</button>
                <label class="speed-label"><span class="sr-only">Spielgeschwindigkeit</span>
                  <select id="speed"><option value="1">1×</option><option value="2">2×</option>
                    <option value="4">4×</option></select></label>
                <button data-action="month" class="secondary" title="Einen vollständigen Monat berechnen">Monat →</button>
              </div>
              <div class="time-actions" data-mode="hotseat" hidden><span id="turn-status" class="turn-status"></span>
                <button data-action="endturn" id="end-turn" class="primary">Zug beenden →</button>
              </div>
            </section>
            <div id="notice" class="notice" role="status" aria-live="polite"></div>
            <button id="council-prompt" data-view="council" class="council-alert" hidden></button>
            <section class="map-card" aria-label="Interaktive Siedlungsübersicht">
              <div class="map-heading"><div><span class="eyebrow">DEIN LEHEN</span>
                <h2>Land & Leute</h2></div><span class="map-tag">Siedlungsübersicht</span></div>
              <div id="kingdom-map" class="map-host"></div>
              <div class="map-footer"><span>Bezirk anklicken · Ziehen zum Verschieben</span>
                <div class="map-tools"><button data-zoom="-0.2" aria-label="Karte verkleinern">−</button>
                  <button data-zoom="0" aria-label="Karte zentrieren">Zentrieren</button>
                  <button data-zoom="0.2" aria-label="Karte vergrößern">+</button></div></div>
            </section>
            <section id="panel" class="content-panel" aria-label="Verwaltung"></section>
          </main>
          <aside class="council">
            <section class="council-card"><p class="eyebrow">DER REICHSRAT</p><h2>Ein weiser Rat</h2>
              <div class="advisor-seal" aria-hidden="true">♙</div><p id="advice"></p>
              <button data-view="economy" class="text-button">Zur Monatsbilanz →</button></section>
            <section class="council-card"><p class="eyebrow">DEIN AUFTRAG</p><h2>Ein blühendes Reich</h2>
              <p class="muted">Erfülle alle Ziele gleichzeitig. Ohne Zeitlimit.</p>
              <div id="objectives"></div><progress id="goal-progress" max="6" aria-label="Kampagnenfortschritt"></progress>
              <p id="goal-status"></p></section>
            <section class="council-card latest"><p class="eyebrow">NEUESTES AUS DEM REICH</p>
              <div id="latest"></div><button data-view="chronicle" class="text-button">Chronik öffnen →</button></section>
          </aside>
        </div>
        <footer class="game-footer">Jede Entscheidung zählt.<span id="footer-keys"></span></footer>
      </div>`;
    this.bindAudioControls();
    const motionToggle = this.root.querySelector<HTMLButtonElement>('#motion-toggle');
    motionToggle?.addEventListener('click', (): void => {
      this.motionEnabled = !this.motionEnabled;
      this.map?.setMotion(this.motionEnabled);
      motionToggle.textContent = this.motionEnabled ? '✨ Animation: An' : '✨ Animation: Aus';
      motionToggle.setAttribute('aria-pressed', String(this.motionEnabled));
    });
    if (motionToggle && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      motionToggle.disabled = true;
      motionToggle.title = 'Reduzierte Bewegung ist im Betriebssystem aktiviert.';
    }
    this.root.querySelector('.brand')?.addEventListener('click', (event: Event): void => {
      event.preventDefault();
      this.navigate('overview');
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => this.navigate(button.dataset.view as View));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => { void this.run(() => this.action(button.dataset.action ?? '')); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => this.map?.changeZoom(Number(button.dataset.zoom)));
    });
    this.root.querySelector<HTMLSelectElement>('#speed')?.addEventListener('change', (event: Event): void => {
      const target = event.target;
      if (target instanceof HTMLSelectElement) engine.getTimeSystem().setSpeed(Number(target.value));
    });
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions = [
      engine.on('councilDecision', (detail: { playerId: string; title: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        this.record('Der Reichsrat ruft: ' + detail.title);
        this.audio.playEffect('success');
        this.notify('Dringende Angelegenheit im Reichsrat: ' + detail.title);
        if (!engine.isHotseat()) this.navigate('council');
      }),
      engine.on('councilResolved', (detail: { playerId: string; outcome: { message: string } }): void => {
        if (this.player?.id === detail.playerId) this.record(detail.outcome.message);
      }),
      engine.on('monthAdvanced', (): void => {
        this.record('Monat abgeschlossen. Produktion, Verbrauch und Steuern wurden verbucht.');
        this.audio.playEffect('month');
        this.renderPanel();
        this.refresh();
      }),
      engine.on('gameStateChanged', (): void => this.refresh()),
      engine.on('autosaveError', (detail: { message: string }): void => {
        this.notify('Automatische Sicherung fehlgeschlagen: ' + detail.message, true);
      }),
      engine.on('simulationError', (detail: { message: string }): void => {
        this.notify(`Simulation pausiert: ${detail.message}`, true);
      }),
      engine.on('gameEvent', (detail: { title: string; description: string }): void => {
        this.record(`${detail.title}: ${detail.description}`);
        this.notify(`${detail.title}: ${detail.description}`);
      }),
      engine.on('battleResolved', (detail: { report: BattleReport }): void => {
        this.record(detail.report.summary);
        this.audio.playEffect('battle');
        if (this.player && detail.report.playerIds.includes(this.player.id) && detail.report.kind === 'raid') {
          this.notify(detail.report.summary, !this.wonBattle(detail.report));
        }
      }),
      engine.on('technologyResearched', (detail: { playerId: string; technology: { name: string } }): void => {
        if (this.player?.id !== detail.playerId) return;
        const message = `Forschung abgeschlossen: ${detail.technology.name}.`;
        this.record(message);
        this.notify(message);
      })
    ];
    this.refresh();
    const host = this.root.querySelector<HTMLElement>('#kingdom-map');
    if (host) {
      try {
        const { KingdomMap } = await import('./KingdomMap');
        this.map = new KingdomMap();
        await this.map.initialize(host, (type: keyof KingdomInfrastructure): void => {
          this.selected = type;
          this.navigate('build');
        });
        this.map.setMotion(this.motionEnabled);
        this.refresh();
      } catch (error) {
        console.error('Karte konnte nicht gestartet werden:', error);
        host.innerHTML = '<p class="map-error">Die Grafikkarte ist nicht verfügbar. Alle Spielaktionen sind über die Verwaltung unten erreichbar.</p>';
        this.notify('Grafik konnte nicht initialisiert werden. Die Verwaltung bleibt bedienbar.', true);
      }
    }
  }

  private navigate(view: View): void {
    this.view = view;
    this.renderPanel();
    this.refresh();
    if (view !== 'overview') this.root.querySelector('#panel')?.scrollIntoView({ block: 'start' });
  }

  private refresh(): void {
    if (!this.engine || !this.root.querySelector('.kingdom-app')) return;
    const hotseat = this.engine.isHotseat();
    if (hotseat) this.player = this.engine.getActivePlayer();
    if (!this.player) return;
    const kingdom = this.player.kingdom;
    const balance = kingdom.getMonthlyBalance();
    const trade = this.engine.getTradeNetworkStats(this.player).monthlyIncome;
    const setText = (id: string, text: string): void => {
      const element = this.root.querySelector(`#${id}`);
      if (element) element.textContent = text;
    };
    this.root.querySelectorAll<HTMLElement>('.time-actions[data-mode]').forEach((element: HTMLElement): void => {
      element.hidden = (element.dataset.mode === 'hotseat') !== hotseat;
    });
    const players = this.engine.getPlayers();
    setText('turn-status', hotseat
      ? `Am Zug: ${this.player.name} (${players.indexOf(this.player) + 1}/${players.length})` : '');
    setText('mode-label', hotseat ? `Hotseat · ${players.length} Herrscher` : 'Lokale Einzelspieler-Kampagne');
    setText('footer-keys', hotseat
      ? 'Zug beenden: nächster Herrscher · Nach dem letzten Zug vergeht ein Monat · Manuell speichern'
      : 'Leertaste: Pause · Escape: pausieren · Automatische Sicherung nach jedem Monat · zusätzlich manuell speichern');
    const character = this.engine.getCurrentCharacter(this.player.id);
    setText('realm-name', kingdom.name);
    setText('ruler-name', `${this.player.title.name} ${this.player.name}${
      character ? ` · spielt ${character.firstName} ${character.lastName}` : ''}`);
    for (const resource of ['gold', 'food', 'wood', 'stone', 'iron'] as const) {
      setText(`resource-${resource}`, format(kingdom.resources[resource]));
      const delta = balance.net[resource] + (resource === 'gold' ? trade : 0);
      setText(`delta-${resource}`, `${delta >= 0 ? '+' : ''}${format(delta)}/Mo.`);
      const element = this.root.querySelector(`#delta-${resource}`);
      if (element) element.className = delta >= 0 ? 'positive' : 'negative';
    }
    setText('population', format(kingdom.getSummary().totalPopulation));
    setText('happiness', `${format(kingdom.happiness)} %`);
    setText('stability', `${format(kingdom.stats.stability)} %`);
    for (const [id, value] of [['happiness', kingdom.happiness], ['stability', kingdom.stats.stability]] as const) {
      const bar = this.root.querySelector<HTMLProgressElement>(`#${id}-bar`);
      if (bar) bar.value = value;
    }
    setText('date', this.date());
    const paused = this.engine.getGameState() !== GameState.RUNNING;
    setText('pause', paused ? '▶ Fortsetzen' : 'Ⅱ Pausieren');
    this.root.querySelector('#pause')?.setAttribute('aria-label', paused ? 'Zeit fortsetzen' : 'Zeit pausieren');
    setText('time-status', paused ? 'Pausiert' : 'Zeit läuft');
    const speed = this.root.querySelector<HTMLSelectElement>('#speed');
    if (speed && document.activeElement !== speed) speed.value = String(this.engine.getTimeSystem().getSpeed());
    const pendingCouncil = this.engine.getPendingCouncilDecision(this.player.id);
    const councilPrompt = this.root.querySelector<HTMLElement>('#council-prompt');
    if (councilPrompt) {
      councilPrompt.hidden = !pendingCouncil;
      if (pendingCouncil) councilPrompt.textContent = '⚠ Offene Ratsentscheidung: ' + pendingCouncil.title;
    }
    setText('advice', pendingCouncil
      ? 'Der Rat erwartet deinen Entschluss! Öffne den Reichsrat und entscheide über ' + pendingCouncil.title + '.'
      : balance.net.food < 0
      ? 'Dein Volk verbraucht mehr Nahrung als deine Höfe erzeugen. Baue Bauernhöfe oder kaufe Vorräte am Markt.'
      : balance.net.gold + trade < 0
        ? 'Die Ausgaben übersteigen deine Einnahmen. Erhöhe behutsam die Steuern oder verkaufe Überschüsse.'
        : kingdom.happiness < 65
          ? 'Die Menschen brauchen Zuversicht. Niedrigere Steuern und eine Taverne helfen deinem Reich.'
          : 'Deine Grundversorgung ist gesichert. Investiere Überschüsse in Handel, Bildung und die Zukunft deines Reiches.');
    const goals = this.engine.getCampaignGoals(this.player.id);
    const completed = goals.filter((goal: CampaignGoal) => goal.done).length;
    const objectiveHost = this.root.querySelector('#objectives');
    if (objectiveHost) objectiveHost.innerHTML = goals.map((goal: CampaignGoal) =>
      `<p class="objective ${goal.done ? 'complete' : ''}"><span>${goal.done ? '✓' : '○'}</span>${goal.label}</p>`
    ).join('');
    const goalProgress = this.root.querySelector<HTMLProgressElement>('#goal-progress');
    if (goalProgress) {
      goalProgress.max = goals.length;
      goalProgress.value = completed;
    }
    setText('goal-status', completed === goals.length
      ? 'Ziel erreicht! Dein Reich blüht. Du kannst frei weiterspielen.' : `${completed} von ${goals.length} Zielen erreicht`);
    const latest = this.root.querySelector('#latest');
    if (latest) latest.innerHTML = this.journal.slice(0, 2).map((entry: JournalEntry) =>
      `<p><small>${escape(entry.date)}</small>${escape(entry.message)}</p>`).join('');
    this.root.querySelectorAll<HTMLButtonElement>('nav [data-view]').forEach((button: HTMLButtonElement): void => {
      button.setAttribute('aria-current', button.dataset.view === this.view ? 'page' : 'false');
    });
    this.map?.update(kingdom, this.selected);
    const scene: Soundscape = this.view === 'war' ? 'battle' :
      this.view === 'economy' ? 'market' :
      kingdom.currentSeason === 'winter' ? 'winter' : 'village';
    this.ambience.setScene(scene);
    const panel = this.root.querySelector('#panel');
    if (!panel?.contains(document.activeElement)) this.renderPanel();
  }

  private renderPanel(): void {
    const panel = this.root.querySelector<HTMLElement>('#panel');
    if (!panel || !this.player || !this.engine) return;
    const focused = document.activeElement;
    const focusSelector = focused instanceof HTMLElement && panel.contains(focused)
      ? focused.id ? `#${focused.id}`
        : focused.dataset.build ? `[data-build="${focused.dataset.build}"]`
          : focused.dataset.recruit ? `[data-recruit="${focused.dataset.recruit}"]`
            : focused.dataset.attackRival ? `[data-attack-rival="${focused.dataset.attackRival}"]`
              : focused.dataset.attackPlayer ? `[data-attack-player="${focused.dataset.attackPlayer}"]`
                : focused.dataset.charAction ? `[data-char-action="${focused.dataset.charAction}"]`
                  : focused.dataset.switch ? `[data-switch="${focused.dataset.switch}"]` : undefined
      : undefined;
    const kingdom = this.player.kingdom;
    const balance = kingdom.getMonthlyBalance();
    const heading = (eyebrow: string, title: string, description: string): string =>
      `<div class="section-heading"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><p>${description}</p></div>`;
    if (this.view === 'council') {
      const decision = this.engine.getPendingCouncilDecision(this.player.id);
      const choices = this.engine.getCouncilChoices(this.player.id);
      const history = this.engine.getCouncilHistory(this.player.id);
      panel.innerHTML = heading('ENTSCHEIDUNGEN MIT FOLGEN', 'Der königliche Reichsrat',
        'Jede Entscheidung verändert den Lauf deiner Herrschaft. Riskante Pläne können glücken oder scheitern.') +
        (decision ? `<article class="council-dilemma">
          <p class="eyebrow">${escape(decision.category)} · DRINGEND</p>
          <h3>${escape(decision.title)}</h3><p>${escape(decision.story)}</p>
          <div class="build-grid">${choices.map((choice) => `<article class="build-card">
            <h3>${escape(choice.title)}</h3><p>${escape(choice.description)}</p>
            <p class="cost">${Object.entries(choice.cost).map(([key, value]) =>
              `${format(value)} ${escape(RESOURCE_NAMES[key as keyof typeof RESOURCE_NAMES])}`).join(' · ') || 'Keine direkten Kosten'}
              ${choice.probability === null ? ' · Sichere Auswirkung' : ' · Erfolgschance ' + format(choice.probability * 100) + ' %'}</p>
            <button class="primary" data-council-choice="${escape(choice.id)}"
              ${choice.affordable ? '' : 'disabled'}>${choice.affordable ? 'Diesen Weg wählen' : 'Nicht genügend Vorräte'}</button>
          </article>`).join('')}</div>
        </article>` : '<p class="positive">Im Moment ist der Rat zufrieden. Die nächsten Ereignisse entwickeln sich im Lauf der Monate.</p>') +
        `<h3>Entscheidungs-Chronik</h3><ol class="journal">${history.slice(0, 20).map((entry) =>
          `<li><time>${escape(entry.date)}</time><p>${escape(entry.message)}</p></li>`).join('') ||
          '<li>Noch keine Ratsbeschlüsse gefasst.</li>'}</ol>`;
    } else if (this.view === 'overview') {
      panel.innerHTML = heading('DAS REICH AUF EINEN BLICK', 'Deine nächste Entscheidung',
        'Sichere die Versorgung, investiere gezielt und beobachte die Folgen im nächsten Monat.') + `
        <div class="summary-grid">
          <article><span>Versorgung</span><strong class="${balance.net.food >= 0 ? 'positive' : 'negative'}">
            ${balance.net.food >= 0 ? '+' : ''}${format(balance.net.food)}</strong><small>Nahrung pro Monat</small></article>
          <article><span>Verwaltung</span><strong>${format(kingdom.taxRate * 100)} %</strong><small>Steuersatz</small></article>
          <article><span>Entwicklung</span><strong>${format(kingdom.stats.literacyRate)} %</strong><small>Alphabetisierung</small></article>
        </div><div class="quick-actions"><button data-open="build" class="primary">Bauvorhaben planen →</button>
          <button data-open="economy" class="secondary">Wirtschaft verwalten</button></div>
        <p class="muted tip">Du beginnst pausiert. Mit „Monat →“ kannst du die Simulation schrittweise erkunden.
          „Fortsetzen“ verarbeitet bei 1× alle vier Sekunden einen Monat.</p>`;
    } else if (this.view === 'build') {
      panel.innerHTML = heading('BAU & ENTWICKLUNG', 'Dein Reich wächst',
        'Bauten werden sofort fertiggestellt. Kosten und Effekte stammen direkt aus der Simulation.') + `
        <div class="build-grid">${(Object.keys(STRUCTURES) as Array<keyof KingdomInfrastructure>).map(
          (type: keyof KingdomInfrastructure): string => {
            const info = STRUCTURES[type];
            const cost = kingdom.getBuildingData(type);
            if (!cost) throw new Error(`Baukosten fehlen: ${type}`);
            const missing = [
              kingdom.resources.gold < cost.cost ? 'Gold' : '',
              kingdom.resources.wood < (cost.woodCost ?? 0) ? 'Holz' : '',
              kingdom.resources.stone < (cost.stoneCost ?? 0) ? 'Stein' : '',
              kingdom.resources.iron < (cost.ironCost ?? 0) ? 'Eisen' : ''
            ].filter(Boolean);
            return `<article class="build-card ${this.selected === type ? 'selected' : ''}">
              <div class="build-title"><span aria-hidden="true">${info.symbol}</span><h3>${info.name}</h3>
                <small>${kingdom.infrastructure[type]} gebaut</small></div><p>${info.description}</p>
              <div class="cost">${format(cost.cost)} Gold${cost.woodCost ? ` · ${format(cost.woodCost)} Holz` : ''}
                ${cost.stoneCost ? ` · ${format(cost.stoneCost)} Stein` : ''}
                ${cost.ironCost ? ` · ${format(cost.ironCost)} Eisen` : ''}</div>
              <button data-build="${type}" ${missing.length ? 'disabled' : ''} class="secondary"
                aria-label="${info.name} bauen">${missing.length ? `Fehlt: ${missing.join(', ')}` : `${info.name} bauen`}</button>
            </article>`;
          }).join('')}</div>`;
    } else if (this.view === 'economy') {
      const tradeIncome = this.engine.getTradeNetworkStats(this.player).monthlyIncome;
      panel.innerHTML = heading('HANDEL & FINANZEN', 'Eine gesunde Wirtschaft',
        'Die Bilanz ist eine Prognose vor Ereignissen und jährlichen Titelboni. Mangel verursacht Unzufriedenheit.') + `
        <div class="economy-grid"><section><h3>Monatsbilanz</h3>
          <table><caption class="sr-only">Erwartete Ressourcenänderungen im nächsten Monat</caption>
            <thead><tr><th>Ressource</th><th>Eingang</th><th>Verbrauch</th><th>Saldo</th></tr></thead>
            <tbody>${(['gold', 'food', 'wood', 'stone', 'iron'] as const).map((key: MarketResource | 'gold') => {
              const income = balance.production[key] + (key === 'gold' ? balance.taxes + tradeIncome : 0);
              const expense = key === 'food' || key === 'wood' || key === 'gold' ? balance.consumption[key] : 0;
              return `<tr><th>${RESOURCE_NAMES[key]}</th><td>${format(income)}</td><td>${format(expense)}</td>
                <td class="${income >= expense ? 'positive' : 'negative'}">${format(income - expense)}</td></tr>`;
            }).join('')}</tbody></table><p class="muted">Gold-Eingang enthält ${format(balance.taxes)} Steuern
              und ${format(tradeIncome)} Routeneinkommen.</p>
          <form id="tax-form" class="tax-form"><label>Steuersatz
            <select id="tax-rate" name="tax">${[5, 10, 15, 20, 25, 30, 40, 50].map((rate: number) =>
              `<option value="${rate}" ${Math.round(kingdom.taxRate * 100) === rate ? 'selected' : ''}>${rate} %</option>`
            ).join('')}</select></label><button class="primary" type="submit">Steuern festlegen</button></form>
          <p class="muted">Über 15 % sinkt die Zufriedenheit monatlich, darunter erholt sie sich.</p></section>
          <section><h3>Markthandel</h3><p class="muted">Sofortiger Austausch. Einkauf mit 20 % Aufschlag,
            Verkauf mit 20 % Abschlag – kein risikoloser Weiterverkauf.</p>
            <form id="trade-form"><label>Ressource<select name="resource" id="trade-resource">
              ${(['food', 'wood', 'stone', 'iron'] as const).map((resource: MarketResource) =>
                `<option value="${resource}">${RESOURCE_NAMES[resource]}</option>`).join('')}</select></label>
              <label>Menge<input name="amount" id="trade-amount" type="number" value="500" min="1" max="1000000" step="1" required></label>
              <p id="trade-quote" class="cost"></p>
              <div class="quick-actions"><button name="direction" value="buy" class="primary">Kaufen</button>
                <button name="direction" value="sell" class="secondary">Verkaufen</button></div>
            </form></section></div>
        <section class="trade-routes-section"><h3>Handelsrouten</h3>
          <p class="muted">Führe neue Routen über Aktivierungskosten und gegebenenfalls Forschung ein.</p>
          ${this.renderTradeRoutes(this.player)}</section>`;
    } else if (this.view === 'research') {
      const progress = this.engine.getTechnologyProgress(this.player.id);
      const current = this.engine.getTechnologyOptions(this.player.id)
        .find((option) => option.technology.id === progress.currentResearch?.technologyId);
      const pointsPerMonth = kingdom.infrastructure.schools * 10 + kingdom.infrastructure.universities * 25;
      panel.innerHTML = heading('WISSEN & ERFINDUNGEN', 'Forschung im Reich',
        'Schulen und Universitäten erzeugen Forschungspunkte. Pro Reich kann gleichzeitig ein Projekt laufen.') + `
        <div class="summary-grid"><article><span>Forschungsvorrat</span><strong>${format(progress.researchPoints)}</strong>
          <small>+${format(pointsPerMonth)} Punkte/Monat aus Bildung</small></article>
          <article><span>Erforscht</span><strong>${progress.researched.length}</strong>
            <small>Technologien in diesem Reich</small></article>
          <article><span>Forschungsstätten</span><strong>${kingdom.infrastructure.schools +
            kingdom.infrastructure.universities}</strong><small>Schulen & Universitäten</small></article></div>
        ${current ? `<section class="research-current"><h3>Aktuelles Projekt: ${
          escape(current.technology.name)}</h3><progress max="${current.technology.researchTime}"
          value="${progress.currentResearch?.progressDays ?? 0}" aria-label="Forschungsfortschritt"></progress>
          <p>${format(progress.currentResearch?.progressDays ?? 0)} / ${
          format(current.technology.researchTime)} Forschungstage</p></section>` : ''}
        <div class="build-grid">${this.engine.getTechnologyOptions(this.player.id).map((option): string => `
          <article class="build-card ${option.researched ? 'selected' : ''}">
            <div class="build-title"><span aria-hidden="true">✧</span><h3>${escape(option.technology.name)}</h3>
              <small>${escape(option.technology.era)} · ${option.technology.year}</small></div>
            <p>${escape(option.technology.description)}</p>
            <div class="cost">${format(option.technology.cost.gold)} Gold · ${
              format(option.technology.cost.research)} Forschungspunkte · ${format(option.technology.researchTime)} Tage</div>
            ${option.researched ? '<p class="positive">Erforscht</p>' : option.canStart
              ? `<button class="primary" data-research="${escape(option.technology.id)}">Forschung beginnen</button>`
              : `<p class="muted">${option.blockers.map(escape).join(' · ')}</p>`}
          </article>`).join('')}</div>`;
    } else if (this.view === 'military') {
      panel.innerHTML = heading('SICHERHEIT & VERTEIDIGUNG', 'Die Garnison',
        'Rekruten kommen aus der bäuerlichen Bevölkerung. Mehr Truppen kosten Unterhalt und fehlen auf den Feldern.') + `
        <p class="muted">Moral: ${format(kingdom.military.morale)} % · Ausbildung: ${
          format(kingdom.military.trainingLevel)} % · Ausrüstung: ${format(kingdom.military.equipmentQuality)} %</p>
        <div class="build-grid">${([
          ['infantry', 'Infanterie', 50, '50 Gold · 10 Nahrung'],
          ['archers', 'Bogenschützen', 75, '75 Gold · 15 Nahrung · 10 Holz'],
          ['cavalry', 'Kavallerie', 150, '150 Gold · 30 Nahrung · 5 Eisen']
        ] as const).map(([type, name, gold, cost]) => `<article class="build-card">
          <h3>${name}</h3><strong class="troop-count">${format(kingdom.military[type])}</strong>
          <p>${cost} je Rekrut</p><button class="secondary" data-recruit="${type}"
            ${kingdom.resources.gold < gold * 10 || kingdom.population.peasants < 10 ? 'disabled' : ''}>
            10 ${name} rekrutieren</button></article>`).join('')}</div>
        <p class="muted tip">Mit deiner Garnison ziehst du unter „Feldzüge“ gegen rivalisierende Nachbarn.
          Kasernen, Ausbildung und Ausrüstung erhöhen die Kampfkraft, Mauern und Burgen die Verteidigung.</p>
        <div class="quick-actions"><button data-open="war" class="primary">Zum Kriegsrat →</button></div>`;
    } else if (this.view === 'war') {
      panel.innerHTML = heading('KRIEGSRAT', 'Feldzüge & Nachbarn',
        'Jeder Feldzug kostet Nachschub und Verluste. Pro Monat kann dein Heer einmal ausrücken.') +
        this.renderWarRoom(this.player);
    } else if (this.view === 'character') {
      panel.innerHTML = heading('DEINE ROLLE', 'Der gespielte Charakter',
        'Du lenkst das Reich durch eine Person aus deinem Volk. Wechsle die Rolle, wann immer du willst.') +
        this.renderCharacter(this.player);
    } else if (this.view === 'chronicle') {
      panel.innerHTML = heading('DIE GESCHICHTE DEINER HERRSCHAFT', 'Reichschronik',
        'Die letzten 100 Meldungen dieser Sitzung. Dein eigentlicher Spielzustand wird separat gespeichert.') + `
        <ol class="journal">${this.journal.map((entry: JournalEntry) =>
          `<li><time>${escape(entry.date)}</time><p>${escape(entry.message)}</p></li>`).join('')}</ol>`;
    } else {
      panel.innerHTML = heading('EIN GUTER ANFANG', 'So regierst du dein Reich',
        'Alle sichtbaren Aktionen verändern denselben gespeicherten Spielzustand.') + `
        <div class="help-grid"><article><h3>1. Versorgung sichern</h3>
          <p>Beachte die Salden unter deinen Vorräten. Baue Bauernhöfe bei Nahrungsmangel.
          Bei leeren Vorräten sinken Zufriedenheit und Bevölkerung.</p></article>
          <article><h3>2. Wirtschaft aufbauen</h3><p>Verkaufe Überschüsse, baue Märkte und wähle
          tragbare Steuern. Neue Bauten und Soldaten können die Monatsbilanz verändern.</p></article>
          <article><h3>3. Zeit bewusst steuern</h3><p>Leertaste pausiert oder startet.
          „Monat →“ pausiert und verarbeitet exakt einen Monat. 1× entspricht vier Sekunden pro Monat.
          Im Hotseat-Modus läuft keine Echtzeit: jeder Herrscher beendet seinen Zug, danach vergeht ein Monat.</p></article>
          <article><h3>4. Feldzüge führen</h3><p>Unter „Feldzüge“ siehst du Angriffs- und Verteidigungskraft,
          Siegchancen und Nachschubkosten. Besiegte Nachbarn zahlen Tribut; feindliche Nachbarn überfallen dich
          gelegentlich, wenn Zufallsereignisse aktiv sind. Im Hotseat könnt ihr euch gegenseitig angreifen.</p></article>
          <article><h3>5. Rollen spielen</h3><p>Unter „Charakter“ handelt deine Figur einmal pro Monat: arbeiten,
          studieren, üben oder dem Reich dienen. Gute Anführer verstärken dein Heer. Stirbt die Figur, wählst du
          eine neue Rolle.</p></article>
          <article><h3>6. Wissen entwickeln</h3><p>Schulen erzeugen Forschungspunkte. Unter „Forschung“ kannst du
          Technologien projektweise entwickeln; Voraussetzungen und verfügbare Epochen werden berücksichtigt.
          Segeln schaltet beispielsweise die Hanserouten frei.</p></article>
          <article><h3>7. Dein Vermächtnis</h3><p>Erfülle die Ziele rechts. Du kannst danach weiterspielen.
          Speichere manuell; beim Laden bleibt die Zeit immer pausiert. Nach jedem abgeschlossenen Monat wird automatisch gespeichert.</p></article></div>
        <p class="muted tip">Die Karte zeigt einen schematischen Siedlungsraum, keine Grenzen des historischen
          Deutschlands. Mehrspieler bedeutet hier: mehrere Herrscher abwechselnd an einem Gerät (Hotseat).</p>`;
    }
    panel.querySelectorAll<HTMLButtonElement>('[data-council-choice]').forEach((button) => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const result = this.requireEngine().resolveCouncilDecision(
            this.requirePlayer().id, button.dataset.councilChoice ?? '');
          this.notify(result.message, !result.success);
          this.audio.playEffect(result.success ? 'success' : 'battle');
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => this.navigate(button.dataset.open as View));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-research]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const technology = this.requireEngine().startResearch(
            this.requirePlayer().id, button.dataset.research ?? ''
          );
          this.record(`Forschung begonnen: ${technology.name}.`);
          this.notify(`Forschung begonnen: ${technology.name}.`);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-route-activate]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const result = this.requireEngine().activateTradeRoute(
            this.requirePlayer(), button.dataset.routeActivate ?? ''
          );
          if (!result.success) throw new Error(result.message);
          this.record(result.message);
          this.notify(result.message);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-route-deactivate]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const result = this.requireEngine().deactivateTradeRoute(
            this.requirePlayer(), button.dataset.routeDeactivate ?? ''
          );
          if (!result.success) throw new Error(result.message);
          this.record(result.message);
          this.notify(result.message);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-build]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run(async (): Promise<void> => {
          const type = button.dataset.build as keyof KingdomInfrastructure;
          if (!await this.requireEngine().buildForPlayer(this.requirePlayer().id, type)) {
            throw new Error('Nicht genügend Ressourcen für dieses Bauvorhaben.');
          }
          this.audio.playEffect('build');
          this.selected = type;
          this.record(`${STRUCTURES[type].name} fertiggestellt.`);
          this.notify(`${STRUCTURES[type].name} wurde gebaut. Kosten wurden abgezogen.`);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-recruit]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const type = button.dataset.recruit as 'infantry' | 'archers' | 'cavalry';
          if (!this.requireEngine().recruitForPlayer(this.requirePlayer().id, 10, type)) {
            throw new Error('Nicht genügend Vorräte oder verfügbare Rekruten.');
          }
          this.audio.playEffect('success');
          this.record('10 neue Soldaten wurden in die Garnison aufgenommen.');
          this.notify('10 Soldaten rekrutiert. Beachte den zusätzlichen Unterhalt.');
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-attack-rival]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const report = this.requireEngine().attackRival(this.requirePlayer().id, button.dataset.attackRival ?? '');
          this.audio.playEffect('battle');
          this.notify(report.summary, !report.attackerWon);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-attack-player]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const report = this.requireEngine().attackPlayer(this.requirePlayer().id, button.dataset.attackPlayer ?? '');
          this.audio.playEffect('battle');
          this.notify(report.summary, !report.attackerWon);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-char-action]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const message = this.requireEngine().performCharacterAction(
            this.requirePlayer().id, button.dataset.charAction as CharacterAction);
          this.record(message);
          this.notify(message);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-switch]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const citizen = this.requireEngine().switchCharacter(this.requirePlayer().id, button.dataset.switch ?? '');
          const message = `Rollenwechsel: Du spielst jetzt ${citizen.firstName} ${citizen.lastName}.`;
          this.record(message);
          this.notify(message);
        });
      });
    });
    panel.querySelector<HTMLFormElement>('#tax-form')?.addEventListener('submit', (event: SubmitEvent): void => {
      event.preventDefault();
      void this.run((): void => {
        const select = panel.querySelector<HTMLSelectElement>('#tax-rate');
        if (!select) return;
        this.requireEngine().setTaxRate(this.requirePlayer().id, Number(select.value) / 100);
        this.audio.playEffect('success');
        this.record(`Steuersatz auf ${select.value} % festgelegt.`);
        this.notify(`Steuersatz geändert: ${select.value} %.`);
      });
    });
    const tradeForm = panel.querySelector<HTMLFormElement>('#trade-form');
    if (tradeForm) {
      const updateQuote = (): void => {
        const data = new FormData(tradeForm);
        const amount = Number(data.get('amount'));
        const quote = panel.querySelector('#trade-quote');
        if (!quote) return;
        if (!Number.isSafeInteger(amount) || amount <= 0) {
          quote.textContent = 'Bitte eine positive ganze Menge eingeben.';
          return;
        }
        const resource = String(data.get('resource')) as MarketResource;
        const engine = this.requireEngine();
        quote.textContent = `Kauf: ${format(engine.quoteTrade(resource, amount, 'buy'))} Gold · Verkauf: ${
          format(engine.quoteTrade(resource, amount, 'sell'))} Gold`;
      };
      tradeForm.addEventListener('input', updateQuote);
      updateQuote();
      tradeForm.addEventListener('submit', (event: SubmitEvent): void => {
        event.preventDefault();
        if (!tradeForm.reportValidity()) return;
        const submitter = event.submitter;
        const direction = submitter instanceof HTMLButtonElement && submitter.value === 'sell' ? 'sell' : 'buy';
        const data = new FormData(tradeForm);
        void this.run((): void => {
          const resource = String(data.get('resource')) as MarketResource;
          const amount = Number(data.get('amount'));
          if (!this.requireEngine().tradeForPlayer(this.requirePlayer().id, resource, amount, direction)) {
            throw new Error(direction === 'buy' ? 'Nicht genügend Gold.' : 'Nicht genügend Vorräte zum Verkaufen.');
          }
          const message = `${format(amount)} ${RESOURCE_NAMES[resource]} ${direction === 'buy' ? 'gekauft' : 'verkauft'}.`;
          this.audio.playEffect('trade');
          this.record(message);
          this.notify(message);
        });
      });
    }
    if (focusSelector) panel.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
  }

  private async action(action: string): Promise<void> {
    const engine = this.requireEngine();
    if ((action === 'month' || action === 'endturn') &&
        engine.getPendingCouncilDecision(this.requirePlayer().id)) {
      this.navigate('council');
      throw new Error('Der Reichsrat wartet auf deine Entscheidung.');
    }
    if (action === 'pause') this.togglePause();
    if (action === 'month') {
      engine.pauseGame();
      await engine.advanceMonth();
    }
    if (action === 'endturn') {
      const finished = this.requirePlayer();
      const result = await engine.endTurn();
      this.player = result.activePlayer;
      this.record(`${finished.name} beendet den Zug.${result.monthAdvanced ? ' Ein neuer Monat beginnt.' : ''}`);
      this.view = 'overview';
      this.showHandover(result.activePlayer, result.monthAdvanced);
    }
    if (action === 'save') {
      engine.pauseGame();
      await engine.saveGame('campaign');
      this.saves = await engine.listSaves();
      this.notify('Herrschaft gespeichert. Die Zeit bleibt pausiert.');
    }
    if (action === 'load') {
      engine.pauseGame();
      if (!this.saves.length) throw new Error('Noch kein Spielstand vorhanden. Zuerst speichern.');
      await engine.loadGame(this.saves[0].slot);
      this.player = engine.getActivePlayer();
      this.record('Gespeicherte Herrschaft wiederhergestellt.');
      this.notify(engine.isHotseat()
        ? `Spielstand geladen. ${this.player.name} ist am Zug.` : 'Spielstand geladen. Die Zeit ist pausiert.');
    }
  }

  private showHandover(next: Player, monthAdvanced: boolean): void {
    this.root.querySelector('.handover')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'handover';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'handover-title');
    overlay.innerHTML = `<div class="handover-card"><p class="eyebrow">${monthAdvanced
      ? `NEUER MONAT · ${escape(this.date().toUpperCase())}` : 'SPIELERWECHSEL'}</p>
      <div class="handover-seal" aria-hidden="true">♜</div>
      <h2 id="handover-title">${escape(next.name)} ist am Zug</h2>
      <p>Reich: <strong>${escape(next.kingdom.name)}</strong></p>
      <p class="muted">Bitte das Gerät weitergeben. Die anderen Herrscher schauen weg.</p>
      <button class="primary wide" id="take-turn">Reich übernehmen →</button></div>`;
    const app = this.root.querySelector('.kingdom-app');
    app?.append(overlay);
    const background = Array.from(app?.children ?? [])
      .filter((element: Element): element is HTMLElement => element instanceof HTMLElement && element !== overlay);
    background.forEach((element: HTMLElement): void => { element.inert = true; });
    const button = overlay.querySelector<HTMLButtonElement>('#take-turn');
    overlay.addEventListener('keydown', (event: KeyboardEvent): void => {
      if (event.key === 'Tab') {
        event.preventDefault();
        button?.focus();
      }
    });
    button?.addEventListener('click', (): void => {
      overlay.remove();
      background.forEach((element: HTMLElement): void => { element.inert = false; });
      this.navigate('overview');
      this.root.querySelector<HTMLButtonElement>('#end-turn')?.focus({ preventScroll: true });
    });
    button?.focus();
  }

  private wonBattle(report: BattleReport): boolean {
    const own = this.player?.kingdom.name;
    return report.attacker === own ? report.attackerWon : report.defender === own ? !report.attackerWon : false;
  }

  private campaignBlocker(player: Player): string | null {
    const engine = this.requireEngine();
    const army = engine.getArmyOverview(player.id);
    if (!army.canCampaign) return 'Dein Heer ist in diesem Monat bereits ausgerückt.';
    if (army.soldiers < MIN_CAMPAIGN_SOLDIERS) return `Mindestens ${MIN_CAMPAIGN_SOLDIERS} Soldaten nötig.`;
    if (player.kingdom.resources.gold < army.cost.gold || player.kingdom.resources.food < army.cost.food) {
      return `Nachschub fehlt: ${format(army.cost.gold)} Gold und ${format(army.cost.food)} Nahrung nötig.`;
    }
    return null;
  }

  private renderTradeRoutes(player: Player): string {
    const engine = this.requireEngine();
    const routes = engine.getAvailableTradeRoutes(player);
    if (!routes.length) {
      return '<p class="muted">In dieser Epoche sind keine Handelsrouten verfügbar. Spätere Routen können Forschung oder Häfen erfordern.</p>';
    }
    return `<div class="build-grid">${routes.map((route): string => {
      const active = player.kingdom.isTradeRouteActive(route.id);
      const activationCost = Math.floor(route.length * 10 + route.danger * 100);
      const needsPort = route.id.includes('sea') || route.id.includes('naval');
      const canActivate = player.kingdom.resources.gold >= activationCost &&
        (!needsPort || player.kingdom.infrastructure.ports > 0);
      return `<article class="build-card ${active ? 'selected' : ''}">
        <div class="build-title"><span aria-hidden="true">⚓</span><h3>${escape(route.name)}</h3>
          <small>${route.period.start}–${route.period.end ?? 'Heute'}</small></div>
        <p>${escape(route.origin)} → ${escape(route.destination)} · ${format(route.length)} km</p>
        <p class="muted">${escape(route.mainGoods.join(', '))}${
          route.requiredTechnology ? ` · Technologie: ${escape(route.requiredTechnology)}` : ''}</p>
        <div class="cost">+${format(route.effects.trade_income)} Gold/Jahr · Aktivierung: ${
          format(activationCost)} Gold${needsPort ? ' · Hafen erforderlich' : ''}</div>
        ${active
          ? `<button class="secondary" data-route-deactivate="${escape(route.id)}">Route beenden</button>`
          : `<button class="secondary" data-route-activate="${escape(route.id)}" ${
            canActivate ? '' : 'disabled'}>${canActivate ? 'Route aktivieren' : needsPort &&
            player.kingdom.infrastructure.ports === 0 ? 'Hafen erforderlich' : 'Zu wenig Gold'}</button>`}
      </article>`;
    }).join('')}</div>`;
  }

  private renderWarRoom(player: Player): string {
    const engine = this.requireEngine();
    const army = engine.getArmyOverview(player.id);
    const blocker = this.campaignBlocker(player);
    const percent = (value: number): string => `${Math.round(value * 100)} %`;
    const rivals = engine.getRivals(player.id).map((rival: RivalRealm): string => {
      const chance = engine.getVictoryChance(player.id, rival.id);
      return `<article class="build-card rival-card ${rival.subjugated ? 'subjugated' : ''}">
        <div class="build-title"><span aria-hidden="true">${rival.subjugated ? '⚐' : '⚔'}</span>
          <h3>${escape(rival.name)}</h3><small>${rival.subjugated ? 'Unterworfen' : 'Feindlich'}</small></div>
        <p>${escape(rival.description)}</p>
        <dl class="stat-list"><div><dt>Soldaten</dt><dd>${format(rival.soldiers)}</dd></div>
          <div><dt>Stärke</dt><dd>${format(CampaignWarfareSystem.rivalPower(rival))}</dd></div>
          <div><dt>${rival.subjugated ? 'Tribut' : 'Siegchance'}</dt><dd class="${rival.subjugated || chance >= 0.5
            ? 'positive' : 'negative'}">${rival.subjugated ? `${format(rival.loot / 24)} Gold/Mo.` : percent(chance)}</dd></div>
        </dl>
        ${rival.subjugated ? '' : `<p class="cost">Beute bei Sieg: ${format(rival.loot)} Gold · ${
          format(rival.settlers)} Siedler</p>`}
        <button class="${chance >= 0.5 ? 'primary' : 'secondary'}" data-attack-rival="${escape(rival.id)}"
          ${rival.subjugated || blocker ? 'disabled' : ''}>${rival.subjugated ? 'Bereits unterworfen'
            : `Feldzug gegen ${escape(rival.name)}`}</button></article>`;
    }).join('');
    const opponents = engine.isHotseat()
      ? engine.getPlayers().filter((other: Player): boolean => other.id !== player.id).map((other: Player): string => {
        const chance = engine.getVictoryChance(player.id, other.id);
        return `<article class="build-card rival-card">
          <div class="build-title"><span aria-hidden="true">♚</span><h3>${escape(other.kingdom.name)}</h3>
            <small>Mitspieler</small></div><p>Herrscher: ${escape(other.name)}</p>
          <dl class="stat-list"><div><dt>Verteidigung</dt><dd>${format(engine.getArmyOverview(other.id).defense)}</dd></div>
            <div><dt>Siegchance</dt><dd class="${chance >= 0.5 ? 'positive' : 'negative'}">${percent(chance)}</dd></div></dl>
          <p class="cost">Sieger plündert 15 % des gegnerischen Goldes.</p>
          <button class="secondary" data-attack-player="${escape(other.id)}" ${blocker ? 'disabled' : ''}>
            ${escape(other.kingdom.name)} angreifen</button></article>`;
      }).join('')
      : '';
    const reports = engine.getBattleReports(player.id).slice(0, 10).map((report: BattleReport): string => {
      const won = this.wonBattle(report);
      return `<li class="report ${won ? 'won' : 'lost'}"><time>${MONTHS[report.month - 1]} ${report.year}</time>
        <div><strong>${escape(report.attacker)} ⚔ ${escape(report.defender)} · ${won ? 'Sieg' : 'Niederlage'}</strong>
          <p>${escape(report.summary)}</p>
          <small>Kraft ${format(report.attackerPower)} : ${format(report.defenderPower)} · Siegchance ${
            percent(report.victoryChance)} · Verluste ${format(report.attackerLosses)} / ${
            format(report.defenderLosses)}${report.plunder ? ` · Beute ${format(report.plunder)} Gold` : ''}</small></div></li>`;
    }).join('');
    return `<div class="summary-grid war-summary">
        <article><span>Feldheer</span><strong>${format(army.soldiers)}</strong><small>Soldaten</small></article>
        <article><span>Angriff</span><strong>${format(army.attack)}</strong><small>inkl. ${
          percent(army.commanderBonus)} Feldherrenbonus</small></article>
        <article><span>Verteidigung</span><strong>${format(army.defense)}</strong><small>mit Mauern & Burgen</small></article>
        <article><span>Nachschub</span><strong>${format(army.cost.gold)}</strong><small>Gold · ${
          format(army.cost.food)} Nahrung je Feldzug</small></article>
      </div>
      <p class="notice ${blocker ? 'error' : 'success'} inline-notice">${blocker
        ? escape(blocker) : 'Dein Heer ist marschbereit. Wähle ein Ziel.'}</p>
      <h3>Nachbarreiche</h3><div class="build-grid">${rivals}</div>
      ${opponents ? `<h3>Mitspieler</h3><div class="build-grid">${opponents}</div>` : ''}
      <h3>Schlachtberichte</h3>${reports ? `<ol class="journal reports">${reports}</ol>`
        : '<p class="muted">Noch keine Schlachten geschlagen.</p>'}`;
  }

  private renderCharacter(player: Player): string {
    const engine = this.requireEngine();
    const character = engine.getCurrentCharacter(player.id);
    const canAct = character !== null && engine.canCharacterAct(player.id);
    const candidates = engine.getPlayableCharacters(12).map((citizen: Citizen): string => `<li>
        <div><strong>${escape(citizen.firstName)} ${escape(citizen.lastName)}</strong>
          <small>${format(citizen.age)} Jahre · ${PROFESSIONS[citizen.profession] ?? escape(citizen.profession)} · ${
            CLASSES[citizen.socialClass]} · Führung ${format(citizen.skills.leadership)} · Kampf ${
            format(citizen.skills.combat)}</small></div>
        <button class="secondary" data-switch="${escape(citizen.id)}">Rolle übernehmen</button></li>`).join('');
    const current = character ? `<article class="character-card">
        <div class="character-head"><span class="character-seal" aria-hidden="true">♙</span><div>
          <h3>${escape(character.firstName)} ${escape(character.lastName)}</h3>
          <p>${format(character.age)} Jahre · ${PROFESSIONS[character.profession] ?? escape(character.profession)} · ${
            CLASSES[character.socialClass]}</p></div></div>
        <dl class="stat-list"><div><dt>Vermögen</dt><dd>${format(character.wealth)} Gold</dd></div>
          <div><dt>Ansehen</dt><dd>${format(character.reputation)}</dd></div>
          <div><dt>Gesundheit</dt><dd>${format(character.health.overall)} %</dd></div>
          <div><dt>Feldherrenbonus</dt><dd>${Math.round(engine.getArmyOverview(player.id).commanderBonus * 100)} %</dd></div></dl>
        <div class="skill-list">${SKILLS.map(([key, label]): string => `<label>${label}
          <progress max="100" value="${character.skills[key]}"></progress><span>${format(character.skills[key])}</span></label>`)
          .join('')}</div></article>`
      : `<p class="notice error inline-notice">Dein Charakter ist verstorben. Übernimm eine neue Rolle aus der Liste.</p>`;
    const actions = CHARACTER_ACTIONS.map(([key, label, description]): string => `<article class="build-card">
        <h3>${label}</h3><p>${description}</p>
        <button class="secondary" data-char-action="${key}" ${canAct ? '' : 'disabled'}>${label}</button></article>`).join('');
    return `${current}
      <h3>Monatliche Handlung</h3>
      <p class="muted">${!character ? 'Ohne lebenden Charakter sind keine Handlungen möglich.'
        : canAct ? 'Dein Charakter kann in diesem Monat eine Handlung ausführen.'
          : 'Dein Charakter hat in diesem Monat bereits gehandelt. Warte auf den nächsten Monat.'}</p>
      <div class="build-grid">${actions}</div>
      <h3>Rolle wechseln</h3>
      <p class="muted">Die bisherige Figur lebt als Bürger weiter. Adelige und Soldaten sind die besten Feldherren.</p>
      <ul class="character-list">${candidates}</ul>`;
  }

  private togglePause(): void {
    const engine = this.requireEngine();
    if (engine.getGameState() === GameState.RUNNING) engine.pauseGame();
    else engine.resumeGame();
  }

  private bindAudioControls(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-audio-toggle]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        if (button.dataset.audioToggle === 'music') void this.toggleMusic();
        else if (button.dataset.audioToggle === 'ambience') {
          void this.ambience.toggle()
            .then((): void => this.updateAudioControls())
            .catch((error: unknown): void => {
              this.notify(error instanceof Error ? error.message : 'Umgebungsgeräusche nicht verfügbar.', true);
            });
        } else this.toggleEffects();
      });
    });
    this.updateAudioControls();
  }

  private async toggleMusic(): Promise<void> {
    try {
      await this.audio.toggleMusic();
      this.updateAudioControls();
    } catch (error) {
      console.error('Musik konnte nicht umgeschaltet werden:', error);
      this.notify('Musik konnte nicht gestartet werden. Prüfe die Browser-Audioeinstellungen.', true);
    }
  }

  private toggleEffects(): void {
    this.audio.toggleEffects();
    this.updateAudioControls();
    if (this.audio.effectsEnabled) this.audio.playEffect('success');
  }

  private updateAudioControls(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-audio-toggle]').forEach((button: HTMLButtonElement): void => {
      const isMusic = button.dataset.audioToggle === 'music';
      const isAmbience = button.dataset.audioToggle === 'ambience';
      const enabled = isMusic ? this.audio.musicEnabled
        : isAmbience ? this.ambience.enabled : this.audio.effectsEnabled;
      button.textContent = isMusic
        ? `♫ Musik: ${enabled ? 'An' : 'Aus'}`
        : isAmbience ? `🌿 Umgebung: ${enabled ? 'An' : 'Aus'}`
        : `🔊 Effekte: ${enabled ? 'An' : 'Aus'}`;
      button.setAttribute('aria-pressed', String(enabled));
      button.disabled = isAmbience ? !this.ambience.supported : !this.audio.supported;
      if (!this.audio.supported) button.title = 'Dieser Browser unterstützt keine Audioausgabe.';
    });
  }

  private async run(operation: () => void | Promise<void>): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.root.setAttribute('aria-busy', 'true');
    try {
      await operation();
    } catch (error) {
      console.error('Spielaktion fehlgeschlagen:', error);
      this.notify(error instanceof Error ? error.message : 'Die Spielaktion ist fehlgeschlagen.', true);
    } finally {
      this.busy = false;
      this.root.removeAttribute('aria-busy');
      this.renderPanel();
      this.refresh();
    }
  }

  private notify(message: string, error: boolean = false): void {
    const notice = this.root.querySelector<HTMLElement>('#notice');
    if (!notice) return;
    notice.textContent = message;
    notice.className = error ? 'notice error' : 'notice success';
    notice.setAttribute('role', error ? 'alert' : 'status');
  }

  private record(message: string): void {
    this.journal.unshift({ date: this.date(), message });
    this.journal = this.journal.slice(0, 100);
  }

  private date(): string {
    return this.engine ? `${MONTHS[this.engine.getCurrentMonth() - 1]} ${this.engine.getCurrentYear()}` : '';
  }

  private requireEngine(): GameEngine {
    if (!this.engine) throw new Error('Bitte zuerst ein Spiel starten.');
    return this.engine;
  }

  private requirePlayer(): Player {
    if (!this.player) throw new Error('Kein Herrscher vorhanden.');
    return this.player;
  }

  /**
   * Releases simulation, map, and document listeners.
   * @returns Nothing.
   */
  public dispose(): void {
    this.engine?.dispose();
    this.map?.dispose();
    for (const unsubscribe of this.subscriptions) unsubscribe();
    document.removeEventListener('keydown', this.keyboardHandler);
    this.root.removeEventListener('click', this.buttonSoundHandler);
    this.audio.dispose();
    this.ambience.dispose();
  }
}
