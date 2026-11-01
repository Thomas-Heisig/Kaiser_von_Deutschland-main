// Offline Natural Earth 50m export; existing source files are not modified.
import { readFile, writeFile } from 'node:fs/promises';

const bounds = { west: -10, east: 40, south: 35, north: 62 };
const round = point => point.slice(0, 2).map(value => Number(value.toFixed(6)));
const intersects = points => {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  return Math.max(...xs) >= bounds.west && Math.min(...xs) <= bounds.east
    && Math.max(...ys) >= bounds.south && Math.min(...ys) <= bounds.north;
};
const polygons = async name => {
  const data = JSON.parse(await readFile(`.temp/ne2/ne_50m_${name}.geojson`, 'utf8'));
  return data.features.flatMap(feature => feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates] : feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates : []).filter(poly => intersects(poly[0]))
    .map(poly => poly.map(ring => ring.map(round)));
};
const data = JSON.parse(await readFile('.temp/ne2/ne_50m_rivers_lake_centerlines.geojson', 'utf8'));
const rivers = data.features.flatMap(feature => feature.geometry?.type === 'LineString'
  ? [feature.geometry.coordinates] : feature.geometry?.type === 'MultiLineString'
    ? feature.geometry.coordinates : []).filter(intersects).map(line => line.map(round));
await writeFile('public/maps/europe-vectors.json', JSON.stringify({
  version: 1, crs: 'EPSG:4326', bounds,
  land: await polygons('land'), lakes: await polygons('lakes'), rivers,
  source: 'https://www.naturalearthdata.com/downloads/50m-physical-vectors/',
  license: 'Public domain',
  nature: 'Modern generalized physical geography; not a historical reconstruction.',
  resolution: '1:50,000,000; unsuitable for settlement or interior details.',
  projectionNote: 'Runtime linear lon/lat transform anchored near 53.0336 N; approximate local alignment.',
}));
console.log('Built europe-vectors.json from existing Natural Earth 50m inputs.');
