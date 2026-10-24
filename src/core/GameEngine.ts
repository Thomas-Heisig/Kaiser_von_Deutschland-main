import { chooseCitizenCouncilOption } from './CitizenCouncilChoice';
import { CivicMissionSystem } from './CivicMissionSystem';
// src/core/GameEngine.ts
import { Player, PlayerCreationData } from './Player';
import { EconomySystem } from './Economy';
import { EventSystem } from './Events';
import { CouncilDecisionSystem, CouncilSnapshot } from './CouncilDecisionSystem';
import { TitleSystem } from '../data/Titles';
import { PolicySystem } from './PolicySystem';
import { OllamaService } from './OllamaService';
import { MultiplayerSystem } from './MultiplayerSystem';
import { WikiIntegration } from './WikiIntegration';
import { CitizenSystem } from './CitizenSystem';
import { DemographicSystem } from './DemographicSystem';
import { SocialNetworkSystem } from './SocialNetworkSystem';
import { ClimateSystem } from './ClimateSystem';
import { LandscapeSystem } from './LandscapeSystem';
import { AnimalPopulationSystem } from './AnimalPopulationSystem';
import { HistoricalFiguresSystem } from './HistoricalFiguresSystem';
import { DiseaseSystem } from './DiseaseSystem';
import { NaturalDisasterSystem } from './NaturalDisasterSystem';
import { BattleSystem } from './BattleSystem';
import { TransportSystem } from './TransportSystem';
import { NavalSystem } from './NavalSystem';
import { ArtSystem } from './ArtSystem';
import { ScientificDiscoverySystem } from './ScientificDiscoverySystem';
import { LegalSystem } from './LegalSystem';
import { MilitaryUnitSystem } from './MilitaryUnitSystem';
// Note: DiplomacySystem is per-player, imported where needed
import { ReligionSystem, CulturalEvent } from './ReligionSystem';
import { DiplomacySystem } from './DiplomacySystem';
import { MigrationSystem } from './MigrationSystem';
import { SocialMobilitySystem } from './SocialMobilitySystem';
import { FamineSystem } from './FamineSystem';
import { EconomicCohortSystem } from './EconomicCohortSystem';
import { BattleTerrainWeatherSystem } from './BattleTerrainWeatherSystem';
import { UnitFormationSystem } from './UnitFormationSystem';
import { SupplyLogisticsSystem } from './SupplyLogisticsSystem';
import { SiegeWarfareSystem } from './SiegeWarfareSystem';
import { EspionageSystem } from './EspionageSystem';
import { UrbanDistrictsSystem } from './UrbanDistrictsSystem';
import { DayNightCycleSystem } from './DayNightCycleSystem';
import { ArtsAndCultureSystem } from './ArtsAndCultureSystem';
import { HistoricalEventSystem } from './HistoricalEventSystem';
import { InformationSpreadSystem } from './InformationSpreadSystem';
import { LegalAndCourtSystem } from './LegalAndCourtSystem';
import { RoadmapFeaturesManager } from './RoadmapFeaturesManager';
import { PrisonerOfWarSystem } from './PrisonerOfWarSystem';
import { WarFinancingSystem } from './WarFinancingSystem';
import { AIControllerManager } from './AIController';
import { RoleSwitchingSystem } from './RoleSwitchingSystem';
import { TimeSystem, TimeMode } from './TimeSystem';
import { DynamicGameView } from './DynamicGameView';
import { PlayerTechnologySystem, TechnologyDefinition, TechnologySystem } from './TechnologySystem';
import localforage from 'localforage';
import { encodeSave, decodeSave } from './SaveCodec';
import { CAMPAIGNS, campaignGoals, CampaignId } from './CampaignCatalog';
import { chapterStatus, CampaignChapterStatus } from './CampaignChapters';
import { CampaignDefeatSystem, DEFEAT_TITLES, DefeatReason } from './CampaignDefeatSystem';
import { TutorialSystem, TutorialStepId } from './TutorialSystem';
import { CourtAssistantRegistry, COURT_OFFICES, CourtOffice, AssistantMode } from './CourtAssistantRegistry';
import { MODERNIZATION_PROJECTS, applyModernization } from './ModernizationProjects';
import { epochForYear, milestonesInYear, milestonesThrough } from './WorldHistoryCatalog';
import { applyScienceDiscovery, researchImpact, researchProductionBonus } from './ScienceImpact';
import { KingdomInfrastructure } from './Kingdom';
import { BattleReport, CampaignWarfareSystem, PowerModifiers, RivalRealm } from './CampaignWarfareSystem';
import type { Citizen } from './CitizenSystem';

export type MarketResource = 'food' | 'wood' | 'stone' | 'iron';

/** Monthly actions a player can take with the character currently played. */
export type CharacterAction = 'work' | 'study' | 'train' | 'serve';

/** Result of ending a hotseat turn. */
export interface TurnResult {
  monthAdvanced: boolean;
  activePlayer: Player;
}

export interface TechnologyProgressSnapshot {
  researchPoints: number;
  researched: string[];
  currentResearch: { technologyId: string; progressDays: number } | null;
}

export interface TechnologyOption {
  technology: TechnologyDefinition;
  researched: boolean;
  canStart: boolean;
  blockers: string[];
}

export interface CampaignGoal {
  label: string;
  done: boolean;
}

const formatResearch = (value: number): string =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value);

export enum GameState {
  LOBBY = 'LOBBY',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export interface GameConfig {
  maxPlayers: number;
  difficulty: number;
  gameSpeed: number; // months per second speed modifier (higher = faster)
  enableMultiplayer: boolean;
  randomEvents: boolean;
  startingYear: number;
  campaignId?: CampaignId;
  enableOllama?: boolean;
  ollamaUrl?: string;
  enableWiki?: boolean;
  /** Aktiviert die interaktive Tutorial-Kampagne (Bauen → Handeln → Forschen → Reichsrat → Speichern). */
  enableTutorial?: boolean;
}

/** Recent campaign messages are part of the game save, not only the open UI session. */
export interface ChronicleEntry { date: string; message: string; playerId?: string }

export interface SaveMeta {
  slot: string;
  savedAt: string;
  playersCount: number;
  year: number;
}

export class GameEngine {
  private players: Map<string, Player> = new Map();
  private currentYear: number;
  private gameState: GameState;
  private _economy: EconomySystem;
  private events: EventSystem;
  private policySystem: PolicySystem;
  private ollamaService?: OllamaService;
  private multiplayerSystem?: MultiplayerSystem;
  private wikiIntegration?: WikiIntegration;
  private citizenSystem: CitizenSystem;
  private demographicSystem: DemographicSystem;
  private socialNetworkSystem: SocialNetworkSystem;
  private climateSystem: ClimateSystem;
  private landscapeSystem: LandscapeSystem;
  private animalPopulationSystem: AnimalPopulationSystem;
  
  // New roadmap feature systems (v2.3+)
  private historicalFiguresSystem: HistoricalFiguresSystem;
  private diseaseSystem: DiseaseSystem;
  private naturalDisasterSystem: NaturalDisasterSystem;
  private battleSystem: BattleSystem;
  private transportSystem: TransportSystem;
  private navalSystem: NavalSystem;
  private artSystem: ArtSystem;
  private scientificDiscoverySystem: ScientificDiscoverySystem;
  private legalSystem: LegalSystem;
  private militaryUnitSystem: MilitaryUnitSystem;
  
  // Newly integrated roadmap systems (v2.4+)
  // Note: Some systems are per-player and initialized on player creation
  private religionSystem: ReligionSystem;
  private migrationSystem: MigrationSystem;
  private socialMobilitySystem: SocialMobilitySystem;
  private famineSystem: FamineSystem;
  private economicCohortSystem: EconomicCohortSystem;
  private battleTerrainWeatherSystem: BattleTerrainWeatherSystem;
  private unitFormationSystem: UnitFormationSystem;
  private supplyLogisticsSystem: SupplyLogisticsSystem;
  private siegeWarfareSystem: SiegeWarfareSystem;
  private espionageSystem: EspionageSystem;
  private urbanDistrictsSystem: UrbanDistrictsSystem;
  private dayNightCycleSystem: DayNightCycleSystem;
  private artsAndCultureSystem: ArtsAndCultureSystem;
  private historicalEventSystem: HistoricalEventSystem;
  private informationSpreadSystem: InformationSpreadSystem;
  private legalAndCourtSystem: LegalAndCourtSystem;
  
  // Roadmap Features Manager (v2.5.0) - Integrates 20 new features
  private roadmapFeaturesManager: RoadmapFeaturesManager;
  
  // Prisoner of War System (v2.5.1) - Kriegsgefangene und deren Behandlung
  private prisonerOfWarSystem: PrisonerOfWarSystem;
  
  // War Financing System (v2.3.6) - Kriegsfinanzierung und Kriegsanleihen
  private warFinancingSystem: WarFinancingSystem;
  
  // Life Simulation Systems (v2.6.0) - Role Switching and Dynamic Views
  private aiControllerManager: AIControllerManager;
  private roleSwitchingSystem: RoleSwitchingSystem;
  private timeSystem: TimeSystem;
  private dynamicGameView: DynamicGameView;
  
  private config: GameConfig;
  private eventTarget: EventTarget;
  private readonly ready: Promise<void>;
  private processingMonth: boolean = false;
  private warfare: CampaignWarfareSystem = new CampaignWarfareSystem((): number => Math.random());
  private turnIndex: number = 0;
  private technologySystems: Map<string, PlayerTechnologySystem> = new Map();
  private council: CouncilDecisionSystem = new CouncilDecisionSystem();
  private rivalDiplomacy = new Map<string, DiplomacySystem>();
  private festivalsHeld = new Map<string, number>();
  private warFinanceByPlayer = new Map<string, WarFinancingSystem>();
  private warFinanceUsed = new Map<string, number>();
  private campaignChapters = new Map<string, number>();
  private defeatSystem = new CampaignDefeatSystem();
  private tutorialSystem = new TutorialSystem();
  private borderWatch = new Map<string, number>();
  private siegeTargets = new Map<string, string>();
  private courtAssistants = new CourtAssistantRegistry();
  private culturalExhibitions = new Map<string, number>();
  private modernizationCompleted = new Map<string, string[]>();
  private civicMissions = new CivicMissionSystem();
  private chronicle: ChronicleEntry[] = [];
  /** A bounded, plain-data chronicle is safe to copy into a version-2 save. */
  public getChronicle(): ChronicleEntry[] {
    return this.chronicle.map(entry => ({...entry}));
  }
  public recordChronicle(message: string, playerId?: string): void {
    if (typeof message !== 'string' || !message.trim() || message.length > 900) return;
    if (playerId !== undefined && !this.players.has(playerId)) throw new Error('Unbekannter Chronikspieler.');
    const date = String(this.currentMonth).padStart(2,'0') + '/' + this.currentYear;
    this.chronicle.unshift({ date, message, ...(playerId ? { playerId } : {}) });
    this.chronicle.length = Math.min(this.chronicle.length,100);
  }


  constructor(config: Partial<GameConfig> = {}) {
    this.config = {
      maxPlayers: 6,
      difficulty: 2,
      gameSpeed: 1,
      enableMultiplayer: false,
      randomEvents: true,
      startingYear: 1200,
      campaignId: 'aufbau',
      enableOllama: false,
      enableWiki: true,
      ...config
    };
    if (!Number.isFinite(this.config.gameSpeed) || this.config.gameSpeed <= 0 ||
        !Number.isSafeInteger(this.config.startingYear) ||
        !Number.isSafeInteger(this.config.maxPlayers) || this.config.maxPlayers < 1) {
      throw new RangeError('Ungültige Spielkonfiguration: Jahr, Spielerzahl oder Geschwindigkeit.');
    }

    if (!CAMPAIGNS.some((campaign) => campaign.id === this.config.campaignId)) throw new RangeError('Unbekannte Kampagne.');
    this.currentYear = this.config.startingYear;
    this.gameState = GameState.LOBBY;
    this._economy = new EconomySystem(this.config);
    this.events = new EventSystem();
    this.policySystem = new PolicySystem();
    this.eventTarget = new EventTarget();
    this.currentMonth = 1;
    this._tickHandle = null;
    
    // Initialize new population dynamics systems
    this.citizenSystem = new CitizenSystem();
    this.demographicSystem = new DemographicSystem();
    this.socialNetworkSystem = new SocialNetworkSystem();
    
    // Initialize ecological systems (v2.2.3)
    this.climateSystem = new ClimateSystem();
    this.landscapeSystem = new LandscapeSystem();
    this.animalPopulationSystem = new AnimalPopulationSystem();
    
    // Initialize new roadmap feature systems (v2.3+)
    this.historicalFiguresSystem = new HistoricalFiguresSystem();
    this.diseaseSystem = new DiseaseSystem();
    this.naturalDisasterSystem = new NaturalDisasterSystem();
    this.battleSystem = new BattleSystem();
    this.transportSystem = new TransportSystem();
    this.navalSystem = new NavalSystem();
    this.artSystem = new ArtSystem();
    this.scientificDiscoverySystem = new ScientificDiscoverySystem();
    this.legalSystem = new LegalSystem();
    this.militaryUnitSystem = new MilitaryUnitSystem();
    
    // Initialize newly integrated roadmap systems (v2.4+)
    // Note: DiplomacySystem is per-player (requires kingdomId) and not instantiated here
    // All other systems below are global and initialized immediately
    this.religionSystem = new ReligionSystem();
    this.migrationSystem = new MigrationSystem();
    this.socialMobilitySystem = new SocialMobilitySystem();
    this.famineSystem = new FamineSystem();
    this.economicCohortSystem = new EconomicCohortSystem();
    this.battleTerrainWeatherSystem = new BattleTerrainWeatherSystem();
    this.unitFormationSystem = new UnitFormationSystem();
    this.supplyLogisticsSystem = new SupplyLogisticsSystem();
    this.siegeWarfareSystem = new SiegeWarfareSystem();
    this.espionageSystem = new EspionageSystem();
    this.urbanDistrictsSystem = new UrbanDistrictsSystem();
    this.dayNightCycleSystem = new DayNightCycleSystem();
    this.artsAndCultureSystem = new ArtsAndCultureSystem();
    this.historicalEventSystem = new HistoricalEventSystem();
    this.informationSpreadSystem = new InformationSpreadSystem();
    this.legalAndCourtSystem = new LegalAndCourtSystem();
    
    // Initialize Roadmap Features Manager (v2.5.0) - 20 new features
    this.roadmapFeaturesManager = new RoadmapFeaturesManager();
    
    // Initialize Prisoner of War System (v2.5.1)
    this.prisonerOfWarSystem = new PrisonerOfWarSystem();
    
    // Initialize War Financing System (v2.3.6)
    this.warFinancingSystem = new WarFinancingSystem();
    
    // Initialize Life Simulation Systems (v2.6.0)
    this.aiControllerManager = new AIControllerManager();
    this.roleSwitchingSystem = new RoleSwitchingSystem(this.aiControllerManager);
    this.timeSystem = new TimeSystem(this.config.startingYear, TimeMode.BALANCED);
    this.dynamicGameView = new DynamicGameView();
    
    this.ready = this.initializeSystems();

    // Initialize optional systems
    if (this.config.enableOllama) {
      this.ollamaService = new OllamaService({
        baseUrl: this.config.ollamaUrl
      });
    }

    if (this.config.enableMultiplayer) {
      this.multiplayerSystem = new MultiplayerSystem();
    }

    if (this.config.enableWiki) {
      this.wikiIntegration = new WikiIntegration();
    }
  }

  private currentMonth: number;
  private _tickHandle: ReturnType<typeof setTimeout> | null;

  // Initialize all systems asynchronously
  private async initializeSystems(): Promise<void> {
    // Note: Some newly integrated systems don't have initialize() methods
    // They will be ready to use immediately after construction
    try {
      await Promise.all([
        // Original systems with initialize() methods
        this.historicalFiguresSystem.initialize(),
        this.diseaseSystem.initialize(),
        this.naturalDisasterSystem.initialize(),
        this.battleSystem.initialize(),
        this.transportSystem.initialize(),
        this.navalSystem.initialize(),
        this.artSystem.initialize(),
        this.scientificDiscoverySystem.initialize(),
        this.legalSystem.initialize(),
        this.militaryUnitSystem.initialize(),
        // v2.5.1: Prisoner of War System
        this.prisonerOfWarSystem.initialize()
      ]);
      console.log('All roadmap feature systems initialized successfully');
    } catch (error) {
      console.error('Failed to initialize some systems:', error);
      throw error;
    }
  }

