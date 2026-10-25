/**
 * Gruppierte Startzeitpunkte für eine neue Herrschaft.
 *
 * Die Einträge sind **Spielstartpunkte**, keine historischen Epochengrenzen.
 * Die Gruppierung orientiert sich am belegten Epochenmodell (`src/history/`),
 * ist aber bewusst grober: Epochengrenzen variieren regional, daher wird keine
 * Gruppe als exakte historische Grenze ausgegeben.
 *
 * Alle bisherigen Startjahre bleiben erhalten und ladbar. Die Auswahl zeigt
 * wenige repräsentative Punkte je Abschnitt; die übrigen stehen unter
 * „Weitere Startjahre" innerhalb derselben Gruppe.
 */

/** Ein Abschnitt der Startauswahl. */
export interface StartEpoch {
  /** Stabile Kennung. */
  id: string;
  /** Anzeigename, z. B. „Mittelalter". */
  label: string;
  /** Kurze, verständliche Erklärung des Abschnitts. */
  summary: string;
  /** Hinweis zur Einordnung der Grenzen. */
  caveat: string;
  /** Repräsentative Startjahre (Kalenderjahre, negative = v. Chr.). */
  years: readonly StartYear[];
}

/** Ein möglicher Startzeitpunkt. */
export interface StartYear {
  /** Kalenderjahr wie in der Engine (0 = 1 v. Chr.). */
  year: number;
  /** Kurzer Name des Startpunkts. */
  name: string;
  /** Ein Satz zum Startpunkt. */
  note: string;
}

export const START_EPOCHS: readonly StartEpoch[] = [
  {
    id: 'vorzeit',
    label: 'Vorzeit',
    summary: 'Frühe Siedlung ohne Schriftquellen. Namen und Ereignisse sind ausdrücklich Spielmodelle.',
    caveat: 'Keine belastbare Jahresgrenze: Vorgeschichte wird archäologisch periodisiert, nicht über feste Daten.',
    years: [
      { year: -1999, name: 'Frühe Bronzezeit', note: 'Siedlungsbeginn in der Geest; keine schriftlichen Belege.' },
      { year: -1499, name: 'Mittlere Bronzezeit', note: 'Ausgedehnterer Ackerbau und Handel mit Metall.' },
      { year: -799, name: 'Ältere Eisenzeit', note: 'Erste überregionale Handelsbeziehungen.' }
    ]
  },
  {
    id: 'antike',
    label: 'Antike',
    summary: 'Germanische Verbände an der römischen Grenze. Römische Quellen berichten von außen.',
    caveat: 'Die Grenze zur Vorzeit ist eine Forschungskonvention; römische Quellen nennen nur wenige Namen.',
    years: [
      { year: -57, name: 'Caesar in Gallien', note: 'Römische Vorstöße bis an den Rhein.' },
      { year: 9, name: 'Varusschlacht', note: 'Der Aufstand unter Arminius beendet die römische Expansion.' },
      { year: 98, name: 'Germania des Tacitus', note: 'Römische Beschreibung germanischer Verbände.' },
      { year: 260, name: 'Limesverfall', note: 'Der Obergermanisch-Raetische Limes wird aufgegeben.' }
    ]
  },
  {
    id: 'mittelalter',
    label: 'Mittelalter',
    summary: 'Vom ostfränkischen Reich bis zur Schwelle der Neuzeit. Urkunden werden zur Hauptquelle.',
    caveat: 'Der Beginn 843 ist durch den Vertrag von Verdun belegt; das Ende um 1500 ist eine Konvention.',
    years: [
      { year: 843, name: 'Vertrag von Verdun', note: 'Teilung des Frankenreichs; Beginn des Ostfrankenreichs.' },
      { year: 962, name: 'Kaiserkrönung Ottos I.', note: 'Beginn des römisch-deutschen Kaisertums.' },
      { year: 1200, name: 'Hochmittelalter', note: 'Städte, Handel und Reichsbildung. Klassischer Startpunkt.' },
      { year: 1350, name: 'Spätmittelalter', note: 'Pest, Städtebünde und wirtschaftlicher Umbruch.' }
    ]
  },
  {
    id: 'fruehe_neuzeit',
    label: 'Frühe Neuzeit',
    summary: 'Reichsreform, Konfessionskonflikte und Aufklärung bis zum Ende des Alten Reiches.',
    caveat: 'Der Beginn um 1500 ist Konvention; das Ende 1806 ist durch die Reichsauflösung belegt.',
    years: [
      { year: 1500, name: 'Reichsreform', note: 'Reichskreise und Reichskammergericht ordnen das Reich.' },
      { year: 1618, name: 'Dreißigjähriger Krieg', note: 'Konfessionskonflikt mit schweren Verwüstungen.' },
      { year: 1750, name: 'Aufklärung', note: 'Verwaltung, Wissenschaft und Wirtschaft im Umbruch.' }
    ]
  },
  {
    id: 'moderne',
    label: 'Moderne',
    summary: 'Industrialisierung, Nationalstaat, Nachkriegszeit und Digitalisierung.',
    caveat: 'Die politischen Ordnungen dieser Zeit sind durch Verfassungsdaten belegt.',
    years: [
      { year: 1820, name: 'Industriezeitalter', note: 'Eisenbahnen, Fabriken und neue Städte.' },
      { year: 1890, name: 'Späte Industrialisierung', note: 'Sozialgesetzgebung und Weltwirtschaft.' },
      { year: 1945, name: 'Nachkriegszeit', note: 'Wiederaufbau von Infrastruktur und Versorgung.' },
      { year: 1970, name: 'Moderne', note: 'Wohlstand, Umweltfragen und Strukturwandel.' },
      { year: 2000, name: 'Digitalzeitalter', note: 'Vernetzung, Dienstleistung und neue Technik.' }
    ]
  }
] as const;

