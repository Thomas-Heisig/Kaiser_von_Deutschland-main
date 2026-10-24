/** Astronomical years internally keep durations continuous: 0 = 1 BCE, -1999 = 2000 BCE.
 * Civil display has no year zero. Positive years and existing saves stay unchanged.
 * This is a simulation calendar, not a conversion of ancient local calendars.
 */
export function bce(year: number): number { return 1 - year; }
export function formatYear(year: number): string {
  return year <= 0 ? `${1 - year} v. Chr.` : year < 1000 ? `${year} n. Chr.` : String(year);
}
export function formatYearRange(from: number, to: number): string {
  return `${formatYear(from)} – ${formatYear(to)}`;
}
