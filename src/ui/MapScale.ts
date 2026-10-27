/**
 * Gemeinsame Maßstabsgrundlage der Kartenansicht.
 *
 * Zweck: Schreibtisch, Behausung, Siedlung, Umgebung, Region, Herrschaftsraum
 * und Europa sind **dieselbe** Ansicht in verschiedenen Zoomstufen. Damit
 * Gebäude, Abstände und Beschriftungen zusammenpassen, rechnet alles über
 * dieselbe Kette:
 *
 *   Weltmeter  →  Basispixel (Siedlungsmaßstab)  →  Bildschirmpixel (Zoom)
 *
 * Die Basis ist der bestehende Siedlungsplan: 960 × 672 Pixel entsprechen
 * 20 × 14 km im Projektionssystem EPSG:25832 (UTM 32N). Daraus folgt
 * {@link METRES_PER_BASE_PIXEL}. Diese Zahl ist die einzige Umrechnung zwischen
 * Geometrie und Karte; alle weiteren Werte leiten sich aus ihr ab.
 *
 * Grenzen:
 *  - Gebäudegrundflächen sind Spielmodelle, keine vermessenen Grundrisse.
 *  - Regionenpositionen sind Ortsreferenzen, keine Gebietsgrenzen.
 *  - Europa wird über einen einfachen Mercator-Längengradfaktor angenähert;
 *    die Verzerrung wächst mit der Breite und wird im Maßstab angegeben,
 *    nicht korrigiert.
 */

/** Breite der Siedlungsbasis in Pixeln (bestehender Siedlungsplan). */
export const BASE_WIDTH = 960;
/** Höhe der Siedlungsbasis in Pixeln. */
export const BASE_HEIGHT = 672;

/**
 * Meter je Basispixel. 20.000 m auf 960 px, gleichmäßig auf beiden Achsen.
 * Dies ist die einzige Geometrieumrechnung der Karte.
 */
export const METRES_PER_BASE_PIXEL = 20_000 / BASE_WIDTH;

/** Meter je Basispixel auf der Y-Achse (identisch, zur Dokumentation). */
export const METRES_PER_BASE_PIXEL_Y = 14_000 / BASE_HEIGHT;

/**
 * Kontinuierlicher Zoombereich.
 *
 * Die Grenzen sind aus den **benötigten sichtbaren Weltgrößen** abgeleitet.
 * Referenz ist die Einpassung der Siedlung auf eine 1350-px-Breite
 * (Fit-Faktor 1 bei Zoom 1): sichtbare Basispixel = 1350/Zoom, sichtbare
 * Meter = 1350 · 20,8333/Zoom. Bei anderen Viewports skaliert der Fit-Faktor
 * die effektive Skala mit; die Stufengrenzen bleiben an der Referenz.
 *
 *   - `ZOOM_MIN ≈ 0,007` → ≈ 4.000 km sichtbar (Europa, Lissabon–Warschau).
 *   - `ZOOM_MAX = 9375`  → ≈ 3 m sichtbar (Schreibtisch).
 *
 * `1` zeigt die Siedlung mit Umgebung (≈ 28 km Breite); die 20-km-Siedlung
 * füllt den Ausschnitt mit Rand. Der Bereich ist durchgehend; alle sieben
 * Stufen (Schreibtisch → Europa) sind erreichbar.
 */
export const ZOOM_MIN = 0.00703;
export const ZOOM_MAX = 9375;

/** Zoomstufe, bei der die eigene Behausung als Ganzes sichtbar wird (≈ 15 m). */
export const ZOOM_DWELLING = 1875;
/** Zoomstufe, bei der die Siedlung als Ganzes sichtbar ist (20 km). */
export const ZOOM_SETTLEMENT = 1;
/** Zoomstufe, bei der die nähere Umgebung (≈ 120 km) sichtbar wird. */
export const ZOOM_SURROUNDINGS = 0.24;
/** Zoomstufe, bei der die Region (≈ 500 km) sichtbar wird. */
export const ZOOM_REGION = 0.0563;
/** Zoomstufe, bei der Europa (≈ 4.000 km) sichtbar wird. */
export const ZOOM_EUROPE = 0.00703;

/**
 * Bildschirmpixel je Weltmeter bei einem Zoom.
 * @param zoom Aktueller Kamerazoom.
 * @returns Pixel pro Meter.
 */
export function pixelsPerMetre(zoom: number): number {
  return zoom / METRES_PER_BASE_PIXEL;
}

/**
 * Wandelt eine Länge in Metern in Basispixel um.
 * @param metres Länge in Metern.
 * @returns Länge in Basispixeln der Siedlungsbasis.
 */
