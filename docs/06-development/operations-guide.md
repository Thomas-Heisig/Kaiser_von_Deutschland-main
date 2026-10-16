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
