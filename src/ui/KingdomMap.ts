import { Application, Assets, Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js';
import { Kingdom, KingdomInfrastructure } from '../core/Kingdom';
import type { RivalRealm } from '../core/CampaignWarfareSystem';
import { SettlementDistrict, SETTLEMENT_DISTRICTS, DistrictFilter, visibleDistricts, districtModernization, districtSceneSignature } from './SettlementSceneModel';
import {
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_MIN,
  levelForSlider,
  MapRegionResult,
  MapZoomLevel,
  sliderToZoom,
  zoomToSlider
} from './MapZoomLevels';

/**
 * PixiJS settlement overview. Counts represent infrastructure, not geographic claims.
 */
export class KingdomMap {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly settlements = new Container();
  private readonly retroScenery = new Container();
  private readonly neighbors = new Container();
  private onNeighborSelect?: (id: string) => void;
  private districtFilter: DistrictFilter = 'alle';
  private lastSignature = '';
  private observer?: ResizeObserver;
  private zoom: number = 1;
  private offset = { x: 0, y: 0 };
  private destroyed: boolean = false;
  private initialized: boolean = false;
  private motionEnabled = false;
  private readonly animation = new Container();
  private readonly atmosphere = new Container();
  private elapsed = 0;
  private actionVisual?: Container;
  private actionTimer?: number;
  private actionStart = 0;
  private actionTroops: Array<{ sprite: Container; from: [number, number]; to: [number, number]; delay: number }> = [];
  private readonly animatedMarkers: Container[] = [];
  private readonly citizens: Container[] = [];
  private readonly chimneys: Graphics[] = [];
  private retroAtlas?: Texture;
  private readonly retroEpochTextures = new Map<string, Texture>();
  private retroEnabled = false;
  private projection: 'flat' | 'isometric' = 'isometric';
  private mapScope: 'home' | 'world' = 'home';
  private retroLoading = false;
  private retroContext?: { kingdom: Kingdom; selected: keyof KingdomInfrastructure; completed: readonly string[]; year: number; rivals: readonly RivalRealm[] };
  /**
   * Schematische Regionsnamen für die Ebene „Zentraleuropa".
   * Additiv: liegt **über** der bestehenden Welt und wird ausschließlich
   * eingeblendet, wenn die Zoom-Ebene es verlangt.
   */
  private readonly regionLayer = new Container();
  private zoomLevel: MapZoomLevel = 'dorf';
  private regionResult?: MapRegionResult;
  /** Relief-Textur der Ebene „Zentraleuropa" (Natural Earth, Public Domain). */
  private reliefTexture?: Texture;
  private reliefLoading = false;
  private readonly reliefLayer = new Container();

  private readonly animatedTicker = (ticker: { deltaMS: number }): void => {
    if (this.destroyed || document.hidden) return;
    if (this.actionVisual) this.animateAction();
    if (!this.motionEnabled) return;
    this.elapsed += Math.min(ticker.deltaMS, 50) / 1000;
    this.citizens.forEach((citizen, i) => {
      const road = [
        [[265, 410], [385, 265], [510, 205]],
        [[510, 205], [530, 350], [720, 415]],
        [[530, 350], [525, 490]]
      ][i % 3];
      const progress = (this.elapsed * (0.027 + i * 0.004) + i * 0.19) % 1;
      const segment = Math.min(road.length - 2, Math.floor(progress * (road.length - 1)));
      const fraction = progress * (road.length - 1) - segment;
      citizen.position.set(
        road[segment][0] + (road[segment + 1][0] - road[segment][0]) * fraction,
        road[segment][1] + (road[segment + 1][1] - road[segment][1]) * fraction
      );
    });
    this.chimneys.forEach((smoke, i) => {
      smoke.alpha = 0.25 + Math.abs(Math.sin(this.elapsed + i)) * 0.35;
      smoke.y = -((this.elapsed * 5 + i * 6) % 18);
    });
    this.animatedMarkers.forEach((marker, i) => {
      marker.x = 220 + ((this.elapsed * (11 + i * 3) + i * 147) % 570);
      marker.y = 310 + Math.sin(this.elapsed * 0.8 + i) * 32 + i * 15;
      marker.alpha = 0.5 + Math.sin(this.elapsed * 2 + i) * 0.2;
    });
  };
  private readonly visibility = (): void => {
    if (this.destroyed || !this.initialized) return;
    if (document.hidden) this.app.ticker.stop();
    else if (this.motionEnabled || this.actionVisual) this.app.ticker.start();
  };

  /**
   * Initializes the renderer and responsive canvas.
   * @param host Container for the canvas.
   * @param onSelect Callback for a selected infrastructure district.
   * @returns Resolves when the map can be rendered.
   * @throws Error when no graphics renderer is available.
   */
  public async initialize(host: HTMLElement, onSelect: (type: keyof KingdomInfrastructure) => void, onNeighborSelect?: (id: string) => void): Promise<void> {
    this.onNeighborSelect = onNeighborSelect;
    await this.app.init({
      background: 0x182d2a, antialias: true, autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight)
    });
    this.initialized = true;
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }
    host.append(this.app.canvas);
    this.app.canvas.setAttribute('aria-label', 'Siedlungskarte. Bezirke auch über die Bauauswahl erreichbar.');
    this.app.stage.addChild(this.world);
    this.drawLandscape();
    this.drawAtmosphere();
    this.world.addChild(this.atmosphere);
    this.world.addChild(this.retroScenery);
    this.world.addChild(this.neighbors);
    this.world.addChild(this.settlements);
    this.world.addChild(this.animation);
    // Additive Overlay-Ebene: niemals Teil der Simulation, nur Darstellung.
    this.regionLayer.visible = false;
    this.reliefLayer.visible = false;
    this.world.addChild(this.reliefLayer);
    this.world.addChild(this.regionLayer);
    for (let i = 0; i < 5; i++) {
      const marker = new Container();
      marker.addChild(new Graphics().circle(0, 0, 3).fill({ color: 0xf0d89f, alpha: 0.75 }));
      this.animatedMarkers.push(marker);
      this.animation.addChild(marker);
    }
    // Animated villagers follow existing paths; they represent activity, not actual citizen records.
    for (let i = 0; i < 9; i++) {
      const walker = new Container();
      walker.addChild(new Graphics()
        .circle(0, -7, 3).fill(0xe5c79b)
        .roundRect(-3, -4, 6, 9, 2).fill(i % 3 === 0 ? 0x9db8a8 : 0xb9996e)
        .moveTo(-2, 5).lineTo(-3, 9).moveTo(2, 5).lineTo(3, 9)
        .stroke({ color: 0xbba992, width: 2 }));
      this.citizens.push(walker);
      this.animation.addChild(walker);
    }
    this.animation.visible = false;
    this.app.ticker.maxFPS = 30;
    this.app.ticker.add(this.animatedTicker);
    document.addEventListener('visibilitychange', this.visibility);
    this.observer = new ResizeObserver((): void => {
      this.app.renderer.resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
      this.fit();
    });
    this.observer.observe(host);
    let drag: { x: number; y: number; moved: boolean } | undefined;
    const canvas = this.app.canvas;
    canvas.addEventListener('pointerdown', (event: PointerEvent): void => {
      drag = { x: event.clientX, y: event.clientY, moved: false };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event: PointerEvent): void => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      if (drag.moved) {
        this.offset.x += dx;
        this.offset.y += dy;
        drag.x = event.clientX;
        drag.y = event.clientY;
        this.fit();
      }
    });
    canvas.addEventListener('pointerup', (event: PointerEvent): void => {
      if (drag && !drag.moved) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.world.x) / this.world.scale.x;
        const y = (event.clientY - rect.top - this.world.y) / this.world.scale.y;
        const location = visibleDistricts(this.districtFilter).find((place: SettlementDistrict) => Math.hypot(place.x - x, place.y - y) < 47);
        if (location) onSelect(location.type);
      }
      drag = undefined;
    });
    canvas.addEventListener('pointercancel', (): void => { drag = undefined; });
    this.fit();
    this.app.ticker.stop();
    void this.loadRetroAssets();
  }

  /** Lightweight, license-checked Kenney visual assets; leaves simulation unchanged. */
  /** Switch between the classic geometric map and Kenney Retro sprites. */
  public setProjection(mode: 'flat' | 'isometric'): void {
    this.projection = mode;
    this.retroScenery.visible = false;
    this.app.canvas.dataset.retroProjection = mode;
    this.app.canvas.dataset.retroVisible = String(this.retroEnabled && mode === 'isometric');
    this.lastSignature = '';
    // Die Projektion darf die aktive Zoom-Ebene nicht überschreiben.
    this.applyLevel(this.zoomLevel);
    if (this.retroContext && this.initialized && !this.destroyed) {
      const { kingdom, selected, completed, year, rivals } = this.retroContext;
      this.update(kingdom, selected, completed, year, rivals);
    }
  }

  private async loadRetroAssets(): Promise<void> {
    if (this.retroLoading || this.destroyed) return;
    this.retroLoading = true;
    try {
      const base = import.meta.env.BASE_URL;
      // Load independently: a missing optional house must never hide the whole map.
      const [atlas, house] = await Promise.allSettled([
        Assets.load<Texture>(base + 'assets/kenney/retro-workshop-atlas.png'),
        Assets.load<Texture>(base + 'assets/kenney/retro-house-1200.png')
      ]);
      if (this.destroyed) return;
      if (atlas.status === 'fulfilled') {
        this.retroAtlas = atlas.value;
        // Future epoch art uses separate named atlases. Optional and non-blocking:
        // the existing retro scene remains playable if they are absent.
        void Promise.allSettled(['fantasy','urban','textures'].map(async name => {
          const texture = await Assets.load<Texture>(base + 'assets/kenney/retro-' + name + '-atlas.png');
          if (!this.destroyed) {
            this.retroEpochTextures.set(name, texture);
            if (name === 'textures') this.drawRetroScenery();
            this.lastSignature = '';
            if (this.retroContext) {
              const { kingdom, selected, completed, year, rivals } = this.retroContext;
              this.update(kingdom, selected, completed, year, rivals);
            }
          }
        })).then(() => {
          if (!this.destroyed) this.app.canvas.dataset.retroEpochAtlases = String(this.retroEpochTextures.size);
        });
        this.retroEnabled = true;
        this.app.canvas.dataset.retroLoaded = 'true';
        this.app.canvas.dataset.retroHouse = house.status === 'fulfilled' ? 'loaded' : 'fallback';
        this.app.canvas.dataset.retroVisible = String(this.projection === 'isometric');
        this.drawRetroScenery();
        this.lastSignature = '';
        if (this.retroContext) {
          const { kingdom, selected, completed, year, rivals } = this.retroContext;
          this.update(kingdom, selected, completed, year, rivals);
        }
      } else {
        this.retroEnabled = false;
        this.app.canvas.dataset.retroLoaded = 'fallback';
        this.app.canvas.dataset.retroVisible = 'false';
        console.warn('Kenney-Atlas nicht geladen; geometrische Karte bleibt nutzbar', atlas.reason);
      }
    } catch (error) {
      this.app.canvas.dataset.retroLoaded = 'fallback';
      this.app.canvas.dataset.retroVisible = 'false';
      console.warn('Retro-Renderer nicht initialisiert; geometrische Karte bleibt nutzbar', error);
    } finally {
      this.retroLoading = false;
    }
  }

  /** Eight material swatches (16px each) from Kenney Retro Textures Fantasy. */
  private retroMaterial(index: number, x: number, y: number, size: number): Sprite | undefined {
    const atlas = this.retroEpochTextures.get('textures');
    if (!atlas) return undefined;
    const texture = new Texture({
      source: atlas.source, frame: new Rectangle((index % 8) * 16, 0, 16, 16)
    });
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(x, y);
    sprite.width = size;
    sprite.height = Math.max(12, size * 0.55);
    sprite.alpha = 0.64;
    return sprite;
  }

  /** Deterministic CC0 Kenney landscape details, visually separate from game state.
   * Never place art over a district hit area or use an unbounded number of sprites.
   */
  private drawRetroScenery(): void {
    for (const child of this.retroScenery.removeChildren()) child.destroy({ children: true });
    if (!this.retroAtlas || this.destroyed) return;
    this.retroScenery.visible = false;
    for (let i = 0; i < 65; i++) {
      const x = 87 + (i * 199) % 832;
      const y = 80 + (i * 127) % 472;
      if (SETTLEMENT_DISTRICTS.some(d => Math.hypot(d.x - x, d.y - y) < 66)) continue;
      const nearWater = x < 305 && y > 160 && y < 440;
      const tile = this.retroTile(nearWater ? 7 : (i % 5 === 0 ? 4 : 7),
        x, y, nearWater ? 28 : i % 5 === 0 ? 52 : 24);
      tile.alpha = 0.75 + (i % 3) * 0.09;
      this.retroScenery.addChild(tile);
    }
    // Material swatches are small ground accents and never capture input.
    for (let i = 0; i < 18; i++) {
      const x = 105 + i * 137 % 805, y = 85 + i * 89 % 480;
      if (SETTLEMENT_DISTRICTS.some(d => Math.hypot(d.x - x, d.y - y) < 72)) continue;
      const material = this.retroMaterial(i, x, y, 24 + i % 3 * 5);
      if (material) this.retroScenery.addChild(material);
    }
    this.app.canvas.dataset.retroScenery = String(this.retroScenery.children.length);
    this.app.canvas.dataset.retroMaterials = String(this.retroEpochTextures.has('textures') ? this.retroScenery.children.length : 0);
  }

  private retroTile(index: number, x: number, y: number, size = 44): Sprite {
    const atlas = this.retroAtlas!;
    const texture = new Texture({
      source: atlas.source,
      frame: new Rectangle(index % 4 * 64, Math.floor(index / 4) * 64, 64, 64)
    });
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(x, y);
    sprite.width = size;
    sprite.height = size;
    return sprite;
  }

  /** Coherent orthographic 2.5D graphics for all fixed infrastructure districts.
   * Pixel preview thumbnails cannot be stretched into believable 3D buildings.
   * All shapes share one roof direction, shadow direction and ground baseline.
   */
  private drawRetroDistrict(group: Container, type: keyof KingdomInfrastructure, count: number, epoch: string): boolean {
    if (this.projection === 'flat') return false;
    const later = epoch === 'modern' || epoch === 'industrial';
    const alpha = count > 0 ? 1 : 0.37;
    const palette = later
      ? { wall: 0xb6b7aa, side: 0x777f78, roof: 0x626f75, trim: 0x48585e }
      : { wall: 0xd1b992, side: 0x998463, roof: 0x815247, trim: 0x5b4236 };
    const structure = (x: number, y: number, w: number, h: number, tall = false): void => {
      const wallHeight = tall ? h * 1.3 : h;
      const g = new Graphics();
      g.ellipse(x + 6, y + 8, w * 0.85, 13).fill({ color: 0x111d17, alpha: 0.32 });
      g.poly([x - w / 2, y - wallHeight, x + w / 2, y - wallHeight,
        x + w / 2, y, x - w / 2, y]).fill(palette.wall);
      g.poly([x + w / 2, y - wallHeight, x + w / 2 + 13, y - wallHeight - 9,
        x + w / 2 + 13, y - 9, x + w / 2, y]).fill(palette.side);
      g.poly([x - w / 2 - 6, y - wallHeight, x, y - wallHeight - 30,
        x + w / 2 + 7, y - wallHeight, x + w / 2 + 17, y - wallHeight - 9,
        x + 11, y - wallHeight - 39]).fill(palette.roof);
      g.rect(x - 7, y - 20, 13, 20).fill(palette.trim);
      g.rect(x - w * 0.32, y - wallHeight + 10, 10, 11)
        .rect(x + w * 0.2, y - wallHeight + 10, 10, 11).fill(0xead8a6);
      g.rect(x - w * 0.32 + 4, y - wallHeight + 10, 2, 11)
        .rect(x + w * 0.2 + 4, y - wallHeight + 10, 2, 11).fill(palette.trim);
      g.alpha = alpha;
      group.addChild(g);
    };
    const block = (x: number, y: number, w: number, h: number, color: number): void => {
      group.addChild(new Graphics().roundRect(x - w / 2, y - h, w, h, 2)
        .fill({ color, alpha }).rect(x - w / 2 + 4, y - h + 4, w - 8, 5)
        .fill({ color: 0xe0d4b9, alpha: 0.45 * alpha }));
    };
    if (type === 'roads') {
      const road = new Graphics().poly([-55, 17, -29, -17, 18, -21, 60, 13, 33, 34, -15, 20])
        .fill({ color: later ? 0x858c8d : 0xb9a078, alpha });
      group.addChild(road);
    } else if (type === 'farms') {
      const farms = new Graphics();
      for (let i = 0; i < 5; i++) farms.poly([-51 + 21 * i, -8, -30 + 21 * i, -19,
        -10 + 21 * i, 6, -32 + 21 * i, 19]).fill({color: i % 2 ? 0xb2a35c : 0x7f9b52,alpha});
      group.addChild(farms);
      structure(0,-1,33,21);
    } else if (type === 'walls') {
      for(let i=0;i<4;i++) block(-37+i*24,17,25,i%3===0?44:25,0xa6a79a);
    } else if (type === 'ports') {
      group.addChild(new Graphics().poly([-57,13,-31,-5,57,8,36,26]).fill({color:0x846449,alpha}));
      structure(-12,0,43,33);
    } else if (type === 'mines') {
      group.addChild(new Graphics().poly([-50,17,-12,-38,36,15]).fill({color:0x7b8075,alpha})
        .poly([-12,-38,50,17,36,15]).fill({color:0x555b54,alpha}));
      block(8,21,20,28,0x3e3930);
    } else if (type === 'castles' || type === 'barracks') {
      structure(0,10,65,50,true);
      block(-43,9,25,70,0xa8a59a);
      block(45,9,25,70,0xa8a59a);
    } else if (type === 'churches' || type === 'universities') {
      structure(0,13,65,44,true);
      block(-30,7,22,75,later?0x909e9c:0xc0b093);
    } else {
      const buildings = Math.max(1,Math.min(count,3));
      for(let i=0;i<buildings;i++){
        const x=(i-(buildings-1)/2)*43;
        structure(x,i%2?13:7,38+(i%2)*7,34+(i%2)*6);
      }
      if(type==='workshops'||type==='guildhalls'||type==='warehouses'||type==='markets'){
        for(let i=0;i<2;i++) block(-30+i*58,22,17,18,0x96724c);
      }
    }
    return true;
  }

  private animateAction(): void {
    const elapsed = (performance.now() - this.actionStart) / 1000;
    for (const unit of this.actionTroops) {
      const progress = Math.max(0, Math.min(1, (elapsed - unit.delay) / 1.35));
      const eased = progress * progress * (3 - 2 * progress);
      unit.sprite.position.set(
        unit.from[0] + (unit.to[0] - unit.from[0]) * eased,
        unit.from[1] + (unit.to[1] - unit.from[1]) * eased - Math.sin(progress * Math.PI) * 8
      );
      unit.sprite.alpha = progress <= 0 ? 0 : 1;
    }
    if (this.actionVisual) this.actionVisual.alpha = 0.78 + Math.sin(elapsed * 8) * 0.18;
  }

  /** A bounded visual reenactment of the resolved battle (never an extra battle roll). */
  public playAction(kind: 'raid' | 'science', playerWon: boolean = false): void {
    if (!this.initialized || this.destroyed) return;
    this.actionVisual?.destroy({ children: true });
    this.actionTroops = [];
    window.clearTimeout(this.actionTimer);
    const visual = new Container();
    const color = kind === 'raid' ? 0xe98159 : 0xe8d498;
    const x = kind === 'raid' ? 385 : 525;
    const y = kind === 'raid' ? 265 : 480;
    visual.addChild(new Graphics().circle(x, y, 63)
      .stroke({ color, width: 6, alpha: 0.8 })
      .circle(x, y, 29).fill({ color, alpha: 0.25 }));
    if (kind === 'raid' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Two tiny detachments follow opposing paths; their colors show who prevailed.
      const formations = [
        { color: 0xb6d6bb, from: [185, 395] as [number, number], to: [385, 265] as [number, number] },
        { color: 0xe18a70, from: [680, 180] as [number, number], to: [405, 285] as [number, number] }
      ];
      formations.forEach((formation, side) => {
        for (let index = 0; index < 7; index++) {
          const fighter = new Container();
          const tint = side === (playerWon ? 0 : 1) ? formation.color : 0x938f88;
          fighter.addChild(new Graphics()
            .circle(0, -6, 3).fill(0xd9c5a3)
            .roundRect(-4, -2, 8, 9, 2).fill(tint)
            .moveTo(5, -1).lineTo(9, -8).stroke({ color: 0xcdd2cd, width: 2 }));
          visual.addChild(fighter);
          this.actionTroops.push({
            sprite: fighter,
            from: [formation.from[0] + (index % 4) * 12, formation.from[1] + Math.floor(index / 4) * 13],
            to: [formation.to[0] + (index % 4) * 10, formation.to[1] + Math.floor(index / 4) * 12],
            delay: index * 0.09 + side * 0.15
          });
        }
      });
    }
    this.world.addChild(visual);
    this.actionVisual = visual;
    this.actionStart = performance.now();
    if (this.actionTroops.length && !document.hidden) this.app.ticker.start();
    this.fit();
    this.actionTimer = window.setTimeout(() => {
      if (this.destroyed) return;
      if (this.actionVisual === visual) this.actionVisual = undefined;
      this.actionTroops = [];
      visual.destroy({ children: true });
      if (!this.motionEnabled) this.app.ticker.stop();
      this.fit();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 800 : 2600);
  }

  /** Enable bounded ambient movement, without changing the game simulation. */
  public setMotion(enabled: boolean): void {
    this.motionEnabled = enabled && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.animation.visible = this.motionEnabled;
    if (this.motionEnabled && !document.hidden) this.app.ticker.start();
    else if (!this.actionVisual) this.app.ticker.stop();
    if (this.initialized) this.fit();
  }

  /**
   * Refreshes infrastructure markers without allocating citizens or terrain again.
   * @param kingdom Current kingdom state.
   * @param selected Highlighted infrastructure district.
   * @returns Nothing.
   */
  public setDistrictFilter(filter: DistrictFilter): void {
    this.districtFilter = filter;
    this.lastSignature = '';
  }

  public update(kingdom: Kingdom, selected: keyof KingdomInfrastructure, completed: readonly string[] = [], year = 1200, rivals: readonly RivalRealm[] = []): void {
    if (!this.initialized || this.destroyed) return;
    this.retroContext = { kingdom, selected, completed, year, rivals };
    const signature = districtSceneSignature(kingdom.infrastructure, selected,
      this.districtFilter, kingdom.currentSeason, completed) + JSON.stringify(rivals.map(r => [r.id,r.name,r.subjugated]));
    const epochStyle = year >= 1945 ? 'modern' : year >= 1800 ? 'industrial' : year >= 1500 ? 'renaissance' : 'medieval';
    if (signature + epochStyle === this.lastSignature) return;
    this.lastSignature = signature + epochStyle;
    this.chimneys.length = 0;
    this.drawNeighbors(rivals);
    this.drawAtmosphere(kingdom.currentSeason, epochStyle);
    for (const child of this.settlements.removeChildren()) child.destroy({ children: true });
    for (const location of visibleDistricts(this.districtFilter)) {
      const count = kingdom.infrastructure[location.type];
      const group = new Container();
      const modernization = districtModernization(location.type, completed);
      const winter = kingdom.currentSeason === 'winter';
      group.position.set(location.x, location.y);
      const ground = new Graphics()
        .ellipse(0, 10, 62, 30).fill({ color: location.color, alpha: 0.12 })
        .ellipse(0, 10, 62, 30).stroke({
          color: selected === location.type ? 0xf0d89f : 0x6b8270,
          width: selected === location.type ? 2 : 1, alpha: selected === location.type ? 1 : 0.35
        });
      group.addChild(ground);
      if (this.drawRetroDistrict(group, location.type, count, epochStyle)) {
        // Visual-only retro representation. Interaction still uses fixed coordinates.
      } else if ((modernization || epochStyle === 'modern' || epochStyle === 'industrial') && count > 0 && location.type !== 'farms' && location.type !== 'roads' && location.type !== 'ports' && location.type !== 'walls') {
        group.addChild(new Graphics().roundRect(-29, -62, 58, 42, 5)
          .fill({ color: 0x587f84, alpha: 0.95 }).roundRect(-24, -56, 48, 6, 2)
          .fill(0xc2d4ce).rect(-16, -42, 11, 16).rect(5, -42, 11, 16).fill(0xecdcb0));
        if (epochStyle === 'modern' && count > 0) group.addChild(new Graphics().rect(-36,-76,72,4).fill(0x69bec7));
      } else if (location.type === 'farms') {
        const fields = new Graphics();
        for (let i = 0; i < 5; i++) {
          fields.poly([-43 + i * 17, -13, -30 + i * 17, -20, -8 + i * 17, 0, -21 + i * 17, 8])
            .fill({ color: i % 2 ? 0xa99857 : 0x8e9a5c, alpha: 0.85 });
        }
        group.addChild(fields);
      } else if (location.type === 'ports') {
        group.addChild(new Graphics().rect(-38, -2, 76, 15).fill(0x775b45)
          .poly([-25, 2, 0, -33, 26, 2]).fill({ color: count ? 0xc4ae83 : 0x66776c, alpha: 0.85 })
          .rect(-2, -37, 4, 40).fill(0xd5cbb3));
      } else if (location.type === 'walls') {
        group.addChild(new Graphics().rect(-47, -17, 94, 24).fill({ color: 0xa0aca2, alpha: count ? 1 : 0.25 })
          .rect(-38, -31, 20, 14).rect(18, -31, 20, 14).fill(0x8d9f96));
      } else if (location.type === 'roads') {
        group.addChild(new Graphics().moveTo(-40, 20).lineTo(0, -26).lineTo(44, 19)
          .stroke({ width: count ? 14 : 7, color: modernization ? 0x7e8d93 : 0xbca57c }));
      } else if (location.type === 'mines') {
        group.addChild(new Graphics().poly([-32, 13, 0, -38, 35, 13]).fill(0x6e817b)
          .poly([0, -38, 9, 13, 35, 13]).fill(0x4a625e)
          .roundRect(-10, -1, 18, 20, 6).fill(0x182a29));
      } else {
        const buildings = Math.min(Math.max(count, 1), 4);
        for (let i = 0; i < buildings; i++) {
          const x = (i % 2) * 30 - 25;
          const y = Math.floor(i / 2) * 20 - 12;
          const height = location.type === 'castles' || location.type === 'churches' ? 39 : 24;
          const house = new Graphics()
            .rect(x, y - height, 25, height).fill({ color: location.color, alpha: count ? 1 : 0.35 })
            .poly([x - 4, y - height, x + 12, y - height - 16, x + 29, y - height])
            .fill(count ? 0x6b5550 : 0x425650)
            .rect(x + 9, y - 13, 6, 13).fill(0x293b35)
            .rect(x + 4, y - height + 7, 5, 5).fill(0xe6cc8b);
          group.addChild(house);
          if (count > 0 && (location.type === 'workshops' || location.type === 'markets')) {
            const smoke = new Graphics()
              .circle(x + 22, y - height - 20, 5).fill({ color: 0xc5d1c5, alpha: 0.55 })
              .circle(x + 18, y - height - 27, 7).fill({ color: 0xc5d1c5, alpha: 0.28 });
            group.addChild(smoke);
            this.chimneys.push(smoke);
          }
        }
      }
      if (count > 0 && (location.type === 'castles' || location.type === 'churches')) {
        const flag = new Graphics().rect(0, -76, 2, 27).fill(0xe2ddc7)
          .poly([2, -76, 24, -71, 2, -65]).fill(epochStyle === 'modern' ? 0x6bbac1 : 0xd2a356);
        group.addChild(flag);
      }
      if (count > 0 && location.type === 'ports') {
        group.addChild(new Graphics().ellipse(0, 24, 47, 5).fill({ color: 0x94c4ce, alpha: 0.3 }));
      }
      if (winter) group.addChild(new Graphics().ellipse(0, 20, 51, 8)
        .fill({ color: 0xe1e9e6, alpha: 0.38 }));
      const label = new Text({
        text: `${location.name} · ${count}${modernization ? ' ⚙' : ''}`,
        style: { fontFamily: 'Segoe UI', fontSize: 14, fill: 0xede8d2, fontWeight: '500' }
      });
      label.anchor.set(0.5, 0);
      label.position.set(0, 43);
      group.addChild(label);
      this.settlements.addChild(group);
    }
    const eraText = epochStyle === 'modern' ? 'Moderne' : epochStyle === 'industrial'
      ? 'Industrialisierung' : epochStyle === 'renaissance' ? 'Neuzeit' : 'Mittelalter';
    const badge = new Text({text: eraText + ' · ' + year, style: {fontFamily: 'Georgia',
      fontSize: 25, fill: 0xf4e6c5}});
    badge.position.set(38, 26);
    this.settlements.addChild(badge);
    this.fit();
  }

  /**
   * Adjusts zoom or resets the map position.
   *
   * Der Bereich wurde für die Zoom-Ebenen auf {@link CAMERA_ZOOM_MIN} bis
   * {@link CAMERA_ZOOM_MAX} erweitert; die Ebenenumschaltung selbst erfolgt
   * über {@link setZoomSlider}.
   *
   * @param change Zoom increment; zero resets the view.
   * @returns Nothing.
   */
  public changeZoom(change: number): void {
    this.zoom = change === 0 ? 1 : Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, this.zoom + change));
    if (change === 0) this.offset = { x: 0, y: 0 };
    this.syncLevelFromZoom();
    this.fit();
  }

  /** Aktuelle Zoom-Ebene (nur Darstellung, keine Simulation). */
  public getZoomLevel(): MapZoomLevel {
    return this.zoomLevel;
  }

  /**
   * Setzt den Zoom über einen Slider-Wert (0–100) und schaltet die Ebene um.
   *
   * @param slider Slider-Wert; wird im Modul geklemmt.
   * @returns Nothing.
   */
  public setZoomSlider(slider: number): void {
    this.zoom = sliderToZoom(slider);
    this.applyLevel(levelForSlider(slider, this.zoomLevel));
    this.fit();
  }

  /** Liefert den zum aktuellen Zoom passenden Slider-Wert (für die UI-Synchronisation). */
  public getZoomSlider(): number {
    return zoomToSlider(this.zoom);
  }

  /**
   * Hinterlegt die schematischen Regionsnamen für die Ebene „Zentraleuropa".
   *
   * Es werden ausschließlich Namen und Positionen gezeichnet – **keine**
   * Polygone, Linien oder Einfärbungen. Der Hinweistext wird im Canvas als
   * Legende ausgegeben, damit die Schematik sichtbar bleibt.
   *
   * @param result Ergebnis aus `regionsForMap(year)`.
   * @returns Nothing.
   */
  public setHistoricalRegions(result: MapRegionResult): void {
    this.regionResult = result;
    this.drawRegionLayer();
  }

  /** Legende der Regionsansicht für die Oberfläche (nie leer). */
  public getRegionLegend(): string {
    return this.regionResult?.message ?? 'Keine Regionsdaten geladen.';
  }

  private syncLevelFromZoom(): void {
    this.applyLevel(levelForSlider(zoomToSlider(this.zoom), this.zoomLevel));
  }

  /**
   * Blendet die Layer passend zur Ebene ein/aus.
   * Bestehendes Verhalten bleibt erhalten: die 16 Bezirke verschwinden nur
   * in der Regionsansicht, nicht dauerhaft.
   */
  private applyLevel(level: MapZoomLevel): void {
    if (this.zoomLevel === level && this.regionLayer.children.length > 0) {
      this.regionLayer.visible = level === 'zentraleuropa';
      this.reliefLayer.visible = level === 'zentraleuropa';
      return;
    }
    this.zoomLevel = level;
    const village = level === 'dorf';
    this.settlements.visible = village && this.mapScope === 'home';
    this.retroScenery.visible = village && this.mapScope === 'home' && this.projection === 'isometric';
    this.neighbors.visible = true;
    this.regionLayer.visible = !village;
    this.reliefLayer.visible = !village;
    if (!village) {
      this.drawRegionLayer();
      void this.loadReliefTexture();
    }
    this.app.canvas.dataset.zoomLevel = level;
    this.fit();
  }

  /**
   * Lädt die Relief-Textur der Ebene „Zentraleuropa".
   *
   * Quelle: Natural Earth 1:50m Shaded Relief, Public Domain. Das Laden ist
   * fehlertolerant: Schlägt es fehl, bleibt die Regionsansicht ohne Relief
   * bedienbar (nur Punkte und Namen).
   */
  private async loadReliefTexture(): Promise<void> {
    if (this.reliefTexture || this.reliefLoading || this.destroyed) return;
    this.reliefLoading = true;
    try {
      const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
      const url = `${base}maps/relief-central-europe.webp`;
      const texture = await Assets.load<Texture>(url);
      if (this.destroyed) return;
      this.reliefTexture = texture;
      this.app.canvas.dataset.reliefLoaded = 'true';
      this.drawRegionLayer();
    } catch (error) {
      console.warn('Relief-Textur nicht verfügbar; Regionsansicht bleibt ohne Relief.', error);
      this.app.canvas.dataset.reliefLoaded = 'false';
    } finally {
      this.reliefLoading = false;
    }
  }

  /**
   * Zeichnet die schematischen Regionsnamen.
   *
   * Bewusst ohne Grenzlinien: Relief als Hintergrund, Punkt und Name je Region,
   * dazu eine Legende, die Quelle und Schematik ausdrücklich benennt.
   */
  private drawRegionLayer(): void {
    for (const child of this.regionLayer.removeChildren()) child.destroy({ children: true });
    for (const child of this.reliefLayer.removeChildren()) child.destroy({ children: true });
    const result = this.regionResult;
    const width = 960;
    const height = 660;

    // Relief als Hintergrund – physische Geografie, keine politische Grenze.
    if (this.reliefTexture) {
      const sprite = new Sprite(this.reliefTexture);
      sprite.width = width;
      sprite.height = height;
      // Zurückhaltend abdunkeln, damit Namen lesbar bleiben.
      sprite.tint = 0xa8b8b0;
      this.reliefLayer.addChild(sprite);
    } else {
      const backdrop = new Graphics();
      backdrop.roundRect(0, 0, width, height, 14).fill({ color: 0x1d2e28, alpha: 0.85 });
      this.reliefLayer.addChild(backdrop);
    }
    this.reliefLayer.addChild(new Graphics()
      .roundRect(0, 0, width, height, 14).stroke({ color: 0x6b8270, width: 2, alpha: 0.7 }));

    if (!result || result.labels.length === 0) {
      const empty = new Text({
        text: result?.message ?? 'Keine Regionsdaten geladen.',
        style: { fontFamily: 'Georgia', fontSize: 22, fill: 0xf0e6c8, align: 'center', wordWrap: true, wordWrapWidth: width - 120 }
      });
      empty.anchor.set(0.5);
      empty.position.set(width / 2, height / 2);
      this.regionLayer.addChild(empty);
      return;
    }

    for (const label of result.labels) {
      const x = (label.xPercent / 100) * width;
      const y = (label.yPercent / 100) * height;
      const marker = new Container();
      marker.position.set(x, y);
      // Punkt statt Fläche: markiert einen belegten Ortsbezug, keine Ausdehnung.
      marker.addChild(new Graphics()
        .circle(0, 0, 4).fill({ color: 0xffffff, alpha: 0.95 })
        .circle(0, 0, 8).stroke({ color: 0x2b3f36, width: 2, alpha: 0.8 }));
      const text = new Text({
        text: label.name,
        style: {
          fontFamily: 'Georgia', fontSize: 17, fill: 0xffffff, align: 'center',
          stroke: { color: 0x1b2820, width: 3 }, fontWeight: '600'
        }
      });
      text.anchor.set(0.5);
      text.position.set(0, -20);
      marker.addChild(text);
      this.regionLayer.addChild(marker);
    }

    const legend = new Text({
      text: result.message,
      style: {
        fontFamily: 'Segoe UI', fontSize: 12, fill: 0xe8e2c8, align: 'left',
        wordWrap: true, wordWrapWidth: width - 60,
        stroke: { color: 0x1b2820, width: 3 }
      }
    });
    legend.position.set(24, height - 42);
    this.regionLayer.addChild(legend);
    this.app.canvas.dataset.regionCount = String(result.labels.length);
  }

  /** Neighboring realms are geographic illustrations, not claims of historical borders. */
  private drawNeighbors(rivals: readonly RivalRealm[]): void {
    for (const child of this.neighbors.removeChildren()) child.destroy({ children: true });
    // Schematic territory layout, not historical geographic coordinates.
    const places = [
      { x: -115, y: 155 }, { x: 1050, y: 150 }, { x: 1070, y: 465 },
      { x: -120, y: 490 }, { x: 490, y: -125 }, { x: 470, y: 760 }
    ];
    rivals.slice(0, places.length).forEach((rival, index) => {
      const { x, y } = places[index];
      const region = new Container();
      region.position.set(x, y);
      region.eventMode = 'static';
      region.cursor = 'pointer';
      region.hitArea = new Rectangle(-155, -105, 310, 210);
      region.on('pointertap', () => this.onNeighborSelect?.(rival.id));
      const subdued = rival.subjugated;
      const color = subdued ? 0x426b51 : [0x6b5542, 0x52596f, 0x6c544e, 0x536c62, 0x70624c, 0x5c5574][index];
      const boundary: number[] = [];
      for (let corner = 0; corner < 9; corner++) {
        const angle = corner * Math.PI * 2 / 9;
        const radius = 82 + ((index * 17 + corner * 13) % 21);
        boundary.push(Math.cos(angle) * radius * 1.55, Math.sin(angle) * radius);
      }
      region.addChild(new Graphics().poly(boundary).fill({ color, alpha: 0.86 })
        .stroke({ color: subdued ? 0xb5d7ad : 0xd2b990, width: 3, alpha: 0.9 }));
      // Distinctive capital-like symbols are decorative only. No fake capitals or
      // historical settlements are added to the RivalRealm game data.
      for (let n = 0; n < 3; n++) {
        const dx = -48 + n * 46, dy = n === 1 ? -46 : 43;
        region.addChild(new Graphics().roundRect(dx - 10, dy - 7, 20, 15, 2)
          .fill(0xb9ad87).stroke({ color: 0x3b342a, width: 1 }));
        region.addChild(new Graphics().poly([dx - 13, dy - 7, dx, dy - 18, dx + 13, dy - 7])
          .fill(0x76503c));
      }
      const label = new Text({ text: rival.name.slice(0, 25),
        style: { fontFamily: 'Georgia', fontSize: 20, fill: 0xfff0c9, align: 'center' } });
      label.anchor.set(0.5);
      label.position.set(0, -8);
      region.addChild(label);
      const status = new Text({ text: subdued ? 'Vasallenreich' : 'Nachbarreich',
        style: { fontFamily: 'Segoe UI', fontSize: 14, fill: 0xffecc9, align: 'center' } });
      status.anchor.set(0.5);
      status.position.set(0, 18);
      region.addChild(status);
      this.neighbors.addChild(region);
    });
    this.app.canvas.dataset.neighborTerritories = String(Math.min(rivals.length, places.length));
  }

  public setMapScope(scope: 'home' | 'world'): void {
    this.mapScope = scope;
    this.app.canvas.dataset.mapScope = scope;
    this.zoom = 1;
    this.offset = { x: 0, y: 0 };
    // Die Zoom-Ebene wird über das bestehende Verhalten gelegt, nicht ersetzt.
    this.zoomLevel = 'dorf';
    this.applyLevel('dorf');
    this.fit();
  }

  private fit(): void {
    if (!this.initialized || this.destroyed) return;
    // On phones the old 1350px reference shrank the entire settlement to a blur.
    // Fit to a narrower, usable map window; retain normal desktop framing.
    const mobile = this.app.screen.width < 760;
    if (this.zoomLevel === 'zentraleuropa') {
      // Eigene Einpassung für die Reliefkarte (960 × 660).
      // Wenig Slider-Zoom bedeutet Übersicht → Karte füllt die Fläche;
      // mehr Zoom vergrößert sie für Details. Die Dorf-Referenz (1350 × 850)
      // würde die Reliefkarte klein und versetzt darstellen.
      const mapWidth = 960;
      const mapHeight = 660;
      const fitScale = Math.min(this.app.screen.width / mapWidth, this.app.screen.height / mapHeight);
      const scale = fitScale * (0.85 + this.zoom * 0.35);
      this.world.scale.set(scale);
      this.world.position.set(
        (this.app.screen.width - mapWidth * scale) / 2 + this.offset.x,
        (this.app.screen.height - mapHeight * scale) / 2 + this.offset.y
      );
      this.app.renderer.render(this.app.stage);
      return;
    }
    const scale = (this.mapScope === 'world'
      ? Math.min(this.app.screen.width / 1500, this.app.screen.height / 1150)
      : mobile
        ? Math.min(this.app.screen.width / 820, this.app.screen.height / 960)
        : Math.min(this.app.screen.width / 1350, this.app.screen.height / 850)) * this.zoom;
    this.world.scale.set(scale);
    this.world.position.set(
      this.app.screen.width / 2 - 500 * scale + this.offset.x,
      (mobile ? this.app.screen.height * 0.54 : this.app.screen.height / 2) - 310 * scale + this.offset.y
    );
    this.app.renderer.render(this.app.stage);
  }

  /**
   * Low-cost atmospheric layers. Geometry stays deterministic and is rebuilt
   * only when infrastructure/season/era changes, never on every animation frame.
   */
  private drawAtmosphere(season: string = 'spring', epoch: string = 'medieval'): void {
    for (const child of this.atmosphere.removeChildren()) child.destroy({ children: true });
    const palette = season === 'winter' ? 0xc6dfdf : season === 'autumn' ? 0xb88955 : 0x8bb69c;
    const sky = new Graphics();
    sky.rect(36, 20, 926, 545).fill({ color: palette, alpha: season === 'winter' ? 0.10 : 0.04 });
    sky.ellipse(800, 80, 100, 38).fill({ color: 0xffe9b2, alpha: 0.09 });
    for (let i = 0; i < 11; i++) {
      const x = 95 + (i * 173) % 820;
      const y = 88 + (i * 71) % 450;
      sky.ellipse(x, y, 28 + (i % 3) * 12, 6)
        .fill({ color: palette, alpha: 0.07 + (i % 4) * 0.02 });
    }
    if (epoch === 'industrial' || epoch === 'modern') {
      sky.rect(125, 575, 740, 4).fill({ color: 0x8b918a, alpha: 0.55 });
      for (let i = 0; i < 18; i++) {
        const x = 125 + i * 40;
        sky.rect(x, 570, 4, 14).fill({ color: 0x8b918a, alpha: 0.55 });
      }
    }
    this.atmosphere.addChild(sky);
  }

  private drawLandscape(): void {
    const terrain = new Graphics();
    terrain.rect(-2000, -2000, 5000, 5000).fill(0x182d2a);
    terrain.poly([70, 180, 250, 60, 660, 40, 925, 190, 945, 450, 710, 580, 285, 570, 65, 390])
      .fill(0x2b4438).stroke({ color: 0x728369, width: 2, alpha: 0.35 });
    terrain.poly([80, 200, 280, 115, 455, 170, 310, 370, 100, 380]).fill(0x314c3d);
    terrain.poly([300, 385, 520, 295, 810, 400, 700, 540, 350, 525]).fill(0x3c503c);
    terrain.moveTo(70, 35).bezierCurveTo(400, 140, 120, 230, 240, 310)
      .bezierCurveTo(365, 390, 130, 440, 170, 630)
      .stroke({ width: 37, color: 0x1a3436 });
    terrain.moveTo(70, 35).bezierCurveTo(400, 140, 120, 230, 240, 310)
      .bezierCurveTo(365, 390, 130, 440, 170, 630)
      .stroke({ width: 23, color: 0x416d70 });
    terrain.moveTo(260, 420).lineTo(385, 275).lineTo(510, 205).lineTo(670, 255).lineTo(760, 145)
      .moveTo(385, 275).lineTo(530, 360).lineTo(720, 415)
      .moveTo(530, 360).lineTo(525, 490)
      .stroke({ width: 7, color: 0x8c8266, alpha: 0.65 });
    terrain.rect(246, 333, 48, 13).fill(0xa79a7d).stroke({ width: 2, color: 0x4b493b });
    for (let i = 0; i < 90; i++) {
      const x = 70 + ((i * 137) % 850);
      const y = 70 + ((i * 83) % 470);
      if (SETTLEMENT_DISTRICTS.some((place: SettlementDistrict) => Math.hypot(place.x - x, place.y - y) < 62) ||
          (x > 130 && x < 300)) continue;
      terrain.rect(x - 2, y, 4, 10).fill(0x22352d);
      terrain.poly([x - 12, y + 3, x, y - 24, x + 12, y + 3]).fill(i % 2 ? 0x47634b : 0x38573f);
      terrain.poly([x - 9, y - 6, x, y - 30, x + 9, y - 6]).fill(0x4a654d);
    }
    // Continuous environment details share the established map coordinate system.
    // Avoid scattering arbitrary thumbnail sprites or painting over district controls.
    const scenery = new Graphics();
    const groveCenters = [[785, 100], [830, 480], [150, 475], [690, 95], [890, 335]];
    for (const [cx, cy] of groveCenters) {
      scenery.ellipse(cx, cy + 5, 68, 32).fill({ color: 0x284a32, alpha: 0.55 });
      for (let i = 0; i < 9; i++) {
        const x = cx + Math.cos(i * 2.4) * (15 + (i % 3) * 13);
        const y = cy + Math.sin(i * 2.4) * (11 + (i % 4) * 8);
        if (SETTLEMENT_DISTRICTS.some(d => Math.hypot(d.x - x, d.y - y) < 58)) continue;
        scenery.ellipse(x + 4, y + 5, 14, 7).fill({color:0x13291e,alpha:0.32});
        scenery.rect(x - 2, y - 5, 4, 14).fill(0x685442);
        scenery.poly([x - 13,y - 3,x,y - 37,x + 13,y - 3]).fill(i % 2 ? 0x456d46 : 0x527b4e);
        scenery.poly([x - 10,y - 14,x,y - 42,x + 10,y - 14]).fill(0x659160);
      }
    }
    // Built stone connections and a bridge aligned to the existing paths.
    const roads = new Graphics();
    roads.moveTo(260, 420).lineTo(385, 275).lineTo(510, 205).lineTo(670, 255).lineTo(760, 145)
      .moveTo(385, 275).lineTo(530, 360).lineTo(720, 415)
      .moveTo(530, 360).lineTo(525, 490)
      .stroke({width:11,color:0x665e4b,alpha:0.65});
    roads.moveTo(260, 420).lineTo(385, 275).lineTo(510, 205).lineTo(670, 255).lineTo(760, 145)
      .moveTo(385, 275).lineTo(530, 360).lineTo(720, 415)
      .moveTo(530, 360).lineTo(525, 490)
      .stroke({width:7,color:0xc1ae83,alpha:0.9});
    const bridge = new Graphics();
    bridge.poly([217,325,266,320,290,345,241,350]).fill(0x78634a)
      .poly([217,323,266,318,289,341,240,346]).fill(0xbca77c)
      .moveTo(222,319).lineTo(246,341).moveTo(235,319).lineTo(258,343)
      .moveTo(250,319).lineTo(273,342).stroke({width:2,color:0x796444,alpha:0.75});
    terrain.addChild(scenery, roads, bridge);
    this.app.canvas.dataset.landscapeVersion = 'connected-1';
    this.world.addChild(terrain);
    const compass = new Text({
      text: 'N\n↑',
      style: { fontFamily: 'Georgia', fontSize: 22, fill: 0xc6c5a1, align: 'center' }
    });
    compass.position.set(910, 40);
    this.world.addChild(compass);
  }

  /**
   * Releases the renderer, textures, and resize observer.
   * @returns Nothing.
   */
  public dispose(): void {
    window.clearTimeout(this.actionTimer);
    this.actionTroops = [];
    this.actionVisual = undefined;
    this.destroyed = true;
    this.observer?.disconnect();
    document.removeEventListener('visibilitychange', this.visibility);
    if (this.initialized) this.app.ticker.remove(this.animatedTicker);
    if (this.initialized) this.app.destroy(true, { children: true });
    for (const child of this.regionLayer.removeChildren()) child.destroy({ children: true });
    for (const child of this.reliefLayer.removeChildren()) child.destroy({ children: true });
    this.reliefTexture = undefined;
  }
}
