import { Assets, Sprite, type Spritesheet } from 'pixi.js';

// Copy assets/ into your application's public directory. Pass its public URL prefix.
export async function loadBuildings(base = '/') {
  const prefix = base.endsWith('/') ? base : base + '/';
  const sheets = await Promise.all(Array.from({ length: 6 }, (_, page) =>
    Assets.load<Spritesheet>(prefix + 'assets/kenney/buildings/districts-v1-' + page + '.json')));
  return Object.assign({}, ...sheets.map(sheet => sheet.textures)) as Spritesheet['textures'];
}

// Usage inside an initialized PixiJS Application:
// const textures = await loadBuildings(import.meta.env.BASE_URL);
// const house = new Sprite(textures.workshops);
// house.anchor.set(0.5, 0.67321);
// house.position.set(400, 300);
// app.stage.addChild(house);
export { Sprite };
