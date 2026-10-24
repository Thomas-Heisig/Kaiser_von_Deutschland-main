/**
 * Deklarative Modelldaten für Epochen, Regionen, politische Systeme und Ämter.
 *
 * **Quellenlage:** Jahresgrenzen wurden gegen öffentlich zugängliche
 * Fach-/Institutionsquellen geprüft (siehe `sourceNote`). Wo keine belastbare
 * Grenze existiert, ist der Evidenzgrad `naeherung` oder
 * `nicht_verifiziert` gesetzt – es werden **keine** Grenzen erfunden.
 *
 * **Keine Grenzpolygone:** Regionen sind geografisch-kulturelle Bezugsgrößen
 * ohne Koordinaten oder Grenzverläufe.
 *
 * **Keine Teleologie:** Die Epochenliste bildet belegte Ordnungsformen ab, sie
 * beschreibt keine Zwangsläufigkeit und keine Wertung.
 *
 * @version 0.1.0
 */

import {
  HistoricalEpoch,
  HistoricalRegion,
  Office,
  PolityCatalog,
  PoliticalSystem
} from './PolityModel';

/**
 * Epochen als belegte Zeiträume politischer Ordnung.
 *
 * Geprüfte Eckdaten (Webrecherche, 24.10.2026):
 *  - 843 Vertrag von Verdun (Ostfrankenreich entsteht)
 *  - 911 Ende der ostfränkischen Karolinger
 *  - 962 Kaiserkrönung Ottos I. (Beginn des Heiligen Römischen Reiches)
 *  - 1806 Ende des Heiligen Römischen Reiches
 *  - 1815 Wiener Kongress (Deutscher Bund), 1866 Ende des Deutschen Bundes
 *  - 1871 Kaiserproklamation, 1918 Ende des Kaiserreichs
 *  - 1919 Weimarer Verfassung, 1933 Ende der Weimarer Republik
 *  - 1945 Ende der NS-Diktatur, 1949 Grundgesetz (23.05.) bzw. DDR-Gründung
 *  - 1990 Wiedervereinigung (03.10.)
 */
