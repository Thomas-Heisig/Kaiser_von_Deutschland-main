/**
 * Historischer Kontext – verbindet das deklarative Geschichtsmodell mit dem Spiel.
 *
 * Diese Brücke ist die **einzige** Stelle, an der Spieljahre auf das
 * historische Datenmodell aus `src/history/` abgebildet werden. Sie enthält
 * keine Simulation und keine Spielregeln; sie liefert ausschließlich
 * eingeordnete, evidenzgekennzeichnete Informationen.
 *
 * Grundsätze:
 *  - Keine erfundenen Grenzen: Jahre ohne belastbare Epoche liefern `null`.
 *  - Keine Teleologie: Es gibt keine „nächste Stufe"; Zustände sind zeitgebunden.
 *  - Keine Wertung: Titel und Evidenzgrade sind beschreibend.
 *  - Das Spiel bleibt eine **alternative Geschichte**: Die reale Ordnungsform
 *    ist Referenzrahmen, nicht Vorschrift für den Spielverlauf.
 *
 * @version 0.2.0
 */

import {
  epochForHistoricalYear,
  EvidenceLevel,
  HistoricalEpoch,
  Office,
  PolityCatalog,
  PoliticalSystem
} from '../history/PolityModel';
import { EPOCHS, OFFICES, POLITICAL_SYSTEMS, REGIONS } from '../history/PolityData';

/**
 * Abbildung der **Spiel**-Titelränge auf historische Ordnungsformen.
 *
 * Die Ränge stammen aus dem bestehenden Spielsystem (`TitleSystem`). Die
 * Zuordnung ist bewusst explizit und konservativ: Sie behauptet für jeden Rang
 * nur die Ordnungsform, die für diese Art von Herrschaft historisch belegt ist.
 *
 * `null` bedeutet ausdrücklich: Für diesen Rang gibt es **keine** belastbare
 * Entsprechung – dann wird nichts behauptet.
 */
const TITLE_SYSTEM_MAP: Readonly<Record<string, readonly string[]>> = {
  // Frühformen regionaler Herrschaft (Rang 1–2 im Spielsystem)
  '1': ['stammesverband', 'herzogtum'],
  '2': ['herzogtum'],
  // Hochadelige Herrschaft
  '3': ['herzogtum', 'koenigreich'],
  '4': ['koenigreich'],
  // Königswürde und Kaisertum des Reiches
  '5': ['koenigreich', 'kaisertum_hrr'],
  '6': ['kaisertum_hrr'],
  '7': ['kaisertum_hrr'],
  // Spätere Ordnungsformen: bewusst KEINE Fortschreibung des Kaisertums.
  '8': ['parlamentarische_republik', 'konstitutionelle_monarchie']
};

/**
 * Kontext einer Spielposition im historischen Modell.
 *
 * Alle Felder sind optional belegt: Wo die Quelle keine Aussage erlaubt, bleibt
 * das Feld `null` und die Evidenz ist `nicht_verifiziert`.
 */
export interface HistoricalContext {
  /** Spieljahr, auf das sich der Kontext bezieht. */
  year: number;
  /** Epoche mit Evidenzgrad, sofern belastbar. */
  epoch: HistoricalEpoch | null;
  /** Evidenzgrad der Epochenzuordnung. */
  epochEvidence: EvidenceLevel;
  /**
   * Politisches System, das für diese Epoche und das Reich als Referenz dient.
   * `null`, wenn keine belastbare Zuordnung möglich ist.
   */
  system: PoliticalSystem | null;
  /**
   * Historische Würde des Herrschers (z. B. „Römisch-deutscher Kaiser"),
   * abgeleitet aus Spielrang **und** Epoche. `null`, wenn keine Entsprechung
   * belegt ist.
   */
  rulerDignity: Office | null;
  /** Kurze, wertungsfreie Einordnung für die Oberfläche. */
  summary: string;
  /**
   * Kennzeichnet, dass der Spielverlauf bewusst von der belegten Geschichte
   * abweicht. Im Spiel immer `true` – das Spiel ist eine Alternativgeschichte.
   */
  alternateHistory: boolean;
}

/**
 * Liefert die Epoche zu einem Spieljahr – ohne Grenzen zu erfinden.
 *
 * @param year Spieljahr.
 * @returns Epoche oder `null` bei fehlender belastbarer Grenze.
 */
export function historicalEpochFor(year: number): HistoricalEpoch | null {
  return epochForHistoricalYear(year);
}

