import { Application, Assets, Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js';
import { Kingdom, KingdomInfrastructure } from '../core/Kingdom';
import { BUILDING_RENDER_VERSION, RenderedBuildingLibrary } from './RenderedBuildingLibrary';
import type { RivalRealm } from '../core/CampaignWarfareSystem';
import { StrategyWorld, type StrategyWorldSnapshot } from '../core/StrategyWorld';
import { SettlementDistrict, SETTLEMENT_DISTRICTS, DistrictFilter, visibleDistricts, districtModernization, districtSceneSignature, earlyBuildingName } from './SettlementSceneModel';
import { formatYear } from '../core/HistoricalCalendar';
import { startLocation, LOCAL_MAP_NOTE } from '../core/StartLocations';
import { drawLocalMap, validateLocalMap, type LocalMapData } from './LocalMap';
import {
  isZoomLevelsEnabled,
  levelForSlider,
  MapRegionResult,
  MapZoomLevel,
  sliderToZoom,
  zoomToSlider
} from './MapZoomLevels';
import { METRES_PER_BASE_PIXEL, metresToBase, clampZoom, scaleBar, stageForZoom } from './MapScale';
import { DWELLING_DOOR, DWELLING_HALF_DEPTH, DWELLING_HALF_WIDTH, YARD_EXTENT } from './FirstPersonLogic';

/**
 * Feste Verankerung der eigenen Behausung in der Siedlung (Basispixel).
 *
 * Der Schreibtisch ist dieser Behausung räumlich zugeordnet: Beim Hineinzoomen
 * bleibt die Kamera auf diesem Punkt, es wird keine getrennte Ansicht geöffnet.
 */
export const DWELLING_ANCHOR = { x: 500, y: 310 } as const;

/** Kamerazustand, der gespeichert und wiederhergestellt wird. */
export interface CameraState {
  zoom: number;
  x: number;
  y: number;
}

/**
 * PixiJS settlement overview. Counts represent infrastructure, not geographic claims.
 */
export class KingdomMap {
  private readonly app = new Application();
  private readonly renderedBuildings = new RenderedBuildingLibrary();
  private visibleGlbDistricts = 0;
  private readonly world = new Container();
  private readonly settlements = new Container();
  private readonly retroScenery = new Container();
  private readonly neighbors = new Container();
  private readonly worldMarker = new Container();
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
  private strategyWorld?: StrategyWorldSnapshot;
  private neighborRelations: Record<string,string> = {};

  public setStrategyWorld(world: StrategyWorldSnapshot, relations: Record<string,string>): void {
    this.strategyWorld = world;
    this.neighborRelations = relations;
  }
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
  private localTexture?: Texture;
  private localMapData?: LocalMapData;
  private localLoading = false;
  private localLoadFailed = false;
  private onLandmark?: () => void;
  private onCameraChange?: (state: CameraState) => void;
  private readonly reliefLayer = new Container();
  /** Bildschirmfeste Overlays: Maßstabsbalken und Stufenbezeichnung. */
  private readonly scaleLayer = new Container();
  /**
   * Nahgeometrie (Schreibtisch/Behausung): Hof, Behausung mit Innenraum und
   * Möbel an {@link DWELLING_ANCHOR}. Meter-Basis identisch zur
   * Ich-Perspektive (FirstPersonLogic), damit beide Ansichten zusammenpassen.
   */
  private readonly nearLayer = new Container();

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
    this.app.canvas.tabIndex = 0;
    this.app.canvas.setAttribute('aria-label', 'Karte: Pfeiltasten bewegen, Pos1 zentriert. Bezirke über Bauen, Nachbarreiche über Lebendige Welt erreichbar.');
    this.app.stage.addChild(this.world);
    this.drawLandscape();
    this.drawAtmosphere();
    this.world.addChild(this.atmosphere);
    this.world.addChild(this.retroScenery);
    this.world.addChild(this.neighbors);
    this.world.addChild(this.worldMarker);
    this.world.addChild(this.settlements);
    this.world.addChild(this.animation);
    // Additive Overlay-Ebene: niemals Teil der Simulation, nur Darstellung.
    this.regionLayer.visible = false;
    this.reliefLayer.visible = false;
    this.world.addChild(this.reliefLayer);
    this.world.addChild(this.regionLayer);
    this.world.addChild(this.nearLayer);
    this.drawNearGeometry();
    // Screen-fixed: never transformed with the world, so labels stay readable.
    this.app.stage.addChild(this.scaleLayer);
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
    // One shared pointer map: a single pointer pans, two pointers pinch-zoom.
    // This keeps desk → Europe in one continuous camera instead of mode jumps.
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; moved: boolean } | undefined;
    let pinch: { distance: number } | undefined;
    const pinchCentre = (): { x: number; y: number } => {
      const points = [...pointers.values()];
      const rect = canvas.getBoundingClientRect();
      return {
        x: points.reduce((sum, p) => sum + p.x, 0) / points.length - rect.left,
        y: points.reduce((sum, p) => sum + p.y, 0) / points.length - rect.top
      };
    };
    const pinchDistance = (): number => {
      const points = [...pointers.values()];
      if (points.length < 2) return 0;
      return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    };
    const canvas = this.app.canvas;
    canvas.addEventListener('keydown', (event: KeyboardEvent): void => {
      const directions: Record<string, [number, number]> = {ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
      if (directions[event.key]) {
        event.preventDefault();
        this.offset.x += directions[event.key][0];
        this.offset.y += directions[event.key][1];
        this.fit();
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.centerOnHome();
      }
    });
    canvas.addEventListener('wheel', (event: WheelEvent): void => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      // Anchored at the cursor so the point under the pointer stays put.
      const step = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.zoomBy(step, event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });
    canvas.addEventListener('pointerdown', (event: PointerEvent): void => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      canvas.setPointerCapture(event.pointerId);
      if (pointers.size === 1) {
        drag = { x: event.clientX, y: event.clientY, moved: false };
      } else if (pointers.size === 2) {
        drag = undefined;
        pinch = { distance: pinchDistance() };
      }
    });
    canvas.addEventListener('pointermove', (event: PointerEvent): void => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2 && pinch) {
        const distance = pinchDistance();
        if (pinch.distance > 0 && distance > 0) {
          const centre = pinchCentre();
          this.zoomBy(distance / pinch.distance, centre.x, centre.y);
        }
        pinch.distance = distance;
        return;
      }
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
    const endPointer = (event: PointerEvent): void => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = undefined;
      if (pointers.size === 0) drag = undefined;
    };
    canvas.addEventListener('pointerup', (event: PointerEvent): void => {
      if (drag && !drag.moved && this.zoomLevel === 'dorf' && this.mapScope === 'home') {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.world.x) / this.world.scale.x;
        const y = (event.clientY - rect.top - this.world.y) / this.world.scale.y;
        const location = visibleDistricts(this.districtFilter).find((place: SettlementDistrict) => Math.hypot(place.x - x, place.y - y) < 47);
        if (location) onSelect(location.type);
      }
      endPointer(event);
    });
    canvas.addEventListener('pointercancel', (event: PointerEvent): void => { endPointer(event); });
    this.fit();
    this.app.ticker.stop();
    void this.loadRetroAssets();
    this.app.canvas.dataset.buildingRendererVersion=BUILDING_RENDER_VERSION;
    this.app.canvas.dataset.buildingFramesLoaded='0';
    void this.renderedBuildings.load(import.meta.env.BASE_URL, () => {
      if(this.destroyed)return;
      this.app.canvas.dataset.buildingFramesLoaded=String(this.renderedBuildings.count);
      this.lastSignature='';
      if(this.retroContext){ const {kingdom,selected,completed,year,rivals}=this.retroContext; this.update(kingdom,selected,completed,year,rivals); }
    });
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
    // Early settlements use schematic low buildings rather than medieval towers.
    if (epoch === 'bronze' || epoch === 'ancient') {
      const alpha = count > 0 ? 1 : .35;
      const wall = epoch === 'bronze' ? 0xb9956a : 0xd3c4a4;
      const g = new Graphics();
      if (type === 'farms') {
        for (let i=0;i<5;i++) g.rect(-42+i*18,-12,12,30).fill({color:i%2 ? 0x9c9657 : 0x7f8c50,alpha});
      } else if (type === 'roads') {
        g.poly([-45,5,-30,-8,46,8,32,23]).fill({color:0xac956f,alpha});
      } else if (type === 'walls') {
        g.rect(-47,-18,94,30).fill({color:wall,alpha});
        for (let i=0;i<7;i++) g.rect(-43+i*14,-25,6,8).fill({color:wall,alpha});
      } else {
        g.ellipse(3,17,49,13).fill({color:0x17211c,alpha:.3*alpha})
          .rect(-34,-25,68,38).fill({color:wall,alpha})
          .poly([34,-25,47,-34,47,5,34,13]).fill({color:0x998365,alpha})
          .poly([-38,-25,-22,-37,49,-37,35,-25]).fill({color:epoch==='bronze'?0x8d714c:0x9b6e52,alpha})
          .rect(-7,-10,14,23).fill({color:0x5b5140,alpha});
        if (epoch === 'ancient' && (type === 'churches' || type === 'universities')) {
          for (let i=0;i<4;i++) g.rect(-29+i*18,-25,6,38).fill({color:0xe8dcc1,alpha});
          g.poly([-40,-27,0,-50,40,-27]).fill({color:0xcab899,alpha});
        }
      }
      group.addChild(g);
      return true;
    }
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
    visual.visible = this.zoomLevel === 'dorf';
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
    this.animation.visible = this.motionEnabled && this.zoomLevel === 'dorf' && this.mapScope === 'home';
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
    const previousYear = this.retroContext?.year;
    this.retroContext = { kingdom, selected, completed, year, rivals };
    if (previousYear !== year && this.zoomLevel === 'zentraleuropa') this.drawRegionLayer();
    const signature = districtSceneSignature(kingdom.infrastructure, selected,
      this.districtFilter, kingdom.currentSeason, completed) + JSON.stringify(rivals.map(r => [r.id,r.name,r.subjugated,r.soldiers,r.fortification])) + JSON.stringify([this.strategyWorld,this.neighborRelations]);
    const epochStyle = year < -799 ? 'bronze' : year < 500 ? 'ancient' : year >= 1945 ? 'modern' : year >= 1800 ? 'industrial' : year >= 1500 ? 'renaissance' : 'medieval';
    if (signature + epochStyle + year === this.lastSignature) return;
    this.lastSignature = signature + epochStyle + year;
    this.chimneys.length = 0;
    this.visibleGlbDistricts=0;
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
      const hasRenderedBuilding = this.projection === 'isometric' && this.renderedBuildings.draw(group,location.type,count,year);
      if(hasRenderedBuilding){ this.visibleGlbDistricts += 1; }
      else if (this.drawRetroDistrict(group, location.type, count, epochStyle)) {
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
        text: `${earlyBuildingName(location.type,year,location.name)} · ${count}${modernization ? ' ⚙' : ''}`,
        style: { fontFamily: 'Segoe UI', fontSize: 14, fill: 0xede8d2, fontWeight: '500' }
      });
      label.anchor.set(0.5, 0);
      label.position.set(0, 43);
      group.addChild(label);
      this.settlements.addChild(group);
    }
    this.app.canvas.dataset.renderedDistricts=String(this.visibleGlbDistricts);
    this.app.canvas.dataset.buildingFramesLoaded=String(this.renderedBuildings.count);
    // Total from the same infrastructure state the districts use; no copy.
    const totalBuildings = visibleDistricts(this.districtFilter)
      .reduce((sum, place) => sum + (kingdom.infrastructure[place.type] ?? 0), 0);
    this.app.canvas.dataset.settlementBuildings = String(totalBuildings);
    const summary = new Text({
      text: `${totalBuildings} Gebäude`,
      style: { fontFamily: 'Georgia', fontSize: 22, fill: 0xf4e6c5,
        stroke: { color: 0x2b2318, width: 3 } }
    });
    summary.position.set(38, 58);
    this.settlements.addChild(summary);
    const eraText = epochStyle === 'modern' ? 'Moderne' : epochStyle === 'industrial'
      ? 'Industrialisierung' : epochStyle === 'renaissance' ? 'Neuzeit' : epochStyle === 'bronze' ? 'Bronzezeit' : epochStyle === 'ancient' ? 'Antike' : 'Mittelalter';
    const badge = new Text({text: eraText + ' · ' + formatYear(year), style: {fontFamily: 'Georgia',
      fontSize: 25, fill: 0xf4e6c5}});
    badge.position.set(38, 26);
    this.settlements.addChild(badge);
    this.fit();
  }

  /**
   * Ändert den Zoom um einen Faktor, optional am Bildschirmpunkt verankert.
   *
   * Der Punkt unter dem Mauszeiger beziehungsweise zwischen den Fingern bleibt
   * dabei liegen; ohne Angabe wird um die Bildschirmmitte gezoomt. Es gibt
   * keinen Sprung zu einer anderen Ansicht.
   *
   * @param factor Multiplikator (>1 vergrößert, <1 verkleinert).
   * @param anchorX Bildschirm-x des Verankerungspunkts.
   * @param anchorY Bildschirm-y des Verankerungspunkts.
   * @returns Nothing.
   */
  public zoomBy(factor: number, anchorX?: number, anchorY?: number): void {
    if (this.destroyed || !Number.isFinite(factor) || factor <= 0) return;
    const previous = this.zoom;
    const next = clampZoom(previous * factor);
    if (next === previous) return;
    const width = this.app.screen?.width ?? 0;
    const height = this.app.screen?.height ?? 0;
    const ax = anchorX ?? width / 2;
    const ay = anchorY ?? height / 2;
    // Keep the anchored world point fixed while the scale changes.
    const ratio = next / previous;
    this.offset.x = ax - (ax - this.offset.x) * ratio;
    this.offset.y = ay - (ay - this.offset.y) * ratio;
    this.zoom = next;
    this.syncLevelFromZoom();
    this.fit();
  }

  /** Setzt den Zoom direkt (kontinuierlich, kein Moduswechsel). */
  public setZoom(zoom: number): void {
    if (this.destroyed) return;
    this.zoom = clampZoom(zoom);
    this.syncLevelFromZoom();
    this.fit();
  }

  /** Aktueller Zoom. */
  public getZoom(): number {
    return this.zoom;
  }

  /** Bezeichnung der Detailstufe (dieselbe Ansicht, keine getrennte Karte). */
  public getStage(): string {
    return stageForZoom(this.zoom);
  }

  /** Maßstabsbalken für die aktuelle Ansicht. */
  public getScaleBar(): { metres: number; label: string } {
    return scaleBar(this.zoom);
  }

  /** Meter je Bildschirmpixel in der aktuellen Ansicht. */
  public getMetresPerScreenPixel(): number {
    const screenScale = this.effectiveScreenScale();
    return screenScale > 0 ? METRES_PER_BASE_PIXEL / screenScale : 0;
  }

  /** Tatsächliche Bildschirmskalierung der Welt (Basispixel → Bildschirmpixel). */
  private effectiveScreenScale(): number {
    return this.world.scale.x || 0;
  }

  /** Kamerazustand zum Speichern. */
  public getCameraState(): CameraState {
    return { zoom: this.zoom, x: this.offset.x, y: this.offset.y };
  }

  /**
   * Stellt einen gespeicherten Kamerazustand wieder her.
   * Veraltete Moduswerte werden ignoriert, nicht wieder eingeführt.
   */
  public setCameraState(state: Partial<CameraState> | undefined | null): void {
    if (this.destroyed || !state) return;
    if (Number.isFinite(state.zoom)) this.zoom = clampZoom(state.zoom as number);
    if (Number.isFinite(state.x)) this.offset.x = state.x as number;
    if (Number.isFinite(state.y)) this.offset.y = state.y as number;
    this.syncLevelFromZoom();
    this.fit();
  }

  /**
   * Zentriert die Ansicht auf den eigenen Standort.
   * Verändert nur den Kartenausschnitt, nicht die Spielposition.
   */
  public centerOnHome(): void {
    if (this.destroyed) return;
    this.offset = { x: 0, y: 0 };
    this.fit();
  }

  /** Setzt die Kartenrotation zurück (Ansicht nach Norden ausrichten). */
  public faceNorth(): void {
    if (this.destroyed) return;
    this.world.rotation = 0;
    this.fit();
  }

  /** Ist die Ansicht nach Norden ausgerichtet? */
  public isNorthUp(): boolean {
    return this.world.rotation === 0;
  }

  /**
   * Adjusts zoom or resets the map position.
   * @param change Zoom increment; zero resets the view.
   * @returns Nothing.
   */
  public changeZoom(change: number): void {
    if (!Number.isFinite(change) || this.destroyed) return;
    if (change === 0) { this.centerOnHome(); return; }
    // Multiplicative stepping keeps the feel even across the whole range.
    this.zoomBy(change > 0 ? 1.35 : 1 / 1.35);
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
    if (this.destroyed) return;
    this.zoom = sliderToZoom(slider);
    this.syncLevelFromZoom();
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
    if (this.destroyed) return;
    this.regionResult = result;
    this.drawRegionLayer();
    this.fit();
  }

  /** Legende der Regionsansicht für die Oberfläche (nie leer). */
  public getRegionLegend(): string {
    if (this.mapScope === 'home') return this.localLoadFailed ? 'Ganderkesee: Kartendaten konnten nicht geladen werden. Landkarte erneut öffnen, um es nochmals zu versuchen.' : LOCAL_MAP_NOTE;
    return this.regionResult?.message ?? 'Keine Regionsdaten geladen.';
  }

  public setLandmarkAction(action: () => void): void { this.onLandmark = action; }

  private async loadLocalMap(): Promise<void> {
    if ((this.localTexture && this.localMapData) || this.localLoading || this.destroyed) return;
    this.localLoading=true;
    try {
      const location=startLocation();
      const [texture,data]=await Promise.all([
        Assets.load<Texture>(import.meta.env.BASE_URL+location.terrainAsset),
        Assets.load<unknown>(import.meta.env.BASE_URL+location.mapAsset)
      ]);
      if(this.destroyed)return;
      this.localMapData=validateLocalMap(data);this.localTexture=texture;this.localLoadFailed=false;
      this.drawSettlementTerrain();
      this.app.canvas.dataset.localMapLoaded='true';
      this.app.canvas.dataset.reliefLoaded='true';
      this.app.canvas.dataset.mapLocation=location.id;
      this.drawRegionLayer();this.fit();
    } catch(error) {
      if(this.destroyed)return;
      this.localLoadFailed=true;this.app.canvas.dataset.localMapLoaded='false';
      console.warn('Heimatkarte nicht verfügbar',error);
      this.drawRegionLayer();this.fit();
    } finally {this.localLoading=false;}
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
    if (this.destroyed) return;
    if (!isZoomLevelsEnabled()) level = 'dorf';
    const changed = this.zoomLevel !== level;
    // No pan reset on level change: the camera must stay continuous across
    // detail stages, otherwise zooming would jump the view.
    this.zoomLevel = level;
    const village = level === 'dorf';
    this.world.visible = true;
    this.settlements.visible = village && this.mapScope === 'home';
    this.settlementTerrain.visible=village&&this.mapScope==='home';
    // Legacy thumbnail scatter was retired in favor of the connected landscape.
    // Scope/zoom changes must not resurrect those opaque preview tiles.
    this.retroScenery.visible = false;
    this.neighbors.visible = village;
    this.worldMarker.visible = village && this.mapScope === 'world';
    this.animation.visible = village && this.mapScope === 'home' && this.motionEnabled;
    this.atmosphere.visible = village;
    if (this.actionVisual) this.actionVisual.visible = village;
    this.regionLayer.visible = level === 'zentraleuropa';
    this.reliefLayer.visible = level === 'zentraleuropa';
    if (level === 'zentraleuropa') {
      if (changed || this.regionLayer.children.length === 0) this.drawRegionLayer();
      void this.loadReliefTexture();
    }
    this.applyDetailFade();
    this.app.canvas.dataset.zoomLevel = level;
    this.fit();
  }

  /**
   * Blendet Inhalte abhängig vom Zoom ein oder aus.
   *
   * Die Übergänge sind gestaffelt statt an einer harten Schwelle, damit beim
   * Zoomen nichts flackert. Gebäude verschwinden beim Herauszoomen, statt als
   * übergroße Häuser über der Region zu liegen.
   */
  private applyDetailFade(): void {
    if (this.destroyed) return;
    const zoom = this.zoom;
    // Buildings: visible up close, hidden when a house would span a region.
    const buildingsVisible = zoom >= 0.35;
    this.settlements.visible = buildingsVisible && this.mapScope === 'home';
    this.settlementTerrain.visible = buildingsVisible && this.mapScope === 'home';
    this.animation.visible = buildingsVisible && this.mapScope === 'home' && this.motionEnabled;
    // Nahgeometrie erscheint, wenn die Siedlung nicht mehr ins Bild passt
    // (Zoom > 4 ≈ sichtbare Breite unter 7,3 km) und bleibt bis zum
    // Schreibtisch sichtbar. Sie ist die Brücke zur Ich-Perspektive.
    const nearVisible = zoom > 4 && this.mapScope === 'home';
    this.nearLayer.visible = nearVisible;
    this.settlements.visible = this.settlements.visible && zoom <= 60;
    // Neighbours and relief appear once the settlement no longer fills the view.
    const wide = zoom < 0.9;
    this.neighbors.visible = wide;
    this.worldMarker.visible = wide && this.mapScope === 'world';
    this.regionLayer.visible = zoom < 0.16;
    this.reliefLayer.visible = zoom < 0.16;
    if (this.regionLayer.visible && this.regionLayer.children.length === 0) this.drawRegionLayer();
    if (this.reliefLayer.visible) void this.loadReliefTexture();
  }

  /**
   * Lädt die Relief-Textur der Ebene „Zentraleuropa".
   *
   * Quelle: Natural Earth 1:50m Shaded Relief, Public Domain. Das Laden ist
   * fehlertolerant: Schlägt es fehl, bleibt die Regionsansicht ohne Relief
   * bedienbar (nur Punkte und Namen).
   */
  private async loadReliefTexture(): Promise<void> {
    if (this.mapScope === 'home') return this.loadLocalMap();
    if (this.reliefTexture || this.reliefLoading || this.destroyed) return;
    this.reliefLoading = true;
    try {
      const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
      const url = `${base}maps/landscape-central-europe.webp`;
      const texture = await Assets.load<Texture>(url);
      if (this.destroyed) return;
      this.reliefTexture = texture;
      this.app.canvas.dataset.reliefLoaded = 'true';
      this.drawRegionLayer();
      this.fit();
    } catch (error) {
      if (this.destroyed) return;
      console.warn('Relief-Textur nicht verfügbar; Regionsansicht bleibt ohne Relief.', error);
      this.app.canvas.dataset.reliefLoaded = 'false';
    } finally {
      this.reliefLoading = false;
    }
  }

  /**
   * Zeichnet die Nahgeometrie (Hof, Behausung, Innenraum) an der
   * Behausungsverankerung. Einheiten: Meter → Basispixel über die einzige
   * Umrechnung {@link METRES_PER_BASE_PIXEL}; identische Maße wie die
   * Ich-Perspektive (FirstPersonLogic), damit Haus und Dorf zusammenpassen.
   *
   * Die Geometrie ist statisch und wird einmal gebaut; Sichtbarkeit steuert
   * {@link applyDetailFade}.
   */
  private drawNearGeometry(): void {
    if (this.destroyed) return;
    for (const child of this.nearLayer.removeChildren()) child.destroy({ children: true });
    const g = (m: number): number => metresToBase(m);
    const anchor = DWELLING_ANCHOR;
    const layer = this.nearLayer;
    // Hof (24 × 24 m um die Behausung) — dieselbe Fläche wie YARD_EXTENT.
    const yard = new Graphics();
    yard.rect(anchor.x - g(YARD_EXTENT), anchor.y - g(YARD_EXTENT),
      g(2 * YARD_EXTENT), g(2 * YARD_EXTENT))
      .fill({ color: 0x6a8a5c, alpha: 0.85 });
    yard.rect(anchor.x - g(YARD_EXTENT), anchor.y - g(YARD_EXTENT),
      g(2 * YARD_EXTENT), g(2 * YARD_EXTENT))
      .stroke({ color: 0x4d6b45, width: 2, alpha: 0.6 });
    layer.addChild(yard);
    // Behausung: 6 × 8 m (DWELLING_HALF_* × 2), Tür an der Südseite.
    const house = new Graphics();
    const hw = g(DWELLING_HALF_WIDTH), hd = g(DWELLING_HALF_DEPTH);
    house.roundRect(anchor.x - hw, anchor.y - hd, 2 * hw, 2 * hd, 2)
      .fill(0x8a6b4a);
    house.roundRect(anchor.x - hw, anchor.y - hd, 2 * hw, 2 * hd, 2)
      .stroke({ color: 0x5d4630, width: 2 });
    // Innenraum (dunkler Kern) und Türspalt (Hoffarbe).
    house.roundRect(anchor.x - hw + 1, anchor.y - hd + 1, 2 * hw - 2, 2 * hd - 2, 1)
      .fill(0x6d5336);
    const doorW = g(DWELLING_DOOR.x1 - DWELLING_DOOR.x0);
    house.rect(anchor.x - doorW / 2, anchor.y + hd - 2, doorW, 4)
      .fill(0x6a8a5c);
    layer.addChild(house);
    // Möbel (Meter identisch zur Ich-Perspektive): Tisch, Bank, Bett, Herd.
    const furniture = new Graphics();
    const box = (mx: number, mz: number, mw: number, md: number, color: number): void => {
      furniture.rect(anchor.x + g(mx) - g(mw) / 2, anchor.y + g(mz) - g(md) / 2,
        g(mw), g(md)).fill(color).stroke({ color: 0x3a2c1c, width: 1 });
    };
    box(0, -2.6, 1.8, 0.9, 0x8a6238);   // Tisch
    box(0, -1.7, 1.8, 0.35, 0x7a5630);  // Bank
    box(-2.2, 2.4, 1.9, 0.9, 0x9a8a66); // Bett
    box(2.3, -2.8, 1.1, 1.1, 0x4a4038); // Herd
    layer.addChild(furniture);
    // Beschriftung erst ab Behausungsstufe sinnvoll; hier nur Datenattribut.
    this.app.canvas.dataset.nearGeometry = 'dwelling-yard-furniture';
  }

  /**
   * Zeichnet die schematischen Regionsnamen.
   *
   * Bewusst ohne Grenzlinien: Relief als Hintergrund, Punkt und Name je Region,
   * dazu eine Legende, die Quelle und Schematik ausdrücklich benennt.
   */
  private drawRegionLayer(): void {
    if (this.destroyed) return;
    this.app.canvas.dataset.regionCount = String(this.regionResult?.labels.length ?? 0);
    for (const child of this.regionLayer.removeChildren()) child.destroy({ children: true });
    for (const child of this.reliefLayer.removeChildren()) child.destroy({ children: true });
    if (this.mapScope === 'home') {
      const count=drawLocalMap(this.reliefLayer,this.localTexture,this.localMapData,this.retroContext?.year??1200,this.onLandmark);
      this.app.canvas.dataset.localRiverSegments=String(count);
      this.app.canvas.dataset.regionCount=String(this.localMapData?Object.keys(this.localMapData.places).length:0);
      if(this.localLoadFailed) this.regionLayer.addChild(new Text({text:'Kartendaten fehlen · Landkarte erneut öffnen',style:{fontSize:22,fill:0xffffff}}));
      return;
    }
    const result = this.regionResult;
    const width = 960;
    const height = 660;

    // Relief als Hintergrund – physische Geografie, keine politische Grenze.
    if (this.reliefTexture) {
      const sprite = new Sprite(this.reliefTexture);
      sprite.width = width;
      sprite.height = height;
      // Zurückhaltend abdunkeln, damit Namen lesbar bleiben.
      sprite.tint = 0xffffff;
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

    const labelBoxes: { x: number; y: number; width: number; height: number }[] = [];
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
      let labelY = -20;
      while (labelBoxes.some(box => Math.abs(box.x - x) < (box.width + text.width) / 2 + 6 &&
        Math.abs(box.y - (y + labelY)) < (box.height + text.height) / 2 + 4)) labelY -= 25;
      if (labelY !== -20) marker.addChild(new Graphics().moveTo(0, -8).lineTo(0, labelY + 10)
        .stroke({ color: 0x334e42, width: 1, alpha: 0.7 }));
      text.position.set(0, labelY);
      labelBoxes.push({ x, y: y + labelY, width: text.width, height: text.height });
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
    const fallback = new StrategyWorld(this.retroContext?.year ?? 1200);
    fallback.sync(rivals.map(r=>r.id));
    const world = this.strategyWorld ?? fallback.serialize();
    const roads = new Graphics();
    for (const region of world.regions.filter(r=>r.rivalId && rivals.some(rival=>rival.id===r.rivalId))) {
      roads.moveTo(480,320).lineTo(region.x,region.y).stroke({color:0xc9b98b,width:5,alpha:0.45});
    }
    this.neighbors.addChild(roads);
    for (const child of this.worldMarker.removeChildren()) child.destroy({children:true});
    const home = new Text({text:'Heimat',style:{fontFamily:'Georgia',fontSize:24,fill:0xfff0c9}});
    home.anchor.set(0.5);
    home.position.set(480,320);
    this.worldMarker.addChild(home);
    const current = world.regions.find(r=>r.id===world.currentRegion);
    if (current) {
      this.worldMarker.addChild(new Graphics().circle(current.x,current.y-75,10).fill(0xf6d77c)
        .stroke({color:0x302b22,width:3}));
      const marker = new Text({text:world.journey ? 'Unterwegs' : 'Aufenthalt',style:{fontFamily:'Segoe UI',fontSize:14,fill:0xffedb6}});
      marker.anchor.set(0.5);marker.position.set(current.x,current.y-100);
      this.worldMarker.addChild(marker);
    }
    this.worldMarker.visible = this.zoomLevel==='dorf' && this.mapScope==='world';
    rivals.forEach((rival, index) => {
      const place = world.regions.find(r=>r.rivalId===rival.id) ?? fallback.serialize().regions.find(r=>r.rivalId===rival.id)!;
      const { x, y } = place;
      const region = new Container();
      region.position.set(x, y);
      region.eventMode = 'static';
      region.cursor = 'pointer';
      region.hitArea = new Rectangle(-155, -105, 310, 210);
      region.on('pointertap', () => this.onNeighborSelect?.(rival.id));
      const subdued = rival.subjugated;
      const color = subdued ? 0x426b51 : this.neighborRelations[rival.id] === 'Feindlich' ? 0x8c4840 :
        place.discovered ? [0x6b5542, 0x52596f, 0x6c544e, 0x536c62, 0x70624c, 0x5c5574][index % 6] : 0x51594f;
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
      const status = new Text({ text: (subdued ? 'Vasall' : this.neighborRelations[rival.id] ?? 'Nachbarreich') + ' · ' + (place.discovered ? place.terrain : 'Unerkundet') + '\n' + rival.soldiers.toLocaleString('de-DE')+' Soldaten · Befestigung '+rival.fortification.toFixed(2),
        style: { fontFamily: 'Segoe UI', fontSize: 14, fill: 0xffecc9, align: 'center' } });
      status.anchor.set(0.5);
      status.position.set(0, 18);
      region.addChild(status);
      this.neighbors.addChild(region);
    });
    this.app.canvas.dataset.neighborTerritories = String(rivals.length);
  }

  public setMapScope(scope: 'home' | 'world'): void {
    this.mapScope = scope;
    this.app.canvas.dataset.mapScope = scope;
    // A continuous camera keeps its zoom; switching scope is not a new view.
    this.offset = { x: 0, y: 0 };
    this.applyLevel('dorf');
    this.fit();
  }

  public focusWorldRegion(id: string): void {
    const region = this.strategyWorld?.regions.find(r=>r.id===id);
    if (!region || !this.initialized || this.destroyed) return;
    this.setMapScope('world');
    this.zoom = 3;
    this.fit();
    this.offset = {
      x:this.app.screen.width/2 - (this.world.x + region.x*this.world.scale.x),
      y:this.app.screen.height/2 - (this.world.y + region.y*this.world.scale.y)
    };
    this.app.canvas.dataset.focusedRegion = id;
    this.fit();
    this.app.canvas.focus();
  }

  /**
   * Zeichnet den Maßstabsbalken und die Stufenbezeichnung.
   *
   * Beides ist bewusst bildschirmgroß: Beschriftungen und Symbole skalieren
   * nicht mit der Geometrie. Die Balkenlänge wird aus dem gemeinsamen Maßstab
   * berechnet und passt daher zum jeweiligen Ausschnitt.
   */
  private drawScaleBar(): void {
    if (this.destroyed) return;
    for (const child of this.scaleLayer.removeChildren()) child.destroy({ children: true });
    const bar = scaleBar(this.zoom);
    const screenScale = this.effectiveScreenScale();
    if (screenScale <= 0) return;
    // Bar length in screen pixels follows the same metre basis as the geometry.
    const widthPx = Math.max(24, (bar.metres / METRES_PER_BASE_PIXEL) * screenScale);
    const x = 16, y = this.app.screen.height - 34;
    const line = new Graphics()
      .moveTo(x, y).lineTo(x + widthPx, y)
      .moveTo(x, y - 5).lineTo(x, y + 5)
      .moveTo(x + widthPx, y - 5).lineTo(x + widthPx, y + 5)
      .stroke({ color: 0x2c2418, width: 2.5 });
    this.scaleLayer.addChild(line);
    const caption = new Text({
      text: `${bar.label} · ${stageForZoom(this.zoom)}`,
      style: { fontFamily: 'Segoe UI', fontSize: 13, fill: 0x2c2418,
        stroke: { color: 0xf3ecd9, width: 3 } }
    });
    caption.position.set(x, y - 22);
    this.scaleLayer.addChild(caption);
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
      const mapHeight = this.mapScope === 'home' ? 672 : 660;
      const fitScale = Math.min((this.app.screen.width - 24) / mapWidth, (this.app.screen.height - 76) / mapHeight);
      const scale = fitScale * (0.95 + (zoomToSlider(this.zoom) - 28) * 0.006);
      this.world.scale.set(scale);
      this.world.position.set(
        (this.app.screen.width - mapWidth * scale) / 2 + this.offset.x,
        (this.app.screen.height - mapHeight * scale) / 2 + 25 + this.offset.y
      );
      this.publishScale(scale);
      this.app.renderer.render(this.app.stage);
      return;
    }
    if (this.mapScope === 'world') {
      const bounds = this.neighbors.getLocalBounds();
      const minX = Math.min(bounds.x,300), minY = Math.min(bounds.y,220);
      const maxX = Math.max(bounds.x+bounds.width,660), maxY = Math.max(bounds.y+bounds.height,420);
      const scale = Math.max(0.01,Math.min((this.app.screen.width-32)/(maxX-minX), (this.app.screen.height-72)/(maxY-minY))) * this.zoom;
      this.world.scale.set(scale);
      this.world.position.set(this.app.screen.width/2-(minX+maxX)/2*scale+this.offset.x,
        this.app.screen.height/2+16-(minY+maxY)/2*scale+this.offset.y);
      this.publishScale(scale);
      this.app.renderer.render(this.app.stage);
      return;
    }
    const scale = (mobile
        ? Math.min(this.app.screen.width / 820, this.app.screen.height / 960)
        : Math.min(this.app.screen.width / 1350, this.app.screen.height / 850)) * this.zoom;
    this.world.scale.set(scale);
    // Bei Nahstufen (Schreibtisch/Behausung) bleibt die Kamera an der
    // Behausungsverankerung verankert: Der Ausschnitt zeigt den Hof, nicht
    // eine leere Fläche. Versatz bleibt möglich, wird aber begrenzt.
    const maxPan = Math.max(0, (this.app.screen.width / scale) * 0.9);
    const maxPanY = Math.max(0, (this.app.screen.height / scale) * 0.9);
    const offsetX = Math.max(-maxPan, Math.min(maxPan, this.offset.x));
    const offsetY = Math.max(-maxPanY, Math.min(maxPanY, this.offset.y));
    this.world.position.set(
      this.app.screen.width / 2 - 500 * scale + offsetX,
      (mobile ? this.app.screen.height * 0.54 : this.app.screen.height / 2) - 310 * scale + offsetY
    );
    this.publishScale(scale);
    this.app.renderer.render(this.app.stage);
  }

  /** Optionaler Rückruf nach jeder Kamerabewegung (Persistenz in der Engine). */
  public setCameraListener(listener: ((state: CameraState) => void) | undefined): void {
    this.onCameraChange = listener;
  }

  /** Aktualisiert Maßstabsbalken und Datenattribute nach jeder Kamerabewegung. */
  private publishScale(screenScale: number): void {
    this.drawScaleBar();
    const canvas = this.app.canvas;
    canvas.dataset.mapZoom = this.zoom.toPrecision(6);
    canvas.dataset.mapStage = stageForZoom(this.zoom);
    canvas.dataset.metresPerPixel = screenScale > 0
      ? (METRES_PER_BASE_PIXEL / screenScale).toPrecision(6) : '0';
    this.onCameraChange?.(this.getCameraState());
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

  private readonly settlementTerrain=new Container();
  private drawLandscape():void {
    this.world.addChild(new Graphics().rect(-2000,-2000,5000,5000).fill(0x182d2a));
    this.world.addChild(this.settlementTerrain);
    void this.loadLocalMap();
  }
  private drawSettlementTerrain():void {
    for(const child of this.settlementTerrain.removeChildren())child.destroy({children:true});
    if(!this.localTexture||!this.localMapData)return;
    const sprite=new Sprite(this.localTexture);sprite.width=960;sprite.height=672;this.settlementTerrain.addChild(sprite);
    const water=new Graphics();
    for(const river of this.localMapData.rivers) {
      if(river.points.length<2)continue;
      water.moveTo(...river.points[0]);for(const p of river.points.slice(1))water.lineTo(...p);
    }
    water.stroke({width:2.3,color:0x287b99});
    const mask=new Graphics().rect(0,0,960,672).fill(0xffffff);
    water.mask=mask;this.settlementTerrain.addChild(water,mask);
    const label=new Text({text:'Ganderkeseer Geest · 20 × 14 km · reale Geländebasis, modellierte Bauplätze',style:{fontSize:13,fill:0x213a35,stroke:{color:0xf2ecd5,width:3}}});
    label.position.set(22,640);this.settlementTerrain.addChild(label);
    this.app.canvas.dataset.settlementTerrain='ganderkesee';
    this.app.canvas.dataset.settlementRiverSegments=String(this.localMapData.rivers.length);
    this.app.canvas.dataset.landscapeVersion='ganderkesee-2';
  }

  /**
   * Releases the renderer, textures, and resize observer.
   * @returns Nothing.
   */
  public dispose(): void {
    if (this.destroyed) return;
    window.clearTimeout(this.actionTimer);
    this.actionTroops = [];
    this.actionVisual = undefined;
    this.destroyed = true;
    this.renderedBuildings.dispose();
    this.observer?.disconnect();
    document.removeEventListener('visibilitychange', this.visibility);
    if (this.initialized) this.app.ticker.remove(this.animatedTicker);
    if (this.initialized) this.app.destroy(true, { children: true });
    else this.world.destroy({ children: true });
    this.reliefTexture = undefined;
    this.localTexture = undefined;
    this.localMapData = undefined;
  }
}
