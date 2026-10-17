import type { Kingdom } from './Kingdom';
export type CampaignId = 'aufbau' | 'hanse' | 'wissenschaft' | 'grenzland' | 'kultur' | 'kaiserkrone' | 'frei' | 'industrie' | 'wiederaufbau' | 'digital';
export interface CampaignDefinition { id: CampaignId; name: string; description: string; year: number; minYear?: number; maxYear?: number; }
export interface CampaignObjective { label: string; done: boolean }
export const CAMPAIGNS: readonly CampaignDefinition[] = [
  { id: 'frei', name: 'Offenes Spiel', description: 'Ohne Siegzwang: Geschichte und Reich frei gestalten.', year: 1200 },
  { id: 'aufbau', name: 'Ein neuer Anfang', description: 'Baue ein blühendes Lehen auf.', year: 1200, minYear: 1200, maxYear: 1500 },
  { id: 'hanse', name: 'Aufstieg der Hanse', description: 'Errichte Häfen und ein Handelsnetz.', year: 1200, minYear: 1200, maxYear: 1600 },
  { id: 'wissenschaft', name: 'Zeitalter des Wissens', description: 'Fördere Bildung und eigene Forschung.', year: 1200, minYear: 1500, maxYear: 9999 },
  { id: 'grenzland', name: 'Die bedrohte Mark', description: 'Schütze dein Land und stärke das Heer.', year: 1200, minYear: 1200, maxYear: 1750 },
  { id: 'kultur', name: 'Glaube und Kultur', description: 'Stärke geistliches Leben und höfische Künste.', year: 1200, minYear: 1200, maxYear: 1750 },
  { id: 'kaiserkrone', name: 'Der Weg zur Kaiserkrone', description: 'Vereine Bündnispolitik, Festungen und Reichtum.', year: 1200, minYear: 1200, maxYear: 1750 },
  { id: 'industrie', name: 'Dampf und Stahl', description: 'Modernisiere Werkstätten, Straßen und den Handel.', year: 1820, minYear: 1820, maxYear: 1890 },
  { id: 'wiederaufbau', name: 'Ein Land wird neu', description: 'Baue Infrastruktur, Gesundheitswesen und Vertrauen wieder auf.', year: 1945, minYear: 1945, maxYear: 1970 },
  { id: 'digital', name: 'Das vernetzte Reich', description: 'Verbinde Forschung, Technik und gesellschaftliche Entwicklung.', year: 2000, minYear: 2000 }
] as const;

