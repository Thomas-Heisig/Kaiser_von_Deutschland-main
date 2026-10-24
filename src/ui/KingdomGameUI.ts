import { filmForRole, filmPreferences, saveFilmPreferences, loadCinematicLibrary, type CinematicClip, type FilmRole } from './CinematicLibrary';
import { doctrineForYear } from '../core/HistoricalGameplay';
import { localLandmarks, localPlaceName, LOCAL_MAP_NOTE, LOCAL_MAP_CREDIT } from '../core/StartLocations';
import { researchEffectDescriptions } from '../core/ScienceImpact';
import { ADMIN_DOMAINS, ADMIN_LABELS, ADMIN_POLICIES, CHARACTER_PLANS, type CharacterPlan, type AdministrationDomain, type AdministrationPolicy } from '../core/Administration';
import { CouncilAdvisor, readAdvisorConfig, saveAdvisorConfig, type AdvisorBackend } from '../core/CouncilAdvisor';
import {
  CampaignGoal, CharacterAction, GameEngine, GameState, MarketResource, SaveMeta
} from '../core/GameEngine';
import {
  BattleReport, CampaignWarfareSystem, MIN_CAMPAIGN_SOLDIERS, RivalRealm
} from '../core/CampaignWarfareSystem';
import type { Citizen, CitizenSkills, Profession } from '../core/CitizenSystem';
import { journalMessageHtml } from './JournalFormatting';
import { KingdomInfrastructure } from '../core/Kingdom';
import { Player } from '../core/Player';
import type { KingdomMap } from './KingdomMap';
import { SETTLEMENT_DISTRICTS, DistrictFilter, SEASON_LABELS, earlyBuildingName } from './SettlementSceneModel';
import { GameAudio } from './GameAudio';
import { MAIN_THEME, MusicJukebox } from './MusicJukebox';
import { campaignsForYear, CAMPAIGNS, CampaignId } from '../core/CampaignCatalog';
import { COURT_OFFICE_IDS, COURT_OFFICES, CourtOffice, AssistantMode } from '../core/CourtAssistantRegistry';
import { GameAmbience, Soundscape } from './GameAmbience';
import { milestonesThroughDate, historicalMonthReport, milestoneDate, milestoneEvidence, type HistoryKind, type WorldMilestone } from '../core/WorldHistoryCatalog';
import { bce, formatYear, formatYearRange } from '../core/HistoricalCalendar';
import { knowledgeForDate, knowledgeSpotlight, KNOWLEDGE_TOPICS, type KnowledgeTopic } from '../core/EraKnowledgeCatalog';
import { HelpSystem } from './HelpSystem';
import { isZoomLevelsEnabled, regionsForMap, stepSlider } from './MapZoomLevels';
import { deskMarkup, eraPresentation } from './EraPresentation';

type View = 'civic' | 'modernization' | 'history' | 'court' | 'world' | 'intelligence' | 'culture' | 'diplomacy' | 'council' | 'overview' | 'build' | 'economy' | 'research' | 'military' | 'war' | 'character' | 'chronicle' | 'help';
interface JournalEntry { date: string; message: string }
interface StructureInfo { name: string; description: string; symbol: string }
interface NewPlayer { name: string; kingdomName: string }

