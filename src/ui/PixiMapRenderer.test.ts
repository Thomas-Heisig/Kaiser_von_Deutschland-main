import { describe, expect, it, vi } from 'vitest';
import { EXAMPLE_HOMESTEAD, renderLocalVectorTerrain, renderVectorMap } from './PixiMapRenderer';

describe('vector map geometry', () => {
  it('preserves metre dimensions and building selection when the camera zooms', () => {
    const select = vi.fn();
    const map = renderVectorMap(EXAMPLE_HOMESTEAD, select);
    const house = map.getChildByLabel('home', true)!;
    expect(house.getLocalBounds().width).toBeCloseTo(6.3);
    // Roof ridge stroke extends .06 m north; shadow extends .4 m south.
    expect(house.getLocalBounds().height).toBeCloseTo(8.46);
    map.scale.set(100);
    expect(house.getLocalBounds().width).toBeCloseTo(6.3);
    house.emit('pointertap', {} as never);
    expect(select).toHaveBeenCalledWith('home');
    map.destroy({ children: true });
  });

  it('maps the 20 km extent back to the existing 960 × 672 coordinate system', () => {
    const map = renderLocalVectorTerrain({ version: 1, crs: 'EPSG:25832', bounds: [],
      width: 960, height: 672, places: { home: [480, 336] }, rivers: [] });
    expect(map.width).toBeCloseTo(960);
    expect(map.height).toBeCloseTo(672);
    expect(map.scale.x).toBe(map.scale.y);
    map.destroy({ children: true });
  });

  it('rejects a zero-sized scene', () => {
    expect(() => renderVectorMap({ width: 0, height: 30 })).toThrow();
  });
});