export const EPOCHS: readonly HistoricalEpoch[] = [
  {
    id: 'fruehzeit',
    name: 'Frühzeit (Vorgeschichte)',
    yearStart: -800,
    yearEnd: 842,
    evidence: 'nicht_verifiziert',
    description:
      'Sammelbezeichnung für die Zeit vor der schriftlich belegten Reichsbildung. ' +
      'Es gibt keine belastbare Grenze; der Bereich dient nur der Orientierung.',
    sourceNote:
      'Keine belastbare Jahresgrenze: Vorgeschichte wird in der Forschung über ' +
      'Periodisierungssysteme der Archäologie, nicht über feste Jahreszahlen bestimmt.'
  },
  {
    id: 'fruehmittelalter',
    name: 'Frühmittelalter (Ostfrankenreich)',
    yearStart: 843,
    yearEnd: 911,
    evidence: 'belegt',
    description:
      'Zeitraum zwischen der Teilung des Fränkischen Reiches und dem Ende der ' +
      'ostfränkischen Karolinger.',
    sourceNote:
      'Grenzen belegt: Vertrag von Verdun 843, Ende der ostfränkischen Karolinger 911. ' +
      'Die Bezeichnung „Frühmittelalter" selbst ist eine Forschungskonvention.'
  },
  {
    id: 'hochmittelalter',
    name: 'Hochmittelalter (Reichsbildung)',
    yearStart: 912,
    yearEnd: 1250,
    evidence: 'naeherung',
    description:
      'Ausbildung der Stammesherzogtümer und Eingliederung in das entstehende Reich; ' +
      'Kaiserkrönung Ottos I. 962.',
    sourceNote:
      'Start 912/919 (Königserhebung) ist belegt; das Ende 1250 ist eine übliche, ' +
      'aber fachlich fließende Konvention (Ende der Stauferzeit).'
  },
  {
    id: 'spaetmittelalter',
    name: 'Spätmittelalter',
    yearStart: 1251,
    yearEnd: 1499,
    evidence: 'naeherung',
    description:
      'Krisen und Umbruch (u. a. Pest), Aufstieg der Städte und städtischer Bünde.',
    sourceNote:
      'Epochengrenzen sind Forschungskonvention; kein allgemein verbindliches Datum.'
  },
  {
    id: 'fruehe_neuzeit',
    name: 'Frühe Neuzeit (Reich bis 1806)',
    yearStart: 1500,
    yearEnd: 1806,
    evidence: 'naeherung',
    description:
      'Reichsreform, Konfessionskonflikte und Fortbestand des Reiches bis zu seiner Auflösung.',
    sourceNote:
      'Ende 1806 belegt (Ende des Heiligen Römischen Reiches); Start um 1500 ist Konvention.'
  },
  {
    id: 'deutscher_bund',
    name: 'Deutscher Bund',
    yearStart: 1815,
    yearEnd: 1866,
    evidence: 'belegt',
    description: 'Staatenbund der deutschen Einzelstaaten nach dem Wiener Kongress.',
    sourceNote: 'Grenzen belegt: Wiener Kongress 1815, Auflösung 1866.'
  },
  {
    id: 'kaiserreich',
    name: 'Deutsches Kaiserreich',
    yearStart: 1871,
    yearEnd: 1918,
    evidence: 'belegt',
    description: 'Konstitutionell-monarchischer Nationalstaat in den Grenzen von 1871.',
    sourceNote: 'Grenzen belegt: Kaiserproklamation 18.01.1871, Ende 1918.'
  },
  {
    id: 'weimarer_republik',
    name: 'Weimarer Republik',
    yearStart: 1919,
    yearEnd: 1933,
    evidence: 'belegt',
    description: 'Parlamentarisch geprägte Republik mit krisenhafter Endphase.',
    sourceNote:
      'Verfassung vom 11.08.1919; Ende 1933 (Etablierung der NS-Diktatur). ' +
      'Die Ausrufung der Republik am 09.11.1918 liegt davor.'
  },
  {
    id: 'nationalsozialismus',
    name: 'Nationalsozialistische Diktatur',
    yearStart: 1933,
    yearEnd: 1945,
    evidence: 'belegt',
    description:
      'Gewaltherrschaft mit systematischer Verfolgung und Massenverbrechen. ' +
      'Wird im Modell ausschließlich als Diktatur geführt, ohne Wertung als Aufstieg.',
    sourceNote: 'Grenzen belegt: Machtübernahme 1933, Kapitulation 1945.'
  },
  {
    id: 'nachkriegszeit',
    name: 'Nachkriegszeit (Besatzungszeit)',
    yearStart: 1946,
    yearEnd: 1948,
    evidence: 'belegt',
    description: 'Besatzungszeit zwischen Kriegsende und Gründung der beiden deutschen Staaten.',
    sourceNote: 'Kriegsende 1945, Gründung von Bundesrepublik und DDR 1949.'
  },
  {
    id: 'bundesrepublik',
    name: 'Bundesrepublik Deutschland (bis 1990)',
    yearStart: 1949,
    yearEnd: 1990,
    evidence: 'belegt',
    description: 'Parlamentarische Demokratie in den Grenzen bis zur Wiedervereinigung.',
    sourceNote: 'Grundgesetz verkündet 23.05.1949; Wiedervereinigung 03.10.1990.'
  },
  {
    id: 'ddr',
    name: 'Deutsche Demokratische Republik',
    yearStart: 1949,
    yearEnd: 1990,
    evidence: 'belegt',
    description:
      'Sozialistische Einparteienherrschaft auf dem Gebiet der späteren neuen Länder. ' +
      'Wird ausschließlich als Diktatur geführt.',
    sourceNote: 'Gründung 07.10.1949; Beitritt zur Bundesrepublik 03.10.1990.'
  },
  {
    id: 'bundesrepublik_vereint',
    name: 'Bundesrepublik Deutschland (seit 1990)',
    yearStart: 1991,
    yearEnd: null,
    evidence: 'belegt',
    description: 'Parlamentarische Demokratie im vereinten Deutschland.',
    sourceNote: 'Wiedervereinigung 03.10.1990; offenes Ende.'
  }
];

/**
 * Regionen als geografisch-kulturelle Einheiten – **ohne Grenzpolygone**.
 *
 * Die Zuordnung zu Epochen ist bewusst grob: Kulturräume verschieben sich,
 * ihre Grenzen sind nicht exakt datierbar.
 */
