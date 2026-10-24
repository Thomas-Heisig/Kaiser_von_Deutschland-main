import { describe, expect, it } from 'vitest';
import {
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_MIN,
  filterRegionsForEpoch,
  LEVEL_THRESHOLDS,
  levelForSlider,
  geoToPercent,
  regionsForMap,
  RELIEF_BOUNDS,
  SLIDER_MAX,
  SLIDER_MIN,
  SLIDER_STEP,
  sliderToZoom,
  stepSlider,
  zoomToSlider
} from './MapZoomLevels';
import { REGIONS } from '../history/PolityData';

describe('Slider-zu-Kamera-Mapping', (): void => {
  it('maps the slider ends to the camera zoom limits', (): void => {
    expect(sliderToZoom(SLIDER_MIN)).toBeCloseTo(CAMERA_ZOOM_MIN, 6);
    expect(sliderToZoom(SLIDER_MAX)).toBeCloseTo(CAMERA_ZOOM_MAX, 6);
  });

  it('grows monotonically and stays inside the camera range', (): void => {
    let previous = sliderToZoom(SLIDER_MIN);
    for (let slider = 1; slider <= SLIDER_MAX; slider++) {
      const zoom = sliderToZoom(slider);
      expect(zoom).toBeGreaterThanOrEqual(previous);
      expect(zoom).toBeGreaterThanOrEqual(CAMERA_ZOOM_MIN);
      expect(zoom).toBeLessThanOrEqual(CAMERA_ZOOM_MAX);
      previous = zoom;
    }
  });

  it('clamps out-of-range and non-finite slider values', (): void => {
    expect(sliderToZoom(-50)).toBeCloseTo(CAMERA_ZOOM_MIN, 6);
    expect(sliderToZoom(500)).toBeCloseTo(CAMERA_ZOOM_MAX, 6);
    expect(sliderToZoom(Number.NaN)).toBe(CAMERA_ZOOM_MIN);
  });

  it('round-trips zoom → slider → zoom', (): void => {
    for (const slider of [0, 12, 35, 40, 50, 75, 100]) {
      const zoom = sliderToZoom(slider);
      const back = sliderToZoom(zoomToSlider(zoom));
      expect(back).toBeCloseTo(zoom, 1);
    }
  });

  it('clamps the inverse mapping too', (): void => {
    expect(zoomToSlider(0.01)).toBe(SLIDER_MIN);
    expect(zoomToSlider(99)).toBe(SLIDER_MAX);
    expect(zoomToSlider(Number.NaN)).toBe(SLIDER_MIN);
  });
});

describe('Button-Schritte', (): void => {
  it('moves by the defined step', (): void => {
    expect(stepSlider(50, 1)).toBe(50 + SLIDER_STEP);
    expect(stepSlider(50, -1)).toBe(50 - SLIDER_STEP);
  });

  it('never leaves the slider range', (): void => {
    expect(stepSlider(SLIDER_MAX, 1)).toBe(SLIDER_MAX);
    expect(stepSlider(SLIDER_MIN, -1)).toBe(SLIDER_MIN);
  });

  it('recovers from non-finite input', (): void => {
    expect(stepSlider(Number.NaN, 1)).toBe(SLIDER_MIN + SLIDER_STEP);
  });
});

describe('Ebenenwechsel mit Hysterese', (): void => {
  it('keeps the desk stable around its boundary and allows direct village jumps', () => {
    expect(levelForSlider(0, 'dorf')).toBe('schreibtisch');
    expect(levelForSlider(11, 'zentraleuropa')).toBe('schreibtisch');
    expect(levelForSlider(12, 'zentraleuropa')).toBe('zentraleuropa');
    expect(levelForSlider(17, 'schreibtisch')).toBe('schreibtisch');
    expect(levelForSlider(18, 'schreibtisch')).toBe('zentraleuropa');
    expect(levelForSlider(40, 'schreibtisch')).toBe('dorf');
  });
  it('switches to Zentraleuropa below the lower threshold', (): void => {
    expect(levelForSlider(LEVEL_THRESHOLDS.toRegion - 1, 'dorf')).toBe('zentraleuropa');
    expect(levelForSlider(SLIDER_MIN, 'dorf')).toBe('schreibtisch');
  });

  it('stays on Dorf at or above the lower threshold', (): void => {
    expect(levelForSlider(LEVEL_THRESHOLDS.toRegion, 'dorf')).toBe('dorf');
    expect(levelForSlider(SLIDER_MAX, 'dorf')).toBe('dorf');
  });

  it('switches back to Dorf at or above the upper threshold', (): void => {
    expect(levelForSlider(LEVEL_THRESHOLDS.toVillage, 'zentraleuropa')).toBe('dorf');
    expect(levelForSlider(SLIDER_MAX, 'zentraleuropa')).toBe('dorf');
  });

  it('keeps Zentraleuropa inside the hysteresis band', (): void => {
    // Zwischen den Schwellen bleibt die aktuelle Ebene erhalten – kein Flackern.
    for (let slider = LEVEL_THRESHOLDS.toRegion; slider < LEVEL_THRESHOLDS.toVillage; slider++) {
      expect(levelForSlider(slider, 'zentraleuropa')).toBe('zentraleuropa');
    }
  });

  it('defines an ordered pair of thresholds', (): void => {
    expect(LEVEL_THRESHOLDS.toRegion).toBeLessThan(LEVEL_THRESHOLDS.toVillage);
  });
});