  // Öffentliche Methoden
  public getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  public getPlayerById(id: string): Player | undefined {
    return this.players.get(id);
  }

  public getCivicMissions(playerId:string) {
    this.requirePlayer(playerId);
    return { options:this.civicMissions.options(this.currentYear),
      active:this.civicMissions.active(playerId),history:this.civicMissions.historyFor(playerId),
      citizens:this.citizenSystem.getAliveCitizens().filter(c=>!c.isPlayerCharacter&&c.age>=16)
        .slice(0,100).map(c=>({id:c.id,name:c.firstName+' '+c.lastName,profession:c.profession,skills:{...c.skills},
          professionLevel:c.professionLevel,reputation:c.reputation,discipline:c.personality?.discipline??50,
          familyId:c.familyId??'',regionId:c.regionId,lifeEvents:(c.lifeEvents??[]).slice(-3)})) };
  }
  public assignCivicMission(playerId:string,citizenId:string,missionId:string):string {
    const player=this.requirePlayer(playerId);
    if(this.isHotseat()&&this.getActivePlayer().id!==playerId)throw Error('Nicht am Zug.');
    const citizen=this.citizenSystem.getCitizen(citizenId);
    if(!citizen)throw Error('Bürger nicht gefunden.');
    const assignment=this.civicMissions.start(playerId,citizen,player.kingdom,missionId,this.currentYear,this.currentMonth);
    const mission=this.civicMissions.options(this.currentYear).find(x=>x.id===assignment.missionId)!;
    const message=citizen.firstName+' '+citizen.lastName+' übernimmt „'+mission.title+'“ ('+mission.months+' Monate).';
    this.emit('civicMissionEvent',{playerId,message});return message;
  }

  public getModernizationOptions(playerId: string) {
    const player = this.requirePlayer(playerId);
    const researched = this.requireTechnologySystem(playerId);
    const completed = this.modernizationCompleted.get(playerId) ?? [];
    return MODERNIZATION_PROJECTS.map((project) => {
      const blockers: string[] = [];
      if (this.currentYear < project.year) blockers.push('Verfügbar ab ' + project.year);
      if (!researched.isResearched(project.requiredTechnology)) blockers.push('Erfordert Forschung: ' + project.requiredTechnology);
      if (completed.includes(project.id)) blockers.push('Bereits umgesetzt');
      for (const resource of ['gold','wood','stone','iron'] as const)
        if (player.kingdom.resources[resource] < project.cost[resource]) blockers.push(resource + ' fehlt');
      return {project,completed:completed.includes(project.id),canStart:blockers.length===0,blockers};
    });
  }

  public launchModernization(playerId: string, projectId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const item = this.getModernizationOptions(playerId).find(o=>o.project.id===projectId);
    if (!item) throw new Error('Unbekanntes Modernisierungsprojekt.');
    if (!item.canStart) throw new Error(item.blockers.join(' · '));
    for (const res of ['gold','wood','stone','iron'] as const)
      player.kingdom.resources[res] -= item.project.cost[res];
    applyModernization(item.project,player.kingdom);
    this.modernizationCompleted.set(playerId,[...(this.modernizationCompleted.get(playerId)??[]),item.project.id]);
    const message = item.project.name + ' abgeschlossen: ' + item.project.effect;
    this.emit('modernizationCompleted',{playerId,message});
    return message;
  }

  public getHistoricalTimeline() { return milestonesThrough(this.currentYear); }

  /** Optional stateful museum action. Real-world history remains informational. */
  public getExhibitionOptions(playerId: string) {
    const player = this.requirePlayer(playerId);
    return milestonesThrough(this.currentYear).filter((item) => !item.speculative &&
      (item.kind === 'art' || item.kind === 'culture' || item.kind === 'science' || item.kind === 'invention'))
      .map((item) => ({
        milestone: item, cost: 350 + Math.max(0, this.currentYear - 1200) * 2,
        held: this.culturalExhibitions.has(playerId + ':' + item.id),
        affordable: player.kingdom.resources.gold >= 350 + Math.max(0, this.currentYear - 1200) * 2
      }));
  }

  public sponsorExhibition(playerId: string, milestoneId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const option = this.getExhibitionOptions(playerId).find((entry) => entry.milestone.id === milestoneId);
    if (!option) throw new Error('Diese historische Ausstellung ist noch nicht verfügbar.');
    if (option.held) throw new Error('Diese Ausstellung wurde bereits gefördert.');
    if (!option.affordable) throw new Error('Für die Ausstellung fehlt Gold.');
    player.kingdom.resources.gold -= option.cost;
    player.kingdom.stats.culturalInfluence = Math.min(100, player.kingdom.stats.culturalInfluence + 2);
    player.updateStats({ prestige: 1 });
    this.culturalExhibitions.set(playerId + ':' + milestoneId, this.currentYear);
    const message = 'Ausstellung gefördert: ' + option.milestone.title + ' (+2 Kultur).';
    this.emit('exhibitionSponsored', { playerId, message });
    return message;
  }
  public getCurrentEpoch(): string { return epochForYear(this.currentYear); }

