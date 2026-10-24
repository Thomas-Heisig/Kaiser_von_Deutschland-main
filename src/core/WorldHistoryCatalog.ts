export type HistoryKind = 'invention' | 'science' | 'art' | 'culture' | 'society' | 'future';
export interface WorldMilestone {
  id: string; year: number; title: string; kind: HistoryKind; description: string;
  place: string; sourceTitle: string; sourceUrl: string; speculative?: boolean;
}
const milestoneEntries: WorldMilestone[] = [
  {id:'durer-self-portrait',year:1500,title:'Dürers Selbstbildnis im Pelzrock',kind:'art',description:'Albrecht Dürer malt sein frontales Selbstbildnis im Pelzrock. Er bezeichnet sich in der Bildinschrift als 28-jährigen Künstler aus Nürnberg.',place:'Nürnberg',sourceTitle:'Bayerische Staatsgemäldesammlungen – Selbstbildnis im Pelzrock',sourceUrl:'https://www.sammlung.pinakothek.de/de/artwork/Qlx2QpQ4Xq'},
  {id:'east-india-charter',year:1600,title:'Gründung der englischen East India Company',kind:'society',description:'Am 31. Dezember erhält die englische East India Company ihre königliche Gründungsurkunde von Elisabeth I.',place:'England',sourceTitle:'Library of Congress – Guide to the records in the India Office',sourceUrl:'https://tile.loc.gov/storage-services/service/gdc/gdclccn/23/00/48/26/23004826/23004826.pdf'},
  {id:'oersted',year:1820,title:'Elektrizität und Magnetismus hängen zusammen',kind:'science',description:'Hans Christian Ørsted veröffentlicht seine Beobachtung, dass elektrischer Strom eine Kompassnadel ablenkt.',place:'Kopenhagen',sourceTitle:'DTU Physics – History',sourceUrl:'https://physics.dtu.dk/About/history/DTU-Physics-History'},
  {id:'bismarck-dismissal',year:1890,title:'Bismarck wird entlassen',kind:'society',description:'Am 20. März endet Otto von Bismarcks Amtszeit als Reichskanzler. Leo von Caprivi wird sein Nachfolger.',place:'Berlin',sourceTitle:'Deutsches Historisches Museum – Jahreschronik 1890',sourceUrl:'https://www.dhm.de/lemo/jahreschronik/1890'},
  {id:'paris-charter',year:1200,title:'Königlicher Schutz für die Universität Paris',kind:'culture',description:'Philipp II. August bestätigt mit einem königlichen Privileg die Autonomie der Pariser Universitätsgemeinschaft.',place:'Paris',sourceTitle:'Sorbonne – Geschichte der Universität Paris',sourceUrl:'https://www.sorbonne.fr/wp-content/uploads/Livret_PDC-2015_BAT.pdf'},
  {id:'first-jubilee',year:1300,title:'Das erste Heilige Jahr',kind:'society',description:'Papst Bonifatius VIII. ruft das erste Heilige Jahr aus. Zahlreiche Pilger reisen nach Rom.',place:'Rom',sourceTitle:'Vatican News – Origins of the Christian Jubilee',sourceUrl:'https://www.vaticannews.va/en/vatican-city/news/2024-04/origins-christian-jubilee-pope-saint-boniface.html'},
  {id:'ruprecht-election',year:1400,title:'Ruprecht wird zum König gewählt',kind:'society',description:'Nach der Absetzung Wenzels wählen die rheinischen Kurfürsten Ruprecht von der Pfalz zum römischen König.',place:'Rheinland',sourceTitle:'Historisches Lexikon Bayerns – Königtum Ruprechts',sourceUrl:'https://www.historisches-lexikon-bayerns.de/Lexikon/Artikel_45754'},
  {id:'bach-death',year:1750,title:'Johann Sebastian Bach stirbt',kind:'art',description:'Am 28. Juli stirbt Johann Sebastian Bach in Leipzig, wo er seit 1723 als Thomaskantor gewirkt hat.',place:'Leipzig',sourceTitle:'Leipzig Tourismus – Auf den Spuren von Bach',sourceUrl:'https://www.leipzig.travel/recherchetext/auf-den-spuren-von-bach-in-leipzig-1'},
  {id:'war-end-europe',year:1945,title:'Ende des Zweiten Weltkriegs in Europa',kind:'society',description:'Die bedingungslose Kapitulation der deutschen Streitkräfte tritt am 8. Mai in Kraft. Der Krieg in Europa endet.',place:'Europa',sourceTitle:'US National Archives – Surrender of Germany',sourceUrl:'https://www.archives.gov/milestone-documents/surrender-of-germany'},
  {id:'warsaw-treaty',year:1970,title:'Der Warschauer Vertrag',kind:'society',description:'Am 7. Dezember unterzeichnen die Bundesrepublik und Polen den Warschauer Vertrag zur Normalisierung ihrer Beziehungen.',place:'Warschau',sourceTitle:'Auswärtiges Amt – Warschauer Vertrag',sourceUrl:'https://archiv.diplo.de/arc-de/aktuelles/55-jahre-warschauer-vertrag-2747340'},
  {id:'expo-hannover',year:2000,title:'Weltausstellung in Hannover',kind:'culture',description:'Vom 1. Juni bis 31. Oktober findet die Expo unter dem Motto „Mensch – Natur – Technik“ statt.',place:'Hannover',sourceTitle:'Bureau International des Expositions – Expo 2000',sourceUrl:'https://bie-expo.bie-paris.org/site/en/2000-hannover?layout=bieparis%3Aexpo&view=bieexpo'},
  {id:'university-bologna',year:1088,title:'Universität Bologna',kind:'culture',description:'Bologna wird traditionell als älteste Universität Europas bezeichnet und prägt die Entwicklung gelehrter Einrichtungen.',place:'Bologna',sourceTitle:'Università di Bologna – History',sourceUrl:'https://www.unibo.it/en/university/who-we-are/our-history'},
  {id:'gothic-notredame',year:1163,title:'Notre-Dame de Paris',kind:'art',description:'Mit dem Baubeginn der Kathedrale verbreiten sich monumentale gotische Bauformen.',place:'Paris',sourceTitle:'Notre-Dame de Paris – History',sourceUrl:'https://www.notredamedeparis.fr/en/understand/history/'},
  {id:'magna-carta',year:1215,title:'Magna Carta',kind:'society',description:'In England wird eine Urkunde besiegelt, die königliche Macht und Rechte neu verhandelt.',place:'England',sourceTitle:'UK Parliament – Magna Carta',sourceUrl:'https://www.parliament.uk/magnacarta/'},
  {id:'renaissance-florence',year:1401,title:'Florentiner Renaissance',kind:'art',description:'Der Wettbewerb um die Baptisteriumstüren gilt als wichtige Station der frühen Renaissancekunst.',place:'Florenz',sourceTitle:'Encyclopaedia Britannica – Renaissance art',sourceUrl:'https://www.britannica.com/art/Renaissance-art'},
  {id:'printing',year:1450,title:'Buchdruck mit beweglichen Lettern',kind:'invention',description:'Gutenbergs Drucktechnik verändert die Verbreitung von Wissen in Europa; die Entwicklung ist zeitlich nur näherungsweise zu datieren.',place:'Mainz',sourceTitle:'Encyclopaedia Britannica – Johannes Gutenberg',sourceUrl:'https://www.britannica.com/biography/Johannes-Gutenberg'},
  {id:'copernicus',year:1543,title:'Heliozentrisches Weltbild',kind:'science',description:'Kopernikus veröffentlicht sein Werk über die Bewegung der Himmelskörper.',place:'Nürnberg',sourceTitle:'Encyclopaedia Britannica – Copernicus',sourceUrl:'https://www.britannica.com/biography/Nicolaus-Copernicus'},
  {id:'galileo',year:1610,title:'Entdeckungen mit dem Fernrohr',kind:'science',description:'Galileis Beobachtungen von Jupitermonden und Venusphasen verändern astronomische Debatten.',place:'Italien',sourceTitle:'NASA – Galileo',sourceUrl:'https://science.nasa.gov/solar-system/galileo-galilei/'},
  {id:'newton',year:1687,title:'Newtons Principia',kind:'science',description:'Newtons mathematische Naturbeschreibung legt Grundlagen der klassischen Mechanik.',place:'England',sourceTitle:'Encyclopaedia Britannica – Principia',sourceUrl:'https://www.britannica.com/topic/Principia'},
  {id:'steam',year:1769,title:'Verbesserte Dampfmaschine',kind:'invention',description:'James Watt erhält ein Patent auf technische Verbesserungen der Dampfmaschine.',place:'Großbritannien',sourceTitle:'Science Museum – James Watt',sourceUrl:'https://www.sciencemuseum.org.uk/objects-and-stories/james-watt-and-steam-engine'},
  {id:'impressionism',year:1874,title:'Erste Impressionisten-Ausstellung',kind:'art',description:'Künstler stellen in Paris unabhängig vom offiziellen Salon aus.',place:'Paris',sourceTitle:'The Met – Impressionism',sourceUrl:'https://www.metmuseum.org/toah/hd/imml/hd_imml.htm'},
  {id:'telephone',year:1876,title:'Telefonpatent',kind:'invention',description:'Alexander Graham Bell erhält ein bedeutendes Telefonpatent; mehrere Erfinder waren an der Entwicklung beteiligt.',place:'USA',sourceTitle:'Library of Congress – Bell',sourceUrl:'https://www.loc.gov/collections/alexander-graham-bell-papers/about-this-collection/'},
  {id:'cinema',year:1895,title:'Öffentliche Filmvorführungen',kind:'culture',description:'Die Brüder Lumière prägen die frühe öffentliche Filmkultur.',place:'Paris',sourceTitle:'Institut Lumière',sourceUrl:'https://www.institut-lumiere.org/'},
  {id:'relativity',year:1905,title:'Spezielle Relativitätstheorie',kind:'science',description:'Einsteins Veröffentlichungen von 1905 verändern die Physik.',place:'Bern',sourceTitle:'Einstein Online – Relativity',sourceUrl:'https://www.einstein-online.info/en/spotlight/special_relativity/'},
  {id:'bauhaus',year:1919,title:'Bauhaus gegründet',kind:'art',description:'Walter Gropius gründet eine einflussreiche Schule für Gestaltung und Architektur.',place:'Weimar',sourceTitle:'Bauhaus Dessau – History',sourceUrl:'https://bauhaus-dessau.de/en/'},
  {id:'penicillin',year:1928,title:'Penicillin entdeckt',kind:'science',description:'Alexander Fleming beobachtet die antibakterielle Wirkung eines Schimmelpilzes.',place:'London',sourceTitle:'Nobel Prize – Fleming',sourceUrl:'https://www.nobelprize.org/prizes/medicine/1945/fleming/facts/'},
  {id:'transistor',year:1947,title:'Transistor',kind:'invention',description:'Ein elektronisches Bauteil ermöglicht die Miniaturisierung von Computern.',place:'Bell Labs, USA',sourceTitle:'Computer History Museum – Transistor',sourceUrl:'https://computerhistory.org/blog/the-transistor-and-the-computer/'},
  {id:'moon',year:1969,title:'Menschen auf dem Mond',kind:'science',description:'Apollo 11 bringt erstmals Menschen auf die Mondoberfläche.',place:'Mond',sourceTitle:'NASA – Apollo 11',sourceUrl:'https://www.nasa.gov/mission/apollo-11/'},
  {id:'web',year:1989,title:'World Wide Web vorgeschlagen',kind:'invention',description:'Tim Berners-Lee beschreibt am CERN ein vernetztes Informationssystem.',place:'Genf',sourceTitle:'CERN – Birth of the Web',sourceUrl:'https://home.cern/science/computing/birth-web'},
  {id:'genome',year:2003,title:'Humangenomprojekt abgeschlossen',kind:'science',description:'Das internationale Projekt erklärt die Sequenzierung des menschlichen Genoms für abgeschlossen.',place:'International',sourceTitle:'NHGRI – Human Genome Project',sourceUrl:'https://www.genome.gov/human-genome-project'},
  {id:'crispr',year:2012,title:'CRISPR-Cas9 als Werkzeug',kind:'science',description:'Forschende zeigen, wie das System für gezielte Genomveränderungen eingesetzt werden kann.',place:'International',sourceTitle:'Nobel Prize – Chemistry 2020',sourceUrl:'https://www.nobelprize.org/prizes/chemistry/2020/summary/'},
  {id:'fusion-future',year:2050,title:'Fusionsenergie in Städten?',kind:'future',description:'Mögliches Zukunftsszenario des Spiels: kommerzielle Fusion ist nicht für dieses Jahr gesichert.',place:'Zukunftsszenario',sourceTitle:'ITER – Research',sourceUrl:'https://www.iter.org/',speculative:true},
  {id:'space-future',year:2150,title:'Dauerhafte Siedlungen außerhalb der Erde?',kind:'future',description:'Fiktive Entwicklung für die Zukunftskampagne, keine historische Tatsache oder verlässliche Prognose.',place:'Zukunftsszenario',sourceTitle:'NASA – Moon to Mars',sourceUrl:'https://www.nasa.gov/humans-in-space/',speculative:true}
]; 
export const WORLD_MILESTONES: readonly WorldMilestone[] = milestoneEntries.sort((a,b)=>a.year-b.year);
export function epochForYear(year:number): string {
  if(year<500) return 'Antike';
  if(year<1500) return 'Mittelalter';
  if(year<1800) return 'Frühe Neuzeit';
  if(year<1914) return 'Industrialisierung';
  if(year<1945) return 'Moderne';
  if(year<2000) return 'Zeitgeschichte';
  if(year<=2026) return 'Digitales Zeitalter';
  return 'Alternative Zukunft';
}
export function milestonesThrough(year:number): WorldMilestone[] {
  return WORLD_MILESTONES.filter(m=>m.year<=year);
}
export function milestonesInYear(year:number): WorldMilestone[] {
  return WORLD_MILESTONES.filter(m=>m.year===year);
}

/** No invented annual entries: older context stays explicitly dated, fiction is excluded. */
export function historicalYearReport(year: number): { exact: boolean; entries: WorldMilestone[] } {
  const known = WORLD_MILESTONES.filter(item => !item.speculative && item.kind !== 'future' && item.year <= year);
  const exact = known.filter(item => item.year === year);
  return { exact: exact.length > 0, entries: exact.length ? exact : known.slice(-1) };
}
