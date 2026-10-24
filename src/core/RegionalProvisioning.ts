import type { Kingdom } from './Kingdom';

/** Administrative catchments are a game model, not historic districts or census data. */
export const PROVISION_REGIONS = [
  {id:'geest',name:'Siedlungen auf der Geest',exposure:.85},
  {id:'streams',name:'Siedlungen an den Bachniederungen',exposure:1.15},
  {id:'outlying',name:'Entlegene Höfe und Weiler',exposure:1.3}
] as const;
export type ProvisionRegionId = typeof PROVISION_REGIONS[number]['id'];
export type ProvisionAction = 'relief'|'storage'|'settlement';
export interface ProvisionRegion {
  id:ProvisionRegionId; hunger:number; trust:number; storage:number;
  reliefUntil:number|null; settlementUntil:number|null; lastAction:number|null;
  crisisMonths:number; emigrated:number;
}
export interface ProvisionSnapshot { version:1; lastMonth:number|null; regions:ProvisionRegion[] }
export interface ProvisionOption {
  id:ProvisionAction;name:string;description:string;cost:{gold:number;food:number;wood:number;stone:number};
  canStart:boolean;blockers:string[];
}
const cap=(n:number)=>Math.max(0,Math.min(100,n));
export class RegionalProvisioning {
  private lastMonth:number|null=null;
  private regions:ProvisionRegion[]=PROVISION_REGIONS.map(({id})=>({id,hunger:0,trust:50,storage:0,
    reliefUntil:null,settlementUntil:null,lastAction:null,crisisMonths:0,emigrated:0}));

