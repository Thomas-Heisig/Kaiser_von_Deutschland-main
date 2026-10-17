import { describe, expect, it, vi } from 'vitest';
import { nameForBirth } from './HistoricalNames';
import { CitizenSystem } from './CitizenSystem';

describe('Roadmap: historische Namen und Familien', () => {
  it('assigns time-sensitive names and clamps random boundaries', () => {
    expect(nameForBirth(1200,'female',()=>0)).toBe('Adelheid');
    expect(nameForBirth(1800,'male',()=>0)).toBe('Wilhelm');
    expect(nameForBirth(2000,'female',()=>0)).toBe('Lena');
    expect(nameForBirth(2000,'male',()=>1)).toBe('Jonas');
  });
  it('starts a pregnancy for adult cohabiting spouses, then creates a named baby', () => {
    const system=new CitizenSystem();
    const mother=system.createCitizen({firstName:'Anna',lastName:'Müller',gender:'female',
      age:27,birthYear:1200,birthMonth:3,profession:'farmer',regionId:'dorf'});
    const father=system.createCitizen({firstName:'Johann',lastName:'Müller',gender:'male',
      age:28,birthYear:1200,birthMonth:4,profession:'artisan',regionId:'dorf',familyId:mother.familyId});
    mother.familyRelations.push({citizenId:father.id,relationType:'spouse'});
    father.familyRelations.push({citizenId:mother.id,relationType:'spouse'});
    mother.health.fertility=100;
    mother.health.overall=95;
    mother.needs.food=90;
    const random=vi.spyOn(Math,'random').mockReturnValue(0);
    try {
      system.processMonth(1230,1);
      expect(mother.health.isPregnant).toBe(true);
      for(let month=2;month<=8;month++)system.processMonth(1230,month);
      expect(system.getPopulation()).toBe(3);
      const child=system.getAllCitizens().find(c=>c.age===0)!;
      expect(child.firstName).not.toBe('Kind');
      expect(child.firstName).not.toBe('Nachwuchs');
      expect(child.familyId).toBe(mother.familyId);
      expect(child.familyRelations).toContainEqual({citizenId:father.id,relationType:'parent'});
      expect(mother.health.isPregnant).toBe(false);
      system.processMonth(1231,1);
      expect(mother.health.isPregnant).toBe(false); // 24-month cooldown
    } finally { random.mockRestore(); }
  });
  it('does not begin pregnancy without a living cohabiting spouse',()=>{
    const system=new CitizenSystem();
    const citizen=system.createCitizen({firstName:'Anna',lastName:'Meyer',gender:'female',
      age:30,birthYear:1200,birthMonth:5,profession:'farmer',regionId:'dorf'});
    const random=vi.spyOn(Math,'random').mockReturnValue(0);
    try { system.processMonth(1230,1);expect(citizen.health.isPregnant).toBe(false); }
    finally { random.mockRestore(); }
  });
});
