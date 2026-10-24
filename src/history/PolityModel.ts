/**
 * Historisches Datenmodell: Epochen, Regionen, politische Systeme und Ämter.
 *
 * Dieses Modul ist **absichtlich vom Spielcode getrennt**. Es enthält keine
 * GameEngine-Anbindung, keine Simulation und keine Grafik. Zweck ist ein
 * deklaratives, prüfbares Fundament für eine künftige historisch geprägte
 * Aufstiegssimulation.
 *
 * Grundsätze:
 *  - Keine erfundenen Grenzen: Regionen sind geografisch-kulturelle Einheiten
 *    ohne Grenzpolygone.
 *  - Keine erfundenen Daten: Jede Jahresangabe trägt einen Evidenzgrad.
 *  - Keine Teleologie: Systeme und Ämter sind zeitgebunden, nicht „Stufen"
 *    einer vorgezeichneten Entwicklung.
 *  - Ämter hängen an **politischen Systemen**, nicht an Jahreszahlen allein.
 *
 * @version 0.1.0
 */

/**
 * Evidenzgrad einer historischen Jahresangabe.
 *
 * - `belegt`: In der Fachliteratur etablierte, klar datierbare Grenze.
 * - `naeherung`: Übliche, aber fachlich fließende oder umstrittene Grenze.
 * - `nicht_verifiziert`: Für dieses Modell bewusst offen gelassene Grenze.
 */
export type EvidenceLevel = 'belegt' | 'naeherung' | 'nicht_verifiziert';

/** Eine historische Epoche mit Jahresbereich und Evidenzgrad. */
export interface HistoricalEpoch {
  id: string;
  /** Anzeigename, z. B. „Hochmittelalter". */
  name: string;
  /** Frühestes Jahr der Epoche (inklusive). */
  yearStart: number;
  /** Spätestes Jahr der Epoche (inklusive). `null` = offenes Ende. */
  yearEnd: number | null;
  /** Evidenzgrad der Jahresgrenzen. */
  evidence: EvidenceLevel;
  /** Kurze, wertungsfreie Einordnung. */
  description: string;
  /** Quellenhinweis oder Begründung des Evidenzgrads. */
  sourceNote: string;
}

/**
 * Eine Region als geografisch-kulturelle Einheit.
 *
 * Bewusst **ohne** Grenzpolygone oder Koordinaten: Eine belastbare historische
 * Grenze lässt sich für die meisten Epochen nicht seriös als Polygon angeben.
 */
export interface HistoricalRegion {
  id: string;
  /** Anzeigename, z. B. „Rheinland". */
  name: string;
  /** Wertungsfreie Kurzbeschreibung der kulturellen/geografischen Einheit. */
  description: string;
  /**
   * Epochen-IDs, in denen diese Region als Bezugsgröße sinnvoll ist.
   * Leer = in allen Epochen nutzbar (geografische Landschaftsnamen).
   */
  epochIds: string[];
  /** Evidenzgrad der epochenbezogenen Zuordnung. */
  evidence: EvidenceLevel;
  sourceNote: string;
}

/** Kategorie politischer Ordnung (wertungsfrei, nicht hierarchisch). */
export type PolityKind = 'verband' | 'monarchie' | 'republik' | 'bund' | 'diktatur';

/**
 * Ein politisches System, zeitlich einer oder mehreren Epochen zugeordnet.
 *
 * `epochIds` ist die maßgebliche Bindung. Jahreszahlen sind nur beschreibend
 * und werden für die Validierung **nicht** herangezogen.
 */
export interface PoliticalSystem {
  id: string;
  name: string;
  kind: PolityKind;
  /** Epochen, in denen dieses System als Ordnungsform belegt ist. */
  epochIds: string[];
  /** Regionen, für die dieses System in dieser Form belegt ist. */
  regionIds: string[];
  description: string;
  evidence: EvidenceLevel;
  sourceNote: string;
}

/**
 * Ein Amt, gebunden an politische Systeme und Epochen.
 *
 * Ein Amt ist **nie** allein an ein Jahr gebunden: „Bundeskanzler" ist nur in
 * einem republikanischen System einer bestimmten Epoche sinnvoll.
 */
export interface Office {
  id: string;
  /** Amtsbezeichnung, z. B. „Herzog". */
  name: string;
  /** Systeme, in denen dieses Amt existiert. */
  systemIds: string[];
  /** Epochen, in denen dieses Amt existiert. */
  epochIds: string[];
  description: string;
  evidence: EvidenceLevel;
  sourceNote: string;
}

