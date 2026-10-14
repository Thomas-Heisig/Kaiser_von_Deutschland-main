// src/ui/EnhancedPixiRenderer.ts
import * as PIXI from 'pixi.js';
import { PixiUISystem, defaultTheme } from './PixiUISystem';
import { Kingdom } from '../core/Kingdom';
import { Player } from '../core/Player';

/**
 * Enhanced PixiJS Renderer - Complete UI overhaul
 * Replaces all DOM-based UI with beautiful canvas rendering
 */

export interface RendererConfig {
  width?: number;
  height?: number;
  backgroundColor?: number;
  containerId?: string;
}

export interface ViewState {
  currentView: 'lobby' | 'kingdom' | 'map' | 'stats' | 'military' | 'economy';
  selectedPlayer?: Player;
  selectedKingdom?: Kingdom;
  zoom: number;
  panX: number;
  panY: number;
}

export interface ParticleSystem {
  particles: Particle[];
  emitters: ParticleEmitter[];
}

export interface Particle {
  sprite: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
}

export interface ParticleEmitter {
  x: number;
  y: number;
  rate: number;
  lastEmit: number;
  type: 'coins' | 'sparkles' | 'smoke' | 'snow' | 'rain';
}

export class EnhancedPixiRenderer {
  private app: PIXI.Application;
  private container: HTMLElement;
  private uiSystem!: PixiUISystem;
  
  // Main layers
  private backgroundLayer!: PIXI.Container;
  private gameLayer!: PIXI.Container;
  private uiLayer!: PIXI.Container;
  private particleLayer!: PIXI.Container;
  private overlayLayer!: PIXI.Container;
  
  // UI Components
  private header!: PIXI.Container;
  private sidebar!: PIXI.Container;
  private mainView!: PIXI.Container;
  private rightPanel!: PIXI.Container;
  
  // State
  private viewState: ViewState;
  private particleSystem: ParticleSystem;
  
  // Animation
  private animationTime: number = 0;
  private isAnimating: boolean = true;
  
  // Interactive elements
  private buttons: Map<string, any> = new Map();
  private panels: Map<string, any> = new Map();

  private constructor(config: RendererConfig) {
    const element = document.getElementById(config.containerId || 'app');
    if (!element) {
      throw new Error(`Container not found: ${config.containerId}`);
    }
    
    this.container = element;
    this.app = new PIXI.Application();
    
    this.viewState = {
      currentView: 'lobby',
      zoom: 1,
      panX: 0,
      panY: 0,
    };
    
    this.particleSystem = {
      particles: [],
      emitters: [],
    };
  }

  public static async create(config: RendererConfig = {}): Promise<EnhancedPixiRenderer> {
    const renderer = new EnhancedPixiRenderer(config);
    await renderer.initialize(config);
    return renderer;
  }

  private async initialize(config: RendererConfig): Promise<void> {
    const width = config.width || this.container.clientWidth || 1400;
    const height = config.height || this.container.clientHeight || 900;

    await this.app.init({
      width,
      height,
      backgroundColor: config.backgroundColor || defaultTheme.colors.background,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.innerHTML = '';
    this.container.appendChild(this.app.canvas);

    // Initialize UI system
    this.uiSystem = new PixiUISystem(this.app);

    // Create layers
    this.backgroundLayer = new PIXI.Container();
    this.gameLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.particleLayer = new PIXI.Container();
    this.overlayLayer = new PIXI.Container();

    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.gameLayer);
    this.app.stage.addChild(this.particleLayer);
    this.app.stage.addChild(this.uiLayer);
    this.app.stage.addChild(this.overlayLayer);

    // Create background
    this.createAnimatedBackground();

    // Create UI layout
    this.createUILayout(width, height);

    // Setup interactivity
    this.setupInteractivity();

    // Start render loop
    this.startRenderLoop();

    // Add resize handler
    window.addEventListener('resize', () => this.handleResize());

    console.log('✨ Enhanced PixiJS Renderer initialized successfully');
  }

  /**
   * Create animated background with particles using PixiJS 8.x API
   */
  private createAnimatedBackground(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Radial gradient background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color: defaultTheme.colors.background });

    // Add gradient overlay using Graphics
    const gradient = new PIXI.Graphics();
    
    // Create a radial gradient effect using multiple circles
    const centerX = width * 0.1;
    const centerY = height * 0.1;
    const maxRadius = Math.max(width, height) * 0.8;
    
    for (let i = 0; i < 10; i++) {
      const radius = (maxRadius / 10) * (i + 1);
      const alpha = 0.06 - (i * 0.006);
      gradient.circle(centerX, centerY, radius);
      gradient.fill({ color: defaultTheme.colors.accentSecondary, alpha });
    }
    