export const REGIONS: readonly HistoricalRegion[] = [
  {
    id: 'rheinland',
    name: 'Rheinland',
    description: 'Kulturraum entlang des Rheins mit früher städtischer Prägung.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Kulturraum ohne exakt datierbare Grenze; in allen Epochen als Bezugsgröße nutzbar.'
  },
  {
    id: 'sachsen',
    name: 'Sachsen',
    description: 'Kulturraum im Norden und Osten, früh mit Stammesherzogtum belegt.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Der Name bezeichnet historisch unterschiedlich geschnittene Räume.'
  },
  {
    id: 'bayern',
    name: 'Bayern',
    description: 'Südlicher Kulturraum mit früh belegtem Stammesherzogtum.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Stammesherzogtum ab dem 6. Jahrhundert belegt; Grenzen wandelten sich stark.'
  },
  {
    id: 'schwaben',
    name: 'Schwaben',
    description: 'Südwestlicher Kulturraum mit alemannischer Prägung.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Kulturraum, keine konstante politische Einheit.'
  },
  {
    id: 'franken',
    name: 'Franken',
    description: 'Kulturraum in der Mitte, namengebend für das fränkische Reich.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Der Begriff umfasst sehr unterschiedliche historische Räume.'
  },
  {
    id: 'thueringen',
    name: 'Thüringen',
    description: 'Mitteldeutscher Kulturraum mit früher Eigenständigkeit.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Kulturraum; politische Zuschnitte wechselten häufig.'
  },
  {
    id: 'westfalen',
    name: 'Westfalen',
    description: 'Nordwestdeutscher Kulturraum.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Der Regionsname ist jünger als der besiedelte Raum.'
  },
  {
    id: 'hessen',
    name: 'Hessen',
    description: 'Mitteldeutscher Kulturraum.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Kulturraum ohne durchgehend konstante Grenze.'
  },
  {
    id: 'baden',
    name: 'Baden',
    description: 'Südwestdeutscher Kulturraum.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Als politische Einheit erst neuzeitlich; der Kulturraum ist älter.'
  },
  {
    id: 'wurttemberg',
    name: 'Württemberg',
    description: 'Südwestdeutscher Kulturraum.',
    epochIds: [],
    evidence: 'naeherung',
    sourceNote: 'Als politische Einheit erst neuzeitlich fassbar.'
  },
  {
    id: 'hansestaedte',
    name: 'Hansestädte',
    description: 'Verbund norddeutscher Handelsstädte, kein zusammenhängendes Territorium.',
    epochIds: ['spaetmittelalter', 'fruehe_neuzeit'],
    evidence: 'naeherung',
    sourceNote:
      'Der Städtebund ist ab dem 12./13. Jahrhundert belegt; Mitgliedschaften wechselten, ' +
      'eine gemeinsame Territorialgrenze existierte nicht.'
  },
  {
    id: 'preussen',
    name: 'Preußen (Region)',
    description: 'Nordöstlicher Raum mit eigener, erst neuzeitlich fassbarer Staatlichkeit.',
    epochIds: ['fruehe_neuzeit', 'deutscher_bund', 'kaiserreich'],
    evidence: 'naeherung',
    sourceNote:
      'Der Begriff bezeichnete nacheinander sehr unterschiedliche Gebilde ' +
      '(Ordensland, Herzogtum, Königreich). Keine einheitliche Grenze.'
  },
  {
    id: 'schlesien',
    name: 'Schlesien',
    description: 'Südöstlicher Kulturraum mit wechselnder Zugehörigkeit.',
    epochIds: ['spaetmittelalter', 'fruehe_neuzeit', 'deutscher_bund', 'kaiserreich'],
    evidence: 'naeherung',
    sourceNote: 'Zugehörigkeiten wechselten mehrfach; Grenzen sind nicht durchgehend bestimmbar.'
  },
  {
    id: 'germanien',
    name: 'Germanien (neutrale Platzhalter-Region)',
    description:
      'Neutrale Platzhalter-Region für Zeiträume ohne belastbare Gebietsangabe. ' +
      'Dient ausschließlich als Lückenfüller und behauptet keinen historischen Grenzverlauf.',
    epochIds: [],
    evidence: 'nicht_verifiziert',
    sourceNote:
      '„Germanien" ist eine antike Fremdbezeichnung ohne deckungsgleiches politisches Gebiet. ' +
      'Bewusst als Platzhalter geführt, nicht als Territorium.'
  }
];

