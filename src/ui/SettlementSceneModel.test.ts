import { describe, expect, it } from 'vitest';
import { SETTLEMENT_DISTRICTS, visibleDistricts, districtModernization, districtSceneSignature } from './SettlementSceneModel';
import { Kingdom } from '../core/Kingdom';

describe('SettlementSceneModel', () => {
  it('contains every infrastructure district exactly once', () => {
    const kingdom = new Kingdom({ name: 'Test', rulerName: 'A' });
    expect(SETTLEMENT_DISTRICTS).toHaveLength(Object.keys(kingdom.infrastructure).length);
    expect(new Set(SETTLEMENT_DISTRICTS.map(x => x.type)).size).toBe(16);
    for (const district of SETTLEMENT_DISTRICTS) {
      expect(Object.prototype.hasOwnProperty.call(kingdom.infrastructure, district.type)).toBe(true);
    }
    expect(visibleDistricts('versorgung')).toHaveLength(4);
  });
  it('shows visual modernizations only after completing a project', () => {
    expect(districtModernization('workshops', [])).toBeNull();
    expect(districtModernization('workshops', ['manufacturing'])).toBe('manufacturing');
    expect(districtModernization('schools', ['digital-government'])).toBe('digital-government');
  });
  it('rebuilds scene only when visible state changes', () => {
    const kingdom = new Kingdom({ name: 'Test', rulerName: 'A' });
    const old = districtSceneSignature(kingdom.infrastructure, 'farms', 'alle', 'spring', []);
    expect(old).toBe(districtSceneSignature(kingdom.infrastructure, 'farms', 'alle', 'spring', []));
    expect(old).not.toBe(districtSceneSignature(kingdom.infrastructure, 'farms', 'stadt', 'spring', []));
    expect(old).not.toBe(districtSceneSignature(kingdom.infrastructure, 'farms', 'alle', 'winter', []));
  });
});
