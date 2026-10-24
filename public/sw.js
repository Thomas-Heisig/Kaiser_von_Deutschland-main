/* Kaiser von Deutschland – opt-in full offline media cache. */
const VERSION = 'kvde-offline-v9-prehistory-20261024';
const SHELL = VERSION + '-shell';
const MEDIA = VERSION + '-media';
const BASE = new URL('./', self.registration.scope);
const sameOrigin = (url) => url.origin === self.location.origin && url.pathname.startsWith(BASE.pathname);
const inScope = (path) => new URL(path, BASE);
const mediaFile = (url) => /\.(mp3|mp4|webp|svg)$/i.test(url.pathname);
const cacheable = (response) => response.ok && response.type !== 'opaque'
  && !/text\/html/i.test(response.headers.get('content-type') || '');
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll([inScope('./'), inScope('favicon.svg'), inScope('manifest.webmanifest')]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('kvde-offline-') && key !== SHELL && key !== MEDIA) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
async function rangeResponse(request, cached) {
  const value = request.headers.get('range');
  if (!value) return cached;
  const blob = await cached.blob();
  const match = /^bytes=(\d+)-(\d*)$/i.exec(value);
  if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + blob.size } });
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), blob.size - 1) : blob.size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= blob.size)
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + blob.size } });
  const headers = new Headers(cached.headers);
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + blob.size);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(blob.slice(start, end + 1, cached.headers.get('content-type') || ''), { status: 206, headers });
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !sameOrigin(url)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(SHELL)).put(inScope('./'), response.clone());
        return response;
      } catch {
        return (await caches.match(inScope('./'))) ||
          new Response('Offline nicht verfügbar. Bitte Online-Paket zuerst speichern.', { status: 503 });
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(mediaFile(url) ? MEDIA : SHELL);
    const cached = await cache.match(url.href);
    if (cached) return mediaFile(url) && request.headers.has('range')
      ? rangeResponse(request, cached) : cached;
    try {
      const response = await fetch(request);
      // Range responses do not represent a full file and must never poison the cache.
      if (cacheable(response) && response.status === 200 && !request.headers.has('range')) {
        event.waitUntil(cache.put(url.href, response.clone()));
      }
      return response;
    } catch {
      return new Response('Offline: Datei nicht zwischengespeichert.', { status: 503 });
    }
  })());
});
async function checkCache(paths) {
  const keys = await caches.keys();
  const cache = await caches.open(MEDIA);
  let present = 0;
  for (const file of paths) if (await cache.match(inScope(file))) present++;
  return { stored: present, total: paths.length, hasShell: keys.includes(SHELL) };
}
self.addEventListener('message', event => {
  const data = event.data || {};
  const port = event.ports && event.ports[0];
  if (!port) return;
  event.waitUntil((async () => {
    try {
      if (data.type === 'STATUS') {
        const manifest = await (await fetch(inScope('offline-assets.json'))).json();
        port.postMessage({ type: 'STATUS', ...(await checkCache(manifest.files)) });
        return;
      }
      if (data.type !== 'DOWNLOAD') throw new Error('Unbekannte Aktion.');
      const manifestResponse = await fetch(inScope('offline-assets.json'), { cache: 'no-store' });
      if (!manifestResponse.ok) throw new Error('Offline-Dateiliste fehlt.');
      const manifest = await manifestResponse.json();
      const shellResponse = await fetch(inScope('offline-shell.json'), { cache: 'no-store' });
      if (!shellResponse.ok) throw new Error('Liste der App-Dateien fehlt; bitte aktuelle Version deployen.');
      const shellManifest = await shellResponse.json();
      const items = [...new Set(['offline-assets.json','offline-shell.json',...(shellManifest.files || []), ...manifest.files])];
      const cacheMedia = await caches.open(MEDIA);
      const cacheShell = await caches.open(SHELL);
      let downloaded = 0;
      for (const filename of items) {
        const url = inScope(filename);
        if (!sameOrigin(url)) throw new Error('Ungültige Cache-Adresse.');
        const cache = mediaFile(url) ? cacheMedia : cacheShell;
        const existing = await cache.match(url);
        if (!existing) {
          const response = await fetch(url.href, { cache: 'reload' });
          if ((!cacheable(response) && filename !== 'index.html') || response.status !== 200) throw new Error('Datei nicht erreichbar: ' + filename + ' (HTTP ' + response.status + ')');
          const copy = await response.clone().blob();
          if (/\.(mp3|mp4)$/i.test(filename)) {
            if (copy.size < 100000 || /text\/html/i.test(copy.type))
              throw new Error('Beschädigte oder falsche Mediendatei: ' + filename);
            const header = new Uint8Array(await copy.slice(0, 4).arrayBuffer());
            const mp3 = header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33 ||
              (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
            if (/\.mp3$/i.test(filename) && !mp3) throw new Error('Ungültiges MP3-Format: ' + filename);
          }
          await cache.put(url.href, response);
        }
        downloaded++;
        port.postMessage({ type: 'PROGRESS', done: downloaded, total: items.length, file: filename });
      }
      port.postMessage({ type: 'DONE', ...(await checkCache(manifest.files)) });
    } catch (error) {
      port.postMessage({ type: 'ERROR', message: error instanceof Error ? error.message : String(error) });
    }
  })());
});