export function campaignsForYear(year: number): readonly CampaignDefinition[] {
  return CAMPAIGNS.filter(campaign => (campaign.minYear ?? -Infinity) <= year &&
    year <= (campaign.maxYear ?? Infinity));
}
export function campaignIsAvailable(id: CampaignId, year: number): boolean {
  return campaignsForYear(year).some(campaign => campaign.id === id);
}
export function campaignGoals(id: CampaignId, kingdom: Kingdom, researched: number, subdued: number, tradeRoutes: number, truces: number = 0): CampaignObjective[] {
  const infra = kingdom.infrastructure;
  switch (id) {
    case 'frei': return [];
    case 'industrie': return [
      { label: '2 Werkstätten betreiben', done: infra.workshops >= 2 },
      { label: '3 Straßenverbindungen ausbauen', done: infra.roads >= 3 },
      { label: '2 Schulen errichten', done: infra.schools >= 2 },
      { label: '3 Technologien erforschen', done: researched >= 3 },
      { label: '5.500 Gold Produktionsreserve', done: kingdom.resources.gold >= 5500 },
      { label: 'Handelsmacht auf 25 erhöhen', done: kingdom.stats.tradePower >= 25 }
    ];
    case 'wiederaufbau': return [
      { label: '4 Bauernhöfe versorgen das Land', done: infra.farms >= 4 },
      { label: '2 Straßen erneuern', done: infra.roads >= 2 },
      { label: 'Ein Hospital errichten', done: infra.hospitals >= 1 },
      { label: '65 % Zufriedenheit erreichen', done: kingdom.happiness >= 65 },
      { label: '4 Technologien erforschen', done: researched >= 4 },
      { label: '75 % Stabilität sichern', done: kingdom.stats.stability >= 75 }
    ];
    case 'digital': return [
      { label: '3 Schulen errichten', done: infra.schools >= 3 },
      { label: 'Eine Universität errichten', done: infra.universities >= 1 },
      { label: '8 Technologien erforschen', done: researched >= 8 },
      { label: '3 Werkstätten betreiben', done: infra.workshops >= 3 },
      { label: 'Handelsmacht auf 40 erhöhen', done: kingdom.stats.tradePower >= 40 },
      { label: 'Alphabetisierung von 45 % erreichen', done: kingdom.stats.literacyRate >= 45 }
    ];
    case 'hanse': return [
      { label: '2 Häfen errichten', done: infra.ports >= 2 },
      { label: '3 Marktplätze', done: infra.markets >= 3 },
      { label: '2 Handelsrouten aktivieren', done: tradeRoutes >= 2 },
      { label: 'Handelsmacht auf 30 steigern', done: kingdom.stats.tradePower >= 30 },
      { label: '12.000 Gold ansparen', done: kingdom.resources.gold >= 12000 },
      { label: 'Mindestens 65 % Zufriedenheit', done: kingdom.happiness >= 65 }
    ];
    case 'wissenschaft': return [
      { label: '3 Schulen errichten', done: infra.schools >= 3 },
      { label: 'Eine Universität gründen', done: infra.universities >= 1 },
      { label: '5 Technologien erforschen', done: researched >= 5 },
      { label: '10 Technologien erforschen', done: researched >= 10 },
      { label: 'Alphabetisierung auf 30 % steigern', done: kingdom.stats.literacyRate >= 30 },
      { label: '5.000 Gold Forschungsreserve', done: kingdom.resources.gold >= 5000 }
    ];
    case 'grenzland': return [
      { label: '2 Kasernen errichten', done: infra.barracks >= 2 },
      { label: 'Eine Burg errichten', done: infra.castles >= 1 },
      { label: '2 Stadtmauern errichten', done: infra.walls >= 2 },
      { label: 'Militärausbildung auf 20 % steigern', done: kingdom.military.trainingLevel >= 20 },
      { label: 'Einen Gegner unterwerfen', done: subdued >= 1 },
      { label: 'Stabilität von 60 % erreichen', done: kingdom.stats.stability >= 60 }
    ];
    case 'kultur': return [
      { label: '2 Kirchen errichten', done: infra.churches >= 2 },
      { label: '2 Schulen errichten', done: infra.schools >= 2 },
      { label: 'Mindestens 45 % kultureller Einfluss', done: kingdom.stats.culturalInfluence >= 45 },
      { label: 'Eine Universität errichten', done: infra.universities >= 1 },
      { label: '75 % Zufriedenheit', done: kingdom.happiness >= 75 },
      { label: 'Stabilität von 75 % sichern', done: kingdom.stats.stability >= 75 }
    ];
    case 'kaiserkrone': return [
      { label: 'Eine Burg errichten', done: infra.castles >= 1 },
      { label: 'Mindestens 2 Marktplätze', done: infra.markets >= 2 },
      { label: 'Einen Nichtangriffspakt schließen', done: truces >= 1 },
      { label: 'Handelsmacht auf 45 steigern', done: kingdom.stats.tradePower >= 45 },
      { label: 'Einen Rivalen unterwerfen', done: subdued >= 1 },
      { label: '20.000 Gold in der Schatzkammer', done: kingdom.resources.gold >= 20000 }
    ];
    default: {
      const balance = kingdom.getMonthlyBalance();
      return [
        { label: '12 Bauernhöfe', done: infra.farms >= 12 },
        { label: '3 Marktplätze', done: infra.markets >= 3 },
        { label: '2 Schulen', done: infra.schools >= 2 },
        { label: '65 % Zufriedenheit', done: kingdom.happiness >= 65 },
        { label: '8.000 Gold & positive Versorgung', done: kingdom.resources.gold >= 8000 && balance.net.food >= 0 && balance.net.gold >= 0 },
        { label: 'Einen Rivalen unterwerfen', done: subdued >= 1 }
      ];
    }
  }
}