/** Politische Systeme, jeweils über Epochen-IDs gebunden. */
export const POLITICAL_SYSTEMS: readonly PoliticalSystem[] = [
  {
    id: 'stammesverband',
    name: 'Stammesverband',
    kind: 'verband',
    epochIds: ['fruehmittelalter', 'hochmittelalter'],
    regionIds: ['sachsen', 'bayern', 'schwaben', 'franken', 'thueringen'],
    description: 'Lose geführte Verbände ohne zentralen Staatsapparat.',
    evidence: 'naeherung',
    sourceNote: 'Vielfältige, quellenarm belegte Organisationsformen; keine einheitliche Struktur.'
  },
  {
    id: 'herzogtum',
    name: 'Stammesherzogtum',
    kind: 'monarchie',
    epochIds: ['fruehmittelalter', 'hochmittelalter'],
    regionIds: ['sachsen', 'bayern', 'schwaben', 'franken', 'rheinland'],
    description: 'Regionale Herrschaft eines Herzogs, in das Reich eingebunden.',
    evidence: 'naeherung',
    sourceNote: 'Herzogtümer bilden sich ab dem ausgehenden 9. Jahrhundert aus; Grenzen fließend.'
  },
  {
    id: 'koenigreich',
    name: 'Königsherrschaft',
    kind: 'monarchie',
    epochIds: ['hochmittelalter', 'spaetmittelalter', 'fruehe_neuzeit'],
    regionIds: ['rheinland', 'sachsen', 'bayern', 'schwaben', 'franken', 'thueringen'],
    description: 'Herrschaft eines gewählten oder erblichen Königs.',
    evidence: 'belegt',
    sourceNote: 'Königserhebung ab 911 belegt; Wahlmodalitäten änderten sich mehrfach.'
  },
  {
    id: 'kaisertum_hrr',
    name: 'Kaisertum des Heiligen Römischen Reiches',
    kind: 'monarchie',
    epochIds: ['hochmittelalter', 'spaetmittelalter', 'fruehe_neuzeit'],
    regionIds: ['rheinland', 'sachsen', 'bayern', 'schwaben', 'franken', 'thueringen'],
    description: 'Kaiserwürde mit stark föderaler Struktur und Wahlcharakter.',
    evidence: 'belegt',
    sourceNote: 'Kaiserkrönung Ottos I. 962 bis zum Ende des Reiches 1806.'
  },
  {
    id: 'staedtebund',
    name: 'Städtebund',
    kind: 'bund',
    epochIds: ['spaetmittelalter', 'fruehe_neuzeit'],
    regionIds: ['hansestaedte', 'rheinland'],
    description: 'Bündische Organisation von Städten, keine Territorialherrschaft.',
    evidence: 'naeherung',
    sourceNote: 'Bünde bildeten sich wiederholt und mit wechselnder Mitgliedschaft.'
  },
  {
    id: 'deutscher_bund_system',
    name: 'Deutscher Bund (Staatenbund)',
    kind: 'bund',
    epochIds: ['deutscher_bund'],
    regionIds: ['rheinland', 'sachsen', 'bayern', 'schwaben', 'franken', 'preussen'],
    description: 'Staatenbund souveräner Einzelstaaten ohne gemeinsame Regierung.',
    evidence: 'belegt',
    sourceNote: 'Bundesakte 1815; Ende 1866.'
  },
  {
    id: 'konstitutionelle_monarchie',
    name: 'Konstitutionelle Monarchie',
    kind: 'monarchie',
    epochIds: ['kaiserreich'],
    regionIds: ['rheinland', 'sachsen', 'bayern', 'schwaben', 'franken', 'preussen', 'schlesien'],
    description: 'Monarchie mit Verfassung, Parlament und Reichsregierung.',
    evidence: 'belegt',
    sourceNote: 'Reichsverfassung 1871; Ende 1918.'
  },
  {
    id: 'parlamentarische_republik',
    name: 'Parlamentarische Republik',
    kind: 'republik',
    epochIds: ['weimarer_republik', 'bundesrepublik', 'bundesrepublik_vereint'],
    regionIds: ['rheinland', 'sachsen', 'bayern', 'schwaben', 'franken', 'thueringen', 'hessen', 'baden', 'wurttemberg'],
    description: 'Republik mit gewähltem Parlament und Regierungschef.',
    evidence: 'belegt',
    sourceNote: 'Weimarer Verfassung 1919, Grundgesetz 1949.'
  },
  {
    id: 'praesidialrepublik',
    name: 'Präsidialrepublik',
    kind: 'republik',
    epochIds: ['weimarer_republik'],
    regionIds: ['rheinland', 'sachsen', 'bayern', 'schwaben', 'franken', 'thueringen'],
    description: 'Republik mit starkem Staatsoberhaupt und Notstandsrechten.',
    evidence: 'naeherung',
    sourceNote:
      'Die Zuschreibung „Präsidialrepublik" ist eine Deutung der Forschung für die Endphase, ' +
      'keine amtliche Bezeichnung.'
  },
  {
    id: 'diktatur_ns',
    name: 'Nationalsozialistische Diktatur',
    kind: 'diktatur',
    epochIds: ['nationalsozialismus'],
    regionIds: ['rheinland', 'sachsen', 'bayern', 'schwaben', 'franken', 'thueringen', 'preussen', 'schlesien'],
    description:
      'Gewaltherrschaft ohne freie Wahlen und mit systematischer Verfolgung. ' +
      'Im Modell ausschließlich als Diktatur geführt.',
    evidence: 'belegt',
    sourceNote: '1933 bis 1945; keine Wertung im Datenmodell.'
  },
  {
    id: 'diktatur_sed',
    name: 'Sozialistische Einparteienherrschaft',
    kind: 'diktatur',
    epochIds: ['ddr'],
    regionIds: ['sachsen', 'thueringen'],
    description: 'Einparteienherrschaft ohne freie Wahlen auf dem Gebiet der DDR.',
    evidence: 'belegt',
    sourceNote: '1949 bis 1990; im Modell ausschließlich als Diktatur geführt.'
  }
];

