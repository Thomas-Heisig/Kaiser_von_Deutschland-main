import { describe, expect, it } from 'vitest';
import './PolityData';
import {
  epochForHistoricalYear,
  officesFor,
  PolityCatalog,
  validateCombination,
  validateEpochSystem,
  validateOffice,
  validateRegionEpoch
} from './PolityModel';
import { EPOCHS, OFFICES, POLITICAL_SYSTEMS, REGIONS } from './PolityData';

describe('PolityCatalog – Struktur', (): void => {
  it('is initialized with all four data sets', (): void => {
    expect(PolityCatalog.getEpochs().length).toBeGreaterThan(0);
    expect(PolityCatalog.getRegions().length).toBeGreaterThan(0);
    expect(PolityCatalog.getSystems().length).toBeGreaterThan(0);
    expect(PolityCatalog.getOffices().length).toBeGreaterThan(0);
  });

  it('exports the same counts as the raw data', (): void => {
    expect(PolityCatalog.getEpochs()).toHaveLength(EPOCHS.length);
    expect(PolityCatalog.getRegions()).toHaveLength(REGIONS.length);
    expect(PolityCatalog.getSystems()).toHaveLength(POLITICAL_SYSTEMS.length);
    expect(PolityCatalog.getOffices()).toHaveLength(OFFICES.length);
  });

  it('rejects duplicate IDs during initialization', (): void => {
    expect(() => PolityCatalog.initialize({
      epochs: [
        { id: 'x', name: 'A', yearStart: 1, yearEnd: 2, evidence: 'belegt', description: '', sourceNote: '' },
        { id: 'x', name: 'B', yearStart: 3, yearEnd: 4, evidence: 'belegt', description: '', sourceNote: '' }
      ],
      regions: [], systems: [], offices: []
    })).toThrow('doppelte ID');
  });

  it('has no dangling references from systems and offices into epochs', (): void => {
    for (const system of PolityCatalog.getSystems()) {
      for (const epochId of system.epochIds) {
        expect(PolityCatalog.getEpoch(epochId), `${system.id} → ${epochId}`).toBeDefined();
      }
    }
    for (const office of PolityCatalog.getOffices()) {
      for (const epochId of office.epochIds) {
        expect(PolityCatalog.getEpoch(epochId), `${office.id} → ${epochId}`).toBeDefined();
      }
      for (const systemId of office.systemIds) {
        expect(PolityCatalog.getSystem(systemId), `${office.id} → ${systemId}`).toBeDefined();
      }
    }
  });

  it('has no dangling region references in systems', (): void => {
    for (const system of PolityCatalog.getSystems()) {
      for (const regionId of system.regionIds) {
        expect(PolityCatalog.getRegion(regionId), `${system.id} → ${regionId}`).toBeDefined();
      }
    }
  });
});

describe('Regel 1: Epoche ↔ politisches System', (): void => {
  it('accepts a documented combination', (): void => {
    // Kaisertum des Heiligen Römischen Reiches im Hochmittelalter ist belegt.
    const result = validateEpochSystem('hochmittelalter', 'kaisertum_hrr');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a system that is not evidenced for the epoch', (): void => {
    // Das Kaiserreich (1871–1918) kann nicht im Hochmittelalter liegen.
    const result = validateEpochSystem('hochmittelalter', 'konstitutionelle_monarchie');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('nicht belegt');
  });

  it('rejects unknown epochs and systems with clear German messages', (): void => {
    expect(validateEpochSystem('gibt-es-nicht', 'kaisertum_hrr').errors[0])
      .toContain('Unbekannte Epoche');
    expect(validateEpochSystem('hochmittelalter', 'gibt-es-nicht').errors[0])
      .toContain('Unbekanntes politisches System');
  });
});