    this.backgroundLayer.addChild(bg);
    this.backgroundLayer.addChild(gradient);

    // Add animated stars/particles
    for (let i = 0; i < 50; i++) {
      const star = this.createStar();
      star.x = Math.random() * width;
      star.y = Math.random() * height;
      this.backgroundLayer.addChild(star);
      
      // Animate twinkle
      this.animateTwinkle(star);
    }
  }

  /**
   * Create a star particle using PixiJS 8.x API
   */
  private createStar(): PIXI.Graphics {
    const star = new PIXI.Graphics();
    const size = Math.random() * 2 + 1;
    const alpha = Math.random() * 0.5 + 0.3;
    star.circle(0, 0, size);
    star.fill({ color: 0xffffff, alpha });
    return star;
  }

  /**
   * Animate star twinkling
   */
  private animateTwinkle(star: PIXI.Graphics): void {
    const baseAlpha = star.alpha;
    const speed = Math.random() * 0.02 + 0.01;
    const offset = Math.random() * Math.PI * 2;
    
    const animate = () => {
      if (!this.isAnimating) return;
      star.alpha = baseAlpha + Math.sin(this.animationTime * speed + offset) * 0.3;
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Create main UI layout
   */
  private createUILayout(width: number, height: number): void {
    // Header
    this.createHeader(width);
    
    // Main content area
    const headerHeight = 80;
    const contentHeight = height - headerHeight;
    
    // Sidebar (left)
    this.sidebar = new PIXI.Container();
    this.sidebar.y = headerHeight;
    const sidebarPanel = this.createSidebar(260, contentHeight);
    this.sidebar.addChild(sidebarPanel.container);
    this.uiLayer.addChild(this.sidebar);
    
    // Main view (center)
    this.mainView = new PIXI.Container();
    this.mainView.x = 270;
    this.mainView.y = headerHeight;
    const mainPanel = this.createMainView(width - 540, contentHeight);
    this.mainView.addChild(mainPanel.container);
    this.uiLayer.addChild(this.mainView);
    
    // Right panel
    this.rightPanel = new PIXI.Container();
    this.rightPanel.x = width - 260;
    this.rightPanel.y = headerHeight;
    const rightPanelComp = this.createRightPanel(260, contentHeight);
    this.rightPanel.addChild(rightPanelComp.container);
    this.uiLayer.addChild(this.rightPanel);
  }

  /**
   * Create header with title and game status
   */
  private createHeader(width: number): void {
    this.header = new PIXI.Container();
    
    const panel = this.uiSystem.createPanel(width - 20, 70, undefined, {
      alpha: 0.15,
      padding: defaultTheme.spacing.lg,
    });
    panel.container.x = 10;
    panel.container.y = 10;
    
    // Title
    const title = this.uiSystem.createText('⚜️ Kaiser von Deutschland ⚜️', {
      fontSize: defaultTheme.fontSize.hero,
      fill: defaultTheme.colors.accentSecondary,
      fontWeight: 'bold',
    });
    title.x = defaultTheme.spacing.lg;
    title.y = 20;
    panel.content.addChild(title);
    
    // Subtitle
    const subtitle = this.uiSystem.createText('Kingdom Simulator', {
      fontSize: defaultTheme.fontSize.normal,
      fill: defaultTheme.colors.accent,
      fontWeight: '600',
    });
    subtitle.x = title.x + title.width + defaultTheme.spacing.md;
    subtitle.y = 30;
    panel.content.addChild(subtitle);
    
    // Game status (right side)
    const statusX = width - 400;
    const monthText = this.uiSystem.createText('Monat: Januar', {
      fontSize: defaultTheme.fontSize.normal,
      fill: defaultTheme.colors.textMuted,
    });
    monthText.x = statusX;
    monthText.y = 20;
    panel.content.addChild(monthText);
    
    const yearText = this.uiSystem.createText('Jahr: 1200', {
      fontSize: defaultTheme.fontSize.normal,
      fill: defaultTheme.colors.textMuted,
    });
    yearText.x = statusX + 150;
    yearText.y = 20;
    panel.content.addChild(yearText);
    
    const stateText = this.uiSystem.createText('Lobby', {
      fontSize: defaultTheme.fontSize.normal,
      fill: defaultTheme.colors.success,
      fontWeight: 'bold',
    });
    stateText.x = statusX;
    stateText.y = 45;
    panel.content.addChild(stateText);
    
    // Help button
    const helpBtn = this.uiSystem.createButton('📖 Hilfe', 120, 40, () => {
      console.log('Help clicked');
    });
    helpBtn.container.x = width - 150;
    helpBtn.container.y = 15;
    panel.content.addChild(helpBtn.container);
    
    this.header.addChild(panel.container);
    this.uiLayer.addChild(this.header);
    
    this.buttons.set('help', helpBtn);
    this.panels.set('header', panel);
  }

  /**
   * Create left sidebar with players
   */
  private createSidebar(width: number, height: number): any {
    const panel = this.uiSystem.createPanel(width, height, 'Spieler', {
      padding: defaultTheme.spacing.md,
    });
    
    // Add player button
    const addPlayerBtn = this.uiSystem.createButton(
      '+ Spieler',
      width - 40,
      36,
      () => this.handleAddPlayer(),
      { variant: 'primary' }
    );
    addPlayerBtn.container.x = 0;
    addPlayerBtn.container.y = 10;
    panel.content.addChild(addPlayerBtn.container);
    
    // Players list
    const playersList = new PIXI.Container();
    playersList.y = 60;
    panel.content.addChild(playersList);
    
    // Demo players
    for (let i = 0; i < 3; i++) {
      const playerCard = this.createPlayerCard(
        `Spieler ${i + 1}`,
        'König',
        width - 40,
        i
      );
      playerCard.container.y = i * 90;
      playersList.addChild(playerCard.container);
    }
    
    this.panels.set('sidebar', panel);
    return panel;
  }

  /**
   * Create player card
   */
  private createPlayerCard(
    name: string,
    role: string,
    width: number,
    index: number
  ): any {
    const card = this.uiSystem.createCard(width, 80, {
      title: name,
      subtitle: role,
      icon: '👑',
      hoverable: true,
    });
    
    card.container.eventMode = 'static';
    card.container.cursor = 'pointer';
    card.container.on('pointerdown', () => {
      console.log(`Player ${index + 1} selected`);
      this.createParticleEffect(card.container.x + width / 2, card.container.y + 40);
    });
    
    return card;
  }

  /**
   * Create main view
   */
  private createMainView(width: number, height: number): any {
    const panel = this.uiSystem.createPanel(width, height, undefined, {
      alpha: 0.08,
      padding: defaultTheme.spacing.xl,
    });
    
    // Welcome screen
    const welcome = new PIXI.Container();
    
    const welcomeTitle = this.uiSystem.createText('Willkommen bei Kaiser II', {
      fontSize: defaultTheme.fontSize.hero,
      fill: defaultTheme.colors.text,
      fontWeight: 'bold',
    });
    welcomeTitle.anchor.set(0.5);
    welcomeTitle.x = width / 2;
    welcomeTitle.y = height / 3;
    welcome.addChild(welcomeTitle);
    
    const welcomeText = this.uiSystem.createText(
      'Erstellen Sie einen Spieler oder laden Sie einen Spielstand',
      {
        fontSize: defaultTheme.fontSize.large,
        fill: defaultTheme.colors.textMuted,
      }
    );
    welcomeText.anchor.set(0.5);
    welcomeText.x = width / 2;
    welcomeText.y = height / 3 + 60;
    welcome.addChild(welcomeText);
    
    // Action buttons
    const newGameBtn = this.uiSystem.createButton(
      '🎮 Neues Spiel',
      200,
      50,
      () => this.handleNewGame(),
      { variant: 'primary' }
    );
    newGameBtn.container.x = width / 2 - 210;
    newGameBtn.container.y = height / 2;
    welcome.addChild(newGameBtn.container);
    
    const loadGameBtn = this.uiSystem.createButton(
      '📁 Laden',
      200,
      50,
      () => this.handleLoadGame(),
      { variant: 'secondary' }
    );
    loadGameBtn.container.x = width / 2 + 10;
    loadGameBtn.container.y = height / 2;
    welcome.addChild(loadGameBtn.container);
    
    // Stats showcase
    const statsY = height / 2 + 120;
    const stats = [
      { icon: '👥', label: 'Spieler', value: '1-6' },
      { icon: '🏰', label: 'Gebäude', value: '23+' },
      { icon: '🔬', label: 'Technologien', value: '24+' },
      { icon: '📅', label: 'Zeitspanne', value: '0-2050' },
    ];
    
    const statsContainer = new PIXI.Container();
    statsContainer.y = statsY;
    
    stats.forEach((stat, i) => {
      const statDisplay = this.uiSystem.createStatDisplay(
        stat.icon,
        stat.label,
        stat.value
      );
      statDisplay.x = (width / 4) * i + width / 8;
      statsContainer.addChild(statDisplay);
    });
    
    welcome.addChild(statsContainer);
    panel.content.addChild(welcome);
    
    this.buttons.set('newGame', newGameBtn);
    this.buttons.set('loadGame', loadGameBtn);
    this.panels.set('mainView', panel);
    
    return panel;
  }

  /**
   * Create right panel with saves/info
   */
  private createRightPanel(width: number, height: number): any {
    const panel = this.uiSystem.createPanel(width, height, 'Spielstände', {
      padding: defaultTheme.spacing.md,
    });
    
    // Quick save button
    const saveBtn = this.uiSystem.createButton(
      '💾 Speichern',
      width - 40,
      36,
      () => this.handleQuickSave(),
      { variant: 'success' }
    );
    saveBtn.container.y = 10;
    panel.content.addChild(saveBtn.container);
    
    // Saves list
    const savesList = new PIXI.Container();
    savesList.y = 60;
    
    // Demo saves
    const saves = [
      { name: 'Auto-Save 1', date: '28.12.2025' },
      { name: 'Heinrich', date: '27.12.2025' },
      { name: 'Mittelreich', date: '26.12.2025' },
    ];
    
    saves.forEach((save, i) => {
      const saveCard = this.uiSystem.createCard(width - 40, 70, {
        title: save.name,
        subtitle: save.date,
        icon: '💾',
        hoverable: true,
      });
      saveCard.container.y = i * 80;
      saveCard.container.eventMode = 'static';
      saveCard.container.cursor = 'pointer';
      saveCard.container.on('pointerdown', () => {
        console.log(`Load save: ${save.name}`);
      });
      savesList.addChild(saveCard.container);
    });
    
    panel.content.addChild(savesList);
    
    this.buttons.set('save', saveBtn);
    this.panels.set('rightPanel', panel);
    
    return panel;
  }

  /**
   * Setup interactivity
   */
  private setupInteractivity(): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
  }

  /**
   * Handle resize
   */
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.app.renderer.resize(width, height);
    
    // Recreate UI layout
    this.uiLayer.removeChildren();
    this.backgroundLayer.removeChildren();
    this.createAnimatedBackground();
    this.createUILayout(width, height);
  }

  /**
   * Start render loop
   */
  private startRenderLoop(): void {
    this.app.ticker.add(() => {
      this.animationTime += this.app.ticker.deltaTime;
      this.updateParticles();
    });
  }

  /**
   * Update particles
   */
  private updateParticles(): void {
    for (let i = this.particleSystem.particles.length - 1; i >= 0; i--) {
      const particle = this.particleSystem.particles[i];
      
      particle.sprite.x += particle.vx;
      particle.sprite.y += particle.vy;
      particle.life -= this.app.ticker.deltaTime;
      
      // Fade out
      particle.sprite.alpha = particle.life / particle.maxLife;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particleLayer.removeChild(particle.sprite);
        this.particleSystem.particles.splice(i, 1);
      }
    }
  }

  /**
   * Create particle effect
   */
  private createParticleEffect(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      const particle = this.uiSystem.createParticle(
        x,
        y,
        defaultTheme.colors.accent,
        Math.random() * 3 + 2
      );
      
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 2;
      
      this.particleLayer.addChild(particle);
      this.particleSystem.particles.push({
        sprite: particle,
        vx,
        vy,
        life: 60,
        maxLife: 60,
        color: defaultTheme.colors.accent,
      });
    }
  }

  /**
   * Event handlers
   */
  private handleAddPlayer(): void {
    console.log('Add player clicked');
    this.createParticleEffect(
      this.sidebar.x + 130,
      this.sidebar.y + 30
    );
  }

  private handleNewGame(): void {
    console.log('New game clicked');
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    this.createParticleEffect(centerX, centerY);
  }

  private handleLoadGame(): void {
    console.log('Load game clicked');
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    this.createParticleEffect(centerX + 200, centerY);
  }

  private handleQuickSave(): void {
    console.log('Quick save clicked');
    this.createParticleEffect(
      this.rightPanel.x + 130,
      this.rightPanel.y + 30
    );
  }

  /**
   * Public API
   */
  public showKingdomView(player: Player): void {
    this.viewState.selectedPlayer = player;
    this.viewState.currentView = 'kingdom';
    console.log('Showing kingdom view for player:', player);
    // TODO: Implement kingdom view
  }

  public showLobby(): void {
    this.viewState.currentView = 'lobby';
    console.log('Showing lobby');
  }

  public getApp(): PIXI.Application {
    return this.app;
  }

  public getUISystem(): PixiUISystem {
    return this.uiSystem;
  }

  public destroy(): void {
    this.isAnimating = false;
    this.app.destroy(true);
  }
}
