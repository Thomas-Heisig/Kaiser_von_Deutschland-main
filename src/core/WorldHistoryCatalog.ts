export type HistoryKind = 'invention' | 'science' | 'art' | 'culture' | 'society' | 'future';
export interface WorldMilestone {
  id: string; year: number; title: string; kind: HistoryKind; description: string;
  place: string; sourceTitle: string; sourceUrl: string; speculative?: boolean;
}
const milestoneEntries: WorldMilestone[] = [
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
