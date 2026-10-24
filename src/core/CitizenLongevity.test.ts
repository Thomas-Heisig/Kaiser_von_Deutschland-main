import {describe,it,expect,vi} from 'vitest';
import {CitizenSystem} from './CitizenSystem';
import {DemographicSystem} from './DemographicSystem';

function randomSequence(seed:number):()=>number {
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
describe('Citizen life, households and generations',()=>{
  it.each([1200,-100])('maintains cared-for people and produces adult descendants across 60 years from %s',start=>{
    const random=vi.spyOn(Math,'random').mockImplementation(randomSequence(724));
    try {
      let citizens=new CitizenSystem();let demography=new DemographicSystem();
      for(let i=0;i<120;i++)citizens.createCitizen({firstName:'Person '+i,lastName:'Test',gender:i%2?'male':'female',
        age:20+i%20,birthYear:start-20-i%20,birthMonth:1,profession:'farmer',regionId:'dorf-'+Math.floor(i/40)});
      const initial=new Set(citizens.getAllCitizens().map(c=>c.id));
      let tenYearSurvivors=0,tenYearHealth=0;
      for(let year=start;year<start+60;year++)for(let month=1;month<=12;month++) {
        citizens.processMonth(year,month);
        demography.processMonth(citizens,year,month);
        if(year===start+9&&month===12) {
          const alive=citizens.getAliveCitizens().filter(c=>initial.has(c.id));
          tenYearSurvivors=alive.length;tenYearHealth=alive.reduce((sum,c)=>sum+c.health.overall,0)/alive.length;
        }
        if(year===start+29&&month===12) {
          const restored=new CitizenSystem();restored.restoreCitizens(JSON.parse(JSON.stringify(citizens.getAllCitizens())));
          citizens=restored;demography=new DemographicSystem();
        }
      }
      expect(tenYearSurvivors).toBeGreaterThan(75);
      expect(tenYearHealth).toBeGreaterThan(65);
      const adults=citizens.getAliveCitizens().filter(c=>!initial.has(c.id)&&c.age>=18);
      expect(adults.length).toBeGreaterThan(15);
      expect(adults.some(c=>c.profession==='farmer')).toBe(true);
      expect(citizens.getAllCitizens().filter(c=>!c.isAlive).length).toBeGreaterThan(0);
      console.info(JSON.stringify({start,initial:120,tenYearSurvivors,tenYearHealth:Math.round(tenYearHealth),after60Years:citizens.getPopulation(),adultDescendants:adults.length}));
    } finally {random.mockRestore();}
  });
  it('recovers supplied needs, retains real shortages and never ages twice in one month',()=>{
    const s=new CitizenSystem();const c=s.createCitizen({firstName:'Anna',lastName:'Test',gender:'female',age:25,birthYear:1175,birthMonth:3,profession:'farmer',regionId:'dorf'});
    c.needs.food=5;c.needs.shelter=5;c.needs.health=5;c.health.overall=40;
    for(let month=1;month<=12;month++)s.processMonth(1200,month);
    expect(c.needs.food).toBeGreaterThan(60);
    expect(c.age).toBe(25);
    const snapshot=JSON.stringify(c);s.processMonth(1200,12);expect(JSON.stringify(c)).toBe(snapshot);
    for(let month=1;month<=12;month++)s.processMonth(1201,month,()=>({food:0,shelter:5,health:5}));
    expect(c.needs.food).toBeLessThan(15);expect(c.health.overall).toBeLessThan(40);
  });
  it('does not pair minors or close relatives and persists household links',()=>{
    const random=vi.spyOn(Math,'random').mockReturnValue(0);
    try {
      const s=new CitizenSystem();
      const a=s.createCitizen({firstName:'A',lastName:'Test',gender:'female',age:20,birthYear:1180,birthMonth:1,profession:'farmer',regionId:'dorf'});
      const b=s.createCitizen({firstName:'B',lastName:'Test',gender:'male',age:22,birthYear:1178,birthMonth:1,profession:'farmer',regionId:'dorf'});
      a.familyRelations.push({citizenId:b.id,relationType:'sibling'});b.familyRelations.push({citizenId:a.id,relationType:'sibling'});
      const child=s.createCitizen({firstName:'C',lastName:'Test',gender:'male',age:18,birthYear:1182,birthMonth:12,profession:'farmer',regionId:'dorf'});
      s.processMonth(1200,1);
      expect(s.getAllCitizens().every(c=>!c.familyRelations.some(r=>r.relationType==='spouse'))).toBe(true);
      expect(child.age).toBe(17);
      s.createCitizen({firstName:'D',lastName:'Test',gender:'male',age:25,birthYear:1176,birthMonth:1,profession:'farmer',regionId:'dorf'});
      s.processMonth(1201,1);
      expect(a.familyRelations.some(r=>r.relationType==='spouse')).toBe(true);
      const restored=new CitizenSystem();restored.restoreCitizens(structuredClone(s.getAllCitizens()));
      expect(restored.getFamilyMembers(a.familyId!).length).toBeGreaterThan(1);
    } finally {random.mockRestore();}
  });
});