describe('Regionsabruf pro Jahr', (): void => {
  it('returns geographically placed regions for a verified year', (): void => {
    const result = regionsForMap(1200);
    expect(result.labels.length).toBeGreaterThan(0);
    expect(result.epochName).toContain('Hochmittelalter');
    expect(result.message).toContain('Natural Earth');
    for (const label of result.labels) {
      expect(label.name.length).toBeGreaterThan(0);
      expect(label.xPercent).toBeGreaterThanOrEqual(0);
      expect(label.xPercent).toBeLessThanOrEqual(100);
      expect(label.yPercent).toBeGreaterThanOrEqual(0);
      expect(label.yPercent).toBeLessThanOrEqual(100);
    }
  });

  it('derives positions from documented town centres inside the relief bounds', (): void => {
    // Köln (Rheinland) liegt westlich von Leipzig (Sachsen) und nördlich von München.
    const labels = regionsForMap(1200).labels;
    const rheinland = labels.find((label) => label.id === 'rheinland');
    const sachsen = labels.find((label) => label.id === 'sachsen');
    const bayern = labels.find((label) => label.id === 'bayern');
    expect(rheinland).toBeDefined();
    expect(sachsen).toBeDefined();
    expect(bayern).toBeDefined();
    expect(rheinland!.xPercent).toBeLessThan(sachsen!.xPercent);
    expect(bayern!.yPercent).toBeGreaterThan(rheinland!.yPercent);
    // Lübeck (Hanse) liegt nördlicher als München.
    const hanse = regionsForMap(1400).labels.find((label) => label.id === 'hansestaedte');
    expect(hanse).toBeDefined();
    expect(hanse!.yPercent).toBeLessThan(bayern!.yPercent);
  });

  it('converts coordinates into per-cent positions of the relief bounds', (): void => {
    // Westgrenze → 0 %, Ostgrenze → 100 %
    expect(geoToPercent(50, RELIEF_BOUNDS.west).xPercent).toBeCloseTo(0, 6);
    expect(geoToPercent(50, RELIEF_BOUNDS.east).xPercent).toBeCloseTo(100, 6);
    // Nordgrenze → 0 %, Südgrenze → 100 %
    expect(geoToPercent(RELIEF_BOUNDS.north, 10).yPercent).toBeCloseTo(0, 6);
    expect(geoToPercent(RELIEF_BOUNDS.south, 10).yPercent).toBeCloseTo(100, 6);
  });

  it('never places a label outside the relief area', (): void => {
    for (const year of [900, 1200, 1400, 1600, 1900, 2000]) {
      for (const label of regionsForMap(year).labels) {
        expect(label.xPercent).toBeGreaterThanOrEqual(0);
        expect(label.xPercent).toBeLessThanOrEqual(100);
        expect(label.yPercent).toBeGreaterThanOrEqual(0);
        expect(label.yPercent).toBeLessThanOrEqual(100);
      }
    }
  });

  it('never exposes the unverified placeholder region', (): void => {
    for (const year of [900, 1200, 1600, 1900, 2000]) {
      const ids = regionsForMap(year).labels.map((label) => label.id);
      expect(ids).not.toContain('germanien');
    }
  });

  it('returns a defined fallback instead of an error for unverified years', (): void => {
    const result = regionsForMap(700);
    expect(result.labels).toEqual([]);
    expect(result.epochName).toBeNull();
    expect(result.evidence).toBe('nicht_verifiziert');
    expect(result.message).toContain('Keine belegte Region');
  });

  it('filters epoch-bound regions correctly', (): void => {
    // Hansestädte sind nur im Spätmittelalter und der Frühen Neuzeit belegt.
    const medieval = regionsForMap(1200).labels.map((label) => label.id);
    expect(medieval).not.toContain('hansestaedte');
    const late = regionsForMap(1400).labels.map((label) => label.id);
    expect(late).toContain('hansestaedte');
  });

  it('never returns polygons or line data', (): void => {
    const result = regionsForMap(1200);
    for (const label of result.labels) {
      const keys = Object.keys(label);
      expect(keys).not.toContain('polygon');
      expect(keys).not.toContain('path');
      expect(keys).not.toContain('boundary');
      expect(keys).not.toContain('geometry');
    }
  });
});

describe('Regionsfilter', (): void => {
  it('drops unverified regions', (): void => {
    const kept = filterRegionsForEpoch(REGIONS, 'hochmittelalter');
    expect(kept.some((region) => region.evidence === 'nicht_verifiziert')).toBe(false);
  });

  it('keeps epoch-independent regions in every epoch', (): void => {
    const kept = filterRegionsForEpoch(REGIONS, 'bundesrepublik_vereint');
    expect(kept.map((region) => region.id)).toContain('rheinland');
  });

  it('drops epoch-bound regions outside their epoch', (): void => {
    const kept = filterRegionsForEpoch(REGIONS, 'bundesrepublik_vereint');
    expect(kept.map((region) => region.id)).not.toContain('hansestaedte');
  });

  it('returns an empty list for an unknown epoch', (): void => {
    expect(filterRegionsForEpoch(REGIONS, 'gibt-es-nicht')).toEqual([]);
  });
});
