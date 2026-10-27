import { describe, expect, it } from 'vitest';
import {
  BASE_HEIGHT, BASE_WIDTH, METRES_PER_BASE_PIXEL, ZOOM_MAX, ZOOM_MIN,
  ZOOM_SURROUNDINGS,
  baseToMetres, clampZoom, formatDistance, longitudeStretch, metresToBase,
  pixelsPerMetre, scaleBar, stageForZoom
} from './MapScale';

describe('Gemeinsame Kartenmaßstäbe', () => {
  it('uses one uniform metre-per-pixel basis on both axes', () => {
    // 20 km across 960 px and 14 km across 672 px must agree, otherwise
    // buildings and distances would distort differently per axis.
    expect(BASE_WIDTH * METRES_PER_BASE_PIXEL).toBeCloseTo(20_000, 6);
    expect(BASE_HEIGHT * METRES_PER_BASE_PIXEL).toBeCloseTo(14_000, 6);
  });
  it('round-trips metres and base pixels', () => {
    for (const metres of [3, 12, 250, 2_000, 20_000]) {
      expect(baseToMetres(metresToBase(metres))).toBeCloseTo(metres, 6);
    }
  });
  it('keeps the settlement plausible: a house is a few metres, not a region', () => {
    // A dwelling of 12 m must be far smaller than the 20 km settlement.
    expect(metresToBase(12)).toBeLessThan(1);
    expect(metresToBase(20_000)).toBe(BASE_WIDTH);
  });
  it('shrinks the scale bar length as the zoom increases', () => {
    // Zooming in shows less ground, so the bar must cover a shorter distance.
    const lengths = [ZOOM_MIN, 0.1, 0.5, 1, 3, ZOOM_MAX].map(zoom => scaleBar(zoom).metres);
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBeLessThanOrEqual(lengths[i - 1]);
    }
    for (const zoom of [ZOOM_MIN, 0.1, 0.5, 1, 3, ZOOM_MAX]) {
      const bar = scaleBar(zoom);
      expect(bar.metres).toBeGreaterThan(0);
      expect(bar.label).toMatch(/^\d[\d.,]*\s(km|m)$/);
    }
  });
  it('names detail stages as one continuous view', () => {
    const stages = [ZOOM_MIN, 0.1, 0.5, 1, 3, ZOOM_MAX].map(stageForZoom);
    expect(new Set(stages).size).toBeGreaterThan(1);
    for (const stage of stages) expect(stage.length).toBeGreaterThan(3);
    // Zooming further in never returns to a coarser stage name.
    expect(stageForZoom(ZOOM_MAX)).toBe('Siedlung');
    // ZOOM_MIN shows the ≈1.460 km relief area, not all of Europe.
    expect(stageForZoom(ZOOM_MIN)).toBe('Herrschaftsraum');
  });
  it('orders all stages strictly between the endpoints', () => {
    // Zooming out walks Siedlung → Umgebung → Region → Herrschaftsraum
    // without skipping or repeating a stage. The camera axis never
    // reaches Behausung/Schreibtisch scale; those are the first-person view.
    const walk = [ZOOM_MAX, 1, 0.5, 0.4, 0.1, ZOOM_MIN].map(stageForZoom);
    expect(walk).toEqual([
      'Siedlung', 'Siedlung', 'Umgebung', 'Umgebung',
      'Region', 'Herrschaftsraum'
    ]);
    expect(stageForZoom(ZOOM_SURROUNDINGS)).toBe('Umgebung');
    // A step below the surroundings zoom already shows the wider region.
    expect(stageForZoom(ZOOM_SURROUNDINGS - 0.05)).toBe('Region');
    // Behausung/Schreibtisch exist as names for the near view, but the map
    // camera alone cannot reach them (honesty about reachable scale).
    expect(stageForZoom(ZOOM_MAX)).not.toBe('Behausung');
    expect(stageForZoom(ZOOM_MAX)).not.toBe('Schreibtisch');
  });
  it('clamps zoom to a continuous range', () => {
    expect(clampZoom(1000)).toBe(ZOOM_MAX);
    expect(clampZoom(-1)).toBe(ZOOM_MIN);
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(clampZoom(1.5)).toBe(1.5);
  });
  it('reports more pixels per metre when zooming in', () => {
    expect(pixelsPerMetre(2)).toBeGreaterThan(pixelsPerMetre(1));
    expect(pixelsPerMetre(1)).toBeGreaterThan(pixelsPerMetre(0.1));
  });
  it('accounts for projection stretch toward the poles', () => {
    expect(longitudeStretch(0)).toBeCloseTo(1, 6);
    expect(longitudeStretch(53)).toBeGreaterThan(1.6);
    expect(longitudeStretch(53)).toBeLessThan(1.7);
  });
  it('formats distances in metres and kilometres', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(2_000)).toBe('2 km');
  });
});
