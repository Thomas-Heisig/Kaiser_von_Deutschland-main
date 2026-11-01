import { afterEach, describe, expect, it, vi } from 'vitest';
import { KingdomMap } from './KingdomMap';
import { ZOOM_MAX, ZOOM_MIN, clampZoom } from './MapScale';
import { DWELLING_MAP_POSITION } from './FirstPersonLogic';
import { Container } from 'pixi.js';

// Exercise renderer transitions without requiring a GPU or browser DOM.
function mapFixture() {
  const map = Object.create(KingdomMap.prototype);
  Object.assign(map, {
    zoom: 1, zoomLevel: 'dorf', mapScope: 'home', projection: 'isometric',
    motionEnabled: true, destroyed: false, initialized: true,
    offset: { x: 40, y: 20 },
    centre: { x: 500, y: 310 },
    currentScale: 1,
    app: { canvas: { dataset: {} }, screen: { width: 800, height: 600 },
      ticker: { remove: vi.fn() }, destroy: vi.fn() },
    fit: vi.fn(), drawRegionLayer: vi.fn(), loadReliefTexture: vi.fn(),
    observer: { disconnect: vi.fn() }
    , renderedBuildings: { dispose: vi.fn() }
  });
  for (const name of ['settlements', 'settlementTerrain', 'retroScenery', 'neighbors', 'animation',
    'worldMarker', 'atmosphere', 'regionLayer', 'reliefLayer', 'scaleLayer', 'europeLayer']) {
    map[name] = { visible: true, children: [{}], removeChildren: () => [] };
  }
  map.world = new Container();
  // Nahgeometrie startet verborgen (wie in initialize()); der Test steuert sie
  // über setZoom mit echter Hysterese.
  map.nearLayer = { visible: false, children: [{}], removeChildren: () => [] };
  map.fit = vi.fn(() => {
    map.world.scale.set(map.zoom * map.fitFactor());
    map.world.pivot.set(map.centre.x, map.centre.y);
    map.world.position.set(map.app.screen.width / 2 + map.offset.x,
      map.app.screen.height / 2 + map.offset.y);
    map.currentScale = map.world.scale.x;
    map.applyDetailFade();
  });
  map.fit();
  return map;
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('map lifecycle and view transitions', () => {
  it('keeps one continuous camera: the world never disappears when zooming', () => {
    const map = mapFixture();
    // Desk, region and Europe are the same view, so the world stays rendered.
    for (const zoom of [ZOOM_MIN, 0.1, 1, 3, ZOOM_MAX]) {
      map.setZoom(zoom);
      expect(map.world.visible, `zoom ${zoom}`).toBe(true);
    }
  });
  it('hides buildings when zoomed out so no house spans a region', () => {
    const map = mapFixture();
    map.setZoom(1);
    expect(map.settlements.visible).toBe(true);
    map.setZoom(0.1);
    expect(map.settlements.visible).toBe(false);
    // Relief and region labels appear only at the widest zoom.
    expect(map.regionLayer.visible).toBe(true);
  });
  it('keeps the camera anchored: zooming does not reset the pan', () => {
    const map = mapFixture();
    map.setZoom(1);
    map.offset = { x: 40, y: 20 };
    map.setZoom(2);
    // A continuous camera keeps its position instead of jumping to a new view.
    expect(map.offset).toEqual({ x: 40, y: 20 });
  });
  it('keeps the pointer world point fixed with a rotated container', () => {
    const map = mapFixture();
    map.world.rotation = 0.7;
    map.fit();
    const before = map.world.toLocal({ x: 250, y: 180 });
    map.zoomBy(1.5, 250, 180);
    const after = map.world.toLocal({ x: 250, y: 180 });
    expect(after.x).toBeCloseTo(before.x, 8);
    expect(after.y).toBeCloseTo(before.y, 8);
  });
  it('preserves a moving pinch midpoint through sequential pointer updates', () => {
    const map = mapFixture();
    let midpoint = { x: 300, y: 200 };
    const worldPoint = map.world.toLocal(midpoint);
    for (const next of [{ x: 295, y: 200 }, { x: 300, y: 200 }, { x: 320, y: 230 }]) {
      map.zoomBy(1.2, midpoint.x, midpoint.y);
      map.panByScreenPixels(next.x - midpoint.x, next.y - midpoint.y);
      map.fit();
      midpoint = next;
      const actual = map.world.toLocal(midpoint);
      expect(actual.x).toBeCloseTo(worldPoint.x, 8);
      expect(actual.y).toBeCloseTo(worldPoint.y, 8);
    }
  });
  it('restores playable districts after region → world → home', () => {
    const map = mapFixture();
    map.setZoom(0.1);
    expect(map.settlements.visible).toBe(false);
    map.setMapScope('world');
    expect(map.neighbors.visible).toBe(true);
    expect(map.worldMarker.visible).toBe(true);
    map.setMapScope('home');
    // Zooming back in reveals the districts again; the scope change alone does not.
    map.setZoom(1);
    expect(map.settlements.visible).toBe(true);
    expect(map.worldMarker.visible).toBe(false);
    expect(map.animation.visible).toBe(true);
    expect(map.retroScenery.visible).toBe(false);
  });

  it('keeps village mode when the feature is disabled', () => {
    vi.stubEnv('VITE_MAP_ZOOM_LEVELS', 'false');
    const map = mapFixture();
    map.changeZoom(-0.6);
    expect(map.getZoomLevel()).toBe('dorf');
  });

  it('centers the view and rejects invalid increments', () => {
    const map = mapFixture();
    map.setZoom(2);
    map.centerOnHome();
    expect(map.offset).toEqual({ x: 0, y: 0 });
    map.changeZoom(NaN);
    expect(map.zoom).toBe(2);
  });

  it('persists and restores the camera centre through save/load', () => {
    const map = mapFixture();
    map.setZoom(1);
    // Explizite Aktion: auf die Behausung zentrieren.
    map.centerOnHome();
    const saved = map.getCameraState();
    expect(saved.zoom).toBe(1);
    // Der Fokus liegt auf derselben modellierten Behausungsmitte wie die Nahgeometrie.
    expect(saved.x).toBeCloseTo(DWELLING_MAP_POSITION.x, 6);
    expect(saved.y).toBeCloseTo(DWELLING_MAP_POSITION.y, 6);
    // Wiederherstellen in einer neuen Karte (geladener Spielstand).
    const restored = mapFixture();
    restored.setCameraState(saved);
    expect(restored.getCameraState()).toEqual(saved);
  });
  it('restores the real scale on a different viewport rather than refitting the map', () => {
    const map = mapFixture();
    map.setZoom(1_000);
    const saved = map.getCameraState();
    const restored = mapFixture();
    restored.app.screen.width = 390;
    restored.app.screen.height = 650;
    restored.setCameraState(saved);
    expect(restored.getMetresPerScreenPixel()).toBeCloseTo(map.getMetresPerScreenPixel(), 10);
    expect(restored.getCameraState().x).toBe(saved.x);
    expect(restored.getVisibleWorldWidthMetres()).toBeCloseTo(390 * saved.metresPerCssPixel, 8);
  });
  it('never reverses zoom direction after restoring a near camera on a smaller viewport', () => {
    const map = mapFixture();
    map.app.screen.width = 390;
    map.app.screen.height = 650;
    map.setCameraState({ x: 604, y: 384, metresPerCssPixel: 0.001 });
    const near = map.getZoom();
    map.zoomBy(1.12);
    expect(map.getZoom()).toBe(near);
    map.zoomBy(1 / 1.12);
    expect(map.getZoom()).toBeCloseTo(near / 1.12, 8);
  });

  it('migrates legacy camera states (screen offset) as centre values', () => {
    // Ältere Spielstände speicherten einen Bildschirmversatz in denselben
    // Feldern x/y; die Migration interpretiert sie als Mittelpunkt.
    const map = mapFixture();
    map.setCameraState({ zoom: 1, x: 40, y: 20 });
    const state = map.getCameraState();
    expect(state.x).toBe(40);
    expect(state.y).toBe(20);
    // Der Versatz ist nach der Migration neutralisiert.
    expect(map.offset).toEqual({ x: 0, y: 0 });
  });

  it('rejects non-finite camera values instead of corrupting state', () => {
    const map = mapFixture();
    map.setCameraState({ zoom: Number.NaN, x: Number.POSITIVE_INFINITY, y: Number.NEGATIVE_INFINITY });
    expect(Number.isFinite(map.getCameraState().zoom)).toBe(true);
    expect(Number.isFinite(map.getCameraState().x)).toBe(true);
    expect(Number.isFinite(map.getCameraState().y)).toBe(true);
  });

  it('clamps zoom to the continuous range', () => {
    expect(clampZoom(1_000_000)).toBe(ZOOM_MAX);
    expect(clampZoom(-5)).toBe(ZOOM_MIN);
  });
  it('measures detail stages and map width in CSS pixels, not device pixels', () => {
    const map = mapFixture();
    map.setZoom(1);
    const desktopWidth = map.getVisibleWorldWidthMetres();
    expect(desktopWidth).toBeCloseTo(28_125, 0);
    expect(map.getStage()).toBe('Siedlung');
    map.app.screen.width = 700;
    const narrowWidth = map.getVisibleWorldWidthMetres();
    expect(narrowWidth).not.toBe(desktopWidth);
    expect(map.getMetresPerScreenPixel()).toBeGreaterThan(0);
  });
  it('shows the dwelling near geometry across the dwelling stage', () => {
    const map = mapFixture();
    // Der Hof erscheint bei einer sichtbaren Breite von ≈18,8 km und bleibt
    // durch die Behausungsstufe bis zur Weitzoom-Hysterese sichtbar.
    map.setZoom(1);
    expect(map.nearLayer.visible).toBe(false);
    map.setZoom(1.5);
    expect(map.nearLayer.visible).toBe(true);
    map.setZoom(9_375);
    expect(map.nearLayer.visible).toBe(true);
    // Hysterese: erst unter 0,9 ausblenden, nicht bei 1,2 flackern.
    map.setZoom(1.0);
    expect(map.nearLayer.visible).toBe(true);
    map.setZoom(0.8);
    expect(map.nearLayer.visible).toBe(false);
  });
  it('hides the roof for interior view without moving the house', () => {
    const map = mapFixture();
    const roof = { visible: true };
    const furniture = { visible: true };
    map.nearLayer.children = [{}, {}, furniture, roof];
    map.nearRoof = roof;
    map.setZoom(9_375);
    expect(roof.visible).toBe(false);
    expect(furniture.visible).toBe(true);
    map.setZoom(1_000);
    expect(roof.visible).toBe(true);
  });
  it('culls cartographic infrastructure and oversized labels in the metric near view', () => {
    const map = mapFixture();
    map.setZoom(1);
    expect(map.settlements.visible).toBe(true);
    map.setZoom(1_875);
    expect(map.settlements.visible).toBe(false);
    expect(map.animation.visible).toBe(false);
    expect(map.atmosphere.visible).toBe(false);
    expect(map.nearLayer.visible).toBe(true);
    expect(map.app.canvas.dataset.terrainRenderer).toBe('vector');
    map.setZoom(1);
    expect(map.settlements.visible).toBe(true);
  });
  it('disposes the renderer once and ignores late region updates', () => {
    vi.stubGlobal('window', { clearTimeout: vi.fn() });
    vi.stubGlobal('document', { removeEventListener: vi.fn() });
    const map = mapFixture();
    map.dispose();
    map.dispose();
    map.setHistoricalRegions({ labels: [], message: 'late' });
    expect(map.app.destroy).toHaveBeenCalledTimes(1);
    expect(map.drawRegionLayer).not.toHaveBeenCalled();
  });
});
