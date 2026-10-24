import { Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import type { KingdomInfrastructure } from '../core/Kingdom';

export const BUILDING_RENDER_VERSION = 'kenney-glb-districts-v1';
const ORDER = ['workshops','taverns','warehouses','markets','guildhalls','schools','hospitals','universities','churches','castles','barracks','walls','mines','ports','farms','roads','urban-workshops','urban-warehouses','urban-markets','urban-guildhalls','urban-schools','urban-universities','urban-hospitals','urban-taverns'] as const;
type Key = typeof ORDER[number];

export class RenderedBuildingLibrary {
  private readonly frames = new Map<Key, Texture>();
  private loading?: Promise<void>;
  private disposed = false;
  public get count(): number { return this.frames.size; }

  public load(base: string, onChange: () => void): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = Promise.allSettled(Array.from({length:6}, async (_, page) => {
      const sheet = await Assets.load<Texture>(base + 'assets/kenney/buildings/districts-v1-' + page + '.webp');
      if (this.disposed) return;
      if (sheet.width !== 384 || sheet.height !== 384) throw new Error('Unexpected building atlas size');
      for (let local = 0; local < 4; local++) {
        const key = ORDER[page * 4 + local];
        this.frames.set(key, new Texture({source:sheet.source,frame:new Rectangle((local % 2)*192,Math.floor(local/2)*192,192,192)}));
      }
      onChange();
    })).then(() => { if (!this.disposed) onChange(); });
    return this.loading;
  }

  public draw(group: Container, type: keyof KingdomInfrastructure, count: number, year: number): boolean {
    // Medieval/urban models must never replace the Bronze Age and ancient artwork.
    if (year < 500) return false;
    const candidate = 'urban-' + type;
    const preferred = year >= 1800 && ORDER.includes(candidate as Key) ? candidate as Key : type as Key;
    const texture = this.frames.get(preferred) ?? this.frames.get(type as Key);
    if (!texture || this.disposed) return false;
    group.addChild(new Graphics().ellipse(5,12,type==='castles'?64:48,17).fill({color:0x243728,alpha:count>0?0.22:0.08}));
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5,0.67321);
    sprite.position.set(0,9);
    sprite.scale.set(type==='castles'||type==='walls'||type==='ports'?1.02667:1.2);
    sprite.alpha=count>0?1:0.32;
    sprite.label='glb-building:'+type;
    sprite.eventMode='none';
    group.addChild(sprite);
    return true;
  }

  public dispose(): void {
    this.disposed=true;
    for (const texture of this.frames.values()) texture.destroy(false);
    this.frames.clear();
    // Sheet sources belong to the shared Assets cache, not this map instance.
  }
}
