/**
 * Gemeinsamer Namensgenerator auf Basis der zentralen Namensbibliothek.
 *
 * Alle Entstehungswege (Geburt, Startbevölkerung, Nachfolge) nutzen dieselben
 * Funktionen. Der Name wird **einmal** aus dem Geburtsjahr bestimmt und danach
 * nie mehr geändert: Ein Epochenwechsel benennt keine bestehende Person um.
 *
 * Beziehungen hängen ausschließlich an der Bürger-ID, niemals am Namen.
 */

import { nameSetForYear, type NameSet } from './NameCatalog';

export type ChildGender = 'female' | 'male' | 'other';

/** Sichere Auswahl aus einer Liste, auch bei unerwarteten Zufallswerten. */
function pick(list: readonly string[], random: () => number): string {
  const roll = random();
  const normalized = Number.isFinite(roll) ? Math.max(0, Math.min(0.999999, roll)) : 0;
  return list[Math.floor(normalized * list.length)];
}

/**
 * Wählt einen Vornamen für ein Geburtsjahr.
 * @param year Geburtsjahr der Person; maßgeblich ist die Zeit der Geburt.
 * @param gender Geschlecht der Person.
 * @param random Zufallsquelle; Standard `Math.random`, in Tests ersetzbar.
 * @returns Ein Vorname aus dem für dieses Jahr gültigen Bestand.
 */
export function nameForBirth(year: number, gender: ChildGender, random: () => number = Math.random): string {
  const set = nameSetForYear(year);
  // `other` nutzt dieselben Bestände, statt eine dritte Liste zu erfinden.
  const options = gender === 'female' ? set.female : set.male;
  return pick(options, random);
}

/**
 * Erzeugt Vor- und Nachnamen für einen Bürger.
 *
 * Vor dem Aufkommen erblicher Familiennamen wird ein Beiname verwendet oder gar
 * kein Nachname, damit keine modernen Geschlechternamen in frühe Zeiten
 * zurückprojiziert werden.
 *
 * @param birthYear Geburtsjahr der Person.
 * @param gender Geschlecht der Person.
 * @param random Zufallsquelle; Standard `Math.random`, in Tests ersetzbar.
 * @returns Vorname und Nachname; der Nachname kann leer sein.
 */
export function citizenName(
  birthYear: number,
  gender: ChildGender,
  random: () => number = Math.random
): { firstName: string; lastName: string } {
  const set = nameSetForYear(birthYear);
  const firstName = nameForBirth(birthYear, gender, random);
  if (!set.familyNames || set.familyNames.length === 0) return { firstName, lastName: '' };
  return { firstName, lastName: pick(set.familyNames, random) };
}

/** Bestand, der für ein Geburtsjahr gilt – für Anzeige und Diagnose. */
export function nameSetFor(birthYear: number): NameSet {
  return nameSetForYear(birthYear);
}
