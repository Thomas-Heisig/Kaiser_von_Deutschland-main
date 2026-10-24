/**
 * Historical doctrines are gameplay abstractions, not exact weapon simulations.
 * The game retains three army slots for save compatibility but changes their
 * meaning, field strengths and fortification usefulness as time advances.
 */
export type FieldRole = 'infantry' | 'archers' | 'cavalry';
export interface EraDoctrine {
  since: number; label: string; context: string; conflict: string; raid: string;
  units: Record<FieldRole, string>;
  coefficients: Record<FieldRole, number>;
  fortificationFactor: number;
  rivalPowerFactor: number;
}
const DOCTRINES: readonly EraDoctrine[] = [
  { since: -1999, label: 'Frühe Siedlungen · vereinfachtes Spielmodell',
    context: 'Fußtruppen und Bogenschützen schützen Wege und Vorräte. Die drei Truppenslots sind eine Spielabstraktion, keine Rekonstruktion eines bronzezeitlichen Heeres.',
    conflict: 'Grenzkonflikt', raid: 'Überfall',
    units: { infantry: 'Fußtruppen', archers: 'Bogenschützen', cavalry: 'Begleitaufgebot' },
    coefficients: { infantry: 1, archers: 1.1, cavalry: 1.2 }, fortificationFactor: 1, rivalPowerFactor: 0.9 },
  { since: -799, label: 'Antike und frühe Reiche',
    context: 'Versorgung, Fußtruppen und befestigte Siedlungen bestimmen Feldzüge.',
    conflict: 'Grenzfeldzug', raid: 'Grenzüberfall',
    units: { infantry: 'Fußtruppen', archers: 'Fernkämpfer', cavalry: 'Reiterei' },
    coefficients: { infantry: 1, archers: 1.2, cavalry: 1.8 },
    fortificationFactor: 1, rivalPowerFactor: 1 },
  { since: 1100, label: 'Mittelalter',
    context: 'Lehnsaufgebote, Bogenwaffen und schwere Reiterei prägen den Kampf.',
    conflict: 'Feldzug', raid: 'Plünderzug',
    units: { infantry: 'Fußknechte', archers: 'Bogenschützen', cavalry: 'Ritter und Reiter' },
    coefficients: { infantry: 1, archers: 1.3, cavalry: 2.5 },
    fortificationFactor: 1, rivalPowerFactor: 1 },
  { since: 1500, label: 'Landsknechte und Feuerwaffen',
    context: 'Pikeniere und frühe Feuerwaffen verändern Angriff und Burgverteidigung.',
    conflict: 'Heereszug', raid: 'Grenzscharmützel',
    units: { infantry: 'Landsknechte', archers: 'Schützen', cavalry: 'Kürassiere' },
    coefficients: { infantry: 1.35, archers: 1.75, cavalry: 2 },
    fortificationFactor: 0.85, rivalPowerFactor: 1.15 },
  { since: 1750, label: 'Linientaktik',
    context: 'Drill, Musketen und organisierter Nachschub zählen mehr als einzelne Burgen.',
    conflict: 'Feldoperation', raid: 'Grenzgefecht',
    units: { infantry: 'Linieninfanterie', archers: 'Schützenkompanien', cavalry: 'Dragoner' },
    coefficients: { infantry: 1.7, archers: 1.9, cavalry: 1.9 },
    fortificationFactor: 0.65, rivalPowerFactor: 1.35 },
  { since: 1850, label: 'Industrialisierung',
    context: 'Eisenbahnen, moderne Infanterie und schwere Waffen verkürzen Aufmarschzeiten.',
    conflict: 'Militäroperation', raid: 'Grenzoperation',
    units: { infantry: 'Infanterie', archers: 'Gewehrschützen', cavalry: 'Aufklärungstruppen' },
    coefficients: { infantry: 2.0, archers: 2.2, cavalry: 1.35 },
    fortificationFactor: 0.45, rivalPowerFactor: 1.55 },
  { since: 1945, label: 'Motorisierte Kriegsführung',
    context: 'Bewegliche Verbände, Logistik und koordinierte Führung werden entscheidend.',
    conflict: 'Operation', raid: 'Grenzkonflikt',
    units: { infantry: 'Motorisierte Infanterie', archers: 'Unterstützungstruppen', cavalry: 'Mobile Verbände' },
    coefficients: { infantry: 2.3, archers: 2.7, cavalry: 2.5 },
    fortificationFactor: 0.3, rivalPowerFactor: 1.9 },
  { since: 1990, label: 'Vernetzte Streitkräfte',
    context: 'Aufklärung, sichere Kommunikation und Schutz der Infrastruktur beeinflussen die Lage.',
    conflict: 'Sicherheitsoperation', raid: 'Zwischenfall an der Grenze',
    units: { infantry: 'Einsatzkräfte', archers: 'Technische Unterstützung', cavalry: 'Mobile Einsatzverbände' },
    coefficients: { infantry: 2.8, archers: 3.4, cavalry: 3.2 },
    fortificationFactor: 0.2, rivalPowerFactor: 2.3 }
];
export function doctrineForYear(year: number): EraDoctrine {
  return [...DOCTRINES].reverse().find(entry => year >= entry.since) ?? DOCTRINES[0];
}
type RivalIdentity = { name: string; description: string };
const ENCOUNTERS: readonly { since: number; identities: Record<string, RivalIdentity> }[] = [
  { since: -1999, identities: {
    raubritter: { name: 'Grenzräuber am Wald', description: 'Lose bewaffnete Gruppen kontrollieren Wege und Übergänge.' },
    ostmark: { name: 'Ostgrenze', description: 'Ein benachbarter Machtbereich befestigt die Handelswege.' },
    nordland: { name: 'Nordland', description: 'Ein großer Nachbar erhebt Anspruch auf fruchtbare Gebiete.' }
  } },
  { since: 1100, identities: {
    raubritter: { name: 'Raubritter vom Schwarzwald', description: 'Gepanzerte Reiter bedrohen Handelswege und Dörfer.' },
    ostmark: { name: 'Grafschaft Ostmark', description: 'Ein Grenzgraf setzt auf befestigte Burgen.' },
    nordland: { name: 'Herzogtum Nordland', description: 'Ein mächtiger Herzog erstrebt regionale Vorherrschaft.' }
  } },
  { since: 1750, identities: {
    raubritter: { name: 'Freikorps an der Grenze', description: 'Unabhängige Truppen gefährden Handel und Transportwege.' },
    ostmark: { name: 'Grenzprovinz Ostmark', description: 'Ein Nachbar baut Garnisonen und Grenzstellungen aus.' },
    nordland: { name: 'Staat Nordland', description: 'Eine regionale Macht vergrößert ihren Einfluss.' }
  } },
  { since: 1945, identities: {
    raubritter: { name: 'Bewaffnete Grenzgruppe', description: 'Instabilität begünstigt organisierte Überfälle.' },
    ostmark: { name: 'Grenzrepublik Ostmark', description: 'Die Nachbarregierung verstärkt ihre Sicherheitskräfte.' },
    nordland: { name: 'Republik Nordland', description: 'Ein größerer Nachbar verteidigt seine Interessen.' }
  } },
  { since: 1990, identities: {
    raubritter: { name: 'Grenzmiliz', description: 'Eine bewaffnete Miliz destabilisiert die Grenzregion.' },
    ostmark: { name: 'Nachbarstaat Ostmark', description: 'Reguläre Grenzkräfte sichern kritische Infrastruktur.' },
    nordland: { name: 'Staatenbund Nordland', description: 'Ein einflussreicher Staatenbund verhandelt aus einer Position der Stärke.' }
  } }
];
export function rivalIdentity(id: string, year: number): RivalIdentity | null {
  return [...ENCOUNTERS].reverse().find(entry => year >= entry.since)?.identities[id] ?? null;
}
