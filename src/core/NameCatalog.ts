/**
 * Zentrale, quellenbezogene Namensbibliothek.
 *
 * Jeder Bestand trägt einen Zeitraum, eine regionale/kulturelle Einordnung,
 * einen Evidenzgrad und eine Quelle. Es werden bewusst keine Namen als belegt
 * ausgegeben, die für ihre Zeit nicht überliefert sind: Für schriftlose oder
 * schlecht belegte Zeiträume ist `evidence` ausdrücklich `reconstructed` oder
 * `fictional`.
 *
 * Grundsätze:
 *  - Ein Name wird **bei Geburt bzw. Erstellung** nach dem damaligen Jahr gewählt.
 *  - Ein späterer Epochenwechsel benennt niemals bestehende Personen um.
 *  - Namen sind Atmosphäre, keine Aussage über reale Namensstatistik einer Region.
 *  - Beziehungen hängen nie am Namen, sondern an der Bürger-ID.
 */

/** Evidenzgrad eines Namensbestands. */
export type NameEvidence = 'attested' | 'reconstructed' | 'fictional';

/** Ein benannter Bestand für einen Zeitraum und eine Kultur. */
export interface NameSet {
  /** Eindeutige Kennung des Bestands. */
  id: string;
  /** Anzeigename der Zeit-/Kulturgruppe, z. B. „Frühmittelalter (althochdeutsch)". */
  label: string;
  /** Frühestes Geburtsjahr, für das dieser Bestand gilt (inklusive). */
  from: number;
  /** Spätestes Geburtsjahr (inklusive). `null` = offenes Ende. */
  to: number | null;
  /** Regionale/kulturelle Einordnung, soweit belegt. */
  region: string;
  /** Evidenzgrad der Namensformen. */
  evidence: NameEvidence;
  /** Quellenhinweis oder Begründung des Evidenzgrads. */
  source: string;
  /** Auswahl weiblicher Vornamen. */
  female: readonly string[];
  /** Auswahl männlicher Vornamen. */
  male: readonly string[];
  /**
   * Familiennamen-Formen. Vor dem Aufkommen erblicher Familiennamen ist das
   * ein Beiname (Byname), kein Geschlechtername; `null` = kein Nachname.
   */
  familyNames: readonly string[] | null;
  /** Hinweis, wie Nachnamen in dieser Zeit funktionieren. */
  familyNote: string;
}

