// Build an offline, attributed OSM excerpt. No runtime dependency on OSM servers.
// Input: OSM API 0.6 map.json response; includes nodes and ways, not relation areas.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const input = process.argv[2] ?? 'output/map-source/ganderkesee-osm.json';
const raw = readFileSync(input);
const source = JSON.parse(raw);
const nodes = new Map(source.elements.filter(e => e.type === 'node').map(n => [n.id, n]));
const features = [];
for (const node of nodes.values()) if (node.tags?.natural === 'tree') {
  features.push({ id: node.id, kind: 'tree', category: 'tree', name: '', points: [[node.lon,node.lat]], access: '', foot: '' });
}
for (const way of source.elements.filter(e => e.type === 'way')) {
  const tags = way.tags ?? {};
  const kind = tags.building ? 'building' : tags.highway ? 'road'
    : tags.landuse ? 'land' : tags.natural === 'water' ? 'water' : null;
  if (!kind || way.nodes.some(id => !nodes.has(id))) continue;
  if (kind === 'road' && ['motorway', 'motorway_link', 'construction', 'proposed'].includes(tags.highway)) continue;
  const points = way.nodes.map(id => { const n = nodes.get(id); return [n.lon, n.lat]; });
  if (kind !== 'road' && way.nodes[0] !== way.nodes.at(-1)) continue;
  features.push({ id: way.id, kind, category: tags.building ?? tags.highway ?? tags.landuse ?? tags.natural,
    name: tags.name ?? '', points, nodes: kind === 'road' ? way.nodes : undefined,
    access: tags.access ?? '', foot: tags.foot ?? '' });
}
const result = {
  version: 1, crs: 'EPSG:4326', bounds: [8.5405, 53.0305, 8.5515, 53.0365],
  source: 'https://api.openstreetmap.org/api/0.6/map.json?bbox=8.5405,53.0305,8.5515,53.0365',
  attribution: '© OpenStreetMap contributors · ODbL 1.0',
  licenseUrl: 'https://www.openstreetmap.org/copyright',
  retrieved: '2026-11-01', sourceSha256: createHash('sha256').update(raw).digest('hex'),
  note: 'Heutige Wege und Gebäudegrundrisse als räumliche Referenz; keine historische Rekonstruktion. Spielnutzungen und historische Gebäudegrößen sind modelliert. Nur vollständige Ways, keine Multipolygon-Relationen.',
  features,
};
writeFileSync('public/maps/ganderkesee-village.json', JSON.stringify(result));
console.log(Object.fromEntries(['building','road','land','water'].map(k => [k, features.filter(f => f.kind === k).length])));
