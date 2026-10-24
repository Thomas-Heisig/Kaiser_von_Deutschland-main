// Offline asset builder. npm install --prefix .browser-tools --no-save sharp
// Input: official NE2_50M_SR_W TIFF and Natural Earth rivers GeoJSON.
import sharp from '../.browser-tools/node_modules/sharp/lib/index.js';
import { readFile, writeFile } from 'node:fs/promises';
const source = process.argv[2] ?? '.temp/ne2/NE2_50M_SR_W/NE2_50M_SR_W.tif';
const riversFile = process.argv[3] ?? '.temp/rivers.geojson';
const meta = await sharp(source, { limitInputPixels: false }).metadata();
const bounds = { west: 3, east: 19, south: 45, north: 56 };
const width = 1920, height = 1320;
const x = lon => (lon - bounds.west) / 16 * width;
const y = lat => (bounds.north - lat) / 11 * height;
const data = JSON.parse(await readFile(riversFile, 'utf8'));
const paths = [];
const names = new Set();
for (const f of data.features) {
  const lines = f.geometry?.type === 'LineString' ? [f.geometry.coordinates] : f.geometry?.type === 'MultiLineString' ? f.geometry.coordinates : [];
  for (const line of lines) {
    if (!line.some(([lon,lat]) => lon >= 3 && lon <= 19 && lat >= 45 && lat <= 56)) continue;
    const d = line.map(([lon,lat], i) => `${i ? 'L' : 'M'}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join(' ');
    const rank = Number(f.properties.scalerank ?? 6);
    paths.push(`<path d="${d}" stroke-width="${rank < 5 ? 3 : 1.6}"/>`);
    names.add(f.properties.name_de ?? f.properties.name);
  }
}
const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#397e92" stroke-linecap="round" stroke-linejoin="round" opacity=".92">${paths.join('')}</g></svg>`;
await sharp(source, { limitInputPixels: false }).extract({ left: Math.round(183 / 360 * meta.width), top: Math.round(34 / 180 * meta.height), width: Math.round(16 / 360 * meta.width), height: Math.round(11 / 180 * meta.height) }).resize(width,height).modulate({ saturation: 1.15, brightness: 1.07 }).composite([{ input: Buffer.from(svg) }]).webp({ quality: 89 }).toFile('public/maps/landscape-central-europe.webp');
await writeFile('public/maps/landscape-source.json', JSON.stringify({ bounds, width, height, projection: 'Plate carree / WGS84', sources: ['https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/', 'https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/'], license: 'Public domain', rivers: [...names].filter(Boolean).sort(), note: 'Modern generalized physical geography, not reconstructed historical river courses or political boundaries.' }, null, 2));
console.log(`Built landscape with ${paths.length} river segments.`);
