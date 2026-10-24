/**
 * Zoom-Ebenen der Karte – reine Logik, ohne PixiJS und ohne DOM.
 *
 * Dieses Modul ist bewusst frei von Grafik-Abhängigkeiten, damit die
 * Schwellen, das Slider-Mapping und der Regionsabruf ohne Browser testbar
 * bleiben. `KingdomMap` konsumiert es nur.
 *
 * Ebenen (bewusst nur zwei in diesem Schritt):
 *  - `dorf`         – die bestehenden 16 Bezirke (unverändert)
 *  - `zentraleuropa` – schematische Regionsnamen ohne Grenzlinien
 *
 * Grundsätze:
 *  - Keine erfundenen Grenzen: Es werden ausschließlich Namen und Positionen
 *    geliefert, niemals Polygone oder Linien.
 *  - Keine Behauptung bei fehlender Quelle: Regionen mit Evidenzgrad
 *    `nicht_verifiziert` werden ausgefiltert, nicht stillschweigend gezeigt.
 *
 * @version 0.1.0
 */

import { historicalEpochFor } from '../core/HistoricalContext';
import { EvidenceLevel, HistoricalRegion, PolityCatalog } from '../history/PolityModel';
import { REGIONS } from '../history/PolityData';

/** Sichtbare Kartenebene. */
export type MapZoomLevel = 'dorf' | 'zentraleuropa';

/** Slider-Grenzen (HTML `<input type="range">`). */
export const SLIDER_MIN = 0;
export const SLIDER_MAX = 100;

/** Kamera-Zoombereich – bewusst weiter als die bisherigen 0.8–2.2. */
export const CAMERA_ZOOM_MIN = 0.4;
export const CAMERA_ZOOM_MAX = 4.0;

/**
 * Schwellen mit Hysterese.
 *
 * Wechsel **nach** Zentraleuropa erst unterhalb `toRegion`, zurück nach Dorf
 * erst oberhalb `toVillage`. Die Lücke verhindert Flackern, wenn der Slider
 * genau auf einem Grenzwert steht.
 */
export const LEVEL_THRESHOLDS = {
  /** Unter diesem Slider-Wert wird „Zentraleuropa" aktiv. */
  toRegion: 35,
  /** Ab diesem Slider-Wert wird wieder „Dorf" aktiv. */
  toVillage: 40
} as const;

/** Schrittweite der „+"/„−"-Buttons in Slider-Einheiten. */
export const SLIDER_STEP = 6;

/** Eine auf der Karte darstellbare Region. */
export interface MapRegionLabel {
  id: string;
  name: string;
  /**
   * Schematische Position in Prozent der Kartenfläche (0–100).
   * Bewusst **keine** Geokoordinaten: Die Anordnung ist illustrativ,
   * nicht kartografisch.
   */
  xPercent: number;
  yPercent: number;
  /** Evidenzgrad der Regionszuordnung. */
  evidence: EvidenceLevel;
}

/** Ergebnis des Regionsabrufs für ein Jahr. */
export interface MapRegionResult {
  /** Darstellbare Regionen (kann leer sein). */
  labels: MapRegionLabel[];
  /** Epochenname für die Überschrift, `null` bei fehlender Quelle. */
  epochName: string | null;
  /** Evidenzgrad der Epoche. */
  evidence: EvidenceLevel;
  /**
   * Fertiger Hinweistext für die Oberfläche. Nie leer – bei fehlender Quelle
   * wird ausdrücklich benannt, dass keine belegte Region vorliegt.
   */
  message: string;
}

/**
 * Geografischer Ausschnitt der Relief-Textur (siehe
 * `scripts/build-relief-texture.py`). Regionsnamen und Textur teilen sich
 * exakt diese Fläche, damit Namen und Relief zusammenpassen.
 */
export const RELIEF_BOUNDS = {
  west: 3,
  east: 19,
  south: 45,
  north: 56
} as const;

/**
 * Dokumentierte Zentren der Kulturräume (Breite/Länge).
 *
 * Grundlage sind die Koordinaten bekannter Städte des jeweiligen Raums –
 * **keine** erfundenen Grenzverläufe. Die Auswahl ist bewusst grob: Ein
 * Kulturraum hat kein Zentrum im geometrischen Sinn; der Punkt markiert
 * lediglich einen belegten namengebenden Ort.
 *
 * Beispiele: Lübeck (Hanse), Köln (Rheinland), Nürnberg (Franken),
 * München (Bayern), Breslau (Schlesien), Berlin (preußisches Kernland).
 */
