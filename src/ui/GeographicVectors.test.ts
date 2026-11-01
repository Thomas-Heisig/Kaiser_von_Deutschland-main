import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateGeographicVectors } from './GeographicVectors';

describe('offline geographic vectors', () => {
  it('contains actual land, lakes and rivers with coordinates and provenance', () => {
    const data = validateGeographicVectors(JSON.parse(readFileSync('public/maps/europe-vectors.json', 'utf8')));
    expect(data.land.length).toBeGreaterThan(10);
    expect(data.lakes.length).toBeGreaterThan(10);
    expect(data.rivers.length).toBeGreaterThan(10);
    expect(data.license).toBe('Public domain');
    expect(data.bounds).toEqual({ west: -10, east: 40, south: 35, north: 62 });
  });
  it('rejects absent provenance and corrupt coordinates', () => {
    expect(() => validateGeographicVectors({})).toThrow('Invalid geographic vector asset');
    const valid = JSON.parse(readFileSync('public/maps/europe-vectors.json', 'utf8'));
    expect(() => validateGeographicVectors({ ...valid, crs: 'EPSG:25832' })).toThrow();
    expect(() => validateGeographicVectors({ ...valid, rivers: [[[Infinity, 0], [0, 0]]] })).toThrow();
    expect(() => validateGeographicVectors({ ...valid, source: null })).toThrow();
  });
});
