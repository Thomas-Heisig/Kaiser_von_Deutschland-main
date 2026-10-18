import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { SZENE, werkstattKacheln } from './WorkshopSceneModel';

/** Atlas derived from the uploaded Kenney CC0 preview images (see ASSETS.md).
 * The individual tiles are 64x64; this is a visual-only, opt-in renderer harness.
 */
const ATLAS = '/assets/kenney/retro-workshop-atlas.png';
const IDS = {
  floor: 0, door: 1, window: 2, roof: 3,
  tree: 4, barrel: 5, tower: 6, grass: 7
} as const;
type TileId = keyof typeof IDS;

export class WorkshopScene {
  private readonly app = new Application();
  private readonly smoke = new Container();
  private readonly frames: number[] = [];
  private interval?: number;
  private resize?: ResizeObserver;
  private last = 0;
  private elapsed = 0;
  private atlas?: Texture;
  private disposed = false;

  private sprite(id: TileId, x: number, y: number, scale = 1): Sprite {
    if (!this.atlas) throw new Error('Retro-Atlas fehlt');
    const index = IDS[id];
    const texture = new Texture({
      source: this.atlas.source,
      frame: new Rectangle((index % 4) * 64, Math.floor(index / 4) * 64, 64, 64)
    });
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(x, y);
    sprite.scale.set(scale);
    return sprite;
  }

  public async start(host: HTMLElement, report: HTMLElement): Promise<void> {
    await this.app.init({ background: 0x6b9970, antialias: true, resizeTo: host,
      resolution: Math.min(window.devicePixelRatio || 1, 2) });
    if (this.disposed) return;
    host.append(this.app.canvas);
    this.app.ticker.maxFPS = SZENE.zielFps;
    const world = new Container();
    this.app.stage.addChild(world);
    const centerWorld = (): void => {
      world.position.set(host.clientWidth / 2, Math.max(95, host.clientHeight / 2 - 190));
    };
    centerWorld();
    this.resize = new ResizeObserver(centerWorld);
    this.resize.observe(host);

    for (const cell of werkstattKacheln()) {
      const color = (cell.spalte + cell.zeile) % 3 === 0 ? 0x93bc77 : 0xa3c68b;
      world.addChild(new Graphics().poly([
        cell.x, cell.y, cell.x + 32, cell.y + 16,
        cell.x, cell.y + 32, cell.x - 32, cell.y + 16
      ]).fill(color).stroke({ color: 0x5d8b5d, alpha: 0.45, width: 1 }));
    }

    try {
      this.atlas = await Assets.load<Texture>(ATLAS);
      if (this.disposed) return;
      // Retro kit contains modular wall/roof pieces, not a ready-made house.
      // This visual-only workshop is assembled from their genuine preview renders.
      const decor = new Container();
      world.addChild(decor);
      for (const [x, y, scale] of [
        [-225, 180, 0.80], [226, 210, 0.84], [155, 60, 0.69]
      ]) decor.addChild(this.sprite('tree', x, y, scale));
      for (const [x, y] of [[-130, 220], [120, 245], [65, 132]]) {
        decor.addChild(this.sprite('grass', x, y, 0.64));
      }
      const house = new Container();
      house.position.set(0, 195);
      house.addChild(new Graphics().ellipse(0, 8, 66, 25)
        .fill({ color: 0x263a24, alpha: 0.27 }));
      // Wall modules plus a roof: 2.5D proof of concept, not a GLB render.
      house.addChild(this.sprite('window', -21, 5, 1.5));
      house.addChild(this.sprite('door', 24, 5, 1.5));
      house.addChild(this.sprite('roof', 0, -37, 1.75));
      house.addChild(this.sprite('barrel', 70, 4, 0.72));
      world.addChild(house);
      report.dataset.assetStatus = 'loaded';
    } catch (error) {
      report.dataset.assetStatus = 'fallback';
      world.addChild(new Graphics().roundRect(-37, 108, 74, 70, 5).fill(0xa58a69)
        .poly([-46, 108, 0, 70, 46, 108]).fill(0x774d37));
      report.textContent = 'Retro-Atlas nicht geladen; geometrischer Fallback: ' + String(error);
    }
    world.addChild(new Graphics().circle(30, 182, 72)
      .fill({ color: 0xffd696, alpha: 0.12 }));
    world.addChild(this.smoke);
    for (let i = 0; i < SZENE.rauch; i++) {
      this.smoke.addChild(new Graphics().circle(0, 0, 2 + (i % 3))
        .fill({ color: 0xe8e0d1, alpha: 0.38 }));
    }
    const label = new Text({ text: 'KENNEY RETRO · WERKSTATT UM 1200 · 2.5D',
      style: { fontFamily: 'Georgia', fontSize: 13, fill: 0xfff4d9 } });
    label.position.set(12, 12);
    this.app.stage.addChild(label);
    this.app.ticker.add(tick => {
      if (this.disposed) return;
      const now = performance.now();
      if (this.last && now - this.last < 1000) this.frames.push(now - this.last);
      this.last = now;
      if (this.frames.length > 9000) this.frames.shift();
      this.elapsed += Math.min(tick.deltaMS, 50) / 1000;
      for (let i = 0; i < this.smoke.children.length; i++) {
        const particle = this.smoke.children[i];
        const t = (this.elapsed * 0.24 + i / SZENE.rauch) % 1;
        particle.position.set(14 + Math.sin(i * 3 + t * 10) * 11, 145 - t * 105);
        particle.alpha = 0.32 * (1 - t);
      }
    });
    this.interval = window.setInterval(() => {
      const sorted = [...this.frames].sort((a, b) => a - b);
      const mean = sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1);
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
      report.textContent = 'Atlas: ' + report.dataset.assetStatus +
        ' · Frames: ' + sorted.length + ' · Mittel: ' + mean.toFixed(1) +
        ' ms · P95: ' + p95.toFixed(1) + ' ms · >50 ms: ' +
        sorted.filter(value => value > 50).length + ' · Gerät: ' + navigator.userAgent;
    }, 2000);
  }

  public dispose(): void {
    this.disposed = true;
    if (this.interval !== undefined) window.clearInterval(this.interval);
    this.resize?.disconnect();
    this.app.ticker.stop();
    this.app.destroy(true, { children: true });
  }
}