/**
 * Wählt für eine Epoche das passende Referenzsystem.
 *
 * Es werden nur Systeme berücksichtigt, die für die Epoche belegt sind.
 * Bei mehreren Kandidaten gewinnt das **spezifischste** (die meisten
 * Epochenbindungen wären unspezifisch, daher: zuerst das System mit der
 * geringsten Zahl eigener Epochen, danach alphabetisch) – deterministisch und
 * ohne Wertung als „höhere Entwicklungsstufe".
 *
 * @param epochId Epochen-ID.
 * @returns Referenzsystem oder `null`.
 */
export function referenceSystemFor(epochId: string): PoliticalSystem | null {
  const candidates = POLITICAL_SYSTEMS
    .filter((system) => system.epochIds.includes(epochId))
    .sort((a, b) => {
      const spread = a.epochIds.length - b.epochIds.length;
      return spread !== 0 ? spread : a.name.localeCompare(b.name, 'de');
    });
  return candidates[0] ?? null;
}

/**
 * Ermittelt die historische Würde für einen Spielrang und eine Epoche.
 *
 * Es wird ausschließlich ein Amt zurückgegeben, das **sowohl** im Referenzsystem
 * **als auch** in der Epoche belegt ist. Andernfalls `null` – es wird keine
 * Würde erfunden.
 *
 * @param rank Spielrang des Herrschers (`Player.title.rank`).
 * @param epochId Epochen-ID.
 * @param systemId System-ID.
 * @returns Amt oder `null`.
 */
export function dignityFor(rank: number, epochId: string, systemId: string): Office | null {
  const mappedSystems = TITLE_SYSTEM_MAP[String(rank)];
  if (!mappedSystems || !mappedSystems.includes(systemId)) return null;
  const candidates = OFFICES
    .filter((office) =>
      office.epochIds.includes(epochId) &&
      office.systemIds.includes(systemId) &&
      // Nur Ämter, die eine Herrschaftsposition bezeichnen – keine Verwaltungsämter.
      /kaiser|koenig|herzog|oberhaupt|fuerst|kanzler|praesident/i.test(office.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return candidates[0] ?? null;
}

/**
 * Baut den vollständigen historischen Kontext für ein Spieljahr und einen Rang.
 *
 * @param year Spieljahr.
 * @param rank Spielrang des Herrschers.
 * @returns Kontext mit allen ableitbaren, evidenzgekennzeichneten Feldern.
 *
 * @example
 * ```ts
 * const context = buildHistoricalContext(1200, 4);
 * context.epoch?.name;        // 'Hochmittelalter (Reichsbildung)'
 * context.rulerDignity?.name; // 'König'
 * ```
 */
export function buildHistoricalContext(year: number, rank: number): HistoricalContext {
  const epoch = historicalEpochFor(year);
  if (!epoch) {
    return {
      year,
      epoch: null,
      epochEvidence: 'nicht_verifiziert',
      system: null,
      rulerDignity: null,
      summary: 'Für dieses Jahr liegt keine belastbare historische Einordnung vor.',
      alternateHistory: true
    };
  }
  const system = referenceSystemFor(epoch.id);
  const rulerDignity = system ? dignityFor(rank, epoch.id, system.id) : null;
  const parts: string[] = [epoch.name];
  if (system) parts.push(system.name);
  if (rulerDignity) parts.push(rulerDignity.name);
  if (epoch.evidence !== 'belegt') {
    parts.push(epoch.evidence === 'naeherung' ? 'Grenzen genähert' : 'Grenzen ungeprüft');
  }
  return {
    year,
    epoch,
    epochEvidence: epoch.evidence,
    system,
    rulerDignity,
    summary: parts.join(' · '),
    alternateHistory: true
  };
}

/** Anzahl der verfügbaren Epochen im Modell (für Diagnose und Tests). */
export const MODEL_EPOCH_COUNT = EPOCHS.length;
/** Anzahl der verfügbaren Regionen im Modell. */
export const MODEL_REGION_COUNT = REGIONS.length;
/** Anzahl der verfügbaren politischen Systeme im Modell. */
export const MODEL_SYSTEM_COUNT = POLITICAL_SYSTEMS.length;
/** Anzahl der verfügbaren Ämter im Modell. */
export const MODEL_OFFICE_COUNT = OFFICES.length;

/**
 * Prüft beim Start, ob das Geschichtsmodell vollständig geladen ist.
 *
 * @returns `true`, wenn alle vier Datensätze befüllt sind.
 */
export function isHistoricalModelReady(): boolean {
  return PolityCatalog.getEpochs().length > 0 &&
    PolityCatalog.getRegions().length > 0 &&
    PolityCatalog.getSystems().length > 0 &&
    PolityCatalog.getOffices().length > 0;
}
