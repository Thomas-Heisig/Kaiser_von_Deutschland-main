import { Container, Graphics } from 'pixi.js';
import { lonToBaseX, latToBaseY } from './MapScale';

type Point = [number, number];
type Polygon = Point[][];

/** Modern, generalized physical geography with explicit WGS84 coordinates and provenance. */
export interface GeographicVectors {
  version: 1;
  crs: 'EPSG:4326';
  bounds: { west: number; east: number; south: number; north: number };
  land: Polygon[];
  lakes: Polygon[];
  rivers: Point[][];
  source: string;
  license: string;
  nature: string;
}

/**
 * Validates an offline vector asset before allocating rendering objects.
 * @param value Parsed JSON.
 * @returns Validated physical geography.
 * @throws Error When coordinates, bounds or provenance are missing.
 */
export function validateGeographicVectors(value: unknown): GeographicVectors {
  const data = value as GeographicVectors;
  const point = (p: unknown): boolean => Array.isArray(p) && p.length === 2
    && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
  const line = (p: unknown): boolean => Array.isArray(p) && p.length >= 2 && p.every(point);
  const polygon = (p: unknown): boolean => Array.isArray(p) && p.length > 0
    && p.every(ring => Array.isArray(ring) && ring.length >= 4 && ring.every(point));
  if (!data || data.version !== 1 || data.crs !== 'EPSG:4326'
    || !data.bounds || !Object.values(data.bounds).every(Number.isFinite)
    || !(data.bounds.west < data.bounds.east && data.bounds.south < data.bounds.north)
    || !Array.isArray(data.land) || !data.land.length || !data.land.every(polygon)
    || !Array.isArray(data.lakes) || !data.lakes.every(polygon)
    || !Array.isArray(data.rivers) || !data.rivers.every(line)
    || typeof data.source !== 'string' || typeof data.license !== 'string' || typeof data.nature !== 'string') {
    throw new Error('Invalid geographic vector asset.');
  }
  return data;
}

/**
 * Builds vector geography without fitting the camera to an image frame.
 * @param data Validated modern WGS84 geography.
 * @returns Layer with a clipping mask; polygon holes remain water or land respectively.
 */
export function drawGeographicVectors(data: GeographicVectors): Container {
  const layer = new Container();
  const { west, east, south, north } = data.bounds;
  const left = lonToBaseX(west), top = latToBaseY(north);
  const width = lonToBaseX(east) - left, height = latToBaseY(south) - top;
  layer.addChild(new Graphics().rect(left, top, width, height).fill(0x2f5a6b));
  const polygons = (items: Polygon[], color: number): void => {
    const graphic = new Graphics();
    for (const polygon of items) {
      for (let i = 0; i < polygon.length; i++) {
        const coordinates = polygon[i].flatMap(([lon, lat]) => [lonToBaseX(lon), latToBaseY(lat)]);
        graphic.poly(coordinates, true);
        if (i === 0) graphic.fill(color);
        else graphic.cut();
      }
    }
    layer.addChild(graphic);
  };
  polygons(data.land, 0x8c9a6e);
  polygons(data.lakes, 0x397e92);
  const rivers = new Graphics();
  for (const line of data.rivers) {
    rivers.moveTo(lonToBaseX(line[0][0]), latToBaseY(line[0][1]));
    for (const [lon, lat] of line.slice(1)) rivers.lineTo(lonToBaseX(lon), latToBaseY(lat));
  }
  // Cartographic line, not a measured river width (PixiJS 8 supports pixelLine).
  rivers.stroke({ color: 0x4a9ab0, pixelLine: true });
  layer.addChild(rivers);
  const mask = new Graphics().rect(left, top, width, height).fill(0xffffff);
  layer.addChild(mask);
  layer.mask = mask;
  return layer;
}