/** Ergebnis einer Validierung. */
export interface ValidationResult {
  valid: boolean;
  /** Menschenlesbare, deutsche Fehlermeldungen. Leer bei Erfolg. */
  errors: string[];
}

const ok = (): ValidationResult => ({ valid: true, errors: [] });
const fail = (...errors: string[]): ValidationResult => ({ valid: false, errors });

/** Baut einen Index nach ID für schnelle, typisierte Lookups. */
function indexById<T extends { id: string }>(items: readonly T[]): ReadonlyMap<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return map;
}

/** Rohdaten für die Initialisierung des Katalogs. */
export interface PolityData {
  epochs: readonly HistoricalEpoch[];
  regions: readonly HistoricalRegion[];
  systems: readonly PoliticalSystem[];
  offices: readonly Office[];
}

/**
 * Unveränderlicher Katalog aller historischen Modelldaten.
 *
 * Der Katalog wird einmalig von {@link initializePolityCatalog} befüllt und
 * danach nur gelesen.
 */
export class PolityCatalog {
  private static data: PolityData = { epochs: [], regions: [], systems: [], offices: [] };
  private static epochIndex: ReadonlyMap<string, HistoricalEpoch> = new Map();
  private static regionIndex: ReadonlyMap<string, HistoricalRegion> = new Map();
  private static systemIndex: ReadonlyMap<string, PoliticalSystem> = new Map();
  private static officeIndex: ReadonlyMap<string, Office> = new Map();

  /**
   * Initialisiert den Katalog. Prüft nur die Struktur, nicht die Semantik.
   * @param data Vollständige Modelldaten.
   * @throws Error bei doppelten oder fehlenden IDs.
   */
  public static initialize(data: PolityData): void {
    PolityCatalog.assertUniqueIds('Epoche', data.epochs);
    PolityCatalog.assertUniqueIds('Region', data.regions);
    PolityCatalog.assertUniqueIds('System', data.systems);
    PolityCatalog.assertUniqueIds('Amt', data.offices);

    PolityCatalog.data = {
      epochs: [...data.epochs],
      regions: [...data.regions],
      systems: [...data.systems],
      offices: [...data.offices]
    };
    PolityCatalog.epochIndex = indexById(PolityCatalog.data.epochs);
    PolityCatalog.regionIndex = indexById(PolityCatalog.data.regions);
    PolityCatalog.systemIndex = indexById(PolityCatalog.data.systems);
    PolityCatalog.officeIndex = indexById(PolityCatalog.data.offices);
  }

  private static assertUniqueIds(label: string, items: readonly { id: string }[]): void {
    const seen = new Set<string>();
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') throw new Error(`${label}: ID fehlt oder ist ungültig.`);
      if (seen.has(item.id)) throw new Error(`${label}: doppelte ID "${item.id}".`);
      seen.add(item.id);
    }
  }

  public static getEpochs(): readonly HistoricalEpoch[] { return PolityCatalog.data.epochs; }
  public static getRegions(): readonly HistoricalRegion[] { return PolityCatalog.data.regions; }
  public static getSystems(): readonly PoliticalSystem[] { return PolityCatalog.data.systems; }
  public static getOffices(): readonly Office[] { return PolityCatalog.data.offices; }

  public static getEpoch(id: string): HistoricalEpoch | undefined { return PolityCatalog.epochIndex.get(id); }
  public static getRegion(id: string): HistoricalRegion | undefined { return PolityCatalog.regionIndex.get(id); }
  public static getSystem(id: string): PoliticalSystem | undefined { return PolityCatalog.systemIndex.get(id); }
  public static getOffice(id: string): Office | undefined { return PolityCatalog.officeIndex.get(id); }
}

/**
 * Prüft, ob eine Epoche und ein politisches System zusammenpassen.
 *
 * @param epochId Epochen-ID.
 * @param systemId System-ID.
 * @returns Gültigkeitsergebnis mit deutscher Begründung.
 */
export function validateEpochSystem(epochId: string, systemId: string): ValidationResult {
  const epoch = PolityCatalog.getEpoch(epochId);
  const system = PolityCatalog.getSystem(systemId);
  if (!epoch) return fail(`Unbekannte Epoche: "${epochId}".`);
  if (!system) return fail(`Unbekanntes politisches System: "${systemId}".`);
  if (!system.epochIds.includes(epochId)) {
    return fail(`Das System "${system.name}" ist für die Epoche "${epoch.name}" nicht belegt.`);
  }
  return ok();
}