/**
 * Ämter, jeweils an politische Systeme **und** Epochen gebunden.
 *
 * Die Bindung an Systeme verhindert zeitlich unsinnige Kombinationen
 * (z. B. „Bundeskanzler" in einer Monarchie des 13. Jahrhunderts).
 */
export const OFFICES: readonly Office[] = [
  {
    id: 'stammesoberhaupt',
    name: 'Stammesoberhaupt',
    systemIds: ['stammesverband'],
    epochIds: ['fruehmittelalter', 'hochmittelalter'],
    description: 'Führende Position eines Verbands, häufig an Herkunft und Gefolgschaft gebunden.',
    evidence: 'naeherung',
    sourceNote: 'Quellenlage zu konkreten Amtsbezeichnungen ist lückenhaft.'
  },
  {
    id: 'herzog',
    name: 'Herzog',
    systemIds: ['herzogtum'],
    epochIds: ['fruehmittelalter', 'hochmittelalter'],
    description: 'Regionales Herrschaftsamt mit militärischer und richterlicher Funktion.',
    evidence: 'belegt',
    sourceNote: 'Herzogstitel ab dem frühen Mittelalter belegt.'
  },
  {
    id: 'koenig',
    name: 'König',
    systemIds: ['koenigreich', 'kaisertum_hrr', 'konstitutionelle_monarchie'],
    epochIds: ['hochmittelalter', 'spaetmittelalter', 'fruehe_neuzeit', 'kaiserreich'],
    description: 'Höchstes weltliches Herrschaftsamt, je nach Epoche gewählt oder erblich.',
    evidence: 'belegt',
    sourceNote: 'Königserhebung ab 911; Königswürde im Kaiserreich 1871–1918.'
  },
  {
    id: 'kaiser',
    name: 'Römisch-deutscher Kaiser',
    systemIds: ['kaisertum_hrr'],
    epochIds: ['hochmittelalter', 'spaetmittelalter', 'fruehe_neuzeit'],
    description: 'Kaiserwürde des Heiligen Römischen Reiches, historisch an Wahl und Krönung gebunden.',
    evidence: 'belegt',
    sourceNote: 'Kaiserkrönung Ottos I. 962 bis 1806.'
  },
  {
    id: 'deutscher_kaiser',
    name: 'Deutscher Kaiser',
    systemIds: ['konstitutionelle_monarchie'],
    epochIds: ['kaiserreich'],
    description:
      'Staatsoberhaupt des Deutschen Kaiserreichs ab 1871; das Amt war an die preußische ' +
      'Königswürde gebunden und unterschied sich deutlich vom römisch-deutschen Kaisertum.',
    evidence: 'belegt',
    sourceNote:
      'Reichsverfassung 1871; bewusst als eigenes Amt geführt, um keine Kontinuität ' +
      'zum Heiligen Römischen Reich zu behaupten.'
  },
  {
    id: 'kurfuerst',
    name: 'Kurfürst',
    systemIds: ['kaisertum_hrr'],
    epochIds: ['spaetmittelalter', 'fruehe_neuzeit'],
    description: 'Wahlberechtigtes Fürstenamt für die Königswahl.',
    evidence: 'naeherung',
    sourceNote:
      'Das Wahlkollegium verfestigte sich schrittweise; die Goldene Bulle 1356 regelte das Verfahren.'
  },
  {
    id: 'fuerst',
    name: 'Fürst',
    systemIds: ['kaisertum_hrr'],
    epochIds: ['spaetmittelalter', 'fruehe_neuzeit'],
    description: 'Herrschaftsamt innerhalb des Reiches mit eigener Territorialgewalt.',
    evidence: 'belegt',
    sourceNote: 'Fürstentümer sind im Reich durchgehend belegt.'
  },
  {
    id: 'buergermeister',
    name: 'Bürgermeister',
    systemIds: ['staedtebund', 'parlamentarische_republik'],
    epochIds: ['spaetmittelalter', 'fruehe_neuzeit', 'bundesrepublik', 'bundesrepublik_vereint'],
    description: 'Leitendes Amt einer Stadtverwaltung.',
    evidence: 'naeherung',
    sourceNote:
      'Städtische Leitungsämter sind im Spätmittelalter belegt, die Bezeichnung variierte regional.'
  },
  {
    id: 'reichskanzler',
    name: 'Reichskanzler',
    systemIds: ['konstitutionelle_monarchie', 'praesidialrepublik', 'diktatur_ns'],
    epochIds: ['kaiserreich', 'weimarer_republik', 'nationalsozialismus'],
    description: 'Regierungschef des Reiches in den Jahren 1871 bis 1945.',
    evidence: 'belegt',
    sourceNote:
      'Amt 1871 geschaffen; die Kompetenzen unterschieden sich zwischen Kaiserreich, ' +
      'Republik und Diktatur erheblich.'
  },
  {
    id: 'reichspraesident',
    name: 'Reichspräsident',
    systemIds: ['praesidialrepublik'],
    epochIds: ['weimarer_republik'],
    description: 'Staatsoberhaupt der Weimarer Republik.',
    evidence: 'belegt',
    sourceNote: 'Amt 1919–1934; die Befugnisse wurden 1933/34 ausgehöhlt.'
  },
  {
    id: 'bundeskanzler',
    name: 'Bundeskanzler',
    systemIds: ['parlamentarische_republik'],
    epochIds: ['bundesrepublik', 'bundesrepublik_vereint'],
    description: 'Regierungschef der Bundesrepublik Deutschland.',
    evidence: 'belegt',
    sourceNote: 'Amt seit 1949 (Grundgesetz).'
  },
  {
    id: 'bundespraesident',
    name: 'Bundespräsident',
    systemIds: ['parlamentarische_republik'],
    epochIds: ['bundesrepublik', 'bundesrepublik_vereint'],
    description: 'Staatsoberhaupt der Bundesrepublik Deutschland.',
    evidence: 'belegt',
    sourceNote: 'Amt seit 1949 (Grundgesetz).'
  },
  {
    id: 'staatsratsvorsitzender',
    name: 'Staatsratsvorsitzender',
    systemIds: ['diktatur_sed'],
    epochIds: ['ddr'],
    description: 'Formelles Staatsoberhaupt der DDR; die politische Macht lag bei der Partei.',
    evidence: 'belegt',
    sourceNote: 'Amt 1960–1990; keine freie Wahl, daher als Diktatur geführt.'
  },
  {
    id: 'bundesversammlungs_delegierter',
    name: 'Delegierter der Bundesversammlung',
    systemIds: ['deutscher_bund_system'],
    epochIds: ['deutscher_bund'],
    description: 'Vertretung eines Einzelstaats im Organ des Deutschen Bundes.',
    evidence: 'naeherung',
    sourceNote:
      'Die Bundesversammlung war das einzige Organ des Bundes; die Bezeichnung der ' +
      'Entsandten variierte.'
  }
];

/** Befüllt den Katalog einmalig beim Import. */
PolityCatalog.initialize({
  epochs: EPOCHS,
  regions: REGIONS,
  systems: POLITICAL_SYSTEMS,
  offices: OFFICES
});
