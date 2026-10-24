/** German-speaking, period-inspired given names for the game's alternate-history kingdoms.
 *  Names are atmosphere, not an assertion about an individual region's naming statistics.
 */
export type ChildGender = 'female' | 'male' | 'other';
type Names = { female: readonly string[]; male: readonly string[] };
const PERIOD_NAMES: ReadonlyArray<{ since: number; names: Names }> = [
  { since: -10000, names: {
    female: ['Adelheid','Mathilde','Hildegard','Gertrud','Kunigunde','Elisabeth','Mechthild','Bertha'],
    male: ['Heinrich','Konrad','Friedrich','Otto','Ludwig','Ulrich','Albrecht','Hermann']
  } },
  { since: 1500, names: {
    female: ['Anna','Katharina','Margarethe','Barbara','Elisabeth','Dorothea','Maria','Ursula'],
    male: ['Johann','Georg','Martin','Jakob','Philipp','Matthias','Heinrich','Friedrich']
  } },
  { since: 1800, names: {
    female: ['Luise','Marie','Sophie','Emilie','Auguste','Johanna','Clara','Elise'],
    male: ['Wilhelm','Karl','Otto','Eduard','Friedrich','Ernst','Theodor','Gustav']
  } },
  { since: 1945, names: {
    female: ['Helga','Ingrid','Gisela','Renate','Brigitte','Monika','Sabine','Petra'],
    male: ['Peter','Hans','Klaus','Wolfgang','Jürgen','Dieter','Michael','Thomas']
  } },
  { since: 1990, names: {
    female: ['Lena','Mia','Emma','Sophie','Hannah','Lea','Sarah','Lina'],
    male: ['Leon','Paul','Max','Ben','Lukas','Felix','Finn','Jonas']
  } }
];

/** Clamp the random selector to preserve valid names in deterministic test runs. */
export function nameForBirth(year: number, gender: ChildGender, random: () => number = Math.random): string {
  // Early Central European personal names are not reconstructable from this dataset.
  // Keep an explicit fictional identifier instead of projecting medieval names backwards.
  if (year < 500) return 'Kind ' + (1 + Math.floor(Math.max(0, Math.min(.999999, random() || 0)) * 9999));
  const historic = [...PERIOD_NAMES].reverse().find(group => year >= group.since) ?? PERIOD_NAMES[0];
  const options = gender === 'female' ? historic.names.female : historic.names.male;
  const roll = random();
  const normalized = Number.isFinite(roll) ? Math.max(0, Math.min(0.999999, roll)) : 0;
  return options[Math.floor(normalized * options.length)];
}