/**
 * Prüft, ob ein Amt in einem politischen System und einer Epoche zulässig ist.
 *
 * Beide Bindungen müssen erfüllt sein: „Bundeskanzler" in einer Monarchie ist
 * ebenso ungültig wie „Herzog" in der Epoche „Moderne".
 *
 * @param officeId Amts-ID.
 * @param systemId System-ID.
 * @param epochId Epochen-ID.
 * @returns Gültigkeitsergebnis mit deutscher Begründung.
 */
export function validateOffice(officeId: string, systemId: string, epochId: string): ValidationResult {
  const office = PolityCatalog.getOffice(officeId);
  const system = PolityCatalog.getSystem(systemId);
  const epoch = PolityCatalog.getEpoch(epochId);
  if (!office) return fail(`Unbekanntes Amt: "${officeId}".`);
  if (!system) return fail(`Unbekanntes politisches System: "${systemId}".`);
  if (!epoch) return fail(`Unbekannte Epoche: "${epochId}".`);

  const errors: string[] = [];
  const systemCheck = validateEpochSystem(epochId, systemId);
  if (!systemCheck.valid) errors.push(...systemCheck.errors);
  if (!office.systemIds.includes(systemId)) {
    errors.push(`Das Amt "${office.name}" existiert nicht im System "${system.name}".`);
  }
  if (!office.epochIds.includes(epochId)) {
    errors.push(`Das Amt "${office.name}" ist in der Epoche "${epoch.name}" nicht belegt.`);
  }
  return errors.length ? fail(...errors) : ok();
}

/**
 * Prüft, ob eine Region für eine Epoche als Bezugsgröße sinnvoll ist.
 *
 * Regionen mit leerem `epochIds` gelten als epochenunabhängig nutzbar.
 *
 * @param regionId Region-ID.
 * @param epochId Epochen-ID.
 * @returns Gültigkeitsergebnis mit deutscher Begründung.
 */
export function validateRegionEpoch(regionId: string, epochId: string): ValidationResult {
  const region = PolityCatalog.getRegion(regionId);
  const epoch = PolityCatalog.getEpoch(epochId);
  if (!region) return fail(`Unbekannte Region: "${regionId}".`);
  if (!epoch) return fail(`Unbekannte Epoche: "${epochId}".`);
  if (region.epochIds.length > 0 && !region.epochIds.includes(epochId)) {
    return fail(`Die Region "${region.name}" ist für die Epoche "${epoch.name}" nicht belegt.`);
  }
  return ok();
}

/**
 * Prüft eine vollständige Kombination aus Epoche, System, Amt und Region.
 *
 * @param input Zu prüfende Kombination.
 * @returns Sammelergebnis aller Einzelprüfungen.
 */
export function validateCombination(input: {
  epochId: string;
  systemId: string;
  officeId: string;
  regionId: string;
}): ValidationResult {
  const errors: string[] = [];
  const system = validateEpochSystem(input.epochId, input.systemId);
  if (!system.valid) errors.push(...system.errors);
  const office = validateOffice(input.officeId, input.systemId, input.epochId);
  if (!office.valid) errors.push(...office.errors);
  const region = validateRegionEpoch(input.regionId, input.epochId);
  if (!region.valid) errors.push(...region.errors);
  return errors.length ? fail(...errors) : ok();
}

/**
 * Ermittelt die Epoche für ein Jahr, sofern die Grenzen belastbar sind.
 *
 * Bei Epochen mit Evidenzgrad `nicht_verifiziert` wird bewusst **keine**
 * Zuordnung behauptet.
 *
 * @param year Jahr (negativ = vor Christus).
 * @returns Passende Epoche oder `null`, wenn keine sichere Zuordnung möglich ist.
 */
export function epochForHistoricalYear(year: number): HistoricalEpoch | null {
  if (!Number.isFinite(year)) return null;
  for (const epoch of PolityCatalog.getEpochs()) {
    const endMatch = epoch.yearEnd === null || year <= epoch.yearEnd;
    if (year >= epoch.yearStart && endMatch) {
      return epoch.evidence === 'nicht_verifiziert' ? null : epoch;
    }
  }
  return null;
}

/**
 * Liefert alle Ämter, die in einer Epoche und einem System zulässig sind.
 *
 * @param epochId Epochen-ID.
 * @param systemId System-ID.
 * @returns Alphabetisch sortierte Liste.
 */
export function officesFor(epochId: string, systemId: string): readonly Office[] {
  if (!PolityCatalog.getEpoch(epochId) || !PolityCatalog.getSystem(systemId)) return [];
  return PolityCatalog.getOffices()
    .filter((office) => office.epochIds.includes(epochId) && office.systemIds.includes(systemId))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