export const NAME_SETS: readonly NameSet[] = [
  {
    id: 'prehistory',
    label: 'Vorzeit (vor schriftlichen Quellen)',
    from: -10000,
    to: -1,
    region: 'Mitteleuropa, keine schriftlichen Selbstzeugnisse',
    evidence: 'fictional',
    source:
      'Für diese Zeit sind keine Personennamen überliefert. Die Formen sind aus ' +
      'erschlossenen indogermanischen Namenselementen frei gebildet und ausdrücklich ' +
      'fiktional; sie sind keine Belege.',
    female: [
      'Alva', 'Brida', 'Eira', 'Ganna', 'Hella', 'Iwa', 'Kara', 'Luta', 'Mara', 'Neva',
      'Orla', 'Runa', 'Sina', 'Tura', 'Ulla', 'Vela', 'Wanda', 'Yrla'
    ],
    male: [
      'Arvo', 'Bero', 'Dago', 'Ermo', 'Fulco', 'Giso', 'Hardo', 'Ingo', 'Kuno', 'Lando',
      'Mardo', 'Nanto', 'Ordo', 'Rado', 'Seggo', 'Teuto', 'Ulmo', 'Wido'
    ],
    familyNames: null,
    familyNote: 'Keine Familiennamen. Personen werden nur beim Vornamen genannt.'
  },
  {
    id: 'antiquity',
    label: 'Antike (germanisch, römisch überliefert)',
    from: 1,
    to: 499,
    region: 'Germania, römische Grenzprovinzen',
    evidence: 'attested',
    source:
      'Einzelne Namen sind bei römischen Autoren und in lateinischen Inschriften überliefert ' +
      '(Arminius, Thusnelda, Segestes, Segimerus, Maroboduus), meist latinisiert. Die Auswahl ' +
      'ist klein; sie ist keine Namensstatistik.',
    female: [
      'Thusnelda', 'Veleda', 'Albruna', 'Ganna', 'Hilda', 'Irmina', 'Luidgard', 'Runa',
      'Sigilind', 'Walburg'
    ],
    male: [
      'Arminius', 'Segestes', 'Segimerus', 'Maroboduus', 'Inguiomer', 'Chariovalda',
      'Bato', 'Catualda', 'Vannius', 'Sido'
    ],
    familyNames: null,
    familyNote:
      'Keine erblichen Familiennamen. Römische Quellen latinisieren die Namen; die ' +
      'germanische Originalform ist oft nicht gesichert.'
  },
  {
    id: 'early_medieval',
    label: 'Frühmittelalter (althochdeutsch)',
    from: 500,
    to: 1099,
    region: 'Fränkisches Reich, ostfränkische Gebiete',
    evidence: 'attested',
    source:
      'Zweigliedrige althochdeutsche Personennamen, in Urkunden, Nekrologen und dem ' +
      'St. Galler Verbrüderungsbuch überliefert. Standardwerk: Förstemann, Altdeutsches ' +
      'Namenbuch, Bd. 1: Personennamen, 2. Aufl., Bonn 1900.',
    female: [
      'Adalheid', 'Hildegard', 'Liutgard', 'Gertrud', 'Irmgard', 'Mathild', 'Richgard',
      'Adalburg', 'Berhta', 'Gisela', 'Kunigund', 'Oda', 'Reginlind', 'Walpurg', 'Hruodheid'
    ],
    male: [
      'Adalbert', 'Notker', 'Alarich', 'Sigihard', 'Engilfred', 'Arnold', 'Eberhart',
      'Hatto', 'Liutfried', 'Otakar', 'Reginbert', 'Werinher', 'Gozbert', 'Ruodlieb', 'Waltari'
    ],
    familyNames: [
      'am Bach', 'auf der Geest', 'am Wald', 'vom Anger', 'am Feld', 'vom Hof',
      'bei der Eiche', 'an der Furt', 'zum Stein', 'im Bruch'
    ],
    familyNote:
      'Erbliche Familiennamen entstehen erst später. Die Formen sind Beinamen nach ' +
      'Wohnstätte oder Hof, nicht vererbbare Geschlechternamen.'
  },
  {
    id: 'high_medieval',
    label: 'Hochmittelalter',
    from: 1100,
    to: 1349,
    region: 'Deutschsprachige Gebiete des Reiches',
    evidence: 'attested',
    source:
      'Urkundlich und in Stadtbüchern vielfach belegte Namensformen des 12.–14. Jahrhunderts. ' +
      'Namen sind Atmosphäre, keine Statistik einer einzelnen Stadt.',
    female: [
      'Adelheid', 'Mathilde', 'Hildegard', 'Gertrud', 'Kunigunde', 'Elisabeth',
      'Mechthild', 'Bertha', 'Sophie', 'Jutta', 'Agnes', 'Beatrix'
    ],
    male: [
      'Heinrich', 'Konrad', 'Friedrich', 'Otto', 'Ludwig', 'Ulrich', 'Albrecht',
      'Hermann', 'Dietrich', 'Wernher', 'Burchard', 'Siegfried'
    ],
    familyNames: [
      'am Bach', 'auf der Geest', 'am Wald', 'vom Anger', 'am Feld', 'vom Hof',
      'zu der Linde', 'von der Heide', 'am Berge', 'zur Mühle'
    ],
    familyNote:
      'Beinamen nach Herkunft, Hof oder Gewerbe. Erbliche Familiennamen beginnen, ' +
      'sind aber noch nicht allgemein fest.'
  },
  {
    id: 'late_medieval',
    label: 'Spätmittelalter',
    from: 1350,
    to: 1499,
    region: 'Deutschsprachige Gebiete des Reiches',
    evidence: 'attested',
    source:
      'Namensformen des 14./15. Jahrhunderts aus Urkunden und Zunftlisten. ' +
      'Familiennamen werden in dieser Zeit weithin erblich.',
    female: [
      'Anna', 'Katharina', 'Margarethe', 'Barbara', 'Elisabeth', 'Dorothea',
      'Maria', 'Ursula', 'Brigitta', 'Christina', 'Ottilie', 'Veronika'
    ],
    male: [
      'Johann', 'Georg', 'Martin', 'Jakob', 'Philipp', 'Matthias', 'Heinrich',
      'Friedrich', 'Nikolaus', 'Bartholomäus', 'Sebastian', 'Valentin'
    ],
    familyNames: [
      'Meyer', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker',
      'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer'
    ],
    familyNote: 'Familiennamen sind nun weithin erblich und berufs- oder herkunftsbezogen.'
  },
  {
    id: 'early_modern',
    label: 'Frühe Neuzeit',
    from: 1500,
    to: 1799,
    region: 'Deutschsprachige Gebiete',
    evidence: 'attested',
    source:
      'Kirchenbuchüberlieferung ab dem 16. Jahrhundert macht Namensgaben gut belegbar. ' +
      'Auswahl ist zeitgenössisch, aber keine regionale Statistik.',
    female: [
      'Anna', 'Maria', 'Katharina', 'Elisabeth', 'Margaretha', 'Barbara', 'Eva',
      'Susanna', 'Regina', 'Christina', 'Dorothea', ' Magdalena'
    ],
    male: [
      'Johann', 'Georg', 'Michael', 'Jakob', 'Martin', 'Andreas', 'Christoph',
      'Hans', 'Peter', 'Nikolaus', 'Balthasar', 'Caspar'
    ],
    familyNames: [
      'Meyer', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker',
      'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Neumann', 'Krüger'
    ],
    familyNote: 'Erbliche Familiennamen sind allgemein üblich.'
  },
  {
    id: 'nineteenth',
    label: '19. Jahrhundert',
    from: 1800,
    to: 1899,
    region: 'Deutschsprachige Gebiete',
    evidence: 'attested',
    source:
      'Standesamts- und Kirchenbücher des 19. Jahrhunderts; Vornamen sind zeitgenössisch ' +
      'vielfach belegt.',
    female: [
      'Luise', 'Marie', 'Sophie', 'Emilie', 'Auguste', 'Johanna', 'Clara', 'Elise',
      'Bertha', 'Ida', 'Mathilde', 'Wilhelmine'
    ],
    male: [
      'Wilhelm', 'Karl', 'Otto', 'Eduard', 'Friedrich', 'Ernst', 'Theodor', 'Gustav',
      'Hermann', 'August', 'Emil', 'Ludwig'
    ],
    familyNames: [
      'Meyer', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker',
      'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Neumann', 'Krüger', 'Wolf'
    ],
    familyNote: 'Erbliche Familiennamen sind allgemein üblich.'
  },
  {
    id: 'early_twentieth',
    label: 'Frühes 20. Jahrhundert',
    from: 1900,
    to: 1929,
    region: 'Deutschsprachige Gebiete',
    evidence: 'attested',
    source: 'Standesamtsüberlieferung; zeitgenössisch häufige Vornamen.',
    female: [
      'Anna', 'Gertrud', 'Martha', 'Frieda', 'Erna', 'Elisabeth', 'Marie', 'Hedwig',
      'Else', 'Käthe', 'Margarete', 'Änne'
    ],
    male: [
      'Karl', 'Hans', 'Wilhelm', 'Walter', 'Heinrich', 'Otto', 'Ernst', 'Paul',
      'Kurt', 'Fritz', 'Hermann', 'Rudolf'
    ],
    familyNames: [
      'Meyer', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker',
      'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Neumann', 'Krüger', 'Wolf'
    ],
    familyNote: 'Erbliche Familiennamen sind allgemein üblich.'
  },
  {
    id: 'mid_twentieth',
    label: 'Mitte 20. Jahrhundert',
    from: 1930,
    to: 1959,
    region: 'Deutschland',
    evidence: 'attested',
    source: 'Zeitgenössisch häufige Vornamen der 1930er bis 1950er Jahre.',
    female: [
      'Helga', 'Ingrid', 'Gisela', 'Renate', 'Brigitte', 'Monika', 'Sabine', 'Petra',
      'Ursula', 'Christa', 'Ilse', 'Hannelore'
    ],
    male: [
      'Peter', 'Hans', 'Klaus', 'Wolfgang', 'Jürgen', 'Dieter', 'Michael', 'Thomas',
      'Günter', 'Horst', 'Manfred', 'Bernd'
    ],
    familyNames: [
      'Meyer', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker',
      'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Neumann', 'Krüger', 'Wolf'
    ],
    familyNote: 'Erbliche Familiennamen sind allgemein üblich.'
  },
  {
    id: 'late_twentieth',
    label: 'Spätes 20. Jahrhundert',
    from: 1960,
    to: 1989,
    region: 'Deutschland',
    evidence: 'attested',
    source: 'Zeitgenössisch häufige Vornamen der 1960er bis 1980er Jahre.',
    female: [
      'Sabine', 'Petra', 'Susanne', 'Claudia', 'Andrea', 'Anja', 'Birgit', 'Kerstin',
      'Nicole', 'Stefanie', 'Katrin', 'Ute'
    ],
    male: [
      'Thomas', 'Michael', 'Stefan', 'Andreas', 'Christian', 'Markus', 'Frank', 'Jörg',
      'Uwe', 'Dirk', 'Oliver', 'Sven'
    ],
    familyNames: [
      'Meyer', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker',
      'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Neumann', 'Krüger', 'Wolf'
    ],
    familyNote: 'Erbliche Familiennamen sind allgemein üblich.'
  },
  {
    id: 'modern',
    label: 'Gegenwart',
    from: 1990,
    to: null,
    region: 'Deutschland',
    evidence: 'attested',
    source: 'Zeitgenössisch häufige Vornamen seit 1990.',
    female: [
      'Lena', 'Mia', 'Emma', 'Sophie', 'Hannah', 'Lea', 'Sarah', 'Lina',
      'Marie', 'Laura', 'Julia', 'Nele'
    ],
    male: [
      'Leon', 'Paul', 'Max', 'Ben', 'Lukas', 'Felix', 'Finn', 'Jonas',
      'Noah', 'Elias', 'Luca', 'Emil'
    ],
    familyNames: [
      'Meyer', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker',
      'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Neumann', 'Krüger', 'Wolf'
    ],
    familyNote: 'Erbliche Familiennamen sind allgemein üblich.'
  }
] as const;

