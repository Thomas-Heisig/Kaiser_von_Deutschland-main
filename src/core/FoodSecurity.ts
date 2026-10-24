import type { Kingdom } from './Kingdom';

/** Predictable spoilage plus optional, bounded shocks. No guaranteed punishment for success. */
export function foodSecurity(kingdom:Kingdom) {
  const consumption=kingdom.getMonthlyBalance().consumption.food;
  const capacity=Math.max(12000,consumption*18)+kingdom.infrastructure.warehouses*6000;
  const exposed=Math.max(0,kingdom.resources.food-capacity);
  const spoilage=Math.floor(exposed*.025);
  const risk=Math.min(.12,.012+Math.max(0,kingdom.infrastructure.farms-5)*.0008+exposed/2000000);
  return {capacity,exposed,spoilage,risk};
}
export function processFoodSecurity(kingdom:Kingdom,events:boolean,random= Math.random):string[] {
  const before=foodSecurity(kingdom),messages:string[]=[];
  kingdom.resources.food=Math.max(0,kingdom.resources.food-before.spoilage);
  if(before.spoilage>0)messages.push(`Lagerverluste: ${before.spoilage} Nahrung verdorben. Geschützte Lagerkapazität: ${Math.round(before.capacity)}. Weitere Speicher vermindern den ungeschützten Überschuss.`);
  if(events&&random()<before.risk) {
    const kind=random()<.5?'Vorratsschädlinge':'Überschwemmte Felder und Speicher';
    const protection=1/(1+kingdom.infrastructure.warehouses*.12);
    const loss=Math.floor(kingdom.resources.food*(.12+random()*.16)*protection);
    kingdom.resources.food=Math.max(0,kingdom.resources.food-loss);
    kingdom.happiness=Math.max(0,kingdom.happiness-3);
    const damaged=kind.startsWith('Überschwemmte')&&kingdom.infrastructure.farms>=12?Math.max(1,Math.floor(kingdom.infrastructure.farms*.08)):0;
    kingdom.infrastructure.farms-=damaged;
    messages.push(`${kind}: ${loss} Nahrung verloren, Zufriedenheit −3.${damaged?` ${damaged} Anbauflächen verwüstet; ihre Produktion fällt bis zum Wiederaufbau aus.`:''} Vorratshaltung und Handel bleiben wichtig. Erhöhte Risiken bei vielen Anbauflächen und ungeschützten Lagern.`);
  }
  return messages;
}