  public overview(kingdom:Kingdom,tick:number) {
    const balance=kingdom.getMonthlyBalance();
    return this.regions.map(region=>({...region,...PROVISION_REGIONS.find(r=>r.id===region.id)!,
      reserves:balance.consumption.food>0?kingdom.resources.food/balance.consumption.food:99,
      reliefMonths:Math.max(0,(region.reliefUntil??tick)-tick),
      settlementMonths:Math.max(0,(region.settlementUntil??tick)-tick),
      options:this.options(region.id,kingdom,tick)}));
  }
  public options(id:string,kingdom:Kingdom,tick:number):ProvisionOption[] {
    const region=this.requireRegion(id);
    return ([
      {id:'relief' as const,name:'Nothilfe verteilen',description:'Zusätzliche Rationen: Hunger −25, Vertrauen +4, drei Monatswechsel lang geringerer Versorgungsdruck.',cost:{gold:120,food:180,wood:0,stone:0}},
      {id:'storage' as const,name:'Örtliche Speicher ausbauen',description:'Dauerhafte Versorgungsvorsorge: Lagerstufe +1 (maximal 3), künftiger Hungerdruck −8 je Stufe, Vertrauen +3.',cost:{gold:400*(region.storage+1),food:0,wood:160,stone:80}},
      {id:'settlement' as const,name:'Haushalte beim Bleiben unterstützen',description:'Unterkunft und Unterstützung: Vertrauen +10; drei Monatswechsel lang keine zusätzliche regionale Abwanderung. Reichsweite Folgen von Hunger bleiben wirksam.',cost:{gold:220,food:80,wood:100,stone:0}}
    ]).map(option=>{
      const blockers:string[]=[];
      if(region.lastAction===tick)blockers.push('In diesem Gebiet wurde diesen Monat bereits gehandelt.');
      if(option.id==='storage'&&region.storage>=3)blockers.push('Speicher vollständig ausgebaut.');
      if(option.id==='relief'&&(region.reliefUntil??tick)>tick)blockers.push('Nothilfe wirkt noch.');
      if(option.id==='settlement'&&(region.settlementUntil??tick)>tick)blockers.push('Haushaltshilfe wirkt noch.');
      for(const [key,cost] of Object.entries(option.cost))if(kingdom.resources[key as keyof typeof option.cost]<cost)blockers.push('Vorräte reichen nicht.');
      return {...option,blockers,canStart:!blockers.length};
    });
  }
  public act(id:string,action:string,kingdom:Kingdom,tick:number):string {
    const option=this.options(id,kingdom,tick).find(o=>o.id===action);
    if(!option)throw Error('Unbekannte Versorgungsmaßnahme.');
    if(!option.canStart)throw Error(option.blockers.join(' '));
    const region=this.requireRegion(id);
    for(const [key,cost] of Object.entries(option.cost))kingdom.resources[key as keyof typeof option.cost]-=cost;
    const until=tick+3+(this.lastMonth===tick?1:0);
    if(action==='relief') {region.hunger=cap(region.hunger-25);region.trust=cap(region.trust+4);region.reliefUntil=until;}
    if(action==='storage') {region.storage++;region.trust=cap(region.trust+3);}
    if(action==='settlement') {region.trust=cap(region.trust+10);region.settlementUntil=until;}
    region.lastAction=tick;
    return `${PROVISION_REGIONS.find(r=>r.id===id)!.name}: ${option.name} · ${option.cost.gold} Gold, ${option.cost.food} Nahrung, ${option.cost.wood} Holz, ${option.cost.stone} Stein. ${option.description}`;
  }
  public advance(kingdom:Kingdom,tick:number):string[] {
    if(this.lastMonth!==null&&tick<=this.lastMonth)return [];
    this.lastMonth=tick;
    const balance=kingdom.getMonthlyBalance(),messages:string[]=[];
    const reserves=balance.consumption.food>0?kingdom.resources.food/balance.consumption.food:99;
    for(const region of this.regions) {
      const definition=PROVISION_REGIONS.find(r=>r.id===region.id)!;
      const relief=(region.reliefUntil??tick)>tick;
      const pressure=Math.max(0,(2-reserves)*40+(balance.net.food<0&&reserves<2?10:0));
      const target=cap(pressure*definition.exposure-region.storage*8-Math.min(10,kingdom.infrastructure.roads*2)-(relief?35:0));
      const wasCrisis=region.hunger>=60;
      region.hunger=cap(region.hunger+Math.max(-15,Math.min(15,target-region.hunger)));
      if(region.hunger>=60) {
        region.crisisMonths++;
        region.trust=cap(region.trust-2);
        if(!wasCrisis)messages.push(`${definition.name}: Versorgungskrise. Nothilfe, Speicher oder Haushaltshilfe können die Lage verbessern.`);
      } else {
        if(wasCrisis)messages.push(`${definition.name}: Die Versorgungskrise entspannt sich.`);
        region.crisisMonths=0;
        if(region.hunger<20)region.trust=cap(region.trust+.5);
      }
      if(region.crisisMonths>=3&&region.hunger>=70&&(region.settlementUntil??tick)<=tick) {
        const leaving=Math.min(12,Math.floor(kingdom.population.peasants*.002));
        if(leaving>0) {
          kingdom.population.peasants-=leaving;region.emigrated+=leaving;
          messages.push(`${definition.name}: ${leaving} Menschen wandern wegen anhaltender Versorgungsknappheit ab. Sie fehlen künftig in Arbeitskraft, Verbrauch und Steuerbasis.`);
        }
      }
    }
    return messages;
  }
  /** Successful citizen work has a local effect in the most strained catchment. */
  public support(missionId:string):string|null {
    const effect=({grain:15,water:10,neighbors:8,irrigation:12,mills:10,fisheries:10,sanitation:8} as Record<string,number>)[missionId];
    if(!effect)return null;
    const region=[...this.regions].sort((a,b)=>b.hunger-a.hunger||a.trust-b.trust)[0];
    const before=region.hunger;region.hunger=cap(region.hunger-effect);region.trust=cap(region.trust+2);
    return `${PROVISION_REGIONS.find(r=>r.id===region.id)!.name}: Bürgerhilfe senkt Hunger um ${Math.round(before-region.hunger)} Punkte und stärkt das örtliche Vertrauen um 2.`;
  }
  private requireRegion(id:string):ProvisionRegion {
    const region=this.regions.find(r=>r.id===id);if(!region)throw Error('Unbekanntes Versorgungsgebiet.');return region;
  }
  public serialize():ProvisionSnapshot {return {version:1,lastMonth:this.lastMonth,regions:this.regions.map(r=>({...r}))};}
  public static restore(value:unknown,maxTick=Infinity):RegionalProvisioning {
    const s=value as ProvisionSnapshot;
    const month=(v:unknown)=>v===null||(Number.isSafeInteger(v)&&Number(v)>=-23987&&Number(v)<=12000000);
    if(!s||s.version!==1||!month(s.lastMonth)||(s.lastMonth!==null&&s.lastMonth>maxTick)||!Array.isArray(s.regions)||s.regions.length!==3||
      s.regions.some((r,i)=>!r||r.id!==PROVISION_REGIONS[i].id||
        [r.hunger,r.trust].some(v=>!Number.isFinite(v)||v<0||v>100)||
        !Number.isInteger(r.storage)||r.storage<0||r.storage>3||
        !Number.isSafeInteger(r.crisisMonths)||r.crisisMonths<0||
        !Number.isSafeInteger(r.emigrated)||r.emigrated<0||
        !month(r.reliefUntil)||!month(r.settlementUntil)||!month(r.lastAction)||
        (r.lastAction!==null&&r.lastAction>maxTick)||
        (r.reliefUntil!==null&&r.reliefUntil>maxTick+3)||(r.settlementUntil!==null&&r.settlementUntil>maxTick+3)))throw Error('Beschädigte regionale Versorgung.');
    const system=new RegionalProvisioning();system.lastMonth=s.lastMonth;system.regions=structuredClone(s.regions);return system;
  }
}