describe('Regel 2: System ↔ Amt', (): void => {
  it('accepts an evidenced office in its system and epoch', (): void => {
    // Der Bundeskanzler existiert in der parlamentarischen Republik der Bundesrepublik.
    const result = validateOffice('bundeskanzler', 'parlamentarische_republik', 'bundesrepublik_vereint');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a modern office in a medieval epoch ("Bundeskanzler im Jahr 1200")', (): void => {
    const result = validateOffice('bundeskanzler', 'kaisertum_hrr', 'hochmittelalter');
    expect(result.valid).toBe(false);
    // Sowohl System- als auch Epochenbindung müssen verletzt sein.
    expect(result.errors.some((error) => error.includes('existiert nicht im System'))).toBe(true);
    expect(result.errors.some((error) => error.includes('nicht belegt'))).toBe(true);
  });

  it('rejects the emperor in a republic ("Kaiser in einer Republik")', (): void => {
    const result = validateOffice('kaiser', 'parlamentarische_republik', 'bundesrepublik_vereint');
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('existiert nicht im System'))).toBe(true);
  });

  it('keeps the Roman-German emperorship separate from the German Empire', (): void => {
    // Kein Kontinuitätsnarrativ: Der römisch-deutsche Kaiser endet 1806.
    expect(validateOffice('kaiser', 'kaisertum_hrr', 'fruehe_neuzeit').valid).toBe(true);
    expect(validateOffice('kaiser', 'konstitutionelle_monarchie', 'kaiserreich').valid).toBe(false);
    expect(validateOffice('deutscher_kaiser', 'konstitutionelle_monarchie', 'kaiserreich').valid).toBe(true);
    expect(validateOffice('deutscher_kaiser', 'kaisertum_hrr', 'hochmittelalter').valid).toBe(false);
  });

  it('rejects a medieval office in a modern epoch ("Herzog in der Moderne")', (): void => {
    const result = validateOffice('herzog', 'herzogtum', 'bundesrepublik_vereint');
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('nicht belegt'))).toBe(true);
  });

  it('rejects a valid system but wrong epoch combination', (): void => {
    // Reichskanzler gibt es in der konstitutionellen Monarchie – aber nicht im Hochmittelalter.
    const result = validateOffice('reichskanzler', 'konstitutionelle_monarchie', 'hochmittelalter');
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('nicht belegt'))).toBe(true);
  });

  it('reports unknown offices with a clear message', (): void => {
    expect(validateOffice('gibt-es-nicht', 'kaisertum_hrr', 'hochmittelalter').errors[0])
      .toContain('Unbekanntes Amt');
  });
});

describe('Regel 3: Region ↔ Epoche', (): void => {
  it('accepts a region that is epoch-independent', (): void => {
    // Geografische Kulturräume sind in allen Epochen nutzbar.
    expect(validateRegionEpoch('rheinland', 'hochmittelalter').valid).toBe(true);
    expect(validateRegionEpoch('rheinland', 'bundesrepublik_vereint').valid).toBe(true);
  });

  it('accepts an epoch-bound region in its own epoch', (): void => {
    expect(validateRegionEpoch('hansestaedte', 'spaetmittelalter').valid).toBe(true);
  });

  it('rejects an epoch-bound region outside its epoch', (): void => {
    const result = validateRegionEpoch('hansestaedte', 'bundesrepublik_vereint');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('nicht belegt');
  });

  it('reports unknown regions and epochs', (): void => {
    expect(validateRegionEpoch('gibt-es-nicht', 'hochmittelalter').errors[0])
      .toContain('Unbekannte Region');
    expect(validateRegionEpoch('rheinland', 'gibt-es-nicht').errors[0])
      .toContain('Unbekannte Epoche');
  });
});

