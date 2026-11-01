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

/**
 * Clamps zoom to a real visible width, including the current viewport fit.
 * @param zoom Requested relative scale.
 * @param cssWidth Canvas width in CSS pixels.
 * @param fitFactor All baseline container scaling.
 * @returns Relative zoom giving a view between 3 metres and 4,000 kilometres.
 */
export function clampZoomForViewport(zoom: number, cssWidth: number, fitFactor: number): number {
  const referenceWidth = cssWidth * METRES_PER_BASE_PIXEL / fitFactor;
  if (!Number.isFinite(referenceWidth) || referenceWidth <= 0) {
    throw new Error('Invalid viewport scale.');
  }
  const min = referenceWidth / 4_000_000, max = referenceWidth / MAP_DETAIL_WIDTHS.desk;
  return Math.max(min, Math.min(max, Number.isFinite(zoom) ? zoom : min));
}

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

/** Sichtbare Kartenbreiten, an denen die Namen der durchgehenden Detailstufen wechseln. */
export const MAP_DETAIL_WIDTHS = {
  desk: 3,
  dwelling: 15,
  settlement: 40_000,
  surroundings: 120_000,
  region: 500_000,
  realm: 2_000_000,
} as const;

/** Weitere LOD-Schwellen, als reale sichtbare Kartenbreiten ausgedrückt. */
const REFERENCE_VIEW_WIDTH_METRES = 1350 * METRES_PER_BASE_PIXEL;
export const MAP_LAYER_WIDTHS = {
  buildings: REFERENCE_VIEW_WIDTH_METRES / 0.35,
  nearShow: REFERENCE_VIEW_WIDTH_METRES / 1.2,
  nearHide: REFERENCE_VIEW_WIDTH_METRES / 0.9,
  terrain: REFERENCE_VIEW_WIDTH_METRES / 0.16,
  europeShow: REFERENCE_VIEW_WIDTH_METRES / 0.014,
  europeHide: REFERENCE_VIEW_WIDTH_METRES / 0.02,
} as const;

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
  return scaleBarForMetresPerPixel(perPixel, maxWidthPx);
}

/**
 * Wählt einen 1/2/5-Maßstabsbalken anhand des tatsächlichen CSS-Pixelmaßstabs.
 * @param metresPerCssPixel Effektive Weltmeter je CSS-Pixel inklusive Fit-Faktor.
 * @param maxWidthPx Maximale Balkenbreite in CSS-Pixeln.
 * @returns Gerundete Meterlänge und passende Beschriftung.
 */
export function scaleBarForMetresPerPixel(
  metresPerCssPixel: number,
  maxWidthPx = 120,
): { metres: number; label: string } {
  const target = Math.max(Number.MIN_VALUE, maxWidthPx * metresPerCssPixel);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const metres = [1, 2, 5].reduce((selected, step) => {
    const candidate = step * magnitude;
    return candidate <= target ? candidate : selected;
  }, magnitude);
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
 * Die Stufen sind aus der tatsächlich sichtbaren Weltbreite abgeleitet. Die
 * Renderer sollten {@link stageForVisibleWidth} mit der Canvasbreite und dem
 * effektiven Maßstab aufrufen; diese Funktion bleibt für Referenz-/Altaufrufe.
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
  return stageForVisibleWidth(visibleMetres);
}

/**
 * Benennt die Detailstufe anhand der real sichtbaren Weltbreite.
 * @param visibleMetres Weltbreite des Canvas in Metern pro CSS-Pixel × CSS-Pixel.
 * @returns Detailstufenname.
 */
export function stageForVisibleWidth(visibleMetres: number): string {
  const width = Number.isFinite(visibleMetres) && visibleMetres >= 0
    ? visibleMetres : Number.POSITIVE_INFINITY;
  if (width <= MAP_DETAIL_WIDTHS.desk + 1e-9) return 'Schreibtisch';
  if (width <= MAP_DETAIL_WIDTHS.dwelling) return 'Behausung';
  if (width <= MAP_DETAIL_WIDTHS.settlement) return 'Siedlung';
  if (width <= MAP_DETAIL_WIDTHS.surroundings) return 'Umgebung';
  if (width <= MAP_DETAIL_WIDTHS.region) return 'Region';
  if (width <= MAP_DETAIL_WIDTHS.realm) return 'Herrschaftsraum';
  return 'Europa';
}

/** Versatz der modellierten Behausung vom Ortsmarker, in lokalen Weltmetern. */
export const DWELLING_OFFSET_METRES = { east: 20, south: 15 } as const;

/** Klemmt einen Zoom auf den erlaubten Bereich. */
export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return ZOOM_SETTLEMENT;
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}

/**
 * Basispixelposition des belegten Ortsmarkers `places.home`.
 *
 * Die modellierte Behausung ist ein eigener, relativ dazu definierter Punkt
 * (`DWELLING_OFFSET_METRES`); weder Marker noch Versatz behaupten einen
 * vermessenen Hausstandort. Ortsmarker und Gebäudegeometrie bleiben getrennt.
 */
export const DWELLING_ANCHOR = { x: 604, y: 384 } as const;

/**
 * Geografische Verankerung des Ortsmarkers (places.home).
 *
 * Aus der EPSG:25832-Position des Markers abgeleitet (E=469 588,5 / N=5 876 004,4,
 * UTM 32N, Zentralmeridian 9°O, Maßstabsfaktor 0,9996):
 *
 *   lon = 9° − (500 000 − E) / (111 320 · cos(lat) · 0,9996) ≈ 8,5459°O
 *   lat ≈ 53,0336°N (Meridianbogen, Genauigkeit ±0,005°)
 *
 * Diese Werte sind die **einzige** Brücke zwischen Grad-Geografie (Europa-
 * übersicht, Gemeindegrenze) und Basispixeln. Alle Transformationen laufen über
 * {@link lonToBaseX}/{@link latToBaseY}, damit Europa- und Lokalebene dieselbe
 * Verankerung teilen und beim Detailwechsel nichts verspringt.
 */
export const HOME_LON = 8.5459;
export const HOME_LAT = 53.0336;

/** Meter je Grad Breite am Standort (Meridianbogen, genähert). */
export const METRES_PER_DEG_LAT = 110_950;
/** Meter je Grad Länge am Bezugsbreitengrad (UTM-Skalierung eingerechnet). */
export const METRES_PER_DEG_LON_HOME = 111_320 * Math.cos(HOME_LAT * Math.PI / 180) * 0.9996;

/**
 * Rechnet einen Längengrad in Basispixel-x um (georeferenzierte Ebenen).
 * @param lon Längengrad in Grad (östlich positiv).
 * @returns Basispixel-x der Siedlungsbasis.
 */
export function lonToBaseX(lon: number): number {
  return DWELLING_ANCHOR.x + (lon - HOME_LON) * METRES_PER_DEG_LON_HOME / METRES_PER_BASE_PIXEL;
}

/**
 * Rechnet einen Breitengrad in Basispixel-y um (georeferenzierte Ebenen).
 * @param lat Breitengrad in Grad (nördlich positiv).
 * @returns Basispixel-y der Siedlungsbasis (y zeigt nach Süden).
 */
export function latToBaseY(lat: number): number {
  return DWELLING_ANCHOR.y - (lat - HOME_LAT) * METRES_PER_DEG_LAT / METRES_PER_BASE_PIXEL;
}
