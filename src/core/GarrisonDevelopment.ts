import type { Kingdom } from './Kingdom';
import { doctrineForYear } from './HistoricalGameplay';
export type GarrisonDevelopmentId = 'training'|'equipment';
export function garrisonDevelopment(kingdom:Kingdom,year:number) {
  const soldiers=kingdom.military.infantry+kingdom.military.archers+kingdom.military.cavalry;
  const modern=year>=1850,early=year< -799;
  return ([
    {id:'training' as const,name:year<1500?'Waffenübung und Wachordnung':modern?'Verbandsübung und Einsatzplanung':'Drill und Formationsübung',
      field:'trainingLevel' as const,cost:{gold:Math.max(80,soldiers*2),food:Math.max(20,soldiers),wood:0,iron:0}},
    {id:'equipment' as const,name:early?'Schilde, Bögen und Werkzeuge erneuern':year<1500?'Waffen und Schutzkleidung verbessern':modern?'Technik und Versorgung modernisieren':'Bewaffnung und Pulverversorgung erneuern',
      field:'equipmentQuality' as const,cost:{gold:Math.max(120,soldiers*3),food:0,wood:early?Math.max(30,soldiers):0,iron:early?0:Math.max(20,Math.ceil(soldiers/2))}}
  ]).map(p=>({...p,era:doctrineForYear(year).label,gain:Math.max(0,Math.min(5,100-kingdom.military[p.field])),
    available:soldiers>0&&kingdom.military[p.field]<100&&Object.entries(p.cost).every(([key,cost])=>kingdom.resources[key as keyof typeof p.cost]>=cost)}));
}
export function developGarrison(kingdom:Kingdom,year:number,id:string):string {
  const p=garrisonDevelopment(kingdom,year).find(p=>p.id===id);
  if(!p||!p.available)throw Error('Garnisonsausbau nicht möglich: Truppen, Vorräte oder Entwicklungsspielraum fehlen.');
  for(const [key,cost] of Object.entries(p.cost))kingdom.resources[key as keyof typeof p.cost]-=cost;
  kingdom.military[p.field]+=p.gain;
  return `${p.name}: +${p.gain} ${p.field==='trainingLevel'?'Ausbildung':'Ausrüstung'}; Kosten ${p.cost.gold} Gold, ${p.cost.food} Nahrung, ${p.cost.wood} Holz, ${p.cost.iron} Eisen.`;
}
