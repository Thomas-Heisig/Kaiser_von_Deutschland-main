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
 * `1` zeigt die Siedlung in ihrer natürlichen Größe. Kleinere Werte zoomen
 * heraus (bis Europa), größere hinein (bis zum Schreibtisch). Der Bereich ist
 * so gewählt, dass Europa (≈ 4.000 km) und der Schreibtisch (≈ 3 m) in einer
 * durchgehenden Achse erreichbar sind.
 */
export const ZOOM_MIN = 0.02;
export const ZOOM_MAX = 6;

/** Zoomstufe, bei der die eigene Behausung als Ganzes sichtbar wird. */
export const ZOOM_DWELLING = 4;
/** Zoomstufe, bei der die Siedlung als Ganzes sichtbar ist. */
export const ZOOM_SETTLEMENT = 1;
/** Zoomstufe, bei der die nähere Umgebung (≈ 73 km) sichtbar wird. */
export const ZOOM_SURROUNDINGS = 0.35;
/** Zoomstufe, bei der die Region sichtbar wird. */
export const ZOOM_REGION = 0.25;
/** Zoomstufe, bei der Europa sichtbar wird. */
export const ZOOM_EUROPE = 0.03;

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
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000,
    10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];
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
 * Die Stufen sind aus tatsächlich sichtbaren Weltgrößen abgeleitet: Bei
 * Zoom 1 zeigt die Karte die 20-km-Siedlung, bei ZOOM_MAX ≈ 3,5 m/px —
 * das ist Behausungsgröße, noch kein Schreibtisch. „Schreibtisch" wird
 * deshalb nur vergeben, wenn die sichtbare Weltbreite unter ≈ 12 m fällt
 * (Schreibtisch + Behausung), was die Kamera-Achse allein noch nicht
 * erreicht; die Nahansicht ist die Ich-Perspektive (FirstPersonView).
 *
 * Herrschaftsraum ↔ Europa: Die Reliefkarte deckt ≈ 1.460 km Breite ab
 * (sichtbar bei ZOOM_MIN). Der Stufenname folgt dem sichtbaren Ausschnitt —
 * ZOOM_MIN zeigt Mitteleuropa (Herrschaftsraum), nicht ganz Europa.
 *
 * @param zoom Aktueller Kamerazoom.
 * @returns Bezeichnung der Detailstufe.
 */
export function stageForZoom(zoom: number): string {
  // Sichtbare Weltbreite bei vollem Bildschirm (Referenz ~1400 Basispixel):
  // ≈ 29.167 m / Zoom. Schwellen prüfen, was tatsächlich sichtbar ist.
  const visibleMetres = (1400 * METRES_PER_BASE_PIXEL) / Math.max(zoom, Number.MIN_VALUE);
  if (visibleMetres <= 12) return 'Schreibtisch';       // ≈ Zoom 2431 — nur FP
  if (visibleMetres <= 30) return 'Behausung';          // ≈ Zoom 971 — nur FP
  if (visibleMetres <= 40_000) return 'Siedlung';       // Zoom ≥ 0.73
  if (visibleMetres <= 90_000) return 'Umgebung';       // Zoom ≥ 0.32
  if (visibleMetres <= 400_000) return 'Region';        // Zoom ≥ 0.073
  return 'Herrschaftsraum';                             // ≈ ≤ 1.460 km Relief
}

/** Klemmt einen Zoom auf den erlaubten Bereich. */
export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return ZOOM_SETTLEMENT;
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}
