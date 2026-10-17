> **Verifizierter Ausgangspunkt 17.10.2026:** `npm ci`, `npm run check`, `npx vitest run`, `npm run build` und `node scripts/verify-release-assets.mjs` gehören zum Release-Gate. GitHub Pages ist nicht aktiviert; `main`-Build bedeutet nicht Live-Deployment. See [Deployment](public-deployment.md) and [Status](../00-meta/status.md).

# Betriebshandbuch – Aufbaukampagne

## Lokal starten
Node 20 und npm installieren; `npm ci` und `npm run dev` ausführen.
`src/main.ts` lädt die standardmäßige HTML/PixiJS-8-Aufbaukampagne; ein Backend ist dafür nicht nötig.

## Vor jeder Freigabe
`npm run check`, `npm run build`, `npx vitest run` ausführen.
GitHub Actions enthält zusätzlich einen Chromium-Smoke-Test mit 1280px und 320×740px Ansichten.
Eine grüne CI belegt keine manuelle Audio-, Barrierefreiheits- oder Langzeitprüfung.

## Savegames
LocalForage legt die Slots `kaiser-ii-save-<slot>` und den Index `kaiser-ii-saves-index` ab.
Größere Savegames können `gzip-json-v1` verwenden (CompressionStream); alte Plain-v2-Saves
bleiben über `decodeSave` lesbar. Vor Datenmigration Browserprofil sichern und
Save/Load mit bestehenden Spielständen prüfen. IndexedDB- und Browserdaten **nicht** beim Update löschen.

## Fehlersuche
Bei Ladefehler: Browserkonsole prüfen; auf denselben Origin / Browser und Slot achten.
Bei Grafikfehler: WebGL prüfen; Spielaktionen sind auch ohne Kartengrafik erreichbar.
Bei Performanceproblem: Tickzeiten, Bürgerzahl und Speicherprofil messen; 100.000+-Bürger-Ziel ist
noch nicht nachgewiesen. SQL-Adapter sind keine Live-Speicherlösung.

## Originalmusik und Filmstart (PR #32)
- `public/music/`: 15 Original-MP3s. Datei- und Titelnamen sind über `src/data/json/music-catalog.json` fest verknüpft.
- `public/covers/`: 15 SVG-Illustrationen, vorläufig bis zu offiziellen Artwork-Dateien.
- `public/video/intro.mp4`: automatisch stumm startendes Intro. `intro-original.mp4` bleibt als Alternative im Repo.
- Nach dem Video versucht „Zeit vergeht“ zu starten. Wird das vom Browser blockiert, kann der Nutzer die Wiedergabe per Knopf beginnen.
- Für Produktion `npm run build`; danach `dist/music`, `dist/covers`, `dist/video` prüfen. Dateien müssen mit korrekten Media-MIME-Typen und ohne ungewollte Redirects/404 ausgeliefert werden.
- Live-Test: Programmstart, Skip, Videoende, Hauptthema, alle 15 Songs, Covergalerie, Downloads, Lautstärke, Pause, Epochenwechsel, mobile Bildschirmbreite.

## Git-Bereinigung
- `main` ist die kanonische Branch. Historische, divergierte PR-Branches nur anhand ihrer Funktions-/Diff-Entstehung bewerten; kein automatischer Massenmerge.
- Code nicht löschen, solange Legacy-Module von anderen Einstiegspunkten oder Tests verwendet werden könnten.
- Medien-Dateien unter `public/music`, `public/video` und `public/covers` sind produktive Assets und dürfen nicht durch allgemeine Cleanup-Skripte entfernt werden.
