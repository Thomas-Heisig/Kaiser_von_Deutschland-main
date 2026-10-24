import { afterEach, describe, expect, it, vi } from 'vitest';
import { KingdomMap } from './KingdomMap';

// Exercise renderer transitions without requiring a GPU or browser DOM.
function mapFixture() {
  const map = Object.create(KingdomMap.prototype);
  Object.assign(map, {
    zoom: 1, zoomLevel: 'dorf', mapScope: 'home', projection: 'isometric',
    motionEnabled: true, destroyed: false, initialized: true,
    offset: { x: 40, y: 20 },
    app: { canvas: { dataset: {} }, ticker: { remove: vi.fn() }, destroy: vi.fn() },
    fit: vi.fn(), drawRegionLayer: vi.fn(), loadReliefTexture: vi.fn(),
    observer: { disconnect: vi.fn() }
  });
  for (const name of ['settlements', 'retroScenery', 'neighbors', 'animation',
    'world', 'atmosphere', 'regionLayer', 'reliefLayer']) {
    map[name] = { visible: true, children: [{}] };
  }
  return map;
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('map lifecycle and view transitions', () => {
  it('hides the renderer on the desk and restores a centered map without hidden village hits', () => {
    const map = mapFixture();
    map.setZoomSlider(0);
    expect(map.world.visible).toBe(false);
    expect(map.settlements.visible).toBe(false);
    expect(map.reliefLayer.visible).toBe(false);
    map.setZoomSlider(28);
    expect(map.world.visible).toBe(true);
    expect(map.reliefLayer.visible).toBe(true);
    expect(map.settlements.visible).toBe(false);
    expect(map.offset).toEqual({ x: 0, y: 0 });
  });
  it('restores playable districts after region → world → home', () => {
    const map = mapFixture();
    map.setZoomSlider(28);
    expect(map.settlements.visible).toBe(false);
    expect(map.neighbors.visible).toBe(false);
    expect(map.animation.visible).toBe(false);
    map.setMapScope('world');
    expect(map.regionLayer.visible).toBe(false);
    expect(map.reliefLayer.visible).toBe(false);
    expect(map.settlements.visible).toBe(false);
    expect(map.neighbors.visible).toBe(true);
    map.setMapScope('home');
    expect(map.settlements.visible).toBe(true);
    expect(map.animation.visible).toBe(true);
    expect(map.retroScenery.visible).toBe(false);
    expect(map.app.canvas.dataset.zoomLevel).toBe('dorf');
    expect(map.getZoomSlider()).toBe(40);
    expect(map.offset).toEqual({ x: 0, y: 0 });
  });

  it('keeps buttons and slider in village mode when the feature is disabled', () => {
    vi.stubEnv('VITE_MAP_ZOOM_LEVELS', 'false');
    const map = mapFixture();
    map.changeZoom(-0.6);
    expect(map.getZoomLevel()).toBe('dorf');
    map.setZoomSlider(0);
    expect(map.settlements.visible).toBe(true);
    expect(map.reliefLayer.visible).toBe(false);
    expect(map.loadReliefTexture).not.toHaveBeenCalled();
  });

  it('centers back to visible districts and rejects invalid increments', () => {
    const map = mapFixture();
    map.setZoomSlider(0);
    map.changeZoom(0);
    expect(map.settlements.visible).toBe(true);
    expect(map.getZoomLevel()).toBe('dorf');
    map.changeZoom(NaN);
    expect(map.zoom).toBe(1);
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
