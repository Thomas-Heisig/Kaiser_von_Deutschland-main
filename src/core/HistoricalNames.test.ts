import { describe, expect, it, vi } from 'vitest';
import { nameForBirth, citizenName, nameSetFor } from './HistoricalNames';
import { CitizenSystem } from './CitizenSystem';

describe('Roadmap: historische Namen und Familien', () => {
  it('uses birth cohorts and avoids hereditary modern surnames in early periods', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      // Vorzeit: fiktionaler Bestand, kein Nachname, keine modernen Namen.
      expect(citizenName(-2000, 'female')).toEqual({firstName:'Alva',lastName:''});
      // Frühmittelalter: kein erblicher Familienname, sondern ein Beiname.
      expect(citizenName(1100, 'male').lastName).not.toBe('Meyer');
      expect(citizenName(1960, 'male').firstName).toBe('Thomas');
      expect(citizenName(2000, 'female').firstName).toBe('Lena');
    } finally { random.mockRestore(); }
  });
  it('never returns generated placeholder names for any birth year', () => {
    for (const year of [-2000, -500, 0, 300, 800, 1000, 1200, 1500, 1800, 1900, 1960, 2000]) {
      for (const gender of ['male','female','other'] as const) {
        for (let i = 0; i < 40; i++) {
          const name = nameForBirth(year, gender);
          expect(name).not.toMatch(/^(Kind|Nachwuchs|Bewohner|Bewohnerin)\s*\d*$/);
          expect(name.trim().length).toBeGreaterThan(1);
        }
      }
    }
  });
  it('uses attested names for antiquity and marks prehistory as fictional', () => {
    expect(nameSetFor(100).evidence).toBe('attested');
    expect(nameSetFor(100).familyNames).toBeNull();
    expect(nameSetFor(-2000).evidence).toBe('fictional');
    expect(nameSetFor(900).evidence).toBe('attested');
  });
  it('assigns time-sensitive names and clamps random boundaries', () => {
    expect(nameForBirth(1200,'female',()=>0)).toBe('Adelheid');
    expect(nameForBirth(1800,'male',()=>0)).toBe('Wilhelm');
    expect(nameForBirth(2000,'female',()=>0)).toBe('Lena');
    // Upper clamp: a roll of 1 must stay inside the list, not overflow to undefined.
    expect(nameForBirth(2000,'male',()=>1)).toBe('Emil');
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
    try { system.processMonth(1230,1);expect(citizen.health.isPregnant).toBeFalsy(); }
    finally { random.mockRestore(); }
  });
});
