import type { KingdomInfrastructure, Season } from '../core/Kingdom';
import type { ModernizationId } from '../core/ModernizationProjects';

export type DistrictCategory = 'versorgung' | 'stadt' | 'bildung' | 'wehr';
export type DistrictFilter = 'alle' | DistrictCategory;
/** Early campaigns reuse saved infrastructure slots with period-neutral functions. */
export function earlyBuildingName(type: keyof KingdomInfrastructure, year: number, fallback: string): string {
  if (year >= 500) return fallback;
  const names: Partial<Record<keyof KingdomInfrastructure, string>> = {
    churches: 'Kultstätte', castles: 'Befestigter Sitz', universities: 'Lehrstätte',
    schools: 'Lernhaus', guildhalls: 'Handwerkshaus', hospitals: 'Heilstätte',
    barracks: 'Wachlager', taverns: 'Versammlungshaus', ports: 'Anlegestelle'
  };
  return names[type] ?? fallback;
}
export interface SettlementDistrict {
  type: keyof KingdomInfrastructure;
  name: string;
  category: DistrictCategory;
  x: number;
  y: number;
  color: number;
}
export const SETTLEMENT_DISTRICTS: readonly SettlementDistrict[] = [
  { type: 'farms', name: 'Felder', category: 'versorgung', x: 152, y: 162, color: 0xc6ad70 },
  { type: 'mines', name: 'Bergwerke', category: 'versorgung', x: 855, y: 153, color: 0x99a49a },
  { type: 'ports', name: 'Hafen', category: 'versorgung', x: 148, y: 510, color: 0x8babb2 },
  { type: 'warehouses', name: 'Lager', category: 'versorgung', x: 357, y: 490, color: 0xbe9971 },
  { type: 'markets', name: 'Markt', category: 'stadt', x: 506, y: 320, color: 0xc78f68 },
  { type: 'guildhalls', name: 'Gilden', category: 'stadt', x: 685, y: 420, color: 0xc3a174 },
  { type: 'workshops', name: 'Werkstätten', category: 'stadt', x: 850, y: 390, color: 0xb8a072 },
  { type: 'taverns', name: 'Tavernen', category: 'stadt', x: 291, y: 341, color: 0xb08f70 },
  { type: 'roads', name: 'Straßen', category: 'stadt', x: 533, y: 515, color: 0xada18b },
  { type: 'schools', name: 'Schulen', category: 'bildung', x: 432, y: 157, color: 0xa9bda9 },
  { type: 'universities', name: 'Universität', category: 'bildung', x: 667, y: 134, color: 0xb3b3a0 },
  { type: 'hospitals', name: 'Heilkunst', category: 'bildung', x: 836, y: 513, color: 0x98b2a4 },
  { type: 'churches', name: 'Kirchen', category: 'bildung', x: 681, y: 281, color: 0xd4c5a1 },
  { type: 'barracks', name: 'Garnison', category: 'wehr', x: 305, y: 242, color: 0xb79279 },
  { type: 'walls', name: 'Stadtmauern', category: 'wehr', x: 348, y: 574, color: 0x9aada2 },
  { type: 'castles', name: 'Burg', category: 'wehr', x: 521, y: 78, color: 0xaeb9b0 }
];

const visualStages: Readonly<Partial<Record<keyof KingdomInfrastructure, ModernizationId>>> = {
  workshops: 'manufacturing',
  roads: 'rail-network',
  warehouses: 'power-grid',
  markets: 'broadcast',
  schools: 'digital-government',
  hospitals: 'smart-cities'
};
export function districtModernization(
  type: keyof KingdomInfrastructure, completed: readonly string[]
): ModernizationId | null {
  const required = visualStages[type];
  return required && completed.includes(required) ? required : null;
}
export function visibleDistricts(filter: DistrictFilter): readonly SettlementDistrict[] {
  return filter === 'alle' ? SETTLEMENT_DISTRICTS :
    SETTLEMENT_DISTRICTS.filter(place => place.category === filter);
}
export function districtSceneSignature(
  infrastructure: KingdomInfrastructure, selected: keyof KingdomInfrastructure,
  filter: DistrictFilter, season: Season, completed: readonly string[]
): string {
  return JSON.stringify([SETTLEMENT_DISTRICTS.map(place => infrastructure[place.type]),
    selected, filter, season, [...completed].sort()]);
}
export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter'
};
