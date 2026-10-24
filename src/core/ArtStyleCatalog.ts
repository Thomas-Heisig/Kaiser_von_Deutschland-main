import type { EraKnowledge, KnowledgeTopic } from './EraKnowledgeCatalog';

/** Reading windows overlap deliberately. They are not exact dates of invention or extinction. */
function style(id: string, from: number, to: number, title: string, description: string,
  place: string, sourceTitle: string, sourceUrl: string, topic: KnowledgeTopic = 'art'): EraKnowledge {
  return {id:`style-${id}`,from,to,title,description,place,sourceTitle,sourceUrl,topic};
}
function moma(id: string, from: number, to: number, title: string, description: string,
  place: string, slug = id, topic: KnowledgeTopic = 'art'): EraKnowledge {
  return style(id,from,to,title,description,place,`Museum of Modern Art – ${title}`,
    `https://www.moma.org/collection/terms/${slug}`,topic);
}
function ngs(id: string, from: number, to: number, title: string, description: string, place: string, slug = id): EraKnowledge {
  return style(id,from,to,title,description,place,`National Galleries of Scotland – ${title}`,
    `https://www.nationalgalleries.org/art-and-artists/glossary-terms/${slug}`);
}

export const ART_STYLE_KNOWLEDGE: readonly EraKnowledge[] = [
  style('byzantine',330,1453,'Byzantinische Kunst: eine lange, wechselvolle Tradition','Die Forschung unterscheidet früh-, mittel- und spätbyzantinische Phasen. Christliche Bildkunst steht in wechselnden politischen und religiösen Zusammenhängen; auch der Bilderstreit gehört zu dieser Geschichte.',
    'Oströmisches Reich und seine Kontaktregionen','The Metropolitan Museum of Art – The Arts of Byzantium','https://resources.metmuseum.org/resources/metpublications/pdf/The_Arts_of_Byzantium_The_Metropolitan_Museum_of_Art_Bulletin_v_58_no_4_Spring_2001.pdf'),
  style('early-english',1180,1290,'Early English: eine englische Form der Gotik','Schmale Spitzbogenfenster und gebündelte Säulenschäfte kennzeichnen viele Bauten. Übergänge aus der normannischen Architektur verlaufen schrittweise.',
    'England','English Heritage – Medieval Architecture','https://www.english-heritage.org.uk/learn/story-of-england/medieval/architecture/','architecture'),
  style('decorated',1290,1370,'Decorated Style: aufwendiges Maßwerk','Große Fenster mit reich gegliedertem steinernem Maßwerk und plastischer Schmuck prägen diese englische Bauweise. Die Zeitgrenzen variieren in der Forschung.',
    'England','English Heritage – Medieval Architecture','https://www.english-heritage.org.uk/learn/story-of-england/medieval/architecture/','architecture'),
  style('perpendicular',1330,1530,'Perpendicular: senkrechte Linien und Fensterflächen','Durchlaufende senkrechte Gliederungen und rasterartig geordnete Fenster bestimmen diese englische Spätgotik. Spätere Bauten können Fächergewölbe und abgeflachte Bögen zeigen.',
    'England','Canterbury Historical and Archaeological Society – Perpendicular style','https://www.canterbury-archaeology.org.uk/perpendicular-style','architecture'),
  style('vormaerz',1830,1848,'Vormärz: Literatur und politische Öffentlichkeit','Gesellschaftskritische Schriftsteller fordern Freiheitsrechte und soziale Veränderungen. Ihre Arbeit steht neben häuslich-bürgerlichen Kulturformen und gerät mit staatlicher Zensur in Konflikt.',
    'Deutscher Bund','Deutsches Historisches Museum – Vormärz: Kunst und Kultur','https://www.dhm.de/lemo/kapitel/vormaerz-und-revolution/kunst-und-kultur','culture'),
  style('naturalism',1880,1910,'Naturalismus in Literatur und Theater','Genaue Milieuschilderung und sozialkritische Themen prägen viele Werke. Wissenschaftliches Denken beeinflusst die Autoren; um 1900 bestehen bereits zahlreiche konkurrierende Richtungen.',
    'Deutschsprachiger Raum','Deutsches Historisches Museum – Literarische Strömungen der Jahrhundertwende','https://www.dhm.de/lemo/kapitel/kaiserreich/kunst-und-kultur/literatur','culture'),
  style('early-christian',330,600,'Frühchristliche Basiliken','Längliche Kirchenräume werden durch Säulen in Schiffe gegliedert. Mosaiken, Marmorverkleidung und Wandmalerei zeigen regional unterschiedliche Ausstattung und finanzielle Möglichkeiten.',
    'Östlicher Mittelmeerraum; Beispiel Thessaloniki','Museum of Byzantine Culture – The Early Christian Church','https://www.mbp.gr/en/permanentexhibitions/room-1-the-early-christian-church/','architecture'),
  style('empire',1800,1815,'Empire: Repräsentation unter Napoleon','Antike Formen verbinden sich mit napoleonischen Herrschaftszeichen. Malerei, Möbel, Porzellan und Textilien dienen auch der Selbstdarstellung des Regimes.',
    'Frankreich','The Metropolitan Museum of Art – Empire Style, 1800–1815','https://www.metmuseum.org/it/essays/empire-style-1800-1815','architecture'),
  moma('orphism',1912,1920,'Orphismus','Robert und Sonia Delaunay sowie František Kupka erforschen mit leuchtenden Farbflächen Licht und Farbwirkung. Apollinaire verbindet diese abstrakte Malerei begrifflich mit Musik.', 'Frankreich'),
  style('impressionism',1860,1905,'Impressionismus','Sichtbare Pinselzüge, helle Farben und wechselndes Licht prägen Ansichten des modernen Lebens. Ungewohnte Blickwinkel und flüchtige Situationen werden zu Bildthemen.',
    'Frankreich; internationale Ausstrahlung','Nelson-Atkins Museum of Art – Impressionism, 1860–1900s','https://www.nelson-atkins.org/fpc/catalogue/Impressionism/'),
  ngs('post-impressionism',1886,1910,'Postimpressionismus','Der spätere Sammelbegriff umfasst unterschiedliche Wege nach dem Impressionismus. Cézanne, van Gogh und Gauguin entwickeln jeweils eigene Auffassungen von Form, Farbe und Ausdruck.', 'Frankreich und weitere europäische Kunstzentren'),
  ngs('neo-impressionism',1886,1905,'Neoimpressionismus und Pointillismus','Seurat und Signac untersuchen Farbkontraste systematisch. Kleine getrennte Farbfelder sollen sich im Seheindruck verbinden; die Punkttechnik ist ein Verfahren dieser Richtung.', 'Frankreich und Belgien'),
  style('art-nouveau',1890,1914,'Jugendstil / Art Nouveau','Pflanzenformen, fließende Linien und asymmetrische Kompositionen prägen Architektur, Möbel und Gebrauchsgegenstände. Regionale Varianten tragen unterschiedliche Namen.',
    'Europa und USA','The London Archives – Art Nouveau and Art Deco','https://www.thelondonarchives.org/your-research/researching-the-collections/art-nouveau-and-art-deco','architecture'),
  ngs('new-objectivity',1920,1933,'Neue Sachlichkeit','Genaue Beobachtung, nüchterne Formen und teilweise scharfe Gesellschaftskritik stehen im Mittelpunkt. Die Richtung umfasst unterschiedliche politische und künstlerische Haltungen.', 'Deutschland','neue-sachlichkeit-new-objectivity'),
  style('informel',1950,1970,'Informel','Gestische Abstraktion eröffnet neue Ausdrucksmöglichkeiten nach dem Krieg. In Frankfurt wird die Künstlergruppe Quadriga zu einem wichtigen Zentrum; die Entwicklung ist international.',
    'Europa; Beispiel Frankfurt','Städel Museum – Die Zeichnungen der Zeit','https://stories.staedelmuseum.de/de/deutsche-zeichnungen-des-20-jahrhunderts-2'),
  style('action-painting',1952,1970,'Action Painting','Der Malvorgang wird durch Gesten, Tropfen und Spritzer im Bild sichtbar. Harold Rosenberg prägt den Begriff 1952; er bezeichnet eine Arbeitsweise, keine gesamte Epoche.',
    'USA','Museum of Modern Art – Art terms: Action painting','https://www.moma.org/collection/terms/'),
  ngs('art-brut',1945,1980,'Art brut','Jean Dubuffet verwendet den Begriff seit 1945 für Kunst außerhalb akademischer Ausbildung und etablierter Kunstinstitutionen. Art brut ist kein bloßes Synonym für gestische abstrakte Malerei.', 'Frankreich und Schweiz; internationale Sammlungspraxis'),
  ngs('op-art',1960,1980,'Op Art','Abstrakte Muster und starke Kontraste erzeugen Eindrücke von Flimmern, Bewegung oder räumlicher Verformung. Die optische Wirkung steht im Zentrum.', 'International'),
  ngs('neo-expressionism',1970,1990,'Neoexpressionismus','Große, expressive Figurenbilder greifen unter anderem Erinnerung, Mythologie und Geschichte auf. Unterschiedliche Materialien können Teil der malerischen Oberfläche werden.', 'Deutschland, USA und weitere Kunstzentren'),
  style('transavanguardia',1978,1990,'Transavanguardia','In Italien gewinnt eine expressive, handwerklich ausgeführte Malerei an Bedeutung. Kunsthistorische Bezüge und Lust am Malen treten gegenüber konzeptueller Reduktion hervor.',
    'Italien','Getty Research Institute – Trans-avantgarde','https://www.getty.edu/vow/AATFullDisplay?find=amber&logic=AND&note=&subjectid=300022218'),
  style('appropriation',1975,2000,'Appropriation Art','Vorhandene Bilder, Gegenstände und Ideen werden bewusst übernommen und verändert. Das Verfahren stellt Fragen nach Original, Autorenschaft und kultureller Bedeutung.',
    'International','Museum of Modern Art – Art terms: Appropriation','https://www.moma.org/collection/terms/'),
  style('mannerism',1520,1600,'Manierismus','Verlängerte Körper, ungewöhnliche Räume und kunstvolle Bewegungen lösen sich vom Ideal ausgewogener Renaissanceproportionen. Die Bezeichnung wird regional unterschiedlich verwendet.',
    'Italien; Ausstrahlung in Europa','National Galleries of Scotland – Mannerism','https://www.nationalgalleries.org/art-and-artists/glossary-terms/mannerism'),
  style('symbolism',1880,1910,'Symbolismus','Bilder und Dichtung vermitteln Ideen, Gefühle und Vorstellungen. Die Darstellung sichtbarer Natur tritt gegenüber Andeutung und innerer Erfahrung zurück.',
    'Frankreich und weitere europäische Kunstzentren','The Metropolitan Museum of Art – Symbolism','https://www.metmuseum.org/it/essays/symbolism'),
  moma('fauvism',1905,1908,'Fauvismus','Kräftige, nicht naturgetreue Farben und sichtbare Pinselzüge bestimmen Bilder von Matisse und anderen. Landschaften und Figuren bleiben erkennbar: Fauvismus ist nicht gleichbedeutend mit ungegenständlicher Malerei.', 'Frankreich'),
  moma('expressionism',1905,1930,'Expressionismus','Natur, Großstadt, Menschenbild und Krieg gehören zu den Themen expressionistischer Kunst. Zugespitzte Formen und Farben vermitteln subjektive Erfahrungen.', 'Deutschland und weitere europäische Regionen'),
  moma('cubism',1907,1914,'Kubismus','Picasso und Braque zerlegen Gegenstände in Flächen und verbinden unterschiedliche Ansichten. Collagen beziehen auch bedrucktes Alltagspapier ein.', 'Paris'),
  moma('futurism',1910,1918,'Futurismus','Werke von Balla, Boccioni und Severini untersuchen Bewegung und dynamische Formen. Malerei, Skulptur und gedruckte Texte gehören zu den Ausdrucksmitteln.', 'Italien und internationale Verbindungen'),
  moma('constructivism',1917,1930,'Konstruktivismus','Geometrische Konstruktionen, Material und räumliche Beziehungen werden künstlerische Aufgaben. Beispiele reichen von Tatlins Entwürfen bis zu Rodtschenkos Konstruktionen.', 'Russland und Sowjetunion'),
  moma('suprematism',1915,1925,'Suprematismus','Malewitsch und weitere Künstler arbeiten mit nichtgegenständlichen geometrischen Formen. Farbflächen und ihre Beziehungen tragen die Bildkomposition.', 'Russland und Sowjetunion'),
  moma('dada',1916,1924,'Dada','Zufall, Wortspiel, Collage und alltägliche Fundstücke stellen gewohnte Vorstellungen von Kunst infrage. Die Sammlung zeigt auch spätere Fortsetzungen dieser Verfahren.', 'Zürich, Berlin, Paris und weitere Zentren'),
  moma('de-stijl',1917,1931,'De Stijl','Geometrische Ordnung verbindet Malerei, Möbel und Architekturentwürfe. Mondrians Bilder, Rietvelds Rot-Blauer Stuhl und van Doesburgs Raumstudien zeigen unterschiedliche Anwendungen.', 'Niederlande; internationale Verbindungen', 'de-stijl','architecture'),
  style('bauhaus',1919,1933,'Bauhaus: Kunst, Handwerk und Gestaltung','Die 1919 gegründete Schule verbindet künstlerische Experimente mit Entwürfen für Möbel, Textilien, Grafik und Architektur. 1933 erzwingt die nationalsozialistische Verfolgung ihre Schließung.',
    'Weimar, Dessau und Berlin','Museum of Modern Art – Bauhaus 1919–1933','https://www.moma.org/calendar/exhibitions/303?locale=en','architecture'),
  moma('surrealism',1924,1960,'Surrealismus','Traum, unbewusste Vorgänge und überraschende Verbindungen alltäglicher Dinge werden zu Bildthemen. Automatische Verfahren stehen neben sorgfältig ausgeführten fantastischen Szenen.', 'Paris und internationale Kunstzentren'),
  moma('abstract-expressionism',1945,1965,'Abstrakter Expressionismus','Große abstrakte Bilder erkunden Farbe, Fläche und körperlichen Malprozess. Pollock, Kline, Newman und Krasner zeigen unterschiedliche Wege innerhalb dieses Zusammenhangs.', 'USA, besonders New York'),
  moma('pop-art',1960,1980,'Pop Art','Werbung, Konsumgüter und bekannte Medienbilder werden künstlerisches Material. Beispiele sind Warhols Suppendosen und Lichtensteins an Comics orientierte Gemälde.', 'USA und Großbritannien'),
  moma('minimalism',1960,1980,'Minimal Art','Einfache Formen, Wiederholung und Materialien lenken den Blick auf Raum und Wahrnehmung. Arbeiten von Judd, Flavin und Truitt zeigen verschiedene plastische Ansätze.', 'USA; internationale Rezeption'),
  moma('fluxus',1961,1980,'Fluxus','Alltägliche Handlungen, kleine Objekte und Spielanweisungen verbinden Kunst und Leben. Die Werke von Brecht, Knowles, Maciunas und Ono überschreiten einzelne Kunstgattungen.', 'Internationales Netzwerk'),
  moma('conceptual-art',1965,1990,'Konzeptkunst','Ideen, Sprache und Anweisungen können wichtiger werden als ein dauerhaftes Kunstobjekt. Werke untersuchen auch, wie Institutionen und Begriffe Kunst bestimmen.', 'International'),
  style('postmodernism',1970,1990,'Postmoderne: Zitate und Widersprüche','Architektur und Design verbinden historische Zitate, kräftige Farben und spielerische Übertreibung. Unterschiedliche Traditionen werden bewusst nebeneinandergestellt.',
    'International; Beispiele aus Europa, Japan und den USA','Victoria and Albert Museum – What is Postmodernism?','https://www.vam.ac.uk/articles/what-is-postmodernism','architecture'),
];
