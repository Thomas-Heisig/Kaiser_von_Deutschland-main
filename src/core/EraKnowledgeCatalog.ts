import { bce } from './HistoricalCalendar';
import { ART_STYLE_KNOWLEDGE } from './ArtStyleCatalog';
/** Editorial reading windows, not exact beginnings/endings of styles. No gameplay effects. */
export type KnowledgeTopic = 'art' | 'architecture' | 'culture' | 'everyday';
export const KNOWLEDGE_TOPICS: Record<KnowledgeTopic, string> = {
  art: 'Kunst', architecture: 'Baustil & Wohnen', culture: 'Kultur & Wissen', everyday: 'Alltag'
};
export interface EraKnowledge {
  id: string; from: number; to: number; fromMonth?: number; toMonth?: number;
  topic: KnowledgeTopic; title: string; description: string; place: string;
  sourceTitle: string; sourceUrl: string;
}
type Reading = [KnowledgeTopic, string, string];
function group(id: string, from: number, to: number, place: string, sourceTitle: string,
  sourceUrl: string, readings: Reading[], months: {fromMonth?: number; toMonth?: number} = {}): EraKnowledge[] {
  return readings.map(([topic, title, description], index) => ({
    id: `${id}-${index}`, from, to, ...months, place, sourceTitle, sourceUrl, topic, title, description
  }));
}

