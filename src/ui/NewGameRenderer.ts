// src/ui/NewGameRenderer.ts
import * as PIXI from 'pixi.js';
import { Kingdom } from '../core/Kingdom';

/**
 * Komplett neues PixiJS Rendering-System mit kreativer Gestaltung
 * Features: Isometrische Ansicht, Drag & Drop, Animationen, Wettereffekte
 */

export interface ViewMode {
  type: 'isometric' | 'map' | 'population' | 'military' | 'economy';
  zoom: number;
  rotation: number;
}

export interface InteractiveBuilding {
  id: string;
  type: string;
  x: number;
  y: number;
  sprite: PIXI.Container;
  data: any;
}

export interface GameParticle {
  sprite: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'smoke' | 'spark' | 'rain' | 'snow' | 'coin' | 'heart';
}

export class NewGameRenderer {
  private app: PIXI.Application;
  private container: HTMLElement;
  
  // Haupt-Container für verschiedene Ansichten
  private worldContainer: PIXI.Container;
  private isometricLayer: PIXI.Container;
  private mapLayer: PIXI.Container;
  private uiLayer: PIXI.Container;
  private particleLayer: PIXI.Container;
  private tooltipLayer: PIXI.Container;
  
  // Spielzustand
  private currentView: ViewMode;
  private buildings: InteractiveBuilding[] = [];
  private particles: GameParticle[] = [];
  private selectedBuilding: InteractiveBuilding | null = null;
  
  // Interaktivität
  private isDragging: boolean = false;
  private dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private draggedBuilding: InteractiveBuilding | null = null;
  
  // Animation
  private weatherEnabled: boolean = true;
  private currentWeather: 'clear' | 'rain' | 'snow' | 'storm' = 'clear';
  private timeOfDay: number = 12; // 0-24 Stunden
  
  // Ressourcen-Anzeige
  private resourcesDisplay: PIXI.Container;
  
  private isInitialized: boolean = false;

  private constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    
    this.container = element;
    this.app = new PIXI.Application();
    
    // Container initialisieren
    this.worldContainer = new PIXI.Container();
    this.isometricLayer = new PIXI.Container();
    this.mapLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.particleLayer = new PIXI.Container();
    this.tooltipLayer = new PIXI.Container();
    this.resourcesDisplay = new PIXI.Container();
    
