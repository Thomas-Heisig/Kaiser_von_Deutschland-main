// Offline asset builder for the Europe overview raster.
// Inputs: Natural Earth 50m land, lakes and rivers GeoJSON (Public Domain).
// Output: public/maps/europe-overview.webp + europe-source.json
//
// Darstellungsprojektion: Plate carrée (WGS84, Grad = Koordinate). Der
// Maßstab ist nur am Bezugsbreitengrad (56°N) truly metrisch; die
// Verzerrung wächst zum Äquator und wird in europe-source.json dokumentiert.
// Die Spielkamera rechnet Meter über EPSG:25832 lokal; für die Europastufe
// gilt die hier dokumentierte Grad-Geometrie (kein zweites Koordinatensystem
// im Spielmodell, nur ein Darstellungsmaßstab).
import { readFile, writeFile } from 'node:fs/promises';
import { createCanvas } from '../node_modules/canvas/index.js';

const bounds = { west: -10, east: 40, south: 35, north: 62 };
const width = 2000, height = Math.round((bounds.north - bounds.south) / (bounds.east - bounds.west) * width);
const x = lon => (lon - bounds.west) / (bounds.east - bounds.west) * width;
const y = lat => (bounds.north - lat) / (bounds.north - bounds.south) * height;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
// Sea backdrop
ctx.fillStyle = '#2f5a6b';
ctx.fillRect(0, 0, width, height);

const land = JSON.parse(await readFile('.temp/ne2/ne_50m_land.geojson', 'utf8'));
ctx.fillStyle = '#8c9a6e';
ctx.strokeStyle = '#5d6b45';
ctx.lineWidth = 1.4;
for (const f of land.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates]
    : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
  for (const poly of polys) {
    ctx.beginPath();
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        if (lon < bounds.west - 5 || lon > bounds.east + 5 || lat < bounds.south - 5 || lat > bounds.north + 5) return;
        if (i === 0) ctx.moveTo(x(lon), y(lat)); else ctx.lineTo(x(lon), y(lat));
      });
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
  }
}

const lakes = JSON.parse(await readFile('.temp/ne2/ne_50m_lakes.geojson', 'utf8'));
ctx.fillStyle = '#397e92';
for (const f of lakes.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates]
    : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
  for (const poly of polys) {
    ctx.beginPath();
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        if (lon < bounds.west - 5 || lon > bounds.east + 5 || lat < bounds.south - 5 || lat > bounds.north + 5) return;
        if (i === 0) ctx.moveTo(x(lon), y(lat)); else ctx.lineTo(x(lon), y(lat));
      });
      ctx.closePath();
    }
    ctx.fill();
  }
}

const rivers = JSON.parse(await readFile('.temp/ne2/ne_50m_rivers_lake_centerlines.geojson', 'utf8'));
ctx.strokeStyle = '#4a9ab0';
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
for (const f of rivers.features) {
  const lines = f.geometry?.type === 'LineString' ? [f.geometry.coordinates]
    : f.geometry?.type === 'MultiLineString' ? f.geometry.coordinates : [];
  const rank = Number(f.properties.scalerank ?? 6);
  ctx.lineWidth = rank < 5 ? 2.4 : 1.2;
  for (const line of lines) {
    if (!line.some(([lon, lat]) => lon >= bounds.west && lon <= bounds.east && lat >= bounds.south && lat <= bounds.north)) continue;
    ctx.beginPath();
    line.forEach(([lon, lat], i) => {
      if (i === 0) ctx.moveTo(x(lon), y(lat)); else ctx.lineTo(x(lon), y(lat));
    });
    ctx.stroke();
  }
}

const buffer = canvas.toBuffer('image/png');
await writeFile('.temp/europe-overview.png', buffer);
await writeFile('public/maps/europe-source.json', JSON.stringify({
  bounds,
  width,
  height,
  projection: 'Plate carrée / WGS84 (Grad = Koordinate)',
  referenceLatitude: 56,
  scaleNote: 'Maßstab nur am Bezugsbreitengrad 56°N metrisch; Verzerrung wächst zum Äquator (1/cos(lat)). Die Spielkamera rechnet Meter lokal über EPSG:25832; die Europastufe nutzt diese Grad-Geometrie als Darstellungsmaßstab.',
  sources: [
    'https://www.naturalearthdata.com/downloads/50m-physical-vectors/ (land, lakes, rivers)'
  ],
  license: 'Public domain',
  note: 'Modern generalized physical geography, not reconstructed historical coastlines, rivers or political boundaries.'
}, null, 2));
console.log(`Built Europe overview ${width}×${height}.`);
// PNG → WebP via sharp (canvas selbst unterstützt kein WebP); Aufruf:
//   node scripts/build-europe.mjs
//   node -e "import('sharp').then(s=>s.default('.temp/europe-overview.png').webp({quality:88}).toFile('public/maps/europe-overview.webp'))"