export const ERA_KNOWLEDGE: readonly EraKnowledge[] = [
  ...group('carolingian-workshops',768,900,'Fränkisches Reich; besonders Hof und Klöster','The Metropolitan Museum of Art – Carolingian Art',
    'https://www.metmuseum.org/essays/carolingian-art',[
      ['culture','Lesbare Schrift als Kulturpolitik','Die karolingische Minuskel erleichtert das Lesen und Abschreiben von Texten. Bildung und Schriftpflege werden am Hof und in Klöstern gefördert; daraus folgt noch keine allgemeine Alphabetisierung.'],
      ['art','Kostbare Bücher und geschnitztes Elfenbein','Buchmalerei, Elfenbeintafeln und reich verzierte Einbände verbinden antike Bildvorbilder mit regionalen Gestaltungstraditionen. Viele dieser Werke entstehen für religiöse oder höfische Auftraggeber.'],
      ['architecture','Aachen: Architektur als Herrschaftssprache','Die achteckige Pfalzkapelle greift auf römische und byzantinische Vorbilder zurück. Importierte Marmorteile und monumentale Formen unterstreichen den Anspruch des Hofes.']
    ]),
  ...group('bauhaus-building-school',1927,1933,'Dessau und Berlin; Bauhaus-Lehre','Bauhaus Kooperation – Baulehre',
    'https://bauhauskooperation.de/wissen/das-bauhaus/lehre/unterricht/baulehre',[
      ['architecture','Architektur wird ein eigenes Lehrgebiet','Obwohl das Bauen schon 1919 als Ziel genannt wurde, entsteht eine eigene Architekturabteilung erst 1927 in Dessau. Zuvor arbeiten Studierende an Projekten im privaten Büro von Walter Gropius mit.'],
      ['culture','Vom Werkstattlernen zur Baulehre','Die Bauausbildung verbindet Gestaltung mit konkreten Entwurfsaufgaben. Die Einrichtung der Abteilung verändert das Lehrangebot der Schule; das Bauhaus ist keine über seine gesamte Geschichte unveränderte Institution.']
    ]),
  ...group('bauhaus-housing',1926,1933,'Dessau; konkrete Beispiele des Neuen Bauens','Deutsches Historisches Museum – Bauhaus',
    'https://www.dhm.de/lemo/kapitel/weimarer-republik/kunst-und-kultur/bauhaus',[
      ['everyday','Neue Häuser für den Alltag','1926 entsteht der erste Abschnitt der Siedlung Dessau-Törten mit 60 Häusern. Wohnungsbau wird zum Experimentierfeld neuer Gestaltung; das Beispiel steht nicht für die Wohnverhältnisse aller Menschen.'],
      ['architecture','Licht, Glas und Werkstätten','Der verglaste Werkstättentrakt des Dessauer Bauhausgebäudes macht Helligkeit und Funktion sichtbar. Das Gebäude wird im Dezember 1926 bezogen und prägt die Wahrnehmung moderner Architektur.']
    ],{fromMonth:12}),
  ...ART_STYLE_KNOWLEDGE,
  ...group('sigillata', 1, 300, 'Römische Provinzen; heutige archäologische Einordnung', 'Stadtarchäologie Wien – Was Sie schon immer über Terra Sigillata wissen wollten',
    'https://stadtarchaeologie.at/start/erleben/ausstellungen/tischgespraech/tischgespraech/', [
      ['culture', 'Wie Keramik bei der Datierung hilft', 'Gefäßformen, Verzierungen und Töpferstempel erlauben zeitliche und räumliche Zuordnungen. Wie eng eine Datierung ausfällt, hängt vom Fund ab: Nicht jede Scherbe ist jahrzehntgenau bestimmbar.'],
      ['everyday', 'Geschirr verrät Handelsverbindungen', 'Stempel auf Terra Sigillata nennen Hersteller oder Werkstätten. Die Fundverteilung kann Absatzgebiete und Handelskontakte sichtbar machen.']
    ]),
  ...group('colosseum-spoils', 80, 150, 'Rom; heutige Inschriftenforschung', 'Parco archeologico del Colosseo – Iscrizione di C. V. Lampadius',
    'https://colosseo.it/opere/iscrizione-del-prefetto-di-roma-c-v-lampadius/', [
      ['architecture', 'Kolosseum: Baufinanzierung und Kriegsbeute', 'Die rekonstruierte ursprüngliche Bauinschrift verweist auf Finanzierung aus Beute. Das Museum verbindet sie mit Jerusalem; eine vollständige Finanzierung allein durch einen genau bezifferten Tempelgoldschatz ist damit nicht belegt.']
    ]),
  ...group('urnfield', bce(1300), bce(800), 'Mitteleuropa; Beispiel Essenbach', 'Germanisches Nationalmuseum – Letzte Fahrt',
    'https://www.gnm.de/ausstellungen/sonderausstellungen-rueckblick/letzte-fahrt', [
      ['art', 'Bronzearbeiten und Bildzeichen', 'Aufwendig gearbeitete Bronzeobjekte zeigen handwerkliche Spezialisierung. Wagen und bildliche Zeichen können auch religiöse Vorstellungen vermitteln.'],
      ['culture', 'Urnenbestattung und soziale Unterschiede', 'Die Bezeichnung Urnenfelderzeit verweist auf Brandbestattungen. Kostbare Grabbeigaben einzelner Personen zeigen Unterschiede innerhalb der Gesellschaft.'],
      ['everyday', 'Gewichte und überregionale Kontakte', 'Gewichte aus dem Wagenfund von Essenbach verweisen auf Austausch und Handel. Ein reiches Grab ist jedoch kein vollständiges Abbild des Alltags aller Menschen.']
    ]),
  ...group('geometric', bce(900), bce(700), 'Griechischer Raum', 'The Metropolitan Museum of Art – Geometric Art in Ancient Greece',
    'https://www.metmuseum.org/it/essays/geometric-art-in-ancient-greece', [
      ['art', 'Geometrische Kunst', 'Geometrische Muster und stilisierte Figuren prägen bemalte Gefäße. Die Bezeichnung beschreibt eine kunsthistorische Einordnung, keine überall gleiche Lebensweise.'],
      ['architecture', 'Tempel und Heiligtümer', 'Mit der Entwicklung der Poleis entstehen bedeutende Tempel und Heiligtümer. Religiöse Orte werden zu Bezugspunkten gemeinschaftlicher Identität.'],
      ['culture', 'Alphabet, Epen und Polis', 'Die Entwicklung des griechischen Alphabets und die Überlieferung epischer Dichtung begleiten gesellschaftliche Veränderungen. Ein genauer Gründungstag dieser Entwicklungen lässt sich nicht angeben.'],
      ['everyday', 'Handel und neue Siedlungen', 'Seeverbindungen führen nach Kleinasien, Süditalien und Sizilien. Handel und Siedlungsgründungen verbinden verschiedene Gemeinschaften des Mittelmeerraums.']
    ]),
  ...group('egypt-middle', bce(2000), bce(1650), 'Ägypten · keine Aussage über ganz Europa', 'National Museum of Egyptian Civilization – Historical Timeline',
    'https://nmec.gov.eg/historical-timeline/', [
      ['architecture', 'Das Mittlere Reich am Nil', 'Königliche Bauvorhaben und landwirtschaftliche Projekte gehören zur erneuerten staatlichen Organisation. Die Bezeichnung Mittleres Reich gilt für Ägypten, nicht für alle bronzezeitlichen Gesellschaften.'],
      ['art', 'Kunst im Umfeld königlicher Macht', 'Die Kunst des Mittleren Reiches steht im Zusammenhang mit der erneuerten Zentralgewalt. Kunstwerke und Denkmäler vermitteln Vorstellungen von Herrschaft und Religion.'],
      ['culture', 'Sprache und Literatur', 'Die ägyptische Sprache und Literatur erleben eine wichtige Entwicklungsphase. Solche kulturellen Leistungen sind regional einzuordnen, nicht als einheitlicher Stand der ganzen Welt.'],
      ['everyday', 'Landwirtschaft, Bergbau und Handel', 'Der Staat organisiert Bergbauexpeditionen, Handelsreisen und landwirtschaftliche Vorhaben. Die Versorgung am Nil verbindet lokale Arbeit mit überregionaler Verwaltung.']
    ]),
  ...group('minoan', bce(1900), bce(1450), 'Kreta', 'The Metropolitan Museum of Art – Minoan Crete',
    'https://www.metmuseum.org/de/essays/minoan-crete', [
      ['architecture', 'Minoische Palastzentren', 'Seit ungefähr 1900 v. Chr. entstehen große Palastzentren auf Kreta. Sie verbinden politische und wirtschaftliche Funktionen mit künstlerischer Produktion.'],
      ['art', 'Stein, Metall und Keramik', 'Kretische Werkstätten bearbeiten Gefäße, Siegel und Metallgegenstände. Unterschiedliche Materialien und Techniken belegen eine spezialisierte handwerkliche Kultur.'],
      ['culture', '„Minoisch“ ist ein moderner Forschungsbegriff', 'Der Archäologe Arthur Evans benannte die bronzezeitliche Kultur Kretas nach dem sagenhaften Minos. Der Begriff ist keine überlieferte Selbstbezeichnung aller damaligen Bewohner.'],
      ['everyday', 'Vorräte und wirtschaftliche Organisation', 'Palastzentren bündeln wirtschaftliche Macht und möglicherweise die Verteilung landwirtschaftlicher Güter. Ihre Funktion wird aus archäologischen Befunden erschlossen.']
    ]),
  ...group('mycenaean', bce(1600), bce(1100), 'Griechisches Festland und Ägäis', 'Museums Victoria – Open Horizons: Timeline',
    'https://museumsvictoria.com.au/melbournemuseum/resources/open-horizons/timeline/', [
      ['architecture', 'Mykenische Paläste als Machtzentren', 'Große Palastanlagen bündeln politische und wirtschaftliche Macht. Die spätbronzezeitliche Ägäis besteht aus mehreren Zentren und Kontaktgebieten.'],
      ['art', 'Goldarbeiten und kostbare Gefäße', 'Reich ausgestattete Gräber und kunstvolle Gefäße zeigen spezialisiertes Handwerk. Solche Prestigeobjekte repräsentieren vor allem wohlhabende Gruppen.'],
      ['culture', 'Kontakte über die Ägäis hinaus', 'Mykenische Kultur verbreitet sich in der Ägäis und auf Kreta. Verbindungen nach Osten und Westen ermöglichen Austausch.'],
      ['everyday', 'Arbeit und Versorgung um die Paläste', 'Paläste bilden wirtschaftliche Zentren. Ihr Aufbau und ihr späterer Zusammenbruch betreffen auch Versorgung und politische Abhängigkeiten.']
    ]),
  ...group('greek-orders', bce(600), bce(31), 'Griechische Städte und ihre Siedlungsgebiete', 'The Metropolitan Museum of Art – Architecture in Ancient Greece',
    'https://www.metmuseum.org/ja/essays/architecture-in-ancient-greece', [
      ['architecture', 'Dorische und ionische Ordnung', 'Säulen, Gebälk und Proportionen bilden zusammen eine Bauordnung. Dorische Säulen besitzen keine Basis; ionische Kapitelle zeigen charakteristische Voluten.'],
      ['art', 'Skulptur als Teil des Bauwerks', 'Giebel, Friese und Metopen tragen bildhauerischen Schmuck. Die Kunst am Tempel gehört zur architektonischen Gesamtgestaltung.'],
      ['culture', 'Tempel als exemplarische Bauaufgabe', 'Griechische Architekten errichten verschiedene Gebäudetypen. Besonders Tempel veranschaulichen ihre Arbeit mit Maßverhältnissen und präzise ausgeführten Bauteilen.'],
      ['everyday', 'Regionale Unterschiede in der gebauten Umgebung', 'Dorische Formen sind auf dem griechischen Festland häufig, ionische besonders in Kleinasien und auf Inseln. Diese Verteilung ist keine starre Grenze.']
    ]),
  ...group('corinthian', bce(400), 400, 'Griechischer und römischer Mittelmeerraum', 'The Metropolitan Museum of Art – Architecture in Ancient Greece',
    'https://www.metmuseum.org/ja/essays/architecture-in-ancient-greece', [
      ['architecture', 'Korinthische Kapitelle', 'Die korinthische Ordnung entwickelt sich später als Dorik und Ionik. Akanthusblätter schmücken die Kapitelle; in hellenistischer und römischer Zeit wird sie besonders verbreitet.']
    ]),
  ...group('roman-life', bce(100), 400, 'Römischer Mittelmeerraum; regional vielfältig', 'The Metropolitan Museum of Art – Roman Art: A Resource for Educators',
    'https://www.metmuseum.org/-/media/files/learn/for-educators/publications-for-educators/roman.pdf', [
      ['architecture', 'Römisches Bauen mit Bogen und Beton', 'Römische Bautechnik verbindet Säulenordnungen mit Bögen und Gewölben. Beton ermöglicht große, verschieden nutzbare Räume; lokale Materialien und Bauweisen bleiben wichtig.'],
      ['art', 'Porträts und öffentliche Repräsentation', 'Bildnisse und architektonischer Schmuck machen Rang und politische Macht sichtbar. Die Auftraggeber reichen von Herrschern bis zu wohlhabenden lokalen Gruppen.'],
      ['culture', 'Öffentliche Räume und gemeinschaftliches Leben', 'Stadtanlagen und öffentliche Gebäude strukturieren das Zusammenleben. Die römische Baukultur entwickelt sich über Jahrhunderte; nicht jeder Gebäudetyp ist überall gleichzeitig vorhanden.'],
      ['everyday', 'Bauen für Versorgung und Begegnung', 'Öffentliche Bauten verbinden praktische Funktionen mit Repräsentation. Bauwerke und erhaltene Gegenstände geben Einblick in eine sozial ungleiche Gesellschaft.']
    ]),
  ...group('medieval-transitions', 300, 1139, 'Europa und östlicher Mittelmeerraum', 'The Metropolitan Museum of Art – Medieval Art: A Resource for Educators',
    'https://resources.metmuseum.org/resources/metpublications/pdf/Medieval_Art_A_Resource_for_Educators.pdf', [
      ['culture', 'Mehrere Traditionen statt einer einzigen Stilfolge', 'Spätantike, christliche und regionale Traditionen wirken nebeneinander. Die Grenzen kunstgeschichtlicher Epochen sind Hilfsmittel der Forschung, keine gleichzeitigen Stilwechsel in allen Regionen.']
    ]),
  ...group('carolingian', 750, 950, 'Karolingische Herrschaftsgebiete', 'The Metropolitan Museum of Art – Medieval Art: A Resource for Educators',
    'https://resources.metmuseum.org/resources/metpublications/pdf/Medieval_Art_A_Resource_for_Educators.pdf', [
      ['art', 'Karolingische Kunst', 'Höfische und kirchliche Auftraggeber fördern Buchkunst und kostbare Gegenstände. Antike Vorbilder werden aufgenommen und in neue Zusammenhänge gestellt.']
    ]),
  ...group('ottonian', 919, 1050, 'Ottonische Herrschaftsgebiete', 'The Metropolitan Museum of Art – Medieval Art: A Resource for Educators',
    'https://resources.metmuseum.org/resources/metpublications/pdf/Medieval_Art_A_Resource_for_Educators.pdf', [
      ['art', 'Ottonische Kunst', 'Kirchliche Zentren und Herrscherhöfe fördern besonders Buchmalerei und liturgische Kunst. Die Einordnung überschneidet sich regional mit anderen frühmittelalterlichen Traditionen.']
    ]),
  ...group('romanesque', 1000, 1240, 'Europa mit regionalen Unterschieden', 'Grand Palais – Romanesque Art',
    'https://www.grandpalais.fr/en/magazine/romanesque-art', [
      ['architecture', 'Romanik: monumentale Kirchenräume', 'Massige Baukörper und monumentale Gestaltung kennzeichnen viele romanische Kirchen. Regionale Schulen und unterschiedliche Traditionen verhindern eine überall einheitliche Formensprache.'],
      ['art', 'Skulptur und Malerei in der Romanik', 'Reicher plastischer Schmuck und Malerei ergänzen die Architektur. Karolingische, antike und byzantinische Anregungen gehören zu ihren vielfältigen Voraussetzungen.']
    ]),
  ...group('gothic', 1140, 1499, 'Frankreich und Teile Europas', 'The Metropolitan Museum of Art – Gothic Art',
    'https://www.metmuseum.org/fr/essays/gothic-art', [
      ['architecture', 'Gotik: Licht, Höhe und tragende Rippen', 'Spitzbögen, Kreuzrippengewölbe und Strebewerk ermöglichen hohe Kirchenräume mit großen Glasfenstern. Die aus Frankreich verbreiteten Bauformen werden regional unterschiedlich aufgenommen. Ältere romanische Bauten bleiben bestehen.'],
      ['art', 'Bilder aus farbigem Glas und Stein', 'Glasmalerei und figürliche Skulptur gehören zur Ausstattung gotischer Kirchen. Werkstätten vermitteln Formen über Regionen hinweg; Künstler arbeiten auch an kleinen Objekten aus Elfenbein und Metall.'],
      ['culture', 'Kunst zwischen Kirche und weltlichem Auftrag', 'Gotische Gestaltung begegnet auch in Handschriften und weltlichen Luxusgegenständen. Kirche und Hof bilden unterschiedliche Auftragswelten; „mittelalterlich“ bedeutet keinen überall einheitlichen Geschmack.'],
      ['everyday', 'Kostbare Dinge sind kein Durchschnittshaushalt', 'Verzierte Möbel, Textilien und kleine Kunstobjekte zeigen die materielle Kultur wohlhabender Auftraggeber. Solche erhaltenen Gegenstände bilden nicht die Wohnverhältnisse aller Menschen ab.']
    ]),
  ...group('renaissance', 1450, 1599, 'Italien; Ausstrahlung in Europa', 'The Metropolitan Museum of Art – Architecture in Renaissance Italy',
    'https://www.metmuseum.org/fr/essays/architecture-in-renaissance-italy', [
      ['architecture', 'Renaissance: Proportion und antike Formen', 'Säulen, Pilaster, Giebel und Rundbögen greifen Vorbilder der Antike auf. Architekten ordnen Fassaden und Räume nach Proportionen; gotische Traditionen verschwinden dabei nicht überall gleichzeitig.'],
      ['art', 'Perspektive als künstlerisches Wissen', 'Die Beschäftigung mit Perspektive und Geometrie verbindet Malerei und Architektur. Leon Battista Alberti behandelt Gestaltung in theoretischen Schriften; der Künstler tritt auch als Gelehrter hervor.'],
      ['culture', 'Architektur wird diskutiertes Wissen', 'Humanistische Bildung und das Studium antiker Bauten prägen die Architekturtheorie. Entwürfe werden begründet und vermittelt, nicht nur nach Werkstatttradition ausgeführt.'],
      ['everyday', 'Paläste erzählen von ihren Auftraggebern', 'Städtische Palastfassaden ordnen Fenster und Geschosse zu repräsentativen Ansichten. Diese Architektur zeigt die Ansprüche vermögender Familien; sie ist kein Abbild sämtlicher Wohnungen.']
    ]),
  ...group('baroque', 1600, 1750, 'Italien und weitere europäische Regionen', 'Victoria and Albert Museum – The Baroque Style',
    'https://www.vam.ac.uk/articles/the-baroque-style', [
      ['architecture', 'Barock: Räume als Inszenierung', 'Architektur, Malerei und Skulptur wirken in aufwendig gestalteten Räumen zusammen. Bewegung, Licht und starke Kontraste dienen religiöser Ansprache und höfischer Repräsentation.'],
      ['art', 'Bewegung und starke Gefühle', 'Barocke Gestaltung setzt häufig auf dramatische Gesten und bewegte Formen. Kirchen und Höfe fördern Kunst mit unterschiedlichen religiösen und politischen Absichten.'],
      ['culture', 'Bühne, Oper und höfisches Fest', 'Theater und Oper verbinden Musik, Kostüme, Bühnenbilder und technische Effekte. Höfische Aufführungen sind zugleich Unterhaltung und Darstellung von Macht.'],
      ['everyday', 'Luxus aus vernetzten Handelswegen', 'Porzellan, Lackarbeiten und aufwendige Möbel prägen wohlhabende Interieurs. Solche Gegenstände verweisen auch auf Fernhandel und koloniale Verflechtungen, nicht auf den Lebensstandard der gesamten Bevölkerung.']
    ]),
  ...group('rococo', 1720, 1779, 'Frankreich und europäische Hofkultur', 'Victoria and Albert Museum – Rococo',
    'https://www.vam.ac.uk/collections/rococo', [
      ['art', 'Rokoko: geschwungene, asymmetrische Ornamente', 'In Frankreich entwickelt sich seit den 1720er Jahren eine Gestaltung mit geschwungenen Linien und Motiven aus der Natur. Sie prägt besonders die dekorativen Künste.'],
      ['architecture', 'Rokoko im Innenraum', 'Asymmetrische Ornamente und bewegte Linien gehören zur Gestaltung repräsentativer Innenräume. Rokoko beschreibt eine Stilrichtung, keinen allgemeinen Baustandard aller Regionen.']
    ]),
  ...group('classicism', 1750, 1830, 'Europa; besonders fürstliche Residenzstädte', 'Deutsches Historisches Museum – Architektur im Vormärz',
    'https://www.dhm.de/lemo/kapitel/vormaerz-und-revolution/kunst-und-kultur/architektur', [
      ['architecture', 'Klassizismus: klare Formen und Säulenordnungen', 'Die Erforschung antiker Stätten verstärkt die Begeisterung für deren Baukunst. Geradlinige Fassaden und klassische Säulenordnungen prägen eine neue Architektur, besonders in Residenzstädten.'],
      ['culture', 'Die Antike als Forschungsgegenstand', 'Ausgrabungen etwa in Pompeji und Herculaneum fördern seit der Mitte des 18. Jahrhunderts die wissenschaftliche Beschäftigung mit antiker Kunst und Architektur. Dieses Wissen wirkt auf zeitgenössische Entwürfe zurück.']
    ]),
  ...group('biedermeier', 1800, 1849, 'Deutschsprachiger Raum; vor allem bürgerliche Milieus', 'Deutsches Historisches Museum – Biedermeier',
    'https://www.dhm.de/lemo/kapitel/vormaerz-und-revolution/kunst-und-kultur/biedermeier', [
      ['art', 'Porträt, Landschaft und häusliche Szene', 'Die später als Biedermeier bezeichnete Kunst richtet den Blick häufig auf Familie, Landschaft und überschaubare Lebenswelten. Diese Auswahl bildet vor allem bürgerliche Vorstellungen ab.'],
      ['architecture', 'Wohnen mit schlichten Möbeln', 'Praktische Formen, zurückhaltender Schmuck und Behaglichkeit prägen viele bürgerliche Einrichtungen. Ein Wohnstil beschreibt hier die Innenräume, nicht sämtliche Fassaden der Zeit.'],
      ['everyday', 'Familie und private Geselligkeit', 'Das häusliche Leben erhält in bürgerlichen Milieus besonderen kulturellen Stellenwert. Diese Lebensweise darf nicht mit den oft ganz anderen Arbeits- und Wohnbedingungen armer Familien gleichgesetzt werden.']
    ]),
  ...group('romantic', 1800, 1849, 'Deutschsprachiger Raum', 'Deutsches Historisches Museum – Romantik',
    'https://www.dhm.de/lemo/kapitel/vormaerz-und-revolution/kunst-und-kultur/romantik', [
      ['culture', 'Romantik in Literatur, Musik und Malerei', 'Gefühl, Natur und die Beschäftigung mit mittelalterlichen Stoffen verbinden verschiedene Künste. Romantik und bürgerliche Alltagskultur bestehen nebeneinander; eine Epoche besitzt mehrere Ausdrucksformen.']
    ]),
  ...group('historicism', 1850, 1913, 'Deutsche Staaten und europäische Kunstzentren', 'Deutsches Historisches Museum – Kunst und Kultur der Reaktionszeit',
    'https://www.dhm.de/lemo/kapitel/reaktionszeit/kunst-und-kultur', [
      ['architecture', 'Historismus: neue Bauten, ältere Formensprachen', 'Architekten greifen auf Romanik, Gotik, Renaissance und Barock zurück und kombinieren deren Formen. Ein neogotisches Gebäude ist deshalb nicht automatisch ein mittelalterlicher Bau.'],
      ['art', 'Realismus: Arbeit und Gegenwart als Bildthemen', 'Künstler nehmen Arbeitswelt, gesellschaftliche Verhältnisse und technische Veränderungen in den Blick. Neben repräsentativen Bildern entstehen kritische Darstellungen der Gegenwart.'],
      ['culture', 'Theater als bürgerlicher Kulturort', 'Bürgerliche Kultur orientiert sich unter anderem an klassischen Theaterstücken. Bühnen und repräsentative Kulturbauten gehören zum Selbstverständnis wachsender Städte.'],
      ['everyday', 'Industrialisierung verändert die Lebenswelten', 'Städte und Bürgertum gewinnen an Gewicht. Künstlerische Darstellungen von Arbeit und Alltag machen gesellschaftliche Unterschiede sichtbar; Wohlstand und kulturelle Teilhabe bleiben ungleich verteilt.']
    ]),
  ...group('great-war', 1914, 1918, 'Deutsches Reich', 'Deutsches Historisches Museum – Kunst und Kultur im Ersten Weltkrieg',
    'https://www.dhm.de/lemo/kapitel/erster-weltkrieg/kunst-und-kultur', [
      ['art', 'Kunst zwischen Propaganda und Widerspruch', 'Künstler reagieren unterschiedlich auf den Krieg: mit Zustimmung, Kritik oder anderen Bildthemen. Bildpropaganda und pazifistische Stimmen stehen einander gegenüber.'],
      ['culture', 'Unterhaltung trotz Krieg', 'Theater und Kinos bleiben Orte der Unterhaltung. Neben patriotischen Stücken suchen Menschen auch Ablenkung durch Komödien und unmilitärische Geschichten.']
    ], {fromMonth: 8}),
  ...group('weimar', 1919, 1932, 'Deutschland, besonders die Großstädte', 'Deutsches Historisches Museum – Kunst und Kultur der Weimarer Republik',
    'https://www.dhm.de/lemo/kapitel/weimarer-republik/kunst-und-kultur', [
      ['art', 'Experiment und kritischer Blick', 'Künstler erproben neue Ausdrucksformen und setzen sich kritisch mit Gesellschaft und Alltag auseinander. Avantgarde und traditionelle Kunstvorstellungen bestehen gleichzeitig.'],
      ['culture', 'Kino, Tanz und neue Öffentlichkeit', 'Film, Musik, Tanz und Massensport prägen neue Freizeitangebote. Das Bild der „Goldenen Zwanziger“ beschreibt dabei nicht die Lebenslage aller Menschen.']
    ]),
  ...group('ns-control', 1933, 1945, 'Deutschland unter der NS-Diktatur', 'Deutsches Historisches Museum – Kunst im NS-Regime',
    'https://www.dhm.de/lemo/kapitel/ns-regime/kunst', [
      ['art', 'Verfolgung und Ausschluss von Künstlern', 'Das NS-Regime verfolgt jüdische und politisch missliebige Kunstschaffende und bekämpft moderne Kunst. Berufsverbote, Zensur und Exil zerstören künstlerische Lebenswege.'],
      ['architecture', 'Gestaltung unter staatlicher Kontrolle', 'Auch Architektur und angewandte Künste unterliegen der nationalsozialistischen Kulturpolitik. Staatliche Repräsentation darf nicht von Unterdrückung und rassistischer Ausgrenzung getrennt betrachtet werden.'],
      ['culture', 'Kultur als Propagandainstrument', 'Die Diktatur kontrolliert kulturelle Berufe und nutzt insbesondere Film und Rundfunk zur Propaganda. Selbstbestimmte Öffentlichkeit wird gewaltsam eingeschränkt.'],
      ['everyday', 'Eingeschränkter Zugang zu Kunst und Wissen', 'Zensur, Ausgrenzung und ideologische Kontrolle bestimmen, wer öffentlich arbeiten und welche Werke verbreitet werden dürfen. Die Folgen betreffen sowohl Kunstschaffende als auch ihr Publikum.']
    ], {fromMonth: 2, toMonth: 4}),
  ...group('postwar-culture', 1945, 1949, 'Besatzungszonen in Deutschland', 'Haus der Geschichte – Kulturelle Neuanfänge',
    'https://www.hdg.de/lemo/kapitel/nachkriegsjahre/neuanfaenge/kultur', [
      ['art', 'Verbotene Kunst wird wieder zugänglich', 'Nach Kriegsende werden zuvor verdrängte Werke wieder gezeigt und gespielt. Die Wiederaufnahme des Kulturlebens erfolgt unter Aufsicht und mit Unterstützung der Besatzungsmächte.'],
      ['culture', 'Kultur beginnt unter schwierigen Bedingungen neu', 'Theater, Konzerte und Museen nehmen ihre Arbeit wieder auf. Papiermangel erschwert Publikationen; ausländische Bücher und Filme öffnen neue Perspektiven.']
    ], {fromMonth: 5}),
  ...group('postwar-daily', 1945, 1949, 'Deutschland nach dem Zweiten Weltkrieg', 'Haus der Geschichte – Alltag in den Nachkriegsjahren',
    'https://www.hdg.de/lemo/kapitel/nachkriegsjahre/alltag', [
      ['architecture', 'Trümmer und knapper Wohnraum', 'Zerstörte Städte und Wohnungsmangel bestimmen die unmittelbare Nachkriegszeit. Unterkünfte und Reparaturen sind dringlicher als ein einheitlicher neuer Baustil.'],
      ['everyday', 'Versorgen, improvisieren, Angehörige suchen', 'Hunger, Kälte und fehlende Güter prägen den Alltag vieler Menschen. Familien suchen vermisste Angehörige; vorhandene Gegenstände werden für neue Zwecke umgearbeitet.']
    ], {fromMonth: 5}),
  ...group('divided-culture', 1950, 1964, 'Bundesrepublik und DDR; unterschiedliche politische Bedingungen', 'Haus der Geschichte – Gründerjahre',
    'https://www.hdg.de/lemo/kapitel/geteiltes-deutschland-gruenderjahre.html', [
      ['culture', 'Kino und Hörfunk im geteilten Deutschland', 'Unterhaltung findet in beiden deutschen Staaten ein großes Publikum. Literatur, Presse und Film stehen dabei in verschiedenen politischen und gesellschaftlichen Zusammenhängen.'],
      ['everyday', 'Verschiedene Wege durch die Nachkriegszeit', 'Westdeutsche Konsum- und Jugendkultur erhält amerikanische Impulse. In der DDR sind Arbeitsleben und Versorgung durch Zentralplanung und politische Kontrolle geprägt.']
    ]),
  ...group('housing', 1950, 1989, 'Bundesrepublik Deutschland', 'Haus der Geschichte – Stadtplanung und Wohnungsbau',
    'https://www.hdg.de/lemo/kapitel/geteiltes-deutschland-gruenderjahre/wirtschaft-und-gesellschaft-im-westen/stadtplanung-und-wohnungsbau.html', [
      ['architecture', 'Wohnungsbau und die gegliederte Stadt', 'Sozialer Wohnungsbau und Eigenheimförderung sollen Wohnraummangel lindern. Viele Planungen trennen Wohnen, Arbeit und Verkehr und sehen Grünflächen vor. Diese Karte beschreibt die Bundesrepublik.'],
      ['everyday', 'Die Wohnung als gesellschaftliche Aufgabe', 'Staatliche Förderung unterstützt seit den frühen 1950er Jahren den Neubau. Mietwohnungen und Eigenheime stehen für verschiedene Wege zu mehr Wohnraum.']
    ], {fromMonth: 4}),
  ...group('hippie', 1970, 1980, 'Westliche Jugendkultur; Beispiel Bundesrepublik', 'Haus der Geschichte – Partytonne mit Jimi Hendrix, 1970',
    'https://www.hdg.de/lemo/bestand/objekt/alltagskultur-partytonne-mit-jimi-hendrix.html', [
      ['art', 'Bunte Gestaltung jenseits des Museums', 'Ein bemaltes Sitzfass mit Jimi-Hendrix-Motiv verbindet kräftige Farben und Popmusik. Das Museumsobjekt von 1970 zeigt, wie Jugendkultur auch Gebrauchsgegenstände prägt.'],
      ['culture', 'Rockmusik und Hippiekultur', 'Die seit den späten 1960er Jahren verbreitete Hippiekultur verbindet Musik, auffällige Gestaltung und gesellschaftlichen Protest. Sie ist eine Strömung unter mehreren, kein Lebensstil aller Jugendlichen.'],
      ['everyday', 'Ein Sitzfass als Zeitzeugnis', 'Eine „Partytonne“ macht aus einem Fass ein Sitzmöbel mit Musikermotiv. Dieses konkrete Objekt zeigt einen spielerischen Umgang mit Wohnen und Freizeit.']
    ]),
  ...group('network-art', 1995, 2026, 'Internationale Netzkultur; Beispiel Karlsruhe', 'ZKM – Institut für Netzentwicklung',
    'https://zkm.de/de/institut-fuer-netzentwicklung', [
      ['art', 'Das Netz wird künstlerisches Material', 'Seit Mitte der 1990er Jahre arbeiten Künstler mit dem World Wide Web als Medium. Vernetzung und Beteiligung werden Bestandteil von Werken, nicht nur Wege zur Veröffentlichung.'],
      ['culture', 'Kunst zwischen Disziplinen', 'Netzprojekte verbinden unter anderem bildende Kunst, Musik und Literatur. Neue technische Möglichkeiten verändern die Zusammenarbeit und den Zugang zu künstlerischen Experimenten.'],
      ['everyday', 'Beteiligung über den Bildschirm', 'Netzkunst untersucht, wie Menschen über vernetzte Computer kommunizieren und mitwirken. Das beschreibt eine neue Praxis, nicht einen bereits gleichen Internetzugang für alle Haushalte.']
    ]),
  ...group('reichstag', 1999, 2026, 'Berlin; ein konkretes Architekturbeispiel', 'Deutscher Bundestag – Die Kuppel',
    'https://www.bundestag.de/besuche/architektur/reichstag/kuppel', [
      ['architecture', 'Historischer Bau mit moderner Glaskuppel', 'Norman Fosters neue Reichstagskuppel verbindet Stahl und Glas mit dem historischen Gebäude. Besucherrampen sowie die Führung von Licht und Luft gehören zum Entwurf.']
    ], {fromMonth: 4})
];

export function knowledgeForDate(year: number, month: number, topic?: KnowledgeTopic): EraKnowledge[] {
  const date = year * 12 + month;
  return ERA_KNOWLEDGE.filter(item => (!topic || item.topic === topic)
    && date >= item.from * 12 + (item.fromMonth ?? 1)
    && date <= item.to * 12 + (item.toMonth ?? 12));
}

/** Stable across save/load; this is a reading recommendation, never a dated event. */
export function knowledgeSpotlight(year: number, month: number): EraKnowledge | undefined {
  const entries = knowledgeForDate(year, month);
  return entries.length ? entries[((year * 12 + month - 1) % entries.length + entries.length) % entries.length] : undefined;
}
