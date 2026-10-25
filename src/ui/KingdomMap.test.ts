import { afterEach, describe, expect, it, vi } from 'vitest';
import { KingdomMap } from './KingdomMap';
import { ZOOM_MAX, ZOOM_MIN, clampZoom } from './MapScale';

// Exercise renderer transitions without requiring a GPU or browser DOM.
function mapFixture() {
  const map = Object.create(KingdomMap.prototype);
  Object.assign(map, {
    zoom: 1, zoomLevel: 'dorf', mapScope: 'home', projection: 'isometric',
    motionEnabled: true, destroyed: false, initialized: true,
    offset: { x: 40, y: 20 },
    app: { canvas: { dataset: {} }, screen: { width: 800, height: 600 },
      ticker: { remove: vi.fn() }, destroy: vi.fn() },
    fit: vi.fn(), drawRegionLayer: vi.fn(), loadReliefTexture: vi.fn(),
    observer: { disconnect: vi.fn() }
    , renderedBuildings: { dispose: vi.fn() }
  });
  for (const name of ['settlements', 'settlementTerrain', 'retroScenery', 'neighbors', 'animation',
    'world', 'worldMarker', 'atmosphere', 'regionLayer', 'reliefLayer', 'scaleLayer']) {
    map[name] = { visible: true, children: [{}], removeChildren: () => [] };
  }
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

  it('clamps zoom to the continuous range', () => {
    expect(clampZoom(1000)).toBe(ZOOM_MAX);
    expect(clampZoom(-5)).toBe(ZOOM_MIN);
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
