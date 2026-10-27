/**
 * Testbare, DOM-freie Logik der Ich-Perspektive.
 *
 * Bewusst getrennt vom WebGL-Renderer ([FirstPersonView.ts]): Kameramathe,
 * Geometrie und Kollision lassen sich ohne Browser prüfen. Die Einheit ist
 * durchgängig Meter; die Basis ist {@link MAP_METRES_PER_PIXEL} aus
 * MapScale.ts, damit Behausung, Siedlung und Karte dieselbe Datenbasis haben.
 */

import { METRES_PER_BASE_PIXEL, DWELLING_ANCHOR } from './MapScale';
/** Basispixel → Meter (einzige Umrechnung, identisch zur Karte). */
export const MAP_METRES_PER_PIXEL = METRES_PER_BASE_PIXEL;

/** Augenhöhe der Kamera in Metern (stehender Mensch, gerundet). */
export const EYE_HEIGHT = 1.6;

/** Horizontales Sichtfeld in Grad (moderat, kein Weitwinkel-Kunstgriff). */
export const FIELD_OF_VIEW_DEGREES = 70;

/** Höchstgeschwindigkeit beim Gehen in m/s. */
export const WALK_SPEED = 2.2;

/** Drehgeschwindigkeit bei Tastensteuerung in Grad/s. */
export const TURN_SPEED = 120;

/** Grundfläche der eigenen Behausung in Metern (Spielmodell, nicht vermessen). */
export const DWELLING_HALF_WIDTH = 3;
export const DWELLING_HALF_DEPTH = 4;

/** Abstand, den die Kamera von einer Wand freihält (m), um Durchdringen zu verhindern. */
export const WALL_CLEARANCE = 0.25;

/** Wandstärke der behelfsmäßigen Begrenzungen in Metern. */
export const WALL_THICKNESS = 0.3;

/** Position der Behausung auf der Basiskarte (Bildschirmkoordinaten des Plans). */
export const DWELLING_MAP_POSITION = DWELLING_ANCHOR;

/** Blickwinkel auf der Karte, aus dem die Ich-Perspektive startet (Grad, 0 = Norden). */
export const DWELLING_MAP_BEARING = 0;

/**
 * Ausrichtung der Behausung auf dem Siedlungsplan: Die Tür liegt an der
 * Südseite (unten im Plan), damit die Blickrichtung beim Betreten nach Norden
 * zeigt. Reines Spielmodell — der Plan enthält keine vermessene Grundfläche.
 */
export const DWELLING_DOOR_SIDE = 'south' as const;

export interface RoomBox {
  /** Minimale X-Koordinate in Metern. */
  readonly minX: number;
  /** Maximale X-Koordinate in Metern. */
  readonly maxX: number;
  /** Minimale Z-Koordinate in Metern (Tiefe). */
  readonly minZ: number;
  /** Maximale Z-Koordinate in Metern (Tiefe). */
  readonly maxZ: number;
}

/** Innenraum der Behausung: Achsenparalleles Rechteck um den Ursprung (Mitte). */
export const DWELLING_INTERIOR: RoomBox = {
  minX: -DWELLING_HALF_WIDTH,
  maxX: DWELLING_HALF_WIDTH,
  minZ: -DWELLING_HALF_DEPTH,
  maxZ: DWELLING_HALF_DEPTH,
};

/** Türöffnung an der Südseite: Spalt in der Wand (X-Bereich in Metern). */
export const DWELLING_DOOR: { readonly x0: number; readonly x1: number; readonly z: number } = {
  x0: -0.8,
  x1: 0.8,
  z: DWELLING_INTERIOR.maxZ,
};

/** Bewegliche Kameraposition in Metern. */
export interface CameraPosition {
  x: number;
  z: number;
}

export interface FirstPersonState {
  x: number;
  z: number;
  yaw: number;
}

/** Außenbereich: 12 m um die Behausung, Kollision begrenzt die Bewegung. */
export const YARD_EXTENT = 12;

/**
 * Erlaubter Bewegungsbereich im Außenbereich: Quadrat um die Behausung,
 * begrenzt durch die virtuelle Gartengrenze (kein erfundenes Gelände).
 */
export const YARD_BOUNDS: RoomBox = {
  minX: -YARD_EXTENT,
  maxX: YARD_EXTENT,
  minZ: -YARD_EXTENT,
  maxZ: YARD_EXTENT,
};

