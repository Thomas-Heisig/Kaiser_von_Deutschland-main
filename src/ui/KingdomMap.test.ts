import { afterEach, describe, expect, it, vi } from 'vitest';
import { KingdomMap } from './KingdomMap';
import { ZOOM_MAX, ZOOM_MIN, clampZoom } from './MapScale';
import { DWELLING_MAP_POSITION } from './FirstPersonLogic';

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
    'world', 'worldMarker', 'atmosphere', 'regionLayer', 'reliefLayer', 'scaleLayer', 'europeLayer']) {
    map[name] = { visible: true, children: [{}], removeChildren: () => [] };
  }
  map.world.scale = {
    get x() {
      const { width, height } = map.app.screen;
      const fitFactor = width < 760
        ? Math.min(width / 820, height / 960)
        : Math.min(width / 1350, height / 850);
      return map.zoom * fitFactor;
    },
  };
  // Nahgeometrie startet verborgen (wie in initialize()); der Test steuert sie
  // über setZoom mit echter Hysterese.
  map.nearLayer = { visible: false, children: [{}], removeChildren: () => [] };
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
    map.setZoom(2_000);
    expect(roof.visible).toBe(true);
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
