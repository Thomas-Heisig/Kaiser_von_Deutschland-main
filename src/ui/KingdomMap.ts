import { Application, Container, Graphics, Text } from 'pixi.js';
import { Kingdom, KingdomInfrastructure } from '../core/Kingdom';

interface MapLocation {
  type: keyof KingdomInfrastructure;
  name: string;
  x: number;
  y: number;
  color: number;
}

const LOCATIONS: MapLocation[] = [
  { type: 'farms', name: 'Ackerland', x: 265, y: 410, color: 0xd0b266 },
  { type: 'markets', name: 'Marktviertel', x: 530, y: 350, color: 0xc78f68 },
  { type: 'castles', name: 'Herrschaftssitz', x: 510, y: 195, color: 0xaeb9b0 },
  { type: 'churches', name: 'Kirchplatz', x: 670, y: 245, color: 0xd4c5a1 },
  { type: 'mines', name: 'Bergwerke', x: 760, y: 135, color: 0x9fafa3 },
  { type: 'workshops', name: 'Handwerk', x: 720, y: 405, color: 0xc6a47a },
  { type: 'barracks', name: 'Garnison', x: 385, y: 265, color: 0xb79279 },
  { type: 'schools', name: 'Schulviertel', x: 525, y: 480, color: 0xa9bda9 },
];

/**
 * PixiJS settlement overview. Counts represent infrastructure, not geographic claims.
 */
export class KingdomMap {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly settlements = new Container();
  private observer?: ResizeObserver;
  private zoom: number = 1;
  private offset = { x: 0, y: 0 };
  private destroyed: boolean = false;
  private initialized: boolean = false;
  private motionEnabled = false;
  private readonly animation = new Container();
  private elapsed = 0;
  private actionVisual?: Container;
  private actionTimer?: number;
  private readonly animatedMarkers: Container[] = [];
  private readonly citizens: Container[] = [];
  private readonly chimneys: Graphics[] = [];
  private readonly animatedTicker = (ticker: { deltaMS: number }): void => {
    if (this.destroyed || !this.motionEnabled || document.hidden) return;
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
    else if (this.motionEnabled) this.app.ticker.start();
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
        const location = LOCATIONS.find((place: MapLocation) => Math.hypot(place.x - x, place.y - y) < 65);
        if (location) onSelect(location.type);
      }
      drag = undefined;
    });
    canvas.addEventListener('pointercancel', (): void => { drag = undefined; });
    this.fit();
    this.app.ticker.stop();
  }

  /** Temporary, bounded effects; no changes to the battle or research simulation. */
  public playAction(kind: 'raid' | 'science'): void {
    if (!this.initialized || this.destroyed) return;
    this.actionVisual?.destroy({ children: true });
    window.clearTimeout(this.actionTimer);
    const visual = new Container();
    const color = kind === 'raid' ? 0xe98159 : 0xe8d498;
    const x = kind === 'raid' ? 385 : 525;
    const y = kind === 'raid' ? 265 : 480;
    visual.addChild(new Graphics().circle(x, y, 63)
      .stroke({ color, width: 6, alpha: 0.8 })
      .circle(x, y, 29).fill({ color, alpha: 0.25 }));
    this.world.addChild(visual);
    this.actionVisual = visual;
    this.fit();
    this.actionTimer = window.setTimeout(() => {
      if (this.destroyed) return;
      if (this.actionVisual === visual) this.actionVisual = undefined;
      visual.destroy({ children: true });
      this.fit();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 800 : 2600);
  }

  /** Enable bounded ambient movement, without changing the game simulation. */
  public setMotion(enabled: boolean): void {
    this.motionEnabled = enabled && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.animation.visible = this.motionEnabled;
    if (this.motionEnabled && !document.hidden) this.app.ticker.start();
    else this.app.ticker.stop();
    if (this.initialized) this.fit();
  }

  /**
   * Refreshes infrastructure markers without allocating citizens or terrain again.
   * @param kingdom Current kingdom state.
   * @param selected Highlighted infrastructure district.
   * @returns Nothing.
   */
  public update(kingdom: Kingdom, selected: keyof KingdomInfrastructure): void {
    if (!this.initialized || this.destroyed) return;
    this.chimneys.length = 0;
    for (const child of this.settlements.removeChildren()) child.destroy({ children: true });
    for (const location of LOCATIONS) {
      const count = kingdom.infrastructure[location.type];
      const group = new Container();
      group.position.set(location.x, location.y);
      const ground = new Graphics()
        .ellipse(0, 10, 62, 30).fill({ color: location.color, alpha: 0.12 })
        .ellipse(0, 10, 62, 30).stroke({
          color: selected === location.type ? 0xf0d89f : 0x6b8270,
          width: selected === location.type ? 2 : 1, alpha: selected === location.type ? 1 : 0.35
        });
      group.addChild(ground);
      if (location.type === 'farms') {
        const fields = new Graphics();
        for (let i = 0; i < 5; i++) {
          fields.poly([-43 + i * 17, -13, -30 + i * 17, -20, -8 + i * 17, 0, -21 + i * 17, 8])
            .fill({ color: i % 2 ? 0xa99857 : 0x8e9a5c, alpha: 0.85 });
        }
        group.addChild(fields);
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
      const label = new Text({
        text: `${location.name} · ${count}`,
        style: { fontFamily: 'Segoe UI', fontSize: 14, fill: 0xede8d2, fontWeight: '500' }
      });
      label.anchor.set(0.5, 0);
      label.position.set(0, 43);
      group.addChild(label);
      this.settlements.addChild(group);
    }
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

  private fit(): void {
    if (!this.initialized || this.destroyed) return;
    const scale = Math.min(this.app.screen.width / 1000, this.app.screen.height / 620) * this.zoom;
    this.world.scale.set(scale);
    this.world.position.set(
      (this.app.screen.width - 1000 * scale) / 2 + this.offset.x,
      (this.app.screen.height - 620 * scale) / 2 + this.offset.y
    );
    this.app.renderer.render(this.app.stage);
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
      if (LOCATIONS.some((place: MapLocation) => Math.hypot(place.x - x, place.y - y) < 85) ||
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
    this.actionVisual = undefined;
    this.destroyed = true;
    this.observer?.disconnect();
    document.removeEventListener('visibilitychange', this.visibility);
    if (this.initialized) this.app.ticker.remove(this.animatedTicker);
    if (this.initialized) this.app.destroy(true, { children: true });
  }
}
