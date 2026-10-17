import { describe, expect, it } from 'vitest';
import { doctrineForYear, rivalIdentity } from './HistoricalGameplay';
import { CampaignWarfareSystem } from './CampaignWarfareSystem';
import { Kingdom } from './Kingdom';

describe('Historische militärische Entwicklung', () => {
  it('wechselt Militärdoktrin und Einheitenbezeichnungen mit der Epoche', () => {
    expect(doctrineForYear(1200).units.cavalry).toContain('Ritter');
    expect(doctrineForYear(1550).units.archers).toContain('Schützen');
    expect(doctrineForYear(1880).units.cavalry).toContain('Aufklärung');
    expect(doctrineForYear(2020).units.archers).toContain('Technische');
  });
  it('nutzt keine mittelalterlichen Rivalennamen im digitalen Zeitalter', () => {
    const military = new CampaignWarfareSystem(() => 0.5);
    military.ensureRivals('p');
    const past = military.getRivals('p',1200);
    const modern = military.getRivals('p',2020);
    expect(past[0].name).toMatch(/Raubritter/);
    expect(modern[0].name).toMatch(/miliz/i);
    expect(military.getRivals('p',1200)).toEqual(past);
    expect(rivalIdentity('nordland',2020)?.name).toMatch(/Staatenbund/);
  });
  it('berechnet Jahr-basierte Kraft bei unverändertem Heer und behält vorhandene Spielstände', () => {
    const kingdom = new Kingdom({ name:'Test',rulerName:'Heinrich',foundingYear:1200 });
    kingdom.military.infantry = 100;
    kingdom.military.archers = 30;
    expect(CampaignWarfareSystem.armyPower(kingdom, {}, 2000))
      .toBeGreaterThan(CampaignWarfareSystem.armyPower(kingdom, {}, 1200));
    const system = new CampaignWarfareSystem(() => 0.5);
    system.ensureRivals('p');
    const snapshot = system.serialize();
    const restored = new CampaignWarfareSystem();
    restored.load(snapshot);
    expect(restored.getRivals('p',2020)).toEqual(system.getRivals('p',2020));
  });
});