/** Bestand für ein Geburtsjahr; zuletzt definierter Zeitraum gewinnt. */
export function nameSetForYear(year: number): NameSet {
  const match = NAME_SETS.find(set => year >= set.from && (set.to === null || year <= set.to));
  return match ?? NAME_SETS[0];
}

/** Alle Bestände in zeitlicher Reihenfolge, für die Informationsansicht. */
export function allNameSets(): readonly NameSet[] {
  return [...NAME_SETS].sort((a, b) => a.from - b.from);
}

export const EVIDENCE_LABELS: Record<NameEvidence, string> = {
  attested: 'Belegt',
  reconstructed: 'Rekonstruiert',
  fictional: 'Fiktional'
};

/**
 * Erkennt automatisch erzeugte Platzhalternamen früherer Versionen.
 * Nur diese werden bei der einmaligen Umstellung ersetzt; eigene und bereits
 * sinnvolle Namen bleiben erhalten, damit die Umstellung wiederholbar ist.
 * @param name Vorname eines Bürgers.
 * @returns true für erzeugte Platzhalter wie „Kind 34" oder „Bewohnerin 124".
 */
export function isPlaceholderName(name: string): boolean {
  if (typeof name !== 'string') return false;
  return /^(Kind|Nachwuchs|Bewohner|Bewohnerin)\s+\d+$/.test(name.trim());
}

/**
 * Erkennt den erzeugten Platzhalter-Nachnamen früherer Versionen.
 * @param name Nachname eines Bürgers.
 * @returns true nur für den Platzhalter „der Siedlung".
 */
export function isPlaceholderSurname(name: string): boolean {
  return typeof name === 'string' && name.trim() === 'der Siedlung';
}
