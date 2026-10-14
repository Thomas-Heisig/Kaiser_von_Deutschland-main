// src/ui/Graphics.ts
import * as PIXI from 'pixi.js';
import { Kingdom, ClimateType, Season } from '../core/Kingdom';

export type RenderLayer = 'terrain' | 'infrastructure' | 'military' | 'population' | 'resources' | 'overlay';
export type AnimationType = 'movement' | 'construction' | 'destruction' | 'highlight' | 'particle';

export interface RenderOptions {
  showGrid?: boolean;
  showLabels?: boolean;
  showFogOfWar?: boolean;
  zoomLevel?: number;
  panX?: number;
  panY?: number;
  highlightBuilding?: string;
  activeLayer?: RenderLayer;
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  season?: Season;
}

export interface AnimationConfig {
  type: AnimationType;
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  duration: number;
  color?: string;
  size?: number;
  onComplete?: () => void;
  startTime?: number;
}

export interface Particle {
  sprite: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class Graphics {
  private app: PIXI.Application;
  private container: HTMLElement;
  private mainContainer: PIXI.Container;
  private terrainLayer: PIXI.Container;
  private infrastructureLayer: PIXI.Container;
  private militaryLayer: PIXI.Container;
  private overlayLayer: PIXI.Container;
  private renderOptions: RenderOptions;
  private animations: AnimationConfig[] = [];
  private particles: Particle[] = [];
  private lastRenderTime: number = 0;
  private currentKingdom?: Kingdom;
  private isInitialized: boolean = false;
  // TODO: Will be used for terrain caching optimization in future
  // @ts-expect-error - Unused until caching is implemented
  private _terrainCache: Map<string, PIXI.RenderTexture> = new Map();
  // TODO: Will be used for building sprite rendering in future
  // @ts-expect-error - Unused until sprite rendering is implemented
  private _buildingSprites: Map<string, PIXI.Texture> = new Map();
  // TODO: Will be used to track sprite loading status in future
  // @ts-expect-error - Unused until sprite loading is implemented
  private _spriteSheetLoaded: boolean = false;

  private constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    
    this.container = element;
    this.app = new PIXI.Application();
    this.mainContainer = new PIXI.Container();
    this.terrainLayer = new PIXI.Container();
    this.infrastructureLayer = new PIXI.Container();
    this.militaryLayer = new PIXI.Container();
    this.overlayLayer = new PIXI.Container();
    
    this.renderOptions = {
      showGrid: true,
      showLabels: true,
      showFogOfWar: false,
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      activeLayer: 'terrain',
      timeOfDay: 'day',
      season: 'spring'
    };
  }

  /**
   * Static factory method to create and initialize Graphics
   */
  public static async create(containerId: string = 'kingdom-map'): Promise<Graphics> {
    const graphics = new Graphics(containerId);
    await graphics.initialize();
    return graphics;
  }