const REGION_CENTERS: Readonly<Record<string, { lat: number; lon: number }>> = {
  // Norddeutschland
  hansestaedte: { lat: 53.87, lon: 10.69 },  // Lübeck
  westfalen: { lat: 51.96, lon: 7.63 },      // Münster
  sachsen: { lat: 51.34, lon: 12.37 },       // Leipzig
  preussen: { lat: 52.52, lon: 13.40 },      // Berlin (preußisches Kernland)
  // Mitte
  rheinland: { lat: 50.94, lon: 6.96 },      // Köln
  hessen: { lat: 50.11, lon: 8.68 },         // Frankfurt am Main
  thueringen: { lat: 50.98, lon: 11.03 },    // Erfurt
  franken: { lat: 49.45, lon: 11.08 },       // Nürnberg
  // Südwesten
  baden: { lat: 49.01, lon: 8.40 },          // Karlsruhe
  wurttemberg: { lat: 48.78, lon: 9.18 },    // Stuttgart
  schwaben: { lat: 48.37, lon: 10.90 },      // Augsburg
  // Südosten
  bayern: { lat: 48.14, lon: 11.58 },        // München
  schlesien: { lat: 51.11, lon: 17.03 }      // Breslau
};

/**
 * Rechnet Koordinaten in Prozent der Texturfläche um.
 *
 * @param lat Breitengrad.
 * @param lon Längengrad.
 * @returns Position in Prozent (0–100); kann außerhalb liegen, wenn der Punkt
 *   nicht im Ausschnitt liegt – dann ist die Region nicht darstellbar.
 */
export function geoToPercent(lat: number, lon: number): { xPercent: number; yPercent: number } {
  return {
    xPercent: ((lon - RELIEF_BOUNDS.west) / (RELIEF_BOUNDS.east - RELIEF_BOUNDS.west)) * 100,
    yPercent: ((RELIEF_BOUNDS.north - lat) / (RELIEF_BOUNDS.north - RELIEF_BOUNDS.south)) * 100
  };
}

/**
 * Filtert Regionen, die für eine Epoche gezeigt werden dürfen.
 *
 * Ausgeschlossen werden:
 *  - alle Regionen bei unbekannter Epoche (nichts behaupten),
 *  - Regionen mit Evidenzgrad `nicht_verifiziert` (z. B. der Platzhalter
 *    „germanien") – sie belegen nichts und dürfen nicht wie eine Landschaft
 *    wirken,
 *  - Regionen, deren `epochIds` die Epoche nicht enthält (leere Liste = in
 *    allen Epochen nutzbar).
 *
 * @param regions Alle bekannten Regionen.
 * @param epochId Epochen-ID.
 * @returns Gefilterte Regionen in unveränderter Reihenfolge.
 */
export function filterRegionsForEpoch(
  regions: readonly HistoricalRegion[],
  epochId: string
): HistoricalRegion[] {
  // Ohne bekannte Epoche wird nichts behauptet – auch keine epochenunabhängige Region.
  if (!PolityCatalog.getEpoch(epochId)) return [];
  return regions.filter((region) => {
    if (region.evidence === 'nicht_verifiziert') return false;
    if (region.epochIds.length === 0) return true;
    return region.epochIds.includes(epochId);
  });
}

/**
 * Liefert die darstellbaren Regionsnamen für ein Spieljahr.
 *
 * @param year Spieljahr.
 * @returns Labels, Epochenname, Evidenz und ein Hinweistext.
 *
 * @example
 * ```ts
 * regionsForMap(1200).labels.map((l) => l.name); // ['Rheinland', 'Sachsen', …]
 * regionsForMap(700).labels;                     // [] (Frühzeit ungeprüft)
 * ```
 */
