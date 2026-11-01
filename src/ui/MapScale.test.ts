import { describe, expect, it } from 'vitest';
import {
  BASE_HEIGHT, BASE_WIDTH, DWELLING_ANCHOR, HOME_LAT, HOME_LON, METRES_PER_BASE_PIXEL,
  MAP_DETAIL_WIDTHS,
  ZOOM_DWELLING, ZOOM_EUROPE, ZOOM_MAX, ZOOM_MIN, ZOOM_REGION, ZOOM_SURROUNDINGS,
  baseToMetres, clampZoom, formatDistance, latToBaseY, longitudeStretch, lonToBaseX, metresToBase,
  pixelsPerMetre, scaleBar, scaleBarForMetresPerPixel, stageForVisibleWidth, stageForZoom
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
  it('keeps scale-bar labels and CSS lengths consistent at desk and regional scales', () => {
    for (const metresPerCssPixel of [0.002, 0.1, 1, 100, 25_000]) {
      const bar = scaleBarForMetresPerPixel(metresPerCssPixel);
      expect(bar.metres / metresPerCssPixel).toBeLessThanOrEqual(120);
      expect(bar.metres / metresPerCssPixel).toBeGreaterThan(0);
      expect(bar.label).toBe(formatDistance(bar.metres));
    }
  });
  it('derives named detail stages from visible world width', () => {
    expect(stageForVisibleWidth(MAP_DETAIL_WIDTHS.desk)).toBe('Schreibtisch');
    expect(stageForVisibleWidth(MAP_DETAIL_WIDTHS.dwelling)).toBe('Behausung');
    expect(stageForVisibleWidth(MAP_DETAIL_WIDTHS.settlement)).toBe('Siedlung');
    expect(stageForVisibleWidth(MAP_DETAIL_WIDTHS.surroundings)).toBe('Umgebung');
    expect(stageForVisibleWidth(MAP_DETAIL_WIDTHS.region)).toBe('Region');
    expect(stageForVisibleWidth(MAP_DETAIL_WIDTHS.realm)).toBe('Herrschaftsraum');
    expect(stageForVisibleWidth(MAP_DETAIL_WIDTHS.realm + 1)).toBe('Europa');
  });
  it('names detail stages as one continuous view', () => {
    const stages = [ZOOM_MIN, 0.1, 0.5, 1, 3, ZOOM_MAX].map(stageForZoom);
    expect(new Set(stages).size).toBeGreaterThan(1);
    for (const stage of stages) expect(stage.length).toBeGreaterThan(3);
    // Zooming further in never returns to a coarser stage name.
    expect(stageForZoom(ZOOM_MAX)).toBe('Schreibtisch');
    expect(stageForZoom(ZOOM_MIN)).toBe('Europa');
  });
  it('orders all stages strictly between the endpoints', () => {
    // Zooming out walks Schreibtisch → Behausung → Siedlung → Umgebung →
    // Region → Herrschaftsraum → Europa without skipping or repeating a stage.
    const walk = [ZOOM_MAX, 2000, 1, ZOOM_SURROUNDINGS + 0.01, ZOOM_REGION + 0.01, ZOOM_EUROPE * 2.1, ZOOM_MIN].map(stageForZoom);
    expect(walk).toEqual([
      'Schreibtisch', 'Behausung', 'Siedlung', 'Umgebung',
      'Region', 'Herrschaftsraum', 'Europa'
    ]);
    expect(stageForZoom(ZOOM_SURROUNDINGS)).toBe('Umgebung');
    // A step below the surroundings zoom already shows the wider region.
    expect(stageForZoom(ZOOM_REGION)).toBe('Region');
    // Behausung/Schreibtisch are reachable on the camera axis now.
    expect(stageForZoom(ZOOM_MAX)).toBe('Schreibtisch');
    expect(stageForZoom(ZOOM_DWELLING)).toBe('Behausung');
  });
  it('clamps zoom to a continuous range', () => {
    expect(clampZoom(1_000_000)).toBe(ZOOM_MAX);
    expect(clampZoom(-1)).toBe(ZOOM_MIN);
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(clampZoom(1.5)).toBe(1.5);
  });
  it('keeps the measurement chain consistent at both ends', () => {
    // Schreibtisch: ≈ 3 m visible across the 1350-px reference width.
    expect((1350 * METRES_PER_BASE_PIXEL) / ZOOM_MAX).toBeCloseTo(3, 1);
    // Europa: ≈ 4000 km visible across the 1350-px reference width.
    expect((1350 * METRES_PER_BASE_PIXEL) / ZOOM_MIN).toBeCloseTo(4_000_000, -5);
    // Behausung: the dwelling anchor zoom shows ≈ 15 m.
    expect((1350 * METRES_PER_BASE_PIXEL) / ZOOM_DWELLING).toBeCloseTo(15, 0);
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

describe('Geografische Verankerung (Grad ↔ Basispixel)', () => {
  it('maps the home anchor degree values onto the dwelling anchor', () => {
    // Die Verankerung ist die einzige Brücke zwischen Grad-Geografie und
    // Basispixeln: HOME_LON/HOME_LAT müssen exakt auf DWELLING_ANCHOR fallen.
    expect(lonToBaseX(HOME_LON)).toBeCloseTo(DWELLING_ANCHOR.x, 6);
    expect(latToBaseY(HOME_LAT)).toBeCloseTo(DWELLING_ANCHOR.y, 6);
  });
  it('keeps control-point distances plausible (Ganderkesee–Berlin ≈ 325 km)', () => {
    // Gerade Linie über die Grad-Geometrie: Δlon × Meter/Grad am Bezugsbreiten-
    // grad und Δlat × Meter/Grad Breite. Berlin liegt 4,854° östlich und
    // 0,514° südlich des Ortsmarkers; die reale Luftlinie beträgt ≈ 325 km.
    const berlin = { lon: 13.40, lat: 52.52 };
    const dxEast = (berlin.lon - HOME_LON) * (111_320 * Math.cos(HOME_LAT * Math.PI / 180) * 0.9996);
    const dySouth = (HOME_LAT - berlin.lat) * 110_950;
    const metres = Math.hypot(dxEast, dySouth);
    expect(metres / 1000).toBeGreaterThan(300);
    expect(metres / 1000).toBeLessThan(350);
  });
  it('round-trips degrees through the anchor chain', () => {
    // Umkehrung: Basispixel − DWELLING_ANCHOR zurück nach Grad muss den
    // Ausgangswert liefern (dieselbe Kette, keine zweite Umrechnung).
    const lon = 10.69, lat = 53.87; // Lübeck
    const x = lonToBaseX(lon), y = latToBaseY(lat);
    const lonBack = HOME_LON + (x - DWELLING_ANCHOR.x) * METRES_PER_BASE_PIXEL
      / (111_320 * Math.cos(HOME_LAT * Math.PI / 180) * 0.9996);
    const latBack = HOME_LAT + (DWELLING_ANCHOR.y - y) * METRES_PER_BASE_PIXEL / 110_950;
    expect(lonBack).toBeCloseTo(lon, 6);
    expect(latBack).toBeCloseTo(lat, 6);
  });
});
