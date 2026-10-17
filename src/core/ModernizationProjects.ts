import type { Kingdom } from './Kingdom';
export type ModernizationId = 'manufacturing' | 'rail-network' | 'power-grid' | 'broadcast' | 'digital-government' | 'smart-cities';
export interface ModernizationProject { id: ModernizationId; name: string; year: number; requiredTechnology: string; cost: { gold: number; wood: number; stone: number; iron: number }; description: string; effect: string; }
export const MODERNIZATION_PROJECTS: readonly ModernizationProject[] = [
  { id:'manufacturing', name:'Mechanisierte Manufakturen',year:1760,requiredTechnology:'steam_power',cost:{gold:6000,wood:500,stone:800,iron:450},description:'Dampfkraft modernisiert bestehende Werkstätten.',effect:'+8 Handelsmacht' },
  { id:'rail-network',name:'Eisenbahnnetz',year:1825,requiredTechnology:'railways',cost:{gold:10000,wood:1000,stone:1100,iron:800},description:'Schienen verbinden Märkte und Produktionsstätten.',effect:'+12 Handelsmacht' },
  { id:'power-grid',name:'Elektrizitätsnetz',year:1880,requiredTechnology:'electricity',cost:{gold:12000,wood:600,stone:1500,iron:1200},description:'Die Städte erhalten eine grundlegende Stromversorgung.',effect:'+8 Stabilität' },
  { id:'broadcast',name:'Rundfunkhäuser',year:1900,requiredTechnology:'radio',cost:{gold:9000,wood:800,stone:700,iron:650},description:'Rundfunk verbindet die Bevölkerung.',effect:'+12 Kultur' },
  { id:'digital-government',name:'Digitale Verwaltung',year:1990,requiredTechnology:'computers',cost:{gold:18000,wood:300,stone:850,iron:1100},description:'Computer unterstützen die Verwaltung, statt Bürgerberater zu ersetzen.',effect:'+10 Stabilität' },
  { id:'smart-cities',name:'Vernetzte Städte',year:2020,requiredTechnology:'artificial_intelligence',cost:{gold:25000,wood:800,stone:1800,iron:1800},description:'Intelligente Infrastruktur begleitet das Leben im Zukunftsreich.',effect:'+12 Kultur, +8 Stabilität' }
];
export function applyModernization(project: ModernizationProject, kingdom: Kingdom): void {
  const cap = (v:number)=>Math.max(0,Math.min(100,v));
  if (project.id==='manufacturing') kingdom.stats.tradePower=cap(kingdom.stats.tradePower+8);
  if (project.id==='rail-network') kingdom.stats.tradePower=cap(kingdom.stats.tradePower+12);
  if (project.id==='power-grid') kingdom.stats.stability=cap(kingdom.stats.stability+8);
  if (project.id==='broadcast') kingdom.stats.culturalInfluence=cap(kingdom.stats.culturalInfluence+12);
  if (project.id==='digital-government') kingdom.stats.stability=cap(kingdom.stats.stability+10);
  if (project.id==='smart-cities') {kingdom.stats.culturalInfluence=cap(kingdom.stats.culturalInfluence+12); kingdom.stats.stability=cap(kingdom.stats.stability+8);}
}
