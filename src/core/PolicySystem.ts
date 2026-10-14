// src/core/PolicySystem.ts
import { Player } from './Player';
import { Kingdom } from './Kingdom';

export type PolicyCategory = 
  | 'asylum_immigration'
  | 'economy_domestic'
  | 'economy_foreign'
  | 'health'
  | 'social_positive'
  | 'social_negative'
  | 'social_tensions'
  | 'social_urban'
  | 'environment'
  | 'digital'
  | 'science'
  | 'security';

export type PolicyImpact = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface PolicyEffect {
  happiness?: number;
  stability?: number;
  population?: {
    growthRate?: number;
    peasants?: number;
    merchants?: number;
    nobles?: number;
    unemployed?: number;
  };
  resources?: {
    gold?: number;
    food?: number;
    luxuryGoods?: number;
  };
  economy?: {
    tradePower?: number;
    crimeRate?: number;
  };
  stats?: {
    prestige?: number;
    popularity?: number;
    authority?: number;
    corruption?: number;
  };
  infrastructure?: {
    hospitals?: number;
    schools?: number;
    markets?: number;
  };
}

export interface PolicyConditions {
  minYear?: number;
  maxYear?: number;
  requiredAuthority?: number;
  requiredGold?: number;
  requiredPrestige?: number;
  requiredPopulation?: number;
  requiredHappiness?: number;
  maxCorruption?: number;
  conflictingPolicies?: string[];
  requiredPolicies?: string[];
  requiredBuildings?: { [key: string]: number };
}

export interface Policy {
  id: string;
  category: PolicyCategory;
  name: string;
  description: string;
  impact: PolicyImpact;
  
  // Effects over time
  immediateEffects?: PolicyEffect;
  monthlyEffects?: PolicyEffect;
  yearlyEffects?: PolicyEffect;
  
  // Costs
  enactmentCost?: {
    gold?: number;
    authority?: number;
    popularity?: number;
  };
  maintenanceCost?: {
    goldPerMonth?: number;
  };
  
  // Requirements and restrictions
  conditions?: PolicyConditions;
  
  // Metadata
  introduced?: number; // year when policy becomes available
  repealed?: boolean;
  duration?: number; // in months, -1 for permanent
}

export interface ActivePolicy extends Policy {
  enactedYear: number;
  enactedMonth: number;
  playerId: string;
  monthsActive: number;
}

export class PolicySystem {
  private policies: Map<string, Policy> = new Map();
  private activePolicies: Map<string, ActivePolicy> = new Map();
  private policyHistory: Array<{
    policyId: string;
    action: 'enacted' | 'repealed';
    year: number;
    playerId: string;
  }> = [];

  constructor() {
    this.initializePolicies();
  }

