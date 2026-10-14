// src/ui/UIFlowManager.ts
import * as PIXI from 'pixi.js';
import { PixiUISystem, defaultTheme } from './PixiUISystem';
import { GameEngine } from '../core/GameEngine';
import { RoleSwitchingPanel } from './RoleSwitchingPanel';
import { TimeControlsPanel } from './TimeControlsPanel';
import { CharacterDashboard } from './CharacterDashboard';

/**
 * UI Flow Manager - Manages the three-step UI flow:
 * 1. Start Screen (Startseite)
 * 2. Game Setup Screen (Spielauswahl und Einstellungen)
 * 3. Main Game Screen (Hauptseite)
 */

export type UIScreen = 'start' | 'setup' | 'game';

export interface GameSetupData {
  playerName: string;
  era: number;
  profession: string;
  age: number;
  difficulty: number;
  gameSpeed: number;
  enableRandomEvents: boolean;
  kingdomName: string;
  gender: 'male' | 'female';
}

export class UIFlowManager {
  private app: PIXI.Application;
  private uiSystem: PixiUISystem;
  private gameEngine: GameEngine;
  
  // Screen containers
  private currentScreen: UIScreen = 'start';
  private screenContainer: PIXI.Container;
  private startScreen?: PIXI.Container;
  private setupScreen?: PIXI.Container;
  private gameScreen?: PIXI.Container;
  
  // Animation
  private animationTime: number = 0;
  
  // Life Simulation UI Panels
  private roleSwitchingPanel?: RoleSwitchingPanel;
  private timeControlsPanel?: TimeControlsPanel;
  private characterDashboard?: CharacterDashboard;
  private playerId: string = 'player1'; // Default player ID
  
  // Setup data
  private setupData: Partial<GameSetupData> = {
    playerName: 'Heinrich',
    era: 1200,
    profession: 'König',
    age: 25,
    difficulty: 2,
    gameSpeed: 1,
    enableRandomEvents: true,
    gender: 'male',
    kingdomName: 'Mittelreich',
  };