  private async initialize(): Promise<void> {
    // Get container dimensions or use defaults
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 400;

    await this.app.init({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    this.container.appendChild(this.app.canvas);

    // Setup layer hierarchy
    this.mainContainer.addChild(this.terrainLayer);
    this.mainContainer.addChild(this.infrastructureLayer);
    this.mainContainer.addChild(this.militaryLayer);
    this.mainContainer.addChild(this.overlayLayer);
    this.app.stage.addChild(this.mainContainer);

    // Make main container interactive for panning
    this.mainContainer.eventMode = 'static';
    
    await this.loadSprites();
    this.setupInteractivity();
    this.startRenderLoop();
    
    this.isInitialized = true;
  }

  private setupInteractivity(): void {
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    // Handle responsive resizing
    const resizeHandler = () => {
      const width = this.container.clientWidth || 600;
      const height = this.container.clientHeight || 400;
      this.app.renderer.resize(width, height);
    };
    window.addEventListener('resize', resizeHandler);

    // Pan functionality
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      isDragging = true;
      const pos = event.global;
      dragStart = { x: pos.x, y: pos.y };
    });

    this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (isDragging) {
        const pos = event.global;
        const deltaX = pos.x - dragStart.x;
        const deltaY = pos.y - dragStart.y;
        
        this.mainContainer.x += deltaX;
        this.mainContainer.y += deltaY;
        
        this.renderOptions.panX = this.mainContainer.x;
        this.renderOptions.panY = this.mainContainer.y;
        
        dragStart = { x: pos.x, y: pos.y };
      }
    });

    this.app.stage.on('pointerup', () => {
      isDragging = false;
    });

    this.app.stage.on('pointerupoutside', () => {
      isDragging = false;
    });

    // Zoom functionality via wheel
    this.app.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = this.renderOptions.zoomLevel! * zoomFactor;
      this.renderOptions.zoomLevel = Math.max(0.1, Math.min(5, newZoom));
      
      this.mainContainer.scale.set(this.renderOptions.zoomLevel);
    }, { passive: false });

    // Click handling
    this.app.stage.on('click', (event: PIXI.FederatedPointerEvent) => {
      const pos = event.global;
      this.handleCanvasClick(pos.x, pos.y);
    });
  }

  private handleCanvasClick(x: number, y: number): void {
    // Convert screen coordinates to world coordinates
    const worldX = (x - this.renderOptions.panX!) / this.renderOptions.zoomLevel!;
    const worldY = (y - this.renderOptions.panY!) / this.renderOptions.zoomLevel!;

    // Hier könnte Gebäudeauswahl oder andere Interaktionen implementiert werden
    console.log(`Clicked at world coordinates: (${worldX}, ${worldY})`);
  }

  private async loadSprites(): Promise<void> {
    // Platzhalter für echte Sprites - in einem echten Projekt würden hier Bilder geladen
    // Sprite definitions would be loaded here in a real implementation

    // Für dieses Beispiel verwenden wir procedurally generated graphics
    this._spriteSheetLoaded = true;
  }

  private startRenderLoop(): void {
    this.app.ticker.add((ticker) => {
      const deltaTime = ticker.deltaMS;
      this.lastRenderTime += deltaTime;

      // Update Animationen
      this.updateAnimations(deltaTime);
      this.updateParticles(deltaTime);
    });
  }

  public renderKingdom(kingdom: Kingdom, options?: Partial<RenderOptions>): void {
    if (!this.isInitialized) {
      console.warn('Graphics not yet initialized, skipping render');
      return;
    }
    
    this.renderOptions = { ...this.renderOptions, ...options };
    this.currentKingdom = kingdom;
    
    // Clear all layers
    this.terrainLayer.removeChildren();
    this.infrastructureLayer.removeChildren();
    this.militaryLayer.removeChildren();
    this.overlayLayer.removeChildren();

    // Render all layers
    this.renderTerrain(kingdom);
    this.renderInfrastructure(kingdom);
    this.renderMilitary(kingdom);

    if (this.renderOptions.activeLayer === 'population') {
      this.renderPopulation(kingdom);
    }

    if (this.renderOptions.activeLayer === 'resources') {
      this.renderResources(kingdom);
    }

    this.renderOverlay();
  }

  private renderTerrain(kingdom: Kingdom): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Klima-basierter Hintergrund
    const terrainColors = this.getTerrainColors(kingdom.climate, this.renderOptions.season);
    
    // Gelände-Höhenkarte zeichnen
    const background = new PIXI.Graphics();
    background.rect(0, 0, width, height);
    background.fill({ color: terrainColors.base });
    this.terrainLayer.addChild(background);

    // Geländemerkmale basierend auf Terrain-Daten
    const terrain = kingdom.terrain;
    
    // Wälder
    if (terrain.forests > 0) {
      const forestArea = width * height * (terrain.forests / 100) * 0.3;
      this.drawRandomPatches(terrainColors.forest, forestArea, 20, 40, 30, 60);
    }

    // Berge
    if (terrain.mountains > 0) {
      const mountainArea = width * height * (terrain.mountains / 100) * 0.2;
      this.drawMountains(terrainColors.mountain, mountainArea, 50, 80);
    }

    // Hügel
    if (terrain.hills > 0) {
      const hillArea = width * height * (terrain.hills / 100) * 0.4;
      this.drawHills(terrainColors.hill, hillArea, 20, 40);
    }

    // Flüsse (wenn vorhanden)
    this.drawRivers(terrainColors.water, width, height);

    // Straßen
    this.drawRoads(kingdom.infrastructure.roads, width, height);
  }

  private getTerrainColors(climate: ClimateType, _season?: Season): Record<string, number> {
    // Seasonal modifiers could be applied in the future
    const baseColors: Record<ClimateType, Record<string, number>> = {
      temperate: {
        base: 0xcfe8a9,
        forest: 0x5a7d4a,
        mountain: 0x8a7f8d,
        hill: 0x9cb68c,
        water: 0x4a90e2
      },
      arid: {
        base: 0xe8d7b2,
        forest: 0x8b7355,
        mountain: 0xa0522d,
        hill: 0xd2b48c,
        water: 0x87ceeb
      },
      cold: {
        base: 0xe8f4f8,
        forest: 0x2f4f4f,
        mountain: 0x708090,
        hill: 0xa9a9a9,
        water: 0x4682b4
      },
      tropical: {
        base: 0xb8e0d2,
        forest: 0x228b22,
        mountain: 0x556b2f,
        hill: 0x90ee90,
        water: 0x00bfff
      },
      mountainous: {
        base: 0xd3d3d3,
        forest: 0x6b8e23,
        mountain: 0x696969,
        hill: 0xbc8f8f,
        water: 0x1e90ff
      },
      coastal: {
        base: 0xf0e68c,
        forest: 0x32cd32,
        mountain: 0xb8860b,
        hill: 0xdaa520,
        water: 0x4169e1
      }
    };

    return baseColors[climate] || baseColors.temperate;
  }

  private drawRandomPatches(
    color: number,
    _totalArea: number,
    minSize: number,
    maxSize: number,
    count: number,
    spread: number
  ): void {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (this.app.screen.width - spread);
      const y = Math.random() * (this.app.screen.height - spread);
      const size = minSize + Math.random() * (maxSize - minSize);
      
      this.drawTreePatch(color, x, y, size);
    }
  }

  private drawTreePatch(_color: number, x: number, y: number, size: number): void {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    
    // Zeichne mehrere Bäume im Patch
    const treeCount = Math.floor(size / 5);
    for (let i = 0; i < treeCount; i++) {
      const tx = Math.random() * size - size / 2;
      const ty = Math.random() * size - size / 2;
      
      const tree = new PIXI.Graphics();
      
      // Baumkrone
      tree.circle(tx, ty, 4 + Math.random() * 3);
      tree.fill({ color: 0x228b22 });
      
      // Baumstamm
      tree.rect(tx - 1, ty + 3, 2, 6);
      tree.fill({ color: 0x8b4513 });
      
      container.addChild(tree);
    }
    
    this.terrainLayer.addChild(container);
  }

  private drawMountains(color: number, totalArea: number, minHeight: number, maxHeight: number): void {
    const mountainCount = Math.floor(totalArea / 1000);
    
    for (let i = 0; i < mountainCount; i++) {
      const x = Math.random() * this.app.screen.width;
      const y = Math.random() * this.app.screen.height;
      const height = minHeight + Math.random() * (maxHeight - minHeight);
      const width = height * (0.5 + Math.random() * 0.5);
      
      this.drawMountain(color, x, y, width, height);
    }
  }

  private drawMountain(color: number, x: number, y: number, width: number, height: number): void {
    const mountain = new PIXI.Graphics();
    
    // Berg zeichnen
    mountain.moveTo(x, y);
    mountain.lineTo(x - width / 2, y + height);
    mountain.lineTo(x + width / 2, y + height);
    mountain.closePath();
    mountain.fill({ color });
    
    // Schnee auf Spitze (wenn hoch genug)
    if (height > 60) {
      mountain.moveTo(x, y);
      mountain.lineTo(x - width / 4, y + height * 0.3);
      mountain.lineTo(x + width / 4, y + height * 0.3);
      mountain.closePath();
      mountain.fill({ color: 0xffffff });
    }
    
    this.terrainLayer.addChild(mountain);
  }

  private drawHills(color: number, totalArea: number, minHeight: number, maxHeight: number): void {
    const hillCount = Math.floor(totalArea / 500);
    
    for (let i = 0; i < hillCount; i++) {
      const x = Math.random() * this.app.screen.width;
      const y = Math.random() * this.app.screen.height;
      const height = minHeight + Math.random() * (maxHeight - minHeight);
      const width = height * (1 + Math.random());
      
      this.drawHill(color, x, y, width, height);
    }
  }

  private drawHill(color: number, x: number, y: number, width: number, height: number): void {
    const hill = new PIXI.Graphics();
    hill.ellipse(x, y, width / 2, height / 2);
    hill.fill({ color });
    
    this.terrainLayer.addChild(hill);
  }

  private drawRivers(color: number, width: number, height: number): void {
    const river = new PIXI.Graphics();
    river.moveTo(0, 0);
    
    // Zufälliger Flussverlauf
    let x = 0;
    let y = height * 0.3 + Math.random() * height * 0.4;
    
    river.moveTo(x, y);
    
    for (let i = 0; i < 20; i++) {
      x += width / 20;
      y += (Math.random() - 0.5) * 30;
      y = Math.max(height * 0.1, Math.min(height * 0.9, y));
      
      river.lineTo(x, y);
    }
    
    river.stroke({ width: 8, color, cap: 'round' });
    
    this.terrainLayer.addChild(river);
  }

  private drawRoads(roadCount: number, width: number, height: number): void {
    if (roadCount === 0) return;
    
    const roads = new PIXI.Graphics();
    
    // Hauptstraße vom Schloss
    roads.moveTo(width * 0.1, height * 0.5);
    roads.lineTo(width * 0.9, height * 0.5);
    roads.stroke({ width: 4, color: 0x8b4513, cap: 'round' });
    
    // Seitenstraßen
    for (let i = 1; i < roadCount; i++) {
      const angle = (i / roadCount) * Math.PI;
      const roadLength = width * 0.3;
      
      roads.moveTo(width * 0.5, height * 0.5);
      roads.lineTo(
        width * 0.5 + Math.cos(angle) * roadLength,
        height * 0.5 + Math.sin(angle) * roadLength
      );
      roads.stroke({ width: 4, color: 0x8b4513, cap: 'round' });
    }
    
    this.terrainLayer.addChild(roads);
  }

  private renderInfrastructure(kingdom: Kingdom): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Schloss (Zentrum)
    this.drawCastle(centerX - 60, centerY - 40);

    // Gebäude in kreisförmiger Anordnung um das Schloss
    const buildings = [
      { type: 'market', count: kingdom.infrastructure.markets, color: 0xffd166, size: 24 },
      { type: 'farm', count: kingdom.infrastructure.farms, color: 0x7fb069, size: 22 },
      { type: 'barracks', count: kingdom.infrastructure.barracks, color: 0x8b0000, size: 26 },
      { type: 'church', count: kingdom.infrastructure.churches, color: 0xf0e68c, size: 28 },
      { type: 'mine', count: kingdom.infrastructure.mines, color: 0x696969, size: 20 },
      { type: 'school', count: kingdom.infrastructure.schools, color: 0x4682b4, size: 24 },
      { type: 'hospital', count: kingdom.infrastructure.hospitals, color: 0xff6b6b, size: 26 },
      { type: 'port', count: kingdom.infrastructure.ports, color: 0x1e90ff, size: 30 },
      { type: 'workshop', count: kingdom.infrastructure.workshops, color: 0xd2691e, size: 22 }
    ];

    let angleOffset = 0;
    buildings.forEach((building, index) => {
      if (building.count > 0) {
        const radius = 120 + index * 20;
        const angleStep = (Math.PI * 2) / Math.max(1, building.count);
        
        for (let i = 0; i < building.count; i++) {
          const angle = angleOffset + i * angleStep;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          this.drawBuilding(building.type, x, y, building.size, building.color);
        }
        
        angleOffset += building.count * angleStep * 0.1;
      }
    });

    // Mauern (wenn vorhanden)
    if (kingdom.infrastructure.walls > 0) {
      this.drawWalls(centerX, centerY, 150 + kingdom.infrastructure.walls * 10);
    }
  }

  private drawCastle(x: number, y: number): void {
    const castle = new PIXI.Container();
    castle.x = x;
    castle.y = y;
    
    const graphics = new PIXI.Graphics();
    
    // Hauptgebäude
    graphics.rect(0, 0, 120, 80);
    graphics.fill({ color: 0x7f5539 });
    
    // Türme
    graphics.rect(-10, 10, 20, 60); // Linker Turm
    graphics.fill({ color: 0x5b3d2a });
    graphics.rect(110, 10, 20, 60); // Rechter Turm
    graphics.fill({ color: 0x5b3d2a });
    
    // Turmspitzen
    graphics.moveTo(0, 10);
    graphics.lineTo(10, 0);
    graphics.lineTo(20, 10);
    graphics.closePath();
    graphics.fill({ color: 0x8b4513 });
    
    graphics.moveTo(120, 10);
    graphics.lineTo(130, 0);
    graphics.lineTo(140, 10);
    graphics.closePath();
    graphics.fill({ color: 0x8b4513 });
    
    // Tor
    graphics.rect(50, 60, 20, 20);
    graphics.fill({ color: 0x8b4513 });
    
    // Fenster
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        graphics.rect(20 + i * 30, 20 + j * 20, 8, 12);
        graphics.fill({ color: 0xf0e68c });
      }
    }
    
    // Flagge
    graphics.rect(60, -20, 3, 20);
    graphics.fill({ color: 0xff0000 });
    graphics.rect(60, -20, 15, 10);
    graphics.fill({ color: 0xff0000 });
    
    castle.addChild(graphics);
    this.infrastructureLayer.addChild(castle);
  }

  private drawBuilding(type: string, x: number, y: number, size: number, color: number): void {
    const building = new PIXI.Graphics();
    
    // Gebäudegrundform
    building.rect(x - size/2, y - size/2, size, size);
    building.fill({ color });
    
    // Gebäudedetails basierend auf Typ
    switch (type) {
      case 'market':
        building.rect(x - size/4, y - size/2 - 5, size/2, 5); // Dach
        building.fill({ color: 0xb58300 });
        building.rect(x - size/4, y - size/4, size/2, 2); // Theke
        building.fill({ color: 0xffffff });
        break;
        
      case 'farm':
        building.arc(x, y - size/2, size/3, 0, Math.PI); // Strohdach
        building.fill({ color: 0x556b2f });
        break;
        
      case 'barracks':
        building.rect(x - size/2, y - size/2, size, size/3); // Dach
        building.fill({ color: 0x8b0000 });
        building.rect(x - size/4, y - size/6, size/2, size/3); // Tor
        building.fill({ color: 0xffffff });
        break;
        
      case 'church':
        building.moveTo(x - size/2, y - size/2);
        building.lineTo(x, y - size);
        building.lineTo(x + size/2, y - size/2);
        building.closePath();
        building.fill({ color: 0xd4af37 }); // Kirchturmspitze
        building.rect(x - size/6, y - size/2, size/3, size/2); // Turm
        building.fill({ color: 0xd4af37 });
        break;
    }
    
    this.infrastructureLayer.addChild(building);
  }

  private drawWalls(centerX: number, centerY: number, radius: number): void {
    const walls = new PIXI.Graphics();
    
    // Kreisförmige Mauer mit Zinnenmuster
    walls.circle(centerX, centerY, radius);
    walls.stroke({
      width: 8,
      color: 0x8b4513,
      cap: 'butt'
    });
    
    this.infrastructureLayer.addChild(walls);
  }

  private renderMilitary(kingdom: Kingdom): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Infanterie
    this.drawTroops(kingdom.military.infantry, centerX - 200, centerY - 100, 0xa80000, 'infantry');
    
    // Kavallerie
    this.drawTroops(kingdom.military.cavalry, centerX + 200, centerY - 100, 0x1e90ff, 'cavalry');
    
    // Bogenschützen
    this.drawTroops(kingdom.military.archers, centerX, centerY + 150, 0x32cd32, 'archer');
    
    // Belagerungsmaschinen
    if (kingdom.military.siege > 0) {
      this.drawSiegeEngines(kingdom.military.siege, centerX, centerY - 150);
    }
    
    // Marine (wenn an der Küste)
    if (kingdom.climate === 'coastal' && kingdom.military.navy > 0) {
      this.drawNavy(kingdom.military.navy, centerX, centerY + 200);
    }
  }

  private drawTroops(
    count: number, 
    x: number, 
    y: number, 
    color: number,
    type: 'infantry' | 'cavalry' | 'archer'
  ): void {
    if (count === 0) return;
    
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    
    // Truppen in Formation darstellen
    const columns = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / columns);
    const spacing = 15;
    
    for (let i = 0; i < count; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const px = (col - (columns - 1) / 2) * spacing;
      const py = (row - (rows - 1) / 2) * spacing;
      
      const soldier = this.drawSoldier(px, py, color, type);
      container.addChild(soldier);
    }
    
    // Truppenzahl anzeigen
    if (count > 50) {
      const text = new PIXI.Text({
        text: count.toString(),
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0x000000,
          align: 'center'
        }
      });
      text.anchor.set(0.5);
      text.y = rows * spacing / 2 + 20;
      container.addChild(text);
    }
    
    this.militaryLayer.addChild(container);
  }

  private drawSoldier(x: number, y: number, color: number, type: 'infantry' | 'cavalry' | 'archer'): PIXI.Graphics {
    const soldier = new PIXI.Graphics();
    
    // Körper
    soldier.rect(x - 3, y - 8, 6, 16);
    soldier.fill({ color });
    
    // Kopf
    soldier.circle(x, y - 12, 4);
    soldier.fill({ color: 0xffdbac });
    
    // Waffe basierend auf Typ
    switch (type) {
      case 'infantry':
        // Schwert - draw both lines then stroke
        soldier.moveTo(x, y - 4);
        soldier.lineTo(x, y + 8);
        soldier.moveTo(x - 3, y);
        soldier.lineTo(x + 3, y);
        soldier.stroke({ width: 2, color: 0x8b4513 });
        break;
        
      case 'cavalry':
        // Lanze
        soldier.moveTo(x, y - 8);
        soldier.lineTo(x, y + 12);
        soldier.stroke({ width: 2, color: 0x8b4513 });
        // Pferd
        soldier.rect(x - 6, y + 4, 12, 6);
        soldier.fill({ color: 0x8b4513 });
        break;
        
      case 'archer':
        // Bogen
        soldier.arc(x, y, 8, 0, Math.PI);
        soldier.stroke({ width: 2, color: 0x8b4513 });
        break;
    }
    
    return soldier;
  }

  private drawSiegeEngines(count: number, x: number, y: number): void {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const offset = (i - 1) * 40;
      const engine = new PIXI.Graphics();
      
      // Katapult
      engine.rect(offset - 10, -5, 20, 10); // Basis
      engine.fill({ color: 0x8b4513 });
      
      engine.rect(offset - 2, -15, 4, 10); // Arm
      engine.fill({ color: 0xa0522d });
      
      // Gegengewicht
      engine.rect(offset - 8, 5, 16, 8);
      engine.fill({ color: 0x696969 });
      
      container.addChild(engine);
    }
    
    if (count > 3) {
      const text = new PIXI.Text({
        text: `${count}×`,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0x000000,
          align: 'center'
        }
      });
      text.anchor.set(0.5);
      text.y = 25;
      container.addChild(text);
    }
    
    this.militaryLayer.addChild(container);
  }

  private drawNavy(count: number, x: number, y: number): void {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    
    // Wellen
    for (let wave = 0; wave < 3; wave++) {
      const waves = new PIXI.Graphics();
      waves.moveTo(-100, 0);
      
      for (let i = 0; i < 20; i++) {
        const waveX = (i - 10) * 10;
        const waveY = Math.sin(i * 0.5 + wave * 2) * 3;
        waves.lineTo(waveX, waveY);
      }
      
      waves.stroke({ width: 2, color: 0x1e90ff });
      container.addChild(waves);
    }
    
    // Schiffe
    const columns = Math.ceil(Math.sqrt(count));
    const spacing = 25;
    
    for (let i = 0; i < Math.min(count, 9); i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const px = (col - (columns - 1) / 2) * spacing;
      const py = (row - (columns - 1) / 2) * spacing;
      
      const ship = this.drawShip(px, py);
      container.addChild(ship);
    }
    
    if (count > 9) {
      const text = new PIXI.Text({
        text: `${count} Schiffe`,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0x000000,
          align: 'center'
        }
      });
      text.anchor.set(0.5);
      text.y = (columns * spacing) / 2 + 20;
      container.addChild(text);
    }
    
    this.militaryLayer.addChild(container);
  }

  private drawShip(x: number, y: number): PIXI.Graphics {
    const ship = new PIXI.Graphics();
    
    // Rumpf
    ship.moveTo(x - 10, y);
    ship.lineTo(x + 10, y);
    ship.lineTo(x + 8, y + 5);
    ship.lineTo(x - 8, y + 5);
    ship.closePath();
    ship.fill({ color: 0x8b4513 });
    
    // Mast
    ship.rect(x - 1, y - 15, 2, 15);
    ship.fill({ color: 0xa0522d });
    
    // Segel
    ship.moveTo(x, y - 15);
    ship.lineTo(x + 8, y - 5);
    ship.lineTo(x + 8, y);
    ship.lineTo(x, y - 10);
    ship.closePath();
    ship.fill({ color: 0xffffff });
    
    return ship;
  }

  private renderPopulation(kingdom: Kingdom): void {
    // Bevölkerung als Punkte auf der Karte darstellen
    const totalPopulation = Object.values(kingdom.population).reduce((a, b) => a + b, 0);
    const density = Math.min(1000, totalPopulation / 100); // Max 1000 Punkte
    
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < density; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      // Bevölkerungsdichte um Gebäude herum höher
      const distanceToCenter = Math.sqrt(
        Math.pow(x - centerX, 2) +
        Math.pow(y - centerY, 2)
      );
      
      if (Math.random() > distanceToCenter / 400) {
        const dot = new PIXI.Graphics();
        dot.circle(x, y, 1 + Math.random() * 2);
        dot.fill({ color: 0xffffff, alpha: 0.5 });
        this.overlayLayer.addChild(dot);
      }
    }
  }

  private renderResources(kingdom: Kingdom): void {
    // Ressourcen als Overlay anzeigen
    const resources = kingdom.resources;
    
    // Goldminen
    if (resources.gold > 5000) {
      this.drawResourceNodes(resources.gold / 10000, 0xFFD700);
    }
    
    // Eisenminen
    if (resources.iron > 1000) {
      this.drawResourceNodes(resources.iron / 5000, 0x708090);
    }
    
    // Steinbrüche
    if (resources.stone > 2000) {
      this.drawResourceNodes(resources.stone / 10000, 0xA9A9A9);
    }
  }

  private drawResourceNodes(intensity: number, color: number): void {
    const nodeCount = Math.floor(intensity * 20);
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 3 + intensity * 5;
      
      const node = new PIXI.Graphics();
      
      // Main node
      node.circle(x, y, size);
      node.fill({ color });
      
      this.overlayLayer.addChild(node);
      
      // Glüheffekt as separate graphic
      const glow = new PIXI.Graphics();
      glow.circle(x - size/3, y - size/3, size/3);
      glow.fill({ color: 0xffffff, alpha: 0.5 });
      
      this.overlayLayer.addChild(glow);
    }
  }

  private renderOverlay(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    // Grid
    if (this.renderOptions.showGrid) {
      const grid = new PIXI.Graphics();
      const gridSize = 50;
      
      // Vertikale Linien
      for (let x = 0; x < width; x += gridSize) {
        grid.moveTo(x, 0);
        grid.lineTo(x, height);
      }
      
      // Horizontale Linien
      for (let y = 0; y < height; y += gridSize) {
        grid.moveTo(0, y);
        grid.lineTo(width, y);
      }
      
      grid.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
      this.overlayLayer.addChild(grid);
    }
    
    // Labels
    if (this.renderOptions.showLabels) {
      const labels = [
        { text: 'Schloss', x: 100, y: 50 },
        { text: 'Marktplatz', x: 200, y: 100 },
        { text: 'Kasernen', x: 350, y: 50 }
      ];
      
      labels.forEach(label => {
        const text = new PIXI.Text({
          text: label.text,
          style: {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x000000
          }
        });
        text.x = label.x;
        text.y = label.y;
        this.overlayLayer.addChild(text);
      });
    }
    
    // Fog of War
    if (this.renderOptions.showFogOfWar) {
      this.drawFogOfWar();
    }
    
    // Zeit- und Wettereffekte
    this.applyTimeOfDayEffects();
  }

  private drawFogOfWar(): void {
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    // Create radial gradient effect using multiple overlaid circles
    for (let i = 0; i < 10; i++) {
      const fog = new PIXI.Graphics();
      const radius = 50 + (i * 25);
      const alpha = (1 - i / 10) * 0.7;
      fog.circle(centerX, centerY, radius);
      fog.fill({ color: 0x000000, alpha });
      this.overlayLayer.addChild(fog);
    }
  }

  private applyTimeOfDayEffects(): void {
    const time = this.renderOptions.timeOfDay;
    if (!time || time === 'day') return;
    
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    const overlay = new PIXI.Graphics();
    overlay.rect(0, 0, width, height);
    
    switch (time) {
      case 'dawn':
        overlay.fill({ color: 0xffa500, alpha: 0.2 });
        break;
      case 'dusk':
        overlay.fill({ color: 0x8b0000, alpha: 0.3 });
        break;
      case 'night':
        overlay.fill({ color: 0x00008b, alpha: 0.4 });
        break;
    }
    
    this.overlayLayer.addChild(overlay);
    
    // Add stars for night time as separate graphics
    if (time === 'night') {
      for (let i = 0; i < 50; i++) {
        const star = new PIXI.Graphics();
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        star.circle(x, y, size);
        star.fill({ color: 0xffffff });
        this.overlayLayer.addChild(star);
      }
    }
  }

  // ==================== ANIMATIONSSYSTEM ====================

  public addAnimation(config: AnimationConfig): void {
    config.startTime = Date.now();
    this.animations.push(config);
    
    // Automatisches Entfernen nach Ablauf
    setTimeout(() => {
      const index = this.animations.indexOf(config);
      if (index > -1) {
        this.animations.splice(index, 1);
        if (config.onComplete) {
          config.onComplete();
        }
      }
    }, config.duration);
  }

  public animateTroopMove(fromX: number, fromY: number, toX: number, toY: number, duration: number = 1000): void {
    this.addAnimation({
      type: 'movement',
      startX: fromX,
      startY: fromY,
      endX: toX,
      endY: toY,
      duration,
      size: 12,
      startTime: Date.now()
    });
  }

  public animateConstruction(x: number, y: number, _buildingType: string): void {
    // Partikeleffekt für Bau
    for (let i = 0; i < 20; i++) {
      const particle = new PIXI.Graphics();
      particle.circle(0, 0, 2 + Math.random() * 3);
      particle.fill({ color: 0xFFD700 });
      particle.x = x;
      particle.y = y;
      
      this.particles.push({
        sprite: particle,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        maxLife: 1
      });
      
      this.overlayLayer.addChild(particle);
    }
    
    this.addAnimation({
      type: 'construction',
      startX: x,
      startY: y,
      duration: 1500,
      size: 30,
      startTime: Date.now()
    });
  }

  private updateAnimations(_deltaTime: number): void {
    // Animationen werden in der Renderloop automatisch gerendert
  }

  // ==================== PARTIKELSYSTEM ====================

  private updateParticles(deltaTime: number): void {
    const deltaSeconds = deltaTime / 1000;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update Position
      particle.sprite.x += particle.vx * deltaSeconds * 60;
      particle.sprite.y += particle.vy * deltaSeconds * 60;
      
      // Update Leben
      particle.life -= deltaSeconds * 2;
      
      // Gravitation
      particle.vy += 0.1 * deltaSeconds * 60;
      
      // Update Alpha
      const alpha = particle.life / particle.maxLife;
      particle.sprite.alpha = alpha;
      
      // Entferne tote Partikel
      if (particle.life <= 0) {
        particle.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  // ==================== HILFSMETHODEN ====================

  public setRenderOptions(options: Partial<RenderOptions>): void {
    this.renderOptions = { ...this.renderOptions, ...options };
    
    // Re-render if we have a kingdom loaded
    if (this.currentKingdom) {
      this.renderKingdom(this.currentKingdom);
    }
  }

  public getRenderOptions(): RenderOptions {
    return { ...this.renderOptions };
  }

  public clearAnimations(): void {
    this.animations = [];
    this.particles.forEach(p => p.sprite.destroy());
    this.particles = [];
  }

  public takeScreenshot(filename: string = 'kingdom-map'): void {
    // Use renderer's canvas directly for screenshot
    try {
      const canvas = this.app.canvas;
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    
    // Re-render if we have a kingdom loaded
    if (this.currentKingdom) {
      this.renderKingdom(this.currentKingdom);
    }
  }

  public destroy(): void {
    this.clearAnimations();
    this.app.destroy(true, { children: true, texture: true, textureSource: true });
  }
}