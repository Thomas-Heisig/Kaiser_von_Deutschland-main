import type { Citizen } from './CitizenSystem';

export type CourtOffice = 'wirtschaft' | 'forschung' | 'verteidigung';
export type AssistantMode = 'beratung' | 'automatisch';
export interface CourtAppointment {
  playerId: string;
  office: CourtOffice;
  citizenId: string;
  mode: AssistantMode;
  monthsServed: number;
}
export const COURT_OFFICES: Record<CourtOffice, { name: string; skill: keyof Citizen['skills']; description: string }> = {
  wirtschaft: { name: 'Kämmerer', skill: 'trading', description: 'Überwacht Nahrung und Reichskasse; kann begrenzt Vorräte kaufen.' },
  forschung: { name: 'Hofgelehrte', skill: 'literacy', description: 'Berät über Forschung; kann günstige verfügbare Projekte beginnen.' },
  verteidigung: { name: 'Marschall', skill: 'leadership', description: 'Meldet Risiken und bildet Führungsfähigkeit aus; Kriegsentscheidungen bleiben manuell.' }
};
export const COURT_OFFICE_IDS = Object.keys(COURT_OFFICES) as CourtOffice[];
const isOffice = (s: unknown): s is CourtOffice =>
  typeof s === 'string' && Object.prototype.hasOwnProperty.call(COURT_OFFICES, s);
const isMode = (s: unknown): s is AssistantMode => s === 'beratung' || s === 'automatisch';

/** Optional court administration, always scoped to the owning player. */
export class CourtAssistantRegistry {
  private assignments: CourtAppointment[] = [];

  public list(playerId: string): CourtAppointment[] {
    return this.assignments.filter((a) => a.playerId === playerId).map((a) => ({ ...a }));
  }

  public appoint(playerId: string, office: CourtOffice, citizenId: string): void {
    if (!isOffice(office)) throw new Error('Unbekanntes Hofamt.');
    if (this.assignments.some((a) => a.citizenId === citizenId)) throw new Error('Dieser Bürger hat bereits ein Hofamt.');
    if (this.assignments.some((a) => a.playerId === playerId && a.office === office))
      throw new Error('Dieses Hofamt ist bereits besetzt.');
    this.assignments.push({ playerId, office, citizenId, mode: 'beratung', monthsServed: 0 });
  }

  public setMode(playerId: string, office: CourtOffice, mode: AssistantMode): void {
    if (!isMode(mode)) throw new Error('Ungültiger Automatikmodus.');
    const appointment = this.assignments.find((a) => a.playerId === playerId && a.office === office);
    if (!appointment) throw new Error('Dieses Hofamt ist unbesetzt.');
    appointment.mode = mode;
  }

  public dismiss(playerId: string, office: CourtOffice): boolean {
    const original = this.assignments.length;
    this.assignments = this.assignments.filter((a) => a.playerId !== playerId || a.office !== office);
    return original !== this.assignments.length;
  }

  public removePlayer(playerId: string): void {
    this.assignments = this.assignments.filter((a) => a.playerId !== playerId);
  }

  public advance(playerId: string, office: CourtOffice): void {
    const appointment = this.assignments.find((a) => a.playerId === playerId && a.office === office);
    if (appointment) appointment.monthsServed++;
  }

  public serialize(): CourtAppointment[] { return this.assignments.map((a) => ({ ...a })); }

  public restore(data: unknown, players: Set<string>, resolve: (id: string) => Citizen | undefined): void {
    if (!Array.isArray(data) || data.length > players.size * COURT_OFFICE_IDS.length)
      throw new Error('Beschädigte Hofverwaltung im Spielstand.');
    const seenCitizens = new Set<string>();
    const seenOffices = new Set<string>();
    const next: CourtAppointment[] = [];
    for (const raw of data) {
      if (!raw || typeof raw !== 'object') throw new Error('Beschädigte Hofverwaltung im Spielstand.');
      const a = raw as CourtAppointment;
      const citizen = typeof a.citizenId === 'string' ? resolve(a.citizenId) : undefined;
      if (!players.has(a.playerId) || !isOffice(a.office) || !isMode(a.mode) ||
        !Number.isSafeInteger(a.monthsServed) || a.monthsServed < 0 || !citizen ||
        !citizen.isAlive || citizen.isPlayerCharacter ||
        seenCitizens.has(a.citizenId) || seenOffices.has(a.playerId + ':' + a.office))
        throw new Error('Beschädigte Hofverwaltung im Spielstand.');
      seenCitizens.add(a.citizenId);
      seenOffices.add(a.playerId + ':' + a.office);
      next.push({ playerId: a.playerId, office: a.office, citizenId: a.citizenId,
        mode: a.mode, monthsServed: a.monthsServed });
    }
    this.assignments = next;
  }
}
