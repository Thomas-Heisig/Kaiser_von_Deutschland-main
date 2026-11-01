PIXIJS-ASSET-PAKET – 01.11.2026

Aus den vorhandenen Repository-Assets zusammengestellt, keine neu gezeichneten Grafiken.

INHALT
- 24 Gebaeude-/Bezirkskompositionen auf 6 WebP-Atlanten (je 384 x 384).
- PixiJS-Spritesheet-JSONs mit benannten Frames (je 192 x 192).
- 4 PNG-Atlanten: Fantasy, Urban, Werkstatt und Materialmuster.
- Ein einzelnes Haus-PNG und vorhandene Kartenbilder samt Quelldaten.
- load-assets.ts als Ladebeispiel fuer PixiJS 8.
- manifest.json mit Dateigroessen und SHA-256-Pruefsummen.

VERWENDUNG
assets/ und bei Bedarf maps/ ins public-Verzeichnis kopieren.
load-assets.ts ins eigene TypeScript-Projekt uebernehmen; pixi.js muss installiert sein.
Die JSON-Spritesheets per Assets.load laden; Beispiel siehe load-assets.ts.
Die PNG-Atlanten sind bestehende Bauteil-/Materialsammlungen, keine Animationen.
Die Kartenbilder sind Uebersichten und keine hochaufloesenden Nahbereichstiles.
Es sind keine animierten Menschen/Tiere oder originalen GLB-Modelle enthalten.

LIZENZEN / HERKUNFT (aus Repository-Metadaten)
Kenney-Grafiken: CC0-1.0. Details: docs/ASSETS.md und
assets/kenney/buildings/provenance.json.
https://creativecommons.org/publicdomain/zero/1.0/
Ganderkesee-Gelaende: CC-BY-4.0, © GeoBasis-DE/LGLN 2026, Daten geaendert.
Gewaesser: dl-de/by-2-0, Geodaten LGLN © 2023, bearbeitet durch das
Nds. Umweltministerium; Auswahl/Zuschnitt fuer das Spiel.
Vollstaendige Quellen und Lizenzlinks: maps/ganderkesee-source.json.
Mitteleuropa: Natural Earth, Public Domain; maps/landscape-source.json.
Code: MIT, siehe LICENSE-code.txt. Grafik- und Geodatenlizenzen gelten separat.
