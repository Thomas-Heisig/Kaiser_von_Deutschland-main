// src/utils/NameGenerator.ts

/**
 * Deutsche Vornamen für verschiedene Epochen
 */
const germanFirstNames = {
  male: {
    medieval: ['Heinrich', 'Friedrich', 'Otto', 'Konrad', 'Wilhelm', 'Ludwig', 'Karl', 'Albrecht', 'Bernhard', 'Dietrich'],
    renaissance: ['Hans', 'Georg', 'Peter', 'Michael', 'Johann', 'Martin', 'Jakob', 'Andreas', 'Christoph', 'Sebastian'],
    baroque: ['Johann', 'Georg', 'Friedrich', 'Wilhelm', 'Christian', 'Ernst', 'August', 'Philipp', 'Carl', 'Ludwig'],
    industrial: ['Wilhelm', 'Friedrich', 'Karl', 'Heinrich', 'Hermann', 'Otto', 'Emil', 'Paul', 'Ernst', 'Gustav'],
    modern: ['Hans', 'Klaus', 'Peter', 'Wolfgang', 'Helmut', 'Günter', 'Horst', 'Dieter', 'Jürgen', 'Manfred'],
    contemporary: ['Michael', 'Thomas', 'Andreas', 'Peter', 'Stefan', 'Christian', 'Markus', 'Daniel', 'Sebastian', 'Alexander']
  },
  female: {
    medieval: ['Adelheid', 'Kunigunde', 'Gertrud', 'Hedwig', 'Mathilde', 'Elisabeth', 'Agnes', 'Mechthild', 'Irmgard', 'Beatrix'],
    renaissance: ['Anna', 'Maria', 'Barbara', 'Elisabeth', 'Katharina', 'Margarethe', 'Christina', 'Sophia', 'Dorothea', 'Helena'],
    baroque: ['Maria', 'Anna', 'Elisabeth', 'Margaretha', 'Christina', 'Catharina', 'Sophia', 'Johanna', 'Magdalena', 'Rosina'],
    industrial: ['Anna', 'Maria', 'Elisabeth', 'Martha', 'Emma', 'Margarethe', 'Frieda', 'Bertha', 'Marie', 'Johanna'],
    modern: ['Ursula', 'Helga', 'Gisela', 'Ingrid', 'Christa', 'Renate', 'Karin', 'Monika', 'Brigitte', 'Erika'],
    contemporary: ['Sabine', 'Petra', 'Andrea', 'Claudia', 'Susanne', 'Barbara', 'Maria', 'Christina', 'Julia', 'Anna']
  }
};

/**
 * Deutsche Nachnamen
 */
const germanLastNames = [
  // Berufsbasierte Namen
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
  'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
  'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier',
  'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter', 'Mayer', 'Huber',
  'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert',
  'Vogel', 'Friedrich', 'Keller', 'Günther', 'Frank', 'Berger', 'Winkler', 'Roth', 'Beck', 'Lorenz',
  'Baumann', 'Franke', 'Albrecht', 'Schuster', 'Simon', 'Ludwig', 'Böhm', 'Winter', 'Kraus', 'Martin',
  'Schumacher', 'Krämer', 'Vogt', 'Stein', 'Jäger', 'Otto', 'Sommer', 'Groß', 'Seidel', 'Heinrich',
  'Brandt', 'Haas', 'Schreiber', 'Graf', 'Dietrich', 'Ziegler', 'Kuhn', 'Kühn', 'Pohl', 'Engel',
  'Horn', 'Busch', 'Bergmann', 'Thomas', 'Voigt', 'Sauer', 'Arnold', 'Wolff', 'Pfeiffer', 'Ritter'
];

/**
 * Hilfsfunktion zur Epochenbestimmung basierend auf Jahr
 */
function getEpoch(year: number): keyof typeof germanFirstNames.male {
  if (year < 1400) return 'medieval';
  if (year < 1650) return 'renaissance';
  if (year < 1800) return 'baroque';
  if (year < 1950) return 'industrial';
  if (year < 2000) return 'modern';
  return 'contemporary';
}

/**
 * Name Generator für Bürger
 */
export class NameGenerator {
  /**
   * Generiert einen zufälligen deutschen Vornamen
   */
  public static generateFirstName(gender: 'male' | 'female', year: number = 1500): string {
    const epoch = getEpoch(year);
    const names = germanFirstNames[gender][epoch];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  /**
   * Generiert einen zufälligen deutschen Nachnamen
   */
  public static generateLastName(): string {
    return germanLastNames[Math.floor(Math.random() * germanLastNames.length)];
  }
  
  /**
   * Generiert einen vollständigen Namen
   */
  public static generateFullName(gender: 'male' | 'female', year: number = 1500): {
    firstName: string;
    lastName: string;
  } {
    return {
      firstName: this.generateFirstName(gender, year),
      lastName: this.generateLastName()
    };
  }
  
  /**
   * Generiert einen Familiennamen basierend auf dem Vater
   */
  public static generateFamilyName(fatherLastName: string, motherLastName: string): string {
    // In historischen Zeiten wird meist der Name des Vaters übernommen
    return Math.random() < 0.9 ? fatherLastName : motherLastName;
  }
  
  /**
   * Generiert einen adeligen Namen
   */
  public static generateNobleName(gender: 'male' | 'female', year: number = 1500): {
    firstName: string;
    lastName: string;
  } {
    const firstName = this.generateFirstName(gender, year);
    const territoryPrefixes = ['von', 'zu', 'von und zu'];
    const territories = [
      'Habsburg', 'Hohenzollern', 'Wettin', 'Wittelsbach', 'Luxemburg',
      'Brandenburg', 'Sachsen', 'Bayern', 'Württemberg', 'Baden',
      'Hessen', 'Nassau', 'Pfalz', 'Trier', 'Köln', 'Mainz',
      'Lichtenstein', 'Fürstenberg', 'Thurn und Taxis', 'Schwarzenberg'
    ];
    
    const prefix = territoryPrefixes[Math.floor(Math.random() * territoryPrefixes.length)];
    const territory = territories[Math.floor(Math.random() * territories.length)];
    
    return {
      firstName,
      lastName: `${prefix} ${territory}`
    };
  }
  
  /**
   * Generiert einen Namen für Geistliche
   */
  public static generateClergyName(gender: 'male' | 'female', year: number = 1500): {
    firstName: string;
    lastName: string;
  } {
    const base = this.generateFullName(gender, year);
    
    // Mönche und Nonnen nehmen oft religiöse Namen an
    const religiousNames = {
      male: ['Benedikt', 'Augustinus', 'Franziskus', 'Dominikus', 'Bernhard', 'Thomas', 'Albertus', 'Anselm'],
      female: ['Hildegard', 'Clara', 'Teresa', 'Catharina', 'Scholastica', 'Gertrud', 'Mechthild', 'Birgitta']
    };
    
    if (Math.random() < 0.3) {
      const names = religiousNames[gender === 'female' ? 'female' : 'male'];
      base.firstName = names[Math.floor(Math.random() * names.length)];
    }
    
    return base;
  }
}