const MAX_PLAYERS = 4;
const DEFAULT_PLAYERS: ReadonlyArray<NewPlayer> = [
  { name: 'Heinrich', kingdomName: 'Ganderkesee' }, { name: 'Mathilde', kingdomName: 'Westmark' },
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
const CHARACTER_PLAN_LABELS:Record<CharacterPlan,string>={balanced:'Ausgewogen',work:'Arbeiten',study:'Studieren',train:'Waffenübung',serve:'Dem Reich dienen'};

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
  private focusedRivalId?: string;
  private selected: keyof KingdomInfrastructure = 'farms';
  private districtFilter: DistrictFilter = 'alle';
  private busy: boolean = false;
  private showJourneyGuide=true;
  private historyYear:number|null=null;
  private newsFilter="important";
  private saves: SaveMeta[] = [];
  private journal: JournalEntry[] = [];
  private characterPage = 0;
  private subscriptions: Array<() => void> = [];
  private readonly audio: GameAudio;
  private readonly jukebox = new MusicJukebox(() => this.updateJukeboxStatus());
  private eraMusicSwitching = false;
  private introDismissed = false;
  private cinematicClips: CinematicClip[] = [];
  private interludeDialog?: HTMLDialogElement;
  private cinematicTimeout?: number;
  private openingAttempt = false;
  private resumeAfterCouncil = false;
  private reportIndex = 0;
  private historyTopic: 'all' | KnowledgeTopic | 'events' | 'periods' | 'archive' | 'exhibitions' | 'local' = 'all';
  private tradeResource: MarketResource = 'food';
  private tradeAmount = '500';
  private readonly councilAdvisor = new CouncilAdvisor();
  private readonly retryOpening = (): void => { void this.tryOpeningTheme(); };
  private readonly ambience = new GameAmbience();
  private readonly helpSystem = new HelpSystem();
  private motionEnabled = false;
  private mapStyle: 'flat' | 'isometric' = 'isometric';
  /** Jahr, für das die Regionsnamen zuletzt geladen wurden (vermeidet Neuzeichnen pro Frame). */
  private regionYear?: number;
  private councilDialog?: HTMLDialogElement;
  private councilSelectionTimer?: number;
  private actionBannerTimer?: number;
  private readonly buttonSoundHandler = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (button) this.audio.playEffect('click');
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
    this.loadDisplayPreferences();
    this.showMenu();
    void this.jukebox.initialize().then(async () => { this.updateJukeboxStatus(); await this.tryOpeningTheme(); }).catch(error => console.error('Musikbibliothek:',error));
    document.addEventListener('keydown', this.keyboardHandler);
  }

  /** Shared settings dialog: start screen and active campaign use one markup source. */
  private settingsDialogMarkup(): string {
    return `
<dialog id="settings-dialog" class="info-dialog settings-dialog" aria-labelledby="settings-title">
<div class="settings-heading"><h2 id="settings-title">⚙ Einstellungen</h2><button type="button" id="settings-close" aria-label="Einstellungen schließen">✕</button></div>
<p class="muted settings-intro">Einstellungen für dieses Gerät – auch vor dem Spielstart.</p>
<div class="settings-tabs" role="tablist" aria-label="Einstellungsgruppen"><button type="button" role="tab" id="settings-tab-display" data-settings-tab="display" aria-controls="settings-panel-display" aria-selected="true" tabindex="0">🎨 Anzeige</button>
<button type="button" role="tab" id="settings-tab-audio" data-settings-tab="audio" aria-controls="settings-panel-audio" aria-selected="false" tabindex="-1">🎵 Musik & Ton</button>
<button type="button" role="tab" id="settings-tab-film" data-settings-tab="film" aria-controls="settings-panel-film" aria-selected="false" tabindex="-1">🎬 Filme</button>
<button type="button" role="tab" id="settings-tab-advisor" data-settings-tab="advisor" aria-controls="settings-panel-advisor" aria-selected="false" tabindex="-1">🧠 KI</button>
<button type="button" role="tab" id="settings-tab-offline" data-settings-tab="offline" aria-controls="settings-panel-offline" aria-selected="false" tabindex="-1">⬇ Installation</button></div>
<section id="settings-panel-display" role="tabpanel" class="settings-tab-panel" aria-labelledby="settings-tab-display" data-settings-panel="display" ><h3>Anzeige & Bedienung</h3>
<label class="checkbox"><input type="checkbox" id="setting-journey-guide" ${this.showJourneyGuide?'checked':''}> „Dein Weg durch das Spiel“ anzeigen</label>
<label class="checkbox"><input type="checkbox" id="setting-motion"> Kartenanimation aktivieren</label>
<p id="setting-motion-hint" class="muted">Bewegungen und Karteneffekte ein- oder ausschalten.</p>
<label>Kartendarstellung<select id="setting-map-style"><option value="flat">2D · Draufsicht</option><option value="isometric">3D-Look · isometrisch</option></select></label>
<p class="muted">Die Ansicht passt sich automatisch an Telefon, Tablet und Desktop an.</p>
</section>
<section id="settings-panel-audio" role="tabpanel" class="settings-tab-panel" aria-labelledby="settings-tab-audio" data-settings-panel="audio" hidden><h3>Musik & Ton</h3>
<label>Musiklautstärke <input id="setting-music-volume" type="range" min="0" max="100" value="28"></label>
<label>Musikreihenfolge<select id="setting-playlist-mode"><option value="era">Nach Epoche</option><option value="sequential">Reihenfolge</option><option value="shuffle">Zufällig</option></select></label>
<label>Wiederholen<select id="setting-playlist-repeat"><option value="all">Alle Titel</option><option value="one">Aktueller Titel</option><option value="off">Aus</option></select></label>
<h4>Audiodiagnose</h4><button type="button" id="music-diagnose" class="secondary">Alle 15 MP3 prüfen</button>
          <p id="music-diagnosis" role="status">Bei Abspielfehlern die Serverdateien überprüfen.</p>
</section>
<section id="settings-panel-film" role="tabpanel" class="settings-tab-panel" aria-labelledby="settings-tab-film" data-settings-panel="film" hidden><h3>Filmsequenzen</h3>

           <p id="film-library-status" role="status">Filmdateien werden überprüft …</p>
           <label>Alternatives Intro<select id="film-intro"></select></label>
           <label>Film beim Beenden<select id="film-outro"></select></label>
           <label>Historisches Zwischenvideo<select id="film-interlude"></select></label>
           <label class="checkbox"><input id="film-interludes-enabled" type="checkbox"> Zwischenvideos bei historischen Meilensteinen anzeigen</label>
           <button type="button" id="film-preview" class="secondary">▶ Gewähltes Zwischenvideo ansehen</button>
</section>
<section id="settings-panel-advisor" role="tabpanel" class="settings-tab-panel" aria-labelledby="settings-tab-advisor" data-settings-panel="advisor" hidden><h3>KI & Ratsberatung</h3>
<label>Ratsberater<select id="advisor-backend"><option value="off">Aus – keine KI-Unterstützung</option><option value="mini">Integriertes Mini-Netz (offline)</option><option value="rules">Regelberater</option><option value="webgpu">WebGPU (optional, Modelldownload)</option><option value="ollama">Ollama lokal (nur auf Wunsch)</option></select></label>
          <label id="ollama-config">Ollama-Modell <input id="ollama-model" type="text" maxlength="70" placeholder="gemma3:1b" autocomplete="off"></label>
          <p id="advisor-hardware" class="muted"></p><p class="muted">KI ist optional. Modelle werden erst auf Anfrage heruntergeladen. Vorschläge werden nie automatisch umgesetzt. Ollama ist ausschließlich auf ausdrückliche Auswahl über localhost nutzbar.</p>
          <div class="advisor-model-actions"><button type="button" id="advisor-test" class="secondary">WebGPU prüfen</button>
          <button type="button" id="advisor-start" class="primary">▶ KI-Modell starten</button>
          <button type="button" id="advisor-infer" class="secondary" disabled>🧪 Modellantwort testen</button></div>
          <label for="advisor-progress">Modellstatus</label>
          <progress id="advisor-progress" max="100" value="0" aria-label="KI-Modell-Ladefortschritt"></progress>
          <p id="advisor-status" role="status" aria-live="polite">KI-Modell nicht geladen.</p>
          <p id="advisor-inference-result" role="status"></p>
</section>
<section id="settings-panel-offline" role="tabpanel" class="settings-tab-panel" aria-labelledby="settings-tab-offline" data-settings-panel="offline" hidden><h3>Installation & Offline</h3>
<button type="button" data-install-game class="primary">⬇ Spiel installieren</button><p data-install-status role="status" class="muted">Für iPad: Safari → Teilen → Zum Home-Bildschirm.</p><h4>Offline spielen / Heimnetz-Download</h4><p>Spiel, Musik, Cover und alle Videos als vollständiges ZIP herunterladen – auch über HTTP im vertrauenswürdigen Heimnetz. Nach dem Entpacken lokal über http://localhost starten. Für eine Browserinstallation auf Mobilgeräten bleibt HTTPS erforderlich.</p><a class="secondary" href="${import.meta.env.BASE_URL}downloads/kaiser-von-deutschland-offline.zip" download="kaiser-von-deutschland-offline.zip">↓ Komplettes Spiel als ZIP herunterladen (LAN/HTTP möglich)</a><p>Zusätzlich: Spiel einmalig in diesem Browser speichern (nur HTTPS oder localhost; der Browser kann Cache bei Speichermangel löschen).</p>
          <button type="button" id="offline-save" class="primary">↓ Spiel im Browser speichern</button>
          <p id="offline-status" role="status">Offline-Paket noch nicht überprüft.</p>
</section>
<div class="settings-footer"><button type="button" data-settings-page="-1" aria-label="Vorherige Einstellungsseite">←</button><button type="button" data-settings-page="1" aria-label="Nächste Einstellungsseite">Weiter →</button><button type="button" id="settings-done" class="primary">Fertig</button></div>
</dialog>
`;
  }

  /** The film preview is usable without starting a campaign. */
  private filmDialogMarkup(): string {
    return `
<dialog id="film-dialog" class="film-dialog" aria-label="Historischer Film">
           <div class="section-dialog-head"><strong id="film-dialog-title">Eine neue Epoche</strong>
           <button type="button" id="film-dialog-close" aria-label="Film schließen">✕</button></div>
           <video id="film-dialog-video" playsinline controls preload="none"></video>
           <div class="film-dialog-footer"><button type="button" id="film-dialog-play">▶ Mit Ton abspielen</button>
           <button type="button" id="film-dialog-skip">Überspringen →</button></div>
         </dialog>
`;
  }

  private bindSettingsControls(): void {
    const settingsDialog = this.root.querySelector<HTMLDialogElement>('#settings-dialog');
    const tabs = Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-settings-tab]'));
    const selectTab = (key: string, focus = false): void => {
      for (const tab of tabs) {
        const active = tab.dataset.settingsTab === key;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      }
      this.root.querySelectorAll<HTMLElement>('[data-settings-panel]').forEach(panel => {
        panel.hidden = panel.dataset.settingsPanel !== key;
        panel.scrollTop = 0;
      });
    };
    for (const [index, tab] of tabs.entries()) {
      tab.addEventListener('click', () => selectTab(tab.dataset.settingsTab ?? 'display'));
      tab.addEventListener('keydown', (event: KeyboardEvent) => {
        const last = tabs.length - 1;
        const indexToSelect = event.key === 'Home' ? 0 : event.key === 'End' ? last :
          event.key === 'ArrowRight' ? (index + 1) % tabs.length :
          event.key === 'ArrowLeft' ? (index + last) % tabs.length : -1;
        if (indexToSelect < 0) return;
        event.preventDefault(); selectTab(tabs[indexToSelect].dataset.settingsTab ?? 'display', true);
      });
    }
    selectTab('display');
    this.root.querySelectorAll<HTMLButtonElement>('[data-settings-page]').forEach(button => {
      button.onclick = () => {
        const panel = this.root.querySelector<HTMLElement>('[data-settings-panel]:not([hidden])');
        if (panel) panel.scrollTop += Number(button.dataset.settingsPage) * Math.max(1, panel.clientHeight - 48);
      };
    });
    this.root.querySelector<HTMLInputElement>('#setting-journey-guide')?.addEventListener('change',event=>{
      this.showJourneyGuide=(event.target as HTMLInputElement).checked;this.saveDisplayPreferences();this.renderReport();
    });
    const mapSetting = this.root.querySelector<HTMLSelectElement>('#setting-map-style');
    if (mapSetting) {
      mapSetting.value = this.mapStyle;
      mapSetting.addEventListener('change', () => {
        this.mapStyle = mapSetting.value === 'isometric' ? 'isometric' : 'flat';
        const gameControl = this.root.querySelector<HTMLSelectElement>('#map-style');
        if (gameControl) gameControl.value = this.mapStyle;
        const mapHost = this.root.querySelector<HTMLElement>('#kingdom-map');
        if (mapHost) mapHost.dataset.projection = this.mapStyle;
        this.map?.setProjection(this.mapStyle);
        this.saveDisplayPreferences();
      });
    }
    const musicMode = this.root.querySelector<HTMLSelectElement>('#setting-playlist-mode');
    if (musicMode) {
      musicMode.value = this.jukebox.getPlaylistMode();
      musicMode.addEventListener('change', () => {
        this.jukebox.setPlaylistMode(musicMode.value as 'era' | 'sequential' | 'shuffle');
        const gameControl = this.root.querySelector<HTMLSelectElement>('#playlist-mode');
        if (gameControl) gameControl.value = musicMode.value;
        if (musicMode.value === 'era' && this.engine) void this.jukebox.syncYear(this.engine.getCurrentYear());
      });
    }
    const repeat = this.root.querySelector<HTMLSelectElement>('#setting-playlist-repeat');
    if (repeat) {
      repeat.value = this.jukebox.getRepeatMode();
      repeat.addEventListener('change', () => {
        this.jukebox.setRepeatMode(repeat.value as 'all' | 'one' | 'off');
        const gameControl = this.root.querySelector<HTMLSelectElement>('#playlist-repeat');
        if (gameControl) gameControl.value = repeat.value;
      });
    }

    const backendSelect = this.root.querySelector<HTMLSelectElement>('#advisor-backend');
    const startButton = this.root.querySelector<HTMLButtonElement>('#advisor-start');
    const inferenceButton = this.root.querySelector<HTMLButtonElement>('#advisor-infer');
    const progressBar = this.root.querySelector<HTMLProgressElement>('#advisor-progress');
    const status = this.root.querySelector<HTMLElement>('#advisor-status');
    const inferenceResult = this.root.querySelector<HTMLElement>('#advisor-inference-result');
    const ollamaModel = this.root.querySelector<HTMLInputElement>('#ollama-model');
    if (backendSelect) backendSelect.value = readAdvisorConfig().backend;
    if (ollamaModel) ollamaModel.value = readAdvisorConfig().ollamaModel ?? 'gemma3:1b';
    ollamaModel?.addEventListener('change', () => saveAdvisorConfig({ ...readAdvisorConfig(), ollamaModel: ollamaModel.value }));
    const hardware = this.root.querySelector<HTMLElement>('#advisor-hardware');
    if (hardware) hardware.textContent = CouncilAdvisor.isWebGpuAvailable()
      ? 'WebGPU erkannt. Das Modell wird erst auf ausdrücklichen Wunsch geladen.'
      : 'WebGPU hier nicht verfügbar. Das integrierte Mininetz arbeitet trotzdem offline.';
    const updateModelUi = (): void => {
      const webgpu = backendSelect?.value === 'webgpu';
      const state = this.councilAdvisor.getStatus();
      if (status) status.textContent = state.message;
      if (progressBar) progressBar.value = state.percent;
      if (startButton) {
        startButton.disabled = !webgpu || !CouncilAdvisor.isWebGpuAvailable() || state.state === 'loading';
        startButton.textContent = state.state === 'ready' ? '✓ KI-Modell bereit' : '▶ KI-Modell starten';
      }
      if (inferenceButton) inferenceButton.disabled = !webgpu || state.state !== 'ready';
    };
    this.root.querySelector('#settings-open')?.addEventListener('click', () => { updateModelUi(); settingsDialog?.showModal(); });
    for (const id of ['#settings-close', '#settings-done']) this.root.querySelector(id)?.addEventListener('click', () => settingsDialog?.close());
    settingsDialog?.addEventListener('click', e => { if (e.target === settingsDialog) settingsDialog.close(); });
    backendSelect?.addEventListener('change', () => {
      const backend = backendSelect.value as AdvisorBackend;
      saveAdvisorConfig({ ...readAdvisorConfig(), backend });
      if (inferenceResult) inferenceResult.textContent = '';
      updateModelUi();
    });
    this.root.querySelector('#advisor-test')?.addEventListener('click', () => {
      if (hardware) hardware.textContent = 'Grafikadapter wird überprüft …';
      void (async () => {
        if (!CouncilAdvisor.isWebGpuAvailable()) {
          if (hardware) hardware.textContent = '✕ WebGPU fehlt. HTTPS, Browser und Hardware-Beschleunigung kontrollieren.';
          return;
        }
        try {
          const gpu = (navigator as Navigator & {gpu?: {requestAdapter: () => Promise<unknown | null>}}).gpu;
          const adapter = await gpu?.requestAdapter();
          if (hardware) hardware.textContent = adapter
            ? '✓ WebGPU-Grafikadapter gefunden. Der Modellstart kann jetzt getestet werden.'
            : '✕ WebGPU ist vorhanden, aber kein geeigneter Grafikadapter verfügbar.';
        } catch (error) {
          if (hardware) hardware.textContent = '✕ WebGPU-Prüfung fehlgeschlagen: ' +
            (error instanceof Error ? error.message : String(error));
        }
      })();
      updateModelUi();
    });
    startButton?.addEventListener('click', () => {
      if (backendSelect?.value !== 'webgpu') return;
      if (inferenceResult) inferenceResult.textContent = '';
      const config = readAdvisorConfig();
      void this.councilAdvisor.loadModel(config, state => {
        if (status) status.textContent = state.message;
        if (progressBar) progressBar.value = state.percent;
        if (startButton) startButton.disabled = state.state === 'loading';
        if (state.state === 'ready' || state.state === 'error') updateModelUi();
      }).then(() => updateModelUi()).catch(error => {
        if (status) status.textContent = 'KI-Modell konnte nicht geladen werden: ' + (error instanceof Error ? error.message : String(error));
        updateModelUi();
      });
      updateModelUi();
    });
    inferenceButton?.addEventListener('click', () => {
      inferenceButton.disabled = true;
      if (inferenceResult) inferenceResult.textContent = 'Modell arbeitet – Testfrage wird beantwortet …';
      void this.councilAdvisor.testInference(readAdvisorConfig())
        .then(answer => { if (inferenceResult) inferenceResult.textContent = '✓ Modell antwortet: ' + answer; })
        .catch(error => { if (inferenceResult) inferenceResult.textContent = '✕ Inferenz fehlgeschlagen: ' + (error instanceof Error ? error.message : String(error)); })
        .finally(updateModelUi);
    });
    updateModelUi();
    const volume = this.root.querySelector<HTMLInputElement>('#setting-music-volume');
    if (volume) {
      volume.value = String(Math.round(this.jukebox.getVolume() * 100));
      volume.addEventListener('input', () => this.jukebox.setVolume(Number(volume.value) / 100));
    }
    const motionSetting = this.root.querySelector<HTMLInputElement>('#setting-motion');
    if (motionSetting) {
      motionSetting.checked = this.motionEnabled;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        motionSetting.disabled = true;
        motionSetting.checked = false;
        this.motionEnabled = false;
        const hint = this.root.querySelector<HTMLElement>('#setting-motion-hint');
        if (hint) hint.textContent = 'Reduzierte Bewegung ist im Betriebssystem aktiviert.';
      }
      motionSetting.addEventListener('change', () => {
        this.motionEnabled = motionSetting.checked;
        this.map?.setMotion(this.motionEnabled);
        this.saveDisplayPreferences();
      });
    }
    this.root.querySelector('#music-diagnose')?.addEventListener('click', () => {
      const output = this.root.querySelector<HTMLElement>('#music-diagnosis');
      void this.jukebox.diagnoseTracks((done,total,title) => {
        if (output) output.textContent = 'Prüfung ' + done + '/' + total + ': ' + title;
      }).then(errors => {
        if (output) output.textContent = errors.length ? errors.join(' | ') : '✓ Alle 15 MP3-Dateien sind erreichbar und besitzen einen MP3-Header.';
      }).catch(error => { if (output) output.textContent = String(error); });
    });
    this.root.querySelector('#offline-save')?.addEventListener('click', () => {
      const output = this.root.querySelector<HTMLElement>('#offline-status');
      const button = this.root.querySelector<HTMLButtonElement>('#offline-save');
      if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        if (output) output.textContent = 'Offline-Installation benötigt HTTPS oder localhost.';
        return;
      }
      if (button) button.disabled = true;
      void navigator.serviceWorker.ready.then(registration => {
        const worker = registration.active;
        if (!worker) throw new Error('Offline-Dienst noch nicht bereit. Seite neu laden.');
        const channel = new MessageChannel();
        channel.port1.onmessage = (event: MessageEvent) => {
          const data = event.data as { type: string; done?: number; total?: number; file?: string; message?: string };
          if (data.type === 'PROGRESS' && output)
            output.textContent = 'Speichere ' + data.done + '/' + data.total + ': ' + data.file;
          if (data.type === 'DONE') {
            if (output) output.textContent = '✓ Spiel und Medien in diesem Browser gespeichert. Offline-Test über Flugmodus durchführen.';
            if (button) button.disabled = false;
            channel.port1.close();
          }
          if (data.type === 'ERROR') {
            if (output) output.textContent = '✕ Offline-Speicherung fehlgeschlagen: ' + data.message;
            if (button) button.disabled = false;
            channel.port1.close();
          }
        };
        worker.postMessage({ type: 'DOWNLOAD' }, [channel.port2]);
      }).catch(error => {
        if (output) output.textContent = '✕ ' + String(error);
        if (button) button.disabled = false;
      });
    });
    this.bindFilmSettings();
  }

  private saveDisplayPreferences(): void {
    try {
      localStorage.setItem('kaiser-display-settings', JSON.stringify({ motion: this.motionEnabled, mapStyle: this.mapStyle, showJourneyGuide:this.showJourneyGuide }));
    } catch { /* Storage may be blocked: session settings still apply. */ }
  }

  private loadDisplayPreferences(): void {
    try {
      const raw = localStorage.getItem('kaiser-display-settings');
      if (!raw) return;
      const stored: unknown = JSON.parse(raw);
      if (!stored || typeof stored !== 'object') return;
      const value = stored as { motion?: unknown; mapStyle?: unknown; showJourneyGuide?:unknown };
      if(typeof value.showJourneyGuide==='boolean')this.showJourneyGuide=value.showJourneyGuide;
      if (typeof value.motion === 'boolean') this.motionEnabled = value.motion;
      if (value.mapStyle === 'flat' || value.mapStyle === 'isometric') this.mapStyle = value.mapStyle;
    } catch { /* Invalid or disabled storage cannot prevent starting the game. */ }
  }

  private showMenu(): void {
    this.root.innerHTML = `
      <main class="welcome">
        <div class="intro-overlay" id="intro-overlay" aria-label="Filmischer Spieleinstieg">
          <div class="production-card" id="production-card"><span class="production-sigil">♜</span><strong>Eine Thomas Heisig Produktion</strong><small>KAISER VON DEUTSCHLAND</small></div><video id="intro-video" playsinline preload="auto" poster="${MAIN_THEME.coverUrl}"><source src="${import.meta.env.BASE_URL}video/intro-original.mp4" type="video/mp4"></video>
          <button type="button" id="intro-activation" class="intro-activation" hidden>▶ Intro mit Ton starten</button>
          <div class="intro-caption"><span>KAISER VON DEUTSCHLAND</span><p>Die Geschichte beginnt</p></div>
          <button type="button" id="intro-skip" class="intro-skip">Intro überspringen →</button>
        </div>
        <div class="welcome-art" aria-hidden="true">
          <div class="seal" data-presentation-tool>✒</div><div class="horizon"></div>
          <span class="welcome-era" data-presentation-desk>Schreibstube</span>
          <p>Ein Land. Deine Entscheidungen.<br>Eine Geschichte, die du schreibst.</p>
        </div>
        <section class="welcome-content" aria-labelledby="game-title">
          <p class="eyebrow">DIE KÖNIGREICHSSIMULATION</p>
          <h1 id="game-title">Kaiser von<br><em>Deutschland</em></h1>
          <p class="lead" data-presentation-intro>Aus einem kleinen Lehen wird ein blühendes Reich.
            Sorge für dein Volk, lenke den Handel und baue deine Herrschaft auf.</p>
          <div class="scenario"><span class="scenario-icon">♜</span><div>
            <strong id="start-era-summary">Mittelalter · 1200</strong>
            <p id="start-campaign-summary">Wähle Kampagne und Startzeit. Die Welt wächst mit deinem Reich.</p>
          </div></div>
          <div class="opening-music" id="opening-music" aria-live="polite"><img src="${MAIN_THEME.coverUrl}" alt="Cover Ancient Veil"><span id="opening-music-label">♫ Ancient Veil · Hauptthema nach dem Intro</span><button type="button" id="opening-toggle" class="opening-toggle" aria-label="Musik pausieren">Ⅱ Pause</button></div>
          <form id="new-game">
            <label>Startepoche<select name="startYear" id="start-year">
              ${[2000,1500,1200,800,753,490,480,447,431,371,338,336,333,331,323,216,202,44,31,27,15,1].map(year => `<option value="${bce(year)}">${year} v. Chr. · ${year > 800 ? 'Bronzezeit' : 'Antike'}</option>`).join('')}
              ${[1,9,14,60,66,70,500,800,1000].map(year => `<option value="${year}">${formatYear(year)} · ${year < 500 ? 'Antike' : 'Frühes Mittelalter'}</option>`).join('')}
              <option value="1200" selected>1200 · Hochmittelalter</option>
              <option value="1300">1300 · Spätmittelalter</option>
              <option value="1400">1400 · Frühe Renaissance</option>
              <option value="1500">1500 · Renaissance</option>
              <option value="1600">1600 · Frühe Neuzeit</option>
              <option value="1750">1750 · Aufklärung</option>
              <option value="1820">1820 · Industriezeitalter</option>
              <option value="1890">1890 · Späte Industrialisierung</option>
              <option value="1945">1945 · Krieg und Nachkriegszeit</option>
              <option value="1970">1970 · Moderne</option>
              <option value="2000">2000 · Digitalzeitalter</option>
            </select></label>
            <label>Kampagne<select name="campaign" id="campaign-select">
              ${CAMPAIGNS.map((entry) => `<option value="${entry.id}">${escape(entry.name)} – ${escape(entry.description)}</option>`).join('')}
            </select></label>
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
            <label class="checkbox"><input type="checkbox" name="tutorial" id="tutorial-toggle" checked> Interaktives Tutorial (Bauen · Handeln · Forschen · Reichsrat · Speichern)</label>
            <button type="submit" class="primary wide">Herrschaft beginnen <span>→</span></button>
          </form>
          <div class="continue-row"><button type="button" id="settings-open" class="secondary" aria-haspopup="dialog">⚙ Einstellungen öffnen</button><span>Anzeige, Musik, Filme, KI und Installation</span></div>
          <div class="continue-row"><button id="continue" class="secondary">Spielstand fortsetzen</button>
            <span>Lokaler Spielstand im Browser</span></div>
          <p class="menu-note">ATLAS · Ausgabe 24.10.2026</p>
          <p class="menu-note">Startet pausiert · Ohne Anmeldung · Hotseat: alle Spieler an einem Gerät, Zug um Zug</p>
          <p id="notice" role="status" aria-live="polite"></p>
        </section>
        ${this.settingsDialogMarkup()}
        ${this.filmDialogMarkup()}
      </main>`;
    this.bindSettingsControls();
    this.bindIntro();
    const form = this.root.querySelector<HTMLFormElement>('#new-game');
    if (form) {
      const pagination = document.createElement('div');
      pagination.className = 'menu-pagination';
      pagination.innerHTML = '<button type="button" aria-label="Vorherige Einstellungen">←</button><span>1 · Welt & Epoche</span><button type="button" aria-label="Weitere Einstellungen">Weiter →</button>';
      form.before(pagination);
      let page = 0;
      const showPage = () => {
        const items = Array.from(form.children).filter((el): el is HTMLElement => el instanceof HTMLElement && (el.tagName === 'LABEL' || el.tagName === 'FIELDSET'));
        const available = items.filter(el => !(el instanceof HTMLFieldSetElement && el.disabled));
        page = Math.max(0, Math.min(page, Math.ceil(available.length / 2) - 1));
        items.forEach(el => { el.hidden = true; });
        available.slice(page * 2, page * 2 + 2).forEach(el => { el.hidden = false; });
        pagination.querySelector('span')!.textContent = `${page + 1} / ${Math.ceil(available.length / 2)} · ${page === 0 ? 'Welt & Epoche' : 'Deine Herrschaft'}`;
        const buttons = pagination.querySelectorAll('button');
        buttons[0].disabled = page === 0;
        buttons[1].disabled = (page + 1) * 2 >= available.length;
      };
      const buttons = pagination.querySelectorAll('button');
      buttons[0].onclick = () => { page--; showPage(); };
      buttons[1].onclick = () => { page++; showPage(); };
      form.addEventListener('change', () => queueMicrotask(showPage));
      form.addEventListener('invalid', event => {
        const target = event.target as HTMLElement;
        const available = Array.from(form.children).filter(el => (el.tagName === 'LABEL' || el.tagName === 'FIELDSET') && !(el instanceof HTMLFieldSetElement && el.disabled));
        const index = available.findIndex(el => el.contains(target));
        if (index >= 0) { page = Math.floor(index / 2); showPage(); }
      }, true);
      showPage();
    }
    void this.refreshCinematicClips();
    this.root.querySelector('#opening-toggle')?.addEventListener('click', () => void this.toggleOpeningMusic());
    const campaignSelect = this.root.querySelector<HTMLSelectElement>('#campaign-select');
    const startYearSelect = this.root.querySelector<HTMLSelectElement>('#start-year');
    const updateStartSummary = (): void => {
      const year = Number(startYearSelect?.value ?? 1200);
      this.applyEraPresentation(year);
      const available = campaignsForYear(year);
      if (campaignSelect) {
        const current = campaignSelect.value;
        campaignSelect.replaceChildren(...available.map(campaign => {
          const option = document.createElement('option');
          option.value = campaign.id;
          option.textContent = campaign.name + ' – ' + campaign.description;
          return option;
        }));
        campaignSelect.value = available.some(campaign => campaign.id === current) ? current : (available.find(campaign => campaign.id !== 'frei')?.id ?? 'frei');
      }
      const campaign = CAMPAIGNS.find(c => c.id === campaignSelect?.value) ?? CAMPAIGNS[0];
      const yearText = startYearSelect?.selectedOptions[0]?.textContent ?? '1200 · Mittelalter';
      const header = this.root.querySelector('#start-era-summary');
      const info = this.root.querySelector('#start-campaign-summary');
      if (header) header.textContent = yearText;
      if (info) info.textContent = 'Startgebiet: ' + localPlaceName(year) + ' · heutiges Niedersachsen. ' + campaign.name + ': ' + campaign.description;
    };
    campaignSelect?.addEventListener('change', updateStartSummary);
    startYearSelect?.addEventListener('change', updateStartSummary);
    updateStartSummary();
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
        await this.createGame(players, Number(data.get('difficulty')), data.has('events'), String(data.get('campaign') ?? 'aufbau') as CampaignId, Number(data.get('startYear') ?? 1200), data.has('tutorial'));
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
        this.journal = this.engine.getChronicle();
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
    window.clearTimeout(this.actionBannerTimer);
    this.map?.dispose();
    this.map = undefined;
    this.cancelCouncilSelectionTimer();
    this.councilDialog?.close();
    this.councilDialog?.remove();
    this.councilDialog = undefined;
    this.engine = engine;
    this.player = undefined;
  }

  private async createGame(players: NewPlayer[], difficulty: number, randomEvents: boolean, campaignId: CampaignId = 'aufbau', startingYear = 1200, enableTutorial = false): Promise<void> {
    await this.replaceEngine(new GameEngine({
      startingYear, difficulty, gameSpeed: 0.25, randomEvents, campaignId, enableWiki: false, enableTutorial
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
          <div class="realm-heading"><strong id="realm-name"></strong><span id="ruler-name"></span><small id="ruler-dignity" class="ruler-dignity"></small></div>
          <div class="header-actions"><button type="button" id="briefing-open" aria-haspopup="dialog">Auftrag</button>
            <button type="button" id="epoch-info-toggle" class="epoch-info-button" aria-haspopup="dialog" aria-label="Informationen zur Epoche"><span id="music-era-label">Jahr 1200</span> ⓘ</button>
            <button type="button" id="settings-open" class="secondary" aria-haspopup="dialog">⚙ Einstellungen</button>
            <button data-action="save" class="secondary">Speichern</button>
            <button data-action="load" class="secondary">Laden</button><button data-action="exit" class="secondary" title="Zum Hauptmenü zurück">Beenden</button></div>
        </header>
        <details class="game-music-settings" id="game-music-settings"><summary>🎼 Original-Soundtrack & Titelcover</summary>
        <section class="jukebox jukebox-ingame" aria-label="Musik-Jukebox">
          <strong>🎼 Original-Soundtrack · ${this.jukebox.getTracks().length} Titel</strong><select data-jukebox-select aria-label="Musiktitel wählen"></select>
          <div class="jukebox-nowplaying"><img data-jukebox-cover src="${MAIN_THEME.coverUrl}" alt="Aktuelles Titelcover"><div><strong data-jukebox-title>Original-Soundtrack</strong><small data-jukebox-description>${this.jukebox.getTracks().length} historische und thematische Aufnahmen</small></div></div>
          <div class="playlist-toolbar"><label>Wiedergabe <select id="playlist-mode"><option value="era">Nach Epoche</option><option value="sequential">Reihenfolge</option><option value="shuffle">Zufällig</option></select></label><label>Wiederholen <select id="playlist-repeat"><option value="all">Alle</option><option value="one">Titel</option><option value="off">Aus</option></select></label></div>
          <details class="playlist-covers"><summary>Alle ${this.jukebox.getTracks().length} Titelcover anzeigen</summary><div class="jukebox-gallery" data-jukebox-gallery aria-label="Alle Titelcover"></div><div class="cover-pagination"><button type="button" data-cover-page="-1" aria-label="Vorherige Cover">←</button><span data-cover-page-label>1 / 5</span><button type="button" data-cover-page="1" aria-label="Weitere Cover">→</button></div></details>
          <a data-jukebox-download class="jukebox-download" href="#" download>↓ Titel herunterladen</a>
          <p data-jukebox-status role="status"></p>
        </section></details>
        <section class="resource-bar" aria-label="Ressourcen und monatliche Änderung">
          ${(['gold', 'food', 'wood', 'stone', 'iron'] as const).map((key: MarketResource | 'gold') => `
            <div class="resource"><span class="resource-symbol" aria-hidden="true">${
              { gold: '◈', food: '♧', wood: '♠', stone: '◆', iron: '⬡' }[key]}</span>
              <div><span>${RESOURCE_NAMES[key]}</span><strong id="resource-${key}">0</strong></div>
              <small id="delta-${key}"></small></div>`).join('')}
          <div class="realm-status-strip" aria-label="Reichszustand auf einen Blick">
            <button type="button" data-status-open><span>Bevölkerung</span><strong id="hud-population"></strong></button>
            <button type="button" data-status-open><span>Zufriedenheit</span><strong id="hud-happiness"></strong></button>
            <button type="button" data-status-open><span>Stabilität</span><strong id="hud-stability"></strong></button>
            <button type="button" data-status-open><span>Nahrung reicht</span><strong id="hud-reserves"></strong></button>
          </div>
        </section>
        <div class="game-layout">
            <section class="map-card" aria-label="Interaktive Siedlungsübersicht mit angrenzenden Reichen">
              <div id="kingdom-map" class="map-host" role="group" aria-label="Zentrierte Siedlungskarte – Gebäude auf der Karte auswählen"></div>
              ${deskMarkup()}
              <div class="atlas-navigation" aria-label="Kartenebene wählen">
                <button type="button" data-map-level="schreibtisch">01 · Schreibtisch</button>
                <button type="button" data-map-level="zentraleuropa">02 · Landkarte</button>
                <button type="button" data-map-level="dorf">03 · Siedlung</button>
                <button type="button" id="local-map-info" aria-label="Ganderkesee: Ortsgeschichte und Kartenquellen">ⓘ</button>
              </div>
              <div class="map-hud" aria-label="Kartenwerkzeuge">
                <div class="map-hud-top">
                  <div class="map-heading"><span class="eyebrow" data-presentation-realm>DEIN LEHEN</span><h2>Ganderkesee</h2>
                    <span id="settlement-season"></span></div>
                  <div class="settlement-controls" aria-label="Kartendarstellung und Bezirksfilter">
                    <label>Weltkarte <select id="map-scope" aria-label="Heimat oder Weltkarte wählen">
                      <option value="home">Ganderkesee · Heimat</option>
                      <option value="world">Welt · Nachbarreiche</option>
                    </select></label>
                    <label>Kartenansicht <select id="map-style" aria-label="Kartenansicht wählen">
                      <option value="flat">2D · Draufsicht</option>
                      <option value="isometric">3D-Look · isometrisch</option>
                    </select></label>
                    <label>Bezirke <select id="settlement-filter" aria-label="Bezirke filtern">
                      <option value="alle">Alle 16 Bezirke</option>
                      <option value="versorgung">Versorgung</option><option value="stadt">Stadt</option>
                      <option value="bildung">Bildung</option><option value="wehr">Verteidigung</option>
                    </select></label>
                  </div>
                </div>
                <div class="map-hud-bottom">
                  <div id="settlement-details" class="settlement-details" role="status" aria-live="polite"></div>
                  <div class="map-tools" role="group" aria-label="Karte bewegen, zoomen und zentrieren">
                    <button type="button" data-zoom="-0.2" aria-label="Karte verkleinern">−</button>
                    <button type="button" data-zoom="0" aria-label="Karte zentrieren">⌖ Zentrieren</button>
                    <button type="button" data-zoom="0.2" aria-label="Karte vergrößern">+</button>
                    <label class="zoom-slider" id="zoom-slider-wrap" hidden>
                      <span class="zoom-slider-label" id="zoom-level-label">Ebene: Dorf</span>
                      <input type="range" id="zoom-slider" min="0" max="100" step="2" value="100"
                        aria-label="Kartenzoom: Schreibtisch, Landkarte und Siedlung" aria-describedby="zoom-hint">
                      <span id="zoom-hint" class="zoom-hint" role="status" aria-live="polite"></span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          <aside class="sidebar">
            <label class="compact-navigation">Verwaltung<select id="view-select" aria-label="Spielbereich wählen"><option value="" disabled selected>Bereich wählen …</option></select></label>
            <p class="eyebrow nav-label">DEINE HERRSCHAFT</p>
            <nav aria-label="Spielbereiche">
              ${([
                ['overview', '◈', 'Reichsübersicht'], ['civic', '⚒', 'Bürgeraufträge'], ['court', '♟', 'Hofverwaltung'], ['council', '♛', 'Reichsrat'], ['build', '♜', 'Bauvorhaben'],
                ['economy', '⚖', 'Wirtschaft'], ['research', '✧', 'Forschung'], ['modernization', '⚙', 'Modernisierung'], ['military', '⚑', 'Garnison'],
                ['war', '⚔', 'Feldzüge'], ['intelligence', '◉', 'Geheimdienst'], ['world', '☼', 'Welt & Volk'], ['culture', '♫', 'Kultur & Feste'], ['diplomacy', '✉', 'Diplomatie'], ['character', '♙', 'Charakter'],
                ['chronicle', '▤', 'Chronik'], ['history', '⌛', 'Weltgeschichte'], ['help', '?', 'Spielhilfe']
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
              <div><p class="eyebrow"><span id="era-label">MITTELALTER · ALTERNATIVE GESCHICHTE</span></p>
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
            <div id="game-action-banner" role="status" aria-live="polite" hidden></div>
            <button id="council-prompt" data-view="council" class="council-alert" hidden></button>
            <section id="panel" class="content-panel" aria-label="Verwaltung"></section>
          </main>
          <aside class="realm-report" aria-label="Lagebericht" data-report-tab="news">
            <div class="report-heading"><strong>Lagebericht</strong><span id="report-date"></span></div>
            <div class="report-tabs" aria-label="Informationen auswählen">
              <button type="button" data-report-tab="news" aria-pressed="true">Meldungen</button>
              <button type="button" data-report-tab="tutorial" aria-pressed="false">Tutorial</button>
              <button type="button" data-report-tab="history" aria-pressed="false">Geschichte</button>
            </div>
            <section class="report-card" data-report-card="news" aria-label="Was ist passiert?">
              <div class="report-news-heading"><h2>Was ist passiert?</h2><label class="sr-only" for="news-filter">Meldungen filtern</label><select id="news-filter"><option value="important">Wichtig</option><option value="all">Alle</option><option value="finance">Kasse</option></select></div><small id="report-news-date"></small>
              <div id="report-news" class="message-content" tabindex="0" aria-label="Aktuelle Meldung vollständig lesen"></div>
              <div class="report-actions"><button type="button" id="report-previous" aria-label="Neuere Meldung">←</button><span id="report-count"></span><button type="button" id="report-next" aria-label="Ältere Meldung">→</button><button type="button" data-view="chronicle">Chronik öffnen</button></div>
            </section>
            <section class="report-card" data-report-card="tutorial" aria-label="Dein nächster Schritt">
              <button type="button" id="hide-journey-guide" aria-label="Spielbegleitung ausblenden">Ausblenden ×</button><h2 id="report-tutorial-title">Dein nächster Schritt</h2><p id="report-tutorial-text"></p>
              <div class="report-actions"><button type="button" id="report-tutorial-go" class="primary">Schritt starten →</button><button type="button" data-view="help">Spielhilfe</button></div>
            </section>
            <section class="report-card" data-report-card="history" aria-label="Wahre Jahresgeschichte">
              <h2 id="report-history-year"></h2><small id="report-history-context"></small><p id="report-history-text"></p>
              <div class="report-actions"><a id="report-history-source" target="_blank" rel="noopener noreferrer">Quelle ↗</a><button type="button" data-view="history">Mehr Geschichte</button></div>
            </section>
            <label class="council-auto"><input type="checkbox" data-council-auto> Ereignisse automatisch entscheiden</label>
          </aside>
          <aside class="council">
            <section class="council-card tutorial-card" id="tutorial-card" hidden aria-label="Interaktives Tutorial">
              <p class="eyebrow">DEIN TUTORIAL</p>
              <h2 id="tutorial-step-title">Deine ersten Schritte</h2>
              <p id="tutorial-step-description" class="muted"></p>
              <progress id="tutorial-progress" max="5" aria-label="Tutorial-Fortschritt"></progress>
              <p id="tutorial-help" class="tutorial-help" hidden></p>
              <div class="tutorial-actions">
                <button id="tutorial-go" class="primary">Los geht’s →</button>
                <button id="tutorial-skip" class="secondary">Überspringen</button>
              </div>
            </section>
            <section class="council-card"><p class="eyebrow">DER REICHSRAT</p><h2>Ein weiser Rat</h2>
              <div class="advisor-seal" aria-hidden="true">♙</div><p id="advice"></p>
              <button data-view="economy" class="text-button">Zur Monatsbilanz →</button></section>
            <section class="council-card"><p class="eyebrow">DEIN AUFTRAG</p><h2>Ein blühendes Reich</h2>
              <p class="muted">Erfülle alle Ziele gleichzeitig. Ohne Zeitlimit.</p>
              <p class="eyebrow" id="campaign-title"></p><p class="muted" id="campaign-story"></p><div id="objectives"></div><progress id="goal-progress" max="6" aria-label="Kampagnenfortschritt"></progress>
              <p id="goal-status"></p></section>
            <section class="council-card latest"><p class="eyebrow">NEUESTES AUS DEM REICH</p>
              <div id="latest"></div><button data-view="chronicle" class="text-button">Chronik öffnen →</button></section>
          </aside>
        </div>
        <footer class="game-footer">© 2026 Thomas Heisig · Kaiser von Deutschland · <button type="button" id="legal-open" class="legal-link">Urheberrecht · KI · Datenschutz</button><span id="footer-keys"></span></footer>
        <dialog id="briefing-dialog" class="section-dialog" aria-label="Auftrag und Reichszustand"><div class="section-dialog-head"><strong>Auftrag & Reichszustand</strong><button type="button" data-close-dialog="briefing-dialog" aria-label="Auftrag schließen">✕</button></div><div id="briefing-body" class="paged-body"></div><div class="panel-pagination"><button type="button" data-page-step="-1">← Zurück</button><span>Auftrag & Rat</span><button type="button" data-page-step="1">Weiter →</button></div></dialog><dialog id="section-dialog" class="section-dialog" aria-label="Spielbereich"><div class="section-dialog-head"><strong id="section-dialog-title">Verwaltung</strong><button type="button" id="section-dialog-close" aria-label="Bereich schließen">✕</button></div><div id="section-dialog-body"></div><div class="panel-pagination"><button type="button" id="panel-prev" aria-label="Vorherige Seite">← Zurück</button><span id="panel-page" role="status">Seite 1</span><button type="button" id="panel-next" aria-label="Nächste Seite">Weiter →</button></div></dialog>
        ${this.settingsDialogMarkup()}
        ${this.filmDialogMarkup()}
         <dialog id="epoch-dialog" class="info-dialog" aria-labelledby="epoch-title"><h2 id="epoch-title">Epoche</h2><p id="epoch-description"></p><p class="muted">Historische Einordnung; alternative Geschichte.</p><button type="button" data-close-dialog="epoch-dialog">Schließen</button></dialog>
        <dialog id="legal-dialog" class="info-dialog" aria-labelledby="legal-title"><h2 id="legal-title">Impressum, Urheberrecht und KI</h2><p><strong>Projekt:</strong> Thomas Heisig · Kaiser von Deutschland.</p><p><strong>Kartografie:</strong> Natural Earth II und Natural Earth Rivers, Public Domain. Vereinfachte heutige Landschaft; historische Ortsbezüge ohne rekonstruierte Staatsgrenzen.</p><p><strong>Software:</strong> MIT-Lizenz gemäß LICENSE. Rechte Dritter bleiben unberührt.</p><p><strong>Musik und Videos:</strong> Eigene Projektmedien mit gesonderten Nutzungsrechten. Die MIT-Softwarelizenz gilt nicht pauschal für die Medien.</p><p><strong>KI:</strong> KI-gestützte Werkzeuge wurden bei der Programmierung, Musik- und Bildgestaltung verwendet. Konkrete Titelcredits sind noch zu ergänzen.</p><p><strong>Datenschutz:</strong> Spielstände und eigene Audioimporte werden lokal im Browser gespeichert; Webhosting kann technische Zugriffslogs verarbeiten.</p><p><strong>Verantwortlich:</strong> Thomas Heisig. Vollständige Impressums- und Kontaktangaben müssen vor einer öffentlichen Veröffentlichung ergänzt werden.</p><button type="button" data-close-dialog="legal-dialog">Schließen</button></dialog>
      </div>`;
    this.bindJukeboxControls();
    const navigation = this.root.querySelector<HTMLSelectElement>('#view-select');
    this.root.querySelectorAll<HTMLButtonElement>('.sidebar nav [data-view]').forEach(button => {
      const option = document.createElement('option');
      option.value = button.dataset.view ?? 'overview';
      option.textContent = button.textContent;
      navigation?.append(option);
    });
    navigation?.addEventListener('change', () => this.navigate(navigation.value as View));
    this.root.querySelectorAll<HTMLButtonElement>('[data-map-level]').forEach(button => {
      button.addEventListener('click', () => {
        this.map?.setZoomSlider(button.dataset.mapLevel === 'schreibtisch' ? 0 : button.dataset.mapLevel === 'zentraleuropa' ? 28 : 40);
        this.updateZoomHint();
      });
    });
    const musicPanel=this.root.querySelector('#game-music-settings');
    if(musicPanel)this.root.querySelector('.header-actions')?.append(musicPanel);
    const showLocalHistory = (): void => { this.historyTopic='local'; this.navigate('history'); };
    this.root.querySelector('#local-map-info')?.addEventListener('click',showLocalHistory);
    for (const [id, direction] of [['panel-prev', -1], ['panel-next', 1]] as const) {
      this.root.querySelector('#' + id)?.addEventListener('click', () => {
        const body = this.root.querySelector<HTMLElement>('#section-dialog-body');
        if (!body) return;
        body.scrollTop += direction * Math.max(1, body.clientHeight - 64);
        this.updatePanelPagination();
      });
    }
    const briefing = this.root.querySelector<HTMLDialogElement>('#briefing-dialog');
    const briefingBody = this.root.querySelector<HTMLElement>('#briefing-body');
    const council = this.root.querySelector<HTMLElement>('.game-layout>.council');
    const health = this.root.querySelector<HTMLElement>('.realm-health');
    if (briefingBody && council && health) briefingBody.append(health, council);
    this.root.querySelector('#briefing-open')?.addEventListener('click', () => briefing?.showModal());
    this.root.querySelectorAll('[data-status-open]').forEach(button => button.addEventListener('click', () => briefing?.showModal()));
    briefing?.querySelectorAll<HTMLButtonElement>('[data-page-step]').forEach(button => {
      button.onclick = () => { if (briefingBody) briefingBody.scrollTop += Number(button.dataset.pageStep) * Math.max(1, briefingBody.clientHeight - 48); };
    });
    this.bindTutorialControls();
    this.root.querySelectorAll<HTMLButtonElement>('.report-tabs button').forEach(button => {
      button.onclick = () => {
        this.root.querySelector<HTMLElement>('.realm-report')!.dataset.reportTab = button.dataset.reportTab;
        this.root.querySelectorAll('.report-tabs button').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
      };
    });
    this.root.querySelector('#hide-journey-guide')?.addEventListener('click',()=>{this.showJourneyGuide=false;this.saveDisplayPreferences();this.renderReport();});
    this.root.querySelector('#news-filter')?.addEventListener('change',event=>{this.newsFilter=(event.target as HTMLSelectElement).value;this.reportIndex=0;this.renderReport();});
    this.root.querySelector('#report-previous')?.addEventListener('click', () => { this.reportIndex--; this.renderReport(); });
    this.root.querySelector('#report-next')?.addEventListener('click', () => { this.reportIndex++; this.renderReport(); });
    this.root.querySelector('#report-tutorial-go')?.addEventListener('click', () => {
      if (this.engine?.getTutorialStep()) this.root.querySelector<HTMLButtonElement>('#tutorial-go')?.click();
      else this.navigate('help');
    });
    this.bindCouncilAutomatic(this.root.querySelector('.realm-report')!);
    this.renderTutorial();
    const sectionDialog = this.root.querySelector<HTMLDialogElement>('#section-dialog');
    sectionDialog?.addEventListener('click', (event) => {
      if (event.target === sectionDialog) sectionDialog.close();
    });
    sectionDialog?.addEventListener('close', () => {
      if (sectionDialog.open) return;
      if (navigation) navigation.value = '';
      const panel = this.root.querySelector<HTMLElement>('#panel');
      const workspace = this.root.querySelector<HTMLElement>('.workspace');
      if (panel && workspace) workspace.append(panel);
      this.view = 'overview';
      this.renderPanel();
      this.root.querySelector('.kingdom-app')?.setAttribute('data-view', 'overview');
    });
    this.root.querySelector('#section-dialog-close')?.addEventListener('click', () => sectionDialog?.close());
    this.root.querySelector<HTMLSelectElement>('#settlement-filter')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      this.districtFilter = target.value as DistrictFilter;
      this.map?.setDistrictFilter(this.districtFilter);
      this.refresh();
    });
    this.root.querySelector('#settlement-details')?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-open-district]')) this.navigate('build');
    });
    const mapScopeSelect = this.root.querySelector<HTMLSelectElement>('#map-scope');
    mapScopeSelect?.addEventListener('change', () => {
      this.map?.setMapScope(mapScopeSelect.value === 'world' ? 'world' : 'home');
      this.updateZoomHint();
    });
    const mapStyleSelect = this.root.querySelector<HTMLSelectElement>('#map-style');
    if (mapStyleSelect) {
      mapStyleSelect.value = this.mapStyle;
      mapStyleSelect.addEventListener('change', () => {
        this.mapStyle = mapStyleSelect.value === 'isometric' ? 'isometric' : 'flat';
        const mapHost = this.root.querySelector<HTMLElement>('#kingdom-map');
        if (mapHost) mapHost.dataset.projection = this.mapStyle;
        this.map?.setProjection(this.mapStyle);
        const setting = this.root.querySelector<HTMLSelectElement>('#setting-map-style');
        if (setting) setting.value = this.mapStyle;
        this.saveDisplayPreferences();
      });
    }
    this.bindSettingsControls();
    this.root.querySelector('#epoch-info-toggle')?.addEventListener('click', () => this.root.querySelector<HTMLDialogElement>('#epoch-dialog')?.showModal());
    this.root.querySelector('#legal-open')?.addEventListener('click', () => this.root.querySelector<HTMLDialogElement>('#legal-dialog')?.showModal());
    this.root.querySelectorAll<HTMLDialogElement>('.info-dialog:not(.settings-dialog)').forEach(dialog => this.paginateInfoDialog(dialog));
    this.root.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach(button => button.addEventListener('click', () => this.root.querySelector<HTMLDialogElement>('#' + button.dataset.closeDialog)?.close()));
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
      button.addEventListener('click', (): void => this.applyZoomStep(Number(button.dataset.zoom)));
    });
    this.bindZoomSlider();
    this.root.querySelector<HTMLSelectElement>('#speed')?.addEventListener('change', (event: Event): void => {
      const target = event.target;
      if (target instanceof HTMLSelectElement) engine.getTimeSystem().setSpeed(Number(target.value));
    });
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions = [
      engine.on('councilDecision', (detail: { playerId: string; title: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        if (!engine.isHotseat() && engine.getGameState() === GameState.RUNNING) this.resumeAfterCouncil = true;
        this.record('Der Reichsrat ruft: ' + detail.title);
        this.audio.playEffect('success');
        this.notify('Dringende Angelegenheit im Reichsrat: ' + detail.title);
        if (!engine.isHotseat()) this.showCouncilDialog();
      }),
      engine.on('councilResolved', (detail: { playerId: string; outcome: { message: string; automatic?: boolean } }): void => {
        if (this.player?.id !== detail.playerId) return;
        if (!detail.outcome.automatic) this.record(detail.outcome.message);
        else this.notify(detail.outcome.message);
        this.reportIndex = 0;
        this.renderReport();
      }),
      engine.on('monthAdvanced', (): void => {
        this.journal=engine.getChronicle().map(entry=>({date:entry.date,message:entry.message}));
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
        this.audio.playEffect('battle');
        if (this.player && detail.report.playerIds.includes(this.player.id)) {
          this.showGameAction(detail.report.kind === 'raid' ? '⚔ Überfall auf dein Reich!' : '⚔ Die Schlacht ist entschieden!', detail.report.summary, 'raid', this.wonBattle(detail.report));
        }
        if (this.player && detail.report.playerIds.includes(this.player.id) && detail.report.kind === 'raid') {
          this.notify(detail.report.summary, !this.wonBattle(detail.report));
        }
      }),
      engine.on('festivalHeld', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id === detail.playerId) {
          this.record(detail.message);
          this.notify(detail.message);
          this.audio.playEffect('success');
        }
      }),
      engine.on('rivalDeveloped', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id === detail.playerId) this.record(detail.message);
      }),
      engine.on('siegeEvent', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        this.record(detail.message);
        this.showGameAction('⚔ Belagerung', detail.message, 'raid');
        this.audio.playEffect('battle');
      }),
      engine.on('borderWatchPrepared', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id === detail.playerId) {
          this.record(detail.message);
          this.showGameAction('⚔ Grenzwache in Bereitschaft', detail.message, 'raid');
          this.audio.playEffect('battle');
        }
      }),
      engine.on('civicMissionEvent',(detail:{playerId:string;message:string}):void=>{
        if(this.player?.id===detail.playerId)this.record(detail.message);
      }),
      engine.on('lifeEvent',(detail:{playerId:string;message:string}):void=>{
        if(this.player?.id!==detail.playerId)return;
        this.journal=engine.getChronicle();this.notify(detail.message);
      }),
      engine.on('regionalProvisioning',(detail:{playerId:string;message:string}):void=>{
        if(this.player?.id!==detail.playerId)return;
        this.journal=engine.getChronicle();this.notify(detail.message);
      }),
      engine.on('naturalDisaster',(detail:{playerId:string;message:string}):void=>{
        if(this.player?.id!==detail.playerId)return;
        this.journal=engine.getChronicle();this.notify(detail.message);
        this.showGameAction('Naturereignis',detail.message,'raid');
      }),
      engine.on('courtEvent', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id === detail.playerId) this.record(detail.message);
      }),
      engine.on('financeEvent', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id === detail.playerId) this.record(detail.message);
      }),
      engine.on('espionageEvent', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id === detail.playerId) this.record(detail.message);
      }),
      engine.on('worldEvent', (detail: {playerId:string;message:string}): void => {
        if (this.player?.id === detail.playerId) { this.notify(detail.message); this.renderReport(); }
      }),
      engine.on('diplomacyEvent', (detail: { playerId: string; message: string; recorded?:boolean }): void => {
        if (this.player?.id === detail.playerId) {
          if (!detail.recorded) this.record(detail.message);
          this.notify(detail.message);
        }
      }),
      engine.on('campaignChapterCompleted', (detail: { playerId: string; chapter: string; reward: number; final: boolean }): void => {
        if (this.player?.id !== detail.playerId) return;
        const message = detail.chapter + ' vollendet! +' + format(detail.reward) + ' Gold.';
        this.record(message);
        this.showGameAction(detail.final ? '♛ Kampagne abgeschlossen!' : '♜ Neues Kapitel!', message, 'science');
        this.audio.playEffect('success');
        if (detail.final) {
          this.showCampaignComplete(true);
        }
      }),
      engine.on('campaignDefeat', (detail: { playerId: string; reason: 'bankruptcy' | 'famine' | 'anarchy' }): void => {
        if (this.player?.id !== detail.playerId) return;
        this.showGameAction('☠ Untergang des Reiches', `Dein Reich ist untergegangen: ${detail.reason === 'bankruptcy' ? 'Bankrott' : detail.reason === 'famine' ? 'Hungersnot' : 'Anarchie'}.`, 'raid');
        this.audio.playEffect('battle');
        this.showCampaignComplete(false, detail.reason);
      }),
      engine.on('yearAdvanced', (): void => this.refresh()),
      engine.on('historicalEpochChanged', (detail: { epochName: string; year: number; evidence: string }): void => {
        this.record(`Historische Epoche: ${detail.epochName} (ab ${formatYear(detail.year)}).`);
        this.showGameAction('⌛ Neue historische Epoche', `${detail.epochName} – eingeordnet ab ${formatYear(detail.year)}${
          detail.evidence === 'belegt' ? '' : detail.evidence === 'naeherung' ? ' (Grenzen genähert)' : ' (Grenzen ungeprüft)'}.`, 'science');
        this.refresh();
      }),
      engine.on('projectEvent',(detail:{playerId:string;message:string})=>{if(detail.playerId===this.player?.id){this.journal=engine.getChronicle();this.notify(detail.message);}}),
      engine.on('timeTravelProgress',(detail:{completed:number;total:number})=>{
        const progress=this.root.querySelector<HTMLElement>('#time-travel-progress');if(progress)progress.textContent=detail.completed+' / '+detail.total+' Monate';
      }),
      engine.on('tutorialStarted', (detail: { playerId: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        this.notify('📖 Tutorial gestartet: Führe die fünf Schritte aus, um deine Herrschaft kennenzulernen.');
        this.renderTutorial();
      }),
      engine.on('tutorialStep', (detail: { playerId: string; step: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        const step = engine.getTutorialStep();
        this.record(step ? `Tutorial: Schritt „${detail.step}“ erledigt. Weiter mit „${step.title}“.` : 'Tutorial: Schritt erledigt.');
        this.showGameAction('📖 Tutorial-Fortschritt', step ? `Weiter: ${step.title} – ${step.description}` : 'Alle Schritte erledigt!', 'science');
        this.audio.playEffect('success');
        this.renderTutorial();
      }),
      engine.on('tutorialCompleted', (detail: { playerId: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        this.record('Tutorial abgeschlossen: Bauen, Handeln, Forschen, Reichsrat und Speichern gemeistert.');
        this.showGameAction('📖 Tutorial abgeschlossen', 'Du kennst jetzt die Kernschleife deiner Herrschaft. Viel Erfolg!', 'science');
        this.audio.playEffect('success');
        this.renderTutorial();
      }),
      engine.on('tutorialSkipped', (): void => {
        this.notify('Tutorial übersprungen. Du findest die Spielhilfe jederzeit in der Seitenleiste.');
        this.renderTutorial();
      }),
      engine.on('modernizationCompleted', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        this.record(detail.message);
        this.showGameAction('⚙ Epochenwandel', detail.message, 'science');
        this.audio.playEffect('success');
      }),
      engine.on('exhibitionSponsored', (detail: { playerId: string; message: string }): void => {
        if (this.player?.id !== detail.playerId) return;
        this.record(detail.message);
        this.showGameAction('♫ Kultur gefördert', detail.message, 'science');
      }),
      engine.on('historyMilestone', (detail: { milestone: WorldMilestone }): void => {
        const item = detail.milestone;
        const label = item.speculative ? 'Zukunftsszenario' : item.month ? 'Weltgeschichte' : 'Jahreskontext';
        this.record(label + ' ' + milestoneDate(item) + ': ' + item.title);
        const prefs=filmPreferences();
        const clip=prefs.interludesEnabled?filmForRole(this.cinematicClips,'interlude',prefs):null;
        if(clip)this.showInterlude(clip,formatYear(item.year)+' · '+item.title);
        this.showGameAction('📜 ' + milestoneEvidence(item),
          milestoneDate(item) + ': ' + item.title + ' – ' + item.description, 'science');
      }),
      engine.on('technologyResearched', (detail: { playerId: string; technology: { name: string } }): void => {
        if (this.player?.id !== detail.playerId) return;
        const message = `Forschung abgeschlossen: ${detail.technology.name}.`;
        this.record(message);
        this.notify(message);
        this.showGameAction('✦ Wissenschaftlicher Durchbruch!', message, 'science');
        this.audio.playEffect('success');
      })
    ];
    this.refresh();
    const host = this.root.querySelector<HTMLElement>('#kingdom-map');
    if (host) {
      try {
        const { KingdomMap } = await import('./KingdomMap');
        this.map = new KingdomMap();
        this.regionYear = undefined;
        await this.map.initialize(host, (type: keyof KingdomInfrastructure): void => {
          this.selected = type;
          this.navigate('build');
        }, (rivalId: string): void => {
          this.focusedRivalId = rivalId;
          this.navigate('diplomacy');
        });
        this.map.setMotion(this.motionEnabled);
        this.map.setLandmarkAction(() => { this.historyTopic='local'; this.navigate('history'); });
        this.map.setProjection(this.mapStyle);
        if (isZoomLevelsEnabled()) this.map.setZoomSlider(0);
        this.refresh();
      } catch (error) {
        console.error('Karte konnte nicht gestartet werden:', error);
        this.map?.dispose();
        this.map = undefined;
        host.dataset.fallback = 'true';
        this.renderMapFallback();
        host.addEventListener('click', event => {
          const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-fallback-district]');
          if (!button) return;
          this.selected = button.dataset.fallbackDistrict as keyof KingdomInfrastructure;
          this.navigate('build');
        });
        host.dataset.projection = 'flat';
        this.mapStyle = 'flat';
        const style = this.root.querySelector<HTMLSelectElement>('#map-style');
        if (style) { style.value = 'flat'; style.disabled = true; }
        console.warn('Interaktive 2D-Fallbackansicht verwendet:', error);
      }
    }
    this.restoreCampaignResult();
  }

  private restoreCampaignResult(): void {
    if (!this.engine || !this.player || this.engine.getCampaignId() === 'frei') return;
    const reason = this.engine.getPlayerDefeatReason(this.player.id);
    if (reason) this.showCampaignComplete(false, reason);
    else if (this.engine.getCampaignChapterStatus(this.player.id).finished) this.showCampaignComplete(true);
  }

  /** Browser/WebGL-independent 2D building tiles, backed by actual infrastructure counts. */
  private renderMapFallback(): void {
    const host = this.root.querySelector<HTMLElement>('#kingdom-map');
    if (!host || host.dataset.fallback !== 'true' || !this.player) return;
    host.innerHTML = `<div class="map-fallback" aria-label="2D-Siedlungskarte">
      <strong>${escape(this.engine?.getCurrentEpoch() ?? 'Siedlung')} · 2D-Stadtansicht</strong>
      <div class="fallback-city">${SETTLEMENT_DISTRICTS.map(d => `<button type="button"
        data-fallback-district="${d.type}" title="${escape(d.name)} ausbauen"><span aria-hidden="true">${STRUCTURES[d.type].symbol}</span>
        <span>${escape(earlyBuildingName(d.type, this.engine!.getCurrentYear(), d.name))}</span><strong>${format(this.player!.kingdom.infrastructure[d.type])}</strong></button>`).join('')}</div>
      <p>Jedes Gebäude ist auswählbar und führt zur echten Bauverwaltung.</p></div>`;
  }

  /** Aktualisiert die Tutorial-Karte: aktuellen Schritt, Fortschritt und Hilfe. */
  private bindCouncilAutomatic(container: Element): void {
    container.querySelectorAll<HTMLInputElement>('[data-council-auto]').forEach(input => {
      input.checked = this.engine?.isCouncilAutomatic(this.requirePlayer().id) ?? false;
      input.addEventListener('change', () => void this.run(() => {
        const outcome = this.requireEngine().setCouncilAutomatic(this.requirePlayer().id, input.checked);
        if (outcome) {
          this.councilDialog?.close();
          this.resumeAfterCouncilDecision();
        }
        this.notify(outcome?.message ?? (input.checked
          ? 'Automatik aktiv: bezahlbare Optionen, sichere Folgen zuerst. Jede Entscheidung steht in der Chronik.'
          : 'Automatik aus: Du entscheidest wieder selbst.'));
        this.renderReport();
      }));
    });
  }

  private renderReport(): void {
    if (!this.engine || !this.player || !this.root.querySelector('.realm-report')) return;
    const engine = this.engine;
    const text = (id: string, value: string): void => {
      const element = this.root.querySelector('#' + id);
      if (element && element.textContent !== value) element.textContent = value;
    };
    this.root.querySelectorAll<HTMLElement>('[data-report-card=tutorial],[data-report-tab=tutorial]').forEach(el=>el.hidden=!this.showJourneyGuide);
    const report=this.root.querySelector<HTMLElement>('.realm-report')!;
    report.dataset.guide=String(this.showJourneyGuide);
    if(!this.showJourneyGuide&&report.dataset.reportTab==='tutorial')report.dataset.reportTab='news';
    const allEntries=engine.getChronicle().filter(entry=>!entry.playerId||entry.playerId===this.player!.id);
    const filtered=allEntries.filter(entry=>this.newsFilter==='all'||(this.newsFilter==='finance'?entry.message.startsWith('Kassenabschluss'):!entry.message.startsWith('Kassenabschluss')));
    const entries=filtered.length?filtered:allEntries;
    this.journal = allEntries;
    this.reportIndex = Math.max(0, Math.min(this.reportIndex, entries.length - 1));
    const entry = entries[this.reportIndex];
    text('report-date', this.date());
    text('report-news-date', entry?.date ?? this.date());
    const news = this.root.querySelector('#report-news');
    const newsHtml = journalMessageHtml(entry?.message ?? 'Deine Herrschaft beginnt. Baue die Versorgung auf und prüfe deine Monatsbilanz.');
    if (news && news.innerHTML !== newsHtml) { news.innerHTML = newsHtml; news.scrollTop = 0; }
    text('report-count', entries.length ? `${this.reportIndex + 1}/${entries.length}` : '0/0');
    this.root.querySelector<HTMLButtonElement>('#report-previous')!.disabled = this.reportIndex === 0;
    this.root.querySelector<HTMLButtonElement>('#report-next')!.disabled = this.reportIndex >= entries.length - 1;
    const step = engine.getTutorialStep();
    const progress = engine.getTutorialProgress();
    text('report-tutorial-title', step ? `Tutorial ${progress.done + 1}/${progress.total} · ${step.title}` : 'Dein Weg durch das Spiel');
    text('report-tutorial-text', step?.description ?? 'Bauen → Handeln → Forschen → Entscheiden. Prüfe vor jedem Monatswechsel deine Vorräte. Die Spielhilfe erklärt alle Schritte.');
    text('report-tutorial-go', step ? `Zu „${step.title}“ →` : 'Anleitung öffnen →');
    const year = engine.getCurrentYear();
    const month = engine.getCurrentMonth();
    const history = historicalMonthReport(year, month);
    const event = history.events[0];
    const annual = month === 1 ? history.annual[0] : undefined;
    const knowledge = knowledgeSpotlight(year, month);
    const past = history.past.at(-1);
    const period = history.periods.length ? history.periods[(month - 1) % history.periods.length] : undefined;
    const item = event ?? annual ?? knowledge ?? period ?? past;
    text('report-history-year', `Geschichte · ${MONTHS[month - 1]} ${formatYear(year)}`);
    text('report-history-context', event ? `${milestoneEvidence(event)} · ${milestoneDate(event)}`
      : annual ? `${milestoneEvidence(annual)} · ${milestoneDate(annual)}`
      : knowledge ? `Zeitbild · ${KNOWLEDGE_TOPICS[knowledge.topic]} · kein Monatsereignis`
      : period ? `Zeitraum · ${milestoneDate(period)}`
      : past ? `Kein Monatseintrag. Rückblick: ${milestoneDate(past)}` : 'Kein belegter Monatseintrag im Katalog');
    text('report-history-text', item ? `${item.title}. ${item.description}` : 'Für diesen Zeitraum ist noch kein historischer Eintrag hinterlegt.');
    const source = this.root.querySelector<HTMLAnchorElement>('#report-history-source')!;
    source.hidden = !item;
    if (item) { source.href = item.sourceUrl; source.title = item.sourceTitle; }
    this.root.querySelectorAll<HTMLInputElement>('[data-council-auto]').forEach(input => {
      input.checked = engine.isCouncilAutomatic(this.player!.id);
    });
  }

  private renderTutorial(): void {
    this.renderReport();
    const card = this.root.querySelector<HTMLElement>('#tutorial-card');
    if (!card) return;
    const engine = this.engine;
    const step = engine?.getTutorialStep() ?? null;
    if (!step) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const progress = engine!.getTutorialProgress();
    const title = this.root.querySelector<HTMLElement>('#tutorial-step-title');
    const description = this.root.querySelector<HTMLElement>('#tutorial-step-description');
    const help = this.root.querySelector<HTMLElement>('#tutorial-help');
    const bar = this.root.querySelector<HTMLProgressElement>('#tutorial-progress');
    if (title) title.textContent = `${progress.done + 1} von ${progress.total}: ${step.title}`;
    if (description) description.textContent = step.description;
    if (help) {
      help.hidden = false;
      help.textContent = '💡 ' + step.help;
    }
    if (bar) bar.value = progress.done;
    const goButton = this.root.querySelector<HTMLButtonElement>('#tutorial-go');
    if (goButton) goButton.textContent = `Zu „${step.title}“ →`;
  }

  /** Bindet die Tutorial-Buttons (Navigation zum Schritt und Überspringen). */
  private bindTutorialControls(): void {
    const goButton = this.root.querySelector<HTMLButtonElement>('#tutorial-go');
    const skipButton = this.root.querySelector<HTMLButtonElement>('#tutorial-skip');
    goButton?.addEventListener('click', (): void => {
      const engine = this.requireEngine();
      const step = engine.getTutorialStep();
      if (!step) return;
      if (step.id === 'council') {
        // Stellt sicher, dass eine Ratsangelegenheit offen ist, und öffnet den Rat.
        engine.ensureTutorialCouncil(this.requirePlayer().id);
        if (engine.getPendingCouncilDecision(this.requirePlayer().id)) {
          this.showCouncilDialog();
          return;
        }
      }
      this.navigate(step.view as View);
    });
    skipButton?.addEventListener('click', (): void => {
      this.requireEngine().skipTutorial();
      this.renderTutorial();
    });
  }

  /** Modal choices are bound to the same authoritative council engine as the full panel. */
  private cancelCouncilSelectionTimer(): void {
    window.clearTimeout(this.councilSelectionTimer);
    this.councilSelectionTimer = undefined;
  }

  private showCouncilDialog(): void {
    if (!this.engine || !this.player || this.root.querySelector('.handover')) return;
    const decision = this.engine.getPendingCouncilDecision(this.player.id);
    if (!decision) return;
    this.cancelCouncilSelectionTimer();
    this.councilDialog?.remove();
    const dialog = document.createElement('dialog');
    dialog.className = 'council-modal';
    dialog.setAttribute('aria-label', 'Dringende Entscheidung des Reichsrats');
    const heading = document.createElement('h2');
    heading.textContent = decision.title;
    const story = document.createElement('p');
    story.textContent = decision.story;
    const choices = document.createElement('div');
    choices.className = 'council-modal-choices';
    for (const choice of this.engine.getCouncilChoices(this.player.id)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = !choice.affordable;
      button.textContent = choice.title + ' – ' + choice.description +
        (choice.affordable ? '' : ' (nicht genügend Ressourcen)');
      button.addEventListener('click', () => void this.run(() => {
        const outcome = this.requireEngine().resolveCouncilDecision(this.requirePlayer().id, choice.id);
        this.notify(outcome.message, !outcome.success);
        this.resumeAfterCouncilDecision();
        dialog.close();
        dialog.remove();
        this.councilDialog = undefined;
        this.audio.playEffect(outcome.success ? 'success' : 'battle');
      }));
      choices.append(button);
    }
    const delegation = document.createElement('div');
    delegation.className = 'council-delegation';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Bürger für Ratsentscheidung');
    const empty = document.createElement('option');
    empty.value = ''; empty.textContent = 'Bürger auswählen'; select.append(empty);
    const preferred = this.engine.getPreferredCouncilDelegate(this.player.id);
    for (const citizen of this.engine.getEligibleCouncilDelegates(this.player.id)) {
      const option = document.createElement('option'); option.value = citizen.id;
      option.textContent = citizen.firstName + ' ' + citizen.lastName + ' · ' + citizen.profession;
      select.append(option);
    }
    if (preferred) select.value = preferred.id;
    const note = document.createElement('p');
    note.className = 'muted';
    note.setAttribute('role', 'status');
    const delegate = document.createElement('button');
    delegate.type = 'button'; delegate.className = 'secondary'; delegate.textContent = 'An Bürger übergeben';
    const delegateChoice = (): void => {
      if (!dialog.open || !this.engine || !this.player || !select.value) return;
      this.cancelCouncilSelectionTimer();
      void this.run(() => {
        const chosen = this.requireEngine().chooseCouncilOptionForCitizen(this.requirePlayer().id, select.value);
        const outcome = this.requireEngine().delegateCouncilDecision(this.requirePlayer().id, select.value, chosen);
        this.notify(outcome.message, !outcome.success);
        this.resumeAfterCouncilDecision();
        dialog.close();
      });
    };
    delegate.addEventListener('click', delegateChoice);
    // The citizen selection is automatic after five seconds, not the political choice:
    // players can change the selected delegate or decide themselves at any time.
    let seconds = 5;
    note.textContent = preferred
      ? 'Beim letzten Mal entschied ' + preferred.firstName + ' ' + preferred.lastName +
        '. Wenn diese Person noch lebt, bleibt sie zuständig.'
      : 'Nach 5 Sekunden wird ein zufälliger lebender Bürger vorausgewählt.';
    if (!preferred) {
      const tick = (): void => {
        if (!dialog.open || !this.engine || !this.player) return;
        seconds--;
        if (seconds > 0) {
          note.textContent = 'Zufällige Bürgerauswahl in ' + seconds + ' Sekunden.';
          this.councilSelectionTimer = window.setTimeout(tick, 1000);
          return;
        }
        const available = this.engine.getEligibleCouncilDelegates(this.player.id);
        if (available.length) {
          const chosen = available[Math.floor(Math.random() * available.length)];
          select.value = chosen.id;
          note.textContent = chosen.firstName + ' ' + chosen.lastName +
            ' wurde zufällig ausgewählt. Du kannst die Auswahl ändern oder selbst entscheiden.';
        } else note.textContent = 'Keine lebenden Bürger verfügbar. Bitte selbst entscheiden.';
      };
      this.councilSelectionTimer = window.setTimeout(tick, 1000);
    }
    select.addEventListener('change', () => {
      this.cancelCouncilSelectionTimer();
      note.textContent = 'Bürger manuell ausgewählt. Mit „An Bürger übergeben“ entscheidet diese Person.';
    });
    const suggest = document.createElement('button');
    suggest.type = 'button'; suggest.className = 'secondary'; suggest.textContent = '🤖 Ratsvorschlag';
    suggest.addEventListener('click', () => void this.run(async () => {
      const engine = this.requireEngine(); const player = this.requirePlayer();
      const pending = engine.getPendingCouncilDecision(player.id);
      if (!pending) return;
      suggest.disabled = true;
      try {
        const hint = await this.councilAdvisor.suggest(readAdvisorConfig(),
          { year: engine.getCurrentYear(), title: pending.title, story: pending.story },
          engine.getCouncilChoices(player.id));
        const choice = engine.getCouncilChoices(player.id).find(c => c.id === hint.id);
        this.notify(hint.explanation + ' ' + (choice?.title ?? ''), false);
      } catch (error) {
        this.notify((error instanceof Error ? error.message : 'KI nicht verfügbar') + ' · Regelberater in Einstellungen wählen.', true);
      } finally { suggest.disabled = false; }
    }));
    delegation.append(select, note, delegate, suggest);
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'secondary';
    later.textContent = 'Später im Reichsrat entscheiden';
    later.addEventListener('click', () => dialog.close());
    const automatic = document.createElement('label');
    automatic.className = 'council-auto';
    automatic.innerHTML = '<input type="checkbox" data-council-auto> Diese und künftige Ereignisse automatisch entscheiden';
    automatic.title = 'Nur bezahlbare Optionen. Sichere Folgen haben Vorrang; danach zählen Wohlergehen und Kosten. Jederzeit im Lagebericht abschaltbar.';
    dialog.append(heading, automatic, story, choices, delegation, later);
    this.bindCouncilAutomatic(dialog);
    this.paginateInfoDialog(dialog);
    dialog.addEventListener('close', () => { this.cancelCouncilSelectionTimer(); if (this.councilDialog === dialog) this.councilDialog = undefined; dialog.remove(); });
    this.root.append(dialog);
    this.councilDialog = dialog;
    dialog.showModal();
  }

  private showGameAction(title: string, message: string, kind: 'raid' | 'science', playerWon: boolean = false): void {
    const banner = this.root.querySelector<HTMLElement>('#game-action-banner');
    if (!banner) return;
    window.clearTimeout(this.actionBannerTimer);
    banner.className = 'game-action-banner ' + kind;
    banner.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = title;
    const description = document.createElement('span');
    description.textContent = message;
    banner.append(heading, description);
    banner.hidden = false;
    this.map?.playAction(kind, playerWon);
    this.actionBannerTimer = window.setTimeout(() => { banner.hidden = true; }, 4500);
  }

  /** Zeigt eine Vollbild-Sieg- oder Niederlageseite mit Statistik und Optionen. */
  private showCampaignComplete(won: boolean, defeatReason?: 'bankruptcy' | 'famine' | 'anarchy'): void {
    const player = this.requirePlayer();
    const engine = this.requireEngine();
    engine.pauseGame();
    this.root.querySelector('.campaign-result-dialog')?.remove();
    const kingdom = player.kingdom;
    const goals = engine.getCampaignGoals(player.id);
    const completedGoals = goals.filter((g: CampaignGoal) => g.done).length;
    const year = engine.getCurrentYear();
    const month = engine.getCurrentMonth();
    const gold = kingdom.resources?.gold ?? 0;
    const happiness = kingdom.happiness ?? 0;
    const population = kingdom.getSummary().totalPopulation;
    const infra = kingdom.infrastructure;
    const buildings = (Object.keys(infra) as Array<keyof typeof infra>).reduce((a, k) => a + (typeof infra[k] === 'number' ? (infra[k] as number) : 0), 0);

    const defeatText: Record<'bankruptcy' | 'famine' | 'anarchy', string> = {
      bankruptcy: 'Bankrott – dein Reich führt kein Gold mehr und die Kassen sind leer.',
      famine: 'Hungersnot – die Felder tragen nicht, und das Volk hungert.',
      anarchy: 'Anarchie – die Zufriedenheit brach zusammen und das Volk steht auf.'
    };
    const defeatDetail = defeatReason ? defeatText[defeatReason]
      : 'Dein Reich konnte sich nicht behaupten. Versuche eine neue Strategie.';

    const dialog = document.createElement('dialog');
    dialog.className = 'campaign-result-dialog';
    dialog.innerHTML = `
      <div class="campaign-result ${won ? 'victory' : 'defeat'}">
        <div class="result-icon">${won ? '♛' : '⚔'}</div>
        <h2>${won ? 'Kampagne gewonnen!' : 'Kampagne verloren'}</h2>
        <p class="result-subtitle">${won
          ? 'Alle Kapitel wurden erfolgreich abgeschlossen. Dein Reich blüht!'
          : defeatDetail}</p>
        <div class="result-stats">
          <div class="stat"><span class="stat-label">Jahr</span><span class="stat-value">${formatYear(year)}</span></div>
          <div class="stat"><span class="stat-label">Monat</span><span class="stat-value">${month}</span></div>
          <div class="stat"><span class="stat-label">Gold</span><span class="stat-value">${format(gold)}</span></div>
          <div class="stat"><span class="stat-label">Zufriedenheit</span><span class="stat-value">${format(happiness)}%</span></div>
          <div class="stat"><span class="stat-label">Bevölkerung</span><span class="stat-value">${format(population)}</span></div>
          <div class="stat"><span class="stat-label">Gebäude</span><span class="stat-value">${buildings}</span></div>
          <div class="stat"><span class="stat-label">Ziele erfüllt</span><span class="stat-value">${completedGoals}/${goals.length}</span></div>
        </div>
        <div class="result-actions">
          <button class="primary" data-result-continue>🌍 ${engine.isHotseat() ? 'Partie für alle als Sandbox fortsetzen' : 'Weiterspielen (Sandbox)'}</button>
          <button data-result-restart>🔄 Neu beginnen</button>
          <button data-result-menu>🏠 Zum Hauptmenü</button>
        </div>
      </div>`;
    this.root.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('[data-result-continue]')?.addEventListener('click', () => {
      void this.run(async () => {
        engine.continueAsSandbox();
        dialog.close();
        dialog.remove();
        await engine.saveGame('autosave');
        this.notify('Du spielst im Sandbox-Modus weiter – es gibt keine weiteren Kampagnenziele.');
      });
    });
    dialog.querySelector('[data-result-restart]')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
      void this.run(() => this.exitToMenu());
    });
    dialog.querySelector('[data-result-menu]')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
      void this.run(() => this.exitToMenu());
    });
    dialog.addEventListener('close', () => dialog.remove());
  }

  private navigate(view: View): void {
    this.root.querySelector<HTMLDialogElement>('#briefing-dialog')?.close();
    this.view = view;
    const selection = this.root.querySelector<HTMLSelectElement>('#view-select');
    if (selection) selection.value = view;
    const popup = this.root.querySelector<HTMLDialogElement>('#section-dialog');
    const panel = this.root.querySelector<HTMLElement>('#panel');
    if (popup && panel) {
      if (!popup.open) popup.showModal();
      const title = this.root.querySelector<HTMLElement>('#section-dialog-title');
      const button = this.root.querySelector<HTMLButtonElement>('nav [data-view="' + view + '"]');
      if (title) title.textContent = button?.textContent?.trim() ?? 'Verwaltung';
      this.renderPanel();
      const body = this.root.querySelector<HTMLElement>('#section-dialog-body');
      body?.replaceChildren(panel);
      if (body) body.scrollTop = 0;
      const pageLabel = this.root.querySelector('#panel-page');
      if (pageLabel) pageLabel.textContent = 'Seite 1';
      popup.scrollTop = 0;
      this.refresh();
      requestAnimationFrame(() => this.updatePanelPagination());
      return;
    }
    this.renderPanel();
    this.refresh();
  }

  private updatePanelPagination(): void {
    const body = this.root.querySelector<HTMLElement>('#section-dialog-body');
    if (!body || body.clientHeight === 0) return;
    const step = Math.max(1, body.clientHeight - 64);
    const maximum = Math.max(0, body.scrollHeight - body.clientHeight);
    const pages = Math.ceil(maximum / step) + 1;
    const current = body.scrollTop >= maximum - 1 ? pages : Math.floor(body.scrollTop / step) + 1;
    const label = this.root.querySelector('#panel-page');
    if (label) label.textContent = `Seite ${current} / ${pages}`;
    const previous = this.root.querySelector<HTMLButtonElement>('#panel-prev');
    const next = this.root.querySelector<HTMLButtonElement>('#panel-next');
    if (previous) previous.disabled = body.scrollTop < 1;
    if (next) next.disabled = body.scrollTop >= maximum - 1;
  }

  /** Long explanations remain readable without moving the page or hiding the close action. */
  private paginateInfoDialog(dialog: HTMLDialogElement): void {
    const heading = dialog.firstElementChild;
    const close = dialog.lastElementChild;
    if (!heading || !(close instanceof HTMLButtonElement)) return;
    const body = document.createElement('div');
    body.className = 'dialog-page-body';
    for (const child of Array.from(dialog.children)) if (child !== heading && child !== close) body.append(child);
    const footer = document.createElement('div');
    footer.className = 'dialog-page-footer';
    for (const [text, direction] of [['← Zurück', -1], ['Weiter →', 1]] as const) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = text;
      button.onclick = () => { body.scrollTop += direction * Math.max(1, body.clientHeight - 64); };
      footer.append(button);
    }
    footer.append(close);
    dialog.classList.add('paged-info');
    dialog.append(body, footer);
  }

  private refresh(): void {
    if (!this.engine || !this.root.querySelector('.kingdom-app')) return;
    const hotseat = this.engine.isHotseat();
    if (hotseat) this.player = this.engine.getActivePlayer();
    if (!this.player) return;
    this.applyEraPresentation(this.engine.getCurrentYear());
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
    setText('hud-population', format(kingdom.getSummary().totalPopulation));
    setText('hud-happiness', `${format(kingdom.happiness)} %`);
    setText('hud-stability', `${format(kingdom.stats.stability)} %`);
    const reserves = balance.consumption.food > 0 ? kingdom.resources.food / balance.consumption.food : Infinity;
    setText('hud-reserves', Number.isFinite(reserves) ? `${reserves.toLocaleString('de-DE', {maximumFractionDigits:1})} Mo.` : 'kein Bedarf');
    for (const [id, critical] of [['hud-happiness', kingdom.happiness < 40], ['hud-stability', kingdom.stats.stability < 40], ['hud-reserves', reserves < 2]] as const) {
      this.root.querySelector('#' + id)?.classList.toggle('negative', critical);
    }
    for (const [id, value] of [['happiness', kingdom.happiness], ['stability', kingdom.stats.stability]] as const) {
      const bar = this.root.querySelector<HTMLProgressElement>(`#${id}-bar`);
      if (bar) bar.value = value;
    }
    setText('date', this.date());
    // Historischer Kontext: belegte Epoche mit Evidenzgrad und Herrscherwürde.
    // Weicht die Modell-Epoche von der Kampagnen-Epoche ab, wird das offengelegt
    // statt eine scheinbar exakte Zuordnung zu behaupten.
    const historical = this.engine.getHistoricalContext(this.player.id);
    const campaignEpoch = this.engine.getCurrentEpoch();
    const evidenceNote = historical.epochEvidence === 'belegt' ? ''
      : historical.epochEvidence === 'naeherung' ? ' · Grenzen genähert'
        : ' · Grenzen ungeprüft';
    const epochLabel = historical.epoch && historical.epoch.name !== campaignEpoch
      ? `${campaignEpoch.toUpperCase()} · HISTORISCH: ${historical.epoch.name.toUpperCase()}${evidenceNote.toUpperCase()}`
      : `${campaignEpoch.toUpperCase()}${evidenceNote.toUpperCase()} · ALTERNATIVE GESCHICHTE`;
    setText('era-label', epochLabel);
    setText('ruler-dignity', historical.rulerDignity
      ? `Historische Würde: ${historical.rulerDignity.name}`
      : 'Historische Würde: nicht belegt');
    const currentEraYear = this.engine.getCurrentYear();
    const eras: readonly [number, string][] = [[1200, 'Hochmittelalter: Städte, Herrschaften und Handelswege wachsen.'], [1400, 'Spätmittelalter: Zünfte, Handel und gesellschaftlicher Wandel.'], [1500, 'Renaissance und Reformation.'], [1600, 'Konfessionelle Konflikte und territoriale Veränderungen.'], [1750, 'Aufklärung und wissenschaftliche Reformen.'], [1820, 'Industrialisierung und veränderte Verkehrswege.'], [1890, 'Großindustrie und Elektrifizierung.'], [1945, 'Nachkriegszeit und Wiederaufbau.'], [1970, 'Elektronik und moderne Gesellschaft.'], [2000, 'Digitalzeitalter und globale Vernetzung.']];
    setText('epoch-title', this.engine.getCurrentEpoch() + ' · ' + formatYear(currentEraYear));
    setText('epoch-description', currentEraYear < 500 ? 'Frühe Herrschaft als freies Spielmodell. Historische Beispiele und ihre Regionen stehen im Zeitbild.'
      : [...eras].reverse().find(([year]) => currentEraYear >= year)?.[1] ?? 'Frühes Mittelalter: regionale Herrschaften und vielfältige kulturelle Traditionen.');
    this.root.querySelector('.kingdom-app')?.setAttribute('data-era-year', String(this.engine.getCurrentYear()));
    this.root.querySelector('.kingdom-app')?.setAttribute('data-era', eraPresentation(currentEraYear).id);
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
    const chapter = this.engine.getCampaignChapterStatus(this.player.id);
    setText('campaign-title', this.engine.getCampaignDefinition().name + ' · ' +
      (chapter.finished ? 'Alle Kapitel bestanden' : 'Kapitel ' + (chapter.index + 1) + '/' + chapter.total + ': ' + chapter.title));
    setText('campaign-story', this.engine.getCampaignId() === 'frei' ? 'Offenes Spiel: Erkunde jede Epoche ohne verpflichtende Ziele.' : chapter.narrative);
    const completed = goals.filter((goal: CampaignGoal) => goal.done).length;
    const objectiveHost = this.root.querySelector('#objectives');
    if (objectiveHost) objectiveHost.innerHTML = goals.map((goal: CampaignGoal) =>
      `<p class="objective ${goal.done ? 'complete' : ''}"><span>${goal.done ? '✓' : '○'}</span>${goal.label}</p>`
    ).join('');
    const goalProgress = this.root.querySelector<HTMLProgressElement>('#goal-progress');
    if (goalProgress) {
      goalProgress.max = goals.length;
      goalProgress.value = chapter.finished ? goals.length : Math.min(goals.length, chapter.index * 2 + chapter.goals.filter(goal => goal.done).length);
    }
    setText('goal-status', this.engine.getCampaignId() === 'frei'
      ? 'Freies Spiel ohne Siegzwang – deine Entscheidungen bestimmen den Weg.'
      : chapter.finished ? '♛ Kampagne gewonnen! Alle drei Kapitel wurden abgeschlossen. Du kannst frei weiterspielen.'
      : chapter.ready ? 'Kapitelziele erfüllt. Lasse einen Monat vergehen, um das Kapitel abzuschließen.'
      : `${chapter.goals.filter(goal => goal.done).length} von ${chapter.goals.length} aktuellen Kapitelzielen erfüllt · ${completed} von ${goals.length} Gesamtzielen.`);
    const latest = this.root.querySelector('#latest');
    this.renderReport();
    if (latest) latest.innerHTML = this.journal.slice(0, 2).map((entry: JournalEntry) =>
      `<article><small>${escape(entry.date)}</small><div class="message-content">${journalMessageHtml(entry.message)}</div></article>`).join('');
    this.root.querySelector('.kingdom-app')?.setAttribute('data-view', this.view);
    this.root.querySelectorAll<HTMLButtonElement>('nav [data-view]').forEach((button: HTMLButtonElement): void => {
      button.setAttribute('aria-current', button.dataset.view === this.view ? 'page' : 'false');
    });
    const details = this.root.querySelector('#settlement-details');
    const district = SETTLEMENT_DISTRICTS.find(d => d.type === this.selected);
    if (details && district) details.innerHTML = `<strong>${escape(earlyBuildingName(district.type, this.engine.getCurrentYear(), district.name))}</strong> ·
      ${format(kingdom.infrastructure[district.type])} Gebäude
      <button data-open-district class="secondary">Bezirk ausbauen →</button>`;
    setText('settlement-season', SEASON_LABELS[kingdom.currentSeason] + ' · ' + this.engine.getCurrentEpoch());
    this.renderMapFallback();
    this.map?.setStrategyWorld(this.engine.getStrategyWorld(this.player.id), Object.fromEntries(
      this.engine.getRivalRelations(this.player.id).map(relation=>[relation.kingdomId,
        this.engine!.getRivalTreaties(this.player!.id).some(t=>t.parties.includes(relation.kingdomId)) ? 'Vertragspartner' :
        relation.relationType==='vassal'?'Vasall':relation.relationshipValue < -25 ? 'Feindlich':relation.relationshipValue>25?'Freundlich':'Neutral ('+Math.round(relation.relationshipValue)+')'])));
    this.map?.update(kingdom, this.selected, this.engine.getModernizationOptions(this.player.id)
      .filter(option => option.completed).map(option => option.project.id), this.engine.getCurrentYear(),
      this.engine.getRivals(this.player.id));
    // Regionsnamen hängen am Jahr: bei Epochenwechsel neu laden, sonst unverändert lassen.
    if (this.map && isZoomLevelsEnabled()) {
      const year = this.engine.getCurrentYear();
      if (year !== this.regionYear) {
        this.regionYear = year;
        this.map.setHistoricalRegions(regionsForMap(year));
      }
      this.updateZoomHint();
    }
    const scene: Soundscape = this.view === 'war' ? 'battle' :
      this.view === 'culture' ? 'culture' :
      this.view === 'economy' ? 'market' :
      kingdom.currentSeason === 'winter' ? 'winter' : 'village';
    this.ambience.setScene(scene);
    const musicContext = { year: this.engine.getCurrentYear() };
    this.jukebox.setCurrentYear(musicContext.year);
    if (this.jukebox.getPlaylistMode() === 'era' && !this.eraMusicSwitching) {
      const matching = this.jukebox.getTrackForYear(musicContext.year);
      if (matching && !this.jukebox.getEraTracks(musicContext.year).some(track => track.id === this.jukebox.getCurrentId())) {
        this.eraMusicSwitching = true;
        void this.jukebox.play(matching.id)
          .catch(error => {  this.notify(error instanceof Error ? error.message : 'Epoche-Musik nicht verfügbar.', true); })
          .finally(() => { this.eraMusicSwitching = false; this.updateJukeboxStatus(); });
      }
    }
    setText('music-era-label', this.engine.getCurrentEpoch() + ' · ' + formatYear(musicContext.year));
    const panel = this.root.querySelector('#panel');
    if (!panel?.contains(document.activeElement)) this.renderPanel();
  }

  private applyEraPresentation(year: number): void {
    const era = eraPresentation(year);
    document.documentElement.dataset.era = era.id;
    const values: Record<string, string> = { desk: era.desk, motto: era.title, tool: era.tool, object: era.object, material: era.material, year: formatYear(year), realm: era.realm,
      intro: year < 500 ? 'Entwickle eine Siedlung zwischen Landwirtschaft, Handwerk und Handel. Das freie Spielmodell wird von belegten Einblicken in die Kulturen der Zeit begleitet.' : year >= 1945 ? 'Gestalte dein Land zwischen Wiederaufbau, Gesellschaft und technologischem Wandel. Jede Entscheidung schreibt Geschichte.' : year >= 1800 ? 'Lenke dein Reich durch Industrialisierung und gesellschaftlichen Wandel. Baue Städte, Handel und neue Infrastruktur auf.' : year >= 1500 ? 'Neue Handelswege, Wissen und Macht verändern die Welt. Gestalte die Zukunft deiner Herrschaft.' : 'Aus einem kleinen Lehen wird ein blühendes Reich. Sorge für dein Volk, lenke den Handel und baue deine Herrschaft auf.' };
    for (const [key, value] of Object.entries(values)) {
      this.root.querySelectorAll<HTMLElement>('[data-presentation-' + key + ']').forEach(el => { el.textContent = value; });
    }
    const labels: Record<string, string> = { court: era.court, council: era.council, war: era.war };
    for (const [view, text] of Object.entries(labels)) {
      this.root.querySelectorAll<HTMLButtonElement>('.sidebar nav [data-view="' + view + '"]').forEach(button => {
        if (button.lastChild?.nodeType === Node.TEXT_NODE) button.lastChild.textContent = text;
      });
      const option = this.root.querySelector<HTMLOptionElement>('#view-select option[value="' + view + '"]');
      if (option) option.textContent = text;
    }
  }

  private renderProvisioning():string {
    const regions=this.requireEngine().getRegionalProvisioning(this.requirePlayer().id);
    return `<section aria-label="Regionale Versorgung"><h3>Versorgung, Vertrauen und Abwanderung</h3>
      <p>Gemeinsamer Nahrungsvorrat: ${format(this.requirePlayer().kingdom.resources.food)} · etwa ${regions[0].reserves.toFixed(1)} Monatsverbräuche.</p>
      <p class="muted">Drei modellierte Versorgungsgebiete deiner Herrschaft, keine historischen Verwaltungsgrenzen oder Bevölkerungszahlen. Hunger entsteht aus tatsächlichen Vorräten und Verbrauch; entlegene Siedlungen sind stärker gefährdet. Abwanderung verringert die bäuerliche Bevölkerung, ihre Arbeit und Steuerbasis. Individuelle Familien werden dabei noch nicht umgesiedelt.</p>
      <div class="build-grid">${regions.map(region=>`<article class="build-card" data-provision-region="${region.id}">
        <h4>${escape(region.name)}</h4><p>Hunger: <strong data-provision-hunger>${format(region.hunger)} / 100</strong> · Vertrauen: ${format(region.trust)} / 100</p>
        <p>Speicherstufe: <strong data-provision-storage>${region.storage} / 3</strong> · bisher abgewandert: ${format(region.emigrated)}</p>
        <p>${region.hunger>=60?'Versorgungskrise':region.hunger>=30?'Angespannte Versorgung':'Versorgung stabil'}${region.reliefMonths?` · Nothilfe: noch ${region.reliefMonths} Monate`:''}${region.settlementMonths?` · Haushaltshilfe: noch ${region.settlementMonths} Monate`:''}</p>
        ${region.options.map(option=>`<div class="provision-action"><h5>${escape(option.name)}</h5><p>${escape(option.description)}</p>
          <p class="cost">${format(option.cost.gold)} Gold · ${format(option.cost.food)} Nahrung · ${format(option.cost.wood)} Holz · ${format(option.cost.stone)} Stein</p>
          <button data-provision-action="${option.id}" data-provision-target="${region.id}" ${option.canStart?'':'disabled'}>${escape(option.name)}</button>
          ${option.blockers.length?`<small>${escape(option.blockers[0])}</small>`:''}</div>`).join('')}</article>`).join('')}</div>
      <p>Erfolgreiche Versorgungsaufträge helfen dem am stärksten belasteten Gebiet. Bei delegierten Bürgeraufträgen organisiert die Verwaltung auch Nothilfe innerhalb ihres bestehenden Monatsbudgets.</p>
      <button data-open="civic">Bürger mit Versorgungsaufträgen betrauen →</button></section>`;
  }

  private renderAdministration(domains:readonly AdministrationDomain[]=ADMIN_DOMAINS):string {
    const prefs=this.requireEngine().getAdministration(this.requirePlayer().id);
    const budget=this.requireEngine().getAdministrationBudget(this.requirePlayer().id);
    const policy=ADMIN_POLICIES[prefs.policy];
    const people=this.requireEngine().getAutomationPeople(this.requirePlayer().id);
    const character=this.requireEngine().getCurrentCharacter(this.requirePlayer().id);
    const characterOnly=domains.length===1&&domains[0]==='character';
    return `<section class="build-card administration"><h3>${characterOnly?'Charakter delegieren':'Deine Schwerpunkte · Verwaltung delegieren'}</h3>
      ${characterOnly?'':`<label>Entscheidungen <select data-administration-policy>${Object.entries(ADMIN_POLICIES).map(([key,value])=>`<option value="${key}" ${key===prefs.policy?'selected':''}>${value.label}</option>`).join('')}</select></label>
      <p>${policy.months} Monate Gold-Unterhalt als Rücklage (mindestens 500 Gold). Maximal ${Math.round(policy.fraction*100)} % des übrigen Goldes als gemeinsames Monatsbudget: derzeit ${format(budget.budget)} Gold.</p>
      <p class="muted">Die Rücklage begrenzt freiwillige Ausgaben; laufende Kosten und Ereignisse bleiben wirksam. Die Automatik nimmt keine Kredite auf. Aktivierte Bereiche handeln beim Monatswechsel.</p>`}
      <div class="administration-domains">${domains.map(domain=>`<label class="checkbox"><input type="checkbox" data-administration-domain="${domain}" ${prefs.domains[domain]?'checked':''}>${ADMIN_LABELS[domain]}</label>`).join('')}</div>
      ${domains.includes('character')?`<label>Charakterplan<select data-character-plan>${CHARACTER_PLANS.map(plan=>`<option value="${plan}" ${prefs.characterPlan===plan?'selected':''}>${CHARACTER_PLAN_LABELS[plan]}</option>`).join('')}</select></label>
        <p data-automatic-character>${character?escape(character.firstName+' '+character.lastName):'Rolle unbesetzt'} · ${prefs.domains.character?'Charakterautomatik aktiv':'Manuelle Charaktersteuerung'}</p>
        <p class="muted">Eine persönliche Handlung pro Monat. Manuelle Handlungen haben Vorrang. „Dem Reich dienen“ spendet jeweils die Hälfte des persönlichen Vermögens. Bei aktiver Automatik folgen erwachsene Kinder, Partner oder andere freie Erwachsene nach.</p>`:''}
      ${domains.length>1||domains.includes('civic')?`<h4>Zugewiesene Bürger</h4><ul class="automation-people">${people.map(person=>`<li data-automation-person><strong>${escape(person.name)}</strong> · ${escape(person.task)}<br><small>${person.alive?escape(person.status):'Nicht verfügbar · Nachfolge offen'} · ${escape(person.progress)}</small></li>`).join('')||'<li>Noch keine Hofämter oder Bürgeraufträge vergeben.</li>'}</ul><button data-open="civic">Bürgeraufträge verwalten</button>`:''}
      ${domains.length>1?'<div class="quick-actions"><button data-administration-preset="watch">Zuschauen · alles delegieren</button><button data-administration-preset="manual">Alles selbst entscheiden</button></div><p class="muted">Zuschauen aktiviert auch automatische Ereignisentscheidungen. Mit „Fortsetzen“ läuft die Zeit; einzelne Bereiche kannst du jederzeit wieder übernehmen.</p>':''}</section>`;
  }

  private renderOngoingProjects():string {
    const jobs=this.requireEngine().getProjects(this.requirePlayer().id);
    return `<section class="build-card" data-project-queue><h3>Laufende Vorhaben (${jobs.length}/12)</h3>${jobs.length?'<ul>'+jobs.map(j=>`<li><strong>${escape(j.name)}</strong> · noch ${j.remaining} von ${j.months} Monaten<progress value="${j.months-j.remaining}" max="${j.months}"></progress></li>`).join('')+'</ul>':'<p>Keine Vorhaben im Bau, in Ausbildung oder im Aufmarsch.</p>'}</section>`;
  }
  private renderTimeJourney():string {
    return `<section class="build-card"><h3>Durch die Zeit reisen</h3><p>Jeder Monat wird vollständig berechnet. Versorgung, Alterung, Bau und Gegner laufen weiter. Hält bei Ratsentscheidungen und Kampagnenende an. Automatik kannst du in der Hofverwaltung einstellen.</p><div class="time-journey-actions">${[[12,'1 Jahr'],[120,'1 Jahrzehnt'],[1200,'1 Jahrhundert']].map(([n,label])=>`<button data-time-travel="${n}" ${this.requireEngine().isHotseat()?'disabled':''}>${label} →</button>`).join('')}<button data-time-stop>Reise anhalten</button></div><p id="time-travel-progress" role="status"></p></section>`;
  }
  private renderFoodSecurity():string {
    const supply=this.requireEngine().getFoodSecurity(this.requirePlayer().id);
    return `<section class="build-card" data-food-security><h3>Vorräte schützen</h3><p>Geschützte Kapazität: ${format(supply.capacity)} Nahrung · ungeschützt: ${format(supply.exposed)}.</p><p>Erwarteter Verderb dieses Bestands: ${format(supply.spoilage)} pro Monat. Ein Speicher schützt weitere 6.000 Nahrung. Bei aktivierten Zufallsereignissen: ${(supply.risk*100).toFixed(1)} % monatliches Risiko zusätzlicher Vorrats- oder Feldschäden; Speicher mindern deren Ausmaß.</p><button data-open="build">Speicher bauen</button></section>`;
  }

  private renderProjects(kind:'construction'|'modernization'):string {
    const options=this.requireEngine().getModernizationOptions(this.requirePlayer().id)
      .filter(o=>o.visible&&(o.project.kind??'modernization')===kind);
    return `<div class="build-grid">${options.map(({project,completed,canStart,blockers})=>`
      <article class="build-card ${completed?'selected':''}" data-project="${escape(project.id)}"><h3>${escape(project.name)}</h3>
      <p>${escape(project.description)}</p><p>Bauzeit: ${(project.kind??'modernization')==='construction'?12:6} Monate</p><p>${escape(project.effect)} (Werte höchstens 100)</p>
      <p class="cost">${format(project.cost.gold)} Gold · ${format(project.cost.wood)} Holz · ${format(project.cost.stone)} Stein · ${format(project.cost.iron)} Eisen</p>
      <button data-modernization="${escape(project.id)}" ${canStart?'':'disabled'}>${completed?'Bereits umgesetzt':kind==='construction'?'Bauvorhaben umsetzen':'Modernisieren'}</button>
      ${!completed&&blockers.length?`<p class="muted">${blockers.map(escape).join(' · ')}</p>`:''}</article>`).join('')||'<p>Für deine bestehenden Gebäude gibt es in dieser Epoche keine weiteren Projekte.</p>'}</div>`;
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
        '<label class="council-auto"><input type="checkbox" data-council-auto> Ereignisse automatisch entscheiden</label><p class="muted">Nur bezahlbare Optionen. Sichere Folgen haben Vorrang; danach zählen Wohlergehen und Kosten. Entscheidungen werden protokolliert. Jederzeit abschaltbar.</p>' +
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
    } else if (this.view === 'civic') {
      const data = this.engine.getCivicMissions(this.player.id);
      panel.innerHTML = heading('GESELLSCHAFT & ARBEIT', 'Aufträge an Bürger',
        'Verteile Aufgaben passend zum Jahrhundert. Bürger arbeiten mehrere Spielmonate und verbessern ihre Fähigkeiten.') +
        this.renderAdministration(['civic']) +
        '<p class="muted">Bis zu drei parallele Aufträge. Ressourcen werden bei Beginn verbraucht; Erträge kommen nach Abschluss.</p>' +
        '<p>Versorgungsaufträge lindern nach Abschluss auch örtlichen Hunger und stärken Vertrauen.</p><button data-open="world">Regionale Versorgung und Hilfsmaßnahmen →</button><h3>Aktuelle Aufträge</h3><div class="build-grid">' +
        (data.active.map(a => {
          return '<article class="build-card" data-active-civic><h3>'+escape(a.missionTitle)+'</h3>'+
            '<p>Verantwortlich: '+escape(a.citizenName)+(a.citizenAlive?'':' · verstorben, Nachfolge offen')+'</p>'+
            '<p>Fortschritt: '+a.completedMonths+'/'+a.totalMonths+' Monate</p></article>';
        }).join('')||'<p class="muted">Noch kein Auftrag vergeben.</p>')+
        '</div><h3>Verfügbare Aufgaben</h3><div class="build-grid">' +
        data.options.map(m=>'<article class="build-card"><h3>'+escape(m.title)+'</h3><p>'+escape(m.description)+'</p>'+
          '<p class="cost">'+m.months+' Monate · '+Object.entries(m.cost).map(([k,v])=>v+' '+escape(k)).join(' · ')+'</p>'+
          '<label>Bürger <select data-civic-citizen="'+escape(m.id)+'">'+data.citizens
            .filter(c=>!data.active.some(a=>a.citizenId===c.id))
            .sort((a,b)=>Number(Boolean(m.professions?.includes(b.profession)))-Number(Boolean(m.professions?.includes(a.profession))) ||
              b.skills[m.preferredSkill]-a.skills[m.preferredSkill] || a.name.localeCompare(b.name,'de'))
            .map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+' · '+escape(PROFESSIONS[c.profession]??c.profession)+
              (m.professions?.includes(c.profession)?' ✓ passend':'')+
              ' · Fähigkeit '+c.skills[m.preferredSkill]+' · Erfahrung '+c.professionLevel+'</option>').join('')+'</select></label>'+
          '<button data-civic-assign="'+escape(m.id)+'" '+(!data.citizens.some(c=>!data.active.some(a=>a.citizenId===c.id))||data.active.length>=3?'disabled':'')+
          '>Auftrag vergeben</button></article>').join('')+
        '</div><h3>Abgeschlossene Aufträge</h3><ol class="journal">'+
        data.history.slice(0,15).map(h=>'<li>'+escape(h.message)+'</li>').join('')+'</ol>';
    } else if (this.view === 'overview') {
      panel.innerHTML = heading('DAS REICH AUF EINEN BLICK', 'Deine nächste Entscheidung',
        'Sichere die Versorgung, investiere gezielt und beobachte die Folgen im nächsten Monat.') + `
        <div class="summary-grid">
          <article><span>Versorgung</span><strong class="${balance.net.food >= 0 ? 'positive' : 'negative'}">
            ${balance.net.food >= 0 ? '+' : ''}${format(balance.net.food)}</strong><small>Nahrung pro Monat</small></article>
          <article><span>Verwaltung</span><strong>${format(kingdom.taxRate * 100)} %</strong><small>Steuersatz</small></article>
          <article><span>Entwicklung</span><strong>${format(kingdom.stats.literacyRate)} %</strong><small>Alphabetisierung</small></article>
        </div>
          ${this.renderOngoingProjects()}${this.renderTimeJourney()}
          <section class="dashboard-shortcuts" aria-label="Deine Herrschaft direkt öffnen">
          <button data-open="court">♟ Hofverwaltung</button><button data-open="civic">⚒ Bürgeraufträge</button>
          <button data-open="council">♛ Reichsrat</button>
          <button data-open="economy">⚖ Wirtschaft</button>
          <button data-open="build">♜ Bauen</button>
          <button data-open="research">✧ Forschung</button>
          <button data-open="military">⚑ Garnison</button>
          <button data-open="world">☼ Welt & Volk</button>
          <button data-open="history">⌛ Geschichte</button>
        </section><div class="quick-actions"><button data-open="build" class="primary">Bauvorhaben planen →</button>
          <button data-open="economy" class="secondary">Wirtschaft verwalten</button></div>
        <p class="muted tip">Du beginnst pausiert. Mit „Monat →“ kannst du die Simulation schrittweise erkunden.
          „Fortsetzen“ verarbeitet bei 1× alle vier Sekunden einen Monat.</p>`;
    } else if (this.view === 'build') {
      panel.innerHTML = heading('BAU & ENTWICKLUNG', 'Dein Reich wächst',
        'Bezahle beim Baubeginn. Erst nach mehreren Spielmonaten entstehen Gebäude und Erträge.') + this.renderOngoingProjects() + `
        <div class="build-grid">${(Object.keys(STRUCTURES) as Array<keyof KingdomInfrastructure>).map(
          (type: keyof KingdomInfrastructure): string => {
            const info = {...STRUCTURES[type], name:earlyBuildingName(type, this.engine!.getCurrentYear(), STRUCTURES[type].name)};
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
              ${type === 'workshops' ? `<p class="production-gain">+${kingdom.getWorkshopWoodGain()} Holz/Monat in dieser Jahreszeit, vor Forschungsboni. Organisiert Holzgewinnung und Verarbeitung; 17–28 zusätzlich pro Monat je nach Jahreszeit.</p>` : ''}
              <div class="cost">${format(cost.cost)} Gold${cost.woodCost ? ` · ${format(cost.woodCost)} Holz` : ''}
                ${cost.stoneCost ? ` · ${format(cost.stoneCost)} Stein` : ''}
                ${cost.ironCost ? ` · ${format(cost.ironCost)} Eisen` : ''}</div>
              <p class="muted">Bauzeit: ${this.engine!.getConstructionMonths(type)} Monate</p><button data-build="${type}" ${missing.length ? 'disabled' : ''} class="secondary"
                aria-label="${info.name} bauen">${missing.length ? `Fehlt: ${missing.join(', ')}` : `${info.name} bauen`}</button>
            </article>`;
          }).join('')}</div><h3>Besondere Bauvorhaben deiner Zeit</h3>` + this.renderProjects('construction');
    } else if (this.view === 'economy') {
      const tradeIncome = this.engine.getTradeNetworkStats(this.player).monthlyIncome;
      const treasury=this.engine.getTreasuryReport(this.player.id);
      panel.innerHTML = heading('HANDEL & FINANZEN', 'Eine gesunde Wirtschaft',
        'Die Bilanz ist eine Prognose vor Ereignissen und jährlichen Titelboni. Mangel verursacht Unzufriedenheit.') + `
        ${this.renderAdministration(['economy'])}<div class="economy-grid"><section><h3>Monatsbilanz</h3>
          <table><caption class="sr-only">Erwartete Ressourcenänderungen im nächsten Monat</caption>
            <thead><tr><th>Ressource</th><th>Vorrat</th><th>Eingang</th><th>Verbrauch</th><th>Saldo</th></tr></thead>
            <tbody>${(['gold', 'food', 'wood', 'stone', 'iron'] as const).map((key: MarketResource | 'gold') => {
              const income = balance.production[key] + (key === 'gold' ? balance.taxes + tradeIncome : 0);
              const expense = key === 'food' || key === 'wood' || key === 'gold' ? balance.consumption[key] : 0;
              return `<tr><th>${RESOURCE_NAMES[key]}</th><td data-stock="${key}">${format(kingdom.resources[key])}</td><td>${format(income)}</td><td>${format(expense)}</td>
                <td class="${income >= expense ? 'positive' : 'negative'}">${format(income - expense)}</td></tr>`;
            }).join('')}</tbody></table><p class="muted">Gold-Eingang enthält ${format(balance.taxes)} Steuern
              und ${format(tradeIncome)} Routeneinkommen.</p>
          <div class="tax-form"><label for="tax-rate">Steuersatz · <output id="tax-value">${Math.round(kingdom.taxRate*100)} %</output>
            <input id="tax-rate" name="tax" type="range" min="0" max="50" step="1" value="${Math.round(kingdom.taxRate*100)}"></label>
            <small>Wirkt sofort. 0–50 %; kein Bestätigen nötig.</small></div>
          <p class="muted">Über 15 % sinkt die Zufriedenheit monatlich, darunter erholt sie sich.</p></section>
          ${this.renderFoodSecurity()}<section><h3>Holzversorgung</h3><p>Waldflächen und Werkstätten liefern Holz. Aktuell ${format(balance.production.wood)} Eingang und ${format(balance.consumption.wood)} Verbrauch pro Monat; im Winter steigt der Heizbedarf.</p>
            <p>Eine zusätzliche Werkstatt liefert derzeit +${kingdom.getWorkshopWoodGain()} Holz/Monat vor Forschungsboni. Bei leeren Vorräten kannst du Holz am Markt zukaufen.</p><button data-open="build">Holzgewinnung ausbauen</button>
            <h3>Markthandel</h3><p class="muted">Sofortiger Austausch. Einkauf mit 20 % Aufschlag,
            Verkauf mit 20 % Abschlag – kein risikoloser Weiterverkauf.</p>
            <form id="trade-form"><label>Ressource<select name="resource" id="trade-resource">
              ${(['food', 'wood', 'stone', 'iron'] as const).map((resource: MarketResource) =>
                `<option value="${resource}" ${resource===this.tradeResource?'selected':''}>${RESOURCE_NAMES[resource]}</option>`).join('')}</select></label>
              <label>Menge<input name="amount" id="trade-amount" type="number" value="${escape(this.tradeAmount)}" min="1" max="1000000" step="1" required></label>
              <p id="trade-quote" class="cost"></p>
              <div class="quick-actions"><button name="direction" value="buy" class="primary">Kaufen</button>
                <button name="direction" value="sell" class="secondary">Verkaufen</button></div>
            </form></section></div>
        ${treasury?`<section class="treasury-report"><h3>Kassenabschluss ${escape(treasury.date)}</h3><p>Anfang ${format(treasury.opening)} → Ende ${format(treasury.closing)} Gold</p><ul>${treasury.entries.map(e=>`<li>${escape(e.reason)}: <strong class="${e.amount<0?'negative':'positive'}">${e.amount>=0?'+':''}${format(e.amount)} Gold</strong></li>`).join('')}</ul></section>`:'<p>Nach dem ersten Monat erscheint hier die tatsächliche Kassenabrechnung.</p>'}
        <section class="trade-routes-section"><h3>Handelsrouten</h3>
          <p class="muted">Führe neue Routen über Aktivierungskosten und gegebenenfalls Forschung ein.</p>
          ${this.renderTradeRoutes(this.player)}</section>`;
    } else if (this.view === 'research') {
      const progress = this.engine.getTechnologyProgress(this.player.id);
      const impact = this.engine.getResearchImpact(this.player.id);
      const current = this.engine.getTechnologyOptions(this.player.id)
        .find((option) => option.technology.id === progress.currentResearch?.technologyId);
      const pointsPerMonth = kingdom.infrastructure.schools * 10 + kingdom.infrastructure.universities * 25;
      panel.innerHTML = heading('WISSEN & ERFINDUNGEN', 'Forschung im Reich',
        'Schulen und Universitäten erzeugen Forschungspunkte. Pro Reich kann gleichzeitig ein Projekt laufen.') + `
        <p class="muted">Aktive Erkenntnisse: +${format(impact.foodPercent)} % Nahrung,
        +${format(impact.industryPercent)} % Handwerk/Rohstoffe,
        +${format(impact.goldPercent)} % Goldproduktion und
        +${format(impact.researchPercent)} % Forschungspunkte.</p>
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
              <small>Spielverfügbarkeit ab ${formatYear(option.technology.year)}</small></div>
            <p>${escape(option.technology.description)}</p>
            <ul class="research-effects" aria-label="Wirkungen dieser Forschung">${researchEffectDescriptions(option.technology).map(effect=>`<li>${escape(effect)}</li>`).join('')}</ul>
            <div class="cost">${format(option.technology.cost.gold)} Gold · ${
              format(option.technology.cost.research)} Forschungspunkte · ${format(option.technology.researchTime)} Tage</div>
            ${option.researched ? '<p class="positive">Erforscht</p>' : option.canStart
              ? `<button class="primary" data-research="${escape(option.technology.id)}">Forschung beginnen</button>`
              : `<p class="muted">${option.blockers.map(escape).join(' · ')}</p>`}
          </article>`).join('')}</div>`;
    } else if (this.view === 'modernization') {
      panel.innerHTML = heading('EPOCHENWANDEL', 'Modernisierung deines Bestands',
        'Hier erscheinen Verbesserungen für deine vorhandenen Gebäude in der aktuellen Epoche. Forschung und Vorräte bestimmen, was du umsetzen kannst.') + this.renderOngoingProjects()+this.renderProjects('modernization');
    } else if (this.view === 'military') {
      const doctrine = doctrineForYear(this.engine.getCurrentYear());
      panel.innerHTML = heading('SICHERHEIT & VERTEIDIGUNG', 'Die Garnison',
        'Rekruten kommen aus der bäuerlichen Bevölkerung. Ausbildung dauert 3 Monate, Reiterei 6 Monate. Sie kosten Unterhalt und fehlen währenddessen auf den Feldern.') + this.renderOngoingProjects()+`
        <p class="muted">${escape(doctrine.label)} · ${escape(doctrine.context)}</p>
        <p class="muted">Moral: ${format(kingdom.military.morale)} % · Ausbildung: ${
          format(kingdom.military.trainingLevel)} % · Ausrüstung: ${format(kingdom.military.equipmentQuality)} %</p>
        <div class="build-grid">${([
          ['infantry', doctrine.units.infantry, 50, '50 Gold · 10 Nahrung'],
          ['archers', doctrine.units.archers, 75, '75 Gold · 15 Nahrung · 10 Holz'],
          ['cavalry', doctrine.units.cavalry, 150, '150 Gold · 30 Nahrung · 5 Eisen']
        ] as const).map(([type, name, gold, cost]) => `<article class="build-card">
          <h3>${name}</h3><strong class="troop-count">${format(kingdom.military[type])}</strong>
          <p>${cost} je Rekrut</p><button class="secondary" data-recruit="${type}"
            ${kingdom.resources.gold < gold * 10 || kingdom.population.peasants < 10 ? 'disabled' : ''}>
            10 ${name} rekrutieren</button></article>`).join('')}</div>
        <p class="muted tip">Mit deiner Garnison ziehst du unter „Feldzüge“ gegen rivalisierende Nachbarn.
          Kasernen, Ausbildung und Ausrüstung erhöhen die Kampfkraft, Mauern und Burgen die Verteidigung.</p>
        <h3>Ausbildung und Modernisierung</h3><div class="build-grid">${this.engine.getGarrisonDevelopment(this.player.id).map(p=>`
          <article class="build-card"><h3>${escape(p.name)}</h3><p>+${p.gain} ${p.field==='trainingLevel'?'Ausbildung':'Ausrüstung'} (höchstens 100)</p>
          <p class="cost">${format(p.cost.gold)} Gold · ${format(p.cost.food)} Nahrung · ${format(p.cost.wood)} Holz · ${format(p.cost.iron)} Eisen</p>
          <button data-garrison="${p.id}" ${p.available?'':'disabled'}>Garnison verbessern</button></article>`).join('')}</div>
        <div class="quick-actions"><button data-open="war" class="primary">Zum Kriegsrat →</button></div>`;
    } else if (this.view === 'culture') {
      const events = this.engine.getFestivalOptions(this.player.id);
      const faith = this.engine.getReligiousOverview(this.player.id);
      panel.innerHTML = heading('KULTUR & VOLK', 'Feste im Jahreskreis',
        'Gemeinschaftliche Mahlzeiten, Musik und Nachbarschaft ergänzen den saisonalen Jahreskreis. Kleine Zusammenkünfte sind monatlich möglich; sie sind Spielaktionen und keine belegten historischen Ereignisse.') +
        `<article class="build-card" aria-label="Religionsübersicht">
        <h3>Glauben im Reich</h3><p>Vorherrschend: ${escape(faith.dominant)}</p>
        <p>Kultureller Einfluss: ${format(faith.culturalInfluence)} / 100 · Religionsfreiheit:
        ${format(faith.religiousFreedom)} / 100</p>
        <p class="muted">Die Religionsdaten stammen aus dem bestehenden Religionssystem und sind
        derzeit weltweite Werte, keine getrennte Religionsverwaltung einzelner Reiche.</p></article>` +
        (events.length ? `<div class="build-grid">${events.map(({ event, affordable, alreadyHeld }) => `
          <article class="build-card"><h3>${escape(event.name)}</h3>
            <p>${escape(event.description)}</p>
            <p class="cost">${format(event.effects.goldCost ?? 0)} Gold ·
              ${format(event.effects.foodConsumption ?? 0)} Nahrung</p>
            <p>Zufriedenheit +${format(event.effects.happiness ?? 0)} ·
              Stabilität +${format(event.effects.stability ?? 0)}</p>
            <button data-festival="${escape(event.id)}" ${alreadyHeld || !affordable ? 'disabled' : ''}>
              ${alreadyHeld ? 'Bereits gefeiert' : affordable ? 'Fest veranstalten' : 'Nicht genug Vorräte'}
            </button>
          </article>`).join('')}</div>` :
          '<p class="muted">Diesen Monat sind keine Feste im Jahreskreis vorgesehen.</p>');
    } else if (this.view === 'intelligence') {
      const intel = this.engine.getCampaignIntelligence(this.player.id);
      const rivals = this.engine.getRivals(this.player.id).filter((rival) => !rival.subjugated);
      panel.innerHTML = heading('KUNDSCHAFTER', 'Der königliche Geheimdienst',
        'Wirb Kundschafter an und lasse Nachbarreiche ausspähen. Der vorhandene Spionagesimulator berechnet Entdeckung und Erfolg.') +
        `<p>Kundschafter: ${format(intel.agents.length)} / 4</p>
        <button class="primary" data-spy-recruit
          ${intel.agents.length >= 4 || kingdom.resources.gold < 400 ? 'disabled' : ''}>Kundschafter anwerben · 400 Gold</button>
        <div class="build-grid">${intel.agents.map((agent) => `<article class="build-card">
          <h3>${escape(agent.name)}</h3><p>Erfahrung: ${format(agent.experience)} ·
          ${agent.captured ? 'Gefangen' : agent.currentMission ? 'Im Einsatz' : 'Einsatzbereit'}</p>
          ${rivals.map((rival) => `<button data-spy-agent="${escape(agent.id)}"
            data-spy-target="${escape(rival.id)}"
            ${agent.captured || agent.currentMission || kingdom.resources.gold < 150 ? 'disabled' : ''}>
            ${escape(rival.name)} ausspähen · 150 Gold</button>`).join('')}
        </article>`).join('')}</div>
        <h3>Berichte</h3><ol class="journal">${intel.reports.slice(-12).map((report) => `
          <li><p>${escape(report.subject)} – ${escape(report.details)}
          (Zuverlässigkeit ${format(report.reliability)} %)</p></li>`).join('') ||
          '<li>Keine aktuellen Berichte.</li>'}</ol>`;
    } else if (this.view === 'world') {
      const atlas = this.engine.getStrategyWorld(this.player.id);
      const neighbors = this.engine.getRivals(this.player.id);
      const name = (id:string):string => id === 'home' ? kingdom.name : neighbors.find(r=>'rival:'+r.id===id)?.name ?? 'Unbekannt';
      const travelCards = `<h3>Strategiewelt · Reisen und Erkundung</h3><p class="muted">Generierte Spielregionen, keine historischen Grenzen. Dein Reich bleibt während einer Reise verwaltbar.</p>
        <p>Aufenthalt: <strong>${escape(name(atlas.currentRegion))}</strong>${atlas.journey ? ` · Reise nach ${escape(name(atlas.journey.destination))}: ${atlas.journey.remaining} Monat(e)` : ''}</p>
        <div class="build-grid">${atlas.regions.map(region=>{
          const rival = neighbors.find(r=>r.id===region.rivalId);
          const here = region.id===atlas.currentRegion;
          const plan = !here && !atlas.journey ? this.engine!.getWorldTravelPlan(this.player!.id,region.id) : null;
          return `<article class="build-card"><h3>${escape(name(region.id))}</h3>
            <button data-world-focus="${escape(region.id)}">Auf der Karte zeigen →</button>
            <p>Gelände: ${region.discovered ? region.terrain : 'Noch nicht erkundet'} · ${rival?.subjugated ? 'Vasallenreich' : region.rivalId ? 'Nachbarreich' : 'Heimat'}</p>
            ${rival ? `<p>Heer: ${format(rival.soldiers)} · Befestigung: ${rival.fortification.toFixed(2)} · Beutevorrat: ${format(rival.loot)} Gold</p><p class="muted">Hauptstadt und gesamte Wirtschaftsleistung: nicht im Modell erfasst.</p><button data-world-diplomacy="${escape(rival.id)}">Diplomatie & Handel →</button>` : ''}
            <button data-world-travel="${escape(region.id)}" ${!plan || kingdom.resources.gold<plan.gold || kingdom.resources.food<plan.food ? 'disabled' : ''}>${here ? 'Du bist hier' : plan ? `${region.id==='home' ? 'Heimreise' : 'Bereisen'} · ${plan.months} Monat(e), ${plan.gold} Gold, ${plan.food} Nahrung` : 'Reise läuft'}</button>
          </article>`;
        }).join('')}</div>`;
      const world = this.engine.getEcologicalStats();
      const people = this.engine.getPopulationStats();
      const movements = this.engine.getMigrationSystem().getMigrationStats();
      const famine = this.engine.getFamineSystem().getActiveFamines();
      panel.innerHTML = heading('LEBENDIGE WELT', 'Land, Klima und Bevölkerung',
        'Versorgung deiner Herrschaft und überregionale Weltstatistik.') + this.renderProvisioning() + travelCards +
        `<div class="summary-grid">
          <article><span>Wetter</span><strong>${escape(world.climate.currentWeather)}</strong><small>${escape(world.climate.currentSeason)}</small></article>
          <article><span>Individuelle Bürger</span><strong>${format(people.total)}</strong><small>Erfasste Simulationspersonen</small></article>
          <article><span>Wilde Tiere</span><strong>${format(world.animals.totalWildlife)}</strong><small>Tierpopulation</small></article>
          <article><span>Nutztiere</span><strong>${format(world.animals.totalLivestock)}</strong><small>Tierhaltung</small></article>
          <article><span>Wanderungsbewegungen</span><strong>${format(movements.totalMigrations)}</strong><small>Historische Summe</small></article>
          <article><span>Aktive Hungersnöte</span><strong>${format(famine.length)}</strong><small>Regional erfasst</small></article>
        </div><h3>Aktuelle Naturkatastrophen</h3>
        <ol class="journal">${world.climate.activeDisasters.map((event) =>
          `<li>${escape(event.type)} · Schwere ${format(event.severity)}</li>`).join('') ||
          '<li>Keine derzeit aktiven Katastrophen.</li>'}</ol>
        <p class="muted">Die Weltstatistik nutzt vorhandene globale Systeme. Eine vollständige,
        pro Reich getrennte Bevölkerungssimulation und Hungersnot-Bilanzierung folgen später.</p>`;
    } else if (this.view === 'diplomacy') {
      const relations = this.engine.getRivalRelations(this.player.id);
      const missions = this.engine.getRivalMissions(this.player.id);
      const treaties = this.engine.getRivalTreaties(this.player.id);
      const rivals = this.engine.getRivals(this.player.id);
      const selectedRival = rivals.find((rival) => rival.id === this.focusedRivalId);
      // Selection is view-only; do not change diplomatic state automatically.
      const focusedCard = selectedRival ? `<article class="build-card" role="status"
        style="border:2px solid #cfaa66;background:rgba(117,87,43,.18)">
        <h3>Ausgewähltes Nachbarreich: ${escape(selectedRival.name)}</h3>
        <p>${escape(selectedRival.description)}</p>
        <p>Status: ${selectedRival.subjugated ? 'Vasallenreich' : 'Unabhängiges Nachbarreich'}</p>
        <p>Beziehung: ${format(relations.find((r) => r.kingdomId === selectedRival.id)?.relationshipValue ?? 0)}
        · Vertrauen: ${format(relations.find((r) => r.kingdomId === selectedRival.id)?.trust ?? 50)} / 100</p>
      </article>` : '';
      panel.innerHTML = heading('GESANDTSCHAFT & NACHBARN', 'Der diplomatische Hof',
        'Gesandtschaften kosten 350 Gold. Im Folgejahr: Erfolg verbessert Beziehung um 10 und Vertrauen um 5; Scheitern senkt beides um 5.') + focusedCard +
        `<p>Vertragserträge: ${format(this.engine.getDiplomaticIncome(this.player.id))} Gold/Monat zusätzlich zur Produktionsbilanz. Vertragsbruch beendet alle Abkommen mit dem Partner und kostet bei anderen Nachbarn 10 Vertrauen.</p>` +
        `<div class="build-grid">${rivals.map((rival) => {
          const relation = relations.find((entry) => entry.kingdomId === rival.id);
          const underway = missions.some((mission) => mission.targetKingdomId === rival.id);
          const ownTreaties = treaties.filter(treaty=>treaty.parties.includes(rival.id));
          const truce = ownTreaties.find(treaty=>treaty.type==='non_aggression'||treaty.type==='alliance');
          return `<article class="build-card"><h3>${escape(rival.name)}</h3>
            <p>${escape(rival.description)}</p>
            <p class="eyebrow">Strategie: ${escape(this.engine!.getRivalPersonality(this.player!.id, rival.id))}</p>
            <p>Beziehung: <strong>${format(relation?.relationshipValue ?? 0)}</strong> · Vertrauen:
              ${format(relation?.trust ?? 50)} / 100</p>
            <p class="muted">${rival.subjugated ? 'Vasall' : truce ? `Friedenspakt ${truce.expiryYear === undefined ? 'ohne Ablaufdatum' : 'bis ' + formatYear(truce.expiryYear)}` : underway ? 'Gesandtschaft unterwegs' : 'Unabhängiger Nachbar'}</p>
            <button data-send-envoy="${escape(rival.id)}" ${rival.subjugated || underway ||
              kingdom.resources.gold < 350 ? 'disabled' : ''}>Gesandtschaft entsenden · 350 Gold</button>
            <button data-negotiate-truce="${escape(rival.id)}" ${rival.subjugated || truce ||
              (relation?.relationshipValue ?? 0) < 10 || (relation?.trust ?? 0) < 40 || kingdom.resources.gold < 500 ? 'disabled' : ''}>
              ${truce ? 'Nichtangriffspakt aktiv' : 'Frieden verhandeln · 500 Gold'}</button>
            <button data-agreement="trade" data-rival="${escape(rival.id)}" ${rival.subjugated || ownTreaties.some(t=>t.type==='trade') || (relation?.relationshipValue??0)<10 || (relation?.trust??0)<40 || kingdom.resources.gold<600 ? 'disabled' : ''}>Handelsvertrag · 600 Gold</button>
            <p class="muted">3 Jahre, 80 Gold/Monat. Benötigt 10 Beziehung und 40 Vertrauen.</p>
            <button data-agreement="alliance" data-rival="${escape(rival.id)}" ${rival.subjugated || ownTreaties.some(t=>t.type==='alliance') || (relation?.relationshipValue??0)<30 || (relation?.trust??0)<40 || kingdom.resources.gold<1200 ? 'disabled' : ''}>Schutzbündnis · 1.200 Gold</button>
            <p class="muted">3 Jahre, gegenseitiger Angriffsschutz und +15 % Führung bei Überfällen; nicht stapelbar. Benötigt 30 Beziehung und 40 Vertrauen.</p>
            ${ownTreaties.map(t=>`<p>${t.type==='trade' ? 'Handelsvertrag' : t.type==='alliance' ? 'Schutzbündnis' : 'Nichtangriffspakt'} ${t.expiryYear === undefined ? 'ohne Ablaufdatum' : 'bis ' + (t.expiryMonth ?? 1) + '/' + formatYear(t.expiryYear)}</p><button data-break-treaty="${escape(t.id)}">Verträge brechen · Beziehung −30, Vertrauen −40, Prestige −5</button>`).join('')}
          </article>`;
        }).join('')}</div>`;
    } else if (this.view === 'war') {
      const doctrine = doctrineForYear(this.engine.getCurrentYear());
      const finance = this.engine.getWarFinanceOverview(this.player.id);
      const borderWatch = this.engine.hasBorderWatch(this.player.id);
      const siege = this.engine.getCampaignSiege(this.player.id);
      panel.innerHTML = heading('KRIEGSRAT', doctrine.conflict + ' & Nachbarn',
        doctrine.context + ' Pro Monat kann dein Heer einmal ausrücken.') +
        `<article class="build-card"><h3>Kriegsfinanzierung</h3>
         <p>Darlehensschuld: ${format(finance.stats.totalWarDebt)} Gold ·
         Monatliche Rate: ${format(finance.stats.monthlyDebtPayment)} Gold</p>
         <button data-war-loan class="secondary" ${!finance.available ||
           this.engine.getCurrentYear() > 1800 ? 'disabled' : ''}>
         ${finance.available ? 'Rüstungsdarlehen: 3.000 Gold aufnehmen' : 'Jahresdarlehen ausgeschöpft'}</button>
         <p class="muted">8 % Jahreszins, 24 Monatsraten. Bei Zahlungsrückstand sinken Zufriedenheit und Stabilität.</p>
         </article>
         <article class="build-card"><h3>Grenzwache</h3>
           <p>Schütze dein Reich vor dem nächsten Überfall: +30 % Führung bei der Verteidigung im nächsten Monat.</p>
           <button data-border-watch class="secondary" ${borderWatch || kingdom.resources.gold < 300 ||
             kingdom.resources.wood < 150 ? 'disabled' : ''}>
             ${borderWatch ? 'Grenzwache in Bereitschaft' : 'Grenzwache verstärken · 300 Gold, 150 Holz'}
           </button>
         </article>
         <article class="build-card"><h3>Belagerung & Versorgung</h3>
          ${siege ? `<p>Belagerung läuft seit ${format(siege.duration)} Tagen ·
            Vorräte ${format(siege.attackerSupplies)} Tage ·
            Verteidiger-Moral ${format(siege.defenderMorale)} %</p>
            <p>Monatsunterhalt: 100 Gold + 100 Nahrung. Ein erfolgreicher Belagerungsring
              schwächt die Mauern für den anschließenden Feldzug.</p>
            <button class="secondary" data-siege-resupply
              ${kingdom.resources.gold < 200 || kingdom.resources.food < 250 ||
                siege.attackerSupplies > 40 ? 'disabled' : ''}>Nachschub · 200 Gold, 250 Nahrung</button>
            <button class="secondary" data-siege-withdraw>Belagerung aufgeben</button>`
            : `<p>Belagere eine gegnerische Festung, um ihre Verteidigung über mehrere Monate zu schwächen.</p>
              <p>Beginn: 500 Gold, 250 Nahrung und mindestens 40 Soldaten.</p>
              ${this.engine.getRivals(this.player.id).filter((rival) => !rival.subjugated).map((rival) =>
                `<button class="secondary" data-siege-target="${escape(rival.id)}"
                  ${this.engine!.hasRivalTruce(this.player!.id, rival.id) ||
                    kingdom.resources.gold < 500 || kingdom.resources.food < 250 ||
                    this.engine!.getArmyOverview(this.player!.id).soldiers < 40 ? 'disabled' : ''}>
                  ${escape(rival.name)} belagern</button>`).join('')}`}
         </article>` + this.renderWarRoom(this.player);
    } else if (this.view === 'court') {
      const assigned = this.engine.getCourtAssistants(this.player.id);
      const candidates = this.engine.getCourtCandidates(this.player.id);
      panel.innerHTML = heading('OPTIONALE HOFVERWALTUNG', 'Deine Berater',
        'Bürger lernen durch ihre Aufgaben. Beratungsmodus ist Standard; Automatik bleibt pro Amt freiwillig.') +
        this.renderAdministration() + `<div class="build-grid">${COURT_OFFICE_IDS.map((office) => {
          const def = COURT_OFFICES[office];
          const entry = assigned.find((a) => a.office === office);
          return `<article class="build-card"><h3>${escape(def.name)}</h3><p>${escape(def.description)}</p>
            ${entry && !entry.citizen?.isAlive ? `<p class="negative">Amt unbesetzt. ${entry.mode==='automatisch'?'Automatische Nachfolge wartet auf eine verfügbare erwachsene Person.':'Bitte eine Nachfolge ernennen.'}</p><button data-court-dismiss="${office}">Freies Amt zurücksetzen</button>`:''}
            ${entry && entry.citizen?.isAlive ? `<p><strong>${escape(entry.citizen.firstName)} ${escape(entry.citizen.lastName)}</strong>
              · ${format(entry.citizen.skills[def.skill])} Fähigkeit · ${format(entry.monthsServed)} Monate Erfahrung</p>
              <label>Steuerung<select data-court-mode="${office}">
                <option value="beratung" ${entry.mode === 'beratung' ? 'selected' : ''}>Nur beraten</option>
                <option value="automatisch" ${entry.mode === 'automatisch' ? 'selected' : ''}>Begrenzt automatisch</option>
              </select></label><button data-court-dismiss="${office}">Entlassen</button>`
              : `<label>Bürger auswählen<select data-court-candidate="${office}">
                ${candidates.map((c) => `<option value="${escape(c.id)}">
                  ${escape(c.firstName)} ${escape(c.lastName)} · ${format(c.skills[def.skill])}</option>`).join('')}
                </select></label><button data-court-appoint="${office}" ${!candidates.length ? 'disabled' : ''}>Ernennen</button>`}
          </article>`;
        }).join('')}</div>
        <p class="muted">Automatik: Kämmerer kauft höchstens 100 Nahrung pro Monat bei knappen Vorräten und sicherer Staatskasse.
        Hofgelehrte startet nur erschwingliche Forschung. Marschall sammelt Erfahrung und berät, führt aber keine eigenmächtigen Kriege.</p>`;
    } else if (this.view === 'character') {
      panel.innerHTML = heading('DEINE ROLLE', 'Der gespielte Charakter',
        'Du lenkst das Reich durch eine Person aus deinem Volk. Wechsle die Rolle, wann immer du willst.') +
        this.renderCharacter(this.player);
    } else if (this.view === 'history') {
      const year = this.historyYear??this.engine.getCurrentYear();
      const month = this.engine.getCurrentMonth();
      const records = milestonesThroughDate(year,month);
      const exhibitions = this.engine.getExhibitionOptions(this.player.id);
      const report = historicalMonthReport(year, month);
      const topics: Record<typeof this.historyTopic, string> = {
        all: 'Zeitbild: alle Themen', ...KNOWLEDGE_TOPICS,
        local: 'Ganderkesee: Land & Geschichte',
        events: 'Ereignisse dieses Monats', periods: 'Zeiträume & Jahrzehnte', archive: 'Chronologie bis heute', exhibitions: 'Ausstellungen fördern'
      };
      const icons: Record<HistoryKind, string> = {
        invention: '⚙', science: '✧', art: '♫', culture: '◈', society: '⚖', future: '◇'
      };
      const cards = (items: WorldMilestone[]): string => `<div class="build-grid">${items.map(item => `
        <article class="build-card" data-history-event="${item.id}"><div class="build-title">
          <span aria-hidden="true">${icons[item.kind]}</span><h3>${escape(item.title)}</h3></div>
          <p class="muted">${escape(milestoneDate(item))} · ${escape(item.place)}</p>
          <p>${escape(item.description)}</p><p class="muted">${milestoneEvidence(item)}</p>
          ${item.dateNote ? `<p class="history-evidence">Datierung: ${escape(item.dateNote)}</p>` : ''}
          <a href="${escape(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Quelle: ${escape(item.sourceTitle)} ↗</a>
        </article>`).join('')}</div>`;
      let content: string;
      if (this.historyTopic === 'local') {
        const location=this.engine.getStartLocation();
        content=`<div class="build-grid"><article class="build-card" data-local-history="home"><h3>${escape(localPlaceName(year))}</h3>
          <p>${escape(location.description)}</p><p>${year<860?'Der Start liegt vor der urkundlichen Ersterwähnung um 860. Der moderne Ortsname dient nur der Orientierung; eine damalige Siedlung genau am Kartenanker ist nicht belegt.':'Die Siedlung wird um 860 erstmals erwähnt. Deine Herrschaft und ihre Entwicklung bleiben eine eigene Spielgeschichte.'}</p>
          <a href="${location.sourceUrl}" target="_blank" rel="noopener noreferrer">${location.sourceTitle} ↗</a></article>
          ${localLandmarks(year).map(item=>`<article class="build-card" data-local-history="${item.id}"><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><p class="history-evidence">${escape(item.evidence)}</p><a href="${escape(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Quelle: ${escape(item.sourceTitle)} ↗</a></article>`).join('')}
          <article class="build-card" data-local-history="landscape"><h3>Geest, Bäche und Hasbruch</h3><p>Die Ganderkeseer Geest bildet eine flachwellige Landschaft. Welse, Dummbäke und Brookbäke verbinden ihre Niederungen. Der heutige Hasbruch ist ein historisch alter Waldstandort; seine Huteeichen erzählen von Waldweide und menschlicher Nutzung. Seine heutige Ausdehnung ist keine belegte Waldgrenze der Bronzezeit.</p><a href="https://www.nlwkn.niedersachsen.de/naturschutzgebiete/naturschutzgebiet-hasbruch-41382.html" target="_blank" rel="noopener noreferrer">NLWKN: Hasbruch ↗</a></article>
          <article class="build-card" data-local-history="sources"><h3>So liest du die Landkarte</h3><p>20 × 14 km, Norden oben, Maßstabsbalken 2 km. Die Farben zeigen die Geländehöhe, Höhenlinien liegen 5 m auseinander. Blau markiert ausgewählte reale Bach- und Flussachsen.</p><p>${LOCAL_MAP_NOTE}</p><p>Der Aufbauplan mit 16 Bezirken und die Strategiewelt mit Nachbarn sind Spielmodelle. Ihre Gebäude, Besitzverhältnisse und Wege sind keine historischen Kartierungen Ganderkesees.</p><p>${LOCAL_MAP_CREDIT}</p><a href="${import.meta.env.BASE_URL}maps/ganderkesee-source.json" target="_blank" rel="noopener noreferrer">Datenherkunft, Verarbeitung und Lizenzen ↗</a></article></div>`;
      } else if (this.historyTopic === 'exhibitions') {
        content = `<p>Kulturförderung ist freiwillig: Jede Ausstellung kostet Gold und bringt einmalig +2 Kultur sowie +1 Prestige.</p>
          <div class="build-grid">${exhibitions.slice().reverse().map((entry) => `
          <article class="build-card"><h3>${escape(entry.milestone.title)}</h3>
          <p>Historische Ausstellung · ${format(entry.cost)} Gold</p>
          <button data-sponsor-exhibition="${escape(entry.milestone.id)}"
          ${entry.held || !entry.affordable ? 'disabled' : ''}>
          ${entry.held ? 'Bereits gefördert' : entry.affordable ? 'Ausstellung fördern' : 'Zu wenig Gold'}</button>
          </article>`).join('') || '<p>Noch keine Ausstellungen verfügbar.</p>'}</div>`;
      } else if (this.historyTopic === 'events') {
        content = (report.events.length ? cards(report.events)
          : '<p>Für diesen Monat ist kein genau datiertes Ereignis im Katalog hinterlegt. Das bedeutet nicht, dass historisch nichts geschah.</p>')
          + (report.annual.length ? '<h3>Zusätzlicher Jahreskontext · Monat nicht hinterlegt</h3>' + cards(report.annual) : '');
      } else if (this.historyTopic === 'periods') {
        content = '<p class="muted">Entwicklungen und Datierungsspannen, keine Tagesereignisse. Die Grenzen sind nur so genau wie die jeweilige Quelle.</p>'
          + (report.periods.length ? cards(report.periods) : '<p>Für diesen Zeitpunkt ist noch kein belegter Zeitraum hinterlegt. Weitere Einordnungen stehen unter Zeitbild.</p>');
      } else if (this.historyTopic === 'archive') {
        content = records.length ? cards(records.slice().reverse()) : '<p>Noch keine Einträge verfügbar.</p>';
      } else {
        const knowledge = knowledgeForDate(year, month, this.historyTopic === 'all' ? undefined : this.historyTopic);
        content = `<p class="muted">Epochenwissen, keine Monatsereignisse. Die Zeitfenster sind redaktionelle Zuordnungen; Stile überlagern sich und unterscheiden sich nach Region und sozialem Milieu.</p>
          <div class="build-grid">${knowledge.map(item => `<article class="build-card" data-knowledge="${item.id}" data-knowledge-topic="${item.topic}">
            <p class="eyebrow">${KNOWLEDGE_TOPICS[item.topic]}</p><h3>${escape(item.title)}</h3>
            <p>${escape(item.description)}</p><p class="muted">${escape(item.place)} · Einordnung ca. ${escape(formatYearRange(item.from, item.to))}</p>
            <a href="${escape(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Quelle: ${escape(item.sourceTitle)} ↗</a>
          </article>`).join('') || '<p>Für dieses Thema und diesen Zeitpunkt ist noch kein Zeitbild hinterlegt. Die Chronologie enthält bereits vergangene Entwicklungen.</p>'}</div>`;
      }
      panel.innerHTML = heading('GESCHICHTE & ZEITBILD', `${MONTHS[month - 1]} ${formatYear(year)}: Kunst, Kultur und Leben`,
        'Historische Quellen begleiten deine eigene Herrschaft. Das Spiel schreitet monatsweise voran; bekannte Tagesdaten werden im betreffenden Monat angezeigt. Lesen verändert keine Ressourcen.')
        + `<form id="history-year-form"><label>Geschichte lesen im Jahr (negativ = v. Chr.)<input id="history-year" type="number" min="-2000" max="2100" value="${year<=0?year-1:year}" required></label><button>Jahr ansehen</button><button type="button" data-history-current>Zum Spieljahr</button></form><div class="quick-actions">${[-100,-10,-1,1,10,100].map(n=>`<button data-history-step="${n}">${n>0?'+':''}${n} Jahre</button>`).join('')}</div><p class="muted">Lesereise: verändert deine Partie nicht. Echte Spieljahre berechnest du mit der Zeitreise im Überblick.</p><label class="history-filter" for="history-topic">Thema<select id="history-topic">${Object.entries(topics).map(([value, label]) =>
          `<option value="${value}" ${value === this.historyTopic ? 'selected' : ''}>${label}</option>`).join('')}</select></label>` + content;
    } else if (this.view === 'chronicle') {
      panel.innerHTML = heading('DIE GESCHICHTE DEINER HERRSCHAFT', 'Reichschronik',
        'Die letzten 100 wichtigen Meldungen deiner Herrschaft bleiben auch nach dem Laden erhalten.') + `
        <ol class="journal">${this.journal.map((entry: JournalEntry) =>
          `<li><time>${escape(entry.date)}</time><div class="message-content">${journalMessageHtml(entry.message)}</div></li>`).join('')}</ol>`;
    } else {
      panel.innerHTML = heading('EIN GUTER ANFANG', 'So regierst du dein Reich',
        'Alle sichtbaren Aktionen verändern denselben gespeicherten Spielzustand.') + `
        <article class="build-card" aria-label="Tutorial"><h3>Deine ersten Schritte</h3><p>1. Prüfe die Nahrungsbilanz. 2. Baue einen Bauernhof. 3. Lasse einen Monat vergehen. 4. Erforsche neue Technologien. 5. Errichte einen Hafen und spare für die Hanseroute.</p><button data-open="build" class="primary">Mit dem Bauen beginnen →</button></article>
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
          Deutschlands. Mehrspieler bedeutet hier: mehrere Herrscher abwechselnd an einem Gerät (Hotseat).</p>
        <div style="margin-top:1.5rem;text-align:center">
          <button class="primary" id="help-open-docs" style="font-size:1.1em;padding:0.75em 2em">
            📚 Vollständige Dokumentation öffnen
          </button>
        </div>`;
    }
    panel.querySelector<HTMLSelectElement>('#history-topic')?.addEventListener('change', event => {
      this.historyTopic = (event.target as HTMLSelectElement).value as typeof this.historyTopic;
      const body = this.root.querySelector('#section-dialog-body');
      if (body) body.scrollTop = 0;
      this.renderPanel();
      this.updatePanelPagination();
    });
    panel.querySelector<HTMLSelectElement>('[data-character-plan]')?.addEventListener('change',event=>void this.run(()=>{
      const prefs=this.requireEngine().getAdministration(this.requirePlayer().id);
      prefs.characterPlan=(event.target as HTMLSelectElement).value as CharacterPlan;
      this.requireEngine().setAdministration(this.requirePlayer().id,prefs);
    }));
    panel.querySelector<HTMLSelectElement>('[data-administration-policy]')?.addEventListener('change',event=>void this.run(()=>{
      const prefs=this.requireEngine().getAdministration(this.requirePlayer().id);
      prefs.policy=(event.target as HTMLSelectElement).value as AdministrationPolicy;
      this.requireEngine().setAdministration(this.requirePlayer().id,prefs);
    }));
    panel.querySelectorAll<HTMLInputElement>('[data-administration-domain]').forEach(input=>input.addEventListener('change',()=>void this.run(()=>{
      const prefs=this.requireEngine().getAdministration(this.requirePlayer().id);
      prefs.domains[input.dataset.administrationDomain as AdministrationDomain]=input.checked;
      this.requireEngine().setAdministration(this.requirePlayer().id,prefs);
    })));
    panel.querySelectorAll<HTMLButtonElement>('[data-administration-preset]').forEach(button=>button.addEventListener('click',()=>void this.run(()=>{
      const enabled=button.dataset.administrationPreset==='watch';
      const prefs=this.requireEngine().getAdministration(this.requirePlayer().id);
      ADMIN_DOMAINS.forEach(domain=>prefs.domains[domain]=enabled);
      this.requireEngine().setAdministration(this.requirePlayer().id,prefs);
      this.requireEngine().setCouncilAutomatic(this.requirePlayer().id,enabled);
      for(const assistant of this.requireEngine().getCourtAssistants(this.requirePlayer().id))
        this.requireEngine().setCourtAssistantMode(this.requirePlayer().id,assistant.office,enabled?'automatisch':'beratung');
      this.notify(enabled?'Verwaltung und Ereignisse delegiert. Mit Fortsetzen kannst du zuschauen.':'Die Entscheidungen liegen wieder bei dir.');
    })));
    panel.querySelectorAll<HTMLButtonElement>('[data-garrison]').forEach(button=>button.addEventListener('click',()=>void this.run(()=>{
      this.notify(this.requireEngine().improveGarrison(this.requirePlayer().id,button.dataset.garrison!));
    })));
    panel.querySelectorAll<HTMLButtonElement>('[data-character-page]').forEach(button => button.addEventListener('click', () => {
      this.characterPage = Math.max(0, this.characterPage + Number(button.dataset.characterPage));
      const scroll = this.root.querySelector('#section-dialog-body')?.scrollTop ?? 0;
      this.renderPanel();
      const body = this.root.querySelector('#section-dialog-body');
      if (body) body.scrollTop = scroll;
    }));
    panel.querySelectorAll<HTMLButtonElement>('[data-provision-action]').forEach(button=>button.addEventListener('click',()=>void this.run(()=>{
      this.requireEngine().addressRegionalProvisioning(this.requirePlayer().id,button.dataset.provisionTarget!,button.dataset.provisionAction!);
    })));
    panel.querySelectorAll<HTMLButtonElement>('[data-civic-assign]').forEach(button => {
      button.addEventListener('click',()=>void this.run(()=>{
        const missionId=button.dataset.civicAssign??'';
        const citizenId=panel.querySelector<HTMLSelectElement>('[data-civic-citizen="'+missionId+'"]')?.value??'';
        this.notify(this.requireEngine().assignCivicMission(this.requirePlayer().id,citizenId,missionId));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-court-appoint]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        const select = panel.querySelector<HTMLSelectElement>(
          '[data-court-candidate="' + button.dataset.courtAppoint + '"]');
        this.requireEngine().appointCourtAssistant(this.requirePlayer().id,
          button.dataset.courtAppoint as CourtOffice, select?.value ?? '');
        this.notify('Hofamt besetzt.');
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-court-dismiss]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.requireEngine().dismissCourtAssistant(this.requirePlayer().id,
          button.dataset.courtDismiss as CourtOffice);
      }));
    });
    panel.querySelectorAll<HTMLSelectElement>('[data-court-mode]').forEach((select) => {
      select.addEventListener('change', () => void this.run(() => {
        this.requireEngine().setCourtAssistantMode(this.requirePlayer().id,
          select.dataset.courtMode as CourtOffice, select.value as AssistantMode);
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-siege-target]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().beginCampaignSiege(this.requirePlayer().id,
          button.dataset.siegeTarget ?? ''));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-siege-resupply]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().resupplyCampaignSiege(this.requirePlayer().id));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-siege-withdraw]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().withdrawCampaignSiege(this.requirePlayer().id));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-border-watch]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().prepareBorderWatch(this.requirePlayer().id));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-war-loan]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().takeWarLoan(this.requirePlayer().id));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-spy-recruit]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().recruitCampaignSpy(this.requirePlayer().id));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-spy-agent]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().sendCampaignSpy(this.requirePlayer().id,
          button.dataset.spyAgent ?? '', button.dataset.spyTarget ?? ''));
      }));
    });
    panel.querySelector('#history-year-form')?.addEventListener('submit',event=>{
      event.preventDefault();const value=Number(panel.querySelector<HTMLInputElement>('#history-year')!.value);
      if(Number.isInteger(value)&&value!==0&&value>=-2000&&value<=2100){this.historyYear=value<0?value+1:value;this.renderPanel();}
    });
    panel.querySelector('[data-history-current]')?.addEventListener('click',()=>{this.historyYear=null;this.renderPanel();});
    panel.querySelectorAll<HTMLButtonElement>('[data-history-step]').forEach(button=>button.onclick=()=>{this.historyYear=Math.max(-1999,Math.min(2100,(this.historyYear??this.requireEngine().getCurrentYear())+Number(button.dataset.historyStep)));this.renderPanel();});
    panel.querySelectorAll<HTMLButtonElement>('[data-modernization]').forEach(button => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().launchModernization(this.requirePlayer().id,
          button.dataset.modernization ?? ''));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-sponsor-exhibition]').forEach((button) => {
      button.addEventListener('click', () => void this.run(() => {
        this.notify(this.requireEngine().sponsorExhibition(this.requirePlayer().id,
          button.dataset.sponsorExhibition ?? ''));
      }));
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-festival]').forEach((button) => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const message = this.requireEngine().holdFestival(
            this.requirePlayer().id, button.dataset.festival ?? '');
          this.notify(message);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-negotiate-truce]').forEach((button) => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const message = this.requireEngine().negotiateRivalTruce(
            this.requirePlayer().id, button.dataset.negotiateTruce ?? '');
          this.notify(message);
          this.audio.playEffect('success');
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-send-envoy]').forEach((button) => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const message = this.requireEngine().sendRivalEnvoy(
            this.requirePlayer().id, button.dataset.sendEnvoy ?? '');
          this.notify(message);
          this.audio.playEffect('trade');
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-world-travel]').forEach(button=>{
      button.onclick=()=>void this.run(()=>{this.notify(this.requireEngine().travelWorld(this.requirePlayer().id,button.dataset.worldTravel!));});
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-world-focus]').forEach(button=>{
      button.onclick=()=>{
        this.root.querySelector<HTMLDialogElement>('#section-dialog')?.close();
        const scope=this.root.querySelector<HTMLSelectElement>('#map-scope');
        if(scope)scope.value='world';
        this.map?.focusWorldRegion(button.dataset.worldFocus!);
        this.updateZoomHint();
      };
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-world-diplomacy]').forEach(button=>{
      button.onclick=()=>{this.focusedRivalId=button.dataset.worldDiplomacy;this.navigate('diplomacy');};
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-agreement]').forEach(button=>{
      button.onclick=()=>void this.run(()=>{this.notify(this.requireEngine().negotiateRivalAgreement(this.requirePlayer().id,button.dataset.rival!,button.dataset.agreement as 'trade'|'alliance'));});
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-break-treaty]').forEach(button=>{
      button.onclick=()=>void this.run(()=>{this.notify(this.requireEngine().breakRivalTreaty(this.requirePlayer().id,button.dataset.breakTreaty!));});
    });
    this.bindCouncilAutomatic(panel);
    panel.querySelectorAll<HTMLButtonElement>('[data-council-choice]').forEach((button) => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const result = this.requireEngine().resolveCouncilDecision(
            this.requirePlayer().id, button.dataset.councilChoice ?? '');
          this.notify(result.message, !result.success);
          this.resumeAfterCouncilDecision();
          this.audio.playEffect(result.success ? 'success' : 'battle');
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => this.navigate(button.dataset.open as View));
    });
    const helpDocsBtn = panel.querySelector<HTMLButtonElement>('#help-open-docs');
    if (helpDocsBtn) {
      helpDocsBtn.addEventListener('click', (): void => { this.helpSystem.toggle(); });
    }
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
    panel.querySelectorAll<HTMLButtonElement>('[data-time-travel]').forEach(button=>button.onclick=()=>void this.run(async()=>{
      const result=await this.requireEngine().travelThroughTime(Number(button.dataset.timeTravel));this.notify(result.completed+' Monate berechnet. '+result.reason);
    }));
    panel.querySelector('[data-time-stop]')?.addEventListener('click',()=>this.requireEngine().cancelTimeTravel());
    panel.querySelectorAll<HTMLButtonElement>('[data-build]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run(async (): Promise<void> => {
          const type = button.dataset.build as keyof KingdomInfrastructure;
          if (!await this.requireEngine().buildForPlayer(this.requirePlayer().id, type)) {
            throw new Error('Nicht genügend Ressourcen für dieses Bauvorhaben.');
          }
          this.audio.playEffect('build');
          this.selected = type;
          const name = earlyBuildingName(type, this.requireEngine().getCurrentYear(), STRUCTURES[type].name);
          this.notify(`${name} beauftragt. Fertigstellung in ${this.requireEngine().getConstructionMonths(type)} Monaten; Kosten bezahlt.`);
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
          this.notify('10 Rekruten beginnen ihre Ausbildung. Einsatzbereit nach 3 Monaten, Reiterei nach 6 Monaten.');
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-attack-rival]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const message = this.requireEngine().launchCampaign(this.requirePlayer().id, button.dataset.attackRival ?? '');
          this.notify(message);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-attack-player]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const message = this.requireEngine().launchPlayerCampaign(this.requirePlayer().id, button.dataset.attackPlayer ?? '');
          this.notify(message);
        });
      });
    });
    panel.querySelectorAll<HTMLButtonElement>('[data-char-action]').forEach((button: HTMLButtonElement): void => {
      button.addEventListener('click', (): void => {
        void this.run((): void => {
          const message = this.requireEngine().performCharacterAction(
            this.requirePlayer().id, button.dataset.charAction as CharacterAction);
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
    const taxSlider=panel.querySelector<HTMLInputElement>('#tax-rate');
    taxSlider?.addEventListener('input',()=>{
      this.requireEngine().setTaxRate(this.requirePlayer().id,Number(taxSlider.value)/100);
      const output=panel.querySelector('#tax-value'); if(output)output.textContent=taxSlider.value+' %';
    });
    taxSlider?.addEventListener('change',()=>{this.record(`Steuersatz auf ${taxSlider.value} % festgelegt.`);this.refresh();});
    const tradeForm = panel.querySelector<HTMLFormElement>('#trade-form');
    if (tradeForm) {
      const updateQuote = (): void => {
        const data = new FormData(tradeForm);
        this.tradeResource=String(data.get('resource')) as MarketResource;
        this.tradeAmount=String(data.get('amount')??'');
        const amount = Number(data.get('amount'));
        const quote = panel.querySelector('#trade-quote');
        if (!quote) return;
        if (!Number.isSafeInteger(amount) || amount <= 0) {
          quote.textContent = 'Bitte eine positive ganze Menge eingeben.';
          return;
        }
        const resource = String(data.get('resource')) as MarketResource;
        const engine = this.requireEngine();
        quote.textContent = `Vorrat: ${format(this.requirePlayer().kingdom.resources[resource])} ${RESOURCE_NAMES[resource]} · Kauf: ${format(engine.quoteTrade(resource, amount, 'buy'))} Gold · Verkauf: ${
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

  /**
   * Bindet den Zoom-Schieberegler an die Karte.
   *
   * Der Slider ist die primäre Steuerung (testbar, tastaturbedienbar); die
   * bestehenden „+"/„−"-Buttons bleiben als gleichwertiger Weg erhalten.
   * Ohne aktives Feature-Flag bleibt der Slider ausgeblendet und die Karte
   * verhält sich wie bisher.
   */
  private bindZoomSlider(): void {
    const wrap = this.root.querySelector<HTMLElement>('#zoom-slider-wrap');
    const slider = this.root.querySelector<HTMLInputElement>('#zoom-slider');
    if (!wrap || !slider) return;
    if (!isZoomLevelsEnabled()) {
      wrap.hidden = true;
      this.root.querySelector<HTMLElement>('.atlas-navigation')?.setAttribute('hidden', '');
      return;
    }
    wrap.hidden = false;
    slider.value = String(this.map?.getZoomSlider() ?? 100);
    slider.addEventListener('input', (): void => {
      this.applyZoomSlider(Number(slider.value));
    });
    this.updateZoomHint();
  }

  /** Wendet einen Slider-Wert auf die Karte an und aktualisiert Hinweis und Ebene. */
  private applyZoomSlider(value: number): void {
    if (!this.map) return;
    this.map.setZoomSlider(value);
    this.updateZoomHint();
  }

  /**
   * Behandelt die bestehenden „+"/„−"/„Zentrieren"-Buttons.
   *
   * Bei aktivem Slider wird der Schritt über den Slider-Wert gerechnet, damit
   * beide Bedienwege denselben Zustand teilen. `0` bleibt „zentrieren".
   */
  private applyZoomStep(change: number): void {
    if (!this.map) return;
    if (change === 0) {
      this.map.changeZoom(0);
      this.updateZoomHint();
      return;
    }
    if (!isZoomLevelsEnabled()) {
      this.map.changeZoom(change);
      return;
    }
    const next = stepSlider(this.map.getZoomSlider(), change > 0 ? 1 : -1);
    this.applyZoomSlider(next);
    const slider = this.root.querySelector<HTMLInputElement>('#zoom-slider');
    if (slider) slider.value = String(next);
  }

  /** Aktualisiert Ebenenbezeichnung und Legende unter dem Slider. */
  private updateZoomHint(): void {
    if (!this.map) return;
    const slider = this.root.querySelector<HTMLInputElement>('#zoom-slider');
    if (slider) slider.value = String(this.map.getZoomSlider());
    const level = this.map.getZoomLevel();
    this.root.querySelector('.map-card')?.setAttribute('data-level', level);
    this.root.querySelectorAll<HTMLElement>('[data-map-level]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapLevel === level)));
    const label = this.root.querySelector<HTMLElement>('#zoom-level-label');
    if (label) label.textContent = level === 'dorf' ? 'Aufbauplan · 16 Bezirke' : level === 'schreibtisch' ? 'Dein Schreibtisch' : 'Ganderkesee · Geest & Bäche';
    const hint = this.root.querySelector<HTMLElement>('#zoom-hint');
    if (!hint) return;
    if (level !== 'zentraleuropa') {
      hint.hidden = true;
      hint.textContent = '';
      return;
    }
    hint.hidden = false;
    hint.textContent = this.map.getRegionLegend();
  }

  private async action(action: string): Promise<void> {
    const engine = this.requireEngine();
    if ((action === 'month' || action === 'endturn') &&
        engine.getPendingCouncilDecision(this.requirePlayer().id)) {
      this.navigate('council');
      throw new Error('Der Reichsrat wartet auf deine Entscheidung.');
    }
    if (action === 'exit') { await this.exitToMenu(); return; }
    if (action === 'pause') this.togglePause();
    if (action === 'month') {
      const wasRunning = engine.getGameState() === GameState.RUNNING;
      engine.pauseGame();
      await engine.advanceMonth();
      if (wasRunning && !engine.getPendingCouncilDecision(this.requirePlayer().id)) engine.resumeGame();
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
      const wasRunning = engine.getGameState() === GameState.RUNNING;
      engine.pauseGame();
      try {
        await engine.saveGame('campaign', true);
        this.saves = await engine.listSaves();
        this.notify('Herrschaft gespeichert.');
      } finally {
        if (wasRunning && !engine.getPendingCouncilDecision(this.requirePlayer().id)) engine.resumeGame();
      }
    }
    if (action === 'load') {
      engine.pauseGame();
      if (!this.saves.length) throw new Error('Noch kein Spielstand vorhanden. Zuerst speichern.');
      await engine.loadGame(this.saves[0].slot);
      this.player = engine.getActivePlayer();
      this.journal = engine.getChronicle();
      this.restoreCampaignResult();
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
      const needsPort = route.id.includes('sea') || route.id.includes('naval') || route.id === 'hanseatic_routes' || route.id === 'baltic_trade';
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
        <p class="muted" title="Handelsrouten brauchen die nötige Forschung, einen Hafen bei Seerouten und ausreichend Gold.">Voraussetzungen: Forschung freigeschaltet · ${needsPort ? 'Hafen nötig · ' : ''}${format(activationCost)} Gold.</p>
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
    const doctrine = doctrineForYear(engine.getCurrentYear());
    const blocker = this.campaignBlocker(player);
    const percent = (value: number): string => `${Math.round(value * 100)} %`;
    const rivals = engine.getRivals(player.id).map((rival: RivalRealm): string => {
      const chance = engine.getVictoryChance(player.id, rival.id);
      const truce = engine.hasRivalTruce(player.id, rival.id);
      return `<article class="build-card rival-card ${rival.subjugated ? 'subjugated' : ''}">
        <div class="build-title"><span aria-hidden="true">${rival.subjugated ? '⚐' : '⚔'}</span>
          <h3>${escape(rival.name)}</h3><small>${rival.subjugated ? 'Unterworfen' : 'Feindlich'}</small></div>
        <p>${escape(rival.description)}</p>
        <dl class="stat-list"><div><dt>Soldaten</dt><dd>${format(rival.soldiers)}</dd></div>
          <div><dt>Stärke</dt><dd>${format(CampaignWarfareSystem.rivalPower(rival, engine.getCurrentYear()))}</dd></div>
          <div><dt>${rival.subjugated ? 'Tribut' : 'Siegchance'}</dt><dd class="${rival.subjugated || chance >= 0.5
            ? 'positive' : 'negative'}">${rival.subjugated ? `${format(rival.loot / 24)} Gold/Mo.` : percent(chance)}</dd></div>
        </dl>
        ${rival.subjugated ? '' : `<p class="cost">Beute bei Sieg: ${format(rival.loot)} Gold · ${
          format(rival.settlers)} Siedler</p>`}
        <button class="${chance >= 0.5 ? 'primary' : 'secondary'}" data-attack-rival="${escape(rival.id)}"
          ${rival.subjugated || blocker || truce ? 'disabled' : ''}>${rival.subjugated ? 'Bereits unterworfen'
            : truce ? 'Nichtangriffspakt aktiv'
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
      return `<li class="report ${won ? 'won' : 'lost'}"><time>${MONTHS[report.month - 1]} ${formatYear(report.year)}</time>
        <div><strong>${escape(report.attacker)} ⚔ ${escape(report.defender)} · ${won ? 'Sieg' : 'Niederlage'}</strong>
          <p>${escape(report.summary)}</p>
          <small>Kraft ${format(report.attackerPower)} : ${format(report.defenderPower)} · Siegchance ${
            percent(report.victoryChance)} · Verluste ${format(report.attackerLosses)} / ${
            format(report.defenderLosses)}${report.plunder ? ` · Beute ${format(report.plunder)} Gold` : ''}</small></div></li>`;
    }).join('');
    return this.renderOngoingProjects()+`<p class="muted"><strong>${escape(doctrine.label)}</strong> · ${escape(doctrine.context)}</p><div class="summary-grid war-summary">
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
    const succession=engine.getCharacterSuccession(player.id);
    const familyNames:Record<string,string>={spouse:'Partnerperson',child:'Kind',parent:'Elternteil',sibling:'Geschwister',grandchild:'Enkelkind',grandparent:'Großelternteil'};
    const people = engine.getPlayableCharacters(Number.MAX_SAFE_INTEGER);
    const pages = Math.max(1, Math.ceil(people.length / 6));
    this.characterPage = Math.min(this.characterPage, pages - 1);
    const candidates = people.slice(this.characterPage * 6, this.characterPage * 6 + 6).map((citizen: Citizen): string => `<li>
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
          <div><dt>Gesundheit</dt><dd data-character-health>${format(character.health.overall)} %</dd></div>
          <div><dt>Nahrungsversorgung</dt><dd>${format(character.needs.food)} %</dd></div>
          <div><dt>Unterkunft</dt><dd>${format(character.needs.shelter)} %</dd></div>
          <div><dt>Feldherrenbonus</dt><dd>${Math.round(engine.getArmyOverview(player.id).commanderBonus * 100)} %</dd></div></dl>
        <div class="skill-list">${SKILLS.map(([key, label]): string => `<label>${label}
          <progress max="100" value="${character.skills[key]}"></progress><span>${format(character.skills[key])}</span></label>`)
          .join('')}</div></article>`
      : `<p class="notice error inline-notice">Dein Charakter ist verstorben. Übernimm eine neue Rolle aus der Liste.</p>`;
    const actions = CHARACTER_ACTIONS.map(([key, label, description]): string => `<article class="build-card">
        <h3>${label}</h3><p>${description}</p>
        <button class="secondary" data-char-action="${key}" ${canAct ? '' : 'disabled'}>${label}</button></article>`).join('');
    return `${this.renderAdministration(['character'])}${current}
      <section class="build-card" data-family-overview><h3>Familie & Nachfolge</h3>
      <p>Erwachsene freie Kinder werden zuerst berücksichtigt, dann Partner und andere Erwachsene. Minderjährige wachsen regulär heran. Ein eigener Erbe ist keine Voraussetzung, um weiterzuspielen.</p>
      <ul>${succession.family.slice(0,6).map(({relation,citizen})=>`<li>${familyNames[relation]??escape(relation)}: ${escape(citizen.firstName+' '+citizen.lastName)} · ${citizen.age} Jahre</li>`).join('')||'<li>Noch keine lebenden Angehörigen erfasst. Haushalte und Kinder können im Spielverlauf entstehen.</li>'}</ul>
      <p data-successor>${succession.candidates[0]?'Derzeit mögliche Nachfolge: '+escape(succession.candidates[0].firstName+' '+succession.candidates[0].lastName):'Noch keine freie erwachsene Nachfolge verfügbar.'}</p></section>
      <h3>Monatliche Handlung</h3>
      <p class="muted">${!character ? 'Ohne lebenden Charakter sind keine Handlungen möglich.'
        : canAct ? 'Dein Charakter kann in diesem Monat eine Handlung ausführen.'
          : 'Dein Charakter hat in diesem Monat bereits gehandelt. Warte auf den nächsten Monat.'}</p>
      <div class="build-grid">${actions}</div>
      <h3>Rolle wechseln</h3>
      <p class="muted">Die bisherige Figur lebt als Bürger weiter. Du kannst auch Bauern, Handwerker, Händler und andere gesellschaftliche Gruppen übernehmen.</p>
      <p class="muted">Fiktive Personen mit Namen nach Geburtszeit; frühe, nicht belegbare lokale Namen bleiben als Bewohner gekennzeichnet. Bestehende Spielstände behalten ihre Personen. Sechs Rollen pro Seite.</p>
      <ul class="character-list">${candidates}</ul>
      <div class="character-pagination"><button data-character-page="-1" ${this.characterPage === 0 ? 'disabled' : ''}>Vorherige Rollen</button><span>${this.characterPage + 1} / ${pages}</span><button data-character-page="1" ${this.characterPage + 1 >= pages ? 'disabled' : ''}>Weitere Rollen</button></div>`;
  }

  private togglePause(): void {
    this.resumeAfterCouncil = false;
    const engine = this.requireEngine();
    if (engine.getGameState() === GameState.RUNNING) engine.pauseGame();
    else engine.resumeGame();
  }



  /** Film presentation, with an audible soft whoosh following a short studio card. */
  private playWhoosh(): void {
    try {
      const AudioCtx = window.AudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const duration = 0.85;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const t = i / samples.length;
        const envelope = Math.sin(Math.PI * t) ** 1.8;
        samples[i] = (Math.random() * 2 - 1) * envelope * 0.17;
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.38);
      filter.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + duration);
      gain.gain.value = 0.22;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      source.onended = (): void => { void ctx.close(); };
    } catch { /* Browsers may block Web Audio before interaction. */ }
  }

  private async refreshCinematicClips(): Promise<void> {
    try { this.cinematicClips = await loadCinematicLibrary(); }
    catch (error) { console.warn('Filmkatalog:',error); }
    this.updateFilmSettings();
    // The catalog loads asynchronously; respect intro selection even at first launch.
    const introVideo = this.root.querySelector<HTMLVideoElement>('#intro-video');
    if (introVideo && !this.introDismissed && introVideo.paused) {
      const chosen = filmForRole(this.cinematicClips, 'intro', filmPreferences());
      const source = introVideo.querySelector('source');
      if (chosen && source && !source.src.endsWith(chosen.url)) {
        source.src = chosen.url;
        introVideo.load();
      }
    }
  }
  private updateFilmSettings(): void {
    const status=this.root.querySelector<HTMLElement>('#film-library-status');
    if(status)status.textContent=this.cinematicClips.length+' Filmdateien verfügbar (einschließlich zusätzlicher Clips).';
    const prefs=filmPreferences();
    for(const role of ['intro','outro','interlude'] as FilmRole[]){
      const select=this.root.querySelector<HTMLSelectElement>('#film-'+role);
      if(!select)continue;
      select.replaceChildren();
      if(role==='interlude')select.add(new Option('Kein Zwischenvideo',''));
      for(const clip of this.cinematicClips)select.add(new Option(clip.title,clip.id));
      select.value=prefs[role];
    }
    const enabled=this.root.querySelector<HTMLInputElement>('#film-interludes-enabled');
    if(enabled)enabled.checked=prefs.interludesEnabled;
  }
  private bindFilmSettings(): void {
    this.updateFilmSettings();
    for(const role of ['intro','outro','interlude'] as FilmRole[]){
      this.root.querySelector<HTMLSelectElement>('#film-'+role)?.addEventListener('change',event=>{
        const select=event.currentTarget as HTMLSelectElement;
        saveFilmPreferences({...filmPreferences(),[role]:select.value});
      });
    }
    this.root.querySelector<HTMLInputElement>('#film-interludes-enabled')?.addEventListener('change',event=>{
      saveFilmPreferences({...filmPreferences(),interludesEnabled:(event.currentTarget as HTMLInputElement).checked});
    });
    this.root.querySelector('#film-preview')?.addEventListener('click',()=>{
      const clip=filmForRole(this.cinematicClips,'interlude',filmPreferences());
      if(clip)this.showInterlude(clip,'Filmvorschau');
      else this.notify('Bitte erst ein Zwischenvideo auswählen.',true);
    });
    const close=()=>this.interludeDialog?.close();
    this.root.querySelector('#film-dialog-close')?.addEventListener('click',close);
    this.root.querySelector('#film-dialog-skip')?.addEventListener('click',close);
    this.root.querySelector('#film-dialog-play')?.addEventListener('click',()=>{
      const video=this.root.querySelector<HTMLVideoElement>('#film-dialog-video');
      if(video){video.muted=false;void video.play().catch(()=>this.notify('Video benötigt eine Benutzeraktion.',true));}
    });
    const dialog=this.root.querySelector<HTMLDialogElement>('#film-dialog');
    dialog?.addEventListener('close',()=>{
      const video=this.root.querySelector<HTMLVideoElement>('#film-dialog-video');
      video?.pause();if(video)video.removeAttribute('src');
      if(this.engine&&!this.engine.isHotseat()&&this.engine.getGameState()===GameState.PAUSED&&!this.engine.getPendingCouncilDecision(this.player?.id??'')){
        // Deliberately leave gameplay paused: never resume a game the player paused.
      }
      this.interludeDialog=undefined;
    });
  }
  private showInterlude(clip:CinematicClip,title:string):void {
    const dialog=this.root.querySelector<HTMLDialogElement>('#film-dialog');
    const video=this.root.querySelector<HTMLVideoElement>('#film-dialog-video');
    if(!dialog||!video||dialog.open)return;
    const titleElement=this.root.querySelector<HTMLElement>('#film-dialog-title');
    if(titleElement)titleElement.textContent=title;
    this.interludeDialog=dialog;
    video.src=clip.url;video.muted=false;
    video.onended=()=>dialog.close();
    dialog.showModal();
    void video.play().catch(()=>{video.pause();});
  }

  private bindIntro(): void {
    const overlay = this.root.querySelector<HTMLElement>('#intro-overlay');
    const video = this.root.querySelector<HTMLVideoElement>('#intro-video');
    const activate = this.root.querySelector<HTMLButtonElement>('#intro-activation');
    if (!overlay || !video || !activate) return;
    const intro=filmForRole(this.cinematicClips,'intro',filmPreferences());
    if(intro){const source=video.querySelector('source');if(source){source.src=intro.url;video.load();}}
    video.muted = false;
    video.volume = 1;
    const finish = (): void => {
      if (this.introDismissed) return;
      this.introDismissed = true;
      window.clearTimeout(this.cinematicTimeout);
      overlay.classList.add('cinematic-exit');
      video.pause();
      this.cinematicTimeout = window.setTimeout(() => {
        overlay.remove();
        void this.tryOpeningTheme();
      }, 550);
    };
    const playFilm = (): void => {
      video.muted = false;
      void video.play().then(() => {
        activate.hidden = true;
        overlay.classList.add('film-playing');
      }).catch(() => { activate.hidden = false; });
    };
    this.root.querySelector('#intro-skip')?.addEventListener('click', finish);
    video.addEventListener('ended', finish, { once: true });
    video.addEventListener('error', finish, { once: true });
    activate.addEventListener('click', () => { this.playWhoosh(); playFilm(); });
    this.cinematicTimeout = window.setTimeout(() => {
      this.playWhoosh();
      playFilm();
    }, 1600);
  }

  private async tryOpeningTheme(): Promise<void> {
    if (!this.introDismissed || this.jukebox.isPlaying() || this.openingAttempt) return;
    this.openingAttempt = true;
    try {
      const played = await this.jukebox.playOpening();
      const label = this.root.querySelector<HTMLElement>('#opening-music-label');
      if (label) label.textContent = played ? '♫ Ancient Veil · Hauptthema läuft'
        : '♫ Ancient Veil · Wiedergabe beim nächsten Klick';
      this.updateOpeningMusicButton();
      if (played) {
        document.removeEventListener('pointerdown', this.retryOpening);
        document.removeEventListener('keydown', this.retryOpening);
      } else {
        document.addEventListener('pointerdown', this.retryOpening, { once: true });
        document.addEventListener('keydown', this.retryOpening, { once: true });
      }
    } finally { this.openingAttempt = false; }
  }

  private updateOpeningMusicButton(): void {
    const button = this.root.querySelector<HTMLButtonElement>('#opening-toggle');
    if (!button) return;
    const playing = this.jukebox.isPlaying();
    button.textContent = playing ? 'Ⅱ Pause' : '▶ Play';
    button.setAttribute('aria-label', playing ? 'Musik pausieren' : 'Musik abspielen');
  }

  private async toggleOpeningMusic(): Promise<void> {
    document.removeEventListener('pointerdown', this.retryOpening);
    document.removeEventListener('keydown', this.retryOpening);
    if (this.jukebox.isPlaying()) this.jukebox.stop();
    else {
      try { await this.jukebox.playOpening(); }
      catch { this.notify('Musik konnte nicht abgespielt werden.', true); }
    }
    this.updateOpeningMusicButton();
  }

  private async exitToMenu(): Promise<void> {
    this.engine?.pauseGame();
    this.map?.dispose();
    this.map = undefined;
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions = [];
    this.engine?.dispose();
    this.engine = undefined;
    this.player = undefined;
    this.jukebox.stop();
    this.showMenu();
    const overlay = this.root.querySelector<HTMLElement>('#intro-overlay');
    const video = this.root.querySelector<HTMLVideoElement>('#intro-video');
    if (!overlay || !video) return;
    window.clearTimeout(this.cinematicTimeout);
    this.introDismissed = false;
    overlay.querySelector('.production-card')?.remove();
    video.querySelector('source')?.setAttribute('src', filmForRole(this.cinematicClips,'outro',filmPreferences())?.url ?? (import.meta.env.BASE_URL + 'video/intro.mp4'));
    video.load();
    const skip = this.root.querySelector('#intro-skip');
    if (skip) skip.textContent = 'Zum Hauptmenü →';
    this.cinematicTimeout = window.setTimeout(() => {
      video.muted = false;
      overlay.classList.add('film-playing');
      void video.play().catch(() => {
        const activation = this.root.querySelector<HTMLButtonElement>('#intro-activation');
        if (activation) activation.hidden = false;
      });
    }, 250);
  }

  private resumeAfterCouncilDecision(): void {
    if (!this.resumeAfterCouncil || !this.engine || !this.player || this.engine.isHotseat()) return;
    if (this.engine.getPendingCouncilDecision(this.player.id)) return;
    this.resumeAfterCouncil = false;
    if (this.engine.getGameState() === GameState.PAUSED) this.engine.resumeGame();
  }

  private updateJukeboxStatus(): void {
    this.root.querySelectorAll<HTMLSelectElement>('[data-jukebox-select]').forEach(select => {
      const chosen=select.value;
      const items=this.jukebox.getTracks();
      select.replaceChildren(...items.map(t => {
        const option=document.createElement('option');option.value=t.id;
        option.textContent=t.title+' · '+t.era;return option;
      }));
      select.value=this.jukebox.getCurrentId() ?? (items.some(t=>t.id===chosen)?chosen:(items[0]?.id ?? ''));
      select.disabled = !items.length;
    });
    const selectedId = this.root.querySelector<HTMLSelectElement>('[data-jukebox-select]')?.value
      ?? this.jukebox.getCurrentId() ?? MAIN_THEME.id;
    const selectedTrack = this.jukebox.getTracks().find(t => t.id === selectedId);
    const cover = this.root.querySelector<HTMLImageElement>('[data-jukebox-cover]');
    if (cover && selectedTrack) { cover.src = selectedTrack.coverUrl ?? MAIN_THEME.coverUrl!; cover.alt = 'Cover: ' + selectedTrack.title; }
    const title = this.root.querySelector<HTMLElement>('[data-jukebox-title]');
    if (title) title.textContent = selectedTrack?.title ?? 'Soundtrack';
    const desc = this.root.querySelector<HTMLElement>('[data-jukebox-description]');
    if (desc) desc.textContent = selectedTrack?.description ?? selectedTrack?.era ?? '';
    const gallery = this.root.querySelector<HTMLElement>('[data-jukebox-gallery]');
    if (gallery && !gallery.hasChildNodes()) {
      this.jukebox.getTracks().filter(t => t.source === 'library').forEach(track => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'cover-card'; button.dataset.coverId = track.id;
        const img = document.createElement('img'); img.src = track.coverUrl ?? '';
        img.alt = ''; img.loading = 'lazy';
        const name = document.createElement('span'); name.textContent = track.title;
        button.append(img, name); button.title = track.era;
        button.addEventListener('click', () => {
          const select = this.root.querySelector<HTMLSelectElement>('[data-jukebox-select]');
          if (select) select.value = track.id;
          this.updateJukeboxStatus();
          this.jukebox.setPlaylistMode('sequential');
          const mode = this.root.querySelector<HTMLSelectElement>('#playlist-mode');
          if (mode) mode.value = 'sequential';
          void this.run(async () => { await this.jukebox.play(track.id); });
        });
        gallery.append(button);
      });
    }
    this.root.querySelectorAll<HTMLButtonElement>('[data-cover-id]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.coverId === selectedId));
    });
    this.root.querySelectorAll<HTMLAnchorElement>('[data-jukebox-download]').forEach(anchor => {
      const selected = this.root.querySelector<HTMLSelectElement>('[data-jukebox-select]')?.value ?? '';
      const link = this.jukebox.getDownloadUrl(selected);
      anchor.hidden = !link;
      if (link) { anchor.href=link; anchor.download=link.split('/').pop() ?? 'musik.mp3'; }
    });
    this.root.querySelectorAll<HTMLElement>('[data-jukebox-status]').forEach(el=>{
      const current = this.jukebox.getTracks().find(track => track.id === this.jukebox.getCurrentId());
      el.textContent = this.jukebox.isPlaying() ? '▶ ' + (current?.title ?? 'Aufnahme') + ' läuft' :
        this.jukebox.getLastError() ? '✕ ' + this.jukebox.getLastError() : this.jukebox.getTracks().length ? 'Titel auswählen; bei Ladefehlern ⚙ Einstellungen → MP3-Diagnose öffnen.' :
          'Noch keine Musik vorhanden: Wähle deine sechs MP3-Dateien zum Import aus.';
    });
  }

  private bindJukeboxControls(): void {
    this.updateJukeboxStatus();
    let coverPage = 0;
    const showCoverPage = () => {
      const covers = Array.from(this.root.querySelectorAll<HTMLElement>('.cover-card'));
      const pages = Math.max(1, Math.ceil(covers.length / 3));
      coverPage = Math.max(0, Math.min(coverPage, pages - 1));
      covers.forEach((cover, index) => { cover.hidden = Math.floor(index / 3) !== coverPage; });
      const label = this.root.querySelector('[data-cover-page-label]');
      if (label) label.textContent = (coverPage + 1) + ' / ' + pages;
    };
    this.root.querySelectorAll<HTMLButtonElement>('[data-cover-page]').forEach(button => {
      button.onclick = () => { coverPage += Number(button.dataset.coverPage); showCoverPage(); };
    });
    showCoverPage();
    const mode = this.root.querySelector<HTMLSelectElement>('#playlist-mode');
    const repeat = this.root.querySelector<HTMLSelectElement>('#playlist-repeat');
    if (mode) {
      mode.value = this.jukebox.getPlaylistMode();
      mode.addEventListener('change', () => {
        this.jukebox.setPlaylistMode(mode.value as 'era' | 'sequential' | 'shuffle');
        if (mode.value === 'era' && this.engine) void this.jukebox.syncYear(this.engine.getCurrentYear());
      });
    }
    if (repeat) {
      repeat.value = this.jukebox.getRepeatMode();
      repeat.addEventListener('change', () =>
        this.jukebox.setRepeatMode(repeat.value as 'all' | 'one' | 'off'));
    }
    this.root.querySelectorAll<HTMLSelectElement>('[data-jukebox-select]').forEach(select => {
      select.addEventListener('change', () => {
        const id = select.value;
        this.jukebox.setPlaylistMode('sequential');
        if (mode) mode.value = 'sequential';
        this.updateJukeboxStatus();
        void this.run(async () => { await this.jukebox.play(id); });
      });
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
    this.engine?.recordChronicle(message);
    this.journal = this.engine?.getChronicle().map(entry => ({date: entry.date, message: entry.message})) ?? [];
  }

  private date(): string {
    return this.engine ? `${MONTHS[this.engine.getCurrentMonth() - 1]} ${formatYear(this.engine.getCurrentYear())}` : '';
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
    this.councilDialog?.remove();
    for (const unsubscribe of this.subscriptions) unsubscribe();
    document.removeEventListener('keydown', this.keyboardHandler);
    this.root.removeEventListener('click', this.buttonSoundHandler);
    this.audio.dispose();
    window.clearTimeout(this.cinematicTimeout);
    this.interludeDialog?.close();
    this.jukebox.dispose();
    this.ambience.dispose();
    document.removeEventListener('pointerdown', this.retryOpening);
    document.removeEventListener('keydown', this.retryOpening);
  }
}