  constructor(app: PIXI.Application, gameEngine: GameEngine) {
    this.app = app;
    this.gameEngine = gameEngine;
    this.uiSystem = new PixiUISystem(app);
    
    this.screenContainer = new PIXI.Container();
    this.app.stage.addChild(this.screenContainer);
    
    this.startRenderLoop();
    this.setupKeyboardShortcuts();
    this.showStartScreen();
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      // Escape key - go back
      if (e.key === 'Escape') {
        if (this.currentScreen === 'setup') {
          this.showStartScreen();
        } else if (this.currentScreen === 'game') {
          this.showSetupScreen();
        }
      }
      
      // Enter key - continue/start
      if (e.key === 'Enter') {
        if (this.currentScreen === 'start') {
          this.showSetupScreen();
        } else if (this.currentScreen === 'setup') {
          this.startGame();
        }
      }
      
      // F1 - Help
      if (e.key === 'F1') {
        e.preventDefault();
        this.showDocumentation();
      }
    });
  }

  /**
   * Start render loop for animations and UI updates
   */
  private startRenderLoop(): void {
    this.app.ticker.add(() => {
      this.animationTime += 0.016; // Approximate 60 FPS
      
      // Update life simulation UI panels if on game screen (v2.6.0)
      if (this.currentScreen === 'game') {
        if (this.characterDashboard) {
          this.characterDashboard.update();
        }
        if (this.timeControlsPanel) {
          this.timeControlsPanel.updateDisplay();
        }
      }
    });
  }

  /**
   * Show Start Screen (Startseite)
   */
  public showStartScreen(): void {
    this.currentScreen = 'start';
    this.clearScreens();
    
    this.startScreen = this.createStartScreen();
    this.screenContainer.addChild(this.startScreen);
  }

  /**
   * Show Setup Screen (Spielauswahl und Einstellungen)
   */
  public showSetupScreen(): void {
    this.currentScreen = 'setup';
    this.clearScreens();
    
    this.setupScreen = this.createSetupScreen();
    this.screenContainer.addChild(this.setupScreen);
  }

  /**
   * Show Game Screen (Hauptseite)
   */
  public showGameScreen(): void {
    this.currentScreen = 'game';
    this.clearScreens();
    
    this.gameScreen = this.createGameScreen();
    this.screenContainer.addChild(this.gameScreen);
  }

  /**
   * Clear all screens
   */
  private clearScreens(): void {
    this.screenContainer.removeChildren();
    this.startScreen = undefined;
    this.setupScreen = undefined;
    this.gameScreen = undefined;
  }

  /**
   * Create Start Screen with animations
   */
  private createStartScreen(): PIXI.Container {
    const container = new PIXI.Container();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Background gradient
    const bg = this.createAnimatedBackground();
    container.addChild(bg);

    // Main content container (centered)
    const content = new PIXI.Container();
    content.x = width / 2;
    content.y = height / 2;

    // Title with glow effect
    const title = this.uiSystem.createText('⚜️ Kaiser von Deutschland ⚜️', {
      fontSize: 72,
      fill: defaultTheme.colors.accentSecondary,
      fontWeight: 'bold',
    });
    title.anchor.set(0.5);
    title.y = -200;
    content.addChild(title);

    // Subtitle
    const subtitle = this.uiSystem.createText('Historische Königreichssimulation', {
      fontSize: 28,
      fill: defaultTheme.colors.accent,
      fontWeight: '600',
    });
    subtitle.anchor.set(0.5);
    subtitle.y = -130;
    content.addChild(subtitle);

    // Description panel
    const descPanel = this.uiSystem.createPanel(700, 200, undefined, {
      alpha: 0.2,
      padding: defaultTheme.spacing.lg,
    });
    descPanel.container.x = -350;
    descPanel.container.y = -60;

    const description = this.uiSystem.createText(
      'Erlebe die Geschichte Deutschlands von Jahr 0 bis in die Zukunft.\n\n' +
      'Spiele als Kaiser, König, Bürgermeister oder einfacher Bürger.\n' +
      'Verwalte dein Königreich, treffe politische Entscheidungen,\n' +
      'führe Kriege oder baue eine blühende Wirtschaft auf.',
      {
        fontSize: 18,
        fill: defaultTheme.colors.text,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 660,
      }
    );
    description.anchor.set(0.5);
    description.x = 350;
    description.y = 100;
    descPanel.content.addChild(description);
    content.addChild(descPanel.container);

    // Weiter (Continue) button
    const weiterBtn = this.uiSystem.createButton(
      'Weiter →',
      300,
      60,
      () => this.showSetupScreen(),
      { variant: 'primary' }
    );
    weiterBtn.container.x = -150;
    weiterBtn.container.y = 180;
    content.addChild(weiterBtn.container);

    // Documentation/Help button
    const helpBtn = this.uiSystem.createButton(
      '📖 Dokumentation',
      300,
      60,
      () => this.showDocumentation(),
      { variant: 'secondary' }
    );
    helpBtn.container.x = -150;
    helpBtn.container.y = 260;
    content.addChild(helpBtn.container);

    // Version info
    const version = this.uiSystem.createText('Version 2.5.1', {
      fontSize: 14,
      fill: defaultTheme.colors.textMuted,
    });
    version.anchor.set(0.5);
    version.y = 350;
    content.addChild(version);

    // Keyboard shortcuts hint
    const shortcuts = this.uiSystem.createText(
      '⌨ Tastenkürzel: Enter = Weiter | F1 = Hilfe | Esc = Zurück',
      {
        fontSize: 12,
        fill: defaultTheme.colors.textMuted,
      }
    );
    shortcuts.anchor.set(0.5);
    shortcuts.y = 380;
    content.addChild(shortcuts);

    container.addChild(content);

    // Add floating particles animation
    this.addFloatingParticles(container, width, height);

    return container;
  }

  /**
   * Create Setup Screen with all game settings
   */
  private createSetupScreen(): PIXI.Container {
    const container = new PIXI.Container();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Background
    const bg = this.createAnimatedBackground();
    container.addChild(bg);

    // Header
    const header = this.createHeader('Spieleinstellungen', width);
    container.addChild(header);

    // Main content
    const content = new PIXI.Container();
    content.x = 50;
    content.y = 100;

    // Settings panel
    const settingsPanel = this.uiSystem.createPanel(width - 100, height - 200, undefined, {
      alpha: 0.15,
      padding: defaultTheme.spacing.xl,
    });

    let yOffset = 20;

    // Player Name
    yOffset = this.addInputField(settingsPanel.content, 'Spielername:', 'playerName', yOffset);

    // Kingdom Name
    yOffset = this.addInputField(settingsPanel.content, 'Königreichsname:', 'kingdomName', yOffset);

    // Gender selection
    yOffset = this.addGenderSelection(settingsPanel.content, yOffset);

    // Era selection
    yOffset = this.addEraSelection(settingsPanel.content, yOffset);

    // Profession selection
    yOffset = this.addProfessionSelection(settingsPanel.content, yOffset);

    // Age slider
    yOffset = this.addAgeSlider(settingsPanel.content, yOffset);

    // Difficulty slider
    yOffset = this.addDifficultySlider(settingsPanel.content, yOffset);

    // Game speed slider
    yOffset = this.addGameSpeedSlider(settingsPanel.content, yOffset);

    // Random events toggle
    yOffset = this.addRandomEventsToggle(settingsPanel.content, yOffset);

    // Load/Save section
    yOffset = this.addLoadSaveSection(settingsPanel.content, yOffset);

    content.addChild(settingsPanel.container);
    container.addChild(content);

    // Bottom buttons
    const buttonPanel = new PIXI.Container();
    buttonPanel.x = 50;
    buttonPanel.y = height - 80;

    const backBtn = this.uiSystem.createButton(
      '← Zurück',
      200,
      50,
      () => this.showStartScreen(),
      { variant: 'secondary' }
    );
    buttonPanel.addChild(backBtn.container);

    const startBtn = this.uiSystem.createButton(
      'Spiel starten! 🎮',
      300,
      50,
      () => this.startGame(),
      { variant: 'primary' }
    );
    startBtn.container.x = width - 350;
    buttonPanel.addChild(startBtn.container);

    // Keyboard shortcuts hint
    const shortcuts = this.uiSystem.createText(
      '⌨ Enter = Starten | Esc = Zurück | F1 = Hilfe',
      {
        fontSize: 12,
        fill: defaultTheme.colors.textMuted,
      }
    );
    shortcuts.x = width / 2 - 150;
    shortcuts.y = 20;
    buttonPanel.addChild(shortcuts);

    container.addChild(buttonPanel);

    return container;
  }

  /**
   * Create Main Game Screen with role-dependent interface
   */
  private createGameScreen(): PIXI.Container {
    const container = new PIXI.Container();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Background
    const bg = this.createAnimatedBackground();
    container.addChild(bg);

    // Top information bar
    const topBar = this.createTopBar(width);
    container.addChild(topBar);
    
    // Character Dashboard (Top Left)
    this.characterDashboard = new CharacterDashboard(this.gameEngine, this.playerId);
    const dashboardContainer = this.characterDashboard.getContainer();
    dashboardContainer.x = 10;
    dashboardContainer.y = 80;
    container.addChild(dashboardContainer);
    
    // Time Controls (Top Right)
    this.timeControlsPanel = new TimeControlsPanel(this.gameEngine);
    const timeControlsContainer = this.timeControlsPanel.getContainer();
    timeControlsContainer.x = width - 410;
    timeControlsContainer.y = 80;
    container.addChild(timeControlsContainer);

    // Left information panel (below character dashboard)
    const leftPanel = this.createLeftPanel(height);
    leftPanel.x = 10;
    leftPanel.y = 340;
    container.addChild(leftPanel);

    // Central visualization (role-dependent)
    const centralViz = this.createCentralVisualization(width, height);
    centralViz.x = 370;
    centralViz.y = 210;
    container.addChild(centralViz);

    // Right slider panel (status-based)
    const rightPanel = this.createRightSliderPanel(height);
    rightPanel.x = width - 270;
    rightPanel.y = 210;
    container.addChild(rightPanel);

    // Bottom button panel
    const bottomPanel = this.createBottomPanel(width);
    bottomPanel.y = height - 100;
    container.addChild(bottomPanel);
    
    // Role Switching Panel (initially hidden)
    this.roleSwitchingPanel = new RoleSwitchingPanel(this.gameEngine, this.playerId);
    const roleSwitchingContainer = this.roleSwitchingPanel.getContainer();
    roleSwitchingContainer.x = (width - 800) / 2;
    roleSwitchingContainer.y = (height - 600) / 2;
    roleSwitchingContainer.visible = false;
    container.addChild(roleSwitchingContainer);
    
    // Initialize first character if game is running
    this.initializeFirstCharacter();

    return container;
  }

  /**
   * Create animated background
   */
  private createAnimatedBackground(): PIXI.Container {
    const bg = new PIXI.Container();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Base gradient
    const gradient = new PIXI.Graphics();
    gradient.rect(0, 0, width, height);
    gradient.fill({ color: defaultTheme.colors.background });
    bg.addChild(gradient);

    // Radial glow
    const glow = new PIXI.Graphics();
    const centerX = width * 0.3;
    const centerY = height * 0.2;
    const maxRadius = Math.max(width, height);
    
    for (let i = 0; i < 15; i++) {
      const radius = (maxRadius / 15) * (i + 1);
      const alpha = 0.04 - (i * 0.002);
      glow.circle(centerX, centerY, radius);
      glow.fill({ color: defaultTheme.colors.accentSecondary, alpha });
    }
    bg.addChild(glow);

    return bg;
  }

  /**
   * Add floating particles for atmosphere
   */
  private addFloatingParticles(container: PIXI.Container, width: number, height: number): void {
    for (let i = 0; i < 30; i++) {
      const particle = new PIXI.Graphics();
      const size = Math.random() * 3 + 1;
      particle.circle(0, 0, size);
      particle.fill({ color: 0xffd700, alpha: Math.random() * 0.5 + 0.2 });
      
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      
      container.addChild(particle);
      
      // Animate particle
      const speed = Math.random() * 0.5 + 0.2;
      const direction = Math.random() * Math.PI * 2;
      
      this.app.ticker.add(() => {
        particle.x += Math.cos(direction) * speed;
        particle.y += Math.sin(direction + Math.sin(this.animationTime) * 0.5) * speed;
        
        // Wrap around
        if (particle.x > width) particle.x = 0;
        if (particle.x < 0) particle.x = width;
        if (particle.y > height) particle.y = 0;
        if (particle.y < 0) particle.y = height;
      });
    }
  }

  /**
   * Create header for screens
   */
  private createHeader(title: string, width: number): PIXI.Container {
    const header = new PIXI.Container();
    
    const panel = this.uiSystem.createPanel(width - 100, 60, undefined, {
      alpha: 0.15,
      padding: defaultTheme.spacing.md,
    });
    panel.container.x = 50;
    panel.container.y = 20;

    const titleText = this.uiSystem.createText(title, {
      fontSize: 32,
      fill: defaultTheme.colors.accentSecondary,
      fontWeight: 'bold',
    });
    titleText.x = defaultTheme.spacing.lg;
    titleText.y = 15;
    panel.content.addChild(titleText);

    header.addChild(panel.container);
    return header;
  }

  /**
   * Add input field to panel
   */
  private addInputField(parent: PIXI.Container, label: string, field: keyof GameSetupData, yOffset: number): number {
    const labelText = this.uiSystem.createText(label, {
      fontSize: 20,
      fill: defaultTheme.colors.text,
      fontWeight: '600',
    });
    labelText.y = yOffset;
    parent.addChild(labelText);

    // Create input box (simplified for PixiJS - in real app would need text input)
    const inputBox = this.uiSystem.createPanel(400, 40, undefined, {
      alpha: 0.3,
      padding: defaultTheme.spacing.sm,
    });
    inputBox.container.x = 250;
    inputBox.container.y = yOffset - 5;

    const currentValue = (this.setupData[field] as string) || '';
    const valueText = this.uiSystem.createText(currentValue || 'Eingeben...', {
      fontSize: 18,
      fill: currentValue ? defaultTheme.colors.text : defaultTheme.colors.textMuted,
    });
    valueText.x = 10;
    valueText.y = 10;
    inputBox.content.addChild(valueText);

    // Make clickable for input (simplified)
    inputBox.container.eventMode = 'static';
    inputBox.container.cursor = 'pointer';
    inputBox.container.on('pointerdown', () => {
      const newValue = prompt(`${label}`, currentValue);
      if (newValue !== null) {
        this.setupData[field] = newValue as any;
        valueText.text = newValue;
        valueText.style.fill = defaultTheme.colors.text;
      }
    });

    parent.addChild(inputBox.container);

    return yOffset + 70;
  }

  /**
   * Add gender selection
   */
  private addGenderSelection(parent: PIXI.Container, yOffset: number): number {
    const label = this.uiSystem.createText('Geschlecht:', {
      fontSize: 20,
      fill: defaultTheme.colors.text,
      fontWeight: '600',
    });
    label.y = yOffset;
    parent.addChild(label);

    const maleBtn = this.uiSystem.createButton(
      '♂ Männlich',
      150,
      40,
      () => {
        this.setupData.gender = 'male';
        this.showSetupScreen(); // Refresh
      },
      { variant: this.setupData.gender === 'male' ? 'primary' : 'secondary' }
    );
    maleBtn.container.x = 250;
    maleBtn.container.y = yOffset - 5;

    const femaleBtn = this.uiSystem.createButton(
      '♀ Weiblich',
      150,
      40,
      () => {
        this.setupData.gender = 'female';
        this.showSetupScreen(); // Refresh
      },
      { variant: this.setupData.gender === 'female' ? 'primary' : 'secondary' }
    );
    femaleBtn.container.x = 420;
    femaleBtn.container.y = yOffset - 5;

    parent.addChild(maleBtn.container);
    parent.addChild(femaleBtn.container);

    return yOffset + 70;
  }

  /**
   * Add era selection dropdown
   */
  private addEraSelection(parent: PIXI.Container, yOffset: number): number {
    const label = this.uiSystem.createText('Startjahr / Epoche:', {
      fontSize: 20,
      fill: defaultTheme.colors.text,
      fontWeight: '600',
    });
    label.y = yOffset;
    parent.addChild(label);

    const eras = [
      { year: 0, name: 'Antike (Jahr 0)' },
      { year: 800, name: 'Frühmittelalter (800)' },
      { year: 1200, name: 'Hochmittelalter (1200)' },
      { year: 1500, name: 'Renaissance (1500)' },
      { year: 1800, name: 'Industrialisierung (1800)' },
      { year: 1900, name: '20. Jahrhundert (1900)' },
      { year: 2000, name: 'Moderne (2000)' },
    ];

    const currentEra = eras.find(e => e.year === this.setupData.era) || eras[2];

    const eraBox = this.uiSystem.createPanel(400, 40, undefined, {
      alpha: 0.3,
      padding: defaultTheme.spacing.sm,
    });
    eraBox.container.x = 250;
    eraBox.container.y = yOffset - 5;

    const eraText = this.uiSystem.createText(currentEra.name, {
      fontSize: 18,
      fill: defaultTheme.colors.text,
    });
    eraText.x = 10;
    eraText.y = 10;
    eraBox.content.addChild(eraText);

    // Make clickable
    eraBox.container.eventMode = 'static';
    eraBox.container.cursor = 'pointer';
    eraBox.container.on('pointerdown', () => {
      const choice = prompt(
        'Wähle Epoche:\n' + eras.map((e, i) => `${i + 1}: ${e.name}`).join('\n'),
        '3'
      );
      const index = parseInt(choice || '3') - 1;
      if (index >= 0 && index < eras.length) {
        this.setupData.era = eras[index].year;
        this.showSetupScreen(); // Refresh
      }
    });

    parent.addChild(eraBox.container);

    return yOffset + 70;
  }

  /**
   * Add profession selection
   */
  private addProfessionSelection(parent: PIXI.Container, yOffset: number): number {
    const label = this.uiSystem.createText('Beruf / Stand:', {
      fontSize: 20,
      fill: defaultTheme.colors.text,
      fontWeight: '600',
    });
    label.y = yOffset;
    parent.addChild(label);

    const professions = [
      'Kaiser', 'König', 'Herzog', 'Bürgermeister', 
      'Händler', 'Handwerker', 'Bauer', 'Arbeiter', 
      'Gelehrter', 'Bischof', 'Mönch'
    ];

    const profBox = this.uiSystem.createPanel(400, 40, undefined, {
      alpha: 0.3,
      padding: defaultTheme.spacing.sm,
    });
    profBox.container.x = 250;
    profBox.container.y = yOffset - 5;

    const profText = this.uiSystem.createText(this.setupData.profession || professions[0], {
      fontSize: 18,
      fill: defaultTheme.colors.text,
    });
    profText.x = 10;
    profText.y = 10;
    profBox.content.addChild(profText);

    profBox.container.eventMode = 'static';
    profBox.container.cursor = 'pointer';
    profBox.container.on('pointerdown', () => {
      const choice = prompt(
        'Wähle Beruf:\n' + professions.map((p, i) => `${i + 1}: ${p}`).join('\n'),
        '2'
      );
      const index = parseInt(choice || '2') - 1;
      if (index >= 0 && index < professions.length) {
        this.setupData.profession = professions[index];
        this.showSetupScreen(); // Refresh
      }
    });

    parent.addChild(profBox.container);

    return yOffset + 70;
  }

  /**
   * Add age slider
   */
  private addAgeSlider(parent: PIXI.Container, yOffset: number): number {
    const label = this.uiSystem.createText(`Alter: ${this.setupData.age} Jahre`, {
      fontSize: 20,
      fill: defaultTheme.colors.text,
      fontWeight: '600',
    });
    label.y = yOffset;
    parent.addChild(label);

    const slider = this.createSlider(400, 18, 80, this.setupData.age || 25, (value) => {
      this.setupData.age = value;
      label.text = `Alter: ${value} Jahre`;
    });
    slider.x = 250;
    slider.y = yOffset + 5;
    parent.addChild(slider);

    return yOffset + 70;
  }

  /**
   * Add difficulty slider
   */
  private addDifficultySlider(parent: PIXI.Container, yOffset: number): number {
    const difficultyNames = ['Sehr leicht', 'Leicht', 'Normal', 'Schwer', 'Sehr schwer'];
    const label = this.uiSystem.createText(
      `Schwierigkeit: ${difficultyNames[(this.setupData.difficulty || 2) - 1]}`,
      {
        fontSize: 20,
        fill: defaultTheme.colors.text,
        fontWeight: '600',
      }
    );
    label.y = yOffset;
    parent.addChild(label);

    const slider = this.createSlider(400, 1, 5, this.setupData.difficulty || 2, (value) => {
      this.setupData.difficulty = value;
      label.text = `Schwierigkeit: ${difficultyNames[value - 1]}`;
    });
    slider.x = 250;
    slider.y = yOffset + 5;
    parent.addChild(slider);

    return yOffset + 70;
  }

  /**
   * Add game speed slider
   */
  private addGameSpeedSlider(parent: PIXI.Container, yOffset: number): number {
    const speedNames = ['Langsam', 'Normal', 'Schnell', 'Sehr schnell'];
    const label = this.uiSystem.createText(
      `Spielgeschwindigkeit: ${speedNames[(this.setupData.gameSpeed || 1) - 1]}`,
      {
        fontSize: 20,
        fill: defaultTheme.colors.text,
        fontWeight: '600',
      }
    );
    label.y = yOffset;
    parent.addChild(label);

    const slider = this.createSlider(400, 1, 4, this.setupData.gameSpeed || 1, (value) => {
      this.setupData.gameSpeed = value;
      label.text = `Spielgeschwindigkeit: ${speedNames[value - 1]}`;
    });
    slider.x = 250;
    slider.y = yOffset + 5;
    parent.addChild(slider);

    return yOffset + 70;
  }

  /**
   * Add random events toggle
   */
  private addRandomEventsToggle(parent: PIXI.Container, yOffset: number): number {
    const label = this.uiSystem.createText('Zufallsereignisse:', {
      fontSize: 20,
      fill: defaultTheme.colors.text,
      fontWeight: '600',
    });
    label.y = yOffset;
    parent.addChild(label);

    const toggleBtn = this.uiSystem.createButton(
      this.setupData.enableRandomEvents ? '✓ Aktiviert' : '✗ Deaktiviert',
      200,
      40,
      () => {
        this.setupData.enableRandomEvents = !this.setupData.enableRandomEvents;
        this.showSetupScreen(); // Refresh
      },
      { variant: this.setupData.enableRandomEvents ? 'primary' : 'secondary' }
    );
    toggleBtn.container.x = 250;
    toggleBtn.container.y = yOffset - 5;
    parent.addChild(toggleBtn.container);

    return yOffset + 70;
  }

  /**
   * Add load/save section
   */
  private addLoadSaveSection(parent: PIXI.Container, yOffset: number): number {
    const label = this.uiSystem.createText('Spielstand:', {
      fontSize: 20,
      fill: defaultTheme.colors.text,
      fontWeight: '600',
    });
    label.y = yOffset;
    parent.addChild(label);

    const loadBtn = this.uiSystem.createButton(
      '📁 Laden',
      150,
      40,
      () => alert('Spielstand laden (Funktion kommt später)'),
      { variant: 'secondary' }
    );
    loadBtn.container.x = 250;
    loadBtn.container.y = yOffset - 5;
    parent.addChild(loadBtn.container);

    return yOffset + 70;
  }

  /**
   * Create slider component
   */
  private createSlider(
    width: number,
    min: number,
    max: number,
    value: number,
    onChange: (value: number) => void
  ): PIXI.Container {
    const slider = new PIXI.Container();

    // Track
    const track = new PIXI.Graphics();
    track.rect(0, 0, width, 8);
    track.fill({ color: defaultTheme.colors.panel, alpha: 0.5 });
    slider.addChild(track);

    // Fill
    const fill = new PIXI.Graphics();
    const fillWidth = ((value - min) / (max - min)) * width;
    fill.rect(0, 0, fillWidth, 8);
    fill.fill({ color: defaultTheme.colors.accentSecondary, alpha: 0.8 });
    slider.addChild(fill);

    // Handle
    const handle = new PIXI.Graphics();
    handle.circle(0, 0, 12);
    handle.fill({ color: defaultTheme.colors.accent });
    handle.x = fillWidth;
    handle.y = 4;
    slider.addChild(handle);

    // Interactivity
    let dragging = false;
    
    handle.eventMode = 'static';
    handle.cursor = 'pointer';
    
    handle.on('pointerdown', () => {
      dragging = true;
    });

    this.app.stage.on('pointerup', () => {
      dragging = false;
    });

    this.app.stage.on('pointermove', (e) => {
      if (dragging) {
        const pos = e.global;
        const localPos = slider.toLocal(pos);
        const newFillWidth = Math.max(0, Math.min(width, localPos.x));
        const newValue = Math.round(min + ((newFillWidth / width) * (max - min)));
        
        fill.clear();
        fill.rect(0, 0, newFillWidth, 8);
        fill.fill({ color: defaultTheme.colors.accentSecondary, alpha: 0.8 });
        
        handle.x = newFillWidth;
        onChange(newValue);
      }
    });

    return slider;
  }

  /**
   * Create top information bar for game screen
   */
  private createTopBar(width: number): PIXI.Container {
    const bar = new PIXI.Container();
    
    const panel = this.uiSystem.createPanel(width - 20, 60, undefined, {
      alpha: 0.15,
      padding: defaultTheme.spacing.md,
    });
    panel.container.x = 10;
    panel.container.y = 10;

    // Title
    const title = this.uiSystem.createText('⚜️ Kaiser von Deutschland', {
      fontSize: 24,
      fill: defaultTheme.colors.accentSecondary,
      fontWeight: 'bold',
    });
    title.x = 20;
    title.y = 18;
    panel.content.addChild(title);

    // Year
    const year = this.uiSystem.createText('Jahr: 1200', {
      fontSize: 20,
      fill: defaultTheme.colors.text,
    });
    year.x = width - 500;
    year.y = 20;
    panel.content.addChild(year);

    // Gold
    const gold = this.uiSystem.createText('💰 Gold: 1000', {
      fontSize: 20,
      fill: defaultTheme.colors.accent,
    });
    gold.x = width - 300;
    gold.y = 20;
    panel.content.addChild(gold);

    bar.addChild(panel.container);
    return bar;
  }

  /**
   * Create left information panel
   */
  private createLeftPanel(height: number): PIXI.Container {
    const panel = this.uiSystem.createPanel(260, height - 190, 'Informationen', {
      padding: defaultTheme.spacing.md,
    });

    const info = this.uiSystem.createText(
      'Bevölkerung: 1,000\n\n' +
      'Zufriedenheit: 85%\n\n' +
      'Wirtschaft: Stark\n\n' +
      'Militär: 500 Einheiten\n\n' +
      'Technologie: Stufe 3',
      {
        fontSize: 16,
        fill: defaultTheme.colors.text,
        lineHeight: 28,
      }
    );
    info.x = 10;
    info.y = 50;
    panel.content.addChild(info);

    return panel.container;
  }

  /**
   * Create central visualization (role-dependent)
   */
  private createCentralVisualization(width: number, height: number): PIXI.Container {
    const vizWidth = width - 580;
    const vizHeight = height - 190;
    
    const panel = this.uiSystem.createPanel(vizWidth, vizHeight, 'Lebensumfeld', {
      padding: defaultTheme.spacing.md,
    });

    // Role-dependent visualization
    const profession = this.setupData.profession || 'König';
    
    const viz = new PIXI.Graphics();
    
    if (profession === 'Kaiser' || profession === 'König') {
      // Political/Kingdom view
      this.createKingdomChart(viz, vizWidth - 40, vizHeight - 80);
    } else if (profession === 'Bauer' || profession === 'Arbeiter') {
      // Worker/Labor view
      this.createWorkerChart(viz, vizWidth - 40, vizHeight - 80);
    } else {
      // Default view
      this.createDefaultChart(viz, vizWidth - 40, vizHeight - 80);
    }
    
    viz.x = 20;
    viz.y = 50;
    panel.content.addChild(viz);

    return panel.container;
  }

  /**
   * Create kingdom chart for rulers
   */
  private createKingdomChart(graphics: PIXI.Graphics, width: number, height: number): void {
    // Map visualization
    graphics.rect(0, 0, width, height);
    graphics.fill({ color: 0x1a3a1a, alpha: 0.3 });

    // Regions
    const regions = [
      { x: width * 0.2, y: height * 0.3, r: 40, name: 'Nord' },
      { x: width * 0.5, y: height * 0.5, r: 50, name: 'Zentrum' },
      { x: width * 0.7, y: height * 0.7, r: 35, name: 'Süd' },
    ];

    regions.forEach(region => {
      graphics.circle(region.x, region.y, region.r);
      graphics.fill({ color: 0xffd700, alpha: 0.4 });
    });
  }

  /**
   * Create worker chart for laborers
   */
  private createWorkerChart(graphics: PIXI.Graphics, width: number, height: number): void {
    // Farm/Workshop visualization
    graphics.rect(0, 0, width, height);
    graphics.fill({ color: 0x3a2a1a, alpha: 0.3 });

    // Work areas
    const gridSize = 60;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const x = 50 + j * gridSize;
        const y = 50 + i * gridSize;
        graphics.rect(x, y, 40, 40);
        graphics.fill({ color: 0x8b4513, alpha: 0.5 });
      }
    }
  }

  /**
   * Create default chart
   */
  private createDefaultChart(graphics: PIXI.Graphics, width: number, height: number): void {
    // Generic visualization
    graphics.rect(0, 0, width, height);
    graphics.fill({ color: 0x2a2a3a, alpha: 0.3 });

    // Stats bars
    const stats = [
      { label: 'Gesundheit', value: 0.8, color: 0x00ff00 },
      { label: 'Bildung', value: 0.6, color: 0x0088ff },
      { label: 'Wohlstand', value: 0.7, color: 0xffd700 },
    ];

    stats.forEach((stat, i) => {
      const y = 50 + i * 60;
      graphics.rect(50, y, width - 100, 30);
      graphics.fill({ color: 0x444444, alpha: 0.5 });
      
      graphics.rect(50, y, (width - 100) * stat.value, 30);
      graphics.fill({ color: stat.color, alpha: 0.7 });
    });
  }

  /**
   * Create right slider panel (status-based)
   */
  private createRightSliderPanel(height: number): PIXI.Container {
    const panel = this.uiSystem.createPanel(260, height - 190, 'Aktionen', {
      padding: defaultTheme.spacing.md,
    });

    let yOffset = 50;

    const actions = [
      { label: 'Steuern erheben', icon: '💰' },
      { label: 'Gesetz erlassen', icon: '⚖️' },
      { label: 'Handel treiben', icon: '🤝' },
      { label: 'Krieg führen', icon: '⚔️' },
      { label: 'Bauen', icon: '🏗️' },
    ];

    actions.forEach(action => {
      const btn = this.uiSystem.createButton(
        `${action.icon} ${action.label}`,
        220,
        40,
        () => alert(`${action.label} ausgeführt!`),
        { variant: 'secondary' }
      );
      btn.container.x = 10;
      btn.container.y = yOffset;
      panel.content.addChild(btn.container);
      yOffset += 55;
    });

    return panel.container;
  }

  /**
   * Create bottom button panel
   */
  private createBottomPanel(width: number): PIXI.Container {
    const panel = new PIXI.Container();
    
    const bg = this.uiSystem.createPanel(width - 20, 80, undefined, {
      alpha: 0.15,
      padding: defaultTheme.spacing.md,
    });
    bg.container.x = 10;

    const buttons = [
      { label: 'Charakter wechseln', icon: '👤', variant: 'primary' as const, action: 'switchRole' },
      { label: 'Nächstes Jahr', icon: '⏭️', variant: 'primary' as const, action: 'nextYear' },
      { label: 'Pause', icon: '⏸️', variant: 'secondary' as const, action: 'pause' },
      { label: 'Speichern', icon: '💾', variant: 'secondary' as const, action: 'save' },
      { label: 'Einstellungen', icon: '⚙️', variant: 'secondary' as const, action: 'settings' },
    ];

    let xOffset = 20;
    buttons.forEach(btn => {
      const button = this.uiSystem.createButton(
        `${btn.icon} ${btn.label}`,
        180,
        50,
        () => {
          if (btn.action === 'switchRole') {
            this.showRoleSwitchingPanel();
          } else if (btn.action === 'nextYear') {
            alert('Jahr fortschreiten...');
          } else if (btn.action === 'settings') {
            this.showSetupScreen();
          } else {
            alert(`${btn.label} geklickt!`);
          }
        },
        { variant: btn.variant }
      );
      button.container.x = xOffset;
      button.container.y = 15;
      bg.content.addChild(button.container);
      xOffset += 200;
    });

    panel.addChild(bg.container);
    return panel;
  }

  /**
   * Show documentation
   */
  private showDocumentation(): void {
    alert(
      '⚜️ Kaiser von Deutschland - Dokumentation\n\n' +
      '═══════════════════════════════════════\n\n' +
      '📖 Willkommen bei der historischen Königreichssimulation!\n\n' +
      'SPIELABLAUF:\n' +
      '1. Startseite: Überblick über das Spiel\n' +
      '2. Einstellungen: Spieler und Königreich konfigurieren\n' +
      '3. Hauptspiel: Interaktives Gameplay\n\n' +
      'GAMEPLAY:\n' +
      '• Verwalte dein Königreich über Jahrhunderte (Jahr 0 - 2050)\n' +
      '• Treffe politische und wirtschaftliche Entscheidungen\n' +
      '• Baue Gebäude und entwickle Technologien\n' +
      '• Führe Kriege oder schließe Frieden\n' +
      '• Erlebe historische Ereignisse\n\n' +
      'ROLLEN:\n' +
      '• Kaiser/König: Politische Führung\n' +
      '• Bürgermeister: Städteverwaltung\n' +
      '• Händler: Wirtschaft und Handel\n' +
      '• Bauer/Arbeiter: Produktion\n' +
      '• Gelehrter: Forschung und Bildung\n\n' +
      'STEUERUNG:\n' +
      '⌨ Tastenkürzel:\n' +
      '  • Enter = Weiter/Starten\n' +
      '  • Esc = Zurück\n' +
      '  • F1 = Diese Hilfe\n' +
      '🖱 Maus: Alle Interaktionen mit Buttons und Panels\n\n' +
      'FEATURES:\n' +
      '✓ 15 verschiedene Spielerrollen\n' +
      '✓ 27+ historische Ereignisse\n' +
      '✓ 23 Gebäudetypen\n' +
      '✓ 24 Technologien\n' +
      '✓ Umfangreiches Wirtschaftssystem\n' +
      '✓ Kriegsführung und Diplomatie\n' +
      '✓ Bevölkerungssimulation\n' +
      '✓ Multiplayer (bis zu 6 Spieler)\n\n' +
      '═══════════════════════════════════════\n\n' +
      'Weitere Informationen:\n' +
      '📄 README.md im Projektordner\n' +
      '🌐 GitHub: Thomas-Heisig/Kaiser_von_Deutschland\n\n' +
      'Viel Erfolg beim Regieren! 👑'
    );
  }

  /**
   * Start the game with current setup
   */
  private async startGame(): Promise<void> {
    // Validate setup
    if (!this.setupData.playerName || this.setupData.playerName.trim() === '') {
      alert('❌ Fehler: Bitte geben Sie einen Spielernamen ein!\n\nDer Spielername wird für Ihr Königreich benötigt.');
      return;
    }

    if (!this.setupData.kingdomName || this.setupData.kingdomName.trim() === '') {
      alert('❌ Fehler: Bitte geben Sie einen Königreichsnamen ein!\n\nIhr Königreich braucht einen Namen!');
      return;
    }

    try {
      // Create player in game engine
      const player = this.gameEngine.addPlayer({
        name: this.setupData.playerName!,
        gender: this.setupData.gender!,
        kingdomName: this.setupData.kingdomName!,
        difficulty: this.setupData.difficulty!,
      });

      // Start game
      await this.gameEngine.startGame();

      // Show game screen
      this.showGameScreen();

      console.log('✨ Game started successfully with player:', player);
      console.log('📊 Setup data:', this.setupData);
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      alert(
        '❌ Fehler beim Starten des Spiels!\n\n' +
        'Details: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler') +
        '\n\nBitte versuchen Sie es erneut.'
      );
    }
  }

  /**
   * Get current screen
   */
  public getCurrentScreen(): UIScreen {
    return this.currentScreen;
  }
  
  /**
   * Show role switching panel
   */
  private showRoleSwitchingPanel(): void {
    if (this.roleSwitchingPanel) {
      this.roleSwitchingPanel.show();
      // Show recommended characters by default
      this.roleSwitchingPanel.showRecommendedCharacters();
    }
  }
  
  /**
   * Initialize first character for player
   */
  private initializeFirstCharacter(): void {
    // This method is called when the game screen is created.
    // If the game hasn't started yet, the GameEngine will handle initialization in startGame().
    // This method ensures the UI is updated if characters already exist.
    
    const roleSwitchingSystem = this.gameEngine.getRoleSwitchingSystem();
    
    // Check if session exists
    const session = roleSwitchingSystem.getSession(this.playerId);
    
    // If no session and we have citizens, game hasn't started yet - GameEngine will handle it
    if (!session) {
      console.log('⏳ Waiting for game to start - GameEngine will initialize life simulation');
      return;
    }
    
    // Update dashboard if we already have a character
    if (session.currentCitizenId && this.characterDashboard) {
      this.characterDashboard.update();
      console.log('✅ Character dashboard updated');
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.clearScreens();
    this.app.stage.removeChild(this.screenContainer);
    
    // Cleanup life simulation panels
    if (this.roleSwitchingPanel) {
      this.roleSwitchingPanel.destroy();
    }
    if (this.timeControlsPanel) {
      this.timeControlsPanel.destroy();
    }
    if (this.characterDashboard) {
      this.characterDashboard.destroy();
    }
  }
}
