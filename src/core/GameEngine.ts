// src/core/GameEngine.ts
import { Player, PlayerCreationData } from './Player';
import { EconomySystem } from './Economy';
import { EventSystem } from './Events';
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
import { ReligionSystem } from './ReligionSystem';
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
import localforage from 'localforage';

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
  enableOllama?: boolean;
  ollamaUrl?: string;
  enableWiki?: boolean;
}

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
  // TODO: Reserved for future economy features
  // @ts-expect-error - Unused until economy features are implemented
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

  constructor(config: Partial<GameConfig> = {}) {
    this.config = {
      maxPlayers: 6,
      difficulty: 2,
      gameSpeed: 1,
      enableMultiplayer: false,
      randomEvents: true,
      startingYear: 1200,
      enableOllama: false,
      enableWiki: true,
      ...config
    };

    this.currentYear = this.config.startingYear;
    this.gameState = GameState.LOBBY;
    this._economy = new EconomySystem(this.config);
    this.events = new EventSystem();
    this.policySystem = new PolicySystem();
    this.eventTarget = new EventTarget();
    this.currentMonth = 1;
    this._tickHandle = null as any;
    
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
    
    // Initialize all data asynchronously (fire-and-forget is intentional - 
    // systems will be ready before game starts, as startGame() is user-triggered)
    this.initializeSystems();

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
  private _tickHandle: any;

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
    }
  }

  // Öffentliche Methoden
  public getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  public getPlayerById(id: string): Player | undefined {
    return this.players.get(id);
  }

  public getCurrentYear(): number {
    return this.currentYear;
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public async startGame(): Promise<void> {
    if (this.players.size === 0) {
      throw new Error('Mindestens ein Spieler benötigt');
    }

    this.gameState = GameState.RUNNING;
    this.emit('gameStateChanged', { state: this.gameState });

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
    // Get first player
    const players = Array.from(this.players.values());
    if (players.length === 0) return;
    
    const player = players[0];
    const playerId = player.id;
    
    console.log('🎮 Initializing Life Simulation for player:', playerId);
    
    // 1. Create player session for role switching
    this.roleSwitchingSystem.createSession(playerId);
    console.log('✅ Player session created');
    
    // 2. Generate initial citizens if none exist
    const existingCitizens = this.citizenSystem.getAllCitizens();
    if (existingCitizens.length === 0) {
      this.generateInitialCitizens();
      console.log('✅ Initial citizens generated');
    }
    
    // 3. Assign first living citizen to player
    const allCitizens = this.citizenSystem.getAllCitizens().filter(c => c.isAlive);
    if (allCitizens.length > 0) {
      // Find an interesting starting character (noble or merchant preferred)
      const preferredCitizen = allCitizens.find(c => 
        c.socialClass === 'noble' || c.socialClass === 'middle'
      ) || allCitizens[0];
      
      const success = this.roleSwitchingSystem.switchRole(
        playerId,
        preferredCitizen.id,
        (id) => this.citizenSystem.getCitizen(id),
        (id, updates) => this.citizenSystem.updateCitizen(id, updates),
        this.currentYear,
        this.currentMonth,
        'Spielstart - Erster Charakter'
      );
      
      if (success) {
        console.log(`✅ Erster Charakter zugewiesen: ${preferredCitizen.firstName} ${preferredCitizen.lastName} (${preferredCitizen.profession})`);
      } else {
        console.error('❌ Fehler beim Zuweisen des ersten Charakters');
      }
    } else {
      console.warn('⚠️ Keine lebenden Bürger verfügbar');
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
    // Clear existing
    if (this._tickHandle) clearInterval(this._tickHandle);

    const msPerMonth = Math.max(200, Math.floor(1000 / (this.config.gameSpeed || 1))); // default 1s per month
    this._tickHandle = setInterval(() => this.monthlyTick(), msPerMonth);
  }

  public pauseGame(): void {
    if (this.gameState === GameState.RUNNING) {
      this.gameState = GameState.PAUSED;
      if (this._tickHandle) { clearInterval(this._tickHandle); this._tickHandle = null; }
      this.emit('gameStateChanged', { state: this.gameState });
    }
  }

  public resumeGame(): void {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.RUNNING;
      this.emit('gameStateChanged', { state: this.gameState });
      this.startAutoTick();
    }
  }

  private async monthlyTick(): Promise<void> {
    if (this.gameState !== GameState.RUNNING) return;

    // Update ecological systems
    const avgIndustrialization = this.getAverageIndustrialization();
    this.climateSystem.updateMonth(this.currentYear, this.currentMonth, avgIndustrialization);

    // process each player's month
    for (const player of this.players.values()) {
      await this.processPlayerMonth(player);
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
    
    // Process AI controllers for all non-player characters (v2.6.0)
    this.aiControllerManager.updateAll(
      (id) => this.citizenSystem.getCitizen(id),
      this.currentYear,
      this.currentMonth
    );
    
    // Update time system (v2.6.0)
    this.timeSystem.update(16); // ~60 FPS update rate
    
    // Note: Many newly integrated systems don't have processMonth() methods yet
    // They are available via accessor methods for UI and manual triggering

    // advance month/year
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
      this.checkForPromotions();
      
      // Yearly processes for population
      this.socialNetworkSystem.generateSocialRelations(this.citizenSystem, this.currentYear);
      
      // Process career changes and social mobility (v2.1.5)
      this.processCareerChanges();
      
      // Yearly processes for ecological systems
      this.processEcologicalYear();
      
      this.emit('yearAdvanced', { year: this.currentYear });
    }

    this.emit('monthAdvanced', { month: this.currentMonth, year: this.currentYear });
  }

  private async processPlayerMonth(player: Player): Promise<void> {
    try {
      player.kingdom.processMonth();
    } catch (err) {
      console.warn('kingdom.processMonth failed for', player.id, err);
    }

    // Apply monthly policy effects
    this.policySystem.applyMonthlyEffects(player);

    // Apply trade route benefits (v2.6.0)
    this.applyTradeRouteBenefits(player);

    // small monthly stat adjustments
    this.updatePlayerStats(player);

    // monthly random events
    if (this.config.randomEvents && Math.random() < 0.05) {
      const event = await this.events.getRandomEvent(player, this.currentYear);
      if (event) await this.events.applyEvent(event, player, `${this.currentYear}-${this.currentMonth}`);
    }
    
    // Note: Newly integrated systems are available for manual access via getters
    // but don't have automatic monthly processing yet
  }

  public async nextYear(): Promise<void> {
    if (this.gameState !== GameState.RUNNING) {
      throw new Error('Spiel ist nicht aktiv');
    }

    for (const player of this.players.values()) {
      await this.processPlayerYear(player);
    }

    this.currentYear++;
    
    // Update roadmap features manager (v2.5.0)
    this.roadmapFeaturesManager.update(this.currentYear, 1.0);
    
    this.checkForPromotions();
    this.emit('yearAdvanced', { year: this.currentYear });
  }

  public addPlayer(data: PlayerCreationData): Player {
    if (this.players.size >= this.config.maxPlayers) {
      throw new Error(`Maximale Spieleranzahl (${this.config.maxPlayers}) erreicht`);
    }

    const player = new Player(data);
    this.players.set(player.id, player);
    this.emit('playerAdded', { player: player.serialize() });

    return player;
  }

  public removePlayer(playerId: string): boolean {
    const existed = this.players.delete(playerId);
    if (existed) {
      this.emit('playerRemoved', { playerId });
    }
    return existed;
  }

  public setTaxRate(playerId: string, rate: number): void {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');

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
        success = false;
        break;
    }

    if (success) {
      this.emit('buildingConstructed', { playerId, building: type });
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
  public on(eventName: string, listener: (detail: any) => void): void {
    this.eventTarget.addEventListener(eventName, (event: Event) => {
      const customEvent = event as CustomEvent;
      listener(customEvent.detail);
    });
  }

  private emit(eventName: string, detail: any): void {
    this.eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // Private Hilfsmethoden
  private async processPlayerYear(player: Player): Promise<void> {
    // Führe das Jahres-Update für das Königreich und den Spieler aus
    try {
      player.kingdom.processYear();
    } catch (err) {
      console.warn('kingdom.processYear failed for', player.id, err);
    }

    try {
      player.processYear();
    } catch (err) {
      console.warn('player.processYear failed for', player.id, err);
    }

    // Apply yearly policy effects
    this.policySystem.applyYearlyEffects(player);

    // Zufallsereignisse
    if (this.config.randomEvents) {
      const event = await this.events.getRandomEvent(player, this.currentYear);
      if (event) {
        await this.events.applyEvent(event, player, this.currentYear.toString());
      }
    }

    // Spielerstatistiken aktualisieren
    this.updatePlayerStats(player);
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
        prestige: player.stats.prestige + prestigeBoost
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
      popularity: player.stats.popularity + popularityChange,
      prestige: player.stats.prestige + prestigeChange
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
  public async saveGame(slot: string = 'default'): Promise<void> {
    const saveData = {
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
      savedAt: new Date().toISOString()
    };

    await localforage.setItem(`kaiser-ii-save-${slot}`, saveData);
    
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
  }

  public async loadGame(slot: string = 'default'): Promise<void> {
    const saveData = await localforage.getItem<any>(`kaiser-ii-save-${slot}`);
    
    if (!saveData) {
      throw new Error(`Spielstand "${slot}" nicht gefunden`);
    }

    this.players.clear();
    
    for (const playerData of saveData.players) {
      const player = Player.deserialize(playerData);
      this.players.set(player.id, player);
    }
    
    this.currentYear = saveData.currentYear;
    this.currentMonth = saveData.currentMonth || 1;
    this.gameState = saveData.gameState;
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
    
    this.emit('gameLoaded', { slot });
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
  public getAvailableTradeRoutes(_player: Player) {
    // TODO: Integrate with technology system when available
    const technologies: string[] = []; // Placeholder for technologies
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
    
    // TODO: Check technology requirement when technology system is integrated
    if (route.requiredTechnology) {
      // For now, allow all routes without technology check
      // if (!player has tech) return { success: false, message: `Erfordert Technologie: ${route.requiredTechnology}` };
    }
    
    // Check infrastructure requirements (e.g., ports for sea routes)
    if (route.id.includes('sea') || route.id.includes('naval')) {
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
  public getAvailableTransportTypes(_player: Player) {
    // TODO: Integrate with technology system when available
    const technologies: string[] = []; // Placeholder for technologies
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
      
      // Apply seasonal effects
      kingdom.happiness = Math.max(0, Math.min(100, 
        kingdom.happiness * seasonalEffects.happinessModifier
      ));
      
      // Apply weather effects
      kingdom.happiness = Math.max(0, Math.min(100,
        kingdom.happiness * weatherEffects.happinessModifier
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