export function regionsForMap(year: number): MapRegionResult {
  const epoch = historicalEpochFor(year);
  if (!epoch) {
    return {
      labels: [],
      epochName: null,
      evidence: 'nicht_verifiziert',
      message: 'Keine belegte Region für dieses Jahr – die Epoche ist nicht verifiziert.'
    };
  }
  const filtered = filterRegionsForEpoch(REGIONS, epoch.id);
  const labels: MapRegionLabel[] = [];
  for (const region of filtered) {
    const center = REGION_CENTERS[region.id];
    // Regionen ohne belegten Mittelpunkt werden bewusst nicht geraten.
    if (!center) continue;
    const position = geoToPercent(center.lat, center.lon);
    // Punkte außerhalb des Texturausschnitts sind nicht darstellbar.
    if (position.xPercent < 0 || position.xPercent > 100 ||
        position.yPercent < 0 || position.yPercent > 100) continue;
    labels.push({
      id: region.id,
      name: region.name,
      xPercent: position.xPercent,
      yPercent: position.yPercent,
      evidence: region.evidence
    });
  }
  if (labels.length === 0) {
    return {
      labels: [],
      epochName: epoch.name,
      evidence: epoch.evidence,
      message: `${epoch.name}: keine schematisch verortbare Region hinterlegt.`
    };
  }
  const approximated = epoch.evidence !== 'belegt' ||
    labels.some((label) => label.evidence !== 'belegt');
  return {
    labels,
    epochName: epoch.name,
    evidence: epoch.evidence,
    message: `${epoch.name} · Relief: Natural Earth (Public Domain) · Regionen nach belegten Ortszentren, Grenzverläufe nicht dargestellt${approximated ? ' · Zuordnung genähert' : ''}`
  };
}

/**
 * Bildet einen Slider-Wert (0–100) auf den Kamera-Zoom ab.
 *
 * Logarithmisch, damit sich jeder Slider-Schritt gleich stark anfühlt:
 * `zoom = MIN * (MAX/MIN)^(slider/100)`.
 *
 * @param slider Slider-Wert (wird auf 0–100 geklemmt).
 * @returns Kamera-Zoom zwischen {@link CAMERA_ZOOM_MIN} und {@link CAMERA_ZOOM_MAX}.
 */
export function sliderToZoom(slider: number): number {
  if (!Number.isFinite(slider)) return CAMERA_ZOOM_MIN;
  const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, slider));
  const ratio = CAMERA_ZOOM_MAX / CAMERA_ZOOM_MIN;
  return CAMERA_ZOOM_MIN * Math.pow(ratio, clamped / SLIDER_MAX);
}

/**
 * Bildet einen Kamera-Zoom auf den Slider-Wert ab (Umkehrfunktion).
 *
 * @param zoom Kamera-Zoom (wird auf den gültigen Bereich geklemmt).
 * @returns Slider-Wert zwischen 0 und 100.
 */
export function zoomToSlider(zoom: number): number {
  if (!Number.isFinite(zoom)) return SLIDER_MIN;
  const clamped = Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, zoom));
  const ratio = CAMERA_ZOOM_MAX / CAMERA_ZOOM_MIN;
  return Math.round((Math.log(clamped / CAMERA_ZOOM_MIN) / Math.log(ratio)) * SLIDER_MAX);
}

/**
 * Bestimmt die Ebene für einen Slider-Wert – mit Hysterese.
 *
 * @param slider Slider-Wert.
 * @param current Aktuell aktive Ebene (für die Hysterese).
 * @returns Die Ebene, die gelten soll.
 */
export function levelForSlider(slider: number, current: MapZoomLevel): MapZoomLevel {
  const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, slider));
  if (current === 'dorf' && clamped < LEVEL_THRESHOLDS.toRegion) return 'zentraleuropa';
  if (current === 'zentraleuropa' && clamped >= LEVEL_THRESHOLDS.toVillage) return 'dorf';
  return current;
}

/**
 * Verschiebt den Slider-Wert um einen Button-Schritt.
 *
 * @param slider Aktueller Wert.
 * @param direction `1` für „+", `-1` für „−".
 * @returns Geklemmter neuer Wert.
 */
export function stepSlider(slider: number, direction: 1 | -1): number {
  const base = Number.isFinite(slider) ? slider : SLIDER_MIN;
  return Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, Math.round(base) + direction * SLIDER_STEP));
}

/**
 * Ist die Zoom-Ebenen-Funktion aktiv?
 *
 * Feature-Flag `VITE_MAP_ZOOM_LEVELS`. Standard: aktiv. Abschalten mit dem
 * Wert `false`, `0` oder `off` – dann bleibt die Karte beim bisherigen
 * Verhalten (keine Ebenen, kein Slider).
 */
export function isZoomLevelsEnabled(): boolean {
  const raw = import.meta.env.VITE_MAP_ZOOM_LEVELS;
  if (raw === undefined) return true;
  const normalized = raw.trim().toLowerCase();
  return normalized !== 'false' && normalized !== '0' && normalized !== 'off';
}
