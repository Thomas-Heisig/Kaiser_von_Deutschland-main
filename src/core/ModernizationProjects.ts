import type { Kingdom, KingdomInfrastructure, KingdomStats } from './Kingdom';
export type ModernizationId = string;
export interface ModernizationProject {
  id:ModernizationId;name:string;year:number;until?:number;requiredTechnology:string;
  requires?:keyof KingdomInfrastructure;kind?:'construction'|'modernization';
  cost:{gold:number;wood:number;stone:number;iron:number};description:string;effect:string;
  stat?:keyof KingdomStats;gain?:number;happiness?:number;
}
/** Availability windows are game balancing, not claims of local construction dates. */
export const MODERNIZATION_PROJECTS: readonly ModernizationProject[] = [
  {id:'village-well',name:'Gefasste Wasserstelle',year:-1999,until:1849,requiredTechnology:'masonry',kind:'construction',cost:{gold:280,wood:100,stone:140,iron:0},description:'Eine gemeinschaftliche Wasserstelle verbessert die Versorgung. Abstraktes Bauvorhaben der Spielgemeinschaft.',effect:'+4 Stabilität, +3 Zufriedenheit',stat:'stability',gain:4,happiness:3},
  {id:'granary',name:'Gemeinschaftsspeicher',year:-1999,until:1749,requires:'farms',requiredTechnology:'agriculture',kind:'construction',cost:{gold:420,wood:220,stone:80,iron:0},description:'Ein eigener Vorratsbau organisiert die Verteilung der Ernte.',effect:'+5 Stabilität',stat:'stability',gain:5},
  {id:'craft-yard',name:'Überdachter Werkplatz',year:-1999,until:1749,requires:'workshops',requiredTechnology:'bronze_working',kind:'construction',cost:{gold:500,wood:240,stone:120,iron:0},description:'Der bestehende Handwerksbezirk erhält einen geschützten Arbeits- und Tauschplatz.',effect:'+5 Handelsmacht',stat:'tradePower',gain:5},
  {id:'field-rotation',name:'Geordnete Feldwirtschaft',year:900,until:1799,requires:'farms',requiredTechnology:'agriculture',cost:{gold:650,wood:240,stone:100,iron:40},description:'Bestehende Höfe stimmen Anbau und gemeinschaftliche Nutzung ab.',effect:'+5 Stabilität, +2 Zufriedenheit',stat:'stability',gain:5,happiness:2},
  {id:'market-hall',name:'Markthalle',year:1100,requires:'markets',requiredTechnology:'guilds',kind:'construction',cost:{gold:1600,wood:500,stone:600,iron:80},description:'Überdachte Stände erweitern den vorhandenen Marktplatz.',effect:'+8 Handelsmacht',stat:'tradePower',gain:8},
  {id:'reading-house',name:'Druck- und Lesestube',year:1450,until:1899,requires:'schools',requiredTechnology:'printing_press',kind:'construction',cost:{gold:1800,wood:450,stone:200,iron:100},description:'Eine Druck- und Lesestube ergänzt die örtlichen Bildungsstätten.',effect:'+6 Bildung',stat:'literacyRate',gain:6},
  {id:'waterworks',name:'Wasserwerk',year:1850,requires:'hospitals',requiredTechnology:'steam_power',kind:'construction',cost:{gold:5000,wood:400,stone:1200,iron:450},description:'Eine zentrale Versorgung ergänzt bestehende Gesundheitsbauten.',effect:'+8 Stabilität, +5 Zufriedenheit',stat:'stability',gain:8,happiness:5},
  {id:'public-library',name:'Öffentliche Bibliothek',year:1850,requires:'schools',requiredTechnology:'printing_press',kind:'construction',cost:{gold:3200,wood:650,stone:700,iron:80},description:'Eine öffentliche Sammlung macht Bücher und Lernplätze zugänglich.',effect:'+8 Bildung, +3 Zufriedenheit',stat:'literacyRate',gain:8,happiness:3},
  {id:'solar-workshops',name:'Erneuerbare Werkstattversorgung',year:2000,requires:'workshops',requiredTechnology:'renewable_energy',cost:{gold:12000,wood:200,stone:700,iron:900},description:'Die eigenen Werkstätten erhalten eine dezentrale Energieversorgung.',effect:'+10 Handelsmacht',stat:'tradePower',gain:10},
  { id:'manufacturing',requires:'workshops', name:'Mechanisierte Manufakturen',year:1760,requiredTechnology:'steam_power',cost:{gold:6000,wood:500,stone:800,iron:450},description:'Dampfkraft modernisiert bestehende Werkstätten.',effect:'+8 Handelsmacht' },
  { id:'rail-network',requires:'roads',name:'Eisenbahnnetz',year:1825,requiredTechnology:'railways',cost:{gold:10000,wood:1000,stone:1100,iron:800},description:'Schienen verbinden Märkte und Produktionsstätten.',effect:'+12 Handelsmacht' },
  { id:'power-grid',requires:'markets',name:'Elektrizitätsnetz',year:1880,requiredTechnology:'electricity',cost:{gold:12000,wood:600,stone:1500,iron:1200},description:'Die Städte erhalten eine grundlegende Stromversorgung.',effect:'+8 Stabilität' },
  { id:'broadcast',requires:'schools',name:'Rundfunkhäuser',year:1900,requiredTechnology:'radio',cost:{gold:9000,wood:800,stone:700,iron:650},description:'Rundfunk verbindet die Bevölkerung.',effect:'+12 Kultur' },
  { id:'digital-government',requires:'schools',name:'Digitale Verwaltung',year:1990,requiredTechnology:'computers',cost:{gold:18000,wood:300,stone:850,iron:1100},description:'Computer unterstützen die Verwaltung, statt Bürgerberater zu ersetzen.',effect:'+10 Stabilität' },
  { id:'smart-cities',requires:'markets',name:'Vernetzte Städte',year:2020,requiredTechnology:'artificial_intelligence',cost:{gold:25000,wood:800,stone:1800,iron:1800},description:'Intelligente Infrastruktur begleitet das Leben im Zukunftsreich.',effect:'+12 Kultur, +8 Stabilität' }
];
export function applyModernization(project: ModernizationProject, kingdom: Kingdom): void {
  const cap = (v:number)=>Math.max(0,Math.min(100,v));
  if(project.stat)kingdom.stats[project.stat]=cap(kingdom.stats[project.stat]+(project.gain??0));
  if(project.happiness)kingdom.happiness=cap(kingdom.happiness+project.happiness);
  if (project.id==='manufacturing') kingdom.stats.tradePower=cap(kingdom.stats.tradePower+8);
  if (project.id==='rail-network') kingdom.stats.tradePower=cap(kingdom.stats.tradePower+12);
  if (project.id==='power-grid') kingdom.stats.stability=cap(kingdom.stats.stability+8);
  if (project.id==='broadcast') kingdom.stats.culturalInfluence=cap(kingdom.stats.culturalInfluence+12);
  if (project.id==='digital-government') kingdom.stats.stability=cap(kingdom.stats.stability+10);
  if (project.id==='smart-cities') {kingdom.stats.culturalInfluence=cap(kingdom.stats.culturalInfluence+12); kingdom.stats.stability=cap(kingdom.stats.stability+8);}
}
