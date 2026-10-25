/**
 * Garnison, Befestigungen und nachvollziehbare Verteidigung.
 *
 * Bisher wirkte Befestigung als pauschaler globaler Multiplikator
 * (`walls * 0.15 + castles * 0.25`). Dieses Modell ersetzt ihn durch eine
 * aufgegliederte Berechnung, damit Spieler, Gegner und Vasallen nach denselben
 * Regeln abrechnen und die Anzeige der Kampfauflösung entspricht.
 *
 * Grundsätze:
 *  - Eine Burg schützt ihren **eigenen** Standort, nicht jede Siedlung gleich.
 *  - Kapazität erzeugt keine Soldaten; nur zugewiesene Kräfte verteidigen.
 *  - Zusätzliche Befestigungen haben abnehmenden Nutzen (Begründung: begrenzte
 *    Besatzung und begrenzte Frontlänge).
 *  - Versorgung und Schäden wirken als Abzüge, nicht als pauschale Prozente
 *    auf den Vorrat.
 *  - Alle Mengen sind abstrakte Versorgungseinheiten des Spielmodells, keine
 *    historischen oder metrischen Angaben.
 */

import type { Kingdom } from './Kingdom';

/** Ein befestigter Standort mit eigener Wirkung. */
export interface FortificationSite {
  /** Gebäudetyp, der den Standort trägt. */
  kind: 'walls' | 'castles' | 'barracks';
  /** Vorhandene Bauwerke dieses Typs. */
  count: number;
  /** Bezeichnung für die Anzeige. */
  label: string;
  /** Aufgabe im Spielmodell. */
  role: string;
  /** Wirksamer Beitrag zur Verteidigung nach Besetzung und Grenznutzen. */
  contribution: number;
}

/** Aufschlüsselung der Verteidigung. */
export interface DefenseBreakdown {
  /** Eingesetzte Truppen nach Ausrüstung und Ausbildung. */
  troops: number;
  /** Beitrag aller Befestigungen. */
  fortification: number;
  /** Abzug durch mangelnde Versorgung (0–1). */
  supplyPenalty: number;
  /** Abzug durch Schäden oder unbesetzte Anlagen (0–1). */
  wearPenalty: number;
  /** Ergebnis. */
  total: number;
  /** Einzelne Standorte für die Anzeige. */
  sites: FortificationSite[];
  /** Erklärbare Hinweise. */
  notes: string[];
}

/**
 * Anteil der gedeckten Nahrungsversorgung (0–1).
 *
 * Einzige Definition für Anzeige und Kampfauflösung, damit beide dieselbe
 * Eingabe verwenden. Abgeleitet aus Bestand plus laufender Erzeugung gegen den
 * Monatsbedarf — nicht aus dem Vorrat allein.
 *
 * @param kingdom Reich.
 * @returns Anteil der gedeckten Versorgung.
 */
export function supplyRatio(kingdom: Kingdom): number {
  const balance = kingdom.getMonthlyBalance();
  const need = balance.consumption.food;
  if (need <= 0) return 1;
  return Math.max(0, Math.min(1, (kingdom.resources.food + balance.production.food) / need));
}

/** Soldaten im Feld (alle Truppenteile). */
export function garrisonSoldiers(kingdom: Kingdom): number {
  return kingdom.military.infantry + kingdom.military.archers + kingdom.military.cavalry;
}

/**
 * Kapazität: wie viele Soldaten Kasernen und Burgen aufnehmen können.
 * Kapazität ist eine **Obergrenze**, keine Besatzung.
 */
export function garrisonCapacity(kingdom: Kingdom): number {
  return kingdom.infrastructure.barracks * 60 + kingdom.infrastructure.castles * 40 + 40;
}

/** Anteil der Kapazität, der tatsächlich besetzt ist (0–1). */
export function manningRatio(kingdom: Kingdom): number {
  const capacity = garrisonCapacity(kingdom);
  if (capacity <= 0) return 0;
  return Math.max(0, Math.min(1, garrisonSoldiers(kingdom) / capacity));
}

/**
 * Beitrag einer Befestigungsart mit abnehmendem Nutzen.
 *
 * Begründung des Grenznutzens: Jede weitere Anlage bewacht zusätzliches
 * Gelände, kann aber nur mit der vorhandenen Besatzung wirken. Der Nutzen
 * wächst daher unterlinear.
 */
function diminishing(count: number, perUnit: number, cap: number): number {
  if (count <= 0) return 0;
  // Saturating curve: strong first site, clearly smaller additions later.
  return cap * (1 - Math.exp(-count * perUnit / cap));
}

