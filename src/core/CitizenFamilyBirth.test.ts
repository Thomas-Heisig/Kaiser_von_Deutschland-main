import { describe, expect, it } from 'vitest';
import { CitizenSystem } from './CitizenSystem';

describe('Bürgerfamilien und Geburten', () => {
  it('creates a real child after pregnancy with reciprocal family ties and save restoration', () => {
    const system = new CitizenSystem();
    const mother = system.createCitizen({
      firstName:'Anna',lastName:'Müller',gender:'female',age:27,birthYear:1200,birthMonth:3,
      profession:'farmer',regionId:'dorf'
    });
    const father = system.createCitizen({
      firstName:'Johann',lastName:'Müller',gender:'male',age:30,birthYear:1200,birthMonth:4,
      profession:'artisan',regionId:'dorf',familyId:mother.familyId
    });
    mother.familyRelations.push({citizenId:father.id,relationType:'spouse'});
    father.familyRelations.push({citizenId:mother.id,relationType:'spouse'});
    mother.health.isPregnant=true;
    mother.health.pregnancyMonth=8;
    const before=system.getPopulation();
    system.processMonth(1230,7);
    expect(system.getPopulation()).toBe(before+1);
    const child=system.getAllCitizens().find(c=>c.id!==mother.id&&c.id!==father.id);
    expect(child).toBeDefined();
    expect(child?.age).toBe(0);
    expect(child?.birthYear).toBe(1230);
    expect(child?.familyId).toBe(mother.familyId);
    expect(child?.familyRelations).toEqual(expect.arrayContaining([
      {citizenId:mother.id,relationType:'parent'},
      {citizenId:father.id,relationType:'parent'}
    ]));
    expect(mother.familyRelations).toContainEqual({citizenId:child!.id,relationType:'child'});
    expect(father.familyRelations).toContainEqual({citizenId:child!.id,relationType:'child'});
    expect(system.getFamilyMembers(mother.familyId!)).toHaveLength(3);
    const restored=new CitizenSystem();
    restored.restoreCitizens(JSON.parse(JSON.stringify(system.getAllCitizens())));
    expect(restored.getFamilyMembers(mother.familyId!)).toHaveLength(3);
    expect(restored.getCitizen(child!.id)?.familyRelations).toHaveLength(2);
    expect(mother.health.isPregnant).toBe(false);
    system.processMonth(1230,8);
    expect(system.getPopulation()).toBe(before+1);
  });
});
