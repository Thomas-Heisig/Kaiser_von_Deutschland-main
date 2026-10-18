import { Application, Assets, Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js';
import { Kingdom, KingdomInfrastructure } from '../core/Kingdom';
import type { RivalRealm } from '../core/CampaignWarfareSystem';
import { SettlementDistrict, SETTLEMENT_DISTRICTS, DistrictFilter, visibleDistricts, districtModernization, districtSceneSignature } from './SettlementSceneModel';

/**
 * PixiJS settlement overview. Counts represent infrastructure, not geographic claims.
 */
export class KingdomMap {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly settlements = new Container();
  private readonly retroScenery = new Container();
  private readonly neighbors = new Container();
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
  private retroHouse?: Texture;
  private readonly retroEpochTextures = new Map<string, Texture>();
  private retroEnabled = false;
  private projection: 'flat' | 'isometric' = 'isometric';
  private retroLoading = false;
  private retroContext?: { kingdom: Kingdom; selected: keyof KingdomInfrastructure; completed: readonly string[]; year: number; rivals: readonly RivalRealm[] };

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
  public async initialize(host: HTMLElement, onSelect: (type: keyof KingdomInfrastructure) => void): Promise<void> {
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
    this.retroScenery.visible = mode === 'isometric';
    this.app.canvas.dataset.retroProjection = mode;
    this.app.canvas.dataset.retroVisible = String(this.retroEnabled && mode === 'isometric');
    this.lastSignature = '';
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
        this.retroHouse = house.status === 'fulfilled' ? house.value : undefined;
        // Future epoch art uses separate named atlases. Optional and non-blocking:
        // the existing retro scene remains playable if they are absent.
        void Promise.allSettled(['fantasy','urban','textures'].map(async name => {
          const texture = await Assets.load<Texture>(base + 'assets/kenney/retro-' + name + '-atlas.png');
          if (!this.destroyed) {
            this.retroEpochTextures.set(name, texture);
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

  /** Deterministic CC0 Kenney landscape details, visually separate from game state.
   * Never place art over a district hit area or use an unbounded number of sprites.
   */
  private drawRetroScenery(): void {
    for (const child of this.retroScenery.removeChildren()) child.destroy({ children: true });
    if (!this.retroAtlas || this.destroyed) return;
    this.retroScenery.visible = this.projection === 'isometric';
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
    this.app.canvas.dataset.retroScenery = String(this.retroScenery.children.length);
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

  /** Use the epoch atlas when available, otherwise the established CC0 fallback.
   * The new atlases consist of eight 16×16 thumbnails in a horizontal strip.
   */
  private retroEpochTile(epoch: string, index: number, x: number, y: number, size: number): Sprite {
    const key = epoch === 'industrial' || epoch === 'modern' ? 'urban' : 'fantasy';
    const atlas = this.retroEpochTextures.get(key);
    if (!atlas) return this.retroTile(index % 8, x, y, size);
    const texture = new Texture({
      source: atlas.source,
      frame: new Rectangle((index % 8) * 16, 0, 16, 16)
    });
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(x, y);
    sprite.width = size;
    sprite.height = size;
    return sprite;
  }

  /** All 16 infrastructure districts receive a coherent Retro representation. */
  private drawRetroDistrict(group: Container, type: keyof KingdomInfrastructure, count: number, epoch: string): boolean {
    if (!this.retroEnabled || !this.retroAtlas || this.projection === 'flat') return false;
    // Asset indices of the verified Kenney CC0 preview atlas:
    // floor=0, door=1, window=2, roof=3, tree=4, barrel=5, tower=6, grass=7.
    // The same historic fixed district can show distinct silhouettes across epochs.
    const later = epoch === 'modern' || epoch === 'industrial';
    const opacity = count > 0 ? 1 : 0.4;
    const tile = (index: number, x: number, y: number, size: number): void => {
      const sprite = this.retroEpochTile(epoch, index, x, y, size);
      sprite.alpha = opacity;
      group.addChild(sprite);
    };
    if (type === 'roads') {
      for (let i = 0; i < 3; i++) tile(later ? 0 : 7, -30 + i * 30, 15 + (i % 2) * 3, 46);
    } else if (type === 'farms') {
      for (let i = 0; i < 5; i++) tile(i % 3 === 0 ? 4 : 7, -42 + i * 20, 15 + i % 2 * 11, i % 3 === 0 ? 31 : 36);
    } else if (type === 'ports') {
      for (let i = 0; i < 3; i++) tile(i % 2 === 0 ? 0 : 5, -29 + i * 27, 12, 43);
      tile(4, 37, 10, 36);
    } else if (type === 'walls') {
      for (let i = 0; i < 4; i++) tile(6, -37 + i * 24, 7, later ? 49 : 42);
    } else if (type === 'mines') {
      group.addChild(new Graphics().poly([-34, 15, 0, -26, 39, 15]).fill(0x807d69));
      tile(1, 0, 15, 60);
      tile(5, 27, 18, 29);
    } else if (type === 'castles' || type === 'barracks') {
      tile(6, -23, 7, 91);
      tile(6, 23, 7, 84);
      tile(later ? 2 : 1, 0, 15, 62);
    } else if (type === 'churches' || type === 'universities') {
      tile(6, -18, 6, 87);
      tile(type === 'churches' ? 3 : 2, 24, 9, 73);
    } else {
      const buildings = Math.max(1, Math.min(count, 3));
      for (let i = 0; i < buildings; i++) {
        const x = (i - (buildings - 1) / 2) * 34, y = i % 2 ? 11 : 5;
        if (this.retroHouse && !later && (type === 'workshops' || type === 'taverns' || type === 'warehouses' || type === 'markets')) {
          const house = new Sprite(this.retroHouse);
          house.anchor.set(0.5, 1);
          house.position.set(x, y + 9);
          house.width = 47;
          house.height = 74;
          house.alpha = opacity;
          group.addChild(house);
        } else {
          tile(later ? 2 : i % 2 ? 2 : 1, x, y + 9, later ? 69 : 63);
          tile(later ? 0 : 3, x, y - 38, later ? 53 : 49);
        }
        if (type === 'workshops' || type === 'guildhalls') tile(5, x + 24, y + 11, 24);
        if (type === 'hospitals' || type === 'schools') tile(4, x + 24, y + 8, 25);
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
   * @param change Zoom increment; zero resets the view.
   * @returns Nothing.
   */
  public changeZoom(change: number): void {
    this.zoom = change === 0 ? 1 : Math.max(0.8, Math.min(2.2, this.zoom + change));
    if (change === 0) this.offset = { x: 0, y: 0 };
    this.fit();
  }

  /** Neighboring realms are geographic illustrations, not claims of historical borders. */
  private drawNeighbors(rivals: readonly RivalRealm[]): void {
    for (const child of this.neighbors.removeChildren()) child.destroy({children:true});
    const places = [
      {x:-115,y:155},{x:1050,y:150},{x:1070,y:465},{x:-120,y:490},
      {x:490,y:-125},{x:470,y:760}
    ];
    rivals.slice(0,places.length).forEach((rival,index) => {
      const {x,y}=places[index];
      const region = new Container();region.position.set(x,y);
      region.addChild(new Graphics().ellipse(0,0,155,100)
        .fill({color:rival.subjugated?0x436c53:0x665044,alpha:0.7})
        .stroke({color:0xd2b990,width:2,alpha:0.65}));
      const name = new Text({text:rival.name.slice(0,25),style:{
        fontFamily:'Georgia',fontSize:22,fill:0xf7e6bd,align:'center'
      }});
      name.anchor.set(0.5,0.5);name.position.set(0,-12);
      region.addChild(name);
      const status = new Text({text:rival.subjugated?'Verbündetes Vasallenreich':'Nachbarreich',
        style:{fontFamily:'Segoe UI',fontSize:15,fill:0xe0d4ba,align:'center'}});
      status.anchor.set(0.5,0.5);status.position.set(0,23);
      region.addChild(status);this.neighbors.addChild(region);
    });
  }

  private fit(): void {
    if (!this.initialized || this.destroyed) return;
    // On phones the old 1350px reference shrank the entire settlement to a blur.
    // Fit to a narrower, usable map window; retain normal desktop framing.
    const mobile = this.app.screen.width < 760;
    const scale = (mobile
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
  }
}