/**
 * Weitere Startjahre, die früher gleichrangig angeboten wurden.
 *
 * Sie bleiben vollständig erhalten und ladbar, stehen aber nicht in der
 * Hauptauswahl, damit diese übersichtlich bleibt. Kein Eintrag wurde gelöscht.
 */
export const ADDITIONAL_START_YEARS: readonly StartYear[] = [
  // Antike – weitere überlieferte Daten
  { year: -1199, name: 'Späte Bronzezeit', note: 'Übergang zur Eisenzeit; erste befestigte Höfe.' },
  { year: -752, name: 'Gründung Roms', note: 'Tradierte Datierung; historisch nicht gesichert.' },
  { year: -489, name: 'Frühe Republik', note: 'Beginn der römischen Republik (tradierte Datierung).' },
  { year: -479, name: 'Perserkriege', note: 'Gleichzeitige Konflikte im Mittelmeerraum.' },
  { year: -446, name: 'Frühe Konflikte', note: 'Römische Auseinandersetzungen in Italien.' },
  { year: -430, name: 'Attische Blüte', note: 'Kulturelle Blütezeit Athens.' },
  { year: -370, name: 'Aufstieg Makedoniens', note: 'Makedonien gewinnt an Einfluss.' },
  { year: -337, name: 'Makedonische Hegemonie', note: 'Korinthischer Bund unter Philipp II.' },
  { year: -335, name: 'Alexanderzug', note: 'Beginn der Feldzüge Alexanders.' },
  { year: -332, name: 'Diadochenzeit', note: 'Nachfolgekämpfe nach Alexanders Tod.' },
  { year: -330, name: 'Hellenismus', note: 'Ausbreitung hellenistischer Herrschaft.' },
  { year: -322, name: 'Früher Hellenismus', note: 'Konsolidierung der Nachfolgereiche.' },
  { year: -215, name: 'Zweiter Punischer Krieg', note: 'Hannibal in Italien.' },
  { year: -201, name: 'Römische Expansion', note: 'Rom wird Vormacht im westlichen Mittelmeer.' },
  { year: -43, name: 'Römische Bürgerkriege', note: 'Ende der Republik zeichnet sich ab.' },
  { year: -30, name: 'Beginn des Principats', note: 'Augustus übernimmt die Alleinherrschaft.' },
  { year: -26, name: 'Augusteische Zeit', note: 'Konsolidierung des Imperiums.' },
  { year: -14, name: 'Frühe Kaiserzeit', note: 'Sicherung der Grenzen.' },
  { year: 0, name: 'Zeitenwende', note: 'Übergang von v. Chr. zu n. Chr.' },
  { year: 1, name: 'Frühe Kaiserzeit', note: 'Kein Jahr null im Kalender.' },
  { year: 14, name: 'Tiberius', note: 'Beginn der Herrschaft des Tiberius.' },
  { year: 60, name: 'Mittlere Kaiserzeit', note: 'Gefestigte römische Grenzen.' },
  { year: 66, name: 'Aufstände', note: 'Unruhen in den Randgebieten.' },
  { year: 70, name: 'Nach dem Aufstand', note: 'Neuordnung der Provinzen.' },
  // Mittelalter – weitere Startpunkte
  { year: 500, name: 'Frühmittelalter', note: 'Frühe Reichsbildung nach der Völkerwanderung.' },
  { year: 800, name: 'Kaiserkrönung Karls', note: 'Karolingische Herrschaft über das Frankenreich.' },
  { year: 1000, name: 'Jahrtausendwende', note: 'Aufschwung von Handel und Siedlung.' },
  { year: 1300, name: 'Spätmittelalter', note: 'Städtebünde und Territorialisierung.' },
  { year: 1400, name: 'Frühe Renaissance', note: 'Handel, Städte und neue Bildung.' },
  // Frühe Neuzeit – weitere Startpunkte
  { year: 1600, name: 'Vor dem großen Krieg', note: 'Konfessionelle Spannungen wachsen.' }
] as const;

/** Alle bekannten Startjahre in zeitlicher Reihenfolge. */
export function allStartYears(): readonly StartYear[] {
  return [...START_EPOCHS.flatMap(epoch => epoch.years), ...ADDITIONAL_START_YEARS]
    .sort((a, b) => a.year - b.year);
}

/** Ist ein Jahr als Startzeitpunkt vorgesehen? */
export function isKnownStartYear(year: number): boolean {
  return allStartYears().some(entry => entry.year === year);
}

/** Abschnitt, der ein Startjahr enthält (für Anzeige und Migration). */
export function epochForStartYear(year: number): StartEpoch | undefined {
  return START_EPOCHS.find(epoch => epoch.years.some(entry => entry.year === year));
}