/**
 * Berechnet die Verteidigung mit Aufschlüsselung.
 *
 * Verwendet dieselbe Grundlage wie die Kampfauflösung, damit Vorschau und
 * Ergebnis übereinstimmen.
 *
 * @param kingdom Verteidigendes Reich.
 * @param troopPower Truppenstärke aus `armyPower` (Ausrüstung/Ausbildung).
 * @param supplyRatio Anteil der gedeckten Versorgung (0–1).
 * @param damage Schadensanteil an den Anlagen (0–1).
 * @returns Aufschlüsselung und Gesamtwert.
 */
export function defenseBreakdown(
  kingdom: Kingdom, troopPower: number, supplyRatio = 1, damage = 0
): DefenseBreakdown {
  const notes: string[] = [];
  const manning = manningRatio(kingdom);
  const capacity = garrisonCapacity(kingdom);
  const soldiers = garrisonSoldiers(kingdom);

  const walls = diminishing(kingdom.infrastructure.walls, 0.05, 0.30);
  const castles = diminishing(kingdom.infrastructure.castles, 0.09, 0.35);
  const barracks = diminishing(kingdom.infrastructure.barracks, 0.04, 0.15);

  // Unmanned or damaged works contribute far less than a fully held one.
  const sites: FortificationSite[] = [
    { kind: 'walls', count: kingdom.infrastructure.walls, label: 'Stadtmauern',
      role: 'Schützen den zugehörigen Ort gegen Angriffe und Überfälle.',
      contribution: walls * manning },
    { kind: 'castles', count: kingdom.infrastructure.castles, label: 'Burgen',
      role: 'Befestigte Stützpunkte; schützen zugewiesene Kräfte und Vorräte.',
      contribution: castles * (0.5 + 0.5 * manning) },
    { kind: 'barracks', count: kingdom.infrastructure.barracks, label: 'Wachlager',
      role: 'Örtliche Sicherung, Bereitschaft und Aufklärung.',
      contribution: barracks }
  ] satisfies FortificationSite[];
  const active = sites.filter(site => site.count > 0);

  const fortification = active.reduce((sum, site) => sum + site.contribution, 0);
  const supplyPenalty = Math.max(0, Math.min(0.5, (1 - Math.max(0, Math.min(1, supplyRatio))) * 0.5));
  const wearPenalty = Math.max(0, Math.min(0.4, Math.max(0, Math.min(1, damage)) * 0.4));

  if (soldiers === 0) notes.push('Keine Soldaten zugewiesen: Befestigungen wirken nur stark eingeschränkt.');
  else if (manning < 0.5) notes.push(`Garnison nur zu ${Math.round(manning * 100)} % besetzt (${soldiers} von ${capacity} Plätzen).`);
  if (supplyPenalty > 0) notes.push(`Versorgung unvollständig: Abzug ${Math.round(supplyPenalty * 100)} %.`);
  if (wearPenalty > 0) notes.push(`Anlagen beschädigt: Abzug ${Math.round(wearPenalty * 100)} %.`);
  if (!active.length) notes.push('Keine Befestigungen vorhanden.');

  const multiplier = 1 + fortification;
  const total = Math.round(troopPower * multiplier * (1 - supplyPenalty) * (1 - wearPenalty));
  return { troops: Math.round(troopPower), fortification, supplyPenalty, wearPenalty, total, sites: active, notes };
}

/**
 * Nahrungsbedarf der Garnison in Versorgungseinheiten.
 *
 * Soldaten sind **zusätzlich** zur Zivilbevölkerung zu versorgen und werden
 * nicht doppelt gezählt: `population.soldiers` bleibt die zivile Zuordnung,
 * `military` die kämpfende Truppe.
 *
 * @param kingdom Reich.
 * @returns Bedarf in Versorgungseinheiten pro Monat.
 */
export function garrisonFoodNeed(kingdom: Kingdom): number {
  const soldiers = garrisonSoldiers(kingdom);
  return Math.ceil(soldiers * 0.5);
}

/** Goldunterhalt der Garnison pro Monat. */
export function garrisonGoldUpkeep(kingdom: Kingdom): number {
  const soldiers = garrisonSoldiers(kingdom);
  return Math.ceil(soldiers * 0.5)
    + kingdom.infrastructure.barracks * 4
    + kingdom.infrastructure.castles * 8
    + kingdom.infrastructure.walls * 2;
}