/** Laufende Richtung aus Tasteneingabe: W/S vor/zurück, A/D seitlich. */
export interface MoveInput {
  forward: number;
  strafe: number;
}

/** Leere Eingabe: keine Bewegung. */
export const NO_MOVE: MoveInput = { forward: 0, strafe: 0 };

/** Dreht sich die Blickrichtung um diesen Betrag (Grad), gilt sie als „umschauen“. */
export const LOOK_EPSILON_DEGREES = 0.01;

/**
 * Normalisiert einen Winkel auf [-180, 180).
 *
 * @param degrees Winkel in Grad, beliebig groß.
 * @returns Äquivalenter Winkel im halboffenen Intervall.
 */
export function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  let d = degrees % 360;
  if (d >= 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * Kürzester Abstand zweier Blickrichtungen in Grad.
 */
export function angleDelta(from: number, to: number): number {
  return normalizeDegrees(to - from);
}

/**
 * Bewegt eine Position entlang der Blickrichtung mit Seitenanteil.
 *
 * Reine Geometrie ohne Kollision — die Aufruferin wendet danach
 * {@link resolveCollisions} an, sodass diese Funktion auch einzeln testbar ist.
 *
 * @param pos Aktuelle Position (Meter).
 * @param yaw Blickrichtung in Grad (0 = Norden/+Z, 90 = Osten/+X).
 * @param input Bewegungswunsch [-1, 1] je Achse.
 * @param seconds Verstrichene Zeit in Sekunden.
 * @returns Neue Position.
 */
export function applyMove(pos: CameraPosition, yaw: number, input: MoveInput, seconds: number): CameraPosition {
  const total = WALK_SPEED * Math.max(0, seconds);
  const f = clamp01(input.forward);
  const s = clamp01(input.strafe);
  const len = Math.hypot(f, s);
  const scale = len > 1 ? 1 / len : 1;
  const rad = (yaw * Math.PI) / 180;
  const dx = (Math.sin(rad) * f + Math.cos(rad) * s) * total * scale;
  const dz = (Math.cos(rad) * f - Math.sin(rad) * s) * total * scale;
  return { x: pos.x + dx, z: pos.z + dz };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(-1, Math.min(1, v));
}

/**
 * Löst Kollisionen einer Wunschposition mit den Behausungswänden und der
 * Gartengrenze auf. Die Türöffnung bleibt begehbar; Wände wirken als
 * Achsenbarrieren mit {@link WALL_CLEARANCE}.
 *
 * Vereinfachung (dokumentiert): Kollision ist ein 2D-AABB-Schiebeverfahren,
 * keine Dreiecks-/Mesh-Kollision. Für eine einzelne Behausung mit Türspalt
 * ausreichend und deterministisch testbar.
 *
 * @param pos Wunschposition (Meter).
 * @param inside True, wenn sich die Kamera im Innenraum befindet.
 * @returns Korrigierte Position.
 */
export function resolveCollisions(pos: CameraPosition, inside: boolean): CameraPosition {
  let x = clampAxis(pos.x, YARD_BOUNDS.minX + WALL_CLEARANCE, YARD_BOUNDS.maxX - WALL_CLEARANCE);
  let z = clampAxis(pos.z, YARD_BOUNDS.minZ + WALL_CLEARANCE, YARD_BOUNDS.maxZ - WALL_CLEARANCE);

  if (inside) {
    const box = DWELLING_INTERIOR;
    // Innenraum: beide Achsen hart begrenzen (verhindert diagonales
    // Durchqueren an Ecken); nur der Türspalt erlaubt das Überschreiten
    // der Süd-Grenze.
    x = clampAxis(x, box.minX + WALL_CLEARANCE, box.maxX - WALL_CLEARANCE);
    const atDoor = x >= DWELLING_DOOR.x0 && x <= DWELLING_DOOR.x1;
    const zMin = box.minZ + WALL_CLEARANCE;
    const zMax = atDoor ? box.maxZ + WALL_THICKNESS : box.maxZ - WALL_CLEARANCE;
    z = clampAxis(z, zMin, zMax);
  } else {
    // Von außen: Wand der Behausung als Block (mit Türspalt von außen betretbar).
    const inXRange = x > DWELLING_INTERIOR.minX - WALL_CLEARANCE && x < DWELLING_INTERIOR.maxX + WALL_CLEARANCE;
    const inZRange = z > DWELLING_INTERIOR.minZ - WALL_CLEARANCE && z < DWELLING_INTERIOR.maxZ + WALL_CLEARANCE;
    if (inXRange && inZRange) {
      const atDoor = x >= DWELLING_DOOR.x0 && x <= DWELLING_DOOR.x1 && Math.abs(z - DWELLING_DOOR.z) < WALL_THICKNESS;
      if (!atDoor) {
        // Außenhalb der Wand zurückdrängen (kleinste Ausweichachse).
        const pushWest = x - (DWELLING_INTERIOR.minX - WALL_CLEARANCE);
        const pushEast = DWELLING_INTERIOR.maxX + WALL_CLEARANCE - x;
        const pushNorth = z - (DWELLING_INTERIOR.minZ - WALL_CLEARANCE);
        const pushSouth = DWELLING_INTERIOR.maxZ + WALL_CLEARANCE - z;
        const minPush = Math.min(pushWest, pushEast, pushNorth, pushSouth);
        if (minPush === pushWest) x = DWELLING_INTERIOR.minX - WALL_CLEARANCE;
        else if (minPush === pushEast) x = DWELLING_INTERIOR.maxX + WALL_CLEARANCE;
        else if (minPush === pushNorth) z = DWELLING_INTERIOR.minZ - WALL_CLEARANCE;
        else z = DWELLING_INTERIOR.maxZ + WALL_CLEARANCE;
      }
    }
  }

  return { x, z };
}

function clampAxis(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Prüft, ob sich eine Position im Innenraum der Behausung befindet.
 */
export function isInsideDwelling(pos: CameraPosition): boolean {
  return pos.x > DWELLING_INTERIOR.minX && pos.x < DWELLING_INTERIOR.maxX
    && pos.z > DWELLING_INTERIOR.minZ && pos.z < DWELLING_INTERIOR.maxZ;
}

/**
 * Startposition der Ich-Perspektive: mitten in der Behausung, Blick nach
 * Norden (Richtung Tür nicht sichtbar — Spieler steht „am Schreibtisch“).
 */
export function startingState(): FirstPersonState {
  return { x: 0, z: -1, yaw: 0 };
}

/**
 * Wendet eine Drehung an (Tastensteuerung oder Pointer-Lock-Delta).
 *
 * @param state Aktueller Zustand.
 * @param deltaDegrees Drehung in Grad (positiv = nach rechts schauen).
 * @returns Neuer Zustand.
 */
export function applyLook(state: FirstPersonState, deltaDegrees: number): FirstPersonState {
  return { ...state, yaw: normalizeDegrees(state.yaw + deltaDegrees) };
}

/**
 * Voller Simulationsschritt: Drehen, Bewegen, Kollisionen auflösen.
 *
 * @param state Aktueller Zustand.
 * @param lookDelta Grad Drehung (z. B. Pointer-Lock oder Tasten).
 * @param move Bewegungswunsch.
 * @param seconds Verstrichene Sekunden.
 * @returns Neuer Zustand.
 */
export function step(
  state: FirstPersonState,
  lookDelta: number,
  move: MoveInput,
  seconds: number,
): FirstPersonState {
  const looked = applyLook(state, lookDelta);
  const moved = applyMove(looked, looked.yaw, move, seconds);
  const inside = isInsideDwelling(moved);
  const resolved = resolveCollisions(moved, inside);
  return { ...looked, x: resolved.x, z: resolved.z };
}

/**
 * Mappt eine Position in der FP-Welt zurück auf Basiskartenpixel, um den
 * Kartenfokus während der Ich-Perspektive grob zu halten (ohne sie zu ändern).
 *
 * @param pos Position in Metern relativ zur Behausungsmitte.
 * @returns Basispixel-Koordinate { x, y }.
 */
export function positionToMapPixels(pos: CameraPosition): { x: number; y: number } {
  return {
    x: DWELLING_MAP_POSITION.x + pos.x / MAP_METRES_PER_PIXEL,
    y: DWELLING_MAP_POSITION.y - pos.z / MAP_METRES_PER_PIXEL,
  };
}

/**
 * Kennzeichnet die Ich-Perspektive als gestalterische Annäherung an einen
 * historischen Innenraum. Die Ausstattung ist Spielmodell, nicht Beleg.
 */
export const FIRST_PERSON_NOTE = 'Gestalterische Annäherung: Die Ausstattung der Behausung ist Spielmodell, kein archäologischer Befund.';
