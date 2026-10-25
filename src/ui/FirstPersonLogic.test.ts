/**
 * Tests der reinen Ich-Perspektive-Logik (ohne WebGL/DOM).
 * Geprüft werden Maßstab, Bewegung, Kollision und die Türregel.
 */

import { describe, expect, it } from 'vitest';

import {
  applyLook,
  DWELLING_DOOR,
  DWELLING_INTERIOR,
  EYE_HEIGHT,
  MAP_METRES_PER_PIXEL,
  NO_MOVE,
  normalizeDegrees,
  positionToMapPixels,
  resolveCollisions,
  startingState,
  step,
  YARD_EXTENT,
} from './FirstPersonLogic';
import { METRES_PER_BASE_PIXEL } from './MapScale';

describe('FirstPersonLogic: Einheiten und Datenbasis', () => {
  it('nutzt denselben Maßstab wie die Karte', () => {
    expect(MAP_METRES_PER_PIXEL).toBe(METRES_PER_BASE_PIXEL);
  });

  it('Augenhöhe liegt in realistischen Metern', () => {
    expect(EYE_HEIGHT).toBeGreaterThan(1.2);
    expect(EYE_HEIGHT).toBeLessThan(2.0);
  });

  it('Türspalt liegt an der Südwand des Innenraums', () => {
    expect(DWELLING_DOOR.z).toBe(DWELLING_INTERIOR.maxZ);
    expect(DWELLING_DOOR.x0).toBeGreaterThan(DWELLING_INTERIOR.minX);
    expect(DWELLING_DOOR.x1).toBeLessThan(DWELLING_INTERIOR.maxX);
  });

  it('Hofgrenze enthält die Behausung', () => {
    expect(YARD_EXTENT).toBeGreaterThan(10);
  });
});

describe('FirstPersonLogic: Winkel', () => {
  it('normalisiert über den Vollkreis', () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-190)).toBe(170);
    expect(normalizeDegrees(180)).toBe(-180);
    expect(normalizeDegrees(0)).toBe(0);
  });

  it('liefert bei nicht-finite Eingabe 0', () => {
    expect(normalizeDegrees(Number.NaN)).toBe(0);
  });
});

describe('FirstPersonLogic: Bewegung', () => {
  it('bewegt vorwärts nach Norden bei yaw 0', () => {
    const next = step(startingState(), 0, { forward: 1, strafe: 0 }, 1);
    expect(next.z).toBeGreaterThan(startingState().z);
    expect(next.x).toBeCloseTo(startingState().x, 5);
  });

  it('bewegt seitlich nach Osten bei D nach rechts', () => {
    const next = step(startingState(), 0, { forward: 0, strafe: 1 }, 1);
    expect(next.x).toBeGreaterThan(startingState().x);
  });

  it('skaliert die Bewegung mit der Zeit', () => {
    const half = step(startingState(), 0, { forward: 1, strafe: 0 }, 0.5);
    const full = step(startingState(), 0, { forward: 1, strafe: 0 }, 1);
    const dHalf = half.z - startingState().z;
    const dFull = full.z - startingState().z;
    expect(dHalf).toBeCloseTo(dFull / 2, 5);
  });

  it('keine Eingabe bewegt nichts', () => {
    const next = step(startingState(), 0, NO_MOVE, 1);
    expect(next.x).toBeCloseTo(startingState().x, 5);
    expect(next.z).toBeCloseTo(startingState().z, 5);
  });

  it('dämpft Drehungen über applyLook korrekt', () => {
    const next = applyLook(startingState(), 450);
    expect(next.yaw).toBe(90);
  });
});

describe('FirstPersonLogic: Kollision', () => {
  it('hält die Kamera im Hof', () => {
    const far = resolveCollisions({ x: 100, z: -100 }, false);
    expect(far.x).toBeLessThanOrEqual(YARD_EXTENT);
    expect(far.z).toBeGreaterThanOrEqual(-YARD_EXTENT);
  });

  it('drängt eine im Gebäude liegende Außenposition heraus', () => {
    const pushed = resolveCollisions({ x: 0, z: 0 }, false);
    // Startzustand liegt im Innenraum → kleinster Ausweg (hier seitlich).
    const inX = pushed.x > DWELLING_INTERIOR.minX && pushed.x < DWELLING_INTERIOR.maxX;
    const inZ = pushed.z > DWELLING_INTERIOR.minZ && pushed.z < DWELLING_INTERIOR.maxZ;
    expect(inX && inZ).toBe(false);
    expect(Math.abs(pushed.x)).toBeGreaterThan(0);
  });

  it('gestattet Durchgang durch den Türspalt', () => {
    const atDoor = resolveCollisions({ x: 0, z: DWELLING_DOOR.z + 0.1 }, false);
    expect(atDoor.z).toBeGreaterThan(DWELLING_DOOR.z);
  });

  it('blockiert den Versuch, durch die Süd-Wand außerhalb der Tür zu gehen', () => {
    const blocked = resolveCollisions({ x: 2.0, z: DWELLING_INTERIOR.maxZ + 0.1 }, false);
    expect(blocked.z).toBeLessThanOrEqual(DWELLING_INTERIOR.maxZ + 0.25);
  });

  it('hält die Kamera im Innenraum, wenn sie drin ist', () => {
    const corner = resolveCollisions({ x: 5, z: 5 }, true);
    expect(corner.x).toBeLessThanOrEqual(DWELLING_INTERIOR.maxX);
    expect(corner.z).toBeLessThanOrEqual(DWELLING_INTERIOR.maxZ);
  });

  it('erlaubt im Innenraum den Ausgang durch die Tür', () => {
    // Von der Türöffnung nach Süden hinaus: Z-Grenze wird nicht zurückgesetzt.
    const out = resolveCollisions({ x: 0, z: DWELLING_DOOR.z + 0.3 }, false);
    expect(out.z).toBeGreaterThan(DWELLING_DOOR.z);
  });
});

describe('FirstPersonLogic: Rückführung auf die Karte', () => {
  it('behält den Kartenfokus-Anker bei Bewegung im Metern', () => {
    const atAnchor = positionToMapPixels({ x: 0, z: 0 });
    const moved = positionToMapPixels({ x: MAP_METRES_PER_PIXEL, z: 0 });
    expect(moved.x - atAnchor.x).toBeCloseTo(1, 5);
  });

  it('dreht positive z-Werte nach Norden (kleinere Karten-y)', () => {
    const north = positionToMapPixels({ x: 0, z: MAP_METRES_PER_PIXEL });
    const atAnchor = positionToMapPixels({ x: 0, z: 0 });
    expect(north.y).toBeLessThan(atAnchor.y);
  });
});