  public getCurrentYear(): number {
    return this.currentYear;
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public async startGame(): Promise<void> {
    await this.ready;
    if (this.players.size === 0) {
      throw new Error('Mindestens ein Spieler benötigt');
    }

    if (this.gameState !== GameState.LOBBY) {
      throw new Error('Ein Spiel wurde bereits gestartet.');
    }
    this.gameState = GameState.RUNNING;
    this.timeSystem.resume();
    this.emit('gameStateChanged', { state: this.gameState });

    // Initialisiert die interaktive Tutorial-Kampagne, falls gewünscht.
    if (this.config.enableTutorial) {
      this.tutorialSystem.activate();
      // Startguthaben für den ersten Schritt: Bauernhof (250 Gold, 500 Holz)
      // oder Straße (150 Gold, 300 Holz) bleiben erreichbar.
      const player = this.getActivePlayer();
      player.kingdom.resources.gold += 800;
      player.kingdom.resources.wood += 1500;
      this.emit('tutorialStarted', { playerId: player.id });
    }

    // Initialize life simulation for the first player (v2.6.0)
    this.initializeLifeSimulation();

    // start auto tick (monthly)
    this.startAutoTick();
  }

  /**
   * Initializes the life simulation system (v2.6.0)
   * Creates player session, generates initial citizens, and assigns first character
   */
  private initializeLifeSimulation(): void {
    const players = Array.from(this.players.values());
    if (players.length === 0) return;

    const existingCitizens = this.citizenSystem.getAllCitizens();
    if (existingCitizens.length === 0) {
      this.generateInitialCitizens();
    }

    // Every player gets an own role session and a distinct starting character.
    for (const player of players) {
      const playerId = player.id;
      if (!this.roleSwitchingSystem.getSession(playerId)) this.roleSwitchingSystem.createSession(playerId);
      const available = this.citizenSystem.getAllCitizens()
        .filter((citizen: Citizen): boolean => citizen.isAlive && !citizen.isPlayerCharacter);
      if (available.length === 0) {
        console.warn('Keine lebenden Bürger verfügbar');
        continue;
      }
      const preferredCitizen = available.find((citizen: Citizen): boolean =>
        citizen.socialClass === 'noble' || citizen.socialClass === 'middle') ?? available[0];
      this.roleSwitchingSystem.switchRole(
        playerId,
        preferredCitizen.id,
        (id: string) => this.citizenSystem.getCitizen(id),
        (id: string, updates: Partial<Citizen>) => this.citizenSystem.updateCitizen(id, updates),
        this.currentYear,
        this.currentMonth,
        'Spielstart - Erster Charakter'
      );
    }
  }

  
  /**
   * Generates initial population for the game
   */
  private generateInitialCitizens(): void {
    const regions = ['preussen', 'bayern', 'sachsen', 'hanse', 'schwaben'];
    const maleNames = ['Heinrich', 'Friedrich', 'Wilhelm', 'Karl', 'Ludwig', 'Otto', 'Konrad', 'Albrecht'];
    const femaleNames = ['Elisabeth', 'Margarete', 'Anna', 'Katharina', 'Agnes', 'Gertrud', 'Hedwig'];
    const lastNames = ['von Berg', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker', 'Schulz'];
    const professions = ['farmer', 'artisan', 'merchant', 'soldier', 'scholar', 'clergy', 'noble'] as const;
    
    // Generate 50-100 initial citizens
    const citizenCount = 50 + Math.floor(Math.random() * 50);
    
    for (let i = 0; i < citizenCount; i++) {
      const gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';
      const firstName = gender === 'male' 
        ? maleNames[Math.floor(Math.random() * maleNames.length)]
        : femaleNames[Math.floor(Math.random() * femaleNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const age = 18 + Math.floor(Math.random() * 50);
      const birthYear = this.currentYear - age;
      const profession = professions[Math.floor(Math.random() * professions.length)];
      const regionId = regions[Math.floor(Math.random() * regions.length)];
      
      // Determine social class based on profession
      let socialClass: 'peasant' | 'middle' | 'noble' | 'royal' = 'peasant';
      if (profession === 'noble') socialClass = 'noble';
      else if (profession === 'merchant' || profession === 'scholar' || profession === 'clergy') socialClass = 'middle';
      
      this.citizenSystem.createCitizen({
        firstName,
        lastName,
        gender,
        age,
        birthYear,
        birthMonth: Math.floor(Math.random() * 12) + 1,
        profession,
        regionId,
        socialClass
      });
    }
    
    console.log(`Generated ${citizenCount} initial citizens across ${regions.length} regions`);
  }

  private startAutoTick(): void {
    if (this._tickHandle) clearTimeout(this._tickHandle);
    this._tickHandle = null;
    // Hotseat games are strictly turn-based; months advance via endTurn().
    if (this.isHotseat()) return;
    const mode = this.timeSystem.getMode();
    const base = mode === TimeMode.DETAIL ? 30000 : mode === TimeMode.STRATEGIC ? 1000 / 12 : 1000;
    const msPerMonth = Math.max(50, base / this.timeSystem.getSpeed() / this.config.gameSpeed);
    this._tickHandle = setTimeout(async (): Promise<void> => {
      this._tickHandle = null;
      try {
        if (!this.timeSystem.getPaused()) await this.monthlyTick();
      } catch (error) {
        console.error('Monat konnte nicht verarbeitet werden:', error);
        this.pauseGame();
        this.emit('simulationError', { message: error instanceof Error ? error.message : String(error) });
      }
      if (this.gameState === GameState.RUNNING) this.startAutoTick();
    }, msPerMonth);
  }

  public pauseGame(): void {
    if (this.gameState === GameState.RUNNING) {
      this.gameState = GameState.PAUSED;
      this.timeSystem.pause();
      if (this._tickHandle) { clearTimeout(this._tickHandle); this._tickHandle = null; }
      this.emit('gameStateChanged', { state: this.gameState });
    }
  }

  public resumeGame(): void {
    if (this.gameState === GameState.PAUSED && !this.isHotseat()) {
      this.gameState = GameState.RUNNING;
      this.timeSystem.resume();
      this.emit('gameStateChanged', { state: this.gameState });
      this.startAutoTick();
    }
  }

  private async monthlyTick(): Promise<void> {
    if (this.gameState !== GameState.RUNNING) return;
    await this.advanceMonth();
  }

  /**
   * Processes one complete month through the same path as automatic play.
   * @returns Resolves after all monthly systems and year-boundary updates.
   * @throws Error if no active game exists or another month is in progress.
   */
  public async advanceMonth(): Promise<void> {
    if (this.gameState !== GameState.RUNNING && this.gameState !== GameState.PAUSED) {
      throw new Error('Kein aktives Spiel vorhanden.');
    }
    if (this.processingMonth) throw new Error('Ein Monat wird bereits verarbeitet.');
    this.processingMonth = true;
    try {
      await this.processMonthSystems();
    } finally {
      this.processingMonth = false;
    }
    // Only checkpoint completed months, after releasing the processing lock.
    // Do not interrupt the game if the browser's persistent storage is unavailable.
    try {
      await this.saveGame('autosave');
    } catch (error) {
      this.emit('autosaveError', { message: error instanceof Error ? error.message : String(error) });
    }
  }

  private async processMonthSystems(): Promise<void> {
    // Update ecological systems
    const avgIndustrialization = this.getAverageIndustrialization();
    this.climateSystem.updateMonth(this.currentYear, this.currentMonth, avgIndustrialization);

    // process each player's month
    for (const player of this.players.values()) {
      await this.processPlayerMonth(player);
    }
    
    for (const player of this.players.values()) {
      for (const event of this.civicMissions.advance(player.id,player.kingdom,this.currentYear,this.currentMonth,id=>this.citizenSystem.getCitizen(id)))
        this.emit('civicMissionEvent',{playerId:player.id,message:event.message});
    }
    // Process population dynamics systems
    this.citizenSystem.processMonth(this.currentYear, this.currentMonth);
    this.demographicSystem.processMonth(this.citizenSystem, this.currentYear, this.currentMonth);
    this.socialNetworkSystem.processInformationSpread(this.citizenSystem, this.currentYear, this.currentMonth);
    this.socialNetworkSystem.processMovements(this.citizenSystem, this.currentYear, this.currentMonth);
    
    // Process migration between regions (v2.1.5)
    this.processMigrations();
    
    // Process naval system monthly updates (v2.3.5)
    this.navalSystem.monthlyUpdate(this.currentYear, this.currentMonth);
    
    // Process Prisoner of War system monthly updates (v2.5.1)
    this.prisonerOfWarSystem.update(this.currentYear, this.currentMonth);
    
    // Existing espionage missions advance at a monthly granularity (30 in-game days).
    // A mission may take several months; no background timers or real-world dates control progress.
    for (const player of this.players.values()) {
      for (const mission of this.espionageSystem.getMissionsForOwner(player.id)) {
        if (mission.status !== 'planning' && mission.status !== 'ongoing') continue;
        let outcome = { completed: false, failed: false, detected: false };
        for (let day = 0; day < 30; day++) {
          outcome = this.espionageSystem.processMission(mission.id);
          if (outcome.completed || outcome.failed) break;
        }
        if (outcome.completed || outcome.failed) this.emit('espionageEvent', {
          playerId: player.id,
          message: outcome.completed ? 'Ein Kundschafter hat seine Mission abgeschlossen.' :
            'Ein Kundschafter wurde entdeckt oder die Mission ist fehlgeschlagen.'
        });
      }
    }

    // Process AI controllers for all non-player characters (v2.6.0)
    this.aiControllerManager.updateAll(
      (id) => this.citizenSystem.getCitizen(id),
      this.currentYear,
      this.currentMonth
    );
    
    // Note: Many newly integrated systems don't have processMonth() methods yet
    // They are available via accessor methods for UI and manual triggering

    // advance month/year
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
      for (const player of this.players.values()) {
        player.kingdom.currentYear = this.currentYear;
        player.processYear();
        this.policySystem.applyYearlyEffects(player);
      }
      this.roadmapFeaturesManager.update(this.currentYear, 1);
      for (const development of this.warfare.processYear(this.currentYear)) {
        this.emit('rivalDeveloped', development);
      }
      this.checkForPromotions();
      
      // Yearly processes for population
      this.socialNetworkSystem.generateSocialRelations(this.citizenSystem, this.currentYear);
      
      // Process career changes and social mobility (v2.1.5)
      this.processCareerChanges();
      
      // Yearly processes for ecological systems
      this.processEcologicalYear();
      
      // Informative world-history milestones never mutate resources, technology,
      // or politics: real-world developments are not automatically invented by this realm.
      for (const milestone of milestonesInYear(this.currentYear)) {
        this.emit('historyMilestone', { milestone });
      }
      this.emit('yearAdvanced', { year: this.currentYear });
    }

    this.timeSystem.setDate(this.currentYear, this.currentMonth);
    if (this.config.randomEvents) {
      for (const player of this.players.values()) {
        const event = this.council.tryGenerate(player, this.currentYear, this.currentMonth, this.config.startingYear);
        if (event) this.emit('councilDecision', { playerId: player.id, title: event.title });
      }
      if (!this.isHotseat() && this.getPendingCouncilDecision(this.getActivePlayer().id)) this.pauseGame();
    }
    const seasons = ['winter', 'spring', 'summer', 'autumn'] as const;
    for (const player of this.players.values()) {
      player.kingdom.currentSeason = seasons[Math.floor((this.currentMonth % 12) / 3)];
    }
    for (const player of this.players.values()) this.completeCampaignChapter(player);
    this.checkCampaignDefeat();
    this.emit('monthAdvanced', { month: this.currentMonth, year: this.currentYear });
  }

  /**
   * Prüft nach jedem Monat die echten Niederlagebedingungen (Bankrott,
   * Hungersnot, Anarchie). Ein Untergang pausiert das Spiel, schreibt die
   * Chronik und feuert `campaignDefeat`, damit die UI die Niederlageseite zeigt.
   * Ein bereits untergangenes Reich wird nicht erneut gemeldet.
   */
  private checkCampaignDefeat(): void {
    if (this.getCampaignId() === 'frei') return;
    for (const player of this.players.values()) {
      if (this.defeatSystem.isDefeated(player.id)) continue;
      const reason = this.defeatSystem.checkDefeat(
        player.id,
        player.kingdom.resources.gold,
        player.kingdom.resources.food,
        player.kingdom.happiness
      );
      if (!reason) continue;
      const message = `Untergang: ${DEFEAT_TITLES[reason]} – das Reich ${player.kingdom.name} konnte sich nicht halten.`;
      this.recordChronicle(message, player.id);
      this.emit('campaignDefeat', { playerId: player.id, reason });
      if (!this.isHotseat()) this.pauseGame();
      break;
    }
  }

  /** Ist der Spieler endgültig untergegangen (Bankrott, Hungersnot oder Anarchie)? */
  public isPlayerDefeated(playerId: string): boolean {
    return this.defeatSystem.isDefeated(playerId);
  }

  /** Liefert den festgehaltenen Untergangsgrund eines Spielers oder `null`. */
  public getPlayerDefeatReason(playerId: string): DefeatReason | null {
    return this.defeatSystem.getDefeatReason(playerId);
  }

  /**
   * Markiert einen Tutorial-Schritt als erledigt (falls aktiv und korrekt
   * sequenziert) und feuert `tutorialStep` bzw. `tutorialCompleted`.
   * @param playerId Spieler, der die Aktion ausgeführt hat.
   * @param stepId Der abzuschließende Schritt.
   */
  private markTutorialStep(playerId: string, stepId: TutorialStepId): void {
    const completed = this.tutorialSystem.markStep(stepId);
    if (!completed) return;
    this.emit('tutorialStep', { playerId, step: completed });
    if (this.tutorialSystem.isCompleted()) {
      this.emit('tutorialCompleted', { playerId });
    }
  }

  /** Läuft die interaktive Tutorial-Kampagne gerade? */
  public isTutorialActive(): boolean {
    return this.tutorialSystem.isEnabled();
  }

  /** Liefert den aktuellen Tutorial-Schritt oder `null`. */
  public getTutorialStep() {
    return this.tutorialSystem.getCurrentStep();
  }

  /** Liefert den Tutorial-Fortschritt (erledigt/gesamt). */
  public getTutorialProgress() {
    return this.tutorialSystem.getProgress();
  }

  /**
   * Ruft für den aktuellen Tutorial-Schritt „Reichsrat" eine feste,
   * bedingungslose Ratsangelegenheit auf, damit der Spieler sie entscheiden
   * kann. Ohne laufendes Tutorial oder ohne offenen Schritt tut nichts.
   * @param playerId Der Herrscher, für den der Rat einberufen wird.
   */
  public ensureTutorialCouncil(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    if (this.tutorialSystem.getCurrentStep()?.id !== 'council') return;
    if (this.council.getPending(playerId)) return;
    const decision = this.council.issueForTutorial(player);
    if (decision) this.emit('councilDecision', { playerId, title: decision.title });
  }

  /** Überspringt das laufende Tutorial. */
  public skipTutorial(): void {
    this.tutorialSystem.skip();
    this.emit('tutorialSkipped', {});
  }

  private async processPlayerMonth(player: Player): Promise<void> {
    player.kingdom.processMonth();
    this.processCampaignSiege(player);
    const bonus = researchProductionBonus(player.kingdom, this.requireTechnologySystem(player.id).getResearchedTechnologyIds());
    for (const resource of ['food', 'wood', 'stone', 'iron', 'gold'] as const) {
      player.kingdom.resources[resource] += bonus[resource];
    }
    const debtPayment = this.requireWarFinance(player.id).processMonthlyPayments(player.kingdom);
    if (debtPayment.cannotAfford) this.emit('financeEvent', { playerId: player.id,
      message: 'Eine Kriegsdarlehensrate konnte nicht bezahlt werden.' });

    // Border watch is consumed by the very next month, with or without a raid.
    const watch = this.borderWatch.get(player.id) ?? 0;
    const commander = this.getCommanderModifiers(player.id);
    const defenseModifiers: PowerModifiers = {
      ...commander, commanderBonus: Math.min(0.5, (commander.commanderBonus ?? 0) + watch)
    };
    this.borderWatch.delete(player.id);
    const raid = this.warfare.processMonth(player.id, player.kingdom,
      { year: this.currentYear, month: this.currentMonth },
      { raids: this.config.randomEvents, modifiers: defenseModifiers,
        protectedByTreaty: (rivalId: string): boolean => this.hasRivalTruce(player.id, rivalId) });
    if (raid) this.emit('battleResolved', { report: raid });
    this.processRivalDiplomacy(player);

    const technology = this.requireTechnologySystem(player.id);
    const baseResearch = player.kingdom.infrastructure.schools * 10 + player.kingdom.infrastructure.universities * 25;
    const researchBonus = researchImpact(technology.getResearchedTechnologyIds()).researchPercent;
    technology.addResearchPoints(Math.floor(baseResearch * (1 + researchBonus / 100)));
    const completedTechnology = technology.updateResearch(30);
    if (completedTechnology) {
      applyScienceDiscovery(player.kingdom, completedTechnology);
      this.emit('technologyResearched', { playerId: player.id, technology: completedTechnology });
    }

    this.processCourtAssistants(player);

    // Apply monthly policy effects
    this.policySystem.applyMonthlyEffects(player);

    // Apply trade route benefits (v2.6.0)
    this.applyTradeRouteBenefits(player);

    // small monthly stat adjustments
    this.updatePlayerStats(player);

    // monthly random events
    if (this.config.randomEvents && Math.random() < 0.05) {
      const event = await this.events.getRandomEvent(player, this.currentYear);
      if (event) {
        await this.events.applyEvent(event, player, null);
        this.emit('gameEvent', { playerId: player.id, title: event.title, description: event.description });
      }
    }
    
    // Note: Newly integrated systems are available for manual access via getters
    // but don't have automatic monthly processing yet
  }

  public async nextYear(): Promise<void> {
    if (this.gameState !== GameState.RUNNING) {
      throw new Error('Spiel ist nicht aktiv');
    }

    for (let month = 0; month < 12; month++) await this.advanceMonth();
  }

  public addPlayer(data: PlayerCreationData): Player {
    if (this.players.size >= this.config.maxPlayers) {
      throw new Error(`Maximale Spieleranzahl (${this.config.maxPlayers}) erreicht`);
    }

    const player = new Player(data);
    player.kingdom.foundingYear = this.currentYear;
    player.kingdom.currentYear = this.currentYear;
    player.kingdom.currentSeason = 'winter';
    this.players.set(player.id, player);
    this.warfare.ensureRivals(player.id, data.difficulty ?? this.config.difficulty);
    this.technologySystems.set(player.id, new PlayerTechnologySystem());
    this.campaignChapters.set(player.id, 0);
    this.warFinanceByPlayer.set(player.id, new WarFinancingSystem());
    this.initializeRivalDiplomacy(player.id);
    this.emit('playerAdded', { player: player.serialize() });

    return player;
  }

  public removePlayer(playerId: string): boolean {
    const existed = this.players.delete(playerId);
    if (existed) {
      this.warfare.removePlayer(playerId);
      this.technologySystems.delete(playerId);
      this.rivalDiplomacy.delete(playerId);
      this.warFinanceByPlayer.delete(playerId);
      this.warFinanceUsed.delete(playerId);
      this.campaignChapters.delete(playerId);
      this.defeatSystem.removePlayer(playerId);
      this.borderWatch.delete(playerId);
      this.siegeWarfareSystem.abandonSiege('siege-' + playerId);
      this.siegeTargets.delete(playerId);
      this.courtAssistants.removePlayer(playerId);
      this.civicMissions.removePlayer(playerId);
      this.turnIndex = this.players.size ? this.turnIndex % this.players.size : 0;
      this.emit('playerRemoved', { playerId });
    }
    return existed;
  }

  public setTaxRate(playerId: string, rate: number): void {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');

    if (!Number.isFinite(rate)) throw new RangeError('Der Steuersatz muss eine endliche Zahl sein.');
    const clampedRate = Math.max(0, Math.min(0.5, rate));
    player.kingdom.taxRate = clampedRate;
    
    this.emit('taxRateChanged', { playerId, taxRate: clampedRate });
  }

  public async buildForPlayer(playerId: string, type: string): Promise<boolean> {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');

    let success = false;
    
    // Map UI building keys to Kingdom.infrastructure keys
    switch (type) {
      case 'market':
        success = player.kingdom.buildMarket();
        break;
      case 'farm':
        success = player.kingdom.buildFarm();
        break;
      case 'mill':
        success = player.kingdom.buildMill();
        break;
      case 'mine':
        success = player.kingdom.buildStructure('mines');
        break;
      case 'barracks':
        success = player.kingdom.buildStructure('barracks');
        break;
      case 'walls':
        success = player.kingdom.buildStructure('walls');
        break;
      case 'workshop':
      case 'workshops':
        success = player.kingdom.buildStructure('workshops');
        break;
      default:
        if (Object.prototype.hasOwnProperty.call(player.kingdom.infrastructure, type)) {
          success = player.kingdom.buildStructure(type as keyof KingdomInfrastructure);
        } else {
          throw new Error(`Unbekanntes Gebäude: ${type}`);
        }
        break;
    }

    if (success) {
      this.emit('buildingConstructed', { playerId, building: type });
      this.markTutorialStep(playerId, 'build');
    }

    return success;
  }

  public recruitForPlayer(playerId: string, count: number, type: 'infantry' | 'cavalry' | 'archers' = 'infantry'): boolean {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');

    const success = player.kingdom.recruitSoldiers(count, type);
    
    if (success) {
      this.emit('militaryRecruited', { playerId, count });
    }

    return success;
  }

  // Event System
  public on(eventName: string, listener: (detail: any) => void): () => void {
    const handler = (event: Event): void => {
      const customEvent = event as CustomEvent;
      listener(customEvent.detail);
    };
    this.eventTarget.addEventListener(eventName, handler);
    return (): void => this.eventTarget.removeEventListener(eventName, handler);
  }

  private emit(eventName: string, detail: any): void {
    this.eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  /**
   * Applies benefits from active trade routes to a player's kingdom (v2.6.0)
   * @param player The player whose kingdom receives trade route benefits
   */
  private applyTradeRouteBenefits(player: Player): void {
    const kingdom = player.kingdom;
    
    // Monthly gold income from trade routes
    const tradeIncome = kingdom.calculateTradeRouteIncome(this.transportSystem) / 12;
    if (tradeIncome > 0) {
      kingdom.resources.gold += Math.floor(tradeIncome);
    }
    
    // Cultural influence boost
    const culturalBoost = kingdom.calculateTradeRouteCulturalInfluence(this.transportSystem) / 12;
    if (culturalBoost > 0) {
      kingdom.stats.culturalInfluence = Math.min(100, 
        kingdom.stats.culturalInfluence + culturalBoost
      );
    }
    
    // Prestige from major trade routes
    const prestigeBoost = kingdom.calculateTradeRoutePrestige(this.transportSystem) / 12;
    if (prestigeBoost > 0) {
      player.updateStats({
        prestige: prestigeBoost
      });
    }
    
    // Trade power increases with active routes
    const tradePowerBoost = Math.min(5, kingdom.getActiveTradeRoutes().length * 0.5);
    if (tradePowerBoost > 0) {
      kingdom.stats.tradePower = Math.min(100,
        kingdom.stats.tradePower + tradePowerBoost
      );
    }
  }

  private updatePlayerStats(player: Player): void {
    // Beliebtheit basierend auf Steuersatz und Zufriedenheit
    const popularityChange = 
      (player.kingdom.happiness / 100) * 10 - 
      (player.kingdom.taxRate * 20);
    
    // Ruhm basierend auf Infrastruktur und Militär
    const prestigeChange = 
      player.kingdom.infrastructure.markets * 0.5 +
      player.kingdom.infrastructure.farms * 0.3 +
      player.kingdom.military.infantry * 0.1;
    
    player.updateStats({
      popularity: popularityChange / 12,
      prestige: prestigeChange / 12
    });
  }

  private checkForPromotions(): void {
    for (const player of this.players.values()) {
      const score = this.calculatePlayerScore(player);
      const newTitle = TitleSystem.getTitleForScore(score);

      if (newTitle.rank > player.title.rank) {
        // Convert Title (TitleSystem) to PlayerTitle shape expected by Player.promoteTitle
        const playerTitle = {
          name: newTitle.name,
          rank: newTitle.rank,
          requirements: {
            prestige: (newTitle.requirements as any).minPrestige ?? 0,
            authority: (newTitle.requirements as any).minAuthority ?? 0,
            kingdomScore: (newTitle.requirements as any).minKingdomScore
          },
          benefits: {
            goldPerYear: newTitle.benefits.goldPerYear ?? 0,
            authorityBonus: Math.floor((newTitle.benefits.diplomaticWeight || 0) / 10),
            prestigeBonus: Math.floor((newTitle.benefits.goldPerYear || 0) / 1000),
            specialPrivileges: newTitle.benefits.specialPrivileges
          }
        } as any;

        const promotionResult = player.promoteTitle(playerTitle);
        if (promotionResult.success) {
          this.emit('titlePromotion', {
            playerId: player.id,
            playerName: player.name,
            newTitle: playerTitle
          });
        }
      }
    }
  }
  private calculatePlayerScore(player: Player): number {
    const kingdomScore = player.kingdom.calculateTotalScore();
    const playerScore = player.calculateTotalScore();
    const difficultyMultiplier = 1 + (this.config.difficulty - 1) * 0.5;
    
    return (kingdomScore + playerScore) / difficultyMultiplier;
  }
  
  /**
   * Holt Snapshots aller RoleSwitching-Sessions für alle Spieler
   */
  private getRoleSwitchingSnapshots(): Array<{
    playerId: string;
    currentCitizenId: string | null;
    previousCitizenIds: string[];
    switchHistory: any[];
    metaKnowledge: Record<string, any>;
  }> {
    const snapshots: Array<{
      playerId: string;
      currentCitizenId: string | null;
      previousCitizenIds: string[];
      switchHistory: any[];
      metaKnowledge: Record<string, any>;
    }> = [];
    for (const playerId of this.players.keys()) {
      const snapshot = this.roleSwitchingSystem.createSessionSnapshot(playerId);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }
    return snapshots;
  }

  // Speicherfunktionen
  public async saveGame(slot: string = 'default', manual: boolean = false): Promise<void> {
    if (this.processingMonth) throw new Error('Bitte den laufenden Monat abwarten.');
    const saveData = {
      version: 2,
      citizens: this.citizenSystem.getAllCitizens(),
      players: Array.from(this.players.values()).map(p => p.serialize()),
      currentYear: this.currentYear,
      currentMonth: this.currentMonth,
      gameState: this.gameState,
      config: this.config,
      climateSystem: this.climateSystem.serialize(),
      landscapeSystem: this.landscapeSystem.serialize(),
      animalPopulationSystem: this.animalPopulationSystem.serialize(),
      // Life Simulation Systems (v2.6.0)
      aiControllerManager: this.aiControllerManager.createSnapshot(),
      roleSwitchingSessions: this.getRoleSwitchingSnapshots(),
      timeSystem: this.timeSystem.createSnapshot(),
      dynamicGameView: this.dynamicGameView.createSnapshot(),
      warfare: this.warfare.serialize(),
      council: this.council.serialize(),
      rivalDiplomacy: Object.fromEntries(Array.from(this.rivalDiplomacy, ([id, system]) => [id, system.serialize()])),
      festivalsHeld: Array.from(this.festivalsHeld),
      espionage: this.espionageSystem.serialize(),
      warFinanceByPlayer: Object.fromEntries(Array.from(this.warFinanceByPlayer, ([id, finance]) => [id, finance.serialize()])),
      warFinanceUsed: Array.from(this.warFinanceUsed),
      campaignChapters: Array.from(this.campaignChapters),
      defeat: this.defeatSystem.serialize(),
      tutorial: this.tutorialSystem.serialize(),
      borderWatch: Array.from(this.borderWatch),
      siegeTargets: Array.from(this.siegeTargets),
      siegeWarfare: this.siegeWarfareSystem.serialize(),
      courtAssistants: this.courtAssistants.serialize(),
      culturalExhibitions: Array.from(this.culturalExhibitions),
      modernizationCompleted: Array.from(this.modernizationCompleted),
      civicMissions: this.civicMissions.serialize(),
      chronicle: this.getChronicle(),
      technologyProgress: Object.fromEntries(
        Array.from(this.technologySystems, ([playerId, system]) => [playerId, system.serialize()])
      ),
      turnIndex: this.turnIndex,
      savedAt: new Date().toISOString()
    };

    await localforage.setItem(`kaiser-ii-save-${slot}`, await encodeSave(saveData));
    
    // Save-Index aktualisieren
    const index: SaveMeta[] = (await localforage.getItem('kaiser-ii-saves-index')) || [];
    const existingIndex = index.findIndex(item => item.slot === slot);
    
    const meta: SaveMeta = {
      slot,
      savedAt: new Date().toISOString(),
      playersCount: this.players.size,
      year: this.currentYear
    };
    
    if (existingIndex >= 0) {
      index[existingIndex] = meta;
    } else {
      index.push(meta);
    }
    
    await localforage.setItem('kaiser-ii-saves-index', index);

    // Ein manuelles Speichern zählt als Tutorial-Schritt, der Autosave nicht.
    if (manual) {
      for (const player of this.players.values()) this.markTutorialStep(player.id, 'save');
    }
  }

  public async loadGame(slot: string = 'default'): Promise<void> {
    await this.ready;
    if (this.processingMonth) throw new Error('Bitte den laufenden Monat abwarten.');
    const saveData = await decodeSave(await localforage.getItem<any>(`kaiser-ii-save-${slot}`)) as any;
    
    if (!saveData) {
      throw new Error(`Spielstand "${slot}" nicht gefunden`);
    }

    if (!Array.isArray(saveData.players) || saveData.players.length === 0 ||
        !Number.isSafeInteger(saveData.currentYear) ||
        !Number.isSafeInteger(saveData.currentMonth ?? 1) ||
        (saveData.currentMonth ?? 1) < 1 || (saveData.currentMonth ?? 1) > 12 ||
        !saveData.config || !Number.isFinite(saveData.config.gameSpeed) || saveData.config.gameSpeed <= 0 ||
        (saveData.version !== undefined && saveData.version !== 2)) {
      throw new Error('Der Spielstand ist beschädigt oder inkompatibel.');
    }
    const restoredPlayers = saveData.players.map((data: ReturnType<Player['serialize']>): Player => {
      if (!data || !data.kingdom || !data.stats || !data.kingdom.resources || !data.kingdom.infrastructure) {
        throw new Error('Unvollständige Spielerdaten im Spielstand.');
      }
      for (const value of Object.values(data.kingdom.resources)) {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          throw new Error('Ungültige Ressourcen im Spielstand.');
        }
      }
      return Player.deserialize(data);
    });
    const restoredWarfare = new CampaignWarfareSystem((): number => Math.random());
    if (saveData.warfare) restoredWarfare.load(saveData.warfare);
    for (const player of restoredPlayers) restoredWarfare.ensureRivals(player.id, saveData.config.difficulty);
    if (saveData.technologyProgress !== undefined &&
        (!saveData.technologyProgress || typeof saveData.technologyProgress !== 'object' ||
          Array.isArray(saveData.technologyProgress))) {
      throw new Error('Der Forschungsstand im Spielstand ist beschädigt.');
    }
    const restoredTechnology = new Map<string, PlayerTechnologySystem>();
    for (const player of restoredPlayers) {
      const system = new PlayerTechnologySystem();
      const snapshot = saveData.technologyProgress?.[player.id] as TechnologyProgressSnapshot | undefined;
      if (snapshot) system.load(snapshot);
      restoredTechnology.set(player.id, system);
    }
    const restoredCouncil = new CouncilDecisionSystem();
    if (saveData.council !== undefined) restoredCouncil.load(saveData.council as CouncilSnapshot);
    this.pauseGame();
    this.council = restoredCouncil;
    this.players = new Map(restoredPlayers.map((player: Player) => [player.id, player]));
    this.warfare = restoredWarfare;
    this.technologySystems = restoredTechnology;
    this.rivalDiplomacy = new Map();
    this.festivalsHeld = new Map(Array.isArray(saveData.festivalsHeld) ? saveData.festivalsHeld : []);
    this.modernizationCompleted = new Map();
    if (saveData.modernizationCompleted !== undefined) {
      if (!Array.isArray(saveData.modernizationCompleted) ||
          saveData.modernizationCompleted.some((entry: unknown) =>
            !Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' ||
            !restoredPlayers.some((p: Player) => p.id === entry[0]) ||
            !Array.isArray(entry[1]) || entry[1].some((id: unknown) =>
              typeof id !== 'string' || !MODERNIZATION_PROJECTS.some((p) => p.id === id))))
        throw new Error('Beschädigte Modernisierungsdaten.');
      this.modernizationCompleted = new Map(saveData.modernizationCompleted);
    }
    this.culturalExhibitions = new Map();
    if (saveData.culturalExhibitions !== undefined) {
      if (!Array.isArray(saveData.culturalExhibitions) || saveData.culturalExhibitions.length > 5000 ||
          saveData.culturalExhibitions.some((pair: unknown) =>
            !Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' ||
            !restoredPlayers.some((p: Player) => pair[0].startsWith(p.id + ':')) ||
            !Number.isSafeInteger(pair[1]) || pair[1] < 0 || pair[1] > saveData.currentYear)) {
        throw new Error('Beschädigtes kulturelles Gedächtnis im Spielstand.');
      }
      this.culturalExhibitions = new Map(saveData.culturalExhibitions);
    }
    this.warFinanceByPlayer = new Map();
    this.warFinanceUsed = new Map(Array.isArray(saveData.warFinanceUsed) ? saveData.warFinanceUsed : []);
    this.campaignChapters = new Map();
    this.borderWatch = new Map();
    this.siegeWarfareSystem = new SiegeWarfareSystem();
    if (saveData.siegeWarfare) this.siegeWarfareSystem.deserialize(saveData.siegeWarfare);
    this.siegeTargets = new Map();
    if (saveData.siegeTargets !== undefined) {
      if (!Array.isArray(saveData.siegeTargets) || saveData.siegeTargets.some((pair: unknown) =>
        !Array.isArray(pair) || pair.length !== 2 ||
        !restoredPlayers.some((player: Player) => player.id === pair[0]) ||
        typeof pair[1] !== 'string' ||
        !restoredWarfare.getRivals(pair[0]).some((rival) => rival.id === pair[1]) ||
        !this.siegeWarfareSystem.getActiveSieges().some((siege) =>
          siege.siegeId === 'siege-' + pair[0] && siege.defenderId === pair[1]))) {
        throw new Error('Beschädigter Belagerungsstand im Spielstand.');
      }
      this.siegeTargets = new Map(saveData.siegeTargets);
    }
    if (saveData.borderWatch !== undefined) {
      if (!Array.isArray(saveData.borderWatch) || saveData.borderWatch.some((entry: unknown) =>
        !Array.isArray(entry) || entry.length !== 2 ||
        !restoredPlayers.some((player: Player) => player.id === entry[0]) || entry[1] !== 0.3)) {
        throw new Error('Ungültige Grenzwachen im Spielstand.');
      }
      this.borderWatch = new Map(saveData.borderWatch);
    }
    if (saveData.campaignChapters !== undefined) {
      if (!Array.isArray(saveData.campaignChapters) ||
          saveData.campaignChapters.some((entry: unknown) =>
            !Array.isArray(entry) || entry.length !== 2 ||
            !restoredPlayers.some((player: Player) => player.id === entry[0]) ||
            !Number.isSafeInteger(entry[1]) || entry[1] < 0 || entry[1] > 3)) {
        throw new Error('Ungültiger Kampagnenkapitelstand im Spielstand.');
      }
      this.campaignChapters = new Map(saveData.campaignChapters);
    }
    // Defeat state is optional for backward compatibility with pre-defeat saves.
    if (saveData.defeat !== undefined) {
      this.defeatSystem.deserialize(saveData.defeat);
    }
    // Tutorial state is optional for backward compatibility with pre-tutorial saves.
    if (saveData.tutorial !== undefined) {
      this.tutorialSystem.deserialize(saveData.tutorial);
    }
    for (const player of restoredPlayers) {
      const finance = new WarFinancingSystem();
      if (saveData.warFinanceByPlayer?.[player.id]) finance.deserialize(saveData.warFinanceByPlayer[player.id]);
      this.warFinanceByPlayer.set(player.id, finance);
    }
    this.espionageSystem = new EspionageSystem();
    if (saveData.espionage) this.espionageSystem.deserialize(saveData.espionage);
    for (const player of restoredPlayers) {
      const snapshot = saveData.rivalDiplomacy?.[player.id];
      this.rivalDiplomacy.set(player.id, snapshot ? DiplomacySystem.deserialize(snapshot) : new DiplomacySystem(player.id));
      this.initializeRivalDiplomacy(player.id);
    }
    this.turnIndex = Number.isSafeInteger(saveData.turnIndex) && saveData.turnIndex >= 0
      ? saveData.turnIndex % restoredPlayers.length : 0;
    
    this.currentYear = saveData.currentYear;
    this.currentMonth = saveData.currentMonth || 1;
    // Loading is deliberately paused so the player can review the restored kingdom.
    this.gameState = GameState.PAUSED;
    this.config = saveData.config;
    
    // Load ecological systems (v2.2.3)
    if (saveData.climateSystem) {
      this.climateSystem = ClimateSystem.deserialize(saveData.climateSystem);
    }
    if (saveData.landscapeSystem) {
      this.landscapeSystem = LandscapeSystem.deserialize(saveData.landscapeSystem);
    }
    if (saveData.animalPopulationSystem) {
      this.animalPopulationSystem = AnimalPopulationSystem.deserialize(saveData.animalPopulationSystem);
    }
    
    // Load Life Simulation Systems (v2.6.0)
    if (saveData.aiControllerManager) {
      this.aiControllerManager.loadSnapshot(saveData.aiControllerManager);
    }
    // Legacy version-2 saves omit this optional array. Strict bounded validation
    // prevents malformed history entries from being injected into the UI.
    if (saveData.chronicle !== undefined && (
        !Array.isArray(saveData.chronicle) || saveData.chronicle.length > 100 ||
        saveData.chronicle.some((entry: unknown) => !entry || typeof entry !== 'object' ||
          typeof (entry as ChronicleEntry).date !== 'string' ||
          (entry as ChronicleEntry).date.length > 40 ||
          typeof (entry as ChronicleEntry).message !== 'string' ||
          (entry as ChronicleEntry).message.length > 900 ||
          ((entry as ChronicleEntry).playerId !== undefined &&
            !restoredPlayers.some((p: Player) => p.id === (entry as ChronicleEntry).playerId))))) {
      throw new Error('Die gespeicherte Chronik ist beschädigt.');
    }
    this.chronicle = (saveData.chronicle ?? []).map((entry: ChronicleEntry) => ({...entry}));
    this.citizenSystem.restoreCitizens(saveData.citizens ?? []);
    this.civicMissions = new CivicMissionSystem();
    if(saveData.civicMissions) this.civicMissions.load(saveData.civicMissions,new Set(restoredPlayers.map((p:Player)=>p.id)),id=>this.citizenSystem.getCitizen(id));
    this.courtAssistants = new CourtAssistantRegistry();
    if (saveData.courtAssistants !== undefined) this.courtAssistants.restore(saveData.courtAssistants,
      new Set(restoredPlayers.map((p: Player) => p.id)), (id) => this.citizenSystem.getCitizen(id));
    if (saveData.roleSwitchingSessions) {
      for (const sessionSnapshot of saveData.roleSwitchingSessions) {
        this.roleSwitchingSystem.loadSessionSnapshot(sessionSnapshot);
      }
    }
    if (saveData.timeSystem) {
      this.timeSystem.loadSnapshot(saveData.timeSystem);
    }
    if (saveData.dynamicGameView) {
      this.dynamicGameView.loadSnapshot(saveData.dynamicGameView);
    }
    this.timeSystem.setDate(this.currentYear, this.currentMonth);
    this.timeSystem.pause();
    
    this.emit('gameLoaded', { slot });
  }

  /**
   * Quotes a market exchange using the economy's shared price table.
   * @param resource Resource to exchange.
   * @param amount Positive integral resource amount.
   * @param direction Buy from or sell to the market.
   * @returns Total gold charged or received.
   * @throws RangeError for invalid amounts.
   */
  public quoteTrade(resource: MarketResource, amount: number, direction: 'buy' | 'sell'): number {
    if (!['food', 'wood', 'stone', 'iron'].includes(resource) || !['buy', 'sell'].includes(direction)) {
      throw new RangeError('Unbekannte Ressource oder Handelsrichtung.');
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new RangeError('Die Handelsmenge muss eine positive ganze Zahl sein.');
    }
    const price = this._economy.getMarketPrices()[resource];
    return direction === 'buy' ? Math.ceil(price * amount * 1.2) : Math.floor(price * amount * 0.8);
  }

  /**
   * Exchanges resources atomically; failed trades leave the kingdom unchanged.
   * @param playerId Player owning the resources.
   * @param resource Resource to exchange.
   * @param amount Positive integral resource amount.
   * @param direction Buy or sell.
   * @returns Whether the exchange could be funded.
   * @throws Error if the player or amount is invalid.
   */
  public tradeForPlayer(playerId: string, resource: MarketResource, amount: number, direction: 'buy' | 'sell'): boolean {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden.');
    const price = this.quoteTrade(resource, amount, direction);
    const resources = player.kingdom.resources;
    if (direction === 'buy') {
      if (resources.gold < price) return false;
      resources.gold -= price;
      resources[resource] += amount;
    } else {
      if (resources[resource] < amount) return false;
      resources[resource] -= amount;
      resources.gold += price;
    }

    this.emit('tradeCompleted', { playerId, resource, amount, direction, price });
    this.markTutorialStep(playerId, 'trade');
    return true;
  }

  /**
   * Returns the research stock, completed technologies and active research for a realm.
   * @param playerId Owning player.
   * @returns A detached research snapshot.
   * @throws Error if the player does not exist.
   */
  public getResearchImpact(playerId: string) {
    return researchImpact(this.requireTechnologySystem(playerId).getResearchedTechnologyIds());
  }

  public getTechnologyProgress(playerId: string): TechnologyProgressSnapshot {
    return this.requireTechnologySystem(playerId).serialize();
  }

  /**
   * Technologies available in the current era and any blockers to starting research.
   * @param playerId Owning player.
   * @returns Era-eligible technologies and their research requirements.
   * @throws Error if the player does not exist.
   */
  public getTechnologyOptions(playerId: string): TechnologyOption[] {
    const player = this.requirePlayer(playerId);
    const system = this.requireTechnologySystem(playerId);
    return TechnologySystem.getAllTechnologies()
      .filter((technology: TechnologyDefinition): boolean => technology.year <= this.currentYear)
      .map((technology: TechnologyDefinition): TechnologyOption => {
        const blockers: string[] = [];
        const researched = system.isResearched(technology.id);
        if (researched) blockers.push('Bereits erforscht');
        if (system.getCurrentResearch()?.tech.id === technology.id) blockers.push('Forschung läuft');
        if (system.getCurrentResearch() && system.getCurrentResearch()?.tech.id !== technology.id) {
          blockers.push('Ein anderes Forschungsprojekt läuft');
        }
        for (const prerequisiteId of technology.prerequisites) {
          if (!system.isResearched(prerequisiteId)) {
            const prerequisite = TechnologySystem.getTechnology(prerequisiteId);
            blockers.push(`Voraussetzung: ${prerequisite?.name ?? prerequisiteId}`);
          }
        }
        if (system.getResearchPoints() < technology.cost.research) {
          blockers.push(`Forschungspunkte: ${formatResearch(system.getResearchPoints())}/${formatResearch(technology.cost.research)}`);
        }
        if (player.kingdom.resources.gold < technology.cost.gold) {
          blockers.push(`Gold: ${formatResearch(player.kingdom.resources.gold)}/${formatResearch(technology.cost.gold)}`);
        }
        return { technology, researched, canStart: blockers.length === 0, blockers };
      });
  }

  /**
   * Starts a single research project and deducts its gold and research-point costs atomically.
   * @param playerId Owning player.
   * @param technologyId Technology to research.
   * @returns Technology metadata.
   * @throws Error if the technology is unavailable or the realm cannot pay.
   */
  public startResearch(playerId: string, technologyId: string): TechnologyDefinition {
    const player = this.requirePlayer(playerId);
    const option = this.getTechnologyOptions(playerId)
      .find((entry: TechnologyOption): boolean => entry.technology.id === technologyId);
    if (!option) throw new Error('Diese Technologie gehört nicht zur aktuellen Epoche.');
    if (!option.canStart) throw new Error(option.blockers.join(' · '));
    player.kingdom.resources.gold -= option.technology.cost.gold;
    const started = this.requireTechnologySystem(playerId).startResearch(option.technology);
    if (!started) {
      player.kingdom.resources.gold += option.technology.cost.gold;
      throw new Error('Das Forschungsprojekt konnte nicht gestartet werden.');
    }
    this.emit('researchStarted', { playerId, technology: option.technology });
    this.markTutorialStep(playerId, 'research');
    return option.technology;
  }

  private requireTechnologySystem(playerId: string): PlayerTechnologySystem {
    this.requirePlayer(playerId);
    const system = this.technologySystems.get(playerId);
    if (!system) throw new Error('Der Forschungsstand dieses Reiches fehlt.');
    return system;
  }

  /**
   * Stops timers and pauses a discarded engine.
   * @returns Nothing.
   */
  public dispose(): void {
    if (this._tickHandle) clearTimeout(this._tickHandle);
    this._tickHandle = null;
    this.gameState = GameState.PAUSED;
    this.timeSystem.pause();
  }

  /**
   * Evaluates the build campaign's goals from authoritative kingdom state.
   * @param playerId Owner of the campaign.
   * @returns Six objectives, complete only when their current thresholds are met.
   * @throws Error if the player does not exist.
   */
  /** Completing each chapter is an explicit monthly milestone, never a UI render side effect. */
  private completeCampaignChapter(player: Player): void {
    if (this.getCampaignId() === 'frei') return;
    const completed = this.campaignChapters.get(player.id) ?? 0;
    const chapter = chapterStatus(this.getCampaignId(), completed, this.getCampaignGoals(player.id));
    if (!chapter.ready) return;
    this.campaignChapters.set(player.id, completed + 1);
    const reward = 250 * (completed + 1);
    player.kingdom.resources.gold += reward;
    player.updateStats({ prestige: 2 });
    this.emit('campaignChapterCompleted', {
      playerId: player.id, chapter: chapter.title, number: completed + 1,
      reward, final: completed + 1 === chapter.total
    });
  }

  public getCampaignChapterStatus(playerId: string): CampaignChapterStatus {
    this.requirePlayer(playerId);
    return chapterStatus(this.getCampaignId(), this.campaignChapters.get(playerId) ?? 0,
      this.getCampaignGoals(playerId));
  }

  public getCampaignId(): CampaignId { return this.config.campaignId ?? 'aufbau'; }
  public getCampaignDefinition() { return CAMPAIGNS.find((item) => item.id === this.getCampaignId()) ?? CAMPAIGNS[0]; }
  public getCampaignGoals(playerId: string): CampaignGoal[] {
    const player = this.requirePlayer(playerId);
    if (this.getCampaignId() === 'frei') return [];
    if (this.getCampaignId() === 'aufbau') {
      const kingdom = player.kingdom;
      const balance = kingdom.getMonthlyBalance();
      const tradeIncome = this.getTradeNetworkStats(player).monthlyIncome;
      return [
        { label: '12 Bauernhöfe', done: kingdom.infrastructure.farms >= 12 },
        { label: '3 Marktplätze', done: kingdom.infrastructure.markets >= 3 },
        { label: '2 Schulen', done: kingdom.infrastructure.schools >= 2 },
        { label: '65 % Zufriedenheit', done: kingdom.happiness >= 65 },
        { label: '8.000 Gold & positive Versorgung', done: kingdom.resources.gold >= 8000 &&
          balance.net.food >= 0 && balance.net.gold + tradeIncome >= 0 },
        { label: 'Einen Rivalen unterwerfen', done: this.warfare.subjugatedCount(playerId) >= 1 }
      ];
    }
    return campaignGoals(this.getCampaignId(), player.kingdom,
      this.requireTechnologySystem(playerId).getResearchedTechnologyIds().length,
      this.warfare.subjugatedCount(playerId), player.kingdom.getActiveTradeRoutes().length,
      this.getRivalTreaties(playerId).filter((treaty) => treaty.type === 'non_aggression').length);
  }

  // === Warfare (v3.0) ===

  /**
   * Rivals neighbouring a player's realm.
   * @param playerId Player.
   * @returns Rival realms with their current strength.
   */
  /** Expose the existing diplomacy model for each player's NPC neighbours. */
  /** Seasonal cultural events are read from the pre-existing ReligionSystem data. */
  /** Existing religion data is now available to the playable cultural screen. */
  public getReligiousOverview(playerId: string) {
    this.requirePlayer(playerId);
    return {
      dominant: this.religionSystem.getReligion(this.religionSystem.getDominantReligion())?.name ?? 'Unbekannt',
      culturalInfluence: this.religionSystem.getCulturalInfluence(),
      religiousFreedom: this.religionSystem.getReligiousFreedom(),
      religions: this.religionSystem.getAllReligions().map((religion) => ({
        id: religion.id, name: religion.name, influence: religion.influence, followers: religion.followers
      }))
    };
  }

  public getFestivalOptions(playerId: string): Array<{
    event: CulturalEvent; affordable: boolean; alreadyHeld: boolean;
  }> {
    const player = this.requirePlayer(playerId);
    return this.religionSystem.getCulturalEvents()
      .filter((event) => event.culture === this.religionSystem.getDominantCulture() &&
        (event.month === this.currentMonth || event.season === player.kingdom.currentSeason))
      .map((event) => ({
        event,
        affordable: player.kingdom.resources.gold >= (event.effects.goldCost ?? 0) &&
          player.kingdom.resources.food >= (event.effects.foodConsumption ?? 0),
        alreadyHeld: this.festivalsHeld.get(playerId + ':' + event.id) === this.currentYear
      }));
  }

  public holdFestival(playerId: string, eventId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const option = this.getFestivalOptions(playerId).find((entry) => entry.event.id === eventId);
    if (!option) throw new Error('Dieses Fest ist derzeit nicht verfügbar.');
    if (option.alreadyHeld) throw new Error('Dieses Fest wurde bereits dieses Jahr gefeiert.');
    if (!option.affordable) throw new Error('Für die Feier fehlen Gold oder Nahrung.');
    const effects = option.event.effects;
    player.kingdom.resources.gold -= effects.goldCost ?? 0;
    player.kingdom.resources.food -= effects.foodConsumption ?? 0;
    player.kingdom.happiness = Math.max(0, Math.min(100, player.kingdom.happiness + (effects.happiness ?? 0)));
    player.kingdom.stats.stability = Math.max(0, Math.min(100,
      player.kingdom.stats.stability + (effects.stability ?? 0)));
    // Culture is shared world data in the legacy system, so don't mutate it for one realm.
    if (effects.culturalInfluence) player.updateStats({ prestige: effects.culturalInfluence / 2 });
    this.festivalsHeld.set(playerId + ':' + eventId, this.currentYear);
    const message = option.event.name + ' gefeiert. Das Volk erinnert sich an diese Feier.';
    this.emit('festivalHeld', { playerId, message });
    return message;
  }

  public getCampaignIntelligence(playerId: string) {
    this.requirePlayer(playerId);
    return {
      agents: this.espionageSystem.getAgentsForOwner(playerId),
      missions: this.espionageSystem.getMissionsForOwner(playerId),
      reports: this.espionageSystem.getActiveIntelligence().filter((report) =>
        this.espionageSystem.getAgentsForOwner(playerId).some((agent) => agent.id === report.source))
    };
  }

  public recruitCampaignSpy(playerId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const agents = this.espionageSystem.getAgentsForOwner(playerId);
    if (agents.length >= 4) throw new Error('Maximal vier Kundschafter je Reich.');
    if (player.kingdom.resources.gold < 400) throw new Error('Für einen Kundschafter fehlen 400 Gold.');
    const citizen = this.getCurrentCharacter(playerId);
    player.kingdom.resources.gold -= 400;
    const id = 'spy-' + playerId + '-' + (agents.length + 1);
    this.espionageSystem.recruitAgent(id, playerId, citizen?.firstName ?? 'Kundschafter',
      { intelligence: 70, stealth: 65, deception: 60 });
    const message = 'Ein Kundschafter wurde für 400 Gold angeworben.';
    this.emit('espionageEvent', { playerId, message });
    return message;
  }

  public sendCampaignSpy(playerId: string, agentId: string, rivalId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const rival = this.warfare.getRivals(playerId).find((entry) => entry.id === rivalId && !entry.subjugated);
    if (!rival) throw new Error('Dieses Zielreich ist nicht verfügbar.');
    const agent = this.espionageSystem.getAgentsForOwner(playerId)
      .find((entry) => entry.id === agentId && !entry.captured && !entry.currentMission);
    if (!agent) throw new Error('Kundschafter nicht verfügbar.');
    if (player.kingdom.resources.gold < 150) throw new Error('Für den Einsatz fehlen 150 Gold.');
    const id = 'mission-' + playerId + '-' + this.currentYear + '-' + this.currentMonth +
      '-' + agentId;
    const mission = this.espionageSystem.assignMission(id, agentId, 'intelligence', rival.id);
    if (!mission) throw new Error('Mission konnte nicht gestartet werden.');
    player.kingdom.resources.gold -= 150;
    this.espionageSystem.deployAgent(agentId, rival.id);
    const message = 'Kundschafter wurde nach ' + rival.name + ' entsandt.';
    this.emit('espionageEvent', { playerId, message });
    return message;
  }

  public getRivalRelations(playerId: string) {
    this.requirePlayer(playerId);
    return this.requireRivalDiplomacy(playerId).getAllRelations();
  }

  public getRivalMissions(playerId: string) {
    this.requirePlayer(playerId);
    return this.requireRivalDiplomacy(playerId).getActiveMissions();
  }

  /** An active non-aggression treaty blocks raids and offensive campaigns. */
  public hasRivalTruce(playerId: string, rivalId: string): boolean {
    this.requirePlayer(playerId);
    return this.requireRivalDiplomacy(playerId).getActiveTreaties().some((treaty) =>
      treaty.type === 'non_aggression' && treaty.parties.includes(playerId) &&
      treaty.parties.includes(rivalId) && (treaty.expiryYear === undefined ||
        treaty.expiryYear > this.currentYear));
  }

  public getRivalTreaties(playerId: string) {
    this.requirePlayer(playerId);
    return this.requireRivalDiplomacy(playerId).getActiveTreaties()
      .filter((treaty) => treaty.expiryYear === undefined || treaty.expiryYear > this.currentYear);
  }

  public negotiateRivalTruce(playerId: string, rivalId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const rival = this.warfare.getRivals(playerId).find((entry) => entry.id === rivalId && !entry.subjugated);
    if (!rival) throw new Error('Mit diesem Reich ist kein Pakt möglich.');
    if (this.hasRivalTruce(playerId, rivalId)) throw new Error('Es besteht bereits ein Nichtangriffspakt.');
    const diplomacy = this.requireRivalDiplomacy(playerId);
    const relation = diplomacy.getRelation(rivalId);
    if (!relation || relation.relationshipValue < 10) {
      throw new Error('Mindestens 10 Beziehungspunkte erforderlich. Entsende zunächst Gesandte.');
    }
    const cost = 500;
    if (player.kingdom.resources.gold < cost) throw new Error('Für den Friedenspakt fehlen 500 Gold.');
    // Verified, two-way treaty: both the player's attacks and rival raids are blocked.
    player.kingdom.resources.gold -= cost;
    diplomacy.proposeTreaty({
      type: 'non_aggression', parties: [playerId, rivalId],
      signedYear: this.currentYear, expiryYear: this.currentYear + 2,
      terms: {}, active: true
    });
    const message = `Nichtangriffspakt mit ${rival.name} geschlossen (500 Gold, zwei Jahre).`;
    this.emit('diplomacyEvent', { playerId, message });
    return message;
  }

  public sendRivalEnvoy(playerId: string, rivalId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const rival = this.warfare.getRivals(playerId).find((other) => other.id === rivalId && !other.subjugated);
    if (!rival) throw new Error('Dieser Nachbar steht nicht für eine Mission zur Verfügung.');
    const system = this.requireRivalDiplomacy(playerId);
    if (system.getActiveMissions().some((mission) => mission.targetKingdomId === rivalId)) {
      throw new Error('Es ist bereits ein Gesandter zu diesem Nachbarn unterwegs.');
    }
    const price = 350;
    if (player.kingdom.resources.gold < price) throw new Error('Ein Gesandter benötigt 350 Gold.');
    player.kingdom.resources.gold -= price;
    system.sendMission({
      type: 'ambassador', targetKingdomId: rivalId, targetKingdomName: rival.name,
      startYear: this.currentYear, duration: 1, cost: price
    });
    const message = `Gesandtschaft nach ${rival.name} aufgebrochen (350 Gold).`;
    this.emit('diplomacyEvent', { playerId, message });
    return message;
  }

  private requireRivalDiplomacy(playerId: string): DiplomacySystem {
    const system = this.rivalDiplomacy.get(playerId);
    if (!system) throw new Error('Diplomatie für dieses Reich wurde nicht angelegt.');
    return system;
  }

  private initializeRivalDiplomacy(playerId: string): void {
    let diplomacy = this.rivalDiplomacy.get(playerId);
    if (!diplomacy) {
      diplomacy = new DiplomacySystem(playerId);
      this.rivalDiplomacy.set(playerId, diplomacy);
    }
    for (const rival of this.warfare.getRivals(playerId)) {
      diplomacy.initializeRelation(rival.id, rival.name, rival.subjugated ? 'vassal' : 'neutral');
    }
  }

  private processRivalDiplomacy(player: Player): void {
    const diplomacy = this.requireRivalDiplomacy(player.id);
    // Missions use the existing annual processing; trade and formal treaties remain future work.
    if (this.currentMonth === 12) {
      const active = diplomacy.getActiveMissions().map((mission) => mission.id);
      diplomacy.advanceYear(this.currentYear + 1);
      for (const id of active) {
        const mission = diplomacy.getMission(id);
        if (mission?.success !== null && mission?.success !== undefined) {
          this.emit('diplomacyEvent', {
            playerId: player.id,
            message: `Gesandtschaft nach ${mission.targetKingdomName}: ${mission.success ? 'erfolgreich' : 'gescheitert'}.`
          });
        }
      }
    }
  }

  public getRivalPersonality(playerId: string, rivalId: string) {
    this.requirePlayer(playerId);
    const rival = this.warfare.getRivals(playerId).find((entry) => entry.id === rivalId);
    if (!rival) throw new Error('Unbekannter Nachbar.');
    return rival.id === 'raubritter' ? 'Räuberisch' :
      rival.id === 'ostmark' ? 'Wehrhaft' : 'Handelsorientiert';
  }

  public getRivals(playerId: string): RivalRealm[] {
    this.requirePlayer(playerId);
    return this.warfare.getRivals(playerId, this.currentYear);
  }

  /**
   * Battle reports concerning a player, newest first.
   * @param playerId Player.
   * @returns Reports.
   */
  public getBattleReports(playerId: string): BattleReport[] {
    return this.warfare.getReports(playerId);
  }

  /**
   * Aggregated army information for the war room.
   * @param playerId Player.
   * @returns Field soldiers, attack and defense power, supply cost and whether the army can still march this month.
   */
  /** Read-only current siege including wall and supply progress. */
  public getCampaignSiege(playerId: string) {
    this.requirePlayer(playerId);
    const target = this.siegeTargets.get(playerId);
    const status = this.siegeWarfareSystem.getActiveSieges()
      .find((siege) => siege.siegeId === 'siege-' + playerId);
    return target && status ? { ...status, deployedWeapons: new Map(status.deployedWeapons), rivalId: target } : null;
  }

  public beginCampaignSiege(playerId: string, rivalId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    if (this.getCampaignSiege(playerId)) throw new Error('Ein Heer kann nur eine Belagerung gleichzeitig führen.');
    if (this.hasRivalTruce(playerId, rivalId)) throw new Error('Ein Nichtangriffspakt verhindert eine Belagerung.');
    const rival = this.warfare.getRivals(playerId).find((entry) => entry.id === rivalId && !entry.subjugated);
    if (!rival) throw new Error('Kein belagerbares Ziel.');
    if (CampaignWarfareSystem.fieldSoldiers(player.kingdom) < 40) throw new Error('Mindestens 40 Soldaten benötigt.');
    if (player.kingdom.resources.gold < 500 || player.kingdom.resources.food < 250)
      throw new Error('Für die Belagerung werden 500 Gold und 250 Nahrung benötigt.');
    if (!this.siegeWarfareSystem.startSiege('siege-' + playerId, 'stone_wall', playerId,
      rivalId, CampaignWarfareSystem.fieldSoldiers(player.kingdom), rival.soldiers))
      throw new Error('Festung nicht gefunden.');
    player.kingdom.resources.gold -= 500;
    player.kingdom.resources.food -= 250;
    this.siegeTargets.set(playerId, rivalId);
    const message = 'Belagerungsring um ' + rival.name + ' geschlossen.';
    this.emit('siegeEvent', { playerId, message });
    return message;
  }

  public resupplyCampaignSiege(playerId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    if (!this.getCampaignSiege(playerId)) throw new Error('Keine Belagerung aktiv.');
    if (player.kingdom.resources.gold < 200 || player.kingdom.resources.food < 250)
      throw new Error('Nachschub kostet 200 Gold und 250 Nahrung.');
    if (!this.siegeWarfareSystem.resupplySiege('siege-' + playerId, 20))
      throw new Error('Die Vorratslager können nicht weiter aufgefüllt werden.');
    player.kingdom.resources.gold -= 200;
    player.kingdom.resources.food -= 250;
    const message = 'Versorgungswagen erreichen das Belagerungsheer (+20 Tage Vorräte).';
    this.emit('siegeEvent', { playerId, message });
    return message;
  }

  public withdrawCampaignSiege(playerId: string): string {
    this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    if (!this.siegeWarfareSystem.abandonSiege('siege-' + playerId))
      throw new Error('Keine Belagerung aktiv.');
    this.siegeTargets.delete(playerId);
    const message = 'Das Heer bricht die Belagerung ab.';
    this.emit('siegeEvent', { playerId, message });
    return message;
  }

  /** Five days of siege progress each month. Only the final assault can subjugate the rival. */
  private processCampaignSiege(player: Player): void {
    const siege = this.getCampaignSiege(player.id);
    if (!siege) return;
    const provisions = player.kingdom.resources;
    if (provisions.gold < 100 || provisions.food < 100 ||
        CampaignWarfareSystem.fieldSoldiers(player.kingdom) < 40) {
      this.siegeWarfareSystem.abandonSiege(siege.siegeId);
      this.siegeTargets.delete(player.id);
      this.emit('siegeEvent', { playerId: player.id,
        message: 'Die Belagerung wurde mangels Nachschub oder Soldaten abgebrochen.' });
      return;
    }
    provisions.gold -= 100;
    provisions.food -= 100;
    let result: { breached: boolean; surrendered: boolean } = { breached: false, surrendered: false };
    for (let day = 0; day < 5; day++) {
      result = this.siegeWarfareSystem.processSiegeDay(siege.siegeId);
      if (result.breached || result.surrendered) break;
    }
    if (result.breached || result.surrendered) {
      // The siege unlocks a weaker fortification in the existing battle system;
      // it does NOT claim an unearned conquest or charge a second army's casualties.
      this.warfare.weakenRivalFortification(player.id, siege.rivalId, 0.3);
      this.siegeTargets.delete(player.id);
      this.emit('siegeEvent', { playerId: player.id,
        message: 'Die gegnerische Festung ist geschwächt! Ein anschließender Feldzug hat bessere Chancen.' });
    }
  }

  private requireWarFinance(playerId: string): WarFinancingSystem {
    this.requirePlayer(playerId);
    const finance = this.warFinanceByPlayer.get(playerId);
    if (!finance) throw new Error('Kriegsfinanzierung dieses Reiches fehlt.');
    return finance;
  }

  /** Borrow against future income; once per year, realm-scoped, with real debt service. */
  public takeWarLoan(playerId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    if (this.warFinanceUsed.get(playerId) === this.currentYear) throw new Error('Dieses Jahr wurde bereits ein Kriegsdarlehen aufgenommen.');
    const finance = this.requireWarFinance(playerId);
    const result = finance.activateFinancingMethod(player.kingdom, 'campaign_army_loan', this.currentYear, this.currentMonth);
    if (!result.success) throw new Error(result.message);
    this.warFinanceUsed.set(playerId, this.currentYear);
    this.emit('financeEvent', { playerId, message: result.message });
    return result.message;
  }

  public getWarFinanceOverview(playerId: string) {
    return { stats: this.requireWarFinance(playerId).getStats(),
      available: this.warFinanceUsed.get(playerId) !== this.currentYear };
  }

  /** One-month active defense action; uses the existing CampaignWarfare modifiers. */
  public prepareBorderWatch(playerId: string): string {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    if (this.borderWatch.has(playerId)) throw new Error('Eine Grenzwache ist bereits vorbereitet.');
    if (player.kingdom.resources.gold < 300 || player.kingdom.resources.wood < 150)
      throw new Error('Die Grenzwache benötigt 300 Gold und 150 Holz.');
    player.kingdom.resources.gold -= 300;
    player.kingdom.resources.wood -= 150;
    this.borderWatch.set(playerId, 0.3);
    const message = 'Grenzwache alarmiert: +30 % Verteidigungsführung im nächsten Monat.';
    this.emit('borderWatchPrepared', { playerId, message });
    return message;
  }

  public hasBorderWatch(playerId: string): boolean {
    this.requirePlayer(playerId);
    return this.borderWatch.has(playerId);
  }

  public getArmyOverview(playerId: string): {
    soldiers: number; attack: number; defense: number; cost: { gold: number; food: number };
    canCampaign: boolean; commanderBonus: number;
  } {
    const player = this.requirePlayer(playerId);
    const modifiers = this.getCommanderModifiers(playerId);
    return {
      soldiers: CampaignWarfareSystem.fieldSoldiers(player.kingdom),
      attack: CampaignWarfareSystem.armyPower(player.kingdom, modifiers, this.currentYear),
      defense: CampaignWarfareSystem.defensePower(player.kingdom, modifiers, this.currentYear),
      cost: CampaignWarfareSystem.campaignCost(player.kingdom),
      canCampaign: this.warfare.canCampaign(playerId, this.currentYear * 12 + this.currentMonth),
      commanderBonus: modifiers.commanderBonus ?? 0
    };
  }

  /**
   * Victory chance of a planned attack.
   * @param playerId Attacker.
   * @param target Rival id or another player's id.
   * @returns Chance between 0 and 1.
   */
  public getVictoryChance(playerId: string, target: string): number {
    const player = this.requirePlayer(playerId);
    const attack = CampaignWarfareSystem.armyPower(player.kingdom, this.getCommanderModifiers(playerId), this.currentYear);
    const opponent = this.players.get(target);
    if (opponent) {
      return CampaignWarfareSystem.victoryChance(attack,
        CampaignWarfareSystem.defensePower(opponent.kingdom, this.getCommanderModifiers(target), this.currentYear));
    }
    const rival = this.warfare.getRivals(playerId).find((entry: RivalRealm): boolean => entry.id === target);
    if (!rival) throw new Error('Unbekannter Gegner.');
    return CampaignWarfareSystem.victoryChance(attack, CampaignWarfareSystem.rivalPower(rival, this.currentYear));
  }

  /**
   * Leads the field army against a rival realm.
   * @param playerId Attacker.
   * @param rivalId Rival realm id.
   * @returns Battle report.
   * @throws Error if supplies, soldiers or the monthly campaign limit prevent the attack.
   */
  public attackRival(playerId: string, rivalId: string): BattleReport {
    if (this.hasRivalTruce(playerId, rivalId)) throw new Error('Ein Nichtangriffspakt verbietet diesen Feldzug.');
    const player = this.requirePlayer(playerId);
    const report = this.warfare.attackRival(playerId, player.kingdom, rivalId,
      { year: this.currentYear, month: this.currentMonth }, this.getCommanderModifiers(playerId));
    if (report.attackerWon) player.updateStats({ prestige: 5 });
    this.emit('battleResolved', { report });
    return report;
  }

  /**
   * Attacks another human player's realm (hotseat multiplayer).
   * @param attackerId Attacking player.
   * @param defenderId Defending player.
   * @returns Battle report.
   * @throws Error for invalid targets or missing supplies.
   */
  public attackPlayer(attackerId: string, defenderId: string): BattleReport {
    const attacker = this.requirePlayer(attackerId);
    const defender = this.requirePlayer(defenderId);
    const report = this.warfare.attackPlayer(
      { id: attackerId, kingdom: attacker.kingdom }, { id: defenderId, kingdom: defender.kingdom },
      { year: this.currentYear, month: this.currentMonth },
      { attacker: this.getCommanderModifiers(attackerId), defender: this.getCommanderModifiers(defenderId) }
    );
    this.emit('battleResolved', { report });
    return report;
  }

  private getCommanderModifiers(playerId: string): PowerModifiers {
    const character = this.getCurrentCharacter(playerId);
    if (!character) return {};
    const military = character.profession === 'soldier' || character.profession === 'noble';
    const skill = (character.skills.leadership + character.skills.combat) / 200;
    return { commanderBonus: Math.round(skill * (military ? 0.2 : 0.1) * 100) / 100 };
  }

  // === Character role switching (v3.0) ===

  /**
   * Character currently played by a player.
   * @param playerId Player.
   * @returns Living citizen or null.
   */
  /** Citizen administrators are entirely optional; no external AI service is required. */
  public getCourtAssistants(playerId: string) {
    this.requirePlayer(playerId);
    return this.courtAssistants.list(playerId).map((a) => ({
      ...a, citizen: this.citizenSystem.getCitizen(a.citizenId) ?? null
    }));
  }

  public getCourtCandidates(playerId: string): Citizen[] {
    this.requirePlayer(playerId);
    const assigned = new Set(this.courtAssistants.serialize().map((a) => a.citizenId));
    return this.citizenSystem.getAliveCitizens()
      .filter((c) => !c.isPlayerCharacter && !assigned.has(c.id))
      .sort((a, b) => b.skills.leadership + b.skills.literacy - a.skills.leadership - a.skills.literacy)
      .slice(0, 15);
  }

  public appointCourtAssistant(playerId: string, office: CourtOffice, citizenId: string): void {
    this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    const candidate = this.getCourtCandidates(playerId).find((c) => c.id === citizenId);
    if (!candidate) throw new Error('Dieser Bürger ist nicht verfügbar.');
    this.courtAssistants.appoint(playerId, office, citizenId);
    this.emit('courtEvent', { playerId, message: candidate.firstName + ' wurde zum Hofamt ernannt.' });
  }

  public setCourtAssistantMode(playerId: string, office: CourtOffice, mode: AssistantMode): void {
    this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    this.courtAssistants.setMode(playerId, office, mode);
  }

  public dismissCourtAssistant(playerId: string, office: CourtOffice): void {
    this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    this.courtAssistants.dismiss(playerId, office);
  }

  private processCourtAssistants(player: Player): void {
    for (const assistant of this.courtAssistants.list(player.id)) {
      const citizen = this.citizenSystem.getCitizen(assistant.citizenId);
      if (!citizen || !citizen.isAlive || citizen.isPlayerCharacter) {
        this.courtAssistants.dismiss(player.id, assistant.office);
        continue;
      }
      const skill = COURT_OFFICES[assistant.office].skill;
      citizen.skills[skill] = Math.min(100, citizen.skills[skill] + 1);
      this.courtAssistants.advance(player.id, assistant.office);
      if (assistant.mode !== 'automatisch') continue;
      if (assistant.office === 'wirtschaft') {
        // A cautious, capped purchase when the treasury is secure.
        const food = player.kingdom.resources.food;
        if (food < 600 && player.kingdom.resources.gold > 1200) {
          const amount = Math.min(100, 600 - food);
          if (this.tradeForPlayer(player.id, 'food', amount, 'buy'))
            this.emit('courtEvent', { playerId: player.id, message: 'Der Kämmerer beschaffte ' + amount + ' Nahrung.' });
        }
      } else if (assistant.office === 'forschung') {
        if (!this.requireTechnologySystem(player.id).getCurrentResearch()) {
          const options = this.getTechnologyOptions(player.id).filter((o) =>
            o.canStart && o.technology.cost.gold <= player.kingdom.resources.gold * 0.2);
          if (options.length) {
            const tech = options.sort((a,b) => a.technology.cost.research - b.technology.cost.research)[0].technology;
            this.startResearch(player.id, tech.id);
            this.emit('courtEvent', { playerId: player.id, message: 'Die Hofgelehrte begann: ' + tech.name });
          }
        }
      }
      // Marshals advise and train, but never attack or spend military resources automatically.
    }
  }

  public getCurrentCharacter(playerId: string): Citizen | null {
    const character = this.roleSwitchingSystem.getCurrentCharacter(playerId,
      (id: string) => this.citizenSystem.getCitizen(id));
    return character && character.isAlive ? character : null;
  }

  /**
   * Living characters a player can switch to, most influential first.
   * @param limit Maximum number of characters.
   * @returns Candidate citizens not controlled by any player.
   */
  public getPlayableCharacters(limit: number = 12): Citizen[] {
    const pool = this.citizenSystem.getAliveCitizens()
      .filter((citizen: Citizen): boolean => !citizen.isPlayerCharacter);
    const classes: Citizen['socialClass'][] = ['royal', 'noble', 'middle', 'peasant'];
    const groups = classes.map(socialClass => pool
      .filter(citizen => citizen.socialClass === socialClass)
      .sort((a, b) => b.reputation - a.reputation || a.age - b.age));
    const selected: Citizen[] = [];
    // Cycle through social classes so ordinary citizens remain visible even
    // when a save contains many more nobles than peasants.
    while (selected.length < Math.max(0, limit) && groups.some(group => group.length > 0)) {
      for (const group of groups) {
        const candidate = group.shift();
        if (candidate) selected.push(candidate);
        if (selected.length >= limit) break;
      }
    }
    return selected;
  }

  /**
   * Switches the played character; the previous one returns to AI control.
   * @param playerId Player.
   * @param citizenId New character.
   * @returns The new character.
   * @throws Error if the character is dead or controlled by another player.
   */
  public switchCharacter(playerId: string, citizenId: string): Citizen {
    this.requirePlayer(playerId);
    const citizen = this.citizenSystem.getCitizen(citizenId);
    if (!citizen || !citizen.isAlive) throw new Error('Dieser Charakter lebt nicht mehr.');
    if (citizen.isPlayerCharacter && citizen.controlledByPlayerId !== playerId) {
      throw new Error('Dieser Charakter wird bereits von einem anderen Spieler gespielt.');
    }
    if (!this.roleSwitchingSystem.getSession(playerId)) this.roleSwitchingSystem.createSession(playerId);
    const switched = this.roleSwitchingSystem.switchRole(playerId, citizenId,
      (id: string) => this.citizenSystem.getCitizen(id),
      (id: string, updates: Partial<Citizen>) => this.citizenSystem.updateCitizen(id, updates),
      this.currentYear, this.currentMonth, 'Spielerwahl');
    if (!switched) throw new Error('Der Rollenwechsel ist fehlgeschlagen.');
    this.emit('characterSwitched', { playerId, citizenId });
    return citizen;
  }

  /**
   * Whether the played character can still act this month.
   * @param playerId Player.
   * @returns True if no action was taken in the current month.
   */
  public canCharacterAct(playerId: string): boolean {
    return this.roleSwitchingSystem.getMetaKnowledge(playerId, 'lastActionMonth') !==
      this.currentYear * 12 + this.currentMonth;
  }

  /**
   * Performs the monthly personal action of the played character.
   * @param playerId Player.
   * @param action Work, study, weapons training or serving the realm.
   * @returns Description of the outcome.
   * @throws Error if no character is played or it already acted this month.
   */
  public performCharacterAction(playerId: string, action: CharacterAction): string {
    const player = this.requirePlayer(playerId);
    const character = this.getCurrentCharacter(playerId);
    if (!character) throw new Error('Du spielst gerade keinen lebenden Charakter. Wähle eine neue Rolle.');
    if (!this.canCharacterAct(playerId)) throw new Error('Dein Charakter hat in diesem Monat bereits gehandelt.');
    const raise = (value: number, amount: number): number => Math.min(100, value + amount);
    let message: string;
    switch (action) {
      case 'work': {
        const earned = Math.max(10, Math.round(character.income || 0)) * 3 + Math.round(character.professionLevel / 2);
        character.wealth += earned;
        character.professionLevel = raise(character.professionLevel, 3);
        message = `${character.firstName} arbeitet hart und verdient ${earned} Gold.`;
        break;
      }
      case 'study':
        character.skills.literacy = raise(character.skills.literacy, 6);
        character.skills.leadership = raise(character.skills.leadership, 2);
        player.kingdom.stats.literacyRate = raise(player.kingdom.stats.literacyRate, 0.3);
        this.requireTechnologySystem(playerId).addResearchPoints(25);
        message = `${character.firstName} studiert alte Schriften. Lesen und Führung verbessern sich.`;
        break;
      case 'train':
        character.skills.combat = raise(character.skills.combat, 6);
        character.skills.leadership = raise(character.skills.leadership, 2);
        player.kingdom.military.trainingLevel = raise(player.kingdom.military.trainingLevel, 1);
        message = `${character.firstName} übt mit der Garnison. Kampfkraft und Heerführung steigen.`;
        break;
      case 'serve': {
        const donation = Math.floor(character.wealth / 2);
        character.wealth -= donation;
        character.reputation = Math.min(100, character.reputation + 5);
        player.kingdom.resources.gold += donation;
        player.updateStats({ prestige: 1 });
        message = `${character.firstName} dient dem Reich und stiftet ${donation} Gold für die Schatzkammer.`;
        break;
      }
      default:
        throw new Error('Unbekannte Charakteraktion.');
    }
    this.roleSwitchingSystem.storeMetaKnowledge(playerId, 'lastActionMonth', this.currentYear * 12 + this.currentMonth);
    this.emit('characterActed', { playerId, action, message });
    return message;
  }

  // === Local hotseat multiplayer (v3.0) ===

  /**
   * Whether several local players share this game (turn-based hotseat).
   * @returns True for more than one player.
   */
  public isHotseat(): boolean {
    return this.players.size > 1;
  }

  /**
   * Player whose turn it currently is.
   * @returns Active player.
   * @throws Error if no player exists.
   */
  public getActivePlayer(): Player {
    const players = this.getPlayers();
    if (!players.length) throw new Error('Kein Spieler vorhanden.');
    return players[this.turnIndex % players.length];
  }

  /**
   * Ends the active player's turn. After the last player the month is simulated for all realms.
   * @returns Whether a month was processed and who acts next.
   * @throws Error if no game is active.
   */
  public async endTurn(): Promise<TurnResult> {
    if (this.gameState !== GameState.RUNNING && this.gameState !== GameState.PAUSED) {
      throw new Error('Kein aktives Spiel vorhanden.');
    }
    if (this.getPendingCouncilDecision(this.getActivePlayer().id)) {
      throw new Error('Entscheide zuerst über die offene Angelegenheit im Reichsrat.');
    }
    const count = this.players.size;
    const next = this.turnIndex + 1;
    let monthAdvanced = false;
    if (next >= count) {
      await this.advanceMonth();
      monthAdvanced = true;
    }
    this.turnIndex = next % count;
    const activePlayer = this.getActivePlayer();
    this.emit('turnChanged', { playerId: activePlayer.id, monthAdvanced });
    return { monthAdvanced, activePlayer };
  }

  private requirePlayer(playerId: string): Player {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden.');
    return player;
  }

  public getPendingCouncilDecision(playerId: string) {
    this.requirePlayer(playerId);
    return this.council.getPending(playerId);
  }

  public getCouncilChoices(playerId: string) {
    return this.council.getChoices(this.requirePlayer(playerId));
  }

  public getCouncilHistory(playerId: string) {
    this.requirePlayer(playerId);
    return this.council.getHistory(playerId);
  }

  /** Personal choice is based on the assigned person's abilities, not a generic advisor. */
  public chooseCouncilOptionForCitizen(playerId: string, citizenId: string): string {
    this.requirePlayer(playerId);
    const decision = this.getPendingCouncilDecision(playerId);
    if (!decision) throw new Error('Keine offene Ratsentscheidung.');
    const citizen = this.citizenSystem.getCitizen(citizenId);
    if (!citizen || !citizen.isAlive || citizen.isPlayerCharacter || citizen.age < 16)
      throw new Error('Dieser Bürger ist nicht verfügbar.');
    return chooseCitizenCouncilOption(citizen, decision, this.getCouncilChoices(playerId));
  }

  /** Delegate one pending council choice to a living, available citizen. */
  public delegateCouncilDecision(playerId: string, citizenId: string, choiceId: string) {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) throw new Error('Nicht am Zug.');
    if (!this.getPendingCouncilDecision(playerId)) throw new Error('Keine offene Ratsentscheidung.');
    const citizen = this.citizenSystem.getCitizen(citizenId);
    if (!citizen || !citizen.isAlive || citizen.isPlayerCharacter) throw new Error('Dieser Bürger ist nicht verfügbar.');
    const name = citizen.firstName + ' ' + citizen.lastName;
    const outcome = this.council.resolve(player, choiceId, this.currentYear, this.currentMonth,
      { id: citizen.id, name });
    // A publicly delegated judgement has a modest, persistent personal consequence.
    citizen.reputation = Math.max(-100, Math.min(100,
      (citizen.reputation ?? 50) + (outcome.success ? 2 : -3)));
    citizen.skills.leadership = Math.min(100, Math.max(0, citizen.skills.leadership + 1));
    citizen.lifeEvents ??= [];
    citizen.lifeEvents.push({ year: this.currentYear, month: this.currentMonth, type: 'achievement',
      description: 'Ratsentscheidung: ' + outcome.message });
    if (citizen.lifeEvents.length > 100) citizen.lifeEvents.splice(1, citizen.lifeEvents.length - 100);
    this.emit('councilResolved', { playerId, outcome });
    this.markTutorialStep(playerId, 'council');
    return outcome;
  }

  /** Use the last surviving delegate of this recurring event, if available. */
  public getPreferredCouncilDelegate(playerId: string): Citizen | null {
    const pending = this.getPendingCouncilDecision(playerId);
    if (!pending) return null;
    const previous = [...this.getCouncilHistory(playerId)]
      .find(entry => entry.decisionId === pending.id && entry.delegatedCitizenId);
    if (!previous?.delegatedCitizenId) return null;
    const candidate = this.citizenSystem.getCitizen(previous.delegatedCitizenId);
    return candidate?.isAlive && !candidate.isPlayerCharacter ? candidate : null;
  }

  /** All living adult delegates; a remembered delegate must not be hidden by ranking. */
  public getEligibleCouncilDelegates(playerId: string): Citizen[] {
    this.requirePlayer(playerId);
    return this.citizenSystem.getAliveCitizens().filter(c => !c.isPlayerCharacter && c.age >= 16);
  }

  public getCouncilDelegates(playerId: string): Citizen[] {
    this.requirePlayer(playerId);
    return this.getEligibleCouncilDelegates(playerId)
      .filter(citizen => !citizen.isPlayerCharacter)
      .sort((a,b) => (b.skills.leadership + b.skills.literacy) - (a.skills.leadership + a.skills.literacy))
      .slice(0, 20);
  }

  public resolveCouncilDecision(playerId: string, choiceId: string) {
    const player = this.requirePlayer(playerId);
    if (this.isHotseat() && this.getActivePlayer().id !== playerId) {
      throw new Error('Nur der aktive Herrscher kann den Rat entscheiden.');
    }
    const outcome = this.council.resolve(player, choiceId, this.currentYear, this.currentMonth);
    this.emit('councilResolved', { playerId, outcome });
    this.markTutorialStep(playerId, 'council');
    return outcome;
  }

  public async listSaves(): Promise<SaveMeta[]> {
    const index: SaveMeta[] = (await localforage.getItem('kaiser-ii-saves-index')) || [];
    return index.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  public async deleteSave(slot: string): Promise<void> {
    await localforage.removeItem(`kaiser-ii-save-${slot}`);
    
    const index: SaveMeta[] = (await localforage.getItem('kaiser-ii-saves-index')) || [];
    const filteredIndex = index.filter(item => item.slot !== slot);
    
    await localforage.setItem('kaiser-ii-saves-index', filteredIndex);
  }

  // === New System Accessors ===

  /**
   * Get the policy system
   */
  public getPolicySystem(): PolicySystem {
    return this.policySystem;
  }

  /**
   * Get the Ollama service (if enabled)
   */
  public getOllamaService(): OllamaService | undefined {
    return this.ollamaService;
  }

  /**
   * Get the multiplayer system (if enabled)
   */
  public getMultiplayerSystem(): MultiplayerSystem | undefined {
    return this.multiplayerSystem;
  }

  /**
   * Get the wiki integration (if enabled)
   */
  public getWikiIntegration(): WikiIntegration | undefined {
    return this.wikiIntegration;
  }

  /**
   * Enable Ollama service at runtime
   */
  public enableOllama(config?: { baseUrl?: string; model?: string }): void {
    if (!this.ollamaService) {
      this.ollamaService = new OllamaService(config);
      this.config.enableOllama = true;
    }
  }

  /**
   * Enable multiplayer at runtime
   */
  public enableMultiplayer(): void {
    if (!this.multiplayerSystem) {
      this.multiplayerSystem = new MultiplayerSystem();
      this.config.enableMultiplayer = true;
    }
  }

  /**
   * Get current month
   */
  public getCurrentMonth(): number {
    return this.currentMonth;
  }
  
  /**
   * Get the citizen system
   */
  public getCitizenSystem(): CitizenSystem {
    return this.citizenSystem;
  }
  
  /**
   * Get the demographic system
   */
  public getDemographicSystem(): DemographicSystem {
    return this.demographicSystem;
  }
  
  /**
   * Get the social network system
   */
  public getSocialNetworkSystem(): SocialNetworkSystem {
    return this.socialNetworkSystem;
  }
  
  /**
   * Get the climate system (v2.2.3)
   */
  public getClimateSystem(): ClimateSystem {
    return this.climateSystem;
  }
  
  /**
   * Get the landscape system (v2.2.3)
   */
  public getLandscapeSystem(): LandscapeSystem {
    return this.landscapeSystem;
  }
  
  /**
   * Get the animal population system (v2.2.3)
   */
  public getAnimalPopulationSystem(): AnimalPopulationSystem {
    return this.animalPopulationSystem;
  }
  
  /**
   * Get the historical figures system (v2.3+)
   */
  public getHistoricalFiguresSystem(): HistoricalFiguresSystem {
    return this.historicalFiguresSystem;
  }
  
  /**
   * Get the disease system (v2.3+)
   */
  public getDiseaseSystem(): DiseaseSystem {
    return this.diseaseSystem;
  }
  
  /**
   * Get the natural disaster system (v2.3+)
   */
  public getNaturalDisasterSystem(): NaturalDisasterSystem {
    return this.naturalDisasterSystem;
  }
  
  /**
   * Get the battle system (v2.3+)
   */
  public getBattleSystem(): BattleSystem {
    return this.battleSystem;
  }
  
  /**
   * Get the transport system (v2.3+)
   */
  public getTransportSystem(): TransportSystem {
    return this.transportSystem;
  }
  
  /**
   * Get the naval system (v2.3.5)
   */
  public getNavalSystem(): NavalSystem {
    return this.navalSystem;
  }
  
  /**
   * Get the art system (v2.3+)
   */
  public getArtSystem(): ArtSystem {
    return this.artSystem;
  }
  
  /**
   * Get the scientific discovery system (v2.3+)
   */
  public getScientificDiscoverySystem(): ScientificDiscoverySystem {
    return this.scientificDiscoverySystem;
  }
  
  /**
   * Get the legal system (v2.3+)
   */
  public getLegalSystem(): LegalSystem {
    return this.legalSystem;
  }
  
  /**
   * Get the military unit system (v2.3+)
   */
  public getMilitaryUnitSystem(): MilitaryUnitSystem {
    return this.militaryUnitSystem;
  }
  
  /**
   * Get newly integrated systems (v2.4+)
   */
  public getReligionSystem(): ReligionSystem {
    return this.religionSystem;
  }
  
  public getMigrationSystem(): MigrationSystem {
    return this.migrationSystem;
  }
  
  public getSocialMobilitySystem(): SocialMobilitySystem {
    return this.socialMobilitySystem;
  }
  
  public getFamineSystem(): FamineSystem {
    return this.famineSystem;
  }
  
  public getEconomicCohortSystem(): EconomicCohortSystem {
    return this.economicCohortSystem;
  }
  
  public getBattleTerrainWeatherSystem(): BattleTerrainWeatherSystem {
    return this.battleTerrainWeatherSystem;
  }
  
  public getUnitFormationSystem(): UnitFormationSystem {
    return this.unitFormationSystem;
  }
  
  public getSupplyLogisticsSystem(): SupplyLogisticsSystem {
    return this.supplyLogisticsSystem;
  }
  
  public getSiegeWarfareSystem(): SiegeWarfareSystem {
    return this.siegeWarfareSystem;
  }
  
  public getEspionageSystem(): EspionageSystem {
    return this.espionageSystem;
  }
  
  public getUrbanDistrictsSystem(): UrbanDistrictsSystem {
    return this.urbanDistrictsSystem;
  }
  
  public getDayNightCycleSystem(): DayNightCycleSystem {
    return this.dayNightCycleSystem;
  }
  
  public getArtsAndCultureSystem(): ArtsAndCultureSystem {
    return this.artsAndCultureSystem;
  }
  
  public getHistoricalEventSystem(): HistoricalEventSystem {
    return this.historicalEventSystem;
  }
  
  public getInformationSpreadSystem(): InformationSpreadSystem {
    return this.informationSpreadSystem;
  }
  
  public getLegalAndCourtSystem(): LegalAndCourtSystem {
    return this.legalAndCourtSystem;
  }
  
  /**
   * Get Roadmap Features Manager (v2.5.0)
   * @returns RoadmapFeaturesManager instance with 20 new features
   */
  public getRoadmapFeaturesManager(): RoadmapFeaturesManager {
    return this.roadmapFeaturesManager;
  }
  
  /**
   * Get Prisoner of War System (v2.5.1)
   * Manages capture, treatment, and exchange of prisoners of war
   */
  public getPrisonerOfWarSystem(): PrisonerOfWarSystem {
    return this.prisonerOfWarSystem;
  }
  
  /**
   * Get War Financing System (v2.3.6)
   * Manages war financing methods, war bonds, loans, and debt repayment
   */
  public getWarFinancingSystem(): WarFinancingSystem {
    return this.warFinancingSystem;
  }
  
  /**
   * Get AI Controller Manager (v2.6.0)
   * Manages AI for non-player characters
   */
  public getAIControllerManager(): AIControllerManager {
    return this.aiControllerManager;
  }
  
  /**
   * Get Role Switching System (v2.6.0)
   * Enables seamless switching between different characters
   */
  public getRoleSwitchingSystem(): RoleSwitchingSystem {
    return this.roleSwitchingSystem;
  }
  
  /**
   * Get Time System (v2.6.0)
   * Manages game time with three speed modes
   */
  public getTimeSystem(): TimeSystem {
    return this.timeSystem;
  }
  
  /**
   * Get Dynamic Game View (v2.6.0)
   * Provides context-aware visualization based on current character role
   */
  public getDynamicGameView(): DynamicGameView {
    return this.dynamicGameView;
  }
  
  // ===== Trade Routes Management API (v2.6.0) =====
  
  /**
   * Get available trade routes for a player based on current year and technologies
   * @param player The player
   * @returns Array of available trade routes
   */
  public getAvailableTradeRoutes(player: Player) {
    const technologies = this.requireTechnologySystem(player.id).getResearchedTechnologyIds();
    return this.transportSystem.getAvailableRoutes(this.currentYear, technologies);
  }
  
  /**
   * Activate a trade route for a player
   * @param player The player
   * @param routeId ID of the route to activate
   * @returns Success message or error
   */
  public activateTradeRoute(player: Player, routeId: string): { success: boolean; message: string } {
    const route = this.transportSystem.getTradeRoute(routeId);
    
    if (!route) {
      return { success: false, message: 'Handelsroute nicht gefunden' };
    }
    
    // Check if route is available based on year and technology
    if (route.period.start > this.currentYear) {
      return { success: false, message: 'Diese Route ist noch nicht verfügbar' };
    }
    
    if (route.period.end && route.period.end < this.currentYear) {
      return { success: false, message: 'Diese Route ist nicht mehr verfügbar' };
    }
    
    if (route.requiredTechnology &&
        !this.requireTechnologySystem(player.id).isResearched(route.requiredTechnology)) {
      const required = TechnologySystem.getTechnology(route.requiredTechnology);
      return {
        success: false,
        message: `Erfordert Technologie: ${required?.name ?? route.requiredTechnology}`
      };
    }
    
    // Check infrastructure requirements (e.g., ports for sea routes)
    if (route.id.includes('sea') || route.id.includes('naval') || route.id === 'hanseatic_routes' || route.id === 'baltic_trade') {
      if (player.kingdom.infrastructure.ports < 1) {
        return { success: false, message: 'Erfordert mindestens einen Hafen' };
      }
    }
    
    // Check if already active
    if (player.kingdom.isTradeRouteActive(routeId)) {
      return { success: false, message: 'Route ist bereits aktiv' };
    }
    
    // Activation cost (based on route length and danger)
    const activationCost = Math.floor(route.length * 10 + route.danger * 100);
    if (player.kingdom.resources.gold < activationCost) {
      return { success: false, message: `Erfordert ${activationCost} Gold` };
    }
    
    // Activate route
    player.kingdom.resources.gold -= activationCost;
    player.kingdom.activateTradeRoute(routeId);
    this.transportSystem.activateRoute(routeId);
    
    return { 
      success: true, 
      message: `Handelsroute ${route.name} aktiviert! Einkommen: +${route.effects.trade_income} Gold/Jahr` 
    };
  }
  
  /**
   * Deactivate a trade route for a player
   * @param player The player
   * @param routeId ID of the route to deactivate
   */
  public deactivateTradeRoute(player: Player, routeId: string): { success: boolean; message: string } {
    if (!player.kingdom.isTradeRouteActive(routeId)) {
      return { success: false, message: 'Route ist nicht aktiv' };
    }
    
    player.kingdom.deactivateTradeRoute(routeId);
    this.transportSystem.deactivateRoute(routeId);
    
    return { success: true, message: 'Handelsroute deaktiviert' };
  }
  
  /**
   * Get transport types available for a player
   * @param player The player
   * @returns Array of available transport types
   */
  public getAvailableTransportTypes(player: Player) {
    const technologies = this.requireTechnologySystem(player.id).getResearchedTechnologyIds();
    return this.transportSystem.getAvailableTransport(this.currentYear, technologies);
  }
  
  /**
   * Get detailed stats about a player's trade network
   * @param player The player
   */
  public getTradeNetworkStats(player: Player) {
    const activeRoutes = player.kingdom.getActiveTradeRoutes();
    const routes = activeRoutes.map(id => this.transportSystem.getTradeRoute(id)).filter(r => r);
    
    return {
      activeRoutes: routes.length,
      routes: routes,
      monthlyIncome: Math.floor(player.kingdom.calculateTradeRouteIncome(this.transportSystem) / 12),
      yearlyIncome: player.kingdom.calculateTradeRouteIncome(this.transportSystem),
      culturalInfluence: player.kingdom.calculateTradeRouteCulturalInfluence(this.transportSystem),
      prestigeBonus: player.kingdom.calculateTradeRoutePrestige(this.transportSystem),
      availableTransportTypes: player.kingdom.getAvailableTransportTypes()
    };
  }
  
  /**
   * Get population statistics
   */
  public getPopulationStats() {
    return {
      total: this.citizenSystem.getPopulation(),
      demographics: this.demographicSystem.calculateStatistics(this.citizenSystem),
      agePyramid: this.demographicSystem.calculateAgePyramid(this.citizenSystem),
      activeDiseases: this.demographicSystem.getActiveDiseases(),
      activeFamines: this.demographicSystem.getActiveFamines(),
      activeMovements: this.socialNetworkSystem.getActiveMovements()
    };
  }
  
  /**
   * Get ecological statistics (v2.2.3)
   */
  public getEcologicalStats() {
    return {
      climate: {
        currentSeason: this.climateSystem.getCurrentSeason(),
        currentWeather: this.climateSystem.getCurrentWeather(),
        climateChange: this.climateSystem.getClimateChange(),
        activeDisasters: this.climateSystem.getActiveDisasters(),
        resourceStates: this.climateSystem.getAllResourceStates()
      },
      landscape: {
        forests: this.landscapeSystem.getForests(),
        rivers: this.landscapeSystem.getRivers(),
        landUse: this.landscapeSystem.getLandUse(),
        recentChanges: this.landscapeSystem.getRecentChanges(10),
        activeProjects: this.landscapeSystem.getActiveProjects(),
        averageSoilQuality: this.landscapeSystem.getAverageSoilQuality()
      },
      animals: {
        wildlife: this.animalPopulationSystem.getWildlifeSpecies(),
        livestock: this.animalPopulationSystem.getLivestockSpecies(),
        endangered: this.animalPopulationSystem.getEndangeredSpecies(),
        extinct: this.animalPopulationSystem.getExtinctSpecies(),
        activeMigrations: this.animalPopulationSystem.getActiveMigrations(),
        totalWildlife: this.animalPopulationSystem.getTotalWildlifePopulation(),
        totalLivestock: this.animalPopulationSystem.getTotalLivestockPopulation()
      }
    };
  }
  
  /**
   * Get statistics for newly integrated systems (v2.4+)
   * Note: Returns basic info - systems are accessible via individual getters for detailed operations
   */
  public getIntegratedSystemsStats() {
    return {
      // Note: Diplomacy is per-player and accessible via player.kingdom methods
      religion: {
        dominantReligion: this.religionSystem.getDominantReligion(),
        allReligions: this.religionSystem.getAllReligions()
      },
      migration: {
        stats: this.migrationSystem.getMigrationStats()
      },
      socialMobility: {
        stats: this.socialMobilitySystem.getMobilityStats()
      },
      famine: {
        activeFamines: this.famineSystem.getActiveFamines()
      },
      urbanDistricts: {
        districts: this.urbanDistrictsSystem.getDistricts()
      },
      dayNight: {
        currentTime: this.dayNightCycleSystem.getCurrentTime()
      },
      artsAndCulture: {
        culturalCircles: this.artsAndCultureSystem.getCulturalCircles()
      },
      espionage: {
        // Espionage data available via getEspionageSystem()
        systemReady: true
      },
      military: {
        activeSieges: this.siegeWarfareSystem.getActiveSieges(),
        // Other military data available via individual system getters
        systemsReady: true
      },
      legal: {
        // Legal system data available via getLegalAndCourtSystem()
        systemReady: true
      },
      information: {
        // Information data available via getInformationSpreadSystem()
        systemReady: true
      },
      economy: {
        cohorts: this.economicCohortSystem.getCohorts()
      }
    };
  }
  
  /**
   * Process career changes and social mobility (v2.1.5)
   */
  private processCareerChanges(): void {
    const population = this.citizenSystem.getPopulation();
    if (population === 0) return;
    
    // Get profession distribution and average stats
    const professionDistribution = this.citizenSystem.getProfessionDistribution();
    const avgStats = this.citizenSystem.getAverageStats();
    
    // Calculate social stability based on player kingdoms
    let avgSocialStability = 50;
    if (this.players.size > 0) {
      let totalStability = 0;
      for (const player of this.players.values()) {
        // Use happiness as a proxy for social stability
        totalStability += player.kingdom.happiness;
      }
      avgSocialStability = totalStability / this.players.size;
    }
    
    // Process aggregate career changes
    const changes = this.socialMobilitySystem.processCareerChanges(
      population,
      professionDistribution,
      avgStats.education,
      avgStats.wealth,
      avgStats.connections,
      avgStats.age,
      avgSocialStability,
      0.05 // 5% of population attempts career change per year
    );
    
    // Apply the career changes to actual citizens
    for (const change of changes.values()) {
      if (change.count === 0) continue;
      
      // Find citizens with the 'from' profession and change some of them
      const candidates = this.citizenSystem.getAllCitizens()
        .filter(c => c.isAlive && c.profession === change.from && !c.isPlayerCharacter);
      
      // Randomly select citizens to change careers
      const shuffled = candidates.sort(() => Math.random() - 0.5);
      const toChange = shuffled.slice(0, Math.min(change.count, shuffled.length));
      
      for (const citizen of toChange) {
        this.citizenSystem.changeProfession(
          citizen.id,
          change.to as any,
          this.currentYear,
          this.currentMonth,
          'Karrierewechsel durch soziale Mobilität'
        );
      }
    }
  }
  
  /**
   * Process yearly ecological updates
   */
  private processEcologicalYear(): void {
    const totalPopulation = this.citizenSystem.getPopulation();
    const avgIndustrialization = this.getAverageIndustrialization();
    const climateData = this.climateSystem.getClimateChange();
    const totalForestArea = this.landscapeSystem.getTotalForestArea();
    
    // Update landscape
    this.landscapeSystem.updateYear(
      this.currentYear,
      totalPopulation,
      avgIndustrialization,
      climateData.globalTemperature
    );
    
    // Update animal populations
    const avgRiver = this.landscapeSystem.getRivers()[0];
    const waterPollution = avgRiver ? avgRiver.pollution : 20;
    const huntingPressure = this.getHuntingPressure();
    
    this.animalPopulationSystem.updateYear(
      this.currentYear,
      totalForestArea,
      waterPollution,
      huntingPressure,
      climateData.globalTemperature
    );
    
    // Apply ecological effects to players
    this.applyEcologicalEffects();
  }
  
  /**
   * Get average industrialization level across all players
   */
  private getAverageIndustrialization(): number {
    if (this.players.size === 0) return 0;
    
    let total = 0;
    for (const player of this.players.values()) {
      // Estimate industrialization from infrastructure
      const kingdom = player.kingdom;
      const industrial = 
        (kingdom.infrastructure.workshops || 0) * 10 +
        (kingdom.infrastructure.mines || 0) * 5 +
        (kingdom.infrastructure.roads || 0) * 2;
      total += Math.min(100, industrial);
    }
    
    return total / this.players.size;
  }
  
  /**
   * Get hunting pressure across all players
   */
  private getHuntingPressure(): number {
    // Base pressure from population
    const totalPop = this.citizenSystem.getPopulation();
    return Math.min(100, totalPop / 1000);
  }
  
  // Migration processing constants
  private static readonly MIGRATION_CONSTANTS = {
    DEFAULT_EMPLOYMENT: 70 as number,
    DEFAULT_WAGES: 50 as number,
    DEFAULT_SAFETY: 80 as number,
    DEFAULT_INFRASTRUCTURE: 50 as number,
    DEFAULT_FOOD: 70 as number,
    DEFAULT_DISEASE: 10 as number,
    MIN_DISTANCE: 300 as number,
    MAX_DISTANCE_VARIANCE: 400 as number,
    BASE_CULTURAL_SIMILARITY: 0.5 as number,
    CULTURAL_VARIANCE: 0.3 as number
  };
  
  /**
   * Process migrations between regions (v2.1.5)
   * Calculates region attractiveness and moves citizens accordingly
   */
  private processMigrations(): void {
    // Get all active regions
    const activeRegions = this.getActiveRegions();
    if (activeRegions.length < 2) return; // Need at least 2 regions for migration
    
    // Calculate attractiveness for each region
    const attractivenessMap = new Map<string, { 
      attractiveness: number;
      data: any;
    }>();
    
    for (const regionId of activeRegions) {
      // Get region data from players (aggregate across all players)
      let employment = GameEngine.MIGRATION_CONSTANTS.DEFAULT_EMPLOYMENT;
      let wages = GameEngine.MIGRATION_CONSTANTS.DEFAULT_WAGES;
      let safety = GameEngine.MIGRATION_CONSTANTS.DEFAULT_SAFETY;
      let infrastructure = GameEngine.MIGRATION_CONSTANTS.DEFAULT_INFRASTRUCTURE;
      let food = GameEngine.MIGRATION_CONSTANTS.DEFAULT_FOOD;
      let disease = GameEngine.MIGRATION_CONSTANTS.DEFAULT_DISEASE;
      
      // Calculate based on player kingdoms in this region (simplified)
      for (const player of this.players.values()) {
        // Simplified: use kingdom stats as proxy for region
        const kingdom = player.kingdom;
        employment = kingdom.happiness;
        wages = Math.min(100, kingdom.resources.gold / 100);
        safety = kingdom.military.morale; // Higher morale = safer region
        infrastructure = Math.min(100, (
          (kingdom.infrastructure.roads || 0) +
          (kingdom.infrastructure.markets || 0) +
          (kingdom.infrastructure.farms || 0)
        ) * 5);
        food = Math.min(100, kingdom.resources.food / 10);
      }
      
      const attractiveness = this.migrationSystem.calculateRegionAttractiveness(
        regionId,
        employment,
        wages,
        safety,
        infrastructure,
        food,
        disease
      );
      
      attractivenessMap.set(regionId, { 
        attractiveness: attractiveness.totalScore,
        data: attractiveness
      });
      
      // Update migration desires for citizens in this region
      this.citizenSystem.updateMigrationDesires(regionId, attractiveness.totalScore);
    }
    
    // Process migration flows between regions
    for (const fromRegionId of activeRegions) {
      const fromData = attractivenessMap.get(fromRegionId);
      if (!fromData) continue;
      
      const fromPopulation = this.citizenSystem.getRegionalPopulation(fromRegionId);
      if (fromPopulation === 0) continue;
      
      // Build neighbor regions map
      const neighbors = new Map<string, any>();
      const distances = new Map<string, number>();
      const culturalSimilarities = new Map<string, number>();
      
      for (const toRegionId of activeRegions) {
        if (toRegionId === fromRegionId) continue;
        
        const toData = attractivenessMap.get(toRegionId);
        if (toData) {
          neighbors.set(toRegionId, toData.data);
          // Simplified distance calculation (could be improved with real geography)
          distances.set(toRegionId, 
            GameEngine.MIGRATION_CONSTANTS.MIN_DISTANCE + 
            Math.random() * GameEngine.MIGRATION_CONSTANTS.MAX_DISTANCE_VARIANCE
          );
          // Simplified cultural similarity (could be improved with region traits)
          culturalSimilarities.set(toRegionId, 
            GameEngine.MIGRATION_CONSTANTS.BASE_CULTURAL_SIMILARITY + 
            Math.random() * GameEngine.MIGRATION_CONSTANTS.CULTURAL_VARIANCE
          );
        }
      }
      
      // Calculate migration flows
      const flows = this.migrationSystem.processMigrations(
        fromRegionId,
        fromPopulation,
        fromData.data,
        neighbors,
        distances,
        culturalSimilarities
      );
      
      // Apply migrations
      for (const flow of flows) {
        // Get candidates willing to migrate
        const candidates = this.citizenSystem.getMigrationCandidates(flow.fromRegion, flow.count);
        
        // Migrate each candidate
        for (const citizen of candidates) {
          const success = this.citizenSystem.migrateCitizen(
            citizen.id,
            flow.toRegion,
            this.currentYear,
            this.currentMonth,
            flow.reason.type
          );
          
          if (success) {
            // Apply the migration flow (tracking)
            this.migrationSystem.applyMigrationFlow(flow);
          }
        }
      }
    }
    
    // Cleanup old migration records
    this.migrationSystem.cleanupOldMigrations();
  }
  
  /**
   * Get list of active regions (regions with population or player presence)
   */
  private getActiveRegions(): string[] {
    const regions = new Set<string>();
    
    // Add regions with citizens
    const allCitizens = this.citizenSystem.getAllCitizens();
    for (const citizen of allCitizens) {
      if (citizen.isAlive) {
        regions.add(citizen.regionId);
      }
    }
    
    // Add a few default German regions if none exist
    if (regions.size === 0) {
      regions.add('preussen');
      regions.add('bayern');
      regions.add('sachsen');
      regions.add('hanse');
    }
    
    return Array.from(regions);
  }
  
  /**
   * Apply ecological effects to all players
   */
  private applyEcologicalEffects(): void {
    const seasonalEffects = this.climateSystem.getSeasonalEffects();
    const weatherEffects = this.climateSystem.getWeatherEffects();
    const activeDisasters = this.climateSystem.getActiveDisasters();
    
    for (const player of this.players.values()) {
      const kingdom = player.kingdom;
      
      // Annual winter surveys must not compound a permanent percentage loss every year.
      kingdom.happiness = Math.max(0, Math.min(100,
        kingdom.happiness +
        (seasonalEffects.happinessModifier - 1) * 5 +
        (weatherEffects.happinessModifier - 1) * 5
      ));
      
      // Apply disaster effects
      for (const disaster of activeDisasters) {
        kingdom.resources.gold = Math.max(0, kingdom.resources.gold - disaster.economicDamage);
        kingdom.resources.food = Math.max(0, kingdom.resources.food - disaster.cropDamage);
        kingdom.happiness = Math.max(0, kingdom.happiness - disaster.severity);
        
        // Emit disaster event
        this.emit('naturalDisaster', {
          playerId: player.id,
          disaster: {
            type: disaster.type,
            severity: disaster.severity,
            casualties: disaster.casualties
          }
        });
      }
    }
  }
}