describe('Kombinationsprüfung', (): void => {
  it('accepts a fully consistent combination', (): void => {
    const result = validateCombination({
      epochId: 'kaiserreich',
      systemId: 'konstitutionelle_monarchie',
      officeId: 'deutscher_kaiser',
      regionId: 'preussen'
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('collects every individual error', (): void => {
    const result = validateCombination({
      epochId: 'hochmittelalter',
      systemId: 'parlamentarische_republik',
      officeId: 'bundeskanzler',
      regionId: 'hansestaedte'
    });
    expect(result.valid).toBe(false);
    // Epoche↔System, System↔Amt, Amt↔Epoche und Region↔Epoche müssen anschlagen.
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Jahresbasierte Epochenzuordnung', (): void => {
  it('returns the documented epoch for a well-evidenced year', (): void => {
    expect(epochForHistoricalYear(1000)?.id).toBe('hochmittelalter');
    expect(epochForHistoricalYear(1900)?.id).toBe('kaiserreich');
    expect(epochForHistoricalYear(1960)?.id).toBe('bundesrepublik');
  });

  it('returns null for epochs whose boundaries are not verified', (): void => {
    // Die Frühzeit ist bewusst als „nicht verifiziert" markiert.
    expect(epochForHistoricalYear(-500)).toBeNull();
  });

  it('returns null for years outside every modelled epoch', (): void => {
    // Vor 843 und nach dem offenen Ende gibt es keine modellierte Epoche.
    expect(epochForHistoricalYear(-2000)).toBeNull();
    expect(epochForHistoricalYear(Number.NaN)).toBeNull();
  });
});

describe('Amtsabfrage', (): void => {
  it('returns only offices valid for the epoch and system', (): void => {
    const offices = officesFor('kaiserreich', 'konstitutionelle_monarchie');
    const ids = offices.map((office) => office.id);
    expect(ids).toContain('deutscher_kaiser');
    expect(ids).toContain('reichskanzler');
    // Kein Kontinuitätsnarrativ: Das römisch-deutsche Kaisertum ist hier nicht gültig.
    expect(ids).not.toContain('kaiser');
    expect(ids).not.toContain('bundeskanzler');
  });

  it('returns an empty list for unknown inputs', (): void => {
    expect(officesFor('gibt-es-nicht', 'kaisertum_hrr')).toEqual([]);
    expect(officesFor('kaiserreich', 'gibt-es-nicht')).toEqual([]);
  });

  it('sorts the result alphabetically by German name', (): void => {
    const names = officesFor('bundesrepublik_vereint', 'parlamentarische_republik')
      .map((office) => office.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'de'));
    expect(names).toEqual(sorted);
  });
});

describe('Evidenzgrade', (): void => {
  it('marks every epoch with an explicit evidence level', (): void => {
    const allowed = ['belegt', 'naeherung', 'nicht_verifiziert'];
    for (const epoch of PolityCatalog.getEpochs()) {
      expect(allowed).toContain(epoch.evidence);
      expect(epoch.sourceNote.length).toBeGreaterThan(10);
    }
  });

  it('documents at least one explicitly unverified entry', (): void => {
    const all = [
      ...PolityCatalog.getEpochs(),
      ...PolityCatalog.getRegions(),
      ...PolityCatalog.getSystems(),
      ...PolityCatalog.getOffices()
    ];
    expect(all.some((entry) => entry.evidence === 'nicht_verifiziert')).toBe(true);
  });

  it('contains no invented boundary polygons', (): void => {
    // Regionen dürfen keine Geometrie tragen – weder Polygone noch Koordinaten.
    for (const region of REGIONS) {
      const keys = Object.keys(region);
      expect(keys).not.toContain('polygon');
      expect(keys).not.toContain('coordinates');
      expect(keys).not.toContain('geometry');
      expect(keys).not.toContain('bounds');
    }
  });

  it('never binds an office to a year instead of a system and epoch', (): void => {
    for (const office of OFFICES) {
      expect(office.systemIds.length).toBeGreaterThan(0);
      expect(office.epochIds.length).toBeGreaterThan(0);
      expect(Object.keys(office)).not.toContain('year');
      expect(Object.keys(office)).not.toContain('yearStart');
      expect(Object.keys(office)).not.toContain('yearEnd');
    }
  });
});
