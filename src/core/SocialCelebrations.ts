import type { CulturalEvent } from './ReligionSystem';
/** Repeatable gameplay gatherings; these are not asserted historical calendar events. */
export function socialCelebrations(year:number):CulturalEvent[] {
  const base={culture:'germanic' as const,frequency:'monthly' as const,attendance:25};
  return [
    {...base,id:'social-meal',name:year<500?'Gemeinsames Mahl am Feuer':'Nachbarschaftsmahl',
      description:'Menschen teilen Speisen, Erzählungen und Neuigkeiten. Ein freiwilliger Anlass deiner Spielgemeinschaft, kein festes historisches Datum.',
      effects:{goldCost:60,foodConsumption:120,happiness:2}},
    {...base,id:'social-music',name:year<1500?'Lieder, Tanz und Geschichten':'Musik- und Tanzabend',
      description:'Ein kleiner gemeinschaftlicher Abend stärkt Zusammenhalt und örtliche Kultur.',
      effects:{goldCost:100,foodConsumption:70,happiness:2,culturalInfluence:2}},
    ...(year>=1100?[{...base,id:'social-market',name:year<1800?'Handwerks- und Markttag':'Vereins- und Nachbarschaftsfest',
      description:'Die Spielgemeinschaft stellt Arbeiten vor, tauscht sich aus und feiert. Einmal pro Monat möglich.',
      effects:{goldCost:180,foodConsumption:140,happiness:3,stability:1}}]:[])
  ];
}
