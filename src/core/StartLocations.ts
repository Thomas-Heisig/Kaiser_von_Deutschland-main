/** Real starting regions. Adding another region requires its own sourced map pack. */
export const DEFAULT_START_LOCATION = 'ganderkesee';
export interface StartLocation {
  id: string; name: string; modernRegion: string; mapAsset: string; terrainAsset: string;
  description: string; sourceTitle: string; sourceUrl: string;
}
export const START_LOCATIONS: readonly StartLocation[] = [{
  id: DEFAULT_START_LOCATION, name: 'Ganderkesee', modernRegion: 'heutiges Niedersachsen',
  mapAsset: 'maps/ganderkesee-map.json', terrainAsset: 'maps/ganderkesee-terrain.webp',
  description: 'Deine Herrschaft beginnt auf der Ganderkeseer Geest. Flachwellige Höhen, Bachniederungen und sandige Böden prägen den Raum zwischen Weser und Hunte. Die heutige Ortsmitte dient als Kartenanker; deine Siedlung ist ein Spielmodell.',
  sourceTitle: 'Niedersächsisches Landesarchiv · Gemeinde Ganderkesee',
  sourceUrl: 'https://www.arcinsys.niedersachsen.de/arcinsys/showFondsDetails?fondsId=2877'
}];
export function startLocation(id: unknown = DEFAULT_START_LOCATION): StartLocation {
  const location = START_LOCATIONS.find(item => item.id === id);
  if (!location) throw new RangeError('Unbekannter Startort im Spielstand.');
  return location;
}
export function localPlaceName(year: number): string {
  return year < 860 ? 'Geest am heutigen Ganderkesee' : year < 1200 ? 'Gandrikesarde · heute Ganderkesee' : 'Ganderkesee';
}
export interface LocalLandmark {
  id: string; point: string; title: string; mapLabel: string; from: number;
  description: string; evidence: string; sourceTitle: string; sourceUrl: string;
}
const MEGALITH_SOURCE = 'https://os1.meinecloud.io/b10294/wildeshausergeest.org/pdf/Broschueren/Routenfuehrer_Radroute_der_Megalithkultur_2022_komprimiert.pdf';
const CULTURE_SOURCE = 'https://www.ganderkesee.de/leben/kultur/';
export function localLandmarks(year: number): LocalLandmark[] {
  const landmarks: LocalLandmark[] = [
    {id:'steinkimmen',point:'steinkimmen-ii',title:'Großsteingräber bei Steinkimmen',
      mapLabel:year < 860 ? 'Großsteingräber\nheute Steinkimmen' : 'Hünensteine · Steinkimmen',from:-2799,
      description:'Die jungsteinzeitlichen Steingräber sind beim Start 2000 v. Chr. bereits älter als die Spielfigur. Drei Anlagen liegen im heutigen Steinkimmen. Ihre heutige Erhaltung ist kein Abbild des damaligen Zustands.',
      evidence:'Jungsteinzeit, etwa 3500–2800 v. Chr.; heutige Ortsbezeichnung. Die Karte bündelt die nahe beieinanderliegenden Fundplätze.',
      sourceTitle:'Naturpark Wildeshauser Geest · Route der Megalithkultur',sourceUrl:MEGALITH_SOURCE},
    {id:'stenum',point:'stenum',title:'Großsteingrab bei Stenum',
      mapLabel:year < 860 ? 'Großsteingrab\nheute Stenum' : 'Großsteingrab · Stenum',from:-2799,
      description:'Ein weiterer jungsteinzeitlicher Grabbau liegt auf der Geest. Die mächtigen Findlinge verbinden diesen Ort mit der Megalithkultur Nordwesteuropas. Stenum ist hier ein heutiger Orientierungsname, kein belegter bronzezeitlicher Siedlungsname.',
      evidence:'Jungsteinzeitlicher Fundplatz; Lage nach den Koordinaten des offiziellen Routenführers.',
      sourceTitle:'Naturpark Wildeshauser Geest · Route der Megalithkultur',sourceUrl:MEGALITH_SOURCE},
    {id:'church',point:'home',title:year >= 1500 ? 'St. Cyprian und Cornelius' : 'Kirchenstandort Ganderkesee',
      mapLabel:year >= 1500 ? 'Gaukirche' : 'Kirchenstandort · 1052',from:1052,
      description:year >= 1500
        ? 'Die gotische Hallenkirche stammt aus dem 15. Jahrhundert; der ältere Turm und seine Eingangshalle gehen auf das 12. Jahrhundert zurück.'
        : 'Die Kirchengründung wird auf 1052 datiert. Der später erhaltene Turm stammt aus dem 12. Jahrhundert. Die heute sichtbare gotische Hallenkirche darf für dieses Spieljahr noch nicht vorausgesetzt werden.',
      evidence:'Gründung und spätere Bauphasen getrennt. Der Karteneintrag markiert den Standort, keine rekonstruierte Gebäudegestalt.',
      sourceTitle:'Gemeinde Ganderkesee · Kultur',sourceUrl:CULTURE_SOURCE},
    {id:'organ',point:'home',title:'Arp-Schnitger-Orgel',mapLabel:'Schnitger-Orgel · 1699',from:1699,
      description:'Die Orgel von Arp Schnitger ist seit 1699 ein besonderes Zeugnis der örtlichen Musikkultur. Sie gehört zur Geschichte der Gaukirche und erscheint erst ab diesem Jahr im lokalen Zeitbild.',
      evidence:'Jahresgenaue Datierung; kein erfundener Monat der Einweihung.',sourceTitle:'Gemeinde Ganderkesee · Kultur',sourceUrl:CULTURE_SOURCE}
  ];
  return landmarks.filter(item => item.from <= year);
}
export const LOCAL_MAP_NOTE = 'Heutiges Gelände und Gewässerachsen als Orientierung; historische Bachbetten und Siedlungsgrenzen sind nicht rekonstruiert.';
export const LOCAL_MAP_CREDIT = '© GeoBasis-DE/LGLN 2026, Daten geändert (CC BY 4.0) · Gewässer: LGLN/MU 2023 (dl-de/by-2-0)';
