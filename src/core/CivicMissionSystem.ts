import type { Citizen, CitizenSkills, Profession } from './CitizenSystem';
import type { Kingdom } from './Kingdom';

export type CivicResource = 'gold'|'food'|'wood'|'stone'|'iron';
export interface CivicMission {
  id:string; title:string; description:string; minYear:number; maxYear?:number;
  preferredSkill:keyof CitizenSkills; months:number; cost:Partial<Record<CivicResource,number>>;
  reward:Partial<Record<CivicResource,number>>; happiness?:number; stability?:number;
  /** Occupations with historic practical experience in the assignment. */
  professions?:readonly Profession[];
}
export interface CivicAssignment {
  playerId:string; citizenId:string; missionId:string; started:number; completedMonths:number;
}
export interface CivicCompletion {
  playerId:string; citizenId:string; missionId:string; success:boolean; message:string;
}
export const CIVIC_MISSIONS: readonly CivicMission[] = [
  {id:'grain',professions:['farmer','laborer'],title:'Dörfer mit Korn versorgen',description:'Ein örtlicher Verwalter verteilt Nahrung und verbessert die Vorratslage.',minYear:0,preferredSkill:'agriculture',months:2,cost:{gold:120,food:200},reward:{food:320},happiness:3},
  {id:'guild',professions:['artisan','blacksmith','carpenter','weaver'],title:'Handwerkszunft aufbauen',description:'Meister und Gesellen errichten eine verlässliche Werkstattorganisation.',minYear:1100,maxYear:1850,preferredSkill:'craftsmanship',months:4,cost:{gold:400,wood:200},reward:{gold:650,iron:90},stability:2},
  {id:'merchant',professions:['merchant'],title:'Handelswege erschließen',description:'Ein Bürger knüpft wirtschaftliche Verbindungen zwischen Märkten.',minYear:1100,preferredSkill:'trading',months:3,cost:{gold:320,food:140},reward:{gold:620},happiness:1},
  {id:'school',professions:['scholar','clergy'],title:'Schreib- und Schulunterricht fördern',description:'Eine Lehrkraft bildet junge Bürger über mehrere Monate aus.',minYear:1250,preferredSkill:'literacy',months:5,cost:{gold:380,wood:110},reward:{gold:220},stability:4},
  {id:'factory',professions:['artisan','blacksmith','laborer'],title:'Betriebe mechanisieren',description:'Fachkräfte verbessern die Produktionsabläufe in den Werkstätten.',minYear:1800,preferredSkill:'craftsmanship',months:5,cost:{gold:750,iron:180},reward:{gold:1400},stability:2},
  {id:'sanitation',professions:['scholar','clergy'],title:'Trinkwasser und Gesundheit sichern',description:'Medizinische Helfer verbessern Hygiene und Versorgung.',minYear:1850,preferredSkill:'medicine',months:4,cost:{gold:600,stone:120},reward:{food:250},happiness:5},
  {id:'rebuilding',professions:['carpenter','artisan','laborer'],title:'Wohnviertel wiederaufbauen',description:'Handwerker beheben Schäden und schaffen sichere Unterkünfte.',minYear:1945,maxYear:1980,preferredSkill:'craftsmanship',months:6,cost:{gold:800,wood:240,stone:300},reward:{gold:650},happiness:8,stability:4},
  {id:'fisheries',title:'Fischfang und Küstenversorgung',description:'Fischer und Händler sichern Nahrung aus den Küstenorten.',minYear:1100,preferredSkill:'agriculture',professions:['fisherman','merchant'],months:3,cost:{gold:210,wood:80},reward:{food:350,gold:100},happiness:2},
  {id:'mills',title:'Wassermühlen und Backstuben fördern',description:'Handwerker verbessern die Mehlverarbeitung und die Versorgung der Städte.',minYear:1150,maxYear:1900,preferredSkill:'craftsmanship',professions:['artisan','carpenter','baker'],months:4,cost:{gold:360,wood:140,stone:90},reward:{food:480},stability:2},
  {id:'printing',title:'Druckerei und Lesestuben gründen',description:'Schriftkundige verbreiten Wissen über handwerklich organisierte Druckereien.',minYear:1450,preferredSkill:'literacy',professions:['scholar','clergy','artisan'],months:5,cost:{gold:550,wood:160},reward:{gold:450},happiness:3,stability:2},
  {id:'rail',title:'Eisenbahn und Güterverkehr erschließen',description:'Ingenieurnahe Handwerker und Händler verbessern den Warentransport.',minYear:1835,preferredSkill:'craftsmanship',professions:['artisan','blacksmith','merchant'],months:6,cost:{gold:1150,iron:320,wood:130},reward:{gold:1850},stability:3},
  {id:'power',title:'Elektrische Infrastruktur verbessern',description:'Fachkräfte modernisieren Versorgung und städtische Betriebe.',minYear:1890,preferredSkill:'craftsmanship',professions:['artisan','blacksmith','laborer'],months:5,cost:{gold:1400,iron:280},reward:{gold:1900},happiness:3},
  {id:'computer',professions:['scholar','merchant'],title:'Verwaltung digitalisieren',description:'Ein Team verbessert Abläufe und sichere Aktenführung.',minYear:1990,preferredSkill:'literacy',months:4,cost:{gold:900,iron:110},reward:{gold:1200},stability:5}
];
const bounded=(n:number)=>Math.max(0,Math.min(100,n));
export class CivicMissionSystem {
  private assignments:CivicAssignment[]=[];
  private history:CivicCompletion[]=[];
  public options(year:number):readonly CivicMission[] {
    return CIVIC_MISSIONS.filter(m=>year>=m.minYear&&year<=(m.maxYear??Infinity));
  }
  public active(playerId:string):CivicAssignment[] { return this.assignments.filter(x=>x.playerId===playerId).map(x=>({...x})); }
  public historyFor(playerId:string):CivicCompletion[] { return this.history.filter(x=>x.playerId===playerId).map(x=>({...x})); }
  public start(playerId:string,citizen:Citizen,kingdom:Kingdom,missionId:string,year:number,month:number):CivicAssignment {
    const mission=this.options(year).find(x=>x.id===missionId);
    if(!mission)throw Error('Auftrag in dieser Epoche nicht verfügbar.');
    if(!citizen.isAlive||citizen.isPlayerCharacter||citizen.age<16)throw Error('Dieser Bürger kann keinen Auftrag übernehmen.');
    if(this.assignments.some(x=>x.citizenId===citizen.id))throw Error('Dieser Bürger ist bereits beauftragt.');
    if(this.active(playerId).length>=3)throw Error('Höchstens drei Bürgeraufträge gleichzeitig.');
    for(const [key,value] of Object.entries(mission.cost) as [CivicResource,number][])
      if(kingdom.resources[key]<value)throw Error('Nicht genügend '+key+' für den Auftrag.');
    for(const [key,value] of Object.entries(mission.cost) as [CivicResource,number][])kingdom.resources[key]-=value;
    const assignment={playerId,citizenId:citizen.id,missionId:mission.id,started:year*12+month,completedMonths:0};
    this.assignments.push(assignment);
    return {...assignment};
  }
  public advance(playerId:string,kingdom:Kingdom,year:number,month:number,getCitizen:(id:string)=>Citizen|undefined):CivicCompletion[] {
    const events:CivicCompletion[]=[];
    for(const assignment of [...this.assignments].filter(x=>x.playerId===playerId)){
      if(assignment.started>=year*12+month)continue;
      const citizen=getCitizen(assignment.citizenId);
      const mission=CIVIC_MISSIONS.find(m=>m.id===assignment.missionId);
      if(!mission||!citizen?.isAlive){
        const event={playerId,citizenId:assignment.citizenId,missionId:assignment.missionId,success:false,message:'Bürgerauftrag abgebrochen: beauftragte Person nicht mehr verfügbar.'};
        this.history.unshift(event);events.push(event);
        this.assignments=this.assignments.filter(x=>x!==assignment);continue;
      }
      assignment.completedMonths++;
      if(assignment.completedMonths<mission.months)continue;
      const proficiency=citizen.skills[mission.preferredSkill];
      // Skills, work experience and personal discipline shape tangible outcomes.
      const character = citizen.personality;
      const experience = Math.max(0, Math.min(100, citizen.professionLevel || 0));
      const discipline = character && Number.isFinite(character.discipline) ? character.discipline : 50;
      // A matching trade and a settled social environment matter as much as raw skill.
      // Lower effects for unfamiliar jobs are intentional, but never cause a loss.
      const professionBonus = mission.professions?.includes(citizen.profession) ? 0.12 : 0;
      const localBonus = citizen.needs && Number.isFinite(citizen.needs.safety)
        ? Math.max(-0.04, Math.min(0.04, (citizen.needs.safety - 50) / 1000)) : 0;
      const factor = Math.max(0.5, Math.min(1.45,
        0.65 + Math.max(0, Math.min(100, proficiency)) / 250 +
        experience / 1000 + Math.max(0, Math.min(100, discipline)) / 1000 +
        professionBonus + localBonus));
      for(const [key,value] of Object.entries(mission.reward) as [CivicResource,number][])
        kingdom.resources[key]+=Math.round(value*factor);
      kingdom.happiness=bounded(kingdom.happiness+(mission.happiness??0));
      kingdom.stats.stability=bounded(kingdom.stats.stability+(mission.stability??0));
      citizen.skills[mission.preferredSkill]=bounded(proficiency+2);
      citizen.professionLevel=bounded((citizen.professionLevel??0)+1);
      citizen.reputation=bounded((citizen.reputation??0)+2);
      citizen.lifeEvents??=[];
      citizen.lifeEvents.push({year,month,type:'achievement',description:'Abschluss: '+mission.title});
      // Limit long-lived character histories for multi-century performance and save sizes.
      if (citizen.lifeEvents.length > 100) citizen.lifeEvents.splice(1, citizen.lifeEvents.length - 100);
      const event={playerId,citizenId:citizen.id,missionId:mission.id,success:true,
        message:citizen.firstName+' '+citizen.lastName+' hat „'+mission.title+'“ abgeschlossen.'};
      this.history.unshift(event);events.push(event);
      this.assignments=this.assignments.filter(x=>x!==assignment);
    }
    this.history=this.history.slice(0,80);
    return events;
  }
  public removePlayer(playerId:string):void {this.assignments=this.assignments.filter(x=>x.playerId!==playerId);}
  public serialize():{assignments:CivicAssignment[];history:CivicCompletion[]} {
    return {assignments:this.assignments.map(x=>({...x})),history:this.history.map(x=>({...x}))};
  }
  public load(data:unknown,playerIds:Set<string>,getCitizen:(id:string)=>Citizen|undefined):void {
    if(!data||typeof data!=='object')throw Error('Beschädigte Bürgeraufträge.');
    const snapshot=data as {assignments?:unknown;history?:unknown};
    if(!Array.isArray(snapshot.assignments)||snapshot.assignments.length>100||
       !Array.isArray(snapshot.history)||snapshot.history.length>80)throw Error('Ungültige Bürgeraufträge.');
    const assignments=snapshot.assignments as CivicAssignment[];
    if(assignments.some(x=>!x||!playerIds.has(x.playerId)||typeof x.citizenId!=='string'||
      !getCitizen(x.citizenId)||!CIVIC_MISSIONS.some(m=>m.id===x.missionId)||
      !Number.isSafeInteger(x.started)||x.started<0||
      !Number.isSafeInteger(x.completedMonths)||x.completedMonths<0||x.completedMonths>100))
      throw Error('Ungültige Bürgeraufträge im Spielstand.');
    this.assignments=assignments.map(x=>({...x}));
    this.history=(snapshot.history as CivicCompletion[]).filter(x=>x&&playerIds.has(x.playerId)&&typeof x.message==='string').map(x=>({...x}));
  }
}
