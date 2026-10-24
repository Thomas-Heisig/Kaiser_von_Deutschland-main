import type { KingdomInfrastructure } from './Kingdom';

export type ProjectKind = 'building' | 'modernization' | 'campaign' | 'recruitment' | 'garrison' | 'duel';
export interface RealmProject {
  playerId:string; kind:ProjectKind; target:string; name:string;
  months:number; remaining:number; started:number; lastTick:number|null; count:number;
}
export const BUILD_MONTHS:Record<keyof KingdomInfrastructure,number>={
  farms:3,markets:6,churches:12,barracks:6,mines:9,roads:3,schools:6,hospitals:12,
  ports:18,walls:12,castles:36,universities:24,guildhalls:6,taverns:3,warehouses:4,workshops:6
};
export const BUILD_NAMES:Record<keyof KingdomInfrastructure,string>={
  farms:'Anbauflächen',markets:'Marktplatz',churches:'Kultstätte',barracks:'Truppenunterkunft',mines:'Mine',roads:'Wege',
  schools:'Lernstätte',hospitals:'Heilstätte',ports:'Hafen',walls:'Befestigung',castles:'Herrschaftssitz',universities:'Hochschule',
  guildhalls:'Handwerkshaus',taverns:'Gaststätte',warehouses:'Speicher',workshops:'Werkstatt'
};
/** Durations are game rules in calendar months, not asserted historical construction dates. */
export function constructionMonths(type:keyof KingdomInfrastructure,year:number):number {
  return Math.max(2,Math.ceil(BUILD_MONTHS[type]*(year>=1900?.5:year>=1750?.75:1)));
}
export class RealmProjects {
  private jobs:RealmProject[]=[];
  list(playerId:string):RealmProject[]{return this.jobs.filter(j=>j.playerId===playerId).map(j=>({...j}));}
  busy(playerId:string,kind:ProjectKind,target?:string):boolean{return this.jobs.some(j=>j.playerId===playerId&&j.kind===kind&&(target===undefined||j.target===target));}
  add(job:Omit<RealmProject,'remaining'|'lastTick'>):void {
    if(this.list(job.playerId).length>=12)throw Error('Höchstens zwölf laufende Vorhaben.');
    this.jobs.push({...job,remaining:job.months,lastTick:null});
  }
  advance(playerId:string,tick:number):RealmProject[]{
    const completed:RealmProject[]=[];
    for(const job of this.jobs){
      if(job.playerId!==playerId||tick<job.started||(job.lastTick!==null&&job.lastTick>=tick))continue;
      job.lastTick=tick;if(--job.remaining===0)completed.push({...job});
    }
    this.jobs=this.jobs.filter(j=>j.remaining>0);return completed;
  }
  serialize():RealmProject[]{return this.jobs.map(j=>({...j}));}
  removePlayer(playerId:string):void {this.jobs=this.jobs.filter(j=>j.playerId!==playerId&&!(j.kind==='duel'&&j.target===playerId));}
  restore(value:unknown,players:string[]):void {
    if(value===undefined){this.jobs=[];return;}
    if(!Array.isArray(value)||value.length>players.length*12)throw Error('Ungültige Vorhaben im Spielstand.');
    for(const j of value)if(!j||!players.includes(j.playerId)||!['building','modernization','campaign','recruitment','garrison','duel'].includes(j.kind)||
      typeof j.target!=='string'||typeof j.name!=='string'||!Number.isSafeInteger(j.started)||
      !Number.isInteger(j.months)||j.months<1||j.months>120||!Number.isInteger(j.remaining)||j.remaining<1||j.remaining>j.months||
      (j.lastTick!==null&&(!Number.isSafeInteger(j.lastTick)||j.lastTick<j.started))||!Number.isSafeInteger(j.count)||j.count<1)
      throw Error('Ungültige Vorhaben im Spielstand.');
    this.jobs=value.map(j=>({...j}));
  }
}