export function metresToBase(metres: number): number {
  return metres / METRES_PER_BASE_PIXEL;
}

/**
 * Wandelt Basispixel in Meter um.
 * @param pixels Länge in Basispixeln.
 * @returns Länge in Metern.
 */
export function baseToMetres(pixels: number): number {
  return pixels * METRES_PER_BASE_PIXEL;
}

/**
 * Wählt eine „runde" Maßstabsbalkenlänge für die aktuelle Ansicht.
 *
 * @param zoom Aktueller Kamerazoom.
 * @param maxWidthPx Maximale Breite des Balkens in Bildschirmpixeln.
 * @returns Länge in Metern und lesbare Beschriftung.
 */
export function scaleBar(zoom: number, maxWidthPx = 120): { metres: number; label: string } {
  const perPixel = METRES_PER_BASE_PIXEL / Math.max(zoom, Number.MIN_VALUE);
  const target = maxWidthPx * perPixel;
  const steps = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000,
    10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];
  const metres = steps.find(step => step >= target) ?? steps[steps.length - 1];
  return { metres, label: formatDistance(metres) };
}

/** Lesbare Entfernungsangabe in Metern oder Kilometern. */
export function formatDistance(metres: number): string {
  return metres >= 1000
    ? `${new Intl.NumberFormat('de-DE').format(metres / 1000)} km`
    : `${new Intl.NumberFormat('de-DE').format(metres)} m`;
}

/**
 * Mercator-Längengradfaktor: um wie viel Meter eine Längengradlinie gegenüber
 * dem Äquator gestreckt ist.
 *
 * @param latitude Geografische Breite in Grad.
 * @returns Faktor (1 am Äquator, >1 zu den Polen).
 */
export function longitudeStretch(latitude: number): number {
  const radians = (Math.max(-85, Math.min(85, latitude)) * Math.PI) / 180;
  return 1 / Math.cos(radians);
}

/**
 * Benennt die Detailstufe eines Zooms. Die Begriffe beschreiben dieselbe
 * Ansicht, keine getrennten Karten.
 *
 * Die Stufen sind aus tatsächlich sichtbaren Weltgrößen abgeleitet (Referenz
 * Fit-Faktor 1 = 1350 Basispixel sichtbar; sichtbare Meter ≈ 28.125/Zoom):
 *
 *   - Schreibtisch ≤ 3 m (Zoom ≥ 9.375) — Nahgeometrie + Ich-Perspektive
 *   - Behausung ≤ 15 m (Zoom ≥ 1.875)
 *   - Siedlung ≤ 40 km (Zoom ≥ 0,70)
 *   - Umgebung ≤ 120 km (Zoom ≥ 0,234)
 *   - Region ≤ 500 km (Zoom ≥ 0,0563)
 *   - Herrschaftsraum ≤ 2.000 km (Zoom ≥ 0,0141)
 *   - Europa > 2.000 km (bis ≈ 4.000 km bei ZOOM_MIN)
 *
 * @param zoom Aktueller Kamerazoom.
 * @returns Bezeichnung der Detailstufe.
 */
export function stageForZoom(zoom: number): string {
  const visibleMetres = (1350 * METRES_PER_BASE_PIXEL) / Math.max(zoom, Number.MIN_VALUE);
  if (visibleMetres <= 3) return 'Schreibtisch';
  if (visibleMetres <= 15) return 'Behausung';
  if (visibleMetres <= 40_000) return 'Siedlung';
  if (visibleMetres <= 120_000) return 'Umgebung';
  if (visibleMetres <= 500_000) return 'Region';
  if (visibleMetres <= 2_000_000) return 'Herrschaftsraum';
  return 'Europa';
}

/** Klemmt einen Zoom auf den erlaubten Bereich. */
export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return ZOOM_SETTLEMENT;
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}

/**
 * Feste Verankerung der eigenen Behausung in der Siedlung (Basispixel).
 *
 * Der Anker liegt bewusst **nahe am belegten Ortsmarker** `places.home`
 * (Ganderkesee, EPSG:25832 E=469588, N=5876004 → Basispixel [604,384]),
 * nicht auf einem erfundenen Hausstandort: Haus und Ortsmarker sind
 * unterschiedliche Dinge, aber der Hof gehört zum Ort. Der kleine Versatz
 * (≈ 12 m nach Südwesten) hält Haus und Ortsmarke auf der Karte getrennt
 * lesbar, ohne einen vermessenen Grundriss zu behaupten (≈ 7 m Versatz).
 */
export const DWELLING_ANCHOR = { x: 604, y: 384 } as const;