    this.currentView = {
      type: 'isometric',
      zoom: 1,
      rotation: 0
    };
  }

  public static async create(containerId: string = 'kingdom-map'): Promise<NewGameRenderer> {
    const renderer = new NewGameRenderer(containerId);
    await renderer.initialize();
    return renderer;
  }

  private async initialize(): Promise<void> {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    await this.app.init({
      width,
      height,
      backgroundColor: 0x87CEEB, // Himmelblau
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    this.container.appendChild(this.app.canvas);

    // Layer-Hierarchie aufbauen
    this.worldContainer.addChild(this.isometricLayer);
    this.worldContainer.addChild(this.mapLayer);
    this.worldContainer.addChild(this.particleLayer);
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.uiLayer);
    this.app.stage.addChild(this.resourcesDisplay);
    this.app.stage.addChild(this.tooltipLayer);

    this.setupInteractivity();
    this.setupUI();
    this.startGameLoop();
    
    this.isInitialized = true;
  }

  private setupInteractivity(): void {
    // Responsive Resizing
    const resizeHandler = () => {
      const width = this.container.clientWidth || 800;
      const height = this.container.clientHeight || 600;
      this.app.renderer.resize(width, height);
      this.updateResourcesDisplay();
    };
    window.addEventListener('resize', resizeHandler);

    // Kamera-Steuerung (Pan & Zoom)
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // Pan-Funktionalität
    this.app.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      const pos = event.global;
      this.dragStart = { x: pos.x, y: pos.y };
      
      // Prüfen ob Gebäude angeklickt wurde
      const clickedBuilding = this.getBuildingAt(pos.x, pos.y);
      if (clickedBuilding && event.button === 0) {
        this.selectBuilding(clickedBuilding);
        if (event.shiftKey) {
          // Mit Shift kann man Gebäude verschieben
          this.draggedBuilding = clickedBuilding;
        }
      } else {
        this.isDragging = true;
      }
    });

    this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      const pos = event.global;
      
      if (this.draggedBuilding) {
        // Gebäude verschieben
        const worldPos = this.screenToWorld(pos.x, pos.y);
        this.draggedBuilding.sprite.x = worldPos.x;
        this.draggedBuilding.sprite.y = worldPos.y;
      } else if (this.isDragging) {
        // Kamera verschieben
        const deltaX = pos.x - this.dragStart.x;
        const deltaY = pos.y - this.dragStart.y;
        
        this.worldContainer.x += deltaX;
        this.worldContainer.y += deltaY;
        
        this.dragStart = { x: pos.x, y: pos.y };
      } else {
        // Tooltip anzeigen bei Hover
        this.updateTooltip(pos.x, pos.y);
      }
    });

    this.app.stage.on('pointerup', () => {
      this.isDragging = false;
      if (this.draggedBuilding) {
        this.updateBuildingPosition(this.draggedBuilding);
        this.draggedBuilding = null;
      }
    });

    this.app.stage.on('pointerupoutside', () => {
      this.isDragging = false;
      this.draggedBuilding = null;
    });

    // Zoom mit Mausrad
    this.app.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = this.currentView.zoom * zoomFactor;
      this.currentView.zoom = Math.max(0.3, Math.min(3, newZoom));
      
      this.worldContainer.scale.set(this.currentView.zoom);
    }, { passive: false });

    // Tastatur-Shortcuts
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleKeyPress(e);
    });
  }

  private setupUI(): void {
    // Ressourcen-Anzeige oben
    this.updateResourcesDisplay();
    
    // View-Switcher (Icons für verschiedene Ansichten)
    this.createViewSwitcher();
    
    // Minimap unten rechts
    this.createMinimap();
    
    // Baumenü unten
    this.createBuildMenu();
  }

  private updateResourcesDisplay(): void {
    this.resourcesDisplay.removeChildren();
    
    const panel = new PIXI.Graphics();
    panel.rect(0, 0, this.app.screen.width, 50);
    panel.fill({ color: 0x2c3e50, alpha: 0.9 });
    this.resourcesDisplay.addChild(panel);
    
    // Icons und Zahlen für Ressourcen werden später mit echten Daten gefüllt
    const resourceIcons = [
      { icon: '👑', label: 'Gold', value: 0, color: 0xFFD700 },
      { icon: '🌾', label: 'Food', value: 0, color: 0xDEB887 },
      { icon: '🪵', label: 'Wood', value: 0, color: 0x8B4513 },
      { icon: '🪨', label: 'Stone', value: 0, color: 0x808080 },
      { icon: '⚔️', label: 'Iron', value: 0, color: 0x708090 },
      { icon: '👥', label: 'Pop', value: 0, color: 0x4169E1 }
    ];
    
    resourceIcons.forEach((res, idx) => {
      const x = 20 + idx * 130;
      
      const text = new PIXI.Text({
        text: `${res.icon} ${res.value}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: res.color,
          fontWeight: 'bold'
        }
      });
      text.x = x;
      text.y = 15;
      this.resourcesDisplay.addChild(text);
    });
    
    this.resourcesDisplay.y = 0;
  }

  private createViewSwitcher(): void {
    const viewModes: Array<{ icon: string; type: ViewMode['type']; tooltip: string }> = [
      { icon: '🏰', type: 'isometric', tooltip: 'Isometrische Ansicht' },
      { icon: '🗺️', type: 'map', tooltip: 'Strategiekarte' },
      { icon: '👥', type: 'population', tooltip: 'Bevölkerung' },
      { icon: '⚔️', type: 'military', tooltip: 'Militär' },
      { icon: '💰', type: 'economy', tooltip: 'Wirtschaft' }
    ];
    
    viewModes.forEach((mode, idx) => {
      const btn = this.createIconButton(
        mode.icon,
        20 + idx * 60,
        this.app.screen.height - 60,
        () => this.switchView(mode.type)
      );
      this.uiLayer.addChild(btn);
    });
  }

  private createMinimap(): void {
    const minimapSize = 150;
    const minimapX = this.app.screen.width - minimapSize - 20;
    const minimapY = this.app.screen.height - minimapSize - 20;
    
    const minimap = new PIXI.Graphics();
    minimap.rect(0, 0, minimapSize, minimapSize);
    minimap.fill({ color: 0x1a1a2e, alpha: 0.8 });
    minimap.stroke({ width: 2, color: 0xFFD700 });
    minimap.x = minimapX;
    minimap.y = minimapY;
    
    const title = new PIXI.Text({
      text: 'Minimap',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xFFFFFF
      }
    });
    title.x = 5;
    title.y = 5;
    minimap.addChild(title);
    
    this.uiLayer.addChild(minimap);
  }

  private createBuildMenu(): void {
    const buildingTypes = [
      { icon: '🏠', name: 'Haus', type: 'house', cost: 100 },
      { icon: '🏪', name: 'Markt', type: 'market', cost: 500 },
      { icon: '🏭', name: 'Farm', type: 'farm', cost: 300 },
      { icon: '⛪', name: 'Kirche', type: 'church', cost: 1000 },
      { icon: '🏰', name: 'Kaserne', type: 'barracks', cost: 800 }
    ];
    
    const menuX = this.app.screen.width / 2 - (buildingTypes.length * 60) / 2;
    
    buildingTypes.forEach((building, idx) => {
      const btn = this.createBuildingButton(
        building.icon,
        menuX + idx * 70,
        this.app.screen.height - 60,
        building.type,
        building.cost
      );
      this.uiLayer.addChild(btn);
    });
  }

  private createIconButton(icon: string, x: number, y: number, onClick: () => void): PIXI.Container {
    const btn = new PIXI.Container();
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 50, 50);
    bg.fill({ color: 0x3498db, alpha: 0.9 });
    bg.stroke({ width: 2, color: 0x2980b9 });
    btn.addChild(bg);
    
    const text = new PIXI.Text({
      text: icon,
      style: {
        fontFamily: 'Arial',
        fontSize: 24
      }
    });
    text.anchor.set(0.5);
    text.x = 25;
    text.y = 25;
    btn.addChild(text);
    
    btn.on('pointerdown', onClick);
    
    // Hover-Effekt
    btn.on('pointerover', () => {
      bg.clear();
      bg.rect(0, 0, 50, 50);
      bg.fill({ color: 0x5DADE2, alpha: 0.9 });
      bg.stroke({ width: 2, color: 0x2980b9 });
    });
    
    btn.on('pointerout', () => {
      bg.clear();
      bg.rect(0, 0, 50, 50);
      bg.fill({ color: 0x3498db, alpha: 0.9 });
      bg.stroke({ width: 2, color: 0x2980b9 });
    });
    
    return btn;
  }

  private createBuildingButton(icon: string, x: number, y: number, type: string, cost: number): PIXI.Container {
    const btn = new PIXI.Container();
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 60, 60);
    bg.fill({ color: 0x27ae60, alpha: 0.9 });
    bg.stroke({ width: 2, color: 0x229954 });
    btn.addChild(bg);
    
    const iconText = new PIXI.Text({
      text: icon,
      style: {
        fontFamily: 'Arial',
        fontSize: 28
      }
    });
    iconText.anchor.set(0.5);
    iconText.x = 30;
    iconText.y = 25;
    btn.addChild(iconText);
    
    const costText = new PIXI.Text({
      text: `${cost}👑`,
      style: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xFFD700
      }
    });
    costText.anchor.set(0.5);
    costText.x = 30;
    costText.y = 50;
    btn.addChild(costText);
    
    btn.on('pointerdown', () => this.placeBuilding(type));
    
    return btn;
  }

  private startGameLoop(): void {
    this.app.ticker.add((ticker) => {
      const deltaTime = ticker.deltaMS;
      
      // Partikel aktualisieren
      this.updateParticles(deltaTime);
      
      // Wetter-Effekte
      if (this.weatherEnabled) {
        this.updateWeather(deltaTime);
      }
      
      // Tag/Nacht-Zyklus
      this.updateDayNightCycle(deltaTime);
      
      // Animationen für Gebäude
      this.updateBuildingAnimations(deltaTime);
    });
  }

  // ==================== RENDERING ====================

  public renderKingdom(kingdom: Kingdom): void {
    if (!this.isInitialized) {
      console.warn('Renderer not initialized yet');
      return;
    }
    
    // Aktuelle Ansicht rendern
    switch (this.currentView.type) {
      case 'isometric':
        this.renderIsometricView(kingdom);
        break;
      case 'map':
        this.renderMapView(kingdom);
        break;
      case 'population':
        this.renderPopulationView(kingdom);
        break;
      case 'military':
        this.renderMilitaryView(kingdom);
        break;
      case 'economy':
        this.renderEconomyView(kingdom);
        break;
    }
    
    // Ressourcen aktualisieren
    this.updateResourcesWithKingdom(kingdom);
  }

  private renderIsometricView(kingdom: Kingdom): void {
    this.isometricLayer.removeChildren();
    this.mapLayer.visible = false;
    this.isometricLayer.visible = true;
    
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    // Boden-Grid zeichnen (isometrisch)
    this.drawIsometricGrid(centerX, centerY);
    
    // Landschaft
    this.drawIsometricTerrain(kingdom, centerX, centerY);
    
    // Gebäude isometrisch zeichnen
    this.drawIsometricBuildings(kingdom, centerX, centerY);
    
    // Bevölkerung als kleine Figuren
    this.drawIsometricCitizens(kingdom, centerX, centerY);
  }

  private drawIsometricGrid(centerX: number, centerY: number): void {
    const grid = new PIXI.Graphics();
    const tileWidth = 64;
    const tileHeight = 32;
    const gridSize = 15;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = centerX + (col - row) * (tileWidth / 2);
        const y = centerY + (col + row) * (tileHeight / 2) - 300;
        
        // Isometrische Raute
        grid.moveTo(x, y);
        grid.lineTo(x + tileWidth / 2, y + tileHeight / 2);
        grid.lineTo(x, y + tileHeight);
        grid.lineTo(x - tileWidth / 2, y + tileHeight / 2);
        grid.closePath();
        grid.stroke({ width: 1, color: 0x34495e, alpha: 0.3 });
      }
    }
    
    this.isometricLayer.addChild(grid);
  }

  private drawIsometricTerrain(kingdom: Kingdom, centerX: number, centerY: number): void {
    // Gelände basierend auf Klima zeichnen
    const terrainColors: Record<string, number> = {
      'temperate': 0x7CFC00,
      'arid': 0xF4A460,
      'cold': 0xE0FFFF,
      'tropical': 0x228B22,
      'mountainous': 0x8B8B7A,
      'coastal': 0xF0E68C
    };
    
    const baseColor = terrainColors[kingdom.climate] || 0x7CFC00;
    
    const terrain = new PIXI.Graphics();
    const tileWidth = 64;
    const tileHeight = 32;
    const gridSize = 15;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = centerX + (col - row) * (tileWidth / 2);
        const y = centerY + (col + row) * (tileHeight / 2) - 300;
        
        // Farbvariationen für natürlicheres Aussehen
        const variation = Math.random() * 0x202020;
        const tileColor = baseColor + variation;
        
        terrain.moveTo(x, y);
        terrain.lineTo(x + tileWidth / 2, y + tileHeight / 2);
        terrain.lineTo(x, y + tileHeight);
        terrain.lineTo(x - tileWidth / 2, y + tileHeight / 2);
        terrain.closePath();
        terrain.fill({ color: tileColor, alpha: 0.8 });
      }
    }
    
    this.isometricLayer.addChild(terrain);
    
    // Wälder als Bäume
    if (kingdom.terrain.forests > 20) {
      this.drawIsometricForests(centerX, centerY);
    }
  }

  private drawIsometricForests(centerX: number, centerY: number): void {
    const treeCount = 30;
    
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      this.drawIsometricTree(x, y);
    }
  }

  private drawIsometricTree(x: number, y: number): void {
    const tree = new PIXI.Graphics();
    
    // Stamm
    tree.moveTo(x, y);
    tree.lineTo(x - 4, y + 20);
    tree.lineTo(x + 4, y + 20);
    tree.closePath();
    tree.fill({ color: 0x8B4513 });
    
    // Krone (mehrere Ebenen)
    const crownLevels = [
      { y: y - 10, size: 20, color: 0x228B22 },
      { y: y - 5, size: 16, color: 0x32CD32 },
      { y: y, size: 12, color: 0x3CB371 }
    ];
    
    crownLevels.forEach(level => {
      tree.moveTo(x, level.y - level.size / 2);
      tree.lineTo(x + level.size / 2, level.y);
      tree.lineTo(x, level.y + level.size / 2);
      tree.lineTo(x - level.size / 2, level.y);
      tree.closePath();
      tree.fill({ color: level.color });
    });
    
    this.isometricLayer.addChild(tree);
  }

  private drawIsometricBuildings(kingdom: Kingdom, centerX: number, centerY: number): void {
    // Schloss in der Mitte
    this.drawIsometricCastle(centerX, centerY - 100);
    
    // Gebäude in Ringen um das Schloss
    const buildingTypes = [
      { type: 'market', count: kingdom.infrastructure.markets, color: 0xFFD700, icon: '🏪' },
      { type: 'farm', count: kingdom.infrastructure.farms, color: 0x8FBC8F, icon: '🏭' },
      { type: 'barracks', count: kingdom.infrastructure.barracks, color: 0xDC143C, icon: '⚔️' },
      { type: 'church', count: kingdom.infrastructure.churches, color: 0xF5DEB3, icon: '⛪' }
    ];
    
    let angle = 0;
    buildingTypes.forEach((building, ringIdx) => {
      const radius = 150 + ringIdx * 80;
      const angleStep = (Math.PI * 2) / Math.max(building.count, 1);
      
      for (let i = 0; i < building.count; i++) {
        const bldgAngle = angle + i * angleStep;
        const x = centerX + Math.cos(bldgAngle) * radius;
        const y = centerY + Math.sin(bldgAngle) * radius;
        
        this.drawIsometricBuilding(x, y, building.type, building.color, building.icon);
      }
      
      angle += angleStep * 0.5;
    });
  }

  private drawIsometricCastle(x: number, y: number): void {
    const castle = new PIXI.Graphics();
    
    // Hauptgebäude (isometrisch)
    const baseWidth = 80;
    const baseHeight = 40;
    const buildingHeight = 60;
    
    // Vorderseite
    castle.moveTo(x, y);
    castle.lineTo(x + baseWidth / 2, y + baseHeight / 2);
    castle.lineTo(x + baseWidth / 2, y + baseHeight / 2 + buildingHeight);
    castle.lineTo(x, y + buildingHeight);
    castle.closePath();
    castle.fill({ color: 0x8B7355 });
    
    // Rechte Seite
    castle.moveTo(x, y);
    castle.lineTo(x - baseWidth / 2, y + baseHeight / 2);
    castle.lineTo(x - baseWidth / 2, y + baseHeight / 2 + buildingHeight);
    castle.lineTo(x, y + buildingHeight);
    castle.closePath();
    castle.fill({ color: 0x6B5345 });
    
    // Dach
    castle.moveTo(x, y - 20);
    castle.lineTo(x + baseWidth / 2, y + baseHeight / 2 - 20);
    castle.lineTo(x, y + baseHeight - 20);
    castle.lineTo(x - baseWidth / 2, y + baseHeight / 2 - 20);
    castle.closePath();
    castle.fill({ color: 0xDC143C });
    
    // Türme
    this.drawIsometricTower(castle, x - 30, y + 10);
    this.drawIsometricTower(castle, x + 30, y + 10);
    
    // Flagge
    const flag = new PIXI.Graphics();
    flag.rect(x - 5, y - 40, 15, 10);
    flag.fill({ color: 0xFF0000 });
    castle.addChild(flag);
    
    this.isometricLayer.addChild(castle);
  }

  private drawIsometricTower(parent: PIXI.Graphics, x: number, y: number): void {
    const towerWidth = 20;
    const towerHeight = 80;
    
    // Turm
    parent.moveTo(x, y);
    parent.lineTo(x + towerWidth / 2, y + 10);
    parent.lineTo(x + towerWidth / 2, y + 10 + towerHeight);
    parent.lineTo(x, y + towerHeight);
    parent.closePath();
    parent.fill({ color: 0x9B8B7A });
    
    // Turmspitze
    parent.moveTo(x, y - 15);
    parent.lineTo(x + towerWidth / 2, y - 5);
    parent.lineTo(x, y + 5);
    parent.lineTo(x - towerWidth / 2, y - 5);
    parent.closePath();
    parent.fill({ color: 0x8B0000 });
  }

  private drawIsometricBuilding(x: number, y: number, _type: string, color: number, icon: string): void {
    const building = new PIXI.Container();
    building.x = x;
    building.y = y;
    
    const graphics = new PIXI.Graphics();
    
    const width = 40;
    const height = 20;
    const buildingHeight = 40;
    
    // Vorderseite
    graphics.moveTo(0, 0);
    graphics.lineTo(width / 2, height / 2);
    graphics.lineTo(width / 2, height / 2 + buildingHeight);
    graphics.lineTo(0, buildingHeight);
    graphics.closePath();
    graphics.fill({ color });
    
    // Rechte Seite (dunkler)
    graphics.moveTo(0, 0);
    graphics.lineTo(-width / 2, height / 2);
    graphics.lineTo(-width / 2, height / 2 + buildingHeight);
    graphics.lineTo(0, buildingHeight);
    graphics.closePath();
    graphics.fill({ color: color - 0x202020 });
    
    // Dach
    graphics.moveTo(0, -10);
    graphics.lineTo(width / 2, height / 2 - 10);
    graphics.lineTo(0, height - 10);
    graphics.lineTo(-width / 2, height / 2 - 10);
    graphics.closePath();
    graphics.fill({ color: 0x8B4513 });
    
    building.addChild(graphics);
    
    // Icon
    const iconText = new PIXI.Text({
      text: icon,
      style: {
        fontFamily: 'Arial',
        fontSize: 20
      }
    });
    iconText.anchor.set(0.5);
    iconText.y = 15;
    building.addChild(iconText);
    
    building.eventMode = 'static';
    building.cursor = 'pointer';
    
    this.isometricLayer.addChild(building);
    
    // In buildings array speichern für Interaktivität
    this.buildings.push({
      id: `building-${this.buildings.length}`,
      type: _type,
      x,
      y,
      sprite: building,
      data: { color, icon }
    });
  }

  private drawIsometricCitizens(kingdom: Kingdom, centerX: number, centerY: number): void {
    const totalPop = Object.values(kingdom.population).reduce((sum, val) => sum + val, 0);
    const citizenCount = Math.min(100, Math.floor(totalPop / 100));
    
    for (let i = 0; i < citizenCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 250;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      this.drawIsometricCitizen(x, y);
    }
  }

  private drawIsometricCitizen(x: number, y: number): void {
    const citizen = new PIXI.Graphics();
    
    // Körper
    citizen.rect(x - 2, y - 6, 4, 12);
    citizen.fill({ color: this.randomCitizenColor() });
    
    // Kopf
    citizen.circle(x, y - 8, 3);
    citizen.fill({ color: 0xFFDBAC });
    
    this.isometricLayer.addChild(citizen);
    
    // Bewegungsanimation (später)
  }

  private randomCitizenColor(): number {
    const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private renderMapView(kingdom: Kingdom): void {
    this.mapLayer.removeChildren();
    this.isometricLayer.visible = false;
    this.mapLayer.visible = true;
    
    // Strategiekarte von oben
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    // Hintergrund
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color: 0x2C5F2D });
    this.mapLayer.addChild(bg);
    
    // Regionen zeichnen
    this.drawRegions(kingdom);
    
    // Grenzen
    this.drawBorders();
  }

  private drawRegions(kingdom: Kingdom): void {
    // Beispiel-Regionen (später mit echten Daten)
    const regions = [
      { name: 'Nord', x: 200, y: 150, population: kingdom.population.peasants * 0.3 },
      { name: 'Süd', x: 200, y: 400, population: kingdom.population.peasants * 0.3 },
      { name: 'Ost', x: 450, y: 275, population: kingdom.population.peasants * 0.2 },
      { name: 'West', x: 50, y: 275, population: kingdom.population.peasants * 0.2 }
    ];
    
    regions.forEach(region => {
      const circle = new PIXI.Graphics();
      const radius = 50 + (region.population / 100);
      circle.circle(region.x, region.y, radius);
      circle.fill({ color: 0x7CFC00, alpha: 0.6 });
      circle.stroke({ width: 2, color: 0x228B22 });
      
      const text = new PIXI.Text({
        text: region.name,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0x000000,
          fontWeight: 'bold'
        }
      });
      text.anchor.set(0.5);
      text.x = region.x;
      text.y = region.y;
      
      this.mapLayer.addChild(circle);
      this.mapLayer.addChild(text);
    });
  }

  private drawBorders(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    const border = new PIXI.Graphics();
    border.rect(20, 70, width - 40, height - 150);
    border.stroke({ width: 3, color: 0x8B4513 });
    this.mapLayer.addChild(border);
  }

  private renderPopulationView(kingdom: Kingdom): void {
    this.isometricLayer.visible = false;
    this.mapLayer.removeChildren();
    this.mapLayer.visible = true;
    
    // Bevölkerungs-Dashboard
    const width = this.app.screen.width;
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, width, this.app.screen.height);
    bg.fill({ color: 0x1a1a2e });
    this.mapLayer.addChild(bg);
    
    const title = new PIXI.Text({
      text: '👥 Bevölkerungs-Übersicht',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: 0xFFD700,
        fontWeight: 'bold'
      }
    });
    title.x = 50;
    title.y = 100;
    this.mapLayer.addChild(title);
    
    // Balkendiagramm für Bevölkerungsklassen
    this.drawPopulationBars(kingdom, 50, 180);
  }

  private drawPopulationBars(kingdom: Kingdom, startX: number, startY: number): void {
    const popClasses = [
      { label: 'Adlige', value: kingdom.population.nobles, color: 0x9B59B6 },
      { label: 'Händler', value: kingdom.population.merchants, color: 0xF39C12 },
      { label: 'Soldaten', value: kingdom.population.soldiers, color: 0xE74C3C },
      { label: 'Geistliche', value: kingdom.population.clergy, color: 0xECF0F1 },
      { label: 'Bauern', value: kingdom.population.peasants, color: 0x7CFC00 },
      { label: 'Handwerker', value: kingdom.population.artisans, color: 0x3498DB },
      { label: 'Gelehrte', value: kingdom.population.scholars, color: 0x1ABC9C }
    ];
    
    const maxValue = Math.max(...popClasses.map(p => p.value));
    const barHeight = 30;
    const maxBarWidth = 400;
    
    popClasses.forEach((popClass, idx) => {
      const y = startY + idx * (barHeight + 20);
      const barWidth = (popClass.value / maxValue) * maxBarWidth;
      
      // Label
      const label = new PIXI.Text({
        text: popClass.label,
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xFFFFFF
        }
      });
      label.x = startX;
      label.y = y;
      this.mapLayer.addChild(label);
      
      // Balken
      const bar = new PIXI.Graphics();
      bar.rect(startX + 150, y, barWidth, barHeight);
      bar.fill({ color: popClass.color });
      this.mapLayer.addChild(bar);
      
      // Wert
      const valueText = new PIXI.Text({
        text: popClass.value.toString(),
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xFFFFFF,
          fontWeight: 'bold'
        }
      });
      valueText.x = startX + 150 + barWidth + 10;
      valueText.y = y + 8;
      this.mapLayer.addChild(valueText);
    });
  }

  private renderMilitaryView(kingdom: Kingdom): void {
    this.isometricLayer.visible = false;
    this.mapLayer.removeChildren();
    this.mapLayer.visible = true;
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.fill({ color: 0x2C3E50 });
    this.mapLayer.addChild(bg);
    
    const title = new PIXI.Text({
      text: '⚔️ Militär-Kommando',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: 0xFF0000,
        fontWeight: 'bold'
      }
    });
    title.x = 50;
    title.y = 100;
    this.mapLayer.addChild(title);
    
    // Truppenstärke anzeigen
    this.drawMilitaryStrength(kingdom, 50, 180);
  }

  private drawMilitaryStrength(kingdom: Kingdom, startX: number, startY: number): void {
    const troops = [
      { label: 'Infanterie', value: kingdom.military.infantry, icon: '🗡️', color: 0xC0392B },
      { label: 'Kavallerie', value: kingdom.military.cavalry, icon: '🐴', color: 0x3498DB },
      { label: 'Bogenschützen', value: kingdom.military.archers, icon: '🏹', color: 0x27AE60 },
      { label: 'Belagerung', value: kingdom.military.siege, icon: '🏰', color: 0x95A5A6 },
      { label: 'Marine', value: kingdom.military.navy, icon: '⛵', color: 0x1ABC9C }
    ];
    
    troops.forEach((troop, idx) => {
      const x = startX + (idx % 3) * 250;
      const y = startY + Math.floor(idx / 3) * 150;
      
      // Icon
      const iconText = new PIXI.Text({
        text: troop.icon,
        style: {
          fontFamily: 'Arial',
          fontSize: 48
        }
      });
      iconText.x = x;
      iconText.y = y;
      this.mapLayer.addChild(iconText);
      
      // Label
      const label = new PIXI.Text({
        text: troop.label,
        style: {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: troop.color,
          fontWeight: 'bold'
        }
      });
      label.x = x + 60;
      label.y = y + 10;
      this.mapLayer.addChild(label);
      
      // Anzahl
      const count = new PIXI.Text({
        text: troop.value.toString(),
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: 0xFFFFFF,
          fontWeight: 'bold'
        }
      });
      count.x = x + 60;
      count.y = y + 35;
      this.mapLayer.addChild(count);
    });
  }

  private renderEconomyView(kingdom: Kingdom): void {
    this.isometricLayer.visible = false;
    this.mapLayer.removeChildren();
    this.mapLayer.visible = true;
    
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.fill({ color: 0x16213E });
    this.mapLayer.addChild(bg);
    
    const title = new PIXI.Text({
      text: '💰 Wirtschafts-Übersicht',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: 0xFFD700,
        fontWeight: 'bold'
      }
    });
    title.x = 50;
    title.y = 100;
    this.mapLayer.addChild(title);
    
    // Ressourcen-Kreisdiagramm
    this.drawResourcePieChart(kingdom, 300, 350);
  }

  private drawResourcePieChart(kingdom: Kingdom, centerX: number, centerY: number): void {
    const resources = [
      { label: 'Gold', value: kingdom.resources.gold, color: 0xFFD700 },
      { label: 'Nahrung', value: kingdom.resources.food, color: 0xDEB887 },
      { label: 'Holz', value: kingdom.resources.wood, color: 0x8B4513 },
      { label: 'Stein', value: kingdom.resources.stone, color: 0x808080 },
      { label: 'Eisen', value: kingdom.resources.iron, color: 0x708090 }
    ];
    
    const total = resources.reduce((sum, r) => sum + r.value, 0);
    let currentAngle = 0;
    const radius = 120;
    
    resources.forEach(resource => {
      const sliceAngle = (resource.value / total) * Math.PI * 2;
      
      const slice = new PIXI.Graphics();
      slice.moveTo(centerX, centerY);
      slice.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      slice.closePath();
      slice.fill({ color: resource.color });
      this.mapLayer.addChild(slice);
      
      // Label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 50);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 50);
      
      const label = new PIXI.Text({
        text: `${resource.label}\n${resource.value}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xFFFFFF,
          align: 'center'
        }
      });
      label.anchor.set(0.5);
      label.x = labelX;
      label.y = labelY;
      this.mapLayer.addChild(label);
      
      currentAngle += sliceAngle;
    });
  }

  private updateResourcesWithKingdom(kingdom: Kingdom): void {
    this.resourcesDisplay.removeChildren();
    
    const panel = new PIXI.Graphics();
    panel.rect(0, 0, this.app.screen.width, 50);
    panel.fill({ color: 0x2c3e50, alpha: 0.9 });
    this.resourcesDisplay.addChild(panel);
    
    const totalPop = Object.values(kingdom.population).reduce((sum, val) => sum + val, 0);
    
    const resourceIcons = [
      { icon: '👑', label: 'Gold', value: kingdom.resources.gold, color: 0xFFD700 },
      { icon: '🌾', label: 'Food', value: kingdom.resources.food, color: 0xDEB887 },
      { icon: '🪵', label: 'Wood', value: kingdom.resources.wood, color: 0x8B4513 },
      { icon: '🪨', label: 'Stone', value: kingdom.resources.stone, color: 0x808080 },
      { icon: '⚔️', label: 'Iron', value: kingdom.resources.iron, color: 0x708090 },
      { icon: '👥', label: 'Pop', value: totalPop, color: 0x4169E1 }
    ];
    
    resourceIcons.forEach((res, idx) => {
      const x = 20 + idx * 130;
      
      const text = new PIXI.Text({
        text: `${res.icon} ${Math.floor(res.value)}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: res.color,
          fontWeight: 'bold'
        }
      });
      text.x = x;
      text.y = 15;
      this.resourcesDisplay.addChild(text);
    });
  }

  // ==================== WETTERSYSTEM ====================

  private updateWeather(_deltaTime: number): void {
    if (this.currentWeather === 'rain') {
      // Regen-Partikel erzeugen
      if (Math.random() < 0.3) {
        this.createRainDrop();
      }
    } else if (this.currentWeather === 'snow') {
      // Schnee-Partikel erzeugen
      if (Math.random() < 0.2) {
        this.createSnowflake();
      }
    }
  }

  private createRainDrop(): void {
    const x = Math.random() * this.app.screen.width;
    const y = -10;
    
    const drop = new PIXI.Graphics();
    drop.rect(0, 0, 2, 10);
    drop.fill({ color: 0x4169E1, alpha: 0.6 });
    drop.x = x;
    drop.y = y;
    
    this.particles.push({
      sprite: drop,
      vx: 0,
      vy: 10,
      life: 1,
      maxLife: 1,
      type: 'rain'
    });
    
    this.particleLayer.addChild(drop);
  }

  private createSnowflake(): void {
    const x = Math.random() * this.app.screen.width;
    const y = -10;
    
    const flake = new PIXI.Graphics();
    flake.circle(0, 0, 3);
    flake.fill({ color: 0xFFFFFF, alpha: 0.8 });
    flake.x = x;
    flake.y = y;
    
    this.particles.push({
      sprite: flake,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      life: 1,
      maxLife: 1,
      type: 'snow'
    });
    
    this.particleLayer.addChild(flake);
  }

  public setWeather(weather: 'clear' | 'rain' | 'snow' | 'storm'): void {
    this.currentWeather = weather;
  }

  // ==================== TAG/NACHT-ZYKLUS ====================

  private updateDayNightCycle(deltaTime: number): void {
    // Zeit fortschreiten (1 Stunde = 10 Sekunden)
    this.timeOfDay += (deltaTime / 10000);
    if (this.timeOfDay >= 24) {
      this.timeOfDay = 0;
    }
    
    // Himmelfarbe anpassen
    this.updateSkyColor();
  }

  private updateSkyColor(): void {
    let skyColor: number;
    
    if (this.timeOfDay >= 6 && this.timeOfDay < 18) {
      // Tag (6:00 - 18:00)
      skyColor = 0x87CEEB;
    } else if (this.timeOfDay >= 18 && this.timeOfDay < 20) {
      // Abend (18:00 - 20:00)
      skyColor = 0xFF6347;
    } else if (this.timeOfDay >= 20 || this.timeOfDay < 5) {
      // Nacht (20:00 - 5:00)
      skyColor = 0x191970;
    } else {
      // Morgen (5:00 - 6:00)
      skyColor = 0xFFA500;
    }
    
    this.app.renderer.background.color = skyColor;
  }

  // ==================== PARTIKELSYSTEM ====================

  private updateParticles(deltaTime: number): void {
    const deltaSeconds = deltaTime / 1000;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Position aktualisieren
      particle.sprite.x += particle.vx * deltaSeconds * 60;
      particle.sprite.y += particle.vy * deltaSeconds * 60;
      
      // Leben verringern
      particle.life -= deltaSeconds * 0.5;
      
      // Partikel außerhalb des Bildschirms oder tot entfernen
      if (particle.sprite.y > this.app.screen.height || particle.life <= 0) {
        particle.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  public createParticleEffect(x: number, y: number, type: GameParticle['type'], count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const particle = new PIXI.Graphics();
      
      let color: number;
      let size: number;
      
      switch (type) {
        case 'coin':
          color = 0xFFD700;
          size = 3;
          break;
        case 'heart':
          color = 0xFF69B4;
          size = 4;
          break;
        case 'spark':
          color = 0xFFFF00;
          size = 2;
          break;
        case 'smoke':
          color = 0x808080;
          size = 5;
          break;
        default:
          color = 0xFFFFFF;
          size = 2;
      }
      
      particle.circle(0, 0, size);
      particle.fill({ color });
      particle.x = x;
      particle.y = y;
      
      this.particles.push({
        sprite: particle,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 8,
        life: 1,
        maxLife: 1,
        type
      });
      
      this.particleLayer.addChild(particle);
    }
  }

  // ==================== GEBÄUDE-ANIMATIONEN ====================

  private updateBuildingAnimations(_deltaTime: number): void {
    // Gebäude leicht animieren (z.B. Rauch aus Schornsteinen)
    this.buildings.forEach(building => {
      if (building.type === 'farm' || building.type === 'house') {
        // Gelegentlich Rauch erzeugen
        if (Math.random() < 0.01) {
          this.createParticleEffect(building.sprite.x, building.sprite.y - 30, 'smoke', 3);
        }
      }
    });
  }

  // ==================== INTERAKTIVITÄT ====================

  private getBuildingAt(screenX: number, screenY: number): InteractiveBuilding | null {
    const worldPos = this.screenToWorld(screenX, screenY);
    
    for (const building of this.buildings) {
      const dx = worldPos.x - building.sprite.x;
      const dy = worldPos.y - building.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) {
        return building;
      }
    }
    
    return null;
  }

  private selectBuilding(building: InteractiveBuilding): void {
    // Vorherige Auswahl deselektieren
    if (this.selectedBuilding) {
      this.selectedBuilding.sprite.alpha = 1;
    }
    
    this.selectedBuilding = building;
    building.sprite.alpha = 0.8;
    
    // Effekt anzeigen
    this.createParticleEffect(building.sprite.x, building.sprite.y, 'spark', 10);
    
    console.log('Selected building:', building.type, building.id);
  }

  private updateBuildingPosition(building: InteractiveBuilding): void {
    building.x = building.sprite.x;
    building.y = building.sprite.y;
  }

  private placeBuilding(type: string): void {
    console.log('Place building:', type);
    // Hier würde die Logik zum Platzieren eines neuen Gebäudes kommen
    // Für jetzt nur eine Benachrichtigung
    this.createParticleEffect(this.app.screen.width / 2, this.app.screen.height / 2, 'coin', 30);
  }

  private updateTooltip(x: number, y: number): void {
    this.tooltipLayer.removeChildren();
    
    const building = this.getBuildingAt(x, y);
    if (building) {
      const tooltip = new PIXI.Container();
      
      const bg = new PIXI.Graphics();
      bg.rect(0, 0, 150, 60);
      bg.fill({ color: 0x000000, alpha: 0.8 });
      bg.stroke({ width: 2, color: 0xFFD700 });
      tooltip.addChild(bg);
      
      const text = new PIXI.Text({
        text: `${building.data.icon} ${building.type}\nID: ${building.id}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xFFFFFF
        }
      });
      text.x = 10;
      text.y = 10;
      tooltip.addChild(text);
      
      tooltip.x = x + 10;
      tooltip.y = y - 70;
      
      this.tooltipLayer.addChild(tooltip);
    }
  }

  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.worldContainer.x) / this.currentView.zoom,
      y: (screenY - this.worldContainer.y) / this.currentView.zoom
    };
  }

  private switchView(viewType: ViewMode['type']): void {
    this.currentView.type = viewType;
    console.log('Switched to view:', viewType);
    
    // Render wird beim nächsten renderKingdom-Aufruf aktualisiert
  }

  private handleKeyPress(e: KeyboardEvent): void {
    switch (e.key) {
      case '1':
        this.switchView('isometric');
        break;
      case '2':
        this.switchView('map');
        break;
      case '3':
        this.switchView('population');
        break;
      case '4':
        this.switchView('military');
        break;
      case '5':
        this.switchView('economy');
        break;
      case 'r':
        this.setWeather('rain');
        break;
      case 's':
        this.setWeather('snow');
        break;
      case 'c':
        this.setWeather('clear');
        break;
      case ' ':
        // Space: Partikeleffekt
        this.createParticleEffect(
          this.app.screen.width / 2,
          this.app.screen.height / 2,
          'spark',
          50
        );
        break;
    }
  }

  // ==================== HILFSMETHODEN ====================

  public getViewMode(): ViewMode {
    return { ...this.currentView };
  }

  public destroy(): void {
    this.particles.forEach(p => p.sprite.destroy());
    this.particles = [];
    this.buildings = [];
    this.app.destroy(true, { children: true, texture: true, textureSource: true });
  }
}
