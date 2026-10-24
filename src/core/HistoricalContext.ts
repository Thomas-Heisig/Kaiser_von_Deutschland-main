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
 * Abbildung der **Spiel**-Titelränge auf historische Ämter – als geordnete
 * Präferenzliste, nicht als Mengen-Zuordnung.
 *
 * Die Reihenfolge ist fachlich begründet und bewusst explizit:
 * Der erste Eintrag, der für die Epoche belegt ist, gewinnt. Damit ist das
 * Ergebnis deterministisch und nicht von alphabetischer Sortierung abhängig.
 *
 * `null` bzw. eine leere Liste bedeutet: Für diesen Rang gibt es **keine**
 * belastbare Entsprechung – dann wird nichts behauptet.
 */
const RANK_DIGNITY_PREFERENCE: Readonly<Record<string, readonly string[]>> = {
  // Regionale Frühformen
  '1': ['stammesoberhaupt'],
  '2': ['herzog'],
  // Hochadelige Herrschaft
  '3': ['herzog', 'koenig'],
  '4': ['koenig'],
  // Königswürde und Kaisertum des Heiligen Römischen Reiches
  '5': ['kaiser', 'koenig'],
  '6': ['kaiser', 'deutscher_kaiser'],
  '7': ['kaiser', 'deutscher_kaiser'],
  // Spätere Ordnungsformen: bewusst KEINE Fortschreibung des Kaisertums.
  '8': ['bundespraesident', 'bundeskanzler', 'reichspraesident', 'reichskanzler']
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
 * Bei mehreren Kandidaten gewinnt das System, das die **meisten** Ämter
 * abdeckt (also die reichhaltigste belegte Ordnungsform); bei Gleichstand
 * entscheidet der deutsche Name. Das ist deterministisch und enthält keine
 * Wertung als „höhere Entwicklungsstufe".
 *
 * @param epochId Epochen-ID.
 * @returns Referenzsystem oder `null`.
 */
export function referenceSystemFor(epochId: string): PoliticalSystem | null {
  const candidates = POLITICAL_SYSTEMS.filter((system) => system.epochIds.includes(epochId));
  if (candidates.length === 0) return null;
  const coverage = (system: PoliticalSystem): number =>
    OFFICES.filter((office) => office.systemIds.includes(system.id)).length;
  return [...candidates].sort((a, b) => {
    const diff = coverage(b) - coverage(a);
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'de');
  })[0];
}

/**
 * Ermittelt die historische Würde für einen Spielrang und eine Epoche.
 *
 * Auflösung: Präferenzliste des Rangs → erstes Amt, das in der Epoche belegt
 * ist **und** einem für diese Epoche belegten System angehört. Andernfalls
 * `null` – es wird keine Würde erfunden.
 *
 * @param rank Spielrang des Herrschers (`Player.title.rank`).
 * @param epochId Epochen-ID.
 * @returns Amt oder `null`.
 */
export function dignityFor(rank: number, epochId: string): Office | null {
  const preference = RANK_DIGNITY_PREFERENCE[String(rank)];
  if (!preference) return null;
  for (const officeId of preference) {
    const office = PolityCatalog.getOffice(officeId);
    if (!office || !office.epochIds.includes(epochId)) continue;
    const validSystem = office.systemIds.some((systemId) => {
      const system = POLITICAL_SYSTEMS.find((candidate) => candidate.id === systemId);
      return system !== undefined && system.epochIds.includes(epochId);
    });
    if (validSystem) return office;
  }
  return null;
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
  const rulerDignity = dignityFor(rank, epoch.id);
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