  private initializePolicies(): void {
    const policies: Policy[] = [
      // === Asyl und Zuwanderung (Asylum & Immigration) ===
      {
        id: 'open_borders',
        category: 'asylum_immigration',
        name: 'Offene Grenzen',
        description: 'Erlaubt freie Einwanderung ohne Beschränkungen.',
        impact: 'mixed',
        immediateEffects: {
          population: { growthRate: 2 },
          stats: { popularity: -10, prestige: 5 }
        },
        monthlyEffects: {
          population: { peasants: 20, merchants: 5 },
          economy: { crimeRate: 1 },
          happiness: -0.5
        },
        conditions: {
          minYear: 1800,
          requiredAuthority: 60,
          maxCorruption: 70
        },
        introduced: 1800
      },
      {
        id: 'controlled_immigration',
        category: 'asylum_immigration',
        name: 'Kontrollierte Einwanderung',
        description: 'Einwanderung wird geregelt und nach Qualifikation gesteuert.',
        impact: 'positive',
        immediateEffects: {
          stats: { authority: 5, popularity: 10 }
        },
        monthlyEffects: {
          population: { peasants: 5, merchants: 3 },
          economy: { tradePower: 0.5 }
        },
        maintenanceCost: {
          goldPerMonth: 100
        },
        conditions: {
          minYear: 1850,
          requiredAuthority: 50,
          requiredGold: 10000,
          conflictingPolicies: ['open_borders', 'closed_borders']
        },
        introduced: 1850
      },
      {
        id: 'closed_borders',
        category: 'asylum_immigration',
        name: 'Geschlossene Grenzen',
        description: 'Einwanderung wird stark eingeschränkt oder verboten.',
        impact: 'negative',
        immediateEffects: {
          stats: { authority: 15, popularity: -20, prestige: -10 },
          happiness: -10
        },
        monthlyEffects: {
          population: { growthRate: -0.5 },
          economy: { tradePower: -0.5 }
        },
        conditions: {
          minYear: 1700,
          requiredAuthority: 70
        },
        introduced: 1700
      },
      {
        id: 'asylum_sanctuary',
        category: 'asylum_immigration',
        name: 'Asylrecht',
        description: 'Gewährt politisch Verfolgten Schutz und Aufnahme.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 20, popularity: 5 }
        },
        monthlyEffects: {
          population: { peasants: 3 },
          resources: { gold: -50 }
        },
        maintenanceCost: {
          goldPerMonth: 200
        },
        conditions: {
          minYear: 1900,
          requiredGold: 15000,
          requiredHappiness: 50
        },
        introduced: 1900
      },

      // === Wirtschaft - Innen (Economy - Domestic) ===
      {
        id: 'free_market',
        category: 'economy_domestic',
        name: 'Freie Marktwirtschaft',
        description: 'Minimale staatliche Eingriffe, freier Handel und Wettbewerb.',
        impact: 'mixed',
        immediateEffects: {
          economy: { tradePower: 10 },
          stats: { popularity: -5 }
        },
        monthlyEffects: {
          resources: { gold: 500 },
          happiness: -0.3,
          population: { merchants: 5, unemployed: 2 }
        },
        conditions: {
          minYear: 1776,
          requiredAuthority: 40,
          conflictingPolicies: ['planned_economy', 'state_capitalism']
        },
        introduced: 1776
      },
      {
        id: 'planned_economy',
        category: 'economy_domestic',
        name: 'Planwirtschaft',
        description: 'Staatliche Kontrolle über Produktion und Verteilung.',
        impact: 'mixed',
        immediateEffects: {
          stats: { authority: 20, popularity: -15 },
          happiness: -15
        },
        monthlyEffects: {
          resources: { food: 100 },
          economy: { tradePower: -2 },
          population: { unemployed: -5 }
        },
        conditions: {
          minYear: 1917,
          requiredAuthority: 80,
          conflictingPolicies: ['free_market']
        },
        introduced: 1917
      },
      {
        id: 'progressive_taxation',
        category: 'economy_domestic',
        name: 'Progressive Besteuerung',
        description: 'Höhere Einkommen werden stärker besteuert.',
        impact: 'positive',
        immediateEffects: {
          happiness: 10,
          stats: { popularity: 15 }
        },
        monthlyEffects: {
          resources: { gold: 800 },
          population: { nobles: -1 }
        },
        conditions: {
          minYear: 1850,
          requiredAuthority: 55
        },
        introduced: 1850
      },
      {
        id: 'minimum_wage',
        category: 'economy_domestic',
        name: 'Mindestlohn',
        description: 'Gesetzlicher Mindestlohn für alle Arbeiter.',
        impact: 'positive',
        immediateEffects: {
          happiness: 15,
          stats: { popularity: 20 }
        },
        monthlyEffects: {
          resources: { gold: -300 },
          population: { unemployed: 3 }
        },
        conditions: {
          minYear: 1894,
          requiredAuthority: 50,
          requiredGold: 20000
        },
        introduced: 1894
      },

      // === Wirtschaft - Außen (Economy - Foreign) ===
      {
        id: 'free_trade',
        category: 'economy_foreign',
        name: 'Freihandel',
        description: 'Keine Zölle oder Handelsbeschränkungen.',
        impact: 'positive',
        immediateEffects: {
          economy: { tradePower: 20 },
          stats: { prestige: 10 }
        },
        monthlyEffects: {
          resources: { gold: 600, luxuryGoods: 10 }
        },
        conditions: {
          minYear: 1800,
          conflictingPolicies: ['protectionism', 'trade_embargo']
        },
        introduced: 1800
      },
      {
        id: 'protectionism',
        category: 'economy_foreign',
        name: 'Protektionismus',
        description: 'Hohe Zölle zum Schutz heimischer Industrie.',
        impact: 'mixed',
        immediateEffects: {
          stats: { authority: 10, prestige: -5 }
        },
        monthlyEffects: {
          resources: { gold: 400 },
          economy: { tradePower: -5 },
          population: { merchants: 3 }
        },
        conditions: {
          minYear: 1700,
          conflictingPolicies: ['free_trade']
        },
        introduced: 1700
      },
      {
        id: 'trade_embargo',
        category: 'economy_foreign',
        name: 'Handelsembargo',
        description: 'Verbot des Handels mit bestimmten Nationen.',
        impact: 'negative',
        immediateEffects: {
          stats: { authority: 15, prestige: -10 }
        },
        monthlyEffects: {
          resources: { gold: -500, luxuryGoods: -5 },
          economy: { tradePower: -10 }
        },
        conditions: {
          minYear: 1600,
          requiredAuthority: 70
        },
        introduced: 1600
      },
      {
        id: 'colonial_trade',
        category: 'economy_foreign',
        name: 'Kolonialhandel',
        description: 'Ausbeutung von Kolonien für Rohstoffe und Handel.',
        impact: 'mixed',
        immediateEffects: {
          stats: { prestige: 20 }
        },
        monthlyEffects: {
          resources: { gold: 1000, luxuryGoods: 20 },
          stats: { corruption: 1 }
        },
        conditions: {
          minYear: 1500,
          maxYear: 1960,
          requiredPrestige: 100,
          requiredAuthority: 60
        },
        introduced: 1500
      },

      // === Gesundheit (Health) ===
      {
        id: 'public_healthcare',
        category: 'health',
        name: 'Öffentliches Gesundheitswesen',
        description: 'Kostenlose medizinische Versorgung für alle Bürger.',
        impact: 'positive',
        immediateEffects: {
          happiness: 20,
          stats: { popularity: 25 }
        },
        monthlyEffects: {
          resources: { gold: -800 },
          population: { growthRate: 0.5 }
        },
        maintenanceCost: {
          goldPerMonth: 500
        },
        conditions: {
          minYear: 1883,
          requiredGold: 30000,
          requiredBuildings: { hospitals: 3 }
        },
        introduced: 1883
      },
      {
        id: 'mandatory_vaccination',
        category: 'health',
        name: 'Impfpflicht',
        description: 'Verpflichtende Impfungen zur Seuchenbekämpfung.',
        impact: 'positive',
        immediateEffects: {
          stats: { authority: 10, popularity: -5 }
        },
        monthlyEffects: {
          population: { growthRate: 0.3 }
        },
        maintenanceCost: {
          goldPerMonth: 300
        },
        conditions: {
          minYear: 1850,
          requiredAuthority: 60,
          requiredGold: 10000
        },
        introduced: 1850
      },
      {
        id: 'quarantine_protocols',
        category: 'health',
        name: 'Quarantäne-Protokolle',
        description: 'Strenge Isolation bei Krankheitsausbrüchen.',
        impact: 'neutral',
        immediateEffects: {
          stats: { authority: 15 }
        },
        enactmentCost: {
          gold: 5000,
          popularity: -10
        },
        conditions: {
          minYear: 1600,
          requiredAuthority: 50
        },
        introduced: 1600
      },
      {
        id: 'health_education',
        category: 'health',
        name: 'Gesundheitsaufklärung',
        description: 'Programme zur Verbesserung des Gesundheitsbewusstseins.',
        impact: 'positive',
        immediateEffects: {
          stats: { popularity: 10 }
        },
        monthlyEffects: {
          population: { growthRate: 0.2 }
        },
        maintenanceCost: {
          goldPerMonth: 200
        },
        conditions: {
          minYear: 1900,
          requiredGold: 8000,
          requiredBuildings: { schools: 2 }
        },
        introduced: 1900
      },

      // === Soziales - Positive (Social - Positive) ===
      {
        id: 'public_education',
        category: 'social_positive',
        name: 'Öffentliche Bildung',
        description: 'Kostenlose Bildung für alle Kinder.',
        impact: 'positive',
        immediateEffects: {
          happiness: 15,
          stats: { popularity: 20 }
        },
        monthlyEffects: {
          resources: { gold: -400 }
        },
        maintenanceCost: {
          goldPerMonth: 300
        },
        conditions: {
          minYear: 1717,
          requiredGold: 15000,
          requiredBuildings: { schools: 2 }
        },
        introduced: 1717
      },
      {
        id: 'social_welfare',
        category: 'social_positive',
        name: 'Sozialfürsorge',
        description: 'Unterstützung für Bedürftige und Arbeitslose.',
        impact: 'positive',
        immediateEffects: {
          happiness: 25,
          stats: { popularity: 30 }
        },
        monthlyEffects: {
          resources: { gold: -600 },
          population: { unemployed: -3 }
        },
        maintenanceCost: {
          goldPerMonth: 400
        },
        conditions: {
          minYear: 1889,
          requiredGold: 25000
        },
        introduced: 1889
      },
      {
        id: 'workers_rights',
        category: 'social_positive',
        name: 'Arbeiterrechte',
        description: 'Schutz der Arbeiter durch Gesetze und Gewerkschaften.',
        impact: 'positive',
        immediateEffects: {
          happiness: 20,
          stats: { popularity: 25, authority: -5 }
        },
        monthlyEffects: {
          resources: { gold: -200 }
        },
        conditions: {
          minYear: 1870,
          requiredAuthority: 45
        },
        introduced: 1870
      },
      {
        id: 'gender_equality',
        category: 'social_positive',
        name: 'Gleichstellung',
        description: 'Gleichberechtigung unabhängig von Geschlecht.',
        impact: 'positive',
        immediateEffects: {
          happiness: 15,
          stats: { prestige: 15, popularity: 20 }
        },
        monthlyEffects: {
          population: { merchants: 2 }
        },
        conditions: {
          minYear: 1900,
          requiredAuthority: 55
        },
        introduced: 1900
      },

      // === Soziales - Negative (Social - Negative) ===
      {
        id: 'forced_labor',
        category: 'social_negative',
        name: 'Zwangsarbeit',
        description: 'Erzwungene Arbeit für bestimmte Bevölkerungsgruppen.',
        impact: 'negative',
        immediateEffects: {
          happiness: -40,
          stats: { authority: 20, prestige: -30, popularity: -40 }
        },
        monthlyEffects: {
          resources: { gold: 300 },
          population: { unemployed: -10 },
          stability: -2
        },
        conditions: {
          maxYear: 1950,
          requiredAuthority: 80
        },
        introduced: 800
      },
      {
        id: 'censorship',
        category: 'social_negative',
        name: 'Zensur',
        description: 'Kontrolle und Unterdrückung von Informationen.',
        impact: 'negative',
        immediateEffects: {
          stats: { authority: 15, popularity: -20, prestige: -10 }
        },
        monthlyEffects: {
          happiness: -1,
          stats: { corruption: 0.5 }
        },
        conditions: {
          minYear: 1400,
          requiredAuthority: 70
        },
        introduced: 1400
      },
      {
        id: 'class_segregation',
        category: 'social_negative',
        name: 'Klassentrennung',
        description: 'Strikte Trennung der sozialen Schichten.',
        impact: 'negative',
        immediateEffects: {
          happiness: -15,
          stats: { authority: 10, popularity: -15 }
        },
        monthlyEffects: {
          stability: -0.5,
          economy: { crimeRate: 0.5 }
        },
        conditions: {
          maxYear: 1900,
          requiredAuthority: 60
        },
        introduced: 500
      },

      // === Soziales - Spannungen (Social - Tensions) ===
      {
        id: 'conflict_resolution',
        category: 'social_tensions',
        name: 'Konfliktlösung',
        description: 'Programme zur Deeskalation sozialer Spannungen.',
        impact: 'positive',
        immediateEffects: {
          stability: 15,
          happiness: 10
        },
        monthlyEffects: {
          economy: { crimeRate: -1 },
          stability: 0.5
        },
        maintenanceCost: {
          goldPerMonth: 250
        },
        conditions: {
          minYear: 1950,
          requiredGold: 12000
        },
        introduced: 1950
      },
      {
        id: 'religious_tolerance',
        category: 'social_tensions',
        name: 'Religiöse Toleranz',
        description: 'Akzeptanz verschiedener Glaubensrichtungen.',
        impact: 'positive',
        immediateEffects: {
          happiness: 15,
          stability: 10,
          stats: { prestige: 10 }
        },
        monthlyEffects: {
          population: {}
        },
        conditions: {
          minYear: 1648,
          requiredAuthority: 50
        },
        introduced: 1648
      },
      {
        id: 'martial_law',
        category: 'social_tensions',
        name: 'Kriegsrecht',
        description: 'Militärische Kontrolle zur Unterdrückung von Unruhen.',
        impact: 'negative',
        immediateEffects: {
          stability: 20,
          happiness: -30,
          stats: { authority: 25, popularity: -35 }
        },
        monthlyEffects: {
          resources: { gold: -400 },
          economy: { crimeRate: -2 }
        },
        conditions: {
          minYear: 1700,
          requiredAuthority: 75
        },
        introduced: 1700,
        duration: 12 // temporary policy
      },

      // === Soziales - Ballungsräume (Social - Urban Areas) ===
      {
        id: 'urban_planning',
        category: 'social_urban',
        name: 'Stadtplanung',
        description: 'Systematische Planung und Entwicklung von Städten.',
        impact: 'positive',
        immediateEffects: {
          happiness: 10,
          stats: { prestige: 5 }
        },
        monthlyEffects: {
          stability: 0.5
        },
        maintenanceCost: {
          goldPerMonth: 300
        },
        conditions: {
          minYear: 1850,
          requiredGold: 20000,
          requiredPopulation: 5000
        },
        introduced: 1850
      },
      {
        id: 'public_transport',
        category: 'social_urban',
        name: 'Öffentlicher Nahverkehr',
        description: 'Ausbau von Bussen, Bahnen und Metro-Systemen.',
        impact: 'positive',
        immediateEffects: {
          happiness: 15,
          stats: { popularity: 10 }
        },
        monthlyEffects: {
          resources: { gold: -200 },
          economy: { tradePower: 1 }
        },
        maintenanceCost: {
          goldPerMonth: 400
        },
        conditions: {
          minYear: 1863,
          requiredGold: 30000,
          requiredPopulation: 10000
        },
        introduced: 1863
      },
      {
        id: 'slum_clearance',
        category: 'social_urban',
        name: 'Slum-Sanierung',
        description: 'Abriss und Erneuerung von Elendsvierteln.',
        impact: 'mixed',
        immediateEffects: {
          happiness: -10,
          stats: { authority: 10 }
        },
        enactmentCost: {
          gold: 15000
        },
        monthlyEffects: {
          happiness: 1,
          economy: { crimeRate: -0.5 },
          population: { unemployed: 5 }
        },
        conditions: {
          minYear: 1900,
          requiredGold: 25000,
          requiredAuthority: 60
        },
        introduced: 1900
      },
      {
        id: 'green_spaces',
        category: 'social_urban',
        name: 'Grünflächen',
        description: 'Schaffung von Parks und Erholungsgebieten in Städten.',
        impact: 'positive',
        immediateEffects: {
          happiness: 12,
          stats: { popularity: 8 }
        },
        monthlyEffects: {
          happiness: 0.3
        },
        enactmentCost: {
          gold: 8000
        },
        conditions: {
          minYear: 1800,
          requiredPopulation: 3000
        },
        introduced: 1800
      },
      
      // === Umweltpolitik (Environmental Policy) ===
      {
        id: 'carbon_tax',
        category: 'environment',
        name: 'CO2-Steuer',
        description: 'Besteuerung von CO2-Emissionen zur Klimaschutzfinanzierung.',
        impact: 'mixed',
        immediateEffects: {
          stats: { popularity: -15, prestige: 20 }
        },
        monthlyEffects: {
          resources: { gold: 500 },
          happiness: -0.5
        },
        conditions: {
          minYear: 1990,
          requiredPopulation: 50000
        },
        introduced: 1990
      },
      {
        id: 'renewable_energy_mandate',
        category: 'environment',
        name: 'Erneuerbare-Energien-Gesetz',
        description: 'Förderung von Solar-, Wind- und Wasserkraft.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 30, popularity: 10 }
        },
        monthlyEffects: {
          resources: { gold: -200 },
          happiness: 0.3
        },
        enactmentCost: {
          gold: 20000
        },
        conditions: {
          minYear: 1995,
          requiredGold: 50000
        },
        introduced: 1995
      },
      {
        id: 'emission_limits',
        category: 'environment',
        name: 'Emissionsgrenzwerte',
        description: 'Strenge Limits für industrielle Schadstoffemissionen.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 15, popularity: 5 }
        },
        monthlyEffects: {
          economy: { tradePower: -0.3 },
          happiness: 0.4
        },
        maintenanceCost: {
          goldPerMonth: 300
        },
        conditions: {
          minYear: 1970,
          requiredAuthority: 55
        },
        introduced: 1970
      },
      {
        id: 'nature_conservation',
        category: 'environment',
        name: 'Naturschutzgebiete',
        description: 'Ausweisung geschützter Naturreservate.',
        impact: 'positive',
        immediateEffects: {
          happiness: 10,
          stats: { prestige: 12 }
        },
        monthlyEffects: {
          resources: { gold: -100 }
        },
        enactmentCost: {
          gold: 10000
        },
        conditions: {
          minYear: 1960,
          requiredPopulation: 20000
        },
        introduced: 1960
      },
      {
        id: 'plastic_ban',
        category: 'environment',
        name: 'Plastikverbot',
        description: 'Verbot von Einwegplastik und Förderung von Alternativen.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 18, popularity: -5 }
        },
        monthlyEffects: {
          happiness: 0.3,
          economy: { crimeRate: -0.1 }
        },
        conditions: {
          minYear: 2010,
          requiredAuthority: 50
        },
        introduced: 2010
      },
      
      // === Digitalpolitik (Digital Policy) ===
      {
        id: 'data_protection',
        category: 'digital',
        name: 'Datenschutzgrundverordnung',
        description: 'Umfassender Schutz personenbezogener Daten.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 25, popularity: 15 }
        },
        monthlyEffects: {
          economy: { tradePower: -0.2 }
        },
        maintenanceCost: {
          goldPerMonth: 400
        },
        conditions: {
          minYear: 2015,
          requiredAuthority: 60
        },
        introduced: 2015
      },
      {
        id: 'internet_censorship',
        category: 'digital',
        name: 'Internet-Zensur',
        description: 'Staatliche Kontrolle und Filterung von Online-Inhalten.',
        impact: 'negative',
        immediateEffects: {
          stats: { authority: 20, popularity: -30, prestige: -25 }
        },
        monthlyEffects: {
          happiness: -1,
          stability: 2
        },
        conditions: {
          minYear: 2000,
          requiredAuthority: 80
        },
        introduced: 2000
      },
      {
        id: 'digital_infrastructure',
        category: 'digital',
        name: 'Digitaler Infrastrukturausbau',
        description: 'Investition in Breitband und 5G-Netze.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 15 }
        },
        monthlyEffects: {
          economy: { tradePower: 1 },
          resources: { gold: 200 }
        },
        enactmentCost: {
          gold: 50000
        },
        conditions: {
          minYear: 2010,
          requiredGold: 100000
        },
        introduced: 2010
      },
      {
        id: 'cybersecurity_initiative',
        category: 'digital',
        name: 'Cybersicherheits-Initiative',
        description: 'Schutz kritischer Infrastruktur vor Cyberangriffen.',
        impact: 'positive',
        immediateEffects: {
          stability: 10,
          stats: { authority: 10 }
        },
        maintenanceCost: {
          goldPerMonth: 500
        },
        conditions: {
          minYear: 2005,
          requiredGold: 30000,
          requiredAuthority: 55
        },
        introduced: 2005
      },
      {
        id: 'digital_education',
        category: 'digital',
        name: 'Digitale Bildungsoffensive',
        description: 'Ausstattung von Schulen mit Computern und Internet.',
        impact: 'positive',
        immediateEffects: {
          happiness: 8,
          stats: { prestige: 12, popularity: 10 }
        },
        monthlyEffects: {
          resources: { gold: -150 }
        },
        enactmentCost: {
          gold: 25000
        },
        conditions: {
          minYear: 2000,
          requiredGold: 50000,
          requiredBuildings: { 'school': 5 }
        },
        introduced: 2000
      },
      
      // === Wissenschaftspolitik (Science Policy) ===
      {
        id: 'research_funding',
        category: 'science',
        name: 'Forschungsförderung',
        description: 'Großzügige staatliche Unterstützung für Wissenschaft.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 20 }
        },
        monthlyEffects: {
          resources: { gold: -500 }
        },
        enactmentCost: {
          gold: 30000
        },
        conditions: {
          minYear: 1800,
          requiredGold: 60000
        },
        introduced: 1800
      },
      {
        id: 'university_expansion',
        category: 'science',
        name: 'Universitätsausbau',
        description: 'Gründung neuer Universitäten und Forschungsinstitute.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 25, popularity: 8 }
        },
        monthlyEffects: {
          infrastructure: { schools: 1 },
          resources: { gold: -300 }
        },
        enactmentCost: {
          gold: 40000
        },
        conditions: {
          minYear: 1700,
          requiredGold: 80000,
          requiredPopulation: 30000
        },
        introduced: 1700
      },
      {
        id: 'scientific_collaboration',
        category: 'science',
        name: 'Internationale Forschungskooperation',
        description: 'Zusammenarbeit mit ausländischen Forschungseinrichtungen.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 30, popularity: 5 }
        },
        monthlyEffects: {
          resources: { gold: -200 }
        },
        maintenanceCost: {
          goldPerMonth: 350
        },
        conditions: {
          minYear: 1900,
          requiredPrestige: 500
        },
        introduced: 1900
      },
      {
        id: 'nobel_prize_fund',
        category: 'science',
        name: 'Nobelpreis-Fonds',
        description: 'Stiftung zur Förderung herausragender wissenschaftlicher Leistungen.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 50, popularity: 15 }
        },
        monthlyEffects: {
          resources: { gold: -400 }
        },
        enactmentCost: {
          gold: 100000
        },
        conditions: {
          minYear: 1901,
          requiredGold: 200000,
          requiredPrestige: 1000
        },
        introduced: 1901
      },
      {
        id: 'space_program',
        category: 'science',
        name: 'Weltraumprogramm',
        description: 'Ambitioniertes Raumfahrtprogramm zur Erforschung des Alls.',
        impact: 'positive',
        immediateEffects: {
          stats: { prestige: 100, popularity: 20 }
        },
        monthlyEffects: {
          resources: { gold: -2000 }
        },
        enactmentCost: {
          gold: 500000
        },
        conditions: {
          minYear: 1957,
          requiredGold: 1000000,
          requiredPopulation: 500000
        },
        introduced: 1957
      },
      
      // === Sicherheitspolitik (Security Policy) ===
      {
        id: 'police_reform',
        category: 'security',
        name: 'Polizeireform',
        description: 'Modernisierung und Professionalisierung der Polizei.',
        impact: 'positive',
        immediateEffects: {
          stability: 15,
          stats: { authority: 10 }
        },
        monthlyEffects: {
          economy: { crimeRate: -0.5 }
        },
        enactmentCost: {
          gold: 20000
        },
        maintenanceCost: {
          goldPerMonth: 400
        },
        conditions: {
          minYear: 1850,
          requiredAuthority: 50,
          requiredGold: 40000
        },
        introduced: 1850
      },
      {
        id: 'judicial_independence',
        category: 'security',
        name: 'Unabhängige Justiz',
        description: 'Garantie der Unabhängigkeit der Gerichte.',
        impact: 'positive',
        immediateEffects: {
          stability: 20,
          stats: { prestige: 25, popularity: 15 }
        },
        monthlyEffects: {
          stats: { corruption: -0.3 }
        },
        conditions: {
          minYear: 1800,
          requiredAuthority: 40,
          maxCorruption: 60
        },
        introduced: 1800
      },
      {
        id: 'surveillance_state',
        category: 'security',
        name: 'Überwachungsstaat',
        description: 'Weitreichende Überwachung der Bevölkerung.',
        impact: 'negative',
        immediateEffects: {
          stats: { authority: 30, popularity: -40, prestige: -30 }
        },
        monthlyEffects: {
          stability: 3,
          happiness: -1.5,
          economy: { crimeRate: -1 }
        },
        maintenanceCost: {
          goldPerMonth: 800
        },
        conditions: {
          minYear: 1950,
          requiredAuthority: 85
        },
        introduced: 1950
      },
      {
        id: 'prison_reform',
        category: 'security',
        name: 'Strafrechtsreform',
        description: 'Humanisierung des Strafvollzugs und Resozialisierung.',
        impact: 'positive',
        immediateEffects: {
          happiness: 8,
          stats: { prestige: 15, popularity: 10 }
        },
        monthlyEffects: {
          economy: { crimeRate: -0.3 }
        },
        enactmentCost: {
          gold: 15000
        },
        conditions: {
          minYear: 1900,
          requiredAuthority: 45,
          requiredBuildings: { 'prison': 1 }
        },
        introduced: 1900
      },
      {
        id: 'border_security',
        category: 'security',
        name: 'Grenzsicherung',
        description: 'Verstärkter Schutz der Landesgrenzen.',
        impact: 'mixed',
        immediateEffects: {
          stability: 10,
          stats: { authority: 15, popularity: -10 }
        },
        monthlyEffects: {
          economy: { crimeRate: -0.4 }
        },
        maintenanceCost: {
          goldPerMonth: 600
        },
        conditions: {
          minYear: 1700,
          requiredAuthority: 55
        },
        introduced: 1700
      }
    ];

    // Store all policies
    policies.forEach(policy => this.policies.set(policy.id, policy));
  }

  /**
   * Check if a policy can be enacted
   */
  public canEnactPolicy(policyId: string, player: Player, currentYear: number): { 
    canEnact: boolean; 
    reasons: string[] 
  } {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return { canEnact: false, reasons: ['Politik nicht gefunden'] };
    }

    const reasons: string[] = [];
    const kingdom = player.kingdom;
    const conditions = policy.conditions;

    // Check if already active
    if (this.activePolicies.has(policyId)) {
      reasons.push('Politik ist bereits aktiv');
    }

    // Check conditions
    if (conditions) {
      if (conditions.minYear && currentYear < conditions.minYear) {
        reasons.push(`Erst ab Jahr ${conditions.minYear} verfügbar`);
      }
      if (conditions.maxYear && currentYear > conditions.maxYear) {
        reasons.push(`Nicht mehr verfügbar nach Jahr ${conditions.maxYear}`);
      }
      if (conditions.requiredAuthority && player.stats.authority < conditions.requiredAuthority) {
        reasons.push(`Benötigt Autorität: ${conditions.requiredAuthority}`);
      }
      if (conditions.requiredGold && kingdom.resources.gold < conditions.requiredGold) {
        reasons.push(`Benötigt Gold: ${conditions.requiredGold}`);
      }
      if (conditions.requiredPrestige && player.stats.prestige < conditions.requiredPrestige) {
        reasons.push(`Benötigt Prestige: ${conditions.requiredPrestige}`);
      }
      if (conditions.requiredHappiness && kingdom.happiness < conditions.requiredHappiness) {
        reasons.push(`Benötigt Zufriedenheit: ${conditions.requiredHappiness}`);
      }
      if (conditions.maxCorruption && player.stats.corruption > conditions.maxCorruption) {
        reasons.push(`Zu viel Korruption (max: ${conditions.maxCorruption})`);
      }

      // Check conflicting policies
      if (conditions.conflictingPolicies) {
        const activeConflicts = conditions.conflictingPolicies.filter(
          conflictId => this.activePolicies.has(conflictId)
        );
        if (activeConflicts.length > 0) {
          reasons.push(`Konflikt mit aktiven Politiken: ${activeConflicts.join(', ')}`);
        }
      }

      // Check required policies
      if (conditions.requiredPolicies) {
        const missingPolicies = conditions.requiredPolicies.filter(
          reqId => !this.activePolicies.has(reqId)
        );
        if (missingPolicies.length > 0) {
          reasons.push(`Benötigt Politiken: ${missingPolicies.join(', ')}`);
        }
      }

      // Check required buildings
      if (conditions.requiredBuildings) {
        for (const [building, count] of Object.entries(conditions.requiredBuildings)) {
          const current = kingdom.infrastructure[building as keyof Kingdom['infrastructure']] || 0;
          if (current < count) {
            reasons.push(`Benötigt ${count} ${building}`);
          }
        }
      }

      // Check required population
      if (conditions.requiredPopulation) {
        const totalPop = Object.values(kingdom.population).reduce((sum, val) => 
          typeof val === 'number' ? sum + val : sum, 0
        );
        if (totalPop < conditions.requiredPopulation) {
          reasons.push(`Benötigt Bevölkerung: ${conditions.requiredPopulation}`);
        }
      }
    }

    // Check enactment cost
    if (policy.enactmentCost) {
      if (policy.enactmentCost.gold && kingdom.resources.gold < policy.enactmentCost.gold) {
        reasons.push(`Benötigt ${policy.enactmentCost.gold} Gold`);
      }
    }

    return {
      canEnact: reasons.length === 0,
      reasons
    };
  }

  /**
   * Enact a policy
   */
  public enactPolicy(policyId: string, player: Player, currentYear: number, currentMonth: number): boolean {
    const check = this.canEnactPolicy(policyId, player, currentYear);
    if (!check.canEnact) {
      return false;
    }

    const policy = this.policies.get(policyId);
    if (!policy) return false;

    const kingdom = player.kingdom;

    // Apply enactment costs
    if (policy.enactmentCost) {
      if (policy.enactmentCost.gold) {
        kingdom.resources.gold -= policy.enactmentCost.gold;
      }
      if (policy.enactmentCost.authority) {
        player.stats.authority -= policy.enactmentCost.authority;
      }
      if (policy.enactmentCost.popularity) {
        player.stats.popularity -= policy.enactmentCost.popularity;
      }
    }

    // Apply immediate effects
    if (policy.immediateEffects) {
      this.applyEffects(policy.immediateEffects, player);
    }

    // Create active policy
    const activePolicy: ActivePolicy = {
      ...policy,
      enactedYear: currentYear,
      enactedMonth: currentMonth,
      playerId: player.id,
      monthsActive: 0
    };

    this.activePolicies.set(policyId, activePolicy);

    // Record in history
    this.policyHistory.push({
      policyId,
      action: 'enacted',
      year: currentYear,
      playerId: player.id
    });

    return true;
  }

  /**
   * Repeal a policy
   */
  public repealPolicy(policyId: string, player: Player, currentYear: number): boolean {
    const activePolicy = this.activePolicies.get(policyId);
    if (!activePolicy || activePolicy.playerId !== player.id) {
      return false;
    }

    this.activePolicies.delete(policyId);

    // Record in history
    this.policyHistory.push({
      policyId,
      action: 'repealed',
      year: currentYear,
      playerId: player.id
    });

    return true;
  }

  /**
   * Apply monthly effects of all active policies
   */
  public applyMonthlyEffects(player: Player): void {
    for (const activePolicy of this.activePolicies.values()) {
      if (activePolicy.playerId !== player.id) continue;

      // Increment months active
      activePolicy.monthsActive++;

      // Apply monthly effects
      if (activePolicy.monthlyEffects) {
        this.applyEffects(activePolicy.monthlyEffects, player);
      }

      // Apply maintenance costs
      if (activePolicy.maintenanceCost?.goldPerMonth) {
        player.kingdom.resources.gold -= activePolicy.maintenanceCost.goldPerMonth;
      }

      // Check if policy should expire
      if (activePolicy.duration && activePolicy.duration > 0) {
        if (activePolicy.monthsActive >= activePolicy.duration) {
          this.repealPolicy(activePolicy.id, player, player.kingdom.currentYear || 0);
        }
      }
    }
  }

  /**
   * Apply yearly effects of all active policies
   */
  public applyYearlyEffects(player: Player): void {
    for (const activePolicy of this.activePolicies.values()) {
      if (activePolicy.playerId !== player.id) continue;

      if (activePolicy.yearlyEffects) {
        this.applyEffects(activePolicy.yearlyEffects, player);
      }
    }
  }

  /**
   * Apply policy effects to player and kingdom
   */
  private applyEffects(effects: PolicyEffect, player: Player): void {
    const kingdom = player.kingdom;

    // Apply happiness
    if (effects.happiness) {
      kingdom.happiness = Math.max(0, Math.min(100, kingdom.happiness + effects.happiness));
    }

    // Apply stability
    if (effects.stability) {
      kingdom.stats.stability = Math.max(0, Math.min(100, 
        kingdom.stats.stability + effects.stability
      ));
    }

    // Apply population changes
    if (effects.population) {
      if (effects.population.growthRate) {
        kingdom.population.growthRate += effects.population.growthRate;
      }
      const popChanges = ['peasants', 'merchants', 'nobles', 'unemployed'] as const;
      for (const popType of popChanges) {
        if (effects.population[popType]) {
          kingdom.population[popType] = Math.max(0, 
            kingdom.population[popType] + (effects.population[popType] || 0)
          );
        }
      }
    }

    // Apply resources
    if (effects.resources) {
      if (effects.resources.gold) {
        kingdom.resources.gold = Math.max(0, kingdom.resources.gold + effects.resources.gold);
      }
      if (effects.resources.food) {
        kingdom.resources.food = Math.max(0, kingdom.resources.food + effects.resources.food);
      }
      if (effects.resources.luxuryGoods) {
        kingdom.resources.luxuryGoods = Math.max(0, 
          kingdom.resources.luxuryGoods + effects.resources.luxuryGoods
        );
      }
    }

    // Apply economy changes
    if (effects.economy) {
      if (effects.economy.tradePower) {
        kingdom.stats.tradePower = Math.max(0, Math.min(100, 
          kingdom.stats.tradePower + effects.economy.tradePower
        ));
      }
      if (effects.economy.crimeRate) {
        kingdom.stats.crimeRate = Math.max(0, Math.min(100, 
          kingdom.stats.crimeRate + effects.economy.crimeRate
        ));
      }
    }

    // Apply stats
    if (effects.stats) {
      if (effects.stats.prestige) {
        player.stats.prestige = Math.max(0, player.stats.prestige + effects.stats.prestige);
      }
      if (effects.stats.popularity) {
        player.stats.popularity = Math.max(0, Math.min(100, 
          player.stats.popularity + effects.stats.popularity
        ));
      }
      if (effects.stats.authority) {
        player.stats.authority = Math.max(0, Math.min(100, 
          player.stats.authority + effects.stats.authority
        ));
      }
      if (effects.stats.corruption) {
        player.stats.corruption = Math.max(0, Math.min(100, 
          player.stats.corruption + effects.stats.corruption
        ));
      }
    }

    // Apply infrastructure
    if (effects.infrastructure) {
      const infraKeys = ['hospitals', 'schools', 'markets'] as const;
      for (const key of infraKeys) {
        if (effects.infrastructure[key]) {
          kingdom.infrastructure[key] = Math.max(0, 
            kingdom.infrastructure[key] + (effects.infrastructure[key] || 0)
          );
        }
      }
    }
  }

  /**
   * Get all policies
   */
  public getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policies by category
   */
  public getPoliciesByCategory(category: PolicyCategory): Policy[] {
    return Array.from(this.policies.values()).filter(p => p.category === category);
  }

  /**
   * Get active policies for a player
   */
  public getActivePolicies(playerId: string): ActivePolicy[] {
    return Array.from(this.activePolicies.values())
      .filter(p => p.playerId === playerId);
  }

  /**
   * Get available policies (not active, conditions met)
   */
  public getAvailablePolicies(player: Player, currentYear: number): Policy[] {
    return Array.from(this.policies.values()).filter(policy => {
      const check = this.canEnactPolicy(policy.id, player, currentYear);
      return check.canEnact;
    });
  }

  /**
   * Get policy by ID
   */
  public getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get policy statistics
   */
  public getPolicyStats(): {
    totalPolicies: number;
    activePolicies: number;
    byCategory: Record<PolicyCategory, number>;
  } {
    const byCategory = {} as Record<PolicyCategory, number>;
    
    for (const policy of this.policies.values()) {
      byCategory[policy.category] = (byCategory[policy.category] || 0) + 1;
    }

    return {
      totalPolicies: this.policies.size,
      activePolicies: this.activePolicies.size,
      byCategory
    };
  }
}
