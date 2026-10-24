import { describe, expect, it, vi, afterEach } from 'vitest';
import { CitizenSystem } from './CitizenSystem';
import { DemographicSystem } from './DemographicSystem';

afterEach(() => {
  vi.restoreAllMocks();
});

function createFamily(system: CitizenSystem) {
  const father = system.createCitizen({
    firstName: 'Heinrich', lastName: 'von Falkenstein', gender: 'male',
    age: 52, birthYear: 1170, birthMonth: 2, profession: 'farmer', regionId: 'dorf'
  });
  const mother = system.createCitizen({
    firstName: 'Elisabeth', lastName: 'von Falkenstein', gender: 'female',
    age: 48, birthYear: 1174, birthMonth: 5, profession: 'farmer', regionId: 'dorf',
    familyId: father.familyId
  });
  const son = system.createCitizen({
    firstName: 'Karl', lastName: 'von Falkenstein', gender: 'male',
    age: 24, birthYear: 1196, birthMonth: 7, profession: 'artisan', regionId: 'dorf',
    familyId: father.familyId
  });
  const daughter = system.createCitizen({
    firstName: 'Margarethe', lastName: 'von Falkenstein', gender: 'female',
    age: 20, birthYear: 1200, birthMonth: 9, profession: 'farmer', regionId: 'dorf',
    familyId: father.familyId
  });

  father.familyRelations.push(
    { citizenId: mother.id, relationType: 'spouse' },
    { citizenId: son.id, relationType: 'child' },
    { citizenId: daughter.id, relationType: 'child' }
  );
  mother.familyRelations.push(
    { citizenId: father.id, relationType: 'spouse' },
    { citizenId: son.id, relationType: 'child' },
    { citizenId: daughter.id, relationType: 'child' }
  );
  son.familyRelations.push(
    { citizenId: father.id, relationType: 'parent' },
    { citizenId: mother.id, relationType: 'parent' }
  );
  daughter.familyRelations.push(
    { citizenId: father.id, relationType: 'parent' },
    { citizenId: mother.id, relationType: 'parent' }
  );
  // Deterministische Ausgangslage: kein Startvermögen.
  for (const member of [father, mother, son, daughter]) member.wealth = 0;
  return { father, mother, son, daughter };
}

describe('Erbschaftssystem', () => {
  it('gibt 50 % an den ältesten Sohn und den Rest an die übrigen Erben', () => {
    const system = new CitizenSystem();
    const { father, mother, son, daughter } = createFamily(system);
    father.wealth = 1000;
    father.isAlive = false;

    expect(system.distributeInheritance(father.id, 1222, 3)).toBe(true);
    expect(father.wealth).toBe(0);
    expect(son.wealth).toBe(500);
    expect(daughter.wealth).toBe(500);
    expect(mother.wealth).toBe(0);
    expect(son.lifeEvents.some(e => e.type === 'inheritance' && e.description.includes('Haupterbe'))).toBe(true);
    expect(daughter.lifeEvents.some(e => e.type === 'inheritance')).toBe(true);
  });

  it('macht die Ehefrau zur Haupterbe, wenn keine erwachsenen Söhne existieren', () => {
    const system = new CitizenSystem();
    const { father, mother, son, daughter } = createFamily(system);
    son.age = 10; // minderjährig
    father.wealth = 800;
    father.isAlive = false;

    expect(system.distributeInheritance(father.id, 1222, 3)).toBe(true);
    expect(mother.wealth).toBe(400);
    expect(daughter.wealth).toBe(400);
    expect(son.wealth).toBe(0);
  });

  it('verteilt ohne Ehefrau und Sohn an die erwachsenen Kinder', () => {
    const system = new CitizenSystem();
    const { father, mother, son, daughter } = createFamily(system);
    mother.isAlive = false;
    father.wealth = 600;
    father.isAlive = false;

    expect(system.distributeInheritance(father.id, 1222, 3)).toBe(true);
    expect(son.wealth).toBe(300);
    expect(daughter.wealth).toBe(300);
  });

  it('führt nichts aus, wenn der Verstorbene kein Vermögen hat', () => {
    const system = new CitizenSystem();
    const { father, son } = createFamily(system);
    father.wealth = 0;
    father.isAlive = false;

    expect(system.distributeInheritance(father.id, 1222, 3)).toBe(false);
    expect(son.wealth).toBe(0);
  });

  it('verteilt das Vermögen automatisch bei einem Tod in der Demografie', () => {
    const system = new CitizenSystem();
    const { father, son, daughter } = createFamily(system);
    father.wealth = 400;
    // Erben machen unsterblich (Gesundheitsfaktor 2 → Todeschance 0),
    // damit nur der Vater stirbt und die Aufteilung eindeutig bleibt.
    son.health.overall = 200;
    daughter.health.overall = 200;
    const demographics = new DemographicSystem();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    demographics.processMonth(system, 1222, 3);

    expect(father.isAlive).toBe(false);
    expect(father.wealth).toBe(0);
    expect(son.wealth).toBe(200);
    expect(daughter.wealth).toBe(200);
  });
});
