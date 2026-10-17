/**
 * Dependency-free, reproducible ZIP export of the built static game.
 * Designed for download from a trusted LAN over plain HTTP; a ZIP does not
 * bypass browser secure-context requirements for Service Workers or WebGPU.
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, relative, dirname, sep } from 'node:path';

const dist = join(process.cwd(), 'dist');
const output = join(dist, 'downloads', 'kaiser-von-deutschland-offline.zip');
const table = Uint32Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  return crc >>> 0;
});
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
async function collect(dir, entries) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    // Never put an older archive inside its own replacement.
    if (dir === dist && entry.name === 'downloads') continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) await collect(absolute, entries);
    else if (entry.isFile()) {
      const filename = relative(dist, absolute).split(sep).join('/');
      entries.push({ filename, contents: await readFile(absolute) });
    }
  }
}
const instructions = `KAISER VON DEUTSCHLAND - OFFLINE-PAKET

Dieses ZIP kann aus einem privaten Heimnetz auch per HTTP heruntergeladen werden.
1. Archiv komplett entpacken (die Verzeichnisstruktur beibehalten).
2. Windows: START_WINDOWS.cmd im entpackten Verzeichnis ausführen.
   Python 3 (py -3) muss installiert sein. Andere Systeme:
   python3 -m http.server 8765 --bind 127.0.0.1
3. Im Browser http://localhost:8765/ öffnen.

Das Spiel läuft dann OHNE Internet, über den lokalen HTTP-Server auf diesem PC.
Lokale Spielstände bleiben an Browser und Herkunftsadresse gebunden.
Ein ZIP allein lässt sich auf iPad/iPhone NICHT wie eine PWA installieren.
Auf HTTP-Adressen anderer Heimnetzgeräte sind Service Worker / PWA-
Installation und viele WebGPU-Funktionen aus Sicherheitsgründen deaktiviert.
Diese Browserbeschränkungen kann die Anwendung nicht umgehen.
Für eine offline installierbare Website auf iPad/Android ist HTTPS nötig.

Keine Portweiterleitung ins Internet, nur in einem vertrauenswürdigen Netz nutzen.
`;
const windows = '@echo off\r\ncd /d "%~dp0"\r\necho Spiel unter http://localhost:8765/ im Browser oeffnen.\r\necho Fenster fuer die Dauer des Spielens offen lassen.\r\npy -3 -m http.server 8765 --bind 127.0.0.1\r\npause\r\n';
const entries = [];
await collect(dist, entries);
if (!entries.some(e => e.filename === 'index.html')) throw new Error('dist/index.html fehlt, Build zuerst ausführen.');
entries.push({ filename: 'OFFLINE-LESEN.txt', contents: Buffer.from(instructions, 'utf8') });
entries.push({ filename: 'START_WINDOWS.cmd', contents: Buffer.from(windows, 'utf8') });
entries.sort((a, b) => a.filename.localeCompare(b, 'en'));
if (entries.length > 65535) throw new Error('Zu viele Dateien für ZIP32.');

const local = [], central = [];
let offset = 0, centralSize = 0;
for (const { filename, contents } of entries) {
  const name = Buffer.from(filename, 'utf8');
  const checksum = crc32(contents);
  if (contents.length > 0xffffffff || offset > 0xffffffff) throw new Error('ZIP32-Grenze überschritten.');
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6); // UTF-8 filenames
  header.writeUInt16LE(0, 8);      // STORE; audio/video is compressed already
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(contents.length, 18);
  header.writeUInt32LE(contents.length, 22);
  header.writeUInt16LE(name.length, 26);
  local.push(header, name, contents);
  const dirEntry = Buffer.alloc(46);
  dirEntry.writeUInt32LE(0x02014b50, 0);
  dirEntry.writeUInt16LE(20, 4);
  dirEntry.writeUInt16LE(20, 6);
  dirEntry.writeUInt16LE(0x0800, 8);
  dirEntry.writeUInt32LE(checksum, 16);
  dirEntry.writeUInt32LE(contents.length, 20);
  dirEntry.writeUInt32LE(contents.length, 24);
  dirEntry.writeUInt16LE(name.length, 28);
  dirEntry.writeUInt32LE(offset, 42);
  central.push(dirEntry, name);
  offset += header.length + name.length + contents.length;
  centralSize += dirEntry.length + name.length;
}
if (offset + centralSize > 0xffffffff) throw new Error('ZIP32-Verzeichnis zu groß.');
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.concat([...local, ...central, end]));
console.log('Offline-ZIP erzeugt: ' + output + ' (' + entries.length + ' Dateien)');
